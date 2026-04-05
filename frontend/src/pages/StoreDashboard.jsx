import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { baseURL } from '../main';
import {
  Users,
  Package,
  ClipboardList,
  ShoppingBag,
  BarChart3,
  FileUp,
  UserPlus,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  MessageSquare,
  Send,
} from 'lucide-react';

const StoreDashboard = () => {
  const [selectedSection, setSelectedSection] = useState('staff');
  const [storeName, setStoreName] = useState('');
  const [storeDataLoading, setStoreDataLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contact: '',
    email: '',
    address: '',
    role: 'Pharmacist',
  });
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showStaffSearchFields, setShowStaffSearchFields] = useState(false);
  const [staffSearchFirstName, setStaffSearchFirstName] = useState('');
  const [staffSearchLastName, setStaffSearchLastName] = useState('');
  const [staffSearchContact, setStaffSearchContact] = useState('');
  const [staffSearchEmail, setStaffSearchEmail] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    manufacturer: '',
    dosage: '',
    type: '',
    price: '',
    stock: '',
  });
  const [editingMedicineId, setEditingMedicineId] = useState(null);
  const [editMedicine, setEditMedicine] = useState({
    name: '',
    manufacturer: '',
    dosage: '',
    type: '',
    price: '',
    stock: '',
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [updatingTrackingStatus, setUpdatingTrackingStatus] = useState(false);
  const orderDetailsRef = useRef(null);
  const selectedOrder = orders.find((item) => item.id === selectedOrderId);
  const parseCurrencyAmount = (value) => Number(String(value).replace(/[^\d.]/g, '')) || 0;
  const formatUSD = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  const isCompletedOrder = (status) => ['completed', 'delivered'].includes(String(status || '').toLowerCase());
  const getTrackingBadge = (trackingStatus) => {
    const s = (trackingStatus || 'Order Placed').toLowerCase();
    if (s.includes('delivered') || s.includes('pick up')) return { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    if (s.includes('out for') || s.includes('out for delivery')) return { dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700 border border-blue-200' };
    if (s.includes('packed')) return { dot: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700 border border-violet-200' };
    return { dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 border border-amber-200' };
  };
  const getPaymentMethodMeta = (paymentMethod) => {
    const key = String(paymentMethod || '').toLowerCase().replace(/[\s_-]/g, '');
    const paymentMethodMeta = {
      cod: { label: 'Cash on Delivery', className: 'bg-amber-50 border-amber-200 text-amber-700' },
      cashondelivery: { label: 'Cash on Delivery', className: 'bg-amber-50 border-amber-200 text-amber-700' },
      card: { label: 'Card', className: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
      creditcard: { label: 'Credit Card', className: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
      debitcard: { label: 'Debit Card', className: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
      upi: { label: 'UPI', className: 'bg-violet-50 border-violet-200 text-violet-700' },
      netbanking: { label: 'Net Banking', className: 'bg-blue-50 border-blue-200 text-blue-700' },
      wallet: { label: 'Wallet', className: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700' },
      pickup: { label: 'Pay at Pickup', className: 'bg-sky-50 border-sky-200 text-sky-700' },
    };

    if (paymentMethodMeta[key]) {
      return paymentMethodMeta[key];
    }

    const readableLabel = String(paymentMethod || 'Unknown')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return {
      label: readableLabel,
      className: 'bg-slate-50 border-slate-200 text-slate-700',
    };
  };
  const reportOrdersTotal = orders.length;
  const reportCompletedOrders = orders.filter((order) => isCompletedOrder(order.status)).length;
  const reportPendingOrders = orders.filter((order) => !isCompletedOrder(order.status)).length;
  const reportTotalRevenue = orders.reduce((sum, order) => sum + parseCurrencyAmount(order.total), 0);
  const reportAverageOrderValue = reportOrdersTotal ? reportTotalRevenue / reportOrdersTotal : 0;
  const reportUniqueCustomers = new Set(orders.map((order) => order.customer)).size;
  const reportCompletionRate = reportOrdersTotal ? Math.round((reportCompletedOrders / reportOrdersTotal) * 100) : 0;

  // Calculate dynamic revenue summary from orders
  const calculateRevenueSummary = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today;
    });
    const weekOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= weekAgo && orderDate < today;
    });
    const monthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= monthAgo && orderDate < today;
    });

    const revenueToday = todayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const revenueWeek = weekOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const revenueMonth = monthOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    
    // Growth: percentage change from last week to this week
    const lastWeekStart = new Date(weekAgo);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= lastWeekStart && orderDate < weekAgo;
    });
    const revenueLastWeek = lastWeekOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const growth = revenueLastWeek > 0 ? Math.round(((revenueWeek - revenueLastWeek) / revenueLastWeek) * 100) : 0;

    return {
      monthly: revenueMonth,
      weekly: revenueWeek,
      revenueToday: revenueToday,
      growth: growth,
    };
  };

  const revenueSummary = calculateRevenueSummary();

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);

    if (window.innerWidth < 1024) {
      requestAnimationFrame(() => {
        orderDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const selectedPrescription = prescriptions.find((item) => item._id === selectedPrescriptionId);
  const [patientsCsvFile, setPatientsCsvFile] = useState(null);
  const [csvUploadMessage, setCsvUploadMessage] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvImportSummary, setCsvImportSummary] = useState(null);
  const [queries, setQueries] = useState([]);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const selectedQuery = queries.find((item) => item._id === selectedQueryId);

  const formatShortDate = (value) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  };

  const loadStoreData = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setStoreDataLoading(true);
      const response = await axios.get(`${baseURL}/fetchdata`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data?.userData;
      if (userData?.storeName) {
        setStoreName(userData.storeName);
      }
    } catch (error) {
      console.error('Failed to load store data:', error.message);
    } finally {
      setStoreDataLoading(false);
    }
  };

  const loadStoreOrders = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setOrdersLoading(true);
      const response = await axios.get(`${baseURL}/store-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rows = response.data.orders || [];
      setOrders(rows);
      setSelectedOrderId((prev) => (rows.some((order) => order.id === prev) ? prev : rows[0]?.id || null));
    } catch (error) {
      console.error('Failed to load store orders:', error.message);
      setOrders([]);
      setSelectedOrderId(null);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateTrackingStatus = async (newStatus) => {
    if (!selectedOrder) return;
    
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setUpdatingTrackingStatus(true);
      const response = await axios.patch(
        `${baseURL}/orders/${selectedOrder.orderId}/tracking`,
        {
          trackingStatus: newStatus,
          deliveryType: selectedOrder.deliveryType || 'delivery'
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id ? { ...o, trackingStatus: newStatus } : o
          )
        );
        toast.success('Tracking status updated successfully');
      }
    } catch (error) {
      console.error('Failed to update tracking status:', error.message);
      toast.error('Failed to update tracking status');
    } finally {
      setUpdatingTrackingStatus(false);
    }
  };

  const getAvailableTrackingStatuses = () => {
    const deliveryType = selectedOrder?.deliveryType || 'delivery';
    if (deliveryType === 'pickup') {
      return ['Order Placed', 'Packed', 'Ready for Pick Up', 'Picked Up'];
    } else {
      return ['Order Placed', 'Packed', 'Out for Delivery', 'Delivered'];
    }
  };

  const getCurrentTrackingStatusIndex = () => {
    const statuses = getAvailableTrackingStatuses();
    const current = selectedOrder?.trackingStatus || 'Order Placed';
    return statuses.indexOf(current);
  };

  const loadStorePrescriptions = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setPrescriptionsLoading(true);
      const response = await axios.get(`${baseURL}/prescriptions/store`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rows = response.data.prescriptions || [];
      setPrescriptions(rows);
      setSelectedPrescriptionId((prev) => prev || rows[0]?._id || null);
    } catch (error) {
      console.error('Failed to load store prescriptions:', error.message);
      setPrescriptions([]);
      setSelectedPrescriptionId(null);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const loadStoreQueries = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setQueriesLoading(true);
      const response = await axios.get(`${baseURL}/queries/store`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rows = response.data.queries || [];
      setQueries(rows);
      setSelectedQueryId((prev) => (rows.some((q) => q._id === prev) ? prev : rows[0]?._id || null));
    } catch (error) {
      console.error('Failed to load store queries:', error.message);
      setQueries([]);
      setSelectedQueryId(null);
    } finally {
      setQueriesLoading(false);
    }
  };

  const loadStoreStaffMembers = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setStaffLoading(true);
      const response = await axios.get(`${baseURL}/store-staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffMembers(response.data.staffMembers || []);
    } catch (error) {
      console.error('Failed to load staff members:', error.message);
      setStaffMembers([]);
    } finally {
      setStaffLoading(false);
    }
  };

  const updatePrescriptionStatus = async (id, status) => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      await axios.patch(
        `${baseURL}/prescriptions/${id}/review`,
        { status: status.toLowerCase() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await loadStorePrescriptions();
    } catch (error) {
      console.error('Failed to review prescription:', error.message);
    }
  };

  const sectionConfig = [
    { key: 'staff', label: 'Staff Members', icon: Users },
    { key: 'importPatients', label: 'Import Patients', icon: FileUp },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'prescription', label: 'Prescription', icon: ClipboardList },
    { key: 'queries', label: 'Queries', icon: MessageSquare },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  const openStaffForm = () => {
    setEditingStaffId(null);
    setShowStaffForm(true);
    setNewStaff({
      firstName: '',
      middleName: '',
      lastName: '',
      contact: '',
      email: '',
      address: '',
      role: 'Pharmacist',
    });
  };

  const addStaffMember = async (e) => {
    e.preventDefault();
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email || !newStaff.contact) return;

    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    const payload = {
      firstName: newStaff.firstName,
      middleName: newStaff.middleName,
      lastName: newStaff.lastName,
      role: newStaff.role,
      email: newStaff.email,
      contact: newStaff.contact,
      address: newStaff.address,
    };

    try {
      if (editingStaffId) {
        await axios.put(`${baseURL}/store-staff/${editingStaffId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${baseURL}/store-staff`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await loadStoreStaffMembers();
      setEditingStaffId(null);
      setNewStaff({
        firstName: '',
        middleName: '',
        lastName: '',
        contact: '',
        email: '',
        address: '',
        role: 'Pharmacist',
      });
      setShowStaffForm(false);
    } catch (error) {
      console.error('Failed to save staff member:', error.message);
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaffId(staff._id);
    setShowStaffForm(true);
    setNewStaff({
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
      contact: staff.contact,
      email: staff.email,
      address: staff.address,
      role: staff.role,
    });
  };

  const removeStaffMember = (id) => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    axios
      .delete(`${baseURL}/store-staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => setStaffMembers((prev) => prev.filter((member) => member._id !== id)))
      .catch((error) => console.error('Failed to remove staff member:', error.message));
  };

  const toggleStaffStatus = async (member) => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    const nextStatus = member.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const response = await axios.patch(
        `${baseURL}/store-staff/${member._id}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const updatedStaffMember = response.data.staffMember;
      setStaffMembers((prev) => prev.map((row) => (row._id === updatedStaffMember._id ? updatedStaffMember : row)));
    } catch (error) {
      console.error('Failed to update staff status:', error.message);
    }
  };

  const loadStoreInventory = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setInventoryLoading(true);
      const response = await axios.get(`${baseURL}/store-inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryItems(response.data?.inventory || []);
    } catch (error) {
      console.error('Failed to load store inventory:', error.message);
      setInventoryItems([]);
      toast.error('Failed to load inventory');
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleNewMedicineChange = (e) => {
    const { name, value } = e.target;
    setNewMedicine((prev) => ({ ...prev, [name]: value }));
  };

  const addMedicine = async (e) => {
    e.preventDefault();
    if (!newMedicine.name || newMedicine.stock === '') return;

    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setInventorySaving(true);
      const response = await axios.post(
        `${baseURL}/store-inventory`,
        {
          name: newMedicine.name.trim(),
          manufacturer: newMedicine.manufacturer.trim(),
          dosage: newMedicine.dosage.trim(),
          type: newMedicine.type.trim(),
          price: Number(newMedicine.price) || 0,
          stock: Number(newMedicine.stock) || 0,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const created = response.data?.medicine;
      if (created) {
        setInventoryItems((prev) => [created, ...prev]);
      }
      setNewMedicine({ name: '', manufacturer: '', dosage: '', type: '', price: '', stock: '' });
      toast.success('Medicine added to inventory');
    } catch (error) {
      console.error('Failed to add medicine:', error.message);
      toast.error(error.response?.data?.message || 'Failed to add medicine');
    } finally {
      setInventorySaving(false);
    }
  };

  const startEditMedicine = (item) => {
    setEditingMedicineId(item._id);
    setEditMedicine({
      name: item.name || '',
      manufacturer: item.manufacturer || '',
      dosage: item.dosage || '',
      type: item.type || '',
      price: String(item.price ?? ''),
      stock: String(item.stock ?? ''),
    });
  };

  const handleEditMedicineChange = (e) => {
    const { name, value } = e.target;
    setEditMedicine((prev) => ({ ...prev, [name]: value }));
  };

  const saveMedicine = async (id) => {
    if (!editMedicine.name || editMedicine.stock === '') return;

    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setInventorySaving(true);
      const response = await axios.put(
        `${baseURL}/store-inventory/${id}`,
        {
          name: editMedicine.name.trim(),
          manufacturer: editMedicine.manufacturer.trim(),
          dosage: editMedicine.dosage.trim(),
          type: editMedicine.type.trim(),
          price: Number(editMedicine.price) || 0,
          stock: Number(editMedicine.stock) || 0,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const updated = response.data?.medicine;
      if (updated) {
        setInventoryItems((prev) => prev.map((item) => (item._id === id ? updated : item)));
      }
      setEditingMedicineId(null);
      setEditMedicine({ name: '', manufacturer: '', dosage: '', type: '', price: '', stock: '' });
      toast.success('Medicine updated');
    } catch (error) {
      console.error('Failed to update medicine:', error.message);
      toast.error(error.response?.data?.message || 'Failed to update medicine');
    } finally {
      setInventorySaving(false);
    }
  };

  const cancelEditMedicine = () => {
    setEditingMedicineId(null);
    setEditMedicine({ name: '', manufacturer: '', dosage: '', type: '', price: '', stock: '' });
  };

  const updateMedicineStock = async (item, delta) => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    const nextStock = Math.max(0, (Number(item.stock) || 0) + delta);

    try {
      const response = await axios.put(
        `${baseURL}/store-inventory/${item._id}`,
        { stock: nextStock },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const updated = response.data?.medicine;
      if (updated) {
        setInventoryItems((prev) => prev.map((row) => (row._id === item._id ? updated : row)));
      }
    } catch (error) {
      console.error('Failed to update stock:', error.message);
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const removeInventoryMedicine = async (medicineId) => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setInventorySaving(true);
      await axios.delete(`${baseURL}/store-inventory/${medicineId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryItems((prev) => prev.filter((item) => item._id !== medicineId));
      toast.success('Medicine removed from inventory');
    } catch (error) {
      console.error('Failed to remove medicine:', error.message);
      toast.error(error.response?.data?.message || 'Failed to remove medicine');
    } finally {
      setInventorySaving(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  useEffect(() => {
    if (selectedSection === 'staff') {
      loadStoreStaffMembers();
    }
    if (selectedSection === 'inventory') {
      loadStoreInventory();
    }
    if (selectedSection === 'orders' || selectedSection === 'reports') {
      loadStoreOrders();
    }
    if (selectedSection === 'prescription') {
      loadStorePrescriptions();
    }
    if (selectedSection === 'queries') {
      loadStoreQueries();
    }
  }, [selectedSection]);

  const handleSubmitAnswer = async (queryId) => {
    const answer = answerText.trim();
    if (!answer) return;

    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setAnswerSubmitting(true);
      const response = await axios.patch(
        `${baseURL}/queries/${queryId}/answer`,
        { answer },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = response.data.query;
      setQueries((prev) => prev.map((q) => (q._id === updated._id ? updated : q)));
      setAnswerText('');
      toast.success('Answer sent to patient');
    } catch (error) {
      console.error('Failed to answer query:', error.message);
      toast.error(error.response?.data?.message || 'Failed to send answer');
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const handlePatientsCsvUpload = (e) => {
    const file = e.target.files?.[0] || null;
    setPatientsCsvFile(file);
    setCsvImportSummary(null);
    if (file) {
      setCsvUploadMessage(`CSV selected: ${file.name}`);
    } else {
      setCsvUploadMessage('');
    }
  };

  const handleImportPatientsCsv = async () => {
    if (!patientsCsvFile) {
      setCsvUploadMessage('Please select a CSV file first.');
      return;
    }

    const token = localStorage.getItem('medVisionToken');
    if (!token) {
      setCsvUploadMessage('Please login again to import patients.');
      return;
    }

    const formData = new FormData();
    formData.append('patientsCsv', patientsCsvFile);

    try {
      setCsvImporting(true);
      setCsvUploadMessage('Import in progress...');
      const response = await axios.post(`${baseURL}/patients/import-csv`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setCsvImportSummary(response.data?.summary || null);
      setCsvUploadMessage(response.data?.message || 'Patients imported successfully.');
      toast.success('Patient import completed');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to import patients CSV';
      setCsvImportSummary(null);
      setCsvUploadMessage(message);
      toast.error(message);
    } finally {
      setCsvImporting(false);
    }
  };

  const filteredStaffMembers = staffMembers.filter((member) => {
    const firstNameQuery = staffSearchFirstName.trim().toLowerCase();
    const lastNameQuery = staffSearchLastName.trim().toLowerCase();
    const contactQuery = staffSearchContact.trim().toLowerCase();
    const emailQuery = staffSearchEmail.trim().toLowerCase();

    const firstNameMatch = firstNameQuery ? String(member.firstName || '').toLowerCase().includes(firstNameQuery) : true;
    const lastNameMatch = lastNameQuery ? String(member.lastName || '').toLowerCase().includes(lastNameQuery) : true;
    const contactMatch = contactQuery ? String(member.contact || '').toLowerCase().includes(contactQuery) : true;
    const emailMatch = emailQuery ? String(member.email || '').toLowerCase().includes(emailQuery) : true;

    return firstNameMatch && lastNameMatch && contactMatch && emailMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 3rem)' }}>
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Store Operations Hub</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                {storeDataLoading ? 'Loading...' : storeName || 'Pharmacy Store Dashboard'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                Manage staff, inventory, orders, prescriptions, and customer queries from one central control panel.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedSection('inventory')}
                className="rounded-2xl border border-cyan-300/30 bg-cyan-500/20 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
              >
                Manage Inventory
              </button>
              <button
                type="button"
                onClick={() => setSelectedSection('reports')}
                className="rounded-2xl border border-emerald-300/30 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
              >
                View Reports
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-8">
              <p className="text-sm text-slate-500">Store Manager</p>
              <h2 className="text-2xl font-semibold text-slate-900 mt-2">Control Panel</h2>
              <p className="mt-2 text-sm text-slate-600">Select a section to manage your store.</p>
            </div>
            <div className="space-y-3">
              {sectionConfig.map((section) => {
                const Icon = section.icon;
                const active = selectedSection === section.key;
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setSelectedSection(section.key)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${active ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <Icon className={`${active ? 'text-white' : 'text-blue-600'}`} size={20} />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Current View</p>
                  <h1 className="text-2xl font-semibold text-slate-900 capitalize">{sectionConfig.find((item) => item.key === selectedSection)?.label}</h1>
                </div>
              </div>
            </div>

            {selectedSection === 'staff' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Users className="text-indigo-600" size={24} />
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Staff Members</h2>
                      <p className="text-sm text-slate-500">
                        {showStaffForm ? (editingStaffId ? 'Update staff details and save changes.' : 'Add a new staff member.') : 'View all staff, search records, or manage updates.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {!showStaffForm ? (
                      <>
                        <button
                          type="button"
                          onClick={openStaffForm}
                          className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                        >
                          Add Staff Member
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowStaffSearchFields(true)}
                          className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Search Staff
                        </button>
                        {showStaffSearchFields && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowStaffSearchFields(false);
                              setStaffSearchFirstName('');
                              setStaffSearchLastName('');
                              setStaffSearchContact('');
                              setStaffSearchEmail('');
                            }}
                            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Clear Search
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowStaffForm(false);
                          setEditingStaffId(null);
                          setNewStaff({
                            firstName: '',
                            middleName: '',
                            lastName: '',
                            contact: '',
                            email: '',
                            address: '',
                            role: 'Pharmacist',
                          });
                        }}
                        className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Back to Staff List
                      </button>
                    )}
                  </div>
                </div>
                {!showStaffForm ? (
                  <div className="space-y-6">
                    {showStaffSearchFields && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="sr-only" htmlFor="search-firstname">Search by First Name</label>
                          <input
                            id="search-firstname"
                            type="text"
                            value={staffSearchFirstName}
                            onChange={(e) => setStaffSearchFirstName(e.target.value)}
                            placeholder="Search by first name"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="sr-only" htmlFor="search-lastname">Search by Last Name</label>
                          <input
                            id="search-lastname"
                            type="text"
                            value={staffSearchLastName}
                            onChange={(e) => setStaffSearchLastName(e.target.value)}
                            placeholder="Search by last name"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="sr-only" htmlFor="search-contact">Search by Mobile Number</label>
                          <input
                            id="search-contact"
                            type="text"
                            value={staffSearchContact}
                            onChange={(e) => setStaffSearchContact(e.target.value)}
                            placeholder="Search by mobile number"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="sr-only" htmlFor="search-email">Search by Email ID</label>
                          <input
                            id="search-email"
                            type="text"
                            value={staffSearchEmail}
                            onChange={(e) => setStaffSearchEmail(e.target.value)}
                            placeholder="Search by email ID"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-4">
                      {staffLoading ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                          Loading staff members...
                        </div>
                      ) : filteredStaffMembers.length ? (
                        filteredStaffMembers.map((member) => (
                          <div key={member._id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">Name:</span>{' '}
                                {`${member.firstName} ${member.middleName ? `${member.middleName} ` : ''}${member.lastName}`}
                              </p>
                              <p className="text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">Role:</span> {member.role}
                              </p>
                              <p className="text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">Contact Number:</span> {member.contact}
                              </p>
                              <p className="text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">Email ID:</span> {member.email}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleEditStaff(member)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => toggleStaffStatus(member)}
                                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${member.status === 'Active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                              >
                                {member.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => removeStaffMember(member._id)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                              >
                                <Trash2 size={16} /> Remove
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                          No staff members match your search.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <UserPlus className="text-slate-700" size={24} />
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">{editingStaffId ? 'Update Staff Member' : 'Add Staff Member'}</h2>
                        <p className="text-sm text-slate-500">{editingStaffId ? 'Edit the staff member details below.' : 'Fill in the staff details to add a new member.'}</p>
                      </div>
                    </div>
                    <form className="space-y-4" onSubmit={addStaffMember}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">First Name</label>
                          <input
                            name="firstName"
                            value={newStaff.firstName}
                            onChange={handleStaffChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="Enter first name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Middle Name</label>
                          <input
                            name="middleName"
                            value={newStaff.middleName}
                            onChange={handleStaffChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="Enter middle name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Last Name</label>
                          <input
                            name="lastName"
                            value={newStaff.lastName}
                            onChange={handleStaffChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="Enter last name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Contact Number</label>
                          <input
                            name="contact"
                            value={newStaff.contact}
                            onChange={handleStaffChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="Enter contact number"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-700">Email ID</label>
                          <input
                            name="email"
                            type="email"
                            value={newStaff.email}
                            onChange={handleStaffChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="Enter email address"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-700">Address</label>
                          <input
                            name="address"
                            value={newStaff.address}
                            onChange={handleStaffChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="Enter address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Role</label>
                          <select
                            name="role"
                            value={newStaff.role}
                            onChange={handleStaffChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          >
                            <option value="Pharmacist">Pharmacist</option>
                            <option value="Store Assistant">Store Assistant</option>
                            <option value="Inventory Manager">Inventory Manager</option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                      >
                        {editingStaffId ? 'Update Staff Member' : 'Add Staff Member'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowStaffForm(false);
                          setEditingStaffId(null);
                          setNewStaff({
                            firstName: '',
                            middleName: '',
                            lastName: '',
                            contact: '',
                            email: '',
                            address: '',
                            role: 'Pharmacist',
                          });
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {selectedSection === 'inventory' && (
              <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Package className="text-emerald-600" size={24} />
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Inventory Management</h2>
                      <p className="text-sm text-slate-500">Track stock, update quantities, and manage products mapped to your store only.</p>
                    </div>
                  </div>
                  {inventoryLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                      Loading store inventory...
                    </div>
                  ) : inventoryItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                      No medicines in this store inventory yet. Add your first medicine from the panel on the right.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {inventoryItems.map((item) => (
                      <div key={item._id} className="rounded-3xl border border-slate-200 p-4">
                        {editingMedicineId === item._id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Medicine Name</label>
                              <input
                                name="name"
                                value={editMedicine.name}
                                onChange={handleEditMedicineChange}
                                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Manufacturer</label>
                                <input
                                  name="manufacturer"
                                  value={editMedicine.manufacturer}
                                  onChange={handleEditMedicineChange}
                                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Dosage</label>
                                <input
                                  name="dosage"
                                  value={editMedicine.dosage}
                                  onChange={handleEditMedicineChange}
                                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Type</label>
                                <input
                                  name="type"
                                  value={editMedicine.type}
                                  onChange={handleEditMedicineChange}
                                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                  placeholder="Tablet / Syrup / Capsule"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Price</label>
                                <input
                                  name="price"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editMedicine.price}
                                  onChange={handleEditMedicineChange}
                                  className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Stock</label>
                              <input
                                name="stock"
                                type="number"
                                min="0"
                                value={editMedicine.stock}
                                onChange={handleEditMedicineChange}
                                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => saveMedicine(item._id)}
                                disabled={inventorySaving}
                                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                              >
                                {inventorySaving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditMedicine}
                                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <p className="text-sm text-slate-500">{item.manufacturer || 'No manufacturer'}{item.dosage ? ` • ${item.dosage}` : ''}</p>
                                <p className="text-sm text-slate-500">Type: <span className="font-medium text-slate-700">{item.type || 'N/A'}</span> • Price: <span className="font-medium text-slate-700">${Number(item.price || 0).toFixed(2)}</span></p>
                                <p className="text-sm text-slate-500">Stock left: <span className="font-semibold text-slate-900">{item.stock}</span></p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : item.status === 'Out of Stock' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {item.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => updateMedicineStock(item, -1)}
                                disabled={inventorySaving}
                                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => updateMedicineStock(item, 1)}
                                disabled={inventorySaving}
                                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditMedicine(item)}
                                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeInventoryMedicine(item._id)}
                                disabled={inventorySaving}
                                className="inline-flex items-center justify-center gap-1 rounded-2xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200 transition"
                              >
                                <Trash2 size={14} /> Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
                  )}
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Package className="text-slate-700" size={24} />
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Add Medicine</h2>
                      <p className="text-sm text-slate-500">Create new inventory entries quickly.</p>
                    </div>
                  </div>
                  <form className="space-y-4" onSubmit={addMedicine}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Medicine Name</label>
                      <input
                        name="name"
                        value={newMedicine.name}
                        onChange={handleNewMedicineChange}
                        className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="e.g. Paracetamol 500mg"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Manufacturer</label>
                        <input
                          name="manufacturer"
                          value={newMedicine.manufacturer}
                          onChange={handleNewMedicineChange}
                          className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="e.g. ABC Pharma"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Dosage</label>
                        <input
                          name="dosage"
                          value={newMedicine.dosage}
                          onChange={handleNewMedicineChange}
                          className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="e.g. 500mg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Type</label>
                        <input
                          name="type"
                          value={newMedicine.type}
                          onChange={handleNewMedicineChange}
                          className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="Tablet / Syrup / Capsule"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Price</label>
                        <input
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newMedicine.price}
                          onChange={handleNewMedicineChange}
                          className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="e.g. 49.99"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Stock</label>
                      <input
                        name="stock"
                        type="number"
                        min="0"
                        value={newMedicine.stock}
                        onChange={handleNewMedicineChange}
                        className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Enter starting stock"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={inventorySaving}
                      className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                      {inventorySaving ? 'Adding...' : 'Add Medicine'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {selectedSection === 'orders' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="text-sky-600" size={24} />
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Orders</h2>
                      <p className="text-sm text-slate-500">Click any order to view details and tracking status.</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                  <div className="space-y-3">
                    {ordersLoading ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        Loading orders...
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No orders available yet.
                      </div>
                    ) : orders.map((order, index) => {
                      const active = order.id === selectedOrderId;
                      return (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => handleSelectOrder(order.id)}
                          className={`w-full rounded-3xl border p-4 text-left transition ${active ? 'border-sky-500 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${active ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">Order #{order.id}</p>
                                <p className="text-sm text-slate-500">{order.customer}</p>
                              </div>
                            </div>
                            <ChevronRight size={20} className={`transition ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-400">{order.date}</span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getTrackingBadge(order.trackingStatus).pill}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${getTrackingBadge(order.trackingStatus).dot}`} />
                              {order.trackingStatus || 'Order Placed'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div ref={orderDetailsRef} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                    {ordersLoading ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        Loading order details...
                      </div>
                    ) : selectedOrder ? (
                      <>
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Order details</p>
                            <h3 className="text-2xl font-semibold text-slate-900">Order #{selectedOrder.id}</h3>
                            <p className="text-sm text-slate-500">{selectedOrder.customer} • {selectedOrder.date}</p>
                          </div>

                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-3xl bg-white p-4">
                            <p className="text-sm font-medium text-slate-500">Shipping address</p>
                            <p className="mt-3 text-sm text-slate-700">{selectedOrder.address}</p>
                          </div>
                          <div className="rounded-3xl bg-white p-4">
                            <p className="text-sm font-medium text-slate-500">Payment method</p>
                            {(() => {
                              const paymentMeta = getPaymentMethodMeta(selectedOrder.payment);
                              return (
                                <span className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentMeta.className}`}>
                                  {paymentMeta.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="mt-6 rounded-3xl bg-white p-4">
                          <p className="text-sm font-medium text-slate-500">Order items</p>
                          <div className="mt-4 space-y-3">
                            {selectedOrder.items.map((item, index) => (
                              <div key={item.id || `${item.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                                <div>
                                  <p className="font-medium text-slate-900">{item.name}</p>
                                  <p className="text-sm text-slate-500">Qty {item.qty}</p>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{formatUSD(parseCurrencyAmount(item.price))}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                            <p className="font-semibold text-slate-900">Order total</p>
                            <p className="font-semibold text-slate-900">{formatUSD(parseCurrencyAmount(selectedOrder.total))}</p>
                          </div>
                        </div>
                        <div className="mt-6 rounded-3xl bg-white p-4">
                          <p className="text-sm font-medium text-slate-500">Update order tracking</p>
                          <div className="mt-4 space-y-2">
                            {getAvailableTrackingStatuses().map((status) => (
                              (() => {
                                const statuses = getAvailableTrackingStatuses();
                                const currentIndex = getCurrentTrackingStatusIndex();
                                const statusIndex = statuses.indexOf(status);
                                const isCurrent = status === (selectedOrder.trackingStatus || 'Order Placed');
                                const isBackward = currentIndex !== -1 && statusIndex < currentIndex;
                                const isDisabled = updatingTrackingStatus || isCurrent || isBackward;
                                return (
                              <button
                                key={status}
                                onClick={() => handleUpdateTrackingStatus(status)}
                                disabled={isDisabled}
                                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                                  isCurrent
                                    ? 'border-green-500 bg-green-50 text-green-700 font-semibold cursor-not-allowed'
                                    : isBackward
                                    ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                    : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 disabled:opacity-50'
                                }`}
                              >
                                {isCurrent ? '✓ ' : ''}{status}
                              </button>
                                );
                              })()
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        Select an order from the left to view details and tracking.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedSection === 'prescription' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="text-yellow-600" size={24} />
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Prescription Requests</h2>
                      <p className="text-sm text-slate-500">Review attachments and approve or reject each request.</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                  <div className="space-y-3">
                    {prescriptionsLoading ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        Loading prescription requests...
                      </div>
                    ) : prescriptions.length === 0 ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No prescription requests yet.
                      </div>
                    ) : prescriptions.map((prescription, index) => {
                      const active = prescription._id === selectedPrescriptionId;
                      const normalizedStatus = String(prescription.status || 'pending').toLowerCase();
                      return (
                        <button
                          key={prescription._id}
                          type="button"
                          onClick={() => setSelectedPrescriptionId(prescription._id)}
                          className={`w-full rounded-3xl border p-4 text-left transition ${active ? 'border-yellow-500 bg-yellow-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${active ? 'bg-yellow-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">{prescription.userId?.name || 'Unknown User'}</p>
                                <p className="text-sm text-slate-500">{prescription.fileName}</p>
                              </div>
                            </div>
                            <ChevronRight size={20} className={`transition ${active ? 'text-yellow-600' : 'text-slate-400'}`} />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                            <span>{formatShortDate(prescription.createdAt)}</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${normalizedStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : normalizedStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    {selectedPrescription ? (
                      <>
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Review Prescription</p>
                            <h3 className="text-2xl font-semibold text-slate-900">{selectedPrescription.userId?.name || 'Unknown User'}</h3>
                            <p className="text-sm text-slate-500">{selectedPrescription.userId?.email || 'No email available'}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${selectedPrescription.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedPrescription.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {selectedPrescription.status?.charAt(0).toUpperCase() + selectedPrescription.status?.slice(1)}
                          </span>
                        </div>
                        {selectedPrescription.filePath && String(selectedPrescription.status || '').toLowerCase() === 'pending' && (
                          <div className="rounded-3xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-slate-800">Attachment</p>
                                <p className="text-sm text-slate-500">{selectedPrescription.fileName}</p>
                              </div>
                            </div>
                            <div className="mt-4">
                              {String(selectedPrescription.mimeType || '').startsWith('image/') ? (
                                <img
                                  src={`${baseURL.replace('/api', '')}/${selectedPrescription.filePath.replace(/\\/g, '/')}`}
                                  alt={selectedPrescription.fileName}
                                  className="w-full rounded-3xl border border-slate-200 object-contain"
                                />
                              ) : selectedPrescription.mimeType === 'application/pdf' ? (
                                <div className="overflow-hidden rounded-3xl border border-slate-200">
                                  <object data={`${baseURL.replace('/api', '')}/${selectedPrescription.filePath.replace(/\\/g, '/')}`} type="application/pdf" width="100%" height="320">
                                    <div className="p-4 text-sm text-slate-500">
                                      PDF preview not available.{' '}
                                      <a href={`${baseURL.replace('/api', '')}/${selectedPrescription.filePath.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                                        Open document
                                      </a>
                                    </div>
                                  </object>
                                </div>
                              ) : (
                                <a href={`${baseURL.replace('/api', '')}/${selectedPrescription.filePath.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                  View attachment
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        {String(selectedPrescription.status || '').toLowerCase() === 'pending' ? (
                          <div className="mt-6 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => updatePrescriptionStatus(selectedPrescription._id, 'Approved')}
                              disabled={selectedPrescription.status === 'approved'}
                              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                            >
                              <CheckCircle2 size={18} /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePrescriptionStatus(selectedPrescription._id, 'Rejected')}
                              disabled={selectedPrescription.status === 'rejected'}
                              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition"
                            >
                              <XCircle size={18} /> Reject
                            </button>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        Select a prescription request from the left to review the attachment.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedSection === 'queries' && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
                  {/* Queries List */}
                  <div className="border-r border-slate-200 p-6 max-h-[600px] overflow-y-auto">
                    <p className="mb-4 text-sm font-medium text-slate-500">Patient Queries ({queries.length})</p>
                    {queriesLoading ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                        Loading queries...
                      </div>
                    ) : (
                    <div className="space-y-2">
                      {queries.map((q) => {
                        const active = selectedQueryId === q._id;
                        const patientName = q.userId?.name || 'Unknown Patient';
                        const normalizedStatus = String(q.status || 'open').toLowerCase();
                        const isAnswered = normalizedStatus === 'resolved';
                        return (
                          <button
                            key={q._id}
                            onClick={() => { setSelectedQueryId(q._id); setAnswerText(q.answer || ''); }}
                            className={`w-full rounded-2xl border p-3.5 text-left transition ${
                              active
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="text-sm font-semibold text-slate-800 truncate">{patientName}</p>
                              <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                isAnswered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {isAnswered ? 'Answered' : 'Pending'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{q.subject}</p>
                            <p className="mt-1 text-xs text-slate-600 line-clamp-2">{q.message}</p>
                          </button>
                        );
                      })}
                    </div>
                    )}
                  </div>

                  {/* Query Detail & Answer */}
                  <div className="p-6">
                    {selectedQuery ? (
                      <div>
                        <div className="mb-6 flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">{selectedQuery.userId?.name || 'Unknown Patient'}</h3>
                            <p className="text-sm text-slate-500">{selectedQuery.userId?.email || 'No email available'}</p>
                            <p className="mt-2 text-xs text-slate-400">Query Date: {formatShortDate(selectedQuery.createdAt)}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                            selectedQuery.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {selectedQuery.status === 'resolved' ? 'Answered' : 'Pending'}
                          </span>
                        </div>

                        {/* Query Content */}
                        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-700 mb-2">{selectedQuery.subject}</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{selectedQuery.message}</p>
                        </div>

                        {/* Answer Section */}
                        {selectedQuery.status === 'resolved' && selectedQuery.answer ? (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
                            <p className="text-sm font-semibold text-emerald-900 mb-2">Your Answer</p>
                            <p className="text-sm text-emerald-800">{selectedQuery.answer}</p>
                          </div>
                        ) : (
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Write Your Answer <span className="text-red-500">*</span></label>
                            <textarea
                              value={answerText}
                              onChange={(e) => setAnswerText(e.target.value)}
                              rows={5}
                              placeholder="Provide a helpful response to the patient's query..."
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 resize-none"
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        {selectedQuery.status !== 'resolved' && (
                          <button
                            onClick={() => handleSubmitAnswer(selectedQuery._id)}
                            disabled={!answerText.trim() || answerSubmitting}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send size={18} /> {answerSubmitting ? 'Submitting...' : 'Submit Answer'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <p className="text-sm text-slate-500">Select a query from the left to view and respond.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedSection === 'reports' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="text-slate-700" size={24} />
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
                    <p className="text-sm text-slate-500">Store revenue and order performance.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Monthly Revenue</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{formatUSD(revenueSummary.monthly)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Weekly Revenue</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{formatUSD(revenueSummary.weekly)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Today&apos;s Revenue</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{formatUSD(revenueSummary.revenueToday)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Growth</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{revenueSummary.growth}%</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Total Order Revenue</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{formatUSD(reportTotalRevenue)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Average Order Value</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{formatUSD(reportAverageOrderValue)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Order Completion Rate</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{reportCompletionRate}%</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Operational Snapshot</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{reportCompletedOrders}/{reportOrdersTotal} completed</p>
                    <p className="text-sm text-slate-600">{reportPendingOrders} pending • {reportUniqueCustomers} unique customers</p>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === 'importPatients' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <FileUp className="text-blue-600" size={24} />
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Import Patients</h2>
                    <p className="text-sm text-slate-500">Upload a CSV file to import patient records.</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <label className="block text-sm font-medium text-slate-700">Upload Patients CSV</label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handlePatientsCsvUpload}
                    className="mt-3 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                  <p className="mt-3 text-sm text-slate-500">Supported format: `.csv`</p>
                  {patientsCsvFile && (
                    <p className="mt-2 text-sm font-medium text-slate-700">Selected file: {patientsCsvFile.name}</p>
                  )}
                  {csvUploadMessage && (
                    <p className={`mt-2 text-sm font-medium ${csvUploadMessage.toLowerCase().includes('failed') || csvUploadMessage.toLowerCase().includes('please') ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {csvUploadMessage}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleImportPatientsCsv}
                    disabled={!patientsCsvFile || csvImporting}
                    className="mt-4 inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {csvImporting ? 'Importing Patients...' : 'Import Patients'}
                  </button>

                  {csvImportSummary && (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <h3 className="text-sm font-semibold text-slate-900">Import Summary</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Total Rows</p>
                          <p className="text-lg font-semibold text-slate-900">{csvImportSummary.totalRows || 0}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-700">Created</p>
                          <p className="text-lg font-semibold text-emerald-800">{csvImportSummary.created || 0}</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-3">
                          <p className="text-xs text-amber-700">Skipped</p>
                          <p className="text-lg font-semibold text-amber-800">{csvImportSummary.skipped || 0}</p>
                        </div>
                      </div>

                      {Array.isArray(csvImportSummary.errors) && csvImportSummary.errors.length > 0 && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs font-semibold text-amber-800">Skipped Row Details</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900">
                            {csvImportSummary.errors.slice(0, 6).map((err, index) => (
                              <li key={`${err}-${index}`}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        <footer className="mt-10 rounded-3xl border border-teal-900/40 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">MedVision Store Dashboard</p>
              <p className="text-xs text-slate-300">Secure operations for pharmacy teams, inventory, and order fulfillment.</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-teal-200">
              <span>Support: support@medvision.store</span>
              <span className="hidden sm:inline text-teal-400">|</span>
              <span>Mon-Sat, 9:00 AM - 7:00 PM</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StoreDashboard;
