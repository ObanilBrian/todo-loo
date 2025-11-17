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

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Create new user
    const user = new User({
      username,
      password,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.setHeader(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}`
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
}
