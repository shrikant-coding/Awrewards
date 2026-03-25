import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminAuth, adminDb } from "../../../../lib/firebase/admin";
import { createGiftCode } from "../../../../lib/giftCode";
import { sendGiftCodeEmail } from "../../../../lib/email";

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

function generateCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: Request) {
  try {
    await verifyAdminToken(req);
    const body = await req.json();

    const { userEmail, value } = body;

    if (!userEmail || !value || value <= 0) {
      return NextResponse.json({ error: "User email and positive value required" }, { status: 400 });
    }

    // Find user by email
    const userQuery = await adminDb.collection("users").where("email", "==", userEmail).limit(1).get();
    if (userQuery.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    const userName = userData.displayName || userData.email.split('@')[0];

    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      const existing = await adminDb.collection("giftCodes").where("code", "==", code).limit(1).get();
      if (existing.empty) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 });
    }

    // Create gift code
    const giftCodeId = await createGiftCode({
      code,
      value: parseFloat(value),
      tier: 'Mid' as const,
      assigned_to: userId,
    });

    // Send email
    try {
      await sendGiftCodeEmail(userEmail, userName, code, parseFloat(value));
    } catch (emailError) {
      console.error('Failed to send email, but code created:', emailError);
      // Still return success, maybe log for manual follow-up
    }

    return NextResponse.json({
      message: "Gift code granted and email sent successfully",
      code: {
        id: giftCodeId,
        code,
        value: parseFloat(value),
        assigned_to: userId,
      }
    });

  } catch (err: any) {
    console.error('Grant gift error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}