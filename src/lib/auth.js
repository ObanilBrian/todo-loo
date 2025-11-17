import { verifyToken } from "./jwt";

export function withAuth(handler) {
  return async (req, res) => {
    try {
      // Get token from cookies or Authorization header
      let token = req.cookies?.token || null;

      if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          token = parts[1];
        }
      }

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      // Verify token
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Attach user ID to request
      req.userId = decoded.userId;

      return handler(req, res);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ message: "Authentication error" });
    }
  };
}
