import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { updateTask, deleteTask } from "@/lib/handlers/tasks";

export default async function handler(req, res) {
  try {
    await connectDB();

    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = decoded.userId;
    const { taskId } = req.query;

    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    let result;

    if (req.method === "PUT") {
      result = await updateTask(userId, { ...req.body, taskId });
    } else if (req.method === "DELETE") {
      result = await deleteTask(userId, taskId);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }

    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error("Task API error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
