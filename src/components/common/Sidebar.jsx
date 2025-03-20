// src/components/common/Sidebar.jsx - Updated with simplified distributor routes
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api';

const Sidebar = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [adminWalletConnected, setAdminWalletConnected] = useState(false);

  useEffect(() => {
    const checkAdminWallet = async () => {
      try {
        // For admin users, check their own wallet
        if (currentUser.role === 'ADMIN') {
          setAdminWalletConnected(!!currentUser.walletAddress);
        } else {
          // For non-admin users, fetch admin users and check if any admin has a wallet
          const response = await adminService.getAllUsers();
          const admins = response.data.filter(user => user.role === 'ADMIN' && user.walletAddress);
          setAdminWalletConnected(admins.length > 0);
        }
      } catch (error) {
        console.error('Error checking admin wallet:', error);
        setAdminWalletConnected(false);
      }
    };
    
    if (currentUser) {
      checkAdminWallet();
    }
  }, [currentUser]);
  
  // If no user or role, don't render the sidebar
  if (!currentUser || !currentUser.role) {
    return null;
  }
  
  // Determine which menu items to show based on role
  const getMenuItems = () => {
    const role = currentUser.role;
    
    // Common items for all roles
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/profile', label: 'Profile', icon: '👤' },
      { path: '/blockchain-traceability', label: 'Blockchain Tracing', icon: '📱' }
    ];
    
    // Role-specific items
    switch (role) {
      case 'ADMIN':
        return [
          ...items,
          { path: '/users', label: 'User Management', icon: '👥' },
          { path: '/supply-chains', label: 'Supply Chains', icon: '🔗' }
        ];
        
      case 'SUPPLIER':
        return [
          ...items,
          { path: '/supplier/materials', label: 'Materials', icon: '🧱' },
          { path: '/supplier/requests', label: 'Material Requests', icon: '📝' },
          { path: '/supplier/allocations', label: 'Allocations', icon: '📦' }
        ];
        
      case 'MANUFACTURER':
        return [
          ...items,
          { path: '/manufacturer/products', label: 'Products', icon: '🛠️' },
          { path: '/manufacturer/material-requests', label: 'Request Materials', icon: '📋' },
          { path: '/manufacturer/production', label: 'Production', icon: '🏭' },
          { path: '/manufacturer/orders', label: 'Orders', icon: '🧾' },
          { path: '/manufacturer/recycling', label: 'Recycling', icon: '♻️' }
        ];
        
      case 'DISTRIBUTOR':
        return [
          ...items,
          { path: '/distributor/transports', label: 'All Transports', icon: '🚚' },
          { path: '/distributor/recycling', label: 'Recycling', icon: '♻️' }
        ];
        
      case 'CUSTOMER':
        return [
          ...items,
          { path: '/customer/products', label: 'Browse Products', icon: '🛒' },
          { path: '/customer/orders', label: 'My Orders', icon: '📋' },
          { path: '/customer/tracking', label: 'Track Orders', icon: '🔍' },
          { path: '/customer/recycling', label: 'Recycling', icon: '♻️' }
        ];
        
      default:
        return items;
    }
  };
  
  const menuItems = getMenuItems();
  
  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{currentUser.username}</h2>
        <p className="text-gray-400 text-sm">{currentUser.role.charAt(0) + currentUser.role.slice(1).toLowerCase()}</p>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto pt-6 border-t border-gray-700 mt-6">
        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-gray-400">Blockchain Status</h3>
          <div className="mt-2 flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${adminWalletConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              {adminWalletConnected ? 'Enabled (Using Admin Wallet)' : 'Disabled (No Admin Wallet)'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;