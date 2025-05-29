
import React from 'react';
import { Controller } from 'react-hook-form';

export default function DropDown({ id, name, control, options, placeholder }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <select
          id={id}
          {...field}
          className="w-full rounded border px-3 py-2 text-gray-700"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    />
  );
}
