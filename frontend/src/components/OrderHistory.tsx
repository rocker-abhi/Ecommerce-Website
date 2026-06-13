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

/* ── inline CSS ── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  .oh-root { font-family:'Inter',sans-serif; background:#f8fafc; min-height:100vh; }

  .oh-header {
    background:#fff; border-bottom:1px solid #e2e8f0;
    padding:0 32px; height:64px;
    display:flex; align-items:center; justify-content:space-between;
    position:sticky; top:0; z-index:10;
  }

  .oh-back-btn {
    display:flex; align-items:center; gap:8px;
    background:none; border:1px solid #e2e8f0; border-radius:9px;
    padding:8px 16px; font-size:13px; font-weight:600; color:#475569;
    cursor:pointer; transition:all .15s;
  }
  .oh-back-btn:hover { background:#f1f5f9; border-color:#cbd5e1; }

  .oh-content { max-width:900px; margin:0 auto; padding:32px 24px; }

  .oh-page-title { font-size:24px; font-weight:800; color:#0f172a; margin:0 0 4px; }
  .oh-page-sub   { font-size:13px; color:#94a3b8; margin:0 0 28px; }

  .oh-spinner {
    width:38px; height:38px; border-radius:50%;
    border:3px solid #e2e8f0; border-top-color:#6366f1;
    animation:oh-spin .7s linear infinite; margin:60px auto;
  }
  @keyframes oh-spin { to{transform:rotate(360deg)} }

  .oh-empty {
    text-align:center; padding:64px 32px;
    background:#fff; border-radius:16px; border:1px solid #e2e8f0;
  }
  .oh-empty-icon { font-size:52px; margin-bottom:16px; }
  .oh-empty h3   { font-size:18px; font-weight:700; color:#0f172a; margin:0 0 8px; }
  .oh-empty p    { font-size:13px; color:#94a3b8; margin:0; }

  .oh-order-card {
    background:#fff; border-radius:16px; border:1px solid #e2e8f0;
    margin-bottom:20px; overflow:hidden;
    box-shadow:0 1px 3px rgba(0,0,0,.04);
    transition:box-shadow .2s;
  }
  .oh-order-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.08); }

  .oh-order-header {
    padding:18px 22px; display:flex; align-items:center;
    justify-content:space-between; flex-wrap:wrap; gap:12px;
    border-bottom:1px solid #f1f5f9; background:#fafbfc;
  }

  .oh-order-id   { font-size:11px; font-family:monospace; color:#94a3b8; font-weight:600; }
  .oh-order-date { font-size:12px; color:#64748b; font-weight:500; margin-top:3px; }

  .oh-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700;
    text-transform:uppercase; letter-spacing:.05em;
  }
  .oh-badge-paid     { background:#d1fae5; color:#065f46; border:1px solid #a7f3d0; }
  .oh-badge-pending  { background:#fef9c3; color:#854d0e; border:1px solid #fde68a; }
  .oh-badge-shipped  { background:#dbeafe; color:#1e40af; border:1px solid #bfdbfe; }
  .oh-badge-delivered{ background:#ede9fe; color:#4c1d95; border:1px solid #ddd6fe; }
  .oh-badge-cancelled{ background:#fee2e2; color:#991b1b; border:1px solid #fecaca; }

  .oh-items { padding:6px 0; }
  .oh-item {
    display:flex; align-items:center; gap:14px;
    padding:14px 22px; border-bottom:1px solid #f8fafc;
  }
  .oh-item:last-child { border-bottom:none; }
  .oh-item-img {
    width:52px; height:52px; object-fit:contain; border-radius:8px;
    border:1px solid #e2e8f0; background:#f8fafc; padding:4px; flex-shrink:0;
  }
  .oh-item-img-placeholder {
    width:52px; height:52px; border-radius:8px;
    background:#f1f5f9; border:1px solid #e2e8f0;
    display:flex; align-items:center; justify-content:center;
    font-size:22px; flex-shrink:0;
  }
  .oh-item-name    { font-size:14px; font-weight:600; color:#0f172a; }
  .oh-item-meta    { font-size:12px; color:#64748b; margin-top:3px; }
  .oh-item-price   { margin-left:auto; font-size:14px; font-weight:700; color:#0f172a; flex-shrink:0; }
  .oh-item-subtotal{ font-size:11px; color:#94a3b8; text-align:right; margin-top:2px; }

  .oh-order-footer {
    padding:14px 22px; background:#f8fafc; border-top:1px solid #f1f5f9;
    display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;
  }
  .oh-payment-info { font-size:12px; color:#64748b; display:flex; flex-direction:column; gap:3px; }
  .oh-payment-txn  { font-family:monospace; font-size:11px; color:#94a3b8; }
  .oh-total        { font-size:18px; font-weight:800; color:#0f172a; }
  .oh-total-label  { font-size:11px; color:#94a3b8; text-align:right; margin-bottom:3px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; }

  .oh-error { background:#fff1f2; border:1px solid #fecdd3; border-radius:12px; padding:20px 24px; color:#be123c; font-size:13px; font-weight:500; text-align:center; }

  .oh-stats {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; margin-bottom:28px;
  }
  .oh-stat {
    background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:18px 20px;
    text-align:center;
  }
  .oh-stat-val   { font-size:26px; font-weight:800; color:#0f172a; margin-bottom:4px; }
  .oh-stat-label { font-size:11px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; }

  .oh-section-header {
    display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;
  }
  .oh-section-title { font-size:16px; font-weight:700; color:#0f172a; }
  .oh-count-badge   { background:#ede9fe; color:#6d28d9; border-radius:20px; padding:2px 10px; font-size:12px; font-weight:700; }

  .oh-toggle {
    background:none; border:none; cursor:pointer; color:#6366f1;
    font-size:12px; font-weight:600; padding:0; transition:color .15s;
  }
  .oh-toggle:hover { color:#4f46e5; }
`;

const statusBadgeClass: Record<string, string> = {
  paid: 'oh-badge-paid',
  pending: 'oh-badge-pending',
  shipped: 'oh-badge-shipped',
  delivered: 'oh-badge-delivered',
  cancelled: 'oh-badge-cancelled',
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
    <>
      <style>{css}</style>
      <div className="oh-root">
        {/* Top bar */}
        <div className="oh-header">
          <button className="oh-back-btn" onClick={onBack}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Store
          </button>
          <span style={{ fontSize:13, color:'#94a3b8', fontWeight:500 }}>
            {loading ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="oh-content">
          <h1 className="oh-page-title">Order History</h1>
          <p className="oh-page-sub">Track and review all your past purchases.</p>

          {/* Loading */}
          {loading && <div className="oh-spinner"></div>}

          {/* Error */}
          {!loading && error && (
            <div className="oh-error">⚠ {error}</div>
          )}

          {/* Empty */}
          {!loading && !error && orders.length === 0 && (
            <div className="oh-empty">
              <div className="oh-empty-icon">🛍️</div>
              <h3>No orders yet</h3>
              <p>When you place an order it will appear here.</p>
              <button
                onClick={onBack}
                style={{ marginTop:20, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:9, padding:'10px 22px', fontWeight:600, fontSize:13, cursor:'pointer' }}
              >
                Start Shopping
              </button>
            </div>
          )}

          {/* Stats row */}
          {!loading && !error && orders.length > 0 && (
            <>
              <div className="oh-stats">
                <div className="oh-stat">
                  <div className="oh-stat-val">{orders.length}</div>
                  <div className="oh-stat-label">Orders Placed</div>
                </div>
                <div className="oh-stat">
                  <div className="oh-stat-val">₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="oh-stat-label">Total Spent</div>
                </div>
                <div className="oh-stat">
                  <div className="oh-stat-val">{totalItems}</div>
                  <div className="oh-stat-label">Items Purchased</div>
                </div>
                <div className="oh-stat">
                  <div className="oh-stat-val" style={{ color:'#059669' }}>
                    {orders.filter(o => o.status === 'paid' || o.status === 'delivered').length}
                  </div>
                  <div className="oh-stat-label">Successful</div>
                </div>
              </div>

              {/* Order cards */}
              <div className="oh-section-header">
                <span className="oh-section-title">Your Orders</span>
                <span className="oh-count-badge">{orders.length}</span>
              </div>

              {orders.map(order => {
                const expanded = expandedIds.has(order.id);
                const badge = statusBadgeClass[order.status] || 'oh-badge-pending';
                const icon  = statusIcon[order.status] || '●';
                return (
                  <div key={order.id} className="oh-order-card">
                    {/* Card header */}
                    <div className="oh-order-header">
                      <div>
                        <div className="oh-order-id">{shortOrderId(order.id)}</div>
                        <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace', marginTop:2 }}>{order.id}</div>
                        <div className="oh-order-date">
                          {order.created_at ? formatDate(order.created_at) : '—'}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span className={`oh-badge ${badge}`}>{icon} {order.status}</span>
                        <button className="oh-toggle" onClick={() => toggleExpand(order.id)}>
                          {expanded ? '▲ Collapse' : '▼ View items'}
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    {expanded && (
                      <div className="oh-items">
                        {order.items.length === 0 ? (
                          <div style={{ padding:'16px 22px', color:'#94a3b8', fontSize:13 }}>No items found for this order.</div>
                        ) : order.items.map((item, idx) => (
                          <div key={idx} className="oh-item">
                            {item.product_image ? (
                              <img src={item.product_image} alt={item.product_name} className="oh-item-img" />
                            ) : (
                              <div className="oh-item-img-placeholder">📦</div>
                            )}
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="oh-item-name">{item.product_name}</div>
                              <div className="oh-item-meta">
                                Qty: {item.quantity} &nbsp;·&nbsp; ₹{item.unit_price.toFixed(2)} each
                              </div>
                            </div>
                            <div>
                              <div className="oh-item-price">₹{item.subtotal.toFixed(2)}</div>
                              <div className="oh-item-subtotal">subtotal</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Card footer */}
                    <div className="oh-order-footer">
                      <div className="oh-payment-info">
                        {order.payment ? (
                          <>
                            <span>
                              <strong>Payment:</strong> {order.payment.status} via {order.payment.method}
                            </span>
                            {order.payment.transaction_id && (
                              <span className="oh-payment-txn">TXN: {order.payment.transaction_id}</span>
                            )}
                          </>
                        ) : (
                          <span style={{ color:'#94a3b8' }}>No payment record</span>
                        )}
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div className="oh-total-label">Order Total</div>
                        <div className="oh-total">₹{order.total_amount.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
};
