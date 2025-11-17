import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { batchUpdateTasks } from "@/lib/handlers/tasks";

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

    // Only accept PATCH requests for batch updates
    if (req.method === "PATCH") {
      const result = await batchUpdateTasks(userId, req.body);
      return res.status(result.status).json(result.data);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Batch task update API error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
