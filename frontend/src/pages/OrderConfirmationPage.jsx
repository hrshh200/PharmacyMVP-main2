import { useEffect, useState } from 'react';
import { CheckCircle, Truck, ShieldCheck, ClipboardList, Home, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { baseURL } from '../main';
import axios from 'axios';
import CheckoutFooter from '../components/CheckoutFooter';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function OrderConfirmationPage() {
  const latestOrderStorageKey = 'medVisionLatestOrderId';
  const checkoutSummaryStorageKey = 'medVisionCheckoutSummary';
  const location = useLocation();
  const [userdata, setUserData] = useState([]);
  const [latestOrder, setLatestOrder] = useState(null);
  const [hasAutoDownloadedInvoice, setHasAutoDownloadedInvoice] = useState(false);
  const storedCheckoutSummary = (() => {
    try {
      return JSON.parse(localStorage.getItem(checkoutSummaryStorageKey) || 'null');
    } catch {
      return null;
    }
  })();
  const checkoutSummary = location.state?.checkoutSummary || storedCheckoutSummary;

  const parseItemPrice = (item) => {
    const rawPrice = item?.price ?? item?.totalPrice ?? 0;
    const numericPrice = Number(rawPrice);
    return Number.isFinite(numericPrice) ? numericPrice : 0;
  };

  const parseItemQuantity = (item) => {
    const rawQty = item?.quantity ?? 1;
    const numericQty = Number(rawQty);
    return Number.isFinite(numericQty) && numericQty > 0 ? numericQty : 1;
  };

  const subtotalAmount = (latestOrder?.items || []).reduce(
    (sum, item) => sum + parseItemPrice(item) * parseItemQuantity(item),
    0
  );
  const orderTotalAmount = Number(latestOrder?.totalPrice || 0);
  const summaryDiscount = Number(checkoutSummary?.discountAmount) || 0;
  const inferredDiscount = Math.max(0, subtotalAmount - orderTotalAmount);
  const discountAmount = Math.max(0, Math.min(subtotalAmount, summaryDiscount > 0 ? summaryDiscount : inferredDiscount));
  const finalAmount = Math.max(0, subtotalAmount - discountAmount);
  const getPaymentMethodLabel = (method) => {
    const normalizedMethod = String(method || '').trim().toLowerCase();
    const paymentMethodMap = {
      upi: 'UPI',
      cod: 'Cash on Delivery',
      card: 'Credit/Debit Card',
      credit: 'Credit/Debit Card',
      debit: 'Credit/Debit Card',
      metamask: 'MetaMask Wallet',
      wallet: 'Digital Wallet',
      netbanking: 'Net Banking',
    };

    return paymentMethodMap[normalizedMethod] || (method ? String(method) : 'Not specified');
  };
  const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const fetchDataFromApi = async () => {
    try {
      const token = localStorage.getItem('medVisionToken');
      const orderId = location.state?.orderId || localStorage.getItem(latestOrderStorageKey);
      const [userResponse, ordersResponse] = await Promise.all([
        axios.get(`${baseURL}/fetchdata`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        orderId
          ? axios.get(`${baseURL}/orders/${orderId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          : axios.get(`${baseURL}/orders/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
      ]);
      const fetchedData = userResponse.data.userData;
      setUserData(fetchedData);
      const resolvedOrder = orderId
        ? ordersResponse.data.order
        : (ordersResponse.data.orders || []).find((order) => order.status === 'Booked') || ordersResponse.data.orders?.[0] || null;
      setLatestOrder(resolvedOrder);
      if (resolvedOrder?.orderId) {
        localStorage.setItem(latestOrderStorageKey, resolvedOrder.orderId);
      }
      localStorage.setItem('userData', JSON.stringify(fetchedData));
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  };

  const downloadInvoice = async () => {
    try {
      if (!latestOrder?.orderId) {
        alert('Order ID not found');
        return;
      }

      // Create invoice HTML content
      const invoiceContent = document.createElement('div');
      invoiceContent.style.cssText = 'position: absolute; left: -9999px; width: 850px; background: white; padding: 40px; font-family: Arial, sans-serif;';
      
      const invoiceHTML = `
        <div style="max-width: 850px; margin: 0 auto; background-color: white; padding: 40px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0f766e; padding-bottom: 20px;">
            <h1 style="color: #0f766e; margin: 0; font-size: 28px;">📋 INVOICE</h1>
            <p style="margin: 10px 0; color: #666; font-size: 14px;">Pharmacy MVP - Your Trusted Medicine Store</p>
          </div>

          <!-- Status Badge -->
          <div style="display: inline-block; background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 20px;">
            ✓ ORDER CONFIRMED
          </div>

          <!-- Order Info Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; padding: 20px; background-color: #f0fdfa; border-radius: 8px;">
            <div>
              <p style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;">Invoice Number</p>
              <p style="font-size: 16px; color: #333; font-weight: 500; margin: 0;">#${latestOrder.orderId}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;">Invoice Date</p>
              <p style="font-size: 16px; color: #333; font-weight: 500; margin: 0;">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;">Customer Name</p>
              <p style="font-size: 16px; color: #333; font-weight: 500; margin: 0;">${userdata?.name || userdata?.firstName || 'N/A'}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 5px 0;">Payment Method</p>
              <p style="font-size: 16px; color: #333; font-weight: 500; margin: 0;">${getPaymentMethodLabel(latestOrder.payment)}</p>
            </div>
          </div>

          <!-- Delivery Address -->
          <div style="padding: 20px; background-color: #f0fdfa; border-radius: 8px; margin-bottom: 30px;">
            <p style="font-size: 14px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 10px 0;">Delivery Address</p>
            <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
              ${userdata?.address || 'Not provided'}<br/>
              ${userdata?.city ? userdata.city + ', ' : ''}${userdata?.state || ''}<br/>
              ${userdata?.pincode || ''}
            </p>
                     <!-- Store Details -->
                     <div style="padding: 20px; background-color: #fff5e6; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                       <p style="font-size: 14px; color: #d97706; text-transform: uppercase; font-weight: bold; margin: 0 0 10px 0;">🏪 Store Details</p>
                       <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
                         <strong>${latestOrder.storeName || 'N/A'}</strong><br/>
                         ${latestOrder.storeAddress || 'Not provided'}<br/>
                         ${latestOrder.storeCity ? latestOrder.storeCity + ', ' : ''}${latestOrder.storeState || ''} ${latestOrder.storePincode || ''}<br/>
                         <strong>Phone:</strong> ${latestOrder.storeMobile || 'N/A'}<br/>
                         <strong>Email:</strong> ${latestOrder.storeEmail || 'N/A'}
                       </p>
                     </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #0f766e; color: white;">
                <th style="padding: 12px; text-align: left; font-weight: bold;">Medicine Name</th>
                <th style="padding: 12px; text-align: left; font-weight: bold;">Quantity</th>
                <th style="padding: 12px; text-align: left; font-weight: bold;">Unit Price</th>
                <th style="padding: 12px; text-align: left; font-weight: bold;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${latestOrder.items?.map(item => `
                <tr style="border-bottom: 1px solid #e0e0e0;">
                  <td style="padding: 12px;">${item.name || 'N/A'}</td>
                  <td style="padding: 12px;">${item.quantity || 0}</td>
                  <td style="padding: 12px;">$${Number(item.price).toFixed(2)}</td>
                  <td style="padding: 12px;">$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Summary Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <!-- Order Details -->
            <div style="padding: 20px; background-color: #f0fdfa; border-radius: 8px; border-left: 4px solid #0f766e;">
              <p style="font-size: 14px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 10px 0;">Order Details</p>
              <div style="font-size: 14px; color: #333;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #666;">Order Status:</span>
                  <span style="font-weight: bold;">${latestOrder.status || 'Processing'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #666;">Delivery Type:</span>
                  <span style="font-weight: bold;">${latestOrder.deliveryType === 'pickup' ? 'Store Pick-up' : 'Home Delivery'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #666;">Expected Delivery:</span>
                  <span style="font-weight: bold;">${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <!-- Price Summary -->
            <div style="padding: 20px; background-color: #f0fdfa; border-radius: 8px; border-left: 4px solid #0f766e;">
              <p style="font-size: 14px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 10px 0;">Price Summary</p>
              <div style="font-size: 14px; color: #333;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #666;">Subtotal:</span>
                  <span style="font-weight: bold;">$${Number(subtotalAmount || 0).toFixed(2)}</span>
                </div>
                ${discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #0f766e;">Promo Discount:</span>
                  <span style="font-weight: bold; color: #0f766e;">- $${Number(discountAmount).toFixed(2)}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #666;">Taxes & Fees:</span>
                  <span style="font-weight: bold;">$0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #0f766e; margin-top: 10px; font-size: 16px; font-weight: bold; color: #0f766e;">
                  <span>Total:</span>
                  <span>$${Number(finalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #999;">
            <p style="margin: 10px 0;">Thank you for ordering with Pharmacy MVP. Your health is our priority.</p>
            <p style="margin: 10px 0;">For support, contact us at support@pharmacymvp.com | Phone: +91-XXXX-XXXX</p>
            <p style="margin: 10px 0; color: #ccc;">Generated on ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      `;

      invoiceContent.innerHTML = invoiceHTML;
      document.body.appendChild(invoiceContent);

      // Convert HTML to Canvas
      const canvas = await html2canvas(invoiceContent, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Create PDF from canvas
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Download the PDF
      pdf.save(`Invoice_${latestOrder.orderId}_${new Date().getTime()}.pdf`);

      // Clean up
      document.body.removeChild(invoiceContent);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  useEffect(() => {
    fetchDataFromApi();
  }, []);

  useEffect(() => {
    if (!location.state?.autoDownloadInvoice) return;
    if (!latestOrder?.orderId) return;
    if (hasAutoDownloadedInvoice) return;

    setHasAutoDownloadedInvoice(true);
    downloadInvoice();
  }, [location.state, latestOrder, hasAutoDownloadedInvoice]);


  // if (!orderDetails) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-white px-4 sm:px-6 lg:px-8 pb-12" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 3rem)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl text-white p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-cyan-300/10 blur-2xl"></div>

          <div className="relative z-10 flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Order Confirmed</h1>
                <p className="text-emerald-100 mt-2">Your order has been placed successfully and is now being prepared.</p>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 border border-white/20 min-w-[220px]">
              <p className="text-xs uppercase tracking-wide text-emerald-100">Order ID</p>
              <p className="text-lg font-semibold">#{latestOrder?.orderId || 'Pending'}</p>
            </div>
          </div>

          <div className="relative z-10 mt-4 inline-flex items-center gap-2 text-xs bg-white/20 border border-white/20 rounded-full px-3 py-1.5 text-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure order received and validated
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
          <div className="bg-white shadow-lg rounded-2xl p-6 md:p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Order Summary</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Order Number</p>
                <p className="text-base font-semibold text-slate-900 mt-1">#{latestOrder?.orderId || 'Pending'}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Payment Method</p>
                <p className="text-base font-semibold text-slate-900 mt-1">{getPaymentMethodLabel(latestOrder?.payment)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Estimated Delivery</p>
                <p className="text-base font-semibold text-slate-900 mt-1">{estimatedDelivery}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Confirmation Email</p>
                <p className="text-base font-semibold text-slate-900 mt-1 break-all">{userdata?.email || 'Not available'}</p>
                             <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:col-span-2">
                               <p className="text-xs uppercase tracking-wide text-amber-700 font-bold">🏪 Store Details</p>
                               <p className="text-base font-semibold text-amber-900 mt-2">{latestOrder?.storeName || 'N/A'}</p>
                               <p className="text-sm text-amber-800 mt-1">
                                 {latestOrder?.storeAddress || 'Not provided'}<br/>
                                 {latestOrder?.storeCity ? latestOrder.storeCity + ', ' : ''}{latestOrder?.storeState || ''} {latestOrder?.storePincode || ''}
                               </p>
                               <p className="text-sm text-amber-800 mt-2">
                                 <strong>Phone:</strong> {latestOrder?.storeMobile || 'N/A'}<br/>
                                 <strong>Email:</strong> {latestOrder?.storeEmail || 'N/A'}
                               </p>
                             </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-start gap-2">
                <Truck className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">Shipping updates will be shared soon</p>
                  <p className="text-sm text-emerald-800 mt-1">You will receive status updates as your package moves from processing to doorstep delivery.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-4">What Next?</h3>
            <div className="space-y-3">
              <button
                onClick={downloadInvoice}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors font-semibold"
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>

              <Link
                to="/orders"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                View My Orders
              </Link>

              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      <CheckoutFooter />
    </div>
  );
}