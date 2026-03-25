"use client";

import { Inter } from 'next/font/google';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import SignInButton from '../components/SignInButton';
import ConstellationBackground from '../components/ConstellationBackground';

const inter = Inter({ subsets: ['latin'] });

export default function Home(){
  const { user } = useAuth();
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className={`min-h-screen bg-background relative overflow-hidden parallax ${inter.className}`}>
      <ConstellationBackground />
      <div className="animated-gradient absolute inset-0 z-1 opacity-20"></div>
      {/* Enhanced Parallax layers with scroll-based movement */}
      <motion.div
        className="absolute inset-0 z-5"
        style={{
          y: scrollY * 0.3, // Slower parallax for background
        }}
        animate={{
          y: [scrollY * 0.3, scrollY * 0.3 - 10, scrollY * 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full bg-gradient-to-br from-accent/20 to-transparent"></div>
      </motion.div>
      <motion.div
        className="absolute inset-0 z-10"
        style={{
          y: scrollY * 0.5, // Medium parallax
        }}
        animate={{
          y: [scrollY * 0.5, scrollY * 0.5 + 15, scrollY * 0.5]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full bg-gradient-to-tl from-primaryFrom/10 to-transparent"></div>
      </motion.div>
      {/* Additional parallax layer */}
      <motion.div
        className="absolute inset-0 z-15"
        style={{
          y: scrollY * 0.8, // Faster parallax for foreground
        }}
      >
        <div className="w-full h-full bg-gradient-to-b from-transparent via-background/5 to-accent/5"></div>
      </motion.div>
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center gap-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: [0, -5, 0],
            scale: [0.9, 1, 0.95, 1]
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}
          className="glass gradient-border rounded-2xl p-6 md:p-8 shadow-2xl max-w-lg w-full"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-accent via-primaryFrom to-primaryTo mb-4 glow-text"
          >
            awrewards
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-textSecondary mb-6 leading-relaxed"
          >
            Collect points, complete challenges, and unlock exclusive gift cards. Your journey to rewards starts here!
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {user ? (
              <button
                onClick={() => router.push('/gamehub')}
                className="px-6 py-3 rounded-full glass gradient-border text-textPrimary font-semibold flex items-center gap-3 hover:scale-105 transition-all duration-150 ripple"
              >
                Play Now
              </button>
            ) : (
              <SignInButton />
            )}
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}