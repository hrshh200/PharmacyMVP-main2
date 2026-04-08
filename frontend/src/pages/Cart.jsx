import { useState, useEffect } from 'react';
import { ShoppingCart, X, Trash, Lock, Plus, Minus, ArrowLeft, Gift, Sparkles, Tag, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../main';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CartPage = ({ appliedCampaign = null, selectedStoreId = null }) => {
  const latestOrderStorageKey = 'medVisionLatestOrderId';
  const cartIdStorageKey = 'medVisionCartId';
  const checkoutCartStorageKey = 'medVisionCheckoutCart';
  const checkoutSummaryStorageKey = 'medVisionCheckoutSummary';
  const appliedCampaignStorageKey = 'medVisionAppliedCampaign';

  const [cartItems, setCartItems] = useState([]);
  const [userData, setUserData] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponValidationLoading, setCouponValidationLoading] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(() => {
    try {
      return appliedCampaign || JSON.parse(localStorage.getItem(appliedCampaignStorageKey) || 'null');
    } catch {
      return appliedCampaign || null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Use passed selectedStoreId or retrieve from localStorage
  const storeId = selectedStoreId || (typeof localStorage !== 'undefined' ? localStorage.getItem('medVisionSelectedStoreId') : null);

  const subtotalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const calculateCampaignDiscount = (campaign, subtotal) => {
    if (!campaign || subtotal <= 0) return 0;

    const minOrderAmount = Number(campaign.minOrderAmount) || 0;
    if (minOrderAmount > 0 && subtotal < minOrderAmount) return 0;

    let discount = 0;
    const discountType = String(campaign.discountType || '').toLowerCase();
    const discountValue = Number(campaign.discountValue) || 0;

    if (discountType === 'percentage') {
      discount = (subtotal * discountValue) / 100;
    } else {
      discount = discountValue;
    }

    const maxDiscountAmount = Number(campaign.maxDiscountAmount) || 0;
    if (maxDiscountAmount > 0) {
      discount = Math.min(discount, maxDiscountAmount);
    }

    return Math.max(0, Math.min(subtotal, discount));
  };

  const discountAmount = calculateCampaignDiscount(activeCampaign, subtotalAmount);
  const finalAmount = Math.max(0, subtotalAmount - discountAmount);
  const paylock = cartItems.length > 0;

  const formatUsd = (value) => {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const fetchCartData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('medVisionToken');

      // Fetch user data
      const userResponse = await axios.get(`${baseURL}/fetchdata`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchedData = userResponse.data.userData;
      if (fetchedData) {
        setUserData(fetchedData);
        localStorage.setItem('userData', JSON.stringify(fetchedData));
      }

      // Fetch cart data
      const cartResponse = await axios.get(`${baseURL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (cartResponse.data.cartId) {
        localStorage.setItem(cartIdStorageKey, cartResponse.data.cartId);
      }

      if (cartResponse.data.items && cartResponse.data.items.length > 0) {
        const cartItems = cartResponse.data.items.map((item, index) => ({
          id: index,
          name: item.medicine,
          price: item.price,
          quantity: item.quantity || 1,
        }));
        setCartItems(cartItems);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart data:', error.message);
      toast.error('Failed to load cart');
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  useEffect(() => {
    const handleCartUpdated = () => {
      fetchCartData();
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    if (appliedCampaign) {
      const appliedStoreId = String(appliedCampaign.storeId || '');
      const selectedStore = String(storeId || '');
      if (!selectedStore || !appliedStoreId || appliedStoreId === selectedStore) {
        setActiveCampaign(appliedCampaign);
        setCouponInput(appliedCampaign.couponCode || '');
        localStorage.setItem(appliedCampaignStorageKey, JSON.stringify(appliedCampaign));
      } else {
        setActiveCampaign(null);
        setCouponInput('');
        localStorage.removeItem(appliedCampaignStorageKey);
      }
      return;
    }

    try {
      const storedCampaign = JSON.parse(localStorage.getItem(appliedCampaignStorageKey) || 'null');
      const campaignStoreId = String(storedCampaign?.storeId || '');
      const selectedStore = String(storeId || '');
      if (!storedCampaign || !selectedStore || !campaignStoreId || campaignStoreId === selectedStore) {
        setActiveCampaign(storedCampaign);
        setCouponInput(storedCampaign?.couponCode || '');
      } else {
        setActiveCampaign(null);
        setCouponInput('');
        localStorage.removeItem(appliedCampaignStorageKey);
      }
    } catch {
      setActiveCampaign(null);
      setCouponInput('');
    }
  }, [appliedCampaign, storeId]);

  const validateAndApplyCoupon = async (couponCode) => {
    const normalizedCode = String(couponCode || '').trim().toUpperCase();
    if (!normalizedCode) {
      setCouponFeedback({ type: 'error', message: 'Enter a coupon code to apply' });
      return;
    }

    if (subtotalAmount <= 0) {
      setCouponFeedback({ type: 'error', message: 'Add items to cart before applying coupon' });
      return;
    }

    if (!storeId) {
      setCouponFeedback({ type: 'error', message: 'Please select a store before applying coupon' });
      return;
    }

    try {
      setCouponValidationLoading(true);
      setCouponFeedback(null);
      const response = await axios.post(`${baseURL}/marketing/campaigns/validate-coupon`, {
        couponCode: normalizedCode,
        subtotal: subtotalAmount,
        storeId,
      });

      if (response.data?.valid) {
        const validatedCampaign = response.data.campaign || {};
        setActiveCampaign(validatedCampaign);
        setCouponInput(validatedCampaign.couponCode || normalizedCode);
        localStorage.setItem(appliedCampaignStorageKey, JSON.stringify(validatedCampaign));
        setCouponFeedback({ type: 'success', message: response.data?.message || 'Coupon applied successfully' });
      } else {
        setActiveCampaign(null);
        localStorage.removeItem(appliedCampaignStorageKey);
        setCouponFeedback({ type: 'error', message: response.data?.message || 'Coupon is invalid or inactive' });
      }
    } catch (error) {
      setActiveCampaign(null);
      localStorage.removeItem(appliedCampaignStorageKey);
      setCouponFeedback({ type: 'error', message: error.response?.data?.message || 'Failed to validate coupon' });
    } finally {
      setCouponValidationLoading(false);
    }
  };

  const removeAppliedCoupon = () => {
    setActiveCampaign(null);
    setCouponInput('');
    setCouponFeedback({ type: 'success', message: 'Coupon removed' });
    localStorage.removeItem(appliedCampaignStorageKey);
  };

  const fetchAvailableCoupons = async () => {
    try {
      if (!storeId) {
        setAvailableCoupons([]);
        setCouponFeedback({ type: 'error', message: 'Please select a store to view coupons' });
        return;
      }

      setLoadingCoupons(true);
      const response = await axios.get(`${baseURL}/marketing/campaigns/public`, {
        params: { limit: 20, storeId }
      });
      setAvailableCoupons(response.data.campaigns || []);
    } catch (error) {
      console.error('Error fetching coupons:', error.message);
      toast.error('Failed to load available coupons');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const applyCouponFromList = async (coupon) => {
    if (!coupon.couponCode) {
      toast.error('Invalid coupon');
      return;
    }
    setCouponInput(coupon.couponCode);
    await validateAndApplyCoupon(coupon.couponCode);
    setShowCouponsModal(false);
  };

  const handleIncreaseQuantity = async (name) => {
    try {
      const response = await axios.post(`${baseURL}/updatecartquantity`, { name, id: userData?._id });

      if (response.status === 200) {
        setCartItems((prevItems) => {
          const updatedItems = prevItems.map((item) =>
            item.name === name ? { ...item, quantity: item.quantity + 1 } : item
          );
          return updatedItems;
        });
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
    } catch (error) {
      console.error('Error updating quantity:', error.message);
      toast.error('Failed to update quantity');
    }
  };

  const handleDecreaseQuantity = async (name) => {
    try {
      const response = await axios.post(`${baseURL}/decreaseupdatecartquantity`, { name, id: userData?._id });

      if (response.status === 200) {
        setCartItems((prevItems) => {
          const updatedItems = prevItems.map((item) =>
            item.name === name && item.quantity > 1
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
          return updatedItems;
        });
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
    } catch (error) {
      console.error('Error updating quantity:', error.message);
      toast.error('Failed to update quantity');
    }
  };

  const handleDeleteMedicine = async (name) => {
    try {
      const response = await axios.post(`${baseURL}/deletemedicine`, { name, id: userData?._id });

      if (response.status === 200) {
        setCartItems((prevItems) => prevItems.filter((item) => item.name !== name));
        window.dispatchEvent(new CustomEvent('cart-updated'));
        toast.success('Medicine removed from cart');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error.message);
      toast.error('Failed to remove medicine');
    }
  };

  const handleProceedToCheckout = async () => {
    try {
      localStorage.setItem(checkoutCartStorageKey, JSON.stringify(cartItems));
      const checkoutSummary = {
        campaign: activeCampaign,
        subtotalAmount,
        discountAmount,
        finalAmount,
      };
      localStorage.setItem(checkoutSummaryStorageKey, JSON.stringify(checkoutSummary));

      const response = await axios.post(`${baseURL}/additemstocart`, {
        id: userData?._id,
        items: cartItems,
        storeId: storeId,
      });

      const currentOrderId = response.data.orderId || response.data.order?.orderId;
      if (currentOrderId) {
        localStorage.setItem(latestOrderStorageKey, currentOrderId);
      }

      if (response.status === 200 || response.status === 201) {
        navigate('/addresspage', {
          state: {
            cartItems: cartItems,
            orderId: currentOrderId,
            checkoutSummary,
          },
        });
        toast.success('Proceeding to checkout');
      }
    } catch (error) {
      console.error('Error proceeding to checkout:', error.message);
      toast.error('Failed to proceed to checkout');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Shopping
          </button>

          <div className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white rounded-3xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold">Your Shopping Cart</h1>
            </div>
            <p className="text-blue-100">Review your medicines and proceed to checkout</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Cart Items - Takes 3 columns on md+ */}
          <div className="md:col-span-3 space-y-4">
            {cartItems.length > 0 ? (
              <>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all hover:border-blue-200"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      {/* Medicine Image */}
                      <div className="flex-shrink-0">
                        <img
                          src="/medicine.png"
                          alt={item.name || 'Medicine'}
                          className="w-16 h-16 object-contain rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-3"
                        />
                      </div>

                      {/* Medicine Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 truncate">{item.name}</h3>
                        <p className="text-slate-500 mt-2 flex items-center gap-1 font-semibold">
                          {formatUsd(item.price)}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteMedicine(item.name)}
                        className="p-2.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all hover:scale-110 flex-shrink-0"
                        aria-label="Delete"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                      <div className="text-sm">
                        <span className="text-slate-600 font-medium">Item Total: </span>
                        <span className="font-bold text-slate-900 text-lg">{formatUsd(item.price * item.quantity)}</span>
                      </div>

                      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-1.5 flex-shrink-0 border border-blue-100">
                        <button
                          onClick={() => handleDecreaseQuantity(item.name)}
                          className="p-2 rounded-lg hover:bg-white transition-colors"
                        >
                          <Minus className="w-4 h-4 text-slate-700" />
                        </button>
                        <span className="text-sm font-bold min-w-8 text-center text-slate-900 text-lg">{item.quantity}</span>
                        <button
                          onClick={() => handleIncreaseQuantity(item.name)}
                          className="p-2 rounded-lg hover:bg-white transition-colors"
                        >
                          <Plus className="w-4 h-4 text-slate-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-700 mb-2">Your cart is empty</p>
                <p className="text-slate-500 mb-6">Start adding medicines to your cart</p>
                <button
                  onClick={() => navigate('/onlinepharmacy')}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Summary - Takes 2 columns on md+, full width on mobile */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-24 h-fit">
              {/* Coupon Section - Enhanced */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-bold text-slate-900">Apply Promo Code</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold uppercase tracking-wide text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                  <button
                    type="button"
                    onClick={() => validateAndApplyCoupon(couponInput)}
                    className="h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 text-sm transition disabled:opacity-50 sm:flex-shrink-0 whitespace-nowrap active:scale-95"
                    disabled={couponValidationLoading}
                  >
                    {couponValidationLoading ? 'Checking...' : 'Apply'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCouponsModal(true);
                    fetchAvailableCoupons();
                  }}
                  disabled={!storeId}
                  className="w-full py-2.5 rounded-lg border border-blue-300 bg-white text-blue-600 font-semibold text-sm hover:bg-blue-50 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  View Available Coupons
                </button>

                {couponFeedback?.message && (
                  <p className={`mt-3 text-xs font-medium text-center ${couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* Applied Coupon */}
              {activeCampaign?.couponCode && (
                <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-emerald-50 to-cyan-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-emerald-900">Promo Applied</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-3 bg-white rounded-lg p-3 border border-emerald-200">
                    <div>
                      <p className="font-bold text-emerald-900">{activeCampaign.couponCode}</p>
                      {activeCampaign.title && (
                        <p className="text-xs text-emerald-700 mt-0.5 line-clamp-1">{activeCampaign.title}</p>
                      )}
                    </div>
                    <button
                      onClick={removeAppliedCoupon}
                      className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                  {discountAmount > 0 && (
                    <div className="text-center">
                      <p className="text-xs text-emerald-700 font-semibold mb-1">You&apos;re Saving</p>
                      <p className="text-lg font-bold text-emerald-600">${discountAmount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Price Summary */}
              <div className="p-6 space-y-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50">
                <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  Price Summary
                </p>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatUsd(subtotalAmount)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                    <span className="text-emerald-700 font-semibold">Discount</span>
                    <span className="font-bold text-emerald-600">- {formatUsd(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Total Amount</span>
                  <div>
                    <p className="text-xs text-slate-500 text-right mb-1">Payable</p>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{formatUsd(finalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="p-6 bg-gradient-to-br from-blue-600 to-cyan-600">
                <button
                  onClick={handleProceedToCheckout}
                  disabled={!paylock}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-lg ${
                    paylock
                      ? 'bg-white text-blue-600 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98]'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  Proceed to Checkout
                </button>
                <p className="text-xs text-blue-100 text-center mt-3">Secure checkout with encrypted payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    {/* Available Coupons Modal */}
    {showCouponsModal && (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowCouponsModal(false)}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-5 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Available Promotions</h2>
                <p className="text-blue-100 text-sm">Select a coupon to apply</p>
              </div>
            </div>
            <button
              onClick={() => setShowCouponsModal(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto flex-1">
            {loadingCoupons ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Loading available coupons...</p>
              </div>
            ) : availableCoupons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {availableCoupons.map((coupon) => {
                  const isApplied = activeCampaign?._id === coupon._id;
                  const discountDisplay = coupon.discountType === 'Percentage' 
                    ? `${coupon.discountValue}%` 
                    : `$${coupon.discountValue}`;

                  return (
                    <div
                      key={coupon._id}
                      className={`relative border-2 rounded-xl p-4 transition-all cursor-pointer hover:shadow-md ${
                        isApplied
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      {isApplied && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Applied
                        </div>
                      )}

                      <div className="mb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{coupon.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">{coupon.storeName || 'Pharmacy MVP'}</p>
                          </div>
                          <span className={`text-2xl font-bold whitespace-nowrap ${
                            coupon.discountType === 'Percentage' 
                              ? 'text-blue-600' 
                              : 'text-emerald-600'
                          }`}>
                            {discountDisplay}
                          </span>
                        </div>

                        {coupon.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">{coupon.description}</p>
                        )}
                      </div>

                      {/* Coupon Badge */}
                      {coupon.couponCode && (
                        <div className="mb-3 bg-slate-100 rounded-lg p-2 text-center border border-slate-200">
                          <p className="text-[10px] text-slate-600 font-semibold uppercase">Code</p>
                          <p className="text-sm font-bold text-slate-800 tracking-wider">{coupon.couponCode}</p>
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-1 mb-3 text-xs text-slate-600">
                        {coupon.minOrderAmount > 0 && (
                          <p className="flex items-center gap-2">
                            <Tag className="w-3 h-3" />
                            Min Order: ${coupon.minOrderAmount}
                          </p>
                        )}
                        {coupon.maxDiscountAmount > 0 && coupon.discountType === 'Percentage' && (
                          <p className="flex items-center gap-2">
                            <Gift className="w-3 h-3" />
                            Max Discount: ${coupon.maxDiscountAmount}
                          </p>
                        )}
                      </div>

                      {/* Apply Button */}
                      <button
                        onClick={() => applyCouponFromList(coupon)}
                        disabled={isApplied}
                        className={`w-full py-2 rounded-lg font-semibold text-sm transition ${
                          isApplied
                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                        }`}
                      >
                        {isApplied ? 'Applied ✓' : 'Apply Now'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-700 mb-2">No coupons available</p>
                <p className="text-slate-500 text-sm">Check back soon for exciting offers!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );

};

export default CartPage;