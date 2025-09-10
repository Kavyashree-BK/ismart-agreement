import { createSlice } from '@reduxjs/toolkit';

// Helper function to calculate days until expiry
const getDaysUntilExpiry = (endDate) => {
  const end = new Date(endDate);
  const today = new Date();
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};

// Helper function to check if notification should be shown
const shouldShowNotification = (agreement) => {
  if (!agreement.endDate || agreement.openAgreement) return false;
  
  const daysUntilExpiry = getDaysUntilExpiry(agreement.endDate);
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0; // One month advance notification
};

// Generate notifications for expiring contracts
const generateExpiryNotifications = (agreements) => {
  const notifications = [];
  
  agreements.forEach(agreement => {
    if (shouldShowNotification(agreement)) {
      const daysUntilExpiry = getDaysUntilExpiry(agreement.endDate);
      
      notifications.push({
        id: `expiry-${agreement.id}-${Date.now()}`,
        type: 'expiry_warning',
        title: 'Contract Expiring Soon',
        message: `Agreement with ${agreement.selectedClient} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
        agreementId: agreement.id,
        clientName: agreement.selectedClient,
        daysUntilExpiry,
        priority: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low',
        createdAt: new Date().toISOString(),
        read: false,
        actionRequired: true
      });
    }
  });
  
  return notifications;
};

const initialState = {
  notifications: [],
  unreadCount: 0,
  lastChecked: new Date().toISOString()
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    generateNotifications: (state, action) => {
      const { agreements } = action.payload;
      const newNotifications = generateExpiryNotifications(agreements);
      
      // Remove old notifications for the same agreements
      const existingAgreementIds = newNotifications.map(n => n.agreementId);
      state.notifications = state.notifications.filter(n => 
        !existingAgreementIds.includes(n.agreementId)
      );
      
      // Add new notifications
      state.notifications = [...state.notifications, ...newNotifications];
      
      // Update unread count
      state.unreadCount = state.notifications.filter(n => !n.read).length;
    },
    
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification) {
        state.notifications = state.notifications.filter(n => n.id !== notificationId);
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    
    updateLastChecked: (state) => {
      state.lastChecked = new Date().toISOString();
    }
  }
});

export const {
  generateNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  updateLastChecked
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
