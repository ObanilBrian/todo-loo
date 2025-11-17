/**
 * API endpoint to monitor MongoDB connection status
 * Endpoint: GET /api/debug/db-stats
 *
 * Returns connection pool statistics and server status
 * Only available in development mode for security
 */

import { getConnectionStats } from "@/lib/mongoMonitor";

export default async function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Not available in production" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const stats = await getConnectionStats();
    return res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    console.error("Error getting DB stats:", error);
    return res.status(500).json({
      status: "error",
      error: error.message,
      details: error.toString(),
    });
  }
}
