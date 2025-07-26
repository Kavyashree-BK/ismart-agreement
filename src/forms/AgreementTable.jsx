import React, { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const priorityBadge = priority => {
  if (priority === "High") return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">High</span>;
  if (priority === "Medium") return <span className="bg-black text-white px-2 py-1 rounded-full text-xs font-bold">Medium</span>;
  if (priority === "Low") return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">Low</span>;
  return null;
};

// Component to render clickable file links
const FileLink = ({ file, label, type }) => {
  if (!file) return <span className="text-gray-400 text-xs">{label}: Not uploaded</span>;
  
  const handleFileClick = () => {
    try {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening file:', error);
      alert('Unable to open file');
    }
  };

  return (
    <button
      onClick={handleFileClick}
      className="text-blue-600 hover:text-blue-800 underline text-xs font-medium"
      title={`Click to view ${file.name}`}
    >
      {label}
    </button>
  );
};

// Component to render multiple file links in a column
const DocumentLinks = ({ uploadStatuses, documents }) => {
  return (
    <div className="flex flex-col gap-1">
      {documents.map(doc => (
        <div key={doc.type}>
          <FileLink 
            file={uploadStatuses[doc.type]?.file} 
            label={doc.label} 
            type={doc.type}
          />
        </div>
      ))}
    </div>
  );
};

// Component to render clause document links
const ClauseLinks = ({ clauses, uploadStatuses }) => {
  const clauseLinks = clauses
    .map((clause, index) => ({
      title: clause.title,
      file: uploadStatuses[`clause-${index}`]?.file,
      index
    }))
    .filter(clause => clause.file); // Only show clauses with uploaded files

  if (clauseLinks.length === 0) {
    return <span className="text-gray-400 text-xs">No documents uploaded</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {clauseLinks.map(clause => (
        <div key={clause.index}>
          <FileLink 
            file={clause.file} 
            label={clause.title.length > 20 ? `${clause.title.substring(0, 20)}...` : clause.title}
            type={`clause-${clause.index}`}
          />
        </div>
      ))}
    </div>
  );
};

// Final Agreement Upload Modal Component
const FinalAgreementUpload = ({ agreementId, onUpload, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PDF, DOCX, JPG, JPEG, PNG allowed.');
      return;
    }

    if (file.size > maxSize) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setUploadError("");
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    // Simulate upload process
    setTimeout(() => {
      onUpload(agreementId, selectedFile);
      setIsUploading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[400px] max-w-lg">
        <h3 className="text-xl font-bold mb-4">📄 Upload Final Signed Agreement</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Final Agreement Document
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50">
            <span className="text-4xl mb-2" role="img" aria-label="upload">📄</span>
            <label className="bg-blue-600 text-white px-4 py-2 rounded mb-2 font-medium cursor-pointer hover:bg-blue-700">
              Choose Final Agreement
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </label>
            <p className="text-xs text-gray-500 text-center">
              PDF, DOCX, JPG, JPEG, PNG (Max 10MB)
            </p>
          </div>
        </div>

        {selectedFile && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm font-medium text-green-800">
                Selected: {selectedFile.name}
              </span>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Upload & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

function HistoryModal({ open, onClose, history }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
        <h3 className="text-lg font-bold mb-2">Progress History</h3>
        <ul className="max-h-48 overflow-y-auto text-sm">
          {history.length === 0 ? <li className="text-gray-400">No history yet.</li> :
            history.map((h, i) => (
              <li key={i} className="mb-1"><span className="font-semibold">{h.date}:</span> {h.text}</li>
            ))}
        </ul>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function DetailsModal({ open, onClose, agreement }) {
  if (!open || !agreement) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[400px] max-w-lg">
        <h3 className="text-xl font-bold mb-4">Agreement Details</h3>
        <div className="space-y-2 text-sm">
          <div><b>ID:</b> {agreement.id}</div>
          <div><b>Client:</b> {agreement.client}</div>
          <div><b>Location:</b> {agreement.location}</div>
          <div><b>Site:</b> {agreement.site}</div>
          <div><b>City:</b> {agreement.city}</div>
          <div><b>State:</b> {agreement.state}</div>
          <div><b>WO / PO / LOI:</b> {agreement.wo}</div>
          <div><b>Priority:</b> {priorityBadge(agreement.priority)}</div>
          <div><b>Checker:</b> {agreement.checker}</div>
          <div><b>Entity Type:</b> {agreement.entityType}</div>
          <div><b>Date:</b> {agreement.date}</div>
          <div><b>Status:</b> {agreement.status}</div>
          <div><b>Important Clauses:</b> {agreement.importantClauses}</div>
        </div>
        <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function AgreementTable({ agreements = [], onStatusUpdate }) {
  const [filters, setFilters] = useState({ client: "", city: "", state: "" });
  const [showFinalUpload, setShowFinalUpload] = useState(null);
  
  // Transform agreement data from form structure to table structure
  const transformedData = agreements.map((agreement, index) => {
    // Extract WO/PO/LOI information from uploadStatuses
    const woPoLoiInfo = [];
    if (agreement.uploadStatuses?.WO?.uploaded) woPoLoiInfo.push("WO");
    if (agreement.uploadStatuses?.PO?.uploaded) woPoLoiInfo.push("PO");
    if (agreement.uploadStatuses?.LOI?.uploaded) woPoLoiInfo.push("LOI");
    const woPoLoiText = woPoLoiInfo.length > 0 ? woPoLoiInfo.join(" / ") : "None uploaded";
    
    // Extract important clauses (first 3 clauses as summary)
    const importantClauses = agreement.clauses 
      ? agreement.clauses.slice(0, 3).map(clause => clause.title).join(", ")
      : "No clauses";
    
    // Get the first site as primary location, others as additional info
    const primarySite = agreement.selectedSites?.[0] || "Not specified";
    const additionalSites = agreement.selectedSites?.slice(1) || [];
    
    // Calculate priority based on days since submission (like in dashboard)
    const submittedDate = new Date(agreement.submittedDate);
    const daysDiff = Math.floor((new Date() - submittedDate) / (1000 * 60 * 60 * 24));
    let priority = "Low";
    if (daysDiff > 5) priority = "High";
    else if (daysDiff >= 3) priority = "Medium";

    return {
      id: agreement.id || `AGR${String(index + 1).padStart(3, '0')}`,
      client: agreement.selectedClient || "Unknown Client",
      location: primarySite, // Using first site as location
      site: primarySite,
      city: primarySite, // Using site as city for now
      state: "Not specified", // This info isn't captured in form, keeping as placeholder
      wo: woPoLoiText,
      priority: agreement.priority || priority, // Use agreement priority if available, otherwise calculate
      checker: agreement.submittedBy || "Unknown",
      entityType: agreement.entityType || "single",
      date: agreement.submittedDate || new Date().toISOString().split('T')[0],
      status: agreement.status || "Pending Review",
      importantClauses: importantClauses,
      finalAgreement: agreement.finalAgreement || null,
      originalAgreement: agreement, // Keep reference to original data
      progress: {
        executionPending: { text: "", date: "", history: [] },
        executed: { text: "", date: "", history: [] },
        underProcess: { text: "", date: "", history: [] },
        completed: { text: "", date: "", history: [] },
      },
    };
  });

  const [data, setData] = useState(transformedData);
  const [modal, setModal] = useState({ open: false, history: [] });
  const [details, setDetails] = useState({ open: false, agreement: null });

  // Update data when agreements prop changes
  React.useEffect(() => {
    setData(transformedData);
  }, [agreements]);

  // Get unique values for dropdowns
  const uniqueClients = [ ...new Set(data.map(row => row.client)) ];
  const uniqueCities = [ ...new Set(data.map(row => row.city)) ];
  const uniqueStates = [ ...new Set(data.map(row => row.state)) ];

  const handleProgressChange = (rowIdx, stage, field, value) => {
    setData(prev => prev.map((row, i) =>
      i === rowIdx
        ? { ...row, progress: { ...row.progress, [stage]: { ...row.progress[stage], [field]: value } } }
        : row
    ));
  };

  const handlePriorityChange = (rowIdx, newPriority) => {
    setData(prev => prev.map((row, i) =>
      i === rowIdx ? { ...row, priority: newPriority } : row
    ));
    
    // Update the original agreement data if onStatusUpdate is provided
    const agreement = data[rowIdx];
    if (onStatusUpdate && agreement.originalAgreement.id) {
      // You might want to create a separate callback for priority updates
      // For now, we'll update the priority in the local data
    }
  };

  const handleStatusChange = (rowIdx, newStatus) => {
    const agreement = data[rowIdx];
    
    // Check if this requires final agreement upload
    if (newStatus === "Upload Final Agreement") {
      setShowFinalUpload(agreement.id);
      return;
    }

    // For direct status changes (like Rejected)
    setData(prev => prev.map((row, i) =>
      i === rowIdx ? { ...row, status: newStatus } : row
    ));
    
    // Update the agreement status using the onStatusUpdate callback
    if (onStatusUpdate && agreement.originalAgreement.id) {
      const approvedDate = newStatus !== "Pending Review" ? new Date().toISOString().split('T')[0] : null;
      onStatusUpdate(agreement.originalAgreement.id, newStatus, approvedDate);
    }
  };

  // Handler for final agreement upload
  const handleFinalAgreementUpload = (agreementId, file) => {
    // Update local data with final agreement
    setData(prev => prev.map(row => 
      row.id === agreementId 
        ? { 
            ...row, 
            status: "Final Agreement Uploaded",
            finalAgreement: file 
          }
        : row
    ));
    
    // Update the agreement in parent state
    if (onStatusUpdate) {
      const approvedDate = new Date().toISOString().split('T')[0];
      onStatusUpdate(agreementId, "Final Agreement Uploaded", approvedDate, file);
    }
    
    setShowFinalUpload(null);
  };

  // Handler for completion status
  const handleCompletionStatusChange = (rowIdx, newStatus) => {
    const agreement = data[rowIdx];
    
    setData(prev => prev.map((row, i) =>
      i === rowIdx ? { ...row, status: newStatus } : row
    ));
    
    // Update the agreement status using the onStatusUpdate callback
    if (onStatusUpdate && agreement.originalAgreement.id) {
      const completedDate = new Date().toISOString().split('T')[0];
      onStatusUpdate(agreement.originalAgreement.id, newStatus, completedDate);
    }
  };
  
  const handleSaveHistory = (rowIdx, stage) => {
    setData(prev => prev.map((row, i) => {
      if (i !== rowIdx) return row;
      const { text, date, history } = row.progress[stage];
      if (!text && !date) return row;
      return {
        ...row,
        progress: {
          ...row.progress,
          [stage]: {
            text: "",
            date: "",
            history: [...history, { text, date: date || new Date().toISOString().slice(0, 10) }],
          },
        },
      };
    }));
  };

  // Filtering logic (dropdowns)
  const filtered = data.filter(row =>
    (!filters.client || row.client === filters.client) &&
    (!filters.city || row.city === filters.city) &&
    (!filters.state || row.state === filters.state)
  );

  // Export Excel
  const handleExportExcel = () => {
    const exportData = filtered.map((row, i) => ({
      "Sr. No": i + 1,
      "Client Name": row.client,
      "Client Site": row.site,
      "WO / PO / LOI / Email": row.wo,
      "Entity Type": row.entityType,
      "Submitted Date": row.date,
      "Important Clauses": row.importantClauses,
      "Final Agreement": row.finalAgreement ? row.finalAgreement.name : "Not uploaded",
      "Execution Pending": row.progress.executionPending.text,
      "Executed": row.progress.executed.text,
      "Underprocess with Client": row.progress.underProcess.text,
      Completed: row.progress.completed.text,
      Priority: row.priority,
      Status: row.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agreements");
    XLSX.writeFile(wb, "agreements.xlsx");
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const columns = [
      "Sr. No", "Client Name", "Client Site", "WO / PO / LOI / Email", "Entity Type",
      "Submitted Date", "Important Clauses", "Final Agreement", "Execution Pending", "Executed", "Underprocess with Client", 
      "Completed", "Priority", "Status"
    ];
    const rows = filtered.map((row, i) => [
      i + 1,
      row.client,
      row.site,
      row.wo,
      row.entityType,
      row.date,
      row.importantClauses,
      row.finalAgreement ? row.finalAgreement.name : "Not uploaded",
      row.progress.executionPending.text,
      row.progress.executed.text,
      row.progress.underProcess.text,
      row.progress.completed.text,
      row.priority,
      row.status,
    ]);
    autoTable(doc, { head: [columns], body: rows, styles: { fontSize: 6 } });
    doc.save("agreements.pdf");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex gap-4 mb-6">
        <button className="bg-white border px-4 py-2 rounded shadow-sm flex items-center gap-2" onClick={handleExportExcel}><span>⬇️</span> Export Excel</button>
        <button className="bg-white border px-4 py-2 rounded shadow-sm flex items-center gap-2" onClick={handleExportPDF}><span>⬇️</span> Export PDF</button>
      </div>
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <div className="flex flex-wrap gap-4 mb-4">
          <select className="border rounded px-3 py-2 text-sm" value={filters.client} onChange={e => setFilters(f => ({ ...f, client: e.target.value }))}>
            <option value="">All Clients</option>
            {uniqueClients.map(client => <option key={client} value={client}>{client}</option>)}
          </select>
          <select className="border rounded px-3 py-2 text-sm" value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}>
            <option value="">All Cities</option>
            {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
          <select className="border rounded px-3 py-2 text-sm" value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}>
            <option value="">All States</option>
            {uniqueStates.map(state => <option key={state} value={state}>{state}</option>)}
          </select>
        </div>
        <h2 className="text-xl font-bold mb-2">Agreements ({filtered.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                <th className="px-4 py-3 font-semibold text-left">Sr. No</th>
                <th className="px-4 py-3 font-semibold text-left">Client Name</th>
                <th className="px-4 py-3 font-semibold text-left">Client Site</th>
                <th className="px-4 py-3 font-semibold text-left">WO / PO / LOI / Email</th>
                <th className="px-4 py-3 font-semibold text-left">Entity Type</th>
                <th className="px-4 py-3 font-semibold text-left">Submitted Date</th>
                <th className="px-4 py-3 font-semibold text-left">Important Clauses</th>
                <th className="px-4 py-3 font-semibold text-left">Final Agreement</th>
                <th className="px-4 py-3 font-semibold text-left">Execution Pending</th>
                <th className="px-4 py-3 font-semibold text-left">Executed</th>
                <th className="px-4 py-3 font-semibold text-left">Underprocess with Client</th>
                <th className="px-4 py-3 font-semibold text-left">Completed</th>
                <th className="px-4 py-3 font-semibold text-left">Priority</th>
                <th className="px-4 py-3 font-semibold text-left">Status</th>
                <th className="px-4 py-3 font-semibold text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="15" className="px-4 py-8 text-center text-gray-500">
                    No agreements submitted yet. Agreements submitted by checkers will appear here.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-gray-50 hover:bg-blue-100"}>
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold">{row.client}</td>
                    <td className="px-4 py-3">{row.site}</td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <DocumentLinks 
                        uploadStatuses={row.originalAgreement.uploadStatuses || {}}
                        documents={[
                          { type: 'WO', label: 'WO' },
                          { type: 'PO', label: 'PO' },
                          { type: 'LOI', label: 'LOI' },
                          { type: 'Email', label: 'Email' }
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3">{row.entityType}</td>
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3 min-w-[150px]">
                      <ClauseLinks 
                        clauses={row.originalAgreement.clauses || []}
                        uploadStatuses={row.originalAgreement.uploadStatuses || {}}
                      />
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      {row.finalAgreement ? (
                        <FileLink 
                          file={row.finalAgreement} 
                          label="Final Agreement" 
                          type="final"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">Not uploaded</span>
                      )}
                    </td>
                    {/* Progress columns */}
                    {["executionPending", "executed", "underProcess", "completed"].map(stage => (
                      <td className="px-4 py-3 min-w-[180px]" key={stage}>
                        <textarea
                          className="border rounded w-full p-1 text-xs mb-1 focus:ring-2 focus:ring-blue-300"
                          placeholder="Enter progress"
                          value={row.progress[stage].text}
                          onChange={e => handleProgressChange(i, stage, "text", e.target.value)}
                          rows={2}
                        />
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="date"
                            className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-300"
                            value={row.progress[stage].date}
                            onChange={e => handleProgressChange(i, stage, "date", e.target.value)}
                          />
                          <button
                            className="text-blue-600 underline text-xs"
                            onClick={() => setModal({ open: true, history: row.progress[stage].history })}
                            type="button"
                          >
                            ▶ View History
                          </button>
                          <button
                            className="ml-auto px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            onClick={() => handleSaveHistory(i, stage)}
                            type="button"
                          >Save</button>
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <select
                        value={row.priority}
                        onChange={e => handlePriorityChange(i, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-bold border-0 focus:ring-2 focus:ring-blue-300 ${
                          row.priority === "High" ? "bg-red-100 text-red-700" :
                          row.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "Final Agreement Uploaded" ? (
                        // Step 2: After final agreement is uploaded
                        <select
                          value={row.status}
                          onChange={e => handleCompletionStatusChange(i, e.target.value)}
                          className="px-2 py-1 rounded-full text-xs font-bold border-0 focus:ring-2 focus:ring-blue-300 bg-purple-100 text-purple-700"
                        >
                          <option value="Final Agreement Uploaded">Final Agreement Uploaded</option>
                          <option value="Approved">Mark as Approved</option>
                          <option value="Completed">Mark as Completed</option>
                        </select>
                      ) : (
                        // Step 1: Initial status options
                        <select
                          value={row.status}
                          onChange={e => handleStatusChange(i, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-bold border-0 focus:ring-2 focus:ring-blue-300 ${
                            row.status === "Approved" ? "bg-green-100 text-green-700" :
                            row.status === "Completed" ? "bg-green-200 text-green-800" :
                            row.status === "Rejected" ? "bg-red-100 text-red-700" :
                            "bg-orange-100 text-orange-700"
                          }`}
                        >
                          <option value="Pending Review">Pending Review</option>
                          <option value="Upload Final Agreement">Upload Final Agreement</option>
                          <option value="Rejected">Reject</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-xl hover:bg-blue-100 rounded-full p-2 transition" title="View" onClick={() => setDetails({ open: true, agreement: row })}><span role="img" aria-label="eye">👁️</span></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final Agreement Upload Modal */}
      {showFinalUpload && (
        <FinalAgreementUpload
          agreementId={showFinalUpload}
          onUpload={handleFinalAgreementUpload}
          onCancel={() => setShowFinalUpload(null)}
        />
      )}

      <HistoryModal open={modal.open} onClose={() => setModal({ open: false, history: [] })} history={modal.history} />
      <DetailsModal open={details.open} onClose={() => setDetails({ open: false, agreement: null })} agreement={details.agreement} />
    </div>
  );
}
