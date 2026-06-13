import React, { useState, useMemo, useEffect } from 'react';
import apiClient from '../services/api';

interface Product {
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

const CATEGORY_SUBCATEGORIES: Record<Product['category'], string[]> = {
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

export const Homepage: React.FC<HomepageProps> = ({ userEmail, onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc' | 'rating'>('default');
  
  // Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Wishlist state
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('wishlist_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showWishlist, setShowWishlist] = useState(false);

  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev;
      }
      const updated = [...prev, product];
      localStorage.setItem('wishlist_items', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromWishlist = (productId: string | number) => {
    setWishlist((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      localStorage.setItem('wishlist_items', JSON.stringify(updated));
      return updated;
    });
  };
  
  // Product Detail Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Active dashboard view tab state
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller' | 'admin'>('buyer');

  // Admin dashboard metrics state
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Seller metrics and dashboard data state
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

  // Buyer storefront products pagination states
  const [buyerPage, setBuyerPage] = useState(1);
  const [buyerTotalPages, setBuyerTotalPages] = useState(1);
  const [buyerTotalCount, setBuyerTotalCount] = useState(0);
  const [loadingStorefront, setLoadingStorefront] = useState(false);
  const [storefrontError, setStorefrontError] = useState<string | null>(null);

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

  // Check if user is admin from JWT token
  const isAdmin = useMemo(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return false;
      const payload = JSON.parse(window.atob(payloadBase64));
      return !!payload.is_super_user || (payload.user_permissions || []).includes('dashboard:view');
    } catch (e) {
      console.error('Failed to parse token payload:', e);
      return false;
    }
  }, []);

  // Check if user is seller from JWT token
  const isSeller = useMemo(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return false;
      const payload = JSON.parse(window.atob(payloadBase64));
      // Sellers have product:create permission or is admin
      return (payload.user_permissions || []).includes('product:create') || !!payload.is_super_user;
    } catch (e) {
      console.error('Failed to parse token payload:', e);
      return false;
    }
  }, []);

  // Local state for deleted product IDs to persist deletion on frontend reload
  const [deletedProductIds, setDeletedProductIds] = useState<(string | number)[]>(() => {
    try {
      const saved = localStorage.getItem('deleted_product_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDeleteProduct = async (productId: string | number) => {
    try {
      await apiClient.delete(`/product/${productId}`);
      
      // Also maintain client-side local overrides for robust resilience
      const updatedDeletedIds = [...deletedProductIds, productId];
      setDeletedProductIds(updatedDeletedIds);
      localStorage.setItem('deleted_product_ids', JSON.stringify(updatedDeletedIds));
      
      setProducts(prev => prev.filter(p => p.id !== productId));
      setSellerProducts(prev => prev.filter(p => p.id !== productId));
      
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(null);
      }
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
    setShowAddForm(false); // Close add form if open
    
    // Smooth scroll to top where the edit form will render
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

      // Update in local state
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));
      setSellerProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));

      // Save update override in localStorage
      try {
        const savedEdited = localStorage.getItem('edited_products');
        const editedProducts: Record<string | number, Product> = savedEdited ? JSON.parse(savedEdited) : {};
        editedProducts[editingProduct.id] = updatedProduct;
        localStorage.setItem('edited_products', JSON.stringify(editedProducts));
      } catch (err) {
        console.error('Failed to save edited product to localStorage:', err);
      }

      setEditFormSuccess('Product listing updated successfully!');
      
      // Refresh the seller data to sync completely
      fetchSellerData();

      setTimeout(() => {
        setEditFormSuccess(null);
        setEditingProduct(null);
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'An error occurred while updating the product';
      setEditFormError(msg);
    }
  };

  // Set default view on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'seller' && isSeller) {
      setActiveTab('seller');
    } else if (tabParam === 'admin' && isAdmin) {
      setActiveTab('admin');
    } else if (tabParam === 'buyer') {
      setActiveTab('buyer');
    } else {
      if (isAdmin) {
        setActiveTab('admin');
      } else if (isSeller) {
        setActiveTab('seller');
      } else {
        setActiveTab('buyer');
      }
    }
  }, [isAdmin, isSeller]);

  const fetchStorefrontProducts = async (page = 1, limit = 50) => {
    setLoadingStorefront(true);
    setStorefrontError(null);
    try {
      const response = await apiClient.get(`/dashboard/?page=${page}&limit=${limit}`);
      if (response.data && response.data.success) {
        const payload = response.data.data;
        const rawProducts = payload.products || [];
        const mappedProducts = rawProducts.map((item: any) => {
          return {
            id: item.id,
            name: item.name || 'Unnamed Product',
            price: parseFloat(item.price) || 0.0,
            category: item.category || 'Electronics',
            subcategory: item.subcategory || '',
            rating: parseFloat(item.rating) || 5.0,
            image: item.image_url || item.image || 'https://picsum.photos/id/120/400/300',
            description: item.description || '',
            sku: item.sku || '',
            stock: item.stock !== undefined ? item.stock : 50
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

        setProducts(filteredMappedProducts);
        setBuyerPage(payload.page || page);
        setBuyerTotalPages(payload.total_pages || 1);
        setBuyerTotalCount(payload.total_count || 0);
      } else {
        setStorefrontError(response.data?.message || 'Failed to load products');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'An error occurred while fetching storefront products';
      setStorefrontError(msg);
    } finally {
      setLoadingStorefront(false);
    }
  };

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
        
        // Sync with general storefront products so they are visible to buyers
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newUnique = filteredMappedProducts.filter((p: Product) => !existingIds.has(p.id));
          const combined = [...newUnique, ...prev];
          return combined
            .filter((p: Product) => !deletedIds.includes(p.id))
            .map((p: Product) => {
              if (editedProducts[p.id]) {
                return { ...p, ...editedProducts[p.id] };
              }
              return p;
            });
        });
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
    if (activeTab === 'admin' && isAdmin) {
      fetchMetrics();
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab === 'seller' && isSeller) {
      fetchSellerData();
    }
  }, [activeTab, isSeller]);

  useEffect(() => {
    if (activeTab === 'buyer') {
      fetchStorefrontProducts(buyerPage);
    }
  }, [activeTab, buyerPage]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (sortBy === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string | number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string | number, change: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + change;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Format Amazon style price display
  const formatAmazonPrice = (price: number) => {
    const parts = price.toFixed(2).split('.');
    return {
      dollars: parts[0],
      cents: parts[1]
    };
  };

  const renderAdminDashboard = () => {
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

  const renderSellerDashboard = () => {
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
            Return to Store
          </button>
        </div>
      );
    }

    if (loadingSellerMetrics && sellerProducts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-32 text-center min-h-[300px]">
          <div className="w-10 h-10 border-4 border-[#febd69] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-xs font-semibold mt-4">Connecting to seller portal...</span>
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

    const handleAddProductSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      setFormSuccess(null);

      if (!newProdName.trim() || !newProdPrice || !newProdCategory || !newProdSubcategory || !newProdDesc.trim() || !newProdImage) {
        setFormError('All fields are required. Please upload an image file, select a category/subcategory, and fill in the title, price, and description.');
        return;
      }

      const parsedPrice = parseFloat(newProdPrice);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        setFormError('Please enter a valid positive price.');
        return;
      }

      try {
        const response = await apiClient.post('/product', {
          name: newProdName.trim(),
          price: parsedPrice,
          description: newProdDesc.trim(),
          category: newProdCategory,
          subcategory: newProdSubcategory,
          image_url: newProdImage
        });

        // Determine created product values from response
        const resData = response.data?.data || response.data || {};
        const newId = resData.id || products.length + 1;
        const sku = resData.sku || `SKU-${(newProdCategory as string).substring(0,3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        const stock = resData.stock !== undefined ? resData.stock : 50;

        const newProduct: Product = {
          id: newId,
          name: newProdName.trim(),
          price: parsedPrice,
          category: newProdCategory as Product['category'],
          subcategory: newProdSubcategory,
          rating: 5.0,
          image: newProdImage,
          description: newProdDesc.trim(),
          sku: sku,
          stock: stock
        };

        setProducts(prev => [newProduct, ...prev]);
        setSellerProducts(prev => [newProduct, ...prev]);
        setFormSuccess('Product listed successfully in catalog!');
        
        // Clear form
        setNewProdName('');
        setNewProdPrice('');
        setNewProdCategory('');
        setNewProdSubcategory('');
        setNewProdImage('');
        setNewProdDesc('');

        // Trigger a fresh fetch from /dashboard/seller to sync with database changes
        fetchSellerData();

        setTimeout(() => {
          setFormSuccess(null);
          setShowAddForm(false);
        }, 1500);
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'An error occurred while listing the product on the storefront';
        setFormError(msg);
      }
    };

    return (
      <div className="max-w-[1500px] mx-auto px-4 mt-6 animate-fade-in text-left">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Amazon Seller Central</h2>
            <p className="text-xs text-zinc-500 mt-1">Manage listings, analyze sales, and add new items to the storefront catalog.</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#febd69] hover:bg-[#f3a847] text-zinc-900 rounded shadow-sm border border-zinc-400/50 transition-all cursor-pointer active:scale-98"
          >
            {showAddForm ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                List New Product
              </>
            )}
          </button>
        </div>

        {/* Add Product Form Collapse */}
        {showAddForm && (
          <div className="bg-white border border-zinc-200 rounded-sm p-6 mb-6 shadow-xs animate-fade-in max-w-2xl">
            <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider mb-4 border-b border-zinc-200 pb-2">
              List a New Catalog Product
            </h3>
            
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded text-xs mb-4">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded text-xs mb-4">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Ergonomic Bluetooth Mouse"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="bg-zinc-50 border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Category *</label>
                <select
                  value={newProdCategory}
                  onChange={(e: any) => {
                    const cat = e.target.value;
                    setNewProdCategory(cat);
                    setNewProdSubcategory('');
                  }}
                  className="bg-zinc-50 border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                  required
                >
                  <option value="">-- Select Category --</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Home">Home</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Subcategory *</label>
                <select
                  value={newProdSubcategory}
                  onChange={(e) => setNewProdSubcategory(e.target.value)}
                  disabled={!newProdCategory}
                  className="bg-zinc-50 border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:bg-white cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">
                    {newProdCategory ? '-- Select Subcategory --' : '-- Select Category First --'}
                  </option>
                  {newProdCategory &&
                    CATEGORY_SUBCATEGORIES[newProdCategory as Product['category']].map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 29.99"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="bg-zinc-50 border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Product Image *</label>
                <div className="flex flex-col sm:flex-row gap-4 items-center mt-1">
                  <label className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-white border border-zinc-300 rounded hover:bg-zinc-50 text-zinc-700 cursor-pointer text-center shadow-2xs transition-colors">
                    Select Image from Storage
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      required={!newProdImage}
                    />
                  </label>
                  {newProdImage && (
                    <div className="flex items-center gap-3">
                      <img
                        src={newProdImage}
                        alt="Preview"
                        className="w-12 h-12 object-contain bg-zinc-50 border border-zinc-200 p-0.5 rounded-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setNewProdImage('')}
                        className="text-red-600 hover:text-red-800 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Product Description *</label>
                <textarea
                  rows={3}
                  placeholder="Detail the key features, warranty details, and specifications..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="bg-zinc-50 border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:bg-white resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="sm:col-span-2 bg-[#febd69] hover:bg-[#f3a847] text-zinc-900 font-bold py-2.5 text-xs rounded shadow-xs mt-2 border border-zinc-400/50 cursor-pointer active:scale-[0.99] transition-all"
              >
                Submit Listing to Storefront
              </button>
            </form>
          </div>
        )}

        {/* Edit Product Form Collapse */}
        {editingProduct && (
          <div className="bg-white border border-zinc-200 rounded-sm p-6 mb-6 shadow-xs animate-fade-in max-w-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-200 pb-2">
              <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider">
                Edit Catalog Product: {editingProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-zinc-400 hover:text-zinc-600 font-semibold text-xs flex items-center gap-0.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
            
            {editFormError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded text-xs mb-4">
                {editFormError}
              </div>
            )}

            {editFormSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded text-xs mb-4">
                {editFormSuccess}
              </div>
            )}

            <form onSubmit={handleEditProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Ergonomic Bluetooth Mouse"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="bg-zinc-50 border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Category *</label>
                <select
                  value={editProdCategory}
                  onChange={(e: any) => {
                    const cat = e.target.value;
                    setEditProdCategory(cat);
                    setEditProdSubcategory('');
                  }}
                  className="bg-zinc-50 border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                  required
                >
                  <option value="">-- Select Category --</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Home">Home</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Subcategory *</label>
                <select
                  value={editProdSubcategory}
                  onChange={(e) => setEditProdSubcategory(e.target.value)}
                  disabled={!editProdCategory}
                  className="bg-zinc-50 border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:bg-white cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">
                    {editProdCategory ? '-- Select Subcategory --' : '-- Select Category First --'}
                  </option>
                  {editProdCategory &&
                    CATEGORY_SUBCATEGORIES[editProdCategory as Product['category']].map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 29.99"
                  value={editProdPrice}
                  onChange={(e) => setEditProdPrice(e.target.value)}
                  className="bg-zinc-50 border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Product Image *</label>
                <div className="flex flex-col sm:flex-row gap-4 items-center mt-1">
                  <label className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-white border border-zinc-300 rounded hover:bg-zinc-50 text-zinc-700 cursor-pointer text-center shadow-2xs transition-colors">
                    Update Image from Storage
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageFileChange}
                      className="hidden"
                    />
                  </label>
                  {editProdImage && (
                    <div className="flex items-center gap-3">
                      <img
                        src={editProdImage}
                        alt="Preview"
                        className="w-12 h-12 object-contain bg-zinc-50 border border-zinc-200 p-0.5 rounded-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setEditProdImage('')}
                        className="text-red-600 hover:text-red-800 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Product Description *</label>
                <textarea
                  rows={3}
                  placeholder="Detail the key features, warranty details, and specifications..."
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  className="bg-zinc-50 border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:bg-white resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="sm:col-span-2 bg-[#febd69] hover:bg-[#f3a847] text-zinc-900 font-bold py-2.5 text-xs rounded shadow-xs mt-2 border border-zinc-400/50 cursor-pointer active:scale-[0.99] transition-all"
              >
                Save Changes to Listing
              </button>
            </form>
          </div>
        )}

        {/* Analytics Statistics Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-6">
          {/* Total Store Revenue */}
          <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Store Sales Revenue</span>
                <span className="text-2xl font-bold text-zinc-950 mt-1.5">$0.00</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-sm text-amber-600 border border-amber-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-[10px] text-zinc-500 mt-2">
              From user catalog purchases
            </div>
          </div>

          {/* Active Listings */}
          <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500"></div>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Your Active Listings</span>
                <span className="text-2xl font-bold text-zinc-950 mt-1.5">{sellerProducts.length}</span>
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

          {/* Store Pageviews */}
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

          {/* Pending Shipments */}
          <div className="bg-white p-5 border border-zinc-200 rounded-sm shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Fulfillments Pending</span>
                <span className="text-2xl font-bold text-zinc-950 mt-1.5">0</span>
              </div>
              <div className="p-2 bg-red-50 rounded-sm text-red-600 border border-red-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="text-[10px] text-zinc-500 mt-2">
              No pending shipments
            </div>
          </div>
        </div>

        {/* Listings Inventory Table */}
        <div className="bg-white border border-zinc-200 rounded-sm shadow-2xs flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50">
            <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4.5 h-4.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Your Active Inventory Catalog
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock Level</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellerProducts.map((product) => {
                  const sku = product.sku || `SKU-EL-${typeof product.id === 'number' ? product.id * 13 + 104 : product.id.toString().slice(0, 6)}`;
                  const stock = product.stock !== undefined ? product.stock : 25;
                  
                  let stockBadge = 'text-green-700 font-bold bg-green-50 border border-green-100';
                  let stockText = `In Stock (${stock})`;

                  if (stock === 0) {
                    stockBadge = 'text-red-700 font-bold bg-red-50 border border-red-100';
                    stockText = 'Out of Stock';
                  } else if (stock < 10) {
                    stockBadge = 'text-amber-700 font-bold bg-amber-50 border border-amber-100';
                    stockText = `Low Stock (${stock})`;
                  }

                  return (
                    <tr key={product.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-3 flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-contain bg-zinc-50 border border-zinc-200 p-0.5 rounded-sm"
                        />
                        <span className="font-bold text-zinc-900 truncate max-w-[280px]">
                          {product.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 font-medium">
                        <div className="font-semibold">{product.category}</div>
                        {product.subcategory && (
                          <div className="text-[10px] text-zinc-400 font-normal mt-0.5">{product.subcategory}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#b12704]">${product.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${stockBadge}`}>
                          {stockText}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-zinc-400">{sku}</td>
                      <td className="px-5 py-3 text-right">
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
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans pb-16">
      
      {/* Amazon Navigation Header */}
      <header className="bg-[#131921] text-white flex flex-col z-30 relative">
        <div className="flex items-center justify-between px-4 py-2 gap-4 flex-wrap lg:flex-nowrap">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center p-1 border border-transparent hover:border-white rounded-sm cursor-pointer select-none"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSortBy('default');
            }}
          >
            <svg className="w-24 h-7 text-white" viewBox="0 0 100 30" fill="currentColor">
              <path d="M13.2 12c-1.3-.2-2.6-.3-3.9-.3-1.6 0-3.2.2-4.5.7C3.5 13 2.8 13.9 2.8 15c0 1.9 1.8 3 4.2 3 1.8 0 3.3-.6 4.4-1.6V12.1v-.1zm8.3 5.4c0 1.2.2 2.4.5 3.3.2.6.4 1 .7 1.2.2.2.5.3.8.3h.1c.3 0 .7-.2 1-.5.3-.3.6-.8.8-1.4l1.6.4c-.4 1.2-.9 2.1-1.6 2.8-.7.7-1.7 1-2.9 1-1.2 0-2.1-.4-2.8-1.2-.6-.8-.9-1.9-.9-3.3v-9.6H17.4v-1.9H19V8.6l2.5-.7v1.8h2.8v1.9H21.5v7.8zm11.7-8.1l.1 2.3c.7-.9 1.5-1.6 2.4-2 1-.5 2.1-.7 3.3-.7 1.8 0 3.2.5 4.2 1.5 1 1 1.5 2.5 1.5 4.5v6.5h-2.6v-6c0-1.2-.3-2.1-.8-2.6-.5-.5-1.3-.8-2.3-.8-1 0-1.8.3-2.5.9-.7.6-1.1 1.4-1.3 2.5v6h-2.6v-14h2.6v2zm24.6 2.1c-.9-.7-2.1-1-3.6-1-1.6 0-2.9.4-4 1.2-1.1.8-1.7 1.9-1.8 3.3h2.6c.1-.8.4-1.3.9-1.7.5-.4 1.2-.6 2.2-.6.9 0 1.6.2 2.1.5.5.3.7.8.7 1.4v.9c-1-.1-2.1-.2-3.3-.2-2.2 0-3.9.4-5 1.3-1.1.9-1.6 2.1-1.6 3.7 0 1.5.5 2.7 1.4 3.5 1 .8 2.3 1.2 3.9 1.2 1.6 0 2.9-.4 3.8-1.2.9-.8 1.4-1.7 1.6-2.7l.1 1h2.5V17c.2-2.1-.3-3.7-1.3-4.7-.9-1-2.5-1.5-4.7-1.5z" />
              <path d="M72.2 9.3c-1.3 0-2.5.2-3.6.7-1.1.5-2 1.1-2.7 2-.7-.9-1.6-1.5-2.7-2-1.1-.5-2.3-.7-3.6-.7-2.2 0-3.9.7-5.1 2-1.2 1.3-1.8 3.2-1.8 5.6 0 2.4.6 4.3 1.8 5.6 1.2 1.3 2.9 2 5.1 2 1.3 0 2.5-.2 3.6-.7 1.1-.5 2-1.1 2.7-2 .7.9 1.6 1.5 2.7 2 1.1.5 2.3.7 3.6.7 2.2 0 3.9-.7 5.1-2 1.2-1.3 1.8-3.2 1.8-5.6 0-2.4-.6-4.3-1.8-5.6-1.2-1.3-2.9-2-5.1-2zm-12.7 8.3c0 1.5-.3 2.7-.9 3.4-.6.7-1.4 1.1-2.4 1.1-1 0-1.8-.4-2.4-1.1-.6-.7-.9-1.9-.9-3.4s.3-2.7.9-3.4c.6-.7 1.4-1.1 2.4-1.1 1 0 1.8.4 2.4 1.1.6.7.9 1.9.9 3.4zm12.7 0c0 1.5-.3 2.7-.9 3.4-.6.7-1.4 1.1-2.4 1.1-1 0-1.8-.4-2.4-1.1-.6-.7-.9-1.9-.9-3.4s.3-2.7.9-3.4c.6-.7 1.4-1.1 2.4-1.1 1 0 1.8.4 2.4 1.1.6.7.9 1.9.9 3.4zM86.8 9.3c-1.3 0-2.5.2-3.6.7-1.1.5-2 1.1-2.7 2v-2.4h-2.5v14.1h2.5v-7.8c0-1.2.3-2.1.8-2.6.5-.5 1.3-.8 2.3-.8 1 0 1.8.3 2.5.9.7.6 1.1 1.4 1.3 2.5v7.8h2.6v-8.9c0-1.8-.5-3.3-1.4-4.3-.9-1-2.3-1.5-4.2-1.5z" />
              <path d="M12.8 24.1c11.2 4.4 26.2 6.7 41.2 6.7 12 0 24-1.5 34.6-4.6l.8 2c-11 3.2-23.4 4.8-35.4 4.8-15.4 0-30.8-2.3-42.3-6.9l.1-2z" fill="#f5a623" />
              <path d="M91.3 22c-.5.3-.9.6-1.5.9-.6.3-1.3.5-2 .7h-.1l-.1-.2.4-.8.5-.8.5-.8c.2-.3.4-.6.6-1l.5.2c-.2.6-.4 1.2-.5 1.8h.3c.3-.1.6-.2.9-.3.3-.1.6-.2.8-.4h.1l.1.3z" fill="#f5a623" />
            </svg>
          </div>

          {/* Delivery Location Indicator */}
          <div className="hidden sm:flex items-center gap-1 p-1 border border-transparent hover:border-white rounded-sm cursor-pointer select-none text-xs">
            <svg className="w-4 h-4 shrink-0 mt-2 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-zinc-300">Deliver to</span>
              <span className="font-bold">India</span>
            </div>
          </div>

          {/* Amazon Search Bar */}
          <div className="flex flex-1 items-stretch rounded-md overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-amber-500">
            {/* Category Dropdown */}
            <select
              className="bg-zinc-100 text-zinc-700 text-xs px-3 border-r border-zinc-300 rounded-l-md outline-none cursor-pointer hover:bg-zinc-200"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Apparel">Apparel</option>
              <option value="Home">Home</option>
              <option value="Fitness">Fitness</option>
              <option value="Accessories">Accessories</option>
            </select>
            
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search Amazon Store Products..."
              className="flex-1 bg-white px-3 text-sm text-zinc-900 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {/* Search Button */}
            <button className="bg-[#febd69] hover:bg-[#f3a847] text-zinc-900 px-6 flex items-center justify-center cursor-pointer transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Account Lists & Session Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex flex-col text-left p-1 border border-transparent hover:border-white rounded-sm cursor-pointer select-none text-xs">
              <span className="text-[10px] text-zinc-300">Hello, {userEmail.split('@')[0] || 'Sign in'}</span>
              <span className="font-bold flex items-center gap-1">
                Account & Lists
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21l-12-18h24z" />
                </svg>
              </span>
            </div>
            
            <div className="hidden md:flex flex-col text-left p-1 border border-transparent hover:border-white rounded-sm cursor-pointer select-none text-xs">
              <span className="text-[10px] text-zinc-300">Returns</span>
              <span className="font-bold">& Orders</span>
            </div>

            {/* Wishlist Button */}
            <div 
              className="flex items-center gap-1.5 p-1 border border-transparent hover:border-white rounded-sm cursor-pointer select-none relative"
              onClick={() => setShowWishlist(true)}
            >
              <div className="relative flex items-center">
                <span className="absolute -top-2 left-3.5 text-orange-500 bg-transparent text-sm font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="font-bold text-xs mt-3 hidden sm:inline">Wishlist</span>
            </div>

            {/* Cart Button */}
            <div 
              className="flex items-center gap-1.5 p-1 border border-transparent hover:border-white rounded-sm cursor-pointer select-none relative"
              onClick={() => setShowCart(true)}
            >
              <div className="relative flex items-center">
                <span className="absolute -top-2 left-3.5 text-orange-500 bg-transparent text-sm font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="font-bold text-xs mt-3 hidden sm:inline">Cart</span>
            </div>

            {/* Logout Trigger */}
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-sm bg-[#eaeded] hover:bg-[#d8dee6] text-[#0f1111] text-xs font-semibold border border-zinc-400 transition-all"
            >
              Logout
            </button>
          </div>

        </div>
        
      </header>

      {/* Sub-Navigation Header Bar */}
      {(isAdmin || isSeller) && (
        <div className="bg-[#232f3e] text-white px-4 py-1.5 flex items-center justify-between text-xs font-semibold select-none border-b border-[#19222d] shadow-sm">
          <div className="flex items-center gap-5">
            <button
              onClick={() => window.location.href = '/?tab=buyer'}
              className={`py-1 px-3.5 rounded-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'buyer'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-inner'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/40 border border-transparent'
              }`}
            >
              <svg className="w-4.5 h-4.5 text-[#febd69]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Storefront
            </button>
            
            {isSeller && (
              <button
                onClick={() => window.location.href = '/?tab=seller'}
                className={`py-1 px-3.5 rounded-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'seller'
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-inner'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <svg className="w-4.5 h-4.5 text-[#febd69]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V21M3 6h18" />
                </svg>
                Seller Portal
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => window.location.href = '/?tab=admin'}
                className={`py-1 px-3.5 rounded-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-inner'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <svg className="w-4.5 h-4.5 text-[#febd69]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin Console
              </button>
            )}
          </div>
          
          <div className="hidden sm:block text-zinc-300 font-normal text-[11px]">
            {activeTab === 'admin' ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Admin Console Connected
              </span>
            ) : activeTab === 'seller' ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Seller Central Active
              </span>
            ) : (
              <span>Prime Store Mode</span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'buyer' ? (
        <>
          {/* Hero Banner Promo Section */}
      <div className="max-w-[1500px] mx-auto px-4 mt-4 relative">
        <div className="bg-gradient-to-r from-cyan-800 to-indigo-900 rounded-lg p-8 md:p-12 text-white shadow-md flex flex-col justify-center min-h-[220px] relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-25 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-yellow-400 via-transparent to-transparent hidden lg:block"></div>
          
          <div className="max-w-xl relative z-10 text-left">
            <span className="bg-[#febd69] text-zinc-900 font-bold text-xs px-2.5 py-1 rounded-sm uppercase tracking-wider">
              Exclusive Prime Day Savings
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3 text-white">
              Upgrade your home and office setup.
            </h2>
            <p className="text-zinc-200 text-sm mt-2 leading-relaxed">
              Unlock savings on all selected products. Fast, free delivery with Prime memberships.
            </p>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setSelectedCategory('Electronics')}
                className="amazon-btn-primary py-2 px-5 text-xs font-semibold rounded-md"
              >
                Shop Electronics
              </button>
              <button 
                onClick={() => setSelectedCategory('Apparel')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2 px-5 text-xs font-semibold rounded-md"
              >
                Trending Apparel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Card Multi-Category Grid Section */}
      <div className="max-w-[1500px] mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Box 1 */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs flex flex-col justify-between text-left">
            <div>
              <h3 className="font-bold text-base text-zinc-900 mb-3">Up to 40% off electronics</h3>
              <div className="h-32 bg-zinc-100 rounded-sm overflow-hidden mb-3">
                <img src="https://picsum.photos/id/111/300/200" alt="Tech" className="w-full h-full object-cover" />
              </div>
            </div>
            <span 
              onClick={() => setSelectedCategory('Electronics')}
              className="text-xs text-[#007185] hover:text-orange-700 hover:underline cursor-pointer font-semibold mt-2 block"
            >
              Shop now
            </span>
          </div>

          {/* Box 2 */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs flex flex-col justify-between text-left">
            <div>
              <h3 className="font-bold text-base text-zinc-900 mb-3">Latest fashion apparel</h3>
              <div className="h-32 bg-zinc-100 rounded-sm overflow-hidden mb-3">
                <img src="https://picsum.photos/id/117/300/200" alt="Apparel" className="w-full h-full object-cover" />
              </div>
            </div>
            <span 
              onClick={() => setSelectedCategory('Apparel')}
              className="text-xs text-[#007185] hover:text-orange-700 hover:underline cursor-pointer font-semibold mt-2 block"
            >
              Shop now
            </span>
          </div>

          {/* Box 3 */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs flex flex-col justify-between text-left">
            <div>
              <h3 className="font-bold text-base text-zinc-900 mb-3">Home & kitchen essentials</h3>
              <div className="h-32 bg-zinc-100 rounded-sm overflow-hidden mb-3">
                <img src="https://picsum.photos/id/114/300/200" alt="Home" className="w-full h-full object-cover" />
              </div>
            </div>
            <span 
              onClick={() => setSelectedCategory('Home')}
              className="text-xs text-[#007185] hover:text-orange-700 hover:underline cursor-pointer font-semibold mt-2 block"
            >
              Shop now
            </span>
          </div>

          {/* Box 4 */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs flex flex-col justify-between text-left">
            <div>
              <h3 className="font-bold text-base text-zinc-900 mb-3">Premium fitness accessories</h3>
              <div className="h-32 bg-zinc-100 rounded-sm overflow-hidden mb-3">
                <img src="https://picsum.photos/id/118/300/200" alt="Fitness" className="w-full h-full object-cover" />
              </div>
            </div>
            <span 
              onClick={() => setSelectedCategory('Fitness')}
              className="text-xs text-[#007185] hover:text-orange-700 hover:underline cursor-pointer font-semibold mt-2 block"
            >
              Shop now
            </span>
          </div>

        </div>
      </div>

      {/* Main Grid Catalog & Filters */}
      <div className="max-w-[1500px] mx-auto px-4 mt-6">
        
        {/* Sorting and result summary */}
        <div className="bg-white border border-zinc-200 p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-sm text-left">
          <div className="text-sm font-semibold text-zinc-700">
            Showing {filteredProducts.length} {buyerTotalCount > 0 && `of ${buyerTotalCount}`} results for category: <span className="text-[#007185] font-bold">{selectedCategory}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 text-xs">Sort by:</span>
            <select
              className="bg-zinc-50 border border-zinc-300 rounded-md px-2.5 py-1 text-xs outline-none cursor-pointer"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
            >
              <option value="default">Featured</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="rating">Avg. Customer Review</option>
            </select>
          </div>
        </div>

        {/* Product Cards Container Grid */}
        {loadingStorefront ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-zinc-200 rounded-sm shadow-xs">
            <div className="w-10 h-10 border-4 border-[#febd69] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 text-xs mt-3 font-semibold">Loading storefront products...</p>
          </div>
        ) : storefrontError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm p-4 text-center">
            {storefrontError}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-zinc-200 rounded-sm">
            <svg className="w-16 h-16 text-zinc-400 mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-zinc-800">No matches found</h3>
            <p className="text-zinc-500 text-xs mt-1">Try updating search queries or resetting category tags.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const formattedPrice = formatAmazonPrice(p.price);
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-zinc-200 rounded-sm p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 relative text-left"
                  >
                    <div>
                      {/* Category Label */}
                      <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5 flex items-center gap-1 flex-wrap">
                        <span>{p.category}</span>
                        {p.subcategory && (
                          <>
                            <span className="text-zinc-300 font-normal">›</span>
                            <span className="text-zinc-400 font-semibold">{p.subcategory}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Image */}
                      <div 
                        className="h-44 w-full bg-zinc-50 flex items-center justify-center overflow-hidden mb-3.5 cursor-pointer rounded-sm"
                        onClick={() => setSelectedProduct(p)}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain hover:scale-103 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      {/* Product Title */}
                      <h4 
                        className="text-sm font-medium text-zinc-950 line-clamp-2 leading-relaxed hover:text-orange-700 cursor-pointer"
                        onClick={() => setSelectedProduct(p)}
                      >
                        {p.name}
                      </h4>

                      {/* Ratings Section */}
                      <div className="flex items-center gap-1 mt-2.5">
                        <div className="flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <svg
                              key={idx}
                              className={`w-3.5 h-3.5 ${
                                idx < Math.floor(p.rating) ? 'fill-current' : 'stroke-current text-zinc-300 fill-none'
                              }`}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-[#007185] hover:text-orange-700 cursor-pointer">{p.rating}</span>
                      </div>

                      {/* Prime Indicator */}
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-[#00a8e1] font-bold text-[10px] italic flex items-center">
                          ✓ prime
                        </span>
                        <span className="text-[10px] text-zinc-600 font-medium">FREE Delivery</span>
                      </div>

                    </div>

                    {/* Pricing and Action */}
                    <div className="mt-4">
                      {/* Price Format: $ Dollars Cents */}
                      <div className="flex items-start text-zinc-900 mb-3.5">
                        <span className="text-[11px] font-bold mt-1">$</span>
                        <span className="text-2xl font-bold leading-none">{formattedPrice.dollars}</span>
                        <span className="text-[11px] font-bold mt-1">{formattedPrice.cents}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => addToCart(p)}
                          className="flex-1 amazon-btn-primary py-1.5 px-3 text-xs font-normal shadow-sm"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => {
                            if (wishlist.some(item => item.id === p.id)) {
                              removeFromWishlist(p.id);
                            } else {
                              addToWishlist(p);
                            }
                          }}
                          className={`px-2.5 py-1.5 text-xs font-semibold border rounded shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            wishlist.some(item => item.id === p.id)
                              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300'
                              : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                          }`}
                          title={wishlist.some(item => item.id === p.id) ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <svg className="w-4 h-4" fill={wishlist.some(item => item.id === p.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {wishlist.some(item => item.id === p.id) ? 'Wishlisted' : 'Wishlist'}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Pagination controls for buyer view */}
            {buyerTotalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pb-4">
                <button
                  onClick={() => setBuyerPage(prev => Math.max(prev - 1, 1))}
                  disabled={buyerPage === 1}
                  className={`px-4 py-2 border rounded-md text-xs font-semibold shadow-xs transition-all ${
                    buyerPage === 1
                      ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                      : 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-700 cursor-pointer active:scale-97'
                  }`}
                >
                  « Previous
                </button>
                <span className="text-xs font-bold text-zinc-700">
                  Page {buyerPage} of {buyerTotalPages}
                </span>
                <button
                  onClick={() => setBuyerPage(prev => Math.min(prev + 1, buyerTotalPages))}
                  disabled={buyerPage === buyerTotalPages}
                  className={`px-4 py-2 border rounded-md text-xs font-semibold shadow-xs transition-all ${
                    buyerPage === buyerTotalPages
                      ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                      : 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-700 cursor-pointer active:scale-97'
                  }`}
                >
                  Next »
                </button>
              </div>
            )}
          </>
        )}

      </div>
        </>
      ) : activeTab === 'seller' ? (
        renderSellerDashboard()
      ) : (
        renderAdminDashboard()
      )}

      {/* Cart Sidebar Modal Overlay */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowCart(false)}></div>
          
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl relative z-10 animate-slide-in text-left">
            
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h3 className="text-lg font-bold text-zinc-900">Shopping Cart ({cartCount} items)</h3>
              <button
                onClick={() => setShowCart(false)}
                className="p-1 rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-zinc-50">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white border border-zinc-200 rounded-sm">
                  <svg className="w-16 h-16 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h4 className="font-bold text-zinc-700 text-base">Your Amazon Cart is empty.</h4>
                  <p className="text-zinc-500 text-xs mt-1">Shop today's deals to add item lists.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-3 bg-white border border-zinc-200 rounded-sm items-center"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-contain bg-zinc-50 border border-zinc-200 p-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs truncate text-zinc-950">{item.product.name}</h4>
                      <span className="text-[#b12704] font-bold text-xs mt-0.5 block">${item.product.price.toFixed(2)}</span>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded bg-zinc-100 border border-zinc-300 flex items-center justify-center hover:bg-zinc-200 font-bold text-[10px]"
                        >
                          -
                        </button>
                        <span className="text-[11px] font-bold text-zinc-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 rounded bg-zinc-100 border border-zinc-300 flex items-center justify-center hover:bg-zinc-200 font-bold text-[10px]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-zinc-400 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Checkout Summary */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-zinc-200 bg-white flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600">Subtotal ({cartCount} items):</span>
                  <span className="text-lg font-bold text-[#b12704]">${cartTotal.toFixed(2)}</span>
                </div>
                
                <button
                  onClick={() => {
                    alert('Order placed successfully! (Demo Checkout)');
                    setCart([]);
                    setShowCart(false);
                  }}
                  className="w-full amazon-btn-primary py-2.5 rounded-md text-xs font-semibold"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wishlist Sidebar Modal Overlay */}
      {showWishlist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowWishlist(false)}></div>
          
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl relative z-10 animate-slide-in text-left">
            
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                My Wishlist ({wishlist.length} items)
              </h3>
              <button
                onClick={() => setShowWishlist(false)}
                className="p-1 rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-zinc-50">
              {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white border border-zinc-200 rounded-sm">
                  <svg className="w-16 h-16 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <h4 className="font-bold text-zinc-700 text-base">Your Wishlist is empty.</h4>
                  <p className="text-zinc-500 text-xs mt-1">Explore products to add items to your wishlist.</p>
                </div>
              ) : (
                wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 bg-white border border-zinc-200 rounded-sm items-center shadow-xs"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-contain bg-zinc-50 border border-zinc-200 p-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs truncate text-zinc-950">{item.name}</h4>
                      <span className="text-[#b12704] font-bold text-xs mt-0.5 block">${item.price.toFixed(2)}</span>
                      
                      <div className="flex items-center gap-2 mt-2.5">
                        <button
                          onClick={() => {
                            addToCart(item);
                            alert('Added to Cart!');
                          }}
                          className="amazon-btn-primary py-1 px-3.5 text-[10px] font-semibold"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="text-zinc-400 hover:text-red-700 p-1 cursor-pointer transition-colors"
                      title="Remove from wishlist"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 bg-white">
              <button
                onClick={() => setShowWishlist(false)}
                className="w-full bg-[#eaeded] hover:bg-[#d8dee6] text-zinc-800 py-2.5 rounded-md text-xs font-semibold border border-zinc-400 cursor-pointer text-center"
              >
                Close Wishlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Detail Modal Popup */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-white border border-zinc-300 rounded-sm overflow-hidden shadow-2xl flex flex-col relative animate-scale-up text-left text-zinc-900">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 p-1.5 rounded-full border border-zinc-300 transition-all z-20 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content Body Grid */}
            <div className="p-6">
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left side Image */}
                <div className="flex-1 max-w-[200px] h-48 bg-zinc-50 flex items-center justify-center border border-zinc-200 p-1 rounded-sm mx-auto">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Right side Metadata */}
                <div className="flex-1 text-left">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                    {selectedProduct.category} {selectedProduct.subcategory ? `> ${selectedProduct.subcategory}` : ''} Catalog Item
                  </span>
                  <h3 className="text-lg font-bold text-zinc-950 leading-snug">{selectedProduct.name}</h3>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="text-amber-500 font-bold text-sm">★ {selectedProduct.rating} out of 5</span>
                    <span className="text-zinc-400">|</span>
                    <span className="text-xs text-[#007185] hover:text-orange-700 cursor-pointer">50+ ratings</span>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] bg-zinc-200 my-3"></div>

                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs font-semibold">Price:</span>
                    <span className="text-[#b12704] text-xl font-bold">${selectedProduct.price.toFixed(2)}</span>
                    <span className="text-[#00a8e1] font-bold text-[10px] italic">✓ prime</span>
                  </div>

                  <div className="text-xs text-zinc-600 mt-1">
                    FREE Delivery on qualifying orders.
                  </div>

                  <div className="text-xs font-bold text-emerald-700 mt-2.5">In Stock.</div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-5 border-t border-zinc-200 pt-4 text-left">
                <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider mb-2">Product Description</h4>
                <p className="text-zinc-700 text-sm leading-relaxed">
                  {selectedProduct.description} This high-quality item is selected by Amazon buyers for superior durability and value. Includes manufacturer warranty.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end mt-6 gap-3">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="amazon-btn-secondary py-2 px-5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="amazon-btn-primary py-2 px-6 text-xs font-semibold"
                >
                  Add to Cart
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
