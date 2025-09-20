import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../slice/userSlice';
import agreementsReducer from '../slice/agreementsSlice';
import addendumsReducer from '../slice/addendumsSlice';
import uiReducer from '../slice/uiSlice';
import notificationsReducer from '../slice/notificationsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    agreements: agreementsReducer,
    addendums: addendumsReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['persist/PERSIST'],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.createdAt', 
          'payload.lastModified', 
          'payload.submittedDate', 
          'payload.uploadedFiles', 
          'payload.updates.uploadedFiles', 
          'payload.importantClauses.*.file', 
          'payload.updates.importantClauses.*.file', 
          'payload.uploadStatuses.*.file', 
          'payload.updates.uploadStatuses.*.file',
          'payload.uploadStatuses.LOI.file',
          'payload.uploadStatuses.WO.file',
          'payload.uploadStatuses.PO.file',
          'payload.uploadStatuses.EmailApproval.file',
          'payload.updates.uploadStatuses.LOI.file',
          'payload.updates.uploadStatuses.WO.file',
          'payload.updates.uploadStatuses.PO.file',
          'payload.updates.uploadStatuses.EmailApproval.file',
          'payload.file',
          'payload.updates.file',
          'payload.importantClauses.*.file',
          'payload.updates.importantClauses.*.file'
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'agreements.agreements', 
          'addendums.addendums', 
          'addendums.addendums.*.uploadedFiles', 
          'agreements.agreements.*.importantClauses.*.file', 
          'agreements.agreements.*.uploadStatuses.*.file',
          'agreements.agreements.*.uploadStatuses.LOI.file',
          'agreements.agreements.*.uploadStatuses.WO.file',
          'agreements.agreements.*.uploadStatuses.PO.file',
          'agreements.agreements.*.uploadStatuses.EmailApproval.file',
          'agreements.agreements.*.file',
          'addendums.addendums.*.file',
          'ui.editingAgreement.uploadStatuses.*.file',
          'ui.editingAgreement.uploadStatuses.LOI.file',
          'ui.editingAgreement.uploadStatuses.WO.file',
          'ui.editingAgreement.uploadStatuses.PO.file',
          'ui.editingAgreement.uploadStatuses.EmailApproval.file',
          'ui.editingAgreement.importantClauses.*.file'
        ],
      },
    }),
});

export default store;
