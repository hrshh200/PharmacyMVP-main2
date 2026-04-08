import { useState, useEffect } from 'react';
import { ShoppingCart, X, Trash, Lock, Plus, Minus } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../main';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CartButton = ({ openOnMount = false, appliedCampaign = null, selectedStoreId = null }) => {
  const latestOrderStorageKey = 'medVisionLatestOrderId';
  const cartIdStorageKey = 'medVisionCartId';
  const checkoutCartStorageKey = 'medVisionCheckoutCart';
  const checkoutSummaryStorageKey = 'medVisionCheckoutSummary';
  const appliedCampaignStorageKey = 'medVisionAppliedCampaign';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [userData, setUserData] = useState(null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
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

  const formatUsd = (value) => {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const viewCartModal = () => {
  navigate('/cart');
};

  const closeCartModal = () => {
    setIsModalOpen(false);
  };

  const fetchCartData = async () => {
    try {
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
      
      // Store cartId from response for future use
      if (cartResponse.data.cartId) {
        localStorage.setItem(cartIdStorageKey, cartResponse.data.cartId);
        console.log("Cart ID from API:", cartResponse.data.cartId);
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
      console.error('Error fetching data:', error.message);
      setCartItems([]);
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

  useEffect(() => {
    if (openOnMount && userData?._id && !hasAutoOpened) {
      setIsModalOpen(true);
      setHasAutoOpened(true);
    }
  }, [openOnMount, userData?._id, hasAutoOpened]);

  useEffect(() => {
    if (!activeCampaign?.couponCode || subtotalAmount <= 0) return;
    validateAndApplyCoupon(activeCampaign.couponCode);
  }, [activeCampaign?.couponCode, subtotalAmount, storeId]);
  


  const handleIncreaseQuantity = async (name) => {

    //Calling the API for updating the quantity of the medicine
    try {
      const response = await axios.post(`${baseURL}/updatecartquantity`, { name, id: userData?._id });
      console.log(response);

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
      console.error('Error updating the quantity of medicine:', error.message);
    }
  };

  const handleDecreaseQuantity = async (name) => {

    //Calling the API for updating the quantity of the medicine
    try {
      const response = await axios.post(`${baseURL}/decreaseupdatecartquantity`, { name, id: userData?._id });
      console.log(response);

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
      console.error('Error updating the quantity of medicine:', error.message);
    }
  };

  const handleDeleteMedicine = async (name) => {
    try {
      const response = await axios.post(`${baseURL}/deletemedicine`, { name, id: userData?._id });
      console.log(response);

      if (response.status === 200) {
        setCartItems((prevItems) => prevItems.filter((item) => item.name !== name));
        console.log("Medicine Deleted from cart!");
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
    } catch (error) {
      console.error('Error deleting the medicine from cart:', error.message);
    }
  };

  const handletoAddress = async () => {
    try {
      console.log("Cart Items being sent:", cartItems); // Debug log
      localStorage.setItem(checkoutCartStorageKey, JSON.stringify(cartItems));
      const checkoutSummary = {
        campaign: activeCampaign,
        subtotalAmount,
        discountAmount,
        finalAmount,
      };
      localStorage.setItem(checkoutSummaryStorageKey, JSON.stringify(checkoutSummary));
      
      const response = await axios.post(`${baseURL}/additemstocart`, {
        id: userData?._id, // Passing user ID if required
        items: cartItems, // Passing the array
        storeId: storeId,
      });
  
      console.log(response);
      const currentOrderId = response.data.orderId || response.data.order?.orderId;
      if (currentOrderId) {
        localStorage.setItem(latestOrderStorageKey, currentOrderId);
      }
  
      if (response.status === 200) {
        navigate('/addresspage', {
          state: {
            cartItems: cartItems,
            orderId: currentOrderId,
            checkoutSummary,
          },
        });
      }
      else if(response.status === 201){
        navigate('/addresspage', {
          state: {
            cartItems: cartItems,
            orderId: currentOrderId,
            checkoutSummary,
          },
        });
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error updating the quantity of medicine:', error.message);
    }
  };

  return (
    <>
      <button
        onClick={userData?._id ? viewCartModal : null}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl shadow-xl border flex items-center justify-center transition-all duration-300 ${
          userData?._id
            ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white border-blue-400/40 hover:scale-110 hover:shadow-blue-400/40 active:scale-95'
            : 'bg-gray-300 text-gray-500 border-gray-200 cursor-not-allowed'
        }`}
        disabled={!userData?._id}
        aria-label="Open Cart"
      >
        <ShoppingCart className="w-7 h-7" />

        {cartItems.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold rounded-full min-w-6 h-6 px-1.5 flex items-center justify-center ring-2 ring-white">
            {cartItems.length}
          </div>
        )}
      </button>


      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeCartModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Your Cart</h2>
              <p className="text-blue-100 text-sm">Review medicines before checkout</p>
            </div>

            <button
              onClick={closeCartModal}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="px-6 py-5 max-h-[62vh] overflow-y-auto">
              {cartItems.length > 0 ? (
                <ul className="space-y-3">
                  {cartItems.map((item) => (
                    <li
                      key={item.id}
                      className="bg-slate-50 border border-slate-100 rounded-xl p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{item.name}</h3>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                            {formatUsd(item.price)}
                          </p>
                        </div>
                        <button
                          className="text-rose-500 hover:text-rose-700 transition-colors"
                          aria-label="Delete"
                          onClick={() => handleDeleteMedicine(item.name)}
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                          Subtotal: <span className="font-semibold text-slate-900">{formatUsd(item.price * item.quantity)}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1">
                        <button
                          onClick={() => handleDecreaseQuantity(item.name)}
                            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                          <span className="text-sm font-semibold min-w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleIncreaseQuantity(item.name)}
                            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 mx-auto mb-3 flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-slate-700 font-medium">Your cart is empty</p>
                  <p className="text-sm text-slate-500 mt-1">Add medicines to see them here.</p>
                </div>
              )}
            </div>

            <div className="border-t bg-slate-50 px-6 py-4">
              <div className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Apply Coupon</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold uppercase tracking-wide text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    type="button"
                    onClick={() => validateAndApplyCoupon(couponInput)}
                    className="h-10 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
                    disabled={couponValidationLoading}
                  >
                    {couponValidationLoading ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {couponFeedback?.message && (
                  <p className={`mt-2 text-xs font-medium ${couponFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {activeCampaign?.couponCode && (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Applied Promo Code</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-emerald-800">{activeCampaign.couponCode}</p>
                    <button
                      type="button"
                      onClick={removeAppliedCoupon}
                      className="rounded-md border border-emerald-300 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-emerald-700">{activeCampaign.title || 'Promotion applied'}</p>
                </div>
              )}

              <div className="flex justify-between items-center mb-2 text-sm text-slate-600">
                <h3 className="font-medium">Subtotal</h3>
                <p className="font-semibold text-slate-900">{formatUsd(subtotalAmount)}</p>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center mb-3 text-sm text-emerald-700">
                  <h3 className="font-medium">Promo Discount</h3>
                  <p className="font-semibold">- {formatUsd(discountAmount)}</p>
                </div>
              )}

              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-medium text-slate-700">Total</h3>
                <p className="text-xl font-bold text-slate-900">{formatUsd(finalAmount)}</p>
              </div>

              <button
                onClick={() => handletoAddress()}
                className={`w-full py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${paylock
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!paylock}
              >
                Proceed
                <Lock className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartButton;
