import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import type { Product } from './Homepage';

interface Address {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_active: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutProps {
  cart: CartItem[];
  onOrderPlaced: () => void;
  onCancel: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ cart, onOrderPlaced, onCancel }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Address creation form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [addressMessage, setAddressMessage] = useState({ text: '', isError: false });

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await apiClient.get('/address');
      if (response.data && response.data.success) {
        const addrList = response.data.data;
        setAddresses(addrList);
        if (addrList.length > 0) {
          setSelectedAddressId(addrList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressMessage({ text: '', isError: false });

    if (!addressLine1 || !city || !state || !zipCode || !country) {
      setAddressMessage({ text: 'Please fill out all required fields.', isError: true });
      return;
    }

    try {
      const response = await apiClient.post('/address', {
        address_line_1: addressLine1,
        address_line_2: addressLine2 || undefined,
        city,
        state,
        zip_code: zipCode,
        country
      });

      if (response.data && response.data.success) {
        const newAddress = response.data.data;
        setAddresses((prev) => [...prev, newAddress]);
        setSelectedAddressId(newAddress.id);
        setShowAddressForm(false);
        // Clear form
        setAddressLine1('');
        setAddressLine2('');
        setCity('');
        setState('');
        setZipCode('');
        setCountry('');
      }
    } catch (err: any) {
      setAddressMessage({
        text: err.response?.data?.message || 'Failed to save address.',
        isError: true
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setOrderError('Please select or add a shipping address.');
      return;
    }

    setPlacingOrder(true);
    setOrderError(null);

    try {
      const response = await apiClient.post('/order', {
        address_id: selectedAddressId
      });

      if (response.data && response.data.success) {
        alert('Order placed successfully! Thank you for shopping with us.');
        onOrderPlaced();
      } else {
        setOrderError(response.data.message || 'Failed to place order.');
      }
    } catch (err: any) {
      setOrderError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0.0 : 15.0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 font-sans select-none">
      <h2 className="text-2xl font-bold text-zinc-900 mb-8 border-b border-zinc-200 pb-4">Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Address & Cart details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Shipping Address */}
          <div className="bg-white rounded-lg shadow-xs border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-zinc-900">1. Select Shipping Address</h3>
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer bg-transparent border-0"
                >
                  + Add New Address
                </button>
              )}
            </div>

            {loadingAddresses ? (
              <div className="text-zinc-500 text-sm">Loading addresses...</div>
            ) : showAddressForm ? (
              <form onSubmit={handleCreateAddress} className="bg-zinc-50 border border-zinc-200 rounded-lg p-5 space-y-4">
                <h4 className="font-bold text-sm text-zinc-800">Add a new address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-600">Address Line 1 *</label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-600">Address Line 2</label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-600">City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-600">State *</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-600">Zip / Postal Code *</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-600">Country *</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>

                {addressMessage.text && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-md text-xs font-medium border border-red-200">
                    {addressMessage.text}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-xs font-semibold cursor-pointer"
                  >
                    Save & Use Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-md text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : addresses.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-zinc-300 rounded-lg text-zinc-600 text-sm">
                <p className="mb-3">No shipping addresses found.</p>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md text-xs cursor-pointer"
                >
                  + Add Your First Address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label 
                    key={addr.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedAddressId === addr.id 
                        ? 'border-orange-500 bg-orange-50/20' 
                        : 'border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping_address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-orange-500 cursor-pointer"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-zinc-900">{addr.address_line_1}</p>
                      {addr.address_line_2 && <p className="text-zinc-500 text-xs">{addr.address_line_2}</p>}
                      <p className="text-zinc-500 text-xs">
                        {addr.city}, {addr.state} {addr.zip_code}
                      </p>
                      <p className="text-zinc-500 text-xs font-semibold">{addr.country}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Review Items */}
          <div className="bg-white rounded-lg shadow-xs border border-zinc-200 p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">2. Review Items</h3>
            <div className="divide-y divide-zinc-200">
              {cart.map((item) => (
                <div key={item.product.id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-contain rounded-md border border-zinc-200 bg-white p-1"
                  />
                  <div className="flex-1 text-sm">
                    <h4 className="font-bold text-zinc-900">{item.product.name}</h4>
                    <p className="text-zinc-500 text-xs">Qty: {item.quantity}</p>
                    <p className="text-zinc-400 text-xs mt-1">Category: {item.product.category}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold text-zinc-900">${(item.product.price * item.quantity).toFixed(2)}</p>
                    <p className="text-zinc-400 text-xs">${item.product.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Checkout Action */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-xs border border-zinc-200 p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">Order Summary</h3>
            
            <div className="space-y-3 text-sm text-zinc-600 border-b border-zinc-250 pb-4">
              <div className="flex justify-between">
                <span>Items:</span>
                <span className="font-medium text-zinc-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-medium text-zinc-900">
                  {shipping === 0.0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%):</span>
                <span className="font-medium text-zinc-900">${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-zinc-900 py-4">
              <span>Order Total:</span>
              <span className="text-orange-600">${total.toFixed(2)}</span>
            </div>

            {orderError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-md border border-red-200">
                {orderError}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || addresses.length === 0}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 rounded-md text-sm font-bold shadow-xs cursor-pointer transition-all active:scale-98"
            >
              {placingOrder ? 'Processing...' : 'Place Your Order'}
            </button>

            <button
              onClick={onCancel}
              className="w-full mt-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-xs font-semibold cursor-pointer transition-all border border-zinc-350"
            >
              Back to Shopping
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
