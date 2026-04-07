import { useState, useEffect } from 'react';
import { ShoppingCart, X, Trash, Lock, Plus, Minus, DollarSign, ArrowLeft } from 'lucide-react';
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
  const [activeCampaign, setActiveCampaign] = useState(() => {
    try {
      return appliedCampaign || JSON.parse(localStorage.getItem(appliedCampaignStorageKey) || 'null');
    } catch {
      return appliedCampaign || null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
      setActiveCampaign(appliedCampaign);
      setCouponInput(appliedCampaign.couponCode || '');
      localStorage.setItem(appliedCampaignStorageKey, JSON.stringify(appliedCampaign));
      return;
    }

    try {
      const storedCampaign = JSON.parse(localStorage.getItem(appliedCampaignStorageKey) || 'null');
      setActiveCampaign(storedCampaign);
      setCouponInput(storedCampaign?.couponCode || '');
    } catch {
      setActiveCampaign(null);
      setCouponInput('');
    }
  }, [appliedCampaign]);

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

    try {
      setCouponValidationLoading(true);
      setCouponFeedback(null);
      const response = await axios.post(`${baseURL}/marketing/campaigns/validate-coupon`, {
        couponCode: normalizedCode,
        subtotal: subtotalAmount,
        storeId: selectedStoreId || activeCampaign?.storeId || undefined,
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
                    className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      {/* Medicine Image */}
                      <div className="flex-shrink-0">
                        <img
                          src="/medicine.png"
                          alt={item.name || 'Medicine'}
                          className="w-14 h-14 object-contain rounded-lg bg-blue-50 p-2"
                        />
                      </div>

                      {/* Medicine Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{item.name}</h3>
                        <p className="text-slate-500 mt-1 flex items-center gap-1">
                          {formatUsd(item.price)}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteMedicine(item.name)}
                        className="p-2.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex-shrink-0"
                        aria-label="Delete"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                      <div className="text-sm">
                        <span className="text-slate-600">Subtotal: </span>
                        <span className="font-semibold text-slate-900">{formatUsd(item.price * item.quantity)}</span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 flex-shrink-0">
                        <button
                          onClick={() => handleDecreaseQuantity(item.name)}
                          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-slate-700" />
                        </button>
                        <span className="text-sm font-semibold min-w-8 text-center text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => handleIncreaseQuantity(item.name)}
                          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
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
              {/* Coupon Section */}
              <div className="p-6 border-b border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Apply Coupon</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold uppercase tracking-wide text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    type="button"
                    onClick={() => validateAndApplyCoupon(couponInput)}
                    className="h-11 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 text-sm transition disabled:opacity-50 sm:flex-shrink-0 whitespace-nowrap"
                    disabled={couponValidationLoading}
                  >
                    {couponValidationLoading ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {couponFeedback?.message && (
                  <p className={`mt-2 text-xs font-medium ${couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* Applied Coupon */}
              {activeCampaign?.couponCode && (
                <div className="p-6 border-b border-slate-100 bg-emerald-50/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">Applied Promo</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-emerald-900 truncate">{activeCampaign.couponCode}</p>
                    <button
                      onClick={removeAppliedCoupon}
                      className="p-1 hover:bg-emerald-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-emerald-700" />
                    </button>
                  </div>
                  {activeCampaign.title && (
                    <p className="text-xs text-emerald-700 mt-1 line-clamp-2">{activeCampaign.title}</p>
                  )}
                </div>
              )}

              {/* Price Summary */}
              <div className="p-6 space-y-3 border-b border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatUsd(subtotalAmount)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-700 font-medium">Discount</span>
                    <span className="font-semibold text-emerald-700">- {formatUsd(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Total</span>
                  <span className="text-2xl font-bold text-slate-900">{formatUsd(finalAmount)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="p-6 bg-slate-50">
                <button
                  onClick={handleProceedToCheckout}
                  disabled={!paylock}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    paylock
                      ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  Proceed to Checkout
                </button>
                <p className="text-xs text-slate-500 text-center mt-3">Secure checkout with encrypted payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;