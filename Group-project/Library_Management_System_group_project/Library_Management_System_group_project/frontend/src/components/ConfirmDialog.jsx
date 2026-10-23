import React from 'react';
import Modal from './Modal';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: isDanger ? '#fef2f2' : '#eef2ff',
            color: isDanger ? '#ef4444' : '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {isDanger ? <AlertTriangle size={22} /> : <CheckCircle size={22} />}
        </div>
        <div>
          <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
