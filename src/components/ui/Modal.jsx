import React from 'react';

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {children}
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="mt-2 rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
