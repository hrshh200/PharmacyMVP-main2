import { useState, useEffect } from 'react';
import axios from 'axios';
import { baseURL } from '../main';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, DollarSign, ChevronDown, ChevronUp, ClipboardList, CreditCard } from 'lucide-react';
import CheckoutFooter from '../components/CheckoutFooter';

const Orders = () => {
  const [userdata, setUserData] = useState([]);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const fetchDataFromApi = async () => {
    try {
      const token = localStorage.getItem('medVisionToken');
      const [userResponse, ordersResponse] = await Promise.all([
        axios.get(`${baseURL}/fetchdata`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`${baseURL}/orders/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);
      const fetchedData = userResponse.data.userData;
      setUserData(fetchedData);
      setOrders(ordersResponse.data.orders || []);

      localStorage.setItem('userData', JSON.stringify(fetchedData));
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchDataFromApi();
  }, []);

  const [expandedOrder, setExpandedOrder] = useState(null);
  const formatUSD = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(value) || 0);

  const toggleDropdown = (orderId) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  const handletracking = (id) => {
    navigate(`/tracking/${id}`);
  };

  const getOrderAmount = (order) => {
    if (order.totalPrice) return order.totalPrice;
    if (order.items?.length) {
      return order.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    }
    return 10;
  };

  const getPaymentMeta = (paymentType) => {
    const raw = String(paymentType || '').trim();
    const normalized = raw.toLowerCase();

    const paymentMap = {
      cod: { label: 'Cash on Delivery', className: 'bg-amber-50 border-amber-200 text-amber-700' },
      cashondelivery: { label: 'Cash on Delivery', className: 'bg-amber-50 border-amber-200 text-amber-700' },
      card: { label: 'Card Payment', className: 'bg-blue-50 border-blue-200 text-blue-700' },
      creditcard: { label: 'Credit Card', className: 'bg-blue-50 border-blue-200 text-blue-700' },
      debitcard: { label: 'Debit Card', className: 'bg-blue-50 border-blue-200 text-blue-700' },
      upi: { label: 'UPI', className: 'bg-violet-50 border-violet-200 text-violet-700' },
      netbanking: { label: 'Net Banking', className: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
      wallet: { label: 'Wallet', className: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
      pickup: { label: 'Pay at Pickup', className: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700' },
    };

    if (paymentMap[normalized]) return paymentMap[normalized];
    if (!raw) return { label: 'Not Available', className: 'bg-slate-100 border-slate-200 text-slate-600' };

    const readable = raw
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

    return { label: readable, className: 'bg-slate-50 border-slate-200 text-slate-700' };
  };

  // Filter orders where status is "Booked"
  const filteredOrders = orders.filter((order) => order.status === 'Booked');
  const totalOrders = filteredOrders.length;
  const totalSpent = filteredOrders.reduce((sum, order) => sum + getOrderAmount(order), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white px-4 sm:px-6 lg:px-8 pb-8" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 2rem)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 rounded-3xl text-white p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-cyan-300/10 blur-2xl"></div>

          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Your Orders</h1>
              <p className="text-blue-100 mt-2">Track your placed medicine orders and view complete order details.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto">
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Total Orders</p>
                <p className="text-lg font-semibold flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" />
                  {totalOrders}
                </p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Total Spent</p>
                <p className="text-lg font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  {formatUSD(totalSpent)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {filteredOrders.length > 0 ? (
          <ul className="space-y-4">
            {filteredOrders.map((order, index) => {
              const amount = getOrderAmount(order);
              const itemCount = order.items?.length || 0;
              const paymentMeta = getPaymentMeta(order.payment);
              return (
                <li
                  key={index}
                  className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-medium text-sky-700">
                          <Package className="w-3.5 h-3.5" />
                          Order #{order.orderId || 'N/A'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <Truck className="w-3.5 h-3.5" />
                          {order.trackingStatus || order.status || 'Booked'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Customer:</span> {userdata.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-700 inline-flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Payment:</span>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentMeta.className}`}>
                          {paymentMeta.label}
                        </span>
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Items:</span> {itemCount}
                      </p>
                      <p className="text-lg font-bold text-gray-900">{formatUSD(amount)}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl shadow transition-colors"
                        onClick={() => handletracking(order.orderId)}
                      >
                        Track Order
                      </button>
                      <button
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-4 rounded-xl shadow transition-colors inline-flex items-center gap-1.5"
                        onClick={() => toggleDropdown(order.orderId)}
                      >
                        {expandedOrder === order.orderId ? (
                          <>
                            <ChevronUp className="w-4 h-4" /> Hide Items
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" /> View Items
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedOrder === order.orderId && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-2">Order Items</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {order.items?.length > 0 ? (
                          order.items.map((item, idx) => (
                            <li key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                              <span>{item.name || 'Unnamed Item'}</span>
                              <span className="text-gray-600">Qty {item.quantity || 1} • {formatUSD(item.price || 0)}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500">No items available for this order.</li>
                        )}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-700 font-medium">No orders available yet.</p>
            <p className="text-sm text-gray-500 mt-1">Your confirmed orders will appear here.</p>
          </div>
        )}
      </div>
      <CheckoutFooter />
    </div>
  );
};

export default Orders;
