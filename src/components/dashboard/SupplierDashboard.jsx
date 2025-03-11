// src/components/dashboard/SupplierDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplierService, blockchainService, adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SupplierDashboard = () => {
    const { currentUser } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [allocatedMaterials, setAllocatedMaterials] = useState(0);
    const [adminWalletConnected, setAdminWalletConnected] = useState(false);
    const [stats, setStats] = useState({
      totalMaterials: 0,
      totalAllocations: 0,
      pendingRequests: 0,
      lowStockMaterials: 0,
      blockchainTracked: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        fetchDashboardData();
        checkAdminWallet();
      }, [currentUser.id]);

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

    const fetchDashboardData = async () => {
        try {
        setLoading(true);
        
        // Fetch supplier materials
        const materialsResponse = await supplierService.getMaterials(currentUser.id);
        const materialsData = materialsResponse.data;
        setMaterials(materialsData);
        
        // Fetch pending material requests
        const pendingResponse = await supplierService.getPendingRequests(currentUser.id);
        const pendingData = pendingResponse.data;
        setPendingRequests(pendingData);
        
        // Fetch approved but not allocated requests
        const approvedResponse = await supplierService.getRequestsByStatus(currentUser.id, 'Approved');
        const approvedData = approvedResponse.data;
        setApprovedRequests(approvedData);
        
        // Mock fetch of allocated materials (would be an actual API call)
        const allocatedResponse = await supplierService.getRequestsByStatus(currentUser.id, 'Allocated');
        const totalAllocated = allocatedResponse.data.reduce((total, req) => {
            const requestAllocated = req.items.reduce((sum, item) => 
            item.status === 'Allocated' ? sum + item.allocatedQuantity : sum, 0);
            return total + requestAllocated;
        }, 0);
        setAllocatedMaterials(totalAllocated);
        
        // Calculate stats
        const lowStockCount = materialsData.filter(m => m.quantity < 100).length;
        const trackedCount = materialsData.filter(m => m.blockchainItemId).length;
        
        setStats({
            totalMaterials: materialsData.length,
            totalAllocations: totalAllocated,
            pendingRequests: pendingData.length,
            lowStockMaterials: lowStockCount,
            blockchainTracked: trackedCount
        });
        
        // Construct recent activities
        const activities = [];
        
        // Add recent request activities
        const allRequests = [...pendingData, ...approvedData, ...allocatedResponse.data]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5);
        
        allRequests.forEach(req => {
            let activityType;
            switch(req.status) {
            case 'Requested':
                activityType = 'new-request';
                break;
            case 'Approved':
                activityType = 'approved-request';
                break;
            case 'Allocated':
                activityType = 'allocated-materials';
                break;
            case 'Ready for Pickup':
                activityType = 'ready-for-pickup';
                break;
            default:
                activityType = 'request-update';
            }
            
            activities.push({
            id: `req-${req.id}`,
            type: activityType,
            time: new Date(req.updatedAt),
            details: {
                requestNumber: req.requestNumber,
                manufacturer: req.manufacturer.username,
                items: req.items.length
            }
            });
        });
        
        setRecentActivities(activities);
        setError(null);
        } catch (err) {
        console.error('Error fetching supplier dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        } finally {
        setLoading(false);
        }
    };

    const formatActivityTime = (date) => {
        const now = new Date();
        const diff = now - date;
        
        // Less than a day ago
        if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        if (hours < 1) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
        
        // Less than a week ago
        if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
        
        // More than a week ago
        return date.toLocaleDateString();
    };

    const getActivityIcon = (type) => {
        switch(type) {
        case 'new-request':
            return (
            <div className="bg-yellow-100 p-2 rounded-full">
                <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            </div>
            );
        case 'approved-request':
            return (
            <div className="bg-blue-100 p-2 rounded-full">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            );
        case 'allocated-materials':
            return (
            <div className="bg-purple-100 p-2 rounded-full">
                <svg className="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            </div>
            );
        case 'ready-for-pickup':
            return (
            <div className="bg-green-100 p-2 rounded-full">
                <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            </div>
            );
        default:
            return (
            <div className="bg-gray-100 p-2 rounded-full">
                <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            );
        }
    };

    const getActivityTitle = (activity) => {
        const { type, details } = activity;
        
        switch(type) {
        case 'new-request':
            return `New request #${details.requestNumber} from ${details.manufacturer}`;
        case 'approved-request':
            return `You approved request #${details.requestNumber} from ${details.manufacturer}`;
        case 'allocated-materials':
            return `Materials allocated for request #${details.requestNumber}`;
        case 'ready-for-pickup':
            return `Request #${details.requestNumber} ready for pickup`;
        default:
            return `Request #${details.requestNumber} updated`;
        }
    };

    if (loading && materials.length === 0) {
        return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        );
    }

    return (
        <div>
        <h1 className="text-2xl font-semibold mb-6">Supplier Dashboard</h1>
        
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
                <div className="bg-blue-500 rounded-full p-3">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                </div>
                <div className="ml-4">
                <h2 className="text-gray-600 text-sm font-medium">Total Materials</h2>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalMaterials}</p>
                </div>
            </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
                <div className="bg-green-500 rounded-full p-3">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                </div>
                <div className="ml-4">
                <h2 className="text-gray-600 text-sm font-medium">Pending Requests</h2>
                <p className="text-2xl font-semibold text-gray-800">{stats.pendingRequests}</p>
                </div>
            </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="bg-purple-500 rounded-full p-3">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    </div>
                    <div className="ml-4">
                    <h2 className="text-gray-600 text-sm font-medium">Blockchain Status</h2>
                    <p className={adminWalletConnected ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {adminWalletConnected ? "Enabled (Using Admin Wallet)" : "Disabled (No Admin Wallet)"}
                    </p>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Main Dashboard Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Left column */}
            <div className="md:col-span-2 space-y-6">
            {/* Pending Requests */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Pending Material Requests</h2>
                <Link to="/supplier/requests" className="text-blue-500 hover:text-blue-700 text-sm">View All</Link>
                </div>
                
                {pendingRequests.length === 0 ? (
                <div className="p-6 text-center">
                    <p className="text-gray-500">No pending material requests at the moment.</p>
                </div>
                ) : (
                <div className="p-6">
                    {pendingRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="mb-4 last:mb-0 border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">
                            Request #{request.requestNumber} from {request.manufacturer.username}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                            Requested: {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                            <div className="text-xs text-gray-500 mt-1">
                            {request.items.length} items | 
                            {request.requestedDeliveryDate ? 
                                ` Requested delivery: ${new Date(request.requestedDeliveryDate).toLocaleDateString()}` :
                                ' No specific delivery date'
                            }
                            </div>
                        </div>
                        <Link 
                            to={`/supplier/requests/${request.id}/approve`}
                            className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded"
                        >
                            Review
                        </Link>
                        </div>
                    </div>
                    ))}
                    
                    {pendingRequests.length > 3 && (
                    <div className="mt-4 text-center">
                        <Link to="/supplier/requests" className="text-blue-500 hover:text-blue-700 text-sm">
                        View {pendingRequests.length - 3} more pending requests
                        </Link>
                    </div>
                    )}
                </div>
                )}
            </div>
            
            {/* Approved Requests */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Approved Requests Pending Allocation</h2>
                <Link to="/supplier/allocations" className="text-blue-500 hover:text-blue-700 text-sm">Allocate Materials</Link>
                </div>
                
                {approvedRequests.length === 0 ? (
                <div className="p-6 text-center">
                    <p className="text-gray-500">No requests pending allocation.</p>
                </div>
                ) : (
                <div className="p-6">
                    {approvedRequests.slice(0, 2).map((request) => (
                    <div key={request.id} className="mb-4 last:mb-0 border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">
                            Request #{request.requestNumber} from {request.manufacturer.username}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                            Approved: {new Date(request.updatedAt).toLocaleDateString()}
                            </p>
                            <div className="text-xs text-gray-600 mt-1">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1">
                                {request.items.filter(item => item.status === 'Approved').length} items to allocate
                            </span>
                            </div>
                        </div>
                        <Link 
                            to="/supplier/allocations"
                            className="bg-purple-500 hover:bg-purple-700 text-white text-xs font-bold py-1 px-2 rounded"
                        >
                            Allocate
                        </Link>
                        </div>
                    </div>
                    ))}
                    
                    {approvedRequests.length > 2 && (
                    <div className="mt-4 text-center">
                        <Link to="/supplier/allocations" className="text-blue-500 hover:text-blue-700 text-sm">
                        View {approvedRequests.length - 2} more approved requests
                        </Link>
                    </div>
                    )}
                </div>
                )}
            </div>
            </div>
            
            {/* Right column */}
            <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
                </div>
                <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                    <Link 
                    to="/supplier/materials"
                    className="bg-green-50 hover:bg-green-100 p-4 rounded-lg border border-green-200 flex items-center"
                    >
                    <svg className="h-6 w-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-green-800">Manage Inventory</span>
                    </Link>
                    
                    <Link 
                    to="/supplier/requests"
                    className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg border border-yellow-200 flex items-center"
                    >
                    <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-yellow-800">Approve Requests</span>
                    </Link>
                    
                    <Link 
                    to="/supplier/allocations"
                    className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg border border-purple-200 flex items-center"
                    >
                    <svg className="h-6 w-6 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-purple-800">Allocate Materials</span>
                    </Link>
                </div>
                </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                </div>
                <div className="p-6">
                {recentActivities.length === 0 ? (
                    <div className="text-center">
                    <p className="text-gray-500">No recent activities.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                    {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex">
                        <div className="mr-4 flex-shrink-0">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1 pt-0.5">
                            <p className="text-sm font-medium text-gray-900">{getActivityTitle(activity)}</p>
                            <p className="text-xs text-gray-500">{formatActivityTime(activity.time)}</p>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            </div>
            </div>
        </div>
        
        {/* Materials Overview */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Materials Overview</h2>
            <Link to="/supplier/materials" className="text-blue-500 hover:text-blue-700 text-sm">Manage Inventory</Link>
            </div>
            
            {materials.length === 0 ? (
            <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">You haven't added any materials yet.</p>
                <Link to="/supplier/materials/create" className="text-blue-500 hover:text-blue-700">
                Add Your First Material
                </Link>
            </div>
            ) : (
            <div className="p-6">
                <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-800 font-medium">Total Materials</div>
                    <div className="text-2xl font-bold text-blue-900">{stats.totalMaterials}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <div className="text-sm text-yellow-800 font-medium">Low Stock Items</div>
                    <div className="text-2xl font-bold text-yellow-900">{stats.lowStockMaterials}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="text-sm text-green-800 font-medium">Blockchain Tracked</div>
                    <div className="text-2xl font-bold text-green-900">{stats.blockchainTracked}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="text-sm text-purple-800 font-medium">Allocated Units</div>
                    <div className="text-2xl font-bold text-purple-900">{allocatedMaterials}</div>
                </div>
                </div>
                
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {materials.slice(0, 5).map((material) => (
                        <tr key={material.id}>
                        <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{material.name}</div>
                            <div className="text-xs text-gray-500">{material.description.substring(0, 40)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${material.quantity < 100 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {material.quantity} {material.unit}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {material.active ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                            </span>
                            ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactive
                            </span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to="/supplier/materials" className="text-blue-600 hover:text-blue-900">
                            Manage
                            </Link>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
                
                {materials.length > 5 && (
                <div className="mt-4 text-center">
                    <Link to="/supplier/materials" className="text-blue-500 hover:text-blue-700 text-sm">
                    View all {materials.length} materials
                    </Link>
                </div>
                )}
            </div>
            )}
        </div>
        
        {/* Help and Guidance Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Supplier Workflow Guide</h2>
            <div className="flex flex-wrap -mx-2">
            <div className="px-2 w-full md:w-1/3 mb-4">
                <div className="border border-blue-200 rounded-lg p-4 h-full">
                <div className="flex items-center mb-2">
                    <div className="bg-blue-100 rounded-full p-2 mr-2">
                    <span className="text-blue-800 font-bold">1</span>
                    </div>
                    <h3 className="font-medium text-blue-800">Material Management</h3>
                </div>
                <p className="text-sm text-gray-600">
                    Add materials to your inventory and track them on the blockchain for full traceability.
                </p>
                </div>
            </div>
            <div className="px-2 w-full md:w-1/3 mb-4">
                <div className="border border-purple-200 rounded-lg p-4 h-full">
                <div className="flex items-center mb-2">
                    <div className="bg-purple-100 rounded-full p-2 mr-2">
                    <span className="text-purple-800 font-bold">2</span>
                    </div>
                    <h3 className="font-medium text-purple-800">Request Handling</h3>
                </div>
                <p className="text-sm text-gray-600">
                    Review material requests from manufacturers, approve them, and allocate materials.
                </p>
                </div>
            </div>
            <div className="px-2 w-full md:w-1/3 mb-4">
                <div className="border border-green-200 rounded-lg p-4 h-full">
                <div className="flex items-center mb-2">
                    <div className="bg-green-100 rounded-full p-2 mr-2">
                    <span className="text-green-800 font-bold">3</span>
                    </div>
                    <h3 className="font-medium text-green-800">Delivery Tracking</h3>
                </div>
                <p className="text-sm text-gray-600">
                    Track materials from allocation to pickup, delivery, and final usage in products.
                </p>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
};

export default SupplierDashboard;