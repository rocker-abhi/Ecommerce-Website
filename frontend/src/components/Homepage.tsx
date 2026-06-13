import React, { useState, useMemo, useEffect } from 'react';
import apiClient from '../services/api';
import { useToast } from '../context/ToastContext';
import { Storefront } from './Storefront';
import { SellerPanel } from './SellerPanel';
import { AdminPanel } from './AdminPanel';
import { AccountSettings } from './AccountSettings';
import { Checkout } from './Checkout';
import { OrderHistory } from './OrderHistory';

export interface Product {
  id: string | number;
  name: string;
  price: number;
  category: 'Electronics' | 'Apparel' | 'Home' | 'Fitness' | 'Accessories';
  subcategory?: string;
  rating: number;
  image: string;
  description: string;
  sku?: string;
  stock?: number;
}

export const CATEGORY_SUBCATEGORIES: Record<Product['category'], string[]> = {
  Electronics: ['Mobile Phones', 'Laptops', 'Headphones', 'Smartwatches', 'Cameras'],
  Apparel: ["Men's Wear", "Women's Wear", "Kids' Wear", 'Footwear', 'Activewear'],
  Home: ['Furniture', 'Kitchenware', 'Home Decor', 'Bedding', 'Lighting'],
  Fitness: ['Gym Equipment', 'Yoga & Pilates', 'Supplements', 'Sportswear', 'Outdoor Gear'],
  Accessories: ['Bags & Backpacks', 'Watches', 'Sunglasses', 'Jewelry', 'Wallets']
};

interface HomepageProps {
  userEmail: string;
  onLogout: () => void;
}

type Tab = 'buyer' | 'seller' | 'admin' | 'settings' | 'checkout' | 'orders';

const NAV_LINKS: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean; sellerOnly?: boolean }[] = [
  {
    id: 'buyer',
    label: 'Shop',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  {
    id: 'seller',
    label: 'Seller Portal',
    sellerOnly: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    id: 'admin',
    label: 'Admin Console',
    adminOnly: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
];

export const Homepage: React.FC<HomepageProps> = ({ userEmail, onLogout }) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc' | 'rating'>('default');

  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [showWishlist, setShowWishlist] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('buyer');
  const [buyerPage, setBuyerPage] = useState(1);
  const [buyerTotalPages, setBuyerTotalPages] = useState(1);
  const [loadingStorefront, setLoadingStorefront] = useState(false);
  const [storefrontError, setStorefrontError] = useState<string | null>(null);


  const isAdmin = useMemo(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    try {
      const payload = JSON.parse(window.atob(token.split('.')[1]));
      return !!payload.is_super_user || (payload.user_permissions || []).includes('dashboard:view');
    } catch { return false; }
  }, []);

  const isSeller = useMemo(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    try {
      const payload = JSON.parse(window.atob(token.split('.')[1]));
      return (payload.user_permissions || []).includes('product:create') || !!payload.is_super_user;
    } catch { return false; }
  }, []);

  const fetchStorefrontProducts = async (page = 1, limit = 50) => {
    setLoadingStorefront(true);
    setStorefrontError(null);
    try {
      const response = await apiClient.get(`/dashboard/?page=${page}&limit=${limit}`);
      if (response.data?.success) {
        const payload = response.data.data;
        const rawProducts = payload.products || [];
        const savedDeleted: (string | number)[] = JSON.parse(localStorage.getItem('deleted_product_ids') || '[]');
        const editedProducts: Record<string | number, Product> = JSON.parse(localStorage.getItem('edited_products') || '{}');

        const mapped = rawProducts
          .map((item: any): Product => ({
            id: item.id,
            name: item.name || 'Unnamed Product',
            price: parseFloat(item.price) || 0,
            category: item.category || 'Electronics',
            subcategory: item.subcategory || '',
            rating: parseFloat(item.rating) || 5.0,
            image: item.image_url || item.image || 'https://picsum.photos/400/300?random=' + item.id,
            description: item.description || '',
            sku: item.sku || '',
            stock: item.stock !== undefined ? item.stock : 50,
          }))
          .filter((p: Product) => !savedDeleted.includes(p.id))
          .map((p: Product) => editedProducts[p.id] ? { ...p, ...editedProducts[p.id] } : p);

        setProducts(mapped);
        setBuyerPage(payload.page || page);
        setBuyerTotalPages(payload.total_pages || 1);
      } else {
        setStorefrontError(response.data?.message || 'Failed to load products');
      }
    } catch (err: any) {
      setStorefrontError(err.response?.data?.message || err.message || 'Failed to load products');
    } finally {
      setLoadingStorefront(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as Tab | null;
    if (tabParam === 'seller' && isSeller) setActiveTab('seller');
    else if (tabParam === 'admin' && isAdmin) setActiveTab('admin');
    else if (tabParam === 'settings') setActiveTab('settings');
    else if (tabParam === 'orders') setActiveTab('orders');
    else if (tabParam === 'buyer') setActiveTab('buyer');
    else {
      if (isAdmin) setActiveTab('admin');
      else if (isSeller) setActiveTab('seller');
      else setActiveTab('buyer');
    }
  }, [isAdmin, isSeller]);

  useEffect(() => {
    if (activeTab === 'buyer') fetchStorefrontProducts(buyerPage);
  }, [buyerPage, activeTab]);

  const mapBackendCart = (data: any) => {
    if (!data?.items) return [];
    return data.items.map((item: any) => {
      const p = item.product;
      return {
        product: {
          id: p.id, name: p.name || 'Unnamed', price: parseFloat(p.price) || 0,
          category: p.category || 'Electronics', subcategory: p.subcategory || '',
          rating: parseFloat(p.rating) || 5, image: p.image_url || p.image || '',
          description: p.description || '', sku: p.sku || '',
          stock: p.stock !== undefined ? p.stock : 50,
        },
        quantity: item.quantity,
      };
    });
  };

  const mapBackendWishlist = (data: any) => {
    if (!data?.items) return [];
    return data.items.map((p: any): Product => ({
      id: p.id, name: p.name || 'Unnamed', price: parseFloat(p.price) || 0,
      category: p.category || 'Electronics', subcategory: p.subcategory || '',
      rating: parseFloat(p.rating) || 5, image: p.image_url || p.image || '',
      description: p.description || '', sku: p.sku || '',
      stock: p.stock !== undefined ? p.stock : 50,
    }));
  };

  const fetchCart = async () => {
    try {
      const r = await apiClient.get('/cart');
      if (r.data?.success) setCart(mapBackendCart(r.data.data));
    } catch { /* silent */ }
  };

  const fetchWishlist = async () => {
    try {
      const r = await apiClient.get('/wishlist');
      if (r.data?.success) setWishlist(mapBackendWishlist(r.data.data));
    } catch { /* silent */ }
  };

  useEffect(() => { fetchCart(); fetchWishlist(); }, []);

  const addToCart = async (product: Product) => {
    try {
      const r = await apiClient.post(`/cart/${product.id}`, { quantity: 1 });
      if (r.data?.success) {
        setCart(mapBackendCart(r.data.data));
        showToast('success', 'Added to cart', product.name);
      }
    } catch (err: any) {
      showToast('error', 'Failed to add to cart', err.response?.data?.message || 'Try again.');
    }
  };

  const removeFromCart = async (productId: string | number) => {
    try {
      const r = await apiClient.delete(`/cart/${productId}`);
      if (r.data?.success) setCart(mapBackendCart(r.data.data));
    } catch { /* silent */ }
  };

  const updateQuantity = async (productId: string | number, change: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    const newQty = item.quantity + change;
    try {
      if (newQty <= 0) {
        await removeFromCart(productId);
      } else {
        const r = await apiClient.put(`/cart/${productId}`, { quantity: newQty });
        if (r.data?.success) setCart(mapBackendCart(r.data.data));
      }
    } catch { /* silent */ }
  };

  const addToWishlist = async (product: Product) => {
    try {
      const r = await apiClient.post(`/wishlist/${product.id}`);
      if (r.data?.success) {
        setWishlist(mapBackendWishlist(r.data.data));
        showToast('success', 'Added to wishlist', product.name);
      }
    } catch { /* silent */ }
  };

  const removeFromWishlist = async (productId: string | number) => {
    try {
      const r = await apiClient.delete(`/wishlist/${productId}`);
      if (r.data?.success) setWishlist(mapBackendWishlist(r.data.data));
    } catch { /* silent */ }
  };

  const navigate = (tab: Tab) => {
    setActiveTab(tab);
    window.history.pushState(null, '', `/?tab=${tab}`);
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const displayName = userEmail.split('@')[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── GLASS NAVIGATION ── */}
      <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{
          maxWidth: 1440, margin: '0 auto', padding: '0 20px',
          height: 64, display: 'flex', alignItems: 'center', gap: 20
        }}>
          {/* Logo */}
          <div
            onClick={() => navigate('buyer')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 0 20px rgba(99,102,241,0.4)'
            }}>🛍️</div>
            <span style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 20,
              background: 'linear-gradient(135deg, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>ShopVerse</span>
          </div>

          {/* Search */}
          <div style={{
            flex: 1, maxWidth: 560, display: 'flex', alignItems: 'center',
            gap: 0, background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
            overflow: 'hidden', transition: 'var(--transition-fast)'
          }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                flex: 1, padding: '10px 16px', background: 'transparent',
                border: 'none', outline: 'none', color: 'var(--text-primary)',
                fontSize: 14, fontFamily: 'Inter, sans-serif'
              }}
            />
            <button style={{
              padding: '10px 16px', background: 'var(--accent-primary)',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
          </div>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {(isSeller || isAdmin) && NAV_LINKS.filter(l =>
              (!l.adminOnly && !l.sellerOnly) ||
              (l.adminOnly && isAdmin) ||
              (l.sellerOnly && isSeller)
            ).map(link => (
              <button
                key={link.id}
                onClick={() => navigate(link.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 'var(--radius-sm)',
                  background: activeTab === link.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                  border: `1px solid ${activeTab === link.id ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                  color: activeTab === link.id ? 'var(--accent-tertiary)' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'var(--transition-fast)',
                  fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600
                }}
              >
                {link.icon}
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>

            {/* Orders & Settings dropdown */}
            <div style={{ position: 'relative' }} className="group">
              <button style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '6px 10px', background: 'transparent',
                border: '1px solid transparent', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', transition: 'var(--transition-fast)',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--glass-border)', e.currentTarget.style.background = 'var(--glass-bg)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent', e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.2 }}>Hello, {displayName}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Account
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-12-18h24z"/></svg>
                </span>
              </button>
              {/* Dropdown */}
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: 200, background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)', padding: '8px',
                opacity: 0, visibility: 'hidden', transition: 'var(--transition-fast)',
                zIndex: 100
              }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.opacity = '1'; el.style.visibility = 'visible'; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.opacity = '0'; el.style.visibility = 'hidden'; }}
              className="account-dropdown"
              >
                {[
                  { id: 'orders', label: 'Order History', icon: '📦' },
                  { id: 'settings', label: 'Account Settings', icon: '⚙️' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id as Tab)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', background: 'transparent',
                      border: 'none', borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                      transition: 'var(--transition-fast)', fontFamily: 'Inter, sans-serif',
                      fontSize: 13, fontWeight: 500
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wishlist */}
            <button
              onClick={() => setShowWishlist(true)}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', background: 'transparent',
                border: '1px solid transparent', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)', cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--glass-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlist.length > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2, width: 16, height: 16,
                  background: '#6366f1', borderRadius: '50%', fontSize: 10, fontWeight: 800,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{wishlist.length}</span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => setShowCart(true)}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-tertiary)', cursor: 'pointer',
                transition: 'var(--transition-fast)', fontFamily: 'Inter, sans-serif',
                fontSize: 13, fontWeight: 600
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart
              {cartCount > 0 && (
                <span style={{
                  background: 'var(--accent-primary)', color: '#fff',
                  borderRadius: 99, padding: '0 7px', fontSize: 11, fontWeight: 800, minWidth: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{cartCount}</span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Hover fix for account dropdown */}
        <style>{`
          .group:hover .account-dropdown {
            opacity: 1 !important;
            visibility: visible !important;
          }
        `}</style>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1 }}>
        {activeTab === 'buyer' && (
          <Storefront
            products={products}
            loadingStorefront={loadingStorefront}
            storefrontError={storefrontError}
            buyerPage={buyerPage}
            buyerTotalPages={buyerTotalPages}
            setBuyerPage={setBuyerPage}
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            wishlist={wishlist}
            addToWishlist={addToWishlist}
            removeFromWishlist={removeFromWishlist}
            showCart={showCart}
            setShowCart={setShowCart}
            showWishlist={showWishlist}
            setShowWishlist={setShowWishlist}
            onProceedToCheckout={() => { navigate('checkout'); }}
          />
        )}
        {activeTab === 'seller' && (
          <SellerPanel isSeller={isSeller} onRefreshBuyerProducts={() => fetchStorefrontProducts(buyerPage)} />
        )}
        {activeTab === 'admin' && (
          <AdminPanel isAdmin={isAdmin} userEmail={userEmail} />
        )}
        {activeTab === 'settings' && (
          <AccountSettings onBackToStore={() => navigate('buyer')} />
        )}
        {activeTab === 'checkout' && (
          <Checkout
            cart={cart}
            onOrderPlaced={() => { setCart([]); navigate('orders'); }}
            onCancel={() => navigate('buyer')}
          />
        )}
        {activeTab === 'orders' && (
          <OrderHistory onBack={() => navigate('buyer')} />
        )}
      </main>
    </div>
  );
};
