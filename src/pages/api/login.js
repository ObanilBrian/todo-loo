import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { generateToken } from "@/lib/jwt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Please provide username and password" });
    }

    // Find user and select password field
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.setHeader(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}`
    );

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
}
