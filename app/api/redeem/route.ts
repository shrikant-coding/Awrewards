import { NextResponse } from "next/server";
import { redeemReward } from "../../../lib/rewards";

function getErrorType(err: any): string {
  if (err.code === 'FIRESTORE_UNAVAILABLE' || err.code === 'permission-denied') {
    return 'DATABASE_CONNECTION_ERROR';
  }
  if (err.message?.includes('not found')) {
    return 'NOT_FOUND_ERROR';
  }
  if (err.message?.includes('Permission denied')) {
    return 'PERMISSION_ERROR';
  }
  if (err.message?.includes('insufficient')) {
    return 'INSUFFICIENT_BALANCE_ERROR';
  }
  return 'UNKNOWN_ERROR';
}

function getErrorDescription(errorType: string): string {
  const descriptions: Record<string, string> = {
    'DATABASE_CONNECTION_ERROR': 'Database connection failed. Please try again later.',
    'NOT_FOUND_ERROR': 'Reward or user not found in database.',
    'PERMISSION_ERROR': 'Database permission denied. Check security rules.',
    'INSUFFICIENT_BALANCE_ERROR': 'User has insufficient points balance.',
    'UNKNOWN_ERROR': 'An unexpected server error occurred.'
  };
  return descriptions[errorType] || 'Server error: Unable to process redemption request';
}

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).slice(2, 9);
  const timestamp = new Date().toISOString();
  console.log(`[${requestId}] [${timestamp}] Redemption request received`);
  
  try {
    // Parse request
    let body;
    try {
      body = await req.json();
      console.log(`[${requestId}] Request parsed successfully`);
    } catch (parseErr) {
      console.error(`[${requestId}] JSON parse error:`, parseErr);
      return NextResponse.json(
        { error: 'Invalid request format. Expected JSON.' },
        { status: 400 }
      );
    }
    
    const { userId, rewardId } = body;
    console.log(`[${requestId}] Request payload:`, { userId, rewardId });
    
    // Validate request payload
    if (!userId || !rewardId) {
      const error = "userId and rewardId are required";
      console.warn(`[${requestId}] Validation failed:`, error);
      return NextResponse.json({ error }, { status: 400 });
    }

    // Attempt redemption
    console.log(`[${requestId}] Attempting to redeem reward '${rewardId}' for user '${userId}'`);
    const result = await redeemReward(userId, rewardId);
    
    if (!result.success) {
      console.warn(`[${requestId}] Redemption failed - Business logic error`);
      console.warn(`[${requestId}] Error message:`, result.message);
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    console.log(`[${requestId}] Redemption successful`);
    console.log(`[${requestId}] Delivery info:`, result.delivery);
    return NextResponse.json({ message: result.message, delivery: result.delivery });
  } catch (err: any) {
    const errorType = getErrorType(err);
    const errorDescription = getErrorDescription(errorType);
    const errorMessage = err.message || 'Unknown error';
    const errorCode = err.code || 'UNKNOWN';
    
    console.error(`[${requestId}] FATAL ERROR - ${errorType}`);
    console.error(`[${requestId}] Error code:`, errorCode);
    console.error(`[${requestId}] Error message:`, errorMessage);
    console.error(`[${requestId}] Error details:`, {
      code: err.code,
      message: err.message,
      name: err.name,
      stack: err.stack
    });
    
    return NextResponse.json(
      { error: errorDescription, errorType, requestId },
      { status: 500 }
    );
  }
}