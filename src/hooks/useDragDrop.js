import { useState } from "react";

export const useDragDrop = (tasks, setTasks) => {
  const [draggedTask, setDraggedTask] = useState(null);
  const [sourceColumn, setSourceColumn] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [isMoving, setIsMoving] = useState(false);

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

  const handleDrop = async (e, targetColumnKey) => {
    e.preventDefault();
    if (!draggedTask || !sourceColumn) return;

    const targetIndex =
      dropIndicator?.position ?? tasks[targetColumnKey].length;

    // Update local state optimistically
    setTasks((prevTasks) => {
      const newTasks = { ...prevTasks };

      // Remove from source column
      const sourceArray = newTasks[sourceColumn];
      const taskIndex = sourceArray.findIndex(
        (task) => task._id === draggedTask._id
      );

      if (taskIndex === -1) return prevTasks; // Task not found, return unchanged

      sourceArray.splice(taskIndex, 1);

      // Adjust target index if dropping in the same column
      let adjustedIndex = targetIndex;
      if (sourceColumn === targetColumnKey && taskIndex < targetIndex) {
        adjustedIndex = targetIndex - 1;
      }

      // Insert at target position
      newTasks[targetColumnKey].splice(adjustedIndex, 0, draggedTask);

      return newTasks;
    });

    // Update via API
    setIsMoving(true);
    try {
      const response = await fetch("/api/task", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: draggedTask._id,
          title: draggedTask.title,
          description: draggedTask.description,
          column: targetColumnKey,
          position: targetIndex,
        }),
      });

      if (!response.ok) {
        console.error("Failed to update task position");
        // Optionally revert on error by fetching fresh data
      }
    } catch (err) {
      console.error("Error updating task position:", err);
      // Optionally revert on error by fetching fresh data
    } finally {
      setIsMoving(false);
    }

    setDraggedTask(null);
    setSourceColumn(null);
    setDropIndicator(null);
  };

  return {
    draggedTask,
    sourceColumn,
    dropIndicator,
    isMoving,
    handleDragStart,
    handleDragOver,
    handleTaskDragOver,
    handleTaskDragLeave,
    handleColumnDragLeave,
    handleDrop,
  };
};
