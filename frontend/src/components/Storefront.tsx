import React, { useState } from 'react';
import { type Product } from './Homepage';

interface StorefrontProps {
  products: Product[];
  loadingStorefront: boolean;
  storefrontError: string | null;
  buyerPage: number;
  buyerTotalPages: number;
  setBuyerPage: React.Dispatch<React.SetStateAction<number>>;
  searchTerm: string;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
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

export const Storefront: React.FC<StorefrontProps> = ({
  products,
  loadingStorefront,
  storefrontError,
  buyerPage,
  buyerTotalPages,
  setBuyerPage,
  searchTerm,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  cart,
  addToCart,
  removeFromCart,
  updateQuantity,
  wishlist,
  addToWishlist,
  removeFromWishlist,
  showCart,
  setShowCart,
  showWishlist,
  setShowWishlist,
  onProceedToCheckout,
}) => {
  // Product Detail Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Format Amazon style price display
  const formatAmazonPrice = (price: number) => {
    const parts = price.toFixed(2).split('.');
    return {
      dollars: parts[0],
      cents: parts[1],
    };
  };

  const filteredBuyerProducts = React.useMemo(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    // Sort products
    if (sortBy === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <>
      {/* Hero Banner Promo Section */}
      <div className="max-w-[1500px] mx-auto px-4 mt-4 relative">
        <div className="bg-gradient-to-r from-cyan-800 to-indigo-900 rounded-lg p-8 md:p-12 text-white shadow-md flex flex-col justify-center min-h-[220px] relative overflow-hidden">
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
                className="amazon-btn-primary py-2 px-5 text-xs font-semibold rounded-md cursor-pointer"
              >
                Shop Electronics
              </button>
              <button 
                onClick={() => setSelectedCategory('Apparel')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2 px-5 text-xs font-semibold rounded-md cursor-pointer"
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
              See all electronics
            </span>
          </div>

          {/* Box 2 */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs flex flex-col justify-between text-left">
            <div>
              <h3 className="font-bold text-base text-zinc-900 mb-3">Upgrade your apparel</h3>
              <div className="h-32 bg-zinc-100 rounded-sm overflow-hidden mb-3">
                <img src="https://picsum.photos/id/325/300/200" alt="Tech" className="w-full h-full object-cover" />
              </div>
            </div>
            <span 
              onClick={() => setSelectedCategory('Apparel')}
              className="text-xs text-[#007185] hover:text-orange-700 hover:underline cursor-pointer font-semibold mt-2 block"
            >
              Shop premium wear
            </span>
          </div>

          {/* Box 3 */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs flex flex-col justify-between text-left">
            <div>
              <h3 className="font-bold text-base text-zinc-900 mb-3">Home & Kitchen must haves</h3>
              <div className="h-32 bg-zinc-100 rounded-sm overflow-hidden mb-3">
                <img src="https://picsum.photos/id/42/300/200" alt="Tech" className="w-full h-full object-cover" />
              </div>
            </div>
            <span 
              onClick={() => setSelectedCategory('Home')}
              className="text-xs text-[#007185] hover:text-orange-700 hover:underline cursor-pointer font-semibold mt-2 block"
            >
              Discover collections
            </span>
          </div>

          {/* Box 4 */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs flex flex-col justify-between text-left">
            <div>
              <h3 className="font-bold text-base text-zinc-900 mb-3">Fitness & Outdoor gear</h3>
              <div className="h-32 bg-zinc-100 rounded-sm overflow-hidden mb-3">
                <img src="https://picsum.photos/id/119/300/200" alt="Tech" className="w-full h-full object-cover" />
              </div>
            </div>
            <span 
              onClick={() => setSelectedCategory('Fitness')}
              className="text-xs text-[#007185] hover:text-orange-700 hover:underline cursor-pointer font-semibold mt-2 block"
            >
              Get active today
            </span>
          </div>
        </div>
      </div>

      {/* Main Storefront Product List section */}
      <div className="max-w-[1500px] mx-auto px-4 mt-8 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-3 mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
              Our Selected Products
              {selectedCategory !== 'All' && (
                <span className="text-xs font-normal px-2.5 py-0.5 bg-zinc-200 text-zinc-700 rounded-full">
                  Category: {selectedCategory}
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Explore best-selling items, updated continuously.</p>
          </div>

          {/* Filters controls */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-zinc-500 uppercase">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs p-1.5 bg-white border border-zinc-300 rounded shadow-2xs focus:ring-1 focus:ring-amber-500 outline-hidden"
            >
              <option value="default">Featured Recommendations</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="rating">Avg. Customer Review</option>
            </select>
          </div>
        </div>

        {loadingStorefront && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-500 text-xs font-semibold mt-3">Loading product catalog...</span>
          </div>
        ) : storefrontError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-xs font-semibold">
            ⚠ Failed to load product catalog: {storefrontError}
          </div>
        ) : filteredBuyerProducts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 text-xs border border-dashed border-zinc-300 rounded-md">
            No products found matching the criteria. Try clearing search keywords or selecting another category.
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredBuyerProducts.map((p) => {
                const formattedPrice = formatAmazonPrice(p.price);
                const isOutOfStock = p.stock !== undefined && p.stock <= 0;

                return (
                  <div 
                    key={p.id} 
                    className="bg-white border border-zinc-200 rounded-sm shadow-2xs hover:shadow-md transition-shadow duration-200 p-4 flex flex-col justify-between relative group"
                  >
                    {/* Image */}
                    <div 
                      className="h-44 bg-zinc-50 flex items-center justify-center border-b border-zinc-100 pb-3 mb-3.5 cursor-pointer relative overflow-hidden rounded-xs"
                      onClick={() => setSelectedProduct(p)}
                    >
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="max-h-full max-w-full object-contain group-hover:scale-102 transition-transform duration-300"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <span className="px-3 py-1 bg-red-600 text-white font-extrabold text-[10px] uppercase rounded-sm tracking-wide">
                            Temporarily Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="text-left">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                          {p.category}
                        </span>
                        <h4 
                          className="font-bold text-xs text-zinc-950 mt-1 line-clamp-2 hover:text-orange-700 cursor-pointer min-h-[32px] leading-tight"
                          onClick={() => setSelectedProduct(p)}
                        >
                          {p.name}
                        </h4>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-1 mt-1.5 mb-2.5">
                          <div className="text-amber-500 font-bold text-xs">★ {p.rating}</div>
                          <span className="text-zinc-300 text-[10px]">|</span>
                          <span className="text-[10px] text-zinc-400 hover:text-orange-600 cursor-pointer font-semibold">50+ ratings</span>
                        </div>
                      </div>

                      {/* Pricing and Action */}
                      <div className="mt-4">
                        <div className="flex items-start text-zinc-900 mb-3.5">
                          <span className="text-[11px] font-bold mt-1">$</span>
                          <span className="text-2xl font-bold leading-none">{formattedPrice.dollars}</span>
                          <span className="text-[11px] font-bold mt-1">{formattedPrice.cents}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => addToCart(p)}
                            disabled={isOutOfStock}
                            className="flex-1 amazon-btn-primary py-1.5 px-3 text-xs font-normal shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                          <button
                            onClick={() => {
                              if (wishlist.some(item => item.id === p.id)) {
                                removeFromWishlist(p.id);
                              } else {
                                addToWishlist(p);
                              }
                            }}
                            className={`px-2.5 py-1.5 text-xs font-semibold border rounded shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
                  className={`px-4 py-2 border rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                    buyerPage === 1
                      ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                      : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-300'
                  }`}
                >
                  ◀ Previous
                </button>
                <span className="text-xs text-zinc-500 font-semibold">
                  Page <span className="text-zinc-950 font-bold">{buyerPage}</span> of <span className="text-zinc-950 font-bold">{buyerTotalPages}</span>
                </span>
                <button
                  onClick={() => setBuyerPage(prev => Math.min(prev + 1, buyerTotalPages))}
                  disabled={buyerPage === buyerTotalPages}
                  className={`px-4 py-2 border rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                    buyerPage === buyerTotalPages
                      ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                      : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-300'
                  }`}
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
                    if (onProceedToCheckout) {
                      setShowCart(false);
                      onProceedToCheckout();
                    } else {
                      alert('Order placed successfully! (Demo Checkout)');
                      cart.forEach(item => removeFromCart(item.product.id));
                      setShowCart(false);
                    }
                  }}
                  className="w-full amazon-btn-primary py-2.5 rounded-md text-xs font-semibold cursor-pointer"
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
                          className="amazon-btn-primary py-1 px-3.5 text-[10px] font-semibold cursor-pointer"
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
                  className="amazon-btn-secondary py-2 px-5 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="amazon-btn-primary py-2 px-6 text-xs font-semibold cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
