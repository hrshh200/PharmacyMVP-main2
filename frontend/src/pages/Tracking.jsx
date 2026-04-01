import React, {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom'; // Import useParams
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, MapPin, ClipboardList, ShieldCheck, Home } from 'lucide-react';
import { baseURL } from '../main';
import axios from 'axios';
import CheckoutFooter from '../components/CheckoutFooter';

function Tracking() {
  // Retrieve the id from the URL parameters
  const { id } = useParams();
  const [userdata, setUserData] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const getTrackingSteps = (deliveryType) => {
    if (deliveryType === 'pickup') {
      return [
        { id: 1, status: "Order Placed", icon: "Clock" },
        { id: 2, status: "Packed", icon: "Package" },
        { id: 3, status: "Ready for Pick Up", icon: "MapPin" },
        { id: 4, status: "Picked Up", icon: "CheckCircle" }
      ];
    } else {
      return [
        { id: 1, status: "Order Placed", icon: "Clock" },
        { id: 2, status: "Packed", icon: "Package" },
        { id: 3, status: "Out for Delivery", icon: "Truck" },
        { id: 4, status: "Delivered", icon: "CheckCircle" }
      ];
    }
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      Clock,
      Package,
      Truck,
      MapPin,
      CheckCircle
    };
    return iconMap[iconName] || Package;
  };

  const fetchDataFromApi = async () => {
    try {
      const token = localStorage.getItem('medVisionToken');
      const [userResponse, orderResponse] = await Promise.all([
        axios.get(`${baseURL}/fetchdata`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`${baseURL}/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);
      const fetchedData = userResponse.data.userData;
      const fetchedOrder = orderResponse.data.order;
      setUserData(fetchedData);
      setOrder(fetchedOrder);
      localStorage.setItem('userData', JSON.stringify(fetchedData));
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataFromApi();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white px-4 sm:px-6 lg:px-8 pb-8" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 2rem)' }}>
        <div className="max-w-5xl mx-auto text-center py-12">
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white px-4 sm:px-6 lg:px-8 pb-8" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 2rem)' }}>
        <div className="max-w-5xl mx-auto text-center py-12">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    );
  }

  const steps = getTrackingSteps(order.deliveryType || 'delivery');
  const currentStatusIndex = steps.findIndex(step => step.status === order.trackingStatus);
  const progressPercent = Math.round(((currentStatusIndex + 1) / steps.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white px-4 sm:px-6 lg:px-8 pb-8" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 2rem)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 rounded-3xl text-white p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-cyan-300/10 blur-2xl"></div>

          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Track Your Order</h1>
              <p className="text-blue-100 mt-2">Stay updated with your shipment progress in real time.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto">
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Order ID</p>
                <p className="text-lg font-semibold flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" />
                  {order?.orderId || id}
                </p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Progress</p>
                <p className="text-lg font-semibold">{progressPercent}%</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 inline-flex items-center gap-2 text-xs bg-emerald-400/20 border border-emerald-200/30 rounded-full px-3 py-1.5 text-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            Shipment updates are synced securely
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Current Status</p>
              <p className="text-base font-semibold text-slate-900 mt-1">{order.trackingStatus || 'Order Placed'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Delivery Type</p>
              <p className="text-base font-semibold text-slate-900 mt-1">{order.deliveryType === 'pickup' ? 'Store Pick Up' : 'Home Delivery'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Customer</p>
              <p className="text-base font-semibold text-slate-900 mt-1">{userdata?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>

          <div className="flow-root">
            <ul className="-mb-8">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const IconComponent = getIconComponent(step.icon);
                return (
                  <li key={step.id}>
                    <div className="relative pb-8">
                      {index !== steps.length - 1 && (
                        <span
                          className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${isCompleted ? 'bg-emerald-300' : 'bg-gray-200'}`}
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-9 w-9 rounded-full flex items-center justify-center ring-8 ring-white ${isCompleted ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5">
                          <p className={`text-sm font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>{step.status}</p>
                          {isCompleted && index === currentStatusIndex && (
                            <p className="mt-1 text-xs text-emerald-600 font-medium">Current Status</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-gray-900">Shipping Updates</h3>
            <p className="mt-2 text-sm text-gray-600">
              You will receive email updates about your package status. If you need help, please contact our support team.
            </p>
          </div>

          <div className="mt-5">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
      <CheckoutFooter />
    </div>
  );
}

export default Tracking;
