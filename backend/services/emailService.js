import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.createTransporter();
  }

  createTransporter() {
    // Match your exact logging format
    console.log('Email Config:', {
      user: process.env.EMAIL_USER ? 'Set' : 'Not Set',
      pass: process.env.EMAIL_PASSWORD ? 'Set' : 'Not Set'
    });

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      debug: true
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service verification failed:', error);
      } else {
        console.log('Email service is ready to send messages');
      }
    });
  }

  async sendDepartmentAssignmentEmail(userEmail, userName, departmentName, organizationName) {
    try {
      const mailOptions = {
        from: `"ResolveSuite" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Department Assignment Notification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #254E58; padding: 20px; text-align: center;">
              <h1 style="color: #88BDBC; margin: 0;">ResolveSuite</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
              <h2 style="color: #254E58;">Department Assignment Notice</h2>
              <p>Dear ${userName},</p>
              <p>You have been assigned to the following department at ${organizationName}:</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #254E58; margin: 0;">${departmentName}</h3>
              </div>
              <p>You can now access department-specific features and responsibilities through your ResolveSuite dashboard.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">ResolveSuite - Educational Complaint Management System</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('Failed to send email:', error);
      // Don't throw the error, just return failure status
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email, user, otp) {
    try {
      const mailOptions = {
        from: `"ResolveSuite" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'ResolveSuite Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #254E58; padding: 20px; text-align: center;">
              <h1 style="color: #88BDBC; margin: 0;">ResolveSuite</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
              <h2 style="color: #254E58;">Password Reset Request</h2>
              <p>A password reset was requested for your ResolveSuite account.</p>
              <p><strong>Organization:</strong> ${user.organizationId.name}</p>
              <p><strong>Role:</strong> ${user.role}</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                <p style="margin: 0;">Your OTP:</p>
                <h2 style="color: #254E58; margin: 10px 0;">${otp}</h2>
                <p style="margin: 0; color: #666; font-size: 12px;">This OTP will expire in 15 minutes</p>
              </div>
              <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">ResolveSuite - Educational Complaint Management System</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('Failed to send email:', error);
      // Don't throw the error, just return failure status
      return { success: false, error: error.message };
    }
  }

  async sendNewComplaintNotification(userEmail, { userName, complaintTitle, complaintId, priority }) {
    try {
      const mailOptions = {
        from: `"ResolveSuite" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `New Complaint Assigned - ${complaintTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #254E58; padding: 20px; text-align: center;">
              <h1 style="color: #88BDBC; margin: 0;">ResolveSuite</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
              <h2 style="color: #254E58;">New Complaint Notification</h2>
              <p>Dear ${userName},</p>
              <p>A new complaint has been assigned to your department:</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #254E58; margin: 0;">${complaintTitle}</h3>
                <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaintId}</p>
                <p style="margin: 10px 0;"><strong>Priority:</strong> ${priority}</p>
              </div>
              <p>Please review and take appropriate action.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">ResolveSuite - Educational Complaint Management System</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Complaint notification email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('Failed to send complaint notification email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendComplaintStatusUpdate(userEmail, { userName, complaintTitle, complaintId, newStatus, comment }) {
    try {
      const mailOptions = {
        from: `"ResolveSuite" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Complaint Status Update - ${complaintTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #254E58; padding: 20px; text-align: center;">
              <h1 style="color: #88BDBC; margin: 0;">ResolveSuite</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
              <h2 style="color: #254E58;">Complaint Status Update</h2>
              <p>Dear ${userName},</p>
              <p>Your complaint has been updated:</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #254E58; margin: 0;">${complaintTitle}</h3>
                <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaintId}</p>
                <p style="margin: 10px 0;"><strong>New Status:</strong> ${newStatus}</p>
                <p style="margin: 10px 0;"><strong>Comment:</strong> ${comment}</p>
              </div>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">ResolveSuite - Educational Complaint Management System</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Status update email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('Failed to send status update email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendComplaintAssignmentNotification(userEmail, { userName, complaintTitle, complaintId, priority }) {
    try {
      const mailOptions = {
        from: `"ResolveSuite" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Complaint Assigned - ${complaintTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #254E58; padding: 20px; text-align: center;">
              <h1 style="color: #88BDBC; margin: 0;">ResolveSuite</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
              <h2 style="color: #254E58;">Complaint Assignment Notice</h2>
              <p>Dear ${userName},</p>
              <p>A complaint has been assigned to you:</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #254E58; margin: 0;">${complaintTitle}</h3>
                <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaintId}</p>
                <p style="margin: 10px 0;"><strong>Priority:</strong> ${priority}</p>
              </div>
              <p>Please review and take appropriate action.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">ResolveSuite - Educational Complaint Management System</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Assignment notification email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('Failed to send assignment notification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send feedback notification to assigned user
  async sendFeedbackNotification(userEmail, { userName, complaintTitle, complaintId, rating, feedbackComment, complainantName }) {
    try {
      const starRating = '★'.repeat(rating) + '☆'.repeat(5 - rating);

      const mailOptions = {
        from: `"ResolveSuite" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Feedback Received - ${complaintTitle}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #254E58; padding: 20px; text-align: center;">
            <h1 style="color: #88BDBC; margin: 0;">ResolveSuite</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
            <h2 style="color: #254E58;">Feedback Received</h2>
            <p>Dear ${userName},</p>
            <p>You have received feedback for a complaint you handled:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #254E58; margin: 0;">${complaintTitle}</h3>
              <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaintId}</p>
              <p style="margin: 10px 0;"><strong>From:</strong> ${complainantName}</p>
              <p style="margin: 10px 0;"><strong>Rating:</strong> ${starRating} (${rating}/5)</p>
              ${feedbackComment ? `<p style="margin: 10px 0;"><strong>Comment:</strong></p><p style="margin: 10px 0; font-style: italic; background-color: #fff; padding: 10px; border-left: 4px solid #254E58;">"${feedbackComment}"</p>` : ''}
            </div>
            <p>This feedback helps us improve our service quality. Thank you for your excellent work!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">ResolveSuite - Educational Complaint Management System</p>
          </div>
        </div>
      `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Feedback notification email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('Failed to send feedback notification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send feedback request to complainant when complaint is resolved
  async sendFeedbackRequest(userEmail, { userName, complaintTitle, complaintId, resolutionComment }) {
    try {
      const mailOptions = {
        from: `"ResolveSuite" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Please Provide Feedback - ${complaintTitle}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #254E58; padding: 20px; text-align: center;">
            <h1 style="color: #88BDBC; margin: 0;">ResolveSuite</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
            <h2 style="color: #254E58;">Your Complaint Has Been Resolved</h2>
            <p>Dear ${userName},</p>
            <p>Great news! Your complaint has been successfully resolved.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #254E58; margin: 0;">${complaintTitle}</h3>
              <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaintId}</p>
              <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Resolved</span></p>
              ${resolutionComment ? `<p style="margin: 10px 0;"><strong>Resolution Details:</strong></p><p style="margin: 10px 0; background-color: #fff; padding: 10px; border-left: 4px solid #28a745;">${resolutionComment}</p>` : ''}
            </div>
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin: 0 0 10px 0;">📝 Your Feedback Matters!</h4>
              <p style="margin: 0; color: #856404;">We would greatly appreciate your feedback on how we handled your complaint. Your input helps us improve our services.</p>
              <p style="margin: 10px 0 0 0; color: #856404;"><strong>Please log in to your account to provide feedback.</strong></p>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/complaints" style="background-color: #254E58; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Complaint & Provide Feedback</a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">ResolveSuite - Educational Complaint Management System</p>
          </div>
        </div>
      `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Feedback request email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('Failed to send feedback request email:', error);
      return { success: false, error: error.message };
    }
  }

}

export const emailService = new EmailService();