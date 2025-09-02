import React, { useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setActiveTab, closeAllModals, resetEditingState } from "../../slice/uiSlice";

export default function TabNav() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const activeTab = useSelector(state => state.ui.activeTab);

  // Memoize tabs array to prevent unnecessary re-renders
  const tabs = useMemo(() => {
    if (user.role === "Checker") {
      return [
        { id: "dashboard", label: "Dashboard", icon: "📊" },
        { id: "new", label: "New Agreement", icon: "📝" },
        { id: "agreements", label: "Agreements", icon: "📋" }
      ];
    } else {
      return [
        { id: "dashboard", label: "Dashboard", icon: "📊" },
        { id: "agreements", label: "Agreements", icon: "📋" },
        { id: "history", label: "History", icon: "📚" }
      ];
    }
  }, [user.role]);

  // Memoize the tab click handler
  const handleTabClick = useCallback((tabId) => {
    dispatch(setActiveTab(tabId));
    dispatch(closeAllModals());
    dispatch(resetEditingState());
  }, [dispatch]);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-green-500 text-green-600 bg-green-50" // EXACTLY like reference image
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
} 