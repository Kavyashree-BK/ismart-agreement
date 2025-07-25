import React from "react";

const TabNav = ({ activeTab, setActiveTab }) => (
  <nav className="flex gap-2 px-8 pt-6 pb-2 bg-white">
    {[
      { label: "Dashboard", value: "dashboard" },
      { label: "New Agreement", value: "new" },
      { label: "Agreements", value: "agreements" },
    ].map(tab => (
      <button
        key={tab.value}
        className={`px-5 py-2 rounded font-medium border transition-colors duration-150 ${
          activeTab === tab.value
            ? "bg-gray-100 border-gray-300 text-black shadow"
            : "bg-white border-transparent text-gray-600 hover:bg-gray-50"
        }`}
        onClick={() => setActiveTab(tab.value)}
      >
        {tab.label}
      </button>
    ))}
  </nav>
);

export default TabNav; 