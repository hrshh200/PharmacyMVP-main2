import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Trash, Lock, Plus, Minus, DollarSign } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../main';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// const ethereum = window.ethereum;

const CartButton = ({ openOnMount = false }) => {
  const latestOrderStorageKey = 'medVisionLatestOrderId';
  const cartIdStorageKey = 'medVisionCartId';
  const checkoutCartStorageKey = 'medVisionCheckoutCart';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const navigate = useNavigate();

  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const paylock = cartItems.length > 0;

  const formatUsd = (value) => {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const viewCartModal = () => { 
    setIsModalOpen(true);
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
        setCartId(cartResponse.data.cartId);
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
    if (openOnMount && userData?._id && !hasAutoOpened) {
      setIsModalOpen(true);
      setHasAutoOpened(true);
    }
  }, [openOnMount, userData?._id, hasAutoOpened]);
  


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
      
      const response = await axios.post(`${baseURL}/additemstocart`, {
        id: userData?._id, // Passing user ID if required
        items: cartItems, // Passing the array
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
          },
        });
      }
      else if(response.status === 201){
        navigate('/addresspage', {
          state: {
            cartItems: cartItems,
            orderId: currentOrderId,
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
                            <DollarSign className="w-4 h-4" />
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-medium text-slate-700">Total</h3>
                <p className="text-xl font-bold text-slate-900">{formatUsd(totalAmount)}</p>
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
