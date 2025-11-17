import React from "react";
import styles from "@/styles/dashboard.module.css";

export default function DeleteConfirmModal({
  deleteConfirm,
  onCancel,
  onConfirm,
}) {
  if (!deleteConfirm) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5>Delete Card</h5>
          <button className={styles.closeBtn} onClick={onCancel}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>
            Are you sure you want to delete this card? This action cannot be
            undone.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() =>
              onConfirm(deleteConfirm.taskId, deleteConfirm.columnKey)
            }
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
