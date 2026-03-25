# Redemption System Debugging Guide

## Overview
The redemption system has been enhanced with comprehensive logging and error handling to make debugging easier. This guide explains how to track and troubleshoot redemption issues.

## Quick Debugging Checklist

### 1. Check Backend Logs
The backend now logs each step of the redemption process with a unique request ID.

**Where to look:**
- Server terminal where the app is running
- Look for log entries with format: `[RequestId] [Component] Message`

**Example flow:**
```
[a1b2c3d] Redemption request received
[a1b2c3d] Request payload: { userId: "user123", rewardId: "reward456" }
[a1b2c3d] Attempting to redeem reward reward456 for user user123
[a1b2c3d] Reward found: { id: "reward456", name: "Hint", cost: 50 }
[a1b2c3d] Checking if user has 50 points...
[a1b2c3d] Points deducted successfully for user user123
[a1b2c3d] Creating coupon for user user123: DISC-A1B2C3D4
[a1b2c3d] Coupon delivery successful: { type: 'coupon', code: 'DISC-A1B2C3D4', value: 50 }
[a1b2c3d] Redemption complete for user user123, reward reward456
```

### 2. Check Frontend Browser Console
The frontend logs are sent to the browser's developer console.

**Steps:**
1. Open browser DevTools: `F12` or `Ctrl+Shift+I`
2. Go to the **Console** tab
3. Look for logs with format: `[Frontend] Message`

**Example frontend logs:**
```
[Frontend] Starting redemption for reward: hint
[Frontend] API response: {status: 200, data: {...}}
[Frontend] Redemption successful: {message: "Successfully redeemed Premium Puzzle Hint!", delivery: {...}}
```

### 3. Check Network Tab
To inspect the actual API request and response:

**Steps:**
1. Open DevTools → **Network** tab
2. Attempt the redemption
3. Look for a request to `/api/redeem`
4. Click on it to see:
   - **Request payload** (what was sent)
   - **Response** (success or error details)
   - **Status code** (200 for success, 400 for client error, 500 for server error)

**Example request body:**
```json
{
  "userId": "user123",
  "rewardId": "hint"
}
```

**Example success response:**
```json
{
  "message": "Successfully redeemed Premium Puzzle Hint!",
  "delivery": {
    "type": "coupon",
    "code": "DISC-A1B2C3D4",
    "value": 50
  }
}
```

**Example error response:**
```json
{
  "error": "Not enough points. This reward requires 50 points."
}
```

## Common Error Messages & Solutions

### "Not enough points. This reward requires 50 points."
**Cause:** User's balance is below the reward cost
**Check:**
1. Frontend shows correct point balance
2. Backend logs show user's actual balance in `spendPoints` logs
3. Verify no concurrent redemptions are happening

### "Reward not found"
**Cause:** Reward ID doesn't exist or was deleted
**Check:**
1. Confirm the reward ID in the frontend `hardcodedRewards` array
2. Check Firestore `rewards` collection if using dynamic rewards

### "Reward is no longer available"
**Cause:** Reward exists but has `available: false` in database
**Solution:** Update the reward's `available` field to `true` in Firestore

### "Server error: Unable to process redemption request"
**Cause:** Unexpected error on backend
**Steps:**
1. Check backend logs for the full error stack trace
2. Look for database connectivity issues
3. Check if Firestore rules are blocking the operation

### "Payment processed but delivery failed. Please contact support."
**Cause:** Points were deducted but reward delivery failed (critical error)
**Action:** 
1. Check backend logs for delivery error details
2. Verify Firestore write operations are succeeding
3. This should be rare - contact support if it occurs

### "Network error. Please check your connection and try again."
**Cause:** Frontend couldn't reach the API
**Check:**
1. Browser DevTools → Network tab for failed `/api/redeem` request
2. Server is running and on correct port
3. API endpoint `/api/redeem` exists

## Technical Details

### Request ID Tracking
Each request gets a unique ID (format: `[a-z0-9]{7}`) for correlating frontend and backend logs.

**Frontend:**
- Browser console shows request start
- Look for API response logging

**Backend:**
- Server logs show request ID throughout the entire flow
- Useful for tracing multi-step operations

### Logging Locations

| Component | File | Logs Format |
|-----------|------|-------------|
| API Route | `app/api/redeem/route.ts` | `[RequestId] Message` |
| Rewards Logic | `lib/rewards.ts` | `[Rewards] Message` |
| Points Logic | `lib/points.ts` | `[Points] Message` |
| Frontend | `app/rewards/page.tsx` | `[Frontend] Message` |

### Error Handling Strategy

1. **Validation errors** - Caught early, specific messages
2. **Business logic errors** - Descriptive messages (insufficient points, etc.)
3. **Delivery errors** - Logged but user is warned (points already spent)
4. **Network/server errors** - Generic message with instruction to retry

## Best Practices

1. **Always check DevTools console first** - Frontend logs appear here immediately
2. **Cross-reference with server logs** - Use request ID to trace entire flow
3. **Check Network tab** - Verify request payload and API response
4. **Track point balance** - Compare frontend display with backend logs
5. **Test with different scenarios:**
   - User with sufficient points ✓
   - User with insufficient points ✓
   - Non-existent reward ✓
   - Unavailable reward ✓

## Monitoring & Optimization

To make debugging easier in production, consider:

- ✓ Current: Detailed logging with request IDs
- ✓ Current: Specific error messages
- TODO: Sentry/error tracking integration
- TODO: Backend logging to file or logging service
- TODO: Performance metrics on redemption operation

## Examples

### Example 1: Successful Redemption
```
Frontend Console:
[Frontend] Starting redemption for reward: hint
[Frontend] API response: {status: 200, data: {message: "Successfully redeemed...", delivery: {...}}}
[Frontend] Redemption successful: {message: "Successfully redeemed Premium Puzzle Hint!", delivery: {type: 'coupon', code: 'DISC-A1B2C3D4'}}

Server Logs:
[a1b2c3d] Redemption request received
[a1b2c3d] Request payload: {userId: "user123", rewardId: "hint"}
[a1b2c3d] Attempting to redeem reward hint for user user123
[Rewards] Starting redemption for user user123, reward hint
[Rewards] Reward found: {id: 'hint', name: 'Premium Puzzle Hint', cost: 50}
[Rewards] Checking if user has 50 points...
[Points] Checking balance for user user123 to spend 50 points...
[Points] Active balance for user user123: 150
[Points] Successfully spent 50 points for user user123
[Rewards] Points deducted successfully for user user123
[Rewards] Creating coupon for user user123: DISC-A1B2C3D4
[Rewards] Coupon delivery successful...
[Rewards] Redemption complete for user user123, reward hint
[a1b2c3d] Redemption successful...
```

### Example 2: Insufficient Points
```
Frontend Console:
[Frontend] Starting redemption for reward: hint
[Frontend] API response: {status: 400, data: {error: 'Not enough points...'}}
[Frontend] Redemption API error: Not enough points. This reward requires 50 points.

Server Logs:
[a1b2c3d] Redemption request received
[Rewards] Starting redemption for user user123, reward hint
[Points] Checking balance for user user123 to spend 50 points...
[Points] Active balance for user user123: 25
[Points] Insufficient balance - user has 25 but needs 50
[Rewards] User user123 has insufficient points for reward hint (cost: 50)
[a1b2c3d] Redemption failed: Not enough points...
```

## Support

If you encounter issues not covered here:
1. Collect the complete backend log output with the request ID
2. Take a screenshot of the browser DevTools Console and Network tabs
3. Note the exact error message shown to the user
4. Report with user ID and timestamp
