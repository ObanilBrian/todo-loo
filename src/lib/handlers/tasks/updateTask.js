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
    if (column) task.column = column;
    if (position !== undefined) task.position = position;

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
