

import React, { useState } from "react";
import AgreementForm from "./forms/AgreementForm";
import ReportFilterForm from "./forms/ReportFilterForm";
import AgreementTable from "./forms/AgreementTable";
import Header from "./components/ui/Header";
import TabNav from "./components/ui/TabNav";

function Dashboard({ agreements, userRole, onStatusUpdate, setViewModal, setEditingAgreement, setActiveTab }) {
  // Show up to 5 most recent submissions
  const recentSubmissions = agreements.slice(0, 5);

  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0];

  const handleViewAgreement = (agreement) => {
    setViewModal({ open: true, agreement });
  };

  const handleEditAgreement = (agreement) => {
    // Set the agreement to be edited and switch to the new agreement tab
    setEditingAgreement(agreement);
    setActiveTab("new");
  };

  const handleDownloadAgreement = (agreement) => {
    // Create a downloadable text file with agreement details
    const agreementContent = `
LEGAL AGREEMENT COPY
==================

Agreement ID: ${agreement.id}
Client: ${agreement.selectedClient}
Sites: ${(agreement.selectedSites || []).join(", ")}
Submitted Date: ${agreement.submittedDate}
Status: ${agreement.status}
Entity Type: ${agreement.entityType}
Agreement Period: ${new Date(agreement.startDate).toLocaleDateString()} to ${new Date(agreement.endDate).toLocaleDateString()}

CONTACT INFORMATION:
===================
I Smart Contact:
  Name: ${agreement.form?.iSmartName || 'Not provided'}
  Phone: ${agreement.form?.iSmartContact || 'Not provided'}
  Email: ${agreement.form?.iSmartEmail || 'Not provided'}

Client Contact:
  Name: ${agreement.form?.clientName || 'Not provided'}
  Phone: ${agreement.form?.clientContact || 'Not provided'}
  Email: ${agreement.form?.clientEmail || 'Not provided'}

IMPORTANT CLAUSES:
================
${(agreement.clauses || []).map((clause, idx) => `
${idx + 1}. ${clause.title}
   Details: ${clause.details || 'No details provided'}
`).join('')}

DOCUMENTS UPLOADED:
==================
${Object.entries(agreement.uploadStatuses || {})
  .filter(([key, status]) => status.uploaded && ['LOI', 'WO', 'PO', 'Email'].includes(key))
  .map(([key, status]) => `${key}: ${status.file?.name || 'Uploaded'}`)
  .join('\n') || 'No documents uploaded'}

${agreement.entityType === 'group' ? `
GROUP COMPANIES:
===============
${(agreement.underList || []).map((item, idx) => `${idx + 1}. ${item.value || 'Not specified'}`).join('\n')}
` : ''}

Generated on: ${new Date().toLocaleString()}
    `;

    // Create and download the file
    const blob = new Blob([agreementContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Agreement_${agreement.selectedClient}_${agreement.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (userRole === "Approver") {
    // Approver Dashboard
    const pendingApproval = agreements.filter(a => a.status === "Pending Review").length;
    const approvedToday = agreements.filter(a => a.status === "Approved" && a.approvedDate === today).length;
    const totalProcessed = agreements.filter(a => a.status === "Approved" || a.status === "Rejected").length;
    
    // Calculate overdue (pending for more than 5 days)
    const overdue = agreements.filter(a => {
      if (a.status !== "Pending Review") return false;
      const submittedDate = new Date(a.submittedDate);
      const daysDiff = Math.floor((new Date() - submittedDate) / (1000 * 60 * 60 * 24));
      return daysDiff > 5;
    }).length;

    // Priority Actions - categorize pending agreements by urgency
    const priorityActions = agreements
      .filter(a => a.status === "Pending Review")
      .map(agreement => {
        const submittedDate = new Date(agreement.submittedDate);
        const daysDiff = Math.floor((new Date() - submittedDate) / (1000 * 60 * 60 * 24));
        let priority = "Low";
        if (daysDiff > 5) priority = "High";
        else if (daysDiff >= 3) priority = "Medium";
        
        return { ...agreement, priority, daysPending: daysDiff };
      })
      .sort((a, b) => b.daysPending - a.daysPending);

    const handleStatusUpdate = (agreementId, newStatus) => {
      const updatedDate = new Date().toISOString().split('T')[0];
      onStatusUpdate(agreementId, newStatus, updatedDate);
    };

    return (
      <div className="px-8 py-6">
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingApproval}</div>
            <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
              <span>Pending Approval</span>
              <span role="img" aria-label="pending">⏳</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{approvedToday}</div>
            <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
              <span>Approved Today</span>
              <span role="img" aria-label="today">📅</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold">{totalProcessed}</div>
            <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
              <span>Total Processed</span>
              <span role="img" aria-label="processed">📊</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-red-600">{overdue}</div>
            <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
              <span>Overdue</span>
              <span role="img" aria-label="overdue">🚨</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Priority Actions</h2>
          <p className="text-gray-500 mb-4">Agreements requiring your review</p>
          <div className="divide-y">
            {priorityActions.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No pending agreements</div>
            ) : (
              priorityActions.map((agreement) => (
                <div className="flex items-center justify-between py-4" key={agreement.id}>
                  <div className="flex-1">
                    <div className="font-semibold">{agreement.selectedClient}</div>
                    <div className="text-gray-500 text-sm">{(agreement.selectedSites || []).join(", ")}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Submitted by: {agreement.submittedBy} • {agreement.daysPending} days ago
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      agreement.priority === "High" ? "bg-red-100 text-red-700" :
                      agreement.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {agreement.priority}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(agreement.id, "Approved")}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(agreement.id, "Rejected")}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Checker Dashboard (default) - Shows interconnected data
  return (
    <div className="px-8 py-6">
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold">{agreements.length}</div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Total Submissions</span>
            <span role="img" aria-label="doc">📄</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-orange-600">{agreements.filter(a => a.status === "Pending Review").length}</div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Pending Review</span>
            <span role="img" aria-label="clock">⏲️</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-green-600">{agreements.filter(a => a.status === "Approved").length}</div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Approved</span>
            <span role="img" aria-label="check">✔️</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-red-600">{agreements.filter(a => a.status === "Rejected").length}</div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Rejected</span>
            <span role="img" aria-label="cross">❗</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-2">Recent Submissions</h2>
        <p className="text-gray-500 mb-4">Your latest agreement submissions and their approval status</p>
        <div className="divide-y">
          {recentSubmissions.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No submissions yet</div>
          ) : (
            recentSubmissions.map((agreement, idx) => (
              <div className="flex items-center justify-between py-3" key={agreement.id || idx}>
                <div className="flex-1">
                  <div className="font-semibold">{agreement.selectedClient}</div>
                  <div className="text-gray-500 text-sm">{(agreement.selectedSites || []).join(", ")}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Submitted: {agreement.submittedDate}
                    {agreement.approvedDate && agreement.status === "Approved" && 
                      ` • Approved: ${agreement.approvedDate}`}
                    {agreement.approvedDate && agreement.status === "Rejected" && 
                      ` • Rejected: ${agreement.approvedDate}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={
                    agreement.status === "Approved"
                      ? "px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold"
                    : agreement.status === "Rejected"
                      ? "px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold"
                    : "px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold"
                  }>
                    {agreement.status}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                      onClick={() => handleViewAgreement(agreement)}
                      title="View Agreement Details"
                    >
                      👁️ View
                    </button>
                    {agreement.status === "Pending Review" && (
                      <button 
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200"
                        onClick={() => handleEditAgreement(agreement)}
                        title="Edit Agreement"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    <button 
                      className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                      onClick={() => handleDownloadAgreement(agreement)}
                      title="Download Agreement Copy"
                    >
                      📥 Download
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [userRole, setUserRole] = useState("Checker");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [agreements, setAgreements] = useState([]);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [viewModal, setViewModal] = useState({ open: false, agreement: null });

  // Tabs to show based on role
  let tabs = [];
  if (userRole === "Approver") {
    tabs = [
      { label: "Dashboard", value: "dashboard" },
      { label: "Agreements", value: "agreements" },
    ];
  } else {
    tabs = [
      { label: "Dashboard", value: "dashboard" },
      { label: "New Agreement", value: "new" },
    ];
  }

  // Handler for agreement form submission
  const handleAgreementSubmit = (agreementData) => {
    if (agreementData.id) {
      // Update existing agreement
      setAgreements(prev => prev.map(agreement => 
        agreement.id === agreementData.id 
          ? { 
              ...agreement, 
              ...agreementData,
              // Keep original status, submitted date, and submitter for updates
              status: agreement.status,
              submittedDate: agreement.submittedDate,
              submittedBy: agreement.submittedBy,
              approvedDate: agreement.approvedDate,
              approvedBy: agreement.approvedBy
            }
          : agreement
      ));
    } else {
      // Create new agreement
      const newAgreement = {
        id: Date.now(),
        ...agreementData,
        status: "Pending Review",
        submittedDate: new Date().toISOString().split('T')[0],
        submittedBy: "Current User", // You can get this from user context
        approvedDate: null,
        approvedBy: null
      };
      
      setAgreements(prev => [newAgreement, ...prev]);
    }
    
    setActiveTab("dashboard");
  };

  // Handler for status updates by approvers
  const handleStatusUpdate = (agreementId, newStatus, approvedDate, finalAgreement = null) => {
    setAgreements(prev => prev.map(agreement => 
      agreement.id === agreementId 
        ? { 
            ...agreement, 
            status: newStatus, 
            approvedDate: approvedDate,
            approvedBy: "Current Approver", // You can get this from user context
            finalAgreement: finalAgreement || agreement.finalAgreement // Add final agreement if provided
          }
        : agreement
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole={userRole} setUserRole={setUserRole} />
      <nav className="flex gap-2 px-8 pt-6 pb-2 bg-white">
        {tabs.map(tab => (
          <button
            key={tab.value}
            className={`px-5 py-2 rounded font-medium border transition-colors duration-150 ${
              tab.value === "dashboard" && activeTab === "dashboard"
                ? "bg-green-100 text-green-800 border-green-200 shadow font-bold"
              : tab.value === "agreements" && activeTab === "agreements"
                ? "bg-orange-100 text-orange-800 border-orange-200 shadow font-bold"
              : tab.value === "new" && activeTab === "new"
                ? "bg-blue-100 text-blue-800 border-blue-200 shadow font-bold"
              : "bg-white border-transparent text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className={
        activeTab === "new" && userRole !== "Approver"
          ? "bg-white border-8 border-blue-600 rounded-xl mx-8 my-6 p-6 transition-all duration-300 text-blue-900 font-bold"
          : ""
      }>
                 {activeTab === "dashboard" && (
           <Dashboard 
             agreements={agreements} 
             userRole={userRole} 
             onStatusUpdate={handleStatusUpdate}
             setViewModal={setViewModal}
             setEditingAgreement={setEditingAgreement}
             setActiveTab={setActiveTab}
           />
         )}
                 {activeTab === "new" && userRole !== "Approver" && (
           <AgreementForm 
             setUserRole={setUserRole} 
             onSubmit={handleAgreementSubmit} 
             editingAgreement={editingAgreement}
             onEditComplete={() => setEditingAgreement(null)}
           />
         )}
         {activeTab === "agreements" && userRole === "Approver" && <AgreementTable agreements={agreements} onStatusUpdate={handleStatusUpdate} />}
       </div>

       {/* View Agreement Modal */}
       {viewModal.open && (
         <ViewAgreementModal 
           agreement={viewModal.agreement} 
           onClose={() => setViewModal({ open: false, agreement: null })} 
         />
       )}
     </div>
   );
 }

 // View Agreement Modal Component
 function ViewAgreementModal({ agreement, onClose }) {
   if (!agreement) return null;

   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
       <div className="bg-white rounded-lg shadow-lg p-8 min-w-[600px] max-w-4xl max-h-[90vh] overflow-y-auto">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-2xl font-bold text-gray-900">📄 Agreement Details</h3>
           <button
             onClick={onClose}
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
               <div><span className="font-medium">Agreement ID:</span> {agreement.id}</div>
               <div><span className="font-medium">Client:</span> {agreement.selectedClient}</div>
               <div><span className="font-medium">Sites:</span> {(agreement.selectedSites || []).join(", ")}</div>
               <div><span className="font-medium">Entity Type:</span> {agreement.entityType}</div>
               <div><span className="font-medium">Status:</span> 
                 <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                   agreement.status === "Approved" ? "bg-green-100 text-green-700" :
                   agreement.status === "Rejected" ? "bg-red-100 text-red-700" :
                   "bg-orange-100 text-orange-700"
                 }`}>
                   {agreement.status}
                 </span>
               </div>
             </div>
           </div>

           {/* Dates */}
           <div className="bg-blue-50 p-4 rounded-lg">
             <h4 className="font-semibold text-gray-800 mb-3">📅 Timeline</h4>
             <div className="space-y-2 text-sm">
               <div><span className="font-medium">Submitted:</span> {agreement.submittedDate}</div>
               <div><span className="font-medium">Start Date:</span> {new Date(agreement.startDate).toLocaleDateString()}</div>
               <div><span className="font-medium">End Date:</span> {new Date(agreement.endDate).toLocaleDateString()}</div>
               {agreement.approvedDate && (
                 <div><span className="font-medium">Approved:</span> {agreement.approvedDate}</div>
               )}
             </div>
           </div>
         </div>

         {/* Contact Information */}
         <div className="mt-6 bg-green-50 p-4 rounded-lg">
           <h4 className="font-semibold text-gray-800 mb-3">👥 Contact Information</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
             <div>
               <h5 className="font-medium text-gray-700 mb-2">I Smart Contact</h5>
               <div>Name: {agreement.form?.iSmartName || 'Not provided'}</div>
               <div>Phone: {agreement.form?.iSmartContact || 'Not provided'}</div>
               <div>Email: {agreement.form?.iSmartEmail || 'Not provided'}</div>
             </div>
             <div>
               <h5 className="font-medium text-gray-700 mb-2">Client Contact</h5>
               <div>Name: {agreement.form?.clientName || 'Not provided'}</div>
               <div>Phone: {agreement.form?.clientContact || 'Not provided'}</div>
               <div>Email: {agreement.form?.clientEmail || 'Not provided'}</div>
             </div>
           </div>
         </div>

         {/* Important Clauses */}
         <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
           <h4 className="font-semibold text-gray-800 mb-3">📝 Important Clauses</h4>
           <div className="space-y-2 text-sm">
             {(agreement.clauses || []).length > 0 ? (
               agreement.clauses.map((clause, idx) => (
                 <div key={idx} className="border-l-2 border-yellow-300 pl-3">
                   <div className="font-medium">{clause.title}</div>
                   {clause.details && <div className="text-gray-600">{clause.details}</div>}
                 </div>
               ))
             ) : (
               <div className="text-gray-500">No clauses specified</div>
             )}
           </div>
         </div>

         {/* Documents */}
         <div className="mt-6 bg-purple-50 p-4 rounded-lg">
           <h4 className="font-semibold text-gray-800 mb-3">📎 Uploaded Documents</h4>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
             {['LOI', 'WO', 'PO', 'Email'].map(docType => (
               <div key={docType} className="flex items-center gap-2">
                 <span className={`w-3 h-3 rounded-full ${
                   agreement.uploadStatuses?.[docType]?.uploaded ? 'bg-green-500' : 'bg-gray-300'
                 }`}></span>
                 <span>{docType}</span>
               </div>
             ))}
           </div>
         </div>

         {/* Group Companies (if applicable) */}
         {agreement.entityType === 'group' && agreement.underList && (
           <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
             <h4 className="font-semibold text-gray-800 mb-3">🏢 Group Companies</h4>
             <div className="space-y-1 text-sm">
               {agreement.underList.map((item, idx) => (
                 <div key={idx}>• {item.value || 'Not specified'}</div>
               ))}
             </div>
           </div>
         )}

         <div className="flex justify-end mt-8">
           <button
             onClick={onClose}
             className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
           >
             Close
           </button>
         </div>
       </div>
     </div>
   );
 }

export default App;
