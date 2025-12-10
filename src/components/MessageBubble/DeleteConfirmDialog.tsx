import React from 'react';
import './styles.css';

interface DeleteConfirmDialogProps {
    onCancel: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
    error: string | null;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    onCancel,
    onConfirm,
    isDeleting,
    error,
}) => {
    return (
        <div className="delete-confirm-wrapper">
            <span className="delete-confirm-text">
                {error ? 'Delete failed' : 'Confirm delete?'}
            </span>
            <div className="delete-actions">
                <button
                    className="delete-action-btn cancel"
                    onClick={onCancel}
                    disabled={isDeleting}
                >
                    Cancel
                </button>
                <button
                    className="delete-action-btn confirm"
                    onClick={onConfirm}
                    disabled={isDeleting}
                >
                    {isDeleting ? '...' : 'Delete'}
                </button>
            </div>
        </div>
    );
};
