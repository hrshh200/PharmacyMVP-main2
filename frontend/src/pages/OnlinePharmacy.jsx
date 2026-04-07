import React, { useState, useEffect } from 'react';
import { Pill, HeartPulse, Activity, Brain, ShieldPlus, Thermometer, MapPin, ChevronDown, AlertCircle, Star, Upload } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CartButton from '../components/CartButton';
import PrescriptionUploadModal from '../components/PrescriptionUploadModal';
import ExtractedMedicinesModal from '../components/ExtractedMedicinesModal';
import PrescriptionHistoryCard from '../components/PrescriptionHistoryCard';
import axios from 'axios';
import { baseURL } from '../main';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CheckoutFooter from '../components/CheckoutFooter';
import MedicineCard from '../components/MedicineCard';

function OnlinePharmacy() {
  const appliedCampaignStorageKey = 'medVisionAppliedCampaign';
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [userData, setUserData] = useState(null);
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [storesLoading, setStoresLoading] = useState(true);
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [medicinename, setMedicineName] = useState(null);
  const [openCartOnLoad, setOpenCartOnLoad] = useState(false);
  const [isSwitchingStore, setIsSwitchingStore] = useState(false);
  const [storeReviews, setStoreReviews] = useState([]);
  const [storeReviewsLoading, setStoreReviewsLoading] = useState(false);
  const [wishlistMedicineIds, setWishlistMedicineIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [appliedCampaign, setAppliedCampaign] = useState(null);

  // Prescription Upload States
  const [showUploadPrescriptionModal, setShowUploadPrescriptionModal] = useState(false);
  const [showExtractedMedicinesModal, setShowExtractedMedicinesModal] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
  const [userPrescriptions, setUserPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [showPrescriptionHistory, setShowPrescriptionHistory] = useState(false);

  // Advanced Search Filter States
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterBrand, setFilterBrand] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');
  const [filterComposition, setFilterComposition] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterRequiresPrescription, setFilterRequiresPrescription] = useState('all'); // 'all'|'yes'|'no'

  const location = useLocation();
  const navigate = useNavigate();

  // Health Conditions Data
  const healthConditions = [
    { key: 'all', label: 'All Medicines', icon: ShieldPlus, keywords: [] },
    { key: 'favorites', label: 'Favorites', icon: Star, keywords: [] },
    { key: 'diabetes-care', label: 'Diabetes Care', icon: Activity, keywords: ['diabetes', 'diabetic', 'metformin', 'insulin', 'glucose', 'sugar'] },
    { key: 'cardiac-care', label: 'Cardiac Care', icon: HeartPulse, keywords: ['heart', 'cardiac', 'bp', 'blood pressure', 'hypertension', 'cholesterol', 'aspirin'] },
    { key: 'stomach-care', label: 'Stomach Care', icon: Pill, keywords: ['stomach', 'acidity', 'gastric', 'ulcer', 'antacid', 'digestion'] },
    { key: 'pain-relief', label: 'Pain Relief', icon: Pill, keywords: ['pain', 'fever', 'paracetamol', 'ibuprofen', 'analgesic', 'inflammation'] },
    { key: 'liver-care', label: 'Liver Care', icon: ShieldPlus, keywords: ['liver', 'hepatitis', 'hepatic', 'enzymes'] },
    { key: 'oral-care', label: 'Oral Care', icon: Thermometer, keywords: ['oral', 'tooth', 'dental', 'mouth', 'gum'] },
    { key: 'respiratory', label: 'Respiratory', icon: Thermometer, keywords: ['asthma', 'cough', 'cold', 'respiratory', 'lung', 'inhaler', 'allergy'] },
    { key: 'sexual-health', label: 'Sexual Health', icon: HeartPulse, keywords: ['sexual', 'hormonal', 'intimate', 'reproductive'] },
    { key: 'elderly-care', label: 'Elderly Care', icon: Brain, keywords: ['elderly', 'senior', 'arthritis', 'bone', 'joint', 'vitamin'] },
    { key: 'kidney-care', label: 'Kidney Care', icon: ShieldPlus, keywords: ['kidney', 'renal', 'nephro', 'urinary', 'uti'] },
    { key: 'cold-immunity', label: 'Cold & Immunity', icon: Thermometer, keywords: ['cold', 'flu', 'immunity', 'immune', 'vitamin c', 'zinc'] },
  ];

  // API Calls
  const fetchDataFromApi = async () => {
    try {
      const token = localStorage.getItem('medVisionToken');
      if (!token) return;

      const response = await axios.get(`${baseURL}/fetchdata`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.userData) {
        setUserData(response.data.userData);
        localStorage.setItem('userData', JSON.stringify(response.data.userData));
      }
    } catch (error) {
      console.error("Error fetching user data:", error.message);
    }
  };

  const fetchStores = async () => {
    try {
      setStoresLoading(true);
      const token = localStorage.getItem('medVisionToken');

      const response = await axios.get(`${baseURL}/allstores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Stores API response:', response.data);

      if (response.data?.success && response.data?.stores && response.data.stores.length > 0) {
        setStores(response.data.stores);
        setFilteredStores(response.data.stores);
      } else {
        setStores([]);
        setFilteredStores([]);
        setSelectedStore(null);
      }
    } catch (error) {
      console.error('Error fetching stores:', error.message);
      setStores([]);
      setFilteredStores([]);
      setSelectedStore(null);
    } finally {
      setStoresLoading(false);
    }
  };

  //Fetch medicines based on the current Store selected
  const fetchMedicinesByStore = async (storeId) => {
    try {
      setLoading(true);

      const response = await axios.get(`${baseURL}/medicines-by-store/${storeId}`);

      if (response.data?.success) {
        setMedicines(response.data.medicines || []);
      } else {
        setMedicines([]);
      }
    } catch (error) {
      console.error('Error fetching medicines by store:', error.message);
      setMedicines([]);
    } finally {
      setLoading(false);
      setIsSwitchingStore(false); // ✅ stop switching
    }
  };

  const fetchStoreReviews = async (storeId) => {
    if (!storeId) {
      setStoreReviews([]);
      return;
    }

    try {
      setStoreReviewsLoading(true);
      const response = await axios.get(`${baseURL}/reviews/store/${storeId}?limit=6`);
      setStoreReviews(response.data?.reviews || []);
    } catch (error) {
      console.error('Error fetching store reviews:', error.message);
      setStoreReviews([]);
    } finally {
      setStoreReviewsLoading(false);
    }
  };

  // Prescription Upload Functions
  const loadUserPrescriptions = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setPrescriptionsLoading(true);
      const response = await axios.get(`${baseURL}/prescriptions/auto-fill`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error('Error loading prescriptions:', error.message);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const handlePrescriptionUploadSuccess = (prescription) => {
    loadUserPrescriptions();
  };

  const handleExtractMedicines = (prescriptionId) => {
    setSelectedPrescriptionId(prescriptionId);
    setShowExtractedMedicinesModal(true);
  };

  const handleDeletePrescription = async (prescriptionId) => {
    // For MVP, deletion not implemented yet
    // In future, add API endpoint to delete prescriptions
  };

  const loadWishlist = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) {
      setWishlistMedicineIds([]);
      return;
    }

    try {
      setWishlistLoading(true);
      const response = await axios.get(`${baseURL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlistMedicineIds(response.data?.wishlistMedicineIds || []);
    } catch (error) {
      console.error('Error loading wishlist:', error.message);
      setWishlistMedicineIds([]);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleToggleWishlist = async (medicineId) => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      const isWishlisted = wishlistMedicineIds.includes(String(medicineId));

      if (isWishlisted) {
        await axios.delete(`${baseURL}/wishlist/${medicineId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWishlistMedicineIds((prev) => prev.filter((id) => id !== String(medicineId)));
      } else {
        await axios.post(
          `${baseURL}/wishlist`,
          { medicineId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWishlistMedicineIds((prev) => [...new Set([...prev, String(medicineId)])]);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error.message);
    }
  };

  // Filter Functions
  const matchesCondition = (medicine, keywords) => {
    if (!keywords.length) return true;
    const searchableText = [
      medicine?.name,
      medicine?.manufacturer,
      medicine?.type,
      medicine?.dosage,
      medicine?.medicaluse,
      medicine?.uses,
      medicine?.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return keywords.some((keyword) => searchableText.includes(keyword));
  };

  // Effects
  useEffect(() => {
    fetchDataFromApi();
    fetchStores();
  }, []);

  useEffect(() => {
    setMedicines([]);
  }, [selectedStore]);

  useEffect(() => {
    if (selectedStore) {
      fetchMedicinesByStore(selectedStore);
      fetchStoreReviews(selectedStore);
    }
  }, [selectedStore]);

  useEffect(() => {
    if (location.state?.appliedCampaign) {
      setAppliedCampaign(location.state.appliedCampaign);
      localStorage.setItem(appliedCampaignStorageKey, JSON.stringify(location.state.appliedCampaign));
      return;
    }

    try {
      const storedCampaign = JSON.parse(localStorage.getItem(appliedCampaignStorageKey) || 'null');
      setAppliedCampaign(storedCampaign);
    } catch {
      setAppliedCampaign(null);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.medicinename) {
      setMedicineName(location.state.medicinename);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (location.state?.openCart) {
      setOpenCartOnLoad(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (medicinename && medicines.length > 0) {
      const matchedMedicine = medicines.find(med =>
        med.name.toLowerCase().includes(medicinename.toLowerCase())
      );
      setSearchTerm(matchedMedicine?.name || medicinename);
    }
  }, [medicinename, medicines]);

  // Auto-select first store as default so medicines load immediately
  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0]._id);
      setFilteredStores(stores);
    }
  }, [stores]);


  // Load user prescriptions on component mount
  useEffect(() => {
    loadUserPrescriptions();
  }, []);

  useEffect(() => {
    loadWishlist();
  }, []);

  // Derived State

  const currentStore = selectedStore ? stores.find(store => store._id === selectedStore) : null;

  const activeCondition = healthConditions.find((condition) => condition.key === selectedCondition) || healthConditions[0];
  const conditionFilteredMedicines = selectedCondition === 'favorites'
    ? medicines.filter((medicine) => wishlistMedicineIds.includes(String(medicine._id)))
    : medicines.filter((medicine) => matchesCondition(medicine, activeCondition.keywords));

  const clearAdvancedFilters = () => {
    setFilterBrand('');
    setFilterManufacturer('');
    setFilterComposition('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterInStock(false);
    setFilterRequiresPrescription('all');
  };

  const hasAdvancedFilter = Boolean(
    filterBrand.trim() ||
    filterManufacturer.trim() ||
    filterComposition.trim() ||
    filterPriceMin.trim() ||
    filterPriceMax.trim() ||
    filterInStock ||
    filterRequiresPrescription !== 'all'
  );

  const filteredMedicines = conditionFilteredMedicines.filter((medicine) => {
    // Text search
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (normalizedSearch) {
      const firstWord = normalizedSearch.split(' ')[0];
      const combinedFields = `${medicine.name} ${medicine.manufacturer} ${medicine.type} ${medicine.dosage || ''}`.toLowerCase();
      if (!combinedFields.includes(firstWord)) return false;
    }
    // Brand filter (matches name or type)
    if (filterBrand.trim()) {
      const brand = filterBrand.trim().toLowerCase();
      const nameType = `${medicine.name || ''} ${medicine.type || ''}`.toLowerCase();
      if (!nameType.includes(brand)) return false;
    }
    // Manufacturer filter
    if (filterManufacturer.trim()) {
      const mfr = filterManufacturer.trim().toLowerCase();
      if (!(medicine.manufacturer || '').toLowerCase().includes(mfr)) return false;
    }
    // Composition filter (matches dosage, uses, medicaluse, description)
    if (filterComposition.trim()) {
      const comp = filterComposition.trim().toLowerCase();
      const compFields = `${medicine.dosage || ''} ${medicine.uses || ''} ${medicine.medicaluse || ''} ${medicine.description || ''}`.toLowerCase();
      if (!compFields.includes(comp)) return false;
    }
    // Price range
    const price = parseFloat(medicine.price);
    if (filterPriceMin.trim() && !isNaN(parseFloat(filterPriceMin))) {
      if (price < parseFloat(filterPriceMin)) return false;
    }
    if (filterPriceMax.trim() && !isNaN(parseFloat(filterPriceMax))) {
      if (price > parseFloat(filterPriceMax)) return false;
    }
    // In-stock filter
    if (filterInStock && !(medicine.stock > 0)) return false;
    // Prescription filter
    if (filterRequiresPrescription === 'yes' && !medicine.requiresPrescription) return false;
    if (filterRequiresPrescription === 'no' && medicine.requiresPrescription) return false;

    return true;
  });

  const hasActiveFilter = Boolean(searchTerm.trim()) || selectedCondition !== 'all' || hasAdvancedFilter;
  const displayedMedicines = hasActiveFilter ? filteredMedicines : conditionFilteredMedicines;
  const shouldUseScroller = displayedMedicines.length > 9;

  // Loading State
  if (storesLoading) {
    return (
      <div className="relative z-[100]">
        <Navbar />
        <div className="min-h-screen bg-[#f7fbff] flex items-center justify-center" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 0.5rem)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading pharmacy stores...</p>
          </div>
        </div>
      </div>
    );
  }

  // No Stores Available State
  if (stores.length === 0) {
    return (
      <div className="relative z-[100]">
        <Navbar />
        <div className="min-h-screen bg-[#f7fbff] relative" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 0.5rem)' }}>
          <div className="flex flex-col items-center justify-center min-h-screen px-4">
            <div className="text-center max-w-md">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-3">No Stores Available</h1>
              <p className="text-lg text-gray-600 mb-2">We're sorry, but there are no pharmacy stores available in your area.</p>
              <p className="text-gray-500 mb-8">Please check back later or contact support for assistance.</p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full bg-white border-2 border-cyan-200 hover:bg-cyan-50 text-cyan-600 font-bold py-3 px-6 rounded-xl transition"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="relative z-[100]">
      <Navbar />
      <div className="min-h-screen bg-[#f7fbff] relative" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 0.5rem)' }}>

        {/* Pharmacy Header Banner */}
        {isSwitchingStore && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[300]">
            <div className="bg-white shadow-xl border border-cyan-200 rounded-xl px-6 py-4 flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-cyan-600 border-t-transparent rounded-full"></div>
              <p className="text-sm font-semibold text-gray-700">
                Switching store and loading medicines...
              </p>
            </div>
          </div>
        )}
        <div className="relative bg-gradient-to-r from-slate-900 via-cyan-950 to-emerald-900 pt-10 pb-16">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="max-w-6xl mx-auto px-4 relative z-10">
            {/* Header Top Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
              {/* Brand & Title */}
              <div className="flex items-center gap-4">
              </div>
              {/* Stats Section */}
            </div>

            {/* Current Store & Store Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Current Store Info */}
              {currentStore && (
                <div className="lg:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300 mb-2">Currently Viewing</p>
                  <div className="bg-white/5 border border-white/20 rounded-2xl px-6 py-4">
                    <h2 className="text-2xl font-black text-white mb-1">{currentStore.storeName || currentStore.name}</h2>
                    <p className="text-cyan-100 text-sm">{currentStore.address}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-300" />
                      <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-200 rounded-lg text-xs font-semibold">
                        Pincode: {currentStore.pincode}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Store Selection Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                  className="w-full flex items-center gap-3 bg-gradient-to-br from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 border border-white/20 rounded-2xl px-5 py-4 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/90">Change Store</p>
                    <p className="font-bold text-white truncate">{currentStore?.storeName || currentStore?.name || 'Select Store'}</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ${isStoreDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isStoreDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl z-[200] max-h-96 overflow-y-auto border border-gray-200">
                    {/* Store List */}
                    <div className="py-2">
                      {filteredStores.length === 0 ? (
                        <div className="px-6 py-8 text-center">
                          <p className="text-gray-500 text-sm">No stores available</p>
                        </div>
                      ) : (
                        filteredStores.map((store) => (
                          <button
                            key={store._id}
                            type="button"
                            onClick={() => {
                              setIsSwitchingStore(true);  
                              setIsStoreDropdownOpen(false);
                              setSelectedStore(store._id);
                            }}
                            className={`w-full px-6 py-4 text-left transition-all duration-200 border-b border-gray-100 last:border-b-0 ${selectedStore === store._id
                              ? 'bg-gradient-to-r from-cyan-50 to-emerald-50 border-l-4 border-l-cyan-600'
                              : 'hover:bg-gray-50'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <MapPin className={`w-4 h-4 mt-1 flex-shrink-0 ${selectedStore === store._id ? 'text-cyan-600' : 'text-gray-400'
                                }`} />
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{store.storeName || store.name}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{store.city}</p>
                                <p className="text-xs text-gray-500 mt-1">{store.address}</p>
                                <div className="mt-2">
                                  <span className="inline-block px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">
                                    📍 {store.pincode}
                                  </span>
                                </div>
                              </div>
                              {selectedStore === store._id && (
                                <div className="flex-shrink-0">
                                  <div className="w-3 h-3 rounded-full bg-cyan-600 mt-1" />
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <CartButton openOnMount={openCartOnLoad} appliedCampaign={appliedCampaign} selectedStoreId={selectedStore} />

        <div className="max-w-6xl mx-auto px-4 pb-8 mt-6">
          <div className="relative z-0 mb-4">
            <SearchBar onSearchChange={setSearchTerm} medicines={medicines} />
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mb-8">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowAdvancedFilters((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  showAdvancedFilters || hasAdvancedFilter
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-300 hover:text-cyan-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Advanced Filters
                {hasAdvancedFilter && (
                  <span className="ml-1 flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs font-bold">
                    {[filterBrand, filterManufacturer, filterComposition, filterPriceMin || filterPriceMax, filterInStock ? '1' : '', filterRequiresPrescription !== 'all' ? '1' : ''].filter(Boolean).length}
                  </span>
                )}
              </button>
              {hasAdvancedFilter && (
                <button
                  onClick={clearAdvancedFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Clear Filters
                </button>
              )}
            </div>

            {showAdvancedFilters && (
              <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Filter Medicines</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Brand / Product Name</label>
                    <input
                      type="text"
                      value={filterBrand}
                      onChange={(e) => setFilterBrand(e.target.value)}
                      placeholder="e.g. Dolo, Crocin"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Manufacturer</label>
                    <input
                      type="text"
                      value={filterManufacturer}
                      onChange={(e) => setFilterManufacturer(e.target.value)}
                      placeholder="e.g. Cipla, Sun Pharma"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Composition / Active Ingredient</label>
                    <input
                      type="text"
                      value={filterComposition}
                      onChange={(e) => setFilterComposition(e.target.value)}
                      placeholder="e.g. paracetamol, metformin"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Min Price (₹)</label>
                    <input
                      type="number"
                      value={filterPriceMin}
                      onChange={(e) => setFilterPriceMin(e.target.value)}
                      min="0"
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Max Price (₹)</label>
                    <input
                      type="number"
                      value={filterPriceMax}
                      onChange={(e) => setFilterPriceMax(e.target.value)}
                      min="0"
                      placeholder="9999"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterInStock}
                        onChange={(e) => setFilterInStock(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-400"
                      />
                      <span className="text-sm font-medium text-slate-700">In Stock Only</span>
                    </label>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prescription Required</label>
                      <select
                        value={filterRequiresPrescription}
                        onChange={(e) => setFilterRequiresPrescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white"
                      >
                        <option value="all">All Medicines</option>
                        <option value="no">OTC (No Prescription)</option>
                        <option value="yes">Prescription Required</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900">Browse by Health Conditions</h2>
              {selectedCondition !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCondition('all')}
                  className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-800"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Upload Prescription Card */}
              <button
                onClick={() => setShowUploadPrescriptionModal(true)}
                className="group min-h-[120px] rounded-2xl border-2 border-dashed border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50 p-4 text-left transition-all duration-200 hover:border-cyan-500 hover:bg-cyan-100 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 group-hover:bg-cyan-200">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="rounded-full px-2 py-1 text-[10px] font-bold bg-cyan-100 text-cyan-700">
                    NEW
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold leading-tight line-clamp-2 text-slate-900">
                  Upload Prescription
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  Auto-fill medicines
                </p>
              </button>

              {/* Health Conditions */}
              {healthConditions.map((condition) => {
                const isActive = selectedCondition === condition.key;
                const Icon = condition.icon;
                const conditionCount = condition.key === 'favorites'
                  ? medicines.filter((medicine) => wishlistMedicineIds.includes(String(medicine._id))).length
                  : medicines.filter((medicine) => matchesCondition(medicine, condition.keywords)).length;

                return (
                  <button
                    key={condition.key}
                    type="button"
                    onClick={() => setSelectedCondition(condition.key)}
                    className={`group min-h-[120px] rounded-2xl border p-4 text-left transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-br from-cyan-600 to-emerald-500 border-cyan-600 text-white shadow-lg shadow-cyan-200/50'
                      : 'bg-white border-slate-200 text-slate-700 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? 'bg-white/20' : 'bg-cyan-50 text-cyan-700 group-hover:bg-cyan-100'
                        }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isActive ? 'bg-white/20 text-cyan-50' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {conditionCount}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold leading-tight line-clamp-2">{condition.label}</p>
                    <p className={`mt-2 text-xs ${isActive ? 'text-cyan-100' : 'text-slate-500'}`}>
                      {conditionCount} items
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Prescription History Section */}
            {userPrescriptions.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-8">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Your Prescriptions</h3>
                  <button
                    onClick={() => setShowPrescriptionHistory(!showPrescriptionHistory)}
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    {showPrescriptionHistory ? 'Hide' : 'Show'} ({userPrescriptions.length})
                  </button>
                </div>

                {showPrescriptionHistory && (
                  <div className="space-y-3">
                    {userPrescriptions.map((prescription) => (
                      <PrescriptionHistoryCard
                        key={prescription._id}
                        prescription={prescription}
                        onExtract={handleExtractMedicines}
                        onDelete={handleDeletePrescription}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Display Medicines Grid — always visible */}
          <div className="mt-10">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
                <p className="mt-4 text-slate-500 text-sm font-medium">Loading medicines...</p>
              </div>
            ) : displayedMedicines.length === 0 ? (
              <div className="text-center py-16">
                <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">
                  {searchTerm.trim() ? `No medicines found for "${searchTerm}".` : 'No medicines available for this store yet.'}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-6">
                  {searchTerm.trim() ? 'Search Results' : selectedCondition !== 'all' ? healthConditions.find(c => c.key === selectedCondition)?.label : 'All Medicines'}
                  <span className="ml-2 text-sm font-semibold text-slate-400">({displayedMedicines.length})</span>
                </h3>
                <div className={shouldUseScroller ? 'max-h-[68vh] overflow-y-auto pr-3' : ''}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedMedicines.map((medicine) => (
                      <MedicineCard
                        key={medicine._id}
                        id={medicine._id}
                        name={medicine.name}
                        manufacturer={medicine.manufacturer}
                        dosage={medicine.dosage}
                        price={medicine.price}
                        stock={medicine.stock}
                        type={medicine.type}
                        requiresPrescription={medicine.requiresPrescription || false}
                        isWishlisted={wishlistMedicineIds.includes(String(medicine._id))}
                        onToggleWishlist={handleToggleWishlist}
                        wishlistLoading={wishlistLoading}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 rounded-3xl border border-cyan-100 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900">What patients say about this store</h2>
              {currentStore && (
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-200">
                  {currentStore.storeName || currentStore.name}
                </span>
              )}
            </div>

            {storeReviewsLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading reviews...</p>
            ) : storeReviews.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No reviews yet for this store. Be the first to review from your dashboard.</p>
            ) : (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storeReviews.map((review) => (
                  <div key={review._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= review.rating ? 'text-yellow-400' : 'text-slate-300'}
                          fill={star <= review.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-800">{review.name}</p>
                    <p className="text-xs text-slate-500">{review.role || 'Patient'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prescription Upload Modal */}
        <PrescriptionUploadModal
          isOpen={showUploadPrescriptionModal}
          onClose={() => setShowUploadPrescriptionModal(false)}
          onUploadSuccess={handlePrescriptionUploadSuccess}
        />

        {/* Extracted Medicines Modal */}
        <ExtractedMedicinesModal
          isOpen={showExtractedMedicinesModal}
          onClose={() => setShowExtractedMedicinesModal(false)}
          prescriptionId={selectedPrescriptionId}
          onAddToCart={(count) => {
            loadUserPrescriptions();
          }}
        />

        <CheckoutFooter />
      </div>
    </div>
  );
}

export default OnlinePharmacy;

