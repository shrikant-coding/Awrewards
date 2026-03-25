import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from './firebase/admin';

export interface GiftCode {
  code: string;
  value: number;
  tier: 'Low' | 'Mid' | 'High';
  status: 'active' | 'used' | 'expired';
  created_at: Timestamp;
  assigned_to?: string; // User ID if assigned to a specific user
  redeemed_by?: string; // Optional, only set when redeemed
}

// Create a new gift code
export async function createGiftCode(data: Omit<GiftCode, 'status' | 'created_at'>): Promise<string> {
  const newGiftCode: GiftCode = {
    ...data,
    status: 'active',
    created_at: Timestamp.now(),
  };
  const docRef = await adminDb.collection('giftCodes').add(newGiftCode);
  return docRef.id;
}

// Get a gift code by code
export async function getGiftCodeByCode(code: string): Promise<{ id: string; data: GiftCode } | null> {
  const snapshot = await adminDb.collection('giftCodes').where('code', '==', code).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  const data = doc.data() as GiftCode;
  return { id: doc.id, data };
}

// Update a gift code (e.g., mark as redeemed)
export async function updateGiftCode(code: string, updates: Partial<Omit<GiftCode, 'code'>>): Promise<boolean> {
  const snapshot = await adminDb.collection('giftCodes').where('code', '==', code).limit(1).get();
  if (snapshot.empty) return false;
  const docRef = snapshot.docs[0].ref;
  await docRef.update(updates);
  return true;
}

// Delete a gift code by code
export async function deleteGiftCode(code: string): Promise<boolean> {
  const snapshot = await adminDb.collection('giftCodes').where('code', '==', code).limit(1).get();
  if (snapshot.empty) return false;
  const docRef = snapshot.docs[0].ref;
  await docRef.delete();
  return true;
}

// Get all gift codes (for admin purposes, perhaps with pagination)
export async function getAllGiftCodes(): Promise<Array<{ id: string; data: GiftCode }>> {
  const snapshot = await adminDb.collection('giftCodes').get();
  return snapshot.docs.map(doc => {
    const data = doc.data() as GiftCode;
    return { id: doc.id, data };
  });
}