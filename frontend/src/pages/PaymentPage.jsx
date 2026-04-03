import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Truck, QrCode, ShieldCheck, ChevronLeft, Package, DollarSign } from 'lucide-react';
import { BrowserProvider, parseEther } from 'ethers';
import toast from 'react-hot-toast';
import { baseURL } from '../main';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import CheckoutFooter from '../components/CheckoutFooter';

const paymentMethods = [
  {
    id: 'card',
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Credit/Debit Card',
    description: 'Pay securely with your card'
  },
  {
    id: 'upi',
    icon: <QrCode className="w-6 h-6" />,
    title: 'UPI',
    description: 'Pay using UPI apps'
  },
  {
    id: 'cod',
    icon: <Truck className="w-6 h-6" />,
    title: 'Cash on Delivery',
    description: 'Pay when you receive'
  },
  {
    id: 'metamask',
    icon: <Wallet className="w-6 h-6" />,
    title: 'Metamask Wallet',
    description: 'Pay with cryptocurrency'
  }
];

export function PaymentPage() {
  const latestOrderStorageKey = 'medVisionLatestOrderId';
  const checkoutCartStorageKey = 'medVisionCheckoutCart';
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [pageLoading, setPageLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userdata, setUserData] = useState(null);
  const [account, setAccount] = useState('');
  const location = useLocation();
  const currentOrderId = location.state?.orderId || localStorage.getItem(latestOrderStorageKey);
  const storedCheckoutCart = (() => {
    try {
      return JSON.parse(localStorage.getItem(checkoutCartStorageKey) || '[]');
    } catch {
      return [];
    }
  })();
  const routeCartItems = location.state?.cartItems?.length ? location.state.cartItems : storedCheckoutCart;
  const fallbackCartItems = (userdata?.orderedmedicines || []).map((medicine, index) => ({
    id: index,
    name: medicine.medicine,
    price: medicine.price,
    quantity: medicine.quantity || 1,
  }));
  const cartItems = routeCartItems.length ? routeCartItems : fallbackCartItems;

  const parseItemPrice = (item) => {
    const rawPrice = item?.price ?? item?.totalPrice ?? 0;
    const numericPrice = Number(rawPrice);
    return Number.isFinite(numericPrice) ? numericPrice : 0;
  };

  const parseItemQuantity = (item) => {
    const numericQuantity = Number(item?.quantity ?? 1);
    return Number.isFinite(numericQuantity) && numericQuantity > 0 ? numericQuantity : 1;
  };

  const totalItems = cartItems.reduce((sum, item) => sum + parseItemQuantity(item), 0);
  const payableAmount = cartItems.reduce(
    (sum, item) => sum + parseItemPrice(item) * parseItemQuantity(item),
    0
  );

  const formattedPayableAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
  }).format(payableAmount);

  const fetchDataFromApi = async () => {
    setPageLoading(true);
    try {
      const token = localStorage.getItem('medVisionToken');
      const response = await axios.get(`${baseURL}/fetchdata`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchedData = response.data.userData;
      setUserData(fetchedData);

      localStorage.setItem('userData', JSON.stringify(fetchedData));
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchDataFromApi();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask to make payments!');
        return false;
      }

      setIsProcessing(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      setAccount(accounts[0]);
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    }
  };


  const handleMetaMaskWallet = async () => {
    try {
      const isConnected = await connectWallet();
      if (!isConnected) return;

      // Placeholder conversion rate for demo/testing.
      const ETH_TO_USD_RATE = 2500;
      const amountInEth = payableAmount / ETH_TO_USD_RATE;

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const merchantAddress = "0x52c7d0701Fa7460552085E406CD33042EaB1eC40";

      const tx = {
        from: account,
        to: merchantAddress,
        value: parseEther(amountInEth.toFixed(18)),
        gasLimit: 21000n
      };

      const transaction = await signer.sendTransaction(tx);
      await transaction.wait();

      const paymentData = {
        transactionHash: transaction.hash,
        amount: payableAmount,
        userId: userdata?._id,
        items: cartItems
      };

      await axios.post(`${baseURL}/payment-success`, paymentData);
      toast.success('MetaMask payment successful!');
      return true;
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('MetaMask payment failed. Please try again.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!cartItems.length) {
      toast.error('Your cart is empty.');
      return;
    }

    if (payableAmount <= 0) {
      toast.error('Unable to process payment because order amount is invalid.');
      return;
    }

    if (!userdata?._id) {
      toast.error('Please login to continue payment.');
      return;
    }

    if (selectedMethod === 'metamask') {
      const isPaid = await handleMetaMaskWallet();
      if (!isPaid) return;
    }

    setIsProcessing(true);
    try {
      if (!currentOrderId) {
        throw new Error('Order ID not found');
      }

      const response = await axios.post(`${baseURL}/addpayment`, {
        id: userdata?._id,
        orderid: currentOrderId,
        payment: selectedMethod
      });

      if (response.status === 200) {
        localStorage.setItem(latestOrderStorageKey, currentOrderId);
        localStorage.removeItem(checkoutCartStorageKey);
        setTimeout(() => {
          deletecartitems();
          setIsProcessing(false);
          toast.success(response.data.message);
          navigate('/orderconfirmation', { state: { orderId: currentOrderId } });
          console.log(cartItems);

        }, 1000);
      }
    } catch (error) {
      console.log("Error updating the address to order");
      setIsProcessing(false);
    }
  };

  const deletecartitems = async () => {
    try {
      const response = await axios.post(`${baseURL}/deletefullcart`, { id: userdata?._id });

      if (response.status === 200) {
        console.log("Items from cart has been deleted");
      }
    } catch (error) {
      console.log("Error deleting the items from the cart");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white px-4 sm:px-6 lg:px-8 pb-12" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 3rem)' }}>
      {pageLoading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="loader w-16 h-16 border-4 border-t-blue-600 border-gray-300 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 rounded-3xl text-white p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-cyan-300/10 blur-2xl"></div>

            <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Payment Method</h1>
                <p className="text-blue-100 mt-2">Choose your preferred payment option to complete the order.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto">
                <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                  <p className="text-[11px] uppercase tracking-wide text-blue-100">Total Items</p>
                  <p className="text-lg font-semibold flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    {totalItems}
                  </p>
                </div>
                <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                  <p className="text-[11px] uppercase tracking-wide text-blue-100">Total Amount</p>
                  <p className="text-lg font-semibold flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    {formattedPayableAmount}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-4 inline-flex items-center gap-2 text-xs bg-emerald-400/20 border border-emerald-200/30 rounded-full px-3 py-1.5 text-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure checkout, encrypted transaction flow
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            <div className="bg-white shadow-lg rounded-2xl p-6 md:p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Select Payment Option</h2>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all border-2 ${selectedMethod === method.id
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'border-gray-200 hover:border-blue-200'
                      }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`${selectedMethod === method.id ? 'text-blue-600' : 'text-gray-500'}`}>
                        {method.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{method.title}</h3>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 h-fit">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Items</span>
                  <span className="font-semibold text-gray-900">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Method</span>
                  <span className="font-semibold text-gray-900">
                    {paymentMethods.find(m => m.id === selectedMethod)?.title || selectedMethod}
                  </span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between text-lg font-bold text-gray-900">
                  <span>Total Payable</span>
                  <span>{formattedPayableAmount}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/addresspage', { state: { cartItems } })}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Shipping
              </button>

              <button
                onClick={handlePayment}
                disabled={isProcessing || payableAmount <= 0}
                className="w-full mt-3 bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                {isProcessing ? 'Processing Payment...' : 'Complete Order'}
              </button>
            </div>
          </div>
        </div>
      )}
      <CheckoutFooter />
    </div>
  );
}
