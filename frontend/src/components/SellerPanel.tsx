import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { type Product, CATEGORY_SUBCATEGORIES } from './Homepage';

interface SellerPanelProps {
  isSeller: boolean;
  onRefreshBuyerProducts: () => void;
}

export const SellerPanel: React.FC<SellerPanelProps> = ({
  isSeller,
  onRefreshBuyerProducts,
}) => {
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loadingSellerMetrics, setLoadingSellerMetrics] = useState(false);
  const [sellerMetricsError, setSellerMetricsError] = useState<string | null>(null);

  // Seller new product form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<Product['category'] | ''>('');
  const [newProdSubcategory, setNewProdSubcategory] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Seller edit product form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdCategory, setEditProdCategory] = useState<Product['category'] | ''>('');
  const [editProdSubcategory, setEditProdSubcategory] = useState('');
  const [editProdImage, setEditProdImage] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editFormSuccess, setEditFormSuccess] = useState<string | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchSellerData = async () => {
    setLoadingSellerMetrics(true);
    setSellerMetricsError(null);
    try {
      const response = await apiClient.get('/dashboard/seller');
      if (response.data && response.data.success) {
        const rawData = response.data.data || [];
        const mappedProducts = rawData.map((item: any) => {
          const productObj = item.product || item;
          return {
            id: productObj.id || item.id || Math.floor(Math.random() * 100000),
            name: productObj.name || item.name || 'Unnamed Product',
            price: parseFloat(productObj.price) || parseFloat(item.price) || 0.0,
            category: productObj.category?.name || productObj.category || item.category || 'Electronics',
            subcategory: productObj.subcategory?.name || productObj.subcategory || item.subcategory || '',
            rating: parseFloat(productObj.rating) || parseFloat(item.rating) || 5.0,
            image: productObj.image_url || productObj.image || item.image || 'https://picsum.photos/id/120/400/300',
            description: productObj.description || item.description || '',
            sku: item.sku || productObj.sku || `SKU-EL-${(productObj.id || item.id) * 13 + 104}`,
            stock: item.quantity !== undefined ? item.quantity : (productObj.stock !== undefined ? productObj.stock : (item.stock !== undefined ? item.stock : 25))
          };
        });

        // Filter out locally deleted products and apply edit overrides
        const savedDeleted = localStorage.getItem('deleted_product_ids');
        const deletedIds: (string | number)[] = savedDeleted ? JSON.parse(savedDeleted) : [];
        
        const savedEdited = localStorage.getItem('edited_products');
        const editedProducts: Record<string | number, Product> = savedEdited ? JSON.parse(savedEdited) : {};

        const filteredMappedProducts = mappedProducts
          .filter((p: Product) => !deletedIds.includes(p.id))
          .map((p: Product) => {
            if (editedProducts[p.id]) {
              return { ...p, ...editedProducts[p.id] };
            }
            return p;
          });

        setSellerProducts(filteredMappedProducts);
      } else {
        setSellerMetricsError(response.data?.message || 'Failed to load seller catalog');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'An error occurred while fetching seller dashboard data';
      setSellerMetricsError(msg);
    } finally {
      setLoadingSellerMetrics(false);
    }
  };

  useEffect(() => {
    if (isSeller) {
      fetchSellerData();
    }
  }, [isSeller]);

  const handleDeleteProduct = async (productId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this product listing?")) return;
    try {
      await apiClient.delete(`/product/${productId}`);
      
      const savedDeleted = localStorage.getItem('deleted_product_ids');
      const deletedProductIds = savedDeleted ? JSON.parse(savedDeleted) : [];
      const updatedDeletedIds = [...deletedProductIds, productId];
      localStorage.setItem('deleted_product_ids', JSON.stringify(updatedDeletedIds));
      
      setSellerProducts(prev => prev.filter(p => p.id !== productId));
      onRefreshBuyerProducts();
    } catch (err: any) {
      console.error('Failed to delete product from database:', err);
      alert(err?.response?.data?.message || 'Failed to delete product. Please try again.');
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
    setShowAddForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError(null);
    setEditFormSuccess(null);

    if (!editingProduct) return;

    if (!editProdName.trim() || !editProdPrice || !editProdCategory || !editProdSubcategory || !editProdDesc.trim() || !editProdImage) {
      setEditFormError('All fields are required. Please upload an image, select a category/subcategory, and fill in the title, price, and description.');
      return;
    }

    const parsedPrice = parseFloat(editProdPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setEditFormError('Please enter a valid positive price.');
      return;
    }

    try {
      const response = await apiClient.put(`/product/${editingProduct.id}`, {
        name: editProdName.trim(),
        price: parsedPrice,
        description: editProdDesc.trim(),
        category: editProdCategory,
        subcategory: editProdSubcategory,
        image_url: editProdImage
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
        stock: resData.stock !== undefined ? resData.stock : editingProduct.stock
      };

      setSellerProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));

      try {
        const savedEdited = localStorage.getItem('edited_products');
        const editedProducts: Record<string | number, Product> = savedEdited ? JSON.parse(savedEdited) : {};
        editedProducts[editingProduct.id] = updatedProduct;
        localStorage.setItem('edited_products', JSON.stringify(editedProducts));
      } catch (err) {
        console.error('Failed to save edited product to localStorage:', err);
      }

      setEditFormSuccess('Product listing updated successfully!');
      fetchSellerData();
      onRefreshBuyerProducts();

      setTimeout(() => {
        setEditFormSuccess(null);
        setEditingProduct(null);
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'An error occurred while updating the product';
      setEditFormError(msg);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newProdName.trim() || !newProdPrice || !newProdCategory || !newProdSubcategory || !newProdDesc.trim() || !newProdImage) {
      setFormError('All fields are required. Please upload an image, select a category/subcategory, and fill in the title, price, and description.');
      return;
    }

    const parsedPrice = parseFloat(newProdPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Please enter a valid positive price.');
      return;
    }

    try {
      await apiClient.post('/product', {
        name: newProdName.trim(),
        price: parsedPrice,
        description: newProdDesc.trim(),
        category: newProdCategory,
        subcategory: newProdSubcategory,
        image_url: newProdImage
      });

      setFormSuccess('Product listing created successfully!');
      
      // Clear fields
      setNewProdName('');
      setNewProdPrice('');
      setNewProdCategory('');
      setNewProdSubcategory('');
      setNewProdImage('');
      setNewProdDesc('');
      
      fetchSellerData();
      onRefreshBuyerProducts();

      setTimeout(() => {
        setFormSuccess(null);
        setShowAddForm(false);
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'An error occurred while saving the product';
      setFormError(msg);
    }
  };

  if (!isSeller) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-zinc-200 rounded-lg shadow-sm text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-zinc-900">Seller Access Denied</h3>
        <p className="text-zinc-600 text-sm mt-2 leading-relaxed">
          Your account does not have permission to access the seller portal.
        </p>
        <button
          onClick={() => window.location.href = '/?tab=buyer'}
          className="w-full mt-6 amazon-btn-primary py-2 px-4 text-xs font-semibold"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  if (loadingSellerMetrics && sellerProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-zinc-500 text-xs font-semibold mt-4">Connecting to seller catalog...</span>
      </div>
    );
  }

  if (sellerMetricsError) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white border border-red-200 rounded-lg shadow-sm text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-zinc-950">Failed to Load Seller Dashboard</h3>
        <p className="text-zinc-600 text-xs mt-1 leading-normal">{sellerMetricsError}</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => window.location.href = '/?tab=buyer'}
            className="flex-1 amazon-btn-secondary py-2 text-xs font-semibold"
          >
            Back to Store
          </button>
          <button
            onClick={fetchSellerData}
            className="flex-1 amazon-btn-primary py-2 text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Calculate seller summary metrics
  const totalSalesRevenue = sellerProducts.reduce((sum, p) => sum + (p.price * 5), 0); // Mock sales
  const sellerProductCount = sellerProducts.length;

  return (
    <div className="max-w-[1500px] mx-auto px-4 mt-6 animate-fade-in text-left">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Seller Management Console</h2>
          <p className="text-xs text-zinc-500 mt-1">Manage product details, verify inventory levels, and register new catalog listings.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              {showAddForm ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              )}
            </svg>
            {showAddForm ? 'Cancel Form' : 'List New Product'}
          </button>
          <button
            onClick={fetchSellerData}
            disabled={loadingSellerMetrics}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded shadow-2xs transition-all active:scale-95 disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loadingSellerMetrics ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.213 6H16" />
            </svg>
            Refresh Catalog
          </button>
        </div>
      </div>

      {/* Seller Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-6">
        <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#b12704]"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Sales Revenue</span>
              <span className="text-2xl font-bold text-zinc-950 mt-1.5">${totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2 bg-red-50 rounded-sm text-[#b12704] border border-red-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">
            Updated just now
          </div>
        </div>

        <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Inventory Products</span>
              <span className="text-2xl font-bold text-zinc-950 mt-1.5">{sellerProductCount}</span>
            </div>
            <div className="p-2 bg-sky-50 rounded-sm text-sky-600 border border-sky-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">
            Visible on global storefront
          </div>
        </div>

        <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Store Catalog Pageviews</span>
              <span className="text-2xl font-bold text-zinc-950 mt-1.5">0</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-sm text-emerald-600 border border-emerald-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">
            No catalog views recorded
          </div>
        </div>

        <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Pending Shipments</span>
              <span className="text-2xl font-bold text-zinc-950 mt-1.5">0</span>
            </div>
            <div className="p-2 bg-violet-50 rounded-sm text-violet-600 border border-violet-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">
            No shipping orders pending
          </div>
        </div>
      </div>

      {/* NEW PRODUCT REGISTRATION FORM */}
      {showAddForm && (
        <div className="bg-white border border-zinc-200 rounded-sm shadow-xs p-6 mb-6">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-5">
            <div>
              <h3 className="font-bold text-base text-zinc-950">Register New Catalog Listing</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Enter product features and details below. Values will sync to customer storefront.</p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-xs font-semibold">
                ⚠ {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-800 text-xs font-semibold">
                ✓ {formSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Product Name / Title</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g., Ultra-Crisp OLED 4K Display"
                  className="w-full text-xs p-2 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Unit Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  placeholder="e.g., 299.99"
                  className="w-full text-xs p-2 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Product Category</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => {
                    setNewProdCategory(e.target.value as Product['category']);
                    setNewProdSubcategory('');
                  }}
                  className="w-full text-xs p-2 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 outline-hidden"
                >
                  <option value="">-- Choose Category --</option>
                  {Object.keys(CATEGORY_SUBCATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Product Subcategory</label>
                <select
                  value={newProdSubcategory}
                  onChange={(e) => setNewProdSubcategory(e.target.value)}
                  disabled={!newProdCategory}
                  className="w-full text-xs p-2 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 outline-hidden disabled:bg-zinc-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- Choose Subcategory --</option>
                  {newProdCategory &&
                    CATEGORY_SUBCATEGORIES[newProdCategory].map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Upload Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="w-full text-xs p-1 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 outline-hidden"
              />
              {newProdImage && (
                <div className="mt-3.5 p-2 bg-zinc-50 border border-zinc-200 rounded-sm inline-block">
                  <span className="text-[10px] font-bold text-zinc-500 block mb-1">Image Preview:</span>
                  <img src={newProdImage} alt="Preview" className="h-24 object-contain rounded-sm" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Detailed Description</label>
              <textarea
                value={newProdDesc}
                onChange={(e) => setNewProdDesc(e.target.value)}
                placeholder="Include specifications, materials, sizing, and key features..."
                rows={4}
                className="w-full text-xs p-2 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="amazon-btn-secondary px-5 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="amazon-btn-primary px-6 py-2 text-xs font-semibold"
              >
                List Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT PRODUCT LISTING FORM */}
      {editingProduct && (
        <div className="bg-[#fcf8e3] border border-[#faebcc] rounded-sm shadow-xs p-6 mb-6 text-zinc-900">
          <div className="flex justify-between items-center border-b border-[#faebcc] pb-3 mb-5">
            <div>
              <h3 className="font-bold text-base text-[#8a6d3b]">Edit Product Listing: "{editingProduct.name}"</h3>
              <p className="text-xs text-[#8a6d3b]/85 mt-0.5">Make updates to your active seller catalog item. Changes synchronize instantly.</p>
            </div>
            <button
              onClick={() => setEditingProduct(null)}
              className="p-1 rounded hover:bg-[#faebcc]/50 text-[#8a6d3b] cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleEditProductSubmit} className="space-y-4">
            {editFormError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-xs font-semibold">
                ⚠ {editFormError}
              </div>
            )}
            {editFormSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-800 text-xs font-semibold">
                ✓ {editFormSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Product Name / Title</label>
                <input
                  type="text"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Unit Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editProdPrice}
                  onChange={(e) => setEditProdPrice(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Product Category</label>
                <select
                  value={editProdCategory}
                  onChange={(e) => {
                    setEditProdCategory(e.target.value as Product['category']);
                    setEditProdSubcategory('');
                  }}
                  className="w-full text-xs p-2 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 outline-hidden"
                >
                  <option value="">-- Choose Category --</option>
                  {Object.keys(CATEGORY_SUBCATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Product Subcategory</label>
                <select
                  value={editProdSubcategory}
                  onChange={(e) => setEditProdSubcategory(e.target.value)}
                  disabled={!editProdCategory}
                  className="w-full text-xs p-2 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 outline-hidden disabled:bg-zinc-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- Choose Subcategory --</option>
                  {editProdCategory &&
                    CATEGORY_SUBCATEGORIES[editProdCategory].map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Replace Product Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleEditImageFileChange}
                className="w-full text-xs p-1 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 outline-hidden"
              />
              {editProdImage && (
                <div className="mt-3.5 p-2 bg-zinc-50 border border-zinc-200 rounded-sm inline-block">
                  <span className="text-[10px] font-bold text-zinc-500 block mb-1">Image Preview:</span>
                  <img src={editProdImage} alt="Preview" className="h-24 object-contain rounded-sm" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase">Detailed Description</label>
              <textarea
                value={editProdDesc}
                onChange={(e) => setEditProdDesc(e.target.value)}
                rows={4}
                className="w-full text-xs p-2 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#faebcc]">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="amazon-btn-secondary px-5 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="amazon-btn-primary px-6 py-2 text-xs font-semibold"
              >
                Update Listing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Seller Products Catalog Table List */}
      <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
          <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider">Active Inventory Catalog</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded-full">{sellerProducts.length} Listings</span>
        </div>

        <div className="overflow-x-auto">
          {sellerProducts.length === 0 ? (
            <div className="text-center py-20 text-zinc-400 text-xs flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-zinc-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              No active product listings in your store registry.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                  <th className="px-5 py-3">Product Name & Category</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Inventory Stock</th>
                  <th className="px-5 py-3">SKU Identifier</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellerProducts.map((product) => {
                  const isStockCriticallyLow = (product.stock || 0) < 10;
                  const stockBadge = isStockCriticallyLow ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100';
                  const stockText = isStockCriticallyLow ? `Low Stock (${product.stock})` : `Healthy (${product.stock})`;
                  const sku = product.sku || 'N/A';

                  return (
                    <tr key={product.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-contain bg-zinc-50 border border-zinc-200 p-0.5 rounded-sm"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-950 truncate max-w-[280px]">{product.name}</div>
                          <div className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                            {product.category}
                            {product.subcategory && ` > ${product.subcategory}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#b12704]">${product.price.toFixed(2)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold ${stockBadge}`}>
                          {stockText}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-zinc-400">{sku}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="px-2.5 py-1 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50 border border-zinc-300 rounded transition-all cursor-pointer active:scale-95 shadow-2xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:text-white border border-red-200 hover:bg-red-600 hover:border-red-600 rounded transition-all cursor-pointer active:scale-95 shadow-2xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
