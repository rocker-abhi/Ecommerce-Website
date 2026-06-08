import React, { useState, useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: 'Electronics' | 'Apparel' | 'Home' | 'Fitness' | 'Accessories';
  rating: number;
  image: string;
  description: string;
}

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

// Generates 50 mock products with premium design aesthetic details
const generateMockProducts = (): Product[] => {
  const categories: Product['category'][] = ['Electronics', 'Apparel', 'Home', 'Fitness', 'Accessories'];
  const baseProducts = [
    { name: 'Quantum ANC Headphones', desc: 'Active noise-canceling smart wireless headphones with 40h battery.' },
    { name: 'Nova Smartwatch Pro', desc: 'AMOLED display fitness and productivity smartwatch with GPS.' },
    { name: 'Holo Mechanical Keyboard', desc: 'RGB hot-swappable tactile mechanical keyboard with aluminum frame.' },
    { name: 'ErgoFit Workspace Chair', desc: 'High-back ergonomic mesh chair with adaptive lumbar support.' },
    { name: 'UltraCurve 34" Monitor', desc: '144Hz curved ultrawide gaming and productivity monitor.' },
    { name: 'Apex Wireless Mouse', desc: 'Precision ergonomic gaming mouse with high-accuracy optical sensor.' },
    { name: 'Core Fleece Hoodie', desc: 'Ultra-soft organic cotton heavyweight streetwear hoodie.' },
    { name: 'Zenith Duffle Bag', desc: 'Weatherproof premium canvas travel and gym duffle bag.' },
    { name: 'Aero 3 Running Shoes', desc: 'Lightweight breathable mesh athletic trainers with carbon plate.' },
    { name: 'Solace Ceramic Mug Set', desc: 'Minimalist double-walled insulated matte black ceramic mugs.' }
  ];

  const products: Product[] = [];
  for (let i = 1; i <= 50; i++) {
    const base = baseProducts[(i - 1) % baseProducts.length];
    const category = categories[(i - 1) % categories.length];

    // Vary the price, rating, and details slightly based on index
    const price = Math.round((49.99 + ((i * 13) % 250) + ((i * 7) % 10) / 10) * 100) / 100;
    const rating = Math.round((4.0 + ((i * 3) % 11) / 10) * 10) / 10;

    // Use high-quality curated stock images with varying IDs
    const imgId = 100 + i;
    const image = `https://picsum.photos/id/${imgId}/400/300`;

    products.push({
      id: i,
      name: `${base.name} (V${Math.ceil(i / 10)})`,
      price,
      category,
      rating: rating > 5 ? 5 : rating,
      image,
      description: `${base.desc} Ideal for professionals, creators, and hobbyists alike.`
    });
  }
  return products;
};

const MOCK_PRODUCTS = generateMockProducts();

export const Dashboard: React.FC<DashboardProps> = ({ userEmail, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc' | 'rating'>('default');

  // Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Product Detail Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...MOCK_PRODUCTS];

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
  }, [searchTerm, selectedCategory, sortBy]);

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

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, change: number) => {
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

  return (
    <div className="min-h-screen px-4 md:px-12 py-8 relative z-10 text-white">
      Dashboard Top Banner
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-purple-400 via-indigo-200 to-white bg-clip-text text-transparent">
            Welcome to E-Shop Admin
          </h1>
          <p className="text-zinc-400 text-sm mt-1.5 flex items-center gap-2">
            Logged in as: <span className="text-purple-300 font-semibold">{userEmail}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400 text-[11px] uppercase tracking-wider font-semibold">Active Session</span>
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Cart Trigger */}
          <button
            onClick={() => setShowCart(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 border border-white/10 hover:border-purple-500/50 hover:bg-zinc-850 transition-all duration-200 relative"
          >
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-sm font-semibold">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-purple-950/50 animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-purple-950/20"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Catalog Search & Filters Row */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search 50 premium products..."
              className="w-full bg-black/35 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none rounded-xl pl-12 pr-4 py-3 text-white text-sm transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Sort By:</span>
            <select
              className="bg-black/35 border border-white/10 focus:border-purple-500 focus:outline-none rounded-xl px-4 py-3 text-white text-sm transition-all duration-200 cursor-pointer min-w-[160px]"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
            >
              <option value="default">Relevance</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {['All', 'Electronics', 'Apparel', 'Home', 'Fitness', 'Accessories'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/20'
                  : 'bg-black/25 text-zinc-400 border border-white/5 hover:border-white/15 hover:text-white'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-black/20 border border-white/5 rounded-2xl">
          <svg className="w-16 h-16 text-zinc-600 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-zinc-300">No products found</h3>
          <p className="text-zinc-500 text-sm mt-1">Try tweaking your search term or category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 flex flex-col group"
            >
              {/* Product Image */}
              <div
                className="h-48 bg-zinc-950 overflow-hidden relative cursor-pointer"
                onClick={() => setSelectedProduct(p)}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg">
                  <span className="text-xs font-bold text-purple-300">{p.category}</span>
                </div>
              </div>

              {/* Product Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    className="font-bold text-base hover:text-purple-400 transition-colors cursor-pointer truncate"
                    onClick={() => setSelectedProduct(p)}
                  >
                    {p.name}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mt-3">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <svg
                          key={idx}
                          className={`w-3.5 h-3.5 ${idx < Math.floor(p.rating) ? 'fill-current' : 'stroke-current text-zinc-600 fill-none'
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
                    <span className="text-[11px] text-zinc-500 font-medium">({p.rating})</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-white">${p.price.toFixed(2)}</span>

                  <button
                    onClick={() => addToCart(p)}
                    className="bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart Sidebar Modal Overlay */}
      {showCart && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          {/* Backdrop closer */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowCart(false)}></div>

          {/* Cart Content Drawer */}
          <div className="w-full max-w-md bg-zinc-950/95 border-l border-white/10 h-full flex flex-col justify-between shadow-2xl relative z-10 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-2.5">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-xl font-bold">Shopping Cart</h3>
              </div>

              <button
                onClick={() => setShowCart(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg className="w-16 h-16 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h4 className="font-bold text-zinc-400 text-lg">Your cart is empty</h4>
                  <p className="text-zinc-600 text-sm mt-1">Start adding some items to build your checkout list.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-3 bg-black/40 border border-white/5 rounded-xl items-center"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg bg-zinc-900 border border-white/5"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.product.name}</h4>
                      <span className="text-zinc-400 text-xs">${item.product.price.toFixed(2)}</span>

                      <div className="flex items-center gap-2.5 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded bg-zinc-800 border border-white/5 flex items-center justify-center hover:bg-zinc-700 font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded bg-zinc-800 border border-white/5 flex items-center justify-center hover:bg-zinc-700 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-zinc-500 hover:text-red-400 p-1.5 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/5 bg-black/30 flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-zinc-400">Total Price:</span>
                  <span className="text-xl font-bold text-white">${cartTotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {
                    alert('Order checked out successfully! (Demo)');
                    setCart([]);
                    setShowCart(false);
                  }}
                  className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold py-3.5 rounded-xl shadow-lg shadow-purple-950/20 transition-all duration-200"
                >
                  Checkout Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Details Detail Modal Popup */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-zinc-950/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative animate-scale-up">

            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-zinc-400 hover:text-white p-1.5 rounded-full border border-white/10 transition-all z-20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Banner/Image */}
            <div className="h-64 bg-zinc-950 relative">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-6">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-widest bg-purple-900/60 backdrop-blur-md px-3 py-1 rounded-md border border-purple-500/30">
                  {selectedProduct.category}
                </span>
                <h3 className="text-2xl font-bold mt-2.5 text-white drop-shadow-md">{selectedProduct.name}</h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-5">
              <p className="text-zinc-300 text-sm leading-relaxed">
                {selectedProduct.description}
              </p>

              <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4 text-sm">
                <div>
                  <span className="text-zinc-500 text-xs block uppercase font-semibold">Quality Rating</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                    ★ {selectedProduct.rating} / 5.0
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs block uppercase font-semibold">Availability</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"></span>
                    In Stock (50+ available)
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-zinc-500 text-[10px] uppercase font-semibold">Total Price</span>
                  <span className="text-2xl font-bold text-white">${selectedProduct.price.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold py-3.5 rounded-xl shadow-lg shadow-purple-950/20 transition-all duration-200"
                >
                  Add to Shopping Cart
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
