"""
Email service for TCA Investment Analysis Platform

Supports multiple email providers:
- Azure Communication Services (recommended for Azure)
- SendGrid
- SMTP (Gmail, Outlook, etc.)

Includes templates for:
- Password reset
- Welcome/signup confirmation
- User invitation
- Report notifications
"""

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class EmailService:
    """Email service with Azure Communication Services, SendGrid, and SMTP support"""
    
    def __init__(self):
        from app.core.config import settings
        self.settings = settings
        self._sendgrid_client = None
        self._acs_client = None
        
    @property
    def is_configured(self) -> bool:
        """Check if email service is properly configured"""
        # Check Azure Communication Services first
        if getattr(self.settings, 'azure_communication_connection_string', None):
            return True
        # Check SendGrid
        if self.settings.sendgrid_api_key:
            return True
        # Check SMTP
        if self.settings.smtp_user and self.settings.smtp_password:
            return True
        return False
    
    @property
    def active_provider(self) -> str:
        """Get the name of the active email provider"""
        if getattr(self.settings, 'azure_communication_connection_string', None):
            return "azure_communication_services"
        if self.settings.sendgrid_api_key:
            return "sendgrid"
        if self.settings.smtp_user and self.settings.smtp_password:
            return "smtp"
        return "none"
    
    def _get_acs_client(self):
        """Get Azure Communication Services email client (lazy initialization)"""
        if self._acs_client is None:
            connection_string = getattr(self.settings, 'azure_communication_connection_string', None)
            if connection_string:
                try:
                    from azure.communication.email import EmailClient
                    self._acs_client = EmailClient.from_connection_string(connection_string)
                    logger.info("Azure Communication Services email client initialized")
                except ImportError:
                    logger.warning("Azure Communication Email SDK not installed. Run: pip install azure-communication-email")
                    return None
                except Exception as e:
                    logger.error(f"Failed to initialize ACS email client: {e}")
                    return None
        return self._acs_client
    
    def _get_sendgrid_client(self):
        """Get SendGrid client (lazy initialization)"""
        if self._sendgrid_client is None and self.settings.sendgrid_api_key:
            try:
                from sendgrid import SendGridAPIClient
                self._sendgrid_client = SendGridAPIClient(self.settings.sendgrid_api_key)
            except ImportError:
                logger.warning("SendGrid package not installed. Run: pip install sendgrid")
                return None
        return self._sendgrid_client
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email using configured provider (ACS, SendGrid, or SMTP)
        
        Args:
            to_email: Recipient email address
            subject: Email subject line
            html_content: HTML body of the email
            text_content: Optional plain text body
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        if not self.is_configured:
            logger.warning("Email service not configured. Skipping email send.")
            return False
        
        # Try Azure Communication Services first
        if getattr(self.settings, 'azure_communication_connection_string', None):
            return await self._send_via_acs(to_email, subject, html_content, text_content)
        
        # Try SendGrid
        if self.settings.sendgrid_api_key:
            return await self._send_via_sendgrid(to_email, subject, html_content, text_content)
        
        # Fallback to SMTP
        return await self._send_via_smtp(to_email, subject, html_content, text_content)
    
    async def _send_via_acs(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email via Azure Communication Services"""
        try:
            client = self._get_acs_client()
            if not client:
                logger.error("Azure Communication Services email client not available")
                return False
            
            # Get from email address from settings
            from_email = getattr(self.settings, 'azure_communication_sender_address', None)
            if not from_email:
                from_email = self.settings.smtp_from_email
            
            # Build the email message
            message = {
                "senderAddress": from_email,
                "recipients": {
                    "to": [{"address": to_email}]
                },
                "content": {
                    "subject": subject,
                    "html": html_content
                }
            }
            
            if text_content:
                message["content"]["plainText"] = text_content
            
            # Send email (synchronous call wrapped in async)
            import asyncio
            loop = asyncio.get_event_loop()
            poller = await loop.run_in_executor(
                None, 
                lambda: client.begin_send(message)
            )
            
            # Wait for result
            result = await loop.run_in_executor(None, poller.result)
            
            if result.get("status") == "Succeeded":
                logger.info(f"Email sent successfully via ACS to {to_email}")
                return True
            else:
                logger.error(f"ACS email failed with status: {result.get('status')}")
                return False
                
        except Exception as e:
            logger.error(f"Azure Communication Services email error: {e}")
            return False
    
    async def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email via SendGrid API"""
        try:
            from sendgrid.helpers.mail import Mail, Email, To, Content
            
            client = self._get_sendgrid_client()
            if not client:
                logger.error("SendGrid client not available")
                return False
            
            message = Mail(
                from_email=Email(self.settings.smtp_from_email, self.settings.smtp_from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            if text_content:
                message.add_content(Content("text/plain", text_content))
            
            response = client.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully via SendGrid to {to_email}")
                return True
            else:
                logger.error(f"SendGrid returned status {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"SendGrid email error: {e}")
            return False
    
    async def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email via SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.settings.smtp_from_name} <{self.settings.smtp_from_email}>"
            msg['To'] = to_email
            
            # Add text content
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)
            
            # Add HTML content
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            # Send via SMTP
            if self.settings.smtp_use_tls:
                server = smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(self.settings.smtp_host, self.settings.smtp_port)
            
            server.login(self.settings.smtp_user, self.settings.smtp_password)
            server.sendmail(
                self.settings.smtp_from_email,
                [to_email],
                msg.as_string()
            )
            server.quit()
            
            logger.info(f"Email sent successfully via SMTP to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"SMTP email error: {e}")
            return False
    
    # ================== Email Templates ==================
    
    def _get_base_template(self, content: str) -> str:
        """Wrap content in base email template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #0066cc, #004499);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }}
                .content {{
                    background: #ffffff;
                    padding: 30px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                }}
                .button {{
                    display: inline-block;
                    background: #0066cc;
                    color: white !important;
                    padding: 14px 28px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                    font-weight: 500;
                }}
                .button:hover {{
                    background: #0052a3;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                    background: #f9f9f9;
                }}
                .warning {{
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    padding: 12px;
                    border-radius: 4px;
                    margin: 15px 0;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1 style="margin: 0;">TCA Investment Platform</h1>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                <p>&copy; {datetime.now().year} TCA Investment Analysis Platform</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
            </div>
        </body>
        </html>
        """
    
    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        username: str
    ) -> bool:
        """Send password reset email"""
        reset_url = f"{self.settings.frontend_url}/reset-password?token={reset_token}"
        
        content = f"""
        <h2>Password Reset Request</h2>
        <p>Hello {username},</p>
        <p>We received a request to reset the password for your TCA Investment Platform account.</p>
        <p>Click the button below to reset your password:</p>
        <p style="text-align: center;">
            <a href="{reset_url}" class="button">Reset Password</a>
        </p>
        <div class="warning">
            <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
        </div>
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
        <p style="font-size: 12px; word-break: break-all; color: #666;">{reset_url}</p>
        """
        
        text_content = f"""
        Password Reset Request
        
        Hello {username},
        
        We received a request to reset the password for your TCA Investment Platform account.
        
        Click the following link to reset your password:
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, you can safely ignore this email.
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="Reset Your TCA Platform Password",
            html_content=self._get_base_template(content),
            text_content=text_content
        )
    
    async def send_welcome_email(
        self,
        to_email: str,
        username: str
    ) -> bool:
        """Send welcome email after registration"""
        login_url = f"{self.settings.frontend_url}/login"
        
        content = f"""
        <h2>Welcome to TCA Investment Platform! 🎉</h2>
        <p>Hello {username},</p>
        <p>Thank you for registering with TCA Investment Analysis Platform. Your account has been created successfully.</p>
        <p>You can now log in and start analyzing investments:</p>
        <p style="text-align: center;">
            <a href="{login_url}" class="button">Log In Now</a>
        </p>
        <h3>Getting Started</h3>
        <ul>
            <li>Create your first analysis report</li>
            <li>Upload company data for evaluation</li>
            <li>Generate comprehensive investment insights</li>
        </ul>
        <p>If you have any questions, please contact our support team.</p>
        """
        
        text_content = f"""
        Welcome to TCA Investment Platform!
        
        Hello {username},
        
        Thank you for registering with TCA Investment Analysis Platform. Your account has been created successfully.
        
        Log in at: {login_url}
        
        Getting Started:
        - Create your first analysis report
        - Upload company data for evaluation
        - Generate comprehensive investment insights
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="Welcome to TCA Investment Platform",
            html_content=self._get_base_template(content),
            text_content=text_content
        )
    
    async def send_invite_email(
        self,
        to_email: str,
        invite_token: str,
        role: str,
        invited_by: str
    ) -> bool:
        """Send invitation email for admin/analyst accounts"""
        invite_url = f"{self.settings.frontend_url}/accept-invite?token={invite_token}"
        role_display = role.capitalize()
        
        content = f"""
        <h2>You've Been Invited! 🎉</h2>
        <p>Hello,</p>
        <p><strong>{invited_by}</strong> has invited you to join TCA Investment Platform as an <strong>{role_display}</strong>.</p>
        <p>Click the button below to accept your invitation and create your account:</p>
        <p style="text-align: center;">
            <a href="{invite_url}" class="button">Accept Invitation</a>
        </p>
        <div class="warning">
            <strong>⚠️ Important:</strong> This invitation will expire in 7 days.
        </div>
        <h3>About Your Role</h3>
        <p><strong>{role_display}</strong> privileges include:</p>
        <ul>
            {"<li>Full administrative access</li><li>User management</li><li>System configuration</li>" if role == 'admin' else "<li>Create and manage analysis reports</li><li>Access company data</li><li>Generate investment insights</li>"}
        </ul>
        <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
        <p style="font-size: 12px; word-break: break-all; color: #666;">{invite_url}</p>
        """
        
        text_content = f"""
        You've Been Invited!
        
        Hello,
        
        {invited_by} has invited you to join TCA Investment Platform as an {role_display}.
        
        Accept your invitation here:
        {invite_url}
        
        This invitation will expire in 7 days.
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=f"Invitation to Join TCA Platform as {role_display}",
            html_content=self._get_base_template(content),
            text_content=text_content
        )
    
    async def send_report_notification_email(
        self,
        to_email: str,
        username: str,
        report_type: str,
        report_id: str,
        company_name: str
    ) -> bool:
        """Send notification when a report is completed"""
        report_url = f"{self.settings.frontend_url}/dashboard/reports/{report_id}"
        
        content = f"""
        <h2>Your Report is Ready! 📊</h2>
        <p>Hello {username},</p>
        <p>Your <strong>{report_type}</strong> report for <strong>{company_name}</strong> has been completed.</p>
        <p style="text-align: center;">
            <a href="{report_url}" class="button">View Report</a>
        </p>
        <p>The analysis includes comprehensive insights and recommendations based on the data provided.</p>
        """
        
        text_content = f"""
        Your Report is Ready!
        
        Hello {username},
        
        Your {report_type} report for {company_name} has been completed.
        
        View it here: {report_url}
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=f"Your {report_type} Report is Ready - {company_name}",
            html_content=self._get_base_template(content),
            text_content=text_content
        )


# Global email service instance
email_service = EmailService()


# Convenience functions
async def send_password_reset_email(to_email: str, reset_token: str, username: str) -> bool:
    """Convenience function for sending password reset email"""
    return await email_service.send_password_reset_email(to_email, reset_token, username)


async def send_welcome_email(to_email: str, username: str) -> bool:
    """Convenience function for sending welcome email"""
    return await email_service.send_welcome_email(to_email, username)


async def send_invite_email(to_email: str, invite_token: str, role: str, invited_by: str) -> bool:
    """Convenience function for sending invite email"""
    return await email_service.send_invite_email(to_email, invite_token, role, invited_by)


async def send_report_notification_email(
    to_email: str,
    username: str,
    report_type: str,
    report_id: str,
    company_name: str
) -> bool:
    """Convenience function for sending report notification email"""
    return await email_service.send_report_notification_email(
        to_email, username, report_type, report_id, company_name
    )
