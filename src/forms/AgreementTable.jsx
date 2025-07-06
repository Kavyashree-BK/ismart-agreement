import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";

const AgreementTable = () => {
  const initialData = [
    {
      srNo: 1,
      clientName: "ABC Ltd",
      location: "Andheri",
      city: "Mumbai",
      state: "Maharashtra",
      wo: "WO / PO / LOI If any",
      stages: {
        executionPending: { current: "", date: "", history: [] },
        executed: { current: "", date: "", history: [] },
        underProcess: { current: "", date: "", history: [] },
        completed: { current: "", date: "", history: [] },
      },
    },
    {
      srNo: 2,
      clientName: "XYX",
      location: "Andheri",
      city: "Panji",
      state: "Goa",
      wo: "WO received from Client",
      stages: {
        executionPending: { current: "", date: "", history: [] },
        executed: { current: "", date: "", history: [] },
        underProcess: { current: "", date: "", history: [] },
        completed: { current: "", date: "", history: [] },
      },
    },
    {
      srNo: 3,
      clientName: "RRR Ltd",
      location: "Andheri",
      city: "Jaipur",
      state: "Rajasthan",
      wo: "WO / PO / LOI If any",
      stages: {
        executionPending: { current: "", date: "", history: [] },
        executed: { current: "", date: "", history: [] },
        underProcess: { current: "", date: "", history: [] },
        completed: { current: "", date: "", history: [] },
      },
    },
    {
      srNo: 4,
      clientName: "CC Ltd",
      location: "Andheri",
      city: "Lucknow",
      state: "Uttar Pradesh",
      wo: "WO / PO / LOI If any",
      stages: {
        executionPending: { current: "", date: "", history: [] },
        executed: { current: "", date: "", history: [] },
        underProcess: { current: "", date: "", history: [] },
        completed: { current: "", date: "", history: [] },
      },
    },
  ];

  const [data, setData] = useState(initialData);
  const [columnFilters, setColumnFilters] = useState([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [exported, setExported] = useState(false);

  const updateStatus = (rowIndex, stageKey, newValue, newDate, pushToHistory = false) => {
    setData((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] }; // clone the row
      const stages = { ...row.stages }; // clone the stages
      const stage = { ...stages[stageKey] };

      // Ensure history is always an array
      let newHistory = Array.isArray(stage.history) ? stage.history : [];
      if (
        pushToHistory &&
        (stage.current !== newValue || stage.date !== newDate)
      ) {
        newHistory = [...newHistory, { value: stage.current, date: stage.date }];
      }

      const newStage = {
        ...stage,
        current: newValue,
        date: newDate,
        history: newHistory,
      };

      stages[stageKey] = newStage;
      row.stages = stages;
      updated[rowIndex] = row;

      // Debug: log the updated history
      console.log('Updated history for', stageKey, 'row', rowIndex, newHistory);

      return updated;
    });
  };

  const renderStageCell = (rowIndex, stageKey, stageData) => {
    return (
      <div className="space-y-1">
        <textarea
          className="border p-1 w-full resize-y min-h-[60px] focus:ring-2 focus:ring-blue-400"
          value={stageData.current}
          onChange={(e) =>
            updateStatus(rowIndex, stageKey, e.target.value, stageData.date, false)
          }
          onBlur={(e) =>
            updateStatus(rowIndex, stageKey, e.target.value, stageData.date, true)
          }
          placeholder="Enter progress"
        />
        <input
          type="date"
          className="border p-1 w-full"
          value={stageData.date}
          onChange={(e) =>
            updateStatus(rowIndex, stageKey, stageData.current, e.target.value, false)
          }
          onBlur={(e) =>
            updateStatus(rowIndex, stageKey, stageData.current, e.target.value, true)
          }
        />
        <details>
          <summary className="cursor-pointer text-sm text-blue-600">
            View History
          </summary>
          <ul className="text-xs pl-2 list-disc">
            {Array.isArray(stageData.history) && stageData.history.length > 0 ? (
              stageData.history.map((entry, i) => (
                <li key={i}>
                  {entry.value} ({entry.date})
                </li>
              ))
            ) : (
              <li className="text-gray-400">No history yet</li>
            )}
          </ul>
        </details>
      </div>
    );
  };

  const columns = useMemo(
    () => [
      { header: "Sr. No", accessorKey: "srNo" },
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
        cell: ({ row }) =>
          renderStageCell(row.index, "executionPending", row.original.stages.executionPending),
      },
      {
        header: "Executed",
        cell: ({ row }) =>
          renderStageCell(row.index, "executed", row.original.stages.executed),
      },
      {
        header: "Underprocess with Client",
        cell: ({ row }) =>
          renderStageCell(row.index, "underProcess", row.original.stages.underProcess),
      },
      {
        header: "Completed",
        cell: ({ row }) =>
          renderStageCell(row.index, "completed", row.original.stages.completed),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters },
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
      "Execution Pending": `${row.stages.executionPending.current} (${row.stages.executionPending.date})`,
      Executed: `${row.stages.executed.current} (${row.stages.executed.date})`,
      "Underprocess with Client": `${row.stages.underProcess.current} (${row.stages.underProcess.date})`,
      Completed: `${row.stages.completed.current} (${row.stages.completed.date})`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agreements");
    XLSX.writeFile(workbook, "Agreement_Status.xlsx");
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleSave = () => {
    setData((prevData) => {
      const updatedData = prevData.map((row) => {
        const newStages = { ...row.stages };
        Object.keys(newStages).forEach((stageKey) => {
          const stage = newStages[stageKey];
          // Ensure history is always an array
          let history = Array.isArray(stage.history) ? stage.history : [];
          // Only add to history if current value/date is different from last history entry
          const lastEntry = history.length > 0 ? history[history.length - 1] : null;
          if (
            !lastEntry ||
            lastEntry.value !== stage.current ||
            lastEntry.date !== stage.date
          ) {
            history = [...history, { value: stage.current, date: stage.date }];
          }
          newStages[stageKey] = { ...stage, history };
        });
        return { ...row, stages: newStages };
      });
      return updatedData;
    });
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
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

      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save
        </button>
        <button
          onClick={exportToExcel}
          className={`px-4 py-2 ${exported ? 'bg-green-600' : 'bg-blue-600'} text-white rounded`}
        >
          Export to Excel
        </button>
      </div>

      {showSaveSuccess && (
        <div className="fixed bottom-8 right-8 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded shadow-lg z-50">
          Changes saved!
        </div>
      )}
    </div>
  );
};

export default AgreementTable;
