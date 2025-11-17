import cardStyles from "@/styles/card.module.css";

export default function Card({
  column,
  tasks,
  onDragStart,
  onTaskDragOver,
  onTaskDragLeave,
  dropIndicator,
  onDrop,
  onConfirmDelete,
  onOpenEditModal,
}) {
  const handleTaskDrop = (e, position) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(e, column.key);
  };

  return (
    <div className={cardStyles.tasksContainer}>
      {tasks[column.key].map((task, index) => (
        <div key={task.id}>
          {dropIndicator?.columnKey === column.key &&
            dropIndicator?.position === index && (
              <div className={cardStyles.dropIndicator} />
            )}
          <div
            className={`card mb-2 ${cardStyles.taskCard}`}
            draggable
            onDragStart={(e) => onDragStart(e, task, column.key)}
            onDragOver={(e) => onTaskDragOver(e, task.id, column.key, index)}
            onDragLeave={onTaskDragLeave}
            onDrop={(e) => handleTaskDrop(e, index)}
          >
            <div className="card-body p-3">
              <div className={cardStyles.cardHeader}>
                <div className={cardStyles.cardContent}>
                  <h6 className="card-title mb-2">{task.title}</h6>
                  <p className="card-text small text-muted mb-0">
                    {task.description}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <button
                    className={`${cardStyles.editBtn} me-1`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditModal(task.id, column.key, task);
                    }}
                    title="Edit card"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 12.293 6 10 3.707 11.207 2.5z" />
                    </svg>
                  </button>
                  <button
                    className={cardStyles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmDelete(task.id, column.key);
                    }}
                    title="Delete card"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5.5 5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H10v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.5H5.5a.5.5 0 0 1-.5-.5z" />
                      <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-.5V13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5H2.5a.5.5 0 0 1-.5-.5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      {dropIndicator?.columnKey === column.key &&
        dropIndicator?.position === tasks[column.key].length && (
          <div className={cardStyles.dropIndicator} />
        )}
    </div>
  );
}
