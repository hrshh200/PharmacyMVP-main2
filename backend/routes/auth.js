const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { signUp, signIn, fetchData, AdminfetchData, adminsignIn, uploadPrescriptionFile, UpdatePatientProfile, fetchpharmacymedicines, updateorderedmedicines, updatecartquantity, addmedicinetodb, decreaseupdatecartquantity, deletemedicine, finalitems, finaladdress, finalpayment, deletecartItems, createStoreApprovalRequest, getStoreApprovalRequests, reviewStoreApprovalRequest, getAllStores, updateStoreStatus, addStore, getUserNotificationPreferences, updateUserNotificationPreferences, uploadPrescriptionRequest, reuploadPrescriptionRequest, getMyPrescriptionRequests, getStorePrescriptionRequests, reviewPrescriptionRequest, getStoreOrders, updateOrderTrackingStatus, getMyOrders, getOrderById, getStoreStaffMembers, createStoreStaffMember, updateStoreStaffMember, updateStoreStaffStatus, deleteStoreStaffMember, getCart, seedVaccinationMasterIfEmpty, upsertUserVaccination, getUserVaccinations, getVaccinationMaster, getUserVaccinationsForDashboard, updateUserVaccinationByMasterId } = require("../controllers/auth");
const verifyToken  = require("../middleware/authMiddleware");  

const uploadsDir = process.env.UPLOADS_DIR || path.join(os.tmpdir(), "medvision-uploads");
const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

// Configure multer for prescription uploads
const prescriptionStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const prescriptionUpload = multer({ 
  storage: prescriptionStorage,
  fileFilter: function (req, file, cb) {
    const isPdf = file.mimetype === 'application/pdf' || (file.mimetype === 'application/octet-stream' && String(file.originalname || '').toLowerCase().endsWith('.pdf'));
    if (file.mimetype.startsWith('image/') || isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const prescriptionUploadSingle = (req, res, next) => {
  prescriptionUpload.single('prescription')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Invalid prescription file upload' });
    }
    next();
  });
};

const storeRequestStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-store-' + file.originalname);
  }
});

const storeRequestUpload = multer({
  storage: storeRequestStorage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Define routes for authentication
router.post("/login", signIn);
router.post("/signup", signUp);
router.post("/patientprofile", UpdatePatientProfile);
router.get("/fetchdata", verifyToken(["User", "Store"]), fetchData);
router.get("/user-notifications", verifyToken(["User"]), getUserNotificationPreferences);
router.put("/user-notifications", verifyToken(["User"]), updateUserNotificationPreferences);
router.get("/adminfetchdata", verifyToken(["admin"]), AdminfetchData);
router.post("/uploadpres", prescriptionUpload.single('prescription'), uploadPrescriptionFile);
router.post("/prescriptions/upload", verifyToken(["User"]), prescriptionUploadSingle, uploadPrescriptionRequest);
router.patch("/prescriptions/:id/reupload", verifyToken(["User"]), prescriptionUploadSingle, reuploadPrescriptionRequest);
router.get("/prescriptions/me", verifyToken(["User"]), getMyPrescriptionRequests);
router.get("/prescriptions/store", verifyToken(["Store"]), getStorePrescriptionRequests);
router.patch("/prescriptions/:id/review", verifyToken(["Store"]), reviewPrescriptionRequest);
router.post("/updateorderedmedicines", updateorderedmedicines);
router.post("/updatecartquantity", updatecartquantity);
router.post("/addmedicine", addmedicinetodb);
router.post("/decreaseupdatecartquantity", decreaseupdatecartquantity);
router.post("/deletemedicine", deletemedicine);
router.get("/allmedicines", fetchpharmacymedicines);
router.post("/additemstocart", finalitems);
router.post("/addaddress", finaladdress);
router.post("/addpayment", finalpayment);
router.get("/cart", verifyToken(["User", "Store"]), getCart);
router.get("/orders/me", verifyToken(["User"]), getMyOrders);
router.get("/orders/:orderId", verifyToken(["User", "Store"]), getOrderById);
router.post("/deletefullcart", deletecartItems)
router.post("/store-requests", storeRequestUpload.single('storeLicenceFile'), createStoreApprovalRequest);
router.get("/store-requests", verifyToken(["admin"]), getStoreApprovalRequests);
router.patch("/store-requests/:id/review", verifyToken(["admin"]), reviewStoreApprovalRequest);
router.patch("/stores/:id/status", verifyToken(["admin"]), updateStoreStatus);
router.get("/allstores", verifyToken(["admin"]), getAllStores);
router.post("/stores", verifyToken(["admin"]), addStore);
router.get("/store-orders", verifyToken(["Store"]), getStoreOrders);
router.get("/store-staff", verifyToken(["Store"]), getStoreStaffMembers);
router.post("/store-staff", verifyToken(["Store"]), createStoreStaffMember);
router.put("/store-staff/:id", verifyToken(["Store"]), updateStoreStaffMember);
router.patch("/store-staff/:id/status", verifyToken(["Store"]), updateStoreStaffStatus);
router.delete("/store-staff/:id", verifyToken(["Store"]), deleteStoreStaffMember);

// Order tracking status update
router.patch("/orders/:orderId/tracking", verifyToken(["Store"]), updateOrderTrackingStatus);

// Vaccination routes
router.post("/vaccinations", verifyToken(["User"]), upsertUserVaccination);
router.get("/vaccinations", verifyToken(["User"]), getUserVaccinations);
router.get("/vaccination-master", verifyToken(["User"]), getVaccinationMaster);
router.get("/user-vaccinations", verifyToken(["User"]), getUserVaccinationsForDashboard);
router.put("/user-vaccinations/:vaccinationId", verifyToken(["User"]), updateUserVaccinationByMasterId);

module.exports = router;
