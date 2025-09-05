import React, { useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setActiveTab, closeAllModals, resetEditingState } from "../../slice/uiSlice";

export default function TabNav() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const activeTab = useSelector(state => state.ui.activeTab);
  const editingAgreement = useSelector(state => state.ui.editingAgreement);

  // Memoize tabs array to prevent unnecessary re-renders
  const tabs = useMemo(() => {
    const hasEditingAgreement = !!editingAgreement;
    console.log("TabNav tabs calculation - user.role:", user.role, "hasEditingAgreement:", hasEditingAgreement, "editingAgreement:", editingAgreement);
    
    if (user.role === "Checker") {
      const checkerTabs = [
        { id: "dashboard", label: "Dashboard", icon: "📊" },
        { id: "new", label: "New Agreement", icon: "📝" },
        { id: "agreements", label: "Agreements", icon: "📋" }
      ];
      console.log("Returning checker tabs:", checkerTabs);
      return checkerTabs;
    } else {
      // For other roles, show "New Agreement" tab only when editing
      const baseTabs = [
        { id: "dashboard", label: "Dashboard", icon: "📊" },
        { id: "agreements", label: "Agreements", icon: "📋" },
        { id: "history", label: "History", icon: "📚" }
      ];
      
      if (hasEditingAgreement) {
        // Insert "New Agreement" tab when editing
        baseTabs.splice(1, 0, { id: "new", label: "New Agreement", icon: "📝" });
        console.log("Added new tab for editing, returning:", baseTabs);
      } else {
        console.log("No editing agreement, returning base tabs:", baseTabs);
      }
      
      return baseTabs;
    }
  }, [user.role, editingAgreement]);

  // Memoize the tab click handler
  const handleTabClick = useCallback((tabId) => {
    console.log("TabNav handleTabClick - tabId:", tabId, "editingAgreement:", editingAgreement);
    dispatch(setActiveTab(tabId));
    dispatch(closeAllModals());
    // Don't reset editing state when navigating to "new" tab for editing
    if (tabId !== "new") {
      console.log("Resetting editing state for tab:", tabId);
      dispatch(resetEditingState());
    } else {
      console.log("Preserving editing state for new tab");
    }
  }, [dispatch, editingAgreement]);

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