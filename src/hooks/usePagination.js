import { useState, useCallback, useRef } from "react";

const TASKS_PER_COLUMN = 20;

// Helper function to normalize task positions (convert Decimal128 to numbers)
function normalizePositions(tasks) {
  if (!tasks || !Array.isArray(tasks)) {
    return tasks;
  }

  return tasks.map((task) => ({
    ...task,
    position:
      task.position &&
      typeof task.position === "object" &&
      "$numberDecimal" in task.position
        ? parseFloat(task.position.$numberDecimal)
        : task.position,
  }));
}

// Helper function to normalize task objects in a column map
function normalizeTasks(tasksByColumn) {
  const normalized = {};
  for (const [columnKey, tasks] of Object.entries(tasksByColumn)) {
    normalized[columnKey] = normalizePositions(tasks);
  }
  return normalized;
}

export const usePagination = () => {
  const [tasks, setTasks] = useState({
    backlog: [],
    todo: [],
    inProgress: [],
    done: [],
  });

  const [pagination, setPagination] = useState({
    backlog: { page: 1, hasNextPage: true, totalPages: 0, total: 0 },
    todo: { page: 1, hasNextPage: true, totalPages: 0, total: 0 },
    inProgress: { page: 1, hasNextPage: true, totalPages: 0, total: 0 },
    done: { page: 1, hasNextPage: true, totalPages: 0, total: 0 },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingColumns, setLoadingColumns] = useState({});
  const loadingRef = useRef({});

  // Fetch tasks for initial load
  const fetchInitialTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/task?page=1", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();

      // Initialize tasks with first page (normalize positions)
      setTasks(normalizeTasks(data.tasks));

      // Set pagination state
      setPagination(data.pagination);

      return data;
    } catch (err) {
      console.error("Error fetching initial tasks:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load next page for a specific column
  const loadNextPage = useCallback(
    async (columnKey) => {
      // Prevent duplicate concurrent requests for the same column
      if (loadingRef.current[columnKey]) {
        return;
      }

      // Check if has next page
      if (!pagination[columnKey]?.hasNextPage) {
        return;
      }

      // Mark as loading
      loadingRef.current[columnKey] = true;
      setLoadingColumns((prev) => ({ ...prev, [columnKey]: true }));

      try {
        // Get current page from state
        const currentPage = pagination[columnKey].page;
        const nextPage = currentPage + 1;

        const response = await fetch(
          `/api/task?page=${nextPage}&column=${columnKey}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch next page");
        }

        const data = await response.json();

        // Append new tasks to existing ones (normalize positions for new tasks)
        setTasks((prevTasks) => ({
          ...prevTasks,
          [columnKey]: [
            ...prevTasks[columnKey],
            ...normalizePositions(data.tasks[columnKey]),
          ],
        }));

        // Update pagination state
        setPagination((prevPagination) => ({
          ...prevPagination,
          [columnKey]: data.pagination[columnKey],
        }));
      } catch (err) {
        console.error(`Error loading next page for ${columnKey}:`, err);
      } finally {
        // Mark as no longer loading
        loadingRef.current[columnKey] = false;
        setLoadingColumns((prev) => ({ ...prev, [columnKey]: false }));
      }
    },
    [pagination]
  );

  // Reset pagination (useful when filtering or resetting)
  const resetPagination = useCallback(() => {
    setTasks({
      backlog: [],
      todo: [],
      inProgress: [],
      done: [],
    });

    setPagination({
      backlog: { page: 1, hasNextPage: true, totalPages: 0, total: 0 },
      todo: { page: 1, hasNextPage: true, totalPages: 0, total: 0 },
      inProgress: { page: 1, hasNextPage: true, totalPages: 0, total: 0 },
      done: { page: 1, hasNextPage: true, totalPages: 0, total: 0 },
    });
  }, []);

  return {
    tasks,
    setTasks,
    pagination,
    loading,
    error,
    fetchInitialTasks,
    loadNextPage,
    resetPagination,
  };
};
