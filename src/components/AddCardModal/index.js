import React from "react";
import styles from "@/styles/dashboard.module.css";

export default function AddCardModal({
  showModal,
  selectedColumn,
  formData,
  columns,
  editMode,
  onClose,
  onFormChange,
  onSelectColumn,
  onSubmit,
}) {
  if (!showModal) return null;

  const isEditMode = !!editMode;
  const title = isEditMode ? "Edit Card" : "Add New Card";
  const buttonText = isEditMode ? "Save Changes" : "Add Card";

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5>{title}</h5>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className={styles.modalBody}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">
                Title <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="title"
                name="title"
                value={formData.title}
                onChange={onFormChange}
                placeholder="Enter card title"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                value={formData.description}
                onChange={onFormChange}
                placeholder="Enter card description"
                rows="3"
              />
            </div>
            {!isEditMode && (
              <div className="mb-3">
                <label htmlFor="column" className="form-label">
                  Column
                </label>
                <select
                  className="form-select"
                  id="column"
                  value={selectedColumn}
                  onChange={(e) => onSelectColumn(e.target.value)}
                >
                  {columns.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
