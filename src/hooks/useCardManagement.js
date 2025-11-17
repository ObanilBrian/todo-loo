import { useState } from "react";

export const useCardManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState("backlog");
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editMode, setEditMode] = useState(null); // { taskId, columnKey }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenModal = (columnKey) => {
    setSelectedColumn(columnKey);
    setFormData({ title: "", description: "" });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ title: "", description: "" });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCard = async (e, setTasks) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/task", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          column: selectedColumn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create task");
        return;
      }

      // Update local state with the new task
      setTasks((prev) => ({
        ...prev,
        [selectedColumn]: [...prev[selectedColumn], data.task],
      }));

      handleCloseModal();
    } catch (err) {
      setError("Error creating task: " + err.message);
      console.error("Error creating task:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async (taskId, columnKey, setTasks) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/task?taskId=${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to delete task");
        return;
      }

      // Update local state
      setTasks((prev) => ({
        ...prev,
        [columnKey]: prev[columnKey].filter((task) => task._id !== taskId),
      }));

      setDeleteConfirm(null);
    } catch (err) {
      setError("Error deleting task: " + err.message);
      console.error("Error deleting task:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = (taskId, columnKey) => {
    setDeleteConfirm({ taskId, columnKey });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleOpenEditModal = (taskId, columnKey, task) => {
    setEditMode({ taskId, columnKey });
    setFormData({ title: task.title, description: task.description });
    setShowModal(true);
  };

  const handleCloseEditModal = () => {
    setEditMode(null);
    setShowModal(false);
    setFormData({ title: "", description: "" });
  };

  const handleEditCard = async (e, setTasks) => {
    e.preventDefault();
    if (!formData.title.trim() || !editMode) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/task", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: editMode.taskId,
          title: formData.title,
          description: formData.description,
          column: editMode.columnKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update task");
        return;
      }

      // Update local state
      setTasks((prev) => ({
        ...prev,
        [editMode.columnKey]: prev[editMode.columnKey].map((task) =>
          task._id === editMode.taskId ? data.task : task
        ),
      }));

      handleCloseEditModal();
    } catch (err) {
      setError("Error updating task: " + err.message);
      console.error("Error updating task:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    showModal,
    setShowModal,
    selectedColumn,
    setSelectedColumn,
    formData,
    setFormData,
    deleteConfirm,
    setDeleteConfirm,
    editMode,
    setEditMode,
    isLoading,
    error,
    setError,
    handleOpenModal,
    handleCloseModal,
    handleOpenEditModal,
    handleCloseEditModal,
    handleFormChange,
    handleAddCard,
    handleEditCard,
    handleDeleteCard,
    handleConfirmDelete,
    handleCancelDelete,
  };
};
