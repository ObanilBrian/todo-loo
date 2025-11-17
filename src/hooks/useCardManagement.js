import { useState } from "react";

export const useCardManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState("backlog");
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [nextId, setNextId] = useState(4);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const handleAddCard = (e, setTasks) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newCard = {
      id: nextId,
      title: formData.title,
      description: formData.description,
    };

    setTasks((prev) => ({
      ...prev,
      [selectedColumn]: [...prev[selectedColumn], newCard],
    }));

    setNextId(nextId + 1);
    handleCloseModal();
  };

  const handleDeleteCard = (cardId, columnKey, setTasks) => {
    setTasks((prev) => ({
      ...prev,
      [columnKey]: prev[columnKey].filter((task) => task.id !== cardId),
    }));
    setDeleteConfirm(null);
  };

  const handleConfirmDelete = (cardId, columnKey) => {
    setDeleteConfirm({ cardId, columnKey });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  return {
    showModal,
    setShowModal,
    selectedColumn,
    setSelectedColumn,
    formData,
    setFormData,
    nextId,
    setNextId,
    deleteConfirm,
    setDeleteConfirm,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleAddCard,
    handleDeleteCard,
    handleConfirmDelete,
    handleCancelDelete,
  };
};
