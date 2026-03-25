import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminAuth, adminDb } from "../../../../lib/firebase/admin";

async function verifyAdminToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const idToken = authHeader.replace("Bearer ", "");
  if (!idToken) throw new Error("No token");

  const decoded = await adminAuth.verifyIdToken(idToken);

  // Check if user has admin role
  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return decoded.uid;
}

// GET /api/admin/users - Fetch users with their claimed codes
export async function GET(req: Request) {
  try {
    await verifyAdminToken(req);

    // Get all users
    const usersSnap = await adminDb.collection("users").get();
    const users = [];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;

      // Get claimed codes for this user
      const claimedSnap = await adminDb.collection("claimedCodes").doc(uid).collection("codes").get();
      const claimedCodes = claimedSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        claimedAt: doc.data().claimedAt?.toDate?.() || new Date(doc.data().claimedAt)
      }));

      users.push({
        uid,
        email: userData.email || "N/A",
        role: userData.role || "user",
        fragments: userData.fragments?.length || 0,
        totalFragments: userData.totalFragments || 0,
        streakCount: userData.streakCount || 0,
        boosts: userData.boosts || 0,
        last_online: userData.last_online?.toDate?.() || (userData.last_online ? new Date(userData.last_online) : null),
        createdAt: userData.createdAt?.toDate?.() || new Date(userData.createdAt),
        claimedCodes
      });
    }

    // Sort users by last_online descending
    users.sort((a, b) => {
      if (!a.last_online && !b.last_online) return 0;
      if (!a.last_online) return 1;
      if (!b.last_online) return -1;
      return b.last_online.getTime() - a.last_online.getTime();
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}