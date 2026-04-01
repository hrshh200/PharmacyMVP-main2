import React, { useState, useEffect, useRef } from 'react';
import { Pill, Package, ShoppingCart, FileText, CheckCircle, Upload, X, AlertCircle, Clock, BadgeCheck, Stethoscope, CalendarDays, UserRound, Star, Zap } from 'lucide-react';
import CartButton from './CartButton';
import axios from 'axios';
import { baseURL } from '../main';

const MedicineCard = ({ id, name, manufacturer, dosage, price, stock, type, requiresPrescription, onAddToCart }) => {

  const formatUsd = (value) => {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const storageKey = `prescription_${name}`;

  const [showadded, setShowAdded] = useState(false);
  const [addcart, setAddCart] = useState(false);
  const [userData, setUserData] = useState(null);
  const [cartId, setCartId] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
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
        }, 1500);
  
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
    <div className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-cyan-200 transition-all duration-300 hover:-translate-y-1">
      {/* Background Gradient on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/0 to-emerald-50/0 group-hover:from-cyan-50/50 group-hover:to-emerald-50/50 transition-all duration-300 pointer-events-none" />

      <div className="relative p-4 flex flex-col h-full">
        {/* Medicine Image Section */}
        <div className="relative w-full h-40 bg-gradient-to-br from-cyan-50 to-emerald-50 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
          <img
            src="/medicine.png"
            alt={name}
            className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.src = '/logo.png';
            }}
          />
          
          {/* Stock Badge */}
          <div className="absolute top-3 right-3">
            {stock > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                <Zap className="w-3 h-3" />
                In Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Medicine Info Section */}
        <div className="flex-1 flex flex-col">
          {/* Name */}
          <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-1 group-hover:text-cyan-700 transition-colors">
            {name}
          </h3>

          {/* Manufacturer */}
          <p className="text-xs text-gray-500 mb-2 font-medium">
            {manufacturer}
          </p>

          {/* Dosage & Type */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="inline-block px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 text-xs font-semibold border border-cyan-100">
              {dosage}
            </span>
            <span className="inline-block px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
              {type}
            </span>
          </div>

          {/* Prescription Status Badge */}
          <div className="mb-3">
            {requiresPrescription ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <FileText className="w-3 h-3" />
                Rx Required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3 h-3" />
                OTC
              </span>
            )}
          </div>

          {/* Prescription Status Banner */}
          {requiresPrescription && prescriptionStatus === 'pending' && (
            <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
                <p className="text-xs font-bold text-amber-800">Under Review</p>
              </div>
              <p className="text-xs text-amber-700 pl-4.5">Awaiting approval...</p>
              <button
                onClick={handleSimulateApproval}
                className="mt-0.5 text-xs text-amber-600 underline text-left w-fit hover:text-amber-800 transition-colors"
              >
                Simulate Approval (Demo)
              </button>
            </div>
          )}

          {requiresPrescription && prescriptionStatus === 'approved' && (
            <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-2 flex items-center gap-2">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <p className="text-xs font-bold text-emerald-800">Approved</p>
            </div>
          )}

          {/* Price & Stock Info */}
          <div className="border-t border-gray-100 pt-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Price</p>
                <p className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                  ₹{price}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium mb-0.5">Available</p>
                <p className={`text-sm font-bold ${stock > 5 ? 'text-emerald-600' : stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {stock > 0 ? `${stock} pcs` : 'Out'}
                </p>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={userData?._id ? handleCartButtonClick : undefined}
            disabled={!userData?._id || stock === 0 || (requiresPrescription && prescriptionStatus === 'pending')}
            className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold
      transform transition-all duration-200
      ${
        requiresPrescription && prescriptionStatus === 'pending'
          ? 'bg-amber-100 text-amber-700 cursor-not-allowed border border-amber-300'
          : userData?._id && stock > 0
            ? 'bg-gradient-to-r from-cyan-600 to-emerald-500 text-white hover:from-cyan-700 hover:to-emerald-600 active:scale-95 hover:shadow-lg shadow-md hover:shadow-cyan-200/50 border border-cyan-400/30'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
      }`}
          >
            {showadded ? (
              <div className="flex items-center gap-2 text-white">
                <CheckCircle className="w-4 h-4" />
                <span>Added!</span>
              </div>
            ) : requiresPrescription && prescriptionStatus === 'pending' ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Pending Approval</span>
              </>
            ) : requiresPrescription && !prescriptionStatus ? (
              <>
                <FileText className="w-4 h-4" />
                <span>Upload Rx</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>{userData?._id ? "Add to Cart" : "Log in"}</span>
              </>
            )}
          </button>
        </div>

        {userData?._id && addcart && (
          <CartButton id={id} name={name} price={price} />
        )}
      </div>

      {/* Prescription Upload Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/40 bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.42)]">
            <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-cyan-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />

            {/* Header */}
            <div className="relative bg-gradient-to-r from-cyan-700 via-sky-700 to-emerald-600 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">Upload Prescription</h2>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-cyan-100">Pharmacy Verification</p>
                </div>
              </div>
              <button
                onClick={() => { setShowPrescriptionModal(false); setPrescriptionFile(null); }}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="relative px-5 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-4 md:grid-cols-[1.05fr_1fr]">
                {/* Checklist Section */}
                <section>
                  <p className="text-base sm:text-lg font-bold text-slate-900 mb-3">Prescription Checklist</p>
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-2.5">
                      {prescriptionChecklist.map((item) => (
                        <div key={item.title} className="flex items-center gap-2.5 rounded-lg bg-white border border-slate-100 px-3 py-2.5 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-100 to-emerald-100 border border-cyan-200 flex items-center justify-center shrink-0">
                            {item.text ? (
                              <span className="text-xs font-bold text-cyan-900">{item.text}</span>
                            ) : (
                              <item.icon className="h-4 w-4 text-cyan-700" />
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
                    <p className="text-sm font-bold text-slate-900 mb-2">Sample Prescription</p>
                    <div className="rounded-lg border border-cyan-100 bg-white p-3 text-xs text-slate-700 space-y-1">
                      <p><span className="font-semibold">Dr:</span> Anjali Mehta (MBBS)</p>
                      <p><span className="font-semibold">Patient:</span> John Doe</p>
                      <p><span className="font-semibold">Date:</span> 31 Mar 2026</p>
                      <p className="mt-1"><span className="font-semibold">Rx:</span> Amoxicillin 500mg - 1 tab, 2 times/day, 5 days</p>
                      <p className="mt-1 text-cyan-700 font-semibold">✓ Signature & clinic stamp visible</p>
                    </div>
                  </div>
                </section>

                {/* Upload Section */}
                <section>
                  <p className="text-base sm:text-lg font-bold text-slate-900 mb-3">Upload File</p>
                  <div
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                      dragOver 
                        ? 'border-cyan-400 bg-cyan-50 scale-105' 
                        : prescriptionFile 
                        ? 'border-emerald-400 bg-emerald-50' 
                        : 'border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/40'
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
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="text-sm font-bold text-emerald-700 break-all">{prescriptionFile.name}</p>
                        <p className="text-xs text-emerald-600 font-medium">✓ Ready to submit</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-700">Click or drag file here</p>
                        <p className="text-xs text-gray-500">JPG, PNG or PDF (Max 10MB)</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-start gap-3 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3">
                    <AlertCircle className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Pharmacists will review your prescription within 2-4 hours to ensure compliance and safety.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => { setShowPrescriptionModal(false); setPrescriptionFile(null); }}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePrescriptionSubmit}
                      disabled={!prescriptionFile}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                        prescriptionFile
                          ? 'bg-gradient-to-r from-cyan-600 to-emerald-500 text-white hover:from-cyan-700 hover:to-emerald-600 shadow-lg shadow-cyan-200/50'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {prescriptionFile ? 'Submit Prescription' : 'Select File First'}
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
