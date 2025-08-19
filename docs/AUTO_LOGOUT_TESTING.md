# 🧪 Auto-Logout Testing Configuration

## ⏱️ **Current Testing Timings**

The auto-logout feature is currently configured with **reduced timings for testing purposes**:

- **Inactivity Timeout**: 3 minutes
- **Warning Timeout**: 1 minute (warning shows 1 minute before logout)
- **Check Interval**: 10 seconds (more responsive for testing)

## 🎯 **Testing Timeline**

```
0:00 - User becomes inactive
2:00 - Warning dialog appears (1 minute before logout)
3:00 - Auto-logout occurs
```

## 🚀 **Quick Testing Commands**

### **Available in Browser Console (Development Only):**

```javascript
// Check current status and timing
autoLogoutUtils.getDebugInfo();

// Simulate user activity (reset timer)
autoLogoutUtils.simulateActivity();

// Force trigger warning dialog immediately
autoLogoutUtils.triggerWarning();

// Clear all auto-logout data
autoLogoutUtils.clearStorage();
```

## 📋 **Testing Checklist**

### **Basic Functionality:**
- [ ] Warning appears after 2 minutes of inactivity
- [ ] Countdown timer shows correct remaining time
- [ ] "Stay Logged In" button resets the timer
- [ ] "Logout Now" button immediately logs out
- [ ] Auto-logout occurs after 3 minutes total
- [ ] Warning dialog disappears when user logs out

### **Advanced Testing:**
- [ ] Activity events reset timer properly
- [ ] Multiple tabs behave consistently
- [ ] Warning dialog works across tab switches

## 🔄 **Reverting to Production Settings**

When testing is complete, update `src/config/autoLogout.js`:

```javascript
// Production settings
inactivityTimeout: 30 * 60 * 1000,  // 30 minutes
warningTimeout: 5 * 60 * 1000,      // 5 minutes
checkInterval: 60 * 1000,           // 1 minute
warningMessage: 'You will be logged out due to inactivity in 5 minutes.',
```

## 🎮 **Manual Testing Steps**

1. **Start the app** and log in
2. **Stop all activity** (don't move mouse, type, or click)
3. **Wait 2 minutes** - warning should appear
4. **Test "Stay Logged In"** - timer should reset
5. **Wait again** - warning should reappear
6. **Test "Logout Now"** - should logout immediately
7. **Test activity reset** - move mouse or click to reset timer

## ⚠️ **Important Notes**

- **Testing mode is active** - timings are reduced for faster testing
- **Remember to revert** to production settings after testing
- **Debug utilities** are only available in development mode
- **Activity monitoring** includes mouse, keyboard, touch, and scroll events

---

**Happy Testing! 🎉**
