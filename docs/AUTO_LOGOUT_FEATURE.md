# 🔐 Auto-Logout Feature Implementation

## 📋 Overview

The auto-logout feature automatically logs out users after a period of inactivity and when they close the browser tab. This enhances security by ensuring that sensitive health information is not left accessible on unattended devices.

## 🎯 Features

### ✅ **Implemented Features**
- **Inactivity Detection**: Monitors user activity (mouse, keyboard, touch, scroll)
- **Tab Closure Detection**: Detects when user closes the browser tab
- **Warning System**: Shows 5-minute warning before automatic logout
- **Configurable Timeouts**: Easily adjustable inactivity and warning periods
- **Session Recovery**: Handles session restoration after tab closure
- **Cross-Tab Synchronization**: Consistent behavior across multiple tabs

### ⚙️ **Configuration Options**
- **Inactivity Timeout**: 30 minutes (configurable)
- **Warning Timeout**: 5 minutes before logout (configurable)
- **Check Interval**: 1 minute (configurable)
- **Session Recovery**: 1 hour (configurable)

## 🏗️ Architecture

### **File Structure**
```
src/
├── hooks/
│   └── useAutoLogout.js              # Main auto-logout hook
├── components/
│   └── AutoLogoutWarning.jsx         # Warning dialog component
├── config/
│   └── autoLogout.js                 # Configuration settings
├── utils/
│   └── autoLogoutUtils.js            # Debug utilities
└── contexts/
    └── AuthContext.jsx               # Integrated with auth context
```

### **Core Components**

#### 1. **useAutoLogout Hook**
- Monitors user activity events
- Manages inactivity timers
- Handles tab visibility changes
- Triggers warning and logout events

#### 2. **AutoLogoutWarning Component**
- Displays countdown timer
- Provides "Stay Logged In" option
- Shows "Logout Now" option
- Responsive design for mobile/desktop

#### 3. **Configuration System**
- Centralized settings management
- Environment variable support
- Easy customization

## 🔧 Implementation Details

### **Activity Monitoring**
The system monitors these user activities:
- Mouse movements and clicks
- Keyboard input
- Touch events
- Scrolling
- Any DOM interaction

### **Tab Management**
- **Tab Hidden**: Stores timestamp when tab becomes hidden
- **Tab Visible**: Checks if too much time has passed
- **Tab Closed**: Stores logout timestamp for next session

### **Warning System**
- Shows warning 5 minutes before logout
- Countdown timer with visual feedback
- User can extend session or logout immediately
- Dismissible with activity

## 🚀 Usage

### **For Users**
1. **Normal Usage**: No changes required - works automatically
2. **Inactivity Warning**: Click "Stay Logged In" or perform any action
3. **Manual Logout**: Click "Logout Now" in warning dialog
4. **Tab Closure**: Automatically logged out when closing tab

### **For Developers**

#### **Configuration**
```javascript
// In src/config/autoLogout.js
export const AUTO_LOGOUT_CONFIG = {
  inactivityTimeout: 30 * 60 * 1000,  // 30 minutes
  warningTimeout: 5 * 60 * 1000,      // 5 minutes
  checkInterval: 60 * 1000,           // 1 minute
  // ... other settings
};
```

#### **Environment Variables**
```bash
# .env file
VITE_AUTO_LOGOUT_TIMEOUT=45    # 45 minutes
VITE_AUTO_LOGOUT_WARNING=10    # 10 minutes warning
```

#### **Testing Utilities** (Development Only)
```javascript
// Available at window.autoLogoutUtils in development
autoLogoutUtils.simulateActivity();    // Reset timer
autoLogoutUtils.triggerWarning();      // Test warning
autoLogoutUtils.getDebugInfo();        // Get debug info
autoLogoutUtils.clearStorage();        // Clear storage
```

## 🧪 Testing

### **Manual Testing Checklist**
- [ ] User activity resets timer
- [ ] Warning appears after 25 minutes of inactivity
- [ ] Countdown timer works correctly
- [ ] "Stay Logged In" extends session
- [ ] "Logout Now" immediately logs out
- [ ] Tab closure triggers logout
- [ ] Multiple tabs work correctly
- [ ] Session recovery works after tab closure

### **Debug Commands** (Development)
```javascript
// Check current status
console.log(autoLogoutUtils.getDebugInfo());

// Simulate activity
autoLogoutUtils.simulateActivity();

// Test warning dialog
autoLogoutUtils.triggerWarning();

// Clear all data
autoLogoutUtils.clearStorage();
```

## 🔒 Security Considerations

### **Privacy Protection**
- Automatic logout prevents unauthorized access
- Session data cleared on logout
- No sensitive data stored in localStorage
- Cross-tab synchronization ensures consistent state

### **User Experience**
- Clear warning messages
- Easy session extension
- Non-intrusive monitoring
- Graceful handling of edge cases

## 🐛 Troubleshooting

### **Common Issues**

#### 1. **Timer Not Resetting**
- Check if activity events are being captured
- Verify event listeners are properly attached
- Check browser console for errors

#### 2. **Warning Not Showing**
- Verify CustomEvent is being dispatched
- Check if AutoLogoutWarning component is mounted
- Ensure event listener is properly set up

#### 3. **Logout Not Working**
- Check if logout function is properly passed
- Verify authentication state
- Check for console errors

### **Debug Steps**
1. Open browser console
2. Check for `autoLogoutUtils` availability
3. Run `autoLogoutUtils.getDebugInfo()`
4. Check localStorage for activity timestamps
5. Verify configuration settings

## 🔮 Future Enhancements

### **Planned Features**
- [ ] User-configurable timeout settings
- [ ] Different timeouts for different user roles
- [ ] Activity-based timeout adjustments
- [ ] Integration with server-side session management
- [ ] Analytics for session patterns

### **Technical Improvements**
- [ ] Web Workers for background monitoring
- [ ] Service Worker integration
- [ ] Advanced activity detection algorithms
- [ ] Machine learning for user behavior patterns

## 📝 Maintenance

### **Regular Tasks**
- Monitor user feedback on timeout durations
- Review and adjust configuration as needed
- Test across different browsers and devices
- Update documentation for new features

### **Performance Monitoring**
- Monitor impact on app performance
- Track user session patterns
- Analyze logout frequency and reasons
- Optimize event listener efficiency

---

## ✅ Implementation Status

- [x] Core auto-logout functionality
- [x] Warning dialog system
- [x] Configuration management
- [x] Tab closure detection
- [x] Session recovery
- [x] Debug utilities
- [x] Documentation
- [x] Integration with AuthContext
- [x] Responsive design
- [x] Error handling

**The Auto-Logout Feature is fully implemented and ready for production use!** 🎉
