import React from 'react';

export const Input = ({ type = "text", value, onChange, placeholder }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="border px-2 py-1 rounded w-full"
  />
);
