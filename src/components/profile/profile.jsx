import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api';

const Profile = () => {
  const { currentUser, setCurrentUser, connectWallet, logout } = useAuth();
  
  // Initialize with empty values first
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  
  const [walletAddress, setWalletAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [adminWallet, setAdminWallet] = useState(null);

  // Fetch admin wallet
  useEffect(() => {
    const fetchAdminWallet = async () => {
      if (currentUser && currentUser.role !== 'ADMIN') {
        try {
          const response = await adminService.getAllUsers();
          const admins = response.data.filter(
            user => user.role === 'ADMIN' && user.walletAddress
          );
          if (admins.length > 0) {
            setAdminWallet(admins[0].walletAddress);
          }
        } catch (err) {
          console.error('Error fetching admin wallet:', err);
        }
      }
    };

    fetchAdminWallet();
  }, [currentUser]);

  // Update form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      // Force update with the spread operator to ensure React detects the change
      setFormData(prevData => ({
        ...prevData,
        username: currentUser.username || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
  
    try {
      const response = await adminService.updateUser(currentUser.id, {
        email: formData.email,
      });

      const updatedUser = { 
        ...currentUser, 
        email: response.data.email,
        sub: response.data.email 
      };
      
      setCurrentUser(updatedUser);

      localStorage.setItem('user', JSON.stringify(updatedUser));
  
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
    } catch (error) {
      setMessage({
        text: 'Failed to update profile. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    if (currentUser.role !== 'ADMIN') {
      setMessage({
        text: 'Only admin users can connect a wallet. Your operations will use the admin wallet automatically.',
        type: 'info',
      });
      return;
    }

    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setWalletAddress(accounts[0]);

        await connectWallet(accounts[0]);

        setMessage({ text: 'Wallet connected successfully!', type: 'success' });
      } else {
        setMessage({
          text: 'MetaMask is not installed. Please install it to connect your wallet.',
          type: 'error',
        });
      }
    } catch (error) {
      setMessage({
        text: 'Failed to connect wallet: ' + error.message,
        type: 'error',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">User Profile</h1>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-md ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : message.type === 'info'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium">Profile Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Username
                </label>
                <div className="py-2 px-3 bg-gray-100 border rounded text-gray-700">
                  {currentUser?.username
                    ? currentUser.username
                    : 'Not specified'}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                {!isEditing ? (
                  <div className="py-2 px-3 bg-gray-100 border rounded text-gray-700">
                    {currentUser?.sub ? currentUser.sub : 'Not specified'}
                  </div>
                ) : (
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.sub}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                )}
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Role
                </label>
                <div className="py-2 px-3 bg-gray-100 border rounded text-gray-700">
                  {currentUser?.role
                    ? currentUser.role.charAt(0) +
                      currentUser.role.slice(1).toLowerCase()
                    : 'Not specified'}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-medium mb-6">Blockchain Wallet</h2>

          {/* Display different wallet sections based on user role */}
          {currentUser.role === 'ADMIN' ? (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Admin Wallet Status
              </label>
              {currentUser?.walletAddress ? (
                <div className="mb-4">
                  <div className="py-2 px-3 bg-green-100 border border-green-200 rounded text-green-700 break-all">
                    Connected: {currentUser.walletAddress}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    This wallet address is used for blockchain transactions for
                    all users.
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="py-2 px-3 bg-yellow-100 border border-yellow-200 rounded text-yellow-700">
                    No wallet connected
                  </div>
                  <p className="text-sm text-red-500 mt-1">
                    <strong>Important:</strong> As an admin, you need to connect
                    a wallet to enable blockchain features for all users.
                  </p>
                </div>
              )}

              {!currentUser?.walletAddress && (
                <div className="mt-4">
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={e => setWalletAddress(e.target.value)}
                    placeholder="Enter wallet address manually or connect MetaMask"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleConnectWallet}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex-1"
                    >
                      Connect with MetaMask
                    </button>
                    <button
                      onClick={() => {
                        if (walletAddress) {
                          connectWallet(walletAddress);
                          setMessage({
                            text: 'Wallet connected successfully!',
                            type: 'success',
                          });
                        } else {
                          setMessage({
                            text: 'Please enter a wallet address',
                            type: 'error',
                          });
                        }
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex-1"
                      disabled={!walletAddress}
                    >
                      Connect Manually
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Blockchain Wallet Status
              </label>

              <div className="py-2 px-3 bg-blue-50 border border-blue-200 rounded text-blue-700">
                <p className="font-medium">
                  Using Admin Wallet for Blockchain Operations
                </p>
                {adminWallet ? (
                  <div className="mt-2 text-sm">
                    <span className="bg-blue-100 px-2 py-1 rounded">
                      Admin wallet connected
                    </span>
                    <p className="mt-2 text-gray-600">
                      Your operations are using the admin's wallet for
                      blockchain transactions. This ensures consistent
                      blockchain tracking across all users.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-yellow-600">
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      No admin wallet connected
                    </span>
                    <p className="mt-2">
                      Blockchain operations are currently unavailable because no
                      admin wallet is connected. Please contact your
                      administrator to enable blockchain features.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-medium mb-6">Account Actions</h2>

          <div className="space-y-4">
            <div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to log out?')) {
                    logout();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full md:w-auto"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;