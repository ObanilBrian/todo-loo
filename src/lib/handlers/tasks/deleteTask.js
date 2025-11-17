import Task from "@/lib/models/Task";

export async function deleteTask(userId, taskId) {
  try {
    // Validation
    if (!taskId) {
      return {
        status: 400,
        data: { message: "Task ID is required" },
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
        data: { message: "Unauthorized to delete this task" },
      };
    }

    await Task.findByIdAndDelete(taskId);

    return {
      status: 200,
      data: { message: "Task deleted successfully" },
    };
  } catch (error) {
    console.error("Error deleting task:", error);
    return {
      status: 500,
      data: { message: "Internal server error" },
    };
  }
}
