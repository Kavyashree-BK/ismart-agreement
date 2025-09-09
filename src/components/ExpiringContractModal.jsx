import React from "react";
import { useDispatch } from "react-redux";
import { setViewModal } from "../slice/uiSlice";

const ExpiringContractModal = ({ open, agreement, onClose }) => {
  const dispatch = useDispatch();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      dispatch(setViewModal({ open: false, agreement: null }));
    }
  };

  if (!open || !agreement) return null;

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [open]);

  // Calculate days until expiry
  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return 0;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilExpiry(agreement.endDate);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Exact match to image */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Agreement Details - {agreement.id}
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

        {/* Content - Two column layout like the image */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <p className="text-sm text-gray-900">{agreement.selectedClient || "Not specified"}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branches</label>
                <p className="text-sm text-gray-900">
                  {(() => {
                    if (!agreement.selectedBranches || agreement.selectedBranches.length === 0) {
                      return "Not specified";
                    }
                    return agreement.selectedBranches.map(branch => 
                      typeof branch === 'string' ? branch : branch.name
                    ).join(", ");
                  })()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Date</label>
                <p className="text-sm text-gray-900">
                  {agreement.submittedDate ? new Date(agreement.submittedDate).toLocaleDateString() : "Not specified"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Type</label>
                <p className="text-sm text-gray-900">{agreement.agreementType || "N/A"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Value</label>
                <p className="text-sm text-gray-900">
                  {agreement.totalValue ? `${agreement.currency || "USD"} ${agreement.totalValue.toLocaleString()}` : "N/A"}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                <p className="text-sm text-gray-900">{agreement.entityType || "N/A"}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approved Date</label>
                <p className="text-sm text-gray-900">{agreement.approvedDate ? new Date(agreement.approvedDate).toLocaleDateString() : "N/A"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <p className="text-sm text-gray-900">{agreement.priority || "N/A"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <p className="text-sm text-gray-900">{agreement.selectedDepartment || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Expiry Information */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Contract Expiry</h3>
                <p className="text-sm text-yellow-700">
                  Expires on {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : "Not specified"}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${
                  daysLeft <= 7 ? "text-red-600" :
                  daysLeft <= 15 ? "text-orange-600" :
                  "text-yellow-600"
                }`}>
                  {daysLeft} days left
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Download and Close buttons */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <button 
            onClick={() => {
              // Generate and download contract details
              const content = generateContractDocument(agreement);
              downloadDocument(content, `Contract_${agreement.selectedClient || agreement.id}_${new Date().toISOString().split('T')[0]}.txt`);
            }}
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

// Helper function to generate contract document
const generateContractDocument = (agreement) => {
  const content = [];
  
  content.push("=".repeat(60));
  content.push("EXPIRING CONTRACT DETAILS");
  content.push("=".repeat(60));
  content.push("");
  
  content.push("CONTRACT INFORMATION");
  content.push("-".repeat(30));
  content.push(`Client: ${agreement.selectedClient || "Not specified"}`);
  content.push(`Branches: ${(() => {
    if (!agreement.selectedBranches || agreement.selectedBranches.length === 0) {
      return "Not specified";
    }
    return agreement.selectedBranches.map(branch => 
      typeof branch === 'string' ? branch : branch.name
    ).join(", ");
  })()}`);
  content.push(`Status: ${agreement.status || "Pending Review"}`);
  content.push(`Entity Type: ${agreement.entityType || "N/A"}`);
  content.push(`Submitted Date: ${agreement.submittedDate ? new Date(agreement.submittedDate).toLocaleDateString() : "Not specified"}`);
  content.push(`Approved Date: ${agreement.approvedDate ? new Date(agreement.approvedDate).toLocaleDateString() : "N/A"}`);
  content.push(`End Date: ${agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : "Not specified"}`);
  
  const daysLeft = getDaysUntilExpiry(agreement.endDate);
  content.push(`Days Until Expiry: ${daysLeft}`);
  content.push("");
  
  content.push("=".repeat(60));
  content.push(`Generated on: ${new Date().toLocaleString()}`);
  content.push("=".repeat(60));
  
  return content.join("\n");
};

// Helper function to calculate days until expiry
const getDaysUntilExpiry = (endDate) => {
  if (!endDate) return 0;
  const today = new Date();
  const expiry = new Date(endDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to download document
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

export default ExpiringContractModal;
