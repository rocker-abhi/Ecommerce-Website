import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

interface OrderItem {
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Payment {
  status: string;
  method: string;
  transaction_id: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
  payment: Payment | null;
}

interface OrderHistoryProps {
  onBack: () => void;
}

const statusBadgeClass: Record<string, string> = {
  paid: 'badge-success',
  pending: 'badge-warning',
  shipped: 'badge-info',
  delivered: 'badge-accent',
  cancelled: 'badge-error',
};

const statusIcon: Record<string, string> = {
  paid: '✓',
  pending: '⏳',
  shipped: '🚚',
  delivered: '📦',
  cancelled: '✕',
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function shortOrderId(id: string) {
  return `#${id.replace(/-/g, '').slice(0, 12).toUpperCase()}`;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/order');
        if (res.data?.success) {
          setOrders(res.data.data || []);
          // Expand the most recent order by default
          if (res.data.data?.length > 0) {
            setExpandedIds(new Set([res.data.data[0].id]));
          }
        } else {
          setError(res.data?.message || 'Failed to load orders');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Stats
  const totalSpent = orders.reduce((s, o) => s + o.total_amount, 0);
  const totalItems = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up select-none">
      
      {/* Top back action */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
        <button 
          onClick={onBack}
          className="btn-secondary group cursor-pointer"
        >
          <svg 
            className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Store
        </button>
        <span className="text-xs font-semibold text-slate-400">
          {loading ? 'Retrieving orders...' : `${orders.length} order${orders.length !== 1 ? 's' : ''} found`}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gradient-blue tracking-tight">Order History</h1>
        <p className="text-sm text-slate-400 mt-1">Track payments, delivery status, and invoice items.</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="alert alert-error max-w-2xl mx-auto my-6">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Error: {error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <div className="glass-card-static text-center p-12 max-w-lg mx-auto">
          <div className="text-5xl mb-4">🛍️</div>
          <h3 className="text-lg font-bold text-slate-200">No orders yet</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">Once you complete a purchase, your transactional invoice details will be listed here.</p>
          <button
            onClick={onBack}
            className="btn-primary mt-6 text-xs"
          >
            Start Shopping
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Stats section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card-static p-5 text-center">
              <div className="text-2xl font-extrabold text-slate-100">{orders.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Orders</div>
            </div>
            <div className="glass-card-static p-5 text-center">
              <div className="text-2xl font-extrabold text-indigo-400">
                ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Spent</div>
            </div>
            <div className="glass-card-static p-5 text-center">
              <div className="text-2xl font-extrabold text-slate-100">{totalItems}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Items</div>
            </div>
            <div className="glass-card-static p-5 text-center">
              <div className="text-2xl font-extrabold text-emerald-400">
                {orders.filter(o => o.status === 'paid' || o.status === 'delivered').length}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Successful</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold text-slate-200">History Records</h2>
            <span className="badge badge-neutral">{orders.length} record(s)</span>
          </div>

          {/* Cards List */}
          <div className="space-y-6">
            {orders.map(order => {
              const expanded = expandedIds.has(order.id);
              const badgeType = statusBadgeClass[order.status] || 'badge-neutral';
              const icon = statusIcon[order.status] || '●';
              
              return (
                <div key={order.id} className="glass-card-static overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 bg-white/2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">{shortOrderId(order.id)}</span>
                        <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">({order.id})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {order.created_at ? formatDate(order.created_at) : '—'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`badge ${badgeType}`}>
                        {icon} {order.status}
                      </span>
                      <button 
                        onClick={() => toggleExpand(order.id)}
                        className="btn-ghost !py-1.5 !px-3 text-xs border border-white/5 cursor-pointer flex items-center gap-1.5"
                      >
                        {expanded ? (
                          <>
                            <span>Collapse</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>View items</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Items Panel */}
                  {expanded && (
                    <div className="divide-y divide-white/5 bg-white/[0.01]">
                      {order.items.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs">No items found for this transaction invoice.</div>
                      ) : (
                        order.items.map((item, idx) => (
                          <div key={idx} className="p-5 flex items-center gap-4">
                            {item.product_image ? (
                              <img 
                                src={item.product_image} 
                                alt={item.product_name} 
                                className="w-12 h-12 object-contain rounded-lg bg-slate-900 border border-white/10 p-1 flex-shrink-0" 
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">📦</div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-slate-200 truncate">{item.product_name}</h4>
                              <p className="text-xs text-slate-400 mt-1">
                                Qty: {item.quantity} · ₹{item.unit_price.toFixed(2)} each
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-sm text-slate-100">₹{item.subtotal.toFixed(2)}</div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">subtotal</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border-t border-white/5">
                    <div className="text-xs text-slate-400 space-y-1">
                      {order.payment ? (
                        <>
                          <div>
                            <span className="font-semibold text-slate-300">Payment:</span> {order.payment.status} via {order.payment.method}
                          </div>
                          {order.payment.transaction_id && (
                            <div className="text-[10px] font-mono text-slate-500">TXN ID: {order.payment.transaction_id}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500 font-medium">No payment record captured</span>
                      )}
                    </div>
                    
                    <div className="sm:text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order Total</div>
                      <div className="text-xl font-extrabold text-indigo-400">₹{order.total_amount.toFixed(2)}</div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
