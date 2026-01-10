import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""

    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.sender_email = settings.EMAIL_FROM
        self.sender_password = settings.SMTP_PASSWORD

    def send_otp_email(self, recipient_email: str, otp: str, recipient_name: str = "User") -> bool:
        """Send OTP email to recipient"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = "Password Reset OTP - RTA System"
            message["From"] = self.sender_email
            message["To"] = recipient_email

            # Create HTML email body
            html_body = f"""
            <html>
              <body>
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2563eb;">Password Reset Request</h2>
                  <p>Dear {recipient_name},</p>
                  <p>You have requested to reset your password. Please use the following OTP to complete the reset:</p>
                  <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 32px; letter-spacing: 4px;">{otp}</h1>
                  </div>
                  <p>This OTP is valid for 10 minutes.</p>
                  <p>If you did not request this password reset, please ignore this email.</p>
                  <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                    Best regards,<br>
                    RTA System Team
                  </p>
                </div>
              </body>
            </html>
            """

            # Create plain text version
            text_body = f"""
            Password Reset Request
            
            Dear {recipient_name},
            
            You have requested to reset your password. Please use the following OTP to complete the reset:
            
            OTP: {otp}
            
            This OTP is valid for 10 minutes.
            
            If you did not request this password reset, please ignore this email.
            
            Best regards,
            RTA System Team
            """

            # Add both versions
            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            message.attach(part1)
            message.attach(part2)

            # Send email
            if self.sender_email and self.sender_password:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.sendmail(self.sender_email, recipient_email, message.as_string())
                logger.info(f"OTP email sent successfully to {recipient_email}")
                return True
            else:
                logger.warning("Email credentials not configured. OTP logged to console.")
                logger.info(f"============================================================")
                logger.info(f"📧 OTP FOR {recipient_email}: {otp}")
                logger.info(f"============================================================")
                return False

        except Exception as e:
            logger.error(f"Failed to send OTP email to {recipient_email}: {e}", exc_info=True)
            # Always log OTP for development
            logger.info(f"============================================================")
            logger.info(f"📧 OTP FOR {recipient_email}: {otp}")
            logger.info(f"============================================================")
            return False


# Create singleton instance
email_service = EmailService()
