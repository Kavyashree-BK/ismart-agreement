import React from 'react';

export const Textarea = ({ value, onChange, placeholder }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="border px-2 py-1 rounded w-full"
  />
);
