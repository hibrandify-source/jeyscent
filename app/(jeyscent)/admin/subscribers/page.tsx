// app/admin/subscribers/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Notification form
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyType, setNotifyType] = useState('custom');
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyLink, setNotifyLink] = useState('');
  const [sending, setSending] = useState(false);
  const [notifyResult, setNotifyResult] = useState('');

  const fetchSubscribers = async () => {
    try {
      const res = await fetch(`/api/admin/subscribers?filter=${filter}`);
      const data = await res.json();
      if (res.ok) {
        setSubscribers(data.subscribers);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when filter changes; fetchSubscribers closes over filter
  }, [filter]);

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this subscriber?')) return;
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, permanent: false }),
      });
      if (res.ok) fetchSubscribers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this subscriber? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, permanent: true }),
      });
      if (res.ok) fetchSubscribers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifySubject.trim() || !notifyMessage.trim()) {
      setNotifyResult('Subject and message are required');
      return;
    }

    setSending(true);
    setNotifyResult('');

    try {
      const res = await fetch('/api/admin/subscribers/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: notifyType,
          subject: notifySubject,
          title: notifyTitle,
          message: notifyMessage,
          link: notifyLink,
        }),
      });

      const data = await res.json();
      setNotifyResult(data.message || data.error);

      if (res.ok) {
        setNotifySubject('');
        setNotifyTitle('');
        setNotifyMessage('');
        setNotifyLink('');
      }
    } catch {
      setNotifyResult('Failed to send notifications');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a2e]">Newsletter Subscribers</h1>
          <p className="text-gray-500 mt-1">Manage your &quot;Stay in the Know&quot; subscribers</p>
        </div>
        <button
          onClick={() => setShowNotifyForm(!showNotifyForm)}
          className="px-6 py-3 bg-[#d4af37] text-[#1a1a2e] font-semibold rounded-lg hover:bg-[#c4a030] transition-colors flex items-center gap-2"
        >
          <span>📧</span>
          {showNotifyForm ? 'Hide Notification Form' : 'Send Notification'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Total Subscribers</p>
          <p className="text-3xl font-bold text-[#1a1a2e] mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{stats.inactive}</p>
        </div>
      </div>

      {/* Notification Form */}
      {showNotifyForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-[#1a1a2e] mb-4">
            Send Notification to All Active Subscribers
          </h2>
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Type
              </label>
              <select
                value={notifyType}
                onChange={(e) => setNotifyType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              >
                <option value="new_product">🆕 New Product</option>
                <option value="new_blog">📖 New Blog Post</option>
                <option value="custom">✨ Custom Update</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Subject *
              </label>
              <input
                type="text"
                value={notifySubject}
                onChange={(e) => setNotifySubject(e.target.value)}
                placeholder="e.g. New Product Alert: Ruth Refill Bottle Now Available!"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (in email body)
              </label>
              <input
                type="text"
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                placeholder="e.g. Introducing Our Reed Diffuser Refills"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder="Write your notification message here..."
                rows={5}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link (optional — adds a button in the email)
              </label>
              <input
                type="url"
                value={notifyLink}
                onChange={(e) => setNotifyLink(e.target.value)}
                placeholder="https://jeyscent.com/shop"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>

            {notifyResult && (
              <p className={`text-sm ${notifyResult.includes('Failed') || notifyResult.includes('required') ? 'text-red-600' : 'text-green-600'}`}>
                {notifyResult}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-3 bg-[#1a1a2e] text-white font-semibold rounded-lg hover:bg-[#2a2a4e] transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending...' : `Send to ${stats.active} Subscriber(s)`}
              </button>
              <button
                type="button"
                onClick={() => setShowNotifyForm(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'active', 'inactive'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === f
                ? 'bg-[#1a1a2e] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading subscribers...</div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No subscribers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">#</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Subscribed On</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{sub.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        sub.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {sub.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sub.createdAt).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {sub.active && (
                          <button
                            onClick={() => handleDeactivate(sub.id)}
                            className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                          >
                            Deactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}