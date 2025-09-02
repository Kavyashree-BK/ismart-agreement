import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import AgreementForm from "./forms/AgreementForm";
import AgreementTable from "./forms/AgreementTable";
import AgreementCards from "./forms/AgreementCards";
import AddendumForm from "./forms/AddendumForm";
import AddendumTable from "./forms/AddendumTable";
import Header from "./components/ui/Header";
import TabNav from "./components/ui/TabNav";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import { setEditingAgreement, setActiveTab } from "./slice/uiSlice";
import { createAddendum } from "./slice/addendumsSlice";

// Main App Component
export default function App() {
  const dispatch = useDispatch();
  
  // Use individual selectors to prevent infinite re-renders
  const user = useSelector(state => state.user);
  const activeTab = useSelector(state => state.ui.activeTab);
  const showAddendumForm = useSelector(state => state.ui.showAddendumForm);
  const agreements = useSelector(state => state.agreements.agreements);
  const addendums = useSelector(state => state.addendums.addendums);
  
  // Debug logging
  console.log('App render - user:', user, 'activeTab:', activeTab, 'agreements:', agreements);
  
  // Redirect Approver users away from "new" tab to "agreements" tab
  useEffect(() => {
    if (user.role === "Approver" && activeTab === "new") {
      dispatch(setActiveTab("agreements"));
    }
  }, [user.role, activeTab, dispatch]);

  // Check if agreements data is loaded
  if (!agreements || agreements.length === 0) {
    console.log("Showing loading screen - agreements:", agreements);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agreements data...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while the system initializes...</p>
        </div>
      </div>
    );
  }

  console.log("Rendering main app - activeTab:", activeTab, "user.role:", user.role);
                
                return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabNav />
      
      <main>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "new" && user.role === "Checker" && <AgreementForm />}
        {activeTab === "agreements" && (
          user.role === "Approver" ? (
            <AgreementTable 
             agreements={agreements} 
             addendums={addendums}
              userRole={user.role}
            />
          ) : (
            <AgreementCards 
              agreements={agreements}
             addendums={addendums} 
              userRole={user.role}
              onEditAgreement={(agreement) => {
                dispatch(setEditingAgreement(agreement));
                dispatch(setActiveTab("new"));
              }}
              onAddendumSubmit={(addendumData) => {
                dispatch(createAddendum(addendumData));
              }}
            />
          )
        )}
        {activeTab === "addendums" && <AddendumTable />}
        {activeTab === "history" && user.role === "Approver" && <History />}
      </main>

      {/* Modals */}
      {showAddendumForm && <AddendumForm />}
     </div>
   );
 }
