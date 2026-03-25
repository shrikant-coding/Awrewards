'use client';

import { useState, useEffect } from 'react';

interface Analytics {
  users: { total: number; active: number };
  codes: { total: number; active: number; used: number };
}

interface GiftCode {
  id: string;
  code: string;
  value: number;
  status: string;
  created_at: Date;
  redeemed_by?: string;
  type: 'google-play' | 'amazon' | 'general';
}

export default function AdminDemoPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // Mock data for demo
    setAnalytics({
      users: { total: 150, active: 45 },
      codes: { total: 200, active: 120, used: 80 }
    });
    setCodes([
      {
        id: '1',
        code: 'DEMO-001',
        value: 100,
        status: 'available',
        created_at: new Date('2024-01-01'),
        type: 'google-play',
      },
      {
        id: '2',
        code: 'DEMO-002',
        value: 200,
        status: 'used',
        created_at: new Date('2024-01-02'),
        redeemed_by: 'user123',
        type: 'amazon',
      },
      {
        id: '3',
        code: 'DEMO-003',
        value: 50,
        status: 'available',
        created_at: new Date('2024-01-03'),
        type: 'general',
      },
    ]);
    setLoading(false);
  }, []);

  const generateCodes = async (count: number) => {
    setGenerating(true);
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const types: ('google-play' | 'amazon' | 'general')[] = ['google-play', 'amazon', 'general'];
    const newCodes: GiftCode[] = [];
    for (let i = 0; i < count; i++) {
      const code = `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const randomType = types[Math.floor(Math.random() * types.length)];
      newCodes.push({
        id: `${codes.length + i + 1}`,
        code,
        value: 100,
        status: 'available',
        created_at: new Date(),
        type: randomType,
      });
    }
    setCodes(prev => [...prev, ...newCodes]);
    setAnalytics(prev => prev ? {
      ...prev,
      codes: {
        ...prev.codes,
        total: prev.codes.total + count,
        active: prev.codes.active + count,
      }
    } : null);
    setGenerating(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard (Demo)</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Users</h2>
          <p>Total: {analytics?.users.total}</p>
          <p>Active Today: {analytics?.users.active}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Gift Codes</h2>
          <p>Total: {analytics?.codes.total}</p>
          <p>Active: {analytics?.codes.active}</p>
          <p>Used: {analytics?.codes.used}</p>
        </div>
      </div>

      {/* Generate Codes */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Generate Gift Codes</h2>
        <div className="flex gap-2">
          <button
            onClick={() => generateCodes(10)}
            disabled={generating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate 10 Codes'}
          </button>
          <button
            onClick={() => generateCodes(50)}
            disabled={generating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate 50 Codes'}
          </button>
          <button
            onClick={() => generateCodes(100)}
            disabled={generating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate 100 Codes'}
          </button>
        </div>
      </div>

      {/* Codes List */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Gift Codes</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Image</th>
              <th className="border border-gray-300 p-2">Code</th>
              <th className="border border-gray-300 p-2">Value</th>
              <th className="border border-gray-300 p-2">Status</th>
              <th className="border border-gray-300 p-2">Created At</th>
              <th className="border border-gray-300 p-2">Redeemed By</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.id}>
                <td className="border border-gray-300 p-2">
                  <img src={
                    code.type === 'google-play' ? 'https://via.placeholder.com/100x50/000000/ffffff?text=Google+Play' :
                    code.type === 'amazon' ? 'https://via.placeholder.com/100x50/ff9900/000000?text=Amazon' :
                    'https://via.placeholder.com/100x50/ff0000/ffffff?text=GIFT+CARD'
                  } alt={`${code.type} Gift Card`} width="100" height="50" />
                </td>
                <td className="border border-gray-300 p-2">{code.code}</td>
                <td className="border border-gray-300 p-2">{code.value}</td>
                <td className="border border-gray-300 p-2">{code.status}</td>
                <td className="border border-gray-300 p-2">{new Date(code.created_at).toLocaleString()}</td>
                <td className="border border-gray-300 p-2">{code.redeemed_by || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}