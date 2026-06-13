import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { type Product, CATEGORY_SUBCATEGORIES } from './Homepage';

interface SellerPanelProps {
  isSeller: boolean;
  onRefreshBuyerProducts: () => void;
}

/* ─── Inline styles / design tokens ─────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  .sp-root { font-family: 'Inter', sans-serif; }

  .sp-sidebar {
    width: 220px; min-height: 100vh; flex-shrink: 0;
    background: linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%);
    border-right: 1px solid rgba(255,255,255,.07);
    display: flex; flex-direction: column;
  }

  .sp-sidebar-logo {
    padding: 28px 24px 20px;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .sp-sidebar-logo span { font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#818cf8; font-weight:700; }
  .sp-sidebar-logo h2 { font-size:18px; font-weight:800; color:#fff; margin-top:4px; }

  .sp-nav-item {
    display:flex; align-items:center; gap:10px;
    padding:10px 20px; margin:2px 10px; border-radius:8px;
    cursor:pointer; color:rgba(255,255,255,.55); font-size:13px; font-weight:500;
    transition:all .18s ease; border:none; background:none; width:calc(100% - 20px);
    text-align:left;
  }
  .sp-nav-item:hover { background:rgba(255,255,255,.07); color:#fff; }
  .sp-nav-item.active { background:rgba(129,140,248,.18); color:#a5b4fc; }
  .sp-nav-item svg { flex-shrink:0; }

  .sp-main { flex:1; background:#f8fafc; overflow-y:auto; }
  .sp-topbar {
    background:#fff; border-bottom:1px solid #e2e8f0;
    padding:0 32px; height:64px;
    display:flex; align-items:center; justify-content:space-between;
    position:sticky; top:0; z-index:10;
  }
  .sp-topbar h1 { font-size:18px; font-weight:700; color:#0f172a; }
  .sp-topbar p { font-size:12px; color:#94a3b8; margin-top:2px; }

  .sp-content { padding:28px 32px; }

  /* Stat cards */
  .sp-stat {
    background:#fff; border-radius:14px; border:1px solid #e2e8f0;
    padding:22px; position:relative; overflow:hidden;
    transition:transform .2s, box-shadow .2s;
  }
  .sp-stat:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.08); }
  .sp-stat-bar { position:absolute; top:0; left:0; right:0; height:3px; border-radius:3px 3px 0 0; }
  .sp-stat-icon {
    width:40px; height:40px; border-radius:10px;
    display:flex; align-items:center; justify-content:center;
  }
  .sp-stat-val { font-size:26px; font-weight:800; color:#0f172a; margin-top:6px; letter-spacing:-.5px; }
  .sp-stat-label { font-size:11px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; }
  .sp-stat-sub { font-size:11px; color:#94a3b8; margin-top:10px; }

  /* Table */
  .sp-table { width:100%; border-collapse:separate; border-spacing:0; }
  .sp-table thead tr th {
    background:#f8fafc; color:#64748b; font-size:11px; font-weight:700;
    text-transform:uppercase; letter-spacing:.07em;
    padding:13px 16px; border-bottom:1px solid #e2e8f0;
  }
  .sp-table thead tr th:first-child { border-radius:12px 0 0 0; }
  .sp-table thead tr th:last-child { border-radius:0 12px 0 0; }
  .sp-table tbody tr { transition:background .15s; }
  .sp-table tbody tr:hover { background:#f1f5f9; }
  .sp-table tbody td { padding:14px 16px; font-size:13px; color:#1e293b; border-bottom:1px solid #f1f5f9; }

  /* Badges */
  .badge-green { background:#d1fae5; color:#065f46; border:1px solid #a7f3d0; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:700; }
  .badge-red   { background:#fee2e2; color:#991b1b; border:1px solid #fecaca; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:700; }
  .badge-yellow{ background:#fef9c3; color:#854d0e; border:1px solid #fde68a; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:700; }

  /* Buttons */
  .sp-btn-primary {
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    color:#fff; font-weight:600; font-size:13px; padding:9px 20px;
    border-radius:9px; border:none; cursor:pointer;
    transition:all .18s; box-shadow:0 2px 8px rgba(99,102,241,.35);
    display:flex; align-items:center; gap:7px;
  }
  .sp-btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(99,102,241,.45); }
  .sp-btn-primary:active { transform:scale(.97); }

  .sp-btn-ghost {
    background:#f1f5f9; color:#475569; font-weight:600; font-size:13px;
    padding:9px 18px; border-radius:9px; border:1px solid #e2e8f0;
    cursor:pointer; transition:all .18s;
    display:flex; align-items:center; gap:7px;
  }
  .sp-btn-ghost:hover { background:#e2e8f0; }

  .sp-btn-edit {
    background:#eff6ff; color:#2563eb; font-size:12px; font-weight:600;
    padding:6px 14px; border-radius:7px; border:1px solid #bfdbfe; cursor:pointer;
    transition:all .15s;
  }
  .sp-btn-edit:hover { background:#dbeafe; }

  .sp-btn-delete {
    background:#fff1f2; color:#e11d48; font-size:12px; font-weight:600;
    padding:6px 14px; border-radius:7px; border:1px solid #fecdd3; cursor:pointer;
    transition:all .15s;
  }
  .sp-btn-delete:hover { background:#ffe4e6; }

  /* Modal overlay */
  .sp-modal-overlay {
    position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(4px);
    z-index:50; display:flex; align-items:center; justify-content:center; padding:24px;
    animation:fadeIn .18s ease;
  }
  .sp-modal {
    background:#fff; border-radius:18px; width:100%; max-width:620px;
    box-shadow:0 24px 64px rgba(0,0,0,.22); overflow:hidden;
    animation:slideUp .22s ease;
  }
  .sp-modal-header {
    padding:22px 28px; border-bottom:1px solid #f1f5f9;
    display:flex; align-items:center; justify-content:space-between;
  }
  .sp-modal-body { padding:28px; }
  .sp-modal-footer {
    padding:18px 28px; background:#f8fafc;
    border-top:1px solid #f1f5f9;
    display:flex; justify-content:flex-end; gap:10px;
  }

  /* Form inputs */
  .sp-label { font-size:12px; font-weight:600; color:#374151; display:block; margin-bottom:6px; }
  .sp-input {
    width:100%; font-size:13px; padding:10px 12px;
    border:1.5px solid #e2e8f0; border-radius:9px; outline:none;
    background:#fff; transition:border .15s, box-shadow .15s; box-sizing:border-box;
  }
  .sp-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
  .sp-textarea {
    width:100%; font-size:13px; padding:10px 12px;
    border:1.5px solid #e2e8f0; border-radius:9px; outline:none;
    resize:vertical; min-height:90px; transition:border .15s, box-shadow .15s;
    box-sizing:border-box;
  }
  .sp-textarea:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
  .sp-select {
    width:100%; font-size:13px; padding:10px 12px;
    border:1.5px solid #e2e8f0; border-radius:9px; outline:none;
    background:#fff; transition:border .15s; appearance:auto;
  }
  .sp-select:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
  .sp-select:disabled { background:#f8fafc; color:#94a3b8; }

  .sp-alert-error   { background:#fff1f2; border:1px solid #fecdd3; border-radius:9px; padding:12px 16px; color:#be123c; font-size:13px; font-weight:500; }
  .sp-alert-success { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:9px; padding:12px 16px; color:#15803d; font-size:13px; font-weight:500; }

  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  .sp-spinner {
    width:36px; height:36px; border-radius:50%;
    border:3px solid #e2e8f0; border-top-color:#6366f1;
    animation:spin .7s linear infinite;
  }
  @keyframes spin { to{transform:rotate(360deg)} }

  .sp-product-img {
    width:44px; height:44px; object-fit:contain; border-radius:8px;
    border:1px solid #e2e8f0; background:#f8fafc; padding:3px; flex-shrink:0;
  }

  .sp-section-card {
    background:#fff; border-radius:16px; border:1px solid #e2e8f0;
    overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.04);
  }
  .sp-section-header {
    padding:18px 22px; border-bottom:1px solid #f1f5f9;
    display:flex; align-items:center; justify-content:space-between;
  }

  .sp-file-input {
    display:block; width:100%;
    border:2px dashed #e2e8f0; border-radius:10px; padding:16px;
    text-align:center; cursor:pointer; transition:border .2s, background .2s;
    background:#fafafa; font-size:12px; color:#94a3b8;
  }
  .sp-file-input:hover { border-color:#6366f1; background:#f5f3ff; color:#6366f1; }
`;

const NavIcon = ({ path }: { path: string }) => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export const SellerPanel: React.FC<SellerPanelProps> = ({ isSeller, onRefreshBuyerProducts }) => {
  const [activeNav, setActiveNav] = useState<'catalog' | 'analytics'>('catalog');
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loadingSellerMetrics, setLoadingSellerMetrics] = useState(false);
  const [sellerMetricsError, setSellerMetricsError] = useState<string | null>(null);

  // Add product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<Product['category'] | ''>('');
  const [newProdSubcategory, setNewProdSubcategory] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit product modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdCategory, setEditProdCategory] = useState<Product['category'] | ''>('');
  const [editProdSubcategory, setEditProdSubcategory] = useState('');
  const [editProdImage, setEditProdImage] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editFormSuccess, setEditFormSuccess] = useState<string | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fetchSellerData = async () => {
    setLoadingSellerMetrics(true);
    setSellerMetricsError(null);
    try {
      const response = await apiClient.get('/dashboard/seller');
      if (response.data?.success) {
        const rawData = response.data.data || [];
        const mappedProducts = rawData.map((item: any) => {
          const productObj = item.product || item;
          return {
            id: productObj.id || item.id,
            name: productObj.name || item.name || 'Unnamed Product',
            price: parseFloat(productObj.price) || parseFloat(item.price) || 0,
            category: productObj.category?.name || productObj.category || item.category || 'Electronics',
            subcategory: productObj.subcategory?.name || productObj.subcategory || item.subcategory || '',
            rating: parseFloat(productObj.rating) || parseFloat(item.rating) || 5,
            image: productObj.image_url || productObj.image || item.image || 'https://picsum.photos/id/120/400/300',
            description: productObj.description || item.description || '',
            sku: item.sku || productObj.sku || `SKU-${(productObj.id || item.id)?.toString().slice(0,8).toUpperCase()}`,
            stock: productObj.stock !== undefined ? productObj.stock : (item.stock !== undefined ? item.stock : 0),
          };
        });

        const savedDeleted = localStorage.getItem('deleted_product_ids');
        const deletedIds: (string | number)[] = savedDeleted ? JSON.parse(savedDeleted) : [];
        const savedEdited = localStorage.getItem('edited_products');
        const editedProducts: Record<string | number, Product> = savedEdited ? JSON.parse(savedEdited) : {};

        const filtered = mappedProducts
          .filter((p: Product) => !deletedIds.includes(p.id))
          .map((p: Product) => {
            if (editedProducts[p.id]) {
              return { ...p, ...editedProducts[p.id], stock: p.stock };
            }
            return p;
          });

        setSellerProducts(filtered);
      } else {
        setSellerMetricsError(response.data?.message || 'Failed to load catalog');
      }
    } catch (err: any) {
      setSellerMetricsError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoadingSellerMetrics(false);
    }
  };

  useEffect(() => {
    if (isSeller) fetchSellerData();
  }, [isSeller]);

  const handleDeleteProduct = async (productId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiClient.delete(`/product/${productId}`);
      const saved = localStorage.getItem('deleted_product_ids');
      const ids = saved ? JSON.parse(saved) : [];
      localStorage.setItem('deleted_product_ids', JSON.stringify([...ids, productId]));
      setSellerProducts(prev => prev.filter(p => p.id !== productId));
      onRefreshBuyerProducts();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditProdName(product.name);
    setEditProdPrice(product.price.toString());
    setEditProdCategory(product.category);
    setEditProdSubcategory(product.subcategory || '');
    setEditProdImage(product.image);
    setEditProdDesc(product.description || '');
    setEditFormError(null);
    setEditFormSuccess(null);
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError(null);
    setEditFormSuccess(null);
    if (!editingProduct) return;
    if (!editProdName.trim() || !editProdPrice || !editProdCategory || !editProdSubcategory || !editProdDesc.trim() || !editProdImage) {
      setEditFormError('All fields are required.');
      return;
    }
    const parsedPrice = parseFloat(editProdPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) { setEditFormError('Enter a valid price.'); return; }
    try {
      const response = await apiClient.put(`/product/${editingProduct.id}`, {
        name: editProdName.trim(), price: parsedPrice,
        description: editProdDesc.trim(), category: editProdCategory,
        subcategory: editProdSubcategory, image_url: editProdImage,
      });
      const resData = response.data?.data || response.data || {};
      const updatedProduct: Product = {
        ...editingProduct,
        name: resData.name || editProdName.trim(),
        price: resData.price !== undefined ? parseFloat(resData.price) : parsedPrice,
        category: (resData.category || editProdCategory) as Product['category'],
        subcategory: resData.subcategory || editProdSubcategory,
        image: resData.image_url || resData.image || editProdImage,
        description: resData.description || editProdDesc.trim(),
        sku: resData.sku || editingProduct.sku,
        stock: resData.stock !== undefined ? resData.stock : editingProduct.stock,
      };
      setSellerProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));
      try {
        const saved = localStorage.getItem('edited_products');
        const ep: Record<string | number, Product> = saved ? JSON.parse(saved) : {};
        ep[editingProduct.id] = updatedProduct;
        localStorage.setItem('edited_products', JSON.stringify(ep));
      } catch {}
      setEditFormSuccess('Product updated successfully!');
      fetchSellerData();
      onRefreshBuyerProducts();
      setTimeout(() => { setEditFormSuccess(null); setEditingProduct(null); }, 1500);
    } catch (err: any) {
      setEditFormError(err.response?.data?.message || err.message || 'Update failed.');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!newProdName.trim() || !newProdPrice || !newProdCategory || !newProdSubcategory || !newProdDesc.trim() || !newProdImage) {
      setFormError('All fields are required.');
      return;
    }
    const parsedPrice = parseFloat(newProdPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) { setFormError('Enter a valid price.'); return; }
    try {
      await apiClient.post('/product', {
        name: newProdName.trim(), price: parsedPrice,
        description: newProdDesc.trim(), category: newProdCategory,
        subcategory: newProdSubcategory, image_url: newProdImage,
        stock: parseInt(newProdStock) || 0,
      });
      setFormSuccess('Product listed successfully!');
      setNewProdName(''); setNewProdPrice(''); setNewProdCategory('');
      setNewProdSubcategory(''); setNewProdImage(''); setNewProdDesc(''); setNewProdStock('');
      fetchSellerData();
      onRefreshBuyerProducts();
      setTimeout(() => { setFormSuccess(null); setShowAddModal(false); }, 1500);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create product.');
    }
  };

  /* ── Derived metrics ─────────────────────────────────────────── */
  const totalProducts = sellerProducts.length;
  const totalValue = sellerProducts.reduce((s, p) => s + p.price * (p.stock || 0), 0);
  const lowStockCount = sellerProducts.filter(p => (p.stock || 0) < 10).length;
  const avgPrice = totalProducts > 0 ? sellerProducts.reduce((s, p) => s + p.price, 0) / totalProducts : 0;

  /* ── Access denied ───────────────────────────────────────────── */
  if (!isSeller) {
    return (
      <>
        <style>{css}</style>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
          <div style={{ textAlign:'center', maxWidth:360 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'#fff1f2', border:'1px solid #fecdd3', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:32 }}>🔒</div>
            <h3 style={{ fontSize:20, fontWeight:800, color:'#0f172a', margin:0 }}>Seller Access Required</h3>
            <p style={{ fontSize:14, color:'#64748b', marginTop:8, lineHeight:1.6 }}>Your account doesn't have seller permissions. Contact support or apply to become a seller.</p>
            <button className="sp-btn-primary" style={{ margin:'24px auto 0', justifyContent:'center' }} onClick={() => window.location.href='/?tab=buyer'}>
              Back to Storefront
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── Loading ─────────────────────────────────────────────────── */
  if (loadingSellerMetrics && sellerProducts.length === 0) {
    return (
      <>
        <style>{css}</style>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:14 }}>
          <div className="sp-spinner"></div>
          <p style={{ fontSize:13, color:'#94a3b8', fontWeight:500 }}>Loading your seller dashboard…</p>
        </div>
      </>
    );
  }

  /* ── Error ───────────────────────────────────────────────────── */
  if (sellerMetricsError) {
    return (
      <>
        <style>{css}</style>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
          <div style={{ textAlign:'center', maxWidth:400 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#0f172a' }}>Failed to Load Dashboard</h3>
            <p style={{ fontSize:13, color:'#64748b', marginTop:6 }}>{sellerMetricsError}</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:20 }}>
              <button className="sp-btn-ghost" onClick={() => window.location.href='/?tab=buyer'}>Back to Store</button>
              <button className="sp-btn-primary" onClick={fetchSellerData}>Retry</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Main Dashboard ──────────────────────────────────────────── */
  return (
    <>
      <style>{css}</style>
      <div className="sp-root" style={{ display:'flex', minHeight:'100vh' }}>

        {/* ── Sidebar ── */}
        <aside className="sp-sidebar">
          <div className="sp-sidebar-logo">
            <span>Seller Hub</span>
            <h2>Dashboard</h2>
          </div>

          <nav style={{ flex:1, padding:'16px 0' }}>
            <button
              className={`sp-nav-item ${activeNav === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveNav('catalog')}
            >
              <NavIcon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              Product Catalog
            </button>
            <button
              className={`sp-nav-item ${activeNav === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveNav('analytics')}
            >
              <NavIcon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              Analytics
            </button>
          </nav>

          <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,.07)' }}>
            <button
              className="sp-nav-item"
              style={{ margin:0, width:'100%' }}
              onClick={() => window.location.href = '/?tab=buyer'}
            >
              <NavIcon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              Back to Store
            </button>
          </div>
        </aside>

        {/* ── Main Area ── */}
        <div className="sp-main">
          {/* Top bar */}
          <div className="sp-topbar">
            <div>
              <h1>{activeNav === 'catalog' ? 'Product Catalog' : 'Analytics Overview'}</h1>
              <p>{activeNav === 'catalog' ? 'Manage and monitor your active listings' : 'Performance metrics for your store'}</p>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button
                className="sp-btn-ghost"
                onClick={fetchSellerData}
                disabled={loadingSellerMetrics}
                style={{ fontSize:12, padding:'7px 14px' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={loadingSellerMetrics ? 'sp-spin' : ''}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.213 6H16" />
                </svg>
                Refresh
              </button>
              <button
                className="sp-btn-primary"
                onClick={() => { setShowAddModal(true); setFormError(null); setFormSuccess(null); }}
                style={{ fontSize:12, padding:'7px 16px' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            </div>
          </div>

          <div className="sp-content">

            {/* ── Stat Cards ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:18, marginBottom:28 }}>
              <div className="sp-stat">
                <div className="sp-stat-bar" style={{ background:'linear-gradient(90deg,#6366f1,#8b5cf6)' }}></div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div className="sp-stat-label">Total Products</div>
                    <div className="sp-stat-val">{totalProducts}</div>
                  </div>
                  <div className="sp-stat-icon" style={{ background:'#ede9fe' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="sp-stat-sub">Active on storefront</div>
              </div>

              <div className="sp-stat">
                <div className="sp-stat-bar" style={{ background:'linear-gradient(90deg,#10b981,#34d399)' }}></div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div className="sp-stat-label">Inventory Value</div>
                    <div className="sp-stat-val">${totalValue.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}</div>
                  </div>
                  <div className="sp-stat-icon" style={{ background:'#d1fae5' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="sp-stat-sub">Stock × price total</div>
              </div>

              <div className="sp-stat">
                <div className="sp-stat-bar" style={{ background:'linear-gradient(90deg,#f59e0b,#fbbf24)' }}></div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div className="sp-stat-label">Low Stock Alerts</div>
                    <div className="sp-stat-val" style={{ color: lowStockCount > 0 ? '#dc2626' : '#0f172a' }}>{lowStockCount}</div>
                  </div>
                  <div className="sp-stat-icon" style={{ background:'#fef9c3' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="sp-stat-sub">Products with &lt;10 units</div>
              </div>

              <div className="sp-stat">
                <div className="sp-stat-bar" style={{ background:'linear-gradient(90deg,#3b82f6,#60a5fa)' }}></div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div className="sp-stat-label">Avg. Price</div>
                    <div className="sp-stat-val">${avgPrice.toFixed(0)}</div>
                  </div>
                  <div className="sp-stat-icon" style={{ background:'#dbeafe' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <div className="sp-stat-sub">Across all listings</div>
              </div>
            </div>

            {/* ── Analytics View ── */}
            {activeNav === 'analytics' && (
              <div className="sp-section-card" style={{ padding:32, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#0f172a' }}>Analytics Coming Soon</h3>
                <p style={{ fontSize:13, color:'#64748b', marginTop:6 }}>Sales charts, revenue trends, and order analytics will appear here.</p>
              </div>
            )}

            {/* ── Catalog Table ── */}
            {activeNav === 'catalog' && (
              <div className="sp-section-card">
                <div className="sp-section-header">
                  <div>
                    <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:0 }}>Active Listings</h3>
                    <p style={{ fontSize:12, color:'#94a3b8', margin:'3px 0 0' }}>
                      {totalProducts} product{totalProducts !== 1 ? 's' : ''} in your catalog
                    </p>
                  </div>
                  {lowStockCount > 0 && (
                    <span className="badge-red">⚠ {lowStockCount} low stock</span>
                  )}
                </div>

                <div style={{ overflowX:'auto' }}>
                  {sellerProducts.length === 0 ? (
                    <div style={{ padding:'64px 32px', textAlign:'center' }}>
                      <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
                      <h4 style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:0 }}>No products yet</h4>
                      <p style={{ fontSize:13, color:'#94a3b8', marginTop:6 }}>Add your first product to start selling.</p>
                      <button className="sp-btn-primary" style={{ margin:'20px auto 0', justifyContent:'center' }} onClick={() => setShowAddModal(true)}>
                        + Add First Product
                      </button>
                    </div>
                  ) : (
                    <table className="sp-table">
                      <thead>
                        <tr>
                          <th style={{ paddingLeft:22 }}>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>SKU</th>
                          <th style={{ textAlign:'right', paddingRight:22 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellerProducts.map(product => {
                          const stockNum = product.stock || 0;
                          const isOut   = stockNum === 0;
                          const isLow   = stockNum > 0 && stockNum < 10;
                          return (
                            <tr key={product.id}>
                              <td style={{ paddingLeft:22, display:'flex', alignItems:'center', gap:12 }}>
                                <img src={product.image} alt={product.name} className="sp-product-img" />
                                <div>
                                  <div style={{ fontWeight:600, color:'#0f172a', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                    {product.name}
                                  </div>
                                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{product.description?.slice(0,60)}{product.description && product.description.length > 60 ? '…' : ''}</div>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize:12, fontWeight:600, color:'#475569' }}>{product.category}</div>
                                {product.subcategory && <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{product.subcategory}</div>}
                              </td>
                              <td>
                                <span style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>${product.price.toFixed(2)}</span>
                              </td>
                              <td>
                                {isOut   ? <span className="badge-red">Out of Stock</span>
                                : isLow  ? <span className="badge-yellow">Low — {stockNum} left</span>
                                : <span className="badge-green">{stockNum} in stock</span>}
                              </td>
                              <td style={{ fontFamily:'monospace', fontSize:11, color:'#94a3b8' }}>
                                {product.sku || '—'}
                              </td>
                              <td style={{ textAlign:'right', paddingRight:22, whiteSpace:'nowrap' }}>
                                <button className="sp-btn-edit" onClick={() => handleEditClick(product)} style={{ marginRight:6 }}>
                                  Edit
                                </button>
                                <button className="sp-btn-delete" onClick={() => handleDeleteProduct(product.id)}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ ADD PRODUCT MODAL ══ */}
      {showAddModal && (
        <div className="sp-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="sp-modal">
            <div className="sp-modal-header">
              <div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#0f172a', margin:0 }}>Add New Product</h3>
                <p style={{ fontSize:12, color:'#94a3b8', margin:'4px 0 0' }}>Fill in the details to list your product on the storefront.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#94a3b8', borderRadius:6 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="sp-modal-body" style={{ display:'flex', flexDirection:'column', gap:16, maxHeight:'65vh', overflowY:'auto' }}>
                {formError   && <div className="sp-alert-error">⚠ {formError}</div>}
                {formSuccess && <div className="sp-alert-success">✓ {formSuccess}</div>}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label className="sp-label">Product Name</label>
                    <input className="sp-input" type="text" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="e.g. Wireless Headphones" />
                  </div>
                  <div>
                    <label className="sp-label">Price (USD)</label>
                    <input className="sp-input" type="number" step="0.01" min="0" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="sp-label">Category</label>
                    <select className="sp-select" value={newProdCategory} onChange={e => { setNewProdCategory(e.target.value as Product['category']); setNewProdSubcategory(''); }}>
                      <option value="">Select category</option>
                      {Object.keys(CATEGORY_SUBCATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="sp-label">Subcategory</label>
                    <select className="sp-select" value={newProdSubcategory} onChange={e => setNewProdSubcategory(e.target.value)} disabled={!newProdCategory}>
                      <option value="">Select subcategory</option>
                      {newProdCategory && CATEGORY_SUBCATEGORIES[newProdCategory].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="sp-label">Initial Stock</label>
                    <input className="sp-input" type="number" min="0" value={newProdStock} onChange={e => setNewProdStock(e.target.value)} placeholder="0" />
                  </div>
                </div>

                <div>
                  <label className="sp-label">Product Image</label>
                  <label className="sp-file-input">
                    {newProdImage ? '✓ Image selected — click to change' : '📷 Click to upload product image'}
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleImageFileChange(e, setNewProdImage)} />
                  </label>
                  {newProdImage && (
                    <img src={newProdImage} alt="preview" style={{ marginTop:10, height:80, objectFit:'contain', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', padding:4 }} />
                  )}
                </div>

                <div>
                  <label className="sp-label">Description</label>
                  <textarea className="sp-textarea" value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} placeholder="Describe your product, key features, materials, specs…" rows={3} />
                </div>
              </div>

              <div className="sp-modal-footer">
                <button type="button" className="sp-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="sp-btn-primary">List Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ EDIT PRODUCT MODAL ══ */}
      {editingProduct && (
        <div className="sp-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditingProduct(null); }}>
          <div className="sp-modal">
            <div className="sp-modal-header">
              <div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#0f172a', margin:0 }}>Edit Product</h3>
                <p style={{ fontSize:12, color:'#94a3b8', margin:'4px 0 0', maxWidth:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{editingProduct.name}</p>
              </div>
              <button onClick={() => setEditingProduct(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#94a3b8', borderRadius:6 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit}>
              <div className="sp-modal-body" style={{ display:'flex', flexDirection:'column', gap:16, maxHeight:'65vh', overflowY:'auto' }}>
                {editFormError   && <div className="sp-alert-error">⚠ {editFormError}</div>}
                {editFormSuccess && <div className="sp-alert-success">✓ {editFormSuccess}</div>}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label className="sp-label">Product Name</label>
                    <input className="sp-input" type="text" value={editProdName} onChange={e => setEditProdName(e.target.value)} />
                  </div>
                  <div>
                    <label className="sp-label">Price (USD)</label>
                    <input className="sp-input" type="number" step="0.01" min="0" value={editProdPrice} onChange={e => setEditProdPrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="sp-label">Category</label>
                    <select className="sp-select" value={editProdCategory} onChange={e => { setEditProdCategory(e.target.value as Product['category']); setEditProdSubcategory(''); }}>
                      <option value="">Select category</option>
                      {Object.keys(CATEGORY_SUBCATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="sp-label">Subcategory</label>
                    <select className="sp-select" value={editProdSubcategory} onChange={e => setEditProdSubcategory(e.target.value)} disabled={!editProdCategory}>
                      <option value="">Select subcategory</option>
                      {editProdCategory && CATEGORY_SUBCATEGORIES[editProdCategory].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="sp-label">Product Image (optional)</label>
                  <label className="sp-file-input">
                    {editProdImage ? '✓ Image ready — click to replace' : '📷 Click to upload new image'}
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleImageFileChange(e, setEditProdImage)} />
                  </label>
                  {editProdImage && (
                    <img src={editProdImage} alt="preview" style={{ marginTop:10, height:80, objectFit:'contain', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', padding:4 }} />
                  )}
                </div>

                <div>
                  <label className="sp-label">Description</label>
                  <textarea className="sp-textarea" value={editProdDesc} onChange={e => setEditProdDesc(e.target.value)} rows={3} />
                </div>
              </div>

              <div className="sp-modal-footer">
                <button type="button" className="sp-btn-ghost" onClick={() => setEditingProduct(null)}>Cancel</button>
                <button type="submit" className="sp-btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
