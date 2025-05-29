import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";

const AgreementTable = () => {
  const rawData = useMemo(
    () => [
      {
        srNo: 1,
        clientName: "ABC Ltd",
        location: "Andheri",
        city: "Mumbai",
        state: "Maharashtra",
        wo: "WO / PO / LOI If any",
        executionPending: "Remark...",
        executed: "Sent To Client Mr. Jayesh Poojari",
        underProcess: "",
        completed: "",
        uploads: ["upload", "upload", "upload", "upload"],
      },
      {
        srNo: 2,
        clientName: "XYX",
        location: "Andheri",
        city: "Panji",
        state: "Goa",
        wo: "WO received from Client",
        executionPending: "Draft Send for Client Approval",
        executed: "",
        underProcess: "",
        completed: "",
        uploads: ["upload", "upload", "upload", "upload"],
      },
      {
        srNo: 3,
        clientName: "RRR Ltd",
        location: "Andheri",
        city: "Jaipur",
        state: "Rajasthan",
        wo: "WO / PO / LOI If any",
        executionPending: "",
        executed: "",
        underProcess: "With Mr. Ramesh",
        completed: "",
        uploads: ["upload", "upload", "upload", "upload"],
      },
      {
        srNo: 4,
        clientName: "CC LTd",
        location: "Andheri",
        city: "Lucknow",
        state: "Uttar Pradesh",
        wo: "WO / PO / LOI If any",
        executionPending: "",
        executed: "",
        underProcess: "",
        completed: "Both Side Sign",
        uploads: ["upload", "upload", "upload", "upload"],
      },
    ],
    []
  );

  const [data, setData] = useState(rawData);
  const [columnFilters, setColumnFilters] = useState([]);

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
        header: "Execution Pending",
        accessorKey: "executionPending",
        cell: ({ row }) => (
          <div>
            <div>Execution Pending</div>
            <div>{row.original.executionPending || "Remark..."}</div>
            <div>{row.original.uploads[0]}</div>
          </div>
        ),
      },
      {
        header: "Executed",
        accessorKey: "executed",
        cell: ({ row }) => (
          <div>
            <div>Executed</div>
            <div>{row.original.executed || "Remark..."}</div>
            <div>{row.original.uploads[1]}</div>
          </div>
        ),
      },
      {
        header: "Underprocess with Client",
        accessorKey: "underProcess",
        cell: ({ row }) => (
          <div>
            <div>Underprocess with Client</div>
            <div>{row.original.underProcess || "Remark..."}</div>
            <div>{row.original.uploads[2]}</div>
          </div>
        ),
      },
      {
        header: "Completed",
        accessorKey: "completed",
        cell: ({ row }) => (
          <div>
            <div>Completed</div>
            <div>{row.original.completed || "Remark..."}</div>
            <div>{row.original.uploads[3]}</div>
          </div>
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
      "Execution Pending": row.executionPending,
      Executed: row.executed,
      "Underprocess with Client": row.underProcess,
      Completed: row.completed,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agreements");
    XLSX.writeFile(workbook, "Agreement_Status.xlsx");
  };

  return (
    <div className="p-4">
      <button
        onClick={exportToExcel}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
      >
        Export to Excel
      </button>

      <div className="flex gap-4 mb-4">
        {["clientName", "city", "state"].map((key) => {
          const uniqueOptions = Array.from(new Set(data.map((d) => d[key])));
          return (
            <div key={key}>
              <label className="block text-sm font-medium capitalize">{key}</label>
              <select
                className="border px-2 py-1"
                value={
                  columnFilters.find((f) => f.id === key)?.value || ""
                }
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
    </div>
  );
};

export default AgreementTable;
