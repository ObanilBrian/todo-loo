import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Column from "@/components/Column";
import AddCardModal from "@/components/AddCardModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useDragDrop } from "@/hooks/useDragDrop";
import { useCardManagement } from "@/hooks/useCardManagement";
import cardStyles from "@/styles/card.module.css";

export default function Dashboard() {
  const [tasks, setTasks] = useState({
    backlog: [
      {
        id: 1,
        title: "Design user interface",
        description: "Create mockups and wireframes",
      },
      {
        id: 2,
        title: "Setup database",
        description: "Configure PostgreSQL and migrations",
      },
      {
        id: 3,
        title: "API documentation",
        description: "Write API endpoint docs",
      },
    ],
    todo: [],
    inProgress: [],
    done: [],
  });

  const columns = [
    { key: "backlog", title: "Backlog", color: "secondary" },
    { key: "todo", title: "TODO", color: "info" },
    { key: "inProgress", title: "In Progress", color: "warning" },
    { key: "done", title: "Done", color: "success" },
  ];

  const dragDrop = useDragDrop(tasks, setTasks);
  const cardManagement = useCardManagement();

  return (
    <div className="container-fluid p-4">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h1>ToDo Loo! 📋 </h1>
        <button
          className="btn btn-primary"
          onClick={() => cardManagement.handleOpenModal("backlog")}
        >
          + Add Card
        </button>
      </div>

      <div className="row g-3">
        {columns.map((column) => (
          <Column
            key={column.key}
            column={column}
            tasks={tasks}
            onDragOver={dragDrop.handleDragOver}
            onDragLeave={dragDrop.handleColumnDragLeave}
            onDrop={dragDrop.handleDrop}
            onDragStart={dragDrop.handleDragStart}
            onTaskDragOver={dragDrop.handleTaskDragOver}
            onTaskDragLeave={(e) => dragDrop.handleTaskDragLeave(e, cardStyles)}
            dropIndicator={dragDrop.dropIndicator}
            onConfirmDelete={cardManagement.handleConfirmDelete}
            onOpenModal={cardManagement.handleOpenModal}
          />
        ))}
      </div>

      <AddCardModal
        showModal={cardManagement.showModal}
        selectedColumn={cardManagement.selectedColumn}
        formData={cardManagement.formData}
        columns={columns}
        onClose={cardManagement.handleCloseModal}
        onFormChange={cardManagement.handleFormChange}
        onSelectColumn={cardManagement.setSelectedColumn}
        onSubmit={(e) => cardManagement.handleAddCard(e, setTasks)}
      />

      <DeleteConfirmModal
        deleteConfirm={cardManagement.deleteConfirm}
        onCancel={cardManagement.handleCancelDelete}
        onConfirm={(cardId, columnKey) =>
          cardManagement.handleDeleteCard(cardId, columnKey, setTasks)
        }
      />
    </div>
  );
}
