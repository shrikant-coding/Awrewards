import { db } from './firebase/client';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { spendPoints } from './points';

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number; // points required
  type: 'discount' | 'feature' | 'item';
  value?: number; // e.g., $5 discount
  available: boolean;
}

/**
 * Get all available rewards
 */
export async function getAvailableRewards(): Promise<Reward[]> {
  const rewardsRef = collection(db, 'rewards');
  const snap = await getDocs(rewardsRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward)).filter(r => r.available);
}

/**
 * Get a specific reward by ID
 * @throws Will log detailed database errors
 */
export async function getReward(rewardId: string): Promise<Reward | null> {
  try {
    const rewardRef = doc(db, 'rewards', rewardId);
    console.log(`[Rewards/DB] Fetching reward from Firestore: ${rewardId}`);
    const snap = await getDoc(rewardRef);
    
    if (!snap.exists()) {
      console.warn(`[Rewards/DB] Reward document not found: ${rewardId}`);
      return null;
    }
    
    const rewardData = snap.data();
    console.log(`[Rewards/DB] Reward fetched successfully:`, {
      id: snap.id,
      name: rewardData?.name,
      cost: rewardData?.cost,
      available: rewardData?.available
    });
    return { id: snap.id, ...rewardData } as Reward;
  } catch (error: any) {
    console.error(`[Rewards/DB] Database error while fetching reward ${rewardId}:`, {
      code: error.code,
      message: error.message,
      name: error.name
    });
    throw error;
  }
}

/**
 * Redeem a reward for a user
 * Performs: reward validation, points deduction, and delivery
 * @throws Will throw database errors (caught by API route)
 */
export async function redeemReward(userId: string, rewardId: string): Promise<{ success: boolean; message: string; delivery?: any }> {
  const startTime = Date.now();
  console.log(`\n[Rewards] ============================================`);
  console.log(`[Rewards] STARTING REDEMPTION PROCESS`);
  console.log(`[Rewards] User: ${userId}`);
  console.log(`[Rewards] Reward ID: ${rewardId}`);
  console.log(`[Rewards] Timestamp: ${new Date().toISOString()}`);
  console.log(`[Rewards] ============================================\n`);
  
  // Step 1: Validate reward exists
  console.log(`[Rewards] STEP 1: Fetching reward from database...`);
  let reward;
  try {
    reward = await getReward(rewardId);
  } catch (dbError: any) {
    console.error(`[Rewards] STEP 1 FAILED: Database error while fetching reward`);
    throw dbError;
  }
  
  if (!reward) {
    console.warn(`[Rewards] STEP 1 FAILED: Reward not found in database (ID: ${rewardId})`);
    return { 
      success: false, 
      message: `Reward '${rewardId}' not found in database.` 
    };
  }
  
  console.log(`[Rewards] STEP 1 SUCCESS: Reward found`);
  console.log(`[Rewards]   - ID: ${reward.id}`);
  console.log(`[Rewards]   - Name: ${reward.name}`);
  console.log(`[Rewards]   - Cost: ${reward.cost} points`);
  console.log(`[Rewards]   - Type: ${reward.type}`);
  console.log(`[Rewards]   - Available: ${reward.available}\n`);

  // Step 2: Validate reward availability
  console.log(`[Rewards] STEP 2: Checking reward availability...`);
  if (!reward.available) {
    console.warn(`[Rewards] STEP 2 FAILED: Reward is marked as unavailable`);
    return { 
      success: false, 
      message: 'Reward is no longer available' 
    };
  }
  console.log(`[Rewards] STEP 2 SUCCESS: Reward is available\n`);

  // Step 3: Attempt to spend points
  console.log(`[Rewards] STEP 3: Deducting ${reward.cost} points from user ${userId}...`);
  let pointsDeducted;
  try {
    pointsDeducted = await spendPoints(userId, reward.cost, `Redeemed ${reward.name}`);
  } catch (pointsError: any) {
    console.error(`[Rewards] STEP 3 FAILED: Database error while spending points`);
    console.error(`[Rewards]   Error code: ${pointsError.code}`);
    console.error(`[Rewards]   Error message: ${pointsError.message}`);
    throw pointsError;
  }
  
  if (!pointsDeducted) {
    console.warn(`[Rewards] STEP 3 FAILED: User has insufficient points`);
    console.warn(`[Rewards]   Required: ${reward.cost} points`);
    return { 
      success: false, 
      message: `Not enough points. This reward requires ${reward.cost} points.` 
    };
  }
  console.log(`[Rewards] STEP 3 SUCCESS: Points deducted successfully\n`);

  // Step 4: Deliver reward based on type
  console.log(`[Rewards] STEP 4: Processing ${reward.type} reward delivery...`);
  let deliveryInfo: any = null;
  const userRef = doc(db, 'users', userId);

  try {
    if (reward.type === 'discount') {
      const couponCode = `DISC-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
      console.log(`[Rewards/DB] Creating coupon: ${couponCode}`);
      await addDoc(collection(db, 'coupons'), {
        userId,
        rewardId,
        code: couponCode,
        value: reward.value,
        redeemedAt: new Date(),
        used: false
      });
      deliveryInfo = { type: 'coupon', code: couponCode, value: reward.value };
      console.log(`[Rewards/DB] Coupon created successfully`);
    } else if (reward.type === 'feature') {
      const feature = reward.name.toLowerCase().replace(/\s+/g, '_');
      console.log(`[Rewards/DB] Unlocking feature: ${feature}`);
      await updateDoc(userRef, { [`unlockedFeatures.${feature}`]: true });
      deliveryInfo = { type: 'feature', feature };
      console.log(`[Rewards/DB] Feature unlocked successfully`);
    } else if (reward.type === 'item') {
      console.log(`[Rewards/DB] Creating fulfillment request...`);
      await addDoc(collection(db, 'fulfillmentRequests'), {
        userId,
        rewardId,
        rewardName: reward.name,
        requestedAt: new Date(),
        status: 'pending'
      });
      deliveryInfo = { type: 'item', status: 'Fulfillment team notified' };
      console.log(`[Rewards/DB] Fulfillment request created successfully`);
    }
    console.log(`[Rewards] STEP 4 SUCCESS: Reward delivered\n`);
  } catch (deliveryError: any) {
    console.error(`[Rewards] STEP 4 FAILED: Delivery error (CRITICAL)`);
    console.error(`[Rewards]   Error type: ${reward.type}`);
    console.error(`[Rewards]   Error code: ${deliveryError.code}`);
    console.error(`[Rewards]   Error message: ${deliveryError.message}`);
    console.error(`[Rewards]   WARNING: Points were deducted but delivery failed!`);
    throw deliveryError;
  }

  const duration = Date.now() - startTime;
  console.log(`[Rewards] ============================================`);
  console.log(`[Rewards] REDEMPTION COMPLETE`);
  console.log(`[Rewards] Status: SUCCESS`);
  console.log(`[Rewards] Duration: ${duration}ms`);
  console.log(`[Rewards] user: ${userId} | reward: ${rewardId}`);
  console.log(`[Rewards] ============================================\n`);
  
  return { 
    success: true, 
    message: `Successfully redeemed ${reward.name}!`, 
    delivery: deliveryInfo 
  };
}