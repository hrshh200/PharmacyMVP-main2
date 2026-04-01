const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");
const Admin = require("../models/admin")
const Pharmacy = require("../models/pharmacy");
const StoreApprovalRequest = require("../models/storeApprovalRequest");
const Store = require("../models/store");
const StoreStaff = require("../models/storeStaff");
const Order = require("../models/order");
const UserNotification = require("../models/userNotification");
const UserQuery = require("../models/userQuery");
const PrescriptionRequest = require("../models/prescriptionRequest");
const Prescription = require("../models/prescription");
const Cart = require("../models/cart");
const { sendUserNotification, sendEmailNotification } = require("../utils/notificationService");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const triggerUserNotifications = async ({ userId, emailSubject, emailMessage, emailHtml, smsMessage }) => {
    try {
        console.log('[Notification] triggerUserNotifications called', {
            userId: userId ? String(userId) : null,
            emailSubject: emailSubject || null,
            hasEmailMessage: Boolean(emailMessage),
            hasEmailHtml: Boolean(emailHtml),
            hasSmsMessage: Boolean(smsMessage),
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
            { label: 'Amount', value: `INR ${Number(amount || 0).toFixed(2)}`, background: '#f8fafc', border: '#e2e8f0', labelColor: '#64748b' },
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

        const orderPlacedStatus = updatedOrder.trackingStatus || 'Order Placed';
        const orderPlacedAmount = Number(updatedOrder.totalPrice || 0).toFixed(2);

        runInBackground('order-placed-notification', async () => {
            const notificationResult = await triggerUserNotifications({
                userId: updatedOrder.userId,
                emailSubject: `Order placed successfully: ${updatedOrder.orderId}`,
                emailMessage: `Your order has been placed successfully.\n\nOrder ID: ${updatedOrder.orderId}\nAmount: INR ${orderPlacedAmount}\nStatus: ${orderPlacedStatus}\n\nYou can track your order anytime from your dashboard. Thank you for ordering with Pharmacy MVP.`,
                emailHtml: buildOrderPlacedEmailHtml({
                    orderId: updatedOrder.orderId,
                    amount: updatedOrder.totalPrice,
                    status: orderPlacedStatus,
                }),
                smsMessage: null,
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


module.exports = {
    signUp, signIn, fetchData, adminsignIn, AdminfetchData, uploadPrescriptionFile, UpdatePatientProfile, fetchpharmacymedicines, updateorderedmedicines, updatecartquantity, addmedicinetodb, decreaseupdatecartquantity, deletemedicine, finalitems, finaladdress, finalpayment, deletecartItems, createStoreApprovalRequest, getStoreApprovalRequests, reviewStoreApprovalRequest, getAllStores, updateStoreStatus, addStore, getUserNotificationPreferences, updateUserNotificationPreferences,
    uploadPrescriptionRequest, reuploadPrescriptionRequest, getMyPrescriptionRequests, getStorePrescriptionRequests, reviewPrescriptionRequest,
    getStoreOrders, updateOrderTrackingStatus, getMyOrders, getOrderById, getStoreStaffMembers, createStoreStaffMember, updateStoreStaffMember, updateStoreStaffStatus, deleteStoreStaffMember, getCart, seedVaccinationMasterIfEmpty, upsertUserVaccination, getUserVaccinations, getVaccinationMaster, getUserVaccinationsForDashboard, updateUserVaccinationByMasterId, createUserQuery, getUserQueries, getStoreQueries, answerStoreQuery, importPatientsFromCsv,
    getMedicinesByStore
};