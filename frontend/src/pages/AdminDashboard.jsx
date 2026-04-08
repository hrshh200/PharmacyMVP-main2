import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Store, PlusSquare, ShieldCheck, BarChart3, ClipboardCheck, FileText } from 'lucide-react';
import { baseURL } from '../main';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [activePanel, setActivePanel] = useState('stores');
  const [stores, setStores] = useState([]);

  const [refreshCounter, setRefreshCounter] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [storeRequests, setStoreRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [editingStoreId, setEditingStoreId] = useState(null);
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    ownerName: '',
    countryCode: '+91',
    mobile: '',
    email: '',
    licenceNumber: '',
    gstNumber: '',
    city: '',
    address: '',
    state: '',
    pincode: '',
    licenceDocumentName: '',
    licenceDocumentFile: null,
    status: 'Active',
  });

  const activeStores = stores.filter((store) => store.status === 'Active').length;
  const inactiveStores = stores.length - activeStores;
  const pendingRequests = storeRequests.filter((req) => req.status === 'pending').length;

  const resetStoreForm = () => {
    setStoreForm({
      storeName: '',
      ownerName: '',
      countryCode: '+91',
      mobile: '',
      email: '',
      licenceNumber: '',
      gstNumber: '',
      city: '',
      address: '',
      state: '',
      pincode: '',
      licenceDocumentName: '',
      licenceDocumentFile: null,
      status: 'Active',
    });
  };

  useEffect(() => {
    if (!toast.show) return;
    const id = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
    return () => clearTimeout(id);
  }, [toast.show]);

  // Fetch store approval requests from backend
  const fetchStoreRequests = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      setRequestsLoading(true);
      const response = await axios.get(`${baseURL}/store-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStoreRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch store requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };
  useEffect(() => {
    fetchStoreRequests();
  }, [refreshCounter]);

  const openStoreForm = () => {
    setEditingStoreId(null);
    setActivePanel('addStore');
    resetStoreForm();
  };

  // Handle form input changes for store details
  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStoreForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoreLicenceUpload = (e) => {
    const file = e.target.files?.[0] || null;
    setStoreForm((prev) => ({
      ...prev,
      licenceDocumentFile: file,
      licenceDocumentName: file?.name || prev.licenceDocumentName,
    }));
  };

  // Save new store or update existing store details
  const saveStore = async (e) => {
  e.preventDefault();

  const required = [
    storeForm.storeName,
    storeForm.ownerName,
    storeForm.mobile,
    storeForm.email,
    storeForm.licenceNumber,
    storeForm.city,
    storeForm.address,
    storeForm.state,
    storeForm.pincode,
    storeForm.licenceDocumentName,
  ];

  if (required.some((field) => !field)) {
    setToast({
      show: true,
      message: "Please fill all required fields",
      type: "error",
    });
    return;
  }

  const payload = {
    ...storeForm,
    licenceDocumentName:
      storeForm.licenceDocumentFile?.name || storeForm.licenceDocumentName,
    licenceDocumentFile: null,
  };

  const token = localStorage.getItem('medVisionToken');
  if (!token) return;

  try {
    const response = await axios.post(`${baseURL}/stores`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data) {
      setToast({
        show: true,
        message: "Store Added Successfully",
        type: "success",
      });

      setActivePanel('stores');
      setEditingStoreId(null);
      resetStoreForm();
    }

  } catch (error) {
    console.error('Failed to save store:', error);

    setToast({
      show: true,
      message: error?.response?.data?.message || "Failed to add store",
      type: "error",
    });
  }
};

  // Load store details into form for editing
  const editStore = (store) => {
    setEditingStoreId(store.id);
    setActivePanel('addStore');
    setStoreForm({
      ...store,
      licenceDocumentFile: null,
    });
  };

  // Toggle store status between Active and Inactive
  const toggleStoreStatus = async (store) => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    const newStatus = store.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await axios.patch(
        `${baseURL}/stores/${store._id}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStores((prev) =>
        prev.map((s) =>
          s._id === store._id ? { ...s, status: newStatus } : s
        )
      );

    } catch (error) {
      console.error('Failed to toggle store status:', error.response?.data || error.message);
    }
  };
  // Handle approval or rejection of store signup requests and will send the confirmation email to the Store user.
  const reviewStoreRequest = async (requestId, status) => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      await axios.patch(
        `${baseURL}/store-requests/${requestId}/review`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // optimistic update of local state
      setStoreRequests((prev) =>
        prev.map((request) =>
          request._id === requestId
            ? { ...request, status, reviewedAt: new Date().toISOString() }
            : request
        )
      );

      setToast({
        show: true,
        message: `Request ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        type: 'success',
      });
      setRefreshCounter((c) => c + 1);
    } catch (error) {
      console.error('Failed to review store request:', error);
      setToast({
        show: true,
        message: 'Failed to update request. Try again.',
        type: 'error',
      });
    }
  };

  const getAllStores = async () => {
    const token = localStorage.getItem('medVisionToken');
    if (!token) return;

    try {
      const response = await axios.get(`${baseURL}/allstores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStores(response.data.stores);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  };

  useEffect(() => {
    getAllStores();
  }, [refreshCounter]);

  const sidebarItems = [
    { key: 'stores', icon: Store, text: 'Stores List' },
    { key: 'addStore', icon: PlusSquare, text: 'Add Store' },
    { key: 'requests', icon: ClipboardCheck, text: 'Store Approval Requests' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {toast.show && (
        <div className="fixed right-6 top-6 z-50">
          <div className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.message}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8 sm:pt-10">
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                Admin Control Hub
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Admin Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                Manage pharmacy stores, review store signup requests, and control network onboarding from one central panel.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
              <button
                type="button"
                onClick={openStoreForm}
                className="rounded-2xl border border-blue-300/30 bg-blue-500/20 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
              >
                Add Store
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-2xl border border-cyan-300/30 bg-cyan-500/20 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
              >
                Back To Home
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
            <div className="mb-8">
              <p className="text-sm text-slate-500">Admin Panel</p>
              <h2 className="text-2xl font-semibold text-slate-900 mt-2">Control Center</h2>
              <p className="mt-2 text-sm text-slate-600">Manage stores and store approval workflows.</p>
            </div>
            <div className="space-y-3">
              {sidebarItems.map((item) => {
                const active = activePanel === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActivePanel(item.key)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${active
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-600'}`} />
                    <span>{item.text}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="inline-flex rounded-xl bg-blue-100 p-2 text-blue-700">
                  <Store size={18} />
                </div>
                <p className="mt-3 text-sm text-slate-500">Total Stores</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{stores.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <ShieldCheck size={18} />
                </div>
                <p className="mt-3 text-sm text-slate-500">Active Stores</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{activeStores}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="inline-flex rounded-xl bg-amber-100 p-2 text-amber-700">
                  <BarChart3 size={18} />
                </div>
                <p className="mt-3 text-sm text-slate-500">Inactive Stores</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{inactiveStores}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="inline-flex rounded-xl bg-violet-100 p-2 text-violet-700">
                  <ClipboardCheck size={18} />
                </div>
                <p className="mt-3 text-sm text-slate-500">Pending Requests</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{pendingRequests}</p>
              </div>
            </div>

            {activePanel === 'stores' && (
              <div className="grid gap-6 lg:grid-cols-1">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Stores List</h2>
                      <p className="text-sm text-slate-500">Review all active and inactive stores.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {stores.length} stores
                    </span>
                  </div>
                  <div className="space-y-4">
                    {stores.map((store) => (
                      <div key={store.id} className="rounded-3xl border border-slate-200 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{store.storeName}</h3>
                            <p className="text-sm text-slate-500">{store.city} • {store.ownerName}</p>
                            <p className="text-sm text-slate-500 mt-2">{store.address}</p>
                            <p className="text-sm text-slate-500">State/Pincode: {store.state} - {store.pincode}</p>
                            <p className="text-sm text-slate-500">Contact: {store.countryCode} {store.mobile}</p>
                            <p className="text-sm text-slate-500">Email: {store.email}</p>
                            <p className="text-sm text-slate-500">Licence: {store.licenceNumber}</p>
                            <p className="text-sm text-slate-500">Licence Doc: {store.licenceDocumentName || 'N/A'}</p>
                          </div>
                          <div className="flex flex-col gap-3 items-start sm:items-end">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${store.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {store.status}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => editStore(store)}
                                className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                              >
                                Manage
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleStoreStatus(store)}
                                className="rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                              >
                                {store.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'addStore' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{editingStoreId ? 'Edit Store' : 'Add Store'}</h2>
                    <p className="text-sm text-slate-500">{editingStoreId ? 'Update store details and status.' : 'Add a new store to the network.'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePanel('stores');
                      setEditingStoreId(null);
                      resetStoreForm();
                    }}
                    className="rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Back To Stores
                  </button>
                </div>
                <form className="space-y-4" onSubmit={saveStore}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Store Name</label>
                    <input
                      name="storeName"
                      value={storeForm.storeName}
                      onChange={handleStoreChange}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Enter store name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Owner Name</label>
                    <input
                      name="ownerName"
                      value={storeForm.ownerName}
                      onChange={handleStoreChange}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Enter owner name"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Code</label>
                      <select
                        name="countryCode"
                        value={storeForm.countryCode}
                        onChange={handleStoreChange}
                        className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+61">+61</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Contact Number</label>
                      <input
                        name="mobile"
                        value={storeForm.mobile}
                        onChange={handleStoreChange}
                        className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Enter contact number"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      value={storeForm.email}
                      onChange={handleStoreChange}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Licence Number</label>
                    <input
                      name="licenceNumber"
                      value={storeForm.licenceNumber}
                      onChange={handleStoreChange}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Enter licence number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">GST Number</label>
                    <input
                      name="gstNumber"
                      value={storeForm.gstNumber}
                      onChange={handleStoreChange}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Enter GST number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">City</label>
                    <input
                      name="city"
                      value={storeForm.city}
                      onChange={handleStoreChange}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Address</label>
                    <textarea
                      name="address"
                      value={storeForm.address}
                      onChange={handleStoreChange}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Enter full address"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">State</label>
                      <input
                        name="state"
                        value={storeForm.state}
                        onChange={handleStoreChange}
                        className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Enter state"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Pincode</label>
                      <input
                        name="pincode"
                        value={storeForm.pincode}
                        onChange={handleStoreChange}
                        className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Enter pincode"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Upload Store Licence Document</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleStoreLicenceUpload}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:text-blue-700"
                      required={!editingStoreId}
                    />
                    {storeForm.licenceDocumentName && (
                      <p className="mt-2 text-xs text-slate-500">Selected: {storeForm.licenceDocumentName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    <select
                      name="status"
                      value={storeForm.status}
                      onChange={handleStoreChange}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                  >
                    {editingStoreId ? 'Update Store' : 'Add Store'}
                  </button>
                </form>
              </div>
            )}

            {activePanel === 'requests' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Store Approval Requests</h2>
                    <p className="text-sm text-slate-500">Review pending signup requests submitted by store owners.</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchStoreRequests}
                    className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Refresh
                  </button>
                </div>

                {requestsLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Loading store requests...
                  </div>
                ) : storeRequests.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No store approval requests found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {storeRequests.map((request) => (
                      <div key={request._id} className="rounded-3xl border border-slate-200 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{request.storeName}</h3>
                            <p className="text-sm text-slate-500">{request.city} • {request.ownerName}</p>
                            <p className="text-sm text-slate-500 mt-2">{request.address}</p>
                            <p className="text-sm text-slate-500">Contact: {request.countryCode} {request.mobile}</p>
                            <p className="text-sm text-slate-500">Email: {request.email}</p>
                            <p className="text-sm text-slate-500">Licence Number: {request.licenceNumber}</p>
                            <p className="text-sm text-slate-500">GST: {request.gstNumber || 'N/A'}</p>
                            <a
                              href={`${baseURL.replace('/api', '')}/${request.licenceDocument?.filePath?.replace(/\\/g, '/')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              <FileText size={16} />
                              View Uploaded Licence
                            </a>
                          </div>

                          <div className="flex flex-col gap-3 items-start sm:items-end">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : request.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                              }`}>
                              {request.status}
                            </span>

                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => reviewStoreRequest(request._id, 'approved')}
                                  className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => reviewStoreRequest(request._id, 'rejected')}
                                  className="rounded-2xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        <footer className="mt-10 rounded-3xl border border-blue-900/40 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">MedVision Admin Dashboard</p>
              <p className="text-xs text-slate-300">Centralized control for pharmacy store network operations.</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-blue-200">
              <span>Admin Support: admin@medvision.store</span>
              <span className="hidden sm:inline text-blue-400">|</span>
              <span>Mon-Sat, 9:00 AM - 7:00 PM</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;
