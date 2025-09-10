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
        ignoredActionPaths: ['payload.createdAt', 'payload.lastModified', 'payload.submittedDate', 'payload.uploadedFiles', 'payload.updates.uploadedFiles', 'payload.importantClauses.*.file', 'payload.updates.importantClauses.*.file'],
        // Ignore these paths in the state
        ignoredPaths: ['agreements.agreements', 'addendums.addendums', 'addendums.addendums.*.uploadedFiles', 'agreements.agreements.*.importantClauses.*.file'],
      },
    }),
});

export default store;
