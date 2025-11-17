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

    // First, get the tasks in target column without the dragged task
    // AND normalize their positions in case they're in Decimal128 format
    const tasksInTargetColumn = tasks[targetColumnKey]
      .filter((task) => task._id !== draggedTask._id)
      .map((task) => normalizeTaskPosition(task));

    // Use dropIndicator position if available, otherwise append to end
    const targetPosition =
      dropIndicator?.position ?? tasksInTargetColumn.length;

    // Calculate intelligent position like updateTask does
    let newPosition = 0;

    if (targetPosition === 0) {
      // Inserting at the beginning
      if (tasksInTargetColumn.length === 0) {
        newPosition = 0;
      } else {
        // Position should be less than the first task
        const firstTaskPos = tasksInTargetColumn[0].position;
        newPosition = firstTaskPos / 2;
      }
    } else if (targetPosition >= tasksInTargetColumn.length) {
      // Inserting at the end
      if (tasksInTargetColumn.length === 0) {
        newPosition = 0;
      } else {
        const lastTaskPos =
          tasksInTargetColumn[tasksInTargetColumn.length - 1].position;
        newPosition = lastTaskPos + 10;
      }
    } else {
      // Inserting between two tasks
      const beforeTask = tasksInTargetColumn[targetPosition - 1];
      const afterTask = tasksInTargetColumn[targetPosition];
      newPosition = (beforeTask.position + afterTask.position) / 2;
    }

    // Clear drop indicator immediately
    setDropIndicator(null);

    // Update local state optimistically
    setTasks((prevTasks) => {
      const newTasks = { ...prevTasks };

      // Remove from source column
      const sourceArray = newTasks[sourceColumn];
      const taskIndex = sourceArray.findIndex(
        (task) => task._id === draggedTask._id
      );

      if (taskIndex === -1) {
        setDraggedTask(null);
        setSourceColumn(null);
        return prevTasks;
      }

      sourceArray.splice(taskIndex, 1);

      // Adjust target position if dropping in the same column
      let adjustedPosition = targetPosition;
      if (sourceColumn === targetColumnKey && taskIndex < targetPosition) {
        adjustedPosition = targetPosition - 1;
      }

      // Insert at target position
      newTasks[targetColumnKey].splice(adjustedPosition, 0, draggedTask);

      return newTasks;
    });

    // Add to update queue with calculated position
    updateQueueRef.current[draggedTask._id] = {
      taskId: draggedTask._id,
      title: draggedTask.title,
      description: draggedTask.description,
      column: targetColumnKey,
      position: newPosition,
    };

    // Update pending count state
    setPendingUpdates(Object.keys(updateQueueRef.current).length);

    // Schedule batch update
    scheduleBatchUpdate();

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
