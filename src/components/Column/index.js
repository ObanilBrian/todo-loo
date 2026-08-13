import React from "react";
import styles from "@/styles/dashboard.module.css";
import Card from "@/components/Card";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

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
  onOpenEditModal,
  pagination,
  onLoadMore,
}) {
  const scrollTarget = useInfiniteScroll(
    column.key,
    onLoadMore,
    pagination?.[column.key]?.hasNextPage || false
  );

  return (
    <div className={`col-lg-3 col-md-6 ${styles.columnWrapper}`}>
      <div className={styles.columnCard}>
        <div className={styles.columnHeader}>
          <div className={`${styles.columnTitle} ${styles['column' + column.key.charAt(0).toUpperCase() + column.key.slice(1)]}`}>
            {column.title}
          </div>
          <button
            className={styles.addBtn}
            onClick={() => onOpenModal(column.key)}
            title="Add card to this column"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
          </button>
        </div>
        <div
          className={styles.columnBody}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, column.key)}
        >
          {tasks[column.key].length === 0 ? (
            <div className="text-center py-4" style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
              No tasks yet
            </div>
          ) : (
            <>
              <Card
                column={column}
                tasks={tasks}
                onDragStart={onDragStart}
                onTaskDragOver={onTaskDragOver}
                onTaskDragLeave={onTaskDragLeave}
                dropIndicator={dropIndicator}
                onDrop={onDrop}
                onConfirmDelete={onConfirmDelete}
                onOpenEditModal={onOpenEditModal}
              />
              {pagination?.[column.key]?.hasNextPage && (
                <div
                  ref={scrollTarget}
                  className="text-center py-3"
                  style={{ fontSize: "0.875rem", color: '#9CA3AF' }}
                >
                  Loading more tasks...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
