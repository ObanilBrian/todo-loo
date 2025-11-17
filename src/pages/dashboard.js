import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from "next/router";
import Column from "@/components/Column";
import AddCardModal from "@/components/AddCardModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useDragDrop } from "@/hooks/useDragDrop";
import { useCardManagement } from "@/hooks/useCardManagement";
import { useAuth } from "@/hooks/useAuth";
import cardStyles from "@/styles/card.module.css";
import Head from "next/head";

export default function Dashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState({
    backlog: [],
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

  // Authentication guard and fetch tasks
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }
      setIsAuthenticated(true);

      // Fetch tasks from API
      try {
        const response = await fetch("/api/task", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const storedTasks = await response.json();
          // Organize tasks by column
          const organizedTasks = {
            backlog: [],
            todo: [],
            inProgress: [],
            done: [],
          };

          storedTasks.forEach((task) => {
            if (organizedTasks[task.column]) {
              organizedTasks[task.column].push(task);
            }
          });

          setTasks(organizedTasks);
        } else {
          console.error("Failed to fetch tasks");
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div
        className="container-fluid p-4 d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing
  if (!isAuthenticated) {
    return <div></div>;
  }

  return (
    <>
      <Head>
        <title>ToDo-Loo!</title>
      </Head>
      <div className="container-fluid p-4">
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <h1 className="mb-0">ToDo-Loo! 📋 </h1>
          <div>
            <button
              className="btn btn-primary mx-2"
              onClick={() => cardManagement.handleOpenModal("backlog")}
            >
              + Add Card
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={logout}
              title="Logout"
            >
              Logout
            </button>
          </div>
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
              onTaskDragLeave={(e) =>
                dragDrop.handleTaskDragLeave(e, cardStyles)
              }
              dropIndicator={dragDrop.dropIndicator}
              onConfirmDelete={cardManagement.handleConfirmDelete}
              onOpenModal={cardManagement.handleOpenModal}
              onOpenEditModal={cardManagement.handleOpenEditModal}
            />
          ))}
        </div>

        <AddCardModal
          showModal={cardManagement.showModal}
          selectedColumn={cardManagement.selectedColumn}
          formData={cardManagement.formData}
          columns={columns}
          editMode={cardManagement.editMode}
          onClose={
            cardManagement.editMode
              ? cardManagement.handleCloseEditModal
              : cardManagement.handleCloseModal
          }
          onFormChange={cardManagement.handleFormChange}
          onSelectColumn={cardManagement.setSelectedColumn}
          onSubmit={(e) =>
            cardManagement.editMode
              ? cardManagement.handleEditCard(e, setTasks)
              : cardManagement.handleAddCard(e, setTasks)
          }
        />

        <DeleteConfirmModal
          deleteConfirm={cardManagement.deleteConfirm}
          onCancel={cardManagement.handleCancelDelete}
          onConfirm={(cardId, columnKey) =>
            cardManagement.handleDeleteCard(cardId, columnKey, setTasks)
          }
        />
      </div>
    </>
  );
}
