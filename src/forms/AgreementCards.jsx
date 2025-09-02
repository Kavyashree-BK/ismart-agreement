import React, { useState } from "react";
import AddendumForm from "./AddendumForm";

const AgreementCards = ({ 
  agreements, 
  addendums, 
  onStatusUpdate, 
  onAddendumStatusUpdate,
  userRole, 
  onCreateAddendum,
  onEditAgreement,
  editingAgreement,
  onEditComplete,
  onAddendumSubmit
}) => {
  const [showAddendumForm, setShowAddendumForm] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [editingAddendum, setEditingAddendum] = useState(null);
  const [viewingAgreement, setViewingAgreement] = useState(null);
  const [selectedAddendum, setSelectedAddendum] = useState(null);
  const [showAddendumModal, setShowAddendumModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  // Sort agreements by submission date (newest first)
  const sortedAgreements = [...agreements].sort((a, b) => 
    new Date(b.submittedDate) - new Date(a.submittedDate)
  );

  const handleAddendumClick = (agreement) => {
    setSelectedAgreement(agreement);
    setShowAddendumForm(true);
    setEditingAddendum(null);
  };

  const handleEditAddendum = (addendum) => {
    setEditingAddendum(addendum);
    setShowAddendumForm(true);
  };

  const handleAddendumSubmit = (addendumData) => {
    if (onAddendumSubmit) {
      onAddendumSubmit(addendumData);
    }
    setShowAddendumForm(false);
    setSelectedAgreement(null);
    setEditingAddendum(null);
  };

  const handleEditComplete = () => {
    setEditingAddendum(null);
    setShowAddendumForm(false);
    setSelectedAgreement(null);
  };

  const handleViewAgreement = (agreement) => {
    setViewingAgreement(agreement);
  };

  const handleCloseView = () => {
    setViewingAgreement(null);
  };

  // Handle status change for addendums
  const handleStatusChange = (addendumId, newStatus) => {
    console.log('Status change requested:', addendumId, newStatus);
    
    // First close the modal to prevent state conflicts
    setShowAddendumModal(false);
    setSelectedAddendum(null);
    
    // Then update the status after a short delay
    setTimeout(() => {
      if (onAddendumStatusUpdate) {
        console.log('Calling onAddendumStatusUpdate:', addendumId, newStatus);
        onAddendumStatusUpdate(addendumId, newStatus);
      } else {
        console.log('onAddendumStatusUpdate is not available');
      }
    }, 100);
  };

  // Handle review addendum
  const handleReviewAddendum = (addendum) => {
    setSelectedAddendum(addendum);
    setShowAddendumModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending Review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Under Review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Get addendums for a specific agreement
  const getAgreementAddendums = (agreementId) => {
    return (addendums || []).filter(addendum => addendum.parentAgreementId === agreementId);
  };

  // Component is ready to render

  // Show loading state if agreements are not yet loaded
  if (!agreements || agreements.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Agreements</h1>
            <p className="text-sm text-gray-600 mt-2">Manage and review all agreements in chronological order</p>
          </div>
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading agreements...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showAddendumForm) {
    return (
      <div className="px-8 py-6">
        <div className="mb-6">
          <button
            onClick={() => setShowAddendumForm(false)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Agreements
          </button>
        </div>
        <AddendumForm
          onSubmit={handleAddendumSubmit}
          editingAddendum={editingAddendum}
          onEditComplete={handleEditComplete}
          parentAgreement={selectedAgreement}
          userRole={userRole}
        />
      </div>
    );
  }

  if (viewingAgreement) {
    return (
      <div className="px-8 py-6">
        <div className="mb-6">
          <button
            onClick={handleCloseView}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Agreements
          </button>
        </div>
        
        {/* Agreement Details View */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl">📄</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Agreement Details - {viewingAgreement.selectedClient}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Agreement ID: {viewingAgreement.id} • Submitted on {new Date(viewingAgreement.submittedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(viewingAgreement.status)}`}>
                  {viewingAgreement.status}
                </span>
                {/* Priority Badge - Only for Approver Role */}
                {userRole?.toLowerCase() !== "checker" && viewingAgreement.priority && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(viewingAgreement.priority)}`}>
                    {viewingAgreement.priority}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Client Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Client Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Client Name:</span>
                      <span className="text-gray-900">{viewingAgreement.selectedClient}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Department:</span>
                      <span className="text-gray-900">{viewingAgreement.selectedDepartment || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Entity Type:</span>
                      <span className="text-gray-900">{viewingAgreement.entityType || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Submitted By:</span>
                      <span className="text-gray-900">{viewingAgreement.submittedBy || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Agreement Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Agreement Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Agreement Type:</span>
                      <span className="text-gray-900">{viewingAgreement.agreementType || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Start Date:</span>
                      <span className="text-gray-900">
                        {viewingAgreement.startDate ? new Date(viewingAgreement.startDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">End Date:</span>
                      <span className="text-gray-900">
                        {viewingAgreement.endDate ? new Date(viewingAgreement.endDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Total Value:</span>
                      <span className="text-gray-900">
                        {viewingAgreement.totalValue ? `${viewingAgreement.currency || "₹"}${viewingAgreement.totalValue.toLocaleString()}` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Branches */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Branches</h3>
                  <div className="space-y-2">
                    {viewingAgreement.selectedBranches && viewingAgreement.selectedBranches.length > 0 ? (
                      viewingAgreement.selectedBranches.map((branch, idx) => (
                        <div key={branch.id || idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-gray-800">{branch.name}</div>
                          {branch.address && <div className="text-sm text-gray-600">{branch.address}</div>}
                          {branch.manager && <div className="text-sm text-gray-600">Manager: {branch.manager}</div>}
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500">No branches specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Important Clauses */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Important Clauses</h3>
                  <div className="space-y-2">
                    {viewingAgreement.importantClauses && viewingAgreement.importantClauses.length > 0 ? (
                      viewingAgreement.importantClauses.map((clause, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                          <span className="text-blue-600">📋</span>
                          <span className="text-gray-800">{clause}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500">No important clauses specified</span>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Documents</h3>
                  <div className="space-y-2">
                    {viewingAgreement.uploadedFiles && Object.keys(viewingAgreement.uploadedFiles).length > 0 ? (
                      Object.entries(viewingAgreement.uploadedFiles).map(([type, file]) => (
                        <div key={type} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">📄</span>
                            <span className="text-gray-800">{type}: {file.name}</span>
                          </div>
                          <span className="text-sm text-gray-600">{file.size}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500">No documents uploaded</span>
                    )}
                  </div>
                </div>

                {/* Addendums */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Addendums</h3>
                  <div className="space-y-2">
                    {(() => {
                      const agreementAddendums = getAgreementAddendums(viewingAgreement.id);
                      return agreementAddendums.length > 0 ? (
                        agreementAddendums.map((addendum, idx) => (
                          <div key={addendum.id} className="bg-purple-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-purple-600">📝</span>
                                <span className="font-medium text-gray-800">{addendum.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(addendum.status)}`}>
                                  {addendum.status}
                                </span>
                                <button
                                  onClick={() => handleReviewAddendum(addendum)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                                >
                                  👁️ Review
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">{addendum.description}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              Effective: {new Date(addendum.effectiveDate).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500">No addendums yet</span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedAgreement(viewingAgreement);
                      setShowAddendumForm(true);
                      setViewingAgreement(null);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <span>📝</span>
                    Add Addendum
                  </button>
                  <span className="text-sm text-gray-600">
                    {getAgreementAddendums(viewingAgreement.id).length} addendum{getAgreementAddendums(viewingAgreement.id).length !== 1 ? 's' : ''} attached
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {userRole === "checker" && (
                    <button
                      onClick={() => {
                        onEditAgreement(viewingAgreement);
                        setViewingAgreement(null);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <span>✏️</span>
                      Edit Agreement
                    </button>
                  )}
                  <button
                    onClick={handleCloseView}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <span>✕</span>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Agreements</h2>
        <p className="text-gray-600">Manage and review all agreements in chronological order</p>
      </div>

      {sortedAgreements.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Agreements Yet</h3>
          <p className="text-gray-600">Create your first agreement to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedAgreements.map((agreement, index) => {
            const agreementAddendums = getAgreementAddendums(agreement.id);
            
            return (
              <div key={agreement.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">📄</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Agreement #{agreement.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Submitted on {new Date(agreement.submittedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(agreement.status)}`}>
                        {agreement.status}
                      </span>
                      {/* Priority Badge - Only for Approver Role */}
                      {userRole?.toLowerCase() !== "checker" && agreement.priority && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(agreement.priority)}`}>
                          {agreement.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Client Information */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Client Details</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Client:</span>
                          <span className="ml-2 text-gray-900">{agreement.selectedClient}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Branches:</span>
                          <span className="ml-2 text-gray-900">
                            {agreement.selectedBranches?.map(branch => branch.name).join(", ") || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Submitted By:</span>
                          <span className="ml-2 text-gray-900">{agreement.submittedBy || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Agreement Details */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Agreement Details</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Start Date:</span>
                          <span className="ml-2 text-gray-900">
                            {agreement.startDate ? new Date(agreement.startDate).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">End Date:</span>
                          <span className="ml-2 text-gray-900">
                            {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Value:</span>
                          <span className="ml-2 text-gray-900">
                            {agreement.totalValue ? `₹${agreement.totalValue.toLocaleString()}` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Addendums */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Addendums</h4>
                      <div className="space-y-2">
                        {agreementAddendums.length > 0 ? (
                          <div className="space-y-2">
                            {agreementAddendums.slice(0, 3).map((addendum, idx) => (
                              <div key={addendum.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">📝</span>
                                  <span className="text-sm font-medium text-gray-700 truncate max-w-32">
                                    {addendum.title}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEditAddendum(addendum)}
                                    className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                                    title="Edit Addendum"
                                  >
                                    ✏️
                                  </button>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(addendum.status)}`}>
                                    {addendum.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {agreementAddendums.length > 3 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{agreementAddendums.length - 3} more addendums
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No addendums yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAddendumClick(agreement)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <span>📝</span>
                          Add Addendum
                        </button>
                        {agreementAddendums.length > 0 && (
                          <span className="text-sm text-gray-600">
                            {agreementAddendums.length} addendum{agreementAddendums.length !== 1 ? 's' : ''} attached
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {userRole === "checker" && (
                          <button
                            onClick={() => onEditAgreement(agreement)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <span>✏️</span>
                            Edit Agreement
                          </button>
                        )}
                                                 <button
                           onClick={() => handleViewAgreement(agreement)}
                           className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                         >
                           <span>👁️</span>
                           View Details
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Addendum Review Modal */}
      {showAddendumModal && selectedAddendum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[600px] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Review Addendum - {selectedAddendum.title}</h3>
              <button 
                onClick={() => setShowAddendumModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            {/* Addendum Details */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-700">Title:</span>
                  <p className="text-gray-800 mt-1">{selectedAddendum.title}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Current Status:</span>
                  <p className="text-gray-800 mt-1">{selectedAddendum.status}</p>
                </div>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">Description:</span>
                <p className="text-gray-800 mt-1">{selectedAddendum.description}</p>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">Submitted By:</span>
                <p className="text-gray-800 mt-1">{selectedAddendum.submittedBy}</p>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">Effective Date:</span>
                <p className="text-gray-800 mt-1">
                  {selectedAddendum.effectiveDate ? new Date(selectedAddendum.effectiveDate).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
            </div>

            {/* Status Change Section - Only for Approvers */}
            {userRole?.toLowerCase() === "approver" && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Change Status</h4>
                
                <div className="flex items-center gap-3 mb-4">
                  <select
                    className="border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 min-w-[140px]"
                    value={pendingStatusChange || selectedAddendum.status}
                    onChange={(e) => {
                      // Just update the local state, don't submit yet
                      setPendingStatusChange(e.target.value);
                    }}
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Approved">✅ Approved</option>
                    <option value="Rejected">❌ Rejected</option>
                  </select>
                  
                  {pendingStatusChange && pendingStatusChange !== selectedAddendum.status && (
                    <button
                      onClick={() => {
                        console.log('Status change confirmed:', selectedAddendum.id, pendingStatusChange);
                        if (onAddendumStatusUpdate) {
                          onAddendumStatusUpdate(selectedAddendum.id, pendingStatusChange);
                          // Clear pending change but keep modal open
                          setPendingStatusChange(null);
                          // Modal stays open - user must manually close
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Save Status
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setPendingStatusChange(null);
                      setShowAddendumModal(false);
                      setSelectedAddendum(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  Current Status: <span className="font-semibold">{selectedAddendum.status}</span>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    💡 Select a new status from the dropdown above, then click "Save Status" to apply the change. Use "Close" to exit.
                  </p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAddendumModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
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

export default AgreementCards;
