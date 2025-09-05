import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AddendumForm = ({ 
  onSubmit, 
  editingAddendum, 
  onEditComplete, 
  parentAgreement,
  userRole = "checker" 
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    effectiveDate: new Date(),
    reason: "",
    impact: "",
    additionalDocuments: [],
    branches: [] // Add this line
  });
  
  const [errors, setErrors] = useState({});

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Clause modification tracking
  const [clauseModifications, setClauseModifications] = useState([]);
  const [showClauseModificationForm, setShowClauseModificationForm] = useState(false);
  
  // Add branch management state
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchDescription, setNewBranchDescription] = useState("");
  const [editingBranchId, setEditingBranchId] = useState(null);

  // Handle editing mode - pre-fill form when editingAddendum is provided
  useEffect(() => {
    if (editingAddendum) {
      setIsEditMode(true);
      setForm({
        title: editingAddendum.title || "",
        description: editingAddendum.description || "",
        effectiveDate: editingAddendum.effectiveDate ? new Date(editingAddendum.effectiveDate) : new Date(),
        reason: editingAddendum.reason || "",
        impact: editingAddendum.impact || "",
        additionalDocuments: editingAddendum.additionalDocuments || [],
        branches: editingAddendum.branches || [] // Pre-fill branches
      });
      setUploadedFiles(editingAddendum.uploadedFiles || {});
      // Load clause modifications for editing
      setClauseModifications(editingAddendum.clauseModifications || []);
    } else {
      setIsEditMode(false);
      // Reset clause modifications when not editing
      setClauseModifications([]);
    }
  }, [editingAddendum]);

  const validateForm = () => {
    const errs = {};
    
    if (!form.title.trim()) {
      errs.title = "Addendum title is required";
    }
    
    if (!form.description.trim()) {
      errs.description = "Addendum description is required";
    }
    
    if (!form.reason.trim()) {
      errs.reason = "Reason for addendum is required";
    }
    
    if (!form.impact.trim()) {
      errs.impact = "Impact assessment is required";
    }

    return errs;
  };

  // Branch management functions
  const handleAddBranch = () => {
    if (!newBranchName.trim()) {
      alert("Branch name is required!");
      return;
    }
    
    const newBranch = {
      id: editingBranchId || Date.now(),
      name: newBranchName.trim(),
      description: newBranchDescription.trim() || "No description provided",
      createdAt: new Date().toISOString().split('T')[0],
      status: "Active"
    };
    
    if (editingBranchId) {
      // Update existing branch
      setForm(prev => ({
        ...prev,
        branches: prev.branches.map(b => b.id === editingBranchId ? newBranch : b)
      }));
      setEditingBranchId(null);
    } else {
      // Add new branch
      setForm(prev => ({
        ...prev,
        branches: [...prev.branches, newBranch]
      }));
    }
    
    // Reset form
    setNewBranchName("");
    setNewBranchDescription("");
    setShowBranchModal(false);
    
    alert(`Branch "${newBranch.name}" ${editingBranchId ? 'updated' : 'added'} successfully!`);
  };

  const handleRemoveBranch = (branchId) => {
    const branchToRemove = form.branches.find(b => b.id === branchId);
    if (branchToRemove) {
      const confirmRemove = confirm(`Are you sure you want to remove the branch "${branchToRemove.name}"?`);
      if (confirmRemove) {
        setForm(prev => ({
          ...prev,
          branches: prev.branches.filter(b => b.id !== branchId)
        }));
        alert(`Branch "${branchToRemove.name}" removed successfully!`);
      }
    }
  };

  const handleEditBranch = (branchId) => {
    const branch = form.branches.find(b => b.id === branchId);
    if (branch) {
      setNewBranchName(branch.name);
      setNewBranchDescription(branch.description);
      setEditingBranchId(branchId);
      setShowBranchModal(true);
    }
  };

  const handleCancelBranchEdit = () => {
    setShowBranchModal(false);
    setNewBranchName("");
    setNewBranchDescription("");
    setEditingBranchId(null);
  };

    const handleSubmit = () => {
    console.log("=== ADDENDUM SUBMISSION STARTED ===");
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log("Form already submitting, ignoring duplicate click");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simple validation
      if (!form.title.trim() || !form.description.trim() || !form.reason.trim() || !form.impact.trim()) {
        setErrors({
          title: !form.title.trim() ? "Title is required" : undefined,
          description: !form.description.trim() ? "Description is required" : undefined,
          reason: !form.reason.trim() ? "Reason is required" : undefined,
          impact: !form.impact.trim() ? "Impact is required" : undefined
        });
        setIsSubmitting(false);
        return;
      }
      
      // Create addendum data
      const addendumData = {
        title: form.title,
        description: form.description,
        effectiveDate: form.effectiveDate.toISOString().split('Z')[0],
        reason: form.reason,
        impact: form.impact,
        uploadedFiles: uploadedFiles,
        clauseModifications: clauseModifications,
        parentAgreementId: parentAgreement?.id,
        parentAgreementTitle: parentAgreement?.selectedClient,
        submittedDate: new Date().toISOString().split('Z')[0],
        submittedBy: userRole,
        status: "Pending Review",
        branches: form.branches // Include branches in the submission data
      };
      
      if (isEditMode && editingAddendum) {
        addendumData.id = editingAddendum.id;
        addendumData.originalSubmittedDate = editingAddendum.submittedDate;
        addendumData.originalSubmittedBy = editingAddendum.submittedBy;
      }
      
      console.log("Addendum data prepared:", addendumData);
      
      // Call parent onSubmit function
      if (onSubmit) {
        onSubmit(addendumData);
      }
      
      // Reset form immediately
      setForm({
        title: "",
        description: "",
        effectiveDate: new Date(),
        reason: "",
        impact: "",
        additionalDocuments: [],
        branches: [] // Reset branches
      });
      setUploadedFiles({});
      // Only clear clause modifications if not editing
      if (!isEditMode) {
        setClauseModifications([]);
      }
      setErrors({});
      setIsSubmitting(false);
      
      console.log("=== ADDENDUM SUBMISSION COMPLETED SUCCESSFULLY ===");
      
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setErrorModalMessage("Error: " + error.message);
      setShowErrorModal(true);
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (type, file) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only PDF, DOCX, JPG, JPEG, PNG allowed.');
      return;
    }

    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    setUploadedFiles(prev => ({
      ...prev,
      [type]: { file, uploaded: true, name: file.name }
    }));
  };

  const handleRemoveFile = (type) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[type];
      return newFiles;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto p-0 bg-transparent mt-4 mb-8">
      {/* Edit Mode Indicator */}
      {isEditMode && editingAddendum && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✏️</span>
            <div>
              <h3 className="font-bold text-blue-800">Editing Addendum</h3>
              <p className="text-blue-600 text-sm">
                Addendum ID: {editingAddendum.id} • Parent Agreement: {editingAddendum.parentAgreementTitle}
              </p>
            </div>
          </div>
          </div>
          )}

      {/* Parent Agreement Info */}
      {parentAgreement && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">📋 Parent Agreement</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Client:</span> {parentAgreement.selectedClient}</div>
            <div><span className="font-medium">Branches:</span> {(parentAgreement.selectedBranches || []).map(branch => branch.name).join(", ")}</div>
            <div><span className="font-medium">Agreement ID:</span> {parentAgreement.id}</div>
            <div><span className="font-medium">Status:</span> {parentAgreement.status}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 p-6">
          <h1 className="text-2xl font-bold text-gray-900">📝 Addendum Form</h1>
          <p className="text-gray-600 mt-2">
            Create modifications to the existing agreement without affecting the primary contract
          </p>
        </div>

        <div className="px-6 py-8">
          {/* Basic Information */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Addendum Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className={`w-full border rounded-md p-2.5 text-sm ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Extension of Service Period"
                />
                {errors.title && (
                  <div className="text-red-600 text-xs mt-1">{errors.title}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date *</label>
                <DatePicker
                  className="w-full border rounded-md p-2.5 text-sm"
                  selected={form.effectiveDate}
                  onChange={date => setForm(prev => ({ ...prev, effectiveDate: date }))}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-mm-yyyy"
                />
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">Addendum Details</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                className={`w-full border rounded-md p-2.5 text-sm resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the changes or modifications being made to the original agreement..."
              />
              {errors.description && (
                <div className="text-red-600 text-xs mt-1">{errors.description}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Addendum *</label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full border rounded-md p-2.5 text-sm resize-none ${
                    errors.reason ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Explain why this addendum is necessary..."
                />
                {errors.reason && (
                  <div className="text-red-600 text-xs mt-1">{errors.reason}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Impact Assessment *</label>
                <textarea
                  name="impact"
                  value={form.impact}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full border rounded-md p-2.5 text-sm resize-none ${
                    errors.impact ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe the impact of these changes..."
                />
                {errors.impact && (
                  <div className="text-red-600 text-xs mt-1">{errors.impact}</div>
                )}
              </div>
            </div>
          </section>

          {/* Branch Management Section - Only for Checkers */}
          {userRole?.toLowerCase() === "checker" && (
            <section className="mb-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Branches
                </h2>
            
            {/* Current Branches Display */}
              <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Current Branches:</h4>
                  {form.branches.length === 0 ? (
                    <p className="text-gray-500 text-sm italic bg-white p-3 rounded border border-gray-200">
                      No branches added yet. Add your first branch to get started!
                    </p>
                  ) : (
                <div className="space-y-3">
                  {form.branches.map((branch) => (
                        <div key={branch.id} className="flex items-center justify-between bg-white p-4 rounded border border-gray-200">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{branch.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{branch.description}</div>
                          <div className="text-xs text-gray-500 mt-2">
                              Created: {branch.createdAt} • Status: {branch.status}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditBranch(branch.id)}
                            className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveBranch(branch.id)}
                            className="px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

                {/* Add New Branch Button - Made Smaller */}
                <div className="flex justify-start">
                  <button
                    onClick={() => setShowBranchModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Branch
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Clause Modifications */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Clause Modifications</h2>
              <button
                type="button"
                onClick={() => {
                  console.log("Opening clause modification form...");
                  setShowClauseModificationForm(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                + Add Clause Change
              </button>
            </div>
            <p className="text-gray-500 mb-4">Track which clauses are being modified, added, or removed by this addendum</p>
            
            {/* Existing Clause Modifications */}
            {clauseModifications.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium text-gray-800">
                    {isEditMode ? '📝 Existing Clause Modifications' : '📝 Clause Modifications'}
                  </h4>
                  {isEditMode && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Editing Mode
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {clauseModifications.map((mod, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            mod.action === 'added' ? 'bg-green-100 text-green-700' :
                            mod.action === 'removed' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {mod.action === 'added' ? '✨ NEW' : 
                             mod.action === 'removed' ? '🗑️ REMOVED' : 
                             '🔄 MODIFIED'}
                          </span>
                          <span className="font-medium text-gray-800">{mod.clauseTitle}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newMods = clauseModifications.filter((_, i) => i !== index);
                            setClauseModifications(newMods);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="text-sm text-gray-700">
                        <div><strong>Details:</strong> {mod.details}</div>
                        {mod.previousValue && <div><strong>Previous:</strong> {mod.previousValue}</div>}
                        {mod.newValue && <div><strong>New:</strong> {mod.newValue}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Debug Info */}
            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <strong>Debug:</strong> Modal state: {showClauseModificationForm ? 'OPEN' : 'CLOSED'} | 
              Clause modifications count: {clauseModifications.length}
              {isEditMode && editingAddendum && (
                <span className="ml-2 text-blue-600">
                  • Editing existing addendum with {editingAddendum.clauseModifications?.length || 0} clause modifications
                </span>
              )}
                    </div>

            {/* Clause Modification Form Modal */}
            {showClauseModificationForm && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl p-6 min-w-[500px] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Add Clause Modification</h3>
                    <button
                      type="button"
                      onClick={() => {
                        console.log("Closing modal...");
                        setShowClauseModificationForm(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Simple Form with Controlled Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clause Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="clauseTitle"
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Payment Terms, SLA, Insurance"
                        onChange={(e) => {
                          console.log("Title input changed:", e.target.value);
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Action <span className="text-red-500">*</span>
                      </label>
                      <select 
                        id="action"
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => {
                          console.log("Action select changed:", e.target.value);
                        }}
                      >
                        <option value="">Select action</option>
                        <option value="added">Added (New clause)</option>
                        <option value="modified">Modified (Updated existing)</option>
                        <option value="removed">Removed (Deleted clause)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Details <span className="text-red-500">*</span>
                  </label>
                      <textarea
                        id="details"
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Describe what changed and why"
                        onChange={(e) => {
                          console.log("Details textarea changed:", e.target.value);
                        }}
                      />
                  </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Previous Value</label>
                        <input
                          type="text"
                          id="previousValue"
                          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Old value (if applicable)"
                          onChange={(e) => {
                            console.log("Previous value changed:", e.target.value);
                          }}
                        />
                  </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Value</label>
                        <input
                          type="text"
                          id="newValue"
                          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="New value (if applicable)"
                          onChange={(e) => {
                            console.log("New value changed:", e.target.value);
                          }}
                        />
              </div>
            </div>
                </div>
                
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                      onClick={() => {
                        console.log("Cancel clicked");
                        setShowClauseModificationForm(false);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
              >
            Cancel
              </button>
                    <button
                      type="button"
                      onClick={() => {
                        console.log("Add Modification clicked");
                        
                        // Get form values
                        const clauseTitle = document.getElementById('clauseTitle')?.value;
                        const action = document.getElementById('action')?.value;
                        const details = document.getElementById('details')?.value;
                        const previousValue = document.getElementById('previousValue')?.value || '';
                        const newValue = document.getElementById('newValue')?.value || '';
                        
                        console.log("Form values:", { clauseTitle, action, details, previousValue, newValue });
                        
                        if (clauseTitle && action && details) {
                          const newMod = {
                            clauseTitle,
                            action,
                            details,
                            previousValue,
                            newValue
                          };
                          
                          console.log("Adding new modification:", newMod);
                          setClauseModifications(prev => [...prev, newMod]);
                          setShowClauseModificationForm(false);
                          
                          // Clear form
                          document.getElementById('clauseTitle').value = '';
                          document.getElementById('action').value = '';
                          document.getElementById('details').value = '';
                          document.getElementById('previousValue').value = '';
                          document.getElementById('newValue').value = '';
                        } else {
                          alert('Please fill in all required fields (Title, Action, and Details)');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Add Modification
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Document Uploads */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">Supporting Documents</h2>
            <p className="text-gray-500 mb-4">Upload any documents that support this addendum</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { type: "supportingDoc", label: "Supporting Document", description: "Any document that supports the addendum" },
                { type: "amendmentDoc", label: "Amendment Document", description: "The actual amendment document" },
                { type: "approvalDoc", label: "Approval Document", description: "Document showing approval for changes" }
              ].map((docType) => (
                <div key={docType.type} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{docType.label}</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50">
                    {uploadedFiles[docType.type]?.uploaded ? (
                      <div className="text-center">
                        <span className="text-2xl mb-2">📄</span>
                        <div className="text-sm text-gray-700 mb-2 font-medium">{uploadedFiles[docType.type].name}</div>
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                            onClick={() => {
                              try {
                                console.log("Opening document:", uploadedFiles[docType.type].name);
                                const url = URL.createObjectURL(uploadedFiles[docType.type].file);
                                console.log("Document URL created:", url);
                                window.open(url, '_blank');
                              } catch (error) {
                                console.error("Error opening document:", error);
                                alert("Error opening document: " + error.message);
                              }
                            }}
                            title={`Click to view ${uploadedFiles[docType.type].name}`}
                          >
                            👁️ View Document
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            onClick={() => handleRemoveFile(docType.type)}
                            title="Remove this document"
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl mb-2">⬆️</span>
                        <label className="bg-white border px-3 py-2 rounded mb-2 font-medium cursor-pointer hover:bg-gray-50">
                          Choose File
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.jpg,.jpeg,.png"
                            onChange={e => handleFileUpload(docType.type, e.target.files[0])}
                          />
                        </label>
                        <span className="text-gray-400 text-xs text-center">{docType.description}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>



          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            {isEditMode && (
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50"
                onClick={() => {
                  if (onEditComplete) onEditComplete();
                }}
              >
                Cancel Edit
              </button>
            )}
            <button
              type="button"
              className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Submit button clicked - preventing default behavior");
                handleSubmit();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : (isEditMode ? 'Update Addendum' : 'Submit Addendum')}
            </button>
          </div>
        </div>
      </div>

      {/* Branch Management Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-green-600">🌿</span>
              {editingBranchId ? 'Edit Branch' : 'Add New Branch'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter branch name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newBranchDescription}
                  onChange={(e) => setNewBranchDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter branch description (optional)"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelBranchEdit}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBranch}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {editingBranchId ? 'Update' : 'Add'} Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-8 rounded shadow-xl flex flex-col items-center">
            <div className="text-2xl font-bold mb-2 text-red-700">Submission Error</div>
            <div className="mb-4 text-gray-700">{errorModalMessage}</div>
            <button
              className="mt-2 px-6 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
              onClick={() => setShowErrorModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddendumForm;
