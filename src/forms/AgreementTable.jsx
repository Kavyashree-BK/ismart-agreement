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



// Agreement Details Modal with Actions
function DetailsModal({ open, onClose, agreement, onPriorityChange, onStatusChange, onFinalAgreementUpload }) {
  const [localPriority, setLocalPriority] = useState(agreement?.priority || "Low");
  const [localStatus, setLocalStatus] = useState(agreement?.status || "Execution Pending");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (agreement) {
      setLocalPriority(agreement.priority || "Low");
      setLocalStatus(agreement.status || "Execution Pending");
      setSelectedFile(null);
      setUploadError("");
    }
  }, [agreement]);

  if (!open || !agreement) return null;

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

  const handleApprove = () => {
    if (selectedFile) {
      setIsUploading(true);
      setTimeout(() => {
        onFinalAgreementUpload(agreement.id, selectedFile);
        onStatusChange(agreement.id, "Under Process with Client");
        setIsUploading(false);
        onClose();
      }, 1000);
    } else {
      // Move to next status in progression
      const currentStatus = agreement.status || "Execution Pending";
      let nextStatus = "Execution Pending";
      
      if (currentStatus === "Execution Pending") {
        nextStatus = "Executed";
      } else if (currentStatus === "Executed") {
        nextStatus = "Under Process with Client";
      } else if (currentStatus === "Under Process with Client") {
        nextStatus = "Under Process with Client"; // Stay at final status
      }
      
      onStatusChange(agreement.id, nextStatus);
      onClose();
    }
  };

  const handleReject = () => {
    // Reset to Execution Pending on reject
    onStatusChange(agreement.id, "Execution Pending");
    onClose();
  };

  const handleSaveChanges = () => {
    onPriorityChange(agreement.id, localPriority);
    onStatusChange(agreement.id, localStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[500px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Agreement Details - {agreement.id}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>
        
        <p className="text-gray-600 text-sm mb-6">Review and approve the agreement</p>

        {/* Agreement Information */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div><b>Client:</b><br/>{agreement.client}</div>
          <div><b>Site:</b><br/>{agreement.site}</div>
          <div><b>City:</b><br/>{agreement.city}</div>
          <div><b>State:</b><br/>Maharashtra</div>
          <div><b>Checker:</b><br/>{agreement.checker}</div>
          <div><b>Entity Type:</b><br/>{agreement.entityType}</div>
        </div>

        {/* Priority and Status Controls */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={localPriority}
              onChange={(e) => setLocalPriority(e.target.value)}
              className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-300"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={localStatus}
              onChange={(e) => setLocalStatus(e.target.value)}
              className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-300"
            >
              <option value="Execution Pending">Execution Pending</option>
              <option value="Executed">Executed</option>
              <option value="Under Process with Client">Under Process with Client</option>
            </select>
          </div>
        </div>

        {/* Upload Final Agreement */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Final Agreement *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50">
            <span className="text-4xl mb-2">📄</span>
            <label className="bg-black text-white px-4 py-2 rounded mb-2 font-medium cursor-pointer hover:bg-gray-800">
              Choose File
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </label>
            <p className="text-xs text-gray-500 text-center">
              or drag and drop your file here<br/>
              Max size: 10MB • Allowed: .pdf,.docx,.jpg,.jpeg,.png
            </p>
          </div>

          {selectedFile && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm font-medium text-green-800">
                  Selected: {selectedFile.name}
                </span>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSaveChanges}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Save Changes
          </button>
          <button
            onClick={handleReject}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset to Pending
          </button>
          <button
            onClick={handleApprove}
            disabled={isUploading}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? "Processing..." : "Move to Next Stage"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgreementTable({ agreements = [], onStatusUpdate }) {
  const [filters, setFilters] = useState({ 
    client: "", 
    city: "", 
    state: "", 
    fromDate: "", 
    toDate: "" 
  });
  const [showFinalUpload, setShowFinalUpload] = useState(null);
  
  // Function to determine which status should be shown based on progression
  const getCurrentStatus = (agreement) => {
    // Default to "Execution Pending" if no status is set
    if (!agreement.status) {
      return "Execution Pending";
    }
    
    // If status is "Execution Pending", show only that
    if (agreement.status === "Execution Pending") {
      return "Execution Pending";
    }
    
    // If status is "Executed", show only that
    if (agreement.status === "Executed") {
      return "Executed";
    }
    
    // If status is "Under Process with Client", show only that
    if (agreement.status === "Under Process with Client") {
      return "Under Process with Client";
    }
    
    // Default fallback
    return "Execution Pending";
  };
  
  // Transform agreement data from form structure to table structure
  const transformedData = agreements.map((agreement, index) => {
    // Extract WO/PO/LOI information from uploadStatuses
    const woPoLoiInfo = [];
    if (agreement.uploadStatuses?.WO?.uploaded) woPoLoiInfo.push("WO");
    if (agreement.uploadStatuses?.PO?.uploaded) woPoLoiInfo.push("PO");
    if (agreement.uploadStatuses?.LOI?.uploaded) woPoLoiInfo.push("LOI");
    if (agreement.uploadStatuses?.EmailApproval?.uploaded) woPoLoiInfo.push("Email Approval");
    const woPoLoiText = woPoLoiInfo.length > 0 ? woPoLoiInfo.join(" / ") : "None uploaded";
    
    // Extract important clauses (first 3 clauses as summary)
    const importantClauses = agreement.clauses 
      ? agreement.clauses.slice(0, 3).map(clause => clause.title).join(", ")
      : "No clauses";
    
    // Join all selected branches with commas to display all branches
    const allBranches = (agreement.selectedBranches && agreement.selectedBranches.length > 0) 
      ? agreement.selectedBranches.map(branch => branch.name).join(", ") 
      : "Not specified";
    
    // Calculate priority based on days since submission (like in dashboard)
    const submittedDate = new Date(agreement.submittedDate);
    const daysDiff = Math.floor((new Date() - submittedDate) / (1000 * 60 * 60 * 24));
    let priority = "Low";
    if (daysDiff > 5) priority = "High";
    else if (daysDiff >= 3) priority = "Medium";

    return {
      id: agreement.id || `AGR${String(index + 1).padStart(3, '0')}`,
      client: agreement.selectedClient || "Unknown Client",
      location: allBranches, // Using all branches as location
      site: allBranches,
      city: allBranches, // Using all branches as city for now
      state: "Not specified", // This info isn't captured in form, keeping as placeholder
      wo: woPoLoiText,
      priority: agreement.priority || priority, // Use agreement priority if available, otherwise calculate
      checker: agreement.submittedBy || "Unknown",
      entityType: agreement.entityType || "single",
      date: agreement.submittedDate || new Date().toISOString().split('T')[0],
      status: getCurrentStatus(agreement),
      importantClauses: importantClauses,
      finalAgreement: agreement.finalAgreement || null,
      originalAgreement: agreement, // Keep reference to original data
    };
  });

  const [data, setData] = useState(transformedData);
  const [details, setDetails] = useState({ open: false, agreement: null });

  // Update data when agreements prop changes
  React.useEffect(() => {
    setData(transformedData);
  }, [agreements]);

  // Get unique values for dropdowns
  const uniqueClients = [ ...new Set(data.map(row => row.client)) ];
  const uniqueCities = [ ...new Set(data.map(row => row.city)) ];
  const uniqueStates = [ ...new Set(data.map(row => row.state)) ];



  const handlePriorityChange = (agreementId, newPriority) => {
    setData(prev => prev.map(row =>
      row.id === agreementId ? { ...row, priority: newPriority } : row
    ));
    
    // Update the original agreement data if onStatusUpdate is provided
    if (onStatusUpdate) {
      onStatusUpdate(agreementId, null, null, null, newPriority);
    }
  };

  const handleStatusChange = (agreementId, newStatus) => {
    // Update local data
    setData(prev => prev.map(row =>
      row.id === agreementId ? { ...row, status: newStatus } : row
    ));
    
    // Update the agreement status using the onStatusUpdate callback
    if (onStatusUpdate) {
      const approvedDate = newStatus !== "Execution Pending" ? new Date().toISOString().split('T')[0] : null;
      onStatusUpdate(agreementId, newStatus, approvedDate);
    }
  };

  const handleFinalAgreementUploadFromModal = (agreementId, file) => {
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


  


  // Filtering logic (dropdowns and date range)
  const filtered = data.filter(row => {
    // Client, city, state filters
    const clientMatch = !filters.client || row.client === filters.client;
    const cityMatch = !filters.city || row.city === filters.city;
    const stateMatch = !filters.state || row.state === filters.state;
    
    // Date range filter
    let dateMatch = true;
    if (filters.fromDate || filters.toDate) {
      const rowDate = new Date(row.date);
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;
      
      if (fromDate && toDate) {
        dateMatch = rowDate >= fromDate && rowDate <= toDate;
      } else if (fromDate) {
        dateMatch = rowDate >= fromDate;
      } else if (toDate) {
        dateMatch = rowDate <= toDate;
      }
    }
    
    return clientMatch && cityMatch && stateMatch && dateMatch;
  });

     // Export Excel
   const handleExportExcel = () => {
     const exportData = filtered.map((row, i) => ({
       "Sr. No": i + 1,
       "Client Name": row.client,
       "Client Site": row.site,
       "WO / PO / LOI": row.wo,
       "Entity Type": row.entityType,
       "Submitted Date": row.date,
       "Important Clauses": row.importantClauses,
       Priority: row.priority,
       Status: row.status,
     }));
     const ws = XLSX.utils.json_to_sheet(exportData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Agreements");
     
     // Generate filename with date range if specified
     let filename = "agreements";
     if (filters.fromDate || filters.toDate) {
       const fromDateStr = filters.fromDate ? filters.fromDate.replace(/-/g, '') : 'start';
       const toDateStr = filters.toDate ? filters.toDate.replace(/-/g, '') : 'end';
       filename += `_${fromDateStr}_to_${toDateStr}`;
     }
     filename += ".xlsx";
     
     XLSX.writeFile(wb, filename);
   };

     // Export PDF
   const handleExportPDF = () => {
     const doc = new jsPDF();
     const columns = [
       "Sr. No", "Client Name", "Client Site", "WO / PO / LOI", "Entity Type",
       "Submitted Date", "Important Clauses", "Priority", "Status"
     ];
     const rows = filtered.map((row, i) => [
       i + 1,
       row.client,
       row.site,
       row.wo,
       row.entityType,
       row.date,
       row.importantClauses,
       row.priority,
       row.status,
     ]);
     autoTable(doc, { head: [columns], body: rows, styles: { fontSize: 6 } });
     
     // Generate filename with date range if specified
     let filename = "agreements";
     if (filters.fromDate || filters.toDate) {
       const fromDateStr = filters.fromDate ? filters.fromDate.replace(/-/g, '') : 'start';
       const toDateStr = filters.toDate ? filters.toDate.replace(/-/g, '') : 'end';
       filename += `_${fromDateStr}_to_${toDateStr}`;
     }
     filename += ".pdf";
     
     doc.save(filename);
   };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex gap-4 mb-6">
        <button className="bg-white border px-4 py-2 rounded shadow-sm flex items-center gap-2" onClick={handleExportExcel}><span>⬇️</span> Export Excel</button>
        <button className="bg-white border px-4 py-2 rounded shadow-sm flex items-center gap-2" onClick={handleExportPDF}><span>⬇️</span> Export PDF</button>
        <div className="text-sm text-gray-600 flex items-center">
          💡 Use date filters above to export agreements within a specific date range
        </div>
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
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From Date:</label>
            <input
              type="date"
              className="border rounded px-3 py-2 text-sm"
              value={filters.fromDate}
              onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To Date:</label>
            <input
              type="date"
              className="border rounded px-3 py-2 text-sm"
              value={filters.toDate}
              onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))}
            />
          </div>
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            onClick={() => setFilters({ client: "", city: "", state: "", fromDate: "", toDate: "" })}
          >
            Clear Filters
          </button>
        </div>
        
        {/* Filter Summary */}
        {(filters.client || filters.city || filters.state || filters.fromDate || filters.toDate) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Active Filters:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {filters.client && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Client: {filters.client}
                  </span>
                )}
                {filters.city && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    City: {filters.city}
                  </span>
                )}
                {filters.state && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    State: {filters.state}
                  </span>
                )}
                {filters.fromDate && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    From: {new Date(filters.fromDate).toLocaleDateString()}
                  </span>
                )}
                {filters.toDate && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    To: {new Date(filters.toDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        <h2 className="text-xl font-bold mb-2">Agreements ({filtered.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                                 <th className="px-4 py-3 font-semibold text-left">Sr. No</th>
                 <th className="px-4 py-3 font-semibold text-left">Client Name</th>
                 <th className="px-4 py-3 font-semibold text-left">Client Site</th>
                 <th className="px-4 py-3 font-semibold text-left">WO / PO / LOI</th>
                 <th className="px-4 py-3 font-semibold text-left">Entity Type</th>
                 <th className="px-4 py-3 font-semibold text-left">Submitted Date</th>
                 <th className="px-4 py-3 font-semibold text-left">Important Clauses</th>
                 <th className="px-4 py-3 font-semibold text-left">Priority</th>
                 <th className="px-4 py-3 font-semibold text-left">Status</th>
                 <th className="px-4 py-3 font-semibold text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                                 <tr>
                   <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
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
                                                                                   <td className="px-4 py-3">
                        {priorityBadge(row.priority)}
                      </td>
                                          <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.status === "Execution Pending" ? "bg-yellow-100 text-yellow-700" :
                          row.status === "Executed" ? "bg-blue-100 text-blue-700" :
                          row.status === "Under Process with Client" ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                                         <td className="px-4 py-3 text-center">
                       <button 
                         className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition" 
                         title="Review & Take Action" 
                         onClick={() => setDetails({ open: true, agreement: row })}
                       >
                         Review
                       </button>
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


       <DetailsModal 
         open={details.open} 
         onClose={() => setDetails({ open: false, agreement: null })} 
         agreement={details.agreement}
         onPriorityChange={handlePriorityChange}
         onStatusChange={handleStatusChange}
         onFinalAgreementUpload={handleFinalAgreementUploadFromModal}
       />
    </div>
  );
}
