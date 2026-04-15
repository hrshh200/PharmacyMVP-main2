import { useEffect, useMemo, useRef, useState } from 'react';
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
  Star,
  ShieldCheck,
  Receipt,
  Building2,
  CalendarCheck2,
  UserCheck,
  GraduationCap,
  Landmark,
  ScanLine,
  Camera,
  CameraOff,
  BadgePercent,
  Plus,
  Home,
  AlertCircle,
  TrendingUp,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';

const StoreDashboard = () => {
  const [selectedSection, setSelectedSection] = useState('home');
  const [dashboardAccessRole, setDashboardAccessRole] = useState('Store Admin');
  const [storeName, setStoreName] = useState('');
  const [storeProfile, setStoreProfile] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    countryCode: '+91',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [isEditingStoreProfile, setIsEditingStoreProfile] = useState(false);
  const [storeProfileDraft, setStoreProfileDraft] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    countryCode: '+91',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [storeProfileSaving, setStoreProfileSaving] = useState(false);
  const [loggedInAccount, setLoggedInAccount] = useState({
    staffId: '',
    name: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contact: '',
    address: '',
    role: '',
    status: '',
  });
  const [isEditingStaffProfile, setIsEditingStaffProfile] = useState(false);
  const [staffProfileDraft, setStaffProfileDraft] = useState({
    staffId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contact: '',
    address: '',
    role: 'Pharmacist',
    loginPassword: '',
  });
  const [staffProfileSaving, setStaffProfileSaving] = useState(false);
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
    loginPassword: '',
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
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [barcodeLastCode, setBarcodeLastCode] = useState('');
  const [barcodeMatchedItemId, setBarcodeMatchedItemId] = useState('');
  const [barcodeActionQty, setBarcodeActionQty] = useState('1');
  const barcodeVideoRef = useRef(null);
  const barcodeStreamRef = useRef(null);
  const barcodeRafRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderFilter, setSelectedOrderFilter] = useState('all');
  const [updatingTrackingStatus, setUpdatingTrackingStatus] = useState(false);
  const orderDetailsRef = useRef(null);
  const normalizeOrderStatusKey = (order) => {
    const normalizedStatus = String(order?.trackingStatus || order?.status || '').toLowerCase();

    if (normalizedStatus.includes('out for delivery')) return 'outForDelivery';
    if (normalizedStatus.includes('order placed') || normalizedStatus.includes('booked') || normalizedStatus.includes('pending')) return 'booked';
    if (normalizedStatus.includes('packed')) return 'packed';
    if (normalizedStatus.includes('ready for pick up') || normalizedStatus.includes('picked up')) return 'pickup';
    if (normalizedStatus.includes('delivered') || normalizedStatus.includes('completed')) return 'delivered';

    return 'other';
  };
  const orderFilterConfig = [
    { key: 'all', label: 'All Orders' },
    { key: 'packed', label: 'Packed' },
    { key: 'outForDelivery', label: 'Out for Delivery' },
    { key: 'pickup', label: 'Pick Up' },
    { key: 'delivered', label: 'Delivered' },
  ];
  const orderStatusCounts = orders.reduce(
    (acc, order) => {
      const key = normalizeOrderStatusKey(order);
      acc.all += 1;
      if (Object.prototype.hasOwnProperty.call(acc, key)) {
        acc[key] += 1;
      }
      return acc;
    },
    { all: 0, booked: 0, packed: 0, outForDelivery: 0, pickup: 0, delivered: 0 }
  );
  const filteredOrders = selectedOrderFilter === 'all'
    ? orders
    : orders.filter((order) => normalizeOrderStatusKey(order) === selectedOrderFilter);
  const selectedOrder = filteredOrders.find((item) => item.id === selectedOrderId);
  const parseCurrencyAmount = (value) => Number(String(value).replace(/[^\d.]/g, '')) || 0;
  const formatUSD = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  const isCompletedOrder = (order) => {
    const normalizedStatus = String(order?.status || '').toLowerCase();
    const normalizedTracking = String(order?.trackingStatus || '').toLowerCase();

    return ['completed', 'delivered'].includes(normalizedStatus)
      || normalizedTracking.includes('delivered')
      || normalizedTracking.includes('picked up')
      || normalizedTracking.includes('ready for pick up');
  };
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
  const resolveFileUrl = (filePath) => {
    const value = String(filePath || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `${baseURL.replace('/api', '')}/${value.replace(/\\/g, '/')}`;
  };
  const reportOrdersTotal = orders.length;
  const reportCompletedOrders = orders.filter((order) => isCompletedOrder(order)).length;
  const reportPendingOrders = orders.filter((order) => !isCompletedOrder(order)).length;
  const reportTotalRevenue = orders.reduce((sum, order) => sum + parseCurrencyAmount(order.total), 0);
  const reportAverageOrderValue = reportOrdersTotal ? reportTotalRevenue / reportOrdersTotal : 0;
  const reportUniqueCustomers = new Set(orders.map((order) => order.customer)).size;
  const reportCompletionRate = reportOrdersTotal ? Math.round((reportCompletedOrders / reportOrdersTotal) * 100) : 0;

  // Calculate dynamic revenue summary from orders
  const calculateRevenueSummary = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today && orderDate <= now;
    });
    const weekOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= weekAgo && orderDate <= now;
    });
    const monthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= monthStart && orderDate <= now;
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
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrdersCount = orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= todayStart;
  }).length;

  const monthWiseRevenue = (() => {
    const map = new Map();

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      if (Number.isNaN(orderDate.getTime())) return;

      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const orderRevenue = Number(order.totalPrice) || parseCurrencyAmount(order.total);

      if (!map.has(monthKey)) {
        map.set(monthKey, { key: monthKey, label: monthLabel, revenue: 0, orders: 0 });
      }

      const bucket = map.get(monthKey);
      bucket.revenue += orderRevenue;
      bucket.orders += 1;
    });

    return Array.from(map.values())
      .sort((a, b) => b.key.localeCompare(a.key))
      .slice(0, 6);
  })();

  const maxMonthRevenue = monthWiseRevenue.reduce((max, item) => Math.max(max, item.revenue), 0);

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);

    if (window.innerWidth < 1024) {
      requestAnimationFrame(() => {
        orderDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };
  const mainContentRef = useRef(null);

  const handleSelectSection = (sectionKey) => {
    setSelectedSection(sectionKey);

    requestAnimationFrame(() => {
      mainContentRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptionStatusFilter, setPrescriptionStatusFilter] = useState('all');
  const [showPendingReviewWorkspace, setShowPendingReviewWorkspace] = useState(false);
  const [prescriptionReviewerFilter, setPrescriptionReviewerFilter] = useState('all');
  const [reviewerSearchQuery, setReviewerSearchQuery] = useState('');
  const PRESCRIPTION_MED_SEARCH_MIN_CHARS = 3;
  const normalizeMedicineSearchValue = (value) => String(value || '').trim().toLowerCase();
  const createEmptyApprovalItem = () => ({
    medicineId: '',
    name: '',
    quantity: '1',
    unit: 'tablet',
    unitPrice: '0',
    instructions: '',
    substitutionReason: '',
  });
  const [approvalItems, setApprovalItems] = useState([]);
  const [approvalReviewNotes, setApprovalReviewNotes] = useState('');
  const [showApprovalItemsSection, setShowApprovalItemsSection] = useState(false);
  const [expandedSectionGroup, setExpandedSectionGroup] = useState('');
  const [dashboardRefreshing, setDashboardRefreshing] = useState(false);
  const [approvalTotalsDraft, setApprovalTotalsDraft] = useState({
    subtotal: '0',
    discount: '0',
    tax: '0',
    deliveryCharge: '0',
    grandTotal: '0',
    currency: 'INR',
    quoteExpiresInHours: '24',
  });
  const prescriptionMedicineOptions = useMemo(
    () => (inventoryItems || [])
      .map((medicine) => ({
        id: String(medicine._id || ''),
        name: String(medicine.name || '').trim(),
        manufacturer: String(medicine.manufacturer || '').trim(),
        dosage: String(medicine.dosage || '').trim(),
        type: String(medicine.type || '').trim(),
        price: Number(medicine.price) || 0,
      }))
      .filter((medicine) => medicine.id && medicine.name),
    [inventoryItems]
  );

  const getPrescriptionMedicineSuggestions = (query) => {
    const normalizedQuery = normalizeMedicineSearchValue(query);
    if (normalizedQuery.length < PRESCRIPTION_MED_SEARCH_MIN_CHARS) return [];

    return prescriptionMedicineOptions
      .filter((medicine) => {
        const normalizedName = normalizeMedicineSearchValue(medicine.name);
        const normalizedManufacturer = normalizeMedicineSearchValue(medicine.manufacturer);
        const normalizedDosage = normalizeMedicineSearchValue(medicine.dosage);
        return normalizedName.includes(normalizedQuery)
          || normalizedManufacturer.includes(normalizedQuery)
          || normalizedDosage.includes(normalizedQuery);
      })
      .slice(0, 8);
  };
  const selectedPrescription = prescriptions.find((item) => item._id === selectedPrescriptionId);
  const selectedPrescriptionStatus = String(selectedPrescription?.status || 'pending').toLowerCase();
  const selectedPendingPrescription = selectedPrescriptionStatus === 'pending' ? selectedPrescription : null;
  const reviewerSearchNormalized = String(reviewerSearchQuery || '').trim().toLowerCase();
  const filteredPrescriptions = prescriptions.filter((item) => {
    const status = String(item.status || 'pending').toLowerCase();
    if (prescriptionStatusFilter !== 'all' && status !== prescriptionStatusFilter) {
      return false;
    }

    const reviewerName = String(item.reviewedByName || 'Store Admin').trim();
    if (prescriptionReviewerFilter !== 'all' && reviewerName !== prescriptionReviewerFilter) {
      return false;
    }

    if (!reviewerSearchNormalized) {
      return true;
    }

    return reviewerName.toLowerCase().includes(reviewerSearchNormalized);
  });
  const selectedPrescriptionFileUrl = resolveFileUrl(selectedPrescription?.filePath);
  const normalizePrescriptionStatus = (value) => String(value || '').trim().toLowerCase();
  const isToday = (value) => {
    if (!value) return false;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    const now = new Date();
    return parsed.getFullYear() === now.getFullYear()
      && parsed.getMonth() === now.getMonth()
      && parsed.getDate() === now.getDate();
  };
  const todayOrders = orders.filter((order) => isToday(order.createdAt || order.updatedAt));
  const todayOrderCount = todayOrders.length;
  const todayRevenue = todayOrders.reduce((sum, order) => {
    const amount = Number(order.grandTotal ?? order.totalPrice ?? order.total ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const pendingPrescriptionCount = prescriptions.filter((p) => normalizePrescriptionStatus(p.status) === 'pending').length;
  const approvedPrescriptionCount = prescriptions.filter((p) => normalizePrescriptionStatus(p.status) === 'approved').length;
  const reviewedPrescriptionCount = prescriptions.filter((p) => {
    const status = normalizePrescriptionStatus(p.status);
    return status === 'approved' || status === 'rejected';
  }).length;
  const rejectedPrescriptionCount = prescriptions.filter((p) => normalizePrescriptionStatus(p.status) === 'rejected').length;
  const approvalRate = reviewedPrescriptionCount > 0
    ? Math.round((approvedPrescriptionCount / reviewedPrescriptionCount) * 100)
    : 0;
  const approvedTodayCount = prescriptions.filter((p) => {
    return normalizePrescriptionStatus(p.status) === 'approved' && isToday(p.reviewedAt || p.updatedAt);
  }).length;
  const rejectedTodayCount = prescriptions.filter((p) => {
    return normalizePrescriptionStatus(p.status) === 'rejected' && isToday(p.reviewedAt || p.updatedAt);
  }).length;
  const pendingOver24hCount = prescriptions.filter((p) => {
    if (normalizePrescriptionStatus(p.status) !== 'pending') return false;
    const createdAt = new Date(p.createdAt || p.updatedAt || Date.now());
    return Date.now() - createdAt.getTime() >= 24 * 60 * 60 * 1000;
  }).length;
  const avgReviewHours = reviewedPrescriptionCount
    ? (prescriptions
      .filter((p) => {
        const status = normalizePrescriptionStatus(p.status);
        return (status === 'approved' || status === 'rejected') && p.createdAt && p.reviewedAt;
      })
      .reduce((sum, p) => {
        const createdAt = new Date(p.createdAt).getTime();
        const reviewedAt = new Date(p.reviewedAt).getTime();
        if (Number.isNaN(createdAt) || Number.isNaN(reviewedAt) || reviewedAt < createdAt) return sum;
        return sum + ((reviewedAt - createdAt) / (1000 * 60 * 60));
      }, 0) / reviewedPrescriptionCount)
    : 0;
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
  const [storeReviews, setStoreReviews] = useState([]);
  const [storeReviewsLoading, setStoreReviewsLoading] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [reviewReplyText, setReviewReplyText] = useState('');
  const [reviewReplySubmitting, setReviewReplySubmitting] = useState(false);
  const selectedStoreReview = storeReviews.find((item) => item._id === selectedReviewId);

  const approvalCalculatedSubtotal = approvalItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + (qty * unitPrice);
  }, 0);
  const approvalItemErrors = approvalItems.map((item) => {
    const name = String(item?.name || '').trim();
    const quantity = Number(item?.quantity);
    const unitPrice = Number(item?.unitPrice);

    return {
      name: !name,
      quantity: !Number.isFinite(quantity) || quantity <= 0,
      unitPrice: !Number.isFinite(unitPrice) || unitPrice < 0,
    };
  });
  const hasApprovalItemErrors = approvalItemErrors.some((row) => row.name || row.quantity || row.unitPrice);
  const canApprovePrescription = Boolean(selectedPendingPrescription)
    && approvalItems.length > 0
    && !hasApprovalItemErrors;
  const approvalSubtotal = Math.max(0, Number(approvalTotalsDraft.subtotal) || 0);
  const approvalDiscount = Math.max(0, Number(approvalTotalsDraft.discount) || 0);
  const approvalTax = Math.max(0, Number(approvalTotalsDraft.tax) || 0);
  const approvalDeliveryCharge = Math.max(0, Number(approvalTotalsDraft.deliveryCharge) || 0);
  const approvalCalculatedGrandTotal = Math.max(0, approvalCalculatedSubtotal - approvalDiscount + approvalTax + approvalDeliveryCharge);
  const approvalGrandTotal = Math.max(0, Number(approvalTotalsDraft.grandTotal) || 0);

  const [staffPermissions, setStaffPermissions] = useState([]);
  const [staffOpsLoading, setStaffOpsLoading] = useState(false);
  const [performanceRecords, setPerformanceRecords] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [newPerformance, setNewPerformance] = useState({
    staffId: '',
    periodStart: '',
    periodEnd: '',
    ordersProcessed: '',
    prescriptionsReviewed: '',
    avgFulfillmentMinutes: '',
    attendanceScore: '',
    customerRating: '',
    notes: '',
  });
  const [newAttendance, setNewAttendance] = useState({
    staffId: '',
    date: '',
    shiftType: 'Morning',
    shiftStart: '',
    shiftEnd: '',
    status: 'Present',
    notes: '',
  });
  const [newTraining, setNewTraining] = useState({
    staffId: '',
    title: '',
    moduleType: 'Certification',
    score: '',
    maxScore: '100',
    validTill: '',
    notes: '',
  });

  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceItems, setComplianceItems] = useState([]);
  const [complianceReminders, setComplianceReminders] = useState({ overdue: [], upcoming: [] });
  const [newComplianceItem, setNewComplianceItem] = useState({
    itemType: 'Drug License',
    title: '',
    dueDate: '',
    priority: 'Medium',
    reminderDaysBefore: '7',
    notes: '',
  });

  const [financeLoading, setFinanceLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoiceSummary, setInvoiceSummary] = useState({ totalInvoices: 0, grossSales: 0, outstanding: 0 });
  const [reconciliationSummary, setReconciliationSummary] = useState(null);
  const [profitSummary, setProfitSummary] = useState(null);
  const [profitByCategory, setProfitByCategory] = useState([]);
  const [taxSummary, setTaxSummary] = useState(null);
  const [taxBreakdown, setTaxBreakdown] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    customerName: '',
    customerGstNumber: '',
    gstRateDefault: '5',
    discount: '0',
    paymentMethod: 'UPI',
    initialPaidAmount: '0',
    paymentReference: '',
    itemsText: '',
  });
  const [paymentUpdate, setPaymentUpdate] = useState({
    invoiceId: '',
    amount: '',
    method: 'UPI',
    reference: '',
  });
  const [suppliers, setSuppliers] = useState([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    mobile: '',
    email: '',
    gstNumber: '',
    paymentTermsDays: '30',
    creditLimit: '0',
    outstandingAmount: '0',
    notes: '',
  });
  const [supplierPaymentDraft, setSupplierPaymentDraft] = useState({});
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    campaignType: 'Offer',
    title: '',
    description: '',
    couponCode: '',
    discountType: 'Percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    autoApply: false,
    usageLimit: '',
    validFrom: '',
    validTill: '',
    status: 'Active',
    targetScope: 'All',
    targetValue: '',
    bulkMinQuantity: '',
    bulkBuyQuantity: '',
    bulkGetQuantity: '',
  });

  const formatShortDate = (value) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  };

  const authConfig = () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return null;
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const parseInvoiceItems = (itemsText) => {
    return String(itemsText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, quantity, unitPrice, gstRate, costPrice, category] = line.split(',').map((item) => item?.trim() || '');
        return {
          name,
          quantity: Number(quantity) || 1,
          unitPrice: Number(unitPrice) || 0,
          gstRate: Number(gstRate) || 0,
          costPrice: Number(costPrice) || 0,
          category: category || 'General',
        };
      })
      .filter((item) => item.name && item.unitPrice >= 0);
  };

  const loadFinance = async () => {
    const config = authConfig();
    if (!config) return;
    try {
      setFinanceLoading(true);
      const [invoiceRes, reconciliationRes, profitRes, taxRes] = await Promise.all([
        axios.get(`${baseURL}/finance/invoices`, config),
        axios.get(`${baseURL}/finance/reconciliation`, config),
        axios.get(`${baseURL}/finance/profit-margin`, config),
        axios.get(`${baseURL}/finance/tax-report`, config),
      ]);
      setInvoices(invoiceRes.data?.invoices || []);
      setInvoiceSummary(invoiceRes.data?.summary || { totalInvoices: 0, grossSales: 0, outstanding: 0 });
      setReconciliationSummary(reconciliationRes.data?.summary || null);
      setProfitSummary(profitRes.data?.summary || null);
      setProfitByCategory(profitRes.data?.byCategory || []);
      setTaxSummary(taxRes.data?.summary || null);
      setTaxBreakdown(taxRes.data?.gstBreakdown || []);
    } catch (error) {
      console.error('Failed to load finance data:', error.message);
      setInvoices([]);
      setInvoiceSummary({ totalInvoices: 0, grossSales: 0, outstanding: 0 });
      setReconciliationSummary(null);
      setProfitSummary(null);
      setProfitByCategory([]);
      setTaxSummary(null);
      setTaxBreakdown([]);
    } finally {
      setFinanceLoading(false);
    }
  };

  const loadSuppliers = async () => {
    const config = authConfig();
    if (!config) return;
    try {
      setSupplierLoading(true);
      const response = await axios.get(`${baseURL}/suppliers`, config);
      setSuppliers(response.data?.suppliers || []);
    } catch (error) {
      console.error('Failed to load suppliers:', error.message);
      setSuppliers([]);
    } finally {
      setSupplierLoading(false);
    }
  };

  const loadPromotionalCampaigns = async () => {
    const config = authConfig();
    if (!config) return;
    try {
      setCampaignsLoading(true);
      const response = await axios.get(`${baseURL}/marketing/campaigns`, config);
      setCampaigns(response.data?.campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error.message);
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const submitPromotionalCampaign = async (event) => {
    event.preventDefault();
    const config = authConfig();
    if (!config) return;

    try {
      await axios.post(`${baseURL}/marketing/campaigns`, {
        campaignType: newCampaign.campaignType,
        title: newCampaign.title,
        description: newCampaign.description,
        couponCode: newCampaign.campaignType === 'Coupon' ? newCampaign.couponCode : '',
        discountType: newCampaign.discountType,
        discountValue: Number(newCampaign.discountValue) || 0,
        minOrderAmount: Number(newCampaign.minOrderAmount) || 0,
        maxDiscountAmount: Number(newCampaign.maxDiscountAmount) || 0,
        autoApply: Boolean(newCampaign.autoApply),
        usageLimit: Number(newCampaign.usageLimit) || 0,
        validFrom: newCampaign.validFrom || undefined,
        validTill: newCampaign.validTill || undefined,
        status: newCampaign.status,
        targetScope: newCampaign.targetScope,
        targetValue: newCampaign.targetValue,
        bulkDiscount: {
          minQuantity: Number(newCampaign.bulkMinQuantity) || 0,
          buyQuantity: Number(newCampaign.bulkBuyQuantity) || 0,
          getQuantity: Number(newCampaign.bulkGetQuantity) || 0,
        },
      }, config);

      toast.success('Promotional campaign created');
      setNewCampaign({
        campaignType: 'Offer',
        title: '',
        description: '',
        couponCode: '',
        discountType: 'Percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        autoApply: false,
        usageLimit: '',
        validFrom: '',
        validTill: '',
        status: 'Active',
        targetScope: 'All',
        targetValue: '',
        bulkMinQuantity: '',
        bulkBuyQuantity: '',
        bulkGetQuantity: '',
      });
      setShowCampaignForm(false);
      loadPromotionalCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create promotional campaign');
    }
  };

  const updateCampaignStatus = async (campaignId, status) => {
    const config = authConfig();
    if (!config) return;
    try {
      await axios.patch(`${baseURL}/marketing/campaigns/${campaignId}/status`, { status }, config);
      toast.success('Campaign status updated');
      loadPromotionalCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update campaign status');
    }
  };

  const deleteCampaign = async (campaignId) => {
    const config = authConfig();
    if (!config) return;
    try {
      await axios.delete(`${baseURL}/marketing/campaigns/${campaignId}`, config);
      toast.success('Campaign deleted');
      loadPromotionalCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const submitPerformanceRecord = async (event) => {
    event.preventDefault();
    const config = authConfig();
    if (!config) return;

    try {
      await axios.post(`${baseURL}/staff/performance`, {
        ...newPerformance,
        ordersProcessed: Number(newPerformance.ordersProcessed) || 0,
        prescriptionsReviewed: Number(newPerformance.prescriptionsReviewed) || 0,
        avgFulfillmentMinutes: Number(newPerformance.avgFulfillmentMinutes) || 0,
        attendanceScore: Number(newPerformance.attendanceScore) || 0,
        customerRating: Number(newPerformance.customerRating) || 0,
      }, config);
      toast.success('Performance record saved');
      setNewPerformance({
        staffId: '',
        periodStart: '',
        periodEnd: '',
        ordersProcessed: '',
        prescriptionsReviewed: '',
        avgFulfillmentMinutes: '',
        attendanceScore: '',
        customerRating: '',
        notes: '',
      });
      loadStaffOperations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save performance record');
    }
  };

  const submitAttendanceRecord = async (event) => {
    event.preventDefault();
    const config = authConfig();
    if (!config) return;

    try {
      await axios.post(`${baseURL}/staff/attendance`, newAttendance, config);
      toast.success('Attendance record saved');
      setNewAttendance({
        staffId: '',
        date: '',
        shiftType: 'Morning',
        shiftStart: '',
        shiftEnd: '',
        status: 'Present',
        notes: '',
      });
      loadStaffOperations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance record');
    }
  };

  const markAttendance = async (attendanceId, action) => {
    const config = authConfig();
    if (!config) return;
    try {
      await axios.patch(`${baseURL}/staff/attendance/${attendanceId}/${action}`, {}, config);
      toast.success(action === 'check-in' ? 'Check-in recorded' : 'Check-out recorded');
      loadStaffOperations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update attendance');
    }
  };

  const submitTrainingRecord = async (event) => {
    event.preventDefault();
    const config = authConfig();
    if (!config) return;
    try {
      await axios.post(`${baseURL}/staff/training`, {
        ...newTraining,
        score: Number(newTraining.score) || 0,
        maxScore: Number(newTraining.maxScore) || 100,
      }, config);
      toast.success('Training record added');
      setNewTraining({
        staffId: '',
        title: '',
        moduleType: 'Certification',
        score: '',
        maxScore: '100',
        validTill: '',
        notes: '',
      });
      loadStaffOperations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add training record');
    }
  };

  const submitComplianceItem = async (event) => {
    event.preventDefault();
    const config = authConfig();
    if (!config) return;
    try {
      await axios.post(`${baseURL}/compliance/checklist`, {
        ...newComplianceItem,
        reminderDaysBefore: Number(newComplianceItem.reminderDaysBefore) || 0,
      }, config);
      toast.success('Compliance item created');
      setNewComplianceItem({
        itemType: 'Drug License',
        title: '',
        dueDate: '',
        priority: 'Medium',
        reminderDaysBefore: '7',
        notes: '',
      });
      loadCompliance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create compliance item');
    }
  };

  const markComplianceCompleted = async (itemId) => {
    const config = authConfig();
    if (!config) return;
    try {
      await axios.put(`${baseURL}/compliance/checklist/${itemId}`, {
        status: 'Completed',
        lastCompletedAt: new Date().toISOString(),
      }, config);
      toast.success('Compliance item marked completed');
      loadCompliance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update compliance item');
    }
  };

  const submitInvoice = async (event) => {
    event.preventDefault();
    const config = authConfig();
    if (!config) return;
    try {
      const items = parseInvoiceItems(newInvoice.itemsText);
      if (!items.length) {
        toast.error('Add at least one invoice line in items');
        return;
      }
      await axios.post(`${baseURL}/finance/invoices`, {
        ...newInvoice,
        gstRateDefault: Number(newInvoice.gstRateDefault) || 0,
        discount: Number(newInvoice.discount) || 0,
        initialPaidAmount: Number(newInvoice.initialPaidAmount) || 0,
        items,
      }, config);
      toast.success('Invoice generated');
      setNewInvoice({
        customerName: '',
        customerGstNumber: '',
        gstRateDefault: '5',
        discount: '0',
        paymentMethod: 'UPI',
        initialPaidAmount: '0',
        paymentReference: '',
        itemsText: '',
      });
      loadFinance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const submitInvoicePayment = async (event) => {
    event.preventDefault();
    const config = authConfig();
    if (!config || !paymentUpdate.invoiceId) return;
    try {
      await axios.patch(`${baseURL}/finance/invoices/${paymentUpdate.invoiceId}/payments`, {
        amount: Number(paymentUpdate.amount) || 0,
        method: paymentUpdate.method,
        reference: paymentUpdate.reference,
      }, config);
      toast.success('Payment reconciled');
      setPaymentUpdate({ invoiceId: '', amount: '', method: 'UPI', reference: '' });
      loadFinance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reconcile payment');
    }
  };

  const submitSupplier = async (event) => {
    event.preventDefault();
    const config = authConfig();
    if (!config) return;
    try {
      await axios.post(`${baseURL}/suppliers`, {
        ...newSupplier,
        paymentTermsDays: Number(newSupplier.paymentTermsDays) || 0,
        creditLimit: Number(newSupplier.creditLimit) || 0,
        outstandingAmount: Number(newSupplier.outstandingAmount) || 0,
      }, config);
      toast.success('Supplier added');
      setNewSupplier({
        name: '',
        contactPerson: '',
        mobile: '',
        email: '',
        gstNumber: '',
        paymentTermsDays: '30',
        creditLimit: '0',
        outstandingAmount: '0',
        notes: '',
      });
      loadSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add supplier');
    }
  };

  const removeSupplier = async (supplierId) => {
    const config = authConfig();
    if (!config) return;
    try {
      await axios.delete(`${baseURL}/suppliers/${supplierId}`, config);
      toast.success('Supplier deleted');
      loadSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete supplier');
    }
  };

  const submitSupplierPayment = async (supplierId) => {
    const config = authConfig();
    if (!config) return;
    const draft = supplierPaymentDraft[supplierId] || {};
    if (!draft.amount) {
      toast.error('Enter payment amount');
      return;
    }
    try {
      await axios.patch(`${baseURL}/suppliers/${supplierId}/payments`, {
        amount: Number(draft.amount) || 0,
        method: draft.method || 'UPI',
        reference: draft.reference || '',
      }, config);
      toast.success('Supplier payment added');
      setSupplierPaymentDraft((prev) => ({ ...prev, [supplierId]: { amount: '', method: 'UPI', reference: '' } }));
      loadSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add supplier payment');
    }
  };

  const loadStoreData = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      const response = await axios.get(`${baseURL}/fetchdata`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data?.userData;
      if (userData?.storeName) {
        setStoreName(userData.storeName);
      }
      if (userData?.dashboardAccessRole) {
        setDashboardAccessRole(userData.dashboardAccessRole);
      }

      const staffAccount = userData?.loggedInStaff || null;
      const accountProfile = staffAccount
        ? {
          staffId: staffAccount._id || '',
          name: [staffAccount.firstName, staffAccount.lastName].filter(Boolean).join(' ').trim(),
          firstName: staffAccount.firstName || '',
          middleName: staffAccount.middleName || '',
          lastName: staffAccount.lastName || '',
          email: staffAccount.email || '',
          contact: staffAccount.contact || '',
          address: staffAccount.address || '',
          role: staffAccount.role || userData?.dashboardAccessRole || '',
          status: staffAccount.status || 'Active',
        }
        : {
          staffId: '',
          name: userData?.ownerName || '',
          firstName: '',
          middleName: '',
          lastName: '',
          email: userData?.email || '',
          contact: `${userData?.countryCode || '+91'} ${userData?.mobile || ''}`.trim(),
          address: userData?.address || '',
          role: userData?.dashboardAccessRole || 'Store Admin',
          status: 'Active',
        };
      setLoggedInAccount(accountProfile);
      setStaffProfileDraft({
        staffId: accountProfile.staffId || '',
        firstName: accountProfile.firstName || '',
        middleName: accountProfile.middleName || '',
        lastName: accountProfile.lastName || '',
        email: accountProfile.email || '',
        contact: accountProfile.contact || '',
        address: accountProfile.address || '',
        role: accountProfile.role || 'Pharmacist',
        loginPassword: '',
      });

      const profileData = {
        storeName: userData?.storeName || '',
        ownerName: userData?.ownerName || '',
        email: userData?.email || '',
        countryCode: userData?.countryCode || '+91',
        mobile: userData?.mobile || '',
        address: userData?.address || '',
        city: userData?.city || '',
        state: userData?.state || '',
        pincode: userData?.pincode || '',
      };

      setStoreProfile(profileData);
      setStoreProfileDraft(profileData);
    } catch (error) {
      console.error('Failed to load store data:', error.message);
    }
  };

  const handleStoreProfileDraftChange = (event) => {
    const { name, value } = event.target;
    setStoreProfileDraft((prev) => ({ ...prev, [name]: value }));
  };

  const saveStoreProfile = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    if (!storeProfileDraft.storeName || !storeProfileDraft.ownerName || !storeProfileDraft.mobile) {
      toast.error('Store name, owner name, and mobile are required.');
      return;
    }

    try {
      setStoreProfileSaving(true);
      const response = await axios.put(
        `${baseURL}/store-profile`,
        {
          storeName: storeProfileDraft.storeName,
          ownerName: storeProfileDraft.ownerName,
          countryCode: storeProfileDraft.countryCode,
          mobile: storeProfileDraft.mobile,
          address: storeProfileDraft.address,
          city: storeProfileDraft.city,
          state: storeProfileDraft.state,
          pincode: storeProfileDraft.pincode,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const updatedStore = response.data?.store || {};
      const nextProfile = {
        storeName: updatedStore.storeName || storeProfileDraft.storeName,
        ownerName: updatedStore.ownerName || storeProfileDraft.ownerName,
        email: updatedStore.email || storeProfile.email,
        countryCode: updatedStore.countryCode || storeProfileDraft.countryCode,
        mobile: updatedStore.mobile || storeProfileDraft.mobile,
        address: updatedStore.address || storeProfileDraft.address,
        city: updatedStore.city || storeProfileDraft.city,
        state: updatedStore.state || storeProfileDraft.state,
        pincode: updatedStore.pincode || storeProfileDraft.pincode,
      };

      setStoreName(nextProfile.storeName);
      setStoreProfile(nextProfile);
      setStoreProfileDraft(nextProfile);
      setIsEditingStoreProfile(false);
      toast.success('Store details updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update store details');
    } finally {
      setStoreProfileSaving(false);
    }
  };

  const handleStaffProfileDraftChange = (event) => {
    const { name, value } = event.target;
    setStaffProfileDraft((prev) => ({ ...prev, [name]: value }));
  };

  const saveStaffProfile = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    if (!staffProfileDraft.staffId) {
      toast.error('Logged-in staff account not found.');
      return;
    }

    if (!staffProfileDraft.firstName || !staffProfileDraft.lastName || !staffProfileDraft.email || !staffProfileDraft.contact) {
      toast.error('First name, last name, email, and contact are required.');
      return;
    }

    try {
      setStaffProfileSaving(true);
      const response = await axios.put(
        `${baseURL}/store-staff/${staffProfileDraft.staffId}`,
        {
          firstName: staffProfileDraft.firstName,
          middleName: staffProfileDraft.middleName,
          lastName: staffProfileDraft.lastName,
          role: staffProfileDraft.role,
          email: staffProfileDraft.email,
          contact: staffProfileDraft.contact,
          address: staffProfileDraft.address,
          loginPassword: staffProfileDraft.loginPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const updatedStaff = response.data?.staffMember || {};
      const nextAccount = {
        staffId: updatedStaff._id || staffProfileDraft.staffId,
        name: [updatedStaff.firstName || staffProfileDraft.firstName, updatedStaff.lastName || staffProfileDraft.lastName].filter(Boolean).join(' ').trim(),
        firstName: updatedStaff.firstName || staffProfileDraft.firstName,
        middleName: updatedStaff.middleName || staffProfileDraft.middleName,
        lastName: updatedStaff.lastName || staffProfileDraft.lastName,
        email: updatedStaff.email || staffProfileDraft.email,
        contact: updatedStaff.contact || staffProfileDraft.contact,
        address: updatedStaff.address || staffProfileDraft.address,
        role: updatedStaff.role || staffProfileDraft.role,
        status: updatedStaff.status || loggedInAccount.status || 'Active',
      };

      setLoggedInAccount(nextAccount);
      setStaffProfileDraft((prev) => ({
        ...prev,
        staffId: nextAccount.staffId,
        firstName: nextAccount.firstName,
        middleName: nextAccount.middleName,
        lastName: nextAccount.lastName,
        email: nextAccount.email,
        contact: nextAccount.contact,
        address: nextAccount.address,
        role: nextAccount.role,
        loginPassword: '',
      }));
      setIsEditingStaffProfile(false);
      toast.success('Staff profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update staff profile');
    } finally {
      setStaffProfileSaving(false);
    }
  };

  const loadRolePermissions = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      const response = await axios.get(`${baseURL}/store-staff/permissions`, {
        params: { role: dashboardAccessRole },
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffPermissions(response.data?.permissions || []);
    } catch (error) {
      console.error('Failed to load role permissions:', error.message);
      setStaffPermissions([]);
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

  const loadStoreReviews = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setStoreReviewsLoading(true);
      const response = await axios.get(`${baseURL}/reviews/store/me?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rows = response.data.reviews || [];
      setStoreReviews(rows);
      setSelectedReviewId((prev) => (rows.some((r) => r._id === prev) ? prev : rows[0]?._id || null));
    } catch (error) {
      console.error('Failed to load store reviews:', error.message);
      setStoreReviews([]);
      setSelectedReviewId(null);
    } finally {
      setStoreReviewsLoading(false);
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
      const rows = response.data.staffMembers || [];
      setStaffMembers(rows);

      if (loggedInAccount.staffId) {
        const selfStaff = rows.find((row) => String(row._id) === String(loggedInAccount.staffId));
        if (selfStaff) {
          setLoggedInAccount((prev) => ({
            ...prev,
            middleName: selfStaff.middleName || prev.middleName || '',
            address: selfStaff.address || prev.address || '',
          }));
          setStaffProfileDraft((prev) => ({
            ...prev,
            middleName: selfStaff.middleName || prev.middleName || '',
            address: selfStaff.address || prev.address || '',
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load staff members:', error.message);
      setStaffMembers([]);
    } finally {
      setStaffLoading(false);
    }
  };

  const loadStaffOperations = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setStaffOpsLoading(true);
      const [permissionsResponse, performanceResponse, attendanceResponse, trainingResponse] = await Promise.all([
        axios.get(`${baseURL}/store-staff/permissions`, {
          params: { role: dashboardAccessRole },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseURL}/staff/performance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseURL}/staff/attendance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseURL}/staff/training`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStaffPermissions(permissionsResponse.data?.permissions || []);
      setPerformanceRecords(performanceResponse.data?.records || []);
      setAttendanceRecords(attendanceResponse.data?.records || []);
      setTrainingRecords(trainingResponse.data?.records || []);
    } catch (error) {
      console.error('Failed to load staff operations:', error.message);
      setStaffPermissions([]);
      setPerformanceRecords([]);
      setAttendanceRecords([]);
      setTrainingRecords([]);
    } finally {
      setStaffOpsLoading(false);
    }
  };

  const loadCompliance = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setComplianceLoading(true);
      const [itemsResponse, remindersResponse] = await Promise.all([
        axios.get(`${baseURL}/compliance/checklist`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseURL}/compliance/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setComplianceItems(itemsResponse.data?.items || []);
      setComplianceReminders({
        overdue: remindersResponse.data?.overdue || [],
        upcoming: remindersResponse.data?.upcoming || [],
      });
    } catch (error) {
      console.error('Failed to load compliance data:', error.message);
      setComplianceItems([]);
      setComplianceReminders({ overdue: [], upcoming: [] });
    } finally {
      setComplianceLoading(false);
    }
  };

  const updatePrescriptionStatus = async (id, status) => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      const normalizedStatus = String(status || '').toLowerCase();
      const payload = {
        status: normalizedStatus,
        reviewNotes: approvalReviewNotes.trim(),
      };

      if (normalizedStatus === 'approved') {
        if (hasApprovalItemErrors) {
          toast.error('Please fix highlighted medicine fields before approving.');
          return;
        }

        const normalizedItems = approvalItems
          .map((item, index) => {
            const name = String(item.name || '').trim();
            const quantity = Math.max(1, Number(item.quantity) || 0);
            const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
            if (!name) return null;

            return {
              medicineId: String(item.medicineId || index + 1),
              name,
              quantity,
              unit: String(item.unit || '').trim(),
              unitPrice,
              lineTotal: Number((quantity * unitPrice).toFixed(2)),
              substitution: {
                isSubstituted: Boolean(String(item.substitutionReason || '').trim()),
                originalName: '',
                reason: String(item.substitutionReason || '').trim(),
              },
              instructions: String(item.instructions || '').trim(),
            };
          })
          .filter(Boolean);

        if (!normalizedItems.length) {
          toast.error('Add at least one medicine with name to approve prescription.');
          return;
        }

        const quoteHours = Math.max(1, Number(approvalTotalsDraft.quoteExpiresInHours) || 24);
        const quoteExpiresAt = new Date(Date.now() + quoteHours * 60 * 60 * 1000).toISOString();

        payload.approvedItems = normalizedItems;
        payload.totals = {
          subtotal: Number(approvalSubtotal.toFixed(2)),
          discount: Number(approvalDiscount.toFixed(2)),
          tax: Number(approvalTax.toFixed(2)),
          deliveryCharge: Number(approvalDeliveryCharge.toFixed(2)),
          grandTotal: Number(approvalGrandTotal.toFixed(2)),
          currency: String(approvalTotalsDraft.currency || 'INR').toUpperCase(),
        };
        payload.quoteExpiresAt = quoteExpiresAt;
      }

      await axios.patch(
        `${baseURL}/prescriptions/${id}/review`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Prescription ${normalizedStatus}`);
      await loadStorePrescriptions();
    } catch (error) {
      console.error('Failed to review prescription:', error.message);
      toast.error(error.response?.data?.message || 'Failed to review prescription');
    }
  };

  const sectionConfig = [
    { key: 'home', label: 'Dashboard Overview', icon: Home },
    { key: 'staff', label: 'Staff Members', icon: Users },
    { key: 'promotions', label: 'Promotions', icon: BadgePercent },
    { key: 'importPatients', label: 'Import Patients', icon: FileUp },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'financialManagement', label: 'Financial Management', icon: Landmark },
    { key: 'prescription', label: 'Prescription', icon: ClipboardList },
    { key: 'queries', label: 'Queries', icon: MessageSquare },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'myProfile', label: 'My Profile', icon: UserCheck },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const roleSectionAccess = {
    'Store Admin': ['home', 'staff', 'promotions', 'importPatients', 'inventory', 'orders', 'financialManagement', 'prescription', 'queries', 'reviews', 'myProfile', 'reports'],
    Pharmacist: ['home', 'prescription', 'inventory', 'orders', 'queries', 'reviews', 'myProfile'],
    Operator: ['home', 'prescription', 'inventory', 'orders', 'queries', 'reviews', 'myProfile'],
  };

  const allowedSectionKeys = roleSectionAccess[dashboardAccessRole] || roleSectionAccess['Store Admin'];
  const visibleSectionConfig = sectionConfig.filter((section) => allowedSectionKeys.includes(section.key));
  const sectionGroupConfig = useMemo(() => ([
    { title: 'Overview', keys: ['home', 'reports'] },
    { title: 'Operations', keys: ['inventory', 'orders', 'prescription', 'financialManagement'] },
    { title: 'People & Communication', keys: ['staff', 'queries', 'reviews'] },
    { title: 'Growth & Setup', keys: ['promotions', 'importPatients', 'myProfile'] },
  ]), []);
  const groupedVisibleSectionConfig = useMemo(() => {
    const sectionByKey = visibleSectionConfig.reduce((acc, section) => {
      acc[section.key] = section;
      return acc;
    }, {});

    const grouped = sectionGroupConfig
      .map((group) => ({
        title: group.title,
        sections: group.keys
          .map((key) => sectionByKey[key])
          .filter(Boolean),
      }))
      .filter((group) => group.sections.length > 0);

    const groupedKeys = new Set(grouped.flatMap((group) => group.sections.map((section) => section.key)));
    const remainingSections = visibleSectionConfig.filter((section) => !groupedKeys.has(section.key));

    if (remainingSections.length) {
      grouped.push({ title: 'Additional', sections: remainingSections });
    }

    return grouped;
  }, [visibleSectionConfig, sectionGroupConfig]);
  const activeSectionGroupTitle = useMemo(() => {
    const matchedGroup = groupedVisibleSectionConfig.find((group) =>
      group.sections.some((section) => section.key === selectedSection)
    );
    return matchedGroup?.title || groupedVisibleSectionConfig[0]?.title || '';
  }, [groupedVisibleSectionConfig, selectedSection]);
  const effectiveExpandedSectionGroup = expandedSectionGroup || activeSectionGroupTitle;

  useEffect(() => {
    if (!activeSectionGroupTitle) return;
    setExpandedSectionGroup(activeSectionGroupTitle);
  }, [activeSectionGroupTitle]);

  const prescriptionSummary = prescriptions.reduce(
    (acc, item) => {
      const status = String(item.status || 'pending').toLowerCase();
      acc.total += 1;
      if (status === 'approved') acc.approved += 1;
      else if (status === 'rejected') acc.rejected += 1;
      else if (status === 'ordered') acc.ordered += 1;
      else acc.pending += 1;

      if (status === 'approved' || status === 'rejected') {
        const reviewerName = String(item.reviewedByName || '').trim() || 'Store Admin';
        const reviewerRole = String(item.reviewedByRole || '').trim() || 'Store Admin';
        const current = acc.byReviewer[reviewerName] || { name: reviewerName, role: reviewerRole, approved: 0, rejected: 0, total: 0 };
        current.total += 1;
        if (status === 'approved') current.approved += 1;
        if (status === 'rejected') current.rejected += 1;
        acc.byReviewer[reviewerName] = current;
      }

      return acc;
    },
    { total: 0, approved: 0, rejected: 0, pending: 0, ordered: 0, byReviewer: {} }
  );

  const prescriptionReviewerStats = Object.values(prescriptionSummary.byReviewer).sort((a, b) => b.total - a.total);
  const reviewerFilterOptions = Array.from(
    new Set(
      [
        'Store Admin',
        ...(staffMembers || []).map((staff) => `${staff.firstName || ''} ${staff.lastName || ''}`.trim()).filter(Boolean),
        ...prescriptions
          .filter((item) => ['approved', 'rejected', 'ordered'].includes(String(item.status || '').toLowerCase()))
          .map((item) => String(item.reviewedByName || 'Store Admin').trim() || 'Store Admin'),
      ]
    )
  ).sort((a, b) => a.localeCompare(b));

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  const openStaffForm = () => {
    if (!allowedSectionKeys.includes('staff')) {
      toast.error('You do not have access to add staff members.');
      return;
    }

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
      loginPassword: '',
    });
  };

  const addStaffMember = async (e) => {
    e.preventDefault();
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email || !newStaff.contact) return;
    if (!editingStaffId && !newStaff.loginPassword) {
      toast.error('Login password is required for new staff accounts.');
      return;
    }

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
      loginPassword: newStaff.loginPassword,
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
        loginPassword: '',
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
      loginPassword: '',
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

  const handleRefreshDashboard = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) {
      toast.error('Please login again to refresh dashboard data.');
      return;
    }

    try {
      setDashboardRefreshing(true);
      await Promise.allSettled([
        loadStoreData(),
        loadRolePermissions(),
        loadStoreOrders(),
        loadStorePrescriptions(),
        loadStoreQueries(),
        loadStoreReviews(),
        loadStoreStaffMembers(),
        loadStoreInventory(),
      ]);

      if (allowedSectionKeys.includes('financialManagement')) {
        await Promise.allSettled([loadFinance(), loadSuppliers()]);
      }
      if (allowedSectionKeys.includes('promotions')) {
        await loadPromotionalCampaigns();
      }
      if (allowedSectionKeys.includes('staff')) {
        await Promise.allSettled([loadStaffOperations(), loadCompliance()]);
      }

      toast.success('Dashboard refreshed successfully.');
    } catch (error) {
      console.error('Failed to refresh dashboard:', error.message);
      toast.error('Unable to refresh dashboard right now.');
    } finally {
      setDashboardRefreshing(false);
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

  const normalizeBarcodeToken = (value) => String(value || '').trim().toLowerCase();

  const findInventoryItemByCode = (rawCode) => {
    const code = normalizeBarcodeToken(rawCode);
    if (!code) return null;

    return inventoryItems.find((item) => {
      const candidates = [
        item._id,
        item.id,
        item.barcode,
        item.qrCode,
        item.sku,
        item.name,
      ]
        .filter(Boolean)
        .map(normalizeBarcodeToken);

      return candidates.includes(code);
    }) || null;
  };

  const stopBarcodeScanner = () => {
    if (barcodeRafRef.current) {
      cancelAnimationFrame(barcodeRafRef.current);
      barcodeRafRef.current = null;
    }
    if (barcodeStreamRef.current) {
      barcodeStreamRef.current.getTracks().forEach((track) => track.stop());
      barcodeStreamRef.current = null;
    }
    if (barcodeVideoRef.current) {
      barcodeVideoRef.current.srcObject = null;
    }
    setBarcodeScanning(false);
  };

  const startBarcodeScanner = async () => {
    if (barcodeScanning) return;
    if (!window.isSecureContext) {
      toast.error('Camera scan requires HTTPS or localhost.');
      return;
    }
    if (!('BarcodeDetector' in window)) {
      toast.error('Barcode detector not supported in this browser. Use manual code input.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      barcodeStreamRef.current = stream;
      if (barcodeVideoRef.current) {
        barcodeVideoRef.current.srcObject = stream;
        await barcodeVideoRef.current.play();
      }
      setBarcodeScanning(true);

      const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      const scanLoop = async () => {
        try {
          if (barcodeVideoRef.current?.readyState >= 2) {
            const barcodes = await detector.detect(barcodeVideoRef.current);
            if (barcodes?.length) {
              const value = barcodes[0]?.rawValue || '';
              if (value) {
                setBarcodeInput(value);
                setBarcodeLastCode(value);
                const matched = findInventoryItemByCode(value);
                if (matched) {
                  setBarcodeMatchedItemId(matched._id);
                  toast.success(`Scanned: ${matched.name}`);
                } else {
                  setBarcodeMatchedItemId('');
                  toast.error('Scanned code not found in inventory.');
                }
                stopBarcodeScanner();
                return;
              }
            }
          }
        } catch (error) {
          console.error('Barcode scan failed:', error.message);
        }
        barcodeRafRef.current = requestAnimationFrame(scanLoop);
      };

      barcodeRafRef.current = requestAnimationFrame(scanLoop);
    } catch (error) {
      console.error('Unable to start barcode scanner:', error.message);
      toast.error('Unable to access camera for barcode scan.');
      stopBarcodeScanner();
    }
  };

  const handleBarcodeAction = async (action) => {
    const code = barcodeInput.trim();
    if (!code) {
      toast.error('Enter or scan a barcode/QR code first.');
      return;
    }

    const matched = findInventoryItemByCode(code);
    if (!matched) {
      toast.error('No matching inventory item for this code.');
      setBarcodeMatchedItemId('');
      return;
    }

    const qty = Math.max(1, Number(barcodeActionQty) || 1);
    const delta = action === 'in' ? qty : -qty;
    await updateMedicineStock(matched, delta);
    setBarcodeMatchedItemId(matched._id);
    toast.success(`${action === 'in' ? 'Check-in' : 'Check-out'} applied for ${matched.name} (${qty}).`);
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  useEffect(() => {
    if (dashboardAccessRole) {
      loadRolePermissions();
    }
  }, [dashboardAccessRole]);

  useEffect(() => {
    if (!allowedSectionKeys.includes(selectedSection)) {
      setSelectedSection(allowedSectionKeys[0] || 'myProfile');
    }
  }, [dashboardAccessRole, selectedSection]);

  useEffect(() => {
    if (selectedSection === 'staff' && allowedSectionKeys.includes('staff')) {
      loadStoreStaffMembers();
    }
    if (selectedSection === 'inventory' && allowedSectionKeys.includes('inventory')) {
      loadStoreInventory();
    }
    if (selectedSection === 'financialManagement' && allowedSectionKeys.includes('financialManagement')) {
      loadFinance();
      loadSuppliers();
    }
    if (selectedSection === 'promotions' && allowedSectionKeys.includes('promotions')) {
      loadPromotionalCampaigns();
    }
    if ((selectedSection === 'orders' || selectedSection === 'reports') && allowedSectionKeys.includes(selectedSection)) {
      loadStoreOrders();
    }
    if (selectedSection === 'prescription' && allowedSectionKeys.includes('prescription')) {
      loadStorePrescriptions();
      loadStoreStaffMembers();
      loadStoreInventory();
    }
    if (selectedSection === 'home') {
      loadStoreOrders();
      loadStorePrescriptions();
      loadStoreInventory();
    }
    if (selectedSection === 'myProfile') {
      loadStoreStaffMembers();
    }
    if (selectedSection === 'queries' && allowedSectionKeys.includes('queries')) {
      loadStoreQueries();
    }
    if (selectedSection === 'reviews' && allowedSectionKeys.includes('reviews')) {
      loadStoreReviews();
    }
    if (selectedSection === 'staffCompliance' && allowedSectionKeys.includes('staff')) {
      loadStoreStaffMembers();
      loadStaffOperations();
      loadCompliance();
    }

    if (selectedSection !== 'inventory') {
      stopBarcodeScanner();
    }
  }, [selectedSection, dashboardAccessRole]);

  useEffect(() => {
    return () => {
      stopBarcodeScanner();
    };
  }, []);

  useEffect(() => {
    if (selectedSection !== 'orders') return;

    if (!filteredOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (!filteredOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [selectedSection, selectedOrderFilter, filteredOrders, selectedOrderId]);

  useEffect(() => {
    if (selectedSection !== 'prescription') return;

    if (!selectedPrescription) {
      setApprovalItems([createEmptyApprovalItem()]);
      setApprovalReviewNotes('');
      setApprovalTotalsDraft({
        subtotal: '0',
        discount: '0',
        tax: '0',
        deliveryCharge: '0',
        grandTotal: '0',
        currency: 'INR',
        quoteExpiresInHours: '24',
      });
      return;
    }

    const snapshot = selectedPrescription.approvalSnapshot;
    if (snapshot?.approvedItems?.length) {
      setApprovalItems(
        snapshot.approvedItems.map((item) => ({
          medicineId: String(item.medicineId || ''),
          name: String(item.name || ''),
          quantity: String(item.quantity || '1'),
          unit: String(item.unit || 'tablet'),
          unitPrice: String(item.unitPrice || '0'),
          instructions: String(item.instructions || ''),
          substitutionReason: String(item?.substitution?.reason || ''),
        }))
      );
    } else {
      setApprovalItems([createEmptyApprovalItem()]);
    }

    setApprovalReviewNotes(String(selectedPrescription.reviewNotes || ''));
    setApprovalTotalsDraft({
      subtotal: String(snapshot?.totals?.subtotal ?? '0'),
      discount: String(snapshot?.totals?.discount ?? '0'),
      tax: String(snapshot?.totals?.tax ?? '0'),
      deliveryCharge: String(snapshot?.totals?.deliveryCharge ?? '0'),
      grandTotal: String(snapshot?.totals?.grandTotal ?? '0'),
      currency: String(snapshot?.totals?.currency || 'INR'),
      quoteExpiresInHours: '24',
    });
  }, [selectedSection, selectedPrescriptionId]);

  useEffect(() => {
    if (selectedSection !== 'prescription') return;
    if (prescriptionsLoading) return;

    if (!filteredPrescriptions.length) {
      setSelectedPrescriptionId(null);
      return;
    }

    const hasSelectedInFilter = filteredPrescriptions.some((item) => item._id === selectedPrescriptionId);
    if (!hasSelectedInFilter) {
      setSelectedPrescriptionId(filteredPrescriptions[0]._id);
    }
  }, [selectedSection, prescriptionStatusFilter, prescriptionsLoading, prescriptions, filteredPrescriptions, selectedPrescriptionId]);

  useEffect(() => {
    setShowPendingReviewWorkspace(false);
  }, [prescriptionStatusFilter, selectedSection]);

  useEffect(() => {
    setShowApprovalItemsSection(false);
  }, [selectedPrescriptionId, prescriptionStatusFilter, selectedSection]);

  const handleApprovalItemChange = (index, field, value) => {
    setApprovalItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  };

  const handleApprovalMedicineNameInputChange = (index, value) => {
    setApprovalItems((prev) =>
      prev.map((item, itemIndex) => (
        itemIndex === index
          ? { ...item, name: value, medicineId: '' }
          : item
      ))
    );
  };

  const applySuggestedMedicineToApprovalItem = (index, medicine) => {
    setApprovalItems((prev) =>
      prev.map((item, itemIndex) => (
        itemIndex === index
          ? {
            ...item,
            medicineId: medicine.id,
            name: medicine.name,
            unitPrice: String(medicine.price),
          }
          : item
      ))
    );
  };

  const handleAddApprovalItem = () => {
    setApprovalItems((prev) => [...prev, createEmptyApprovalItem()]);
  };

  const handleRemoveApprovalItem = (index) => {
    setApprovalItems((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [createEmptyApprovalItem()];
    });
  };

  const handleAutoFillApprovalTotals = () => {
    const computedSubtotal = Number(approvalCalculatedSubtotal.toFixed(2));
    const computedGrandTotal = Number((computedSubtotal - approvalDiscount + approvalTax + approvalDeliveryCharge).toFixed(2));
    setApprovalTotalsDraft((prev) => ({
      ...prev,
      subtotal: String(computedSubtotal),
      grandTotal: String(Math.max(0, computedGrandTotal)),
    }));
  };

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

  const handleSubmitReviewReply = async (reviewId) => {
    const message = reviewReplyText.trim();
    if (!message) return;

    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setReviewReplySubmitting(true);
      const response = await axios.patch(
        `${baseURL}/reviews/${reviewId}/reply`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = response.data.review;
      setStoreReviews((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      setReviewReplyText('');
      toast.success('Review reply posted');
    } catch (error) {
      console.error('Failed to post review reply:', error.message);
      toast.error(error.response?.data?.message || 'Failed to post reply');
    } finally {
      setReviewReplySubmitting(false);
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

  const staffCompliancePermissionPrefixes = ['staff.', 'attendance.', 'performance.', 'training.', 'compliance.'];
  const staffCompliancePermissions = staffPermissions.filter((permission) =>
    staffCompliancePermissionPrefixes.some((prefix) => String(permission || '').startsWith(prefix))
  );
  const canManageStaff = allowedSectionKeys.includes('staff');
  const isStaffSelfProfile = dashboardAccessRole !== 'Store Admin' && Boolean(loggedInAccount.staffId);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-12" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 3rem)' }}>
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="relative overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
            <div className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-14 bottom-6 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative mb-7 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-200">Store Navigation</p>
              <h2 className="mt-2 text-2xl font-bold">Control Panel</h2>
              <p className="mt-2 text-sm text-slate-300">Select a section to manage operations.</p>
              <div className="mt-4 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs">
                <p className="text-[10px] uppercase tracking-wide text-cyan-200">Access</p>
                <p className="mt-0.5 font-semibold text-cyan-100">{dashboardAccessRole}</p>
              </div>
            </div>

            <div className="relative space-y-4">
              {groupedVisibleSectionConfig.map((group) => (
                <div key={group.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <button
                    type="button"
                    onClick={() => setExpandedSectionGroup(group.title)}
                    className="mb-2 flex w-full items-center justify-between rounded-lg px-1 py-1 text-left"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">{group.title}</p>
                    <ChevronRight
                      size={14}
                      className={`text-slate-300 transition ${effectiveExpandedSectionGroup === group.title ? 'rotate-90 text-cyan-200' : ''}`}
                    />
                  </button>
                  {effectiveExpandedSectionGroup === group.title && (
                    <div className="space-y-1.5">
                      {group.sections.map((section) => {
                        const Icon = section.icon;
                        const active = selectedSection === section.key;
                        return (
                          <button
                            key={section.key}
                            type="button"
                            onClick={() => handleSelectSection(section.key)}
                            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-950/30' : 'bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white'}`}
                          >
                            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${active ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'}`}>
                              <Icon className={`${active ? 'text-white' : 'text-cyan-200 group-hover:text-white'}`} size={16} />
                            </span>
                            <span className="flex-1 font-semibold tracking-wide text-sm">{section.label}</span>
                            <span className={`h-2 w-2 rounded-full transition ${active ? 'bg-white' : 'bg-transparent group-hover:bg-cyan-300'}`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          <main ref={mainContentRef} className="min-w-0 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Current View</p>
                  <h1 className="text-2xl font-semibold text-slate-900 capitalize">{visibleSectionConfig.find((item) => item.key === selectedSection)?.label || 'Overview'}</h1>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshDashboard}
                  disabled={dashboardRefreshing}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={16} className={dashboardRefreshing ? 'animate-spin' : ''} />
                  {dashboardRefreshing ? 'Refreshing...' : 'Refresh Dashboard'}
                </button>
              </div>
            </div>

            {selectedSection === 'home' && (
              <div className="space-y-6">
                {/* Low Stock Alert Widget */}
                <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="text-red-600" size={24} />
                    <h2 className="text-xl font-bold text-red-900">Low Stock Alerts</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {inventoryItems.filter((item) => Number(item.stock || 0) === 0).slice(0, 6).map((medicine) => (
                      <div key={medicine._id} className="rounded-lg border-2 border-red-400 bg-white p-3">
                        <p className="text-sm font-bold text-red-700">⚠️ OUT OF STOCK</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{medicine.name}</p>
                        <p className="text-xs text-slate-500">{medicine.manufacturer || 'N/A'}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-red-700">Stock: 0</span>
                          <button
                            type="button"
                            onClick={() => handleSelectSection('inventory')}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
                          >
                            Reorder
                          </button>
                        </div>
                      </div>
                    ))}
                    {inventoryItems.filter((item) => {
                      const stock = Number(item.stock || 0);
                      return stock > 0 && stock < 5;
                    }).slice(0, 6).map((medicine) => (
                      <div key={medicine._id} className="rounded-lg border-2 border-yellow-400 bg-white p-3">
                        <p className="text-sm font-bold text-yellow-700">⚠️ LOW STOCK</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{medicine.name}</p>
                        <p className="text-xs text-slate-500">{medicine.manufacturer || 'N/A'}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-yellow-700">Stock: {medicine.stock}</span>
                          <button
                            type="button"
                            onClick={() => handleSelectSection('inventory')}
                            className="text-xs text-yellow-600 hover:text-yellow-800 font-semibold underline"
                          >
                            Reorder
                          </button>
                        </div>
                      </div>
                    ))}
                    {inventoryItems.filter((item) => Number(item.stock || 0) === 0).length === 0 && inventoryItems.filter((item) => {
                      const stock = Number(item.stock || 0);
                      return stock > 0 && stock < 5;
                    }).length === 0 && (
                      <div className="col-span-full rounded-lg bg-emerald-50 p-4 text-center">
                        <p className="text-sm font-semibold text-emerald-700">✓ All medicines are well stocked</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Daily Sales Overview Widget */}
                <div className="grid gap-6 lg:grid-cols-4">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase">Today Orders</p>
                        <p className="mt-2 text-2xl font-bold text-blue-900">{todayOrderCount}</p>
                      </div>
                      <ShoppingBag className="text-blue-400" size={32} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 uppercase">Today Revenue</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-900">₹{todayRevenue.toFixed(2)}</p>
                      </div>
                      <TrendingUp className="text-emerald-400" size={32} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-amber-600 uppercase">Pending Prescriptions</p>
                        <p className="mt-2 text-2xl font-bold text-amber-900">{pendingPrescriptionCount}</p>
                        <p className="text-[11px] font-medium text-amber-700">Over 24h: {pendingOver24hCount}</p>
                      </div>
                      <Clock className="text-amber-400" size={32} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-purple-600 uppercase">Approved Today</p>
                        <p className="mt-2 text-2xl font-bold text-purple-900">
                          {approvedTodayCount}
                        </p>
                        <p className="text-[11px] font-medium text-purple-700">Rejected Today: {rejectedTodayCount}</p>
                        <p className="text-[11px] font-medium text-purple-700">Approval Rate: {approvalRate}%</p>
                      </div>
                      <Eye className="text-purple-400" size={32} />
                    </div>
                  </div>
                </div>

                {/* Prescription Approval Quick Stats */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <ClipboardList className="text-indigo-600" size={24} />
                    <h2 className="text-xl font-bold text-slate-900">Prescription Processing Overview</h2>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Processing Stats */}
                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-600 mb-3">Status Breakdown</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">Pending Review</span>
                            <span className="inline-flex items-center gap-2">
                              <span className="text-lg font-bold text-amber-600">{pendingPrescriptionCount}</span>
                              <span className="text-xs text-slate-500">prescriptions</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">Approved</span>
                            <span className="inline-flex items-center gap-2">
                              <span className="text-lg font-bold text-emerald-600">{approvedPrescriptionCount}</span>
                              <span className="text-xs text-slate-500">prescriptions</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">Rejected</span>
                            <span className="inline-flex items-center gap-2">
                              <span className="text-lg font-bold text-rose-600">{rejectedPrescriptionCount}</span>
                              <span className="text-xs text-slate-500">prescriptions</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Workflow Health</p>
                        <p className="text-xs text-slate-500">Average review time</p>
                        <p className="text-xl font-bold text-slate-900">{avgReviewHours.toFixed(1)} hrs</p>
                        <p className="mt-2 text-xs text-slate-500">Pending over 24 hours: <span className="font-semibold text-amber-700">{pendingOver24hCount}</span></p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                        <p className="text-sm font-semibold text-indigo-600 mb-3">Quick Actions</p>
                        <button
                          type="button"
                          onClick={() => handleSelectSection('prescription')}
                          className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                          <ClipboardList size={16} />
                          Review Pending Prescriptions
                        </button>
                        <p className="mt-3 text-xs text-indigo-600 font-semibold">
                          {pendingPrescriptionCount} awaiting your approval
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === 'myProfile' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <UserCheck className="text-indigo-600" size={24} />
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">My Profile</h2>
                    <p className="text-sm text-slate-500">Store details, account info, and profile management.</p>
                  </div>
                </div>
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Store</p>
                    <p className="text-lg font-semibold text-slate-900">{storeProfile.storeName || storeName || 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 p-4">
                    <p className="text-xs text-indigo-600">Active Role View</p>
                    <p className="text-lg font-semibold text-indigo-900">{dashboardAccessRole}</p>
                  </div>
                </div>



                {isStaffSelfProfile ? (
                  !isEditingStaffProfile ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-emerald-50 p-4">
                          <p className="text-xs text-emerald-600">First Name</p>
                          <p className="text-lg font-semibold text-emerald-900">{loggedInAccount.firstName || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl bg-sky-50 p-4">
                          <p className="text-xs text-sky-600">Middle Name</p>
                          <p className="text-lg font-semibold text-sky-900">{loggedInAccount.middleName || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl bg-blue-50 p-4">
                          <p className="text-xs text-blue-600">Last Name</p>
                          <p className="text-lg font-semibold text-blue-900">{loggedInAccount.lastName || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl bg-amber-50 p-4">
                          <p className="text-xs text-amber-700">Role</p>
                          <p className="text-lg font-semibold text-amber-900">{loggedInAccount.role || dashboardAccessRole || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl bg-violet-50 p-4">
                          <p className="text-xs text-violet-700">Email</p>
                          <p className="text-sm font-semibold text-violet-900 break-all">{loggedInAccount.email || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl bg-orange-50 p-4">
                          <p className="text-xs text-orange-700">Contact</p>
                          <p className="text-lg font-semibold text-orange-900">{loggedInAccount.contact || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{loggedInAccount.address || 'N/A'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingStaffProfile(true)}
                        className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Edit My Details
                      </button>
                    </div>
                  ) : (
                    <form className="space-y-4" onSubmit={saveStaffProfile}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">First Name</label>
                          <input
                            name="firstName"
                            value={staffProfileDraft.firstName}
                            onChange={handleStaffProfileDraftChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Middle Name</label>
                          <input
                            name="middleName"
                            value={staffProfileDraft.middleName}
                            onChange={handleStaffProfileDraftChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Last Name</label>
                          <input
                            name="lastName"
                            value={staffProfileDraft.lastName}
                            onChange={handleStaffProfileDraftChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Role</label>
                          <input
                            name="role"
                            value={staffProfileDraft.role}
                            className="mt-1 block w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
                            disabled
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Email</label>
                          <input
                            name="email"
                            type="email"
                            value={staffProfileDraft.email}
                            onChange={handleStaffProfileDraftChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Contact</label>
                          <input
                            name="contact"
                            value={staffProfileDraft.contact}
                            onChange={handleStaffProfileDraftChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-700">Address</label>
                          <input
                            name="address"
                            value={staffProfileDraft.address}
                            onChange={handleStaffProfileDraftChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-700">New Password (Optional)</label>
                          <input
                            name="loginPassword"
                            type="password"
                            value={staffProfileDraft.loginPassword}
                            onChange={handleStaffProfileDraftChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="Leave empty to keep current password"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={staffProfileSaving}
                          className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                          {staffProfileSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStaffProfileDraft({
                              staffId: loggedInAccount.staffId || '',
                              firstName: loggedInAccount.firstName || '',
                              middleName: loggedInAccount.middleName || '',
                              lastName: loggedInAccount.lastName || '',
                              email: loggedInAccount.email || '',
                              contact: loggedInAccount.contact || '',
                              address: loggedInAccount.address || '',
                              role: loggedInAccount.role || 'Pharmacist',
                              loginPassword: '',
                            });
                            setIsEditingStaffProfile(false);
                          }}
                          className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )
                ) : (!isEditingStoreProfile ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-emerald-50 p-4">
                        <p className="text-xs text-emerald-600">Owner Name</p>
                        <p className="text-lg font-semibold text-emerald-900">{storeProfile.ownerName || 'N/A'}</p>
                      </div>
                      <div className="rounded-2xl bg-blue-50 p-4">
                        <p className="text-xs text-blue-600">Email</p>
                        <p className="text-lg font-semibold text-blue-900">{storeProfile.email || 'N/A'}</p>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-4">
                        <p className="text-xs text-amber-700">Contact</p>
                        <p className="text-lg font-semibold text-amber-900">{`${storeProfile.countryCode || '+91'} ${storeProfile.mobile || 'N/A'}`}</p>
                      </div>
                      <div className="rounded-2xl bg-cyan-50 p-4">
                        <p className="text-xs text-cyan-700">Location</p>
                        <p className="text-sm font-semibold text-cyan-900">{[storeProfile.city, storeProfile.state, storeProfile.pincode].filter(Boolean).join(', ') || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{storeProfile.address || 'N/A'}</p>
                    </div>
                    {dashboardAccessRole === 'Store Admin' ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingStoreProfile(true)}
                        className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Edit Store Details
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={saveStoreProfile}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Store Name</label>
                        <input
                          name="storeName"
                          value={storeProfileDraft.storeName}
                          onChange={handleStoreProfileDraftChange}
                          className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Owner Name</label>
                        <input
                          name="ownerName"
                          value={storeProfileDraft.ownerName}
                          onChange={handleStoreProfileDraftChange}
                          className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                          name="email"
                          value={storeProfileDraft.email}
                          className="mt-1 block w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
                          disabled
                        />
                      </div>
                      <div className="grid grid-cols-[110px_1fr] gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Code</label>
                          <input
                            name="countryCode"
                            value={storeProfileDraft.countryCode}
                            onChange={handleStoreProfileDraftChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Mobile</label>
                          <input
                            name="mobile"
                            value={storeProfileDraft.mobile}
                            onChange={handleStoreProfileDraftChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">City</label>
                        <input
                          name="city"
                          value={storeProfileDraft.city}
                          onChange={handleStoreProfileDraftChange}
                          className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">State</label>
                        <input
                          name="state"
                          value={storeProfileDraft.state}
                          onChange={handleStoreProfileDraftChange}
                          className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Address</label>
                        <input
                          name="address"
                          value={storeProfileDraft.address}
                          onChange={handleStoreProfileDraftChange}
                          className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Pincode</label>
                        <input
                          name="pincode"
                          value={storeProfileDraft.pincode}
                          onChange={handleStoreProfileDraftChange}
                          className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={storeProfileSaving}
                        className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {storeProfileSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStoreProfileDraft(storeProfile);
                          setIsEditingStoreProfile(false);
                        }}
                        className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            )}

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
                  <div className="relative z-10 flex flex-wrap items-center gap-2 justify-end pointer-events-auto">
                    {!showStaffForm ? (
                      <>
                        {canManageStaff && (
                          <button
                            type="button"
                            onClick={openStaffForm}
                            className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                          >
                            Add Staff Member
                          </button>
                        )}
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
                            loginPassword: '',
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
                            <option value="Store Admin">Store Admin</option>
                            <option value="Pharmacist">Pharmacist</option>
                            <option value="Operator">Operator</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Login Password {editingStaffId ? '(optional to reset)' : ''}</label>
                          <input
                            name="loginPassword"
                            type="password"
                            value={newStaff.loginPassword}
                            onChange={handleStaffChange}
                            className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder={editingStaffId ? 'Enter new password to reset' : 'Set login password'}
                            required={!editingStaffId}
                          />
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
                            loginPassword: '',
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

            {selectedSection === 'staffCompliance' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className="text-indigo-600" size={24} />
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Staff & Compliance</h2>
                      <p className="text-sm text-slate-500">Performance, attendance, role permissions, training, and compliance checklist.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {staffCompliancePermissions.map((permission) => (
                      <span key={permission} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        {permission}
                      </span>
                    ))}
                    {!staffCompliancePermissions.length && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        No staff/compliance permissions available
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <UserCheck className="text-blue-600" size={20} />
                      <h3 className="text-lg font-semibold text-slate-900">Performance Tracker</h3>
                    </div>
                    <form className="grid gap-3" onSubmit={submitPerformanceRecord}>
                      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newPerformance.staffId} onChange={(event) => setNewPerformance((prev) => ({ ...prev, staffId: event.target.value }))} required>
                        <option value="">Select staff</option>
                        {staffMembers.map((member) => (
                          <option key={member._id} value={member._id}>{member.firstName} {member.lastName} ({member.role})</option>
                        ))}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newPerformance.periodStart} onChange={(event) => setNewPerformance((prev) => ({ ...prev, periodStart: event.target.value }))} required />
                        <input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newPerformance.periodEnd} onChange={(event) => setNewPerformance((prev) => ({ ...prev, periodEnd: event.target.value }))} required />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" min="0" placeholder="Orders processed" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newPerformance.ordersProcessed} onChange={(event) => setNewPerformance((prev) => ({ ...prev, ordersProcessed: event.target.value }))} />
                        <input type="number" min="0" placeholder="Prescriptions reviewed" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newPerformance.prescriptionsReviewed} onChange={(event) => setNewPerformance((prev) => ({ ...prev, prescriptionsReviewed: event.target.value }))} />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" min="0" placeholder="Avg mins" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newPerformance.avgFulfillmentMinutes} onChange={(event) => setNewPerformance((prev) => ({ ...prev, avgFulfillmentMinutes: event.target.value }))} />
                        <input type="number" min="0" max="100" placeholder="Attendance %" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newPerformance.attendanceScore} onChange={(event) => setNewPerformance((prev) => ({ ...prev, attendanceScore: event.target.value }))} />
                        <input type="number" min="0" max="5" step="0.1" placeholder="Rating" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newPerformance.customerRating} onChange={(event) => setNewPerformance((prev) => ({ ...prev, customerRating: event.target.value }))} />
                      </div>
                      <textarea rows={2} placeholder="Notes" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newPerformance.notes} onChange={(event) => setNewPerformance((prev) => ({ ...prev, notes: event.target.value }))} />
                      <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save Performance</button>
                    </form>
                    <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
                      {staffOpsLoading ? <p className="text-sm text-slate-500">Loading performance...</p> : performanceRecords.slice(0, 10).map((record) => (
                        <div key={record._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                          <p className="font-semibold text-slate-900">{record.staffId?.firstName} {record.staffId?.lastName} • Score {record.efficiencyScore}</p>
                          <p className="text-slate-600">Orders {record.ordersProcessed} • Rating {record.customerRating}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarCheck2 className="text-emerald-600" size={20} />
                      <h3 className="text-lg font-semibold text-slate-900">Attendance & Shifts</h3>
                    </div>
                    <form className="grid gap-3" onSubmit={submitAttendanceRecord}>
                      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newAttendance.staffId} onChange={(event) => setNewAttendance((prev) => ({ ...prev, staffId: event.target.value }))} required>
                        <option value="">Select staff</option>
                        {staffMembers.map((member) => (
                          <option key={member._id} value={member._id}>{member.firstName} {member.lastName} ({member.role})</option>
                        ))}
                      </select>
                      <input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newAttendance.date} onChange={(event) => setNewAttendance((prev) => ({ ...prev, date: event.target.value }))} required />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newAttendance.shiftType} onChange={(event) => setNewAttendance((prev) => ({ ...prev, shiftType: event.target.value }))}>
                          <option>Morning</option>
                          <option>Evening</option>
                          <option>Night</option>
                          <option>Custom</option>
                        </select>
                        <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newAttendance.status} onChange={(event) => setNewAttendance((prev) => ({ ...prev, status: event.target.value }))}>
                          <option>Present</option>
                          <option>Absent</option>
                          <option>Half Day</option>
                          <option>Leave</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="datetime-local" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newAttendance.shiftStart} onChange={(event) => setNewAttendance((prev) => ({ ...prev, shiftStart: event.target.value }))} required />
                        <input type="datetime-local" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newAttendance.shiftEnd} onChange={(event) => setNewAttendance((prev) => ({ ...prev, shiftEnd: event.target.value }))} required />
                      </div>
                      <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Save Attendance</button>
                    </form>
                    <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
                      {staffOpsLoading ? <p className="text-sm text-slate-500">Loading attendance...</p> : attendanceRecords.slice(0, 10).map((record) => (
                        <div key={record._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                          <p className="font-semibold text-slate-900">{record.staffId?.firstName} {record.staffId?.lastName} • {record.status}</p>
                          <p className="text-slate-600">Shift {record.shiftType} • {new Date(record.date).toLocaleDateString()}</p>
                          <div className="mt-2 flex gap-2">
                            <button type="button" onClick={() => markAttendance(record._id, 'check-in')} className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-200">Check-in</button>
                            <button type="button" onClick={() => markAttendance(record._id, 'check-out')} className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-200">Check-out</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <GraduationCap className="text-amber-600" size={20} />
                      <h3 className="text-lg font-semibold text-slate-900">Staff Training Module</h3>
                    </div>
                    <form className="grid gap-3" onSubmit={submitTrainingRecord}>
                      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newTraining.staffId} onChange={(event) => setNewTraining((prev) => ({ ...prev, staffId: event.target.value }))} required>
                        <option value="">Select staff</option>
                        {staffMembers.map((member) => (
                          <option key={member._id} value={member._id}>{member.firstName} {member.lastName}</option>
                        ))}
                      </select>
                      <input type="text" placeholder="Training title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newTraining.title} onChange={(event) => setNewTraining((prev) => ({ ...prev, title: event.target.value }))} required />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newTraining.moduleType} onChange={(event) => setNewTraining((prev) => ({ ...prev, moduleType: event.target.value }))}>
                          <option>Certification</option>
                          <option>Product Knowledge</option>
                        </select>
                        <input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newTraining.validTill} onChange={(event) => setNewTraining((prev) => ({ ...prev, validTill: event.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" min="0" placeholder="Score" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newTraining.score} onChange={(event) => setNewTraining((prev) => ({ ...prev, score: event.target.value }))} />
                        <input type="number" min="1" placeholder="Max score" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newTraining.maxScore} onChange={(event) => setNewTraining((prev) => ({ ...prev, maxScore: event.target.value }))} />
                      </div>
                      <textarea rows={2} placeholder="Notes" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newTraining.notes} onChange={(event) => setNewTraining((prev) => ({ ...prev, notes: event.target.value }))} />
                      <button type="submit" className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Save Training</button>
                    </form>
                    <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
                      {staffOpsLoading ? <p className="text-sm text-slate-500">Loading training...</p> : trainingRecords.slice(0, 10).map((record) => (
                        <div key={record._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                          <p className="font-semibold text-slate-900">{record.title} • {record.moduleType}</p>
                          <p className="text-slate-600">{record.staffId?.firstName} {record.staffId?.lastName} • {record.score}/{record.maxScore}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="text-rose-600" size={20} />
                      <h3 className="text-lg font-semibold text-slate-900">Compliance Checklist</h3>
                    </div>
                    <form className="grid gap-3" onSubmit={submitComplianceItem}>
                      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newComplianceItem.itemType} onChange={(event) => setNewComplianceItem((prev) => ({ ...prev, itemType: event.target.value }))}>
                        <option>Drug License</option>
                        <option>GST Return</option>
                        <option>Regulatory Audit</option>
                        <option>Fire Safety</option>
                        <option>Narcotics Register</option>
                        <option>Cold Chain Log</option>
                        <option>Other</option>
                      </select>
                      <input type="text" placeholder="Checklist title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newComplianceItem.title} onChange={(event) => setNewComplianceItem((prev) => ({ ...prev, title: event.target.value }))} required />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newComplianceItem.dueDate} onChange={(event) => setNewComplianceItem((prev) => ({ ...prev, dueDate: event.target.value }))} required />
                        <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newComplianceItem.priority} onChange={(event) => setNewComplianceItem((prev) => ({ ...prev, priority: event.target.value }))}>
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                        <input type="number" min="0" placeholder="Reminder days" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newComplianceItem.reminderDaysBefore} onChange={(event) => setNewComplianceItem((prev) => ({ ...prev, reminderDaysBefore: event.target.value }))} />
                      </div>
                      <textarea rows={2} placeholder="Notes" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newComplianceItem.notes} onChange={(event) => setNewComplianceItem((prev) => ({ ...prev, notes: event.target.value }))} />
                      <button type="submit" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Add Compliance Item</button>
                    </form>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-rose-50 p-3 text-rose-700">Overdue: <span className="font-bold">{complianceReminders.overdue.length}</span></div>
                      <div className="rounded-xl bg-amber-50 p-3 text-amber-700">Upcoming: <span className="font-bold">{complianceReminders.upcoming.length}</span></div>
                    </div>

                    <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
                      {complianceLoading ? <p className="text-sm text-slate-500">Loading checklist...</p> : complianceItems.slice(0, 12).map((item) => (
                        <div key={item._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="text-slate-600">{item.itemType} • Due {new Date(item.dueDate).toLocaleDateString()} • {item.status}</p>
                          {item.status !== 'Completed' && (
                            <button type="button" onClick={() => markComplianceCompleted(item._id)} className="mt-2 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200">
                              Mark Completed
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === 'financialManagement' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Landmark className="text-teal-600" size={24} />
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Financial Management</h2>
                      <p className="text-sm text-slate-500">Invoices, reconciliation, suppliers, profit margins, and tax reporting.</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-teal-50 p-4">
                      <p className="text-xs text-teal-700">Invoices</p>
                      <p className="text-2xl font-bold text-teal-900">{invoiceSummary.totalInvoices || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-blue-50 p-4">
                      <p className="text-xs text-blue-700">Gross Sales</p>
                      <p className="text-2xl font-bold text-blue-900">${Number(invoiceSummary.grossSales || 0).toFixed(2)}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-4">
                      <p className="text-xs text-rose-700">Outstanding</p>
                      <p className="text-2xl font-bold text-rose-900">${Number(invoiceSummary.outstanding || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-teal-200 bg-teal-50 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-teal-900">Why Financial Management Helps Store Owners</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">You can instantly see cash stuck in outstanding invoices and improve collection speed.</div>
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">Profit and category margin trends show which medicines drive real earnings, not just sales volume.</div>
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">Supplier payment tracking helps avoid overdues, missed credits, and purchase planning mistakes.</div>
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">GST/tax summaries reduce filing errors and help keep compliance records audit-ready.</div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Receipt className="text-sky-600" size={20} />
                      <h3 className="text-lg font-semibold text-slate-900">Invoice Generation</h3>
                    </div>
                    <form className="grid gap-3" onSubmit={submitInvoice}>
                      <input type="text" placeholder="Customer name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newInvoice.customerName} onChange={(event) => setNewInvoice((prev) => ({ ...prev, customerName: event.target.value }))} />
                      <input type="text" placeholder="Customer GST number" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newInvoice.customerGstNumber} onChange={(event) => setNewInvoice((prev) => ({ ...prev, customerGstNumber: event.target.value }))} />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" min="0" step="0.01" placeholder="GST % default" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newInvoice.gstRateDefault} onChange={(event) => setNewInvoice((prev) => ({ ...prev, gstRateDefault: event.target.value }))} />
                        <input type="number" min="0" step="0.01" placeholder="Discount" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newInvoice.discount} onChange={(event) => setNewInvoice((prev) => ({ ...prev, discount: event.target.value }))} />
                        <input type="number" min="0" step="0.01" placeholder="Initial paid" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newInvoice.initialPaidAmount} onChange={(event) => setNewInvoice((prev) => ({ ...prev, initialPaidAmount: event.target.value }))} />
                      </div>
                      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newInvoice.paymentMethod} onChange={(event) => setNewInvoice((prev) => ({ ...prev, paymentMethod: event.target.value }))}>
                        <option>UPI</option>
                        <option>COD</option>
                        <option>Card</option>
                        <option>Net Banking</option>
                        <option>Wallet</option>
                        <option>Cash</option>
                        <option>Other</option>
                      </select>
                      <input type="text" placeholder="Payment reference" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newInvoice.paymentReference} onChange={(event) => setNewInvoice((prev) => ({ ...prev, paymentReference: event.target.value }))} />
                      <textarea rows={4} placeholder="Items: name,qty,unitPrice,gstRate,costPrice,category (one item per line)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newInvoice.itemsText} onChange={(event) => setNewInvoice((prev) => ({ ...prev, itemsText: event.target.value }))} required />
                      <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">Generate Invoice</button>
                    </form>
                    <div className="mt-4 max-h-52 space-y-2 overflow-y-auto">
                      {financeLoading ? <p className="text-sm text-slate-500">Loading invoices...</p> : invoices.slice(0, 8).map((invoice) => (
                        <div key={invoice._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                          <p className="font-semibold text-slate-900">{invoice.invoiceNumber} • {invoice.customerName || 'Walk-in Customer'}</p>
                          <p className="text-slate-600">Total ${Number(invoice.grandTotal || 0).toFixed(2)} • Paid ${Number(invoice.paidAmount || 0).toFixed(2)} • {invoice.paymentStatus}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Receipt className="text-violet-600" size={20} />
                      <h3 className="text-lg font-semibold text-slate-900">Payment Reconciliation</h3>
                    </div>
                    <form className="grid gap-3" onSubmit={submitInvoicePayment}>
                      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={paymentUpdate.invoiceId} onChange={(event) => setPaymentUpdate((prev) => ({ ...prev, invoiceId: event.target.value }))} required>
                        <option value="">Select invoice</option>
                        {invoices.map((invoice) => (
                          <option key={invoice._id} value={invoice._id}>{invoice.invoiceNumber} ({invoice.paymentStatus})</option>
                        ))}
                      </select>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" min="0" step="0.01" placeholder="Amount" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={paymentUpdate.amount} onChange={(event) => setPaymentUpdate((prev) => ({ ...prev, amount: event.target.value }))} required />
                        <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={paymentUpdate.method} onChange={(event) => setPaymentUpdate((prev) => ({ ...prev, method: event.target.value }))}>
                          <option>UPI</option>
                          <option>COD</option>
                          <option>Card</option>
                          <option>Net Banking</option>
                          <option>Wallet</option>
                          <option>Cash</option>
                          <option>Other</option>
                        </select>
                        <input type="text" placeholder="Reference" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={paymentUpdate.reference} onChange={(event) => setPaymentUpdate((prev) => ({ ...prev, reference: event.target.value }))} />
                      </div>
                      <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">Reconcile Payment</button>
                    </form>

                    {reconciliationSummary && (
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-50 p-3 text-slate-700">Billed: <span className="font-bold">${Number(reconciliationSummary.totalBilled || 0).toFixed(2)}</span></div>
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">Collected: <span className="font-bold">${Number(reconciliationSummary.totalCollected || 0).toFixed(2)}</span></div>
                        <div className="rounded-xl bg-rose-50 p-3 text-rose-700">Outstanding: <span className="font-bold">${Number(reconciliationSummary.totalOutstanding || 0).toFixed(2)}</span></div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">Paid invoices: <span className="font-bold">{Number(reconciliationSummary.statusSummary?.Paid || 0)}</span></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="text-emerald-700" size={20} />
                      <h3 className="text-lg font-semibold text-slate-900">Supplier Management</h3>
                    </div>
                    <form className="grid gap-3" onSubmit={submitSupplier}>
                      <input type="text" placeholder="Supplier name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newSupplier.name} onChange={(event) => setNewSupplier((prev) => ({ ...prev, name: event.target.value }))} required />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Contact person" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newSupplier.contactPerson} onChange={(event) => setNewSupplier((prev) => ({ ...prev, contactPerson: event.target.value }))} />
                        <input type="text" placeholder="Mobile" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newSupplier.mobile} onChange={(event) => setNewSupplier((prev) => ({ ...prev, mobile: event.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="email" placeholder="Email" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newSupplier.email} onChange={(event) => setNewSupplier((prev) => ({ ...prev, email: event.target.value }))} />
                        <input type="text" placeholder="GST number" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newSupplier.gstNumber} onChange={(event) => setNewSupplier((prev) => ({ ...prev, gstNumber: event.target.value }))} />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" min="0" placeholder="Terms days" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newSupplier.paymentTermsDays} onChange={(event) => setNewSupplier((prev) => ({ ...prev, paymentTermsDays: event.target.value }))} />
                        <input type="number" min="0" placeholder="Credit limit" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newSupplier.creditLimit} onChange={(event) => setNewSupplier((prev) => ({ ...prev, creditLimit: event.target.value }))} />
                        <input type="number" min="0" placeholder="Outstanding" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newSupplier.outstandingAmount} onChange={(event) => setNewSupplier((prev) => ({ ...prev, outstandingAmount: event.target.value }))} />
                      </div>
                      <textarea rows={2} placeholder="Notes" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newSupplier.notes} onChange={(event) => setNewSupplier((prev) => ({ ...prev, notes: event.target.value }))} />
                      <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Add Supplier</button>
                    </form>
                    <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
                      {supplierLoading ? <p className="text-sm text-slate-500">Loading suppliers...</p> : suppliers.map((supplier) => (
                        <div key={supplier._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                          <p className="font-semibold text-slate-900">{supplier.name}</p>
                          <p className="text-slate-600">Outstanding ${Number(supplier.outstandingAmount || 0).toFixed(2)} • Terms {supplier.paymentTermsDays} days</p>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <input type="number" min="0" step="0.01" placeholder="Payment" className="rounded-lg border border-slate-200 px-2 py-1 text-xs" value={supplierPaymentDraft[supplier._id]?.amount || ''} onChange={(event) => setSupplierPaymentDraft((prev) => ({ ...prev, [supplier._id]: { ...(prev[supplier._id] || {}), amount: event.target.value } }))} />
                            <select className="rounded-lg border border-slate-200 px-2 py-1 text-xs" value={supplierPaymentDraft[supplier._id]?.method || 'UPI'} onChange={(event) => setSupplierPaymentDraft((prev) => ({ ...prev, [supplier._id]: { ...(prev[supplier._id] || {}), method: event.target.value } }))}>
                              <option>UPI</option>
                              <option>Bank Transfer</option>
                              <option>Cash</option>
                              <option>Card</option>
                              <option>Cheque</option>
                              <option>Other</option>
                            </select>
                            <button type="button" onClick={() => submitSupplierPayment(supplier._id)} className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200">Add Payment</button>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button type="button" onClick={() => removeSupplier(supplier._id)} className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="text-cyan-700" size={20} />
                      <h3 className="text-lg font-semibold text-slate-900">Profit & Tax Reporting</h3>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">Revenue: <span className="font-bold">${Number(profitSummary?.totalRevenue || 0).toFixed(2)}</span></div>
                      <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">Profit: <span className="font-bold">${Number(profitSummary?.totalProfit || 0).toFixed(2)}</span></div>
                      <div className="rounded-xl bg-violet-50 p-3 text-violet-700">Margin: <span className="font-bold">{Number(profitSummary?.overallMarginPercent || 0).toFixed(2)}%</span></div>
                      <div className="rounded-xl bg-amber-50 p-3 text-amber-700">GST collected: <span className="font-bold">${Number(taxSummary?.gstCollected || 0).toFixed(2)}</span></div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-900">Profit by category</p>
                      <div className="mt-2 max-h-36 space-y-2 overflow-y-auto">
                        {profitByCategory.slice(0, 10).map((row) => (
                          <div key={row.category} className="rounded-lg border border-slate-200 p-2 text-xs text-slate-700">
                            {row.category}: Profit ${Number(row.profit || 0).toFixed(2)} ({Number(row.marginPercent || 0).toFixed(2)}%)
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-900">GST breakdown</p>
                      <div className="mt-2 max-h-36 space-y-2 overflow-y-auto">
                        {taxBreakdown.map((row) => (
                          <div key={String(row.gstRate)} className="rounded-lg border border-slate-200 p-2 text-xs text-slate-700">
                            GST {row.gstRate}%: Taxable ${Number(row.taxableSales || 0).toFixed(2)} • Collected ${Number(row.gstCollected || 0).toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === 'promotions' && (
              <div className="grid gap-6">
                {/* Header with Title and Add Button */}
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-fuchsia-50 to-purple-50 p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-fuchsia-600 p-3">
                        <BadgePercent className="text-white" size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">Promotional Campaigns</h2>
                        <p className="text-sm text-slate-600">Create and manage offers, coupons, and discounts</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCampaignForm(!showCampaignForm)}
                      className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 font-semibold text-white hover:bg-fuchsia-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      <Plus size={20} />
                      Add Campaign
                    </button>
                  </div>
                </div>

                {/* Campaign Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-600 font-medium">Total Campaigns</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{campaigns.length}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700 font-medium">Active</p>
                    <p className="text-3xl font-bold text-emerald-700 mt-2">
                      {campaigns.filter((c) => c.status === 'Active').length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-600 font-medium">Inactive</p>
                    <p className="text-3xl font-bold text-slate-700 mt-2">
                      {campaigns.filter((c) => c.status !== 'Active').length}
                    </p>
                  </div>
                </div>

                {/* Add Campaign Form - Collapsible */}
                {showCampaignForm && (
                  <div className="rounded-3xl border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-900">Create New Campaign</h3>
                      <button
                        type="button"
                        onClick={() => setShowCampaignForm(false)}
                        className="text-slate-400 hover:text-slate-600 text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    <form className="grid gap-4" onSubmit={submitPromotionalCampaign}>
                      {/* Campaign Type & Status */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Campaign Type</label>
                          <select
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            value={newCampaign.campaignType}
                            onChange={(event) => setNewCampaign((prev) => ({ ...prev, campaignType: event.target.value }))}
                          >
                            <option>Offer</option>
                            <option>Coupon</option>
                            <option>Bulk Discount</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                          <select
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            value={newCampaign.status}
                            onChange={(event) => setNewCampaign((prev) => ({ ...prev, status: event.target.value }))}
                          >
                            <option>Active</option>
                            <option>Inactive</option>
                            <option>Scheduled</option>
                          </select>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Campaign Title</label>
                        <input
                          type="text"
                          placeholder="e.g., Summer Sale 50% Off"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                          value={newCampaign.title}
                          onChange={(event) => setNewCampaign((prev) => ({ ...prev, title: event.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                        <textarea
                          rows={2}
                          placeholder="Describe your campaign..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                          value={newCampaign.description}
                          onChange={(event) => setNewCampaign((prev) => ({ ...prev, description: event.target.value }))}
                        />
                      </div>

                      {/* Coupon Code (if applicable) */}
                      {newCampaign.campaignType === 'Coupon' && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Coupon Code</label>
                          <input
                            type="text"
                            placeholder="SAVE20"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            value={newCampaign.couponCode}
                            onChange={(event) => setNewCampaign((prev) => ({ ...prev, couponCode: event.target.value.toUpperCase() }))}
                            required
                          />
                        </div>
                      )}

                      {/* Discount Settings */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Discount Settings</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Type</label>
                            <select
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                              value={newCampaign.discountType}
                              onChange={(event) => setNewCampaign((prev) => ({ ...prev, discountType: event.target.value }))}
                            >
                              <option>Percentage</option>
                              <option>Flat</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Value</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Amount or %"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                              value={newCampaign.discountValue}
                              onChange={(event) => setNewCampaign((prev) => ({ ...prev, discountValue: event.target.value }))}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Constraints */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Constraints</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Min Order Amount</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="$0"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                              value={newCampaign.minOrderAmount}
                              onChange={(event) => setNewCampaign((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Max Discount Cap</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="$0"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                              value={newCampaign.maxDiscountAmount}
                              onChange={(event) => setNewCampaign((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Validity Period */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Validity Period</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Valid From</label>
                            <input
                              type="date"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                              value={newCampaign.validFrom}
                              onChange={(event) => setNewCampaign((prev) => ({ ...prev, validFrom: event.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Valid Till</label>
                            <input
                              type="date"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                              value={newCampaign.validTill}
                              onChange={(event) => setNewCampaign((prev) => ({ ...prev, validTill: event.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Target Scope */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Target Scope</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Apply To</label>
                            <select
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                              value={newCampaign.targetScope}
                              onChange={(event) => setNewCampaign((prev) => ({ ...prev, targetScope: event.target.value }))}
                            >
                              <option>All</option>
                              <option>Category</option>
                              <option>Medicine</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Specific Item (Optional)</label>
                            <input
                              type="text"
                              placeholder="Category/Medicine ID"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                              value={newCampaign.targetValue}
                              onChange={(event) => setNewCampaign((prev) => ({ ...prev, targetValue: event.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bulk Discount Options */}
                      {newCampaign.campaignType === 'Bulk Discount' && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">Bulk Discount Terms</label>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Min Qty</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="Minimum"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                value={newCampaign.bulkMinQuantity}
                                onChange={(event) => setNewCampaign((prev) => ({ ...prev, bulkMinQuantity: event.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Buy Qty</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="To Buy"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                value={newCampaign.bulkBuyQuantity}
                                onChange={(event) => setNewCampaign((prev) => ({ ...prev, bulkBuyQuantity: event.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Get Qty</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="Get Free"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                value={newCampaign.bulkGetQuantity}
                                onChange={(event) => setNewCampaign((prev) => ({ ...prev, bulkGetQuantity: event.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Settings */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Usage Limit</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0 = Unlimited"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            value={newCampaign.usageLimit}
                            onChange={(event) => setNewCampaign((prev) => ({ ...prev, usageLimit: event.target.value }))}
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 w-full cursor-pointer hover:bg-slate-50">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded cursor-pointer"
                              checked={newCampaign.autoApply}
                              onChange={(event) => setNewCampaign((prev) => ({ ...prev, autoApply: event.target.checked }))}
                            />
                            <span className="font-medium">Auto Apply</span>
                          </label>
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          className="flex-1 rounded-xl bg-fuchsia-600 px-4 py-3 font-semibold text-white hover:bg-fuchsia-700 transition-colors"
                        >
                          Create Campaign
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCampaignForm(false)}
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Campaigns List */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">All Campaigns</h3>
                    <button
                      type="button"
                      onClick={loadPromotionalCampaigns}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>

                  {campaignsLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                      <p className="text-sm text-slate-500">Loading campaigns...</p>
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                      <BadgePercent className="mx-auto text-slate-400 mb-3" size={40} />
                      <p className="text-base font-semibold text-slate-600">No campaigns yet</p>
                      <p className="text-sm text-slate-500 mt-1">Create your first promotional campaign to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {campaigns.map((campaign) => (
                        <div
                          key={campaign._id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow"
                        >
                          {/* Header Badge */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1">
                              <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                                campaign.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                campaign.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                campaign.status === 'Inactive' ? 'bg-slate-100 text-slate-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {campaign.status}
                              </span>
                            </div>
                            <span className={`rounded-full p-2 ${
                              campaign.campaignType === 'Coupon' ? 'bg-purple-100' :
                              campaign.campaignType === 'Offer' ? 'bg-fuchsia-100' :
                              'bg-orange-100'
                            }`}>
                              <BadgePercent size={16} className={
                                campaign.campaignType === 'Coupon' ? 'text-purple-600' :
                                campaign.campaignType === 'Offer' ? 'text-fuchsia-600' :
                                'text-orange-600'
                              } />
                            </span>
                          </div>

                          {/* Campaign Info */}
                          <h4 className="font-bold text-slate-900 text-base mb-1">{campaign.title}</h4>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                              {campaign.campaignType}
                            </span>
                            <span className="text-sm font-bold text-fuchsia-600">
                              {campaign.discountValue}{campaign.discountType === 'Percentage' ? '%' : ' $'} off
                            </span>
                          </div>

                          {/* Description */}
                          {campaign.description && (
                            <p className="text-xs text-slate-600 mb-3 line-clamp-2">{campaign.description}</p>
                          )}

                          {/* Coupon Code */}
                          {campaign.couponCode && (
                            <div className="mb-3 rounded-lg bg-purple-50 p-2 text-center border border-purple-200">
                              <p className="text-[10px] text-purple-600 font-semibold uppercase">Code</p>
                              <p className="text-sm font-bold text-purple-700 tracking-wider">{campaign.couponCode}</p>
                            </div>
                          )}

                          {/* Key Details */}
                          <div className="mb-4 space-y-1 text-xs text-slate-600">
                            {campaign.minOrderAmount > 0 && (
                              <p>• Min Order: ${campaign.minOrderAmount}</p>
                            )}
                            {campaign.maxDiscountAmount > 0 && (
                              <p>• Max Discount: ${campaign.maxDiscountAmount}</p>
                            )}
                            {campaign.usageLimit > 0 && (
                              <p>• Usage Limit: {campaign.usageLimit}</p>
                            )}
                            {campaign.validFrom && (
                              <p>• Valid: {formatShortDate(campaign.validFrom)} - {formatShortDate(campaign.validTill)}</p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {campaign.status !== 'Active' && (
                              <button
                                type="button"
                                onClick={() => updateCampaignStatus(campaign._id, 'Active')}
                                className="flex-1 rounded-lg bg-emerald-100 px-2.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition-colors"
                              >
                                Activate
                              </button>
                            )}
                            {campaign.status !== 'Inactive' && (
                              <button
                                type="button"
                                onClick={() => updateCampaignStatus(campaign._id, 'Inactive')}
                                className="flex-1 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                              >
                                Deactivate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteCampaign(campaign._id)}
                              className="flex-1 rounded-lg bg-rose-100 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-200 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

                  <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ScanLine className="text-cyan-700" size={18} />
                        <p className="text-sm font-semibold text-cyan-900">Barcode / QR Quick Check-in & Check-out</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!barcodeScanning ? (
                          <button
                            type="button"
                            onClick={startBarcodeScanner}
                            className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700"
                          >
                            <Camera size={14} /> Scan with Camera
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopBarcodeScanner}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                          >
                            <CameraOff size={14} /> Stop Scan
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_92px_auto_auto]">
                      <input
                        type="text"
                        value={barcodeInput}
                        onChange={(event) => {
                          const code = event.target.value;
                          setBarcodeInput(code);
                          const matched = findInventoryItemByCode(code);
                          setBarcodeMatchedItemId(matched?._id || '');
                        }}
                        placeholder="Scan or enter barcode / QR value"
                        className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                      <input
                        type="number"
                        min="1"
                        value={barcodeActionQty}
                        onChange={(event) => setBarcodeActionQty(event.target.value)}
                        className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-900"
                        title="Quantity"
                      />
                      <button
                        type="button"
                        onClick={() => handleBarcodeAction('in')}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Check-in +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBarcodeAction('out')}
                        className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Check-out -
                      </button>
                    </div>

                    {barcodeScanning && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-cyan-200 bg-black">
                        <video ref={barcodeVideoRef} className="h-44 w-full object-cover" muted playsInline />
                      </div>
                    )}

                    {(barcodeMatchedItemId || barcodeLastCode) && (
                      <p className="mt-3 text-xs text-cyan-800">
                        {barcodeMatchedItemId
                          ? `Matched item ID: ${barcodeMatchedItemId}`
                          : `Last scanned code: ${barcodeLastCode}`}
                      </p>
                    )}
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
                <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {orderFilterConfig.map((filter) => {
                    const active = selectedOrderFilter === filter.key;
                    const count = orderStatusCounts[filter.key] || 0;
                    const palette = filter.key === 'delivered'
                      ? {
                        active: 'border-emerald-500 bg-emerald-100 text-emerald-900',
                        idle: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
                        badgeActive: 'bg-emerald-200 text-emerald-900',
                        badgeIdle: 'bg-white text-emerald-700',
                      }
                      : filter.key === 'outForDelivery'
                        ? {
                          active: 'border-blue-500 bg-blue-100 text-blue-900',
                          idle: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300',
                          badgeActive: 'bg-blue-200 text-blue-900',
                          badgeIdle: 'bg-white text-blue-700',
                        }
                        : filter.key === 'packed'
                          ? {
                            active: 'border-violet-500 bg-violet-100 text-violet-900',
                            idle: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300',
                            badgeActive: 'bg-violet-200 text-violet-900',
                            badgeIdle: 'bg-white text-violet-700',
                          }
                          : filter.key === 'pickup'
                            ? {
                              active: 'border-cyan-500 bg-cyan-100 text-cyan-900',
                              idle: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300',
                              badgeActive: 'bg-cyan-200 text-cyan-900',
                              badgeIdle: 'bg-white text-cyan-700',
                            }
                            : {
                              active: 'border-slate-500 bg-slate-100 text-slate-900',
                              idle: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400',
                              badgeActive: 'bg-slate-200 text-slate-900',
                              badgeIdle: 'bg-slate-100 text-slate-600',
                            };
                    return (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setSelectedOrderFilter(filter.key)}
                        className={`inline-flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${active ? palette.active : palette.idle}`}
                      >
                        <span>{filter.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? palette.badgeActive : palette.badgeIdle}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                  <div className="space-y-3">
                    {ordersLoading ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        Loading orders...
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        {orders.length === 0 ? 'No orders available yet.' : 'No orders match this filter.'}
                      </div>
                    ) : filteredOrders.map((order, index) => {
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
                  <button
                    type="button"
                    onClick={loadStorePrescriptions}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
                  >
                    Refresh List
                  </button>
                </div>
                <div className="mb-6 grid gap-3 sm:grid-cols-5">
                  {[
                    {
                      key: 'all',
                      label: 'Received',
                      count: prescriptionSummary.total,
                      active: 'ring-2 ring-slate-300 border-slate-400',
                      idle: 'border-slate-200',
                      card: 'bg-slate-50',
                      labelColor: 'text-slate-500',
                      valueColor: 'text-slate-900',
                    },
                    {
                      key: 'pending',
                      label: 'Pending',
                      count: prescriptionSummary.pending,
                      active: 'ring-2 ring-amber-300 border-amber-400',
                      idle: 'border-amber-200',
                      card: 'bg-amber-50',
                      labelColor: 'text-amber-700',
                      valueColor: 'text-amber-900',
                    },
                    {
                      key: 'approved',
                      label: 'Approved',
                      count: prescriptionSummary.approved,
                      active: 'ring-2 ring-emerald-300 border-emerald-400',
                      idle: 'border-emerald-200',
                      card: 'bg-emerald-50',
                      labelColor: 'text-emerald-700',
                      valueColor: 'text-emerald-900',
                    },
                    {
                      key: 'rejected',
                      label: 'Rejected',
                      count: prescriptionSummary.rejected,
                      active: 'ring-2 ring-rose-300 border-rose-400',
                      idle: 'border-rose-200',
                      card: 'bg-rose-50',
                      labelColor: 'text-rose-700',
                      valueColor: 'text-rose-900',
                    },
                    {
                      key: 'ordered',
                      label: 'Ordered',
                      count: prescriptionSummary.ordered,
                      active: 'ring-2 ring-cyan-300 border-cyan-400',
                      idle: 'border-cyan-200',
                      card: 'bg-cyan-50',
                      labelColor: 'text-cyan-700',
                      valueColor: 'text-cyan-900',
                    },
                  ].map((tile) => {
                    const active = prescriptionStatusFilter === tile.key;
                    return (
                      <button
                        key={tile.key}
                        type="button"
                        onClick={() => setPrescriptionStatusFilter(tile.key)}
                        className={`rounded-2xl border p-4 text-left transition ${tile.card} ${active ? tile.active : tile.idle}`}
                      >
                        <p className={`text-xs ${tile.labelColor}`}>{tile.label}</p>
                        <p className={`text-2xl font-bold ${tile.valueColor}`}>{tile.count}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Filter By Staff Member</label>
                    <select
                      value={prescriptionReviewerFilter}
                      onChange={(event) => setPrescriptionReviewerFilter(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                    >
                      <option value="all">All Staff Members</option>
                      {reviewerFilterOptions.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Search Reviewer</label>
                    <input
                      value={reviewerSearchQuery}
                      onChange={(event) => setReviewerSearchQuery(event.target.value)}
                      placeholder="Type reviewer name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-3">
                    {prescriptionsLoading ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        Loading prescription requests...
                      </div>
                    ) : filteredPrescriptions.length === 0 ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        {prescriptions.length === 0 ? 'No prescription requests yet.' : 'No prescriptions in this status.'}
                      </div>
                    ) : filteredPrescriptions.map((prescription, index) => {
                      const active = prescription._id === selectedPrescriptionId;
                      const normalizedStatus = String(prescription.status || 'pending').toLowerCase();
                      return (
                        <button
                          key={prescription._id}
                          type="button"
                          onClick={() => {
                            setSelectedPrescriptionId(prescription._id);
                            setShowPendingReviewWorkspace(normalizedStatus === 'pending');
                          }}
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
                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            <p>Uploaded: {prescription.createdAt ? new Date(prescription.createdAt).toLocaleString() : 'N/A'}</p>
                            {(normalizedStatus === 'approved' || normalizedStatus === 'rejected') && (
                              <p>{normalizedStatus === 'approved' ? 'Approved' : 'Rejected'}: {prescription.reviewedAt ? new Date(prescription.reviewedAt).toLocaleString() : 'N/A'}</p>
                            )}
                          </div>
                          {(normalizedStatus === 'approved' || normalizedStatus === 'rejected') && (
                            <p className="mt-2 text-xs text-slate-500">By {prescription.reviewedByName || 'Store Admin'}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPendingPrescription && showPendingReviewWorkspace && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <>
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Review Prescription</p>
                            <h3 className="text-2xl font-semibold text-slate-900">{selectedPendingPrescription.userId?.name || 'Unknown User'}</h3>
                            <p className="text-sm text-slate-500">{selectedPendingPrescription.userId?.email || 'No email available'}</p>
                            {(String(selectedPendingPrescription.status || '').toLowerCase() === 'approved' || String(selectedPendingPrescription.status || '').toLowerCase() === 'rejected') && (
                              <p className="text-xs text-slate-500 mt-1">
                                Reviewed by {selectedPendingPrescription.reviewedByName || 'Store Admin'} ({selectedPendingPrescription.reviewedByRole || 'Store Admin'})
                                {selectedPendingPrescription.reviewedAt ? ` on ${new Date(selectedPendingPrescription.reviewedAt).toLocaleString()}` : ''}
                              </p>
                            )}
                          </div>
                          <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${selectedPendingPrescription.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedPendingPrescription.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {selectedPendingPrescription.status?.charAt(0).toUpperCase() + selectedPendingPrescription.status?.slice(1)}
                          </span>
                        </div>
                        <div className="mb-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <p className="text-xs font-semibold text-blue-600 uppercase">Uploaded Date</p>
                            <p className="text-sm font-semibold text-blue-900">
                              {selectedPendingPrescription.createdAt ? new Date(selectedPendingPrescription.createdAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                          {(String(selectedPendingPrescription.status || '').toLowerCase() === 'approved' || String(selectedPendingPrescription.status || '').toLowerCase() === 'rejected') && (
                            <div className={`rounded-lg border p-3 ${String(selectedPendingPrescription.status || '').toLowerCase() === 'approved' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                              <p className={`text-xs font-semibold uppercase ${String(selectedPendingPrescription.status || '').toLowerCase() === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {String(selectedPendingPrescription.status || '').toLowerCase() === 'approved' ? 'Approved Date' : 'Rejected Date'}
                              </p>
                              <p className={`text-sm font-semibold ${String(selectedPendingPrescription.status || '').toLowerCase() === 'approved' ? 'text-emerald-900' : 'text-red-900'}`}>
                                {selectedPendingPrescription.reviewedAt ? new Date(selectedPendingPrescription.reviewedAt).toLocaleString() : 'N/A'}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">Reviewed by: {selectedPendingPrescription.reviewedByName || 'Store Admin'}</p>
                            </div>
                          )}
                        </div>

                        {selectedPrescriptionFileUrl && String(selectedPendingPrescription.status || '').toLowerCase() === 'pending' && (
                          <div className="rounded-3xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-slate-800">Attachment</p>
                                <p className="text-sm text-slate-500">{selectedPendingPrescription.fileName}</p>
                              </div>
                            </div>
                            <div className="mt-4">
                              {String(selectedPendingPrescription.mimeType || '').startsWith('image/') ? (
                                <img
                                  src={selectedPrescriptionFileUrl}
                                  alt={selectedPendingPrescription.fileName}
                                  className="w-full rounded-3xl border border-slate-200 object-contain"
                                />
                              ) : selectedPendingPrescription.mimeType === 'application/pdf' ? (
                                <div className="overflow-hidden rounded-3xl border border-slate-200">
                                  <object data={selectedPrescriptionFileUrl} type="application/pdf" width="100%" height="320">
                                    <div className="p-4 text-sm text-slate-500">
                                      PDF preview not available.{' '}
                                      <a href={selectedPrescriptionFileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                                        Open document
                                      </a>
                                    </div>
                                  </object>
                                </div>
                              ) : (
                                <a href={selectedPrescriptionFileUrl} target="_blank" rel="noreferrer" className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                  View attachment
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                          <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">Decision Workspace: Pending Prescription</p>
                              {!showApprovalItemsSection ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowApprovalItemsSection(true);
                                    setApprovalItems([createEmptyApprovalItem()]);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                                >
                                  <Plus size={14} /> Add Medicine
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setApprovalItems((prev) => [
                                      ...prev,
                                      createEmptyApprovalItem()
                                    ])
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                                >
                                  <Plus size={14} /> Add Another Medicine
                                </button>
                              )}
                            </div>

                            {showApprovalItemsSection && (
                            <>
                            <div className="space-y-3">
                              {approvalItems.map((item, index) => {
                                const medicineNameQuery = String(item.name || '').trim();
                                const canSearchMedicines = medicineNameQuery.length >= PRESCRIPTION_MED_SEARCH_MIN_CHARS;
                                const medicineSuggestions = getPrescriptionMedicineSuggestions(medicineNameQuery);

                                return (
                                <div key={`approval-item-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="relative">
                                      <input
                                        value={item.name}
                                        onChange={(event) => handleApprovalMedicineNameInputChange(index, event.target.value)}
                                        placeholder="Medicine name"
                                        className={`w-full rounded-lg border px-3 py-2 text-sm ${approvalItemErrors[index]?.name ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                                      />
                                      {medicineNameQuery.length > 0 && !canSearchMedicines && (
                                        <p className="mt-1 text-[11px] text-slate-500">
                                          Type at least {PRESCRIPTION_MED_SEARCH_MIN_CHARS} characters to search medicines.
                                        </p>
                                      )}
                                      {canSearchMedicines && !item.medicineId && medicineSuggestions.length > 0 && (
                                        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                                          {medicineSuggestions.map((medicine) => (
                                            <button
                                              key={medicine.id}
                                              type="button"
                                              onClick={() => applySuggestedMedicineToApprovalItem(index, medicine)}
                                              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-slate-50"
                                            >
                                              <p className="font-semibold text-slate-800">{medicine.name}</p>
                                              <p className="text-slate-500">
                                                {[medicine.manufacturer, medicine.dosage, medicine.type].filter(Boolean).join(' • ') || 'General'}
                                              </p>
                                              <p className="text-slate-600">Price: {medicine.price}</p>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                      {canSearchMedicines && !item.medicineId && medicineSuggestions.length === 0 && (
                                        <p className="mt-1 text-[11px] text-slate-500">No medicines found in inventory.</p>
                                      )}
                                    </div>
                                    <input
                                      value={item.quantity}
                                      onChange={(event) => handleApprovalItemChange(index, 'quantity', event.target.value)}
                                      placeholder="Qty"
                                      type="number"
                                      min="1"
                                      className={`rounded-lg border px-3 py-2 text-sm ${approvalItemErrors[index]?.quantity ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                                    />
                                    <input
                                      value={item.unitPrice}
                                      onChange={(event) => handleApprovalItemChange(index, 'unitPrice', event.target.value)}
                                      placeholder="Unit price"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      className={`rounded-lg border px-3 py-2 text-sm ${approvalItemErrors[index]?.unitPrice ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                                    />
                                    <input
                                      value={item.unit}
                                      onChange={(event) => handleApprovalItemChange(index, 'unit', event.target.value)}
                                      placeholder="Unit"
                                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                  </div>
                                  {(approvalItemErrors[index]?.name || approvalItemErrors[index]?.quantity || approvalItemErrors[index]?.unitPrice) && (
                                    <p className="mt-2 text-xs font-medium text-rose-700">
                                      {approvalItemErrors[index]?.name ? 'Medicine name is required. ' : ''}
                                      {approvalItemErrors[index]?.quantity ? 'Quantity must be greater than 0. ' : ''}
                                      {approvalItemErrors[index]?.unitPrice ? 'Unit price cannot be negative.' : ''}
                                    </p>
                                  )}
                                  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
                                    <input
                                      value={item.instructions}
                                      onChange={(event) => handleApprovalItemChange(index, 'instructions', event.target.value)}
                                      placeholder="Instructions (optional)"
                                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                      <input
                                        value={item.substitutionReason}
                                        onChange={(event) => handleApprovalItemChange(index, 'substitutionReason', event.target.value)}
                                        placeholder="Substitution reason (optional)"
                                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveApprovalItem(index)}
                                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                                      >
                                        <Trash2 size={14} /> Remove
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                );
                              })}
                            </div>

                                <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Discount</label>
                                <input
                                  value={approvalTotalsDraft.discount}
                                  onChange={(event) => setApprovalTotalsDraft((prev) => ({ ...prev, discount: event.target.value }))}
                                  placeholder="Discount"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Delivery Charge</label>
                                <input
                                  value={approvalTotalsDraft.deliveryCharge}
                                  onChange={(event) => setApprovalTotalsDraft((prev) => ({ ...prev, deliveryCharge: event.target.value }))}
                                  placeholder="Delivery charge"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={handleAutoFillApprovalTotals}
                                  className="w-full rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                                >
                                  Auto Fill From Medicines
                                </button>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Currency</label>
                                <input
                                  value={approvalTotalsDraft.currency}
                                  onChange={(event) => setApprovalTotalsDraft((prev) => ({ ...prev, currency: event.target.value }))}
                                  placeholder="Currency"
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Quote Expiry (Hours)</label>
                                <input
                                  value={approvalTotalsDraft.quoteExpiresInHours}
                                  onChange={(event) => setApprovalTotalsDraft((prev) => ({ ...prev, quoteExpiresInHours: event.target.value }))}
                                  placeholder="Quote expiry hours"
                                  type="number"
                                  min="1"
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                Calculated Total: {approvalCalculatedGrandTotal.toFixed(2)} {String(approvalTotalsDraft.currency || 'INR').toUpperCase()}
                              </div>
                            </div>

                            <textarea
                              value={approvalReviewNotes}
                              onChange={(event) => setApprovalReviewNotes(event.target.value)}
                              rows={3}
                              placeholder="Review notes (shown to patient)"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />

                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => updatePrescriptionStatus(selectedPendingPrescription._id, 'Approved')}
                                disabled={selectedPendingPrescription.status === 'approved' || !canApprovePrescription}
                                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <CheckCircle2 size={18} /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => updatePrescriptionStatus(selectedPendingPrescription._id, 'Rejected')}
                                disabled={selectedPendingPrescription.status === 'rejected'}
                                className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition"
                              >
                                <XCircle size={18} /> Reject
                              </button>
                            </div>
                              </>
                            )}
                          </div>
                      </>
                  </div>
                  )}
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

            {selectedSection === 'reviews' && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
                  <div className="border-r border-slate-200 p-6 max-h-[640px] overflow-y-auto">
                    <p className="mb-4 text-sm font-medium text-slate-500">Store Reviews ({storeReviews.length})</p>
                    {storeReviewsLoading ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                        Loading reviews...
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {storeReviews.map((review) => {
                          const active = selectedReviewId === review._id;
                          const hasReply = Boolean(String(review?.storeResponse?.message || '').trim());
                          return (
                            <button
                              key={review._id}
                              onClick={() => {
                                setSelectedReviewId(review._id);
                                setReviewReplyText(review?.storeResponse?.message || '');
                              }}
                              className={`w-full rounded-2xl border p-3.5 text-left transition ${
                                active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <p className="text-sm font-semibold text-slate-800 truncate">{review.name || 'Patient'}</p>
                                <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                  hasReply ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {hasReply ? 'Replied' : 'Pending Reply'}
                                </span>
                              </div>
                              <p className="text-xs text-amber-500">{'★'.repeat(Math.max(1, Number(review.rating) || 1))}</p>
                              <p className="mt-1 text-xs text-slate-600 line-clamp-2">{review.comment}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {selectedStoreReview ? (
                      <div>
                        <div className="mb-6 flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">{selectedStoreReview.name || 'Patient'}</h3>
                            <p className="text-sm text-slate-500">{selectedStoreReview.role || 'Patient'}</p>
                            <p className="mt-2 text-xs text-slate-400">Review Date: {formatShortDate(selectedStoreReview.createdAt)}</p>
                          </div>
                          <span className="inline-flex rounded-full px-3 py-1 text-sm font-semibold bg-amber-100 text-amber-700">
                            {Number(selectedStoreReview.rating) || 0} / 5
                          </span>
                        </div>

                        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-700 mb-2">Patient Feedback</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{selectedStoreReview.comment}</p>
                        </div>

                        {selectedStoreReview?.storeResponse?.message ? (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
                            <p className="text-sm font-semibold text-emerald-900 mb-2">Your Reply</p>
                            <p className="text-sm text-emerald-800">{selectedStoreReview.storeResponse.message}</p>
                          </div>
                        ) : null}

                        <div className="mb-6">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {selectedStoreReview?.storeResponse?.message ? 'Update Reply' : 'Write Reply'}
                          </label>
                          <textarea
                            value={reviewReplyText}
                            onChange={(e) => setReviewReplyText(e.target.value)}
                            rows={5}
                            placeholder="Thank the patient and share a helpful response..."
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 resize-none"
                          />
                        </div>

                        <button
                          onClick={() => handleSubmitReviewReply(selectedStoreReview._id)}
                          disabled={!reviewReplyText.trim() || reviewReplySubmitting}
                          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={18} /> {reviewReplySubmitting ? 'Posting...' : (selectedStoreReview?.storeResponse?.message ? 'Update Reply' : 'Post Reply')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <p className="text-sm text-slate-500">Select a review from the left to view and respond.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedSection === 'reports' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="text-cyan-300" size={24} />
                    <div>
                      <h2 className="text-xl font-semibold">Revenue Command Center</h2>
                      <p className="text-sm text-slate-200">Precise financial snapshot for Store Admin.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-100">Month-wise Revenue</p>
                      <p className="mt-2 text-2xl font-bold text-white">{formatUSD(revenueSummary.monthly)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-100">Overall Orders Revenue</p>
                      <p className="mt-2 text-2xl font-bold text-white">{formatUSD(reportTotalRevenue)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-100">Today&apos;s Revenue</p>
                      <p className="mt-2 text-2xl font-bold text-white">{formatUSD(revenueSummary.revenueToday)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-100">Today&apos;s Orders</p>
                      <p className="mt-2 text-2xl font-bold text-white">{todayOrdersCount}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Monthly Order Revenue Trend</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Last {monthWiseRevenue.length || 0} months</span>
                    </div>

                    {monthWiseRevenue.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No order data available for monthly breakdown yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {monthWiseRevenue.map((month) => (
                          <div key={month.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">{month.label}</p>
                              <p className="text-sm font-semibold text-slate-900">{formatUSD(month.revenue)}</p>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
                                style={{ width: `${maxMonthRevenue > 0 ? Math.max(8, Math.round((month.revenue / maxMonthRevenue) * 100)) : 0}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Orders: {month.orders}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Order Health</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{reportCompletionRate}%</p>
                      <p className="mt-1 text-sm text-slate-600">Completion rate</p>
                      <p className="mt-3 text-sm text-slate-700">{reportCompletedOrders} completed / {reportOrdersTotal} total orders</p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Average Order Value</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{formatUSD(reportAverageOrderValue)}</p>
                      <p className="mt-1 text-sm text-slate-600">Across all fulfilled and active orders</p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Week-over-Week Growth</p>
                      <p className={`mt-2 text-2xl font-bold ${revenueSummary.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {revenueSummary.growth >= 0 ? '+' : ''}{revenueSummary.growth}%
                      </p>
                      <p className="mt-1 text-sm text-slate-600">Compared with the previous week</p>
                    </div>
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
