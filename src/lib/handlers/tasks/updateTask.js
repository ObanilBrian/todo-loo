import Task from "@/lib/models/Task";

export async function updateTask(
  userId,
  { taskId, title, description, column, position }
) {
  try {
    // Validation
    if (!taskId) {
      return {
        status: 400,
        data: { message: "Task ID is required" },
      };
    }

    if (!title || !title.trim()) {
      return {
        status: 400,
        data: { message: "Title is required" },
      };
    }

    // Find task and verify ownership
    const task = await Task.findById(taskId);

    if (!task) {
      return {
        status: 404,
        data: { message: "Task not found" },
      };
    }

    if (task.userId.toString() !== userId) {
      return {
        status: 403,
        data: { message: "Unauthorized to update this task" },
      };
    }

    // Update task
    task.title = title.trim();
    task.description = description?.trim() || "";

    // If column is being updated, calculate new position intelligently
    if (column) {
      task.column = column;

      // Only calculate intelligent position if position index is provided
      if (position !== undefined) {
        // Get all tasks in the target column, sorted by position
        const tasksInColumn = await Task.find({
          userId,
          column,
          _id: { $ne: taskId }, // Exclude current task
        }).sort({ position: 1 });

        let newPosition;

        if (position === 0) {
          // Inserting at the beginning
          if (tasksInColumn.length === 0) {
            newPosition = 0;
          } else {
            // Position should be less than the first task
            const firstTaskPos = tasksInColumn[0].position;
            newPosition = firstTaskPos / 2;
          }
        } else if (position >= tasksInColumn.length) {
          // Inserting at the end
          if (tasksInColumn.length === 0) {
            newPosition = 0;
          } else {
            const lastTaskPos =
              tasksInColumn[tasksInColumn.length - 1].position;
            newPosition = lastTaskPos + 10;
          }
        } else {
          // Inserting between two tasks
          const beforeTask = tasksInColumn[position - 1];
          const afterTask = tasksInColumn[position];

          newPosition = (beforeTask.position + afterTask.position) / 2;
        }

        task.position = newPosition;
      }
    } else if (position !== undefined) {
      // Update position within the same column
      const tasksInColumn = await Task.find({
        userId,
        column: task.column,
        _id: { $ne: taskId },
      }).sort({ position: 1 });

      let newPosition;

      if (position === 0) {
        if (tasksInColumn.length === 0) {
          newPosition = 0;
        } else {
          const firstTaskPos = tasksInColumn[0].position;
          newPosition = firstTaskPos / 2;
        }
      } else if (position >= tasksInColumn.length) {
        if (tasksInColumn.length === 0) {
          newPosition = 0;
        } else {
          const lastTaskPos = tasksInColumn[tasksInColumn.length - 1].position;
          newPosition = lastTaskPos + 10;
        }
      } else {
        const beforeTask = tasksInColumn[position - 1];
        const afterTask = tasksInColumn[position];

        newPosition = (beforeTask.position + afterTask.position) / 2;
      }

      task.position = newPosition;
    }

    await task.save();

    return {
      status: 200,
      data: {
        message: "Task updated successfully",
        task,
      },
    };
  } catch (error) {
    console.error("Error updating task:", error);
    return {
      status: 500,
      data: { message: "Internal server error" },
    };
  }
}
