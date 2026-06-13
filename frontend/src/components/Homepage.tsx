import React, { useState, useMemo, useEffect } from 'react';
import apiClient from '../services/api';
import { Storefront } from './Storefront';
import { SellerPanel } from './SellerPanel';
import { AdminPanel } from './AdminPanel';

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

  // Active dashboard view tab state
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller' | 'admin'>('buyer');

  // Buyer storefront products pagination states
  const [buyerPage, setBuyerPage] = useState(1);
  const [buyerTotalPages, setBuyerTotalPages] = useState(1);
  const [loadingStorefront, setLoadingStorefront] = useState(false);
  const [storefrontError, setStorefrontError] = useState<string | null>(null);

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

  useEffect(() => {
    if (activeTab === 'buyer') {
      fetchStorefrontProducts(buyerPage);
    }
  }, [buyerPage, activeTab]);

  const mapBackendCart = (backendCartData: any) => {
    if (!backendCartData || !backendCartData.items) return [];
    return backendCartData.items.map((item: any) => {
      const p = item.product;
      return {
        product: {
          id: p.id,
          name: p.name || 'Unnamed Product',
          price: parseFloat(p.price) || 0.0,
          category: p.category || 'Electronics',
          subcategory: p.subcategory || '',
          rating: parseFloat(p.rating) || 5.0,
          image: p.image_url || p.image || 'https://picsum.photos/id/120/400/300',
          description: p.description || '',
          sku: p.sku || '',
          stock: p.stock !== undefined ? p.stock : 50
        },
        quantity: item.quantity
      };
    });
  };

  const fetchCart = async () => {
    try {
      const response = await apiClient.get('/cart');
      if (response.data && response.data.success) {
        setCart(mapBackendCart(response.data.data));
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Cart operations
  const addToCart = async (product: Product) => {
    try {
      const response = await apiClient.post(`/cart/${product.id}`, { quantity: 1 });
      if (response.data && response.data.success) {
        setCart(mapBackendCart(response.data.data));
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const removeFromCart = async (productId: string | number) => {
    try {
      const response = await apiClient.delete(`/cart/${productId}`);
      if (response.data && response.data.success) {
        setCart(mapBackendCart(response.data.data));
      }
    } catch (err) {
      console.error('Failed to remove from cart:', err);
    }
  };

  const updateQuantity = async (productId: string | number, change: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;
    const newQty = item.quantity + change;
    try {
      if (newQty <= 0) {
        await removeFromCart(productId);
      } else {
        const response = await apiClient.put(`/cart/${productId}`, { quantity: newQty });
        if (response.data && response.data.success) {
          setCart(mapBackendCart(response.data.data));
        }
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  // Wishlist operations
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

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans pb-16">
      
      {/* Amazon Navigation Header */}
      <header className="bg-[#131921] text-white sticky top-0 z-40 select-none shadow-md">
        <div className="max-w-[1500px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => window.location.href = '/'} 
            className="flex items-center border border-transparent hover:border-white p-1 rounded-sm cursor-pointer"
          >
            <span className="font-black text-lg tracking-tight text-white flex items-baseline select-none">
              amazon<span className="text-orange-400 text-xs font-bold font-mono">.in</span>
            </span>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-2xl hidden md:flex items-stretch rounded-md overflow-hidden bg-white shadow-2xs group focus-within:ring-2 focus-within:ring-orange-500">
            <select className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs px-3 border-r border-zinc-300 outline-hidden cursor-pointer font-medium">
              <option>All Categories</option>
            </select>
            <input 
              type="text" 
              placeholder="Search Amazon items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3.5 py-2 text-sm text-zinc-900 outline-hidden placeholder-zinc-400 bg-white"
            />
            <button className="bg-orange-400 hover:bg-orange-500 px-5 flex items-center justify-center cursor-pointer transition-all active:scale-95">
              <svg className="w-5 h-5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Right Links info */}
          <div className="flex items-center gap-4">
            
            <div className="hidden lg:flex flex-col text-left p-1 border border-transparent hover:border-white rounded-sm cursor-pointer select-none text-xs">
              <span className="text-[10px] text-zinc-300">Hello, {userEmail.split('@')[0]}</span>
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
              className="px-3.5 py-1.5 rounded-sm bg-[#eaeded] hover:bg-[#d8dee6] text-[#0f1111] text-xs font-semibold border border-zinc-400 transition-all cursor-pointer"
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
              onClick={() => {
                setActiveTab('buyer');
                window.history.pushState(null, '', '/?tab=buyer');
              }}
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
                onClick={() => {
                  setActiveTab('seller');
                  window.history.pushState(null, '', '/?tab=seller');
                }}
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
                onClick={() => {
                  setActiveTab('admin');
                  window.history.pushState(null, '', '/?tab=admin');
                }}
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
          setSelectedCategory={setSelectedCategory}
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
        />
      )}

      {activeTab === 'seller' && (
        <SellerPanel
          isSeller={isSeller}
          onRefreshBuyerProducts={() => fetchStorefrontProducts(buyerPage)}
        />
      )}

      {activeTab === 'admin' && (
        <AdminPanel
          isAdmin={isAdmin}
          userEmail={userEmail}
        />
      )}

    </div>
  );
};
