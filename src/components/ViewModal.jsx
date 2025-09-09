import React from "react";
import { useDispatch } from "react-redux";
import { setViewModal } from "../slice/uiSlice";

const ViewModal = ({ open, agreement, onClose }) => {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setViewModal({ open: false, agreement: null }));
  };

  const handleDownload = () => {
    try {
      // Create a comprehensive document with all agreement details
      const downloadContent = generateAgreementDocument(agreement);
      const filename = `Agreement_${agreement.selectedClient || agreement.id}_${new Date().toISOString().split('T')[0]}.txt`;
      
      downloadDocument(downloadContent, filename);
      
      // Show success feedback
      console.log(`Download started: ${filename}`);
      
      // Optional: You could add a toast notification here
      // alert(`Download started: ${filename}`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const generateAgreementDocument = (agreement) => {
    const content = [];
    
    // Header
    content.push("=".repeat(60));
    content.push("AGREEMENT DETAILS");
    content.push("=".repeat(60));
    content.push("");
    
    // Basic Information
    content.push("BASIC INFORMATION");
    content.push("-".repeat(30));
    content.push(`Client Name: ${agreement.selectedClient || "Not specified"}`);
    content.push(`Branches: ${(() => {
      if (!agreement.selectedBranches || agreement.selectedBranches.length === 0) {
        return "Not specified";
      }
      return agreement.selectedBranches.map(branch => 
        typeof branch === 'string' ? branch : branch.name
      ).join(", ");
    })()}`);
    content.push(`Status: ${agreement.status || "Pending Review"}`);
    content.push(`Submitted Date: ${agreement.submittedDate ? new Date(agreement.submittedDate).toLocaleDateString() : "Not specified"}`);
    content.push(`End Date: ${agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : "Not specified"}`);
    content.push("");
    
    // Contact Information
    content.push("CONTACT INFORMATION");
    content.push("-".repeat(30));
    content.push(`Client Email: ${agreement.contactInfo?.clientEmail || "N/A"}`);
    content.push(`Client Phone: ${agreement.contactInfo?.clientPhone || "N/A"}`);
    content.push(`I Smart Email: ${agreement.contactInfo?.email || "N/A"}`);
    content.push(`I Smart Phone: ${agreement.contactInfo?.phone || "N/A"}`);
    content.push("");
    
    // Important Clauses
    const clausesWithContent = (agreement.importantClauses || []).filter(clause => 
      clause.content || clause.placeholder || clause.file
    );
    
    if (clausesWithContent.length > 0) {
      content.push("IMPORTANT CLAUSES");
      content.push("-".repeat(30));
      clausesWithContent.forEach((clause, index) => {
        content.push(`${index + 1}. ${clause.title || `Clause ${index + 1}`}`);
        if (clause.content) {
          content.push(`   Content: ${clause.content}`);
        }
        if (clause.placeholder && !clause.content) {
          content.push(`   Details: ${clause.placeholder}`);
        }
        if (clause.file) {
          content.push(`   Document: ${clause.file.name} (${clause.file.size ? `${(clause.file.size / 1024).toFixed(1)} KB` : 'Unknown size'})`);
        }
        content.push("");
      });
    }
    
    // Uploaded Documents
    const uploadStatuses = agreement.uploadStatuses || {};
    const documentTypes = ['LOI', 'WO', 'PO', 'EmailApproval'];
    const uploadedDocuments = documentTypes.filter(docType => {
      const uploadStatus = uploadStatuses[docType];
      return uploadStatus?.uploaded === true;
    });
    
    if (uploadedDocuments.length > 0) {
      content.push("UPLOADED DOCUMENTS");
      content.push("-".repeat(30));
      uploadedDocuments.forEach(docType => {
        content.push(`• ${docType}: Uploaded`);
      });
      content.push("");
    }
    
    // Footer
    content.push("=".repeat(60));
    content.push(`Generated on: ${new Date().toLocaleString()}`);
    content.push("=".repeat(60));
    
    return content.join("\n");
  };

  const downloadDocument = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!open || !agreement) return null;

  // Debug: Log the agreement data structure
  console.log("=== VIEW MODAL DEBUG ===");
  console.log("agreement:", agreement);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header - Exact match to image */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">
            Agreement Details - {agreement.selectedClient || agreement.id}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Exact match to image layout */}
        <div className="p-6">
          {/* Basic Information Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Name</label>
                <p className="mt-1 text-sm text-gray-900">{agreement.selectedClient || "Not specified"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Branches</label>
                <p className="mt-1 text-sm text-gray-900">
                  {(() => {
                    const branches = agreement.selectedBranches;
                    if (branches && Array.isArray(branches)) {
                      return branches.map(branch => branch.name || branch).join(", ");
                    }
                    return "Not specified";
                  })()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  agreement.status === "Approved" ? "bg-green-100 text-green-800" :
                  agreement.status === "Execution Pending" ? "bg-yellow-100 text-yellow-800" :
                  agreement.status === "Under Review" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {agreement.status || "Pending Review"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Submitted Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {agreement.submittedDate ? new Date(agreement.submittedDate).toLocaleDateString() : "Not specified"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Client Email</h4>
                <p className="text-sm text-gray-900">{agreement.contactInfo?.clientEmail || agreement.clientEmail || "N/A"}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Client Phone</h4>
                <p className="text-sm text-gray-900">{agreement.contactInfo?.clientPhone || agreement.clientPhone || "N/A"}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">I Smart Email</h4>
                <p className="text-sm text-gray-900">{agreement.contactInfo?.email || "N/A"}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">I Smart Phone</h4>
                <p className="text-sm text-gray-900">{agreement.contactInfo?.phone || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Agreement Details */}
          {agreement.agreementDetails && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreement Details</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(agreement.agreementDetails, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Important Clauses Section - Display only clauses with content or files */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Clauses</h3>
            <div className="space-y-4">
              {(() => {
                const clauses = agreement.importantClauses || [];
                
                // Filter to only show clauses that have content, placeholder, or files
                const clausesWithContent = clauses.filter(clause => 
                  clause.content || clause.placeholder || clause.file
                );
                
                if (clausesWithContent.length === 0) {
                  return (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">No important clauses specified</p>
                    </div>
                  );
                }
                
                return clausesWithContent.map((clause, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{clause.title || `Clause ${index + 1}`}</h4>
                      <div className="mt-2">
                        {clause.content && (
                          <p className="text-sm text-gray-700 mb-2">{clause.content}</p>
                        )}
                        {clause.placeholder && !clause.content && (
                          <p className="text-sm text-gray-700 mb-2">{clause.placeholder}</p>
                        )}
                        {clause.file && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-green-700 font-medium">
                              {clause.file.name || 'Document uploaded'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({clause.file.size ? `${(clause.file.size / 1024).toFixed(1)} KB` : 'Unknown size'})
                            </span>
                            {clause.file.dataUrl && (
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = clause.file.dataUrl;
                                  link.download = clause.file.name;
                                  link.click();
                                }}
                                className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Download
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </div>

          {/* Documents Section - Display only uploaded documents */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
            <div className="space-y-2">
              {(() => {
                const uploadStatuses = agreement.uploadStatuses || {};
                const documentTypes = ['LOI', 'WO', 'PO', 'EmailApproval'];
                
                // Filter to only show uploaded documents
                const uploadedDocuments = documentTypes.filter(docType => {
                  const uploadStatus = uploadStatuses[docType];
                  return uploadStatus?.uploaded === true;
                });
                
                if (uploadedDocuments.length === 0) {
                  return (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-500">No documents uploaded</p>
                    </div>
                  );
                }
                
                return uploadedDocuments.map((docType, index) => {
                  const uploadStatus = uploadStatuses[docType];
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-800">{docType}</span>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                        Uploaded
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Footer - Functional Download and Close buttons */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <button 
            onClick={handleDownload}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </button>
          <button
            onClick={handleClose}
            className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;

