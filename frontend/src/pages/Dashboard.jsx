import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Activity, Calendar, Pill, FileText, Clock, User, Mail, Phone, Menu, X, Home, CircleUser as UserCircle, ShoppingBag, Syringe, Bell, MessageSquare, Mail as MailIcon, Pencil, ClipboardList, DollarSign, Package, Truck, ChevronDown, ChevronUp, CreditCard, Plus, Minus, Trash2 } from 'lucide-react';
import { baseURL } from '../main';
import Loader from '../components/Loader';
import PrescriptionDialog from '../components/PrescriptionDialog';

const Dashboard = () => {
    const latestOrderStorageKey = 'medVisionLatestOrderId';
    const [userData, setUserData] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false);
    const [reuploadPrescriptionId, setReuploadPrescriptionId] = useState(null);
    const [showPrescriptions, setShowPrescriptions] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showRaiseQuery, setShowRaiseQuery] = useState(false);
    const [showMyOrders, setShowMyOrders] = useState(false);
    const [showMyVaccinations, setShowMyVaccinations] = useState(false);
    const [vaccinationMaster, setVaccinationMaster] = useState([]);
    const [userVaccinationMap, setUserVaccinationMap] = useState({});
    const [vacSaving, setVacSaving] = useState({});
    const [vacLoading, setVacLoading] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [prescriptionRequests, setPrescriptionRequests] = useState([]);
    const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
    const [expandedDashboardOrder, setExpandedDashboardOrder] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
    });
    const [profileErrors, setProfileErrors] = useState({});
    const [profileImage, setProfileImage] = useState('');
    const [queryForm, setQueryForm] = useState({ subject: '', message: '' });
    const [queryErrors, setQueryErrors] = useState({});
    const [querySubmitted, setQuerySubmitted] = useState(false);
    const [notifications, setNotifications] = useState({
        sms: true,
        email: true,
    });
    const [notificationSettingsLoading, setNotificationSettingsLoading] = useState(true);
    const [notificationSettingsSaving, setNotificationSettingsSaving] = useState(false);
    const [notificationSettingsMessage, setNotificationSettingsMessage] = useState(null);
    const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
    const [placingPrescriptionOrder, setPlacingPrescriptionOrder] = useState(false);
    const [refillDraft, setRefillDraft] = useState({
        prescriptionId: null,
        prescriptionTitle: '',
        items: [],
    });

    const querySubjects = [
        'Order & Delivery Issue',
        'Prescription Upload Support',
        'Medicine Availability Query',
        'Refund / Return Request',
        'Emergency Medicine Help',
        'Feedback & Suggestions',
        'Other',
    ];

    // ── Vaccination helpers ──────────────────────────────────────────────────
    const getVacStatus = (id) => userVaccinationMap[id]?.status ?? 'not_vaccinated';
    const getVacDate   = (id) => userVaccinationMap[id]?.vaccinationDate ?? '';
    const vaccinatedCount = vaccinationMaster.filter(v => getVacStatus(v._id) === 'vaccinated').length;

    const loadVaccinations = async () => {
        const token = localStorage.getItem('medVisionToken');
        if (!token) return;
        setVacLoading(true);
        try {
            const [masterRes, userRes] = await Promise.all([
                axios.get(`${baseURL}/vaccination-master`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${baseURL}/user-vaccinations`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setVaccinationMaster(masterRes.data.vaccines || []);
            const map = {};
            (userRes.data.records || []).forEach(r => {
                map[r.vaccinationId._id] = {
                    status: r.status,
                    vaccinationDate: r.vaccinationDate ? r.vaccinationDate.substring(0, 10) : '',
                };
            });
            setUserVaccinationMap(map);
        } catch { /* silent */ } finally {
            setVacLoading(false);
        }
    };

    const handleVacStatusChange = async (vaccinationId, newStatus) => {
        const date = newStatus === 'vaccinated' ? getVacDate(vaccinationId) : '';
        setUserVaccinationMap(prev => ({ ...prev, [vaccinationId]: { status: newStatus, vaccinationDate: date } }));
        setVacSaving(prev => ({ ...prev, [vaccinationId]: true }));
        try {
            const token = localStorage.getItem('medVisionToken');
            await axios.put(`${baseURL}/user-vaccinations/${vaccinationId}`, { status: newStatus, vaccinationDate: date || null }, { headers: { Authorization: `Bearer ${token}` } });
        } catch { loadVaccinations(); } finally {
            setVacSaving(prev => ({ ...prev, [vaccinationId]: false }));
        }
    };

    const handleVacDateChange = async (vaccinationId, newDate) => {
        setUserVaccinationMap(prev => ({ ...prev, [vaccinationId]: { ...prev[vaccinationId], vaccinationDate: newDate } }));
        setVacSaving(prev => ({ ...prev, [vaccinationId]: true }));
        try {
            const token = localStorage.getItem('medVisionToken');
            await axios.put(`${baseURL}/user-vaccinations/${vaccinationId}`, { status: 'vaccinated', vaccinationDate: newDate }, { headers: { Authorization: `Bearer ${token}` } });
        } catch { loadVaccinations(); } finally {
            setVacSaving(prev => ({ ...prev, [vaccinationId]: false }));
        }
    };

    const handleQueryChange = (e) => {
        setQueryForm({ ...queryForm, [e.target.name]: e.target.value });
        setQueryErrors({ ...queryErrors, [e.target.name]: undefined });
    };

    const handleQuerySubmit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!queryForm.subject) errs.subject = 'Please select a subject.';
        if (queryForm.message.trim().length < 20) errs.message = 'Minimum 20 characters required.';
        if (Object.keys(errs).length > 0) { setQueryErrors(errs); return; }
        setQuerySubmitted(true);
        setQueryForm({ subject: '', message: '' });
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
        setProfileErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setProfileImage(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleProfileEdit = () => {
        setProfileForm({
            firstName: userData?.firstName || '',
            middleName: userData?.middleName || '',
            lastName: userData?.lastName || '',
            email: userData?.email || '',
            mobile: userData?.mobile || '',
            address: userData?.address || '',
            city: userData?.city || '',
            state: userData?.state || '',
            pincode: userData?.pincode || '',
        });
        setProfileErrors({});
        setIsEditingProfile(true);
    };

    const handleProfileCancel = () => {
        setProfileForm({
            firstName: userData?.firstName || '',
            middleName: userData?.middleName || '',
            lastName: userData?.lastName || '',
            email: userData?.email || '',
            mobile: userData?.mobile || '',
            address: userData?.address || '',
            city: userData?.city || '',
            state: userData?.state || '',
            pincode: userData?.pincode || '',
        });
        setProfileErrors({});
        setIsEditingProfile(false);
    };

    const handleProfileSave = () => {
        const errors = {};
        const trimmedFirstName = profileForm.firstName.trim();
        const trimmedMiddleName = profileForm.middleName.trim();
        const trimmedLastName = profileForm.lastName.trim();
        const trimmedEmail = profileForm.email.trim();
        const trimmedMobile = profileForm.mobile.trim();
        const trimmedAddress = profileForm.address.trim();
        const trimmedCity = profileForm.city.trim();
        const trimmedState = profileForm.state.trim();
        const trimmedPincode = profileForm.pincode.trim();

        const fullName = [trimmedFirstName, trimmedMiddleName, trimmedLastName].filter(Boolean).join(' ');

        if (!trimmedFirstName) errors.firstName = 'First name is required.';
        if (!trimmedLastName) errors.lastName = 'Last name is required.';
        if (!trimmedEmail) {
            errors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            errors.email = 'Enter a valid email address.';
        }
        if (trimmedMobile && !/^\d{10,15}$/.test(trimmedMobile)) {
            errors.mobile = 'Enter a valid phone number.';
        }
        if (trimmedPincode && !/^\d{4,10}$/.test(trimmedPincode)) {
            errors.pincode = 'Enter a valid pincode.';
        }

        if (Object.keys(errors).length > 0) {
            setProfileErrors(errors);
            return;
        }

        setUserData((prev) => ({
            ...prev,
            name: fullName,
            firstName: trimmedFirstName,
            middleName: trimmedMiddleName,
            lastName: trimmedLastName,
            email: trimmedEmail,
            mobile: trimmedMobile,
            address: trimmedAddress,
            city: trimmedCity,
            state: trimmedState,
            pincode: trimmedPincode,
        }));
        setProfileErrors({});
        setIsEditingProfile(false);
    };

    const isApprovedPrescription = (status) => {
        const value = String(status || '').toLowerCase();
        return value === 'approved' || value === 'active';
    };

    const getPrescriptionStatusText = (status) => {
        const value = String(status || '').toLowerCase();
        if (value === 'approved' || value === 'active') return 'Approved by pharmacy';
        if (value === 'rejected') return 'Your prescription is rejected. Please re-upload a clearer file.';
        return 'Our Pharmacists are carefully reviewing your Prescription. Stay in Touch!';
    };

    const fetchMyPrescriptionRequests = async () => {
        const token = localStorage.getItem('medVisionToken');
        if (!token) return;

        try {
            setPrescriptionsLoading(true);
            const response = await axios.get(`${baseURL}/prescriptions/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setPrescriptionRequests(response.data.prescriptions || []);
        } catch (error) {
            console.error('Error fetching prescriptions:', error.message);
            setPrescriptionRequests([]);
        } finally {
            setPrescriptionsLoading(false);
        }
    };

    const getPrescriptionItems = (prescription) => {
        const prescriptionKey = prescription._id || prescription.id || 'rx';
        if (Array.isArray(prescription?.medicines) && prescription.medicines.length > 0) {
            return prescription.medicines
                .map((item, index) => ({
                    id: `${prescriptionKey}-${index}`,
                    name: item.name || item.medicineName || `Medicine ${index + 1}`,
                    dosage: item.dosage || prescription.dosage || '-',
                    quantity: Math.max(1, Number(item.quantity || item.prescribedQuantity || 1)),
                    price: Number(item.price || 0),
                }))
                .filter((item) => item.name);
        }

        if (prescription?.medicineName) {
            return [{
                id: `${prescriptionKey}-0`,
                name: prescription.medicineName,
                dosage: prescription.dosage || '-',
                quantity: Math.max(1, Number(prescription.quantity || 1)),
                price: Number(prescription.price || 0),
            }];
        }

        return [];
    };

    const handleStartPrescriptionOrder = (prescription) => {
        const draftItems = getPrescriptionItems(prescription);
        if (!draftItems.length) return;

        setRefillDraft({
            prescriptionId: prescription._id || prescription.id,
            prescriptionTitle: prescription.medicineName || prescription.fileName || 'Prescription Refill',
            items: draftItems,
        });
        setIsRefillModalOpen(true);
    };

    const updateRefillQuantity = (itemId, type) => {
        setRefillDraft((prev) => ({
            ...prev,
            items: prev.items
                .map((item) => {
                    if (item.id !== itemId) return item;
                    if (type === 'increase') {
                        return { ...item, quantity: item.quantity + 1 };
                    }
                    return { ...item, quantity: Math.max(1, item.quantity - 1) };
                }),
        }));
    };

    const removeRefillItem = (itemId) => {
        setRefillDraft((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== itemId),
        }));
    };

    const handlePlacePrescriptionOrder = async () => {
        if (!userData?._id) {
            alert('Please login again to continue checkout.');
            return;
        }

        const selectedItems = refillDraft.items
            .filter((item) => item.quantity > 0)
            .map((item, index) => ({
                id: index + 1,
                name: item.name,
                price: Number(item.price || 0),
                quantity: Number(item.quantity || 1),
            }));

        if (!selectedItems.length) {
            alert('Please keep at least one medicine to place the order.');
            return;
        }

        try {
            setPlacingPrescriptionOrder(true);

            const response = await axios.post(`${baseURL}/additemstocart`, {
                id: userData._id,
                items: selectedItems,
            });

            const currentOrderId = response.data.orderId || response.data.order?.orderId;
            if (currentOrderId) {
                localStorage.setItem(latestOrderStorageKey, currentOrderId);
            }

            setIsRefillModalOpen(false);
            navigate('/addresspage', {
                state: {
                    cartItems: selectedItems,
                    orderId: currentOrderId,
                },
            });
        } catch (error) {
            console.error('Error while creating prescription order:', error.message);
            alert('Could not start checkout right now. Please try again.');
        } finally {
            setPlacingPrescriptionOrder(false);
        }
    };

    const navigate = useNavigate();
    const location = useLocation();

    const fetchNotificationPreferences = async () => {
        const token = localStorage.getItem('medVisionToken');

        if (!token) {
            setNotificationSettingsLoading(false);
            return;
        }

        try {
            setNotificationSettingsLoading(true);
            const response = await axios.get(`${baseURL}/user-notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const preferences = response.data.notificationPreferences;
            setNotifications({
                sms: preferences?.isSmsNotificationOn ?? true,
                email: preferences?.isEmailNotificationOn ?? true,
            });
            setNotificationSettingsMessage(null);
        } catch (error) {
            console.error('Error fetching notification settings:', error.message);
            setNotificationSettingsMessage({
                type: 'error',
                text: 'Could not load notification settings right now.',
            });
        } finally {
            setNotificationSettingsLoading(false);
        }
    };

    const handleNotificationToggle = (key, value) => {
        setNotifications((prev) => ({ ...prev, [key]: value }));
        setNotificationSettingsMessage(null);
    };

    const handleNotificationSave = async () => {
        const token = localStorage.getItem('medVisionToken');

        if (!token) {
            setNotificationSettingsMessage({
                type: 'error',
                text: 'Please log in again to update notification settings.',
            });
            return;
        }

        try {
            setNotificationSettingsSaving(true);
            const response = await axios.put(`${baseURL}/user-notifications`, {
                isSmsNotificationOn: notifications.sms,
                isEmailNotificationOn: notifications.email,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const preferences = response.data.notificationPreferences;
            setNotifications({
                sms: preferences?.isSmsNotificationOn ?? notifications.sms,
                email: preferences?.isEmailNotificationOn ?? notifications.email,
            });
            setNotificationSettingsMessage({
                type: 'success',
                text: 'Notification settings updated successfully.',
            });
        } catch (error) {
            console.error('Error saving notification settings:', error.message);
            setNotificationSettingsMessage({
                type: 'error',
                text: 'Failed to save notification settings. Please try again.',
            });
        } finally {
            setNotificationSettingsSaving(false);
        }
    };

    const fetchDataFromApi = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('medVisionToken');
            const response = await axios.get(`${baseURL}/fetchdata`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const userDataFromApi = response.data.userData;
            setUserData(userDataFromApi);
        } catch (error) {
            console.error("Error fetching data:", error.message);
            setUserData({
                name: "John Doe",
                email: "john.doe@example.com",
                mobile: "1234567890",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchMyOrders = async () => {
        try {
            const token = localStorage.getItem('medVisionToken');
            const response = await axios.get(`${baseURL}/orders/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUserOrders(response.data.orders || []);
        } catch (error) {
            console.error('Error fetching orders:', error.message);
            setUserOrders([]);
        }
    };

    useEffect(() => {
        fetchDataFromApi();
        fetchMyOrders();
        fetchNotificationPreferences();
        fetchMyPrescriptionRequests();
    }, []);

    useEffect(() => {
        if (!userData) return;

        setProfileForm({
            firstName: userData.firstName || '',
            middleName: userData.middleName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            mobile: userData.mobile || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            pincode: userData.pincode || '',
        });
    }, [userData]);

    const resetDashboardPanels = () => {
        setShowPrescriptions(false);
        setShowNotifications(false);
        setShowRaiseQuery(false);
        setShowMyOrders(false);
        setShowMyVaccinations(false);
        setShowProfile(false);
        setIsEditingProfile(false);
        setProfileErrors({});
        setExpandedDashboardOrder(null);
    };

    useEffect(() => {
        if (location.state?.openSection === 'prescriptions') {
            resetDashboardPanels();
            setShowPrescriptions(true);
            fetchMyPrescriptionRequests();
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location, navigate]);

    const hasActivePanel = showPrescriptions || showNotifications || showRaiseQuery || showMyOrders || showMyVaccinations || showProfile;

    const getDashboardOrderAmount = (order) => {
        if (!order) return 0;
        if (order.totalPrice) return Number(order.totalPrice) || 0;
        if (order.total) return Number(String(order.total).replace(/[^\d]/g, '')) || 0;
        if (Array.isArray(order.items)) {
            return order.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
        }
        return 0;
    };

    const formatDashboardOrderDate = (value) => {
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
        if (!value) return today;
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return today;
        return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    };

    const formatUsd = (value) => {
        const amount = Number(value) || 0;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const dashboardOrders = (userOrders || [])
        .filter((order) => order.status === 'Booked')
        .map((order) => ({
            ...order,
            id: order.orderId,
            date: order.date || order.createdAt || 'N/A',
            totalAmount: getDashboardOrderAmount(order),
            payment: order.payment || 'N/A',
        }));

    const toggleDashboardOrderItems = (orderId) => {
        setExpandedDashboardOrder((prev) => (prev === orderId ? null : orderId));
    };

    const sidebarItems = [
        { icon: Home,         text: "Dashboard",      onClick: () => { resetDashboardPanels(); setSidebarOpen(false); },                                                                     color: "text-cyan-600"   },
        { icon: Pill,         text: "My Prescriptions",onClick: () => { const n = !showPrescriptions;  resetDashboardPanels(); setShowPrescriptions(n); if (n) { fetchMyPrescriptionRequests(); } setSidebarOpen(false); },           color: "text-sky-600" },
        { icon: ShoppingBag,  text: "My Orders",       onClick: () => { const n = !showMyOrders;        resetDashboardPanels(); setShowMyOrders(n);        setSidebarOpen(false); },           color: "text-emerald-600" },
        { icon: Syringe,      text: "My Vaccinations", onClick: () => { const n = !showMyVaccinations;  resetDashboardPanels(); setShowMyVaccinations(n); if (!n) {} else { loadVaccinations(); } setSidebarOpen(false); },           color: "text-teal-600"   },
        { icon: UserCircle,   text: "Profile",         onClick: () => { const n = !showProfile;         resetDashboardPanels(); setShowProfile(n);         setSidebarOpen(false); },           color: "text-slate-600"},
        { icon: Bell,         text: "Notifications",   onClick: () => { const n = !showNotifications;   resetDashboardPanels(); setShowNotifications(n);   setSidebarOpen(false); },           color: "text-amber-500" },
        { icon: MessageSquare,text: "Raise a Query",   onClick: () => { const n = !showRaiseQuery;      resetDashboardPanels(); setShowRaiseQuery(n);      setSidebarOpen(false); },           color: "text-cyan-600"   },
    ];

    const statsCards = [
        {
            icon: Pill,
            label: "Prescriptions",
            value: prescriptionRequests.length,
            change: "Upload & manage prescriptions",
            color: "bg-gradient-to-br from-cyan-500 to-sky-600",
            onClick: () => { resetDashboardPanels(); setShowPrescriptions(true); fetchMyPrescriptionRequests(); }
        },
        {
            icon: ShoppingBag,
            label: "Orders",
            value: dashboardOrders.length,
            change: "Track medicine deliveries",
            color: "bg-gradient-to-br from-amber-400 to-orange-500",
            onClick: () => { resetDashboardPanels(); setShowMyOrders(true); }
        },
        {
            icon: Syringe,
            label: "Vaccinations",
            value: vaccinatedCount,
            change: "Review your immunization history",
            color: "bg-gradient-to-br from-emerald-400 to-teal-500",
            onClick: () => { resetDashboardPanels(); setShowMyVaccinations(true); loadVaccinations(); }
        },
    ];

    if (loading) {
        return (
            <Loader />
        );
    }

    return (
        <div className="min-h-screen bg-[#f7fbff]">
            {/* Mobile Header */}
            <div className="lg:hidden sticky top-0 z-30 bg-slate-950 border-b border-cyan-900/50 shadow-lg">
                <div className="flex items-center justify-between px-4 py-3.5">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                            MedVision
                        </h1>
                        <p className="text-xs text-cyan-300 font-medium">Patient Dashboard</p>
                    </div>
                    <button
                        className="p-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={22} />
                    </button>
                </div>
            </div>


            <div className="flex relative">
                {/* Sidebar */}
                <aside className={`fixed lg:sticky top-0 h-screen w-72 bg-slate-950 border-r border-cyan-900/40 shadow-xl transform transition-all duration-300 z-40
${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>

                    <div className="h-full flex flex-col">

                        {/* Sidebar Header - close button only on mobile */}
                        <div className="flex lg:hidden items-center justify-end px-4 pt-4">
                            <button
                                className="text-slate-400 hover:text-white p-2 rounded-lg transition-colors"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* User Profile Section */}
                        <div className="px-5 pt-4 pb-5 border-b border-white/10">
                            <div className="flex items-center space-x-3">
                                <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                        {profileImage ? (
                                            <img
                                                src={profileImage}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            userData?.name?.charAt(0) || 'U'
                                        )}
                                    </div>
                                    <label className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-cyan-700 transition border-2 border-slate-950">
                                        <Pencil size={11} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleProfileImageChange}
                                        />
                                    </label>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white truncate text-base">
                                        {userData?.name || 'Unknown User'}
                                    </p>
                                    <p className="text-xs text-cyan-300 font-medium mt-0.5">
                                        Patient Account
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                            {sidebarItems.map((item, index) => (
                                <button
                                    key={index}
                                    className="flex items-center w-full px-4 py-3 space-x-3 text-left rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all group"
                                    onClick={item.onClick}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 border border-white/10 group-hover:bg-white/20 transition`}>
                                        <item.icon className={`w-4 h-4 ${item.color}`} />
                                    </div>
                                    <span className="font-semibold text-slate-300 group-hover:text-white text-sm">
                                        {item.text}
                                    </span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
                        {/* Welcome Section */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-emerald-900 p-8 text-white shadow-2xl">
                            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
                            <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">Patient Dashboard</p>
                                    <h1 className="mt-2 text-3xl lg:text-4xl font-black leading-tight">
                                        Welcome back, {userData?.name?.split(' ')[0] || 'User'}!
                                    </h1>
                                    <p className="mt-2 text-cyan-100 text-base">
                                        Here's your health overview for today
                                    </p>
                                </div>

                                <div className="lg:min-w-[260px]">
                                    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm px-5 py-4 space-y-3">
                                        <div>
                                            <p className="text-xs text-cyan-200 uppercase tracking-widest">Today's Date</p>
                                            <p className="text-lg font-bold text-white mt-1">
                                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate('/')}
                                            className="w-full inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
                                        >
                                            <Home size={15} />
                                            Return to Home
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Dashboard Overview */}
                        {!hasActivePanel && <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {statsCards.map((stat, index) => (
                                <div
                                    key={index}
                                    onClick={stat.onClick}
                                    className="h-full bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                    data-prescription-card={stat.label === 'Prescriptions' ? 'true' : undefined}
                                >
                                    <div className="flex items-center justify-between mb-5">
                                        <div className={`${stat.color} p-3 rounded-2xl text-white shadow-md`}>
                                            <stat.icon size={22} />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em]">Overview</span>
                                    </div>
                                    <h3 className="text-slate-500 text-sm font-medium mb-1">
                                        {stat.label}
                                    </h3>
                                    <p className="text-3xl font-black text-slate-900 mb-2">
                                        {stat.value}
                                    </p>
                                    {stat.change && (
                                        <p className="text-sm text-slate-500 leading-5">{stat.change}</p>
                                    )}
                                </div>
                            ))}
                        </div>}

                        {!hasActivePanel && (
                            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
                                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700 p-8 text-white shadow-2xl">
                                    <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                                    <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
                                    <div className="relative z-10">
                                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">Dashboard Focus</p>
                                        <h2 className="mt-3 text-2xl lg:text-3xl font-bold leading-tight">
                                            Keep your medicines, orders, and support requests in one place.
                                        </h2>
                                        <p className="mt-4 max-w-2xl text-sm lg:text-base text-blue-100 leading-7">
                                            This dashboard is now built as a clean patient workspace. Open the panels you need from the left side and keep the rest of the screen distraction-free.
                                        </p>

                                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <button
                                                onClick={() => { resetDashboardPanels(); setShowMyOrders(true); }}
                                                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-left hover:bg-white/15 transition"
                                            >
                                                <ShoppingBag className="mb-3 text-orange-300" size={20} />
                                                <p className="font-semibold">Track Orders</p>
                                                <p className="mt-1 text-xs text-blue-100">See delivery status and items.</p>
                                            </button>
                                            <button
                                                onClick={() => { resetDashboardPanels(); setShowPrescriptions(true); }}
                                                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-left hover:bg-white/15 transition"
                                            >
                                                <Pill className="mb-3 text-violet-200" size={20} />
                                                <p className="font-semibold">Open Prescriptions</p>
                                                <p className="mt-1 text-xs text-blue-100">Review current medicines quickly.</p>
                                            </button>
                                            <button
                                                onClick={() => { resetDashboardPanels(); setShowRaiseQuery(true); }}
                                                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-left hover:bg-white/15 transition"
                                            >
                                                <MessageSquare className="mb-3 text-cyan-200" size={20} />
                                                <p className="font-semibold">Raise a Query</p>
                                                <p className="mt-1 text-xs text-blue-100">Contact pharmacy support directly.</p>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="rounded-3xl bg-white p-6 shadow-lg border border-slate-100">
                                        <div className="flex items-center justify-between mb-5">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Quick Snapshot</p>
                                                <h3 className="mt-2 text-xl font-bold text-gray-800">Today at a glance</h3>
                                            </div>
                                            <Activity className="text-cyan-500" size={22} />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-sky-900">Active Prescriptions</p>
                                                    <p className="text-xs text-sky-700">Medicines currently visible in your account</p>
                                                </div>
                                                <span className="text-2xl font-bold text-sky-900">{prescriptionRequests.length}</span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-900">Orders in history</p>
                                                    <p className="text-xs text-amber-700">Recent pharmacy purchases</p>
                                                </div>
                                                <span className="text-2xl font-bold text-amber-900">{dashboardOrders.length}</span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-emerald-900">Vaccination records</p>
                                                    <p className="text-xs text-emerald-700">Immunization entries available</p>
                                                </div>
                                                <span className="text-2xl font-bold text-emerald-900">{vaccinatedCount} / {vaccinationMaster.length}</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Prescriptions List */}
                        {showPrescriptions && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">My Prescriptions</h2>
                                        <p className="text-sm text-slate-500 mt-0.5">Approved prescriptions can be ordered directly.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setReuploadPrescriptionId(null);
                                            setIsPrescriptionDialogOpen(true);
                                        }}
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
                                    >
                                        <Pill size={15} />
                                        Upload New
                                    </button>
                                </div>

                                {prescriptionsLoading ? (
                                    <div className="text-center py-12 text-slate-500">Loading prescriptions...</div>
                                ) : prescriptionRequests.length > 0 ? (
                                    <div className="space-y-4">
                                        {prescriptionRequests.map((prescription) => (
                                            <div
                                                key={prescription._id}
                                                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-300"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                                <Pill className="text-purple-600" size={20} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-gray-800 text-lg">
                                                                    {prescription.fileName || 'Prescription Upload'}
                                                                </h3>
                                                                <p className="text-purple-600 font-medium">
                                                                    {getPrescriptionStatusText(prescription.status)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Clock className="text-gray-400" size={16} />
                                                                <span className="text-sm text-gray-600">
                                                                    {getPrescriptionStatusText(prescription.status)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Calendar className="text-gray-400" size={16} />
                                                                <span className="text-sm text-gray-600">
                                                                    Uploaded: {formatDashboardOrderDate(prescription.createdAt)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <User className="text-gray-400" size={16} />
                                                                <span className="text-sm text-gray-600">
                                                                    {prescription.reviewedAt
                                                                        ? `Reviewed: ${formatDashboardOrderDate(prescription.reviewedAt)}`
                                                                        : 'Review: In progress'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <FileText className="text-gray-400" size={16} />
                                                                <span className="text-sm text-gray-600">
                                                                    {Array.isArray(prescription.medicines) && prescription.medicines.length > 0
                                                                        ? `${prescription.medicines.length} medicine${prescription.medicines.length > 1 ? 's' : ''} added`
                                                                        : 'Medicines will appear after review'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {prescription.reviewNotes && (
                                                            <div className="mt-4 rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
                                                                Pharmacist notes: {prescription.reviewNotes}
                                                            </div>
                                                        )}

                                                        {String(prescription.status || '').toLowerCase() === 'rejected' && (
                                                            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
                                                                Your prescription is rejected. Reason can be less visibility of the prescription or missing required information. Can you re-upload it?
                                                            </div>
                                                        )}

                                                        {String(prescription.status || '').toLowerCase() === 'rejected' && (
                                                            <div className="mt-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setReuploadPrescriptionId(prescription._id);
                                                                        setIsPrescriptionDialogOpen(true);
                                                                    }}
                                                                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition"
                                                                >
                                                                    <FileText size={16} />
                                                                    Re-upload Prescription
                                                                </button>
                                                            </div>
                                                        )}

                                                        {isApprovedPrescription(prescription.status) && (
                                                            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                                                                Your Prescription is Approved. Stay in touch!!
                                                            </div>
                                                        )}

                                                        {Array.isArray(prescription.medicines) && prescription.medicines.length > 0 && (
                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                {prescription.medicines.map((medicine, idx) => (
                                                                    <span
                                                                        key={`${prescription._id}-${idx}`}
                                                                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                                                                    >
                                                                        {medicine.name} x{medicine.quantity || 1}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {isApprovedPrescription(prescription.status) && Array.isArray(prescription.medicines) && prescription.medicines.length > 0 && (
                                                            <div className="mt-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartPrescriptionOrder(prescription)}
                                                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                                                                >
                                                                    <ShoppingBag size={16} />
                                                                    Place Order From Prescription
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="ml-4 flex items-center space-x-2">
                                                        <span className={`w-3 h-3 rounded-full ${
                                                            isApprovedPrescription(prescription.status)
                                                                ? 'bg-green-500'
                                                                : prescription.status === 'pending'
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-red-500'
                                                        }`} />
                                                        <span className={`text-xs font-semibold capitalize ${
                                                            isApprovedPrescription(prescription.status)
                                                                ? 'text-green-800'
                                                                : prescription.status === 'pending'
                                                                    ? 'text-amber-800'
                                                                    : 'text-red-800'
                                                        }`}>
                                                            {isApprovedPrescription(prescription.status) ? 'Approved' : (prescription.status || 'pending')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Pill className="text-gray-300 mx-auto mb-4" size={48} />
                                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Prescriptions Yet</h3>
                                        <p className="text-gray-500 mb-6">Upload your first prescription to get started</p>
                                        <button
                                            onClick={() => {
                                                setReuploadPrescriptionId(null);
                                                setIsPrescriptionDialogOpen(true);
                                            }}
                                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
                                        >
                                            Upload Prescription
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notifications Settings */}
                        {showNotifications && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900">Notification Settings</h2>
                                    <Bell className="text-yellow-500" size={24} />
                                </div>

                                <div className="space-y-6">
                                    {notificationSettingsMessage && (
                                        <div className={`rounded-xl border px-4 py-3 text-sm ${notificationSettingsMessage.type === 'success'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-rose-200 bg-rose-50 text-rose-700'
                                            }`}>
                                            {notificationSettingsMessage.text}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <MessageSquare className="text-blue-600" size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">SMS Notifications</h3>
                                                <p className="text-sm text-gray-600">Receive delivery reminders and updates via SMS</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notifications.sms}
                                                onChange={(e) => handleNotificationToggle('sms', e.target.checked)}
                                                disabled={notificationSettingsLoading || notificationSettingsSaving}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <MailIcon className="text-green-600" size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">Email Notifications</h3>
                                                <p className="text-sm text-gray-600">Receive prescription updates and health reports via email</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notifications.email}
                                                onChange={(e) => handleNotificationToggle('email', e.target.checked)}
                                                disabled={notificationSettingsLoading || notificationSettingsSaving}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                        </label>
                                    </div>

                                    <div className="mt-6 p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                                        <h4 className="font-semibold text-cyan-900 mb-2">What you'll receive:</h4>
                                        <ul className="text-sm text-cyan-700 space-y-1">
                                            <li>• Prescription Refill Notifications</li>
                                        
                                            <li>• Health Reports</li>
                                            <li>• Important updates from your Healthcare Provider</li>
                                        </ul>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleNotificationSave}
                                            disabled={notificationSettingsLoading || notificationSettingsSaving}
                                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {notificationSettingsLoading
                                                ? 'Loading Preferences...'
                                                : notificationSettingsSaving
                                                    ? 'Saving...'
                                                    : 'Save Preferences'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Raise a Query Panel */}
                        {showRaiseQuery && (
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                                            <MessageSquare className="text-cyan-600" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Raise a Query</h2>
                                            <p className="text-sm text-gray-500">We typically respond within 24 hours.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setShowRaiseQuery(false); setQuerySubmitted(false); }} className="text-gray-400 hover:text-gray-600 transition">
                                        <X size={20} />
                                    </button>
                                </div>

                                {querySubmitted ? (
                                    <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
                                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <Activity className="text-emerald-600" size={36} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">Query Submitted!</h3>
                                        <p className="text-gray-500 text-sm max-w-sm">Our pharmacy support team will get back to you within 24 hours. Check your registered email for updates.</p>
                                        <button
                                            onClick={() => setQuerySubmitted(false)}
                                            className="mt-2 px-6 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition"
                                        >
                                            Raise Another Query
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleQuerySubmit} noValidate className="space-y-6">
                                        {/* Pre-filled patient info banner */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                <User className="text-slate-700" size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{userData?.name || 'Patient'}</p>
                                                <p className="text-slate-500 text-xs">{userData?.email || ''}</p>
                                            </div>
                                            <span className="ml-auto text-xs bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full font-medium">Logged In</span>
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Subject <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="subject"
                                                value={queryForm.subject}
                                                onChange={handleQueryChange}
                                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition bg-gray-50 ${
                                                    queryErrors.subject ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                                }`}
                                            >
                                                <option value="">Select a subject…</option>
                                                {querySubjects.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            {queryErrors.subject && <p className="text-red-500 text-xs mt-1">{queryErrors.subject}</p>}
                                        </div>

                                        {/* Message */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Your Message <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="message"
                                                value={queryForm.message}
                                                onChange={handleQueryChange}
                                                rows={5}
                                                placeholder="Describe your query or concern in detail…"
                                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition resize-none ${
                                                    queryErrors.message ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                                                }`}
                                            />
                                            <div className="flex justify-between mt-1">
                                                {queryErrors.message
                                                    ? <p className="text-red-500 text-xs">{queryErrors.message}</p>
                                                    : <span />}
                                                <p className="text-gray-400 text-xs">{queryForm.message.length} chars</p>
                                            </div>
                                        </div>

                                        {/* Quick help */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                            <p className="text-sm font-semibold text-amber-800 mb-2">💡 Quick Tips</p>
                                            <ul className="text-xs text-amber-700 space-y-1">
                                                <li>• For order issues, include your Order ID in the message.</li>
                                                <li>• For prescription help, mention the medicine name.</li>
                                                <li>• Urgent? Call 1800-000-0000 (Toll Free).</li>
                                            </ul>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 active:scale-[.98] transition flex items-center justify-center gap-2 text-sm shadow-md"
                                        >
                                            <MessageSquare size={16} /> Submit Query
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Profile Panel */}
                        {showProfile && (
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                            <UserCircle className="text-green-600" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
                                            <p className="text-sm text-gray-500">View and manage your personal information</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setShowProfile(false); setIsEditingProfile(false); setProfileErrors({}); }} className="text-gray-400 hover:text-gray-600 transition">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Profile Information Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                            {isEditingProfile ? (
                                                <>
                                                    <input name="firstName" value={profileForm.firstName} onChange={handleProfileChange} className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${profileErrors.firstName ? 'border-red-400' : 'border-gray-200'}`} placeholder="Enter first name" />
                                                    {profileErrors.firstName && <p className="text-red-500 text-xs mt-1">{profileErrors.firstName}</p>}
                                                </>
                                            ) : (
                                                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">{userData?.firstName || 'Not provided'}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                                            {isEditingProfile ? (
                                                <input name="middleName" value={profileForm.middleName} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter middle name (optional)" />
                                            ) : (
                                                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">{userData?.middleName || 'Not provided'}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                            {isEditingProfile ? (
                                                <>
                                                    <input name="lastName" value={profileForm.lastName} onChange={handleProfileChange} className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${profileErrors.lastName ? 'border-red-400' : 'border-gray-200'}`} placeholder="Enter last name" />
                                                    {profileErrors.lastName && <p className="text-red-500 text-xs mt-1">{profileErrors.lastName}</p>}
                                                </>
                                            ) : (
                                                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">{userData?.lastName || 'Not provided'}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                                            {isEditingProfile ? (
                                                <>
                                                    <input type="email" name="email" value={profileForm.email} onChange={handleProfileChange} className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${profileErrors.email ? 'border-red-400' : 'border-gray-200'}`} placeholder="Enter email address" />
                                                    {profileErrors.email && <p className="text-red-500 text-xs mt-1">{profileErrors.email}</p>}
                                                </>
                                            ) : (
                                                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">{userData?.email || 'Not provided'}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                                            {isEditingProfile ? (
                                                <>
                                                    <input name="mobile" value={profileForm.mobile} onChange={handleProfileChange} className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${profileErrors.mobile ? 'border-red-400' : 'border-gray-200'}`} placeholder="Enter mobile number" />
                                                    {profileErrors.mobile && <p className="text-red-500 text-xs mt-1">{profileErrors.mobile}</p>}
                                                </>
                                            ) : (
                                                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">{userData?.mobile || 'Not provided'}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                                            <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">
                                                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Address</label>
                                            {isEditingProfile ? (
                                                <textarea name="address" value={profileForm.address} onChange={handleProfileChange} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter shipping address" />
                                            ) : (
                                                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">{userData?.address || 'Not provided'}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                            {isEditingProfile ? (
                                                <input name="city" value={profileForm.city} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter city" />
                                            ) : (
                                                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">{userData?.city || 'Not provided'}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                            {isEditingProfile ? (
                                                <input name="state" value={profileForm.state} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter state" />
                                            ) : (
                                                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">{userData?.state || 'Not provided'}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                                            {isEditingProfile ? (
                                                <>
                                                    <input name="pincode" value={profileForm.pincode} onChange={handleProfileChange} className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${profileErrors.pincode ? 'border-red-400' : 'border-gray-200'}`} placeholder="Enter pincode" />
                                                    {profileErrors.pincode && <p className="text-red-500 text-xs mt-1">{profileErrors.pincode}</p>}
                                                </>
                                            ) : (
                                                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">{userData?.pincode || 'Not provided'}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Account Stats */}
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-green-800 mb-4">Account Summary</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-green-600">{prescriptionRequests.length}</p>
                                                <p className="text-sm text-green-700">Active Prescriptions</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-green-600">{dashboardOrders.length}</p>
                                                <p className="text-sm text-green-700">Total Orders</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-green-600">{vaccinatedCount} / {vaccinationMaster.length}</p>
                                                <p className="text-sm text-green-700">Vaccinations</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        {isEditingProfile ? (
                                            <>
                                                <button
                                                    onClick={handleProfileSave}
                                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition"
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={handleProfileCancel}
                                                    className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl hover:bg-gray-300 transition"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleProfileEdit}
                                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition"
                                                >
                                                    Edit Profile
                                                </button>
                                                <button
                                                    onClick={() => setShowProfile(false)}
                                                    className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl hover:bg-gray-300 transition"
                                                >
                                                    Close
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* My Orders Panel */}
                        {showMyOrders && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 text-white p-6 md:p-7 relative overflow-hidden">
                                    <div className="absolute -top-16 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
                                    <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-cyan-300/10 blur-2xl"></div>
                                    <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
                                        <div>
                                            <h2 className="text-2xl font-bold">My Orders</h2>
                                            <p className="text-blue-100 text-sm mt-1">Track your medicine orders with full status updates</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto">
                                            <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                                                <p className="text-[11px] uppercase tracking-wide text-blue-100">Total Orders</p>
                                                <p className="text-lg font-semibold flex items-center gap-1.5">
                                                    <ClipboardList className="w-4 h-4" />
                                                    {dashboardOrders.length}
                                                </p>
                                            </div>
                                            <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[150px] border border-white/20">
                                                <p className="text-[11px] uppercase tracking-wide text-blue-100">Total Spent</p>
                                                <p className="text-lg font-semibold flex items-center gap-1.5">
                                                    <DollarSign className="w-4 h-4" />
                                                    {formatUsd(dashboardOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowMyOrders(false)}
                                        className="absolute top-5 right-5 text-white/80 hover:text-white transition"
                                    >
                                        <X size={20} className="text-white/80 hover:text-white" />
                                    </button>
                                </div>

                                {dashboardOrders && dashboardOrders.length > 0 ? (
                                    <div className="space-y-4 p-6">
                                        {dashboardOrders.map((order, index) => (
                                            <div
                                                key={`${order.id}-${index}`}
                                                className="p-5 bg-white rounded-2xl shadow-sm border border-gray-200"
                                            >
                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-medium text-sky-700">
                                                                <Package className="w-3.5 h-3.5" />
                                                                Order #{order.id || 'N/A'}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                order.trackingStatus === 'Delivered' || order.trackingStatus === 'Picked Up'
                                                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                                                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                                                            }`}>
                                                                <Truck className="w-3.5 h-3.5" />
                                                                {order.trackingStatus || order.status}
                                                            </span>
                                                        </div>

                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-medium">Date:</span> {formatDashboardOrderDate(order.date)}
                                                        </p>
                                                        <p className="text-sm text-gray-700 inline-flex items-center gap-1.5">
                                                            <CreditCard className="w-4 h-4 text-gray-500" />
                                                            <span><span className="font-medium">Payment:</span> {order.payment || 'N/A'}</span>
                                                        </p>
                                                        <p className="text-lg font-bold text-gray-900">{formatUsd(order.totalAmount)}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <button
                                                            className="bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl shadow transition-colors"
                                                            onClick={() => navigate(`/tracking/${order.id}`)}
                                                        >
                                                            Track Order
                                                        </button>
                                                        <button
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-4 rounded-xl shadow transition-colors inline-flex items-center gap-1.5"
                                                            onClick={() => toggleDashboardOrderItems(order.id)}
                                                        >
                                                            {expandedDashboardOrder === order.id ? (
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

                                                {expandedDashboardOrder === order.id && (
                                                    <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                        <h3 className="font-semibold text-gray-800 mb-2">Order Items</h3>
                                                        <ul className="space-y-2 text-sm text-gray-700">
                                                            {order.items?.length > 0 ? (
                                                                order.items.map((item, idx) => (
                                                                    <li key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                                                                                <span>{item.name || 'Unnamed Item'}</span>
                                                                                <span className="text-gray-600">Qty {item.quantity || 1} • {formatUsd(item.price || 0)}</span>
                                                                    </li>
                                                                ))
                                                            ) : (
                                                                <li className="text-gray-500">No items available for this order.</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-6">
                                        <ShoppingBag className="text-gray-300 mx-auto mb-4" size={48} />
                                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Orders Yet</h3>
                                        <p className="text-gray-500 mb-6">Browse our pharmacy and place your first order</p>
                                        <button
                                            onClick={() => navigate('/onlinepharmacy')}
                                            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
                                        >
                                            Shop Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* My Vaccinations Panel */}
                        {showMyVaccinations && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                                            <Syringe className="text-teal-600" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">My Vaccinations</h2>
                                            <p className="text-sm text-gray-500">
                                                {vacLoading ? 'Loading…' : `${vaccinatedCount} of ${vaccinationMaster.length} vaccines recorded`}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowMyVaccinations(false)} className="text-gray-400 hover:text-gray-600 transition">
                                        <X size={20} />
                                    </button>
                                </div>

                                {vacLoading ? (
                                    <div className="flex justify-center py-12">
                                        <svg className="animate-spin h-7 w-7 text-teal-400" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                    </div>
                                ) : vaccinationMaster.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Syringe className="text-gray-300 mx-auto mb-3" size={40} />
                                        <p className="text-gray-500 text-sm">No vaccination data available.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                                                    <th className="p-3 text-left">Vaccine</th>
                                                    <th className="p-3 text-left">Status</th>
                                                    <th className="p-3 text-left">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vaccinationMaster.map((vaccine, idx) => {
                                                    const status = getVacStatus(vaccine._id);
                                                    const date   = getVacDate(vaccine._id);
                                                    const isSaving = !!vacSaving[vaccine._id];
                                                    const isVaccinated = status === 'vaccinated';
                                                    return (
                                                        <tr key={vaccine._id} className={`border-b last:border-none ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-teal-50/20`}>
                                                            <td className="p-3">
                                                                <p className="font-medium text-gray-800">{vaccine.name}</p>
                                                                <p className="text-xs text-gray-400">{vaccine.category}</p>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <select
                                                                        disabled={isSaving}
                                                                        value={status}
                                                                        onChange={e => handleVacStatusChange(vaccine._id, e.target.value)}
                                                                        className={`appearance-none pl-2 pr-6 py-1 rounded-full text-xs font-semibold border focus:outline-none cursor-pointer disabled:opacity-50 transition-colors
                                                                            ${isVaccinated ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}
                                                                    >
                                                                        <option value="not_vaccinated">Not Vaccinated</option>
                                                                        <option value="vaccinated">Vaccinated</option>
                                                                    </select>
                                                                    {isSaving && <svg className="animate-spin h-3.5 w-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                {isVaccinated ? (
                                                                    <div className="flex items-center gap-1.5 bg-gray-50 border px-2 py-1 rounded-lg w-fit">
                                                                        <Calendar size={13} className="text-gray-400 shrink-0" />
                                                                        <input
                                                                            type="date"
                                                                            disabled={isSaving}
                                                                            value={date}
                                                                            max={new Date().toISOString().substring(0, 10)}
                                                                            onChange={e => handleVacDateChange(vaccine._id, e.target.value)}
                                                                            className="bg-transparent outline-none text-xs text-gray-700 disabled:opacity-50"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-teal-500 text-xs">Stay protected — get vaccinated!</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        <p className="mt-4 text-xs text-gray-400">* Changes are saved automatically.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <PrescriptionDialog
                isOpen={isPrescriptionDialogOpen}
                onClose={() => {
                    setIsPrescriptionDialogOpen(false);
                    setReuploadPrescriptionId(null);
                }}
                onUploaded={fetchMyPrescriptionRequests}
                prescriptionRequestId={reuploadPrescriptionId}
            />

            {isRefillModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">Approved Prescription</p>
                                <h3 className="mt-1 text-xl font-bold">Adjust Quantity And Place Order</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRefillModalOpen(false)}
                                className="rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white"
                                disabled={placingPrescriptionOrder}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-slate-600">
                                Prescription: <span className="font-semibold text-slate-900">{refillDraft.prescriptionTitle}</span>
                            </p>

                            <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
                                {refillDraft.items.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-slate-900">{item.name}</p>
                                                <p className="mt-1 text-xs text-slate-500">{item.dosage} {item.price > 0 ? `• Rs ${item.price}` : ''}</p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeRefillItem(item.id)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                            >
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </div>

                                        <div className="mt-3 inline-flex items-center rounded-xl border border-slate-200 bg-white p-1">
                                            <button
                                                type="button"
                                                onClick={() => updateRefillQuantity(item.id, 'decrease')}
                                                className="rounded-lg p-2 hover:bg-slate-100"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="min-w-10 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateRefillQuantity(item.id, 'increase')}
                                                className="rounded-lg p-2 hover:bg-slate-100"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {refillDraft.items.length === 0 && (
                                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    All medicines removed. Add at least one medicine to proceed.
                                </div>
                            )}

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsRefillModalOpen(false)}
                                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    disabled={placingPrescriptionOrder}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePlacePrescriptionOrder}
                                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={placingPrescriptionOrder || refillDraft.items.length === 0}
                                >
                                    {placingPrescriptionOrder ? 'Preparing Checkout...' : 'Proceed To Place Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

