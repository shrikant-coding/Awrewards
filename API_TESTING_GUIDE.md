# Redemption API Testing Guide

## API Endpoint Overview

### POST `/api/redeem`
Redeems a reward for a user by deducting points and processing the reward delivery.

**Base URL:** `http://localhost:3000` (development)

---

## Testing with Postman or Insomnia

### Step 1: Set Up the Request

1. **Create a new POST request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/redeem`

2. **Set Headers**
   ```
   Content-Type: application/json
   ```

3. **Set Request Body** (JSON)
   ```json
   {
     "userId": "your_user_id_here",
     "rewardId": "hint"
   }
   ```

---

## Test Cases

### Test Case 1: Successful Redemption
**Scenario:** User has enough points and reward is available

**Request:**
```json
{
  "userId": "user123",
  "rewardId": "hint"
}
```

**Expected Response (200):**
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

**Backend Logs (Server Console):**
```
[a1b2c3d] [2024-01-15T10:30:45.123Z] Redemption request received
[a1b2c3d] Request parsed successfully
[a1b2c3d] Request payload: {userId: "user123", rewardId: "hint"}
[a1b2c3d] Attempting to redeem reward 'hint' for user 'user123'

[Rewards] ============================================
[Rewards] STARTING REDEMPTION PROCESS
[Rewards] User: user123
[Rewards] Reward ID: hint
[Rewards] Timestamp: 2024-01-15T10:30:45.456Z
[Rewards] ============================================

[Rewards] STEP 1: Fetching reward from database...
[Rewards/DB] Fetching reward from Firestore: hint
[Rewards/DB] Reward fetched successfully: {id: 'hint', name: 'Premium Puzzle Hint', cost: 50, available: true}
[Rewards] STEP 1 SUCCESS: Reward found
[Rewards]   - ID: hint
[Rewards]   - Name: Premium Puzzle Hint
[Rewards]   - Cost: 50 points
[Rewards]   - Type: discount
[Rewards]   - Available: true

[Rewards] STEP 2: Checking reward availability...
[Rewards] STEP 2 SUCCESS: Reward is available

[Rewards] STEP 3: Deducting 50 points from user user123...
[Points] Checking balance for user user123 to spend 50 points...
[Points] Active balance for user user123: 150
[Points] Successfully spent 50 points for user user123
[Rewards] STEP 3 SUCCESS: Points deducted successfully

[Rewards] STEP 4: Processing discount reward delivery...
[Rewards/DB] Creating coupon: DISC-A1B2C3D4
[Rewards/DB] Coupon created successfully
[Rewards] STEP 4 SUCCESS: Reward delivered

[Rewards] ============================================
[Rewards] REDEMPTION COMPLETE
[Rewards] Status: SUCCESS
[Rewards] Duration: 234ms
[Rewards] user: user123 | reward: hint
[Rewards] ============================================

[a1b2c3d] Redemption successful
[a1b2c3d] Delivery info: {type: 'coupon', code: 'DISC-A1B2C3D4', value: 50}
```

---

### Test Case 2: Insufficient Points
**Scenario:** User doesn't have enough points

**Request:**
```json
{
  "userId": "user456",
  "rewardId": "hint"
}
```

**Expected Response (400):**
```json
{
  "error": "Not enough points. This reward requires 50 points."
}
```

**Backend Logs (Key sections):**
```
[Rewards] STEP 3: Deducting 50 points from user user456...
[Points] Checking balance for user user456 to spend 50 points...
[Points] Active balance for user user456: 25
[Points] Insufficient balance - user has 25 but needs 50
[Rewards] STEP 3 FAILED: User has insufficient points
[Rewards]   Required: 50 points

[a1b2c3d] Redemption failed - Business logic error
[a1b2c3d] Error message: Not enough points. This reward requires 50 points.
```

---

### Test Case 3: Reward Not Found
**Scenario:** Reward ID doesn't exist in database

**Request:**
```json
{
  "userId": "user123",
  "rewardId": "invalid_reward_id"
}
```

**Expected Response (400):**
```json
{
  "error": "Reward 'invalid_reward_id' not found in database."
}
```

**Backend Logs:**
```
[Rewards] STEP 1: Fetching reward from database...
[Rewards/DB] Fetching reward from Firestore: invalid_reward_id
[Rewards/DB] Reward document not found: invalid_reward_id
[Rewards] STEP 1 FAILED: Reward not found in database (ID: invalid_reward_id)

[a1b2c3d] Redemption failed - Business logic error
[a1b2c3d] Error message: Reward 'invalid_reward_id' not found in database.
```

---

### Test Case 4: Reward Unavailable
**Scenario:** Reward exists but is marked as unavailable

**Request:**
```json
{
  "userId": "user123",
  "rewardId": "disabled_reward"
}
```

**Expected Response (400):**
```json
{
  "error": "Reward is no longer available"
}
```

**Database Setup Needed:**
- Ensure reward document has `available: false`

---

### Test Case 5: Database Connection Error
**Scenario:** Database is temporarily unavailable

**Expected Response (500):**
```json
{
  "error": "Database connection failed. Please try again later.",
  "errorType": "DATABASE_CONNECTION_ERROR",
  "requestId": "a1b2c3d"
}
```

**Backend Logs:**
```
[a1b2c3d] FATAL ERROR - DATABASE_CONNECTION_ERROR
[a1b2c3d] Error code: FIRESTORE_UNAVAILABLE
[a1b2c3d] Error message: Service is temporarily unavailable
[a1b2c3d] Error details: {
  code: 'FIRESTORE_UNAVAILABLE',
  message: 'Service is temporarily unavailable',
  name: 'FirebaseError',
  stack: '...'
}
```

---

### Test Case 6: Invalid Request (Missing Fields)
**Scenario:** Request payload is missing required fields

**Request (missing rewardId):**
```json
{
  "userId": "user123"
}
```

**Expected Response (400):**
```json
{
  "error": "userId and rewardId are required"
}
```

**Backend Logs:**
```
[a1b2c3d] [2024-01-15T10:35:20.123Z] Redemption request received
[a1b2c3d] Request parsed successfully
[a1b2c3d] Request payload: {userId: "user123", rewardId: undefined}
[a1b2c3d] Validation failed: userId and rewardId are required
```

---

### Test Case 7: Invalid JSON
**Scenario:** Request body is not valid JSON

**Request Body:**
```
{invalid json}
```

**Expected Response (400):**
```json
{
  "error": "Invalid request format. Expected JSON."
}
```

**Backend Logs:**
```
[a1b2c3d] JSON parse error: SyntaxError: Unexpected token...
```

---

## Testing Workflow

### Step-by-Step Testing Process

1. **Identify the user ID** (from your Firebase authentication)
   - Go to Firebase Console → Authentication → Copy a user's UID
   - Or check your app's logged-in user UID in browser console

2. **Identify available reward IDs**
   - Check your Firebase Firestore → `rewards` collection
   - Common IDs: `hint`, `googleplay-10`, `amazon-10`, etc.

3. **Check user's current points**
   - Firestore → `users` collection → Find user doc
   - Look for `current_points_balance` field

4. **Make the test request**
   - Use request body with valid userId and rewardId
   - Send POST request to `/api/redeem`

5. **Review the response**
   - Check response status code (200 = success, 400 = bad request, 500 = server error)
   - Check response body for detailed error message

6. **Check server logs**
   - Terminal where `npm run dev` is running
   - Look for request ID to trace the entire flow
   - Compare each STEP with the expected flow

7. **Verify database changes**
   - Check user's points were deducted (if success)
   - Check reward delivery was created
   - Verify no data inconsistencies

---

## Common Testing Issues

### Issue 1: "User not found"
**Likely cause:** User doesn't exist in Firestore `users` collection
**Solution:** 
- Firebase Console → Firestore → users → Verify user document exists
- Check the user ID format is correct (usually a long alphanumeric string from Firebase Auth)

### Issue 2: "Reward not found"
**Likely cause:** Reward ID doesn't exist in Firestore
**Solution:**
- Check spelling of reward ID (case-sensitive)
- Firestore → rewards collection → Verify reward document exists
- If using dynamic rewards, check the collection for available IDs

### Issue 3: Connection timeout errors
**Likely cause:** Dev server not running or Firestore connectivity issues
**Solution:**
- Verify `npm run dev` is running
- Check internet connection
- Verify Firestore project is accessible
- Check firestore.rules allows read/write operations

### Issue 4: "Insufficient points" when user should have enough
**Likely cause:** Points calculation or database record mismatch
**Solution:**
- Check the `current_points_balance` field directly in Firestore
- Look for expired points in the `points` calculation logic
- Check if multiple points deductions happened simultaneously

### Issue 5: Reward delivered but user didn't receive it
**Likely cause:** Delivery step failed silently in old code (should not happen now)
**Solution:**
- Check server logs for "STEP 4 FAILED" or delivery errors
- Verify delivery collection (coupons/fulfillmentRequests) was created
- Check Firestore security rules allow writes to those collections

---

## Request ID Tracking

Each request gets a unique 7-character ID (e.g., `a1b2c3d`). This ID:
- Appears in all server logs for that request
- Helps correlate frontend and backend operations
- Is returned in error responses
- Useful for debugging multi-step failures

**Example:** If you see error `"error": {..., "requestId": "a1b2c3d", ...}`, look in server logs for `[a1b2c3d]` to see the full context.

---

## Automated Testing

To integrate into your test suite:

```typescript
// Example Jest test
describe('POST /api/redeem', () => {
  it('should successfully redeem a reward', async () => {
    const response = await fetch('http://localhost:3000/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test_user_123',
        rewardId: 'hint'
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.delivery).toBeDefined();
    expect(data.message).toContain('Successfully redeemed');
  });

  it('should return 400 for insufficient points', async () => {
    const response = await fetch('http://localhost:3000/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'poor_user',
        rewardId: 'hint'
      })
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Not enough points');
  });
});
```

---

## Monitoring Checklist

- ✓ Server logs show all 4 redemption steps
- ✓ Error messages are descriptive (not generic)
- ✓ Request ID correlates logs
- ✓ Database operations complete successfully
- ✓ Points balance changes in Firestore
- ✓ Reward delivery records are created
- ✓ No duplicate transactions
- ✓ Response times are reasonable (< 1000ms)
