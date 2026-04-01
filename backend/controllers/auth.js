const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");
const Admin = require("../models/admin")
const Pharmacy = require("../models/pharmacy");
const StoreApprovalRequest = require("../models/storeApprovalRequest");
const Store = require("../models/store");
const StoreStaff = require("../models/storeStaff");
const Order = require("../models/order");
const UserNotification = require("../models/userNotification");
const PrescriptionRequest = require("../models/prescriptionRequest");
const Prescription = require("../models/prescription");
const Cart = require("../models/cart");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const verifyAdminRequest = (req) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return {
                ok: false,
                status: 401,
                message: "Admin token missing",
            };
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'admin') {
            return {
                ok: false,
                status: 403,
                message: "Admin access required",
            };
        }

        return { ok: true, user: decoded };

    } catch (error) {
        return {
            ok: false,
            status: 401,
            message: "Invalid or expired token",
        };
    }
};

const generateOrderId = () => `ORD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const getCustomerName = (user) => {
    if (!user) return 'Unknown Customer';
    if (user.name) return user.name;

    const fullName = [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

    return fullName || 'Unknown Customer';
};

const formatOrderDateLabel = (value) => {
    if (!value) return 'N/A';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';

    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
    });
};

const buildOrderTracking = (status, dateLabel) => {
    const normalizedStatus = String(status || 'Pending').toLowerCase();

    if (normalizedStatus === 'delivered' || normalizedStatus === 'completed') {
        return [
            { step: 'Order placed', date: dateLabel, status: 'complete' },
            { step: 'Dispatched', date: dateLabel, status: 'complete' },
            { step: 'Delivered', date: dateLabel, status: 'complete' },
        ];
    }

    if (normalizedStatus === 'out-delivery' || normalizedStatus === 'out for delivery') {
        return [
            { step: 'Order placed', date: dateLabel, status: 'complete' },
            { step: 'Dispatched', date: dateLabel, status: 'complete' },
            { step: 'Out for delivery', date: dateLabel, status: 'active' },
        ];
    }

    if (normalizedStatus === 'in-transit' || normalizedStatus === 'shipped' || normalizedStatus === 'dispatched') {
        return [
            { step: 'Order placed', date: dateLabel, status: 'complete' },
            { step: 'Dispatched', date: dateLabel, status: 'active' },
            { step: 'Delivered', date: '', status: 'upcoming' },
        ];
    }

    return [
        { step: 'Order placed', date: dateLabel, status: 'complete' },
        { step: 'Packed', date: dateLabel, status: 'active' },
        { step: 'Out for delivery', date: '', status: 'upcoming' },
    ];
};

const mapPatientOrder = (order) => ({
    _id: order._id,
    orderId: order.orderId,
    userId: order.userId,
    storeId: order.storeId,
    items: (order.items || []).map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
    })),
    totalPrice: Number(order.totalPrice) || 0,
    payment: order.payment || 'Pending',
    address: order.address || 'TBD',
    status: order.status || 'Pending',
    deliveryType: order.deliveryType || 'delivery',
    trackingStatus: order.trackingStatus || 'Order Placed',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
});

const mapStoreOrder = (order) => {
    const user = order.userId || {};
    const dateLabel = formatOrderDateLabel(order.createdAt);

    return {
        id: order.orderId,
        orderId: order.orderId,
        userId: user._id || null,
        storeId: order.storeId,
        customer: getCustomerName(user),
        customerEmail: user.email || 'N/A',
        customerContact: user.mobile || 'N/A',
        total: Number(order.totalPrice) || 0,
        status: order.status || 'Pending',
        date: dateLabel,
        address: order.address || 'N/A',
        payment: order.payment || 'Pending',
        items: (order.items || []).map((item) => ({
            id: item.id,
            name: item.name,
            qty: Number(item.quantity) || 0,
            price: Number(item.price) || 0,
        })),
        deliveryType: order.deliveryType || 'delivery',
        trackingStatus: order.trackingStatus || 'Order Placed',
        tracking: buildOrderTracking(order.status, dateLabel),
    };
};

const resolveOrderStoreId = async (preferredStoreId) => {
    if (preferredStoreId) {
        const matchedStore = await Store.findById(preferredStoreId).select('_id').lean();
        if (matchedStore?._id) {
            return matchedStore._id;
        }
    }

    const activeStore = await Store.findOne({ status: 'Active' }).sort({ createdAt: 1 }).select('_id').lean();
    if (activeStore?._id) {
        return activeStore._id;
    }

    const fallbackStore = await Store.findOne({}).sort({ createdAt: 1 }).select('_id').lean();
    return fallbackStore?._id || null;
};

const signUp = async (req, res) => {
    const {
        regNo,
        name,
        email,
        password,
        confirmPassword,
        salutation,
        firstName,
        middleName,
        lastName,
        countryCode,
        mobile,
        address,
        city,
        state,
        pincode,
        role,
        storeName,
        ownerName,
        licenceNumber,
        gstNumber,
    } = req.body;

    // Check if required fields are provided
    if (!name || !email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: "Please Provide Required Information",
        });
    }

    try {
        // Hash the password
        const hash_password = await bcrypt.hash(password, 10);

        // Check if user already exists
        if (regNo === "") {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "User already registered",
                });
            }

            // Create new user data
            const userData = {
                name,
                email,
                salutation,
                firstName,
                middleName,
                lastName,
                countryCode,
                mobile,
                address,
                city,
                state,
                pincode,
                role,
                storeName,
                ownerName,
                licenceNumber,
                gstNumber,
                hash_password,
            };

            // Save the new user
            const newUser = await User.create(userData);
            res.status(StatusCodes.CREATED).json({ message: "User created successfully" });
        }



    } catch (error) {
        // Catch any other errors
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};


const signIn = async (req, res) => {
    try {
        const { userType = 'patient', email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password",
            });
        }

        let user;
        let role;

        if (userType === 'admin') {
            user = await Admin.findOne({ email });
            role = 'admin';
        }
        else if (userType === 'store') {
            user = await Store.findOne({ email });
            role = 'Store';
        }
        else {
            user = await User.findOne({ email });
            role = 'User';
        }

        if (!user) {
            return res.status(400).json({
                message: "User does not exist..!",
            });
        }

        let isMatch;
        if (userType === 'admin' || userType === 'store') {
            isMatch = password === user.password;
        } else {
            isMatch = await bcrypt.compare(password, user.hash_password);
        }

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            { _id: user._id, role },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        return res.status(200).json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role },
        });

    } catch (error) {
        console.error("Sign-in error: ", error);
        return res.status(500).json({
            message: "An error occurred during sign-in",
        });
    }
};


const fetchData = async (req, res) => {
    try {
        const decoded = req.user;

        const userModel = decoded.role === 'Store' ? Store : User;

        const userData = await userModel
            .findById(decoded._id)
            .select('-hash_password');

        if (!userData) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            userData,
        });

    } catch (error) {
        res.status(500).json({
            message: "Error fetching data",
        });
    }
};

const getUserNotificationPreferences = async (req, res) => {
    try {
        const notificationPreferences = await UserNotification.findOneAndUpdate(
            { userId: req.user._id },
            { $setOnInsert: { userId: req.user._id } },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            notificationPreferences,
        });
    } catch (error) {
        console.error("Error fetching notification preferences:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch notification preferences",
        });
    }
};

const updateUserNotificationPreferences = async (req, res) => {
    try {
        const { isEmailNotificationOn, isSmsNotificationOn } = req.body;

        const updatePayload = {};

        if (typeof isEmailNotificationOn === 'boolean') {
            updatePayload.isEmailNotificationOn = isEmailNotificationOn;
        }

        if (typeof isSmsNotificationOn === 'boolean') {
            updatePayload.isSmsNotificationOn = isSmsNotificationOn;
        }

        if (!Object.keys(updatePayload).length) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "No valid notification preferences provided",
            });
        }

        const notificationPreferences = await UserNotification.findOneAndUpdate(
            { userId: req.user._id },
            {
                $set: updatePayload,
                $setOnInsert: { userId: req.user._id },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Notification preferences updated successfully",
            notificationPreferences,
        });
    } catch (error) {
        console.error("Error updating notification preferences:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to update notification preferences",
        });
    }
};
const adminsignIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body);

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Please enter email and password",
            });
        }

        const user = await Admin.findOne({ email });

        if (!user) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "User does not exist..!",
            });
        }

        if (user.password !== password) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "Invalid email or password",
            });
        }

        // If password matches, generate the JWT token
        const token = jwt.sign(
            { _id: user._id, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        const { _id, email: userEmail } = user;

        // Send the token and user info back to the client
        return res.status(StatusCodes.OK).json({
            token,
            user: { _id, email: userEmail },
        });

    } catch (error) {
        console.error("Sign-in error: ", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred during sign-in",
            error: error.message,
        });
    }
};

const AdminfetchData = async (req, res) => {

    try {
        // Get token from the Authorization header
        const JWT_SECRET = process.env.JWT_SECRET;
        const token = req.header('Authorization')?.split(' ')[1];
        //  console.log(token);
        if (!token) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "Access token is missing or invalid",
            });
        }

        // Verify and decode the token
        const decoded = jwt.verify(token, JWT_SECRET);
        // console.log("hhh", decoded);

        // Check if the user is a doctor or not based on their role
        const adminModel = Admin;

        // Find user or doctor by their ID
        const adminData = await adminModel.findById(decoded._id).select('-password'); // Exclude sensitive fields

        if (!adminData) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "User not found",
            });
        }

        // Respond with user or doctor data
        res.status(StatusCodes.OK).json({
            success: true,
            adminData,
        });

    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while fetching data",
            error: error.message,
        });
    }
};

const UpdatePatientProfile = async (req, res) => {
    try {
        const { name, address, mobile, weight, dob, height, sex, bloodgroup } = req.body;

        // Find and update the doctor's profile based on the registration number
        const updatedPatient = await User.findOneAndUpdate(
            { name },
            { address, mobile, weight, dob, height, sex, bloodgroup },
            { new: true, runValidators: true } // Options: return the updated document and run validation
        );

        if (!updatedPatient) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.status(200).json({
            message: 'Patient profile updated successfully',
            user: updatedPatient,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating patient profile', error });
    }
};

const fetchpharmacymedicines = async (req, res) => {
    try {
        // Query to find all medicines 
        const medicines = await Pharmacy.find({});
        res.status(200).json({ success: true, pharmacy: medicines });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

const updateorderedmedicines = async (req, res) => {
    try {
        const { name, price, id, medicineId } = req.body;

        if (!name || !price || !id) {
            return res.status(400).json({ error: 'Name, Price, and User ID are required' });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find or create cart for this user
        let cart = await Cart.findOne({ userId: id });
        if (!cart) {
            cart = new Cart({ userId: id, items: [] });
        }

        // Use medicineId as the unique key if available, otherwise use name
        const uniqueKey = medicineId || name;

        // Check if the medicine already exists in the cart items array
        const existingMedicine = cart.items.find(item => 
            (medicineId && item.medicineId === medicineId) || 
            (!medicineId && item.medicine === name)
        );

        if (existingMedicine) {
            // Increment the quantity if the medicine exists
            existingMedicine.quantity += 1;
        } else {
            // Add a new medicine entry if it doesn't exist
            cart.items.push({
                medicineId: medicineId || undefined,
                medicine: name,
                quantity: 1,
                price: price,
            });
        }

        // Save the cart document
        await cart.save();

        res.status(200).json({
            message: 'Medicine added to cart successfully',
            cartId: cart._id,
            cart: cart.items
        });
    } catch (error) {
        console.error('Error adding to cart:', error.message);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

const updatecartquantity = async (req, res) => {
    const { name, id } = req.body; // Destructure name from request body

    if (!name) {
        return res.status(400).json({ error: 'Medicine name is required for updating the quantity' });
    }

    try {
        // Find the cart for this user
        const cart = await Cart.findOne({ userId: id });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found for this user' });
        }

        // Find the medicine in the cart items
        const medicine = cart.items.find(item => item.medicine === name);

        if (!medicine) {
            return res.status(404).json({ error: 'Medicine not found in the cart' });
        }

        // Increment quantity by 1
        medicine.quantity += 1;

        await cart.save();

        return res.status(200).json({
            message: 'Medicine quantity updated successfully',
            cart: cart.items
        });
    } catch (error) {
        console.error('Error updating cart quantity:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const decreaseupdatecartquantity = async (req, res) => {
    const { name, id } = req.body; // Destructure name from request body

    if (!name) {
        return res.status(400).json({ error: 'Medicine name is required for updating the quantity' });
    }

    try {
        // Find the cart for this user
        const cart = await Cart.findOne({ userId: id });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found for this user' });
        }

        // Find the medicine in the cart items
        const medicine = cart.items.find(item => item.medicine === name);

        if (!medicine) {
            return res.status(404).json({ error: 'Medicine not found in the cart' });
        }

        // Ensure quantity does not go below 1
        if (medicine.quantity <= 1) {
            return res.status(400).json({ error: 'Quantity cannot be less than 1' });
        }

        // Decrease the quantity
        medicine.quantity -= 1;

        await cart.save();

        return res.status(200).json({
            message: 'Medicine quantity decreased successfully',
            cart: cart.items
        });
    } catch (error) {
        console.error('Error updating cart quantity:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deletemedicine = async (req, res) => {
    const { name, id } = req.body; // `id` here is the userID
    try {
        if (!name || !id) {
            return res.status(400).json({ message: 'Name and userID are required' });
        }

        // Find the cart and remove the medicine
        const cart = await Cart.findOne({ userId: id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for this user' });
        }

        // Remove the medicine from cart items
        cart.items = cart.items.filter(item => item.medicine !== name);

        await cart.save();

        res.status(200).json({
            message: `Medicine '${name}' successfully deleted from cart`,
            cart: cart.items,
        });
    } catch (error) {
        console.error('Error deleting medicine:', error);
        res.status(500).json({ message: 'Server error while deleting medicine', error });
    }
};

const addmedicinetodb = async (req, res) => {
    const { name, manufacturer, dosage, type, price, stock } = req.body;

    try {
        // Validate the request body
        if (!name || !manufacturer || !dosage || !type || !price || !stock) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Create a new medicine document
        const newMedicine = new Pharmacy({
            name,
            manufacturer,
            dosage,
            type,
            price,
            stock,
        });

        // Save to database
        await newMedicine.save();

        res.status(200).json({ message: 'Medicine added successfully', medicine: newMedicine });
    } catch (error) {
        console.error('Error adding medicine:', error.message);
        res.status(500).json({ error: 'Failed to add medicine' });
    }
};

const finalitems = async (req, res) => {
    const { id, items, storeId } = req.body;

    // Validate the request
    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items field is required and must be an array' });
    }

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const incompleteOrder = await Order.findOne({
            userId: id,
            $or: [
                { payment: 'Pending' },
                { address: 'TBD' },
                { status: 'Pending' },
            ],
        }).sort({ createdAt: -1 });

        if (incompleteOrder) {
            return res.status(201).json({
                message: 'Kindly proceed with the payment',
                order: mapPatientOrder(incompleteOrder),
                orderId: incompleteOrder.orderId,
            });
        }

        const resolvedStoreId = await resolveOrderStoreId(storeId);

        if (!resolvedStoreId) {
            return res.status(400).json({ error: 'No store available to process this order' });
        }

        const orderId = generateOrderId();

        const normalizedItems = items.map((item, index) => ({
            id: String(item.id || index + 1),
            name: item.name,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
        }));

        const newOrder = await Order.create({
            orderId,
            userId: user._id,
            storeId: resolvedStoreId,
            items: normalizedItems,
            totalPrice: normalizedItems.reduce((total, item) => total + item.price * item.quantity, 0),
            payment: 'Pending',
            address: 'TBD',
            status: 'Pending',
        });

        return res.status(200).json({
            message: 'Medicine added successfully to orders',
            order: mapPatientOrder(newOrder),
            orderId: newOrder.orderId,
        });
    } catch (error) {
        console.error('Error adding items to order:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const finaladdress = async (req, res) => {
    const { id, orderid, address, deliveryType } = req.body;

    // Validate the request
    if (!id || !orderid || !address) {
        return res.status(400).json({ error: 'User ID, Order ID, and Address are required' });
    }

    try {
        const updateData = { address };
        if (deliveryType && ['pickup', 'delivery'].includes(deliveryType)) {
            updateData.deliveryType = deliveryType;
            updateData.trackingStatus = 'Order Placed';
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderid, userId: id },
            updateData,
            { new: true },
        );

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        return res.status(200).json({
            message: 'Address added successfully',
            updatedOrder: mapPatientOrder(updatedOrder),
        });
    } catch (error) {
        console.error('Error updating address:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const finalpayment = async (req, res) => {
    const { id, orderid, payment } = req.body;

    // Validate the request
    if (!id || !orderid || !payment) {
        return res.status(400).json({ error: 'User ID, Order ID, and payment are required' });
    }

    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderid, userId: id },
            {
                payment,
                status: 'Booked',
            },
            { new: true },
        );

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        return res.status(200).json({
            message: 'Payment successfull!',
            updatedOrder: mapPatientOrder(updatedOrder),
        });
    } catch (error) {
        console.error('Error updating address:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }

}

const deletecartItems = async (req, res) => {
    const { id } = req.body;

    // Validate the request
    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Find and delete the cart for this user
        const result = await Cart.findOneAndDelete({ userId: id });

        if (!result) {
            return res.status(404).json({ error: 'Cart not found for this user' });
        }

        return res.status(200).json({ message: 'Cart items have been cleared successfully.' });
    } catch (error) {
        console.error('Error clearing cart:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const uploadPrescriptionFile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Here you would typically save the file to a storage service (like AWS S3, Cloudinary, etc.)
        // For now, we'll simulate approval/rejection randomly
        const isApproved = Math.random() > 0.5; // 50% chance of approval

        // Verify the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create prescription record in dedicated collection
        const prescription = new Prescription({
            userId: userId,
            fileName: req.file.originalname,
            filePath: req.file.path, // In real implementation, this would be the uploaded file URL
            uploadedAt: new Date(),
            status: isApproved ? 'approved' : 'rejected'
        });

        await prescription.save();

        return res.status(200).json({
            message: isApproved ? 'Prescription approved' : 'Prescription rejected',
            status: isApproved ? 'approved' : 'rejected'
        });
    } catch (error) {
        console.error('Error uploading prescription:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const createStoreApprovalRequest = async (req, res) => {
    try {
        const {
            storeName,
            ownerName,
            countryCode,
            mobile,
            email,
            licenceNumber,
            gstNumber,
            city,
            address,
            state,
            pincode,
        } = req.body;

        if (!storeName || !ownerName || !mobile || !email || !licenceNumber || !city || !address || !state || !pincode) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Please provide all required store details' });
        }

        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Store licence document is required' });
        }

        const existingPending = await StoreApprovalRequest.findOne({
            $or: [{ email }, { licenceNumber }],
            status: 'pending',
        });

        if (existingPending) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'A pending store approval request already exists for this email or licence number',
            });
        }

        const requestPayload = {
            storeName,
            ownerName,
            countryCode: countryCode || '+91',
            mobile,
            email,
            licenceNumber,
            gstNumber: gstNumber || '',
            city,
            address,
            state,
            pincode,
            licenceDocument: {
                fileName: req.file.originalname,
                filePath: req.file.path,
                mimeType: req.file.mimetype,
            },
        };

        const createdRequest = await StoreApprovalRequest.create(requestPayload);

        return res.status(StatusCodes.CREATED).json({
            message: 'Store approval request submitted successfully',
            request: createdRequest,
        });
    } catch (error) {
        console.error('Error creating store approval request:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to submit store approval request' });
    }
};

const getStoreApprovalRequests = async (req, res) => {
    const adminAccess = verifyAdminRequest(req);
    if (!adminAccess.ok) {
        return res.status(adminAccess.status).json({ message: adminAccess.message });
    }

    try {
        const status = req.query.status;
        const filter = status ? { status } : {};

        const requests = await StoreApprovalRequest.find(filter).sort({ createdAt: -1 });

        return res.status(StatusCodes.OK).json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching store approval requests:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch store approval requests' });
    }
};

const reviewStoreApprovalRequest = async (req, res) => {
    const adminAccess = verifyAdminRequest(req);
    if (!adminAccess.ok) {
        return res.status(adminAccess.status).json({ message: adminAccess.message });
    }

    try {
        const { id } = req.params;
        const { status, reviewNotes = '' } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid review status' });
        }

        const updatedRequest = await StoreApprovalRequest.findByIdAndUpdate(
            id,
            {
                status,
                reviewNotes,
                reviewedAt: new Date(),
            },
            { new: true },
        );

        if (!updatedRequest) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Store approval request not found' });
        }

        //Adding the new Store and deleting the existing approval request
        const request = await StoreApprovalRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        let createdStore = null;
        if (status === 'approved') {
            const plainPassword = Math.random().toString(36).slice(-8);
            createdStore = await Store.create({
                storeName: request.storeName,
                ownerName: request.ownerName,
                countryCode: request.countryCode,
                mobile: request.mobile,
                email: request.email,
                password: plainPassword,
                licenceNumber: request.licenceNumber,
                gstNumber: request.gstNumber,
                city: request.city,
                address: request.address,
                state: request.state,
                pincode: request.pincode,
                licenceDocument: request.licenceDocument,
                status: 'Active',
            });
            await StoreApprovalRequest.findByIdAndDelete(id);
        }
        //Will use Twilio SendGrid or Nodemailer to send email notification to the store owner about the review outcome
        // await sendStoreEmail(updatedRequest.email, status);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `Store request ${status}`,
            request: updatedRequest,
        });
    } catch (error) {
        console.error('Error reviewing store approval request:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to review store approval request' });
    }
};

const getAllStores = async (req, res) => {
    const adminAccess = verifyAdminRequest(req);
    if (!adminAccess.ok) {
        return res.status(adminAccess.status).json({ message: adminAccess.message });
    }

    try {
        const stores = await Store.find().sort({ createdAt: -1 });

        if (!stores || stores.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'No stores found'
            });
        }
        return res.status(StatusCodes.OK).json({
            success: true,
            count: stores.length,
            stores,
        });
    } catch (error) {
        console.error('Error fetching stores:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch stores'
        });
    }
};

const updateStoreStatus = async (req, res) => {
    const adminAccess = verifyAdminRequest(req);
    if (!adminAccess.ok) {
        return res.status(adminAccess.status).json({ message: adminAccess.message });
    }

    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Active', 'Inactive'].includes(status)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid store status' });
        }

        const updatedStore = await Store.findByIdAndUpdate(
            id,
            { status },
            { new: true },
        );

        if (!updatedStore) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Store not found' });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `Store status updated to ${status}`,
            store: updatedStore,
        });
    } catch (error) {
        console.error('Error updating store status:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update store status'
        });
    }
};

const addStore = async (req, res) => {  
    try {   
        const { storeName, ownerName, countryCode, mobile, email, password, licenceNumber, gstNumber, city, address, state, pincode, licenceDocument } = req.body;

        if (!storeName || !ownerName || !mobile || !email || !licenceNumber || !city || !address || !state || !pincode) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Please provide all required store details' });
        }

        const existingStore = await Store.findOne({ email });
        if (existingStore) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'A store with this email already exists' });
        }

        const plainPassword = Math.random().toString(36).slice(-8); // Generate a random 8-character password
        const newStore = new Store({
            storeName,
            ownerName,
            countryCode: countryCode || '+91',
            mobile,
            email,
            password: plainPassword,
            licenceNumber,
            gstNumber: gstNumber || '',
            city,
            address,
            state,
            pincode,
            licenceDocument,
            status: 'Active',
        });

        await newStore.save();

        return res.status(StatusCodes.CREATED).json({ message: 'Store added successfully', store: newStore });
    } catch (error) {
        console.error('Error adding store:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to add store' });
    }   
}

const uploadPrescriptionRequest = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Prescription file is required' });
        }

        const request = await PrescriptionRequest.create({
            userId,
            fileName: req.file.originalname,
            filePath: req.file.path,
            mimeType: req.file.mimetype,
            status: 'pending',
        });

        return res.status(StatusCodes.CREATED).json({
            message: 'Prescription uploaded successfully',
            prescription: request,
        });
    } catch (error) {
        console.error('uploadPrescriptionRequest error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error?.message || 'Failed to upload prescription',
        });
    }
};

const getMyPrescriptionRequests = async (req, res) => {
    try {
        const userId = req.user?._id;
        const prescriptions = await PrescriptionRequest.find({ userId })
            .sort({ createdAt: -1 });

        return res.status(StatusCodes.OK).json({ prescriptions });
    } catch (error) {
        console.error('getMyPrescriptionRequests error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch prescriptions' });
    }
};

const getStorePrescriptionRequests = async (req, res) => {
    try {
        const prescriptions = await PrescriptionRequest.find({})
            .populate('userId', 'name email mobile')
            .sort({ status: 1, createdAt: -1 });

        return res.status(StatusCodes.OK).json({ prescriptions });
    } catch (error) {
        console.error('getStorePrescriptionRequests error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch store prescription requests' });
    }
};

const reviewPrescriptionRequest = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { id } = req.params;
        const { status, reviewNotes = '' } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid status value' });
        }

        const updated = await PrescriptionRequest.findByIdAndUpdate(
            id,
            {
                $set: {
                    status,
                    reviewNotes,
                    reviewedByStoreId: storeId,
                    reviewedAt: new Date(),
                },
            },
            { new: true },
        ).populate('userId', 'name email mobile');

        if (!updated) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Prescription request not found' });
        }

        return res.status(StatusCodes.OK).json({
            message: `Prescription ${status}`,
            prescription: updated,
        });
    } catch (error) {
        console.error('reviewPrescriptionRequest error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to review prescription request' });
    }
};

const getStoreStaffMembers = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const staffMembers = await StoreStaff.find({ storeId }).sort({ createdAt: -1 });
        return res.status(StatusCodes.OK).json({ staffMembers });
    } catch (error) {
        console.error('getStoreStaffMembers error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch staff members' });
    }
};

const getStoreOrders = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const orders = await Order.find({ storeId })
            .populate('userId', 'name firstName middleName lastName email mobile')
            .sort({ createdAt: -1 });

        return res.status(StatusCodes.OK).json({ orders: orders.map(mapStoreOrder) });
    } catch (error) {
        console.error('getStoreOrders error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch store orders' });
    }
};

const updateOrderTrackingStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { trackingStatus, deliveryType } = req.body;
        const storeId = req.user?._id;

        const order = await Order.findOne({ orderId, storeId });
        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
        }

        const validStatuses = {
            pickup: ["Order Placed", "Packed", "Ready for Pick Up", "Picked Up"],
            delivery: ["Order Placed", "Packed", "Out for Delivery", "Delivered"]
        };

        const allowedStatuses = validStatuses[deliveryType || order.deliveryType] || [];
        if (!allowedStatuses.includes(trackingStatus)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid tracking status for this delivery type' });
        }

        order.trackingStatus = trackingStatus;
        await order.save();

        return res.status(StatusCodes.OK).json({ 
            message: 'Tracking status updated successfully', 
            order 
        });
    } catch (error) {
        console.error('updateOrderTrackingStatus error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update tracking status' });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const userId = req.user?._id;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();

        return res.status(StatusCodes.OK).json({ orders: orders.map(mapPatientOrder) });
    } catch (error) {
        console.error('getMyOrders error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch user orders' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const query = { orderId };

        if (req.user?.role === 'User') {
            query.userId = req.user?._id;
        }

        if (req.user?.role === 'Store') {
            query.storeId = req.user?._id;
        }

        const order = await Order.findOne(query).lean();

        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
        }

        return res.status(StatusCodes.OK).json({ order: mapPatientOrder(order) });
    } catch (error) {
        console.error('getOrderById error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch order' });
    }
};

const createStoreStaffMember = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const {
            firstName,
            middleName = '',
            lastName,
            role = 'Pharmacist',
            email,
            contact,
            address = '',
        } = req.body;

        if (!firstName || !lastName || !email || !contact) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Please provide first name, last name, email, and contact' });
        }

        const staffMember = await StoreStaff.create({
            storeId,
            firstName,
            middleName,
            lastName,
            role,
            email,
            contact,
            address,
            status: 'Active',
        });

        return res.status(StatusCodes.CREATED).json({
            message: 'Staff member added successfully',
            staffMember,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'A staff member with this email already exists' });
        }
        console.error('createStoreStaffMember error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to add staff member' });
    }
};

const updateStoreStaffMember = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { id } = req.params;
        const {
            firstName,
            middleName = '',
            lastName,
            role,
            email,
            contact,
            address = '',
        } = req.body;

        if (!firstName || !lastName || !email || !contact) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Please provide first name, last name, email, and contact' });
        }

        const staffMember = await StoreStaff.findOneAndUpdate(
            { _id: id, storeId },
            {
                $set: {
                    firstName,
                    middleName,
                    lastName,
                    role,
                    email,
                    contact,
                    address,
                },
            },
            { new: true, runValidators: true },
        );

        if (!staffMember) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Staff member not found' });
        }

        return res.status(StatusCodes.OK).json({
            message: 'Staff member updated successfully',
            staffMember,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'A staff member with this email already exists' });
        }
        console.error('updateStoreStaffMember error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update staff member' });
    }
};

const updateStoreStaffStatus = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { id } = req.params;
        const { status } = req.body;

        if (!['Active', 'Inactive'].includes(status)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid status value' });
        }

        const staffMember = await StoreStaff.findOneAndUpdate(
            { _id: id, storeId },
            { $set: { status } },
            { new: true },
        );

        if (!staffMember) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Staff member not found' });
        }

        return res.status(StatusCodes.OK).json({
            message: `Staff member ${status.toLowerCase()} successfully`,
            staffMember,
        });
    } catch (error) {
        console.error('updateStoreStaffStatus error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update staff member status' });
    }
};

const deleteStoreStaffMember = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { id } = req.params;
        const deletedStaff = await StoreStaff.findOneAndDelete({ _id: id, storeId });

        if (!deletedStaff) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Staff member not found' });
        }

        return res.status(StatusCodes.OK).json({
            message: 'Staff member removed successfully',
        });
    } catch (error) {
        console.error('deleteStoreStaffMember error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to remove staff member' });
    }
};

const getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        let cart = await Cart.findOne({ userId });
        
        if (!cart) {
            // Return empty cart if user doesn't have one yet
            return res.status(StatusCodes.OK).json({
                cartId: null,
                items: [],
                message: 'Cart is empty'
            });
        }

        return res.status(StatusCodes.OK).json({
            cartId: cart._id,
            items: cart.items,
            message: 'Cart retrieved successfully'
        });
    } catch (error) {
        console.error('getCart error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve cart' });
    }
};

// Vaccination functions
const seedVaccinationMasterIfEmpty = async () => {
  try {
    const VaccinationMaster = require("../models/vaccinationMaster");
    const count = await VaccinationMaster.countDocuments();
    if (count === 0) {
      const vaccinations = [
        {
          vaccineId: "BCG",
          name: "BCG",
          description: "Bacille Calmette-Guérin",
          ageGroup: "At Birth",
          doseSchedule: "Single Dose",
        },
        {
          vaccineId: "OPV",
          name: "OPV",
          description: "Oral Polio Vaccine",
          ageGroup: "6 weeks, 10 weeks, 14 weeks, 16-24 months",
          doseSchedule: "4 Doses",
        },
        {
          vaccineId: "IPV",
          name: "IPV",
          description: "Inactivated Polio Vaccine",
          ageGroup: "6 weeks, 10 weeks, 14 weeks",
          doseSchedule: "3 Doses",
        },
        {
          vaccineId: "DPT",
          name: "DPT",
          description: "Diphtheria, Pertussis, Tetanus",
          ageGroup: "6 weeks, 10 weeks, 14 weeks, 18-24 months",
          doseSchedule: "4 Doses",
        },
        {
          vaccineId: "Hepatitis B",
          name: "Hepatitis B",
          description: "Hepatitis B Vaccine",
          ageGroup: "At Birth, 6 weeks, 10 weeks, 14 weeks",
          doseSchedule: "4 Doses",
        },
        {
          vaccineId: "Measles",
          name: "Measles",
          description: "Measles, Mumps, Rubella",
          ageGroup: "9-12 months, 16-24 months",
          doseSchedule: "2 Doses",
        },
        {
          vaccineId: "Typhoid",
          name: "Typhoid",
          description: "Typhoid Vaccine",
          ageGroup: "2+ years",
          doseSchedule: "1 Dose (Booster every 3 years)",
        },
        {
          vaccineId: "Varicella",
          name: "Varicella",
          description: "Chickenpox Vaccine",
          ageGroup: "12-15 months",
          doseSchedule: "2 Doses",
        },
      ];
      await VaccinationMaster.insertMany(vaccinations);
    }
  } catch (error) {
    console.log("Vaccination Master seeding error:", error.message);
  }
};

const upsertUserVaccination = async (req, res) => {
  try {
    const { vaccineId, vaccineName, vaccinationDate, nextDueDate, certificateUrl } = req.body;
    const userId = req.user._id;

    const UserVaccination = require("../models/userVaccination");
    
    const vaccination = await UserVaccination.findOneAndUpdate(
      { userId, vaccineId },
      {
        userId,
        vaccineId,
        vaccineName,
        vaccinationDate,
        nextDueDate,
        certificateUrl,
        status: vaccinationDate ? "Completed" : "Pending",
      },
      { upsert: true, new: true }
    );

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Vaccination record updated",
      data: vaccination,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message,
    });
  }
};

const getUserVaccinations = async (req, res) => {
  try {
    const userId = req.user._id;
    const UserVaccination = require("../models/userVaccination");

    const vaccinations = await UserVaccination.find({ userId });

    res.status(StatusCodes.OK).json({
      status: "success",
      data: vaccinations,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message,
    });
  }
};

const getVaccinationMaster = async (req, res) => {
    try {
        const VaccinationMaster = require("../models/vaccinationMaster");
        const vaccines = await VaccinationMaster.find().sort({ name: 1 });

        res.status(StatusCodes.OK).json({
            status: "success",
            vaccines,
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: error.message,
        });
    }
};

const getUserVaccinationsForDashboard = async (req, res) => {
    try {
        const userId = req.user._id;
        const UserVaccination = require("../models/userVaccination");
        const VaccinationMaster = require("../models/vaccinationMaster");

        const [records, masterList] = await Promise.all([
            UserVaccination.find({ userId }),
            VaccinationMaster.find(),
        ]);

        const masterByVaccineId = new Map(masterList.map((m) => [m.vaccineId, m]));

        const normalized = records.map((r) => {
            const master = masterByVaccineId.get(r.vaccineId);
            return {
                _id: r._id,
                vaccinationId: {
                    _id: master ? master._id : r.vaccineId,
                    vaccineId: r.vaccineId,
                    name: r.vaccineName,
                },
                status: r.status === "Completed" ? "vaccinated" : "not_vaccinated",
                vaccinationDate: r.vaccinationDate,
            };
        });

        res.status(StatusCodes.OK).json({
            status: "success",
            records: normalized,
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: error.message,
        });
    }
};

const updateUserVaccinationByMasterId = async (req, res) => {
    try {
        const userId = req.user._id;
        const { vaccinationId } = req.params;
        const { status, vaccinationDate } = req.body;

        const UserVaccination = require("../models/userVaccination");
        const VaccinationMaster = require("../models/vaccinationMaster");

        const master = await VaccinationMaster.findById(vaccinationId);
        if (!master) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: "error",
                message: "Vaccination master record not found",
            });
        }

        const isVaccinated = status === "vaccinated";

        const record = await UserVaccination.findOneAndUpdate(
            { userId, vaccineId: master.vaccineId },
            {
                userId,
                vaccineId: master.vaccineId,
                vaccineName: master.name,
                vaccinationDate: isVaccinated && vaccinationDate ? new Date(vaccinationDate) : null,
                status: isVaccinated ? "Completed" : "Pending",
            },
            { upsert: true, new: true }
        );

        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Vaccination record updated",
            data: record,
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: error.message,
        });
    }
};

const reuploadPrescriptionRequest = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Prescription file is required' });
        }

        const existingRequest = await PrescriptionRequest.findOne({ _id: id, userId });
        if (!existingRequest) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Prescription request not found' });
        }

        existingRequest.fileName = req.file.originalname;
        existingRequest.filePath = req.file.path;
        existingRequest.mimeType = req.file.mimetype;
        existingRequest.status = 'pending';
        existingRequest.reviewNotes = '';
        existingRequest.reviewedByStoreId = null;
        existingRequest.reviewedAt = null;

        await existingRequest.save();

        return res.status(StatusCodes.OK).json({
            message: 'Prescription re-uploaded successfully',
            prescription: existingRequest,
        });
    } catch (error) {
        console.error('reuploadPrescriptionRequest error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error?.message || 'Failed to re-upload prescription',
        });
    }
};

module.exports = {
    signUp, signIn, fetchData, adminsignIn, AdminfetchData, uploadPrescriptionFile, UpdatePatientProfile, fetchpharmacymedicines, updateorderedmedicines, updatecartquantity, addmedicinetodb, decreaseupdatecartquantity, deletemedicine, finalitems, finaladdress, finalpayment, deletecartItems, createStoreApprovalRequest, getStoreApprovalRequests, reviewStoreApprovalRequest, getAllStores, updateStoreStatus, addStore, getUserNotificationPreferences, updateUserNotificationPreferences,
    uploadPrescriptionRequest, reuploadPrescriptionRequest, getMyPrescriptionRequests, getStorePrescriptionRequests, reviewPrescriptionRequest,
        getStoreOrders, updateOrderTrackingStatus, getMyOrders, getOrderById, getStoreStaffMembers, createStoreStaffMember, updateStoreStaffMember, updateStoreStaffStatus, deleteStoreStaffMember, getCart, seedVaccinationMasterIfEmpty, upsertUserVaccination, getUserVaccinations, getVaccinationMaster, getUserVaccinationsForDashboard, updateUserVaccinationByMasterId
};