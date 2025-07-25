

import React, { useState } from "react";
import AgreementForm from "./forms/AgreementForm";
import ReportFilterForm from "./forms/ReportFilterForm";
import AgreementTable from "./forms/AgreementTable";
import Header from "./components/ui/Header";
import TabNav from "./components/ui/TabNav";

function Dashboard() {
  // Placeholder for dashboard UI (stats cards, recent submissions)
  return (
    <div className="px-8 py-6">
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold">12</div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Total Submissions</span>
            <span role="img" aria-label="doc">📄</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-orange-600">8</div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Pending Review</span>
            <span role="img" aria-label="clock">⏲️</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-green-600">4</div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Approved</span>
            <span role="img" aria-label="check">✔️</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-red-600">0</div>
          <div className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <span>Rejected</span>
            <span role="img" aria-label="cross">❗</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-2">Recent Submissions</h2>
        <p className="text-gray-500 mb-4">Your latest agreement submissions</p>
        <div className="divide-y">
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-semibold">ABC Corp</div>
              <div className="text-gray-500 text-sm">Mumbai Office</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs">Pending Review</span>
              <span className="text-xs text-gray-400">2024-01-15</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-semibold">XYZ Ltd</div>
              <div className="text-gray-500 text-sm">Delhi Branch</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">Approved</span>
              <span className="text-xs text-gray-400">2024-01-14</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-semibold">Tech Solutions</div>
              <div className="text-gray-500 text-sm">Bangalore HQ</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs">Pending Review</span>
              <span className="text-xs text-gray-400">2024-01-13</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [userRole, setUserRole] = useState("Checker");
  const [activeTab, setActiveTab] = useState("dashboard");

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
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "new" && userRole !== "Approver" && <AgreementForm setUserRole={setUserRole} />}
        {activeTab === "agreements" && userRole === "Approver" && <AgreementTable />}
      </div>
    </div>
  );
}

export default App;
