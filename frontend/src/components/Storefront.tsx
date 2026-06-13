import React, { useState } from 'react';
import { type Product } from './Homepage';
import { ProductDetail } from './ProductDetail';

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

export const Storefront: React.FC<StorefrontProps> = ({
  products,
  loadingStorefront,
  storefrontError,
  buyerPage,
  buyerTotalPages,
  setBuyerPage,
  searchTerm,
  selectedCategory,
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

  // Sync with URL query parameter on mount/products load
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product_id');
    if (prodId && products.length > 0) {
      const found = products.find(p => String(p.id) === String(prodId));
      if (found) {
        setSelectedProduct(found);
      }
    }
  }, [products]);

  // Listen for related product clicks inside details page
  React.useEffect(() => {
    const handleProductChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newProdId = customEvent.detail;
      const found = products.find(p => String(p.id) === String(newProdId));
      if (found) {
        setSelectedProduct(found);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('product_changed', handleProductChanged);
    return () => window.removeEventListener('product_changed', handleProductChanged);
  }, [products]);

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


      {/* Main Storefront Product List section */}
      <div className="max-w-[1500px] mx-auto px-4 mt-8 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-3 mb-6 gap-4">


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

      {/* Product Details takeover */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/10 z-50 overflow-y-auto">
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
