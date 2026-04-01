const nodemailer = require('nodemailer');

const toBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  return false;
};

const isMailgunSmtpConfigured = () => {
  return Boolean(
    process.env.MAILGUN_SMTP_HOST &&
      process.env.MAILGUN_SMTP_USER &&
      process.env.MAILGUN_SMTP_PASS &&
      process.env.MAILGUN_FROM_EMAIL
  );
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

const sendEmailViaMailgunSmtp = async ({ to, subject, text, html }) => {
  if (!isMailgunSmtpConfigured()) {
    return {
      sent: false,
      bypassed: true,
      reason: 'MAILGUN SMTP config missing',
      channel: 'email',
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAILGUN_SMTP_HOST,
    port: Number(process.env.MAILGUN_SMTP_PORT || 587),
    secure: toBool(process.env.MAILGUN_SMTP_SECURE),
    auth: {
      user: process.env.MAILGUN_SMTP_USER,
      pass: process.env.MAILGUN_SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAILGUN_FROM_EMAIL,
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

const sendEmailViaMailgun = async ({ to, subject, text, html }) => {
  if (isMailgunSmtpConfigured()) {
    return sendEmailViaMailgunSmtp({ to, subject, text, html });
  }

  return {
    sent: false,
    bypassed: true,
    reason: 'MAILGUN SMTP config missing',
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
    output.email = await sendEmailViaMailgun({
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
  isMailgunSmtpConfigured,
  isTwilioConfigured,
  sendEmailNotification: sendEmailViaMailgun,
  sendUserNotification,
};
