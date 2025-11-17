import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/handlers/tasks";

export default async function handler(req, res) {
  try {
    await connectDB();

    // Extract token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify token and get user ID
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = decoded.userId;

    // Route to appropriate handler based on method
    let result;

    if (req.method === "GET") {
      result = await getTasks(userId, req.query);
    } else if (req.method === "POST") {
      result = await createTask(userId, req.body);
    } else if (req.method === "PUT") {
      result = await updateTask(userId, req.body);
    } else if (req.method === "DELETE") {
      result = await deleteTask(userId, req.query.taskId);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }

    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error("Task API error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
