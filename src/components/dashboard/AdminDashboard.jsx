import React, { useState, useEffect } from 'react';
import { adminService, supplyChainService } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSupplyChains: 0,
    usersByRole: {},
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentSupplyChains, setRecentSupplyChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        let users = [];
        try {
          const usersResponse = await adminService.getAllUsers();
          users = usersResponse.data || [];
        } catch (err) {
          console.error('Error fetching users:', err);
        }

        let chains = [];
        try {
          const chainsResponse = await supplyChainService.getSupplyChains();
          chains = chainsResponse.data || [];
        } catch (err) {
          console.error('Error fetching supply chains:', err);
        }

        const usersByRole = users.reduce((acc, user) => {
          const role = user.role || 'Unknown';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});

        setStats({
          totalUsers: users.length,
          totalSupplyChains: chains.length,
          usersByRole,
        });

        if (users.length > 0) {
          const sortedUsers = [...users].sort(
            (a, b) =>
              new Date(b.createdAt || Date.now()) -
              new Date(a.createdAt || Date.now())
          );
          setRecentUsers(sortedUsers.slice(0, 5));
        }

        if (chains.length > 0) {
          const sortedChains = [...chains].sort(
            (a, b) =>
              new Date(b.createdAt || Date.now()) -
              new Date(a.createdAt || Date.now())
          );
          setRecentSupplyChains(sortedChains.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderDashboard = () => {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-full p-3">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-gray-600 text-sm font-medium">
                  Total Users
                </h2>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-full p-3">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-gray-600 text-sm font-medium">
                  Supply Chains
                </h2>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats.totalSupplyChains}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-500 rounded-full p-3">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-gray-600 text-sm font-medium">
                  Blockchain Status
                </h2>
                <p className="text-green-600 font-semibold">Connected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users by Role */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Users by Role</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.keys(stats.usersByRole).length > 0 ? (
                Object.entries(stats.usersByRole).map(([role, count]) => (
                  <div
                    key={role}
                    className="bg-gray-100 rounded-lg p-4 text-center"
                  >
                    <p className="text-gray-500 text-sm">
                      {role.charAt(0) + role.slice(1).toLowerCase()}
                    </p>
                    <p className="text-2xl font-bold text-gray-800">{count}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-5 text-center py-4 text-gray-500">
                  No user role data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
              {recentUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentUsers.map(user => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No user data available
                </div>
              )}
            </div>
          </div>

          {/* Recent Supply Chains */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Recent Supply Chains
              </h2>
              {recentSupplyChains.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentSupplyChains.map(chain => (
                        <tr key={chain.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {chain.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {chain.description?.substring(0, 30)}...
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {chain.createdBy?.username || 'Unknown'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No supply chain data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-1">{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-200 hover:bg-red-300 text-red-800 font-bold py-1 px-3 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {renderDashboard()}
    </div>
  );
};

export default AdminDashboard;
