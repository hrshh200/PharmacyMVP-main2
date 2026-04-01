const nodemailer = require('nodemailer');

const toBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  return false;
};

const getSmtpConfig = () => {
  const host = process.env.MAILTRAP_SMTP_HOST || process.env.MAILGUN_SMTP_HOST || '';
  const port = Number(process.env.MAILTRAP_SMTP_PORT || process.env.MAILGUN_SMTP_PORT || 587);
  const secure = toBool(process.env.MAILTRAP_SMTP_SECURE ?? process.env.MAILGUN_SMTP_SECURE);
  const user = process.env.MAILTRAP_SMTP_USER || process.env.MAILGUN_SMTP_USER || '';
  const pass = process.env.MAILTRAP_SMTP_PASS || process.env.MAILGUN_SMTP_PASS || '';
  const from = process.env.MAILTRAP_FROM_EMAIL || process.env.MAILGUN_FROM_EMAIL || '';

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
    return {
      sent: false,
      bypassed: true,
      reason: 'SMTP config missing (MAILTRAP_/MAILGUN_)',
      channel: 'email',
    };
  }

  const smtpConfig = getSmtpConfig();

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

  return {
    sent: true,
    bypassed: false,
    channel: 'email',
  };
};

const sendEmailNotification = async ({ to, subject, text, html }) => {
  if (isEmailSmtpConfigured()) {
    return sendEmailViaSmtp({ to, subject, text, html });
  }

  return {
    sent: false,
    bypassed: true,
    reason: 'SMTP config missing (MAILTRAP_/MAILGUN_)',
    channel: 'email',
  };
};

const sendSmsViaTwilio = async ({ to, body }) => {
  if (!isTwilioConfigured()) {
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
  }

  return output;
};

module.exports = {
  isEmailSmtpConfigured,
  isTwilioConfigured,
  sendEmailNotification,
  sendUserNotification,
};
