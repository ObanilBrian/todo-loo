import React from "react";
import styles from "@/styles/dashboard.module.css";
import Card from "@/components/Card";

export default function Column({
  column,
  tasks,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onTaskDragOver,
  onTaskDragLeave,
  dropIndicator,
  onConfirmDelete,
  onOpenModal,
}) {
  return (
    <div className="col-lg-3 col-md-6">
      <div
        className={`card border-top border-${column.color}`}
        style={{ height: "100%" }}
      >
        <div
          className={`card-header bg-${column.color} text-white d-flex justify-content-between align-items-center`}
        >
          <h5 className="mb-0">{column.title}</h5>
          <button
            className="btn btn-sm btn-light"
            onClick={() => onOpenModal(column.key)}
            title="Add card to this column"
          >
            +
          </button>
        </div>
        <div
          className={`card-body ${styles.columnBody}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, column.key)}
        >
          {tasks[column.key].length === 0 ? (
            <div className="text-center text-muted py-4">
              <p>No tasks yet</p>
            </div>
          ) : (
            <Card
              column={column}
              tasks={tasks}
              onDragStart={onDragStart}
              onTaskDragOver={onTaskDragOver}
              onTaskDragLeave={onTaskDragLeave}
              dropIndicator={dropIndicator}
              onDrop={onDrop}
              onConfirmDelete={onConfirmDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
