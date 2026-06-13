import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useToast } from '../context/ToastContext';

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
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password' | 'addresses'>('profile');
  
  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(25);
  const [profilePic, setProfilePic] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Password Reset state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
  const [savingAddress, setSavingAddress] = useState(false);

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
    try {
      const response = await apiClient.put('/auth/me', {
        name,
        email,
        age,
        profile_picture_url: profilePic
      });
      if (response.data && response.data.success) {
        showToast('success', 'Profile Updated', 'Your settings have been saved successfully.');
      } else {
        showToast('error', 'Update Failed', response.data.message || 'Unable to update profile.');
      }
    } catch (err: any) {
      showToast('error', 'Update Error', err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      showToast('warning', 'Validation Error', 'Password is required.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoadingPassword(true);
    try {
      const response = await apiClient.post('/auth/reset-password', {
        password,
        confirm_password: confirmPassword
      });
      if (response.data && response.data.success) {
        showToast('success', 'Password Changed', 'Your password has been reset successfully.');
        setPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', 'Reset Failed', response.data.message || 'Unable to reset password.');
      }
    } catch (err: any) {
      showToast('error', 'Reset Error', err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoadingPassword(false);
    }
  };

  // Create or Update Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressLine1 || !city || !state || !zipCode || !country) {
      showToast('warning', 'Incomplete Address', 'Please fill out all required fields.');
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

    setSavingAddress(true);
    try {
      if (editingAddress) {
        const response = await apiClient.put(`/address/${editingAddress.id}`, payload);
        if (response.data && response.data.success) {
          showToast('success', 'Address Updated', 'Your address has been saved.');
          setEditingAddress(null);
          setShowAddressForm(false);
          fetchAddresses();
        }
      } else {
        const response = await apiClient.post('/address', payload);
        if (response.data && response.data.success) {
          showToast('success', 'Address Added', 'New address added to your profile.');
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
      showToast('error', 'Save Address Error', err.response?.data?.message || 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const response = await apiClient.delete(`/address/${id}`);
      if (response.data && response.data.success) {
        showToast('success', 'Address Deleted', 'The address has been removed.');
        fetchAddresses();
      } else {
        showToast('error', 'Delete Failed', response.data.message || 'Unable to delete address.');
      }
    } catch (err: any) {
      showToast('error', 'Delete Error', err.response?.data?.message || 'Failed to delete address.');
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
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up select-none">
      
      {/* Back button */}
      <button 
        onClick={onBackToStore}
        className="btn-secondary group mb-6 cursor-pointer"
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
        Back to Appolo
      </button>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Left */}
        <aside className="md:col-span-1 flex flex-col gap-3">
          <div className="glass-card-static p-6 flex flex-col gap-2">
            <h2 className="text-lg font-bold text-gradient-blue mb-4">Settings</h2>
            
            <button
              onClick={() => setActiveSubTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                activeSubTab === 'profile'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 glow-accent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>

            <button
              onClick={() => setActiveSubTab('password')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                activeSubTab === 'password'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 glow-accent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password
            </button>

            <button
              onClick={() => setActiveSubTab('addresses')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                activeSubTab === 'addresses'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 glow-accent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Addresses
            </button>
          </div>
        </aside>

        {/* Content Right */}
        <main className="md:col-span-3">
          <div className="glass-card-static p-8 min-h-[500px]">
            
            {/* PROFILE SUBTAB */}
            {activeSubTab === 'profile' && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                  <span>Profile Settings</span>
                </h3>
                
                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                  
                  {/* Avatar Upload Preview Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-white/3 border border-white/5">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-indigo-500/40 shadow-inner flex items-center justify-center group">
                      {profilePic ? (
                        <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-12 h-12 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <label className="form-label">Profile Picture URL</label>
                      <input
                        type="text"
                        placeholder="https://example.com/avatar.jpg"
                        value={profilePic}
                        onChange={(e) => setProfilePic(e.target.value)}
                        className="glass-input"
                      />
                      <p className="text-[11px] text-slate-400">Specify an image web URL to customize your visual profile.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="glass-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="glass-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="form-label">Age</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                        required
                        min={19}
                        max={99}
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loadingProfile}
                      className="btn-primary w-full sm:w-auto min-w-[150px]"
                    >
                      {loadingProfile ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving Settings...
                        </>
                      ) : 'Save Settings'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PASSWORD SUBTAB */}
            {activeSubTab === 'password' && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-slate-100 mb-6">Reset Password</h3>
                <form onSubmit={handleResetPassword} className="space-y-5 max-w-md">
                  
                  <div className="space-y-2">
                    <label className="form-label">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="glass-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="glass-input"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loadingPassword}
                      className="btn-primary w-full sm:w-auto min-w-[150px]"
                    >
                      {loadingPassword ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Resetting...
                        </>
                      ) : 'Reset Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ADDRESSES SUBTAB */}
            {activeSubTab === 'addresses' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-100">Addresses</h3>
                  {!showAddressForm && (
                    <button
                      onClick={() => {
                        setEditingAddress(null);
                        setShowAddressForm(true);
                      }}
                      className="btn-primary !px-4 !py-2 text-xs flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Address
                    </button>
                  )}
                </div>

                {/* Add/Edit Address Form */}
                {showAddressForm && (
                  <form onSubmit={handleSaveAddress} className="mb-8 p-6 rounded-xl bg-white/3 border border-white/5 space-y-4 animate-scale-in">
                    <h4 className="font-bold text-sm text-indigo-400">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="form-label">Address Line 1 *</label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          required
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="form-label">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="form-label">State *</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          required
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="form-label">Zip / Postal Code *</label>
                        <input
                          type="text"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          required
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="form-label">Country *</label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          required
                          className="glass-input"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="btn-primary !px-4 !py-2 text-xs"
                      >
                        {savingAddress ? 'Saving...' : 'Save Address'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                        }}
                        className="btn-secondary !px-4 !py-2 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* List Addresses */}
                {loadingAddresses ? (
                  <div className="flex justify-center items-center py-12">
                    <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-slate-500 text-sm">
                    No addresses registered. Please add a new address to proceed.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id}
                        className="glass-card p-5 relative flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="badge badge-accent">Address Card</span>
                          </div>
                          <p className="font-bold text-sm text-slate-100">{addr.address_line_1}</p>
                          {addr.address_line_2 && <p className="text-slate-400 text-xs mt-0.5">{addr.address_line_2}</p>}
                          <p className="text-slate-400 text-xs mt-1">
                            {addr.city}, {addr.state} {addr.zip_code}
                          </p>
                          <p className="text-slate-300 text-xs font-semibold mt-1">{addr.country}</p>
                        </div>

                        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
                          <button
                            onClick={() => startEditAddress(addr)}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
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

          </div>
        </main>
      </div>
    </div>
  );
};
