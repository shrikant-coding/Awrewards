import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminAuth, adminDb } from "../../../lib/firebase/admin";
import { awardCodeClaimPoints } from "../../../lib/points";

async function verifyToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const idToken = authHeader.replace("Bearer ", "");
  if (!idToken) throw new Error("No token");
  const decoded = await adminAuth.verifyIdToken(idToken);
  return decoded.uid;
}

function pickWeightedRandom(codes: any[]) {
  const weight = (tier: string) => (tier === "high" ? 5 : tier === "mid" ? 25 : 70);
  const expanded = codes.map(c => ({ ...c, w: weight(c.tier) }));
  const total = expanded.reduce((s, c) => s + c.w, 0);
  let r = Math.random() * total;
  for (const c of expanded) {
    r -= c.w;
    if (r <= 0) return c;
  }
  return expanded[0];
}

export async function POST(req: Request) {
  try {
    const uid = await verifyToken(req);
    const db = adminDb;

    // Check available codes
    const snap = await db.collection("codes").where("status", "==", "available").get();
    if (snap.empty) return NextResponse.json({ error: "No codes available" }, { status: 409 });

    const codes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const picked = pickWeightedRandom(codes);

    const codeRef = db.collection("codes").doc(picked.id);
    const userRef = db.collection("users").doc(uid);

    await db.runTransaction(async (tx) => {
      // Get user doc to check fragments
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error("User not found");
      const userData = userSnap.data();
      const fragments = userData?.fragments || [];
      if (fragments.length < 3) throw new Error("Not enough fragments");

      // Get code to ensure still available
      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists) throw new Error("Code disappeared");
      if (codeSnap.data()?.status !== "available") throw new Error("Already claimed");

      // Calculate points to award (10 points per $1)
      const pointsToAward = picked.value * 10;

      // Update code
      tx.update(codeRef, { status: "claimed", claimedBy: uid, claimedAt: admin.firestore.FieldValue.serverTimestamp() });

      // Add to claimedCodes
      tx.set(db.collection(`claimedCodes`).doc(uid).collection("codes").doc(picked.id), {
        code: picked.code,
        value: picked.value,
        tier: picked.tier,
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Clear user fragments and award points
      tx.update(userRef, {
        fragments: [],
        current_points_balance: admin.firestore.FieldValue.increment(pointsToAward)
      });

      // Log transaction
      tx.set(db.collection('transactions').doc(), {
        user_id: uid,
        amount: pointsToAward,
        reason: `Claimed ${picked.value} code`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ code: picked.code, id: picked.id, tier: picked.tier, value: picked.value });
  } catch (err: any) {
    if (err.message === "Not enough fragments") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err.message === "Already claimed" || err.message === "Code disappeared") {
      return NextResponse.json({ error: "Transaction conflict, please try again" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}