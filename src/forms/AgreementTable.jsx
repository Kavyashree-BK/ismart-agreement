import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";

const AgreementTable = () => {
  const [data, setData] = useState([
    {
      srNo: 1,
      clientName: "ABC Ltd",
      location: "Andheri",
      city: "Mumbai",
      state: "Maharashtra",
      wo: "WO / PO / LOI If any",
      progress: "",
    },
    {
      srNo: 2,
      clientName: "XYX",
      location: "Andheri",
      city: "Panji",
      state: "Goa",
      wo: "WO received from Client",
      progress: "",
    },
    {
      srNo: 3,
      clientName: "RRR Ltd",
      location: "Andheri",
      city: "Jaipur",
      state: "Rajasthan",
      wo: "WO / PO / LOI If any",
      progress: "",
    },
    {
      srNo: 4,
      clientName: "CC LTd",
      location: "Andheri",
      city: "Lucknow",
      state: "Uttar Pradesh",
      wo: "WO / PO / LOI If any",
      progress: "",
    },
  ]);

  const [columnFilters, setColumnFilters] = useState([]);

  const handleProgressChange = (rowIndex, value) => {
    setData((prevData) => {
      const newData = [...prevData];
      newData[rowIndex] = { ...newData[rowIndex], progress: value };
      return newData;
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Sr. No",
        accessorKey: "srNo",
      },
      {
        header: "Client Name",
        accessorKey: "clientName",
        filterFn: "includesString",
      },
      {
        header: "Location",
        accessorKey: "location",
        filterFn: "includesString",
      },
      {
        header: "City",
        accessorKey: "city",
        filterFn: "includesString",
      },
      {
        header: "State",
        accessorKey: "state",
        filterFn: "includesString",
      },
      {
        header: "WO / PO / LOI",
        accessorKey: "wo",
      },
      {
        header: "Progress",
        accessorKey: "progress",
        cell: ({ row }) => (
          <textarea
            className="w-full border border-gray-300 px-2 py-1 rounded resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={row.original.progress}
            onChange={(e) => handleProgressChange(row.index, e.target.value)}
            placeholder="Type progress"
          />
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const exportToExcel = () => {
    const exportData = data.map((row) => ({
      "Sr. No": row.srNo,
      "Client Name": row.clientName,
      Location: row.location,
      City: row.city,
      State: row.state,
      "WO / PO / LOI": row.wo,
      Progress: row.progress,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agreements");
    XLSX.writeFile(workbook, "Agreement_Status.xlsx");
  };

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-4">
        {["clientName", "city", "state"].map((key) => {
          const uniqueOptions = Array.from(new Set(data.map((d) => d[key])));
          return (
            <div key={key}>
              <label className="block text-sm font-medium capitalize">{key}</label>
              <select
                className="border px-2 py-1"
                value={columnFilters.find((f) => f.id === key)?.value || ""}
                onChange={(e) =>
                  setColumnFilters((old) =>
                    e.target.value
                      ? [...old.filter((f) => f.id !== key), { id: key, value: e.target.value }]
                      : old.filter((f) => f.id !== key)
                  )
                }
              >
                <option value="">All</option>
                {uniqueOptions.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <table className="table-auto border border-collapse w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border border-gray-400 bg-gray-100 p-2"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border border-gray-300 p-2 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-4">
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Export to Excel
        </button>
      </div>
    </div>
  );
};

export default AgreementTable;
