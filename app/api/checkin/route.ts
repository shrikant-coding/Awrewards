import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminAuth, adminDb } from "../../../lib/firebase/admin";
import { awardDailyCheckInPoints } from "../../../lib/points";

async function verifyToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const idToken = authHeader.replace("Bearer ", "");
  if (!idToken) throw new Error("No token");
  const decoded = await adminAuth.verifyIdToken(idToken);
  return decoded.uid;
}

export async function POST(req: Request) {
  try {
    const uid = await verifyToken(req);
    const db = adminDb;
    const FieldValue = admin.firestore.FieldValue;

    // Award daily check-in points
    const result = await awardDailyCheckInPoints(uid, db, FieldValue);

    if (!result.awarded) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      points: result.points,
      streak: result.streak
    });
  } catch (err: any) {
    console.error("Daily check-in error:", err);
    return NextResponse.json({ error: err.message || "Failed to check in" }, { status: 401 });
  }
}