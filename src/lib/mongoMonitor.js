/**
 * MongoDB Connection Monitoring Utility
 *
 * Use this to monitor active connections and connection pool stats
 */

import { connectDB } from "./mongodb.js";

export async function getConnectionStats() {
  try {
    const conn = await connectDB();

    console.log(">>>", conn);

    const connArray = conn.connections.map((c) => {
      // Mongoose connection object has different properties
      // The main thing we care about is the readyState
      const stats = {
        timestamp: new Date().toISOString(),
        connected: c._readyState === 1,
        readyState: c._readyState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
        readyStateDescription: {
          0: "Disconnected",
          1: "Connected",
          2: "Connecting",
          3: "Disconnecting",
        }[conn.readyState],
        database: c.name || "unknown",
        host: c.host || "unknown",
      };
      // Try to get more detailed info if available
      if (conn._connectionString) {
        stats.connectionUrl = conn._connectionString.replace(
          /password[=:][^@]*/,
          "password=***"
        );
      }

      // Try to access the MongoDB client for connection pool info
      try {
        const client = conn.getClient?.();
        if (client && client.topology) {
          stats.poolInfo = {
            isConnected: client.topology.isConnected?.() || false,
            poolSize: client.topology.s?.pool?.totalConnectionCount || 0,
          };
        }
      } catch (err) {
        // Connection pool info not available
      }

      return stats;
    });

    return connArray;
  } catch (error) {
    console.error("Error getting connection stats:", error);
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function logConnectionStats() {
  const stats = await getConnectionStats();
  console.log("📊 MongoDB Connection Stats:");
  console.log(JSON.stringify(stats, null, 2));
  return stats;
}

/**
 * Simple health check - just verify connection is active
 */
export async function checkDatabaseHealth() {
  try {
    const conn = await connectDB();
    return {
      healthy: conn.readyState === 1,
      readyState: conn.readyState,
      message:
        conn.readyState === 1
          ? "✅ Database connected"
          : `⚠️ Database state: ${conn.readyState}`,
    };
  } catch (error) {
    return {
      healthy: false,
      message: "❌ Database connection failed",
      error: error.message,
    };
  }
}
