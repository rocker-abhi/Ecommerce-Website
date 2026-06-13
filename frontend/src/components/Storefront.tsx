import React, { useState } from 'react';
import { type Product } from './Homepage';
import { ProductDetail } from './ProductDetail';
import { useToast } from '../context/ToastContext';

interface StorefrontProps {
  products: Product[];
  loadingStorefront: boolean;
  storefrontError: string | null;
  buyerPage: number;
  buyerTotalPages: number;
  setBuyerPage: React.Dispatch<React.SetStateAction<number>>;
  searchTerm: string;
  selectedCategory: string;
  sortBy: 'default' | 'priceAsc' | 'priceDesc' | 'rating';
  setSortBy: React.Dispatch<React.SetStateAction<'default' | 'priceAsc' | 'priceDesc' | 'rating'>>;
  cart: { product: Product; quantity: number }[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string | number) => void;
  updateQuantity: (productId: string | number, change: number) => void;
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string | number) => void;
  showCart: boolean;
  setShowCart: React.Dispatch<React.SetStateAction<boolean>>;
  showWishlist: boolean;
  setShowWishlist: React.Dispatch<React.SetStateAction<boolean>>;
  onProceedToCheckout?: () => void;
}

const SkeletonCard = () => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden', padding: 0
  }}>
    <div className="skeleton" style={{ height: 180 }} />
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="skeleton" style={{ height: 12, borderRadius: 6, width: '40%' }} />
      <div className="skeleton" style={{ height: 16, borderRadius: 6, width: '90%' }} />
      <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '60%' }} />
      <div className="skeleton" style={{ height: 36, borderRadius: 8, marginTop: 8 }} />
    </div>
  </div>
);

export const Storefront: React.FC<StorefrontProps> = ({
  products, loadingStorefront, storefrontError,
  buyerPage, buyerTotalPages, setBuyerPage,
  searchTerm, selectedCategory, sortBy, setSortBy,
  cart, addToCart, removeFromCart, updateQuantity,
  wishlist, addToWishlist, removeFromWishlist,
  showCart, setShowCart, showWishlist, setShowWishlist,
  onProceedToCheckout,
}) => {
  const { showToast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product_id');
    if (prodId && products.length > 0) {
      const found = products.find(p => String(p.id) === String(prodId));
      if (found) setSelectedProduct(found);
    }
  }, [products]);

  React.useEffect(() => {
    const handleProductChanged = (e: Event) => {
      const newProdId = (e as CustomEvent).detail;
      const found = products.find(p => String(p.id) === String(newProdId));
      if (found) { setSelectedProduct(found); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    };
    window.addEventListener('product_changed', handleProductChanged);
    return () => window.removeEventListener('product_changed', handleProductChanged);
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    let result = [...products];
    if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    }
    if (sortBy === 'priceAsc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'priceDesc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg key={i} width="12" height="12" viewBox="0 0 24 24"
        fill={i < Math.floor(rating) ? '#f59e0b' : 'rgba(255,255,255,0.12)'}
        style={{ flexShrink: 0 }}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ));
  };

  const PanelOverlay: React.FC<{
    show: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }> = ({ show, onClose, title, children, footer }) => {
    if (!show) return null;
    return (
      <div className="animate-fade-in" style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 50, display: 'flex', justifyContent: 'flex-end'
      }}>
        <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
        <div className="animate-slide-in-left" style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-elevated)',
          borderLeft: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)', position: 'relative', zIndex: 1
        }}>
          <div style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
            <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>{children}</div>
          {footer && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)' }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Main grid */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 20px' }}>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, gap: 16, flexWrap: 'wrap'
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              {searchTerm ? `Results for "${searchTerm}"` : 'All Products'}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              {filteredProducts.length} products available
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Sort by</label>
            <select
              className="glass-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{ width: 'auto', padding: '8px 36px 8px 12px', fontSize: 13 }}
            >
              <option value="default">Featured</option>
              <option value="priceAsc">Price: Low → High</option>
              <option value="priceDesc">Price: High → Low</option>
              <option value="rating">Best Rated</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loadingStorefront && products.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : storefrontError ? (
          <div className="alert alert-error" style={{ maxWidth: 480, margin: '40px auto' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Failed to load products</div>
              <div style={{ fontSize: 12 }}>{storefrontError}</div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            border: '1px dashed var(--glass-border)',
            borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>No products found</h3>
            <p style={{ margin: 0, fontSize: 14 }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {filteredProducts.map(p => {
                const isInWishlist = wishlist.some(w => w.id === p.id);
                const isOutOfStock = p.stock !== undefined && p.stock <= 0;

                return (
                  <div
                    key={p.id}
                    className="product-card"
                    style={{ display: 'flex', flexDirection: 'column' }}
                  >
                    {/* Image */}
                    <div
                      onClick={() => setSelectedProduct(p)}
                      style={{
                        position: 'relative', height: 180,
                        background: 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', cursor: 'pointer'
                      }}
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{
                          maxHeight: '100%', maxWidth: '100%',
                          objectFit: 'contain', padding: 12,
                          transition: 'transform 0.3s ease'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        onError={e => { e.currentTarget.src = `https://picsum.photos/400/300?random=${p.id}`; }}
                      />
                      {isOutOfStock && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(0,0,0,0.6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <span className="badge badge-error">Out of Stock</span>
                        </div>
                      )}
                      {/* Wishlist heart */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          isInWishlist ? removeFromWishlist(p.id) : addToWishlist(p);
                        }}
                        style={{
                          position: 'absolute', top: 10, right: 10,
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          transition: 'var(--transition-fast)',
                          color: isInWishlist ? '#f43f5e' : 'rgba(255,255,255,0.6)'
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24"
                          fill={isInWishlist ? 'currentColor' : 'none'}
                          stroke="currentColor" strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {p.category}
                      </span>
                      <h4
                        onClick={() => setSelectedProduct(p)}
                        style={{
                          margin: 0, fontSize: 13, fontWeight: 600,
                          color: 'var(--text-primary)', cursor: 'pointer',
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          lineHeight: 1.4, minHeight: '2.8em',
                          transition: 'color 0.15s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-tertiary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                      >
                        {p.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ display: 'flex', gap: 1 }}>{renderStars(p.rating)}</div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({p.rating})</span>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, verticalAlign: 'super' }}>₹</span>
                          {Math.floor(p.price)}
                          <span style={{ fontSize: 13, fontWeight: 600, verticalAlign: 'super' }}>
                            .{(p.price % 1).toFixed(2).slice(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => addToCart(p)}
                          disabled={isOutOfStock}
                          className="btn-primary"
                          style={{ width: '100%', padding: '9px', fontSize: 13, gap: 6 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {buyerTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 40 }}>
                <button
                  className="btn-secondary"
                  onClick={() => setBuyerPage(p => Math.max(p - 1, 1))}
                  disabled={buyerPage === 1}
                  style={{ padding: '8px 20px', fontSize: 13 }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  Page <span style={{ color: 'var(--text-primary)' }}>{buyerPage}</span> of <span style={{ color: 'var(--text-primary)' }}>{buyerTotalPages}</span>
                </span>
                <button
                  className="btn-secondary"
                  onClick={() => setBuyerPage(p => Math.min(p + 1, buyerTotalPages))}
                  disabled={buyerPage === buyerTotalPages}
                  style={{ padding: '8px 20px', fontSize: 13 }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart Panel */}
      <PanelOverlay
        show={showCart}
        onClose={() => setShowCart(false)}
        title={<>🛒 Cart <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 14 }}>({cartCount})</span></>}
        footer={cart.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Subtotal ({cartCount} items)</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-secondary)' }}>₹{cartTotal.toFixed(2)}</span>
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 15 }}
              onClick={() => {
                setShowCart(false);
                if (onProceedToCheckout) onProceedToCheckout();
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        ) : undefined}
      >
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Your cart is empty</h4>
            <p style={{ fontSize: 13 }}>Add some products to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cart.map(item => (
              <div key={item.product.id} style={{
                display: 'flex', gap: 14, padding: '14px',
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)', alignItems: 'center'
              }}>
                <img src={item.product.image} alt={item.product.name}
                  style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: 'rgba(255,255,255,0.05)', padding: 4 }}
                  onError={e => { e.currentTarget.src = `https://picsum.photos/100?random=${item.product.id}`; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product.name}
                  </h5>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-secondary)' }}>
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <button onClick={() => updateQuantity(item.product.id, -1)} style={{
                      width: 26, height: 26, borderRadius: 6, background: 'var(--glass-bg-md)',
                      border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} style={{
                      width: 26, height: 26, borderRadius: 6, background: 'var(--glass-bg-md)',
                      border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>+</button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.product.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 4
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </PanelOverlay>

      {/* Wishlist Panel */}
      <PanelOverlay
        show={showWishlist}
        onClose={() => setShowWishlist(false)}
        title={<>❤️ Wishlist <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 14 }}>({wishlist.length})</span></>}
      >
        {wishlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>💝</div>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Your wishlist is empty</h4>
            <p style={{ fontSize: 13 }}>Heart products you love to save them here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {wishlist.map(item => (
              <div key={item.id} style={{
                display: 'flex', gap: 14, padding: '14px',
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)', alignItems: 'center'
              }}>
                <img src={item.image} alt={item.name}
                  style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: 'rgba(255,255,255,0.05)', padding: 4 }}
                  onError={e => { e.currentTarget.src = `https://picsum.photos/100?random=${item.id}`; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </h5>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-secondary)' }}>₹{item.price.toFixed(2)}</span>
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: 12, gap: 6 }}
                      onClick={() => {
                        addToCart(item);
                        showToast('success', 'Moved to cart', item.name);
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
                <button onClick={() => removeFromWishlist(item.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 4
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </PanelOverlay>

      {/* Product Detail Overlay */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 50, overflowY: 'auto' }}>
          <ProductDetail
            productId={selectedProduct.id}
            onBack={() => {
              setSelectedProduct(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('product_id');
              window.history.pushState(null, '', url.pathname + url.search);
            }}
            addToCart={addToCart}
            addToWishlist={addToWishlist}
            removeFromWishlist={removeFromWishlist}
            wishlist={wishlist}
            onProceedToCheckout={onProceedToCheckout}
          />
        </div>
      )}
    </>
  );
};
