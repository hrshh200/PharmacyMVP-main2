const nodemailer = require('nodemailer');

const toBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  return false;
};

const isNotificationDebugEnabled = () =>
  toBool(process.env.NOTIFICATION_DEBUG || process.env.DEBUG_NOTIFICATIONS);

const debugNotification = (level, message, meta = {}) => {
  if (!isNotificationDebugEnabled()) return;

  const logger = console[level] || console.info;
  logger(`[Notification][Debug] ${message}`, meta);
};

const maskEmail = (email) => {
  const value = String(email || '').trim();
  if (!value.includes('@')) return value;

  const [localPart, domain] = value.split('@');
  if (localPart.length <= 2) return `${localPart[0] || '*'}***@${domain}`;

  return `${localPart.slice(0, 2)}***@${domain}`;
};

const maskPhone = (phone) => {
  const value = String(phone || '').trim();
  if (value.length <= 4) return value;
  return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
};

const getSmtpConfig = () => {
  const host = process.env.MAILTRAP_SMTP_HOST || '';
  const port = Number(process.env.MAILTRAP_SMTP_PORT || 587);
  const secure = toBool(process.env.MAILTRAP_SMTP_SECURE);
  const user = process.env.MAILTRAP_SMTP_USER || '';
  const pass = process.env.MAILTRAP_SMTP_PASS || '';
  const from = process.env.MAILTRAP_FROM_EMAIL || '';

  return { host, port, secure, user, pass, from };
};

const isEmailSmtpConfigured = () => {
  const cfg = getSmtpConfig();
  return Boolean(cfg.host && cfg.user && cfg.pass && cfg.from);
};

const isTwilioConfigured = () => {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
};

const buildPhoneNumber = (user) => {
  const rawMobile = String(user?.mobile || '').trim();
  if (!rawMobile) return '';

  if (rawMobile.startsWith('+')) return rawMobile;

  const countryCode = String(user?.countryCode || '+91').trim();
  const normalizedCountryCode = countryCode.startsWith('+')
    ? countryCode
    : `+${countryCode}`;

  return `${normalizedCountryCode}${rawMobile}`;
};

const sendEmailViaSmtp = async ({ to, subject, text, html }) => {
  if (!isEmailSmtpConfigured()) {
    debugNotification('warn', 'Email bypassed because SMTP config is missing', {
      hasHost: Boolean(process.env.MAILTRAP_SMTP_HOST),
      hasUser: Boolean(process.env.MAILTRAP_SMTP_USER),
      hasPass: Boolean(process.env.MAILTRAP_SMTP_PASS),
      hasFrom: Boolean(process.env.MAILTRAP_FROM_EMAIL),
      to: maskEmail(to),
      subject,
    });

    return {
      sent: false,
      bypassed: true,
      reason: 'SMTP config missing (MAILTRAP_)',
      channel: 'email',
    };
  }

  const smtpConfig = getSmtpConfig();

  debugNotification('info', 'Sending email via SMTP', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    to: maskEmail(to),
    subject,
    hasHtml: Boolean(html),
    hasText: Boolean(text),
  });

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  await transporter.sendMail({
    from: smtpConfig.from,
    to,
    subject,
    text,
    html,
  });

  debugNotification('info', 'Email sent successfully', {
    to: maskEmail(to),
    subject,
  });

  return {
    sent: true,
    bypassed: false,
    channel: 'email',
  };
};

const sendEmailNotification = async ({ to, subject, text, html }) => {
  if (isEmailSmtpConfigured()) {
    debugNotification('info', 'Email provider selected: SMTP', {
      to: maskEmail(to),
      subject,
    });
    return sendEmailViaSmtp({ to, subject, text, html });
  }

  debugNotification('warn', 'Email notification bypassed because no SMTP provider is configured', {
    to: maskEmail(to),
    subject,
  });

  return {
    sent: false,
    bypassed: true,
    reason: 'SMTP config missing (MAILTRAP_)',
    channel: 'email',
  };
};

const sendSmsViaTwilio = async ({ to, body }) => {
  if (!isTwilioConfigured()) {
    debugNotification('warn', 'SMS bypassed because Twilio config is missing', {
      hasAccountSid: Boolean(process.env.TWILIO_ACCOUNT_SID),
      hasAuthToken: Boolean(process.env.TWILIO_AUTH_TOKEN),
      hasFromNumber: Boolean(process.env.TWILIO_FROM_NUMBER),
      to: maskPhone(to),
      hasBody: Boolean(body),
    });

    return {
      sent: false,
      bypassed: true,
      reason: 'TWILIO config missing',
      channel: 'sms',
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  debugNotification('info', 'Sending SMS via Twilio', {
    to: maskPhone(to),
    hasBody: Boolean(body),
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: from,
      Body: body,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    console.error('[Notification][SMS][Twilio] Failed', {
      status: response.status,
      responseText,
    });
    throw new Error(`Twilio request failed: ${response.status} ${responseText}`);
  }

  debugNotification('info', 'SMS sent successfully', {
    to: maskPhone(to),
  });

  return {
    sent: true,
    bypassed: false,
    channel: 'sms',
  };
};

const sendUserNotification = async ({
  user,
  preferences,
  emailSubject,
  emailMessage,
  emailHtml,
  smsMessage,
}) => {
  const output = {
    email: null,
    sms: null,
  };

  const canSendEmail = Boolean(preferences?.isEmailNotificationOn);
  const canSendSms = Boolean(preferences?.isSmsNotificationOn);

  debugNotification('info', 'Dispatching user notification', {
    userId: user?._id ? String(user._id) : undefined,
    emailEnabled: canSendEmail,
    smsEnabled: canSendSms,
    hasEmail: Boolean(user?.email),
    hasPhone: Boolean(user?.mobile),
    hasEmailSubject: Boolean(emailSubject),
    hasEmailMessage: Boolean(emailMessage),
    hasSmsMessage: Boolean(smsMessage),
  });

  if (canSendEmail && user?.email && emailSubject && emailMessage) {
    output.email = await sendEmailNotification({
      to: user.email,
      subject: emailSubject,
      text: emailMessage,
      html: emailHtml,
    });
  } else {
    output.email = {
      sent: false,
      bypassed: true,
      reason: 'Email disabled or missing email address/content',
      channel: 'email',
    };

    debugNotification('warn', 'Email dispatch bypassed for user notification', {
      emailEnabled: canSendEmail,
      hasEmail: Boolean(user?.email),
      hasEmailSubject: Boolean(emailSubject),
      hasEmailMessage: Boolean(emailMessage),
    });
  }

  const phoneNumber = buildPhoneNumber(user);
  if (canSendSms && phoneNumber && smsMessage) {
    output.sms = await sendSmsViaTwilio({
      to: phoneNumber,
      body: smsMessage,
    });
  } else {
    output.sms = {
      sent: false,
      bypassed: true,
      reason: 'SMS disabled or missing phone/content',
      channel: 'sms',
    };

    debugNotification('warn', 'SMS dispatch bypassed for user notification', {
      smsEnabled: canSendSms,
      hasPhone: Boolean(phoneNumber),
      hasSmsMessage: Boolean(smsMessage),
    });
  }

  debugNotification('info', 'User notification dispatch completed', output);

  return output;
};

module.exports = {
  isEmailSmtpConfigured,
  isTwilioConfigured,
  sendEmailNotification,
  sendUserNotification,
};
