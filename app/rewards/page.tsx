"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "../../components/AuthGuard";
import { useUserDoc } from "../../hooks/useUserDoc";
import { addPoints } from "../../lib/points";
import { db } from "../../lib/firebase/client";
import { doc, onSnapshot } from "firebase/firestore";
import confetti from "canvas-confetti";

type Reward = {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  section: string;
  glowClass?: string;
  buttonClass?: string;
  brandId?: string;
};

export default function RewardsPage() {
  const { user } = useUserDoc();
  const [userDoc, setUserDoc] = useState<any | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(30);
  const [lastAdWatched, setLastAdWatched] = useState<number | null>(null);
  const [adButtonState, setAdButtonState] = useState<'ready' | 'watching' | 'cooldown'>('ready');
  
  // Retry logic states
  const [retryState, setRetryState] = useState<{
    rewardId: string | null;
    retryCount: number;
    maxRetries: number;
    lastError: string | null;
    isRetryable: boolean;
  }>({
    rewardId: null,
    retryCount: 0,
    maxRetries: 3,
    lastError: null,
    isRetryable: false
  });

  useEffect(() => {
    if (!user) {
      console.log("Rewards page: No user, skipping snapshot");
      return;
    }

    console.log("Rewards page: Setting up onSnapshot for user:", user.uid);
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : null;
      console.log("Rewards page direct snapshot fired:", {
        uid: user.uid,
        points: data?.current_points_balance,
        hasPointsField: data && 'current_points_balance' in data,
        pointsType: typeof data?.current_points_balance,
        fullData: data
      });
      setUserDoc(data);
    }, (error) => {
      console.error("Rewards page onSnapshot error:", error);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load lastAdWatched from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lastAdWatched');
    if (stored) {
      const time = parseInt(stored);
      const now = Date.now();
      const cooldownMs = 5 * 60 * 1000; // 5 minutes
      if (now - time < cooldownMs) {
        setLastAdWatched(time);
        setAdButtonState('cooldown');
      } else {
        setAdButtonState('ready');
      }
    }
  }, []);

  // Handle cooldown countdown
  useEffect(() => {
    if (adButtonState === 'cooldown' && lastAdWatched) {
      const interval = setInterval(() => {
        const now = Date.now();
        const cooldownMs = 5 * 60 * 1000;
        const elapsed = now - lastAdWatched;
        if (elapsed >= cooldownMs) {
          setAdButtonState('ready');
          setLastAdWatched(null);
          localStorage.removeItem('lastAdWatched');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [adButtonState, lastAdWatched]);

  // Handle ad countdown modal
  useEffect(() => {
    if (showAdModal && adCountdown > 0) {
      const timer = setTimeout(() => setAdCountdown(adCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showAdModal && adCountdown === 0) {
      // Ad finished
      handleAdComplete();
    }
  }, [showAdModal, adCountdown]);

  const handleWatchAd = () => {
    if (adButtonState === 'cooldown') return;
    setShowAdModal(true);
    setAdCountdown(30);
    setAdButtonState('watching');
  };

  const handleAdComplete = async () => {
    if (!user?.uid) return;
    try {
      await addPoints(user.uid, 10, 'Watched video ad');
      setNotification({message: 'Congratulations! You earned 10 points for watching the ad.', type: 'success'});
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setShowAdModal(false);
      const now = Date.now();
      setLastAdWatched(now);
      setAdButtonState('cooldown');
      localStorage.setItem('lastAdWatched', now.toString());
    } catch (error) {
      console.error('Error adding points:', error);
      setNotification({message: 'Failed to add points. Please try again.', type: 'error'});
      setShowAdModal(false);
      setAdButtonState('ready');
    }
  };

  const points = userDoc?.current_points_balance || 0;



  const tiers = [
    { amount: 10, points: 1000 },
    { amount: 15, points: 1500 },
    { amount: 20, points: 2000 },
    { amount: 30, points: 3000 }
  ];

  const brands: Record<string, { name: string; icon: string; glowClass: string; buttonClass: string }> = {
    googleplay: {
      name: 'Google Play',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/100px-Google_Play_Store_badge_EN.svg.png',
      glowClass: 'drop-shadow-blue-500/50',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    amazon: {
      name: 'Amazon',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/100px-Amazon_logo.svg.png',
      glowClass: 'drop-shadow-orange-500/50',
      buttonClass: 'bg-orange-500 hover:bg-orange-600 text-white'
    },
    paytm: {
      name: 'Paytm',
      icon: 'https://logos-world.net/wp-content/uploads/2021/02/Paytm-Logo.png',
      glowClass: 'drop-shadow-cyan-500/50',
      buttonClass: 'bg-cyan-500 hover:bg-cyan-600 text-white'
    },
    upi: {
      name: 'UPI',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/100px-UPI-Logo-vector.svg.png',
      glowClass: 'drop-shadow-green-500/50',
      buttonClass: 'bg-green-500 hover:bg-green-600 text-white'
    }
  };

  const categories = [
    {
      title: 'Google Play Cards',
      brands: ['googleplay']
    },
    {
      title: 'Amazon Cards',
      brands: ['amazon']
    },
    {
      title: 'Wallet Cashback',
      brands: ['paytm', 'upi']
    }
  ];

  const hintsRewards: Reward[] = [
    {
      id: 'hint',
      name: 'Premium Puzzle Hint',
      description: 'Get a hint for premium puzzles',
      cost: 50,
      icon: 'https://img.icons8.com/color/48/light-on.png',
      section: 'hints',
      glowClass: 'drop-shadow-yellow-400',
      buttonClass: 'glass text-textPrimary'
    }
  ];

  const giftCardRewards: Reward[] = [];
  categories.forEach(category => {
    category.brands.forEach(brandId => {
      const brand = brands[brandId];
      tiers.forEach(tier => {
        giftCardRewards.push({
          id: `${brandId}-${tier.amount}`,
          name: `${brand.name} ₹${tier.amount} Redeem Code`,
          description: `₹${tier.amount} ${brand.name} Redeem Code`,
          cost: tier.points,
          icon: brand.icon,
          section: 'giftcards',
          brandId: brandId,
          glowClass: brand.glowClass,
          buttonClass: brand.buttonClass
        });
      });
    });
  });

  const hardcodedRewards = [...hintsRewards, ...giftCardRewards];

  /**
   * Determines if an error is retryable based on error type and API response
   */
  const isRetryableError = (error: any, errorType?: string): boolean => {
    // Temporary/network errors that can be retried
    const retryableErrorTypes = [
      'DATABASE_CONNECTION_ERROR',
      'TIMEOUT_ERROR',
      'NETWORK_ERROR'
    ];
    
    if (errorType && retryableErrorTypes.includes(errorType)) {
      return true;
    }
    
    // Check for network/timeout errors
    const errorMessage = error?.message?.toLowerCase() || '';
    if (errorMessage.includes('timeout') || 
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection refused')) {
      return true;
    }
    
    return false;
  };

  /**
   * Gets user-friendly error message based on error type
   */
  const getErrorMessage = (error: any, errorType?: string): string => {
    const errorMessages: Record<string, string> = {
      'DATABASE_CONNECTION_ERROR': 
        'Database is temporarily unavailable. Your points are safe. Please try again in a few moments.',
      'NOT_FOUND_ERROR': 
        'The reward could not be found. Please refresh and try again.',
      'PERMISSION_ERROR': 
        'Permission denied. Please contact support.',
      'INSUFFICIENT_BALANCE_ERROR': 
        'You don\'t have enough points. Please try a different reward.',
      'TIMEOUT_ERROR': 
        'The request took too long. Your points have not been deducted. Please try again.',
      'NETWORK_ERROR': 
        'Network connection lost. Your points are safe. Please check your connection and try again.'
    };
    
    // Use specific error type message if available
    if (errorType && errorMessages[errorType]) {
      return errorMessages[errorType];
    }
    
    // Return backend error if available
    if (error?.error) {
      return error.error;
    }
    
    // Return error message
    if (error?.message) {
      return error.message;
    }
    
    return 'Redemption failed. Please try again.';
  };

  const handleRetryRedemption = async () => {
    if (!retryState.rewardId) return;
    
    console.log(`[Frontend] Retrying redemption for reward: ${retryState.rewardId}`);
    console.log(`[Frontend] Attempt ${retryState.retryCount + 1} of ${retryState.maxRetries}`);
    
    // Perform the redemption attempt
    await performRedemption(retryState.rewardId, retryState.retryCount + 1);
  };

  const performRedemption = async (rewardId: string, retryCount: number = 0) => {
    const reward = hardcodedRewards.find(r => r.id === rewardId);
    if (!reward) {
      setNotification({ message: 'Reward not available', type: 'error' });
      return;
    }

    if (points < reward.cost) {
      setNotification({
        message: `Not enough points! You need ${reward.cost - points} more points to redeem this reward.`,
        type: 'error'
      });
      return;
    }
    
    setRedeeming(rewardId);
    console.log(`[Frontend] Starting redemption attempt ${retryCount + 1} for reward: ${rewardId}`);
    
    try {
      // Call the redemption API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.uid,
          rewardId: rewardId
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      console.log(`[Frontend] API response:`, { status: response.status, data });
      
      if (!response.ok) {
        // Backend returned an error
        const errorType = data.errorType;
        const isRetryable = isRetryableError(data, errorType);
        const errorMessage = getErrorMessage(data, errorType);
        
        console.warn(`[Frontend] Redemption API error:`, {
          status: response.status,
          error: data.error,
          errorType: errorType,
          isRetryable: isRetryable,
          retryCount: retryCount
        });
        
        // Check if we should show retry option
        if (isRetryable && retryCount < retryState.maxRetries) {
          setRetryState({
            rewardId: rewardId,
            retryCount: retryCount,
            maxRetries: retryState.maxRetries,
            lastError: errorMessage,
            isRetryable: true
          });
          
          setNotification({
            message: `${errorMessage} (Attempt ${retryCount + 1}/${retryState.maxRetries})`,
            type: 'error'
          });
        } else {
          // Max retries exceeded or non-retryable error
          setRetryState({
            rewardId: null,
            retryCount: 0,
            maxRetries: retryState.maxRetries,
            lastError: null,
            isRetryable: false
          });
          
          const finalMessage = isRetryable && retryCount >= retryState.maxRetries
            ? `${errorMessage} (Max retries exceeded)`
            : errorMessage;
          
          setNotification({
            message: finalMessage,
            type: 'error'
          });
        }
        
        return;
      }
      
      // Success
      setRetryState({
        rewardId: null,
        retryCount: 0,
        maxRetries: retryState.maxRetries,
        lastError: null,
        isRetryable: false
      });
      
      const value = reward.name.match(/₹(\d+)/)?.[1];
      setNotification({
        message: `✓ Redeem successful! ${data.delivery?.code ? `Your code: ${data.delivery.code}` : 'Processing your reward...'}`,
        type: 'success'
      });
      console.log(`[Frontend] Redemption successful:`, data);
      
      // Reload to refresh points balance
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      // Network/timeout error
      const isNetworkError = error.name === 'AbortError' || error.message?.includes('fetch');
      const isRetryable = isRetryableError(error);
      
      console.error(`[Frontend] Error during redemption:`, {
        name: error.name,
        message: error.message,
        isNetworkError: isNetworkError,
        isRetryable: isRetryable,
        retryCount: retryCount
      });
      
      if (isRetryable && retryCount < retryState.maxRetries) {
        // Show retry option for network errors
        const errorMessage = error.name === 'AbortError'
          ? 'Request timed out. Your points have not been deducted.'
          : 'Network error. Your points have not been deducted.';
        
        setRetryState({
          rewardId: rewardId,
          retryCount: retryCount,
          maxRetries: retryState.maxRetries,
          lastError: errorMessage,
          isRetryable: true
        });
        
        setNotification({
          message: `${errorMessage} (Attempt ${retryCount + 1}/${retryState.maxRetries})`,
          type: 'error'
        });
      } else {
        // Max retries exceeded
        setRetryState({
          rewardId: null,
          retryCount: 0,
          maxRetries: retryState.maxRetries,
          lastError: null,
          isRetryable: false
        });
        
        const finalMessage = retryCount >= retryState.maxRetries
          ? 'Multiple redemption attempts failed. Please check your connection and try again later.'
          : 'Network error. Please check your connection and try again.';
        
        setNotification({
          message: finalMessage,
          type: 'error'
        });
      }
    } finally {
      setRedeeming(null);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    if (!user?.uid) return;
    await performRedemption(rewardId, 0);
  };

  return (
    <AuthGuard>
      <section className="page-transition">
        <h2 className="text-2xl font-bold text-textPrimary">Rewards Shop</h2>
        <p className="text-sm text-textSecondary mt-2">Spend your points on rewards.</p>

        <div className="mt-6 p-4 glass rounded-lg">
          <h3 className="text-lg font-semibold text-textPrimary">Your Points: {points}</h3>
        </div>

        {notification && (
          <div className={`mt-4 p-4 rounded-lg text-white flex items-center justify-between ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            <div>
              <p>{notification.message}</p>
              {notification.type === 'error' && retryState.isRetryable && retryState.rewardId && (
                <p className="text-sm mt-2 opacity-90">
                  Don't worry! Your points have not been deducted. Click the button to retry.
                </p>
              )}
            </div>
            {notification.type === 'error' && retryState.isRetryable && retryState.rewardId && (
              <button
                onClick={handleRetryRedemption}
                disabled={redeeming === retryState.rewardId}
                className="ml-4 px-4 py-2 bg-white text-red-500 font-semibold rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {redeeming === retryState.rewardId ? 'Retrying...' : 'Retry'}
              </button>
            )}
          </div>
        )}

        <section className="mt-6">
          <h3 className="text-2xl font-bold text-white mb-4">Earn Points</h3>
          <div className="flex justify-center">
            <div className="p-6 rounded-lg flex flex-col items-center relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg max-w-sm w-full">
              <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                +10 Points
              </div>
              <div className="mb-4">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white text-center mb-2">Watch a 30s Video</h3>
              <p className="text-sm text-gray-200 text-center mb-4">Earn 10 points by watching a short ad</p>
              <button
                onClick={handleWatchAd}
                disabled={adButtonState !== 'ready'}
                className={`w-full px-6 py-3 rounded-lg text-white font-semibold transition-all animate-pulse ${
                  adButtonState === 'ready'
                    ? 'bg-white text-purple-600 hover:bg-gray-100'
                    : adButtonState === 'cooldown'
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 cursor-not-allowed'
                }`}
              >
                {adButtonState === 'ready' ? 'Watch Ad' :
                 adButtonState === 'watching' ? 'Watching...' :
                 lastAdWatched ? `Next ad in ${Math.ceil((5 * 60 * 1000 - (Date.now() - lastAdWatched)) / 60000)}:${String(Math.ceil(((5 * 60 * 1000 - (Date.now() - lastAdWatched)) % 60000) / 1000)).padStart(2, '0')}` : 'Cooldown'}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Hints Section</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hardcodedRewards.filter(r => r.section === 'hints').map((reward) => (
              <div key={reward.id} className="p-6 rounded-lg glass border border-gray-600 hover:bg-gray-700 transition-all flex flex-col">
                <img src={reward.icon} alt={reward.name} className={`w-12 h-12 mx-auto mb-4 ${reward.glowClass || ''}`} />
                <h3 className="text-lg font-semibold text-textPrimary">{reward.name}</h3>
                <p className="text-sm text-textSecondary mt-2">{reward.description}</p>
                <p className="text-accent font-mono mt-4">Cost: {reward.cost} points</p>
                <button
                  onClick={() => handleRedeem(reward.id)}
                  className={`mt-auto w-full px-4 py-2 rounded transition-all ${points < reward.cost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'} ${reward.buttonClass || 'glass text-textPrimary'}`}
                  disabled={redeeming === reward.id}
                >
                  {redeeming === reward.id ? 'Redeeming...' : 'Redeem'}
                </button>
              </div>
            ))}
          </div>
          <h3 className="text-lg font-semibold text-textPrimary mb-4 mt-8">Gift Cards & Wallets Section</h3>
          {categories.map((category) => (
            <div key={category.title}>
              <h4 className="text-md font-semibold text-textPrimary mb-4 mt-6">{category.title}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {hardcodedRewards.filter(r => r.section === 'giftcards' && category.brands.includes(r.brandId || '')).map((reward) => (
                  <div key={reward.id} className="p-6 rounded-lg glass border border-gray-600 hover:bg-gray-700 transition-all flex flex-col">
                    <img src={reward.icon} alt={reward.name} className={`w-12 h-12 mx-auto mb-4 ${reward.glowClass || ''}`} />
                    <h3 className="text-lg font-semibold text-textPrimary">{reward.name}</h3>
                    <p className="text-sm text-textSecondary mt-2">{reward.description}</p>
                    <p className="text-accent font-mono mt-4">Cost: {reward.cost} points</p>
                    <button
                      onClick={() => handleRedeem(reward.id)}
                      className={`mt-auto w-full px-4 py-2 rounded transition-all ${points < reward.cost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'} ${reward.buttonClass || 'glass text-textPrimary'}`}
                      disabled={redeeming === reward.id}
                    >
                      {redeeming === reward.id ? 'Redeeming...' : 'Redeem'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Ad Modal */}
        {showAdModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4 relative">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h2 className="text-xl font-bold text-white mb-4">Loading Ad...</h2>
                <p className="text-gray-300 mb-4">Please wait while we prepare your advertisement.</p>
                <div className="text-2xl font-mono text-purple-400 mb-4">
                  {adCountdown > 0 ? adCountdown : 'Ad Finished! Reward Claimed.'}
                </div>
              </div>
              {adCountdown > 0 && (
                <button
                  onClick={() => setShowAdModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
                  disabled
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </AuthGuard>
  );
}