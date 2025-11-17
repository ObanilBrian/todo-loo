import Task from "@/lib/models/Task";

export async function createTask(userId, { title, description, column }) {
  try {
    // Validation
    if (!title || !title.trim()) {
      return {
        status: 400,
        data: { message: "Title is required" },
      };
    }

    // Get the current max position for this column
    const lastTask = await Task.findOne({ userId, column }).sort({
      position: -1,
    });
    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await Task.create({
      userId,
      title: title.trim(),
      description: description?.trim() || "",
      column: column || "backlog",
      position,
    });

    return {
      status: 201,
      data: {
        message: "Task created successfully",
        task,
      },
    };
  } catch (error) {
    console.error("Error creating task:", error);
    return {
      status: 500,
      data: { message: "Internal server error" },
    };
  }
}
