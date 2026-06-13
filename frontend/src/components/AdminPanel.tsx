import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface AdminPanelProps {
  isAdmin: boolean;
  userEmail: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isAdmin, userEmail }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const response = await apiClient.get('/dashboard/');
      if (response.data && response.data.success) {
        setMetrics(response.data.data);
      } else {
        setMetricsError(response.data?.message || 'Failed to load metrics');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'An error occurred while fetching metrics';
      setMetricsError(msg);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin]);

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
          Your account does not have permission to access the administration panel. Please contact your system administrator or log in with an admin account.
        </p>
        <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3.5 mt-5 text-[11px] font-mono text-zinc-500 text-left">
          <div className="flex justify-between border-b border-zinc-200 pb-1.5 mb-1.5">
            <span>Required Permission:</span>
            <span className="font-bold text-red-700">dashboard:view</span>
          </div>
          <div className="flex justify-between">
            <span>Your Account:</span>
            <span className="truncate max-w-[180px]">{userEmail}</span>
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/?tab=buyer'}
          className="w-full mt-6 amazon-btn-primary py-2 px-4 text-xs font-semibold"
        >
          Return to Buyer Dashboard
        </button>
      </div>
    );
  }

  if (loadingMetrics && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-zinc-500 text-xs font-semibold mt-4">Connecting to dashboard services...</span>
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white border border-red-200 rounded-lg shadow-sm text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-zinc-950">Failed to Load Admin Metrics</h3>
        <p className="text-zinc-600 text-xs mt-1 leading-normal">{metricsError}</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => window.location.href = '/?tab=buyer'}
            className="flex-1 amazon-btn-secondary py-2 text-xs font-semibold"
          >
            Back to Store
          </button>
          <button
            onClick={fetchMetrics}
            className="flex-1 amazon-btn-primary py-2 text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Default metrics data mapping if empty
  const {
    total_products = 0,
    total_users = 0,
    total_orders = 0,
    total_revenue = 0,
    recent_orders = [],
    low_stock_products = []
  } = metrics || {};

  return (
    <div className="max-w-[1500px] mx-auto px-4 mt-6 animate-fade-in text-left">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Admin Console Dashboard</h2>
          <p className="text-xs text-zinc-500 mt-1">Real-time statistics, recent sales orders, and inventory monitoring.</p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loadingMetrics}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded shadow-2xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className={`w-3.5 h-3.5 ${loadingMetrics ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.213 6H16" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-6">
        {/* Card 1: Revenue */}
        <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Revenue</span>
              <span className="text-2xl font-bold text-zinc-950 mt-1.5">${total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-sm text-emerald-600 border border-emerald-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-2.5 flex items-center gap-1">
            <span>★ High volume sales</span>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Orders</span>
              <span className="text-2xl font-bold text-zinc-950 mt-1.5">{total_orders}</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-sm text-amber-600 border border-amber-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-medium mt-2.5">
            Customer purchase orders
          </div>
        </div>

        {/* Card 3: Products */}
        <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Active Products</span>
              <span className="text-2xl font-bold text-zinc-950 mt-1.5">{total_products}</span>
            </div>
            <div className="p-2 bg-sky-50 rounded-sm text-sky-600 border border-sky-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-medium mt-2.5">
            Available catalog listings
          </div>
        </div>

        {/* Card 4: Users */}
        <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Registered Users</span>
              <span className="text-2xl font-bold text-zinc-950 mt-1.5">{total_users}</span>
            </div>
            <div className="p-2 bg-violet-50 rounded-sm text-violet-600 border border-violet-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-medium mt-2.5">
            Active buyers and sellers
          </div>
        </div>
      </div>

      {/* Dashboard Dual Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Orders Panel */}
        <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs lg:col-span-3 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4.5 h-4.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Recent Sales Orders
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded-full">Latest 5</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recent_orders.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 text-xs">
                No orders have been recorded in the database.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                    <th className="px-5 py-3">Order Email / ID</th>
                    <th className="px-4 py-3">Created Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_orders.map((order: any) => {
                    let statusClass = 'bg-zinc-100 text-zinc-800';
                    const statusVal = (order.status || '').toLowerCase();
                    if (statusVal.includes('completed') || statusVal.includes('paid') || statusVal.includes('delivered') || statusVal === 'active') {
                      statusClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    } else if (statusVal.includes('pending') || statusVal.includes('processing')) {
                      statusClass = 'bg-amber-50 text-amber-800 border-amber-200';
                    } else if (statusVal.includes('cancel') || statusVal.includes('fail') || statusVal.includes('refund')) {
                      statusClass = 'bg-red-50 text-red-800 border-red-200';
                    }

                    return (
                      <tr key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-zinc-900 truncate max-w-[200px]">{order.user_email}</div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{order.id}</div>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-600 whitespace-nowrap">
                          {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-zinc-900 whitespace-nowrap">
                          ${order.total_amount.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${statusClass}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alerts Panel */}
        <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs lg:col-span-2 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4.5 h-4.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Low Stock Alerts
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-full">Critically Low</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px]">
            {low_stock_products.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 text-xs">
                All inventory levels are healthy.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {low_stock_products.map((product: any) => (
                  <div key={product.id} className="p-4 flex justify-between items-center hover:bg-zinc-50/50 transition-colors">
                    <div className="min-w-0 pr-3">
                      <h4 className="font-bold text-xs text-zinc-900 truncate">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className="font-mono text-zinc-400">SKU: {product.sku}</span>
                        <span className="text-zinc-300">|</span>
                        <span className="font-bold text-[#b12704]">${product.price.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-1 rounded bg-red-50 text-red-700 font-bold border border-red-100 text-[10px] min-w-[50px] text-center">
                        {product.quantity} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
