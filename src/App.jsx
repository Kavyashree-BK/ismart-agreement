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
import ViewModal from "./components/ViewModal";
import ErrorBoundary from "./components/ErrorBoundary";
import { setEditingAgreement, setActiveTab, setViewModal, setShowAddendumForm, setEditingAddendum } from "./slice/uiSlice";
import { createAddendum, updateAddendumStatus } from "./slice/addendumsSlice";
import { updateAgreementStatus } from "./slice/agreementsSlice";

// Main App Component
export default function App() {
  const dispatch = useDispatch();
  
  // Use individual selectors to prevent infinite re-renders
  const user = useSelector(state => state.user);
  const activeTab = useSelector(state => state.ui.activeTab);
  const editingAgreement = useSelector(state => state.ui.editingAgreement);
  const showAddendumForm = useSelector(state => state.ui.showAddendumForm);
  const viewModal = useSelector(state => state.ui.viewModal);
  const agreements = useSelector(state => state.agreements.agreements);
  const addendums = useSelector(state => state.addendums.addendums);
  
  // Debug logging for addendum form state
  console.log("App render - showAddendumForm:", showAddendumForm);
  console.log("App render - ui state:", useSelector(state => state.ui));
  console.log("App render - addendums:", addendums);
  console.log("App render - addendums length:", addendums?.length);
  
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
        {activeTab === "dashboard" && <Dashboard onNavigateToAgreements={() => dispatch(setActiveTab("agreements"))} />}
        {activeTab === "new" && (() => {
          console.log("Rendering AgreementForm - activeTab:", activeTab);
          console.log("editingAgreement:", editingAgreement);
          console.log("isEditing:", !!editingAgreement);
          
          return (
            <ErrorBoundary>
              <AgreementForm />
            </ErrorBoundary>
          );
        })()}
        {activeTab === "agreements" && (
          user.role === "Checker" ? (
            <AgreementCards 
               agreements={agreements} 
              userRole={user.role}
              onEditAgreement={(agreement) => {
                dispatch(setEditingAgreement(agreement));
                dispatch(setActiveTab("new"));
              }}
              onAddendumSubmit={(addendumData) => {
                dispatch(createAddendum(addendumData));
              }}
              onStatusUpdate={(agreementId, status, approvedDate, finalAgreement, priority) => {
                dispatch(updateAgreementStatus({ 
                  id: agreementId, 
                  status, 
                  approvedDate, 
                  finalAgreement, 
                  priority 
                }));
              }}
            />
          ) : (
            <AgreementTable 
             agreements={agreements} 
              userRole={user.role}
              onEditAgreement={(agreement) => {
                dispatch(setEditingAgreement(agreement));
                dispatch(setActiveTab("new"));
              }}
              onCreateAddendum={(agreement, type) => {
                console.log("Creating addendum for agreement:", agreement, "type:", type);
                
                if (type === 'addendum') {
                  // Create a new addendum object for the form
                  const newAddendum = {
                    id: null, // No ID for new addendum
                    parentAgreementId: agreement.id,
                    parentAgreementTitle: agreement.client || agreement.selectedClient || "Unknown Client",
                    title: "",
                    description: "",
                    effectiveDate: new Date().toISOString().split('T')[0],
                    reason: "",
                    impact: "",
                    additionalDocuments: [],
                    branches: agreement.selectedBranches || [],
                    status: "Draft",
                    submittedBy: "checker",
                    submittedDate: null,
                    uploadedFiles: {},
                    clauseModifications: [],
                    isNew: true
                  };
                  
                  // Set the editing addendum for the form
                  dispatch(setEditingAddendum(newAddendum));
                } else if (type === 'edit') {
                  // For editing existing addendum, set the addendum data directly
                  dispatch(setEditingAddendum(agreement));
                } else {
                  // For other cases, set the agreement
                  dispatch(setEditingAgreement(agreement));
                }
                
                // Open the addendum form
                dispatch(setShowAddendumForm(true));
              }}
              onAddendumSubmit={(addendumData) => {
                dispatch(createAddendum(addendumData));
              }}
              onStatusUpdate={(agreementId, status, approvedDate, finalAgreement, priority) => {
                dispatch(updateAgreementStatus({ 
                  id: agreementId, 
                  status, 
                  approvedDate, 
                  finalAgreement, 
                  priority 
                }));
              }}
              onAddendumStatusUpdate={(addendumId, newStatus) => {
                dispatch(updateAddendumStatus({ addendumId, newStatus }));
              }}
            />
          )
        )}
        {activeTab === "addendums" && <AddendumTable />}
        {activeTab === "history" && user.role === "Approver" && <History />}
      </main>

      {/* Modals */}
      {showAddendumForm && <AddendumForm />}
      <ViewModal 
        open={viewModal.open} 
        agreement={viewModal.agreement}
        onClose={() => dispatch(setViewModal({ open: false, agreement: null }))}
      />
     </div>
   );
 }
