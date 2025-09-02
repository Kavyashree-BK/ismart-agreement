// User Slice
export { default as userReducer, setUser, logout } from './userSlice';

// Agreements Slice
export { default as agreementsReducer } from './agreementsSlice';
export {
  setFilters,
  clearFilters,
  updateAgreementStatus,
  addAgreement,
  removeAgreement,
  createAgreement,
  updateAgreement,
  fetchAgreements,
  selectAllAgreements,
  selectAgreementsLoading,
  selectAgreementsError,
  selectAgreementsFilters
} from './agreementsSlice';

// Addendums Slice
export { default as addendumsReducer } from './addendumsSlice';
export {
  addAddendum,
  updateAddendum,
  removeAddendum,
  setAddendumStatus,
  createAddendum,
  updateAddendumStatus as updateAddendumStatusAsync,
  fetchAddendums,
  selectAllAddendums,
  selectAddendumsLoading,
  selectAddendumsError,
  selectAddendumsByAgreement
} from './addendumsSlice';

// UI Slice
export { default as uiReducer } from './uiSlice';
export {
  setActiveTab,
  setEditingAgreement,
  setEditingAddendum,
  setShowAddendumForm,
  setViewModal,
  setAddendumDetailsModal,
  setClauseHistoryModal,
  setStatusHistoryModal,
  setShowFinalUpload,
  setDropdownOpen,
  setIsEditing,
  setCurrentPage,
  closeAllModals,
  resetEditingState,
  selectActiveTab,
  selectEditingAgreement,
  selectEditingAddendum,
  selectShowAddendumForm,
  selectViewModal,
  selectAddendumDetailsModal,
  selectClauseHistoryModal,
  selectStatusHistoryModal,
  selectShowFinalUpload,
  selectDropdownOpen,
  selectIsEditing,
  selectCurrentPage
} from './uiSlice';
