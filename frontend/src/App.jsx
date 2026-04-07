import { Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './components/Route/ProtectedRoute';
import PublicRoute from "./components/Route//PublicRoute";

//pages
import Layout from './pages/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OnlinePharmacy from './pages/OnlinePharmacy';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import DiseasePrediction from './pages/DiseasePrediction';
import HeartPrediction from './pages/HeartPrediction';
import PatientProfile from './pages/PatientProfile';
import StoreDashboard from './pages/StoreDashboard';
import EmergencyCare from './pages/EmergencyCare';
import AddMedicine from './pages/AddMedicine';
import DeleteMedicine from './pages/DeleteMedicine';
import UpdateMedicine from './pages/UpdateMedicine';
import Tracking from './pages/Tracking';
import { AddressPage } from './pages/AddressPage';
import { PaymentPage } from './pages/PaymentPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import Orders from './pages/Orders';
import AdminTracking from './pages/AdminTracking';
import LungCancer from './pages/LungCancer';
import KidneyPrediction from './pages/KidneyPrediction';
import MyVaccination from './pages/MyVaccinations';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import ContactUs from './pages/ContactUs';
import NotFound from './pages/NotFound';
import CartPage from './pages/Cart';

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route path='disease' element={<DiseasePrediction />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admindashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path='onlinepharmacy' element={<OnlinePharmacy />} />
          <Route path='patientProfile' element={<PatientProfile />} />
          <Route
            path="storeDashboard"
            element={
              <ProtectedRoute allowedRoles={["Store"]}>
                <StoreDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/heart-disease" element={<HeartPrediction />} />
          <Route path="/emergencyguidelines" element={<EmergencyCare />} />
          <Route path="/addmedicine" element={<AddMedicine />} />
          <Route path="/updatemedicine" element={<UpdateMedicine />} />
          <Route path="/deletemedicine" element={<DeleteMedicine />} />
          <Route path="/tracking/:id" element={<Tracking />} />
          <Route path="/addresspage" element={<AddressPage />} />
          <Route path="/payments" element={<PaymentPage />} />
          <Route path="/orderconfirmation" element={<OrderConfirmationPage />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admintracking" element={<AdminTracking />} />
          <Route path="/lungcancerprediction" element={<LungCancer />} />
          <Route path="/kidneyprediction" element={<KidneyPrediction />} />
          <Route path="/myvaccinations" element={<MyVaccination />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="*" element={<NotFound />} />
          <Route
            path="cart"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <CartPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </>
  )
}

export default App
