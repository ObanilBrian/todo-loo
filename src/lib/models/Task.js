import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a title"],
      minlength: [1, "Title must be at least 1 character"],
      maxlength: [255, "Title cannot exceed 255 characters"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      trim: true,
    },
    column: {
      type: String,
      enum: ["backlog", "todo", "inProgress", "done"],
      default: "backlog",
      required: true,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
TaskSchema.index({ userId: 1, column: 1, position: 1 });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
