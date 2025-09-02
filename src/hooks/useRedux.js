import { useSelector, useDispatch } from 'react-redux';
import { useMemo, useCallback } from 'react';
import {
  // Agreements
  selectAllAgreements,
  selectAgreementsLoading,
  selectAgreementsError,
  selectAgreementsFilters,
  setFilters,
  clearFilters,
  updateAgreementStatus,
  addAgreement,
  removeAgreement,
  createAgreement,
  updateAgreement,
  fetchAgreements
} from '../slice/agreementsSlice';

import {
  // Addendums
  selectAllAddendums,
  selectAddendumsLoading,
  selectAddendumsError,
  selectAddendumsByAgreement,
  addAddendum,
  updateAddendum,
  removeAddendum,
  setAddendumStatus,
  createAddendum,
  updateAddendumStatus as updateAddendumStatusAsync,
  fetchAddendums
} from '../slice/addendumsSlice';

import {
  // UI
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
  selectCurrentPage,
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
  resetEditingState
} from '../slice/uiSlice';

import {
  // User
  setUser,
  logout
} from '../slice/userSlice';

// Agreements Hooks
export const useAgreements = () => {
  const dispatch = useDispatch();
  const agreements = useSelector(selectAllAgreements);
  const loading = useSelector(selectAgreementsLoading);
  const error = useSelector(selectAgreementsError);
  const filters = useSelector(selectAgreementsFilters);

  const actions = useMemo(() => ({
    setFilters: (filters) => dispatch(setFilters(filters)),
    clearFilters: () => dispatch(clearFilters()),
    updateStatus: (data) => dispatch(updateAgreementStatus(data)),
    add: (agreement) => dispatch(addAgreement(agreement)),
    remove: (id) => dispatch(removeAgreement(id)),
    create: (data) => dispatch(createAgreement(data)),
    update: (data) => dispatch(updateAgreement(data)),
    fetch: () => dispatch(fetchAgreements())
  }), [dispatch]);

  return {
    agreements,
    loading,
    error,
    filters,
    actions
  };
};

// Addendums Hooks
export const useAddendums = () => {
  const dispatch = useDispatch();
  const addendums = useSelector(selectAllAddendums);
  const loading = useSelector(selectAddendumsLoading);
  const error = useSelector(selectAddendumsError);

  const actions = useMemo(() => ({
    add: (addendum) => dispatch(addAddendum(addendum)),
    update: (data) => dispatch(updateAddendum(data)),
    remove: (id) => dispatch(removeAddendum(id)),
    setStatus: (data) => dispatch(setAddendumStatus(data)),
    create: (data) => dispatch(createAddendum(data)),
    updateStatus: (data) => dispatch(updateAddendumStatusAsync(data)),
    fetch: () => dispatch(fetchAddendums())
  }), [dispatch]);

  return {
    addendums,
    loading,
    error,
    actions
  };
};

export const useAddendumsByAgreement = (agreementId) => {
  const addendums = useSelector(state => selectAddendumsByAgreement(state, agreementId));
  return addendums;
};

// UI Hooks
export const useUI = () => {
  const dispatch = useDispatch();
  const activeTab = useSelector(selectActiveTab);
  const editingAgreement = useSelector(selectEditingAgreement);
  const editingAddendum = useSelector(selectEditingAddendum);
  const showAddendumForm = useSelector(selectShowAddendumForm);
  const viewModal = useSelector(selectViewModal);
  const addendumDetailsModal = useSelector(selectAddendumDetailsModal);
  const clauseHistoryModal = useSelector(selectClauseHistoryModal);
  const statusHistoryModal = useSelector(selectStatusHistoryModal);
  const showFinalUpload = useSelector(selectShowFinalUpload);
  const dropdownOpen = useSelector(selectDropdownOpen);
  const isEditing = useSelector(selectIsEditing);
  const currentPage = useSelector(selectCurrentPage);

  const actions = useMemo(() => ({
    setActiveTab: (tab) => dispatch(setActiveTab(tab)),
    setEditingAgreement: (agreement) => dispatch(setEditingAgreement(agreement)),
    setEditingAddendum: (addendum) => dispatch(setEditingAddendum(addendum)),
    setShowAddendumForm: (show) => dispatch(setShowAddendumForm(show)),
    setViewModal: (modal) => dispatch(setViewModal(modal)),
    setAddendumDetailsModal: (modal) => dispatch(setAddendumDetailsModal(modal)),
    setClauseHistoryModal: (modal) => dispatch(setClauseHistoryModal(modal)),
    setStatusHistoryModal: (modal) => dispatch(setStatusHistoryModal(modal)),
    setShowFinalUpload: (show) => dispatch(setShowFinalUpload(show)),
    setDropdownOpen: (dropdown) => dispatch(setDropdownOpen(dropdown)),
    setIsEditing: (editing) => dispatch(setIsEditing(editing)),
    setCurrentPage: (page) => dispatch(setCurrentPage(page)),
    closeAllModals: () => dispatch(closeAllModals()),
    resetEditingState: () => dispatch(resetEditingState())
  }), [dispatch]);

  return {
    activeTab,
    editingAgreement,
    editingAddendum,
    showAddendumForm,
    viewModal,
    addendumDetailsModal,
    clauseHistoryModal,
    statusHistoryModal,
    showFinalUpload,
    dropdownOpen,
    isEditing,
    currentPage,
    actions
  };
};

// User Hooks
export const useUser = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);

  const actions = useMemo(() => ({
    setUser: (userData) => dispatch(setUser(userData)),
    logout: () => dispatch(logout())
  }), [dispatch]);

  return {
    ...user,
    actions
  };
};

// Combined Hook for Common Operations
export const useAppState = () => {
  const agreements = useAgreements();
  const addendums = useAddendums();
  const ui = useUI();
  const user = useUser();

  const getFilteredAgreements = useCallback(() => {
    const { agreements: agreementsList, filters } = agreements;
    if (!filters.client && !filters.city && !filters.state && !filters.fromDate && !filters.toDate && filters.addendumsFilter === "all") {
      return agreementsList;
    }
    
    return agreementsList.filter(agreement => {
      const clientMatch = !filters.client || agreement.selectedClient === filters.client;
      const cityMatch = !filters.city || agreement.selectedBranches?.some(branch => branch.name === filters.city);
      const stateMatch = !filters.state || agreement.state === filters.state;
      
      let dateMatch = true;
      if (filters.fromDate || filters.toDate) {
        const submittedDate = new Date(agreement.submittedDate);
        const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
        const toDate = filters.toDate ? new Date(filters.toDate) : null;
        
        if (fromDate && toDate) {
          dateMatch = submittedDate >= fromDate && submittedDate <= toDate;
        } else if (fromDate) {
          dateMatch = submittedDate >= fromDate;
        } else if (toDate) {
          dateMatch = submittedDate <= toDate;
        }
      }
      
      let addendumsMatch = true;
      if (filters.addendumsFilter === "with") {
        addendumsMatch = addendums.addendums.filter(add => add.parentAgreementId === agreement.id).length > 0;
      } else if (filters.addendumsFilter === "without") {
        addendumsMatch = addendums.addendums.filter(add => add.parentAgreementId === agreement.id).length === 0;
      }
      
      return clientMatch && cityMatch && stateMatch && dateMatch && addendumsMatch;
    });
  }, [agreements.agreements, agreements.filters, addendums.addendums]);

  return {
    agreements,
    addendums,
    ui,
    user,
    getFilteredAgreements
  };
};
