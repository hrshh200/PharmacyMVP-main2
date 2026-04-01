import React, { useState, useEffect, useRef } from 'react';
import { Pill, Package, ShoppingCart, FileText, CheckCircle, Upload, X, AlertCircle, Clock, BadgeCheck, Stethoscope, CalendarDays, UserRound } from 'lucide-react';
import CartButton from './CartButton';
import axios from 'axios';
import { baseURL } from '../main';

const MedicineCard = ({ id, name, manufacturer, dosage, price, stock, type, requiresPrescription, onAddToCart }) => {

  const formatUsd = (value) => {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const storageKey = `prescription_${name}`;

  const [showadded, setShowAdded] = useState(false);
  const [addcart, setAddCart] = useState(false);
  const [userData, setUserData] = useState(null);
  const [cartId, setCartId] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  // null | 'pending' | 'approved'
  const [prescriptionStatus, setPrescriptionStatus] = useState(() => {
    return localStorage.getItem(storageKey) || null;
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const prescriptionChecklist = [
    { icon: Stethoscope, title: 'Doctor Details' },
    { icon: CalendarDays, title: 'Date of Prescription' },
    { icon: UserRound, title: 'Patient Details' },
    { icon: Pill, title: 'Medicine Details' },
    { text: '10 MB', title: 'Maximum File Size' },
  ];

  const handleCartButtonClick = () => {
    if (requiresPrescription) {
      if (prescriptionStatus === 'approved') {
        handleaddtocart();
      } else if (prescriptionStatus === 'pending') {
        // do nothing — button is disabled
      } else {
        setShowPrescriptionModal(true);
      }
    } else {
      handleaddtocart();
    }
  };

  // After upload: mark as pending, do NOT add to cart yet
  const handlePrescriptionSubmit = () => {
    if (!prescriptionFile) return;
    localStorage.setItem(storageKey, 'pending');
    setPrescriptionStatus('pending');
    setShowPrescriptionModal(false);
    setPrescriptionFile(null);
  };

  // Demo helper — simulates pharmacy approval
  const handleSimulateApproval = () => {
    localStorage.setItem(storageKey, 'approved');
    setPrescriptionStatus('approved');
  };

  const handleFileChange = (file) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setPrescriptionFile(file);
    }
  };

  // Load userData and cartId from localStorage on mount
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsed = JSON.parse(storedUserData);
        setUserData(parsed);
      } catch (e) {
        console.error("Failed to parse userData from localStorage:", e);
      }
    }

    const storedCartId = localStorage.getItem('medVisionCartId');
    if (storedCartId) {
      setCartId(storedCartId);
    }
  }, []);

  const handleaddtocart = async () => {
    try {
      let userId = userData?._id;

      // If no userData, try localStorage
      if (!userId) {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          try {
            const parsed = JSON.parse(storedUserData);
            userId = parsed?._id;
          } catch (e) {
            console.error("Failed to parse userData from localStorage:", e);
          }
        }
      }

      if (!userId) {
        console.error("User not logged in or userData not available");
        alert("Please log in to add items to cart");
        return;
      }

      console.log("Adding to cart:", { name, price, medicineId: id, userId });
      
      const response = await axios.post(`${baseURL}/updateorderedmedicines`, {
        name,
        price,
        medicineId: id,
        id: userId,
      });
      
      console.log("Add to cart response:", response);
  
      if (response.status === 200) {
        console.log(`${name} added to cart successfully`);
        
        // Store the cartId for future operations
        if (response.data.cartId) {
          localStorage.setItem('medVisionCartId', response.data.cartId);
          setCartId(response.data.cartId);
          console.log("Cart ID stored:", response.data.cartId);
        }
        
        setShowAdded(true);

        setTimeout(() => {
          setShowAdded(false);
        }, 1000);
  
        // Notify cart listeners to refresh immediately
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.response?.status === 404) {
        alert("User session expired. Please log in again.");
      } else {
        alert(`Failed to add ${name} to cart. Please try again.`);
      }
    }
  };
  

  const fetchDataFromApi = async () => {
    try {
      const token = localStorage.getItem('medVisionToken');
      
      // Try localStorage first as immediate fallback
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const parsed = JSON.parse(storedUserData);
          if (parsed?._id) {
            setUserData(parsed);
            return; // Success from localStorage
          }
        } catch (e) {
          console.error("Failed to parse userData from localStorage:", e);
        }
      }

      if (!token) {
        console.warn("No token found in localStorage");
        return;
      }

      const response = await axios.get(`${baseURL}/fetchdata`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const fetchedData = response.data.userData;
      if (fetchedData?._id) {
        setUserData(fetchedData);
        localStorage.setItem('userData', JSON.stringify(fetchedData));
      }
    } catch (error) {
      console.error("Error fetching user data:", error.message);
      // Fallback already attempted above from localStorage
    }
  };


  useEffect(() => {
    fetchDataFromApi();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 w-full">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Pill className="w-5 h-5 text-cyan-600" />
          <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
        </div>
        <p className="text-sm text-gray-600">{manufacturer}</p>
        <div className="flex items-center gap-2 mt-2">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{dosage} • {type}</span>
        </div>
        <div className="mt-2">
          {requiresPrescription ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <FileText className="w-3 h-3" />
              Prescription Required
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3 h-3" />
              No Prescription Needed
            </span>
          )}
        </div> 
        <div className="flex items-center justify-between mt-4">
          <div className="text-lg font-bold text-cyan-700">{formatUsd(price)}</div>
          <div className={`text-sm ${stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {stock > 0 ? `In Stock (${stock} left)` : 'Out of Stock'}
          </div>
        </div>
        {/* Prescription status banner */}
        {requiresPrescription && prescriptionStatus === 'pending' && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
              <p className="text-xs font-semibold text-amber-800">Prescription Under Review</p>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed pl-6">
              Your prescription has been submitted. Please wait for pharmacy approval before adding to cart.
            </p>
            {/* Demo-only simulate button */}
            <button
              onClick={handleSimulateApproval}
              className="mt-1 ml-6 text-xs text-amber-600 underline underline-offset-2 hover:text-amber-800 transition-colors w-fit"
            >
              Simulate Approval (Demo)
            </button>
          </div>
        )}

        {requiresPrescription && prescriptionStatus === 'approved' && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs font-semibold text-emerald-800">Prescription Approved — You can now add to cart</p>
          </div>
        )}

        <div>
          <button
            onClick={userData?._id ? handleCartButtonClick : undefined}
            disabled={!userData?._id || stock === 0 || (requiresPrescription && prescriptionStatus === 'pending')}
            className={`mt-3 w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium
      transform transition-all duration-200
      ${
        requiresPrescription && prescriptionStatus === 'pending'
          ? 'bg-amber-100 text-amber-600 cursor-not-allowed'
          : userData?._id && stock > 0
            ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 hover:scale-[1.02]'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      }`}
          >
            {showadded ? (
              <div className="flex items-center gap-2 text-green-500">
                <span>Added to Cart!</span>
              </div>
            ) : requiresPrescription && prescriptionStatus === 'pending' ? (
              <>
                <Clock className="w-4 h-4" />
                Awaiting Prescription Approval
              </>
            ) : requiresPrescription && !prescriptionStatus ? (
              <>
                <FileText className="w-4 h-4" />
                Upload Prescription to Buy
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                {userData?._id ? "Add to Cart" : "Log in to Add to Cart"}
              </>
            )}
          </button>

          {userData?._id && addcart && (
            <CartButton id={id} name={name} price={price} />
          )}
        </div>

        {addcart && <CartButton id={id} name={name} price={price} />}
      </div>

      {/* Prescription Upload Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/40 bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.42)]">
            <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-cyan-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />
            {/* Header */}
            <div className="relative bg-gradient-to-r from-cyan-700 via-sky-700 to-emerald-600 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-white" />
                <div>
                  <h2 className="text-white font-semibold text-base">Prescription Upload</h2>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100">Pharmacy Verification</p>
                </div>
              </div>
              <button
                onClick={() => { setShowPrescriptionModal(false); setPrescriptionFile(null); }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative px-5 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-4 md:grid-cols-[1.05fr_1fr]">
                <section>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">Prescription checklist</p>
                  <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                      {prescriptionChecklist.map((item) => (
                        <div key={item.title} className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-2 text-left">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-100 to-emerald-100 border border-cyan-200/80 flex items-center justify-center shrink-0">
                            {item.text ? (
                              <span className="text-sm font-bold text-cyan-900">{item.text}</span>
                            ) : (
                              <item.icon className="h-5 w-5 text-cyan-700" />
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-800 leading-tight">{item.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
                    <p className="text-sm font-bold text-slate-900">Sample Prescription</p>
                    <div className="mt-2 rounded-xl border border-cyan-100 bg-white p-3 text-xs text-slate-700">
                      <p><span className="font-semibold">Dr:</span> Anjali Mehta (MBBS)</p>
                      <p><span className="font-semibold">Patient:</span> John Doe</p>
                      <p><span className="font-semibold">Date:</span> 31 Mar 2026</p>
                      <p className="mt-1"><span className="font-semibold">Rx:</span> Amoxicillin 500mg - 1 tab, 2 times/day, 5 days</p>
                      <p className="mt-1 text-cyan-700 font-medium">Signature & clinic stamp should be visible.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">Upload file</p>
                  <div
                    className={`mt-3 border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
                      dragOver ? 'border-cyan-400 bg-cyan-50' :
                      prescriptionFile ? 'border-emerald-400 bg-emerald-50' :
                      'border-slate-300 hover:border-cyan-300 hover:bg-cyan-50/40'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files[0]); }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                    />
                    {prescriptionFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-9 h-9 text-emerald-500" />
                        <p className="text-sm font-medium text-emerald-700 break-all">{prescriptionFile.name}</p>
                        <p className="text-xs text-emerald-600">Tap to change file</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-9 h-9 text-gray-300" />
                        <p className="text-sm font-medium text-gray-600">Click or drag and drop</p>
                        <p className="text-xs text-gray-400">JPG, PNG or PDF accepted</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-start gap-3 rounded-xl border border-cyan-100 bg-white/90 p-3">
                    <div className="h-7 w-7 rounded-full border border-cyan-400 text-cyan-600 bg-cyan-50 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs sm:text-sm italic text-slate-700 leading-relaxed">
                      Our pharmacists will quickly review your prescription to keep your order safe and compliant with healthcare guidelines.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => { setShowPrescriptionModal(false); setPrescriptionFile(null); }}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePrescriptionSubmit}
                      disabled={!prescriptionFile}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        prescriptionFile
                          ? 'bg-gradient-to-r from-cyan-600 to-emerald-500 text-white hover:from-cyan-500 hover:to-emerald-400 shadow-md shadow-cyan-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Confirm & Submit
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineCard;