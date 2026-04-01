const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  // Skip email sending if credentials aren't configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email Skip] To: ${to}, Subject: ${subject}`);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`);
  return info;
};

// Email templates
const emailTemplates = {
  complaintSubmitted: (name, complaintId, subject) => ({
    subject: `Complaint Submitted - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Complaint Submitted Successfully</h2>
        <p>Dear ${name},</p>
        <p>Your complaint "<strong>${subject}</strong>" has been submitted successfully.</p>
        <p><strong>Complaint ID:</strong> ${complaintId}</p>
        <p>We will review your complaint and get back to you soon.</p>
        <hr style="border: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">Student Grievance Portal</p>
      </div>
    `,
  }),

  statusUpdate: (name, itemType, subject, newStatus) => ({
    subject: `Status Update - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Status Update</h2>
        <p>Dear ${name},</p>
        <p>Your ${itemType} "<strong>${subject}</strong>" status has been updated to: 
          <strong style="color: #059669;">${newStatus.replace('_', ' ').toUpperCase()}</strong>
        </p>
        <p>Please log in to view more details.</p>
        <hr style="border: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">Student Grievance Portal</p>
      </div>
    `,
  }),

  assignedToStaff: (staffName, complaintSubject) => ({
    subject: `New Assignment - ${complaintSubject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">New Complaint Assigned</h2>
        <p>Dear ${staffName},</p>
        <p>A new complaint has been assigned to you: "<strong>${complaintSubject}</strong>"</p>
        <p>Please log in to view the details and take action.</p>
        <hr style="border: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">Student Grievance Portal</p>
      </div>
    `,
  }),

  hostelIssueAlert: (recipientName, role, subject, itemType, itemId) => ({
    subject: `Hostel ${itemType} Alert - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">Hostel ${itemType} Notification</h2>
        <p>Dear ${recipientName} (${role}),</p>
        <p>A new hostel ${itemType.toLowerCase()} has been submitted: "<strong>${subject}</strong>"</p>
        <p><strong>ID:</strong> ${itemId}</p>
        <p>Please log in to review and take necessary action.</p>
        <hr style="border: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">Student Grievance Portal</p>
      </div>
    `,
  }),

  resolvedWithRating: (name, subject, itemType) => ({
    subject: `Resolved - Please Rate Your Experience for "${subject}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Your ${itemType} Has Been Resolved ✅</h2>
        <p>Dear ${name},</p>
        <p>Your ${itemType} "<strong>${subject}</strong>" has been marked as resolved.</p>
        <p>We'd love to hear your feedback! Please log in to rate your experience and help us improve.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0;color:#166534;">⭐ Rate your experience on the portal to help us serve you better.</p>
        </div>
        <hr style="border: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">Student Grievance Portal</p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
