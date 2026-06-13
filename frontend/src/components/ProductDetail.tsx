import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { type Product } from './Homepage';

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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  .pd-root {
    font-family: 'Inter', sans-serif;
    background: #f8fafc;
    min-height: 100vh;
    color: #1e293b;
    padding-bottom: 64px;
    text-align: left;
  }

  .pd-header {
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 32px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .pd-back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pd-back-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .pd-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
  }

  .pd-breadcrumbs {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 24px;
    font-weight: 500;
  }

  .pd-breadcrumbs span.separator {
    color: #cbd5e1;
  }

  .pd-breadcrumbs span.active {
    color: #0f172a;
    font-weight: 600;
  }

  .pd-grid {
    display: grid;
    grid-template-columns: 1.2fr 1.5fr 1fr;
    gap: 32px;
    margin-bottom: 40px;
  }

  @media (max-width: 1024px) {
    .pd-grid {
      grid-template-columns: 1fr 1.2fr;
    }
    .pd-buy-box-wrapper {
      grid-column: span 2;
    }
  }

  @media (max-width: 768px) {
    .pd-grid {
      grid-template-columns: 1fr;
    }
    .pd-buy-box-wrapper {
      grid-column: span 1;
    }
  }

  /* Gallery Styling */
  .pd-gallery {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pd-main-img-container {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    height: 450px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .pd-main-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    transition: transform 0.3s ease;
  }

  .pd-main-img-container:hover .pd-main-img {
    transform: scale(1.15);
  }

  .pd-thumbnails {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .pd-thumb {
    width: 68px;
    height: 68px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    padding: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pd-thumb:hover {
    border-color: #94a3b8;
  }

  .pd-thumb.active {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  .pd-thumb img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  /* Info Column Styling */
  .pd-info-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .pd-badge-cat {
    display: inline-block;
    background: #e0e7ff;
    color: #4338ca;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 16px;
  }

  .pd-title {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
    margin: 0 0 12px;
  }

  .pd-rating-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .pd-stars {
    display: flex;
    align-items: center;
    gap: 2px;
    color: #f59e0b;
    font-size: 16px;
    font-weight: bold;
  }

  .pd-rating-text {
    font-size: 13px;
    font-weight: 600;
    color: #6366f1;
    text-decoration: none;
    cursor: pointer;
  }
  
  .pd-rating-text:hover {
    text-decoration: underline;
  }

  .pd-meta-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
    padding: 18px 0;
    margin-bottom: 24px;
    font-size: 13px;
  }

  .pd-meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pd-meta-label {
    color: #64748b;
    font-weight: 500;
    width: 90px;
  }

  .pd-meta-val {
    color: #0f172a;
    font-weight: 600;
  }

  /* Buy Box Styling */
  .pd-buy-box {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    position: sticky;
    top: 88px;
  }

  .pd-price-row {
    margin-bottom: 20px;
  }

  .pd-price-label {
    font-size: 12px;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  .pd-price-amount {
    font-size: 36px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.02em;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .pd-stock-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 20px;
  }

  .pd-stock-instock {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  .pd-stock-low {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }

  .pd-stock-out {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .pd-qty-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-bottom: 24px;
  }

  .pd-qty-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
  }

  .pd-qty-selector {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pd-qty-btn {
    width: 28px;
    height: 28px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #fff;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
  }

  .pd-qty-btn:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .pd-qty-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pd-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pd-btn {
    width: 100%;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .pd-btn-primary {
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: #fff;
    border: none;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  }

  .pd-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #4338ca, #4f46e5);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
  }

  .pd-btn-secondary {
    background: #fff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
  }

  .pd-btn-secondary:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  .pd-btn-wishlisted {
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fecaca;
  }

  .pd-btn-wishlisted:hover {
    background: #ffe4e4;
  }

  .pd-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  /* Tabs Section Styling */
  .pd-tabs-container {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    margin-bottom: 40px;
  }

  .pd-tabs-header {
    display: flex;
    gap: 24px;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 24px;
  }

  .pd-tab-trigger {
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    padding: 12px 4px;
    font-size: 15px;
    font-weight: 700;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pd-tab-trigger:hover {
    color: #0f172a;
  }

  .pd-tab-trigger.active {
    color: #6366f1;
    border-color: #6366f1;
  }

  .pd-tab-content {
    line-height: 1.6;
    font-size: 14px;
    color: #475569;
  }

  /* Spec Table */
  .pd-spec-table {
    width: 100%;
    border-collapse: collapse;
  }

  .pd-spec-table tr {
    border-bottom: 1px solid #f1f5f9;
  }

  .pd-spec-table tr:last-child {
    border-bottom: none;
  }

  .pd-spec-table td {
    padding: 12px 16px;
  }

  .pd-spec-label {
    width: 200px;
    font-weight: 600;
    color: #64748b;
  }

  .pd-spec-val {
    color: #1e293b;
  }

  /* Review Section styling */
  .pd-reviews-layout {
    display: grid;
    grid-template-columns: 1.2fr 2fr;
    gap: 40px;
  }

  @media (max-width: 768px) {
    .pd-reviews-layout {
      grid-template-columns: 1fr;
    }
  }

  .pd-review-summary-box {
    background: #f8fafc;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #e2e8f0;
  }

  .pd-avg-rating-big {
    font-size: 48px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
    margin-bottom: 8px;
  }

  .pd-distribution {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 24px;
  }

  .pd-dist-row {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
  }

  .pd-dist-bar-bg {
    flex: 1;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
  }

  .pd-dist-bar-fill {
    height: 100%;
    background: #f59e0b;
    border-radius: 4px;
  }

  .pd-dist-percent {
    width: 38px;
    text-align: right;
    color: #64748b;
  }

  .pd-review-form {
    border-top: 1px solid #e2e8f0;
    margin-top: 24px;
    padding-top: 24px;
  }

  .pd-review-form-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 16px;
  }

  .pd-star-picker {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
  }

  .pd-star-pick-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #e2e8f0;
    transition: color 0.1s ease;
  }

  .pd-star-pick-btn.active {
    color: #f59e0b;
  }

  .pd-comment-textarea {
    width: 100%;
    height: 100px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 13px;
    outline: none;
    resize: none;
    margin-bottom: 12px;
    font-family: inherit;
  }

  .pd-comment-textarea:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  /* Reviews List */
  .pd-reviews-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .pd-review-card {
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 24px;
  }

  .pd-review-card:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .pd-review-user-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .pd-review-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #475569;
    font-size: 14px;
    overflow: hidden;
  }

  .pd-review-username {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }

  .pd-review-date {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 1px;
  }

  .pd-review-stars {
    color: #f59e0b;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .pd-review-comment {
    font-size: 13.5px;
    color: #334155;
    line-height: 1.5;
  }

  /* Related Products */
  .pd-related-section {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .pd-related-title {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 20px;
  }

  .pd-related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }

  .pd-related-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .pd-related-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    transform: translateY(-2px);
  }

  .pd-related-img-box {
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 12px;
  }

  .pd-related-img-box img {
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
  }

  .pd-related-name {
    font-size: 12.5px;
    font-weight: 700;
    color: #0f172a;
    line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .pd-related-price {
    font-size: 14px;
    font-weight: 800;
    color: #ef4444;
  }

  /* Loading State */
  .pd-loading-overlay {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .pd-spinner {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 4px solid #e2e8f0;
    border-top-color: #6366f1;
    animation: pd-spin 0.8s linear infinite;
  }
  @keyframes pd-spin {
    to { transform: rotate(360deg); }
  }
`;

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  onBack,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  wishlist,
  onProceedToCheckout
}) => {
  const [product, setProduct] = useState<DetailedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Gallery
  // Tab states
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
        // Set details
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
        // Reload details to show updated reviews list and average rating
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
      <>
        <style>{css}</style>
        <div className="pd-root">
          <div className="pd-loading-overlay">
            <div className="pd-spinner"></div>
            <p style={{ marginTop: 16, fontSize: 13, color: '#64748b', fontWeight: 600 }}>Loading product details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <style>{css}</style>
        <div className="pd-root">
          <div className="pd-header">
            <button className="pd-back-btn" onClick={onBack}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Catalog
            </button>
          </div>
          <div className="pd-container" style={{ textAlign: 'center', padding: '80px 24px' }}>
            <h2 style={{ color: '#ef4444', marginBottom: 12 }}>Product Details Unavailable</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{error || 'The requested product could not be loaded.'}</p>
            <button className="pd-back-btn" style={{ margin: '0 auto' }} onClick={onBack}>Return to Storefront</button>
          </div>
        </div>
      </>
    );
  }

  const isWishlisted = wishlist.some(item => item.id === product.id);
  const isOutOfStock = product.stock <= 0;

  return (
    <>
      <style>{css}</style>
      <div className="pd-root">
        {/* Navigation Bar */}
        <div className="pd-header">
          <button className="pd-back-btn" onClick={onBack}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Catalog
          </button>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            SKU: <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{product.sku || 'N/A'}</span>
          </div>
        </div>

        <div className="pd-container">
          {/* Breadcrumbs */}
          <div className="pd-breadcrumbs">
            <span>Storefront</span>
            <span className="separator">/</span>
            <span>{product.category}</span>
            {product.subcategory && (
              <>
                <span className="separator">/</span>
                <span>{product.subcategory}</span>
              </>
            )}
            <span className="separator">/</span>
            <span className="active">{product.name}</span>
          </div>

          {/* Product Hero Grid */}
          <div className="pd-grid">
            {/* Gallery Column */}
            <div className="pd-gallery">
              <div className="pd-main-img-container">
                <img src={product.image_url} alt={product.name} className="pd-main-img" />
              </div>
            </div>

            {/* Info Column */}
            <div className="pd-info-card">
              <span className="pd-badge-cat">{product.category}</span>
              <h1 className="pd-title">{product.name}</h1>

              {/* Ratings summary */}
              <div className="pd-rating-row">
                <div className="pd-stars">
                  <span>★ {product.average_rating}</span>
                </div>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span 
                  className="pd-rating-text" 
                  onClick={() => {
                    setActiveTab('reviews');
                    const el = document.getElementById('pd-tabs-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {product.review_count} customer review{product.review_count !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Product specifications teaser */}
              <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                {product.description}
              </p>

              {/* Info checklist */}
              <div className="pd-meta-list">
                <div className="pd-meta-item">
                  <span className="pd-meta-label">Category:</span>
                  <span className="pd-meta-val">{product.category}</span>
                </div>
                {product.subcategory && (
                  <div className="pd-meta-item">
                    <span className="pd-meta-label">Subcategory:</span>
                    <span className="pd-meta-val">{product.subcategory}</span>
                  </div>
                )}
                <div className="pd-meta-item">
                  <span className="pd-meta-label">Merchant:</span>
                  <span className="pd-meta-val" style={{ color: '#6366f1' }}>{product.seller?.name || 'Authorized Seller'}</span>
                </div>
                <div className="pd-meta-item">
                  <span className="pd-meta-label">Warranty:</span>
                  <span className="pd-meta-val">1 Year Brand Warranty</span>
                </div>
              </div>
            </div>

            {/* Buy Box Column */}
            <div className="pd-buy-box-wrapper">
              <div className="pd-buy-box">
                {/* Pricing info */}
                <div className="pd-price-row">
                  <div className="pd-price-label">Deal Price</div>
                  <div className="pd-price-amount">
                    <span style={{ fontSize: 20, fontWeight: 700, alignSelf: 'flex-start', marginTop: 2 }}>$</span>
                    {product.price.toFixed(2)}
                  </div>
                </div>

                {/* Stock status indicator */}
                <div>
                  {isOutOfStock ? (
                    <span className="pd-stock-badge pd-stock-out">✕ Temporarily Out of Stock</span>
                  ) : product.stock <= 10 ? (
                    <span className="pd-stock-badge pd-stock-low">⚠ Only {product.stock} items left in stock</span>
                  ) : (
                    <span className="pd-stock-badge pd-stock-instock">✓ In Stock ({product.stock} available)</span>
                  )}
                </div>

                {/* Quantity select */}
                {!isOutOfStock && (
                  <div className="pd-qty-row">
                    <span className="pd-qty-label">Quantity:</span>
                    <div className="pd-qty-selector">
                      <button
                        className="pd-qty-btn"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(prev => prev - 1)}
                      >
                        -
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 700, width: 20, textAlign: 'center' }}>{quantity}</span>
                      <button
                        className="pd-qty-btn"
                        disabled={quantity >= product.stock}
                        onClick={() => setQuantity(prev => prev + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pd-actions">
                  <button
                    className="pd-btn pd-btn-primary"
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
                      // Add selected quantity of products to cart
                      for (let i = 0; i < quantity; i++) {
                        addToCart(p);
                      }
                      alert(`Successfully added ${quantity} item(s) to Cart!`);
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    className="pd-btn pd-btn-secondary"
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
                    className={`pd-btn ${isWishlisted ? 'pd-btn-wishlisted' : 'pd-btn-secondary'}`}
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
                      } else {
                        addToWishlist(p);
                      }
                    }}
                  >
                    <svg width="16" height="16" fill={isWishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isWishlisted ? 'Remove Wishlist' : 'Add to Wishlist'}
                  </button>
                </div>

                <div style={{ marginTop: 20, fontSize: 11, color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
                  🔒 Secure transaction. Qualifying items enjoy free shipping.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Specification/Reviews Tabs */}
          <div className="pd-tabs-container" id="pd-tabs-section">
            <div className="pd-tabs-header">
              <button
                className={`pd-tab-trigger ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button
                className={`pd-tab-trigger ${activeTab === 'specifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('specifications')}
              >
                Specifications
              </button>
              <button
                className={`pd-tab-trigger ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({product.review_count})
              </button>
            </div>

            {/* Tab content renderer */}
            <div className="pd-tab-content">
              {activeTab === 'description' && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>About this item</h3>
                  <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>{product.description}</p>
                </div>
              )}

              {activeTab === 'specifications' && (
                <table className="pd-spec-table">
                  <tbody>
                    <tr>
                      <td className="pd-spec-label">Item SKU</td>
                      <td className="pd-spec-val" style={{ fontFamily: 'monospace' }}>{product.sku || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="pd-spec-label">Category</td>
                      <td className="pd-spec-val">{product.category}</td>
                    </tr>
                    {product.subcategory && (
                      <tr>
                        <td className="pd-spec-label">Subcategory</td>
                        <td className="pd-spec-val">{product.subcategory}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="pd-spec-label">Seller Store</td>
                      <td className="pd-spec-val">{product.seller?.name || 'Standard Store'}</td>
                    </tr>
                    <tr>
                      <td className="pd-spec-label">Stock Status</td>
                      <td className="pd-spec-val">{product.stock} units currently listed</td>
                    </tr>
                    <tr>
                      <td className="pd-spec-label">Warranty Duration</td>
                      <td className="pd-spec-val">1 Year standard warranty coverage</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {activeTab === 'reviews' && (
                <div className="pd-reviews-layout">
                  {/* Reviews Summary distribution chart */}
                  <div>
                    <div className="pd-review-summary-box">
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Customer Ratings</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="pd-avg-rating-big">{product.average_rating}</div>
                        <div>
                          <div className="pd-stars" style={{ fontSize: 13 }}>★ ★ ★ ★ ★</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 600 }}>{product.review_count} ratings</div>
                        </div>
                      </div>

                      {/* Distribution breakdown chart */}
                      <div className="pd-distribution">
                        {[5, 4, 3, 2, 1].map(stars => {
                          const pct = product.rating_distribution[stars] || 0.0;
                          return (
                            <div key={stars} className="pd-dist-row">
                              <span style={{ width: 45 }}>{stars} Star</span>
                              <div className="pd-dist-bar-bg">
                                <div className="pd-dist-bar-fill" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="pd-dist-percent">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Write Review Form */}
                    <div className="pd-review-form">
                      <h4 className="pd-review-form-title">Write a Customer Review</h4>
                      <form onSubmit={handleSubmitReview}>
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Overall Rating</span>
                          <div className="pd-star-picker">
                            {[1, 2, 3, 4, 5].map(stars => (
                              <button
                                key={stars}
                                type="button"
                                className={`pd-star-pick-btn ${reviewRating >= stars ? 'active' : ''}`}
                                onClick={() => setReviewRating(stars)}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Write comment</span>
                          <textarea
                            className="pd-comment-textarea"
                            placeholder="What did you like or dislike about this product?"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            required
                          />
                        </div>

                        {reviewFormError && (
                          <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, marginBottom: 12 }}>⚠ {reviewFormError}</p>
                        )}

                        <button
                          type="submit"
                          className="pd-btn pd-btn-primary"
                          style={{ padding: '8px 16px', fontSize: 12, width: 'auto' }}
                          disabled={submittingReview}
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="pd-reviews-list">
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Top Reviews</h3>
                    {product.reviews.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: 13, padding: '16px 0' }}>No reviews yet. Be the first to review this product!</p>
                    ) : (
                      product.reviews.map(rev => (
                        <div key={rev.id} className="pd-review-card">
                          <div className="pd-review-user-row">
                            <div className="pd-review-avatar">
                              {rev.user_profile_pic ? (
                                <img src={rev.user_profile_pic} alt={rev.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                rev.user_name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="pd-review-username">{rev.user_name}</div>
                              <div className="pd-review-date">Reviewed on {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'recent'}</div>
                            </div>
                          </div>
                          <div className="pd-review-stars">
                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                          </div>
                          <div className="pd-review-comment">{rev.comment || 'No written comment provided.'}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
};
