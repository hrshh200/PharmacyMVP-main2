const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");
const Admin = require("../models/admin")
const Review = require("../models/review");
const Pharmacy = require("../models/pharmacy");
const StoreApprovalRequest = require("../models/storeApprovalRequest");
const Store = require("../models/store");
const StoreStaff = require("../models/storeStaff");
const StaffAttendance = require("../models/staffAttendance");
const StaffPerformance = require("../models/staffPerformance");
const StaffTraining = require("../models/staffTraining");
const ComplianceChecklist = require("../models/complianceChecklist");
const Supplier = require("../models/supplier");
const Invoice = require("../models/invoice");
const PromotionalCampaign = require("../models/promotionalCampaign");
const Order = require("../models/order");
const UserNotification = require("../models/userNotification");
const UserQuery = require("../models/userQuery");
const PrescriptionRequest = require("../models/prescriptionRequest");
const Prescription = require("../models/prescription");
const Cart = require("../models/cart");
const { sendUserNotification, sendEmailNotification } = require("../utils/notificationService");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const triggerUserNotifications = async ({ userId, emailSubject, emailMessage, emailHtml, smsMessage, notificationCategory }) => {
    try {
        console.log('[Notification] triggerUserNotifications called', {
            userId: userId ? String(userId) : null,
            emailSubject: emailSubject || null,
            hasEmailMessage: Boolean(emailMessage),
            hasEmailHtml: Boolean(emailHtml),
            hasSmsMessage: Boolean(smsMessage),
            notificationCategory: notificationCategory || null,
        });

        if (!userId) {
            console.log('[Notification] Bypassed: Missing userId');
            return { bypassed: true, reason: 'Missing userId' };
        }

        const [user, notificationPreferences] = await Promise.all([
            User.findById(userId)
                .select('email mobile countryCode firstName lastName name')
                .lean(),
            UserNotification.findOne({ userId }).lean(),
        ]);

        if (!user) {
            console.log('[Notification] Bypassed: User not found', { userId: String(userId) });
            return { bypassed: true, reason: 'User not found' };
        }

        // Default to enabled if preferences are not created yet.
        const preferences = notificationPreferences || {
            isEmailNotificationOn: true,
            isSmsNotificationOn: true,
        };

        const dispatchResult = await sendUserNotification({
            user,
            preferences,
            emailSubject,
            emailMessage,
            emailHtml,
            smsMessage,
            notificationCategory,
        });

        console.log('[Notification] triggerUserNotifications result', dispatchResult);
        return dispatchResult;
    } catch (notificationError) {
        console.error('Notification dispatch error:', notificationError.message);
        return { bypassed: true, reason: notificationError.message };
    }
};

const runInBackground = (label, task) => {
    setImmediate(async () => {
        try {
            await task();
        } catch (error) {
            console.error(`[BackgroundTask][${label}] Failed:`, error?.message || error);
        }
    });
};

const escapeHtml = (value) =>
        String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

const buildEmailLayout = ({
    eyebrow = 'Pharmacy MVP',
    title,
    intro,
    accent = '#2563eb',
    summary = [],
    sections = [],
    footer = 'Thank you for choosing Pharmacy MVP.',
}) => {
    const safeEyebrow = escapeHtml(eyebrow);
    const safeTitle = escapeHtml(title);
    const safeIntro = escapeHtml(intro);
    const safeFooter = escapeHtml(footer);

    const summaryHtml = summary.length
        ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;"><tr>${summary
                .map(
                    (item, index) => `<td width="${Math.floor(100 / summary.length)}%" style="padding:${index === 0 ? '0 8px 0 0' : '0 0 0 8px'};vertical-align:top;">
                        <div style="background:${escapeHtml(item.background || '#f8fafc')};border:1px solid ${escapeHtml(item.border || '#e2e8f0')};border-radius:18px;padding:18px 20px;min-height:92px;">
                            <div style="font-size:12px;color:${escapeHtml(item.labelColor || '#64748b')};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">${escapeHtml(item.label)}</div>
                            <div style="font-size:22px;font-weight:700;color:#0f172a;line-height:1.35;">${escapeHtml(item.value)}</div>
                        </div>
                    </td>`,
                )
                .join('')}</tr></table>`
        : '';

    const sectionsHtml = sections
        .map(
            (section) => `<div style="background:${escapeHtml(section.background || '#ffffff')};border:1px solid ${escapeHtml(section.border || '#e2e8f0')};border-radius:18px;padding:18px 20px;margin-top:16px;">
                <div style="font-size:16px;font-weight:700;color:${escapeHtml(section.titleColor || '#0f172a')};margin-bottom:${section.content ? '8px' : '0'};">${escapeHtml(section.title)}</div>
                ${section.content ? `<div style="font-size:14px;line-height:1.8;color:${escapeHtml(section.contentColor || '#475569')};white-space:pre-line;">${escapeHtml(section.content)}</div>` : ''}
            </div>`,
        )
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    </head>
    <body style="margin:0;padding:0;background:#f3f7fb;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7fb;padding:24px 12px;">
        <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
            <tr>
                <td style="background:linear-gradient(135deg,${escapeHtml(accent)},#0f172a);padding:32px 36px;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.85;">${safeEyebrow}</div>
                <h1 style="margin:12px 0 8px;font-size:28px;line-height:1.25;">${safeTitle}</h1>
                <p style="margin:0;font-size:15px;line-height:1.7;opacity:0.95;">${safeIntro}</p>
                </td>
            </tr>
            <tr>
                <td style="padding:28px 36px 34px;">
                ${summaryHtml}
                ${sectionsHtml}
                <p style="margin:22px 0 0;font-size:14px;line-height:1.8;color:#475569;">${safeFooter}</p>
                </td>
            </tr>
            </table>
        </td>
        </tr>
    </table>
    </body>
</html>`;
};

const sendDirectEmailSafely = async ({ to, subject, text, html, context }) => {
    try {
        const result = await sendEmailNotification({ to, subject, text, html });
        console.log('[Notification][DirectEmail] Result', {
            context,
            to,
            subject,
            result,
        });
        return result;
    } catch (error) {
        console.error('[Notification][DirectEmail] Failed', {
            context,
            to,
            subject,
            error: error.message,
        });
        return { sent: false, bypassed: true, reason: error.message, channel: 'email' };
    }
};

const buildOrderPlacedEmailHtml = ({ orderId, amount, status }) => {
    return buildEmailLayout({
        eyebrow: 'Order Confirmation',
        title: 'Your order is confirmed',
        intro: 'Thank you for ordering with us. Your request has been received successfully and our team will keep you updated as it moves forward.',
        accent: '#0f766e',
        summary: [
            { label: 'Order ID', value: orderId, background: '#eff6ff', border: '#bfdbfe', labelColor: '#1d4ed8' },
            { label: 'Amount', value: `USD ${Number(amount || 0).toFixed(2)}`, background: '#f8fafc', border: '#e2e8f0', labelColor: '#64748b' },
            { label: 'Status', value: status || 'Order Placed', background: '#ecfeff', border: '#99f6e4', labelColor: '#0f766e' },
        ],
        sections: [
            {
                title: 'Track your order anytime',
                content: 'Open your dashboard to follow status updates like packing, pickup readiness, or delivery progress.',
                background: '#fff7ed',
                border: '#fdba74',
                titleColor: '#9a3412',
                contentColor: '#7c2d12',
            },
        ],
        footer: 'Thank you for trusting Pharmacy MVP. We are glad to support your healthcare needs.',
    });
};

const buildOrderTrackingEmailHtml = ({ orderId, trackingStatus, deliveryType }) =>
    buildEmailLayout({
        eyebrow: 'Order Tracking Update',
        title: 'Your order status has changed',
        intro: 'We have updated your order tracking progress. Please find the latest status below.',
        accent: '#2563eb',
        summary: [
            { label: 'Order ID', value: orderId, background: '#eff6ff', border: '#bfdbfe', labelColor: '#1d4ed8' },
            { label: 'Current Status', value: trackingStatus, background: '#eef2ff', border: '#c7d2fe', labelColor: '#4338ca' },
            { label: 'Delivery Mode', value: deliveryType === 'pickup' ? 'Store Pick Up' : 'Home Delivery', background: '#f8fafc', border: '#e2e8f0', labelColor: '#475569' },
        ],
        sections: [
            {
                title: 'What happens next',
                content: deliveryType === 'pickup'
                    ? 'Keep an eye on your dashboard. We will let you know as soon as your order is ready for pick up.'
                    : 'Keep an eye on your dashboard. We will keep you informed as your order moves toward delivery.',
                background: '#eff6ff',
                border: '#bfdbfe',
                titleColor: '#1d4ed8',
            },
        ],
        footer: 'You can open your dashboard anytime to check the latest tracking status.',
    });

const buildWelcomeUserEmailHtml = ({ name, email }) =>
    buildEmailLayout({
        eyebrow: 'Welcome to Pharmacy MVP',
        title: `Hello ${name || 'there'}, your account is ready`,
        intro: 'Your patient account has been created successfully. You can now explore medicines, manage prescriptions, track orders, and stay on top of your health updates.',
        accent: '#0f766e',
        summary: [
            { label: 'Registered Email', value: email, background: '#f0fdf4', border: '#bbf7d0', labelColor: '#15803d' },
        ],
        sections: [
            {
                title: 'You can now use',
                content: 'Online Pharmacy\nPrescription Uploads\nOrder Tracking\nVaccination Records\nRaise a Query',
                background: '#f8fafc',
                border: '#e2e8f0',
            },
        ],
        footer: 'We are happy to have you with Pharmacy MVP.',
    });

const buildStoreRequestEmailHtml = ({ storeName, ownerName }) =>
    buildEmailLayout({
        eyebrow: 'Store Registration Request',
        title: 'Your store request has been submitted',
        intro: 'Thank you for registering your store with Pharmacy MVP. Our team will review your details and get back to you shortly.',
        accent: '#7c3aed',
        summary: [
            { label: 'Store Name', value: storeName, background: '#faf5ff', border: '#ddd6fe', labelColor: '#7c3aed' },
            { label: 'Owner Name', value: ownerName, background: '#f8fafc', border: '#e2e8f0', labelColor: '#475569' },
        ],
        sections: [
            {
                title: 'What to expect',
                content: 'Once the review is completed, you will receive an email with the outcome and next steps.',
                background: '#f5f3ff',
                border: '#c4b5fd',
                titleColor: '#6d28d9',
            },
        ],
        footer: 'Please keep this email for your records while your request is under review.',
    });

const buildStoreApprovedEmailHtml = ({ storeName, ownerName, email, password }) =>
    buildEmailLayout({
        eyebrow: 'Store Approved',
        title: 'Your store is now active',
        intro: `Congratulations ${ownerName || 'Store Owner'}. Your store has been approved and activated on Pharmacy MVP.`,
        accent: '#15803d',
        summary: [
            { label: 'Store Name', value: storeName, background: '#f0fdf4', border: '#bbf7d0', labelColor: '#15803d' },
            { label: 'Login Email', value: email, background: '#f8fafc', border: '#e2e8f0', labelColor: '#475569' },
            { label: 'Temporary Password', value: password, background: '#fff7ed', border: '#fdba74', labelColor: '#c2410c' },
        ],
        sections: [
            {
                title: 'Next step',
                content: 'Sign in with the credentials above and change your password after your first login.',
                background: '#ecfdf5',
                border: '#86efac',
                titleColor: '#166534',
            },
        ],
        footer: 'Welcome to the Pharmacy MVP network.',
    });

const buildStoreRejectedEmailHtml = ({ storeName, reviewNotes }) =>
    buildEmailLayout({
        eyebrow: 'Store Review Update',
        title: 'Your store request was not approved',
        intro: 'We reviewed your submission and could not approve it at this stage. Please review the notes below and submit an updated request if needed.',
        accent: '#dc2626',
        summary: [
            { label: 'Store Name', value: storeName, background: '#fef2f2', border: '#fecaca', labelColor: '#dc2626' },
        ],
        sections: [
            {
                title: 'Review notes',
                content: reviewNotes || 'No additional notes were provided.',
                background: '#fff1f2',
                border: '#fecdd3',
                titleColor: '#be123c',
            },
        ],
        footer: 'You can resubmit your request after addressing the noted issues.',
    });

const buildPrescriptionStatusEmailHtml = ({ status, reviewNotes }) =>
    buildEmailLayout({
        eyebrow: 'Prescription Review',
        title: `Your prescription is ${status}`,
        intro: 'The pharmacy has completed the review of your prescription request.',
        accent: status === 'Approved' ? '#15803d' : '#dc2626',
        summary: [
            { label: 'Review Status', value: status, background: status === 'Approved' ? '#f0fdf4' : '#fef2f2', border: status === 'Approved' ? '#bbf7d0' : '#fecaca', labelColor: status === 'Approved' ? '#15803d' : '#dc2626' },
        ],
        sections: [
            {
                title: status === 'Approved' ? 'What to do next' : 'Reason / notes',
                content: status === 'Approved'
                    ? 'Please log in to your dashboard to continue with the updated prescription journey.'
                    : (reviewNotes || 'Please upload a clearer prescription or add the missing information and try again.'),
                background: status === 'Approved' ? '#ecfdf5' : '#fff7ed',
                border: status === 'Approved' ? '#86efac' : '#fdba74',
                titleColor: status === 'Approved' ? '#166534' : '#9a3412',
            },
        ],
        footer: 'You can check your dashboard anytime for the latest prescription status.',
    });

const buildQueryAnsweredEmailHtml = ({ subject, answer }) =>
    buildEmailLayout({
        eyebrow: 'Query Response',
        title: 'The store has answered your query',
        intro: 'A response is now available for the query you raised on Pharmacy MVP.',
        accent: '#2563eb',
        summary: [
            { label: 'Query Subject', value: subject, background: '#eff6ff', border: '#bfdbfe', labelColor: '#1d4ed8' },
        ],
        sections: [
            {
                title: 'Store answer',
                content: answer,
                background: '#f8fafc',
                border: '#e2e8f0',
            },
        ],
        footer: 'Open your dashboard if you want to review this response again later.',
    });

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

const mapPatientOrder = (order) => {
    const store = order?.storeId && typeof order.storeId === 'object' ? order.storeId : null;

    return {
    _id: order._id,
    orderId: order.orderId,
    userId: order.userId,
    storeId: store?._id || order.storeId,
    storeName: store?.storeName || order.storeName || '',
    storeEmail: store?.email || order.storeEmail || '',
    storeMobile: store?.mobile || order.storeMobile || '',
    storeAddress: store?.address || order.storeAddress || '',
    storeCity: store?.city || order.storeCity || '',
    storeState: store?.state || order.storeState || '',
    storePincode: store?.pincode || order.storePincode || '',
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
};
};

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

const ROLE_CODES = {
    PATIENT: 1,
    PHARMACIST: 2,
    OPERATOR: 3,
    STORE_ADMIN: 4,
};

const roleCodeToLabel = (roleCode) => {
    const numericCode = Number(roleCode);
    if (numericCode === ROLE_CODES.PHARMACIST) return 'Pharmacist';
    if (numericCode === ROLE_CODES.OPERATOR) return 'Operator';
    if (numericCode === ROLE_CODES.STORE_ADMIN) return 'Store Admin';
    return 'Patient';
};

const normalizedRoleToCode = (normalizedRole) => {
    if (normalizedRole === 'Operator') return ROLE_CODES.OPERATOR;
    if (normalizedRole === 'Store Admin') return ROLE_CODES.STORE_ADMIN;
    return ROLE_CODES.PHARMACIST;
};

const createOrUpdateStoreAdminUser = async ({ store, plainPassword }) => {
    if (!store?._id || !store?.email || !plainPassword) return;

    const passwordHash = await bcrypt.hash(String(plainPassword), 10);
    const basePayload = {
        name: `${store.ownerName || store.storeName || 'Store Admin'} (${store.email})`,
        firstName: store.ownerName || store.storeName || 'Store',
        lastName: 'Admin',
        email: store.email,
        mobile: store.mobile || 'NA',
        address: store.address || 'NA',
        password: passwordHash,
        hash_password: passwordHash,
        roleCode: ROLE_CODES.STORE_ADMIN,
        roleLabel: roleCodeToLabel(ROLE_CODES.STORE_ADMIN),
        linkedStoreId: store._id,
        linkedStaffId: null,
        isActive: String(store.status || 'Active') === 'Active',
        storeName: store.storeName || '',
        ownerName: store.ownerName || '',
        licenceNumber: store.licenceNumber || '',
        gstNumber: store.gstNumber || '',
    };

    await User.findOneAndUpdate(
        { email: store.email },
        { $set: basePayload },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    );
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
                password: hash_password,
                hash_password,
                roleCode: ROLE_CODES.PATIENT,
                roleLabel: roleCodeToLabel(ROLE_CODES.PATIENT),
                isActive: true,
            };

            // Save the new user
                const newUser = await User.create(userData);
                runInBackground('user-signup-email', async () => {
                    await sendDirectEmailSafely({
                        to: newUser.email,
                        subject: 'Welcome to Pharmacy MVP',
                        text: `Hello ${newUser.name || newUser.firstName || 'User'}, your Pharmacy MVP account has been created successfully. You can now sign in with ${newUser.email} and start using the dashboard features.`,
                        html: buildWelcomeUserEmailHtml({
                            name: newUser.name || [newUser.firstName, newUser.lastName].filter(Boolean).join(' '),
                            email: newUser.email,
                        }),
                        context: 'user-signup',
                    });
                });
            res.status(StatusCodes.CREATED).json({ message: "User created successfully" });
        }



    } catch (error) {
        // Catch any other errors
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};


const signIn = async (req, res) => {
    try {
        const { userType = 'patient', email, password, selectedStoreRoleCode } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password",
            });
        }

        if (userType === 'admin') {
            const admin = await Admin.findOne({ email });
            if (!admin) {
                return res.status(400).json({ message: "User does not exist..!" });
            }

            if (password !== admin.password) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            const token = jwt.sign(
                { _id: admin._id, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );

            return res.status(200).json({
                token,
                user: { _id: admin._id, name: admin.name, email: admin.email, role: 'admin' },
            });
        }

        if (userType === 'store') {
            const selectedRoleCode = Number(selectedStoreRoleCode) || ROLE_CODES.STORE_ADMIN;
            if (![ROLE_CODES.PHARMACIST, ROLE_CODES.OPERATOR, ROLE_CODES.STORE_ADMIN].includes(selectedRoleCode)) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid store role selected' });
            }

            const storeUser = await User.findOne({ email, roleCode: selectedRoleCode }).select('+hash_password').lean();

            if (storeUser) {
                if (!storeUser.isActive) {
                    return res.status(StatusCodes.FORBIDDEN).json({ message: 'This staff account is inactive. Contact store admin.' });
                }

                const passwordHash = storeUser.hash_password || storeUser.password;
                const isMatch = passwordHash ? await bcrypt.compare(password, passwordHash) : false;
                if (!isMatch) {
                    return res.status(401).json({ message: "Invalid email or password" });
                }

                const linkedStoreId = storeUser.linkedStoreId;
                if (!linkedStoreId) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Store mapping missing for this account' });
                }

                const token = jwt.sign(
                    {
                        _id: linkedStoreId,
                        role: 'Store',
                        roleCode: selectedRoleCode,
                        roleLabel: roleCodeToLabel(selectedRoleCode),
                        authUserId: storeUser._id,
                        storeId: linkedStoreId,
                        staffId: storeUser.linkedStaffId || null,
                        principalType: selectedRoleCode === ROLE_CODES.STORE_ADMIN ? 'store-user' : 'staff',
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '30d' },
                );

                return res.status(200).json({
                    token,
                    user: {
                        _id: linkedStoreId,
                        authUserId: storeUser._id,
                        name: storeUser.name,
                        email: storeUser.email,
                        role: 'Store',
                        roleCode: selectedRoleCode,
                        roleLabel: roleCodeToLabel(selectedRoleCode),
                        staffId: storeUser.linkedStaffId || null,
                    },
                });
            }

            if (selectedRoleCode === ROLE_CODES.STORE_ADMIN) {
                const store = await Store.findOne({ email });
                if (!store) {
                    return res.status(400).json({ message: "User does not exist..!" });
                }

                if (password !== store.password) {
                    return res.status(401).json({ message: "Invalid email or password" });
                }

                const token = jwt.sign(
                    {
                        _id: store._id,
                        role: 'Store',
                        roleCode: ROLE_CODES.STORE_ADMIN,
                        roleLabel: roleCodeToLabel(ROLE_CODES.STORE_ADMIN),
                        authUserId: store._id,
                        storeId: store._id,
                        principalType: 'store',
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "30d" }
                );

                return res.status(200).json({
                    token,
                    user: {
                        _id: store._id,
                        name: store.storeName || store.ownerName || 'Store Admin',
                        email: store.email,
                        role: 'Store',
                        roleCode: ROLE_CODES.STORE_ADMIN,
                        roleLabel: roleCodeToLabel(ROLE_CODES.STORE_ADMIN),
                    },
                });
            }

            return res.status(StatusCodes.NOT_FOUND).json({ message: 'No account found for selected store role' });
        }

        const user = await User.findOne({
            email,
            $or: [{ roleCode: ROLE_CODES.PATIENT }, { roleCode: { $exists: false } }],
        }).select('+hash_password');
        if (!user) {
            return res.status(400).json({
                message: "User does not exist..!",
            });
        }

        const isMatch = await bcrypt.compare(password, user.hash_password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        if (!user.roleCode) {
            await User.updateOne({ _id: user._id }, { $set: { roleCode: ROLE_CODES.PATIENT, roleLabel: roleCodeToLabel(ROLE_CODES.PATIENT), isActive: true } });
        }

        const token = jwt.sign(
            { _id: user._id, role: 'User', roleCode: ROLE_CODES.PATIENT, roleLabel: roleCodeToLabel(ROLE_CODES.PATIENT) },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        return res.status(200).json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: 'User', roleCode: ROLE_CODES.PATIENT, roleLabel: roleCodeToLabel(ROLE_CODES.PATIENT) },
        });

    } catch (error) {
        console.error("Sign-in error: ", error);
        return res.status(500).json({
            message: "An error occurred during sign-in",
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email, new password, and confirm password are required' });
        }

        if (String(newPassword) !== String(confirmPassword)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'New password and confirm password do not match' });
        }

        if (String(newPassword).length < 6) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Password must be at least 6 characters long' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const emailFilter = { $regex: `^${escapedEmail}$`, $options: 'i' };

        const [userAccount, storeAccount, adminAccount] = await Promise.all([
            User.findOne({ email: emailFilter }).select('_id email').lean(),
            Store.findOne({ email: emailFilter }).select('_id email ownerName storeName').lean(),
            Admin.findOne({ email: emailFilter }).select('_id email').lean(),
        ]);

        if (!userAccount && !storeAccount && !adminAccount) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Account not found for this email' });
        }

        const passwordHash = await bcrypt.hash(String(newPassword), 10);

        const updateTasks = [];
        if (userAccount?._id) {
            updateTasks.push(
                User.updateOne(
                    { _id: userAccount._id },
                    { $set: { password: passwordHash, hash_password: passwordHash, isActive: true } },
                )
            );
        }

        if (storeAccount?._id) {
            // Legacy store login still reads plain password from Store collection.
            updateTasks.push(
                Store.updateOne(
                    { _id: storeAccount._id },
                    { $set: { password: String(newPassword) } },
                )
            );
        }

        if (adminAccount?._id) {
            updateTasks.push(
                Admin.updateOne(
                    { _id: adminAccount._id },
                    { $set: { password: String(newPassword) } },
                )
            );
        }

        await Promise.all(updateTasks);

        runInBackground('password-reset-email', async () => {
            await sendDirectEmailSafely({
                to: normalizedEmail,
                subject: 'Your Pharmacy MVP password has been reset',
                text: 'Your password was reset successfully. You can now sign in with your new password.',
                html: buildEmailLayout({
                    eyebrow: 'Password Reset',
                    title: 'Password updated successfully',
                    intro: 'Your password has been changed. Use your new password the next time you sign in.',
                    accent: '#0f766e',
                    summary: [
                        { label: 'Account Email', value: normalizedEmail, background: '#eff6ff', border: '#bfdbfe', labelColor: '#1d4ed8' },
                        { label: 'Status', value: 'Password Updated', background: '#ecfeff', border: '#99f6e4', labelColor: '#0f766e' },
                    ],
                    footer: 'If you did not request this change, contact support immediately.',
                }),
                context: 'password-reset-success',
            });
        });

        return res.status(StatusCodes.OK).json({ message: 'Password reset successful. Please login with your new password.' });
    } catch (error) {
        console.error('forgotPassword error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to reset password' });
    }
};


const fetchData = async (req, res) => {
    try {
        const decoded = req.user;

        if (decoded.role === 'Store') {
            const storeId = decoded.storeId || decoded._id;
            const storeData = await Store.findById(storeId).lean();

            if (!storeData) {
                return res.status(404).json({
                    message: "User not found",
                });
            }

            let loggedInStaff = null;
            if (decoded.staffId) {
                loggedInStaff = await StoreStaff.findById(decoded.staffId)
                    .select('firstName lastName email contact role status')
                    .lean();
            }

            return res.status(200).json({
                success: true,
                userData: {
                    ...storeData,
                    dashboardAccessRole: roleCodeToLabel(decoded.roleCode || ROLE_CODES.STORE_ADMIN),
                    roleCode: Number(decoded.roleCode) || ROLE_CODES.STORE_ADMIN,
                    roleLabel: roleCodeToLabel(decoded.roleCode || ROLE_CODES.STORE_ADMIN),
                    staffId: decoded.staffId || null,
                    loggedInStaff,
                },
            });
        }

        const userData = await User.findById(decoded._id).select('-hash_password');

        if (!userData) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            userData,
        });

    } catch (error) {
        return res.status(500).json({
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
        const { isEmailNotificationOn, isSmsNotificationOn, pushPrefs, emailPrefs, smsPrefs } = req.body;

        const updatePayload = {};

        if (typeof isEmailNotificationOn === 'boolean') updatePayload.isEmailNotificationOn = isEmailNotificationOn;
        if (typeof isSmsNotificationOn   === 'boolean') updatePayload.isSmsNotificationOn   = isSmsNotificationOn;

        const categoryKeys = ['orderUpdates', 'prescriptionReminders', 'offerAlerts', 'healthReminders'];
        const applyPrefs = (prefs, prefix) => {
            if (!prefs || typeof prefs !== 'object') return;
            for (const key of categoryKeys) {
                if (typeof prefs[key] === 'boolean') updatePayload[`${prefix}.${key}`] = prefs[key];
            }
        };
        applyPrefs(pushPrefs,  'pushPrefs');
        applyPrefs(emailPrefs, 'emailPrefs');
        applyPrefs(smsPrefs,   'smsPrefs');

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
        const userId = req.user?._id;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: 'Unauthorized',
            });
        }

        const {
            firstName,
            middleName,
            lastName,
            email,
            mobile,
            address,
            city,
            state,
            pincode,
        } = req.body;

        const updatePayload = {};

        if (typeof firstName === 'string') updatePayload.firstName = firstName.trim();
        if (typeof middleName === 'string') updatePayload.middleName = middleName.trim();
        if (typeof lastName === 'string') updatePayload.lastName = lastName.trim();
        if (typeof email === 'string') updatePayload.email = email.trim();
        if (typeof mobile === 'string') updatePayload.mobile = mobile.trim();
        if (typeof address === 'string') updatePayload.address = address.trim();
        if (typeof city === 'string') updatePayload.city = city.trim();
        if (typeof state === 'string') updatePayload.state = state.trim();
        if (typeof pincode === 'string') updatePayload.pincode = pincode.trim();

        const computedFirstName = updatePayload.firstName ?? '';
        const computedMiddleName = updatePayload.middleName ?? '';
        const computedLastName = updatePayload.lastName ?? '';
        const fullName = [computedFirstName, computedMiddleName, computedLastName]
            .map((part) => String(part || '').trim())
            .filter(Boolean)
            .join(' ');

        if (fullName) {
            updatePayload.name = fullName;
        }

        const updatedPatient = await User.findByIdAndUpdate(
            userId,
            { $set: updatePayload },
            { new: true, runValidators: true }
        ).select('-hash_password');

        if (!updatedPatient) {
            return res.status(404).json({ message: 'Patient not found' });
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

        // Attach storeId from authenticated store owner token if available
        const storeId = req.user?._id || null;

        // Create a new medicine document
        const newMedicine = new Pharmacy({
            name,
            manufacturer,
            dosage,
            type,
            price,
            stock,
            ...(storeId && { storeId }),
        });

        // Save to database
        await newMedicine.save();

        res.status(200).json({ message: 'Medicine added successfully', medicine: newMedicine });
    } catch (error) {
        console.error('Error adding medicine:', error.message);
        res.status(500).json({ error: 'Failed to add medicine' });
    }
};

const computeInventoryStatus = (stockValue) => {
    const stock = Math.max(0, Number(stockValue) || 0);
    if (stock === 0) return 'Out of Stock';
    if (stock <= 20) return 'Low Stock';
    return 'In Stock';
};

const getStoreInventory = async (req, res) => {
    try {
        const storeId = req.user?._id;
        if (!storeId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized store access' });
        }

        const medicines = await Pharmacy.find({ storeId }).sort({ createdAt: -1 }).lean();
        const inventory = medicines.map((medicine) => ({
            ...medicine,
            status: computeInventoryStatus(medicine.stock),
        }));

        return res.status(StatusCodes.OK).json({ success: true, inventory });
    } catch (error) {
        console.error('Error fetching store inventory:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch store inventory' });
    }
};

const createStoreInventoryMedicine = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { name, manufacturer = '', dosage = '', type = '', price = 0, stock = 0 } = req.body;

        if (!storeId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized store access' });
        }

        if (!String(name || '').trim()) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Medicine name is required' });
        }

        const normalizedStock = Math.max(0, Number(stock) || 0);
        const normalizedPrice = Math.max(0, Number(price) || 0);

        const medicine = await Pharmacy.create({
            storeId,
            name: String(name).trim(),
            manufacturer: String(manufacturer || '').trim(),
            dosage: String(dosage || '').trim(),
            type: String(type || '').trim(),
            price: normalizedPrice,
            stock: normalizedStock,
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Medicine added to your inventory',
            medicine: {
                ...medicine.toObject(),
                status: computeInventoryStatus(medicine.stock),
            },
        });
    } catch (error) {
        console.error('Error creating store inventory medicine:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to add medicine' });
    }
};

const updateStoreInventoryMedicine = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { medicineId } = req.params;
        const { name, manufacturer, dosage, type, price, stock } = req.body;

        if (!storeId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized store access' });
        }

        const updatePayload = {};
        if (name !== undefined) updatePayload.name = String(name || '').trim();
        if (manufacturer !== undefined) updatePayload.manufacturer = String(manufacturer || '').trim();
        if (dosage !== undefined) updatePayload.dosage = String(dosage || '').trim();
        if (type !== undefined) updatePayload.type = String(type || '').trim();
        if (price !== undefined) updatePayload.price = Math.max(0, Number(price) || 0);
        if (stock !== undefined) updatePayload.stock = Math.max(0, Number(stock) || 0);

        if (updatePayload.name !== undefined && !updatePayload.name) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Medicine name is required' });
        }

        const medicine = await Pharmacy.findOneAndUpdate(
            { _id: medicineId, storeId },
            { $set: updatePayload },
            { new: true, runValidators: true }
        );

        if (!medicine) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Medicine not found for your store' });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Inventory item updated',
            medicine: {
                ...medicine.toObject(),
                status: computeInventoryStatus(medicine.stock),
            },
        });
    } catch (error) {
        console.error('Error updating store inventory medicine:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update medicine' });
    }
};

const deleteStoreInventoryMedicine = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { medicineId } = req.params;

        if (!storeId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized store access' });
        }

        const deleted = await Pharmacy.findOneAndDelete({ _id: medicineId, storeId });

        if (!deleted) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Medicine not found for your store' });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Inventory item deleted',
            medicineId,
        });
    } catch (error) {
        console.error('Error deleting store inventory medicine:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete medicine' });
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

        const orderPlacedStatus = updatedOrder.trackingStatus || 'Order Placed';
        const orderPlacedAmount = Number(updatedOrder.totalPrice || 0).toFixed(2);

        runInBackground('order-placed-notification', async () => {
            const notificationResult = await triggerUserNotifications({
                userId: updatedOrder.userId,
                emailSubject: `Order placed successfully: ${updatedOrder.orderId}`,
                emailMessage: `Your order has been placed successfully.\n\nOrder ID: ${updatedOrder.orderId}\nAmount: USD ${orderPlacedAmount}\nStatus: ${orderPlacedStatus}\n\nYou can track your order anytime from your dashboard. Thank you for ordering with Pharmacy MVP.`,
                emailHtml: buildOrderPlacedEmailHtml({
                    orderId: updatedOrder.orderId,
                    amount: updatedOrder.totalPrice,
                    status: orderPlacedStatus,
                }),
                smsMessage: null,
                notificationCategory: 'orderUpdates',
            });

            console.log('[Notification][OrderPlaced] Dispatch summary', {
                orderId: updatedOrder.orderId,
                userId: String(updatedOrder.userId),
                result: notificationResult,
            });
        });

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

        runInBackground('store-request-submitted-email', async () => {
            await sendDirectEmailSafely({
                to: createdRequest.email,
                subject: 'Store signup request received',
                text: `Hello ${createdRequest.ownerName}, your store signup request for ${createdRequest.storeName} has been submitted successfully. We will notify you once the review is completed.`,
                html: buildStoreRequestEmailHtml({
                    storeName: createdRequest.storeName,
                    ownerName: createdRequest.ownerName,
                }),
                context: 'store-request-submitted',
            });
        });

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
            await createOrUpdateStoreAdminUser({ store: createdStore, plainPassword });
            await StoreApprovalRequest.findByIdAndDelete(id);
        }

            if (status === 'approved' && createdStore) {
                runInBackground('store-request-approved-email', async () => {
                    await sendDirectEmailSafely({
                        to: request.email,
                        subject: 'Your store has been approved',
                        text: `Hello ${request.ownerName}, your store ${request.storeName} has been approved. Login email: ${request.email}. Temporary password: ${createdStore.password}. Please sign in and change your password.`,
                        html: buildStoreApprovedEmailHtml({
                            storeName: request.storeName,
                            ownerName: request.ownerName,
                            email: request.email,
                            password: createdStore.password,
                        }),
                        context: 'store-request-approved',
                    });
                });
            }

            if (status === 'rejected') {
                runInBackground('store-request-rejected-email', async () => {
                    await sendDirectEmailSafely({
                        to: request.email,
                        subject: 'Your store request was not approved',
                        text: `Hello ${request.ownerName}, your store request for ${request.storeName} was not approved. Notes: ${reviewNotes || 'No additional notes were provided.'}`,
                        html: buildStoreRejectedEmailHtml({
                            storeName: request.storeName,
                            reviewNotes,
                        }),
                        context: 'store-request-rejected',
                    });
                });
            }

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
    // const adminAccess = verifyAdminRequest(req);
    // if (!adminAccess.ok) {
    //     return res.status(adminAccess.status).json({ message: adminAccess.message });
    // }

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

        await User.updateMany(
            { linkedStoreId: updatedStore._id, roleCode: { $in: [ROLE_CODES.STORE_ADMIN, ROLE_CODES.PHARMACIST, ROLE_CODES.OPERATOR] } },
            { $set: { isActive: status === 'Active' } },
        );

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
        await createOrUpdateStoreAdminUser({ store: newStore, plainPassword });

        runInBackground('store-manual-create-email', async () => {
            await sendDirectEmailSafely({
                to: newStore.email,
                subject: 'Your Pharmacy MVP store account is ready',
                text: `Hello ${newStore.ownerName}, your store ${newStore.storeName} has been created successfully. Login email: ${newStore.email}. Temporary password: ${plainPassword}. Please sign in and change your password.`,
                html: buildStoreApprovedEmailHtml({
                    storeName: newStore.storeName,
                    ownerName: newStore.ownerName,
                    email: newStore.email,
                    password: plainPassword,
                }),
                context: 'store-manual-create',
            });
        });

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
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "prescription.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const prescriptions = await PrescriptionRequest.find({})
            .populate('userId', 'name email mobile')
            .populate('reviewedByStaffId', 'firstName lastName role')
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

        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "prescription.review" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const reviewerName = permissionCheck.isOwner
            ? (req.user?.storeName || req.user?.ownerName || 'Store Admin')
            : `${permissionCheck.staffMember?.firstName || ''} ${permissionCheck.staffMember?.lastName || ''}`.trim();
        const reviewerRole = permissionCheck.isOwner ? 'Store Admin' : (permissionCheck.staffMember?.role || 'Pharmacist');
        const reviewerStaffId = permissionCheck.isOwner ? null : permissionCheck.staffMember?._id;

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
                    reviewedByStaffId: reviewerStaffId,
                    reviewedByName: reviewerName,
                    reviewedByRole: reviewerRole,
                    reviewedAt: new Date(),
                },
            },
            { new: true },
        ).populate('userId', 'name email mobile');

        if (!updated) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Prescription request not found' });
        }

        const patientName = updated?.userId?.name || 'Patient';
        const normalizedStatus = String(status || '').toLowerCase();
        const readableStatus = normalizedStatus === 'approved' ? 'Approved' : 'Rejected';
        const notesText = reviewNotes ? ` Notes: ${reviewNotes}` : '';

        runInBackground('prescription-review-notification', async () => {
            await triggerUserNotifications({
                userId: updated?.userId?._id,
                emailSubject: `Prescription ${readableStatus}`,
                emailMessage: `Hi ${patientName}, your prescription has been ${readableStatus.toLowerCase()} by the store.${notesText}`,
                emailHtml: buildPrescriptionStatusEmailHtml({
                        status: readableStatus,
                        reviewNotes,
                }),
                smsMessage: `Prescription ${readableStatus}. ${reviewNotes ? `Notes: ${reviewNotes}` : 'Please check dashboard for details.'}`,
                notificationCategory: 'prescriptionReminders',
            });
        });

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
        const storeId = req.user?.storeId || req.user?._id;
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

        const currentStatus = order.trackingStatus || 'Order Placed';
        const currentIndex = allowedStatuses.indexOf(currentStatus);
        const nextIndex = allowedStatuses.indexOf(trackingStatus);

        // Reliability rule: once progressed, status cannot move backward.
        if (currentIndex !== -1 && nextIndex < currentIndex) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Tracking status cannot be moved backward',
            });
        }

        order.trackingStatus = trackingStatus;
        await order.save();

        runInBackground('order-tracking-notification', async () => {
            await triggerUserNotifications({
                userId: order.userId,
                emailSubject: `Order ${order.orderId} is now ${trackingStatus}`,
                emailMessage: `Your order ${order.orderId} tracking status has been updated to ${trackingStatus}.`,
                emailHtml: buildOrderTrackingEmailHtml({
                        orderId: order.orderId,
                        trackingStatus,
                        deliveryType: deliveryType || order.deliveryType,
                }),
                smsMessage: `Order ${order.orderId}: ${trackingStatus}`,
                notificationCategory: 'orderUpdates',
            });
        });

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
        const orders = await Order.find({ userId })
            .populate('storeId', 'storeName email mobile address city state pincode')
            .sort({ createdAt: -1 })
            .lean();

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
            query.storeId = req.user?.storeId || req.user?._id;
        }

        const order = await Order.findOne(query)
            .populate('storeId', 'storeName email mobile address city state pincode')
            .lean();

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
            loginPassword = '',
        } = req.body;

        if (!firstName || !lastName || !email || !contact || !loginPassword) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Please provide first name, last name, email, contact, and login password' });
        }

        const normalizedRole = normalizeStaffRole(role);
        const roleCode = normalizedRoleToCode(normalizedRole);
        const passwordHash = await bcrypt.hash(String(loginPassword), 10);

        const staffMember = await StoreStaff.create({
            storeId,
            firstName,
            middleName,
            lastName,
            role: normalizedRole,
            email,
            contact,
            address,
            status: 'Active',
        });

        const existingLinkedUser = await User.findOne({ email }).lean();
        if (existingLinkedUser) {
            await StoreStaff.findByIdAndDelete(staffMember._id);
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'This email already exists in user accounts. Use a unique email for staff login.' });
        }

        await User.create({
            name: `${firstName} ${lastName} (${email})`.trim(),
            firstName,
            middleName,
            lastName,
            email,
            mobile: contact,
            contact,
            address: address || 'NA',
            password: passwordHash,
            hash_password: passwordHash,
            roleCode,
            roleLabel: roleCodeToLabel(roleCode),
            linkedStoreId: storeId,
            linkedStaffId: staffMember._id,
            isActive: true,
            storeName: req.user?.storeName || '',
            ownerName: req.user?.ownerName || '',
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
            loginPassword = '',
        } = req.body;

        if (!firstName || !lastName || !email || !contact) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Please provide first name, last name, email, and contact' });
        }

        const normalizedRole = normalizeStaffRole(role);
        const roleCode = normalizedRoleToCode(normalizedRole);

        const staffMember = await StoreStaff.findOneAndUpdate(
            { _id: id, storeId },
            {
                $set: {
                    firstName,
                    middleName,
                    lastName,
                    role: normalizedRole,
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

        const userUpdatePayload = {
            name: `${firstName} ${lastName} (${email})`.trim(),
            firstName,
            middleName,
            lastName,
            email,
            mobile: contact,
            address: address || 'NA',
            roleCode,
            roleLabel: roleCodeToLabel(roleCode),
            linkedStoreId: storeId,
            linkedStaffId: staffMember._id,
        };

        if (loginPassword) {
            const passwordHash = await bcrypt.hash(String(loginPassword), 10);
            userUpdatePayload.password = passwordHash;
            userUpdatePayload.hash_password = passwordHash;
        }

        await User.findOneAndUpdate(
            { linkedStaffId: staffMember._id, linkedStoreId: storeId },
            { $set: userUpdatePayload },
            { new: true, upsert: false },
        );

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

        await User.findOneAndUpdate(
            { linkedStaffId: staffMember._id, linkedStoreId: storeId },
            { $set: { isActive: status === 'Active' } },
            { new: false },
        );

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

        await User.deleteOne({ linkedStaffId: deletedStaff._id, linkedStoreId: storeId });

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
        await ensureUserVaccinationIndexes();
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

const ensureUserVaccinationIndexes = async () => {
    const UserVaccination = require("../models/userVaccination");
    const collection = UserVaccination.collection;
    const indexes = await collection.indexes();

    const hasLegacyIndex = indexes.some((index) => index.name === "userId_1_vaccinationId_1");
    if (hasLegacyIndex) {
        await collection.dropIndex("userId_1_vaccinationId_1");
    }

    const hasNewIndex = indexes.some((index) => index.name === "userId_1_vaccinationMasterId_1");
    if (!hasNewIndex) {
        await collection.createIndex(
            { userId: 1, vaccinationMasterId: 1 },
            { unique: true, name: "userId_1_vaccinationMasterId_1" }
        );
    }
};

const upsertUserVaccination = async (req, res) => {
  try {
        const { vaccineId, vaccinationMasterId, vaccineName, vaccinationDate } = req.body;
    const userId = req.user._id;

        await ensureUserVaccinationIndexes();

    const UserVaccination = require("../models/userVaccination");
        const VaccinationMaster = require("../models/vaccinationMaster");

        let resolvedVaccinationMasterId = vaccinationMasterId || vaccineId;

        if (!resolvedVaccinationMasterId && vaccineName) {
            const master = await VaccinationMaster.findOne({ name: vaccineName });
            resolvedVaccinationMasterId = master?._id;
        }

        if (!resolvedVaccinationMasterId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: "error",
                message: "vaccinationMasterId is required",
            });
        }

        const isVaccinated = Boolean(vaccinationDate);
    
    const vaccination = await UserVaccination.findOneAndUpdate(
            { userId, vaccinationMasterId: resolvedVaccinationMasterId },
      {
        userId,
                vaccinationMasterId: resolvedVaccinationMasterId,
                vaccinationDate: isVaccinated ? new Date(vaccinationDate) : null,
                status: isVaccinated ? "Completed" : "Pending",
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

        const vaccinations = await UserVaccination.find({ userId }).populate(
            "vaccinationMasterId",
            "name vaccineId"
        );

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
        res.status(StatusCodes.OK).json({ status: "success", vaccines });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: "error", message: error.message });
    }
};

// Returns user vaccination records keyed by vaccinationMasterId
const getUserVaccinationsForDashboard = async (req, res) => {
    try {
        const userId = req.user._id;
        const UserVaccination = require("../models/userVaccination");

        const records = await UserVaccination.find({ userId })
            .populate("vaccinationMasterId", "name vaccineId");

        const normalized = records.map((r) => ({
            _id: r._id,
            vaccinationId: {
                _id: r.vaccinationMasterId?._id,
                name: r.vaccinationMasterId?.name,
            },
            status: r.status === "Completed" ? "vaccinated" : "not_vaccinated",
            vaccinationDate: r.vaccinationDate,
        }));

        res.status(StatusCodes.OK).json({ status: "success", records: normalized });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: "error", message: error.message });
    }
};

// PUT /user-vaccinations/:vaccinationId  (vaccinationId = VaccinationMaster _id)
const updateUserVaccinationByMasterId = async (req, res) => {
    try {
        const userId = req.user._id;
        const { vaccinationId } = req.params;
        const { status, vaccinationDate } = req.body;

        await ensureUserVaccinationIndexes();

        const UserVaccination = require("../models/userVaccination");

        const isVaccinated = status === "vaccinated";

        const record = await UserVaccination.findOneAndUpdate(
            { userId, vaccinationMasterId: vaccinationId },
            {
                userId,
                vaccinationMasterId: vaccinationId,
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
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: "error", message: error.message });
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
        existingRequest.reviewedByStaffId = null;
        existingRequest.reviewedByName = '';
        existingRequest.reviewedByRole = '';
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

const createUserQuery = async (req, res) => {
    try {
        const { subject, message, storeId } = req.body;

        if (!subject || !String(subject).trim()) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Subject is required",
            });
        }

        const trimmedMessage = String(message || "").trim();
        if (trimmedMessage.length < 20) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Message must be at least 20 characters",
            });
        }

        const resolvedStoreId = await resolveOrderStoreId(storeId);
        if (!resolvedStoreId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "No active store available to receive your query",
            });
        }

        const createdQuery = await UserQuery.create({
            userId: req.user._id,
            storeId: resolvedStoreId,
            subject: String(subject).trim(),
            message: trimmedMessage,
            status: "open",
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Query submitted successfully",
            query: createdQuery,
        });
    } catch (error) {
        console.error("Error creating user query:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to submit query",
        });
    }
};

const getUserQueries = async (req, res) => {
    try {
        const queries = await UserQuery.find({ userId: req.user._id })
            .populate('storeId', 'storeName name')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(StatusCodes.OK).json({
            success: true,
            queries,
        });
    } catch (error) {
        console.error("Error fetching user queries:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch queries",
        });
    }
};

const getStoreQueries = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const queries = await UserQuery.find({ storeId })
            .populate('userId', 'name email mobile')
            .sort({ status: 1, createdAt: -1 })
            .lean();

        return res.status(StatusCodes.OK).json({
            success: true,
            queries,
        });
    } catch (error) {
        console.error('Error fetching store queries:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch store queries',
        });
    }
};

const answerStoreQuery = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { id } = req.params;
        const answer = String(req.body?.answer || '').trim();

        if (!answer) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Answer is required',
            });
        }

        const updatedQuery = await UserQuery.findOneAndUpdate(
            { _id: id, storeId },
            {
                $set: {
                    answer,
                    status: 'resolved',
                    answeredByStoreId: storeId,
                    answeredAt: new Date(),
                },
            },
            { new: true }
        ).populate('userId', 'name email mobile');

        if (!updatedQuery) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Query not found',
            });
        }

        runInBackground('query-answer-notification', async () => {
            await triggerUserNotifications({
                userId: updatedQuery?.userId?._id,
                emailSubject: `Response to your query: ${updatedQuery.subject}`,
                emailMessage: `Your query has been answered by the store.\n\nSubject: ${updatedQuery.subject}\nAnswer: ${answer}`,
                emailHtml: buildQueryAnsweredEmailHtml({
                        subject: updatedQuery.subject,
                        answer,
                }),
                smsMessage: `Your query has been answered: ${answer}`,
                notificationCategory: 'healthReminders',
            });
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Query answered successfully',
            query: updatedQuery,
        });
    } catch (error) {
        console.error('Error answering query:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to answer query',
        });
    }
};

const parseCsvRow = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];

        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }

    values.push(current.trim());
    return values;
};

const normalizeHeader = (header) =>
    String(header || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

const getCsvValue = (rowMap, keys) => {
    for (const key of keys) {
        const value = rowMap[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value).trim();
        }
    }
    return '';
};

const importPatientsFromCsv = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Patients CSV file is required',
            });
        }

        const csvText = req.file.buffer.toString('utf8').replace(/^\uFEFF/, '');
        const lines = csvText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (lines.length < 2) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'CSV must include header and at least one patient row',
            });
        }

        const headers = parseCsvRow(lines[0]).map(normalizeHeader);
        const totalRows = lines.length - 1;

        const summary = {
            totalRows,
            created: 0,
            skipped: 0,
            errors: [],
        };

        for (let idx = 1; idx < lines.length; idx += 1) {
            const line = lines[idx];
            const cells = parseCsvRow(line);
            const rowNumber = idx + 1;
            const rowMap = {};

            headers.forEach((header, colIndex) => {
                rowMap[header] = cells[colIndex] || '';
            });

            const email = getCsvValue(rowMap, ['email', 'emailid']);
            if (!email) {
                summary.skipped += 1;
                summary.errors.push(`Row ${rowNumber}: Email is required`);
                continue;
            }

            const existingUser = await User.findOne({ email }).select('_id').lean();
            if (existingUser) {
                summary.skipped += 1;
                summary.errors.push(`Row ${rowNumber}: Email already exists (${email})`);
                continue;
            }

            const firstName = getCsvValue(rowMap, ['firstname']);
            const middleName = getCsvValue(rowMap, ['middlename']);
            const lastName = getCsvValue(rowMap, ['lastname']);
            const mobile = getCsvValue(rowMap, ['mobile', 'contact', 'contactnumber']);
            const address = getCsvValue(rowMap, ['address']);
            const city = getCsvValue(rowMap, ['city']);
            const state = getCsvValue(rowMap, ['state']);
            const pincode = getCsvValue(rowMap, ['pincode', 'postalcode']);
            const salutation = getCsvValue(rowMap, ['salutation']);
            const countryCode = getCsvValue(rowMap, ['countrycode']);
            const dob = getCsvValue(rowMap, ['dob', 'dateofbirth']);
            const sex = getCsvValue(rowMap, ['sex', 'gender']);
            const bloodgroup = getCsvValue(rowMap, ['bloodgroup', 'blood']);

            const weightRaw = getCsvValue(rowMap, ['weight']);
            const heightRaw = getCsvValue(rowMap, ['height']);
            const parsedWeight = Number(weightRaw);
            const parsedHeight = Number(heightRaw);

            const baseName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim() || email.split('@')[0] || 'patient';
            const uniqueName = `${baseName}-${Math.random().toString(36).slice(2, 8)}`;
            const temporaryPassword = `MedVision@${Math.random().toString(36).slice(2, 10)}`;
            const hash_password = await bcrypt.hash(temporaryPassword, 10);

            const userPayload = {
                name: uniqueName,
                firstName,
                middleName,
                lastName,
                email,
                mobile,
                address,
                city,
                state,
                pincode,
                salutation,
                countryCode,
                dob,
                sex,
                bloodgroup,
                role: 'User',
                hash_password,
            };

            if (!Number.isNaN(parsedWeight) && weightRaw !== '') {
                userPayload.weight = parsedWeight;
            }
            if (!Number.isNaN(parsedHeight) && heightRaw !== '') {
                userPayload.height = parsedHeight;
            }

            try {
                await User.create(userPayload);
                summary.created += 1;
            } catch (createError) {
                summary.skipped += 1;
                summary.errors.push(`Row ${rowNumber}: ${createError.message}`);
            }
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `Import completed. Created: ${summary.created}, Skipped: ${summary.skipped}`,
            summary,
        });
    } catch (error) {
        console.error('Error importing patients CSV:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to import patients CSV',
        });
    }
};

const getMedicinesByStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({ success: false, message: "Store ID is required" });
    }

        // Strictly return medicines for the selected store only.
        const medicines = await Pharmacy.find({ storeId });

    res.status(200).json({
      success: true,
      medicines,
    });
  } catch (error) {
    console.error("Error fetching medicines by store:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ─── Reviews ────────────────────────────────────────────────────────────────
const normalizeReviewResponse = (reviewDoc) => ({
    _id: reviewDoc._id,
    userId: reviewDoc.userId,
    storeId: reviewDoc.storeId,
    storeName: reviewDoc.storeName,
    name: reviewDoc.name,
    role: reviewDoc.role,
    rating: reviewDoc.rating,
    comment: reviewDoc.comment,
    approved: reviewDoc.approved,
    createdAt: reviewDoc.createdAt,
    updatedAt: reviewDoc.updatedAt,
});

const createReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('firstName lastName name');
        if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });

        const { rating, comment, role, storeId } = req.body;
        if (!storeId || !rating || !comment) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Store, rating and comment are required' });
        }

        const store = await Store.findById(storeId).select('storeName name status').lean();
        if (!store) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Store not found' });
        }

        if (store.status && store.status !== 'Active') {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'You can review only active stores' });
        }

        const existingReview = await Review.findOne({ userId, storeId });
        if (existingReview) {
            return res.status(StatusCodes.CONFLICT).json({
                message: 'You have already reviewed this store. Please edit your existing review.',
                review: normalizeReviewResponse(existingReview),
            });
        }

        const displayName = user.firstName
            ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
            : (user.name || 'Patient');

        const review = await Review.create({
            userId,
            storeId,
            storeName: store.storeName || store.name || 'Store',
            name: displayName,
            role: role || 'Patient',
            rating: Math.min(5, Math.max(1, Number(rating))),
            comment: comment.trim(),
        });

        return res.status(StatusCodes.CREATED).json({
            message: 'Review submitted successfully',
            review: normalizeReviewResponse(review),
        });
    } catch (err) {
        if (err?.code === 11000) {
            return res.status(StatusCodes.CONFLICT).json({
                message: 'You have already reviewed this store. Please edit your existing review.',
            });
        }
        console.error('[Review] createReview error', err.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
};

const updateReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { rating, comment, role } = req.body;

        if (!rating || !comment) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Rating and comment are required' });
        }

        const updatedReview = await Review.findOneAndUpdate(
            { _id: id, userId },
            {
                $set: {
                    rating: Math.min(5, Math.max(1, Number(rating))),
                    comment: String(comment).trim(),
                    ...(role ? { role: String(role).trim() } : {}),
                },
            },
            { new: true, runValidators: true },
        );

        if (!updatedReview) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Review not found' });
        }

        return res.status(StatusCodes.OK).json({
            message: 'Review updated successfully',
            review: normalizeReviewResponse(updatedReview),
        });
    } catch (err) {
        console.error('[Review] updateReview error', err.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
};

const deleteReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const deletedReview = await Review.findOneAndDelete({ _id: id, userId });
        if (!deletedReview) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Review not found' });
        }

        return res.status(StatusCodes.OK).json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('[Review] deleteReview error', err.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
};

const getPublicReviews = async (req, res) => {
    try {
        const { storeId, random, limit } = req.query;
        const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 20));
        const match = { approved: true };

        if (storeId) {
            const store = await Store.findById(storeId).select('_id').lean();
            if (!store) {
                return res.status(StatusCodes.NOT_FOUND).json({ message: 'Store not found' });
            }
            match.storeId = storeId;
        }

        const shouldRandomize = String(random || '').toLowerCase() === 'true';
        let reviews = [];

        if (shouldRandomize) {
            reviews = await Review.aggregate([
                { $match: match },
                { $sample: { size: parsedLimit } },
                {
                    $project: {
                        name: 1,
                        role: 1,
                        rating: 1,
                        comment: 1,
                        storeId: 1,
                        storeName: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    },
                },
            ]);
        } else {
            reviews = await Review.find(match)
                .sort({ createdAt: -1 })
                .limit(parsedLimit)
                .select('name role rating comment storeId storeName storeResponse createdAt updatedAt')
                .lean();
        }

        return res.status(StatusCodes.OK).json({ reviews });
    } catch (err) {
        console.error('[Review] getPublicReviews error', err.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
};

const getStoreReviews = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { limit } = req.query;
        const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 20));

        const store = await Store.findById(storeId).select('_id').lean();
        if (!store) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Store not found' });
        }

        const reviews = await Review.find({ approved: true, storeId })
            .sort({ createdAt: -1 })
            .limit(parsedLimit)
            .select('name role rating comment storeId storeName storeResponse createdAt updatedAt')
            .lean();

        return res.status(StatusCodes.OK).json({ reviews });
    } catch (err) {
        console.error('[Review] getStoreReviews error', err.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
};

const getMyStoreReviews = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { limit } = req.query;
        const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 50));

        if (!storeId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        const reviews = await Review.find({ storeId, approved: true })
            .sort({ createdAt: -1 })
            .limit(parsedLimit)
            .select('name role rating comment storeId storeName storeResponse createdAt updatedAt')
            .lean();

        const totalReviews = reviews.length;
        const averageRating = totalReviews
            ? Number((reviews.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / totalReviews).toFixed(2))
            : 0;

        return res.status(StatusCodes.OK).json({
            reviews,
            summary: {
                totalReviews,
                averageRating,
                withResponse: reviews.filter((r) => String(r?.storeResponse?.message || '').trim()).length,
            },
        });
    } catch (err) {
        console.error('[Review] getMyStoreReviews error', err.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
};

const replyToReview = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { id } = req.params;
        const responseMessage = String(req.body?.message || '').trim();

        if (!storeId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        if (!responseMessage) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Reply message is required' });
        }

        const store = await Store.findById(storeId).select('storeName name').lean();
        if (!store) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Store not found' });
        }

        const updated = await Review.findOneAndUpdate(
            { _id: id, storeId },
            {
                $set: {
                    storeResponse: {
                        message: responseMessage,
                        repliedAt: new Date(),
                        repliedBy: store.storeName || store.name || 'Store Team',
                    },
                },
            },
            { new: true, runValidators: true }
        )
            .select('name role rating comment storeId storeName storeResponse createdAt updatedAt')
            .lean();

        if (!updated) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Review not found for this store' });
        }

        return res.status(StatusCodes.OK).json({
            message: 'Reply posted successfully',
            review: updated,
        });
    } catch (err) {
        console.error('[Review] replyToReview error', err.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
};

const getMyReviews = async (req, res) => {
    try {
        const userId = req.user._id;
        const reviewDocs = await Review.find({ userId })
            .sort({ updatedAt: -1 })
            .select('name role rating comment storeId storeName approved createdAt updatedAt')
            .populate('storeId', 'storeName name')
            .lean();

        const reviews = reviewDocs.map((review) => {
            const resolvedStoreId =
                review?.storeId && typeof review.storeId === 'object'
                    ? review.storeId._id
                    : review.storeId;

            const resolvedStoreName =
                review.storeName ||
                (review?.storeId && typeof review.storeId === 'object'
                    ? (review.storeId.storeName || review.storeId.name)
                    : undefined) ||
                'Store';

            return {
                ...review,
                storeId: resolvedStoreId,
                storeName: resolvedStoreName,
            };
        });

        return res.status(StatusCodes.OK).json({ reviews });
    } catch (err) {
        console.error('[Review] getMyReviews error', err.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
    }
};

// Prescription Upload Feature
const uploadPrescriptionForAutoFill = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No file uploaded' });
        }

        const PrescriptionUpload = require('../models/prescriptionUpload');
        const { extractMedicinesFromText, matchMedicineWithDatabase } = require('../utils/prescriptionProcessor');
        const Pharmacy = require('../models/pharmacy');

        const { filename, mimetype, size, path: filePath } = req.file;

        // Validate file type
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
        if (!allowedMimes.includes(mimetype)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ 
                message: 'Invalid file type. Only PDF and images allowed.' 
            });
        }

        // Create prescription upload record
        const prescriptionUpload = new PrescriptionUpload({
            userId,
            fileName: filename,
            filePath: filePath,
            mimeType: mimetype,
            fileSize: size,
            status: 'uploaded',
        });

        await prescriptionUpload.save();

        // For MVP: Return the upload record without extraction
        // In production: Use OCR/PDF parsing libraries
        res.status(StatusCodes.CREATED).json({
            success: true,
            prescriptionUpload: {
                _id: prescriptionUpload._id,
                fileName: prescriptionUpload.fileName,
                uploadedAt: prescriptionUpload.createdAt,
                status: prescriptionUpload.status,
                message: 'Prescription uploaded. To extract medicines, please use the extraction endpoint or upload again.',
            },
        });
    } catch (error) {
        console.error('uploadPrescriptionForAutoFill error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            message: 'Failed to upload prescription' 
        });
    }
};

const extractMedicinesFromUploadedPrescription = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { prescriptionId } = req.params;
        const { manualMedicines } = req.body;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        const PrescriptionUpload = require('../models/prescriptionUpload');
        const Pharmacy = require('../models/pharmacy');

        const prescriptionUpload = await PrescriptionUpload.findById(prescriptionId);
        if (!prescriptionUpload) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Prescription not found' });
        }

        if (prescriptionUpload.userId.toString() !== userId.toString()) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'Unauthorized access to prescription' });
        }

        // If manual medicines provided, use those
        if (manualMedicines && Array.isArray(manualMedicines)) {
            // Get all medicines from pharmacy database
            const pharmacyMedicines = await Pharmacy.find({}).lean();
            const { matchMedicineWithDatabase } = require('../utils/prescriptionProcessor');

            const extractedWithMatches = manualMedicines.map(med => {
                const match = matchMedicineWithDatabase(med, pharmacyMedicines);
                return {
                    ...med,
                    medicineId: match.medicineId,
                    isMatched: match.medicineId !== null,
                    matchConfidence: match.matchConfidence,
                };
            });

            prescriptionUpload.extractedMedicines = extractedWithMatches;
            prescriptionUpload.status = 'extracted';
            await prescriptionUpload.save();

            return res.status(StatusCodes.OK).json({
                success: true,
                prescriptionUpload,
                message: 'Medicines extracted and matched',
            });
        }

        // For MVP: Return empty extracted medicines (requires manual input)
        res.status(StatusCodes.OK).json({
            success: true,
            prescriptionUpload,
            message: 'Please manually add medicines from your prescription',
            extractionNote: 'Full OCR support coming soon. For now, please manually enter medicines.',
        });
    } catch (error) {
        console.error('extractMedicinesFromUploadedPrescription error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            message: 'Failed to extract medicines' 
        });
    }
};

const getUserPrescriptionUploads = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        const PrescriptionUpload = require('../models/prescriptionUpload');

        const prescriptions = await PrescriptionUpload.find({ userId })
            .sort({ createdAt: -1 })
            .populate('extractedMedicines.medicineId', 'name manufacturer price')
            .lean();

        res.status(StatusCodes.OK).json({
            success: true,
            prescriptions,
        });
    } catch (error) {
        console.error('getUserPrescriptionUploads error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            message: 'Failed to fetch prescriptions' 
        });
    }
};

const addExtractedMedicinesToCart = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { prescriptionId, selectedMedicineIds } = req.body;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        if (!prescriptionId || !Array.isArray(selectedMedicineIds)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ 
                message: 'prescriptionId and selectedMedicineIds required' 
            });
        }

        const PrescriptionUpload = require('../models/prescriptionUpload');
        const User = require('../models/user');
        const Pharmacy = require('../models/pharmacy');

        const prescriptionUpload = await PrescriptionUpload.findById(prescriptionId);
        if (!prescriptionUpload) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Prescription not found' });
        }

        if (prescriptionUpload.userId.toString() !== userId.toString()) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'Unauthorized' });
        }

        // Get user and their cart
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        }

        // Filter selected medicines and add to cart
        const medicinesToAdd = prescriptionUpload.extractedMedicines.filter(med =>
            selectedMedicineIds.includes(med.medicineId?.toString())
        );

        for (const medicine of medicinesToAdd) {
            const existing = user.cart.find(item => 
                item.medicineId.toString() === medicine.medicineId.toString()
            );

            if (existing) {
                existing.quantity = (existing.quantity || 0) + (medicine.quantity || 1);
            } else {
                user.cart.push({
                    medicineId: medicine.medicineId,
                    quantity: medicine.quantity || 1,
                });
            }
        }

        prescriptionUpload.addedToCart = true;
        await Promise.all([user.save(), prescriptionUpload.save()]);

        res.status(StatusCodes.OK).json({
            success: true,
            message: `${medicinesToAdd.length} medicines added to cart`,
            cartCount: user.cart.length,
        });
    } catch (error) {
        console.error('addExtractedMedicinesToCart error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            message: 'Failed to add medicines to cart' 
        });
    }
};

// Health Management (Patient)
const createMedicineTracker = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { medicineName, dosage, frequency, startDate, endDate, expiryDate } = req.body;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        if (!medicineName || !dosage || !frequency || !startDate) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'medicineName, dosage, frequency and startDate are required' });
        }

        const MedicineTracker = require('../models/medicineTracker');
        const tracker = await MedicineTracker.create({
            userId,
            medicineName: String(medicineName).trim(),
            dosage: String(dosage).trim(),
            frequency: String(frequency).trim(),
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
        });

        return res.status(StatusCodes.CREATED).json({
            message: 'Medicine tracker created',
            tracker,
        });
    } catch (error) {
        console.error('createMedicineTracker error:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create medicine tracker' });
    }
};

const getMedicineTrackers = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        const MedicineTracker = require('../models/medicineTracker');
        const trackers = await MedicineTracker.find({ userId, isActive: true })
            .sort({ createdAt: -1 })
            .lean();

        const now = new Date();
        const sevenDaysAhead = new Date(now);
        sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);

        const expiryReminders = trackers
            .filter((item) => item.expiryDate && new Date(item.expiryDate) <= sevenDaysAhead)
            .map((item) => ({
                trackerId: item._id,
                medicineName: item.medicineName,
                expiryDate: item.expiryDate,
                daysLeft: Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            }))
            .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

        return res.status(StatusCodes.OK).json({
            trackers,
            expiryReminders,
        });
    } catch (error) {
        console.error('getMedicineTrackers error:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch medicine trackers' });
    }
};

const logMedicineIntake = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { dose, note, takenAt } = req.body;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        const MedicineTracker = require('../models/medicineTracker');
        const tracker = await MedicineTracker.findOne({ _id: id, userId });
        if (!tracker) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Tracker not found' });
        }

        const intakeAt = takenAt ? new Date(takenAt) : new Date();
        tracker.intakeLogs.push({
            takenAt: intakeAt,
            dose: String(dose || '').trim(),
            note: String(note || '').trim(),
        });
        tracker.lastTakenAt = intakeAt;
        await tracker.save();

        return res.status(StatusCodes.OK).json({
            message: 'Intake logged',
            tracker,
        });
    } catch (error) {
        console.error('logMedicineIntake error:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to log intake' });
    }
};

const checkDrugInteractions = async (req, res) => {
    try {
        const userId = req.user?._id;
        const medicineNames = Array.isArray(req.body?.medicineNames) ? req.body.medicineNames : [];

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        if (!medicineNames.length) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'medicineNames must be a non-empty array' });
        }

        const normalized = medicineNames.map((m) => String(m || '').trim().toLowerCase()).filter(Boolean);
        const knownInteractions = [
            { a: 'aspirin', b: 'ibuprofen', severity: 'Moderate', note: 'Can reduce aspirin cardioprotective effect.' },
            { a: 'warfarin', b: 'aspirin', severity: 'High', note: 'Increased bleeding risk.' },
            { a: 'warfarin', b: 'ibuprofen', severity: 'High', note: 'Increased bleeding risk.' },
            { a: 'metformin', b: 'alcohol', severity: 'Moderate', note: 'Risk of lactic acidosis may increase.' },
            { a: 'lisinopril', b: 'ibuprofen', severity: 'Moderate', note: 'May reduce antihypertensive effect and impact kidneys.' },
            { a: 'amlodipine', b: 'simvastatin', severity: 'Moderate', note: 'May increase simvastatin levels.' },
        ];

        const warnings = [];
        for (let i = 0; i < normalized.length; i += 1) {
            for (let j = i + 1; j < normalized.length; j += 1) {
                const left = normalized[i];
                const right = normalized[j];
                const hit = knownInteractions.find(
                    (pair) => (pair.a === left && pair.b === right) || (pair.a === right && pair.b === left)
                );
                if (hit) {
                    warnings.push({
                        medicines: [medicineNames[i], medicineNames[j]],
                        severity: hit.severity,
                        note: hit.note,
                    });
                }
            }
        }

        return res.status(StatusCodes.OK).json({
            medicineNames,
            warnings,
            hasInteractions: warnings.length > 0,
        });
    } catch (error) {
        console.error('checkDrugInteractions error:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to check interactions' });
    }
};

const getMedicalTimeline = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        const MedicineTracker = require('../models/medicineTracker');
        const UserVaccination = require('../models/userVaccination');
        const PrescriptionRequest = require('../models/prescriptionRequest');

        const [orders, vaccinations, prescriptions, trackers] = await Promise.all([
            Order.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
            UserVaccination.find({ userId, status: 'Completed' }).populate('vaccinationMasterId', 'name').lean(),
            PrescriptionRequest.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
            MedicineTracker.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
        ]);

        const events = [];

        orders.forEach((order) => {
            events.push({
                type: 'Order',
                title: `Medicine order ${order.orderId || ''}`.trim(),
                date: order.createdAt,
                details: `${order.items?.length || 0} item(s), status: ${order.status || 'N/A'}`,
            });
        });

        vaccinations.forEach((vac) => {
            events.push({
                type: 'Vaccination',
                title: vac.vaccinationMasterId?.name || 'Vaccination',
                date: vac.vaccinationDate || vac.createdAt,
                details: 'Vaccination completed',
            });
        });

        prescriptions.forEach((pres) => {
            events.push({
                type: 'Prescription',
                title: pres.fileName || 'Prescription upload',
                date: pres.createdAt,
                details: `Status: ${pres.status || 'pending'}`,
            });
        });

        trackers.forEach((tracker) => {
            (tracker.intakeLogs || []).forEach((log) => {
                events.push({
                    type: 'Dosage',
                    title: `Dose taken: ${tracker.medicineName}`,
                    date: log.takenAt,
                    details: log.dose || tracker.dosage,
                });
            });
        });

        events.sort((a, b) => new Date(b.date) - new Date(a.date));
        return res.status(StatusCodes.OK).json({ events: events.slice(0, 300) });
    } catch (error) {
        console.error('getMedicalTimeline error:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch medical timeline' });
    }
};

const exportHealthRecordsPdf = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        const PDFDocument = require('pdfkit');
        const MedicineTracker = require('../models/medicineTracker');
        const UserVaccination = require('../models/userVaccination');
        const VaccinationMaster = require('../models/vaccinationMaster');
        const PrescriptionRequest = require('../models/prescriptionRequest');

        const [user, orders, trackers, prescriptions, vaccinations] = await Promise.all([
            User.findById(userId).select('name email mobile').lean(),
            Order.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
            MedicineTracker.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
            PrescriptionRequest.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
            UserVaccination.find({ userId }).populate('vaccinationMasterId', 'name').lean(),
        ]);

        const filename = `health-records-${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const doc = new PDFDocument({ margin: 40 });
        doc.pipe(res);

        doc.fontSize(18).text('Health Records Report', { underline: true });
        doc.moveDown(0.6);
        doc.fontSize(11).text(`Generated: ${new Date().toLocaleString()}`);
        doc.text(`Patient: ${user?.name || 'Unknown'}`);
        doc.text(`Email: ${user?.email || 'N/A'}`);
        doc.text(`Mobile: ${user?.mobile || 'N/A'}`);
        doc.moveDown();

        doc.fontSize(14).text('Medicine Trackers');
        doc.moveDown(0.4);
        if (!trackers.length) {
            doc.fontSize(10).text('No medicine trackers found.');
        } else {
            trackers.forEach((item, index) => {
                doc.fontSize(10).text(`${index + 1}. ${item.medicineName} | ${item.dosage} | ${item.frequency}`);
                doc.text(`   Start: ${item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'} | Expiry: ${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}`);
                doc.text(`   Last intake: ${item.lastTakenAt ? new Date(item.lastTakenAt).toLocaleString() : 'N/A'}`);
            });
        }
        doc.moveDown();

        doc.fontSize(14).text('Vaccinations');
        doc.moveDown(0.4);
        if (!vaccinations.length) {
            doc.fontSize(10).text('No vaccination records found.');
        } else {
            vaccinations.forEach((vac, index) => {
                doc.fontSize(10).text(`${index + 1}. ${vac.vaccinationMasterId?.name || 'Vaccine'} | ${vac.status || 'N/A'} | ${vac.vaccinationDate ? new Date(vac.vaccinationDate).toLocaleDateString() : 'N/A'}`);
            });
        }
        doc.moveDown();

        doc.fontSize(14).text('Prescription History');
        doc.moveDown(0.4);
        if (!prescriptions.length) {
            doc.fontSize(10).text('No prescriptions found.');
        } else {
            prescriptions.forEach((pres, index) => {
                doc.fontSize(10).text(`${index + 1}. ${pres.fileName || 'Prescription'} | ${pres.status || 'pending'} | ${pres.createdAt ? new Date(pres.createdAt).toLocaleDateString() : 'N/A'}`);
            });
        }
        doc.moveDown();

        doc.fontSize(14).text('Order History');
        doc.moveDown(0.4);
        if (!orders.length) {
            doc.fontSize(10).text('No orders found.');
        } else {
            orders.forEach((order, index) => {
                doc.fontSize(10).text(`${index + 1}. ${order.orderId || 'Order'} | ${order.status || 'N/A'} | ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'} | Total: ${order.totalPrice || 0}`);
            });
        }

        doc.end();
    } catch (error) {
        console.error('exportHealthRecordsPdf error:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to export health records PDF' });
    }
};

// Wishlist Feature (Patient)
const getWishlist = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(userId)
            .select('wishlist')
            .populate('wishlist.medicineId', 'name manufacturer dosage type price stock storeId')
            .lean();

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        }

        const wishlistItems = (user.wishlist || [])
            .filter((item) => item?.medicineId)
            .map((item) => ({
                medicine: item.medicineId,
                addedAt: item.addedAt,
            }));

        return res.status(StatusCodes.OK).json({
            success: true,
            wishlist: wishlistItems,
            wishlistMedicineIds: wishlistItems.map((entry) => String(entry.medicine._id)),
        });
    } catch (error) {
        console.error('getWishlist error:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to load wishlist' });
    }
};

const addToWishlist = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { medicineId } = req.body;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        if (!medicineId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'medicineId is required' });
        }

        const [user, medicine] = await Promise.all([
            User.findById(userId),
            Pharmacy.findById(medicineId).select('_id'),
        ]);

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        }
        if (!medicine) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Medicine not found' });
        }

        const alreadyExists = (user.wishlist || []).some(
            (item) => String(item.medicineId) === String(medicineId)
        );

        if (alreadyExists) {
            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Medicine already in wishlist',
                wishlistCount: user.wishlist.length,
            });
        }

        user.wishlist.push({ medicineId });
        await user.save();

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Medicine added to wishlist',
            wishlistCount: user.wishlist.length,
        });
    } catch (error) {
        console.error('addToWishlist error:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to add to wishlist' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { medicineId } = req.params;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }

        if (!medicineId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'medicineId is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        }

        const initialCount = user.wishlist.length;
        user.wishlist = (user.wishlist || []).filter(
            (item) => String(item.medicineId) !== String(medicineId)
        );

        if (user.wishlist.length === initialCount) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Medicine not found in wishlist' });
        }

        await user.save();

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Medicine removed from wishlist',
            wishlistCount: user.wishlist.length,
        });
    } catch (error) {
        console.error('removeFromWishlist error:', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to remove from wishlist' });
    }
};

const getStoreRolePermissions = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const { role, staffId } = req.query;

        if (staffId) {
            const staffMember = await StoreStaff.findOne({ _id: staffId, storeId }).select("role firstName lastName");
            if (!staffMember) {
                return res.status(StatusCodes.NOT_FOUND).json({ message: "Staff member not found" });
            }
            return res.status(StatusCodes.OK).json({
                role: staffMember.role,
                staffName: `${staffMember.firstName || ""} ${staffMember.lastName || ""}`.trim(),
                permissions: getRolePermissions(staffMember.role),
            });
        }

        const normalizedRole = normalizeStaffRole(role || "Store Admin");
        return res.status(StatusCodes.OK).json({
            role: normalizedRole,
            permissions: getRolePermissions(normalizedRole),
            availableRoles: Object.keys(STAFF_ROLE_PERMISSIONS),
        });
    } catch (error) {
        console.error("getStoreRolePermissions error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to load role permissions" });
    }
};

const createStaffPerformanceRecord = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "performance.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const {
            staffId,
            periodStart,
            periodEnd,
            ordersProcessed = 0,
            prescriptionsReviewed = 0,
            avgFulfillmentMinutes = 0,
            attendanceScore = 0,
            customerRating = 0,
            efficiencyScore,
            notes = "",
        } = req.body;

        if (!staffId || !periodStart || !periodEnd) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "staffId, periodStart and periodEnd are required" });
        }

        const staff = await StoreStaff.findOne({ _id: staffId, storeId }).select("_id");
        if (!staff) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Staff member not found" });
        }

        const normalizedAttendance = Math.min(100, Math.max(0, Number(attendanceScore) || 0));
        const normalizedRating = Math.min(5, Math.max(0, Number(customerRating) || 0));
        const throughputScore = Math.min(100, (Number(ordersProcessed) || 0) * 2);
        const speedScore = Math.max(0, 100 - (Number(avgFulfillmentMinutes) || 0));
        const computedEfficiency = Math.round((normalizedAttendance * 0.35) + (normalizedRating * 20 * 0.35) + (throughputScore * 0.2) + (speedScore * 0.1));

        const performance = await StaffPerformance.findOneAndUpdate(
            { storeId, staffId, periodStart: new Date(periodStart), periodEnd: new Date(periodEnd) },
            {
                $set: {
                    ordersProcessed: Math.max(0, Number(ordersProcessed) || 0),
                    prescriptionsReviewed: Math.max(0, Number(prescriptionsReviewed) || 0),
                    avgFulfillmentMinutes: Math.max(0, Number(avgFulfillmentMinutes) || 0),
                    attendanceScore: normalizedAttendance,
                    customerRating: normalizedRating,
                    efficiencyScore: Math.min(100, Math.max(0, Number(efficiencyScore ?? computedEfficiency) || 0)),
                    notes,
                },
            },
            { new: true, upsert: true, runValidators: true },
        ).populate("staffId", "firstName lastName role email contact");

        return res.status(StatusCodes.OK).json({ message: "Performance record saved", performance });
    } catch (error) {
        console.error("createStaffPerformanceRecord error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to save performance record" });
    }
};

const getStaffPerformanceRecords = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "performance.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { staffId, from, to } = req.query;
        const query = { storeId };

        if (staffId) {
            query.staffId = staffId;
        }
        if (from || to) {
            query.periodStart = {};
            if (from) query.periodStart.$gte = new Date(from);
            if (to) query.periodStart.$lte = new Date(to);
        }

        const records = await StaffPerformance.find(query)
            .populate("staffId", "firstName lastName role email contact")
            .sort({ periodStart: -1, createdAt: -1 });

        const avgEfficiency = records.length
            ? Math.round(records.reduce((sum, item) => sum + (Number(item.efficiencyScore) || 0), 0) / records.length)
            : 0;

        return res.status(StatusCodes.OK).json({
            records,
            summary: {
                totalRecords: records.length,
                avgEfficiency,
            },
        });
    } catch (error) {
        console.error("getStaffPerformanceRecords error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch performance records" });
    }
};

const createStaffAttendanceRecord = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "attendance.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const {
            staffId,
            date,
            shiftType = "Morning",
            shiftStart,
            shiftEnd,
            status = "Present",
            notes = "",
        } = req.body;

        if (!staffId || !date || !shiftStart || !shiftEnd) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "staffId, date, shiftStart and shiftEnd are required" });
        }

        const staff = await StoreStaff.findOne({ _id: staffId, storeId }).select("_id");
        if (!staff) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Staff member not found" });
        }

        const record = await StaffAttendance.findOneAndUpdate(
            {
                storeId,
                staffId,
                date: new Date(date),
            },
            {
                $set: {
                    shiftType,
                    shiftStart: new Date(shiftStart),
                    shiftEnd: new Date(shiftEnd),
                    status,
                    notes,
                },
            },
            { new: true, upsert: true, runValidators: true },
        ).populate("staffId", "firstName lastName role");

        return res.status(StatusCodes.OK).json({ message: "Attendance record saved", attendance: record });
    } catch (error) {
        console.error("createStaffAttendanceRecord error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to save attendance record" });
    }
};

const getStaffAttendanceRecords = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "attendance.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { staffId, from, to } = req.query;
        const query = { storeId };
        if (staffId) query.staffId = staffId;
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = new Date(from);
            if (to) query.date.$lte = new Date(to);
        }

        const records = await StaffAttendance.find(query)
            .populate("staffId", "firstName lastName role")
            .sort({ date: -1, createdAt: -1 });

        const presentCount = records.filter((record) => record.status === "Present").length;

        return res.status(StatusCodes.OK).json({
            records,
            summary: {
                totalRecords: records.length,
                presentCount,
                attendanceRate: records.length ? Math.round((presentCount / records.length) * 100) : 0,
            },
        });
    } catch (error) {
        console.error("getStaffAttendanceRecords error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch attendance records" });
    }
};

const checkInStaffAttendance = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "attendance.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { id } = req.params;
        const attendance = await StaffAttendance.findOneAndUpdate(
            { _id: id, storeId },
            { $set: { checkInAt: new Date(), status: "Present" } },
            { new: true },
        ).populate("staffId", "firstName lastName role");

        if (!attendance) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Attendance record not found" });
        }

        return res.status(StatusCodes.OK).json({ message: "Check-in recorded", attendance });
    } catch (error) {
        console.error("checkInStaffAttendance error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to check in attendance" });
    }
};

const checkOutStaffAttendance = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "attendance.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { id } = req.params;
        const attendance = await StaffAttendance.findOneAndUpdate(
            { _id: id, storeId },
            { $set: { checkOutAt: new Date() } },
            { new: true },
        ).populate("staffId", "firstName lastName role");

        if (!attendance) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Attendance record not found" });
        }

        return res.status(StatusCodes.OK).json({ message: "Check-out recorded", attendance });
    } catch (error) {
        console.error("checkOutStaffAttendance error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to check out attendance" });
    }
};

const createStaffTrainingRecord = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "training.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const {
            staffId,
            title,
            moduleType = "Product Knowledge",
            score = 0,
            maxScore = 100,
            passed,
            completedAt,
            validTill,
            certificateId = "",
            notes = "",
        } = req.body;

        if (!staffId || !title) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "staffId and title are required" });
        }

        const staff = await StoreStaff.findOne({ _id: staffId, storeId }).select("_id");
        if (!staff) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Staff member not found" });
        }

        const training = await StaffTraining.create({
            storeId,
            staffId,
            title,
            moduleType,
            score: Math.max(0, Number(score) || 0),
            maxScore: Math.max(1, Number(maxScore) || 100),
            passed: typeof passed === "boolean" ? passed : (Number(score) || 0) >= 0.6 * (Number(maxScore) || 100),
            completedAt: completedAt ? new Date(completedAt) : new Date(),
            validTill: validTill ? new Date(validTill) : null,
            certificateId,
            notes,
        });

        return res.status(StatusCodes.CREATED).json({ message: "Training record added", training });
    } catch (error) {
        console.error("createStaffTrainingRecord error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to add training record" });
    }
};

const getStaffTrainingRecords = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "training.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { staffId, moduleType } = req.query;
        const query = { storeId };
        if (staffId) query.staffId = staffId;
        if (moduleType) query.moduleType = moduleType;

        const records = await StaffTraining.find(query)
            .populate("staffId", "firstName lastName role")
            .sort({ completedAt: -1, createdAt: -1 });

        const passedCount = records.filter((record) => record.passed).length;

        return res.status(StatusCodes.OK).json({
            records,
            summary: {
                totalRecords: records.length,
                passedCount,
                completionRate: records.length ? Math.round((passedCount / records.length) * 100) : 0,
            },
        });
    } catch (error) {
        console.error("getStaffTrainingRecords error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch training records" });
    }
};

const createComplianceChecklistItem = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "compliance.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const {
            itemType = "Other",
            title,
            dueDate,
            status = "Pending",
            priority = "Medium",
            reminderDaysBefore = 7,
            notes = "",
            lastCompletedAt,
        } = req.body;

        if (!title || !dueDate) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "title and dueDate are required" });
        }

        const item = await ComplianceChecklist.create({
            storeId,
            itemType,
            title,
            dueDate: new Date(dueDate),
            status,
            priority,
            reminderDaysBefore: Math.max(0, Number(reminderDaysBefore) || 0),
            notes,
            lastCompletedAt: lastCompletedAt ? new Date(lastCompletedAt) : null,
        });

        return res.status(StatusCodes.CREATED).json({ message: "Compliance item created", item });
    } catch (error) {
        console.error("createComplianceChecklistItem error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to create compliance item" });
    }
};

const getComplianceChecklistItems = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "compliance.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { status, itemType } = req.query;
        const query = { storeId };
        if (status) query.status = status;
        if (itemType) query.itemType = itemType;

        const today = new Date();
        await ComplianceChecklist.updateMany(
            { storeId, status: { $ne: "Completed" }, dueDate: { $lt: today } },
            { $set: { status: "Overdue" } },
        );

        const items = await ComplianceChecklist.find(query).sort({ dueDate: 1, createdAt: -1 });
        return res.status(StatusCodes.OK).json({ items, total: items.length });
    } catch (error) {
        console.error("getComplianceChecklistItems error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch compliance checklist" });
    }
};

const updateComplianceChecklistItem = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "compliance.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { id } = req.params;
        const updates = { ...req.body };
        if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);
        if (updates.lastCompletedAt) updates.lastCompletedAt = new Date(updates.lastCompletedAt);

        const item = await ComplianceChecklist.findOneAndUpdate(
            { _id: id, storeId },
            { $set: updates },
            { new: true, runValidators: true },
        );

        if (!item) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Compliance item not found" });
        }

        return res.status(StatusCodes.OK).json({ message: "Compliance item updated", item });
    } catch (error) {
        console.error("updateComplianceChecklistItem error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to update compliance item" });
    }
};

const getComplianceReminders = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "compliance.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const nextDays = Math.max(1, Number(req.query.nextDays) || 15);
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + nextDays);

        const [overdue, upcoming] = await Promise.all([
            ComplianceChecklist.find({
                storeId,
                status: { $ne: "Completed" },
                dueDate: { $lt: now },
            }).sort({ dueDate: 1 }),
            ComplianceChecklist.find({
                storeId,
                status: { $ne: "Completed" },
                dueDate: { $gte: now, $lte: future },
            }).sort({ dueDate: 1 }),
        ]);

        return res.status(StatusCodes.OK).json({
            nextDays,
            overdue,
            upcoming,
        });
    } catch (error) {
        console.error("getComplianceReminders error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch compliance reminders" });
    }
};

const createInvoice = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.invoices.generate" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const {
            orderId = "",
            customerName = "Walk-in Customer",
            customerGstNumber = "",
            items = [],
            gstRateDefault = 0,
            discount = 0,
            paymentMethod = "Other",
            initialPaidAmount = 0,
            paymentReference = "",
        } = req.body;

        let invoiceItemsInput = items;
        if ((!Array.isArray(invoiceItemsInput) || !invoiceItemsInput.length) && orderId) {
            const order = await Order.findOne({ orderId, storeId }).lean();
            if (!order) {
                return res.status(StatusCodes.NOT_FOUND).json({ message: "Order not found for invoice generation" });
            }
            invoiceItemsInput = (order.items || []).map((item) => ({
                medicineId: item.id,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.price,
                gstRate: gstRateDefault,
                costPrice: 0,
                category: "General",
            }));
        }

        if (!Array.isArray(invoiceItemsInput) || !invoiceItemsInput.length) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "At least one invoice item is required" });
        }

        const lineItems = buildInvoiceItems({ items: invoiceItemsInput, gstRateDefault });
        const totals = summarizeInvoiceTotals(lineItems, discount);

        const paidAmount = Math.max(0, Math.min(totals.grandTotal, toCurrency(initialPaidAmount)));
        const balanceAmount = toCurrency(totals.grandTotal - paidAmount);
        const paymentStatus = paidAmount <= 0 ? "Pending" : (balanceAmount > 0 ? "Partial" : "Paid");

        const payments = [];
        if (paidAmount > 0) {
            payments.push({
                amount: paidAmount,
                method: paymentMethod,
                reference: paymentReference,
                status: "Success",
                paidAt: new Date(),
            });
        }

        const invoice = await Invoice.create({
            storeId,
            orderId,
            invoiceNumber: makeInvoiceNumber(),
            customerName,
            customerGstNumber,
            lineItems,
            subtotal: totals.subtotal,
            totalGst: totals.totalGst,
            discount: totals.discount,
            grandTotal: totals.grandTotal,
            paymentStatus,
            paymentMethod,
            paidAmount,
            balanceAmount,
            payments,
        });

        return res.status(StatusCodes.CREATED).json({ message: "Invoice generated", invoice });
    } catch (error) {
        console.error("createInvoice error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to generate invoice" });
    }
};

const getStoreInvoices = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.invoices.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { paymentStatus, from, to } = req.query;
        const query = { storeId };
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const invoices = await Invoice.find(query).sort({ createdAt: -1 });

        return res.status(StatusCodes.OK).json({
            invoices,
            summary: {
                totalInvoices: invoices.length,
                grossSales: toCurrency(invoices.reduce((sum, item) => sum + (Number(item.grandTotal) || 0), 0)),
                outstanding: toCurrency(invoices.reduce((sum, item) => sum + (Number(item.balanceAmount) || 0), 0)),
            },
        });
    } catch (error) {
        console.error("getStoreInvoices error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch invoices" });
    }
};

const reconcileInvoicePayment = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.reconciliation.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { invoiceId } = req.params;
        const {
            amount,
            method = "Other",
            reference = "",
            status = "Success",
            paidAt,
        } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Valid payment amount is required" });
        }

        const invoice = await Invoice.findOne({ _id: invoiceId, storeId });
        if (!invoice) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Invoice not found" });
        }

        const paymentAmount = toCurrency(amount);
        invoice.payments.push({
            amount: paymentAmount,
            method,
            reference,
            status,
            paidAt: paidAt ? new Date(paidAt) : new Date(),
        });

        if (status === "Success") {
            invoice.paidAmount = toCurrency(Math.min(invoice.grandTotal, (Number(invoice.paidAmount) || 0) + paymentAmount));
            invoice.balanceAmount = toCurrency(Math.max(0, invoice.grandTotal - invoice.paidAmount));
            invoice.paymentStatus = invoice.balanceAmount <= 0 ? "Paid" : "Partial";
        }

        await invoice.save();

        return res.status(StatusCodes.OK).json({ message: "Payment reconciled", invoice });
    } catch (error) {
        console.error("reconcileInvoicePayment error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to reconcile payment" });
    }
};

const getPaymentReconciliationReport = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.reconciliation.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { from, to } = req.query;
        const query = { storeId };
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const invoices = await Invoice.find(query).lean();

        const statusSummary = { Pending: 0, Partial: 0, Paid: 0 };
        const methodSummary = {};
        let totalBilled = 0;
        let totalCollected = 0;
        let totalOutstanding = 0;

        invoices.forEach((invoice) => {
            statusSummary[invoice.paymentStatus] = (statusSummary[invoice.paymentStatus] || 0) + 1;
            totalBilled += Number(invoice.grandTotal) || 0;
            totalCollected += Number(invoice.paidAmount) || 0;
            totalOutstanding += Number(invoice.balanceAmount) || 0;

            (invoice.payments || []).forEach((payment) => {
                if (payment.status !== "Success") return;
                methodSummary[payment.method] = toCurrency((methodSummary[payment.method] || 0) + (Number(payment.amount) || 0));
            });
        });

        return res.status(StatusCodes.OK).json({
            summary: {
                totalInvoices: invoices.length,
                totalBilled: toCurrency(totalBilled),
                totalCollected: toCurrency(totalCollected),
                totalOutstanding: toCurrency(totalOutstanding),
                statusSummary,
                methodSummary,
            },
            invoices,
        });
    } catch (error) {
        console.error("getPaymentReconciliationReport error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to generate reconciliation report" });
    }
};

const createSupplier = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.suppliers.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const {
            name,
            contactPerson = "",
            mobile = "",
            email = "",
            gstNumber = "",
            address = "",
            paymentTermsDays = 30,
            creditLimit = 0,
            outstandingAmount = 0,
            status = "Active",
            notes = "",
        } = req.body;

        if (!name) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Supplier name is required" });
        }

        const supplier = await Supplier.create({
            storeId,
            name,
            contactPerson,
            mobile,
            email,
            gstNumber,
            address,
            paymentTermsDays: Math.max(0, Number(paymentTermsDays) || 0),
            creditLimit: Math.max(0, Number(creditLimit) || 0),
            outstandingAmount: Math.max(0, Number(outstandingAmount) || 0),
            status,
            notes,
        });

        return res.status(StatusCodes.CREATED).json({ message: "Supplier created", supplier });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Supplier with this name already exists" });
        }
        console.error("createSupplier error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to create supplier" });
    }
};

const getSuppliers = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.suppliers.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const suppliers = await Supplier.find({ storeId }).sort({ createdAt: -1 });
        return res.status(StatusCodes.OK).json({ suppliers, total: suppliers.length });
    } catch (error) {
        console.error("getSuppliers error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch suppliers" });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.suppliers.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { supplierId } = req.params;
        const updates = { ...req.body };

        const supplier = await Supplier.findOneAndUpdate(
            { _id: supplierId, storeId },
            { $set: updates },
            { new: true, runValidators: true },
        );

        if (!supplier) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Supplier not found" });
        }

        return res.status(StatusCodes.OK).json({ message: "Supplier updated", supplier });
    } catch (error) {
        console.error("updateSupplier error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to update supplier" });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.suppliers.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { supplierId } = req.params;
        const deleted = await Supplier.findOneAndDelete({ _id: supplierId, storeId });
        if (!deleted) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Supplier not found" });
        }

        return res.status(StatusCodes.OK).json({ message: "Supplier deleted" });
    } catch (error) {
        console.error("deleteSupplier error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to delete supplier" });
    }
};

const addSupplierPayment = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.suppliers.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { supplierId } = req.params;
        const { amount, method = "Other", reference = "", paidAt, note = "" } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Valid payment amount is required" });
        }

        const supplier = await Supplier.findOne({ _id: supplierId, storeId });
        if (!supplier) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Supplier not found" });
        }

        const paymentAmount = toCurrency(amount);
        supplier.paymentHistory.push({
            amount: paymentAmount,
            method,
            reference,
            paidAt: paidAt ? new Date(paidAt) : new Date(),
            note,
        });
        supplier.outstandingAmount = toCurrency(Math.max(0, (Number(supplier.outstandingAmount) || 0) - paymentAmount));

        await supplier.save();

        return res.status(StatusCodes.OK).json({ message: "Supplier payment added", supplier });
    } catch (error) {
        console.error("addSupplierPayment error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to add supplier payment" });
    }
};

const getProfitMarginReport = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.profit.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { from, to } = req.query;
        const query = { storeId };
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const invoices = await Invoice.find(query).lean();

        const byCategoryMap = {};
        let totalRevenue = 0;
        let totalCost = 0;

        invoices.forEach((invoice) => {
            (invoice.lineItems || []).forEach((item) => {
                const category = item.category || "General";
                const revenue = toCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
                const cost = toCurrency((Number(item.quantity) || 0) * (Number(item.costPrice) || 0));
                const profit = toCurrency(revenue - cost);

                if (!byCategoryMap[category]) {
                    byCategoryMap[category] = { category, revenue: 0, cost: 0, profit: 0, marginPercent: 0 };
                }

                byCategoryMap[category].revenue = toCurrency(byCategoryMap[category].revenue + revenue);
                byCategoryMap[category].cost = toCurrency(byCategoryMap[category].cost + cost);
                byCategoryMap[category].profit = toCurrency(byCategoryMap[category].profit + profit);

                totalRevenue = toCurrency(totalRevenue + revenue);
                totalCost = toCurrency(totalCost + cost);
            });
        });

        const byCategory = Object.values(byCategoryMap)
            .map((row) => ({
                ...row,
                marginPercent: row.revenue > 0 ? toCurrency((row.profit / row.revenue) * 100) : 0,
            }))
            .sort((a, b) => b.profit - a.profit);

        const totalProfit = toCurrency(totalRevenue - totalCost);

        return res.status(StatusCodes.OK).json({
            summary: {
                totalRevenue,
                totalCost,
                totalProfit,
                overallMarginPercent: totalRevenue > 0 ? toCurrency((totalProfit / totalRevenue) * 100) : 0,
            },
            byCategory,
        });
    } catch (error) {
        console.error("getProfitMarginReport error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to generate profit margin report" });
    }
};

const getTaxReport = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "finance.tax.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { from, to } = req.query;
        const query = { storeId };
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const invoices = await Invoice.find(query).lean();
        const gstBreakdownMap = {};
        let taxableSales = 0;
        let gstCollected = 0;
        let totalRevenueExcludingGst = 0;
        let totalCost = 0;

        invoices.forEach((invoice) => {
            (invoice.lineItems || []).forEach((item) => {
                const taxableValue = toCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
                const gstAmount = toCurrency(Number(item.gstAmount) || 0);
                const rate = Number(item.gstRate) || 0;
                const costValue = toCurrency((Number(item.quantity) || 0) * (Number(item.costPrice) || 0));

                taxableSales = toCurrency(taxableSales + taxableValue);
                gstCollected = toCurrency(gstCollected + gstAmount);
                totalRevenueExcludingGst = toCurrency(totalRevenueExcludingGst + taxableValue);
                totalCost = toCurrency(totalCost + costValue);

                if (!gstBreakdownMap[rate]) {
                    gstBreakdownMap[rate] = {
                        gstRate: rate,
                        taxableSales: 0,
                        gstCollected: 0,
                    };
                }
                gstBreakdownMap[rate].taxableSales = toCurrency(gstBreakdownMap[rate].taxableSales + taxableValue);
                gstBreakdownMap[rate].gstCollected = toCurrency(gstBreakdownMap[rate].gstCollected + gstAmount);
            });
        });

        const estimatedNetIncome = toCurrency(totalRevenueExcludingGst - totalCost);

        return res.status(StatusCodes.OK).json({
            summary: {
                taxableSales,
                gstCollected,
                estimatedNetIncome,
                incomeTaxBase: estimatedNetIncome,
            },
            gstBreakdown: Object.values(gstBreakdownMap).sort((a, b) => a.gstRate - b.gstRate),
            invoicesCount: invoices.length,
        });
    } catch (error) {
        console.error("getTaxReport error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to generate tax report" });
    }
};

const createPromotionalCampaign = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "marketing.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const {
            campaignType = "Offer",
            title,
            description = "",
            couponCode = "",
            discountType = "Percentage",
            discountValue = 0,
            minOrderAmount = 0,
            maxDiscountAmount = 0,
            autoApply = false,
            usageLimit = 0,
            validFrom,
            validTill,
            status = "Active",
            targetScope = "All",
            targetValue = "",
            bulkDiscount = {},
        } = req.body || {};

        if (!String(title || "").trim()) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Campaign title is required" });
        }

        const campaign = await PromotionalCampaign.create({
            storeId,
            campaignType,
            title: String(title).trim(),
            description: String(description || "").trim(),
            couponCode: String(couponCode || "").trim().toUpperCase(),
            discountType,
            discountValue: Number(discountValue) || 0,
            minOrderAmount: Number(minOrderAmount) || 0,
            maxDiscountAmount: Number(maxDiscountAmount) || 0,
            autoApply: Boolean(autoApply),
            usageLimit: Number(usageLimit) || 0,
            validFrom: validFrom ? new Date(validFrom) : new Date(),
            validTill: validTill ? new Date(validTill) : undefined,
            status,
            targetScope,
            targetValue: String(targetValue || "").trim(),
            bulkDiscount: {
                minQuantity: Number(bulkDiscount?.minQuantity) || 0,
                buyQuantity: Number(bulkDiscount?.buyQuantity) || 0,
                getQuantity: Number(bulkDiscount?.getQuantity) || 0,
            },
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Promotional campaign created",
            campaign,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(StatusCodes.CONFLICT).json({ message: "Coupon code already exists for this store" });
        }
        console.error("createPromotionalCampaign error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to create promotional campaign" });
    }
};

const getPromotionalCampaigns = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "marketing.view" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { status, campaignType } = req.query;
        const query = { storeId };
        if (status) query.status = status;
        if (campaignType) query.campaignType = campaignType;

        const campaigns = await PromotionalCampaign.find(query).sort({ createdAt: -1 }).lean();

        return res.status(StatusCodes.OK).json({
            success: true,
            campaigns,
        });
    } catch (error) {
        console.error("getPromotionalCampaigns error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch promotional campaigns" });
    }
};

const updatePromotionalCampaignStatus = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "marketing.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { campaignId } = req.params;
        const { status } = req.body || {};
        const allowedStatuses = ["Active", "Inactive", "Scheduled", "Expired"];
        if (!allowedStatuses.includes(String(status || ""))) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid campaign status" });
        }

        const campaign = await PromotionalCampaign.findOneAndUpdate(
            { _id: campaignId, storeId },
            { $set: { status } },
            { new: true }
        );

        if (!campaign) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Campaign not found" });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Campaign status updated",
            campaign,
        });
    } catch (error) {
        console.error("updatePromotionalCampaignStatus error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to update campaign status" });
    }
};

const deletePromotionalCampaign = async (req, res) => {
    try {
        const storeId = req.user?._id;
        const permissionCheck = await enforceRolePermission({ req, storeId, requiredPermission: "marketing.manage" });
        if (!permissionCheck.allowed) {
            return res.status(permissionCheck.statusCode).json({ message: permissionCheck.message });
        }

        const { campaignId } = req.params;
        const deleted = await PromotionalCampaign.findOneAndDelete({ _id: campaignId, storeId });

        if (!deleted) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Campaign not found" });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Campaign deleted",
        });
    } catch (error) {
        console.error("deletePromotionalCampaign error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to delete campaign" });
    }
};

const getPublicPromotionalCampaigns = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query?.limit) || 8, 1), 20);
        const storeId = req.query?.storeId;
        const now = new Date();

        const query = {
            status: "Active",
            validFrom: { $lte: now },
            $or: [{ validTill: { $exists: false } }, { validTill: null }, { validTill: { $gte: now } }],
        };

        if (storeId) {
            query.storeId = storeId;
        }

        const campaigns = await PromotionalCampaign.find(query)
            .select("campaignType title description couponCode discountType discountValue minOrderAmount maxDiscountAmount autoApply targetScope targetValue bulkDiscount validFrom validTill storeId")
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate({ path: "storeId", select: "storeName name city" })
            .lean();

        return res.status(StatusCodes.OK).json({
            success: true,
            campaigns: campaigns.map((campaign) => ({
                ...campaign,
                storeName: campaign?.storeId?.storeName || campaign?.storeId?.name || "Partner Store",
                storeCity: campaign?.storeId?.city || "",
            })),
        });
    } catch (error) {
        console.error("getPublicPromotionalCampaigns error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch public promotional campaigns" });
    }
};

const validatePublicCoupon = async (req, res) => {
    try {
        const couponCode = String(req.body?.couponCode || '').trim().toUpperCase();
        const subtotal = Number(req.body?.subtotal || 0);
        const storeId = req.body?.storeId;

        if (!couponCode) {
            return res.status(StatusCodes.BAD_REQUEST).json({ valid: false, message: "Coupon code is required" });
        }

        const now = new Date();
        const baseQuery = {
            couponCode,
            status: "Active",
            validFrom: { $lte: now },
            $or: [{ validTill: { $exists: false } }, { validTill: null }, { validTill: { $gte: now } }],
        };

        const couponQuery = storeId ? { ...baseQuery, storeId } : baseQuery;
        const campaign = await PromotionalCampaign.findOne(couponQuery)
            .select("campaignType title couponCode discountType discountValue minOrderAmount maxDiscountAmount usageLimit usedCount storeId validFrom validTill status")
            .lean();

        if (!campaign) {
            return res.status(StatusCodes.OK).json({ valid: false, message: "Coupon is invalid or inactive" });
        }

        const usageLimit = Number(campaign.usageLimit) || 0;
        const usedCount = Number(campaign.usedCount) || 0;
        if (usageLimit > 0 && usedCount >= usageLimit) {
            return res.status(StatusCodes.OK).json({ valid: false, message: "Coupon usage limit reached" });
        }

        const minOrderAmount = Number(campaign.minOrderAmount) || 0;
        if (subtotal > 0 && minOrderAmount > 0 && subtotal < minOrderAmount) {
            return res.status(StatusCodes.OK).json({
                valid: false,
                message: `Minimum order amount ${minOrderAmount} required for this coupon`,
                campaign,
            });
        }

        const discountType = String(campaign.discountType || "").toLowerCase();
        const discountValue = Number(campaign.discountValue) || 0;
        let discountAmount = 0;

        if (subtotal > 0) {
            discountAmount = discountType === "percentage" ? (subtotal * discountValue) / 100 : discountValue;
            const maxDiscountAmount = Number(campaign.maxDiscountAmount) || 0;
            if (maxDiscountAmount > 0) {
                discountAmount = Math.min(discountAmount, maxDiscountAmount);
            }
            discountAmount = Math.max(0, Math.min(subtotal, discountAmount));
        }

        return res.status(StatusCodes.OK).json({
            valid: true,
            message: "Coupon applied successfully",
            discountAmount,
            finalAmount: Math.max(0, subtotal - discountAmount),
            campaign,
        });
    } catch (error) {
        console.error("validatePublicCoupon error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ valid: false, message: "Failed to validate coupon" });
    }
};

module.exports = {
    signUp, signIn, forgotPassword, fetchData, adminsignIn, AdminfetchData, uploadPrescriptionFile, UpdatePatientProfile, fetchpharmacymedicines, updateorderedmedicines, updatecartquantity, addmedicinetodb, decreaseupdatecartquantity, deletemedicine, finalitems, finaladdress, finalpayment, deletecartItems, createStoreApprovalRequest, getStoreApprovalRequests, reviewStoreApprovalRequest, getAllStores, updateStoreStatus, addStore, getUserNotificationPreferences, updateUserNotificationPreferences,
    uploadPrescriptionRequest, reuploadPrescriptionRequest, getMyPrescriptionRequests, getStorePrescriptionRequests, reviewPrescriptionRequest,
    getStoreOrders, updateOrderTrackingStatus, getMyOrders, getOrderById, getStoreStaffMembers, createStoreStaffMember, updateStoreStaffMember, updateStoreStaffStatus, deleteStoreStaffMember, getCart, seedVaccinationMasterIfEmpty, upsertUserVaccination, getUserVaccinations, getVaccinationMaster, getUserVaccinationsForDashboard, updateUserVaccinationByMasterId, createUserQuery, getUserQueries, getStoreQueries, answerStoreQuery, importPatientsFromCsv,
    getMedicinesByStore,
    getStoreInventory, createStoreInventoryMedicine, updateStoreInventoryMedicine, deleteStoreInventoryMedicine,
    createReview, updateReview, deleteReview, getPublicReviews, getStoreReviews, getMyReviews, getMyStoreReviews, replyToReview,
    uploadPrescriptionForAutoFill, extractMedicinesFromUploadedPrescription, getUserPrescriptionUploads, addExtractedMedicinesToCart,
    getWishlist, addToWishlist, removeFromWishlist,
    createMedicineTracker, getMedicineTrackers, logMedicineIntake, checkDrugInteractions, getMedicalTimeline, exportHealthRecordsPdf,
    getStoreRolePermissions,
    createStaffPerformanceRecord, getStaffPerformanceRecords,
    createStaffAttendanceRecord, getStaffAttendanceRecords, checkInStaffAttendance, checkOutStaffAttendance,
    createStaffTrainingRecord, getStaffTrainingRecords,
    createComplianceChecklistItem, getComplianceChecklistItems, updateComplianceChecklistItem, getComplianceReminders,
    createInvoice, getStoreInvoices, reconcileInvoicePayment, getPaymentReconciliationReport,
    createSupplier, getSuppliers, updateSupplier, deleteSupplier, addSupplierPayment,
    getProfitMarginReport, getTaxReport,
    createPromotionalCampaign, getPromotionalCampaigns, updatePromotionalCampaignStatus, deletePromotionalCampaign,
    getPublicPromotionalCampaigns, validatePublicCoupon
};

const STAFF_ROLE_PERMISSIONS = {
    "Store Admin": [
        "staff.manage",
        "attendance.manage",
        "attendance.view",
        "performance.manage",
        "performance.view",
        "training.manage",
        "training.view",
        "compliance.manage",
        "compliance.view",
        "finance.invoices.generate",
        "finance.invoices.view",
        "finance.reconciliation.view",
        "finance.suppliers.manage",
        "finance.profit.view",
        "finance.tax.view",
        "marketing.manage",
        "marketing.view",
        "inventory.manage",
        "orders.manage",
        "prescription.view",
        "prescription.review",
        "queries.view",
        "queries.answer",
        "reviews.view",
        "profile.view",
    ],
    Pharmacist: [
        "inventory.view",
        "inventory.manage",
        "orders.view",
        "orders.manage",
        "prescription.view",
        "prescription.review",
        "queries.view",
        "queries.answer",
        "reviews.view",
        "profile.view",
    ],
    Operator: [
        "inventory.view",
        "inventory.manage",
        "orders.view",
        "orders.manage",
        "prescription.view",
        "prescription.review",
        "queries.view",
        "queries.answer",
        "reviews.view",
        "profile.view",
    ],
};

const normalizeStaffRole = (role = "") => {
    const normalized = String(role || "").trim().toLowerCase();
    if (normalized === "store admin" || normalized === "storeadmin" || normalized === "manager") return "Store Admin";
    if (normalized === "operator" || normalized === "technician") return "Operator";
    return "Pharmacist";
};

const getRolePermissions = (role = "") => {
    const normalizedRole = normalizeStaffRole(role);
    return STAFF_ROLE_PERMISSIONS[normalizedRole] || [];
};

const hasPermission = (permissions = [], requiredPermission) => {
    if (!requiredPermission) return true;
    return permissions.includes(requiredPermission);
};

const enforceRolePermission = async ({ req, storeId, requiredPermission }) => {
    const delegatedStaffId = req.headers["x-staff-id"];

    // Store owners are granted full access to store operations.
    if (!delegatedStaffId) {
        return { allowed: true, isOwner: true, staffMember: null, permissions: [] };
    }

    const staffMember = await StoreStaff.findOne({
        _id: delegatedStaffId,
        storeId,
        status: "Active",
    }).select("_id role firstName lastName status");

    if (!staffMember) {
        return {
            allowed: false,
            statusCode: StatusCodes.UNAUTHORIZED,
            message: "Invalid or inactive delegated staff profile",
        };
    }

    const permissions = getRolePermissions(staffMember.role);
    if (!hasPermission(permissions, requiredPermission)) {
        return {
            allowed: false,
            statusCode: StatusCodes.FORBIDDEN,
            message: `Role ${staffMember.role} does not have permission: ${requiredPermission}`,
        };
    }

    return { allowed: true, isOwner: false, staffMember, permissions };
};

const toCurrency = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.round(parsed * 100) / 100;
};

const makeInvoiceNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const buildInvoiceItems = ({ items = [], gstRateDefault = 0 }) => {
    return items.map((item) => {
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const unitPrice = Math.max(0, Number(item.unitPrice ?? item.price) || 0);
        const gstRate = Math.max(0, Number(item.gstRate ?? gstRateDefault) || 0);
        const costPrice = Math.max(0, Number(item.costPrice) || 0);
        const taxableValue = toCurrency(quantity * unitPrice);
        const gstAmount = toCurrency((taxableValue * gstRate) / 100);
        const lineTotal = toCurrency(taxableValue + gstAmount);

        return {
            medicineId: String(item.medicineId || item.id || ""),
            name: String(item.name || item.medicine || "Unknown Medicine"),
            category: String(item.category || item.type || "General"),
            quantity,
            unitPrice,
            costPrice,
            gstRate,
            gstAmount,
            lineTotal,
        };
    });
};

const summarizeInvoiceTotals = (lineItems = [], discount = 0) => {
    const subtotal = toCurrency(
        lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0),
    );
    const totalGst = toCurrency(lineItems.reduce((sum, item) => sum + (Number(item.gstAmount) || 0), 0));
    const discountAmount = Math.max(0, toCurrency(discount));
    const grandTotal = Math.max(0, toCurrency(subtotal + totalGst - discountAmount));

    return {
        subtotal,
        totalGst,
        discount: discountAmount,
        grandTotal,
    };
};