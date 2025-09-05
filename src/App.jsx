import React, { useState } from "react";
import AgreementForm from "./forms/AgreementForm";
import ReportFilterForm from "./forms/ReportFilterForm";
import AgreementTable from "./forms/AgreementTable";
import AgreementCards from "./forms/AgreementCards";
import AddendumForm from "./forms/AddendumForm";
import AddendumTable from "./forms/AddendumTable";
import Header from "./components/ui/Header";
import TabNav from "./components/ui/TabNav"; 
 
// Helper function to format date without timezone
const formatDateWithoutTimezone = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const milliseconds = String(d.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
};

function Dashboard({ agreements, addendums, userRole, setViewModal, setEditingAgreement, setActiveTab, handleCreateAddendum }) {
  // Show up to 5 most recent submissions
  const recentSubmissions = agreements.slice(0, 5);

  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0];

  // Calculate expiring contracts (within 30 days)
  const expiringContracts = agreements.filter(agreement => {
    if (!agreement.endDate || agreement.status !== "Approved") return false;
    const endDate = new Date(agreement.endDate);
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysToExpiry > 0 && daysToExpiry <= 30;
  });

  // Calculate critical expiring contracts (within 7 days)
  const criticalExpiringContracts = expiringContracts.filter(agreement => {
    const endDate = new Date(agreement.endDate);
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysToExpiry <= 7;
  });

  // Static expiring contracts data for demonstration
  const staticExpiringContracts = [
    {
      id: "STATIC-001",
      selectedClient: "TechCorp Solutions",
      selectedBranches: [{ name: "Mumbai Central" }, { name: "Pune" }],
      endDate: formatDateWithoutTimezone(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 days
      status: "Approved",
      submittedDate: "2024-01-15",
      submittedBy: "John Doe"
    },
    {
      id: "STATIC-002", 
      selectedClient: "Global Industries Ltd",
      selectedBranches: [{ name: "Delhi" }, { name: "Gurgaon" }, { name: "Noida" }],
      endDate: formatDateWithoutTimezone(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)), // 8 days
      status: "Approved",
      submittedDate: "2024-01-10",
      submittedBy: "Jane Smith"
    }
  ];

  // Combine real and static expiring contracts, but prioritize real ones
  const allExpiringContracts = [...expiringContracts, ...staticExpiringContracts].slice(0, 5);

  // Calculate critical static contracts (within 7 days)
  const criticalStaticContracts = staticExpiringContracts.filter(agreement => {
    const endDate = new Date(agreement.endDate);
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysToExpiry <= 7;
  });

  const allCriticalExpiringContracts = [...criticalExpiringContracts, ...criticalStaticContracts];

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
Branches: ${(agreement.selectedBranches || []).map(branch => branch.name).join(", ")}
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
`).join('\n')}

DOCUMENTS:
==========
${Object.entries(agreement.uploadStatuses || {}).map(([type, status]) => 
  `${type}: ${status.uploaded ? 'Uploaded' : 'Not uploaded'}`
).join('\n')}

UNDER LIST/ANNEXURE:
===================
${(agreement.underList || []).map((item, idx) => 
  `${idx + 1}. ${item.placeholder || 'No details provided'}`
).join('\n')}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([agreementContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Agreement_${agreement.id}_${agreement.selectedClient}.txt`;
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



    return (
      <div className="px-8 py-6">
        {/* Contract Expiry Alert Banner */}
        {allExpiringContracts.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-100 to-red-100 border-l-4 border-orange-500 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-orange-800">
                    Contract Expiry Alert: {allExpiringContracts.length} contract{allExpiringContracts.length !== 1 ? 's' : ''} expiring soon
                  </h3>
                  <p className="text-orange-700 text-sm">
                    {allCriticalExpiringContracts.length > 0 
                      ? `${allCriticalExpiringContracts.length} contract${allCriticalExpiringContracts.length !== 1 ? 's' : ''} expiring within 7 days`
                      : 'Contracts expiring within 30 days'
                    }
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab("agreements")}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
              >
                View All Contracts
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-6 gap-6 mb-8">
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
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">{allExpiringContracts.length}</div>
            <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
              <span>Expiring Soon</span>
              <span role="img" aria-label="expiring">⏰</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{addendums.length}</div>
            <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
              <span>Total Addendums</span>
              <span role="img" aria-label="addendums">📝</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Priority Actions */}
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
                      <div className="text-gray-500 text-sm">{(agreement.selectedBranches || []).map(branch => branch.name).join(", ")}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Submitted by: {agreement.submittedBy} • {agreement.daysPending} days ago
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Priority Badge - Only for Approver Role */}
                      {userRole?.toLowerCase() !== "checker" && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        agreement.priority === "High" ? "bg-red-100 text-red-700" :
                        agreement.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {agreement.priority}
                      </span>
                      )}
                      <button 
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        onClick={() => setViewModal({ open: true, agreement })}
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expiring Contracts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-2">Expiring Contracts</h2>
            <p className="text-gray-500 mb-4">Contracts expiring within 30 days</p>
            <div className="divide-y">
              {allExpiringContracts.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No contracts expiring soon</div>
              ) : (
                allExpiringContracts.slice(0, 5).map((agreement) => {
                  const endDate = new Date(agreement.endDate);
                  const today = new Date();
                  const timeDiff = endDate.getTime() - today.getTime();
                  const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
                  const isStatic = agreement.id.startsWith('STATIC-');
                  
                  return (
                    <div className="flex items-center justify-between py-4" key={agreement.id}>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {agreement.selectedClient}
                          {isStatic && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-sm">{(agreement.selectedBranches || []).map(branch => branch.name).join(", ")}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Expires: {endDate.toLocaleDateString()} • {daysToExpiry} days left
                          {isStatic && " • Demo Data"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          daysToExpiry <= 7 ? "bg-red-100 text-red-700" :
                          daysToExpiry <= 14 ? "bg-orange-100 text-orange-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {daysToExpiry <= 7 ? "Critical" : daysToExpiry <= 14 ? "Urgent" : "Warning"}
                        </span>
                        <button 
                          className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                          onClick={() => setViewModal({ open: true, agreement })}
                        >
                          View
                        </button>
                        {!isStatic && (
                            <button 
                              className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                              onClick={() => handleCreateAddendum(agreement)}
                            >
                              Addendum
                            </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {allExpiringContracts.length > 5 && (
              <div className="mt-4 text-center">
                <button 
                  onClick={() => setActiveTab("agreements")}
                  className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                >
                  View all {allExpiringContracts.length} expiring contracts →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Checker Dashboard (default) - Shows interconnected data
  return (
    <div className="px-8 py-6">
      {/* Contract Expiry Alert Banner */}
      {allExpiringContracts.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-orange-100 to-red-100 border-l-4 border-orange-500 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-orange-800">
                  Contract Expiry Alert: {allExpiringContracts.length} contract{allExpiringContracts.length !== 1 ? 's' : ''} expiring soon
                </h3>
                <p className="text-orange-700 text-sm">
                  {allCriticalExpiringContracts.length > 0 
                    ? `${allCriticalExpiringContracts.length} contract${allCriticalExpiringContracts.length !== 1 ? 's' : ''} expiring within 7 days`
                    : 'Contracts expiring within 30 days'
                  }
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab("agreements")}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
            >
              View All Contracts
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-6 mb-8">
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
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-orange-600">{allExpiringContracts.length}</div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Expiring Soon</span>
            <span role="img" aria-label="expiring">⏰</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">{addendums.length}</div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Total Addendums</span>
            <span role="img" aria-label="addendums">📝</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {agreements.filter(agreement => 
              addendums.some(addendum => addendum.parentAgreementId === agreement.id)
            ).length}
          </div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Contracts with Addendums</span>
            <span role="img" aria-label="contracts-with-addendums">📎</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Submissions */}
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
                    <div className="font-semibold flex items-center gap-2">
                      {agreement.selectedClient}
                      {/* Addendums Count Indicator */}
                      {(() => {
                        const addendumsCount = addendums.filter(addendum => 
                          addendum.parentAgreementId === agreement.id
                        ).length;
                        return addendumsCount > 0 ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                            📎 {addendumsCount}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="text-gray-500 text-sm">{(agreement.selectedBranches || []).map(branch => branch.name).join(", ")}</div>
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

                        <button 
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium hover:bg-orange-200"
                          onClick={() => handleEditAgreement(agreement)}
                          title="Edit Agreement"
                        >
                          ✏️ Edit
                        </button>

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

        {/* Expiring Contracts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Expiring Contracts</h2>
          <p className="text-gray-500 mb-4">Your contracts expiring within 30 days</p>
          <div className="divide-y">
            {allExpiringContracts.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No contracts expiring soon</div>
            ) : (
              allExpiringContracts.slice(0, 5).map((agreement) => {
                const endDate = new Date(agreement.endDate);
                const today = new Date();
                const timeDiff = endDate.getTime() - today.getTime();
                const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
                const isStatic = agreement.id.startsWith('STATIC-');
                
                return (
                  <div className="flex items-center justify-between py-3" key={agreement.id}>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {agreement.selectedClient}
                        {isStatic && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-sm">{(agreement.selectedBranches || []).map(branch => branch.name).join(", ")}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Expires: {endDate.toLocaleDateString()} • {daysToExpiry} days left
                        {isStatic && " • Demo Data"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        daysToExpiry <= 7 ? "bg-red-100 text-red-700" :
                        daysToExpiry <= 14 ? "bg-orange-100 text-orange-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {daysToExpiry <= 7 ? "Critical" : daysToExpiry <= 14 ? "Urgent" : "Warning"}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                          onClick={() => handleViewAgreement(agreement)}
                          title="View Agreement Details"
                        >
                          👁️ View
                        </button>
                        {!isStatic && (
                            <button 
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200"
                              onClick={() => handleCreateAddendum(agreement)}
                              title="Create Addendum"
                            >
                              📝 Addendum
                            </button>
                        )}
                        <button 
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                          onClick={() => handleEditAgreement(agreement)}
                          title="Renew Agreement"
                        >
                          🔄 Renew
                        </button>
                        <button 
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200"
                          onClick={() => handleDownloadAgreement(agreement)}
                          title="Download Agreement Copy"
                        >
                          📥 Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {allExpiringContracts.length > 5 && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => setActiveTab("agreements")}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                View all {allExpiringContracts.length} expiring contracts →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [userRole, setUserRole] = useState("Checker");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [agreements, setAgreements] = useState([
    {
      id: "STATIC-001",
      selectedClient: "TechCorp Solutions",
      selectedDepartment: "IT Services",
      agreementType: "LOI",
      startDate: "2024-01-15",
      endDate: "2024-12-31",
      totalValue: 50000,
      currency: "USD",
      status: "Execution Pending",
      submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
      submittedBy: "checker",
      entityType: "single",
      priority: "Medium",
      clauses: [
        { title: "Term and termination (Duration)", placeholder: "12 months", isInitial: true },
        { title: "Payment Terms", placeholder: "15 days", isInitial: true },
        { title: "Penalty", placeholder: "500/-", isInitial: true },
        { title: "Minimum Wages", placeholder: "Yearly / Not Allowed / At Actual", isInitial: true },
        { title: "Costing - Salary Breakup", placeholder: "Yes / No", isInitial: true },
        { title: "SLA", placeholder: "Specific Page/Clause", isInitial: true },
        { title: "Indemnity", placeholder: "Specific Page/Clause", isInitial: true },
        { title: "Insurance", placeholder: "Specific Page/Clause", isInitial: true }
      ],
      uploadStatuses: {
        LOI: { uploaded: true, file: { name: "TechCorp_LOI.pdf", size: "2.1 MB" } },
        WO: { uploaded: true, file: { name: "TechCorp_WO.pdf", size: "1.8 MB" } },
        PO: { uploaded: true, file: { name: "TechCorp_PO.pdf", size: "3.2 MB" } },
        EmailApproval: { uploaded: true, file: { name: "TechCorp_Email.pdf", size: "0.5 MB" } },
        "clause-0": { uploaded: true, file: { name: "term_termination.pdf", size: "0.8 MB" } },
        "clause-1": { uploaded: true, file: { name: "payment_terms.pdf", size: "0.6 MB" } },
        "clause-2": { uploaded: true, file: { name: "penalty.pdf", size: "0.4 MB" } }
      },
      uploadedFiles: {
        LOI: { name: "TechCorp_LOI.pdf", size: "2.1 MB" },
        WO: { name: "TechCorp_WO.pdf", size: "1.8 MB" },
        PO: { name: "TechCorp_PO.pdf", size: "3.2 MB" },
        EmailApproval: { name: "TechCorp_Email.pdf", size: "0.5 MB" }
      },
      importantClauses: [
        "Term and termination",
        "Payment Terms",
        "SLA",
        "Insurance",
        "Confidentiality"
      ],
      selectedBranches: [
        { name: "Mumbai Central", id: "branch-001" },
        { name: "Andheri West", id: "branch-002" }
      ],
      createdAt: "2024-01-10T10:00:00",
      lastModified: "2024-01-15T14:30:00",
      version: "1.0.0",
      versionHistory: [
        {
          version: "1.0.0",
          date: "2024-01-15T14:30:00",
          type: "initial",
          description: "Original agreement creation",
          modifiedBy: "System",
          changes: []
        }
      ]
    },
    {
      id: "STATIC-002",
      selectedClient: "Global Industries",
      selectedDepartment: "Manufacturing",
      agreementType: "WO",
      startDate: "2024-02-01",
      endDate: "2025-01-31",
      totalValue: 75000,
      currency: "EUR",
      status: "Executed",
      submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)),
      submittedBy: "checker",
      entityType: "single",
      priority: "Low",
      clauses: [
        { title: "Quality Standards", placeholder: "ISO 9001", isInitial: true },
        { title: "Delivery Schedule", placeholder: "30 days", isInitial: true },
        { title: "Service Level Agreement", placeholder: "Business hours support", isInitial: true },
        { title: "Warranty", placeholder: "1 year", isInitial: true },
        { title: "Force Majeure", placeholder: "Standard terms", isInitial: true }
      ],
      uploadStatuses: {
        WO: { uploaded: true, file: { name: "Global_WO.pdf", size: "2.5 MB" } },
        PO: { uploaded: true, file: { name: "Global_PO.pdf", size: "4.1 MB" } },
        "clause-0": { uploaded: true, file: { name: "quality_standards.pdf", size: "1.2 MB" } },
        "clause-1": { uploaded: true, file: { name: "delivery_schedule.pdf", size: "0.9 MB" } },
        "clause-2": { uploaded: true, file: { name: "service_level_agreement.pdf", size: "1.5 MB" } }
      },
      uploadedFiles: {
        WO: { name: "Global_WO.pdf", size: "2.5 MB" },
        PO: { name: "Global_PO.pdf", size: "4.1 MB" }
      },
      importantClauses: [
        "Quality Standards",
        "Delivery Schedule",
        "Warranty",
        "Force Majeure"
      ],
      selectedBranches: [
        { name: "Pune Industrial", id: "branch-003" }
      ],
      createdAt: "2024-01-25T09:15:00",
      lastModified: "2024-02-01T11:45:00",
      version: "1.0.0",
      versionHistory: [
        {
          version: "1.0.0",
          date: "2024-02-01T11:45:00",
          type: "initial",
          description: "Original agreement creation",
          modifiedBy: "System",
          changes: []
        }
      ]
    },
    {
      id: "STATIC-003",
      selectedClient: "Healthcare Plus",
      selectedDepartment: "Medical Services",
      agreementType: "PO",
      startDate: "2024-03-01",
      endDate: "2024-08-31",
      totalValue: 120000,
      currency: "USD",
             status: "Pending Review",
       submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
       submittedBy: "checker",
      entityType: "multiple",
      priority: "High",
      clauses: [
        { title: "Medical Standards", placeholder: "FDA Approved", isInitial: true },
        { title: "Compliance Requirements", placeholder: "HIPAA Standards", isInitial: true },
        { title: "Emergency Response", placeholder: "24/7 Support", isInitial: true },
        { title: "Quality Assurance", placeholder: "Monthly Reviews", isInitial: true }
      ],
      uploadStatuses: {
        PO: { uploaded: true, file: { name: "Healthcare_PO.pdf", size: "3.8 MB" } },
        LOI: { uploaded: true, file: { name: "Healthcare_LOI.pdf", size: "2.2 MB" } },
        "clause-0": { uploaded: true, file: { name: "medical_standards.pdf", size: "1.5 MB" } },
        "clause-1": { uploaded: true, file: { name: "compliance_requirements.pdf", size: "2.1 MB" } }
      },
      uploadedFiles: {
        PO: { name: "Healthcare_PO.pdf", size: "3.8 MB" },
        LOI: { name: "Healthcare_LOI.pdf", size: "2.2 MB" }
      },
      importantClauses: [
        "Medical Standards",
        "Compliance Requirements",
        "Emergency Response",
        "Quality Assurance"
      ],
      selectedBranches: [
        { name: "Delhi Medical", id: "branch-004" },
        { name: "Bangalore Health", id: "branch-005" }
      ],
      createdAt: "2024-02-15T08:30:00",
      lastModified: "2024-03-01T16:20:00",
      version: "1.0.0",
      versionHistory: [
        {
          version: "1.0.0",
          date: "2024-03-01T16:20:00",
          type: "initial",
          description: "Original agreement creation",
          modifiedBy: "System",
          changes: []
        }
             ]
     },
     // Demo approved agreements for history tab presentation
     {
       id: "DEMO-APPROVED-001",
       selectedClient: "TechCorp Solutions",
       selectedDepartment: "IT Services",
       agreementType: "LOI",
       startDate: "2024-01-15",
       endDate: "2024-12-31",
       totalValue: 50000,
       currency: "USD",
       status: "Approved",
       submittedDate: "2024-01-10",
       approvedDate: "2024-01-18",
       submittedBy: "checker",
       approvedBy: "approver",
       entityType: "single",
       priority: "Medium",
       clauses: [
         { title: "Term and termination (Duration)", placeholder: "12 months", isInitial: true },
         { title: "Payment Terms", placeholder: "15 days", isInitial: true },
         { title: "SLA", placeholder: "99.9% uptime", isInitial: true }
       ],
       selectedBranches: [
         { name: "Mumbai Central", id: "branch-001" },
         { name: "Pune", id: "branch-002" }
       ],
       createdAt: "2024-01-10T10:00:00",
       lastModified: "2024-01-18T14:30:00",
       version: "1.0.0"
     },
     {
       id: "DEMO-APPROVED-002",
       selectedClient: "Global Industries Ltd",
       selectedDepartment: "Manufacturing",
       agreementType: "WO",
       startDate: "2024-02-01",
       endDate: "2025-01-31",
       totalValue: 75000,
       currency: "EUR",
       status: "Approved",
       submittedDate: "2024-01-25",
       approvedDate: "2024-02-05",
       submittedBy: "checker",
       approvedBy: "approver",
       entityType: "single",
       priority: "Low",
       clauses: [
         { title: "Quality Standards", placeholder: "ISO 9001", isInitial: true },
         { title: "Delivery Schedule", placeholder: "30 days", isInitial: true },
         { title: "Warranty", placeholder: "1 year", isInitial: true }
       ],
       selectedBranches: [
         { name: "Delhi", id: "branch-003" },
         { name: "Gurgaon", id: "branch-004" },
         { name: "Noida", id: "branch-005" }
       ],
       createdAt: "2024-01-25T09:15:00",
       lastModified: "2024-02-05T11:45:00",
       version: "1.0.0"
     },
     {
       id: "DEMO-APPROVED-003",
       selectedClient: "Healthcare Plus",
       selectedDepartment: "Medical Services",
       agreementType: "PO",
       startDate: "2024-03-01",
       endDate: "2024-08-31",
       totalValue: 120000,
       currency: "USD",
       status: "Approved",
       submittedDate: "2024-02-15",
       approvedDate: "2024-02-28",
       submittedBy: "checker",
       approvedBy: "approver",
       entityType: "multiple",
       priority: "High",
       clauses: [
         { title: "Medical Standards", placeholder: "FDA Approved", isInitial: true },
         { title: "Compliance Requirements", placeholder: "HIPAA Standards", isInitial: true },
         { title: "Emergency Response", placeholder: "24/7 Support", isInitial: true }
       ],
       selectedBranches: [
         { name: "Delhi Medical", id: "branch-006" },
         { name: "Bangalore Health", id: "branch-007" }
       ],
       createdAt: "2024-02-15T08:30:00",
       lastModified: "2024-02-28T16:20:00",
       version: "1.0.0"
     }
   ]);
   const [editingAgreement, setEditingAgreement] = useState(null);
  const [viewModal, setViewModal] = useState({ open: false, agreement: null });
  const [historyFilters, setHistoryFilters] = useState({ status: "approved", search: "" });
  
     // Addendum state - combines demo data with dynamic user-created addendums
   const [addendums, setAddendums] = useState([
     // Demo addendum data (for demonstration purposes)
     {
       id: "ADD001",
       title: "Extension of Service Period",
       description: "Extend the service period by 6 months due to project delays",
       reason: "Client requested extension due to unforeseen project delays and additional requirements",
       impact: "Service period extended from 12 months to 18 months. No change in pricing or terms.",
       effectiveDate: formatDateWithoutTimezone(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
       submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
       submittedBy: "checker",
       status: "Approved",
       parentAgreementId: "STATIC-001",
       parentAgreementTitle: "TechCorp Solutions",
       isDemo: true, // Flag to identify demo data
       uploadedFiles: {
         supportingDoc: { uploaded: true, name: "extension_request.pdf", isDemo: true },
         amendmentDoc: { uploaded: true, name: "amendment_agreement.pdf", isDemo: true }
       },
       clauseModifications: [
         {
           clauseNumber: "1",
           clauseTitle: "Term and termination (Duration)",
           modificationType: "Modified",
           details: "Duration extended from 12 months to 18 months",
           previousValue: "12 months",
           newValue: "18 months"
         },
         {
           clauseNumber: "2",
           clauseTitle: "Payment Terms",
           modificationType: "Modified",
           details: "Payment terms adjusted to accommodate extended period",
           previousValue: "15 days",
           newValue: "30 days"
         }
       ],
       // Versioning metadata
       version: "1.0.0",
       versionHistory: [
         {
           version: "1.0.0",
           date: formatDateWithoutTimezone(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
           type: "initial",
           description: "Initial addendum submission",
           modifiedBy: "checker",
           changes: ["Service period extension", "Payment terms adjustment"]
         }
       ]
     },
     // New demo addendum with Pending Review status for testing edit functionality
     {
       id: "ADD002",
       title: "Additional Service Requirements",
       description: "Add new service requirements for enhanced client support",
       reason: "Client requested additional support services and monitoring capabilities",
       impact: "Additional monthly cost of $2,000 for enhanced services. Improved client satisfaction.",
       effectiveDate: formatDateWithoutTimezone(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)), // 15 days from now
       submittedDate: formatDateWithoutTimezone(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
       submittedBy: "checker",
       status: "Pending Review", // This status allows editing
       parentAgreementId: "STATIC-002",
       parentAgreementTitle: "Global Industries",
       isDemo: true,
       uploadedFiles: {
         supportingDoc: { uploaded: true, name: "service_requirements.pdf", isDemo: true },
         amendmentDoc: { uploaded: true, name: "service_amendment.pdf", isDemo: true }
       },
       clauseModifications: [
         {
           clauseNumber: "3",
           clauseTitle: "Service Level Agreement",
           modificationType: "Modified",
           details: "Enhanced SLA with 24/7 support and monitoring",
           previousValue: "Business hours support",
           newValue: "24/7 support with monitoring"
         }
       ],
       version: "1.0.0",
       versionHistory: [
         {
           version: "1.0.0",
           date: formatDateWithoutTimezone(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
           type: "initial",
           description: "Initial addendum submission for additional services",
           modifiedBy: "checker",
           changes: ["Enhanced SLA", "24/7 support", "Monitoring services"]
         }
       ]
     }
   ]);
  const [editingAddendum, setEditingAddendum] = useState(null);
  const [showAddendumForm, setShowAddendumForm] = useState(false);
  const [parentAgreementForAddendum, setParentAgreementForAddendum] = useState(null);
  const [showAddendumSuccess, setShowAddendumSuccess] = useState(false);
  const [addendumSuccessMessage, setAddendumSuccessMessage] = useState("");
  const [lastSubmittedAddendum, setLastSubmittedAddendum] = useState(null);
  const [showAgreementSuccess, setShowAgreementSuccess] = useState(false);
  const [agreementSuccessMessage, setAgreementSuccessMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  // Tabs to show based on role
  let tabs = [];
  if (userRole === "Approver") {
    tabs = [
      { label: "Dashboard", value: "dashboard" },
      { label: "Agreements", value: "agreements" },
      { label: "History", value: "history" },
    ];
  } else {
    tabs = [
      { label: "Dashboard", value: "dashboard" },
      { label: "New Agreement", value: "new" },
      { label: "Agreements", value: "agreements" },
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
        submittedBy: userRole, // Use the actual user role
        approvedDate: null,
        approvedBy: null,
        // Add missing fields that might be needed for display
        createdAt: formatDateWithoutTimezone(new Date()),
        lastModified: formatDateWithoutTimezone(new Date()),
        version: "1.0.0",
        versionHistory: [
          {
            version: "1.0.0",
            date: formatDateWithoutTimezone(new Date()),
            type: "initial",
            description: "Original agreement creation",
            modifiedBy: userRole,
            changes: []
          }
        ]
      };
      
      setAgreements(prev => [newAgreement, ...prev]);
      
      // Show success message
      setAgreementSuccessMessage(`✅ Agreement "${agreementData.selectedClient}" created successfully!`);
      setShowAgreementSuccess(true);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowAgreementSuccess(false);
        setAgreementSuccessMessage("");
      }, 5000);
    }
    
    // Stay on the agreements tab to see the newly created agreement
    setActiveTab("agreements");
  };

  // Handler for status updates by approvers
  const handleStatusUpdate = (agreementId, newStatus, approvedDate, finalAgreement = null, priority = null) => {
    setAgreements(prev => prev.map(agreement => 
      agreement.id === agreementId 
        ? { 
            ...agreement, 
            status: newStatus || agreement.status, 
            approvedDate: approvedDate || agreement.approvedDate,
            approvedBy: newStatus ? "Current Approver" : agreement.approvedBy, // You can get this from user context
            finalAgreement: finalAgreement || agreement.finalAgreement, // Add final agreement if provided
            priority: priority || agreement.priority // Update priority if provided
          }
        : agreement
    ));
  };

  // Enhanced versioning system for legal compliance and audit trails
  const createVersionEntry = (type, data, currentVersion) => {
    const timestamp = formatDateWithoutTimezone(new Date());
    const versionParts = currentVersion ? currentVersion.split('.').map(Number) : [1, 0, 0];
    
    let newVersion;
    if (type === "addendum") {
      // Major version bump for addendums (significant changes)
      newVersion = `${versionParts[0] + 1}.0.0`;
    } else if (type === "status_change") {
      // Minor version bump for status changes
      newVersion = `${versionParts[0]}.${versionParts[1] + 1}.0`;
    } else if (type === "minor_update") {
      // Patch version bump for minor updates
      newVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2] + 1}`;
    } else {
      newVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2] + 1}`;
    }

    return {
      version: newVersion,
      type: type,
      timestamp: timestamp,
      description: type === "addendum" ? `Addendum "${data.title}" applied` : `Status changed to ${data}`,
      addendum: type === "addendum" ? {
        id: data.id,
        title: data.title,
        status: data.status,
        submittedBy: data.submittedBy,
        submittedDate: data.submittedDate,
        clauseModifications: data.clauseModifications || [],
        reason: data.reason,
        impact: data.impact
      } : null,
      user: type === "addendum" ? data.submittedBy : userRole,
      changes: type === "addendum" ? {
        clausesModified: data.clauseModifications?.length || 0,
        documentsAdded: Object.keys(data.uploadedFiles || {}).length,
        effectiveDate: data.effectiveDate,
        reason: data.reason,
        impact: data.impact
      } : null,
      metadata: {
        ipAddress: "127.0.0.1", // In real app, capture actual IP
        userAgent: navigator.userAgent,
        sessionId: Date.now().toString(),
        complianceLevel: "legal_audit_trail"
      }
    };
  };

  const updateAgreementVersion = (agreementId, addendumData) => {
    setAgreements(prev => prev.map(agreement => {
      if (agreement.id === agreementId) {
        // Ensure versionHistory exists and is an array
        const currentVersionHistory = Array.isArray(agreement.versionHistory) ? agreement.versionHistory : [];
        
        // Create comprehensive version entry
        const newVersion = createVersionEntry("addendum", addendumData, agreement.version);
        
        // Enhanced version tracking with legal compliance data
        const enhancedVersion = {
          ...newVersion,
          legalCompliance: {
            changeType: "addendum_application",
            riskLevel: addendumData.impact?.toLowerCase().includes("high") ? "HIGH" : "MEDIUM",
            requiresApproval: addendumData.status === "Pending Review",
            auditTrail: {
              previousVersion: agreement.version,
              newVersion: newVersion.version,
              changeSummary: `Addendum ${addendumData.id} applied with ${addendumData.clauseModifications?.length || 0} clause modifications`,
              complianceCheck: "PASSED",
              timestamp: formatDateWithoutTimezone(new Date())
            }
          }
        };

        return {
          ...agreement,
          version: newVersion.version,
          lastModified: formatDateWithoutTimezone(new Date()),
          versionHistory: [...currentVersionHistory, enhancedVersion],
          addendumCount: (agreement.addendumCount || 0) + 1,
          lastAddendumDate: addendumData.submittedDate,
          complianceStatus: "UPDATED"
        };
      }
      return agreement;
    }));
  };

  // Addendum handlers
  const handleAddendumSubmit = (addendumData) => {
    console.log("=== PARENT: handleAddendumSubmit called ===");
    
    try {
      if (addendumData.id) {
        // Update existing addendum
        const updatedAddendum = { ...addendumData, lastModified: formatDateWithoutTimezone(new Date()) };
        setAddendums(prev => prev.map(addendum => 
          addendum.id === addendumData.id ? updatedAddendum : addendum
        ));
        
        if (addendumData.parentAgreementId) {
          updateAgreementVersion(addendumData.parentAgreementId, updatedAddendum);
        }
      } else {
        // Create new addendum
        const newAddendum = {
          id: `ADD${Date.now()}`,
          ...addendumData,
          status: "Pending Review",
          isDemo: false,
          createdAt: formatDateWithoutTimezone(new Date()),
          lastModified: formatDateWithoutTimezone(new Date()),
          version: "1.0.0"
        };
        
        setAddendums(prev => [newAddendum, ...prev]);
        
        if (addendumData.parentAgreementId) {
          updateAgreementVersion(addendumData.parentAgreementId, newAddendum);
        }
      }
      
      // Show success message
      setAddendumSuccessMessage(
        addendumData.id 
          ? `Addendum "${addendumData.title}" updated successfully!` 
          : `Addendum "${addendumData.title}" submitted successfully for review!`
      );
      setShowAddendumSuccess(true);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowAddendumSuccess(false);
      }, 5000);
      
      // Close the modal immediately
      setShowAddendumForm(false);
      setEditingAddendum(null);
      setParentAgreementForAddendum(null);
      
    } catch (error) {
      console.error("Error in handleAddendumSubmit:", error);
      setErrorModalMessage("Error submitting addendum: " + error.message);
      setShowErrorModal(true);
    }
  };

  const handleCreateAddendum = (agreement, mode = 'addendum') => {
    if (mode === 'edit') {
      // Open agreement form in edit mode
      setEditingAgreement(agreement);
      setShowAgreementForm(true);
      setActiveTab("newAgreement");
    } else {
      // Open addendum form (default behavior)
      setParentAgreementForAddendum(agreement);
      setShowAddendumForm(true);
      setEditingAddendum(null);
    }
  };

  const handleEditAddendum = (addendum) => {
    setEditingAddendum(addendum);
    setParentAgreementForAddendum(agreements.find(a => a.id === addendum.parentAgreementId));
    setShowAddendumForm(true);
  };

  const handleAddendumStatusUpdate = (addendumId, newStatus) => {
    setAddendums(prev => prev.map(addendum => 
      addendum.id === addendumId 
        ? { ...addendum, status: newStatus }
        : addendum
    ));
  };

  // Track status changes with versioning for audit trails
  const trackStatusChange = (agreementId, oldStatus, newStatus, reason = "") => {
    setAgreements(prev => prev.map(agreement => {
      if (agreement.id === agreementId) {
        const currentVersionHistory = Array.isArray(agreement.versionHistory) ? agreement.versionHistory : [];
        
        const statusVersion = createVersionEntry("status_change", newStatus, agreement.version);
        
        const enhancedStatusVersion = {
          ...statusVersion,
          legalCompliance: {
            changeType: "status_modification",
            riskLevel: "LOW",
            requiresApproval: false,
            auditTrail: {
              previousStatus: oldStatus,
              newStatus: newStatus,
              changeReason: reason,
              previousVersion: agreement.version,
              newVersion: statusVersion.version,
              changeSummary: `Status changed from ${oldStatus} to ${newStatus}`,
              complianceCheck: "PASSED",
              timestamp: formatDateWithoutTimezone(new Date())
            }
          }
        };

        return {
          ...agreement,
          version: statusVersion.version,
          lastModified: formatDateWithoutTimezone(new Date()),
          versionHistory: [...currentVersionHistory, enhancedStatusVersion],
          status: newStatus,
          complianceStatus: "STATUS_UPDATED"
        };
      }
      return agreement;
    }));
  };

  return (
    <div className="min-h-screen">
      <Header userRole={userRole} setUserRole={setUserRole} />
      
      {/* Addendum Success Notification */}
      {showAddendumSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <span className="text-xl">✅</span>
          <span className="font-medium">{addendumSuccessMessage}</span>
          <div className="flex items-center gap-2 ml-4">
            {lastSubmittedAddendum && (
              <button
                onClick={() => {
                  setShowAddendumSuccess(false);
                  setActiveTab("addendums");
                }}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                View Addendum
              </button>
            )}
            <button
              onClick={() => setShowAddendumSuccess(false)}
              className="text-green-700 hover:text-green-900 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Agreement Success Notification */}
      {showAgreementSuccess && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-[9999] bg-blue-100 border border-blue-400 text-blue-700 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <span className="text-xl">📄</span>
          <span className="font-medium">{agreementSuccessMessage}</span>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setShowAgreementSuccess(false)}
              className="text-blue-700 hover:text-blue-900 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <span className="text-xl">❌</span>
          <span className="font-medium">{errorModalMessage}</span>
          <button
            onClick={() => setShowErrorModal(false)}
            className="text-red-700 hover:text-red-900 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

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
              : tab.value === "history" && activeTab === "history"
                ? "bg-purple-100 text-purple-800 border-purple-200 shadow font-bold"
              : "bg-white border-transparent text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className={
        activeTab === "new" && (userRole !== "Approver" || editingAgreement)
          ? "bg-white  duration-300 text-blue-900 font-bold"
          : ""
      }>
                 {activeTab === "dashboard" && (
           <Dashboard 
             agreements={agreements} 
             addendums={addendums}
             userRole={userRole} 
             setViewModal={setViewModal}
             setEditingAgreement={setEditingAgreement}
             setActiveTab={setActiveTab}
             handleCreateAddendum={handleCreateAddendum}
           />
         )}
                 {activeTab === "new" && (userRole !== "Approver" || editingAgreement) && (
                   <div>
                     {console.log("Rendering AgreementForm - userRole:", userRole, "editingAgreement:", editingAgreement)}
                     <AgreementForm 
                       setUserRole={setUserRole} 
                       onSubmit={handleAgreementSubmit} 
                       editingAgreement={editingAgreement}
                       onEditComplete={() => setEditingAgreement(null)}
                       onCreateAddendum={handleCreateAddendum}
                     />
                   </div>
                 )}
                          {activeTab === "agreements" && (
                            userRole === "Approver" ? (
                              <AgreementTable agreements={agreements} addendums={addendums} onStatusUpdate={handleStatusUpdate} onAddendumStatusUpdate={handleAddendumStatusUpdate} userRole={userRole} onCreateAddendum={handleCreateAddendum} />
                            ) : (
                              <AgreementCards agreements={agreements} addendums={addendums} onStatusUpdate={handleStatusUpdate} onAddendumStatusUpdate={handleAddendumStatusUpdate} userRole={userRole} onCreateAddendum={handleCreateAddendum} onEditAgreement={setEditingAgreement} editingAgreement={editingAgreement} onEditComplete={() => setEditingAgreement(null)} onAddendumSubmit={handleAddendumSubmit} />
                            )
                          )}
         {activeTab === "addendums" && (
           <AddendumTable 
             addendums={addendums} 
             onStatusUpdate={handleAddendumStatusUpdate}
             onEditAddendum={handleEditAddendum}
             userRole={userRole}
           />
         )}
         {activeTab === "history" && (
           <div className="px-8 py-6">
             {/* History Tab Content */}
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <div>
                   <h3 className="text-lg font-semibold text-gray-900">Approved Agreements History</h3>
                   <p className="text-gray-600 text-sm">View all approved agreements and their details</p>
                 </div>
               </div>

               {/* Search Bar */}
               <div className="relative">
                 <input
                   type="text"
                   placeholder="Search by client name..."
                   value={historyFilters.search}
                   onChange={(e) => setHistoryFilters(prev => ({ ...prev, search: e.target.value }))}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 />
               </div>

               {/* Filter Approved Agreements */}
               {(() => {
                 // Filter approved agreements from the actual agreements data
                 const approvedAgreements = agreements.filter(agreement => 
                   agreement.status === "Approved" && 
                   (!historyFilters.search || 
                    agreement.clientName?.toLowerCase().includes(historyFilters.search.toLowerCase()) ||
                    agreement.selectedClient?.toLowerCase().includes(historyFilters.search.toLowerCase()))
                 );

                 return (
                   <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                       <thead className="bg-gray-50">
                         <tr>
                           <th className="px-4 py-3 text-left font-semibold">Agreement ID</th>
                           <th className="px-4 py-3 text-left font-semibold">Client</th>
                           <th className="px-4 py-3 text-left font-semibold">Branches</th>
                           <th className="px-4 py-3 text-left font-semibold">Status</th>
                           <th className="px-4 py-3 text-left font-semibold">Submitted Date</th>
                           <th className="px-4 py-3 text-left font-semibold">Approved Date</th>
                           <th className="px-4 py-3 text-left font-semibold">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y">
                         {approvedAgreements.length === 0 ? (
                           <tr>
                             <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                               <div className="flex flex-col items-center gap-2">
                                 <span className="text-4xl">📋</span>
                                 <p>No approved agreements found</p>
                                 <p className="text-sm">Approved agreements will appear here once they are approved by approvers.</p>
                               </div>
                             </td>
                           </tr>
                         ) : (
                           approvedAgreements.map((agreement) => (
                             <tr key={agreement.id} className="hover:bg-gray-50">
                               <td className="px-4 py-3">
                                 <div className="flex items-center gap-2">
                                   <span className="font-medium">{agreement.id}</span>
                                 </div>
                               </td>
                               <td className="px-4 py-3 font-medium">
                                 {agreement.clientName || agreement.selectedClient || 'N/A'}
                               </td>
                               <td className="px-4 py-3">
                                 {agreement.selectedBranches ? 
                                   (Array.isArray(agreement.selectedBranches) ? 
                                     agreement.selectedBranches.join(', ') : 
                                     agreement.selectedBranches) : 
                                   'All Branches'
                                 }
                               </td>
                               <td className="px-4 py-3">
                                 <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                   Approved
                                 </span>
                               </td>
                               <td className="px-4 py-3">
                                 {agreement.submittedDate ? 
                                   new Date(agreement.submittedDate).toLocaleDateString() : 
                                   'N/A'
                                 }
                               </td>
                               <td className="px-4 py-3">
                                 {agreement.approvedDate ? 
                                   new Date(agreement.approvedDate).toLocaleDateString() : 
                                   'N/A'
                                 }
                               </td>
                               <td className="px-4 py-3">
                                 <div className="flex gap-2">
                                   <button 
                                     onClick={() => {
                                       // You can implement view functionality here
                                       console.log('View agreement:', agreement.id);
                                     }}
                                     className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                                   >
                                     👁️ View
                                   </button>
                                   <button 
                                     onClick={() => {
                                       // You can implement download functionality here
                                       console.log('Download agreement:', agreement.id);
                                     }}
                                     className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                                   >
                                     📥 Download
                                   </button>
                                 </div>
                               </td>
                             </tr>
                           ))
                         )}
                       </tbody>
                     </table>
                   </div>
                 );
               })()}
             </div>
           </div>
         )}
       </div>

               {/* View Agreement Modal - REMOVED - Now integrated into AgreementTable */}

       {/* Addendum Form Modal */}
       {showAddendumForm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
           <div className="bg-white rounded-lg shadow-lg p-6 min-w-[800px] max-w-6xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-bold text-gray-900">
                 {editingAddendum ? 'Edit Addendum' : 'Create New Addendum'}
               </h3>
               <button
                 onClick={() => {
                   setShowAddendumForm(false);
                   setEditingAddendum(null);
                   setParentAgreementForAddendum(null);
                 }}
                 className="text-gray-400 hover:text-gray-600 focus:outline-none"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             
             <AddendumForm
               onSubmit={handleAddendumSubmit}
               editingAddendum={editingAddendum}
               onEditComplete={() => {
                 setShowAddendumForm(false);
                 setEditingAddendum(null);
                 setParentAgreementForAddendum(null);
               }}
               parentAgreement={parentAgreementForAddendum}
               userRole={userRole}
             />
           </div>
         </div>
               )}

        {/* View Agreement Modal for Dashboard */}
        {viewModal.open && viewModal.agreement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-[600px] max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Agreement Details - {viewModal.agreement.id}</h3>
                <button 
                  onClick={() => setViewModal({ open: false, agreement: null })} 
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <p className="text-gray-900">{viewModal.agreement.selectedClient || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      viewModal.agreement.status === "Approved" ? "bg-green-100 text-green-700" :
                      viewModal.agreement.status === "Rejected" ? "bg-red-100 text-red-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {viewModal.agreement.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branches</label>
                    <p className="text-gray-900">
                      {viewModal.agreement.selectedBranches ? 
                        (Array.isArray(viewModal.agreement.selectedBranches) ? 
                          viewModal.agreement.selectedBranches.map(branch => branch.name).join(', ') : 
                          viewModal.agreement.selectedBranches) : 
                        'All Branches'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                    <p className="text-gray-900">{viewModal.agreement.entityType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Date</label>
                    <p className="text-gray-900">
                      {viewModal.agreement.submittedDate ? 
                        new Date(viewModal.agreement.submittedDate).toLocaleDateString() : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approved Date</label>
                    <p className="text-gray-900">
                      {viewModal.agreement.approvedDate ? 
                        new Date(viewModal.agreement.approvedDate).toLocaleDateString() : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>

                {/* Agreement Period */}
                {viewModal.agreement.startDate && viewModal.agreement.endDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Period</label>
                    <p className="text-gray-900">
                      {new Date(viewModal.agreement.startDate).toLocaleDateString()} to {new Date(viewModal.agreement.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Important Clauses */}
                {viewModal.agreement.clauses && viewModal.agreement.clauses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Important Clauses</label>
                    <div className="space-y-2">
                      {viewModal.agreement.clauses.map((clause, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <div className="font-medium text-gray-900">{clause.title}</div>
                          <div className="text-sm text-gray-600">{clause.placeholder || 'No details provided'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {(viewModal.agreement.form?.iSmartName || viewModal.agreement.form?.clientName) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">I Smart Contact</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Name:</strong> {viewModal.agreement.form?.iSmartName || 'Not provided'}</p>
                          <p><strong>Phone:</strong> {viewModal.agreement.form?.iSmartContact || 'Not provided'}</p>
                          <p><strong>Email:</strong> {viewModal.agreement.form?.iSmartEmail || 'Not provided'}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Client Contact</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Name:</strong> {viewModal.agreement.form?.clientName || 'Not provided'}</p>
                          <p><strong>Phone:</strong> {viewModal.agreement.form?.clientContact || 'Not provided'}</p>
                          <p><strong>Email:</strong> {viewModal.agreement.form?.clientEmail || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents */}
                {viewModal.agreement.uploadStatuses && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded Documents</label>
                    <div className="space-y-2">
                      {Object.entries(viewModal.agreement.uploadStatuses).map(([type, status]) => (
                        <div key={type} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <span className="font-medium">{type}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            status.uploaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {status.uploaded ? 'Uploaded' : 'Not uploaded'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      // Download functionality
                      const agreementContent = `
LEGAL AGREEMENT COPY
==================

Agreement ID: ${viewModal.agreement.id}
Client: ${viewModal.agreement.selectedClient}
Branches: ${(viewModal.agreement.selectedBranches || []).map(branch => branch.name).join(", ")}
Submitted Date: ${viewModal.agreement.submittedDate}
Status: ${viewModal.agreement.status}
Entity Type: ${viewModal.agreement.entityType}
Agreement Period: ${viewModal.agreement.startDate ? new Date(viewModal.agreement.startDate).toLocaleDateString() : 'N/A'} to ${viewModal.agreement.endDate ? new Date(viewModal.agreement.endDate).toLocaleDateString() : 'N/A'}

CONTACT INFORMATION:
===================
I Smart Contact:
  Name: ${viewModal.agreement.form?.iSmartName || 'Not provided'}
  Phone: ${viewModal.agreement.form?.iSmartContact || 'Not provided'}
  Email: ${viewModal.agreement.form?.iSmartEmail || 'Not provided'}

Client Contact:
  Name: ${viewModal.agreement.form?.clientName || 'Not provided'}
  Phone: ${viewModal.agreement.form?.clientContact || 'Not provided'}
  Email: ${viewModal.agreement.form?.clientEmail || 'Not provided'}

IMPORTANT CLAUSES:
=================
${(viewModal.agreement.clauses || []).map((clause, idx) => `
${idx + 1}. ${clause.title}
   Details: ${clause.placeholder || 'No details provided'}
`).join('\n')}

DOCUMENTS:
==========
${Object.entries(viewModal.agreement.uploadStatuses || {}).map(([type, status]) => 
  `${type}: ${status.uploaded ? 'Uploaded' : 'Not uploaded'}`
).join('\n')}

Generated on: ${new Date().toLocaleString()}
                      `;

                      const blob = new Blob([agreementContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Agreement_${viewModal.agreement.id}_${viewModal.agreement.selectedClient}.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={() => setViewModal({ open: false, agreement: null })}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View Agreement Modal Component - REMOVED - Now integrated into AgreementTable

export default App;
