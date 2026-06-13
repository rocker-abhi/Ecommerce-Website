import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  .ap-root {
    font-family: 'Inter', sans-serif;
    background: #f8fafc;
    min-height: calc(100vh - 64px);
    display: flex;
    color: #1e293b;
    text-align: left;
  }

  /* Left Sidebar Navigation */
  .ap-sidebar {
    width: 260px;
    background: #0f172a;
    color: #f8fafc;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    border-right: 1px solid #1e293b;
  }

  .ap-sidebar-title {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0 12px 12px;
    border-b: 1px solid #1e293b;
    margin-bottom: 8px;
  }

  .ap-nav-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 600;
    color: #94a3b8;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .ap-nav-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
  }

  .ap-nav-btn.active {
    color: #fff;
    background: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  }

  /* Content Area */
  .ap-content {
    flex-grow: 1;
    padding: 32px 40px;
    overflow-y: auto;
  }

  .ap-header {
    margin-bottom: 28px;
  }

  .ap-header h2 {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 6px;
  }

  .ap-header p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }

  /* Stats Grid */
  .ap-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .ap-stat-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ap-stat-val {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    margin-top: 4px;
  }

  .ap-stat-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ap-stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  /* Chart Card Styling */
  .ap-chart-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    margin-bottom: 32px;
  }

  .ap-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .ap-chart-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ap-chart-tabs {
    display: flex;
    background: #f1f5f9;
    border-radius: 8px;
    padding: 4px;
    gap: 4px;
  }

  .ap-chart-tab {
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .ap-chart-tab.active {
    background: #fff;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  /* Table styling */
  .ap-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    overflow: hidden;
  }

  .ap-card-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfc;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ap-card-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ap-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .ap-table th {
    background: #f8fafc;
    padding: 12px 24px;
    font-weight: 700;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.05em;
  }

  .ap-table td {
    padding: 16px 24px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  .ap-table tr:hover {
    background: #fafbfc;
  }

  .ap-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .ap-badge-active {
    background: #d1fae5;
    color: #065f46;
  }

  .ap-badge-suspended {
    background: #fee2e2;
    color: #991b1b;
  }

  .ap-badge-admin {
    background: #e0e7ff;
    color: #4338ca;
  }

  .ap-badge-user {
    background: #f1f5f9;
    color: #475569;
  }

  .ap-action-btn {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .ap-action-btn-suspend {
    background: #fff;
    color: #ef4444;
    border: 1px solid #fca5a5;
  }

  .ap-action-btn-suspend:hover {
    background: #fef2f2;
  }

  .ap-action-btn-activate {
    background: #10b981;
    color: #fff;
    border: none;
  }

  .ap-action-btn-activate:hover {
    background: #059669;
  }

  .ap-action-btn-toggle-role {
    background: #fff;
    color: #6366f1;
    border: 1px solid #c7d2fe;
    margin-left: 8px;
  }

  .ap-action-btn-toggle-role:hover {
    background: #e0e7ff;
  }

  /* Graph elements */
  .ap-chart-svg {
    width: 100%;
    height: 300px;
    overflow: visible;
  }

  .ap-chart-gridline {
    stroke: #e2e8f0;
    stroke-width: 1;
    stroke-dasharray: 4,4;
  }

  .ap-chart-line {
    fill: none;
    stroke: #6366f1;
    stroke-width: 3.5;
    stroke-linecap: round;
  }

  .ap-chart-area {
    fill: url(#ap-chart-gradient);
    opacity: 0.15;
  }

  .ap-chart-point {
    fill: #6366f1;
    stroke: #fff;
    stroke-width: 2.5;
    r: 6;
    cursor: pointer;
    transition: r 0.1s ease;
  }

  .ap-chart-point:hover {
    r: 8;
  }
`;

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
        alert("User deleted successfully.");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
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
        alert("User details updated successfully.");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user details');
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

  const handleToggleUserRole = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const response = await apiClient.put(`/auth/users/${userId}`, {
        is_admin: !currentIsAdmin
      });
      if (response.data && response.data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentIsAdmin, userType: !currentIsAdmin ? 'admin' : 'buyer' } : u));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle user role');
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
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-zinc-200 rounded-lg shadow-sm text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-zinc-900">Admin Access Denied</h3>
        <p className="text-zinc-600 text-sm mt-2 leading-relaxed">
          Your account does not have permission to access the administration panel. Please contact your system administrator.
        </p>
        <button
          onClick={() => window.location.href = '/?tab=buyer'}
          className="w-full mt-6 amazon-btn-primary py-2 px-4 text-xs font-semibold"
        >
          Return to Buyer Dashboard
        </button>
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
    <>
      <style>{css}</style>
      <div className="ap-root">
        {/* Left Sidebar Menu */}
        <div className="ap-sidebar">
          <div className="ap-sidebar-title">Admin Console</div>
          <button
            onClick={() => setActiveView('dashboard')}
            className={`ap-nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard Analytics
          </button>
          <button
            onClick={() => setActiveView('users')}
            className={`ap-nav-btn ${activeView === 'users' ? 'active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            User Management
          </button>
          
          <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Connected Identity</div>
            <div style={{ fontSize: '12.5px', color: '#f8fafc', fontWeight: '600', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          </div>
        </div>

        {/* Content Pane */}
        <div className="ap-content">
          {activeView === 'dashboard' && (
            <div>
              <div className="ap-header">
                <h2>Analytics Dashboard Overview</h2>
                <p>Website performance metrics and customer purchasing analytics trends.</p>
              </div>

              {loadingMetrics && !metrics ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <div className="ap-stat-icon animate-spin" style={{ margin: '0 auto 12px' }}>🔄</div>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Refreshing metrics...</span>
                </div>
              ) : metricsError ? (
                <div style={{ padding: '24px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', fontSize: '13px' }}>
                  ⚠ Failed to update metrics: {metricsError}
                </div>
              ) : (
                <>
                  {/* KPI Cards Grid */}
                  <div className="ap-stats-grid">
                    <div className="ap-stat-card">
                      <div>
                        <div className="ap-stat-label">Total Revenue</div>
                        <div className="ap-stat-val">${total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div className="ap-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>💵</div>
                    </div>
                    <div className="ap-stat-card">
                      <div>
                        <div className="ap-stat-label">Registered Users</div>
                        <div className="ap-stat-val">{total_users}</div>
                      </div>
                      <div className="ap-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>👥</div>
                    </div>
                    <div className="ap-stat-card">
                      <div>
                        <div className="ap-stat-label">Total Product Sales</div>
                        <div className="ap-stat-val">{total_orders}</div>
                      </div>
                      <div className="ap-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>📦</div>
                    </div>
                    <div className="ap-stat-card">
                      <div>
                        <div className="ap-stat-label font-bold">Total Products</div>
                        <div className="ap-stat-val">{total_products}</div>
                      </div>
                      <div className="ap-stat-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>🛍️</div>
                    </div>
                  </div>

                  {/* Interactive Chart Container */}
                  <div className="ap-chart-card">
                    <div className="ap-chart-header">
                      <span className="ap-chart-title">Website Sales Trends</span>
                      <div className="ap-chart-tabs">
                        {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map(range => (
                          <button
                            key={range}
                            onClick={() => setChartRange(range)}
                            className={`ap-chart-tab ${chartRange === range ? 'active' : ''}`}
                          >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <svg className="ap-chart-svg" viewBox={`0 0 ${width} ${height}`}>
                        <defs>
                          <linearGradient id="ap-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                          const yVal = paddingY + ratio * (height - 2 * paddingY);
                          return (
                            <line
                              key={idx}
                              x1={paddingX}
                              y1={yVal}
                              x2={width - paddingX}
                              y2={yVal}
                              className="ap-chart-gridline"
                            />
                          );
                        })}

                        {/* Area Fill */}
                        <path d={areaPath} className="ap-chart-area" />

                        {/* Trend Line */}
                        <path d={linePath} className="ap-chart-line" />

                        {/* Chart markers / points */}
                        {pointsCoordinates.map((pt: any, idx: number) => (
                          <g key={idx}>
                            <circle cx={pt.x} cy={pt.y} className="ap-chart-point">
                              <title>{pt.label}: ${pt.value.toLocaleString()}</title>
                            </circle>
                            <text
                              x={pt.x}
                              y={height - 5}
                              textAnchor="middle"
                              style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }}
                            >
                              {pt.label}
                            </text>
                            <text
                              x={pt.x}
                              y={pt.y - 12}
                              textAnchor="middle"
                              style={{ fontSize: '10px', fill: '#0f172a', fontWeight: 'bold' }}
                            >
                              ${pt.value >= 1000 ? `${(pt.value / 1000).toFixed(1)}k` : pt.value}
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

          {activeView === 'users' && (
            <div>
              <div className="ap-header">
                <h2>User Management Console</h2>
                <p>Monitor customer profile registrations, manage suspension status, and assign administrator privileges.</p>
              </div>

              {loadingUsers && users.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <div className="ap-stat-icon animate-spin" style={{ margin: '0 auto 12px' }}>🔄</div>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Retrieving account logs...</span>
                </div>
              ) : usersError ? (
                <div style={{ padding: '24px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b', fontSize: '13px' }}>
                  ⚠ Failed to load users list: {usersError}
                </div>
              ) : (
                <div className="ap-card">
                  <div className="ap-card-header">
                    <span className="ap-card-title">Registered Accounts Log</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#f1f5f9', padding: '3px 10px', borderRadius: '20px', color: '#475569' }}>
                      {users.length} accounts found
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="ap-table">
                      <thead>
                        <tr>
                          <th>User Info</th>
                          <th>Age</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id}>
                            <td>
                              <div style={{ fontWeight: '700', color: '#0f172a' }}>{u.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>{u.email}</div>
                              <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '1px', fontFamily: 'monospace' }}>ID: {u.id}</div>
                            </td>
                            <td>{u.age} yrs</td>
                            <td>
                              <span className={`ap-badge ${u.is_admin ? 'ap-badge-admin' : 'ap-badge-user'}`}>
                                {u.userType}
                              </span>
                            </td>
                            <td>
                              <span className={`ap-badge ${u.is_active ? 'ap-badge-active' : 'ap-badge-suspended'}`}>
                                {u.is_active ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditName(u.name);
                                  setEditEmail(u.email);
                                  setEditAge(u.age);
                                }}
                                className="ap-action-btn"
                                style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleUserRole(u.id, u.is_admin)}
                                className="ap-action-btn ap-action-btn-toggle-role"
                                style={{ marginLeft: '8px' }}
                              >
                                {u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="ap-action-btn ap-action-btn-suspend"
                                style={{ marginLeft: '8px' }}
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
        </div>
      </div>

      {/* Edit User Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden text-left p-6">
            <h3 className="text-lg font-bold text-zinc-950 mb-4">Edit User Account</h3>
            <form onSubmit={handleSaveEditUser}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13.5px', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13.5px', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Age</label>
                <input
                  type="number"
                  required
                  value={editAge}
                  onChange={(e) => setEditAge(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13.5px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="ap-action-btn"
                  style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="ap-action-btn"
                  style={{ background: '#6366f1', color: '#fff', border: 'none' }}
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
