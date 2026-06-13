import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useToast } from '../context/ToastContext';
import type { Product } from './Homepage';

interface Address {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_active: boolean;
}

interface CartItem { product: Product; quantity: number; }
interface CheckoutProps {
  cart: CartItem[];
  onOrderPlaced: () => void;
  onCancel: () => void;
}

const inputCss: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: 14, fontFamily: 'Inter, sans-serif',
  outline: 'none', transition: 'var(--transition-fast)'
};

export const Checkout: React.FC<CheckoutProps> = ({ cart, onOrderPlaced, onCancel }) => {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const r = await apiClient.get('/address');
      if (r.data?.success) {
        const list = r.data.data;
        setAddresses(list);
        if (list.length > 0) setSelectedAddressId(list[0].id);
      }
    } catch { /* silent */ }
    finally { setLoadingAddresses(false); }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine1 || !city || !state || !zipCode || !country) {
      showToast('error', 'Missing fields', 'Please fill all required address fields.');
      return;
    }
    setSavingAddress(true);
    try {
      const r = await apiClient.post('/address', {
        address_line_1: addressLine1,
        address_line_2: addressLine2 || undefined,
        city, state, zip_code: zipCode, country
      });
      if (r.data?.success) {
        const newAddr = r.data.data;
        setAddresses(prev => [...prev, newAddr]);
        setSelectedAddressId(newAddr.id);
        setShowAddressForm(false);
        setAddressLine1(''); setAddressLine2(''); setCity('');
        setState(''); setZipCode(''); setCountry('');
        showToast('success', 'Address saved', 'Your address has been added.');
      }
    } catch (err: any) {
      showToast('error', 'Failed to save address', err.response?.data?.message || 'Try again.');
    } finally { setSavingAddress(false); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('warning', 'No address selected', 'Please select or add a shipping address.');
      return;
    }
    setPlacingOrder(true);
    try {
      const r = await apiClient.post('/order', { address_id: selectedAddressId });
      if (r.data?.success) {
        showToast('success', 'Order placed! 🎉', 'Thank you for shopping with ShopVerse.');
        onOrderPlaced();
      } else {
        showToast('error', 'Order failed', r.data.message || 'Failed to place order.');
      }
    } catch (err: any) {
      showToast('error', 'Order failed', err.response?.data?.message || 'Failed to place order.');
    } finally { setPlacingOrder(false); }
  };

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const Section: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
    <div className="glass-card-static" style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={onCancel} className="btn-ghost" style={{ padding: '6px 10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
          Checkout
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Shipping Address */}
          <Section
            title="1. Shipping Address"
            action={!showAddressForm && (
              <button
                className="btn-ghost"
                onClick={() => setShowAddressForm(true)}
                style={{ fontSize: 13, color: 'var(--accent-secondary)' }}
              >
                + Add Address
              </button>
            )}
          >
            {loadingAddresses ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
              </div>
            ) : showAddressForm ? (
              <form onSubmit={handleCreateAddress} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Address Line 1 *', val: addressLine1, set: setAddressLine1, required: true },
                    { label: 'Address Line 2', val: addressLine2, set: setAddressLine2, required: false },
                    { label: 'City *', val: city, set: setCity, required: true },
                    { label: 'State *', val: state, set: setState, required: true },
                    { label: 'Zip Code *', val: zipCode, set: setZipCode, required: true },
                    { label: 'Country *', val: country, set: setCountry, required: true },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="form-label">{f.label}</label>
                      <input
                        type="text"
                        value={f.val}
                        onChange={e => f.set(e.target.value)}
                        required={f.required}
                        style={inputCss}
                        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-secondary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn-primary" disabled={savingAddress} style={{ padding: '10px 22px', fontSize: 13 }}>
                    {savingAddress ? 'Saving...' : 'Save Address'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddressForm(false)} style={{ padding: '10px 22px', fontSize: 13 }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                <p style={{ marginBottom: 12 }}>No addresses saved yet.</p>
                <button className="btn-primary" onClick={() => setShowAddressForm(true)} style={{ padding: '9px 20px', fontSize: 13 }}>
                  + Add First Address
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {addresses.map(addr => (
                  <label
                    key={addr.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px',
                      border: `1px solid ${selectedAddressId === addr.id ? 'rgba(99,102,241,0.4)' : 'var(--glass-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: selectedAddressId === addr.id ? 'rgba(99,102,241,0.08)' : 'var(--glass-bg)',
                      cursor: 'pointer', transition: 'var(--transition-fast)'
                    }}
                  >
                    <input
                      type="radio"
                      name="shipping_address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      style={{ marginTop: 2, accentColor: 'var(--accent-primary)' }}
                    />
                    <div style={{ fontSize: 13 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 700, color: 'var(--text-primary)' }}>{addr.address_line_1}</p>
                      {addr.address_line_2 && <p style={{ margin: '0 0 2px', color: 'var(--text-secondary)' }}>{addr.address_line_2}</p>}
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{addr.city}, {addr.state} {addr.zip_code} · {addr.country}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Section>

          {/* Review Items */}
          <Section title="2. Review Items">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map(item => (
                <div key={item.product.id} style={{
                  display: 'flex', gap: 14, padding: '12px 0',
                  borderBottom: '1px solid var(--glass-border)'
                }}>
                  <img src={item.product.image} alt={item.product.name}
                    style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, background: 'rgba(255,255,255,0.04)', padding: 6 }}
                    onError={e => { e.currentTarget.src = `https://picsum.photos/100?random=${item.product.id}`; }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.product.name}</h4>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Qty: {item.quantity} · {item.product.category}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: 'var(--text-primary)' }}>₹{(item.product.price * item.quantity).toFixed(2)}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>₹{item.product.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right: Order Summary */}
        <div className="glass-card-static" style={{ padding: '24px 22px', position: 'sticky', top: 80 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Items', value: `₹${subtotal.toFixed(2)}` },
              { label: 'Shipping', value: shipping === 0 ? 'FREE 🎉' : `₹${shipping.toFixed(2)}` },
              { label: 'Tax (8%)', value: `₹${tax.toFixed(2)}` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)' }}>
                <span>{row.label}</span>
                <span style={{ color: row.label === 'Shipping' && shipping === 0 ? 'var(--success)' : 'var(--text-primary)', fontWeight: 500 }}>
                  {row.value}
                </span>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent-secondary)' }}>₹{total.toFixed(2)}</span>
            </div>
          </div>
          {subtotal > 0 && subtotal <= 50 && (
            <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#fcd34d', marginBottom: 16 }}>
              💡 Add ₹{(50 - subtotal).toFixed(2)} more for free shipping!
            </div>
          )}
          <button
            className="btn-primary"
            onClick={handlePlaceOrder}
            disabled={placingOrder || addresses.length === 0}
            style={{ width: '100%', padding: '14px', fontSize: 15, marginBottom: 10 }}
          >
            {placingOrder ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Processing...
              </span>
            ) : '🛒 Place Order'}
          </button>
          <button className="btn-secondary" onClick={onCancel} style={{ width: '100%', padding: '11px', fontSize: 13 }}>
            Back to Shopping
          </button>
          <p style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            🔒 Secure checkout · Your data is protected
          </p>
        </div>
      </div>
    </div>
  );
};
