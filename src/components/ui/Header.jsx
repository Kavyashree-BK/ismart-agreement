import React from "react";

const Header = ({ userRole, setUserRole, userName }) => (
  <header className="flex items-center justify-between px-8 py-4 border-b bg-white sticky top-0 z-20">
    <div className="flex items-center gap-3">
      <span className="text-2xl"><span role="img" aria-label="doc">📄</span></span>
      <span className="text-2xl font-bold tracking-tight">Legal Agreement ERP</span>
    </div>
    <div className="flex items-center gap-4">
      <select
        className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        value={userRole}
        onChange={e => setUserRole(e.target.value)}
      >
        <option value="Checker">Checker</option>
        <option value="Approver">Approver</option>
      </select>
      <button className="border px-4 py-1 rounded-full font-medium hover:bg-gray-100">
        {userRole || "User"}
      </button>
    </div>
  </header>
);

export default Header; 