import Task from "@/lib/models/Task";

export async function getTasks(userId) {
  try {
    const tasks = await Task.find({ userId }).sort({
      column: 1,
      position: 1,
    });

    return {
      status: 200,
      data: tasks,
    };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return {
      status: 500,
      data: { message: "Internal server error" },
    };
  }
}
