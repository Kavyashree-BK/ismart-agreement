import React from 'react';

export default function Button({ type = 'button', className = '', onClick, children }) {
    return (
      <button
        type={type}
        className={`rounded text-white font-medium ${className}`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }
  