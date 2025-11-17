import Task from "@/lib/models/Task";

const COLUMNS = ["backlog", "todo", "inProgress", "done"];
const TASKS_PER_COLUMN = 10;

// Helper function to convert Decimal128 positions to numbers
function convertTaskPositions(tasks) {
  return tasks.map((task, index) => {
    const taskObj = task.toObject ? task.toObject() : task;

    // Handle null or missing positions by assigning them based on index
    if (taskObj.position === null || taskObj.position === undefined) {
      taskObj.position = index * 10;
      console.log(
        "DEBUG: Assigned position",
        taskObj.position,
        "to task with null position"
      );
      return taskObj;
    }

    // Convert Decimal128 to number if needed
    if (
      typeof taskObj.position === "object" &&
      "$numberDecimal" in taskObj.position
    ) {
      taskObj.position = parseFloat(taskObj.position.$numberDecimal);
      console.log("DEBUG: Converted Decimal128 position to", taskObj.position);
    }

    return taskObj;
  });
}

export async function getTasks(userId, pagination = {}) {
  try {
    const { page = 1, column } = pagination;

    // Validate page number
    const pageNum = Math.max(1, parseInt(page) || 1);
    const skip = (pageNum - 1) * TASKS_PER_COLUMN;

    // If column is specified, fetch only that column
    if (column) {
      if (!COLUMNS.includes(column)) {
        return {
          status: 400,
          data: { message: "Invalid column name" },
        };
      }

      const totalTasks = await Task.countDocuments({ userId, column });
      const tasks = await Task.find({ userId, column })
        .sort({ position: 1 })
        .skip(skip)
        .limit(TASKS_PER_COLUMN);

      const convertedTasks = convertTaskPositions(tasks);

      return {
        status: 200,
        data: {
          message: "Tasks retrieved successfully",
          tasks: {
            [column]: convertedTasks,
          },
          pagination: {
            [column]: {
              page: pageNum,
              limit: TASKS_PER_COLUMN,
              total: totalTasks,
              totalPages: Math.ceil(totalTasks / TASKS_PER_COLUMN),
              hasNextPage: pageNum < Math.ceil(totalTasks / TASKS_PER_COLUMN),
              hasPrevPage: pageNum > 1,
            },
          },
        },
      };
    }

    // Fetch paginated tasks for all columns
    const tasksByColumn = {};
    const paginationData = {};

    for (const col of COLUMNS) {
      // Get total count for this column
      const totalTasks = await Task.countDocuments({ userId, column: col });

      // Get paginated tasks
      const tasks = await Task.find({ userId, column: col })
        .sort({ position: 1 })
        .skip(skip)
        .limit(TASKS_PER_COLUMN);

      const convertedTasks = convertTaskPositions(tasks);

      tasksByColumn[col] = convertedTasks;
      paginationData[col] = {
        page: pageNum,
        limit: TASKS_PER_COLUMN,
        total: totalTasks,
        totalPages: Math.ceil(totalTasks / TASKS_PER_COLUMN),
        hasNextPage: pageNum < Math.ceil(totalTasks / TASKS_PER_COLUMN),
        hasPrevPage: pageNum > 1,
      };
    }

    return {
      status: 200,
      data: {
        message: "Tasks retrieved successfully",
        tasks: tasksByColumn,
        pagination: paginationData,
      },
    };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return {
      status: 500,
      data: { message: "Internal server error" },
    };
  }
}
