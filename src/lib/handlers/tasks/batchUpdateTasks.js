import Task from "@/lib/models/Task";

export async function batchUpdateTasks(userId, { updates = [] }) {
  try {
    // Validation
    if (!Array.isArray(updates) || updates.length === 0) {
      return {
        status: 400,
        data: { message: "Updates must be a non-empty array" },
      };
    }

    // Validate each update
    const validationErrors = [];
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      if (!update.taskId) {
        validationErrors.push(`Update ${i}: taskId is required`);
      }
      if (
        update.column &&
        !["backlog", "todo", "inProgress", "done"].includes(update.column)
      ) {
        validationErrors.push(`Update ${i}: invalid column name`);
      }
    }

    if (validationErrors.length > 0) {
      return {
        status: 400,
        data: { message: "Validation failed", errors: validationErrors },
      };
    }

    // Fetch all affected tasks and verify ownership
    const taskIds = updates.map((u) => u.taskId);
    const tasks = await Task.find({ _id: { $in: taskIds }, userId });

    if (tasks.length !== updates.length) {
      return {
        status: 404,
        data: { message: "Some tasks not found or unauthorized" },
      };
    }

    // Create a map for quick lookup
    const taskMap = {};
    tasks.forEach((task) => {
      taskMap[task._id.toString()] = task;
    });

    // Apply updates
    const updatedTasks = [];
    const failedUpdates = [];

    for (const update of updates) {
      try {
        const task = taskMap[update.taskId];
        if (!task) {
          failedUpdates.push({
            taskId: update.taskId,
            error: "Task not found",
          });
          continue;
        }

        // Check ownership again for security
        if (task.userId.toString() !== userId) {
          failedUpdates.push({
            taskId: update.taskId,
            error: "Unauthorized",
          });
          continue;
        }

        // Update basic fields
        if (update.title !== undefined && update.title.trim()) {
          task.title = update.title.trim();
        }

        if (update.description !== undefined) {
          task.description = update.description.trim() || "";
        }

        // Update column and position
        if (update.column !== undefined) {
          task.column = update.column;
        }

        if (update.position !== undefined) {
          task.position = update.position;
        }

        // Save the updated task
        await task.save();
        updatedTasks.push(task);
      } catch (err) {
        failedUpdates.push({
          taskId: update.taskId,
          error: err.message,
        });
      }
    }

    return {
      status: 200,
      data: {
        message: "Batch update completed",
        updated: updatedTasks,
        failed: failedUpdates,
        successCount: updatedTasks.length,
        failureCount: failedUpdates.length,
      },
    };
  } catch (error) {
    console.error("Error batch updating tasks:", error);
    return {
      status: 500,
      data: { message: "Internal server error" },
    };
  }
}
