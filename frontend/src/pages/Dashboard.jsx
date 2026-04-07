import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Activity, Calendar, Pill, FileText, Clock, User, Mail, Phone, Menu, X, Home, CircleUser as UserCircle, ShoppingBag, Syringe, Bell, MessageSquare, Mail as MailIcon, Pencil, ClipboardList, DollarSign, Package, Truck, ChevronDown, ChevronUp, CreditCard, Plus, Minus, Trash2, CheckCircle2, Star, AlertTriangle, Info, Download } from 'lucide-react';
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
    const [showHealthManagement, setShowHealthManagement] = useState(false);
    const [vaccinationMaster, setVaccinationMaster] = useState([]);
    const [userVaccinationMap, setUserVaccinationMap] = useState({});
    const [vacSaving, setVacSaving] = useState({});
    const [vacLoading, setVacLoading] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '', role: 'Patient' });
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState('');
    const [myReviews, setMyReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [storesForReviews, setStoresForReviews] = useState([]);
    const [storesForReviewsLoading, setStoresForReviewsLoading] = useState(false);
    const [selectedReviewStoreId, setSelectedReviewStoreId] = useState('');
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewNoticeModal, setReviewNoticeModal] = useState({
        isOpen: false,
        title: '',
        message: '',
    });
    const [reviewDeleteModal, setReviewDeleteModal] = useState({
        isOpen: false,
        reviewId: null,
    });
    const [reviewDeleteLoading, setReviewDeleteLoading] = useState(false);
    const [prescriptionRequests, setPrescriptionRequests] = useState([]);
    const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
    const [expandedDashboardOrder, setExpandedDashboardOrder] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isProfileSaving, setIsProfileSaving] = useState(false);
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
    const [queryForm, setQueryForm] = useState({ subject: '', message: '', storeId: '' });
    const [queryErrors, setQueryErrors] = useState({});
    const [showQueryForm, setShowQueryForm] = useState(false);
    const [querySubmitting, setQuerySubmitting] = useState(false);
    const [userQueries, setUserQueries] = useState([]);
    const [queriesLoading, setQueriesLoading] = useState(false);
    const [notifications, setNotifications] = useState({
        sms: true,
        email: true,
    });
    const [notificationSettingsLoading, setNotificationSettingsLoading] = useState(true);
    const [notificationSettingsSaving, setNotificationSettingsSaving] = useState(false);
    const [pendingNotificationChange, setPendingNotificationChange] = useState(null);
    const [notificationToggleSuccess, setNotificationToggleSuccess] = useState(false);

    // Extended notification prefs (push/email/sms categories) — API-backed, user-scoped
    const NOTIF_PREF_CACHE_PREFIX = 'medVisionNotifPrefs_';
    const defaultNotifPrefs = {
        push:  { orderUpdates: true,  prescriptionReminders: true,  offerAlerts: false, healthReminders: true  },
        email: { orderUpdates: true,  prescriptionReminders: false, offerAlerts: false, healthReminders: false },
        sms:   { orderUpdates: false, prescriptionReminders: false, offerAlerts: false, healthReminders: false },
    };
    const [notifPrefs, setNotifPrefs] = useState(defaultNotifPrefs);
    const [notifChannel, setNotifChannel] = useState('push');
    const [notifPrefsSaved, setNotifPrefsSaved] = useState(false);
    const [notifPrefsSaving, setNotifPrefsSaving] = useState(false);

    const setNotifCategoryPref = (channel, category, value) => {
        setNotifPrefs((prev) => ({ ...prev, [channel]: { ...prev[channel], [category]: value } }));
        setNotifPrefsSaved(false);
    };

    const saveNotifPrefs = async () => {
        const token = localStorage.getItem('medVisionToken');
        if (!token) return;
        setNotifPrefsSaving(true);
        try {
            const response = await axios.put(`${baseURL}/user-notifications`, {
                pushPrefs:  notifPrefs.push,
                emailPrefs: notifPrefs.email,
                smsPrefs:   notifPrefs.sms,
            }, { headers: { Authorization: `Bearer ${token}` } });

            const p = response.data.notificationPreferences;
            const merged = {
                push:  { ...defaultNotifPrefs.push,  ...(p?.pushPrefs  || {}) },
                email: { ...defaultNotifPrefs.email, ...(p?.emailPrefs || {}) },
                sms:   { ...defaultNotifPrefs.sms,   ...(p?.smsPrefs   || {}) },
            };
            setNotifPrefs(merged);
            // Cache keyed by userId so multiple users on the same browser don't share prefs
            if (p?.userId) localStorage.setItem(`${NOTIF_PREF_CACHE_PREFIX}${p.userId}`, JSON.stringify(merged));
            setNotifPrefsSaved(true);
            window.setTimeout(() => setNotifPrefsSaved(false), 2500);
        } catch (err) {
            console.error('Error saving notification prefs:', err.message);
        } finally {
            setNotifPrefsSaving(false);
        }
    };
    const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
    const [placingPrescriptionOrder, setPlacingPrescriptionOrder] = useState(false);
    const [healthTrackers, setHealthTrackers] = useState([]);
    const [expiryReminders, setExpiryReminders] = useState([]);
    const [medicalTimeline, setMedicalTimeline] = useState([]);
    const [healthLoading, setHealthLoading] = useState(false);
    const [healthExporting, setHealthExporting] = useState(false);
    const [healthActionMessage, setHealthActionMessage] = useState('');
    const [healthActionType, setHealthActionType] = useState('success');
    const [showAddTrackerForm, setShowAddTrackerForm] = useState(false);
    const [newTracker, setNewTracker] = useState({
        medicineName: '',
        dosage: '',
        frequency: '',
        startDate: '',
        expiryDate: '',
    });
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

    const getReviewStoreId = (review) => {
        if (!review) return '';
        if (typeof review.storeId === 'object' && review.storeId?._id) return String(review.storeId._id);
        if (review.storeId) return String(review.storeId);
        return '';
    };

    const getReviewStoreName = (review) => {
        if (!review) return 'Store';
        if (review.storeName) return review.storeName;
        if (typeof review.storeId === 'object') {
            return review.storeId.storeName || review.storeId.name || 'Store';
        }

        const matchedStore = storesForReviews.find((store) => String(store._id) === String(review.storeId));
        return matchedStore?.storeName || matchedStore?.name || 'Store';
    };

    const openReviewNoticeModal = (title, message) => {
        setReviewNoticeModal({
            isOpen: true,
            title,
            message,
        });
    };

    const closeReviewNoticeModal = () => {
        setReviewNoticeModal({
            isOpen: false,
            title: '',
            message: '',
        });
    };

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
                const vaccinationMasterId = r?.vaccinationId?._id || r?.vaccinationMasterId?._id || r?.vaccinationMasterId;
                if (!vaccinationMasterId) return;
                map[vaccinationMasterId] = {
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

    const fetchMyReviews = async () => {
        const token = localStorage.getItem('medVisionToken');
        if (!token) return;
        try {
            setReviewsLoading(true);
            const res = await axios.get(`${baseURL}/reviews/me`, { headers: { Authorization: `Bearer ${token}` } });
            setMyReviews(res.data.reviews || []);
        } catch { setMyReviews([]); } finally { setReviewsLoading(false); }
    };

    const fetchStoresForReviews = async () => {
        try {
            setStoresForReviewsLoading(true);
            const response = await axios.get(`${baseURL}/allstores`);
            const stores = response?.data?.stores || [];
            setStoresForReviews(stores);

            if (!selectedReviewStoreId && stores.length > 0) {
                setSelectedReviewStoreId(stores[0]._id);
            }
        } catch {
            setStoresForReviews([]);
        } finally {
            setStoresForReviewsLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedReviewStoreId) {
            setEditingReviewId(null);
            setFeedbackForm({ rating: 5, comment: '', role: 'Patient' });
            return;
        }

        const existingReview = myReviews.find((review) => getReviewStoreId(review) === String(selectedReviewStoreId));
        if (existingReview) {
            setEditingReviewId(existingReview._id);
            setFeedbackForm({
                rating: existingReview.rating || 5,
                comment: existingReview.comment || '',
                role: existingReview.role || 'Patient',
            });
            return;
        }

        setEditingReviewId(null);
        setFeedbackForm({ rating: 5, comment: '', role: 'Patient' });
    }, [selectedReviewStoreId, myReviews]);

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('medVisionToken');
        if (!token) return;
        if (!feedbackForm.comment.trim() || feedbackForm.comment.trim().length < 10) {
            openReviewNoticeModal('Review Too Short', 'Please write at least 10 characters in your review.');
            return;
        }
        try {
            setFeedbackSubmitting(true);
            if (!selectedReviewStoreId) {
                openReviewNoticeModal('Store Required', 'Please select a store before submitting your review.');
                return;
            }

            const payload = {
                ...feedbackForm,
                storeId: selectedReviewStoreId,
            };

            if (editingReviewId) {
                await axios.put(`${baseURL}/reviews/${editingReviewId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
                setFeedbackSuccessMessage('Your review was updated successfully.');
            } else {
                await axios.post(`${baseURL}/reviews`, payload, { headers: { Authorization: `Bearer ${token}` } });
                setFeedbackSuccessMessage('Your review was submitted successfully.');
            }

            await fetchMyReviews();
            setShowReviewForm(false);
        } catch (err) {
            const errorMessage = err?.response?.data?.message || 'Failed to submit review. Please try again.';
            if (/active stores|inactive/i.test(errorMessage)) {
                openReviewNoticeModal('Store Is Inactive', 'This store is currently inactive and cannot receive reviews. Please choose an active store.');
            } else {
                openReviewNoticeModal('Unable To Submit Review', errorMessage);
            }
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const handleReviewEdit = (review) => {
        const normalizedStoreId = getReviewStoreId(review);
        setSelectedReviewStoreId(normalizedStoreId);
        setEditingReviewId(review._id);
        setShowReviewForm(true);
        setFeedbackForm({
            rating: review.rating || 5,
            comment: review.comment || '',
            role: review.role || 'Patient',
        });
        setFeedbackSuccessMessage('');
    };

    const handleReviewDelete = (reviewId) => {
        setReviewDeleteModal({
            isOpen: true,
            reviewId,
        });
    };

    const closeReviewDeleteModal = () => {
        if (reviewDeleteLoading) return;
        setReviewDeleteModal({
            isOpen: false,
            reviewId: null,
        });
    };

    const confirmReviewDelete = async () => {
        const token = localStorage.getItem('medVisionToken');
        if (!token || !reviewDeleteModal.reviewId) return;

        try {
            setReviewDeleteLoading(true);
            await axios.delete(`${baseURL}/reviews/${reviewDeleteModal.reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
            setFeedbackSuccessMessage('Review deleted successfully.');
            closeReviewDeleteModal();
            await fetchMyReviews();
        } catch (error) {
            closeReviewDeleteModal();
            openReviewNoticeModal('Delete Failed', error?.response?.data?.message || 'Failed to delete review. Please try again.');
        } finally {
            setReviewDeleteLoading(false);
        }
    };

    const fetchMyQueries = async () => {
        const token = localStorage.getItem('medVisionToken');
        if (!token) return;

        try {
            setQueriesLoading(true);
            const response = await axios.get(`${baseURL}/queries`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUserQueries(response.data.queries || []);
        } catch (error) {
            console.error('Error fetching user queries:', error.message);
            setUserQueries([]);
        } finally {
            setQueriesLoading(false);
        }
    };

    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!queryForm.subject) errs.subject = 'Please select a subject.';
        if (!queryForm.storeId) errs.storeId = 'Please select a store.';
        if (queryForm.message.trim().length < 20) errs.message = 'Minimum 20 characters required.';
        if (Object.keys(errs).length > 0) { setQueryErrors(errs); return; }

        const token = localStorage.getItem('medVisionToken');
        if (!token) {
            alert('Please login again to submit your query.');
            return;
        }

        try {
            setQuerySubmitting(true);
            const response = await axios.post(`${baseURL}/queries`, {
                subject: queryForm.subject,
                message: queryForm.message.trim(),
                storeId: queryForm.storeId,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const savedQuery = response.data?.query;
            if (savedQuery) {
                setUserQueries((prev) => [savedQuery, ...prev]);
            }
            await fetchMyQueries();
            setShowQueryForm(false);
            setQueryForm({ subject: '', message: '', storeId: '' });
        } catch (error) {
            console.error('Error submitting query:', error.message);
            alert(error.response?.data?.message || 'Could not submit query right now. Please try again.');
        } finally {
            setQuerySubmitting(false);
        }
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

    const handleProfileSave = async () => {
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

        const token = localStorage.getItem('medVisionToken');

        if (!token) {
            alert('Please login again to update profile.');
            return;
        }

        try {
            setIsProfileSaving(true);
            const response = await axios.post(
                `${baseURL}/patientprofile`,
                {
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
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const updatedUser = response.data?.user;
            if (updatedUser) {
                setUserData(updatedUser);
                localStorage.setItem('userData', JSON.stringify(updatedUser));
            }
            setProfileErrors({});
            setIsEditingProfile(false);
        } catch (error) {
            console.error('Error saving profile:', error.message);
            alert(error.response?.data?.message || 'Unable to save profile. Please try again.');
        } finally {
            setIsProfileSaving(false);
        }
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
                headers: { Authorization: `Bearer ${token}` },
            });

            const p = response.data.notificationPreferences;

            // Seed master SMS / Email toggles (existing behaviour)
            setNotifications({
                sms:   p?.isSmsNotificationOn   ?? true,
                email: p?.isEmailNotificationOn ?? true,
            });

            // Seed category prefs from DB, falling back to user-scoped cache, then defaults
            const userId = p?.userId;
            let cached = null;
            if (userId) {
                try { cached = JSON.parse(localStorage.getItem(`medVisionNotifPrefs_${userId}`) || 'null'); } catch { /* ignore */ }
            }
            const merged = {
                push:  { ...defaultNotifPrefs.push,  ...(p?.pushPrefs  || cached?.push  || {}) },
                email: { ...defaultNotifPrefs.email, ...(p?.emailPrefs || cached?.email || {}) },
                sms:   { ...defaultNotifPrefs.sms,   ...(p?.smsPrefs   || cached?.sms   || {}) },
            };
            setNotifPrefs(merged);
        } catch (error) {
            console.error('Error fetching notification settings:', error.message);
        } finally {
            setNotificationSettingsLoading(false);
        }
    };

    const openNotificationToggleDialog = (key, value, applyAll = false) => {
        if (notificationSettingsLoading || notificationSettingsSaving) return;

        const label = key === 'sms' ? 'SMS' : key === 'push' ? 'Push' : 'Email';
        setPendingNotificationChange({
            key,
            value,
            label,
            applyAll,
        });
    };

    const closeNotificationToggleDialog = () => {
        setNotificationToggleSuccess(false);
        setPendingNotificationChange(null);
    };

    const confirmNotificationToggle = async () => {
        if (!pendingNotificationChange) return;

        const { key, value, applyAll } = pendingNotificationChange;
        const token = localStorage.getItem('medVisionToken');

        if (!token) {
            alert('Please log in again to update notification settings.');
            closeNotificationToggleDialog();
            return;
        }

        try {
            setNotificationSettingsSaving(true);
            const payload = {
                isSmsNotificationOn: key === 'sms' ? value : notifications.sms,
                isEmailNotificationOn: key === 'email' ? value : notifications.email,
            };

            if (applyAll && key === 'email') {
                payload.emailPrefs = {
                    orderUpdates: value,
                    prescriptionReminders: value,
                    offerAlerts: value,
                    healthReminders: value,
                };
            }

            if (applyAll && key === 'sms') {
                payload.smsPrefs = {
                    orderUpdates: value,
                    prescriptionReminders: value,
                    offerAlerts: value,
                    healthReminders: value,
                };
            }

            if (applyAll && key === 'push') {
                payload.pushPrefs = {
                    orderUpdates: value,
                    prescriptionReminders: value,
                    offerAlerts: value,
                    healthReminders: value,
                };
            }

            const response = await axios.put(`${baseURL}/user-notifications`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const preferences = response.data.notificationPreferences;
            setNotifications({
                sms: preferences?.isSmsNotificationOn ?? notifications.sms,
                email: preferences?.isEmailNotificationOn ?? notifications.email,
            });

            // Keep category UI in sync after confirming top-level channel toggle.
            setNotifPrefs((prev) => ({
                push: {
                    ...defaultNotifPrefs.push,
                    ...(preferences?.pushPrefs || prev.push),
                },
                email: {
                    ...defaultNotifPrefs.email,
                    ...(preferences?.emailPrefs || prev.email),
                },
                sms: {
                    ...defaultNotifPrefs.sms,
                    ...(preferences?.smsPrefs || prev.sms),
                },
            }));
            setNotificationToggleSuccess(true);
            window.setTimeout(() => {
                closeNotificationToggleDialog();
            }, 850);
        } catch (error) {
            console.error('Error saving notification settings:', error.message);
            alert('Failed to update notification settings. Please try again.');
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

    const loadHealthManagementData = async () => {
        const token = localStorage.getItem('medVisionToken');
        if (!token) return;

        try {
            setHealthLoading(true);
            const [trackersRes, timelineRes] = await Promise.all([
                axios.get(`${baseURL}/health/trackers`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${baseURL}/health/timeline`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setHealthTrackers(trackersRes.data.trackers || []);
            setExpiryReminders(trackersRes.data.expiryReminders || []);
            setMedicalTimeline(timelineRes.data.events || []);
        } catch (error) {
            console.error('Error loading health data:', error.message);
            setHealthTrackers([]);
            setExpiryReminders([]);
            setMedicalTimeline([]);
        } finally {
            setHealthLoading(false);
        }
    };

    const handleAddTracker = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('medVisionToken');
        if (!token) return;

        if (!newTracker.medicineName || !newTracker.dosage || !newTracker.frequency || !newTracker.startDate) {
            setHealthActionType('error');
            setHealthActionMessage('Please fill medicine name, dosage, frequency, and start date.');
            return;
        }

        try {
            await axios.post(`${baseURL}/health/trackers`, newTracker, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNewTracker({ medicineName: '', dosage: '', frequency: '', startDate: '', expiryDate: '' });
            setShowAddTrackerForm(false);
            setHealthActionType('success');
            setHealthActionMessage('Dosage tracker saved successfully.');
            loadHealthManagementData();
        } catch (error) {
            console.error('Error creating tracker:', error.message);
            setHealthActionType('error');
            setHealthActionMessage('Failed to create tracker. Please try again.');
        }
    };

    const handleLogIntake = async (trackerId) => {
        const token = localStorage.getItem('medVisionToken');
        if (!token) return;

        try {
            await axios.patch(`${baseURL}/health/trackers/${trackerId}/intake`, {
                takenAt: new Date().toISOString(),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setHealthActionType('success');
            setHealthActionMessage('Intake logged successfully. Great job staying on schedule.');
            loadHealthManagementData();
        } catch (error) {
            console.error('Error logging intake:', error.message);
            setHealthActionType('error');
            setHealthActionMessage('Failed to log intake. Please try again.');
        }
    };

    const handleExportHealthRecords = async () => {
        const token = localStorage.getItem('medVisionToken');
        if (!token) return;

        try {
            setHealthExporting(true);
            const response = await axios.get(`${baseURL}/health/export/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `health-records-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting health records:', error.message);
            alert('Failed to export health records. Please try again.');
        } finally {
            setHealthExporting(false);
        }
    };

    useEffect(() => {
        fetchDataFromApi();
        fetchMyOrders();
        fetchNotificationPreferences();
        fetchMyPrescriptionRequests();
        fetchMyQueries();
        loadVaccinations();
        loadHealthManagementData();
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
        setShowQueryForm(false);
        setShowMyOrders(false);
        setShowMyVaccinations(false);
        setShowHealthManagement(false);
        setShowProfile(false);
        setShowFeedback(false);
        setShowReviewForm(false);
        setShowAddTrackerForm(false);
        setFeedbackSuccessMessage('');
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
        if (location.state?.openSection === 'notifications') {
            resetDashboardPanels();
            setShowNotifications(true);
            fetchNotificationPreferences();
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location, navigate]);

    const hasActivePanel = showPrescriptions || showNotifications || showRaiseQuery || showMyOrders || showMyVaccinations || showHealthManagement || showProfile || showFeedback;
    const reviewedStoreIds = new Set(myReviews.map((review) => getReviewStoreId(review)).filter(Boolean));
    const availableStoresForNewReview = storesForReviews.filter((store) => !reviewedStoreIds.has(String(store._id)));

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

    const WHATSAPP_SUPPORT_NUMBER = '918758770402';
    const openWhatsAppOrderChat = (order) => {
        if (!order) return;
        const orderId = order.id || 'N/A';
        const status = order.trackingStatus || order.status || 'Order Placed';
        const orderDate = formatDashboardOrderDate(order.date);

        const message = `Hello MedVision, I want a tracking update for Order #${orderId}. Current status shown: ${status}. Order date: ${orderDate}.`;

        const waUrl = `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
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
        { icon: Home,        text: "Dashboard",       isActive: !showPrescriptions && !showMyOrders && !showMyVaccinations && !showProfile && !showNotifications && !showFeedback && !showRaiseQuery, iconBg: "bg-cyan-500/20",    color: "text-cyan-400",    onClick: () => { resetDashboardPanels(); setSidebarOpen(false); } },
        { icon: Pill,        text: "My Prescriptions", isActive: showPrescriptions,   iconBg: "bg-sky-500/20",     color: "text-sky-400",     onClick: () => { const n = !showPrescriptions;  resetDashboardPanels(); setShowPrescriptions(n); if (n) { fetchMyPrescriptionRequests(); } setSidebarOpen(false); } },
        { icon: ShoppingBag, text: "My Orders",        isActive: showMyOrders,        iconBg: "bg-emerald-500/20", color: "text-emerald-400", onClick: () => { const n = !showMyOrders;        resetDashboardPanels(); setShowMyOrders(n);        setSidebarOpen(false); } },
        { icon: Syringe,     text: "My Vaccinations",  isActive: showMyVaccinations,  iconBg: "bg-teal-500/20",    color: "text-teal-400",    onClick: () => { const n = !showMyVaccinations;  resetDashboardPanels(); setShowMyVaccinations(n); if (n) { loadVaccinations(); } setSidebarOpen(false); } },
        { icon: Activity,    text: "Health Management", isActive: showHealthManagement, iconBg: "bg-indigo-500/20", color: "text-indigo-400", onClick: () => { const n = !showHealthManagement; resetDashboardPanels(); setShowHealthManagement(n); if (n) { loadHealthManagementData(); } setSidebarOpen(false); } },
        { icon: UserCircle,  text: "Profile",          isActive: showProfile,         iconBg: "bg-slate-500/20",   color: "text-slate-300",   onClick: () => { const n = !showProfile;        resetDashboardPanels(); setShowProfile(n);         setSidebarOpen(false); } },
        { icon: Bell,        text: "Notifications",    isActive: showNotifications,   iconBg: "bg-amber-500/20",   color: "text-amber-400",   onClick: () => { const n = !showNotifications;   resetDashboardPanels(); setShowNotifications(n); if (!showNotifications) fetchNotificationPreferences();   setSidebarOpen(false); } },
        {
            icon: Star,
            text: "Feedback",
            isActive: showFeedback,
            iconBg: "bg-yellow-500/20",
            color: "text-yellow-400",
            onClick: () => {
                const n = !showFeedback;
                resetDashboardPanels();
                setShowFeedback(n);
                if (n) {
                    setShowReviewForm(false);
                    fetchStoresForReviews();
                    fetchMyReviews();
                }
                setSidebarOpen(false);
            },
        },
        {
            icon: MessageSquare,
            text: "Raise a Query",
            isActive: showRaiseQuery,
            iconBg: "bg-purple-500/20",
            color: "text-purple-400",
            badgeCount: userQueries.filter(q => (q.status || "").toLowerCase() === "open").length,
            onClick: () => {
                const n = !showRaiseQuery;
                resetDashboardPanels();
                setShowRaiseQuery(n);
                setShowQueryForm(false);
                if (n) {
                    fetchMyQueries();
                    fetchStoresForReviews();
                }
                setSidebarOpen(false);
            },
        },
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
                <aside className={`fixed lg:sticky top-0 h-screen w-72 flex flex-col bg-gradient-to-b from-[#0c1424] via-slate-950 to-[#080e18] shadow-2xl transform transition-all duration-300 z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>

                    {/* Top accent bar */}
                    <div className="h-0.5 w-full bg-gradient-to-r from-cyan-400 via-teal-500 to-transparent flex-shrink-0" />

                    {/* Mobile close */}
                    <div className="flex lg:hidden items-center justify-end px-4 pt-3 flex-shrink-0">
                        <button className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Profile Card */}
                    <div className="mx-3 mt-4 mb-1 flex-shrink-0 rounded-2xl bg-white/5 border border-white/[0.08] p-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-cyan-400/30">
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        userData?.name?.charAt(0)?.toUpperCase() || 'U'
                                    )}
                                </div>
                                <label className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow cursor-pointer hover:bg-cyan-400 transition border-2 border-slate-950">
                                    <Pencil size={9} />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                                </label>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate text-sm">{userData?.name || 'Unknown User'}</p>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{userData?.email || ''}</p>
                                <span className="inline-flex items-center gap-1 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                                    <span className="text-[10px] font-semibold text-emerald-400">Active</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-2">
                        {[{ label: 'Navigation', items: sidebarItems.slice(0, 4) }, { label: 'Account', items: sidebarItems.slice(4, 6) }, { label: 'Support', items: sidebarItems.slice(6) }].map((group) => (
                            <React.Fragment key={group.label}>
                                <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase select-none">{group.label}</p>
                                {group.items.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={item.onClick}
                                        className={`flex items-center w-full gap-3 py-2.5 pr-3 mb-0.5 text-left rounded-xl transition-all duration-150 group border-l-2 ${
                                            item.isActive
                                                ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent pl-[10px]'
                                                : 'border-transparent hover:bg-white/[0.07] pl-3'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${item.iconBg}`}>
                                            <item.icon className={`w-[15px] h-[15px] ${item.color}`} />
                                        </div>
                                        <span className={`font-medium text-sm truncate flex-1 transition-colors ${
                                            item.isActive ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-white'
                                        }`}>
                                            {item.text}
                                        </span>
                                        {item.badgeCount > 0 && (
                                            <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-cyan-500 text-white text-[10px] font-bold shadow">
                                                {item.badgeCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </React.Fragment>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="flex-shrink-0 px-3 pb-4 pt-3 border-t border-white/[0.07]">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center w-full gap-3 pl-3 pr-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all text-sm font-medium group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-white/[0.07] flex items-center justify-center group-hover:bg-white/[0.12] transition flex-shrink-0">
                                <Home size={15} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                            </div>
                            Back to Home
                        </button>
                        <div className="flex items-center justify-center gap-2 pt-3">
                            <div className="h-px flex-1 bg-white/[0.06]" />
                            <span className="text-[10px] text-slate-600 font-semibold tracking-widest uppercase">MedVision</span>
                            <div className="h-px flex-1 bg-white/[0.06]" />
                        </div>
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
                        {/* Welcome Hero */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1628] via-[#0e2240] to-[#083028] p-7 lg:p-10 text-white shadow-2xl">
                            {/* Decorative glows */}
                            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
                            <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
                            <div className="absolute right-1/3 top-0 h-40 w-40 rounded-full bg-teal-300/10 blur-2xl pointer-events-none" />
                            {/* Grid texture */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '40px 40px'}} />

                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                                {/* Left: greeting */}
                                <div className="flex items-start gap-5">
                                    <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-teal-600/30 border border-cyan-400/30 text-2xl font-black text-white shadow-lg backdrop-blur-sm ring-2 ring-white/10">
                                        {(userData?.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 border border-emerald-400/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-emerald-300 mb-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                                            </span>
                                            Patient Dashboard
                                        </span>
                                        <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                                            {(() => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; })()},{' '}
                                            <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">{userData?.name?.split(' ')[0] || 'User'}!</span>
                                        </h1>
                                        <p className="mt-2 text-slate-400 text-sm lg:text-base leading-relaxed max-w-lg">
                                            Here's your personal health overview. Manage prescriptions, orders, vaccinations and more — all in one place.
                                        </p>
                                    </div>
                                </div>

                                {/* Right: date card */}
                                <div className="lg:min-w-[220px] flex-shrink-0">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-sm px-5 py-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400 mb-1.5">Today</p>
                                        <p className="text-xl font-extrabold text-white leading-tight">
                                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">{new Date().getFullYear()}</p>
                                        <div className="mt-3 pt-3 border-t border-white/10 text-lg font-bold tabular-nums text-cyan-300">
                                            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        {!hasActivePanel && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                {statsCards.map((stat, index) => (
                                    <div
                                        key={index}
                                        onClick={stat.onClick}
                                        className="group relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer p-6"
                                    >
                                        {/* corner glow */}
                                        <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition ${stat.color}`} />
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center shadow-md`}>
                                                    <stat.icon size={20} className="text-white" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Overview</span>
                                            </div>
                                            <p className="text-4xl font-black text-slate-900 mb-1">{stat.value}</p>
                                            <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
                                            {stat.change && <p className="text-xs text-slate-400 mt-1">{stat.change}</p>}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Feature Cards + Quick Snapshot */}
                        {!hasActivePanel && (
                            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
                                {/* Feature CTA card */}
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1e3c] via-[#0d2a38] to-[#083020] p-7 lg:p-8 text-white shadow-xl">
                                    <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-2xl" />
                                    <div className="absolute bottom-0 left-1/2 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
                                    <div className="relative z-10">
                                        <span className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400 mb-3">Quick Access</span>
                                        <h2 className="text-2xl lg:text-[1.7rem] font-bold leading-tight mb-3">
                                            Everything your health needs,<br />
                                            <span className="text-cyan-300">at your fingertips.</span>
                                        </h2>
                                        <p className="text-sm text-slate-400 leading-relaxed mb-7 max-w-md">
                                            Open the panels you need from the left sidebar. Your prescriptions, orders, and support are always a click away.
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { icon: ShoppingBag, label: 'Track Orders', sub: 'Delivery status & items', color: 'text-orange-300', bg: 'bg-orange-400/10 border-orange-400/20', onClick: () => { resetDashboardPanels(); setShowMyOrders(true); } },
                                                { icon: Pill, label: 'Prescriptions', sub: 'Medicines at a glance', color: 'text-violet-300', bg: 'bg-violet-400/10 border-violet-400/20', onClick: () => { resetDashboardPanels(); setShowPrescriptions(true); fetchMyPrescriptionRequests(); } },
                                                { icon: MessageSquare, label: 'Raise a Query', sub: 'Pharmacy support', color: 'text-cyan-300', bg: 'bg-cyan-400/10 border-cyan-400/20', onClick: () => { resetDashboardPanels(); setShowRaiseQuery(true); setShowQueryForm(false); fetchMyQueries(); fetchStoresForReviews(); } },
                                            ].map((card) => (
                                                <button
                                                    key={card.label}
                                                    onClick={card.onClick}
                                                    className={`rounded-xl border ${card.bg} px-4 py-4 text-left hover:brightness-125 active:scale-95 transition-all`}
                                                >
                                                    <card.icon className={`mb-2.5 ${card.color}`} size={18} />
                                                    <p className="font-semibold text-sm text-white">{card.label}</p>
                                                    <p className="mt-0.5 text-[11px] text-slate-400">{card.sub}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Snapshot */}
                                <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100 flex flex-col">
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Live Summary</p>
                                            <h3 className="mt-1 text-lg font-bold text-slate-800">Today at a glance</h3>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center">
                                            <Activity className="text-cyan-500" size={18} />
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        {[
                                            { label: 'Active Prescriptions', sub: 'In your account', value: prescriptionRequests.length, bg: 'bg-sky-50', text: 'text-sky-900', sub2: 'text-sky-600', val: 'text-sky-700', bar: 'bg-sky-400' },
                                            { label: 'Orders in History', sub: 'Recent purchases', value: dashboardOrders.length, bg: 'bg-amber-50', text: 'text-amber-900', sub2: 'text-amber-600', val: 'text-amber-700', bar: 'bg-amber-400' },
                                            { label: 'Vaccination Records', sub: 'Immunization entries', value: `${vaccinatedCount}/${vaccinationMaster.length}`, bg: 'bg-emerald-50', text: 'text-emerald-900', sub2: 'text-emerald-600', val: 'text-emerald-700', bar: 'bg-emerald-400' },
                                        ].map((row) => (
                                            <div key={row.label} className={`flex items-center justify-between rounded-xl ${row.bg} px-4 py-3.5 group`}>
                                                <div>
                                                    <p className={`text-sm font-semibold ${row.text}`}>{row.label}</p>
                                                    <p className={`text-xs ${row.sub2} mt-0.5`}>{row.sub}</p>
                                                </div>
                                                <span className={`text-2xl font-black ${row.val}`}>{row.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => navigate('/onlinepharmacy')}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-sm font-semibold py-3 hover:opacity-90 active:scale-[.98] transition shadow-md"
                                        >
                                            <ShoppingBag size={15} /> Browse Pharmacy
                                        </button>
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

                        {/* Notifications Settings — merged Hub */}
                        {showNotifications && (() => {
                            const categoryMeta = [
                                { key: 'orderUpdates',            label: 'Order Updates',             icon: ShoppingBag,   color: 'text-sky-600',    bg: 'bg-sky-50',      desc: 'Delivery status and order confirmations' },
                                { key: 'prescriptionReminders',   label: 'Prescription Reminders',    icon: Pill,          color: 'text-violet-600', bg: 'bg-violet-50',   desc: 'Refill due dates and expiry alerts' },
                                { key: 'offerAlerts',             label: 'Offer & Discount Alerts',   icon: DollarSign,    color: 'text-amber-600',  bg: 'bg-amber-50',    desc: 'Promotional offers and coupons' },
                                { key: 'healthReminders',         label: 'Health Reminders',          icon: Activity,      color: 'text-rose-600',   bg: 'bg-rose-50',     desc: 'Dose trackers and wellness tips' },
                            ];
                            const channelMeta = [
                                { key: 'push',  label: 'Push',  Icon: Bell,         gradient: 'from-cyan-500 to-sky-600' },
                                { key: 'email', label: 'Email', Icon: MailIcon,     gradient: 'from-violet-500 to-purple-600' },
                                { key: 'sms',   label: 'SMS',   Icon: MessageSquare, gradient: 'from-emerald-500 to-teal-600' },
                            ];
                            const activePrefs = notifPrefs[notifChannel] || {};
                            const allEnabled = Object.values(activePrefs).every(Boolean);
                            const activeChannelMeta = channelMeta.find((c) => c.key === notifChannel);

                            // For Email/SMS master, sync with API-backed notifications state
                            const masterChecked = notifChannel === 'email'
                                ? notifications.email
                                : notifChannel === 'sms'
                                    ? notifications.sms
                                    : allEnabled;

                            const handleMasterToggle = (val) => {
                                if (notifChannel === 'email') {
                                    openNotificationToggleDialog('email', val, true);
                                } else if (notifChannel === 'sms') {
                                    openNotificationToggleDialog('sms', val, true);
                                } else {
                                    openNotificationToggleDialog('push', val, true);
                                }
                            };

                            const totalEnabled = Object.values(notifPrefs).reduce((s, ch) => s + Object.values(ch).filter(Boolean).length, 0);

                            return (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                {/* Header */}
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow">
                                            <Bell className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900">Notification Settings</h2>
                                            <p className="text-xs text-slate-500">{totalEnabled} type{totalEnabled !== 1 ? 's' : ''} enabled across all channels</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Channel Tabs */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {channelMeta.map(({ key, label, Icon, gradient }) => {
                                            const count = Object.values(notifPrefs[key] || {}).filter(Boolean).length;
                                            const isActive = notifChannel === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setNotifChannel(key)}
                                                    className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                                                        isActive
                                                            ? `border-transparent bg-gradient-to-br ${gradient} text-white shadow-lg scale-[1.02]`
                                                            : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                                                    }`}
                                                >
                                                    <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                                    <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>{label}</p>
                                                    <p className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{count}/4 active</p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Active Channel Panel */}
                                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                        {/* Channel header with master toggle */}
                                        <div className={`px-5 py-4 bg-gradient-to-r ${activeChannelMeta?.gradient} flex items-center justify-between`}>
                                            <div className="flex items-center gap-3">
                                                {activeChannelMeta && <activeChannelMeta.Icon className="w-5 h-5 text-white" />}
                                                <div>
                                                    <p className="text-sm font-bold text-white">
                                                        {notifChannel === 'push' ? 'Push Notifications' : notifChannel === 'email' ? 'Email Notifications' : 'SMS Notifications'}
                                                    </p>
                                                    <p className="text-[11px] text-white/80">
                                                        {notifChannel === 'push' ? 'In-app & browser alerts' : notifChannel === 'email' ? 'Sent to your registered email' : 'Text messages to your phone'}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Master toggle — for email/sms uses API confirmation, for push uses local */}
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={masterChecked}
                                                    onChange={(e) => handleMasterToggle(e.target.checked)}
                                                    disabled={notificationSettingsLoading || notificationSettingsSaving}
                                                />
                                                <div className="w-11 h-6 bg-white/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/50 peer-disabled:opacity-50"></div>
                                            </label>
                                        </div>

                                        {/* Category rows */}
                                        <div className="divide-y divide-slate-50">
                                            {categoryMeta.map(({ key, label, icon: CatIcon, color, bg, desc }) => {
                                                const checked = notifChannel === 'push'
                                                    ? (notifPrefs.push?.[key] ?? false)
                                                    : notifPrefs[notifChannel]?.[key] ?? false;

                                                const handleChange = (val) => {
                                                    if (notifChannel === 'push') {
                                                        setNotifCategoryPref('push', key, val);
                                                    } else {
                                                        // category-level for email/sms also stored locally (master uses API)
                                                        setNotifCategoryPref(notifChannel, key, val);
                                                    }
                                                };

                                                return (
                                                    <div key={key} className="flex items-center px-5 py-4 gap-4 hover:bg-slate-50 transition">
                                                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                                                            <CatIcon className={`w-5 h-5 ${color}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-800">{label}</p>
                                                            <p className="text-xs text-slate-500 truncate">{desc}</p>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => handleChange(e.target.checked)} />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* All-channels overview matrix */}
                                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">All Channels Overview</p>
                                            <div className="flex items-center gap-4 pr-1">
                                                {channelMeta.map(({ key, Icon }) => (
                                                    <Icon key={key} className="w-3.5 h-3.5 text-slate-400" />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {categoryMeta.map(({ key, label, icon: CatIcon, color, bg }) => (
                                                <div key={key} className="flex items-center px-5 py-3 gap-3">
                                                    <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                                                        <CatIcon className={`w-4 h-4 ${color}`} />
                                                    </div>
                                                    <p className="flex-1 text-sm text-slate-700 font-medium">{label}</p>
                                                    <div className="flex items-center gap-4">
                                                        {channelMeta.map(({ key: ch }) => (
                                                            <div key={ch} className={`w-2.5 h-2.5 rounded-full ${notifPrefs[ch]?.[key] ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Save button */}
                                    <button
                                        type="button"
                                        onClick={saveNotifPrefs}
                                        disabled={notifPrefsSaving}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {notifPrefsSaving ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Saving…
                                            </>
                                        ) : notifPrefsSaved ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" />
                                                Saved to your account!
                                            </>
                                        ) : (
                                            <>
                                                <Bell className="w-5 h-5" />
                                                Save Preferences
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            );
                        })()}

                        {/* Feedback / Review Panel */}
                        {showFeedback && (
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                                        <Star className="text-yellow-500" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Feedback & Reviews</h2>
                                        <p className="text-sm text-slate-500">Choose a store, then add, edit, or delete your review</p>
                                    </div>
                                </div>

                                {feedbackSuccessMessage && (
                                    <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                                        <CheckCircle2 size={18} />
                                        <span>{feedbackSuccessMessage}</span>
                                    </div>
                                )}

                                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="font-semibold text-slate-700">My Reviews</h3>
                                    {!showReviewForm && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (availableStoresForNewReview.length === 0) {
                                                    openReviewNoticeModal('No Stores Left To Review', 'You have already reviewed all available stores. You can edit an existing review from the list below.');
                                                    return;
                                                }

                                                setEditingReviewId(null);
                                                setSelectedReviewStoreId(String(availableStoresForNewReview[0]._id));
                                                setFeedbackForm({ rating: 5, comment: '', role: 'Patient' });
                                                setFeedbackSuccessMessage('');
                                                setShowReviewForm(true);
                                            }}
                                            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-500 transition"
                                        >
                                            <Plus size={16} /> Add New Review
                                        </button>
                                    )}
                                </div>

                                {showReviewForm && (
                                    <form onSubmit={handleFeedbackSubmit} className="mb-8 space-y-5 bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
                                        <h3 className="font-semibold text-slate-700">
                                            {editingReviewId ? 'Edit your review for this store' : 'Submit a new store review'}
                                        </h3>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Store</label>
                                            <select
                                                value={selectedReviewStoreId}
                                                onChange={(e) => {
                                                    setSelectedReviewStoreId(e.target.value);
                                                    setFeedbackSuccessMessage('');
                                                }}
                                                disabled={storesForReviewsLoading || storesForReviews.length === 0 || Boolean(editingReviewId)}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:bg-slate-100"
                                            >
                                                {storesForReviews.length === 0 ? (
                                                    <option value="">No stores found</option>
                                                ) : (
                                                    storesForReviews.map((store) => (
                                                        <option
                                                            key={store._id}
                                                            value={store._id}
                                                            disabled={!editingReviewId && reviewedStoreIds.has(String(store._id))}
                                                        >
                                                            {store.storeName || store.name}{!editingReviewId && reviewedStoreIds.has(String(store._id)) ? ' (already reviewed)' : ''}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>

                                        <div className="flex gap-2">
                                            {[1,2,3,4,5].map(s => (
                                                <button
                                                    type="button"
                                                    key={s}
                                                    onClick={() => setFeedbackForm(f => ({ ...f, rating: s }))}
                                                    className={`transition-transform hover:scale-110 ${s <= feedbackForm.rating ? 'text-yellow-400' : 'text-slate-300'}`}
                                                >
                                                    <Star size={28} fill={s <= feedbackForm.rating ? 'currentColor' : 'none'} />
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-slate-500 self-center">{feedbackForm.rating} / 5</span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Your role</label>
                                            <select value={feedbackForm.role} onChange={e => setFeedbackForm(f => ({ ...f, role: e.target.value }))}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300">
                                                <option>Patient</option>
                                                <option>Regular Patient</option>
                                                <option>New Patient</option>
                                                <option>Caregiver</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Your review</label>
                                            <textarea rows={4} value={feedbackForm.comment} onChange={e => setFeedbackForm(f => ({ ...f, comment: e.target.value }))}
                                                placeholder="Tell us about your experience with this store..."
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300" />
                                            <p className="text-xs text-slate-400 mt-1">{feedbackForm.comment.length} / 600 characters</p>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <button type="submit" disabled={feedbackSubmitting || !selectedReviewStoreId}
                                                className="flex-1 min-w-[180px] py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-semibold text-sm transition disabled:opacity-60">
                                                {feedbackSubmitting ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingReviewId(null);
                                                    setFeedbackForm({ rating: 5, comment: '', role: 'Patient' });
                                                    setFeedbackSuccessMessage('');
                                                    setShowReviewForm(false);
                                                }}
                                                className="min-w-[160px] py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* My past reviews */}
                                <div>
                                    {reviewsLoading ? (
                                        <p className="text-sm text-slate-400">Loading...</p>
                                    ) : myReviews.length === 0 ? (
                                        <p className="text-sm text-slate-400">You haven't submitted any reviews yet. Click Add New Review to create your first review.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {myReviews.map((r, i) => (
                                                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-2">
                                                            {[1,2,3,4,5].map(s => (
                                                                <Star key={s} size={14} className={s <= r.rating ? 'text-yellow-400' : 'text-slate-300'} fill={s <= r.rating ? 'currentColor' : 'none'} />
                                                            ))}
                                                            <span className="text-xs text-slate-400 ml-1">{r.role}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleReviewEdit(r)}
                                                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                                                            >
                                                                <Pencil size={12} /> Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleReviewDelete(r._id)}
                                                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs font-semibold text-cyan-700 mb-1">Store: {getReviewStoreName(r)}</p>
                                                    <p className="text-sm text-slate-700">{r.comment}</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {new Date(r.updatedAt || r.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                                                        {(r.updatedAt && r.createdAt && new Date(r.updatedAt).getTime() !== new Date(r.createdAt).getTime()) ? ' (edited)' : ''}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Review Notice Modal */}
                        {reviewNoticeModal.isOpen && (
                            <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm px-4">
                                <div className="w-full max-w-md rounded-2xl border border-amber-100 bg-white p-6 shadow-2xl animate-[fade-in-up_0.25s_ease-out]">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                            <Info size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-slate-900">{reviewNoticeModal.title}</h3>
                                            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{reviewNoticeModal.message}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={closeReviewNoticeModal}
                                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
                                        >
                                            Got It
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delete Review Confirmation Modal */}
                        {reviewDeleteModal.isOpen && (
                            <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm px-4">
                                <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-2xl animate-[fade-in-up_0.25s_ease-out]">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-slate-900">Delete This Review?</h3>
                                            <p className="mt-1 text-sm text-slate-600 leading-relaxed">This action cannot be undone. The review will be removed from your profile and public view.</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closeReviewDeleteModal}
                                            disabled={reviewDeleteLoading}
                                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={confirmReviewDelete}
                                            disabled={reviewDeleteLoading}
                                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
                                        >
                                            <Trash2 size={14} />
                                            {reviewDeleteLoading ? 'Deleting...' : 'Delete Review'}
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
                                    <button onClick={() => { setShowRaiseQuery(false); setShowQueryForm(false); }} className="text-gray-400 hover:text-gray-600 transition">
                                        <X size={20} />
                                    </button>
                                </div>

                                {!showQueryForm && userQueries.length > 0 ? (
                                    <div className="space-y-5">
                                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-semibold text-gray-800">Your Queries</h3>
                                                <button
                                                    type="button"
                                                    onClick={fetchMyQueries}
                                                    className="text-xs font-medium text-cyan-700 hover:text-cyan-800"
                                                    disabled={queriesLoading}
                                                >
                                                    {queriesLoading ? 'Refreshing...' : 'Refresh'}
                                                </button>
                                            </div>

                                            {queriesLoading ? (
                                                <p className="text-xs text-gray-500">Loading your queries...</p>
                                            ) : (
                                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                                    {userQueries.map((query) => (
                                                        <div key={query._id} className="bg-white border border-gray-200 rounded-lg p-3">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <p className="text-xs font-semibold text-gray-800">{query.subject}</p>
                                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 capitalize">
                                                                    {String(query.status || 'open').toLowerCase() === 'resolved'
                                                                        ? 'answered'
                                                                        : String(query.status || 'open').replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            {(query.storeId?.storeName || query.storeId?.name) && (
                                                                <p className="text-[11px] text-cyan-700 font-medium mt-0.5">
                                                                    🏪 {query.storeId?.storeName || query.storeId?.name}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{query.message}</p>
                                                            {query.answer && (
                                                                <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2">
                                                                    <p className="text-[11px] font-semibold text-emerald-800">Store Answer</p>
                                                                    <p className="mt-0.5 text-xs text-emerald-700">{query.answer}</p>
                                                                </div>
                                                            )}
                                                            <p className="text-[11px] text-gray-400 mt-1">{new Date(query.createdAt).toLocaleString()}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowQueryForm(true);
                                                setQueryErrors({});
                                            }}
                                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 active:scale-[.98] transition flex items-center justify-center gap-2 text-sm shadow-md"
                                        >
                                            <MessageSquare size={16} /> Raise a Query
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

                                        {/* Store */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Select Store <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="storeId"
                                                value={queryForm.storeId}
                                                onChange={handleQueryChange}
                                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition bg-gray-50 ${
                                                    queryErrors.storeId ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                                }`}
                                            >
                                                <option value="">Select a store…</option>
                                                {storesForReviewsLoading
                                                    ? <option disabled>Loading stores…</option>
                                                    : storesForReviews.map((store) => (
                                                        <option key={store._id} value={store._id}>
                                                            {store.storeName || store.name} — {store.city || store.address || ''}
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                            {queryErrors.storeId && <p className="text-red-500 text-xs mt-1">{queryErrors.storeId}</p>}
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
                                                <li>• Urgent? Call 8758770402.</li>
                                            </ul>
                                        </div>

                                        {userQueries.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowQueryForm(false);
                                                    fetchMyQueries();
                                                }}
                                                className="w-full border border-cyan-200 text-cyan-700 font-semibold py-3 rounded-xl hover:bg-cyan-50 transition text-sm"
                                            >
                                                Back to Query List
                                            </button>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={querySubmitting}
                                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 active:scale-[.98] transition flex items-center justify-center gap-2 text-sm shadow-md"
                                        >
                                            <MessageSquare size={16} /> {querySubmitting ? 'Submitting...' : 'Submit Query'}
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
                                                    disabled={isProfileSaving}
                                                    className={`flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 rounded-xl transition ${isProfileSaving ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
                                                >
                                                    {isProfileSaving ? 'Saving...' : 'Save Changes'}
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
                                                {(() => {
                                                    const paymentMeta = getPaymentMeta(order.payment);
                                                    return (
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
                                                            <span className="font-medium">Payment:</span>
                                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentMeta.className}`}>
                                                                {paymentMeta.label}
                                                            </span>
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
                                                    );
                                                })()}

                                                {expandedDashboardOrder === order.id && (
                                                    <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                            <Package className="w-4 h-4 text-blue-600" />
                                                            Order Items
                                                        </h3>
                                                        <div className="space-y-2 text-sm text-gray-700">
                                                            {order.items?.length > 0 ? (
                                                                order.items.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-3 hover:shadow-md hover:border-blue-200 transition-all duration-200">
                                                                        {/* Medicine Image */}
                                                                        <div className="flex-shrink-0">
                                                                            <img
                                                                                src="/medicine.png"
                                                                                alt={item.name || 'Medicine'}
                                                                                className="w-12 h-12 object-contain rounded-lg bg-blue-50 p-2"
                                                                            />
                                                                        </div>

                                                                        {/* Item Details */}
                                                                        <div className="flex-grow min-w-0">
                                                                            <p className="font-medium text-gray-800 truncate">{item.name || 'Unnamed Item'}</p>
                                                                            <p className="text-xs text-gray-500">Medicine</p>
                                                                        </div>

                                                                        {/* Quantity and Price */}
                                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                                            <div className="text-right">
                                                                                <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                                                                                <p className="font-semibold text-blue-600">{formatUsd(item.price || 0)}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-center py-6 text-gray-500">
                                                                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                                                                    <p>No items available for this order.</p>
                                                                </div>
                                                            )}
                                                        </div>
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

                        {/* Health Management Panel */}
                        {showHealthManagement && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                            <Activity className="text-indigo-600" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Health Management</h2>
                                            <p className="text-sm text-gray-500">Expiry reminders, dosage tracking, interactions, timeline, and PDF export.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleExportHealthRecords}
                                        disabled={healthExporting}
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Download size={16} /> {healthExporting ? 'Exporting...' : 'Export PDF'}
                                    </button>
                                </div>

                                {healthActionMessage ? (
                                    <div className={`rounded-xl border px-4 py-3 text-sm ${
                                        healthActionType === 'error'
                                            ? 'border-rose-200 bg-rose-50 text-rose-800'
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    }`}>
                                        {healthActionMessage}
                                    </div>
                                ) : null}

                                {healthLoading ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                        Loading health data...
                                    </div>
                                ) : (
                                    <>
                                        {/* Expiry Reminders */}
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <h3 className="text-sm font-semibold text-amber-900 mb-2">Medicine Expiry Reminders</h3>
                                            {expiryReminders.length === 0 ? (
                                                <p className="text-xs text-amber-800">No upcoming expiries in the next 7 days.</p>
                                            ) : (
                                                <ul className="space-y-1 text-xs text-amber-900">
                                                    {expiryReminders.map((reminder) => (
                                                        <li key={String(reminder.trackerId)}>
                                                            {reminder.medicineName} expires on {new Date(reminder.expiryDate).toLocaleDateString()} ({reminder.daysLeft} day(s) left)
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Dosage Tracker */}
                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                                <h3 className="text-sm font-semibold text-slate-900">Dosage Tracker</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddTrackerForm((prev) => !prev)}
                                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                                                >
                                                    {showAddTrackerForm ? 'Close Add Tracker' : 'Add Dosage Tracker'}
                                                </button>
                                            </div>

                                            {showAddTrackerForm && (
                                                <form onSubmit={handleAddTracker} className="grid gap-3 mb-4 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
                                                    <input
                                                        value={newTracker.medicineName}
                                                        onChange={(e) => setNewTracker((prev) => ({ ...prev, medicineName: e.target.value }))}
                                                        placeholder="Medicine name"
                                                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                    />
                                                    <input
                                                        value={newTracker.dosage}
                                                        onChange={(e) => setNewTracker((prev) => ({ ...prev, dosage: e.target.value }))}
                                                        placeholder="Dosage (e.g. 500mg)"
                                                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                    />
                                                    <input
                                                        value={newTracker.frequency}
                                                        onChange={(e) => setNewTracker((prev) => ({ ...prev, frequency: e.target.value }))}
                                                        placeholder="Frequency (e.g. 2 times/day)"
                                                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                    />
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input
                                                            type="date"
                                                            value={newTracker.startDate}
                                                            onChange={(e) => setNewTracker((prev) => ({ ...prev, startDate: e.target.value }))}
                                                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={newTracker.expiryDate}
                                                            onChange={(e) => setNewTracker((prev) => ({ ...prev, expiryDate: e.target.value }))}
                                                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                                    >
                                                        Save Tracker
                                                    </button>
                                                </form>
                                            )}

                                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                {healthTrackers.length === 0 ? (
                                                    <p className="text-xs text-slate-500">No active trackers yet. Click Add Dosage Tracker to create one.</p>
                                                ) : healthTrackers.map((tracker) => (
                                                    <div key={tracker._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                        <p className="text-sm font-semibold text-slate-900">{tracker.medicineName}</p>
                                                        <p className="text-xs text-slate-600">{tracker.dosage} • {tracker.frequency}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Last intake: {tracker.lastTakenAt ? new Date(tracker.lastTakenAt).toLocaleString() : 'Not logged yet'}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLogIntake(tracker._id)}
                                                            className="mt-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                        >
                                                            Log Intake Now
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Medical Timeline */}
                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Medical History Timeline</h3>
                                            <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
                                                {medicalTimeline.length === 0 ? (
                                                    <p className="text-xs text-slate-500">No timeline events found yet.</p>
                                                ) : medicalTimeline.slice(0, 80).map((event, idx) => (
                                                    <div key={`${event.type}-${idx}-${event.date}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                                                            <span className="text-[11px] text-slate-500">{new Date(event.date).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 mt-0.5">{event.type} • {event.details}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
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

            {pendingNotificationChange && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-2xl">
                        <div className="relative bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-5 text-white">
                            <button
                                type="button"
                                onClick={closeNotificationToggleDialog}
                                className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
                                aria-label="Close notification dialog"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-2.5">
                                    {pendingNotificationChange.key === 'sms' ? (
                                        <MessageSquare size={20} />
                                    ) : pendingNotificationChange.key === 'push' ? (
                                        <Bell size={20} />
                                    ) : (
                                        <MailIcon size={20} />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-white/80">Notification Update</p>
                                    <h3 className="text-lg font-bold">
                                        {pendingNotificationChange.value ? 'Enable Alerts' : 'Disable Alerts'}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 px-6 py-5">
                            {notificationToggleSuccess ? (
                                <div className="flex flex-col items-center justify-center py-4 text-center">
                                    <div className="relative mb-3 flex h-16 w-16 items-center justify-center">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-70 animate-ping"></span>
                                        <span className="absolute inline-flex h-14 w-14 rounded-full bg-emerald-100"></span>
                                        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
                                            <CheckCircle2 size={24} />
                                        </span>
                                    </div>
                                    <p className="text-base font-semibold text-emerald-700">Preference updated</p>
                                    <p className="mt-1 text-sm text-slate-600">Your change is saved and synced successfully.</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm leading-relaxed text-slate-600">
                                        {pendingNotificationChange.applyAll
                                            ? (pendingNotificationChange.value
                                                ? `Great choice! Enabling ${pendingNotificationChange.label} will turn on all ${pendingNotificationChange.label} notification options.`
                                                : `You are turning off ${pendingNotificationChange.label}. This will disable all ${pendingNotificationChange.label} notification options.`)
                                            : (pendingNotificationChange.value
                                                ? `Great choice! ${pendingNotificationChange.label} alerts keep you informed about important pharmacy updates.`
                                                : `You are turning off ${pendingNotificationChange.label} alerts. You may miss important pharmacy updates.`)}
                                    </p>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                                        Your preference will be saved instantly when you click Confirm.
                                    </div>

                                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={closeNotificationToggleDialog}
                                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={confirmNotificationToggle}
                                            disabled={notificationSettingsSaving}
                                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                        >
                                            {notificationSettingsSaving ? 'Saving...' : 'Confirm'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

