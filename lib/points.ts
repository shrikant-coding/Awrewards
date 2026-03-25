import { db } from './firebase/client';
import { doc, updateDoc, increment, addDoc, collection, getDoc, Timestamp, query, where, orderBy, getDocs } from 'firebase/firestore';

export interface Transaction {
  id?: string;
  user_id: string;
  amount: number;
  reason: string;
  timestamp: Timestamp;
  expiresAt: Timestamp; // 6 months from timestamp
}

export interface UserPoints {
  current_points_balance: number;
}

/**
 * Add points to a user's balance and log the transaction
 */
export async function addPoints(userId: string, amount: number, reason: string, firestoreDb?: any, FieldValue?: any): Promise<void> {
  if (firestoreDb && FieldValue) {
    // Admin SDK
    const userRef = firestoreDb.collection('users').doc(userId);
    const now = FieldValue.serverTimestamp();
    const expiresAt = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months approx

    // Update balance
    await userRef.update({
      current_points_balance: FieldValue.increment(amount)
    });

    // Log transaction
    await firestoreDb.collection('transactions').add({
      user_id: userId,
      amount: amount,
      reason: reason,
      timestamp: now,
      expiresAt: FieldValue.serverTimestamp() // For simplicity, using serverTimestamp for both
    });
  } else {
    // Client SDK
    const userRef = doc(db, 'users', userId);
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months approx

    // Update balance
    await updateDoc(userRef, {
      current_points_balance: increment(amount)
    });

    // Log transaction
    await addDoc(collection(db, 'transactions'), {
      user_id: userId,
      amount: amount,
      reason: reason,
      timestamp: now,
      expiresAt: expiresAt
    });
  }
}

/**
 * Spend points from a user's balance and log the transaction
 */
export async function spendPoints(userId: string, amount: number, reason: string): Promise<boolean> {
  console.log(`[Points] Checking balance for user ${userId} to spend ${amount} points (${reason})...`);
  const activeBalance = await getActivePointsBalance(userId);
  
  console.log(`[Points] Active balance for user ${userId}: ${activeBalance}`);
  if (activeBalance < amount) {
    console.warn(`[Points] Insufficient balance - user has ${activeBalance} but needs ${amount}`);
    return false;
  }

  const userRef = doc(db, 'users', userId);

  try {
    // Deduct points
    console.log(`[Points] Deducting ${amount} points from user ${userId}`);
    await updateDoc(userRef, {
      current_points_balance: increment(-amount)
    });

    // Log transaction (no expiration for spending)
    await addDoc(collection(db, 'transactions'), {
      user_id: userId,
      amount: -amount,
      reason: reason,
      timestamp: Timestamp.now()
    });
    
    console.log(`[Points] Successfully spent ${amount} points for user ${userId}`);
    return true;
  } catch (error: any) {
    console.error(`[Points] Error spending points for user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Get user's current points balance
 */
export async function getPointsBalance(userId: string): Promise<number> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return 0;

  return userSnap.data()?.current_points_balance || 0;
}

/**
 * Get user's active (non-expired) points balance
 */
export async function getActivePointsBalance(userId: string): Promise<number> {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'transactions'),
    where('user_id', '==', userId),
    where('expiresAt', '>', now),
    orderBy('expiresAt', 'desc')
  );
  const snap = await getDocs(q);
  let active = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.amount > 0) { // Only positive transactions
      active += data.amount;
    }
  }
  return active;
}

/**
 * Award points for daily login
 */
export async function awardDailyLoginPoints(userId: string): Promise<{ awarded: boolean; message: string }> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return { awarded: false, message: 'User not found' };

  const now = Timestamp.now();
  const today = new Date(now.toDate().setHours(0,0,0,0)).toISOString().slice(0,10);
  const lastDaily = userSnap.data()?.lastDailyLogin;
  const lastDailyDate = lastDaily ? new Date(lastDaily.toDate().setHours(0,0,0,0)).toISOString().slice(0,10) : null;

  if (lastDailyDate === today) {
    return { awarded: false, message: 'Daily login already claimed today' };
  }

  await addPoints(userId, 50, 'Daily Login');
  await updateDoc(userRef, { lastDailyLogin: now });
  return { awarded: true, message: 'Daily login points awarded' };
}

/**
 * Award points for solving a puzzle
 */
export async function awardPuzzleCompletionPoints(userId: string, puzzleType: string): Promise<{ awarded: boolean; message: string }> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return { awarded: false, message: 'User not found' };

  const now = Timestamp.now();
  const today = new Date(now.toDate().setHours(0,0,0,0)).toISOString().slice(0,10);
  const lastPuzzleDate = userSnap.data()?.lastPuzzleDate;
  const lastDate = lastPuzzleDate ? new Date(lastPuzzleDate.toDate().setHours(0,0,0,0)).toISOString().slice(0,10) : null;
  let dailyCount = userSnap.data()?.dailyPuzzleCompletions || 0;

  if (lastDate !== today) {
    dailyCount = 0; // Reset
  }

  if (dailyCount >= 5) {
    return { awarded: false, message: 'Daily puzzle completion limit reached (5 puzzles)' };
  }

  const points = 25; // 25 points per puzzle
  await addPoints(userId, points, `Completed ${puzzleType} puzzle`);
  await updateDoc(userRef, { lastPuzzleDate: now, dailyPuzzleCompletions: dailyCount + 1 });
  return { awarded: true, message: 'Puzzle completion points awarded' };
}

/**
 * Award points for completing profile (one-time)
 */
export async function awardProfileCompletionPoints(userId: string): Promise<{ awarded: boolean; message: string }> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return { awarded: false, message: 'User not found' };

  const profileCompleted = userSnap.data()?.profileCompleted;
  if (profileCompleted) {
    return { awarded: false, message: 'Profile completion points already awarded' };
  }

  await addPoints(userId, 100, 'Profile Completion');
  await updateDoc(userRef, { profileCompleted: true });
  return { awarded: true, message: 'Profile completion points awarded' };
}

/**
 * Award points for claiming a code
 */
export async function awardCodeClaimPoints(userId: string, codeValue: number): Promise<void> {
  const points = codeValue * 10; // e.g., $5 code = 50 points
  await addPoints(userId, points, `Claimed ${codeValue} code`);
}

/**
 * Award points for making a purchase
 */
export async function awardPurchasePoints(userId: string, purchaseAmountRs: number): Promise<void> {
  const points = Math.floor(purchaseAmountRs); // 1 point per rs
  if (points > 0) {
    await addPoints(userId, points, `Purchase of ${purchaseAmountRs} rs`);
  }
}

/**
 * Award points for daily check-in with progressive streak rewards
 */
export async function awardDailyCheckInPoints(userId: string, firestoreDb?: any, FieldValue?: any): Promise<{ awarded: boolean; message: string; points: number; streak: number }> {
  let userData: any;

  if (firestoreDb) {
    // Admin SDK
    const userRef = firestoreDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    userData = userSnap.exists ? userSnap.data() : null;
  } else {
    // Client SDK
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    userData = userSnap.exists() ? userSnap.data() : null;
  }

  if (!userData) return { awarded: false, message: 'User not found', points: 0, streak: 0 };

  const now = firestoreDb && FieldValue ? FieldValue.serverTimestamp() : Timestamp.now();
  const today = new Date().toISOString().slice(0,10);
  const lastCheckin = userData?.last_checkin_date;
  const lastCheckinDate = lastCheckin ?
    (firestoreDb ? new Date(lastCheckin._seconds * 1000) : lastCheckin.toDate()).toISOString().slice(0,10) : null;
  let currentStreak = userData?.checkin_streak || 0;

  if (lastCheckinDate === today) {
    return { awarded: false, message: 'You have already checked in today! Come back tomorrow.', points: 0, streak: currentStreak };
  }

  // Check if streak continues
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0,10);

  if (lastCheckinDate === yesterdayStr) {
    currentStreak += 1;
  } else {
    currentStreak = 1; // Reset streak
  }

  // Progressive rewards: Day 1: 5 pts, Day 2: 10 pts, etc., up to Day 7: 35 pts, then increases slower
  const basePoints = Math.min(currentStreak * 5, 35) + Math.max(0, currentStreak - 7) * 2;

  // Update user document
  if (firestoreDb) {
    // Admin SDK
    const userRef = firestoreDb.collection('users').doc(userId);
    await userRef.update({
      last_checkin_date: now,
      checkin_streak: currentStreak
    });
  } else {
    // Client SDK
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      last_checkin_date: now,
      checkin_streak: currentStreak
    });
  }

  await addPoints(userId, basePoints, `Daily check-in - Day ${currentStreak}`, firestoreDb, FieldValue);

  return { awarded: true, message: `Checked in successfully! Earned ${basePoints} points.`, points: basePoints, streak: currentStreak };
}

/**
 * Award points for maintaining streak
 */
export async function awardStreakBonusPoints(userId: string, streakCount: number): Promise<void> {
  if (streakCount % 7 === 0) { // Weekly bonus
    const points = 50;
    await addPoints(userId, points, `Streak milestone: ${streakCount} days`);
  }
}