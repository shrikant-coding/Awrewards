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

function generateCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /api/admin/codes - Fetch codes with filtering
export async function GET(req: Request) {
  try {
    await verifyAdminToken(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query: any = adminDb.collection("giftCodes");

    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    // Get total count for stats
    const totalSnap = await query.get();
    const totalCodes = totalSnap.size;

    // Get active count
    const activeQuery = adminDb.collection("giftCodes").where("status", "==", "active");
    const activeSnap = await activeQuery.get();
    const activeCount = activeSnap.size;

    // Get used count
    const usedQuery = adminDb.collection("giftCodes").where("status", "==", "used");
    const usedSnap = await usedQuery.get();
    const usedCount = usedSnap.size;

    // Get expired count
    const expiredQuery = adminDb.collection("giftCodes").where("status", "==", "expired");
    const expiredSnap = await expiredQuery.get();
    const expiredCount = expiredSnap.size;

    // Apply search and pagination
    let codesQuery = query.orderBy("created_at", "desc");

    if (search) {
      // For search, we'll fetch all and filter client-side since Firestore doesn't support text search easily
      const allSnap = await codesQuery.get();
      let filteredDocs = allSnap.docs;

      if (search) {
        filteredDocs = allSnap.docs.filter((doc: any) => {
          const data = doc.data();
          return data.code.toLowerCase().includes(search.toLowerCase()) ||
                 data.redeemed_by?.toLowerCase().includes(search.toLowerCase());
        });
      }

      const paginatedDocs = filteredDocs.slice(offset, offset + limit);
      const codes = paginatedDocs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.() || new Date(doc.data().created_at),
        expiresAt: doc.data().expiresAt?.toDate?.() || (doc.data().expiresAt ? new Date(doc.data().expiresAt) : null)
      }));

      return NextResponse.json({
        codes,
        stats: { active: activeCount, used: usedCount, expired: expiredCount, total: totalCodes },
        pagination: {
          page,
          limit,
          total: filteredDocs.length,
          pages: Math.ceil(filteredDocs.length / limit)
        }
      });
    } else {
      // No search, use Firestore pagination
      const snap = await codesQuery.limit(limit).offset(offset).get();
      const codes = snap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.() || new Date(doc.data().created_at),
        expiresAt: doc.data().expiresAt?.toDate?.() || (doc.data().expiresAt ? new Date(doc.data().expiresAt) : null)
      }));

      return NextResponse.json({
        codes,
        stats: { active: activeCount, used: usedCount, expired: expiredCount, total: totalCodes },
        pagination: {
          page,
          limit,
          total: totalCodes,
          pages: Math.ceil(totalCodes / limit)
        }
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

// POST /api/admin/codes - Create new code(s)
export async function POST(req: Request) {
  try {
    await verifyAdminToken(req);
    const body = await req.json();

    if (body.bulk && Array.isArray(body.codes)) {
      // Bulk create
      const batch = adminDb.batch();
      const codes = [];

      for (const codeData of body.codes) {
        const code = codeData.code || generateCode();
        const docRef = adminDb.collection("giftCodes").doc();
        const data = {
          code,
          value: parseFloat(codeData.value),
          tier: codeData.tier || 'Mid',
          status: "active",
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          newUsersOnly: codeData.newUsersOnly || false,
          expiresAt: codeData.expiresAt ? admin.firestore.Timestamp.fromDate(new Date(codeData.expiresAt)) : null
        };
        batch.set(docRef, data);
        codes.push({ id: docRef.id, ...data });
      }

      await batch.commit();
      return NextResponse.json({ codes, message: `Created ${codes.length} codes successfully` });
    } else {
      // Single create
      const code = body.code || generateCode();
      const data = {
        code,
        value: parseFloat(body.value),
        tier: body.tier || 'Mid',
        status: "active",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        newUsersOnly: body.newUsersOnly || false,
        expiresAt: body.expiresAt ? admin.firestore.Timestamp.fromDate(new Date(body.expiresAt)) : null
      };

      const docRef = await adminDb.collection("giftCodes").add(data);
      return NextResponse.json({ code: { id: docRef.id, ...data }, message: "Code created successfully" });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// PUT /api/admin/codes - Update code
export async function PUT(req: Request) {
  try {
    await verifyAdminToken(req);
    const body = await req.json();
    const { id, action, ...updates } = body;

    if (!id) return NextResponse.json({ error: "Code ID required" }, { status: 400 });

    const codeRef = adminDb.collection("giftCodes").doc(id);

    if (action === "revoke") {
      await codeRef.update({
        status: "expired"
      });
      return NextResponse.json({ message: "Code expired successfully" });
    } else if (action === "restore") {
      await codeRef.update({
        status: "active",
        redeemed_by: admin.firestore.FieldValue.delete()
      });
      return NextResponse.json({ message: "Code restored successfully" });
    } else {
      // General update
      await codeRef.update(updates);
      return NextResponse.json({ message: "Code updated successfully" });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// DELETE /api/admin/codes - Delete code
export async function DELETE(req: Request) {
  try {
    await verifyAdminToken(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Code ID required" }, { status: 400 });

    await adminDb.collection("giftCodes").doc(id).delete();
    return NextResponse.json({ message: "Code deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}