import React, { useState, useEffect, useRef } from "react";
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
    <span
      onClick={handleFileClick}
      className="text-blue-600 hover:text-blue-800 underline text-xs font-medium cursor-pointer transition-colors"
      title={`Click to view ${file.name} in new tab`}
    >
      {label}
    </span>
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

// Component to render clause document links with addendum modification indicators
const ClauseLinks = ({ clauses, uploadStatuses, addendums = [], agreementId, onShowClauseHistory }) => {
  // Get all addendums for this agreement
  const agreementAddendums = addendums.filter(addendum => 
    addendum.parentAgreementId === agreementId
  );

  // Create a map of clause modifications by clause index
  const clauseModifications = {};
  agreementAddendums.forEach(addendum => {
    if (addendum.clauseModifications) {
      addendum.clauseModifications.forEach(mod => {
        const clauseIndex = parseInt(mod.clauseNumber) - 1; // Convert to 0-based index
        if (!clauseModifications[clauseIndex]) {
          clauseModifications[clauseIndex] = [];
        }
        clauseModifications[clauseIndex].push({
          ...mod,
          addendumId: addendum.id,
          addendumTitle: addendum.title,
          addendumStatus: addendum.status,
          addendumDate: addendum.submittedDate
        });
      });
    }
  });

  const clauseLinks = clauses
    .map((clause, index) => ({
      title: clause.title,
      file: uploadStatuses[`clause-${index}`]?.file,
      index,
      modifications: clauseModifications[index] || []
    }))
    .filter(clause => clause.file); // Only show clauses with uploaded files

  if (clauseLinks.length === 0) {
    return <span className="text-gray-400 text-xs">No documents uploaded</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {clauseLinks.map(clause => (
        <div key={clause.index} className="relative group">
          <div className="flex items-center gap-2">
            <FileLink 
              file={clause.file} 
              label={clause.title.length > 20 ? `${clause.title.substring(0, 20)}...` : clause.title}
              type={`clause-${clause.index}`}
            />
            
            {/* Addendum Modification Badges */}
            {clause.modifications.length > 0 && (
              <div className="flex items-center gap-1">
                {clause.modifications.map((mod, modIndex) => (
                  <div key={modIndex} className="relative">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium cursor-help ${
                        mod.modificationType === "Modified" ? "bg-orange-100 text-orange-700 border border-orange-200" :
                        mod.modificationType === "Added" ? "bg-green-100 text-green-700 border border-green-200" :
                        mod.modificationType === "Removed" ? "bg-red-100 text-red-700 border border-red-200" :
                        "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                      title={`${mod.modificationType} by Addendum #${mod.addendumId}`}
                    >
                      {mod.modificationType === "Modified" ? "🔄 Modified" :
                       mod.modificationType === "Added" ? "➕ New" :
                       mod.modificationType === "Removed" ? "❌ Removed" :
                       "📝 Changed"}
                    </span>
                    
                    {/* Hover Tooltip with Detailed Information */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 min-w-[200px]">
                      <div className="text-center mb-2 font-medium">
                        {mod.modificationType} Clause
                      </div>
                      <div className="space-y-1 text-left">
                        <div><strong>Addendum:</strong> #{mod.addendumId}</div>
                        <div><strong>Title:</strong> {mod.addendumTitle}</div>
                        <div><strong>Status:</strong> {mod.addendumStatus}</div>
                        <div><strong>Date:</strong> {new Date(mod.addendumDate).toLocaleDateString()}</div>
                        <div><strong>Details:</strong> {mod.details}</div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                ))}
                
                {/* View History Button */}
                <button
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 cursor-pointer transition-colors"
                  title="View clause history"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show clause history modal or expand details
                    onShowClauseHistory(clause.index, clause.title, clause.modifications);
                  }}
                >
                  📋
                </button>
              </div>
            )}
          </div>
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



// Status History Modal
function StatusHistoryModal({ open, onClose, history, title }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[500px] max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No status history available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    entry.status === "Execution Pending" ? "bg-yellow-100 text-yellow-700" :
                    entry.status === "Executed" ? "bg-blue-100 text-blue-700" :
                    entry.status === "Under Process with Client" ? "bg-purple-100 text-purple-700" :
                    entry.status === "Approved" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {entry.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-sm text-gray-700 mb-2">{entry.notes}</p>
                )}
                {entry.date && (
                  <p className="text-xs text-gray-500">Date: {entry.date}</p>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Agreement Details Modal with Actions
function DetailsModal({ open, onClose, agreement, onPriorityChange, onStatusChange, onFinalAgreementUpload, addendums = [], userRole = "checker", onAddendumStatusUpdate }) {
  const [localPriority, setLocalPriority] = useState(agreement?.priority || "Low");
  const [localStatus, setLocalStatus] = useState(agreement?.status || "Execution Pending");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState("agreement"); // "agreement" or "addendums"
  const [pendingStatusChanges, setPendingStatusChanges] = useState({}); // Track pending status changes for each addendum

  React.useEffect(() => {
    if (agreement) {
      setLocalPriority(agreement.priority || "Low");
      setLocalStatus(agreement.status || "Execution Pending");
      setSelectedFile(null);
      setUploadError("");
      setCurrentPage("agreement"); // Reset to agreement page when opening
    }
  }, [agreement]);

  if (!open || !agreement) return null;

  // Get addendums for this agreement
  const agreementAddendums = addendums.filter(addendum => 
    addendum.parentAgreementId === agreement.id
  );

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
        onStatusChange(agreement.id, "Approved");
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
        nextStatus = "Approved"; // Move to final status
      } else if (currentStatus === "Approved") {
        nextStatus = "Approved"; // Stay at final status
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
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[600px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Contract Details - {agreement.id}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>
        
        {/* Page Navigation */}
        <div className="flex items-center justify-between border-b border-gray-200 mb-6">
          <div className="flex items-center gap-4">
            <span className={`text-lg font-semibold ${currentPage === "agreement" ? "text-blue-600" : "text-gray-500"}`}>
              📋 Agreement Details
            </span>
            {agreementAddendums.length > 0 && (
              <span className={`text-lg font-semibold ${currentPage === "addendums" ? "text-blue-600" : "text-gray-500"}`}>
                📄 Addendums ({agreementAddendums.length})
              </span>
            )}
          </div>
          
          {/* Navigation Buttons */}
          {agreementAddendums.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage("agreement")}
                disabled={currentPage === "agreement"}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === "agreement"
                    ? "bg-blue-100 text-blue-700 cursor-default"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentPage("addendums")}
                disabled={currentPage === "addendums"}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === "addendums"
                    ? "bg-blue-100 text-blue-700 cursor-default"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Page Content */}
        {currentPage === "agreement" && (
          <>
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

            {/* Important Clauses Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Important Clauses</h4>
              <div className="space-y-2">
                {agreement.originalAgreement?.importantClauses && agreement.originalAgreement.importantClauses.length > 0 ? (
                  agreement.originalAgreement.importantClauses.map((clause, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                      <span className="text-blue-600">📋</span>
                      <span className="text-gray-800 text-sm">{clause}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No important clauses specified</span>
                )}
              </div>
            </div>

            {/* Priority and Status Controls */}
            {/* Priority and Status - Only for Approver Role */}
            {userRole?.toLowerCase() === "approver" && (
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
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>
            )}

            {/* Status Display for Checker Role */}
            {userRole?.toLowerCase() === "checker" && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <div className="w-full border rounded-md p-2 text-sm bg-gray-100 text-gray-600">
                    {agreement.priority || "Not Set"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="w-full border rounded-md p-2 text-sm bg-gray-100 text-gray-600">
                    {agreement.status || "Not Set"}
                  </div>
                </div>
              </div>
            )}

            {/* Upload Final Agreement - Only for Approver Role */}
            {userRole?.toLowerCase() === "approver" && (
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
            )}

            {/* Final Agreement Display for Checker Role */}
            {userRole?.toLowerCase() === "checker" && agreement.finalAgreement && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Final Agreement Document</label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-medium text-gray-800">{agreement.finalAgreement.name}</p>
                      <p className="text-sm text-gray-600">Uploaded by approver</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Only for Approver Role */}
            {userRole?.toLowerCase() === "approver" && (
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
            )}

            {/* Read-only Message for Checker Role */}
            {userRole?.toLowerCase() === "checker" && (
              <div className="text-center py-4 text-gray-600 bg-gray-50 rounded-lg border">
                <p className="text-sm">📋 You can view agreement details and addendums, but only approvers can modify status and priority.</p>
              </div>
            )}
          </>
        )}

        {currentPage === "addendums" && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm mb-6">View all addendums and modifications for this contract</p>
            
            {agreementAddendums.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-2 block">📄</span>
                <p className="text-lg font-medium">No addendums found</p>
                <p className="text-sm">This contract has no addendums or modifications yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agreementAddendums.map((addendum, index) => (
                  <div key={addendum.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xl text-blue-600">#{addendum.id}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          addendum.status === "Approved" ? "bg-green-100 text-green-700" :
                          addendum.status === "Rejected" ? "bg-red-100 text-red-700" :
                          addendum.status === "Under Review" ? "bg-blue-100 text-blue-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {addendum.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        📅 {new Date(addendum.submittedDate).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-6 mb-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Title:</span>
                        <p className="text-gray-800 mt-1">{addendum.title}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Submitted By:</span>
                        <p className="text-gray-800 mt-1">👤 {addendum.submittedBy}</p>
                      </div>
                    </div>
                    
                    {/* Summary of Changes */}
                    <div className="mb-4">
                      <span className="font-semibold text-gray-700 text-sm">Summary of Changes:</span>
                      <p className="text-gray-800 mt-1 text-sm leading-relaxed">{addendum.description}</p>
                    </div>
                    
                    {/* Clause Modifications */}
                    {addendum.clauseModifications && addendum.clauseModifications.length > 0 && (
                      <div className="mb-4">
                        <span className="font-semibold text-gray-700 text-sm">Clause Modifications:</span>
                        <div className="mt-2 space-y-2">
                          {addendum.clauseModifications.map((mod, modIndex) => (
                            <div key={modIndex} className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-400">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-800 text-sm">Clause {mod.clauseNumber}: {mod.details}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  mod.modificationType === "Modified" ? "bg-orange-100 text-orange-700" :
                                  mod.modificationType === "New" ? "bg-green-100 text-green-700" :
                                  mod.modificationType === "Removed" ? "bg-red-100 text-red-700" :
                                  "bg-blue-100 text-blue-700"
                                }`}>
                                  {mod.modificationType === "Modified" ? "🔄 Modified" :
                                   mod.modificationType === "New" ? "➕ New" :
                                   mod.modificationType === "Removed" ? "❌ Removed" :
                                   "📝 Changed"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Documents Section */}
                    {addendum.uploadedFiles && Object.keys(addendum.uploadedFiles).length > 0 && (
                      <div className="mb-4">
                        <span className="font-semibold text-gray-700 text-sm">Documents:</span>
                        <div className="mt-2 space-y-2">
                          {Object.entries(addendum.uploadedFiles).map(([key, file]) => (
                            <div key={key} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <span className="text-gray-600 text-sm font-medium">{key}:</span>
                                <span className="text-gray-800 text-sm">{file.name}</span>
                              </div>
                              <span
                                onClick={() => {
                                  if (file.isDemo) {
                                    alert("This is a demo file and cannot be opened.");
                                  } else if (file.url) {
                                    window.open(file.url, '_blank');
                                  } else if (file instanceof File) {
                                    const url = URL.createObjectURL(file);
                                    window.open(url, '_blank');
                                  }
                                }}
                                className={`text-sm cursor-pointer transition-colors font-medium ${
                                  file.isDemo 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-blue-600 hover:text-blue-800 underline'
                                }`}
                                title={file.isDemo ? 'Demo file - cannot be opened' : 'Click to open in new tab'}
                              >
                                {file.isDemo ? 'Demo File' : 'Open Document'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Status Change Section - Only for Approvers */}
                      {userRole?.toLowerCase() === "approver" && (
                      <div className="border-t border-gray-200 pt-4 mb-4">
                        <h5 className="font-semibold text-gray-800 mb-3 text-sm">Change Status</h5>
                        
                        <div className="space-y-3 mb-3">
                          <div className="flex items-center gap-3">
                            <select
                              className="border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 min-w-[140px]"
                              value={pendingStatusChanges[addendum.id] || addendum.status}
                              onChange={(e) => {
                                // Just update the local state, don't submit yet
                                setPendingStatusChanges(prev => ({
                                  ...prev,
                                  [addendum.id]: e.target.value
                                }));
                              }}
                            >
                              <option value="Pending">⏳ Pending</option>
                              <option value="Approved">✅ Approved</option>
                              <option value="Rejected">❌ Rejected</option>
                            </select>
                            
                            {pendingStatusChanges[addendum.id] && pendingStatusChanges[addendum.id] !== addendum.status && (
                          <button
                                onClick={() => {
                                  const addendumId = addendum.id;
                                  const newStatus = pendingStatusChanges[addendum.id];
                                  console.log('Status change confirmed:', addendumId, newStatus);
                                  if (onAddendumStatusUpdate) {
                                    onAddendumStatusUpdate(addendumId, newStatus);
                                    // Clear pending change
                                    setPendingStatusChanges(prev => {
                                      const updated = { ...prev };
                                      delete updated[addendum.id];
                                      return updated;
                                    });
                                    // Modal stays open - user must manually close
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                Save Status
                          </button>
                            )}
                          
                          <button
                              onClick={onClose}
                              className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                            >
                              Close
                          </button>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          Current Status: <span className="font-semibold">{addendum.status}</span>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <p className="text-blue-800 text-xs">
                            💡 Select a new status from the dropdown above, then click "Save Status" to apply the change. Use "Close" to exit.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                          <button
                        onClick={() => handleViewAddendum(addendum)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 cursor-pointer transition-colors"
                        title="Click to view full addendum details"
                      >
                        👁️ View Full Details
                          </button>
                    </div>
                  </div>
                ))}
                        </div>
                      )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgreementTable({ agreements = [], addendums = [], onStatusUpdate, onAddendumStatusUpdate, userRole = "checker", onCreateAddendum }) {
  const [filters, setFilters] = useState({ 
    client: "", 
    city: "", 
    state: "", 
    fromDate: "", 
    toDate: "",
    addendumsFilter: "all" // "all", "with", "without"
  });
  const [showFinalUpload, setShowFinalUpload] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState({}); // State to track dropdown open/close for addendums
  const [addendumDetailsModal, setAddendumDetailsModal] = useState({ open: false, addendum: null }); // State for addendum details modal
  const [clauseHistoryModal, setClauseHistoryModal] = useState({ open: false, clause: null, modifications: [] }); // State for clause history modal
  const [editingAddendum, setEditingAddendum] = useState(null); // State for editing addendum
  const [isEditing, setIsEditing] = useState(false); // State to track if we're in edit mode
  
  // Ref for dropdown container
  const dropdownRef = useRef(null);
  
  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Close all dropdowns
        setDropdownOpen({});
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
    
    // If status is "Approved", show only that (final status)
    if (agreement.status === "Approved") {
      return "Approved";
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
    const importantClauses = agreement.importantClauses && agreement.importantClauses.length > 0
      ? agreement.importantClauses.slice(0, 3).join(", ")
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

    // Calculate addendums count for this agreement
    const addendumsCount = addendums.filter(addendum => 
      addendum.parentAgreementId === agreement.id
    ).length;

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
      addendumsCount, // Add addendums count
    };
  });

  const [data, setData] = useState(transformedData);
  const [details, setDetails] = useState({ open: false, agreement: null });
  const [statusHistoryModal, setStatusHistoryModal] = useState({ open: false, history: [], title: "" });

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
    setData(prev => prev.map(row => {
      if (row.id === agreementId) {
        const history = row.statusHistory || [];
        const timestamp = new Date().toISOString();
        let notes = "";
        if (newStatus === "Approved") {
          notes = "Final approval granted by approver";
        } else if (newStatus === "Execution Pending") {
          notes = "Status reset to pending";
        } else {
          notes = `Status updated to ${newStatus}`;
        }
        const newHistoryEntry = {
          notes,
          date: new Date().toISOString().split('T')[0],
          timestamp,
          status: newStatus
        };
        return {
          ...row,
          status: newStatus,
          statusHistory: [...history, newHistoryEntry]
        };
      }
      return row;
    }));

    if (onStatusUpdate) {
      const approvedDate = newStatus !== "Execution Pending" ? new Date().toISOString().split('T')[0] : null;
      onStatusUpdate(agreementId, newStatus, approvedDate);
    }
  };

  // Handle status progress updates (notes, dates, history)
  const handleStatusProgressUpdate = (agreementId, field, value) => {
    setData(prev => prev.map(row => {
      if (row.id === agreementId) {
        return {
          ...row,
          statusProgress: {
            ...row.statusProgress,
            [field]: value
          }
        };
      }
      return row;
    }));
  };

  // Handle saving status progress to history
  const handleSaveStatusProgress = (agreementId) => {
    setData(prev => prev.map(row => {
      if (row.id === agreementId) {
        const currentProgress = row.statusProgress || {};
        const history = row.statusHistory || [];
        
        if (currentProgress.notes || currentProgress.date) {
          const newHistoryEntry = {
            notes: currentProgress.notes || "",
            date: currentProgress.date || new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            status: row.status
          };
          
          return {
            ...row,
            statusHistory: [...history, newHistoryEntry],
            statusProgress: { notes: "", date: "" } // Clear current progress
          };
        }
      }
      return row;
    }));
  };

  // Handle editing agreement
  const handleEditAgreement = (agreement) => {
    // This will open the agreement form in edit mode
    if (onCreateAddendum) {
      // We'll use the same callback but pass a flag to indicate edit mode
      onCreateAddendum(agreement, 'edit');
    }
  };

  // Handle creating new addendum
  const handleCreateAddendum = (agreement) => {
    if (onCreateAddendum) {
      onCreateAddendum(agreement, 'addendum');
    }
  };

  // Handle viewing status history
  const handleViewStatusHistory = (agreementId, clientName) => {
    const agreement = data.find(row => row.id === agreementId);
    if (agreement) {
      setStatusHistoryModal({
        open: true,
        history: agreement.statusHistory || [],
        title: `Status History - ${clientName}`
      });
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

  // Handler for viewing a specific addendum
  const handleViewAddendum = (addendum) => {
    console.log("Viewing addendum:", addendum);
    setAddendumDetailsModal({ open: true, addendum: addendum });
  };

  // Handler for viewing clause history
  const handleViewClauseHistory = (clauseIndex, clauseTitle, modifications) => {
    setClauseHistoryModal({ open: true, clause: { index: clauseIndex, title: clauseTitle }, modifications: modifications });
  };

  // Handler for editing addendum
  const handleEditAddendum = (addendum) => {
    setEditingAddendum({ ...addendum });
    setIsEditing(true);
  };

  // Handler for saving addendum changes
  const handleSaveAddendumChanges = () => {
    if (editingAddendum) {
      // Update the addendum in the addendums array
      const updatedAddendums = addendums.map(addendum => 
        addendum.id === editingAddendum.id ? editingAddendum : addendum
      );
      
      // Update local state
      setAddendumDetailsModal(prev => ({
        ...prev,
        addendum: editingAddendum
      }));
      
      // Close edit mode
      setIsEditing(false);
      setEditingAddendum(null);
      
      // Here you would typically call an API to save the changes
      console.log("Saving addendum changes:", editingAddendum);
    }
  };

  // Handler for canceling addendum edit
  const handleCancelAddendumEdit = () => {
    setIsEditing(false);
    setEditingAddendum(null);
  };


  // Filtering logic (dropdowns and date range)
  const filtered = data.filter(row => {
    // Role-based filtering - Show agreements for checker role (only their own)
    if (userRole?.toLowerCase() === "checker") {
      // For checker role, only show agreements they submitted
      return row.submittedBy === "checker";
    }
    
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
    
    // Addendums filter
    let addendumsMatch = true;
    if (filters.addendumsFilter === "with") {
      addendumsMatch = row.addendumsCount > 0;
    } else if (filters.addendumsFilter === "without") {
      addendumsMatch = row.addendumsCount === 0;
    }
    
    return clientMatch && cityMatch && stateMatch && dateMatch && addendumsMatch;
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
       "Addendums Count": row.addendumsCount,
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
       "Submitted Date", "Important Clauses", "Priority", "Status", "Addendums Count"
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
       row.addendumsCount,
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

  // Update data when agreements prop changes
  React.useEffect(() => {
    setData(transformedData);
  }, [agreements]);

  // Missing state variables that were removed
  const [progressNotes, setProgressNotes] = useState({});
  const [statusDates, setStatusDates] = useState({});

  // Missing helper functions that were removed
  const getAllBranches = (agreement) => {
    if (!agreement.selectedBranches || agreement.selectedBranches.length === 0) {
      return "Not specified";
    }
    return agreement.selectedBranches.map(branch => branch.name).join(", ");
  };

  const getDocumentStatus = (agreement, docType) => {
    if (!agreement.uploadStatuses || !agreement.uploadStatuses[docType] || !agreement.uploadStatuses[docType].uploaded) {
      return null;
    }
    
    return (
      <span className="text-blue-600 hover:text-blue-800 underline text-xs font-medium cursor-pointer transition-colors">
        {docType}
      </span>
    );
  };

  const getImportantClauses = (agreement) => {
    if (!agreement.importantClauses || agreement.importantClauses.length === 0) {
      return <span className="text-gray-400 text-xs">No clauses specified</span>;
    }
    
    return (
      <div className="space-y-1">
        {agreement.importantClauses.slice(0, 3).map((clause, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-blue-600 hover:text-blue-800 underline text-xs font-medium cursor-pointer transition-colors">
              {clause.title || clause}
            </span>
            {/* Addendum modification indicator */}
            {clause.modified && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                🔄 Modified
              </span>
            )}
            {/* Document icon */}
            <span className="text-gray-500 text-xs">📋</span>
          </div>
        ))}
      </div>
    );
  };

  // Handlers for progress notes and status dates
  const handleProgressNoteChange = (agreementId, value) => {
    setProgressNotes(prev => ({
      ...prev,
      [agreementId]: value
    }));
  };

  const handleStatusDateChange = (agreementId, value) => {
    setStatusDates(prev => ({
      ...prev,
      [agreementId]: value
    }));
  };

  const handleSaveProgress = (agreementId) => {
    console.log("Saving progress for agreement:", agreementId, {
      notes: progressNotes[agreementId],
      date: statusDates[agreementId]
    });
    alert("Progress saved successfully!");
  };

  // Handle addendum status updates
  const handleAddendumStatusUpdate = (addendumId, newStatus) => {
    console.log("Updating addendum status:", addendumId, "to:", newStatus);
    alert(`Addendum status updated to ${newStatus} successfully!`);
   };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Show export buttons for all roles now that checkers can see agreements */}
        <div className="flex gap-4 mb-6">
          <button className="bg-white border px-4 py-2 rounded shadow-sm flex items-center gap-2" onClick={handleExportExcel}><span>⬇️</span> Export Excel</button>
          <button className="bg-white border px-4 py-2 rounded shadow-sm flex items-center gap-2" onClick={handleExportPDF}><span>⬇️</span> Export PDF</button>
          <div className="text-sm text-gray-600 flex items-center">
            💡 Use date filters above to export agreements within a specific date range
          </div>
        </div>
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        {/* Show filters for all roles now that checkers can see agreements */}
        {userRole?.toLowerCase() === "checker" && (
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
            <select 
              className="border rounded px-3 py-2 text-sm" 
              value={filters.addendumsFilter} 
              onChange={e => setFilters(f => ({ ...f, addendumsFilter: e.target.value }))}
            >
              <option value="all">All Contracts</option>
              <option value="with">With Addendums</option>
              <option value="without">📄 Without Addendums</option>
            </select>
            
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              onClick={() => setFilters({ client: "", city: "", state: "", fromDate: "", toDate: "", addendumsFilter: "all" })}
            >
              Clear Filters
            </button>
          </div>
        )}
        
        {/* Filter Summary - Show for all roles now */}
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
                {filters.addendumsFilter !== "all" && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {filters.addendumsFilter === "with" ? "With Addendums" : "📄 Without Addendums"}
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
        
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {userRole?.toLowerCase() === "checker"
            ? `Agreements (${filtered.length} - Your Submissions)`
            : `Agreements (${filtered.length})`
          }
        </h2>
        
        {/* Show helpful message for checker role */}
        {userRole?.toLowerCase() === "checker" && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600">💡</span>
                <span className="font-medium">Information for Checker Role</span>
              </div>
              <p className="text-blue-700">
                You can view your submitted agreements below. Use the <strong>"Add Addendum"</strong> button to create modifications for existing agreements, 
                or use the <strong>"New Agreement"</strong> tab to create new agreements.
              </p>
            </div>
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <th className="px-6 py-4 font-semibold text-left text-gray-800">Sr. No</th>
                <th className="px-6 py-4 font-semibold text-left text-gray-800">Client Name</th>
                <th className="px-6 py-4 font-semibold text-left text-gray-800">Client Site</th>
                <th className="px-6 py-4 font-semibold text-left text-gray-800">WO / PO / LOI</th>
                <th className="px-6 py-4 font-semibold text-left text-gray-800">Entity Type</th>
                <th className="px-6 py-4 font-semibold text-left text-gray-800">Submitted Date</th>
                <th className="px-6 py-4 font-semibold text-left text-gray-800">Important Clauses</th>
                <th className="px-6 py-4 font-semibold text-left text-gray-800">Priority</th>
                <th className="px-6 py-4 font-semibold text-left text-gray-800">Status</th>
                <th className="px-6 py-4 font-semibold text-left text-gray-800">Addendums</th>
                <th className="px-6 py-4 font-semibold text-left text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                    <td colSpan="11" className="px-4 py-8 text-center text-gray-500">
                    {userRole?.toLowerCase() === "checker" 
                      ? "No agreements submitted yet. Use the 'New Agreement' tab to create your first agreement."
                      : "No agreements submitted yet. Agreements submitted by checkers will appear here."
                    }
                  </td>
                </tr>
              ) : (
                 filtered.map((row, i) => (
                   <tr key={row.id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 border-b border-gray-100 transition-colors`}>
                     <td className="px-6 py-4 text-center">{i + 1}</td>
                     <td className="px-6 py-4 font-semibold text-gray-800">{row.client}</td>
                     <td className="px-6 py-4 text-gray-700">{row.site}</td>
                     <td className="px-6 py-4 min-w-[120px]">
                       <DocumentLinks 
                         uploadStatuses={row.originalAgreement.uploadStatuses || {}}
                         documents={[
                           { type: 'WO', label: 'WO' },
                           { type: 'PO', label: 'PO' },
                           { type: 'LOI', label: 'LOI' },
                 
                         ]}
                       />
                     </td>
                     <td className="px-6 py-4 text-gray-700">{row.entityType}</td>
                     <td className="px-6 py-4 text-gray-700">{row.date}</td>
                     <td className="px-6 py-4 min-w-[150px]">
                       <ClauseLinks 
                         clauses={row.originalAgreement.clauses || []}
                         uploadStatuses={row.originalAgreement.uploadStatuses || {}}
                         addendums={addendums}
                         agreementId={row.id}
                         onShowClauseHistory={handleViewClauseHistory}
                       />
                     </td>
                     <td className="px-6 py-4">
                         {priorityBadge(row.priority)}
                       </td>
                     <td className="px-6 py-4 min-w-[200px]">
                         {/* Status Badge */}
                       <div className="mb-3">
                         <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                           row.status === "Execution Pending" ? "bg-yellow-100 text-yellow-700" :
                           row.status === "Executed" ? "bg-blue-100 text-blue-700" :
                           row.status === "Under Process with Client" ? "bg-purple-100 text-purple-700" :
                           row.status === "Approved" ? "bg-green-100 text-green-700" :
                           "bg-gray-100 text-gray-700"
                         }`}>
                           {row.status}
                         </span>
                         </div>
                         
                         {/* Status Progress Input - Only show for non-final statuses */}
                         {row.status !== "Approved" && (
                         <div className="space-y-3">
                             <textarea
                             className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                               placeholder="Enter progress notes..."
                               rows="2"
                               value={row.statusProgress?.notes || ""}
                               onChange={(e) => handleStatusProgressUpdate(row.id, "notes", e.target.value)}
                             />
                             
                             <div className="flex items-center gap-2">
                               <input
                                 type="date"
                               className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                                 value={row.statusProgress?.date || ""}
                                 onChange={(e) => handleStatusProgressUpdate(row.id, "date", e.target.value)}
                               />
                               <button
                               className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                                 onClick={() => handleSaveStatusProgress(row.id)}
                                 title="Save progress"
                               >
                                 Save
                               </button>
                             </div>
                             
                             <button
                             className="w-full text-blue-600 underline text-sm hover:text-blue-800 transition-colors"
                               onClick={() => handleViewStatusHistory(row.id, row.client)}
                               title="View status history"
                             >
                               ▶ View History ({row.statusHistory?.length || 0})
                             </button>
                           </div>
                         )}
                         
                         {/* Final Status Message for Approved */}
                         {row.status === "Approved" && (
                         <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                             ✓ Approved - No further action required
                           </div>
                         )}
                       </td>
                       
                       {/* Addendums Count Column */}
                     <td className="px-6 py-4 text-center">
                         {row.addendumsCount > 0 ? (
                           <div className="flex flex-col gap-2">
                             {/* Addendum Count Badge - NOT Clickable, Just Display */}
                             <div className="flex items-center justify-center gap-2">
                               <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                 {row.addendumsCount}
                               </span>

                               
                               {/* View Button - Shows dropdown for multiple addendums */}
                               {row.addendumsCount > 1 ? (
                                 <div className="relative" ref={dropdownRef}>
                                   <button
                                     onClick={() => {
                                       // Toggle dropdown for this row
                                       const newDropdownOpen = { ...dropdownOpen };
                                       newDropdownOpen[row.id] = !newDropdownOpen[row.id];
                                       setDropdownOpen(newDropdownOpen);
                                     }}
                                      className="p-1 text-gray-600 hover:text-gray-900 rounded-full transition-colors"
                                     title="Select addendum to view"
                                   >
                                      <span className="text-lg">👁️</span>
                                   </button>
                                   
                                   {/* Dropdown Menu */}
                                   {dropdownOpen[row.id] && (
                                     <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                                       <div className="p-2 border-b border-gray-200 bg-gray-50">
                                         <div className="text-xs font-medium text-gray-700">Select Addendum to View:</div>
                                       </div>
                                       <div className="max-h-48 overflow-y-auto">
                                         {addendums
                                           .filter(addendum => addendum.parentAgreementId === row.originalAgreement.id)
                                           .map((addendum, idx) => (
                                             <button
                                               key={addendum.id}
                                               onClick={() => {
                                                 // Handle addendum view action
                                                 handleViewAddendum(addendum);
                                                 // Close dropdown
                                                 const newDropdownOpen = { ...dropdownOpen };
                                                 newDropdownOpen[row.id] = false;
                                                 setDropdownOpen(newDropdownOpen);
                                               }}
                                               className="w-full text-left p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                             >
                                               <div className="flex items-center justify-between mb-1">
                                                 <span className="font-medium text-gray-800 text-xs">
                                                   #{addendum.id}
                                                 </span>
                                                 <span className={`px-1 py-0.5 rounded text-xs ${
                                                   addendum.status === "Approved" ? "bg-green-100 text-green-700" :
                                                   addendum.status === "Rejected" ? "bg-red-100 text-red-700" :
                                                   addendum.status === "Under Review" ? "bg-blue-100 text-blue-700" :
                                                   "bg-yellow-100 text-yellow-700"
                                                 }`}>
                                                   {addendum.status}
                                                 </span>
                                               </div>
                                               <div className="text-xs text-gray-600 truncate" title={addendum.title}>
                                                 {addendum.title}
                                               </div>
                                               <div className="text-xs text-gray-500">
                                                 📅 {new Date(addendum.submittedDate).toLocaleDateString()}
                                               </div>
                                             </button>
                                           ))}
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               ) : (
                                 /* Single addendum - direct view button */
                                 <button
                                   onClick={() => {
                                      const singleAddendum = addendums.find(addendum => 
                                       addendum.parentAgreementId === row.originalAgreement.id
                                     );
                                     if (singleAddendum) {
                                       handleViewAddendum(singleAddendum);
                                     }
                                   }}
                                    className="p-1 text-gray-600 hover:text-gray-900 rounded-full transition-colors"
                                   title="View addendum"
                                 >
                                    <span className="text-lg">👁️</span>
                                 </button>
                               )}
                             </div>
                           </div>
                         ) : (
                           <span className="text-gray-400 text-xs">0</span>
                         )}
                       </td>
                       
                     {/* Actions Column */}
                     <td className="px-6 py-4 text-center">
                       <div className="flex flex-col gap-3">
                            {/* Review Button - For both roles */}
                            <button 
                           className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors font-medium" 
                              title="Review & Take Action" 
                              onClick={() => setDetails({ open: true, agreement: row })}
                            >
                              Review
                            </button>
                            
                            {/* Edit Agreement Button - Only for Checker role */}
                            {userRole === "checker" && (
                              <button 
                             className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm hover:bg-orange-700 transition-colors font-medium" 
                                title="Edit Agreement" 
                                onClick={() => handleEditAgreement(row.originalAgreement)}
                              >
                             Edit
                              </button>
                            )}
                            
                            {/* Add Addendum Button - Only for Checker role */}
                            {userRole === "checker" && (
                              <button 
                             className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors font-medium" 
                                title="Create New Addendum" 
                                onClick={() => handleCreateAddendum(row.originalAgreement)}
                              >
                             Add Addendum
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
         addendums={addendums}
         userRole={userRole}
         onAddendumStatusUpdate={onAddendumStatusUpdate}
       />
       
       <StatusHistoryModal
         open={statusHistoryModal.open}
         onClose={() => setStatusHistoryModal({ open: false, history: [], title: "" })}
         history={statusHistoryModal.history}
         title={statusHistoryModal.title}
       />

        {/* Addendum Details Modal */}
        {addendumDetailsModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-[600px] max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">📄 Addendum Details - #{addendumDetailsModal.addendum.id}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600">Version:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      v{addendumDetailsModal.addendum.version || "1.0"}
                    </span>
                    {addendumDetailsModal.addendum.versionHistory && addendumDetailsModal.addendum.versionHistory.length > 0 && (
                      <span className="text-xs text-gray-500">
                        ({addendumDetailsModal.addendum.versionHistory.length} version{addendumDetailsModal.addendum.versionHistory.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setAddendumDetailsModal({ open: false, addendum: null })} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
              </div>
              
              <p className="text-gray-600 text-sm mb-6">Review and approve the addendum</p>

              {/* Addendum Information */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <b>Title:</b><br/>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingAddendum?.title || ""}
                      onChange={(e) => setEditingAddendum(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border rounded px-2 py-1 text-sm mt-1"
                    />
                  ) : (
                    addendumDetailsModal.addendum.title
                  )}
                </div>
                <div><b>Parent Agreement:</b><br/>{addendumDetailsModal.addendum.parentAgreementTitle || addendumDetailsModal.addendum.parentAgreementId}</div>
                <div><b>Submitted By:</b><br/>👤 {addendumDetailsModal.addendum.submittedBy}</div>
                <div><b>Submitted Date:</b><br/>📅 {new Date(addendumDetailsModal.addendum.submittedDate).toLocaleDateString()}</div>
                <div>
                  <b>Effective Date:</b><br/>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editingAddendum?.effectiveDate ? editingAddendum.effectiveDate.split('T')[0] : ""}
                      onChange={(e) => setEditingAddendum(prev => ({ ...prev, effectiveDate: e.target.value }))}
                      className="w-full border rounded px-2 py-1 text-sm mt-1"
                    />
                  ) : (
                    addendumDetailsModal.addendum.effectiveDate ? new Date(addendumDetailsModal.addendum.effectiveDate).toLocaleDateString() : 'Not specified'
                  )}
                </div>
                <div><b>Status:</b><br/>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    addendumDetailsModal.addendum.status === "Approved" ? "bg-green-100 text-green-700" :
                    addendumDetailsModal.addendum.status === "Rejected" ? "bg-red-100 text-red-700" :
                    addendumDetailsModal.addendum.status === "Under Review" ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {addendumDetailsModal.addendum.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">📝 Description</label>
                {isEditing ? (
                  <textarea
                    value={editingAddendum?.description || ""}
                    onChange={(e) => setEditingAddendum(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm resize-none"
                    rows="3"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded border text-sm">
                    {addendumDetailsModal.addendum.description}
                  </div>
                )}
              </div>

              {/* Reason and Impact */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Reason for Changes</label>
                  {isEditing ? (
                    <textarea
                      value={editingAddendum?.reason || ""}
                      onChange={(e) => setEditingAddendum(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm resize-none"
                      rows="3"
                    />
                  ) : (
                    <div className="bg-gray-50 p-3 rounded border text-sm">
                      {addendumDetailsModal.addendum.reason}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">⚡ Impact Assessment</label>
                  {isEditing ? (
                    <textarea
                      value={editingAddendum?.impact || ""}
                      onChange={(e) => setEditingAddendum(prev => ({ ...prev, impact: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm resize-none"
                      rows="3"
                    />
                  ) : (
                    <div className="bg-gray-50 p-3 rounded border text-sm">
                      {addendumDetailsModal.addendum.impact}
                    </div>
                  )}
                </div>
              </div>

              {/* Clause Modifications */}
              {addendumDetailsModal.addendum.clauseModifications && addendumDetailsModal.addendum.clauseModifications.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">📋 Clause Modifications</label>
                  <div className="bg-gray-50 p-3 rounded border">
                    {addendumDetailsModal.addendum.clauseModifications.map((mod, index) => (
                      <div key={index} className="mb-3 p-3 bg-white rounded border-l-4 border-blue-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">Clause {mod.clauseNumber}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              mod.modificationType === "Modified" ? "bg-orange-100 text-orange-700" :
                              mod.modificationType === "New" ? "bg-green-100 text-green-700" :
                              mod.modificationType === "Removed" ? "bg-red-100 text-red-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {mod.modificationType === "Modified" ? "🔄 Modified" :
                               mod.modificationType === "New" ? "➕ New" :
                               mod.modificationType === "Removed" ? "❌ Removed" :
                               "📝 Changed"}
                            </span>
                          </div>
                          <button
                            onClick={() => handleViewClauseHistory(mod.clauseNumber, mod.clauseTitle, [mod])}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 cursor-pointer transition-colors"
                            title="View History"
                          >
                            📋 History
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          <strong>Details:</strong> {mod.details}
                        </div>
                        {mod.previousValue && mod.newValue && (
                          <div className="text-xs text-gray-500">
                            <span className="line-through">{mod.previousValue}</span> → <span className="text-green-600">{mod.newValue}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Files */}
              {addendumDetailsModal.addendum.uploadedFiles && Object.keys(addendumDetailsModal.addendum.uploadedFiles).length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">📎 Uploaded Documents</label>
                  <div className="space-y-3">
                    {Object.entries(addendumDetailsModal.addendum.uploadedFiles).map(([key, file]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">{key}:</span>
                          <span className="text-sm text-gray-800 font-medium">{file.name}</span>
                        </div>
                        <span
                          onClick={() => {
                            if (file.isDemo) {
                              alert("This is a demo file and cannot be opened.");
                            } else if (file.url) {
                              window.open(file.url, '_blank');
                            } else if (file instanceof File) {
                              const url = URL.createObjectURL(file);
                              window.open(url, '_blank');
                            }
                          }}
                          className={`text-sm cursor-pointer transition-colors font-medium ${
                            file.isDemo 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-blue-600 hover:text-blue-800 underline'
                          }`}
                          title={file.isDemo ? 'Demo file - cannot be opened' : 'Click to open in new tab'}
                        >
                          {file.isDemo ? 'Demo File' : 'Open Document'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Version History */}
              {addendumDetailsModal.addendum.versionHistory && addendumDetailsModal.addendum.versionHistory.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔄 Version History</label>
                  <div className="bg-gray-50 p-3 rounded border max-h-48 overflow-y-auto">
                    {addendumDetailsModal.addendum.versionHistory.map((version, index) => (
                      <div key={index} className={`mb-3 p-3 bg-white rounded border-l-4 ${
                        version.type === 'addendum' ? 'border-blue-400' :
                        version.type === 'status_change' ? 'border-green-400' :
                        'border-gray-400'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">
                              v{version.versionNumber}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              version.type === 'addendum' ? 'bg-blue-100 text-blue-700' :
                              version.type === 'status_change' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {version.type === 'addendum' ? '📄 Addendum' :
                               version.type === 'status_change' ? '🔄 Status Change' :
                               '📝 Update'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            📅 {new Date(version.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          <strong>Description:</strong> {version.description}
                        </div>
                        {version.user && (
                          <div className="text-xs text-gray-500">
                            <strong>By:</strong> {version.user}
                          </div>
                        )}
                        {version.changes && (
                          <div className="text-xs text-gray-500">
                            <strong>Changes:</strong> {version.changes}
                          </div>
                        )}
                        {version.legalCompliance && (
                          <div className="text-xs text-gray-500 mt-1">
                            <strong>Risk Level:</strong> 
                            <span className={`ml-1 px-1 py-0.5 rounded text-xs ${
                              version.legalCompliance.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                              version.legalCompliance.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {version.legalCompliance.riskLevel}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Change Section - For Approvers */}
              {userRole?.toLowerCase() === "approver" && (
                <div className="mb-6 border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Change Addendum Status</h4>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <select
                      className="border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 min-w-[140px]"
                      value={pendingStatusChanges[addendumDetailsModal.addendum.id] || addendumDetailsModal.addendum.status}
                      onChange={(e) => {
                        // Just update the local state, don't submit yet
                        setPendingStatusChanges(prev => ({
                          ...prev,
                          [addendumDetailsModal.addendum.id]: e.target.value
                        }));
                      }}
                    >
                      <option value="Pending">⏳ Pending</option>
                      <option value="Approved">✅ Approved</option>
                      <option value="Rejected">❌ Rejected</option>
                    </select>
                    
                    {pendingStatusChanges[addendumDetailsModal.addendum.id] && pendingStatusChanges[addendumDetailsModal.addendum.id] !== addendumDetailsModal.addendum.status && (
                      <button
                        onClick={() => {
                          const addendumId = addendumDetailsModal.addendum.id;
                          const newStatus = pendingStatusChanges[addendumId];
                          console.log('Status change confirmed:', addendumId, newStatus);
                          if (onAddendumStatusUpdate) {
                            onAddendumStatusUpdate(addendumId, newStatus);
                            // Clear pending change
                            setPendingStatusChanges(prev => {
                              const updated = { ...prev };
                              delete updated[addendumId];
                              return updated;
                            });
                            // Modal stays open - user must manually close
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Save Status
                      </button>
                    )}
                    
                    <button
                      onClick={() => setAddendumDetailsModal({ open: false, addendum: null })}
                      className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                          </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    Current Status: <span className="font-semibold">{addendumDetailsModal.addendum.status}</span>
                        </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                      💡 Select a new status from the dropdown above, then click "Save Status" to apply the change. Use "Close" to exit.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                {(userRole?.toLowerCase() === "checker" || userRole?.toLowerCase() === "checker") && 
                 addendumDetailsModal.addendum.status !== "Approved" && 
                 addendumDetailsModal.addendum.status !== "Rejected" && (
                  <>
                    {!isEditing ? (
                      <button
                        onClick={() => handleEditAddendum(addendumDetailsModal.addendum)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        ✏️ Edit Addendum
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleCancelAddendumEdit}
                          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveAddendumChanges}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          💾 Save Changes
                        </button>
                      </>
                    )}
                  </>
                )}
                <button
                  onClick={() => setAddendumDetailsModal({ open: false, addendum: null })}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clause History Modal */}
        {clauseHistoryModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-[600px] max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Clause History - {clauseHistoryModal.clause.title}</h3>
                <button onClick={() => setClauseHistoryModal({ open: false, clause: null, modifications: [] })} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
              </div>
              
              <p className="text-gray-600 text-sm mb-6">View and manage modifications for this clause.</p>

              {clauseHistoryModal.modifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2 block">📄</span>
                  <p className="text-lg font-medium">No modifications recorded for this clause.</p>
                  <p className="text-sm">This clause has not been modified by any addendums.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clauseHistoryModal.modifications.map((mod, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">Addendum #{mod.addendumId}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(mod.addendumDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Type:</strong> {mod.modificationType}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Details:</strong> {mod.details}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setClauseHistoryModal({ open: false, clause: null, modifications: [] })}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
     </div>
   );
 }
