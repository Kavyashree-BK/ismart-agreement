

import React, { useState } from "react";
import AgreementForm from "./forms/AgreementForm";
import ReportFilterForm from "./forms/ReportFilterForm";
import AgreementTable from "./forms/AgreementTable";
import Header from "./components/ui/Header";
import TabNav from "./components/ui/TabNav";

function Dashboard({ agreements, userRole, onStatusUpdate }) {
  // Show up to 5 most recent submissions
  const recentSubmissions = agreements.slice(0, 5);

  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0];

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
                <div>
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
    setActiveTab("dashboard");
  };

  // Handler for status updates by approvers
  const handleStatusUpdate = (agreementId, newStatus, approvedDate) => {
    setAgreements(prev => prev.map(agreement => 
      agreement.id === agreementId 
        ? { 
            ...agreement, 
            status: newStatus, 
            approvedDate: approvedDate,
            approvedBy: "Current Approver" // You can get this from user context
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
          />
        )}
        {activeTab === "new" && userRole !== "Approver" && (
          <AgreementForm setUserRole={setUserRole} onSubmit={handleAgreementSubmit} />
        )}
        {activeTab === "agreements" && userRole === "Approver" && <AgreementTable agreements={agreements} onStatusUpdate={handleStatusUpdate} />}
      </div>
    </div>
  );
}

export default App;
