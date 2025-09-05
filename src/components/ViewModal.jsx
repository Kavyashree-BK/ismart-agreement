import React from "react";
import { useDispatch } from "react-redux";
import { setViewModal } from "../slice/uiSlice";

const ViewModal = ({ open, agreement, onClose }) => {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setViewModal({ open: false, agreement: null }));
  };

  if (!open || !agreement) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Agreement Details - {agreement.selectedClient}
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

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Name</label>
                <p className="mt-1 text-sm text-gray-900">{agreement.selectedClient}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Branches</label>
                <p className="mt-1 text-sm text-gray-900">
                  {agreement.selectedBranches && agreement.selectedBranches.length > 0 
                    ? agreement.selectedBranches.join(", ")
                    : "All Branches"
                  }
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
                  {agreement.submittedDate ? new Date(agreement.submittedDate).toLocaleDateString() : "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Email</label>
                <p className="mt-1 text-sm text-gray-900">{agreement.clientEmail || "N/A"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Client Phone</label>
                <p className="mt-1 text-sm text-gray-900">{agreement.clientPhone || "N/A"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">I Smart Email</label>
                <p className="mt-1 text-sm text-gray-900">{agreement.ismartEmail || "N/A"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">I Smart Phone</label>
                <p className="mt-1 text-sm text-gray-900">{agreement.ismartPhone || "N/A"}</p>
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

          {/* Important Clauses */}
          {agreement.importantClauses && agreement.importantClauses.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Clauses</h3>
              <div className="space-y-3">
                {agreement.importantClauses.map((clause, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{clause.title}</h4>
                    <p className="text-sm text-gray-700 mt-1">{clause.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;

