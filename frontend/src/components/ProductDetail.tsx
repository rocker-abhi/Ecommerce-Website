import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { type Product } from './Homepage';
import { useToast } from '../context/ToastContext';

interface ProductDetailProps {
  productId: string | number;
  onBack: () => void;
  addToCart: (product: Product) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string | number) => void;
  wishlist: Product[];
  onProceedToCheckout?: () => void;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string | null;
  user_name: string;
  user_profile_pic: string | null;
}

interface SellerInfo {
  name: string;
  email: string;
}

interface DetailedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  subcategory: string;
  sku: string;
  stock: number;
  seller: SellerInfo;
  reviews: Review[];
  average_rating: number;
  review_count: number;
  rating_distribution: Record<number, number>;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  onBack,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  wishlist,
  onProceedToCheckout
}) => {
  const { showToast } = useToast();
  const [product, setProduct] = useState<DetailedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  
  // Quantity selector
  const [quantity, setQuantity] = useState(1);

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);

  const loadProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/product/${productId}`);
      if (res.data?.success) {
        const p: DetailedProduct = res.data.data;
        setProduct(p);
      } else {
        setError(res.data?.message || 'Failed to load product details');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductDetails();
    setQuantity(1);
    setActiveTab('description');
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewFormError(null);
    try {
      const res = await apiClient.post(`/product/${productId}/review`, {
        rating: reviewRating,
        comment: reviewComment
      });
      if (res.data?.success) {
        setReviewComment('');
        setReviewRating(5);
        showToast('success', 'Review Submitted', 'Thank you for your feedback!');
        await loadProductDetails();
      } else {
        setReviewFormError(res.data?.message || 'Failed to submit review');
      }
    } catch (err: any) {
      setReviewFormError(err.response?.data?.message || err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-height-[70vh] flex flex-col items-center justify-center select-none animate-fade-in">
        <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="mt-4 text-xs font-semibold text-slate-400">Syncing listing data...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 glass-card-static text-center select-none animate-fade-in">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-slate-200">Listing Unavailable</h3>
        <p className="text-xs text-slate-400 mt-2">{error || 'The requested product detail could not be loaded.'}</p>
        <button className="btn-primary mt-6 w-full sm:w-auto" onClick={onBack}>
          Return to Store
        </button>
      </div>
    );
  }

  const isWishlisted = wishlist.some(item => item.id === product.id);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 select-none animate-fade-in-up">
      
      {/* Back navigation header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
        <button 
          onClick={onBack}
          className="btn-secondary group cursor-pointer"
        >
          <svg 
            className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Store
        </button>
        <span className="text-xs font-mono font-bold text-slate-500">
          SKU: <span className="text-indigo-400">{product.sku || 'N/A'}</span>
        </span>
      </div>

      {/* Main product display grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* Left Side: Product Image Panel */}
        <div className="lg:col-span-5">
          <div className="glass-card-static p-6 h-[400px] flex items-center justify-center overflow-hidden relative group">
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105" 
            />
          </div>
        </div>

        {/* Center: Info Details Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card-static p-6 space-y-4">
            <span className="badge badge-accent">{product.category}</span>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight leading-tight">{product.name}</h1>
            
            {/* Ratings Summary line */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-amber-500 font-bold flex items-center gap-1">
                ★ {product.average_rating}
              </span>
              <span className="text-slate-600">|</span>
              <button 
                onClick={() => {
                  setActiveTab('reviews');
                  document.getElementById('product-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
              >
                {product.review_count} customer review{product.review_count !== 1 ? 's' : ''}
              </button>
            </div>

            <hr className="border-white/5" />

            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>

            <hr className="border-white/5" />

            {/* Checklist attributes */}
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-300">{product.category}</span>
              </div>
              {product.subcategory && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Subcategory:</span>
                  <span className="font-semibold text-slate-300">{product.subcategory}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant:</span>
                <span className="font-semibold text-indigo-400">{product.seller?.name || 'Authorized ShopVerse Vendor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Warranty:</span>
                <span className="font-semibold text-slate-300">1 Year Brand Protection</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Buy Box Card */}
        <div className="lg:col-span-3">
          <div className="glass-card-static p-6 space-y-6 sticky top-24">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Deal Price</span>
              <div className="text-3xl font-extrabold text-slate-100 flex items-baseline">
                <span className="text-lg font-bold mr-1">₹</span>
                {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              {isOutOfStock ? (
                <span className="badge badge-error w-full justify-center py-2 text-xs">✕ Out of Stock</span>
              ) : product.stock <= 10 ? (
                <span className="badge badge-warning w-full justify-center py-2 text-xs">⚠️ Only {product.stock} units left</span>
              ) : (
                <span className="badge badge-success w-full justify-center py-2 text-xs">✓ In Stock ({product.stock})</span>
              )}
            </div>

            {/* Quantity controller */}
            {!isOutOfStock && (
              <div className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-white/2">
                <span className="text-xs font-semibold text-slate-400">Qty:</span>
                <div className="flex items-center gap-3">
                  <button
                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(prev => prev - 1)}
                  >
                    -
                  </button>
                  <span className="text-sm font-bold text-slate-200 w-6 text-center">{quantity}</span>
                  <button
                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity(prev => prev + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Actions list */}
            <div className="space-y-3">
              <button
                className="btn-primary w-full text-xs py-3"
                disabled={isOutOfStock}
                onClick={() => {
                  const p: Product = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category as any,
                    subcategory: product.subcategory,
                    rating: product.average_rating,
                    image: product.image_url,
                    description: product.description,
                    sku: product.sku,
                    stock: product.stock
                  };
                  for (let i = 0; i < quantity; i++) {
                    addToCart(p);
                  }
                  showToast('success', 'Added to Cart', `${quantity} unit(s) of "${product.name}" added.`);
                }}
              >
                Add to Cart
              </button>

              <button
                className="btn-secondary w-full text-xs py-3"
                disabled={isOutOfStock}
                onClick={() => {
                  const p: Product = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category as any,
                    subcategory: product.subcategory,
                    rating: product.average_rating,
                    image: product.image_url,
                    description: product.description,
                    sku: product.sku,
                    stock: product.stock
                  };
                  addToCart(p);
                  if (onProceedToCheckout) {
                    onProceedToCheckout();
                  }
                }}
              >
                Buy Now
              </button>

              <button
                className={`w-full text-xs py-3 rounded-lg font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isWishlisted 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' 
                    : 'btn-secondary'
                }`}
                onClick={() => {
                  const p: Product = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category as any,
                    subcategory: product.subcategory,
                    rating: product.average_rating,
                    image: product.image_url,
                    description: product.description,
                    sku: product.sku,
                    stock: product.stock
                  };
                  if (isWishlisted) {
                    removeFromWishlist(product.id);
                    showToast('info', 'Wishlist Removed', 'Item removed from your wishlist.');
                  } else {
                    addToWishlist(p);
                    showToast('success', 'Wishlist Added', 'Item saved to your wishlist.');
                  }
                }}
              >
                <svg width="15" height="15" fill={isWishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isWishlisted ? 'Saved' : 'Save to Wishlist'}
              </button>
            </div>

            <div className="text-[10px] text-slate-500 text-center leading-relaxed border-t border-white/5 pt-4">
              🔒 SSL Encrypted transactions. Fully qualifying orders receive free freight service.
            </div>
          </div>
        </div>

      </div>

      {/* Tabs Drawer Details */}
      <div className="glass-card-static p-8" id="product-tabs-section">
        
        {/* Tab triggers */}
        <div className="flex border-b border-white/5 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'description' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'specifications' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'reviews' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Reviews ({product.review_count})
          </button>
        </div>

        {/* Tab display */}
        <div className="text-sm leading-relaxed text-slate-300">
          
          {activeTab === 'description' && (
            <div className="animate-fade-in space-y-3">
              <h3 className="font-bold text-slate-100">About this item</h3>
              <p className="whitespace-pre-wrap text-slate-400">{product.description}</p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="animate-fade-in overflow-hidden border border-white/5 rounded-xl">
              <table className="w-full border-collapse text-left text-xs text-slate-400">
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.01]">
                    <td className="p-4 font-bold text-slate-300 w-1/3">Stock Keeping Unit (SKU)</td>
                    <td className="p-4 font-mono text-indigo-400">{product.sku || 'N/A'}</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01]">
                    <td className="p-4 font-bold text-slate-300">Category Tag</td>
                    <td className="p-4">{product.category}</td>
                  </tr>
                  {product.subcategory && (
                    <tr className="hover:bg-white/[0.01]">
                      <td className="p-4 font-bold text-slate-300">Subcategory Tag</td>
                      <td className="p-4">{product.subcategory}</td>
                    </tr>
                  )}
                  <tr className="hover:bg-white/[0.01]">
                    <td className="p-4 font-bold text-slate-300">Authorized Merchant</td>
                    <td className="p-4">{product.seller?.name || 'ShopVerse Merchant'}</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01]">
                    <td className="p-4 font-bold text-slate-300">Warranty Term</td>
                    <td className="p-4">1 Year Brand protection term</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Review analytics distribution */}
              <div className="md:col-span-4 space-y-6">
                <div className="p-5 rounded-xl bg-white/2 border border-white/5">
                  <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4">Rating Summary</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-extrabold text-slate-100">{product.average_rating}</div>
                    <div>
                      <div className="text-amber-500 font-semibold">★ ★ ★ ★ ★</div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{product.review_count} overall reviews</div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-6">
                    {[5, 4, 3, 2, 1].map(stars => {
                      const pct = product.rating_distribution[stars] || 0;
                      return (
                        <div key={stars} className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                          <span className="w-10 whitespace-nowrap">{stars} Star</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="w-8 text-right text-slate-500">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Write Review Form */}
                <form onSubmit={handleSubmitReview} className="p-5 rounded-xl bg-white/2 border border-white/5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Add Customer Review</h4>
                  
                  <div className="space-y-1.5">
                    <label className="form-label">Product Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(stars => (
                        <button
                          key={stars}
                          type="button"
                          className={`text-2xl cursor-pointer focus:outline-none transition-colors ${
                            reviewRating >= stars ? 'text-amber-500' : 'text-slate-650 hover:text-amber-600'
                          }`}
                          onClick={() => setReviewRating(stars)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="form-label">Review Comment</label>
                    <textarea
                      placeholder="Share your experience with this product..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="glass-input min-h-[80px] py-2 resize-y"
                      rows={3}
                      required
                    />
                  </div>

                  {reviewFormError && (
                    <div className="text-rose-500 text-xs font-semibold">⚠️ {reviewFormError}</div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-primary !px-4 !py-2 text-xs w-full sm:w-auto"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              </div>

              {/* Reviews listing column */}
              <div className="md:col-span-8 space-y-6">
                <h3 className="font-bold text-slate-200">Customer Feedback</h3>
                
                {product.reviews.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-white/10 rounded-xl text-slate-500 text-xs">
                    No reviews registered for this product listing yet. Be the first to express your thoughts!
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {product.reviews.map(rev => (
                      <div key={rev.id} className="p-5 rounded-xl bg-white/2 border border-white/5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm uppercase border border-indigo-500/20 overflow-hidden">
                            {rev.user_profile_pic ? (
                              <img src={rev.user_profile_pic} alt={rev.user_name} className="w-full h-full object-cover" />
                            ) : (
                              rev.user_name.slice(0, 2)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-200">{rev.user_name}</div>
                            <div className="text-[10px] text-slate-500">
                              Published: {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'recent'}
                            </div>
                          </div>
                        </div>

                        <div className="text-amber-500 text-xs">
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
};
