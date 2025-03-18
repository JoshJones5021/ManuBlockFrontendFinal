import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerService, supplyChainService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProductCatalog = () => {
  const { currentUser } = useAuth();
  const [allProducts, setAllProducts] = useState([]); // Store all products for client-side filtering
  const [displayProducts, setDisplayProducts] = useState([]); // Products to display after filtering
  const [supplyChains, setSupplyChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChain, setSelectedChain] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderFormData, setOrderFormData] = useState({
    shippingAddress: '',
    requestedDeliveryDate: '',
    deliveryNotes: ''
  });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  // Apply filters whenever products, selected chain, or search term changes
  useEffect(() => {
    applyFilters();
  }, [allProducts, selectedChain, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch products and supply chains in parallel
      const [productsResponse, chainsResponse] = await Promise.all([
        customerService.getAvailableProducts(),
        supplyChainService.getSupplyChainsByUser(currentUser.id)
      ]);
      
      const productsData = Array.isArray(productsResponse?.data) ? productsResponse.data : [];
      
      // Make sure we're handling the response properly for supplyChains
      const chainsData = Array.isArray(chainsResponse) ? chainsResponse : [];
      
      console.log('Products data:', productsData);
      console.log('Supply chains data:', chainsData);
      
      // Store all products for filtering
      setAllProducts(productsData);
      // Initially display all products
      setDisplayProducts(productsData);
      
      setSupplyChains(chainsData.filter(chain => 
        chain.blockchainStatus === "FINALIZED" || chain.blockchainStatus === "CONFIRMED"
      ));
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering function
  const applyFilters = () => {
    // Start with all products
    let filtered = [...allProducts];
    
    // Apply supply chain filter if a specific chain is selected
    if (selectedChain !== 'all') {
      filtered = filtered.filter(product => {
        // In case supplyChainId is not yet available on all products
        if (!product.supplyChainId) {
          // If names match, consider it part of the chain (temporary solution)
          const chain = supplyChains.find(c => c.id === parseInt(selectedChain));
          if (chain) {
            return product.name.toLowerCase().includes(chain.name.toLowerCase()) ||
                   chain.name.toLowerCase().includes(product.name.toLowerCase());
          }
          return false;
        }
        
        // Direct ID comparison
        return product.supplyChainId === parseInt(selectedChain);
      });
    }
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Update display products
    setDisplayProducts(filtered);
  };

  const handleOrderClick = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    
    // Pre-fill address if available from user profile
    setOrderFormData({
      shippingAddress: currentUser.address || '',
      requestedDeliveryDate: '',
      deliveryNotes: ''
    });
    
    setShowOrderModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderFormData({
      ...orderFormData,
      [name]: value
    });
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setOrderQuantity(value);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!orderFormData.shippingAddress) {
        setOrderError('Shipping address is required');
        return;
      }
      
      const orderData = {
        customerId: currentUser.id,
        supplyChainId: selectedProduct.supplyChainId || supplyChains[0]?.id,
        items: [
          {
            productId: selectedProduct.id,
            quantity: orderQuantity
          }
        ],
        shippingAddress: orderFormData.shippingAddress,
        requestedDeliveryDate: orderFormData.requestedDeliveryDate 
          ? new Date(orderFormData.requestedDeliveryDate).getTime() 
          : null,
        deliveryNotes: orderFormData.deliveryNotes
      };
      
      await customerService.createOrder(orderData);
      
      setOrderSuccess(true);
      setOrderError(null);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowOrderModal(false);
        setOrderSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating order:', err);
      setOrderError('Failed to create order. Please try again.');
    }
  };

  // Find the name of a supply chain by its ID
  const getSupplyChainName = (chainId) => {
    const chain = supplyChains.find(c => c.id === chainId);
    return chain ? chain.name : `Chain ID: ${chainId}`;
  };

  const OrderModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Place Order</h2>
          <button onClick={() => setShowOrderModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {orderSuccess ? (
          <div className="text-center p-4">
            <svg className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xl font-medium text-gray-900">Order Placed Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleOrderSubmit}>
            {orderError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {orderError}
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="font-bold mb-2">Product Details</h3>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{selectedProduct?.name}</p>
                <p className="text-gray-600 text-sm">${selectedProduct?.price.toFixed(2)} per unit</p>
                <div className="mt-2">
                  <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="quantity">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={orderQuantity}
                    onChange={handleQuantityChange}
                    min="1"
                    className="shadow appearance-none border rounded w-20 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <p className="font-medium mt-2">
                  Total: ${(selectedProduct?.price * orderQuantity).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="shippingAddress">
                Shipping Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="shippingAddress"
                name="shippingAddress"
                value={orderFormData.shippingAddress}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="3"
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="requestedDeliveryDate">
                Requested Delivery Date
              </label>
              <input
                type="date"
                id="requestedDeliveryDate"
                name="requestedDeliveryDate"
                value={orderFormData.requestedDeliveryDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deliveryNotes">
                Delivery Notes
              </label>
              <textarea
                id="deliveryNotes"
                name="deliveryNotes"
                value={orderFormData.deliveryNotes}
                onChange={handleInputChange}
                placeholder="Special delivery instructions, etc."
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="2"
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Place Order
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Product Catalog</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}
      
      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="search">
              Search Products
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="w-full md:w-64">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supplyChain">
              Supply Chain
            </label>
            <select
              id="supplyChain"
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="all">All Supply Chains</option>
              {supplyChains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12.01a4 4 0 110-8 4 4 0 010 8z" />
          </svg>
          <p className="text-gray-500">No products found matching your criteria.</p>
          {selectedChain !== 'all' && (
            <button 
              onClick={() => setSelectedChain('all')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Show All Products
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="bg-gray-100 h-48 flex items-center justify-center">
                <svg className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h2>
                <p className="text-gray-600 mb-4">{product.description}</p>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between mb-4">
                    <div>
                      <span className="text-gray-500 text-sm">Price</span>
                      <p className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 text-sm">SKU</span>
                      <p className="text-gray-900">{product.sku}</p>
                    </div>
                  </div>
                  
                  {product.supplyChainId && (
                    <div className="mb-4 text-sm">
                      <span className="text-gray-500">Supply Chain: </span>
                      <span className="text-gray-900">{getSupplyChainName(product.supplyChainId)}</span>
                    </div>
                  )}
                  
                  {product.blockchainItemId && (
                    <div className="flex items-center mb-4 text-sm">
                      <svg className="h-4 w-4 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-blue-600">Blockchain Tracked</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleOrderClick(product)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Order Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Order Modal */}
      {showOrderModal && selectedProduct && <OrderModal />}
    </div>
  );
};

export default ProductCatalog;