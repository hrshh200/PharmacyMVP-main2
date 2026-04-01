import React, { useState, useEffect } from 'react';
import { MapPin, Phone, User, Mail, ShoppingCart, ChevronLeft, Truck, Package, IndianRupee, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { baseURL } from '../main';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import CheckoutFooter from '../components/CheckoutFooter';

export function AddressPage() {
  const latestOrderStorageKey = 'medVisionLatestOrderId';
  const navigate = useNavigate();
  const [userdata, setUserData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [formData, setFormData] = useState({
    fullName: userdata?.name || '',
    email: userdata?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const location = useLocation();
  const currentOrderId = location.state?.orderId || localStorage.getItem(latestOrderStorageKey);
  const cartItems = location.state?.cartItems || [];
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const fetchDataFromApi = async () => {
    try {
      const token = localStorage.getItem('medVisionToken');
      const response = await axios.get(`${baseURL}/fetchdata`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchedData = response.data.userData;
      setUserData(fetchedData);
      setFormData({
        ...formData,
        fullName: fetchedData?.name || '',
        email: fetchedData?.email || '',
        phone: fetchedData?.mobile || '',
        address: fetchedData?.address || '',
      });

      localStorage.setItem('userData', JSON.stringify(fetchedData));
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  };

  useEffect(() => {
    fetchDataFromApi();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!currentOrderId) {
        throw new Error('Order ID not found');
      }

      const response = await axios.post(`${baseURL}/addaddress`, {
        id: userdata?._id,
        orderid: currentOrderId,
        address: formData.address,
        deliveryType: deliveryType
      });

      if (response.status === 200) {
        setTimeout(() => {
          setLoading(false);
          toast.success(response.data.message);
          navigate('/payments', {
            state: {
              cartItems: cartItems,
              orderId: currentOrderId,
              deliveryType: deliveryType
            }
          })
        }, 1000)
      }
    } catch (error) {
      console.log("Error updating the address to order");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white px-4 sm:px-6 lg:px-8 pb-12" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 3rem)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 rounded-3xl text-white p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-cyan-300/10 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Shipping Details</h1>
              <p className="text-blue-100 mt-2">Confirm delivery info and review your order before payment.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Cart Items</p>
                <p className="text-lg font-semibold flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  {totalItems}
                </p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Total Payable</p>
                <p className="text-lg font-semibold flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4" />
                  {totalAmount}
                </p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Checkout Stage</p>
                <p className="text-lg font-semibold">Shipping</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 inline-flex items-center gap-2 text-xs bg-emerald-400/20 border border-emerald-200/30 rounded-full px-3 py-1.5 text-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure checkout, encrypted details
          </div>
        </div>

        {loading ? ( // Show loader if loading is true
          <div className="flex justify-center items-center">
            <div className="loader w-16 h-16 border-4 border-t-blue-600 border-gray-300 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 md:p-8 space-y-6 border border-gray-100 max-w-3xl mx-auto w-full">
              <div className="flex items-center gap-2 text-gray-900">
                <Truck className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold">Delivery Information</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="flex-1 bg-transparent focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="flex-1 bg-transparent focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="flex-1 bg-transparent focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="flex-1 bg-transparent focus:outline-none"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-sm font-semibold text-gray-700">Delivery Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        deliveryType === 'pickup'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">Store Pick Up</div>
                      <div className="text-sm text-gray-600">Pick up from store</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        deliveryType === 'delivery'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">Home Delivery</div>
                      <div className="text-sm text-gray-600">We'll deliver to you</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/onlinepharmacy', { state: { openCart: true } })}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Review Cart
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/onlinepharmacy')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Continue Shopping
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue to Payment
              </button>
            </form>
          </div>
        )}
      </div>
      <CheckoutFooter />
    </div>
  );
}
