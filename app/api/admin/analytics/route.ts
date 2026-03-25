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

// GET /api/admin/analytics - Get user analytics
export async function GET(req: Request) {
  try {
    await verifyAdminToken(req);

    // Total users
    const totalUsersSnap = await adminDb.collection("users").get();
    const totalUsers = totalUsersSnap.size;

    // Active users today (last_online within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsersSnap = await adminDb.collection("users")
      .where("last_online", ">", twentyFourHoursAgo)
      .get();
    const activeUsers = activeUsersSnap.size;

    // Active now (last_online within last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeNowSnap = await adminDb.collection("users")
      .where("last_online", ">", tenMinutesAgo)
      .get();
    const activeNow = activeNowSnap.size;

    // Total codes stats
    const totalCodesSnap = await adminDb.collection("giftCodes").get();
    const totalCodes = totalCodesSnap.size;

    const activeCodesSnap = await adminDb.collection("giftCodes")
      .where("status", "==", "active")
      .get();
    const activeCodes = activeCodesSnap.size;

    const usedCodesSnap = await adminDb.collection("giftCodes")
      .where("status", "==", "used")
      .get();
    const usedCodes = usedCodesSnap.size;

    const expiredCodesSnap = await adminDb.collection("giftCodes")
      .where("status", "==", "expired")
      .get();
    const expiredCodes = expiredCodesSnap.size;

    // Get user growth data for last 30 days
    const growthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayUsersSnap = await adminDb.collection("users")
        .where("createdAt", ">=", date)
        .where("createdAt", "<", nextDay)
        .get();

      growthData.push({
        date: date.toISOString().split('T')[0],
        users: dayUsersSnap.size
      });
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        active_now: activeNow
      },
      codes: {
        total: totalCodes,
        active: activeCodes,
        used: usedCodes,
        expired: expiredCodes
      },
      growth: growthData
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}