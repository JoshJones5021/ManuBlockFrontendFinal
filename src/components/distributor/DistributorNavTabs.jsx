// src/components/distributor/DistributorNavTabs.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const DistributorNavTabs = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const tabs = [
    { path: '/distributor/transports', label: 'All Transports' },
    { path: '/distributor/material-pickups/schedule', label: 'Material Pickups' },
    { path: '/distributor/product-deliveries/schedule', label: 'Product Deliveries' },
    { path: '/distributor/active-transports', label: 'In Transit' },
    { path: '/distributor/completed', label: 'Completed Deliveries' },
  ];

  return (
    <div className="mb-6 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              currentPath === tab.path || 
              (tab.path !== '/distributor/transports' && currentPath.startsWith(tab.path))
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default DistributorNavTabs;