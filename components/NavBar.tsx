"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, Gamepad2, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserDoc } from '../hooks/useUserDoc';
import SoundToggle from './SoundToggle';
import ThemeToggle from './ThemeToggle';

export default function NavBar(){
  const { user, signInWithGoogle, signOut } = useAuth();
  // show fragment badge using userDoc
  const { userDoc } = useUserDoc();
  const fragments = userDoc?.fragments || [];
  const boosts = userDoc?.boosts || 0;
  const points = userDoc?.current_points_balance || 0;
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSignIn() {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in was cancelled. Try again.');
      } else {
        alert('Sign in failed');
      }
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <nav className="w-full py-4 px-6 flex items-center justify-between glass gradient-border">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-lg text-textPrimary hover:text-accent transition-colors duration-150 glow-text ripple">awrewards</Link>
        <Link href="/dashboard" className="text-sm text-textSecondary hover:text-textPrimary hover:underline transition-all duration-150 flex items-center gap-2 ripple">
          <BarChart3 className="w-4 h-4" /> Dashboard
          {fragments.length > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold text-background text-xs animate-bounce">
              {fragments.length}
            </span>
          )}
          {boosts > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-background text-xs animate-pulse">
              {boosts}⚡
            </span>
          )}
        </Link>
        <Link href="/gamehub" className="text-sm text-textSecondary hover:text-textPrimary hover:underline transition-all duration-150 flex items-center gap-2 ripple">
          <Gamepad2 className="w-4 h-4" /> Game Hub
        </Link>
        <Link href="/rewards" className="text-sm text-textSecondary hover:text-textPrimary hover:underline transition-all duration-150 flex items-center gap-2 ripple">
          🏆 Rewards
          {points > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-gold text-background text-xs animate-pulse">
              {points}
            </span>
          )}
        </Link>
        {userDoc?.role === 'admin' && (
          <Link href="/admin" className="text-sm text-textSecondary hover:text-textPrimary hover:underline transition-all duration-150 flex items-center gap-2 ripple">
            <Shield className="w-4 h-4" /> Admin
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <ThemeToggle />
            <SoundToggle />
            <img src={user.photoURL || ''} alt="avatar" className="w-8 h-8 rounded-full ring-2 ring-accent" />
            <button
              onClick={() => signOut()}
              className="px-3 py-1 rounded-md glass hover:gradient-border transition-all duration-150 ripple"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="px-4 py-2 bg-gradient-to-r from-primaryFrom to-primaryTo rounded-md disabled:opacity-50 hover:scale-105 transition-transform duration-150 ripple"
            >
              {signingIn ? 'Signing in...' : 'Sign in'}
            </button>
            {authError && (
              <div className="text-sm text-red-400">
                {authError}
                <button onClick={handleSignIn} className="ml-2 underline hover:text-accent transition-colors duration-150">Try again</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}