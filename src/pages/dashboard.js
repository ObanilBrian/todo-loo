import React, { useState, useEffect, useCallback, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from "next/router";
import Column from "@/components/Column";
import AddCardModal from "@/components/AddCardModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useBatchDragDrop } from "@/hooks/useBatchDragDrop";
import { useCardManagement } from "@/hooks/useCardManagement";
import { useAuth } from "@/hooks/useAuth";
import { usePagination } from "@/hooks/usePagination";
import cardStyles from "@/styles/card.module.css";
import Head from "next/head";
import { verifyToken } from "@/lib/jwt";

export async function getServerSideProps(context) {
  const token = context.req.cookies.token;
  
  if (!token) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { logout } = useAuth();

  const {
    tasks,
    setTasks,
    pagination,
    loading: paginationLoading,
    error: paginationError,
    fetchInitialTasks,
    loadNextPage,
    resetPagination,
  } = usePagination();

  const columns = [
    { key: "backlog", title: "Backlog", color: "secondary" },
    { key: "todo", title: "TODO", color: "info" },
    { key: "inProgress", title: "In Progress", color: "warning" },
    { key: "done", title: "Done", color: "success" },
  ];

  const dragDrop = useBatchDragDrop(tasks, setTasks);
  const cardManagement = useCardManagement();
  const dragDropRef = useRef(dragDrop);

  // Update ref when dragDrop changes
  useEffect(() => {
    dragDropRef.current = dragDrop;
  }, [dragDrop]);

  // Callback for infinite scroll load more
  const handleLoadMore = useCallback(
    (columnKey) => {
      loadNextPage(columnKey);
    },
    [loadNextPage]
  );

  // Fetch initial tasks
  useEffect(() => {
    resetPagination();
    fetchInitialTasks();
  }, [resetPagination, fetchInitialTasks]);

  // Cleanup batch updates on component unmount
  useEffect(() => {
    return () => {
      dragDropRef.current.cleanup();
    };
  }, []);



  return (
    <div className="container-fluid px-4 py-5" style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className="mb-5 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="mb-1" style={{ fontWeight: 700, letterSpacing: '-0.04em', fontSize: '2rem' }}>
            ToDo-Loo! <span style={{fontSize: '0.85em'}}>📋</span>
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Manage your tasks effectively.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => cardManagement.handleOpenModal("backlog")}
            title="Add a new card"
            style={{ padding: '0.6rem 1.25rem' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            <span className="d-none d-lg-inline-block">Add Task</span>
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={logout}
            title="Logout"
            style={{ padding: '0.6rem 1.25rem' }}
          >
            Logout
          </button>
        </div>
      </div>

      {paginationError && (
        <div className="alert alert-warning alert-dismissible fade show" style={{ borderRadius: '12px' }}>
          Failed to load tasks: {paginationError}
        </div>
      )}

      {dragDrop.pendingUpdates > 0 && (
        <div
          className="alert alert-info alert-dismissible fade show"
          role="alert"
        >
          <span>
            {dragDrop.isSending ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving {dragDrop.pendingUpdates} update
                {dragDrop.pendingUpdates !== 1 ? "s" : ""}...
              </>
            ) : (
              <>
                ⏱️ {dragDrop.pendingUpdates} update
                {dragDrop.pendingUpdates !== 1 ? "s" : ""} pending (will save in
                5 seconds)
              </>
            )}
          </span>
        </div>
      )}

      <div className="row g-3">
        {columns.map((column) => (
          <Column
            key={column.key}
            column={column}
            tasks={tasks}
            pagination={pagination}
            onLoadMore={handleLoadMore}
            onDragOver={dragDrop.handleDragOver}
            onDragLeave={dragDrop.handleColumnDragLeave}
            onDrop={dragDrop.handleDrop}
            onDragStart={dragDrop.handleDragStart}
            onTaskDragOver={dragDrop.handleTaskDragOver}
            onTaskDragLeave={(e) => dragDrop.handleTaskDragLeave(e, cardStyles)}
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
  );
}
