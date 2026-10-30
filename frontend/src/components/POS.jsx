import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, Coffee, Trash2, CreditCard, DollarSign, X, CheckCircle, Clock } from 'lucide-react';
import QRCode from 'qrcode.react';
import { productsAPI, ordersAPI, paymentsAPI, IMAGE_BASE_URL } from '../api/api';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [showQRPopup, setShowQRPopup] = useState(false);
  const [paymentToken, setPaymentToken] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);

  useEffect(() => {
    loadProducts();
    return () => {
      // Cleanup polling on unmount
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category))].filter(cat => cat !== 'report');

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        unit_price: product.price
      }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // If card payment, show QR popup first
    if (paymentMethod === 'card') {
      try {
        console.log('Creating payment for amount:', cartTotal);
        // Create payment token
        const response = await paymentsAPI.createPayment(cartTotal);
        console.log('Payment created:', response.data);
        setPaymentToken(response.data.payment_token);
        setPaymentUrl(response.data.payment_url);
        setPaymentStatus('pending');
        setShowQRPopup(true);

        // Start polling for payment status
        const interval = setInterval(async () => {
          try {
            console.log('Checking payment status for token:', response.data.payment_token);
            const statusResponse = await paymentsAPI.checkStatus(response.data.payment_token);
            console.log('Payment status:', statusResponse.data);
            
            if (statusResponse.data.status === 'confirmed') {
              console.log('Payment confirmed!');
              setPaymentStatus('confirmed');
              clearInterval(interval);
              setPollingInterval(null);
              
              // Complete order after showing success
              setTimeout(() => {
                completeOrder();
                setShowQRPopup(false);
                setPaymentToken(null);
                setPaymentUrl(null);
              }, 2000);
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
          }
        }, 1000); // Poll every second

        setPollingInterval(interval);
      } catch (error) {
        console.error('Error creating payment:', error);
        alert('Failed to create payment: ' + error.message);
      }
    } else {
      // Cash payment - complete immediately
      completeOrder();
    }
  };

  const completeOrder = async () => {
    try {
      const total = cartTotal;
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payment_method: paymentMethod
      };

      await ordersAPI.create(orderData);
      setLastOrderTotal(total);
      setCart([]);
      setShowSuccessPopup(true);
      
      // Close success popup after 2 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 2000);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to complete order');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Point of Sale</h1>
        <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 sm:px-4 rounded-lg">
          <ShoppingCart size={18} sm:size={20} className="text-amber-700" />
          <span className="font-semibold text-amber-800 text-sm sm:text-base">{cart.length} items</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-2 space-y-4 order-1 lg:order-1">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                  selectedCategory === category
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-amber-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-amber-300 text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  {product.image ? (
                    <img
                      src={`${IMAGE_BASE_URL}/${product.image}`}
                      alt={product.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <Coffee className="text-amber-600" size={20} sm:size={24} />
                  )}
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{product.name}</h3>
                <p className="text-amber-600 font-bold text-sm sm:text-base">${product.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 h-fit sticky top-4 sm:top-6 order-2 lg:order-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={20} sm:size={24} />
            Current Order
          </h2>

          {cart.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <ShoppingCart size={40} sm:size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">Cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto mb-4">
                {cart.map(item => (
                  <div key={item.product_id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{item.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-700"
                      >
                        <Minus size={14} sm:size={16} />
                      </button>
                      <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-700"
                      >
                        <Plus size={14} sm:size={16} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="ml-1 sm:ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} sm:size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 sm:pt-4 space-y-3">
                <div className="flex justify-between text-base sm:text-lg">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-amber-700">${cartTotal.toFixed(2)}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                      paymentMethod === 'cash'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <DollarSign size={16} sm:size={20} />
                    <span className="hidden sm:inline">Cash</span>
                    <span className="sm:hidden">$</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                      paymentMethod === 'card'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CreditCard size={16} sm:size={20} />
                    <span className="hidden sm:inline">Card</span>
                    <span className="sm:hidden">💳</span>
                  </button>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-colors"
                >
                  Complete Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* QR Scan Popup */}
      {showQRPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Scan to Pay</h3>
              <button
                onClick={() => {
                  setShowQRPopup(false);
                  if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                  }
                  setPaymentToken(null);
                  setPaymentUrl(null);
                  setPaymentStatus('pending');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} sm:size={24} />
              </button>
            </div>

            <div className="flex flex-col items-center">
              {/* Real QR Code */}
              {paymentUrl && (
                <div className="bg-white p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 border-2 border-gray-200">
                  <QRCode value={paymentUrl} size={160} sm:size={200} level="H" />
                </div>
              )}

              {paymentStatus === 'pending' && (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mb-2 sm:mb-3"></div>
                  <p className="text-gray-600 text-sm sm:text-base">Waiting for payment...</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                    Scan the QR code with your phone to complete payment
                  </p>
                  <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-amber-600">
                    <Clock size={14} sm:size={16} />
                    <span className="text-sm sm:text-base">Amount: ${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {paymentStatus === 'confirmed' && (
                <div className="text-center">
                  <CheckCircle size={48} sm:size={64} className="text-green-500 mx-auto mb-2 sm:mb-3" />
                  <p className="text-green-600 font-bold text-lg sm:text-xl">Payment Successful!</p>
                  <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">Processing order...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              <CheckCircle size={56} sm:size={80} className="text-green-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Order Completed!</h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                Your order has been successfully processed
              </p>
              <div className="mt-3 sm:mt-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">Payment Method:</p>
                <p className="font-semibold text-gray-800 capitalize text-sm sm:text-base">{paymentMethod}</p>
              </div>
              <div className="mt-3 sm:mt-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">Total Amount:</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">${lastOrderTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
