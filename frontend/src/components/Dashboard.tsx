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

// Generates 50 mock products with premium design details suited for Amazon
const generateMockProducts = (): Product[] => {
  const categories: Product['category'][] = ['Electronics', 'Apparel', 'Home', 'Fitness', 'Accessories'];
  const baseProducts = [
    { name: 'Echo Sound Wireless Headphones', desc: 'Active noise-canceling smart wireless over-ear headphones with 40h playback.' },
    { name: 'Halo Smart Watch Active', desc: 'AMOLED display fitness and health tracking smartwatch with integrated GPS.' },
    { name: 'KeyChron mechanical keyboard', desc: 'RGB hot-swappable tactile mechanical keyboard with premium switches.' },
    { name: 'ErgoComfort Office Seat', desc: 'High-back ergonomic mesh chair with adjustable headrest & armrests.' },
    { name: 'UltraVision 34" Curved Monitor', desc: '144Hz screen curved ultrawide gaming and professional monitor.' },
    { name: 'Apex Wireless Precision Mouse', desc: 'Ergonomic precision mouse with high-accuracy optical tracking sensor.' },
    { name: 'Essential Cotton Fleece Jacket', desc: 'Ultra-soft organic cotton heavyweight streetwear hoodie with pockets.' },
    { name: 'Navigator Canvas Duffel', desc: 'Weather-resistant premium canvas travel bag and athletic duffel.' },
    { name: 'SpeedRun carbon sole trainers', desc: 'Lightweight breathable mesh athletic runners with carbon plate.' },
    { name: 'Nordic Ceramic Coffee Mug', desc: 'Minimalist double-walled insulated matte black ceramic mug set.' }
  ];

  const products: Product[] = [];
  for (let i = 1; i <= 50; i++) {
    const base = baseProducts[(i - 1) % baseProducts.length];
    const category = categories[(i - 1) % categories.length];
    
    // Vary the price, rating, and details slightly based on index
    const price = Math.round((24.99 + ((i * 11) % 180) + ((i * 3) % 10) / 10) * 100) / 100;
    const rating = Math.round((3.8 + ((i * 4) % 13) / 10) * 10) / 10;
    
    const imgId = 110 + i;
    const image = `https://picsum.photos/id/${imgId}/400/300`;

    products.push({
      id: i,
      name: `${base.name} (${category} Pack V${Math.ceil(i / 10)})`,
      price,
      category,
      rating: rating > 5 ? 5 : rating,
      image,
      description: `${base.desc} Rated choice product for home, office, and travel.`
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

  // Format Amazon style price display
  const formatAmazonPrice = (price: number) => {
    const parts = price.toFixed(2).split('.');
    return {
      dollars: parts[0],
      cents: parts[1]
    };
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
              Unlock savings on 50 selected products. Fast, free delivery with Prime memberships.
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
            Showing {filteredProducts.length} results for category: <span className="text-[#007185] font-bold">{selectedCategory}</span>
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
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-zinc-200 rounded-sm">
            <svg className="w-16 h-16 text-zinc-400 mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-zinc-800">No matches found</h3>
            <p className="text-zinc-500 text-xs mt-1">Try updating search queries or resetting category tags.</p>
          </div>
        ) : (
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
                    <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5">{p.category}</div>
                    
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

                    {/* Yellow Button */}
                    <button
                      onClick={() => addToCart(p)}
                      className="w-full amazon-btn-primary py-1.5 px-3 text-xs font-normal shadow-sm"
                    >
                      Add to Cart
                    </button>
                  </div>

                </div>
              );
            })}
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
                    {selectedProduct.category} Catalog Item
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
