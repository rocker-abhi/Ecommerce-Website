import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

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



interface AccountSettingsProps {
  onBackToStore: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onBackToStore }) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password' | 'addresses'>('profile');
  
  // Profile state

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(25);
  const [profilePic, setProfilePic] = useState('');
  const [profileMessage, setProfileMessage] = useState({ text: '', isError: false });
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Password Reset state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ text: '', isError: false });
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [addressMessage, setAddressMessage] = useState({ text: '', isError: false });

  // Fetch User Info
  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data && response.data.success) {
        const u = response.data.data;
        setName(u.name);
        setEmail(u.email);
        setAge(u.age || 25);
        setProfilePic(u.profile_picture_url || '');
      }
    } catch (err) {
      console.error('Failed to load user info:', err);
    }
  };

  // Fetch Addresses
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await apiClient.get('/address');
      if (response.data && response.data.success) {
        setAddresses(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchAddresses();
  }, []);

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileMessage({ text: '', isError: false });
    try {
      const response = await apiClient.put('/auth/me', {
        name,
        email,
        age,
        profile_picture_url: profilePic
      });
      if (response.data && response.data.success) {
        setProfileMessage({ text: 'Profile updated successfully!', isError: false });
      } else {
        setProfileMessage({ text: response.data.message || 'Update failed', isError: true });
      }
    } catch (err: any) {
      setProfileMessage({
        text: err.response?.data?.message || 'Failed to update profile.',
        isError: true
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ text: '', isError: false });

    if (!password) {
      setPasswordMessage({ text: 'Password is required.', isError: true });
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match.', isError: true });
      return;
    }

    setLoadingPassword(true);
    try {
      const response = await apiClient.post('/auth/reset-password', {
        password,
        confirm_password: confirmPassword
      });
      if (response.data && response.data.success) {
        setPasswordMessage({ text: 'Password reset successfully!', isError: false });
        setPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ text: response.data.message || 'Reset failed', isError: true });
      }
    } catch (err: any) {
      setPasswordMessage({
        text: err.response?.data?.message || 'Failed to reset password.',
        isError: true
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  // Create or Update Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressMessage({ text: '', isError: false });

    if (!addressLine1 || !city || !state || !zipCode || !country) {
      setAddressMessage({ text: 'Please fill out all required fields.', isError: true });
      return;
    }

    const payload = {
      address_line_1: addressLine1,
      address_line_2: addressLine2 || undefined,
      city,
      state,
      zip_code: zipCode,
      country
    };

    try {
      if (editingAddress) {
        const response = await apiClient.put(`/address/${editingAddress.id}`, payload);
        if (response.data && response.data.success) {
          setAddressMessage({ text: 'Address updated successfully!', isError: false });
          setEditingAddress(null);
          setShowAddressForm(false);
          fetchAddresses();
        }
      } else {
        const response = await apiClient.post('/address', payload);
        if (response.data && response.data.success) {
          setAddressMessage({ text: 'Address created successfully!', isError: false });
          setShowAddressForm(false);
          fetchAddresses();
        }
      }
      // Reset form
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('');
      setZipCode('');
      setCountry('');
    } catch (err: any) {
      setAddressMessage({
        text: err.response?.data?.message || 'Failed to save address.',
        isError: true
      });
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const response = await apiClient.delete(`/address/${id}`);
      if (response.data && response.data.success) {
        fetchAddresses();
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  // Open Edit Address Form
  const startEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressLine1(addr.address_line_1);
    setAddressLine2(addr.address_line_2 || '');
    setCity(addr.city);
    setState(addr.state);
    setZipCode(addr.zip_code);
    setCountry(addr.country);
    setShowAddressForm(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 select-none">
      
      {/* Back button */}
      <button 
        onClick={onBackToStore}
        className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-orange-600 cursor-pointer mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Storefront
      </button>

      <div className="bg-white rounded-lg shadow-md border border-zinc-200 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Sidebar navigation */}
        <aside className="w-full md:w-64 bg-zinc-50 border-r border-zinc-200 p-6 flex flex-col gap-1">
          <h2 className="text-lg font-bold text-zinc-800 mb-4 px-2">Account Settings</h2>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-orange-50 text-orange-600 font-semibold'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Profile Details
          </button>
          <button
            onClick={() => setActiveSubTab('password')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeSubTab === 'password'
                ? 'bg-orange-50 text-orange-600 font-semibold'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Reset Password
          </button>
          <button
            onClick={() => setActiveSubTab('addresses')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeSubTab === 'addresses'
                ? 'bg-orange-50 text-orange-600 font-semibold'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Manage Addresses
          </button>
        </aside>

        {/* Right Content Panels */}
        <main className="flex-1 p-8">
          
          {/* PROFILE SUBTAB */}
          {activeSubTab === 'profile' && (
            <div>
              <h3 className="text-xl font-bold text-zinc-800 mb-6 pb-2 border-b border-zinc-200">Profile Details</h3>
              <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-6">
                
                {/* Profile Pic Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-zinc-200 border-2 border-zinc-350 shadow-inner flex items-center justify-center">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-12 h-12 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Profile Picture URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={profilePic}
                      onChange={(e) => setProfilePic(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                    <p className="text-[11px] text-zinc-400">Provide a direct URL to a profile image.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-600">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-600">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-600">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                      required
                      min={19}
                      max={99}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>

                {profileMessage.text && (
                  <div className={`p-3 rounded-md text-xs font-medium ${
                    profileMessage.isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}>
                    {profileMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingProfile}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-semibold shadow-xs cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                >
                  {loadingProfile ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </form>
            </div>
          )}

          {/* PASSWORD SUBTAB */}
          {activeSubTab === 'password' && (
            <div>
              <h3 className="text-xl font-bold text-zinc-800 mb-6 pb-2 border-b border-zinc-200">Reset Password</h3>
              <form onSubmit={handleResetPassword} className="max-w-md space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-600">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-600">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-orange-500 bg-white"
                  />
                </div>

                {passwordMessage.text && (
                  <div className={`p-3 rounded-md text-xs font-medium ${
                    passwordMessage.isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingPassword}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-semibold shadow-xs cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                >
                  {loadingPassword ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          )}

          {/* ADDRESSES SUBTAB */}
          {activeSubTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-200">
                <h3 className="text-xl font-bold text-zinc-800">Manage Addresses</h3>
                {!showAddressForm && (
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      setShowAddressForm(true);
                    }}
                    className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Address
                  </button>
                )}
              </div>

              {/* Add/Edit Address Form */}
              {showAddressForm && (
                <form onSubmit={handleSaveAddress} className="mb-8 p-5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-4">
                  <h4 className="font-bold text-sm text-zinc-800">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h4>
                  
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
                      <label className="block text-xs font-bold text-zinc-600">Address Line 2 (Optional)</label>
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
                    <div className={`p-3 rounded-md text-xs font-medium ${
                      addressMessage.isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {addressMessage.text}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-xs font-semibold cursor-pointer transition-all"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                      }}
                      className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-md text-xs font-semibold cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* List Addresses */}
              {loadingAddresses ? (
                <div className="text-zinc-500 text-sm">Loading addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-zinc-300 rounded-lg text-zinc-500 text-sm">
                  No addresses registered. Please add a new address above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      className="p-4 border border-zinc-200 rounded-lg shadow-2xs bg-white relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Address</span>
                        </div>
                        <p className="font-bold text-sm text-zinc-950">{addr.address_line_1}</p>
                        {addr.address_line_2 && <p className="text-zinc-600 text-xs">{addr.address_line_2}</p>}
                        <p className="text-zinc-600 text-xs mt-1">
                          {addr.city}, {addr.state} {addr.zip_code}
                        </p>
                        <p className="text-zinc-600 text-xs font-semibold">{addr.country}</p>
                      </div>

                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-100">
                        <button
                          onClick={() => startEditAddress(addr)}
                          className="text-xs font-bold text-zinc-600 hover:text-orange-600 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
