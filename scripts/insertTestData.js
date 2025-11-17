#!/usr/bin/env node

/**
 * MongoDB Test Data Generator
 * Inserts 1 million test tasks for a given user ID
 *
 * Usage:
 *   node scripts/insertTestData.js <userId> [batchSize]
 *
 * Example:
 *   node scripts/insertTestData.js 507f1f77bcf86cd799439011
 *   node scripts/insertTestData.js 507f1f77bcf86cd799439011 5000
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// Task Schema (matching the app schema)
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
      required: true,
      minlength: 1,
      maxlength: 255,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: 2000,
      trim: true,
    },
    column: {
      type: String,
      enum: ["backlog", "todo", "inProgress", "done"],
      default: "backlog",
      required: true,
    },
    position: {
      type: mongoose.Schema.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString("0"),
    },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ userId: 1, column: 1, position: 1 });

const Task = mongoose.model("Task", TaskSchema);

// Sample data for random generation
const sampleTitles = [
  "Fix login bug",
  "Update documentation",
  "Refactor database query",
  "Add unit tests",
  "Design new UI",
  "Optimize performance",
  "Review pull request",
  "Deploy to production",
  "Write API documentation",
  "Create user guide",
  "Fix responsive design",
  "Implement caching",
  "Setup CI/CD pipeline",
  "Audit security",
  "Plan sprint",
  "Code review",
  "Database migration",
  "API rate limiting",
  "Error handling",
  "Load testing",
];

const sampleDescriptions = [
  "Need to address edge cases in the authentication flow",
  "Update with latest best practices and examples",
  "Consolidate multiple queries into single optimized query",
  "Improve test coverage to 80%+",
  "Create wireframes and mockups",
  "Reduce page load time by 50%",
  "Check code quality and suggest improvements",
  "Release version 2.0 to production",
  "Document all endpoints with examples",
  "Help new team members get started",
  "Ensure mobile responsiveness",
  "Implement Redis caching layer",
  "Setup GitHub Actions workflow",
  "Penetration testing and vulnerability fixes",
  "Organize tasks and set priorities",
  "Suggest refactoring improvements",
  "Update MongoDB schema",
  "Implement token throttling",
  "Add try-catch blocks and logging",
  "Simulate high traffic scenarios",
  "", // Some tasks without descriptions
];

const columns = ["backlog", "todo", "inProgress", "done"];

/**
 * Generate random task data
 */
function generateRandomTask(userId, index) {
  const title = `${
    sampleTitles[Math.floor(Math.random() * sampleTitles.length)]
  } #${index + 1}`;

  const description =
    sampleDescriptions[Math.floor(Math.random() * sampleDescriptions.length)];

  const column = columns[Math.floor(Math.random() * columns.length)];

  // Position: random decimal between 0 and 1000000
  const position = Math.random() * 1000000;

  return {
    userId: new mongoose.Types.ObjectId(userId),
    title,
    description,
    column,
    position: mongoose.Types.Decimal128.fromString(position.toString()),
  };
}

/**
 * Insert test data in batches
 */
async function insertTestData(
  userId,
  totalRecords = 1000000,
  batchSize = 10000
) {
  const mongodbUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/todo-loo";

  try {
    console.log(`🔌 Connecting to MongoDB: ${mongodbUri}`);
    await mongoose.connect(mongodbUri);
    console.log("✅ MongoDB connected successfully\n");

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ Invalid user ID format");
      process.exit(1);
    }

    console.log(`📊 Inserting ${totalRecords.toLocaleString()} test tasks`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`📦 Batch size: ${batchSize.toLocaleString()}\n`);

    const startTime = Date.now();
    let insertedCount = 0;

    // Insert in batches
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batchTasks = [];
      const currentBatchSize = Math.min(batchSize, totalRecords - i);

      // Generate batch
      for (let j = 0; j < currentBatchSize; j++) {
        batchTasks.push(generateRandomTask(userId, i + j));
      }

      // Insert batch
      try {
        await Task.insertMany(batchTasks, { ordered: false });
        insertedCount += currentBatchSize;

        const percentage = ((insertedCount / totalRecords) * 100).toFixed(2);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (insertedCount / (elapsed || 0.1)).toLocaleString(
          "en-US",
          {
            maximumFractionDigits: 0,
          }
        );

        process.stdout.write(
          `\r⏳ ${insertedCount.toLocaleString()} / ${totalRecords.toLocaleString()} (${percentage}%) | ${elapsed}s | ${rate} tasks/sec`
        );
      } catch (error) {
        console.error(
          `\n❌ Error inserting batch at index ${i}:`,
          error.message
        );
        process.exit(1);
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const avgRate = (insertedCount / totalTime).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    });

    console.log(
      `\n\n✨ Successfully inserted ${insertedCount.toLocaleString()} test tasks`
    );
    console.log(`⏱️  Total time: ${totalTime}s`);
    console.log(`📈 Average rate: ${avgRate} tasks/sec\n`);

    // Display stats
    const stats = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$column",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("📋 Tasks by column:");
    columns.forEach((col) => {
      const colStat = stats.find((s) => s._id === col) || { count: 0 };
      console.log(`   ${col.padEnd(12)}: ${colStat.count.toLocaleString()}`);
    });

    const totalStats = await Task.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });
    console.log(`   ${"total".padEnd(12)}: ${totalStats.toLocaleString()}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("❌ User ID is required");
  console.log("\nUsage: node scripts/insertTestData.js <userId> [batchSize]");
  console.log("\nExample:");
  console.log("  node scripts/insertTestData.js 507f1f77bcf86cd799439011");
  console.log(
    "  node scripts/insertTestData.js 507f1f77bcf86cd799439011 5000\n"
  );
  process.exit(1);
}

const userId = args[0];
const batchSize = args[1] ? parseInt(args[1], 10) : 10000;

if (isNaN(batchSize) || batchSize < 100) {
  console.error("❌ Batch size must be a number >= 100");
  process.exit(1);
}

// Run the script
insertTestData(userId, 1000000, batchSize);
