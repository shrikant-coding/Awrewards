# Frontend Error Handling & Retry Logic Guide

## Overview
The rewards redemption UI now includes sophisticated error handling with automatic retry logic, specific error messages, and graceful fallbacks to ensure points are never deducted on failure.

---

## Key Features

### 1. **Specific Error Messages**
Instead of generic "Server error" messages, users now see detailed, actionable error messages:

| Error Type | Message |
|------------|---------|
| Database unavailable | "Database is temporarily unavailable. Your points are safe. Please try again in a few moments." |
| Reward not found | "The reward could not be found. Please refresh and try again." |
| Permission denied | "Permission denied. Please contact support." |
| Insufficient points | "You don't have enough points. Please try a different reward." |
| Timeout | "Request timed out. Your points have not been deducted." |
| Network error | "Network connection lost. Your points are safe. Please check your connection and try again." |

### 2. **Automatic Retry Logic**
- Retryable errors (timeouts, network issues, temporary database issues) show a **"Retry" button**
- Non-retryable errors (insufficient points, reward not found) do not show retry option
- Maximum of **3 retry attempts** before giving up
- User sees attempt count: `(Attempt 1/3)`
- Clear message: "Don't worry! Your points have not been deducted. Click the button to retry."

### 3. **Graceful Fallback**
- Points are deducted only on **successful redemption**
- If the backend encounters any error (before, during, or after point deduction):
  - Frontend assumes points are **safe** (backend validates this too)
  - User sees clear message about their points not being deducted
  - Retry option is available if error is temporary
- Critical errors (delivery failure after points deduction) include contact support message

### 4. **Request Timeout**
- 10-second timeout for each redemption attempt
- Prevents hanging requests
- Detected as retryable error

### 5. **Error Categorization**
Errors are categorized as:
- **Non-retryable**: Insufficient points, reward not found, permission issues → No retry button
- **Retryable**: Network errors, timeouts, temporary DB issues → Retry button appears

---

## Implementation Details

### State Management

```typescript
const [retryState, setRetryState] = useState<{
  rewardId: string | null;        // The reward being redeemed (if retrying)
  retryCount: number;              // Current retry attempt number
  maxRetries: number;              // Maximum retries allowed (3)
  lastError: string | null;        // Last error message
  isRetryable: boolean;            // Whether user can retry
}>({
  rewardId: null,
  retryCount: 0,
  maxRetries: 3,
  lastError: null,
  isRetryable: false
});
```

### Core Functions

#### `isRetryableError(error, errorType): boolean`
Determines if an error can be retried based on:
- Error type from backend (DATABASE_CONNECTION_ERROR, TIMEOUT_ERROR, NETWORK_ERROR)
- Error message keywords (timeout, network, fetch, connection)

#### `getErrorMessage(error, errorType): string`
Converts error types and messages into user-friendly text.

#### `performRedemption(rewardId, retryCount)`
Executes the redemption with:
1. Point balance validation
2. 10-second timeout
3. API call to `/api/redeem`
4. Error classification
5. Retry state management

#### `handleRetryRedemption()`
Triggers another attempt with incremented retry count.

---

## User Experience Flow

### Success Flow
```
User clicks "Redeem"
    ↓
✓ Redemption successful
    ↓
Shows success message with coupon code
    ↓
Page reloads to refresh points
```

### Retryable Error Flow (e.g., Network)
```
User clicks "Redeem"
    ↓
❌ Network error (attempt 1/3)
    ↓
Shows error message + "Retry" button
Message: "Network connection lost. Your points are safe. Click the button to retry."
    ↓
User clicks "Retry"
    ↓
❌ Still failing? (attempt 2/3)
    ↓
Shows same message with updated attempt count
    ↓
User clicks "Retry" again
    ↓
✓ Succeeds on attempt 3
    ↓
Shows success message
```

### Non-Retryable Error Flow (e.g., No Points)
```
User clicks "Redeem"
    ↓
❌ Insufficient points - NO RETRY BUTTON
    ↓
Shows message: "You don't have enough points. Please try a different reward."
    ↓
No "Retry" button shown
User must try a different reward or earn more points
```

### Max Retries Exceeded Flow
```
User clicks "Redeem"
    ↓
❌ Network error (attempt 1/3)
    ↓
User retries
    ↓
❌ Network error (attempt 2/3)
    ↓
User retries
    ↓
❌ Network error (attempt 3/3) - MAX RETRIES
    ↓
Shows: "Multiple redemption attempts failed. Please check your connection and try again later."
    ↓
No "Retry" button
    ↓
User must wait and manually try again later
```

---

## Notification UI

### Success State
```
┌─────────────────────────────────────────────────────────┐
│ ✓ Redeem successful! Your code: DISC-A1B2C3D4          │
└─────────────────────────────────────────────────────────┘
(Green background, auto-closes in 3 seconds)
```

### Retryable Error State
```
┌──────────────────────────────────────────────────────────────┐
│ ❌ Network connection lost. Your points are safe.            │
│    Don't worry! Your points have not been deducted.          │
│                                                [Retry Button] │
│    (Attempt 1/3)                                             │
└──────────────────────────────────────────────────────────────┘
(Red background, persists until resolved)
```

### Non-Retryable Error State
```
┌──────────────────────────────────────────────────────────┐
│ ❌ You don't have enough points. Please try a            │
│    different reward.                                     │
└──────────────────────────────────────────────────────────┘
(Red background, no retry button)
```

---

## Code Flow Diagram

```
handleRedeem(rewardId)
    ↓
performRedemption(rewardId, retryCount=0)
    ↓
[Check: User logged in?]
[Check: Reward available?]
[Check: Points sufficient?]
    ↓
Set AbortController with 10s timeout
    ↓
fetch('/api/redeem', {userId, rewardId})
    ↓
Status 200 (Success)?
    ├── YES → Clear retry state → Show success → Reload page
    └── NO → Parse error response
        ↓
        Error category?
        ├── Retryable + retries left?
        │   ├── YES → Set retry state → Show error + Retry button
        │   └── NO → Clear retry state → Show "Max retries" message
        └── Non-retryable?
            └── Clear retry state → Show specific error message
    ↓
Catch error (network/timeout)?
    ├── YES & retryable + retries left?
    │   └── Set retry state → Show error + Retry button
    └── NO/Max retries exceeded?
        └── Clear retry state → Show final error message
```

---

## Error Type Detection

### Backend Error Types (from API)
```typescript
'DATABASE_CONNECTION_ERROR'    // Database unavailable
'NOT_FOUND_ERROR'              // Reward/user not found
'PERMISSION_ERROR'             // DB permission denied
'INSUFFICIENT_BALANCE_ERROR'   // Not enough points
'UNKNOWN_ERROR'                // Other server error
```

### Frontend Error Detection
```typescript
// Network/timeout errors
if (error.name === 'AbortError')           // Request timeout
if (error.message.includes('fetch'))       // Fetch API error
if (error.message.includes('network'))     // Network error
if (error.message.includes('connection'))  // Connection error
```

---

## Best Practices

### For Users
1. **Don't refresh the page** while a redemption is in progress
2. **Check your connection** if you see network errors
3. **Try retry first** before giving up
4. **Your points are always safe** - only deducted on success
5. **Contact support** if max retries are exceeded persistently

### For Developers
1. **Always check server logs** when debugging issues
2. **Use request ID** from error response to correlate logs
3. **Test network failures** by inspecting Network tab in DevTools
4. **Verify Firestore rules** allow operations for user
5. **Monitor error patterns** to identify systemic issues

---

## Testing Scenarios

### Scenario 1: Successful Redemption
**Steps:**
1. Open Rewards page
2. Click "Redeem" on any reward you can afford
3. Observe success message with coupon code

**Expected Behavior:**
- Success message appears
- Page reloads after 2 seconds
- Points balance decreases

### Scenario 2: Simulate Timeout (DevTools)
**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline" temporarily
3. Click "Redeem"
4. Click "Retry" button that appears

**Expected Behavior:**
- Timeout error message appears after 10 seconds
- "Don't worry! Your points have not been deducted" message shown
- Retry button available
- Set connection back to online
- Click Retry
- Redemption succeeds on retry

### Scenario 3: Insufficient Points
**Steps:**
1. Look at a reward that costs more than your current points
2. Click "Redeem"

**Expected Behavior:**
- Error message: "You don't have enough points..."
- NO "Retry" button
- Must earn more points or choose different reward

### Scenario 4: Network Failure → Recovery
**Steps:**
1. Go offline (DevTools Network → Offline)
2. Click "Redeem"
3. Wait for timeout (10 seconds)
4. Go back online
5. Click "Retry"

**Expected Behavior:**
- First attempt: Timeout error
- Retry appears with "Attempt 1/3"
- After coming online and clicking Retry: Success on second attempt

---

## Monitoring & Debugging

### Browser Console Logs
```
[Frontend] Starting redemption for reward: hint
[Frontend] API response: {status: 400, data: {...}}
[Frontend] Redemption API error: {
  status: 400,
  error: "Not enough points...",
  errorType: "INSUFFICIENT_BALANCE_ERROR",
  isRetryable: false,
  retryCount: 0
}
```

### Network Tab Inspection
1. Open DevTools → Network tab
2. Filter by XHR (XMLHttpRequest)
3. Find request to `/api/redeem`
4. Check:
   - `Request` tab: See userId and rewardId sent
   - `Response` tab: See error message and errorType
   - `Status`: 200 (success) or 400/500 (error)
   - `Time`: Check if request took close to 10s (timeout)

### Common Issues

**Issue 1: "Multiple redemption attempts failed"**
- Cause: Persistent network/database issues
- Solution: Wait a minute, retry. If still failing, contact server admin.

**Issue 2: Points deducted but "Delivery failed"**
- Cause: Critical database error during delivery
- Solution: This shouldn't happen with current code. Contact support with errorType from response.

**Issue 3: "Permission denied"**
- Cause: Firestore security rules preventing access
- Solution: Check Firebase Console → Firestore Rules, verify user auth is working.

**Issue 4: Retry button doesn't appear**
- Cause: Retryable error but code detected as non-retryable
- Solution: Check browser console for error type, report to support.

---

## Future Enhancements

- [ ] Exponential backoff between retries (1s, 2s, 4s)
- [ ] Save retry state to localStorage for persistence
- [ ] Analytics: Track retry rates and success after retry
- [ ] Toast notifications instead of persistent alerts
- [ ] Automatic retry in background (with notification)
- [ ] Redemption history with error details
