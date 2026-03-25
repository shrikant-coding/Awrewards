"use client";

import React, { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import { getIdToken } from "../../lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, BarChart3, Gift } from "lucide-react";
import Link from "next/link";
import { useParams } from 'next/navigation';

interface Code {
  id: string;
  code: string;
  value: number;
  tier: "low" | "mid" | "high";
  status: "available" | "claimed" | "revoked";
  claimedBy?: string;
  claimedAt?: Date;
  createdAt: Date;
}

export default function AdminPage() {
  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<'analytics' | 'users'>('analytics');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    users: { total: 0, active: 0 },
    codes: { total: 0, available: 0, claimed: 0 }
  });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
  }, []);

  async function fetchAnalytics() {
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  }

  async function fetchUsers() {
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }



  function formatDate(date: Date | string) {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const tierColors = {
    low: "bg-green-500",
    mid: "bg-yellow-500",
    high: "bg-red-500"
  };

  const tierLabels = {
    low: "Low Tier",
    mid: "Mid Tier",
    high: "High Tier"
  };

  if (loading) return <AdminGuard><div className="py-20 text-center">Loading...</div></AdminGuard>;

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage users and monitor system analytics.</p>
          </div>
          <Link
            href={`/${id}/codes`}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Gift size={20} />
            Manage Codes
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <BarChart3 size={20} />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Users size={20} />
            Users
          </button>
        </div>

        {activeTab === 'analytics' && (
          <>
            {/* Analytics Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                  <Users size={20} />
                  Total Users
                </h3>
                <p className="text-3xl font-bold mt-2">{analytics.users.total}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                  <Users size={20} />
                  Active Users (24h)
                </h3>
                <p className="text-3xl font-bold mt-2">{analytics.users.active}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                  <Gift size={20} />
                  Total Codes
                </h3>
                <p className="text-3xl font-bold mt-2">{analytics.codes.total}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                  <Gift size={20} />
                  Available Codes
                </h3>
                <p className="text-3xl font-bold mt-2">{analytics.codes.available}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
                  <Gift size={20} />
                  Claimed Codes
                </h3>
                <p className="text-3xl font-bold mt-2">{analytics.codes.claimed}</p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">System Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-300 mb-3">User Engagement</h4>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Active Users Today:</span>
                      <span className="text-green-400">{analytics.users.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Registered:</span>
                      <span className="text-blue-400">{analytics.users.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Activity Rate:</span>
                      <span className="text-purple-400">
                        {analytics.users.total > 0 ? Math.round((analytics.users.active / analytics.users.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-300 mb-3">Code Distribution</h4>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Codes Available:</span>
                      <span className="text-green-400">{analytics.codes.available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Codes Claimed:</span>
                      <span className="text-orange-400">{analytics.codes.claimed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Claim Rate:</span>
                      <span className="text-red-400">
                        {analytics.codes.total > 0 ? Math.round((analytics.codes.claimed / analytics.codes.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}



        {activeTab === 'users' && (
          <>
            <div className="bg-slate-800 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">User Management</h3>
              <p className="text-sm text-gray-400 mb-6">View user activity, claimed codes, and account details.</p>
            </div>

            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fragments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Streak</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Claimed Codes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Online</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map((user) => (
                      <motion.tr
                        key={user.uid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-white">{user.email}</div>
                            <div className="text-gray-400 font-mono text-xs">{user.uid.slice(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.fragments}/{user.totalFragments}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.streakCount} 🔥
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.claimedCodes.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.last_online ? formatDate(user.last_online) : "Never"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(user.createdAt)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No users found.
                </div>
              )}
            </div>
          </>
        )}


      </div>
    </AdminGuard>
  );
}