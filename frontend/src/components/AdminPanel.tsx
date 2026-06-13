import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useToast } from '../context/ToastContext';

interface AdminPanelProps {
  isAdmin: boolean;
  userEmail: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  is_active: boolean;
  is_admin: boolean;
  userType: string;
}

// Sales metrics mock for trends (Weekly, Monthly, Quarterly, Yearly)
interface SalesDataPoint {
  label: string;
  value: number;
}

const SALES_TRENDS: Record<'weekly' | 'monthly' | 'quarterly' | 'yearly', SalesDataPoint[]> = {
  weekly: [
    { label: 'Mon', value: 1200 },
    { label: 'Tue', value: 1800 },
    { label: 'Wed', value: 1500 },
    { label: 'Thu', value: 2400 },
    { label: 'Fri', value: 2100 },
    { label: 'Sat', value: 3200 },
    { label: 'Sun', value: 2800 },
  ],
  monthly: [
    { label: 'Jan', value: 12500 },
    { label: 'Feb', value: 14200 },
    { label: 'Mar', value: 16800 },
    { label: 'Apr', value: 15100 },
    { label: 'May', value: 19400 },
    { label: 'Jun', value: 22800 },
    { label: 'Jul', value: 25400 },
    { label: 'Aug', value: 24100 },
    { label: 'Sep', value: 28900 },
    { label: 'Oct', value: 31200 },
    { label: 'Nov', value: 35600 },
    { label: 'Dec', value: 41200 },
  ],
  quarterly: [
    { label: 'Q1', value: 43500 },
    { label: 'Q2', value: 57300 },
    { label: 'Q3', value: 78400 },
    { label: 'Q4', value: 108000 },
  ],
  yearly: [
    { label: '2023', value: 180000 },
    { label: '2024', value: 224000 },
    { label: '2025', value: 287000 },
    { label: '2026', value: 345000 },
  ]
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ isAdmin, userEmail }) => {
  const { showToast } = useToast();
  const [activeView, setActiveView] = useState<'dashboard' | 'users'>('dashboard');
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Users management state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Chart state
  const [chartRange, setChartRange] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAge, setEditAge] = useState(0);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user account?")) return;
    try {
      const response = await apiClient.delete(`/auth/users/${userId}`);
      if (response.data && response.data.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        showToast('success', 'User Deleted', 'The user account has been deleted permanently.');
      } else {
        showToast('error', 'Action Failed', response.data?.message || 'Failed to delete user.');
      }
    } catch (err: any) {
      showToast('error', 'Delete Error', err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmittingEdit(true);
    try {
      const response = await apiClient.put(`/auth/users/${editingUser.id}`, {
        name: editName,
        email: editEmail,
        age: editAge
      });
      if (response.data && response.data.success) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name: editName, email: editEmail, age: editAge } : u));
        setEditingUser(null);
        showToast('success', 'Account Saved', 'User profile information updated.');
      } else {
        showToast('error', 'Update Failed', response.data?.message || 'Failed to update user details.');
      }
    } catch (err: any) {
      showToast('error', 'Update Error', err.response?.data?.message || 'Failed to update user details');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const response = await apiClient.get('/dashboard/admin');
      if (response.data && response.data.success) {
        setMetrics(response.data.data);
      } else {
        setMetricsError(response.data?.message || 'Failed to load metrics');
      }
    } catch (err: any) {
      setMetricsError(err.response?.data?.message || err.message || 'Error occurred while loading dashboard metrics');
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const response = await apiClient.get('/auth/users');
      if (response.data && response.data.success) {
        setUsers(response.data.data || []);
      } else {
        setUsersError(response.data?.message || 'Failed to load registered users');
      }
    } catch (err: any) {
      setUsersError(err.response?.data?.message || err.message || 'Error occurred while loading registered users');
    } finally {
      setLoadingUsers(false);
    }
  };


  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeView === 'users') {
      fetchUsers();
    }
  }, [isAdmin, activeView]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] select-none animate-fade-in-up">
        <div className="glass-card-static text-center p-8 max-w-sm">
          <div className="text-5xl mb-4">🛡️</div>
          <h3 className="text-lg font-bold text-slate-100">Access Restricted</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your credentials lack system administrator privileges. Access to the console is prohibited.
          </p>
          <button className="btn-primary mt-6 w-full" onClick={() => window.location.href='/?tab=buyer'}>
            Back to Storefront
          </button>
        </div>
      </div>
    );
  }

  // Map metrics
  const {
    total_products = 0,
    total_users = 0,
    total_orders = 0,
    total_revenue = 0,
    trends = null
  } = metrics || {};

  // Build SVG coordinates based on selected range
  const currentPoints = (trends && trends[chartRange]) || SALES_TRENDS[chartRange];
  const maxVal = Math.max(...currentPoints.map((p: any) => p.value)) * 1.15 || 1000;
  
  const width = 800;
  const height = 220;
  const paddingX = 60;
  const paddingY = 20;

  const pointsCoordinates = currentPoints.map((dp: any, idx: number) => {
    const x = paddingX + (idx / (currentPoints.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (dp.value / maxVal) * (height - 2 * paddingY);
    return { x, y, label: dp.label, value: dp.value };
  });

  const linePath = pointsCoordinates.reduce((path: string, p: any, idx: number) => {
    return path + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
  }, '');

  const areaPath = linePath + `L ${pointsCoordinates[pointsCoordinates.length - 1].x} ${height - paddingY} L ${pointsCoordinates[0].x} ${height - paddingY} Z`;

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-slate-200 select-none animate-fade-in-up">
      
      {/* Left Sidebar Menu */}
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col justify-between">
        <div>
          <div className="pb-6 mb-6 border-b border-white/5">
            <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">System Operator</span>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight mt-1">Admin Console</h2>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                activeView === 'dashboard'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 glow-accent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('users')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                activeView === 'users'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 glow-accent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              User Accounts
            </button>
          </nav>
        </div>

        <div className="pt-4 mt-6 border-t border-white/5 space-y-3">
          <button
            className="w-full text-left px-4 py-3 rounded-lg text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer flex items-center gap-3"
            onClick={() => window.location.href = '/?tab=buyer'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Exit Console
          </button>
          <div className="p-3 bg-white/2 rounded-lg border border-white/5">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Admin</div>
            <div className="text-xs text-slate-300 mt-1 truncate" title={userEmail}>{userEmail}</div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Pane */}
      <main className="flex-grow p-8 overflow-y-auto">
        
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-2xl font-extrabold text-gradient-blue tracking-tight">Analytics Dashboard</h1>
              <p className="text-xs text-slate-400 mt-1">Website-wide statistics, catalog size, and overall sales conversion trends.</p>
            </div>

            {loadingMetrics && !metrics ? (
              <div className="flex justify-center items-center py-20">
                <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : metricsError ? (
              <div className="alert alert-error">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Metrics Sync Error: {metricsError}</span>
              </div>
            ) : (
              <>
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card-static p-5 relative overflow-hidden">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</div>
                    <div className="text-2xl font-extrabold text-indigo-400 mt-1">
                      ₹{total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2">Aggregate transaction value</div>
                  </div>
                  <div className="glass-card-static p-5 relative overflow-hidden">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Users</div>
                    <div className="text-2xl font-extrabold text-slate-100 mt-1">{total_users}</div>
                    <div className="text-[10px] text-slate-500 mt-2">Accounts in database</div>
                  </div>
                  <div className="glass-card-static p-5 relative overflow-hidden">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</div>
                    <div className="text-2xl font-extrabold text-slate-100 mt-1">{total_orders}</div>
                    <div className="text-[10px] text-slate-500 mt-2">Total orders completed</div>
                  </div>
                  <div className="glass-card-static p-5 relative overflow-hidden">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Catalog</div>
                    <div className="text-2xl font-extrabold text-slate-100 mt-1">{total_products}</div>
                    <div className="text-[10px] text-slate-500 mt-2">Active items on storefront</div>
                  </div>
                </div>

                {/* Sales trends chart card */}
                <div className="glass-card-static p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sales Trend Graph</h3>
                    <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 gap-1">
                      {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map(range => (
                        <button
                          key={range}
                          onClick={() => setChartRange(range)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                            chartRange === range
                              ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/20'
                              : 'text-slate-400 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <svg className="w-full min-w-[650px] overflow-visible" viewBox={`0 0 ${width} ${height}`} height={height}>
                      <defs>
                        <linearGradient id="ap-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* SVG Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const yVal = paddingY + ratio * (height - 2 * paddingY);
                        return (
                          <line
                            key={idx}
                            x1={paddingX}
                            y1={yVal}
                            x2={width - paddingX}
                            y2={yVal}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                            strokeDasharray="4,4"
                          />
                        );
                      })}

                      {/* Path fill area */}
                      <path d={areaPath} fill="url(#ap-chart-gradient)" />

                      {/* Outline line */}
                      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" />

                      {/* Points and labels */}
                      {pointsCoordinates.map((pt: any, idx: number) => (
                        <g key={idx}>
                          <circle cx={pt.x} cy={pt.y} r="5" fill="#6366f1" stroke="#0a0f1e" strokeWidth="2" className="cursor-pointer hover:r-7 transition-all" />
                          <text
                            x={pt.x}
                            y={height - 5}
                            textAnchor="middle"
                            style={{ fontSize: '9px', fill: '#94a3b8', fontWeight: 'bold' }}
                          >
                            {pt.label}
                          </text>
                          <text
                            x={pt.x}
                            y={pt.y - 12}
                            textAnchor="middle"
                            style={{ fontSize: '9px', fill: '#f1f5f9', fontWeight: 'bold' }}
                          >
                            ₹{pt.value >= 1000 ? `${(pt.value / 1000).toFixed(1)}k` : pt.value}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Users Management View */}
        {activeView === 'users' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-extrabold text-gradient-blue tracking-tight">User Accounts</h1>
              <p className="text-xs text-slate-400 mt-1">Manage, update profiles, toggle admin rights, and delete customer registrations.</p>
            </div>

            {loadingUsers && users.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : usersError ? (
              <div className="alert alert-error">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Users Load Error: {usersError}</span>
              </div>
            ) : (
              <div className="glass-card-static overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 bg-white/2 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registrations logs</h3>
                  <span className="badge badge-neutral">{users.length} accounts</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="p-4 pl-6">User Info</th>
                        <th className="p-4">Age</th>
                        <th className="p-4">System Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 pl-6">
                            <div className="font-bold text-slate-200">{u.name}</div>
                            <div className="text-xs text-slate-400 mt-1 font-mono">{u.email}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">UUID: {u.id}</div>
                          </td>
                          <td className="p-4 text-slate-350">{u.age} yrs</td>
                          <td className="p-4">
                            <span className={`badge ${u.is_admin ? 'badge-accent' : 'badge-neutral'}`}>
                              {u.userType}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`badge ${u.is_active ? 'badge-success' : 'badge-error'}`}>
                              {u.is_active ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right whitespace-nowrap space-x-2">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditName(u.name);
                                setEditEmail(u.email);
                                setEditAge(u.age);
                              }}
                              className="btn-secondary !px-3 !py-1 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="btn-danger !px-3 !py-1 text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={e => { if (e.target === e.currentTarget) setEditingUser(null); }}>
          <div className="glass-card-static w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Edit User Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Modify profile values for: {editingUser.name}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEditUser}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    required
                    value={editAge}
                    onChange={(e) => setEditAge(Number(e.target.value))}
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-white/2">
                <button type="button" className="btn-secondary text-xs" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" disabled={submittingEdit} className="btn-primary text-xs">
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
