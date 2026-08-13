import { useState, useRef, useCallback, useEffect } from "react";

const BATCH_DELAY = 5000; // 5 seconds

// Helper function to normalize a task's position
function normalizeTaskPosition(task) {
  if (!task) return task;
  return {
    ...task,
    position:
      task.position &&
      typeof task.position === "object" &&
      "$numberDecimal" in task.position
        ? parseFloat(task.position.$numberDecimal)
        : task.position,
  };
}

export const useBatchDragDrop = (tasks, setTasks) => {
  const [draggedTask, setDraggedTask] = useState(null);
  const [sourceColumn, setSourceColumn] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState(0);

  // Queue to store pending updates
  const updateQueueRef = useRef({});
  const timeoutRef = useRef(null);
  const isSendingRef = useRef(false);

  const handleDragStart = (e, task, columnKey) => {
    setDraggedTask(task);
    setSourceColumn(columnKey);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleTaskDragOver = (e, targetTaskId, targetColumnKey, position) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropIndicator({
      taskId: targetTaskId,
      columnKey: targetColumnKey,
      position,
    });
  };

  const handleTaskDragLeave = (e, cardStyles) => {
    if (e.target.classList.contains(cardStyles.taskCard)) {
      setDropIndicator(null);
    }
  };

  const handleColumnDragLeave = () => {
    setDropIndicator(null);
  };

  // Function to send batched updates to the server
  const flushBatchUpdates = useCallback(async () => {
    // Prevent duplicate sends
    if (isSendingRef.current) {
      return;
    }

    // Get all pending updates
    const updates = Object.values(updateQueueRef.current);

    if (updates.length === 0) {
      return;
    }

    isSendingRef.current = true;
    setIsSending(true);

    try {
      const response = await fetch("/api/task/batch", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updates: updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to batch update tasks:", errorData);
      } else {
        const result = await response.json();
        console.log(
          `Batch update: ${result.successCount} succeeded, ${result.failureCount} failed`
        );
      }
    } catch (err) {
      console.error("Error sending batch updates:", err);
    } finally {
      // Clear the queue after sending
      updateQueueRef.current = {};
      setPendingUpdates(0);
      setIsSending(false);
      isSendingRef.current = false;
    }
  }, []);

  // Function to schedule batch update - no dependencies needed
  const scheduleBatchUpdate = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule a new batch update for 5 seconds from now
    timeoutRef.current = setTimeout(() => {
      // Call the flush directly without dependency chain
      const updates = Object.values(updateQueueRef.current);
      if (updates.length === 0) {
        return;
      }

      // Prevent duplicate sends
      if (isSendingRef.current) {
        return;
      }

      isSendingRef.current = true;
      setIsSending(true);

      fetch("/api/task/batch", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updates: updates,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Failed to batch update tasks:", errorData);
          } else {
            const result = await response.json();
            console.log(
              `Batch update: ${result.successCount} succeeded, ${result.failureCount} failed`
            );
          }
        })
        .catch((err) => {
          console.error("Error sending batch updates:", err);
        })
        .finally(() => {
          // Clear the queue after sending
          updateQueueRef.current = {};
          setPendingUpdates(0);
          setIsSending(false);
          isSendingRef.current = false;
        });
    }, BATCH_DELAY);
  }, []);

  const handleDrop = (e, targetColumnKey) => {
    e.preventDefault();
    if (!draggedTask || !sourceColumn) return;

    // Get the tasks in target column, accounting for pending updates
    let tasksInTargetColumn = tasks[targetColumnKey]
      .filter((task) => task._id !== draggedTask._id)
      .map((task) => normalizeTaskPosition(task));

    // Apply pending position updates from the queue to get the true current positions
    const pendingUpdatesForColumn = Object.values(
      updateQueueRef.current
    ).filter((update) => update.column === targetColumnKey);

    // Create a map of taskId -> pending position
    const pendingPositions = {};
    pendingUpdatesForColumn.forEach((update) => {
      pendingPositions[update.taskId] = update.position;
    });

    // Update positions of tasks that have pending updates
    tasksInTargetColumn = tasksInTargetColumn.map((task) => ({
      ...task,
      position: pendingPositions[task._id] ?? task.position,
    }));

    // Re-sort by position to get correct visual order
    tasksInTargetColumn.sort((a, b) => a.position - b.position);

    // Use dropIndicator position if available, otherwise append to end
    const targetPosition =
      dropIndicator?.position ?? tasksInTargetColumn.length;

    // Insert the dragged task at the target position
    tasksInTargetColumn.splice(targetPosition, 0, draggedTask);

    // Integer re-indexing approach: re-index all tasks in the column
    // to guarantee consistent integer gaps and prevent precision loss
    tasksInTargetColumn.forEach((task, index) => {
      const newPos = (index + 1) * 1024;
      
      // Update local task position
      task.position = newPos;
      
      // Queue update for any task whose position changed
      updateQueueRef.current[task._id] = {
        taskId: task._id,
        title: task.title,
        description: task.description,
        column: targetColumnKey,
        position: newPos,
      };
    });

    // Clear drop indicator immediately
    setDropIndicator(null);

    // Update local state optimistically
    setTasks((prevTasks) => {
      const newTasks = { ...prevTasks };

      // Remove from source column if it's a different column
      if (sourceColumn !== targetColumnKey) {
        const sourceArray = [...newTasks[sourceColumn]];
        const taskIndex = sourceArray.findIndex(
          (task) => task._id === draggedTask._id
        );
        if (taskIndex !== -1) {
          sourceArray.splice(taskIndex, 1);
          newTasks[sourceColumn] = sourceArray;
        }
      }

      // Assign the correctly re-indexed target column
      newTasks[targetColumnKey] = tasksInTargetColumn;

      return newTasks;
    });


    // Update pending count state
    setPendingUpdates(Object.keys(updateQueueRef.current).length);

    // Schedule batch update, or flush immediately if cross-column or 'done'
    if (sourceColumn !== targetColumnKey || targetColumnKey === "done") {
      setTimeout(flushBatchUpdates, 0);
    } else {
      scheduleBatchUpdate();
    }

    setDraggedTask(null);
    setSourceColumn(null);
    setIsMoving(true);
  };

  // Cleanup function to flush updates when component unmounts
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Flush remaining updates
    const updates = Object.values(updateQueueRef.current);
    if (updates.length > 0 && !isSendingRef.current) {
      isSendingRef.current = true;

      fetch("/api/task/batch", {
        method: "PATCH",
        credentials: "include",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updates: updates,
        }),
      })
        .catch((err) => {
          console.error("Error flushing updates on cleanup:", err);
        })
        .finally(() => {
          updateQueueRef.current = {};
          setPendingUpdates(0);
          isSendingRef.current = false;
        });
    }
  }, []);

  return {
    draggedTask,
    sourceColumn,
    dropIndicator,
    isMoving,
    isSending,
    pendingUpdates,
    handleDragStart,
    handleDragOver,
    handleTaskDragOver,
    handleTaskDragLeave,
    handleColumnDragLeave,
    handleDrop,
    flushBatchUpdates,
    cleanup,
  };
};
