import React, { useState, useEffect } from 'react';
import { Pill, HeartPulse, Activity, Brain, ShieldPlus, Thermometer, MapPin, ChevronDown, AlertCircle } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CartButton from '../components/CartButton';
import axios from 'axios';
import { baseURL } from '../main';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CheckoutFooter from '../components/CheckoutFooter';
import MedicineCard from '../components/MedicineCard';

function OnlinePharmacy() {
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

  const location = useLocation();
  const navigate = useNavigate();

  // Health Conditions Data
  const healthConditions = [
    { key: 'all', label: 'All Medicines', icon: ShieldPlus, keywords: [] },
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

  const filterStoresByPincode = (pincode) => {
    if (!pincode.trim()) {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(store =>
        String(store.pincode).includes(pincode)
      );
      setFilteredStores(filtered);
    }
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
    }
  }, [selectedStore]);

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

  // Refine selection by pincode once userData is available
  useEffect(() => {
    if (userData?.pincode && stores.length > 0) {
      const userPincode = String(userData.pincode).trim();
      const matchedStores = stores.filter(
        (store) => String(store.pincode).trim() === userPincode
      );
      if (matchedStores.length > 0) {
        setFilteredStores(matchedStores);
        setSelectedStore(matchedStores[0]._id);
      }
    }
  }, [userData, stores]);

  // Derived State

  const currentStore = selectedStore ? stores.find(store => store._id === selectedStore) : null;

  const activeCondition = healthConditions.find((condition) => condition.key === selectedCondition) || healthConditions[0];
  const conditionFilteredMedicines = medicines.filter((medicine) => matchesCondition(medicine, activeCondition.keywords));

  const filteredMedicines = conditionFilteredMedicines.filter((medicine) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return true;

    const firstWord = normalizedSearch.split(' ')[0];
    const combinedFields = `${medicine.name} ${medicine.manufacturer} ${medicine.type} ${medicine.dosage || ''}`.toLowerCase();
    return combinedFields.includes(firstWord);
  });

  const hasActiveFilter = Boolean(searchTerm.trim()) || selectedCondition !== 'all';
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
                    {/* Search/Filter Input */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl">
                      <input
                        type="text"
                        placeholder="Search by pincode..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                        onChange={(e) => filterStoresByPincode(e.target.value)}
                      />
                    </div>

                    {/* Store List */}
                    <div className="py-2">
                      {filteredStores.length === 0 ? (
                        <div className="px-6 py-8 text-center">
                          <p className="text-gray-500 text-sm">No stores found for this pincode</p>
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

        <CartButton openOnMount={openCartOnLoad} />

        <div className="max-w-6xl mx-auto px-4 pb-8 mt-6">
          <div className="relative z-0 mb-8">
            <SearchBar onSearchChange={setSearchTerm} medicines={medicines} />
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
              {healthConditions.map((condition) => {
                const isActive = selectedCondition === condition.key;
                const Icon = condition.icon;
                const conditionCount = medicines.filter((medicine) => matchesCondition(medicine, condition.keywords)).length;

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
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <CheckoutFooter />
      </div>
    </div>
  );
}

export default OnlinePharmacy;

