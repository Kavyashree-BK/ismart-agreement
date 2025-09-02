import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../slice/userSlice';
import agreementsReducer from '../slice/agreementsSlice';
import addendumsReducer from '../slice/addendumsSlice';
import uiReducer from '../slice/uiSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    agreements: agreementsReducer,
    addendums: addendumsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['persist/PERSIST'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.lastModified', 'payload.submittedDate'],
        // Ignore these paths in the state
        ignoredPaths: ['agreements.agreements', 'addendums.addendums'],
      },
    }),
});

export default store;
