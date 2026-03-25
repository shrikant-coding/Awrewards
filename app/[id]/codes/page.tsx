"use client";

import React, { useState, useEffect } from "react";
import AdminGuard from "../../../components/AdminGuard";
import { getIdToken } from "../../../lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Upload, Eye, Trash2, Ban, Search, Filter, FileText, CheckCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

export default function CodesPage() {
  const params = useParams();
  const id = params.id as string;

  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ available: 0, claimed: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    value: "",
    tier: "low" as "low" | "mid" | "high"
  });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    tier: "all",
    search: ""
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCodes();
  }, []);

  useEffect(() => {
    fetchCodes(1); // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters]);

  async function fetchCodes(page = 1) {
    try {
      const token = await getIdToken();
      if (!token) return;

      const params = new URLSearchParams({
        page: page.toString(),
        status: filters.status,
        tier: filters.tier,
        search: filters.search
      });

      const res = await fetch(`/api/admin/codes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCodes(data.codes || []);
      setStats(data.stats || { available: 0, claimed: 0 });
      setPagination(data.pagination || { page: 1, total: 0, pages: 0 });
    } catch (err) {
      console.error("Failed to fetch codes:", err);
    } finally {
      setLoading(false);
    }
  }

  function formatCodeInput(value: string) {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    // Add dashes every 4 characters
    const formatted = cleaned.replace(/(.{4})(?=.)/g, "$1-");
    return formatted.slice(0, 14); // Limit to XXXX-XXXX-XXXX format
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCodeInput(e.target.value);
    setFormData(prev => ({ ...prev, code: formatted }));
  }

  async function handleAddCode() {
    if (!formData.value || isNaN(parseFloat(formData.value))) {
      toast.error("Please enter a valid value");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: formData.code || undefined, // Let API generate if empty
          value: parseFloat(formData.value),
          tier: formData.tier
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Code created successfully!");
      setShowAddModal(false);
      setFormData({ code: "", value: "", tier: "low" });
      fetchCodes(); // Refresh the list
    } catch (err: any) {
      toast.error(err.message || "Failed to create code");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(id: string, action: string) {
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/codes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, action })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      fetchCodes(pagination.page); // Refresh current page
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} code`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this code? This action cannot be undone.")) return;

    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`/api/admin/codes?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      fetchCodes(pagination.page);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete code");
    }
  }

  function formatDate(date: Date | string) {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validData = results.data.filter((row: any) =>
          row.code && row.value && row.tier &&
          ["low", "mid", "high"].includes(row.tier.toLowerCase())
        );
        setCsvData(validData);
      },
      error: (error) => {
        toast.error("Failed to parse CSV file");
        console.error("CSV parsing error:", error);
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  async function handleBulkUpload() {
    if (csvData.length === 0) {
      toast.error("No valid data to upload");
      return;
    }

    setUploading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bulk: true,
          codes: csvData.map((row: any) => ({
            code: row.code,
            value: parseFloat(row.value),
            tier: row.tier.toLowerCase()
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      setShowUploadModal(false);
      setCsvData([]);
      fetchCodes(); // Refresh the list
    } catch (err: any) {
      toast.error(err.message || "Failed to upload codes");
    } finally {
      setUploading(false);
    }
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
        <div className="mb-8 flex items-center gap-4">
          <Link
            href={`/${id}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gift Code Management</h1>
            <p className="text-gray-400">Manage and monitor gift codes for the platform.</p>
          </div>
        </div>

        {/* Header with stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400">Available Codes</h3>
            <p className="text-3xl font-bold mt-2">{stats.available}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400">Claimed Codes</h3>
            <p className="text-3xl font-bold mt-2">{stats.claimed}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-400">Total Codes</h3>
            <p className="text-3xl font-bold mt-2">{codes.length}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center gap-2"
          >
            <Plus size={20} />
            Add Code
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Upload size={20} />
            Upload CSV
          </motion.button>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search codes or claimed by..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="claimed">Claimed</option>
                <option value="revoked">Revoked</option>
              </select>
              <select
                value={filters.tier}
                onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Tiers</option>
                <option value="low">Low</option>
                <option value="mid">Mid</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Codes Table */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Claimed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {codes.map((code) => (
                  <motion.tr
                    key={code.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="font-mono text-green-400">{code.code}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-yellow-400">
                      ${code.value.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        code.tier === "low" ? "bg-green-100 text-green-800" :
                        code.tier === "mid" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {tierLabels[code.tier]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        code.status === "available" ? "bg-green-100 text-green-800" :
                        code.status === "claimed" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {code.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {code.claimedBy || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(code.claimedAt || code.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </motion.button>
                        {code.status === "claimed" && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAction(code.id, "revoke")}
                            className="text-orange-400 hover:text-orange-300 transition-colors"
                            title="Revoke Code"
                          >
                            <Ban size={16} />
                          </motion.button>
                        )}
                        {code.status === "revoked" && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAction(code.id, "restore")}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Restore Code"
                          >
                            <Plus size={16} />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(code.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Code"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {codes.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              {loading ? "Loading codes..." : "No codes found matching your filters."}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-slate-700 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-300">
                Showing {((pagination.page - 1) * 20) + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newPage = pagination.page - 1;
                    setPagination(prev => ({ ...prev, page: newPage }));
                    fetchCodes(newPage);
                  }}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 bg-slate-600 text-white rounded hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => {
                    const newPage = pagination.page + 1;
                    setPagination(prev => ({ ...prev, page: newPage }));
                    fetchCodes(newPage);
                  }}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 bg-slate-600 text-white rounded hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Code Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-lg p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Add New Code</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Code (Optional - auto-generated if empty)</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={handleCodeChange}
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:border-purple-500 font-mono"
                      maxLength={14}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Value ($)</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="10.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tier</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(tierLabels).map(([tier, label]) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, tier: tier as "low" | "mid" | "high" }))}
                          className={`p-3 rounded-md border-2 transition-all ${
                            formData.tier === tier
                              ? `border-white ${tierColors[tier as keyof typeof tierColors]} text-white`
                              : `border-slate-600 ${tierColors[tier as keyof typeof tierColors]} text-white hover:border-slate-500`
                          }`}
                        >
                          <div className="text-sm font-medium">{label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCode}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Creating..." : "Create Code"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload CSV Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowUploadModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Bulk Upload Codes</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">CSV Format</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Your CSV should have the following columns: <code className="bg-slate-700 px-2 py-1 rounded">code</code>, <code className="bg-slate-700 px-2 py-1 rounded">value</code>, <code className="bg-slate-700 px-2 py-1 rounded">tier</code>
                  </p>
                  <div className="bg-slate-700 p-4 rounded font-mono text-sm">
                    <div>code,value,tier</div>
                    <div>ABCD-1234-EFGH,10.00,low</div>
                    <div>WXYZ-5678-IJKL,25.00,mid</div>
                    <div>MNOP-9012-QRST,50.00,high</div>
                  </div>
                </div>

                {!csvData.length ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">
                      {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
                    </p>
                    <p className="text-sm text-gray-400">
                      or click to browse files
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Preview ({csvData.length} codes)</h3>
                      <button
                        onClick={() => setCsvData([])}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="bg-slate-700 rounded-lg overflow-hidden mb-6">
                      <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-600">
                            <tr>
                              <th className="px-4 py-2 text-left">Code</th>
                              <th className="px-4 py-2 text-left">Value</th>
                              <th className="px-4 py-2 text-left">Tier</th>
                              <th className="px-4 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 10).map((row: any, index: number) => (
                              <tr key={index} className="border-t border-slate-600">
                                <td className="px-4 py-2 font-mono">{row.code}</td>
                                <td className="px-4 py-2">${parseFloat(row.value).toFixed(2)}</td>
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    row.tier === "low" ? "bg-green-100 text-green-800" :
                                    row.tier === "mid" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-red-100 text-red-800"
                                  }`}>
                                    {tierLabels[row.tier as keyof typeof tierLabels]}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <CheckCircle size={16} className="text-green-400" />
                                </td>
                              </tr>
                            ))}
                            {csvData.length > 10 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-2 text-center text-gray-400">
                                  ... and {csvData.length - 10} more rows
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={!csvData.length || uploading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading..." : `Upload ${csvData.length} Codes`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Toaster position="top-right" />
      </div>
    </AdminGuard>
  );
}