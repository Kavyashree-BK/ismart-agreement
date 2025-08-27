import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AddendumTable = ({ addendums = [], onStatusUpdate, onEditAddendum, userRole = "checker" }) => {
  const [filters, setFilters] = useState({ 
    parentAgreement: "", 
    status: "", 
    fromDate: "", 
    toDate: "",
    search: ""
  });
  const [details, setDetails] = useState({ open: false, addendum: null });


  // Transform addendum data for table display
  const transformedData = addendums.map((addendum, index) => {
    return {
      id: addendum.id || `ADD${String(index + 1).padStart(3, '0')}`,
      title: addendum.title || "Untitled Addendum",
      parentAgreement: addendum.parentAgreementTitle || "Unknown Agreement",
      parentAgreementId: addendum.parentAgreementId,
      description: addendum.description || "No description provided",
      reason: addendum.reason || "No reason provided",
      impact: addendum.impact || "No impact assessment",
      effectiveDate: addendum.effectiveDate ? new Date(addendum.effectiveDate).toLocaleDateString() : "Not specified",
      submittedDate: addendum.submittedDate ? new Date(addendum.submittedDate).toLocaleDateString() : "Not specified",
      submittedBy: addendum.submittedBy || "Unknown",
      status: addendum.status || "Pending Review",
      uploadedFiles: addendum.uploadedFiles || {},
      originalAddendum: addendum // Keep reference to original data
    };
  });

  const [data, setData] = useState(transformedData);

  // Update data when addendums prop changes
  useEffect(() => {
    setData(transformedData);
  }, [addendums, transformedData]);

  // Get unique values for dropdowns
  const uniqueParentAgreements = [...new Set(data.map(row => row.parentAgreement))];
  const uniqueStatuses = [...new Set(data.map(row => row.status))];

  const handleStatusChange = (addendumId, newStatus) => {
    setData(prev => prev.map(row => 
      row.id === addendumId ? { ...row, status: newStatus } : row
    ));

    if (onStatusUpdate) {
      onStatusUpdate(addendumId, newStatus);
    }
  };

  const handleEditAddendum = (addendum) => {
    if (onEditAddendum) {
      onEditAddendum(addendum.originalAddendum);
    }
  };

  // Filtering logic
  const filtered = data.filter(row => {
    const parentAgreementMatch = !filters.parentAgreement || row.parentAgreement === filters.parentAgreement;
    const statusMatch = !filters.status || row.status === filters.status;
    const searchMatch = !filters.search || 
      row.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      row.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      row.reason.toLowerCase().includes(filters.search.toLowerCase());
    
    let dateMatch = true;
    if (filters.fromDate || filters.toDate) {
      const submittedDate = new Date(row.originalAddendum.submittedDate);
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;
      
      if (fromDate && toDate) {
        dateMatch = submittedDate >= fromDate && submittedDate <= toDate;
      } else if (fromDate) {
        dateMatch = submittedDate >= fromDate;
      } else if (toDate) {
        dateMatch = submittedDate <= toDate;
      }
    }
    
    return parentAgreementMatch && statusMatch && searchMatch && dateMatch;
  });

  // Export Excel
  const handleExportExcel = () => {
    const exportData = filtered.map((row, i) => ({
      "Sr. No": i + 1,
      "Addendum Title": row.title,
      "Parent Agreement": row.parentAgreement,
      "Description": row.description,
      "Reason": row.reason,
      "Effective Date": row.effectiveDate,
      "Submitted Date": row.submittedDate,
      "Status": row.status,
      "Submitted By": row.submittedBy
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Addendums");
    
    let filename = "addendums";
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
      "Sr. No", "Addendum Title", "Parent Agreement", "Description", 
      "Effective Date", "Status", "Submitted By"
    ];
    const rows = filtered.map((row, i) => [
      i + 1,
      row.title,
      row.parentAgreement,
      row.description.length > 30 ? row.description.substring(0, 30) + "..." : row.description,
      row.effectiveDate,
      row.status,
      row.submittedBy
    ]);
    
    autoTable(doc, { head: [columns], body: rows, styles: { fontSize: 6 } });
    
    let filename = "addendums";
    if (filters.fromDate || filters.toDate) {
      const fromDateStr = filters.fromDate ? filters.fromDate.replace(/-/g, '') : 'start';
      const toDateStr = filters.toDate ? filters.toDate.replace(/-/g, '') : 'end';
      filename += `_${fromDateStr}_to_${toDateStr}`;
    }
    filename += ".pdf";
    
    doc.save(filename);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusStyle = (status) => {
      switch (status) {
        case "Pending Review":
          return "bg-yellow-100 text-yellow-700";
        case "Approved":
          return "bg-green-100 text-green-700";
        case "Rejected":
          return "bg-red-100 text-red-700";
        case "Under Review":
          return "bg-blue-100 text-blue-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(status)}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex gap-4 mb-6">
        <button 
          className="bg-white border px-4 py-2 rounded shadow-sm flex items-center gap-2" 
          onClick={handleExportExcel}
        >
          <span>⬇️</span> Export Excel
        </button>
        <button 
          className="bg-white border px-4 py-2 rounded shadow-sm flex items-center gap-2" 
          onClick={handleExportPDF}
        >
          <span>⬇️</span> Export PDF
        </button>
        <div className="text-sm text-gray-600 flex items-center">
          💡 Use filters above to export addendums within specific criteria
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <select 
            className="border rounded px-3 py-2 text-sm" 
            value={filters.parentAgreement} 
            onChange={e => setFilters(f => ({ ...f, parentAgreement: e.target.value }))}
          >
            <option value="">All Parent Agreements</option>
            {uniqueParentAgreements.map(agreement => (
              <option key={agreement} value={agreement}>{agreement}</option>
            ))}
          </select>
          
          <select 
            className="border rounded px-3 py-2 text-sm" 
            value={filters.status} 
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
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
          
          <input
            type="text"
            placeholder="Search addendums..."
            className="border rounded px-3 py-2 text-sm"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
          
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            onClick={() => setFilters({ parentAgreement: "", status: "", fromDate: "", toDate: "", search: "" })}
          >
            Clear Filters
          </button>
        </div>
        
        {/* Filter Summary */}
        {(filters.parentAgreement || filters.status || filters.fromDate || filters.toDate || filters.search) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Active Filters:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {filters.parentAgreement && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Parent Agreement: {filters.parentAgreement}
                  </span>
                )}
                {filters.status && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Status: {filters.status}
                  </span>
                )}
                {filters.search && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Search: "{filters.search}"
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
        
        <h2 className="text-xl font-bold mb-2">Addendums ({filtered.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                <th className="px-4 py-3 font-semibold text-left">Sr. No</th>
                <th className="px-4 py-3 font-semibold text-left">Addendum Title</th>
                <th className="px-4 py-3 font-semibold text-left">Parent Agreement</th>
                <th className="px-4 py-3 font-semibold text-left">Description</th>
                <th className="px-4 py-3 font-semibold text-left">Effective Date</th>
                <th className="px-4 py-3 font-semibold text-left">Status</th>
                <th className="px-4 py-3 font-semibold text-left">Documents</th>
                <th className="px-4 py-3 font-semibold text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No addendums found. Addendums created by checkers will appear here.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-gray-50 hover:bg-blue-100"}>
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold max-w-[200px]">
                      <div className="truncate" title={row.title}>{row.title}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[150px]">
                      <div className="truncate" title={row.parentAgreement}>{row.parentAgreement}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="truncate" title={row.description}>{row.description}</div>
                    </td>
                    <td className="px-4 py-3">{row.effectiveDate}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <div className="flex flex-col gap-1">
                        {/* Debug: Show what files we have */}
                        <div className="text-xs text-gray-500 mb-1">
                          Files: {Object.keys(row.uploadedFiles || {}).length}
                        </div>
                        
                        {Object.entries(row.uploadedFiles || {}).map(([type, file]) => {
                          console.log('Rendering document:', type, file); // Debug log
                          return (
                            <div key={type} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">{type}:</span>
                              <span
                                onClick={() => {
                                  console.log('Document clicked:', type, file); // Debug log
                                  
                                  if (file.isDemo) {
                                    // Handle demo files
                                    alert(`📄 Demo File: ${file.name}\n\nThis is a demo file. In a real application, this would open the actual document.`);
                                  } else if (file.file) {
                                    // Handle real files with File object
                                    try {
                                      const url = URL.createObjectURL(file.file);
                                      console.log('Opening file URL:', url);
                                      window.open(url, '_blank');
                                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                                    } catch (error) {
                                      console.error('Error opening file:', error);
                                      alert('Error opening file: ' + error.message);
                                    }
                                  } else if (file.url) {
                                    // Handle files with URL
                                    window.open(file.url, '_blank');
                                  } else {
                                    // Fallback for unknown file types
                                    alert(`📄 File: ${file.name || type}\n\nFile type not supported for opening.`);
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 underline text-xs font-medium cursor-pointer transition-colors"
                                title={`Click to open ${file.name || type} in new tab`}
                              >
                                Open Document
                              </span>
                            </div>
                          );
                        })}
                        {Object.keys(row.uploadedFiles || {}).length === 0 && (
                          <span className="text-gray-400 text-xs">No documents</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2">
                        <button 
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition" 
                          title="View Details" 
                          onClick={() => setDetails({ open: true, addendum: row })}
                        >
                          👁️ View
                        </button>
                        {/* Edit Button - ONLY for Checkers and ONLY when Pending Review */}
                        {userRole === "Checker" && row.status === "Pending Review" && (
                          <button 
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition" 
                            title="Edit Addendum (Checker Only - Pending Review)" 
                            onClick={() => handleEditAddendum(row)}
                          >
                            ✏️ Edit
                          </button>
                        )}
                        
                        {/* Status Change Button - ONLY for Approvers */}
                        {userRole === "Approver" && (
                          <button 
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition" 
                            title="Change Status (Approver Only)" 
                            onClick={() => {
                              const newStatus = row.status === "Pending Review" ? "Under Review" : 
                                              row.status === "Under Review" ? "Approved" : "Pending Review";
                              handleStatusChange(row.id, newStatus);
                            }}
                          >
                            🔄 Status
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Addendum Details Modal */}
      {details.open && details.addendum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[600px] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">📝 Addendum Details</h3>
              <button
                onClick={() => setDetails({ open: false, addendum: null })}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">📋 Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Addendum ID:</span> {details.addendum.id}</div>
                  <div><span className="font-medium">Title:</span> {details.addendum.title}</div>
                  <div><span className="font-medium">Parent Agreement:</span> {details.addendum.parentAgreement}</div>
                  <div><span className="font-medium">Status:</span> 
                    <span className="ml-2">
                      <StatusBadge status={details.addendum.status} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">📅 Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Effective Date:</span> {details.addendum.effectiveDate}</div>
                  <div><span className="font-medium">Submitted:</span> {details.addendum.submittedDate}</div>
                  <div><span className="font-medium">Submitted By:</span> {details.addendum.submittedBy}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">📝 Description</h4>
              <p className="text-sm text-gray-700">{details.addendum.description}</p>
            </div>

            {/* Reason and Impact */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">❓ Reason</h4>
                <p className="text-sm text-gray-700">{details.addendum.reason}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">📊 Impact Assessment</h4>
                <p className="text-sm text-gray-700">{details.addendum.impact}</p>
              </div>
            </div>

            {/* Documents */}
            <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">📎 Uploaded Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {Object.entries(details.addendum.uploadedFiles).map(([type, file]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${file.uploaded ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    {file.uploaded && (
                      <span
                        onClick={() => {
                          console.log('Document clicked in modal:', type, file); // Debug log
                          
                          if (file.isDemo) {
                            // Handle demo files
                            alert(`📄 Demo File: ${file.name}\n\nThis is a demo file. In a real application, this would open the actual document.`);
                          } else if (file.file) {
                            // Handle real files with File object
                            try {
                              const url = URL.createObjectURL(file.file);
                              console.log('Opening file URL:', url);
                              window.open(url, '_blank');
                              setTimeout(() => URL.revokeObjectURL(url), 1000);
                            } catch (error) {
                              console.error('Error opening file:', error);
                              alert('Error opening file: ' + error.message);
                            }
                          } else if (file.url) {
                            // Handle files with URL
                            window.open(file.url, '_blank');
                          } else {
                            // Fallback for unknown file types
                            alert(`📄 File: ${file.name || type}\n\nFile type not supported for opening.`);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 underline text-xs font-medium cursor-pointer transition-colors"
                        title={`Click to open ${file.name || type} in new tab`}
                      >
                        Open Document
                      </span>
                    )}
                  </div>
                ))}
                {Object.keys(details.addendum.uploadedFiles).length === 0 && (
                  <div className="text-gray-500">No documents uploaded</div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setDetails({ open: false, addendum: null })}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddendumTable;
