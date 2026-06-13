import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { type Product, CATEGORY_SUBCATEGORIES } from './Homepage';
import { useToast } from '../context/ToastContext';

interface SellerPanelProps {
  isSeller: boolean;
  onRefreshBuyerProducts: () => void;
}

const NavIcon = ({ path }: { path: string }) => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export const SellerPanel: React.FC<SellerPanelProps> = ({ isSeller, onRefreshBuyerProducts }) => {
  const { showToast } = useToast();
  const [activeNav, setActiveNav] = useState<'catalog' | 'analytics'>('catalog');
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loadingSellerMetrics, setLoadingSellerMetrics] = useState(false);

  // Add product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<Product['category'] | ''>('');
  const [newProdSubcategory, setNewProdSubcategory] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit product modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdCategory, setEditProdCategory] = useState<Product['category'] | ''>('');
  const [editProdSubcategory, setEditProdSubcategory] = useState('');
  const [editProdImage, setEditProdImage] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

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
        showToast('error', 'Error Loading Catalog', response.data?.message || 'Failed to load catalog');
      }
    } catch (err: any) {
      showToast('error', 'Error Loading Catalog', err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoadingSellerMetrics(false);
    }
  };

  useEffect(() => {
    if (isSeller) fetchSellerData();
  }, [isSeller]);

  const handleDeleteProduct = async (productId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this product listing?')) return;
    try {
      await apiClient.delete(`/product/${productId}`);
      const saved = localStorage.getItem('deleted_product_ids');
      const ids = saved ? JSON.parse(saved) : [];
      localStorage.setItem('deleted_product_ids', JSON.stringify([...ids, productId]));
      setSellerProducts(prev => prev.filter(p => p.id !== productId));
      showToast('success', 'Product Deleted', 'The product listing has been removed.');
      onRefreshBuyerProducts();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err?.response?.data?.message || 'Failed to delete product.');
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
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProdName.trim() || !editProdPrice || !editProdCategory || !editProdSubcategory || !editProdDesc.trim() || !editProdImage) {
      showToast('warning', 'Validation Error', 'All fields are required.');
      return;
    }
    const parsedPrice = parseFloat(editProdPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) { 
      showToast('warning', 'Validation Error', 'Please enter a valid price.'); 
      return; 
    }
    setSubmittingEdit(true);
    try {
      const response = await apiClient.put(`/product/${editingProduct.id}`, {
        name: editProdName.trim(), 
        price: parsedPrice,
        description: editProdDesc.trim(), 
        category: editProdCategory,
        subcategory: editProdSubcategory, 
        image_url: editProdImage,
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
      
      showToast('success', 'Listing Updated', 'Product information updated successfully.');
      setEditingProduct(null);
      fetchSellerData();
      onRefreshBuyerProducts();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.response?.data?.message || err.message || 'Update failed.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice || !newProdCategory || !newProdSubcategory || !newProdDesc.trim() || !newProdImage) {
      showToast('warning', 'Validation Error', 'All fields are required.');
      return;
    }
    const parsedPrice = parseFloat(newProdPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) { 
      showToast('warning', 'Validation Error', 'Please enter a valid price.'); 
      return; 
    }
    setSubmittingAdd(true);
    try {
      await apiClient.post('/product', {
        name: newProdName.trim(), 
        price: parsedPrice,
        description: newProdDesc.trim(), 
        category: newProdCategory,
        subcategory: newProdSubcategory, 
        image_url: newProdImage,
        stock: parseInt(newProdStock) || 0,
      });
      showToast('success', 'Product Listed', 'Your new product listing is now active.');
      setNewProdName(''); 
      setNewProdPrice(''); 
      setNewProdCategory('');
      setNewProdSubcategory(''); 
      setNewProdImage(''); 
      setNewProdDesc(''); 
      setNewProdStock('');
      setShowAddModal(false);
      fetchSellerData();
      onRefreshBuyerProducts();
    } catch (err: any) {
      showToast('error', 'Listing Failed', err.response?.data?.message || err.message || 'Failed to create product.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Metrics
  const totalProducts = sellerProducts.length;
  const totalValue = sellerProducts.reduce((s, p) => s + p.price * (p.stock || 0), 0);
  const lowStockCount = sellerProducts.filter(p => (p.stock || 0) < 10).length;
  const avgPrice = totalProducts > 0 ? sellerProducts.reduce((s, p) => s + p.price, 0) / totalProducts : 0;

  if (!isSeller) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] select-none animate-fade-in-up">
        <div className="glass-card-static text-center p-8 max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h3 className="text-lg font-bold text-slate-100">Seller Hub Blocked</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your account does not possess the credentials required to view the merchant catalog dashboard.
          </p>
          <button className="btn-primary mt-6 w-full" onClick={() => window.location.href='/?tab=buyer'}>
            Back to Storefront
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-slate-200 select-none animate-fade-in-up">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col justify-between">
        <div>
          <div className="pb-6 mb-6 border-b border-white/5">
            <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">Merchant Workspace</span>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight mt-1">Appolo Hub</h2>
          </div>

          <nav className="space-y-1">
            <button
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                activeNav === 'catalog'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 glow-accent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
              onClick={() => setActiveNav('catalog')}
            >
              <NavIcon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              Product Catalog
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                activeNav === 'analytics'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 glow-accent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
              onClick={() => setActiveNav('analytics')}
            >
              <NavIcon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              Analytics
            </button>
          </nav>
        </div>

        <div className="pt-6 mt-6 border-t border-white/5">
          <button
            className="w-full text-left px-4 py-3 rounded-lg text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer flex items-center gap-3"
            onClick={() => window.location.href = '/?tab=buyer'}
          >
            <NavIcon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            Exit Seller Hub
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Top bar header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-extrabold text-gradient-blue tracking-tight">
              {activeNav === 'catalog' ? 'Product Listings' : 'Performance Analytics'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {activeNav === 'catalog' ? 'Add, edit, or delete items offered on the primary storefront.' : 'Review historical conversion metrics.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="btn-secondary !px-4 !py-2 text-xs flex items-center gap-1.5"
              onClick={fetchSellerData}
              disabled={loadingSellerMetrics}
            >
              <svg className={`w-3.5 h-3.5 ${loadingSellerMetrics ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.213 6H16" />
              </svg>
              Refresh Data
            </button>
            <button
              className="btn-primary !px-4 !py-2 text-xs flex items-center gap-1.5"
              onClick={() => setShowAddModal(true)}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Listing
            </button>
          </div>
        </div>

        {/* Dashboard Grid stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card-static p-5 relative overflow-hidden">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Listings</div>
            <div className="text-2xl font-extrabold text-slate-100 mt-1">{totalProducts}</div>
            <div className="text-[10px] text-slate-500 mt-2">Displaying on search storefront</div>
          </div>
          <div className="glass-card-static p-5 relative overflow-hidden">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory Value</div>
            <div className="text-2xl font-extrabold text-indigo-400 mt-1">
              ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-2">Calculated as Stock × Price</div>
          </div>
          <div className="glass-card-static p-5 relative overflow-hidden">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Low Stock Alerts</div>
            <div className={`text-2xl font-extrabold mt-1 ${lowStockCount > 0 ? 'text-rose-500' : 'text-slate-100'}`}>
              {lowStockCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-2">Inventory balance &lt; 10 units</div>
          </div>
          <div className="glass-card-static p-5 relative overflow-hidden">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Listing Price</div>
            <div className="text-2xl font-extrabold text-slate-100 mt-1">₹{avgPrice.toFixed(0)}</div>
            <div className="text-[10px] text-slate-500 mt-2">Across all catalog entries</div>
          </div>
        </div>

        {/* ANALYTICS PANEL */}
        {activeNav === 'analytics' && (
          <div className="glass-card-static p-12 text-center max-w-xl mx-auto">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-bold text-slate-200">Merchant Analytics Pipeline</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
              Real-time graphs, conversion funnels, buyer retention trends, and product margin insights are currently in deployment.
            </p>
          </div>
        )}

        {/* CATALOG PANEL */}
        {activeNav === 'catalog' && (
          <div className="glass-card-static overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/2 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Products Catalog</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Total count: {totalProducts} listing(s)</p>
              </div>
              {lowStockCount > 0 && (
                <span className="badge badge-error">Low stock warnings</span>
              )}
            </div>

            {loadingSellerMetrics && sellerProducts.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : sellerProducts.length === 0 ? (
              <div className="p-16 text-center">
                <div className="text-5xl mb-3">📦</div>
                <h4 className="text-md font-bold text-slate-350">Catalog is empty</h4>
                <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">Click the action button to draft and publish your first e-commerce listing.</p>
                <button className="btn-primary mt-6 text-xs" onClick={() => setShowAddModal(true)}>
                  + Add First Product
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="p-4 pl-6">Product</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Inventory</th>
                      <th className="p-4">SKU Code</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sellerProducts.map(product => {
                      const stockNum = product.stock || 0;
                      const isOut = stockNum === 0;
                      const isLow = stockNum > 0 && stockNum < 10;
                      return (
                        <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 pl-6 flex items-center gap-4">
                            <img src={product.image} alt={product.name} className="w-11 h-11 object-contain rounded-lg bg-slate-900 border border-white/10 p-1 flex-shrink-0" />
                            <div className="min-w-0 max-w-[200px]">
                              <div className="font-bold text-sm text-slate-100 truncate">{product.name}</div>
                              <div className="text-[11px] text-slate-500 mt-1 truncate">{product.description}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-xs font-semibold text-slate-300">{product.category}</div>
                            {product.subcategory && <div className="text-[10px] text-slate-500 mt-0.5">{product.subcategory}</div>}
                          </td>
                          <td className="p-4 font-bold text-sm text-slate-100">
                            ₹{product.price.toFixed(2)}
                          </td>
                          <td className="p-4">
                            {isOut ? (
                              <span className="badge badge-error">Out of stock</span>
                            ) : isLow ? (
                              <span className="badge badge-warning">Low: {stockNum} left</span>
                            ) : (
                              <span className="badge badge-success">{stockNum} units</span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-500">
                            {product.sku || '—'}
                          </td>
                          <td className="p-4 pr-6 text-right whitespace-nowrap space-x-2">
                            <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => handleEditClick(product)}>
                              Edit
                            </button>
                            <button className="btn-danger !px-3 !py-1 text-xs" onClick={() => handleDeleteProduct(product.id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE LISTING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="glass-card-static w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Publish New Listing</h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit product particulars to display them on storefront pages.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="form-label">Product Name *</label>
                    <input className="glass-input" type="text" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="e.g., Slim Fit Leather Jacket" required />
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">Price (INR) *</label>
                    <input className="glass-input" type="number" step="0.01" min="0" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="0.00" required />
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">Category *</label>
                    <select className="glass-select" value={newProdCategory} onChange={e => { setNewProdCategory(e.target.value as Product['category']); setNewProdSubcategory(''); }} required>
                      <option value="">Select Category</option>
                      {Object.keys(CATEGORY_SUBCATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">Subcategory *</label>
                    <select className="glass-select" value={newProdSubcategory} onChange={e => setNewProdSubcategory(e.target.value)} disabled={!newProdCategory} required>
                      <option value="">Select Subcategory</option>
                      {newProdCategory && CATEGORY_SUBCATEGORIES[newProdCategory].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">Initial Stock *</label>
                    <input className="glass-input" type="number" min="0" value={newProdStock} onChange={e => setNewProdStock(e.target.value)} placeholder="0" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="form-label">Product Thumbnail Image *</label>
                  <label className="border-2 border-dashed border-white/10 hover:border-indigo-500/40 bg-white/2 hover:bg-indigo-500/5 transition-all rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer group text-xs text-slate-400">
                    <span className="font-bold text-indigo-400 group-hover:text-indigo-300">Click to upload product image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageFileChange(e, setNewProdImage)} />
                  </label>
                  {newProdImage && (
                    <div className="mt-3 flex justify-center bg-slate-900 border border-white/5 rounded-xl p-3">
                      <img src={newProdImage} alt="Preview" className="h-24 object-contain" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="form-label">Description *</label>
                  <textarea className="glass-input min-h-[80px] py-3 resize-y" value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} placeholder="Describe key attributes, sizes, fabrics, specs..." rows={3} required />
                </div>
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-white/2">
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" disabled={submittingAdd} className="btn-primary text-xs">
                  {submittingAdd ? 'Listing...' : 'List Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LISTING MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={e => { if (e.target === e.currentTarget) setEditingProduct(null); }}>
          <div className="glass-card-static w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Update Listing Details</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">Editing: {editingProduct.name}</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="form-label">Product Name *</label>
                    <input className="glass-input" type="text" value={editProdName} onChange={e => setEditProdName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">Price (INR) *</label>
                    <input className="glass-input" type="number" step="0.01" min="0" value={editProdPrice} onChange={e => setEditProdPrice(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">Category *</label>
                    <select className="glass-select" value={editProdCategory} onChange={e => { setEditProdCategory(e.target.value as Product['category']); setEditProdSubcategory(''); }} required>
                      <option value="">Select Category</option>
                      {Object.keys(CATEGORY_SUBCATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">Subcategory *</label>
                    <select className="glass-select" value={editProdSubcategory} onChange={e => setEditProdSubcategory(e.target.value)} disabled={!editProdCategory} required>
                      <option value="">Select Subcategory</option>
                      {editProdCategory && CATEGORY_SUBCATEGORIES[editProdCategory].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="form-label">Product Thumbnail Image (optional)</label>
                  <label className="border-2 border-dashed border-white/10 hover:border-indigo-500/40 bg-white/2 hover:bg-indigo-500/5 transition-all rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer group text-xs text-slate-400">
                    <span className="font-bold text-indigo-400 group-hover:text-indigo-300">Click to upload new image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageFileChange(e, setEditProdImage)} />
                  </label>
                  {editProdImage && (
                    <div className="mt-3 flex justify-center bg-slate-900 border border-white/5 rounded-xl p-3">
                      <img src={editProdImage} alt="Preview" className="h-24 object-contain" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="form-label">Description *</label>
                  <textarea className="glass-input min-h-[80px] py-3 resize-y" value={editProdDesc} onChange={e => setEditProdDesc(e.target.value)} rows={3} required />
                </div>
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-white/2">
                <button type="button" className="btn-secondary text-xs" onClick={() => setEditingProduct(null)}>Cancel</button>
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
