"""
LegalEase AI - Email Service
Sends the PDF report to the user after generation.
Uses SMTP (Gmail, Sendgrid, or any provider).
Configure via backend/.env - if EMAIL_ENABLED=false, silently skips.
"""

import os
import smtplib
import ssl
import base64
import logging
from datetime import datetime
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx
from dotenv import load_dotenv


ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(ENV_PATH, override=True)

logger = logging.getLogger(__name__)

SMTP_TIMEOUT_SECONDS = 20


def _get_email_config() -> dict:
    # Reload so restarted local runs always use backend/.env values explicitly.
    load_dotenv(ENV_PATH, override=True)
    smtp_user = os.getenv("SMTP_USER", "")
    return {
        "email_enabled": os.getenv("EMAIL_ENABLED", "false").lower() == "true",
        "smtp_host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "smtp_port": int(os.getenv("SMTP_PORT", "465")),
        "smtp_user": smtp_user,
        "smtp_pass": os.getenv("SMTP_PASS", ""),
        "resend_api_key": os.getenv("RESEND_API_KEY", "").strip(),
        "resend_from_email": os.getenv("RESEND_FROM_EMAIL", "").strip(),
        "from_name": os.getenv("EMAIL_FROM_NAME", "LegalEase AI"),
        "from_addr": os.getenv("EMAIL_FROM_ADDR", smtp_user),
        "base_url": os.getenv("BASE_URL", "http://localhost:8000"),
        "frontend_url": os.getenv("FRONTEND_URL", "http://localhost:5173"),
    }


def _send_via_resend(
    config: dict,
    to_email: str,
    report_id: str,
    business_name: str,
    pdf_path: str,
    html: str,
    text: str,
) -> bool:
    if not config["resend_api_key"]:
        return False

    resend_from = config["resend_from_email"] or config["from_addr"]
    if not resend_from:
        logger.warning("RESEND_FROM_EMAIL / EMAIL_FROM_ADDR not configured - skipping Resend send")
        return False

    with open(pdf_path, "rb") as f:
        pdf_b64 = base64.b64encode(f.read()).decode("ascii")

    payload = {
        "from": f'{config["from_name"]} <{resend_from}>',
        "to": [to_email],
        "subject": f"Your LegalEase AI Report: {business_name} [{report_id}]",
        "html": html,
        "text": text,
        "reply_to": [config["from_addr"] or resend_from],
        "attachments": [
            {
                "filename": f"LegalEase-{report_id}.pdf",
                "content": pdf_b64,
            }
        ],
    }

    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {config['resend_api_key']}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        if response.is_success:
            logger.info(f"Resend email sent to {to_email} for report {report_id}")
            return True
        logger.error(f"Resend send failed: status={response.status_code} body={response.text}")
        return False
    except Exception as e:
        logger.exception(f"Resend exception: {e}")
        return False


def send_report_email(
    to_email: str,
    report_id: str,
    business_name: str,
    pdf_path: str,
) -> bool:
    """
    Send the PDF report to the user.
    Returns True on success, False on failure (non-fatal).
    Silently skips if EMAIL_ENABLED=false or SMTP not configured.
    """
    config = _get_email_config()
    logger.info(
        f"Attempting email send: enabled={config['email_enabled']} "
        f"host={config['smtp_host']} port={config['smtp_port']} "
        f"from={config['from_addr']} to={to_email} report={report_id}"
    )

    if not config["email_enabled"]:
        logger.info("EMAIL_ENABLED is false - skipping email")
        return False
    if not config["smtp_user"] or not config["smtp_pass"]:
        logger.warning("SMTP credentials not configured - skipping email")
        return False
    if not os.path.exists(pdf_path):
        logger.error(f"PDF not found at {pdf_path} - skipping email")
        return False

    report_url = f'{config["frontend_url"]}/report/{report_id}'
    pdf_url = f'{config["base_url"]}/api/report/{report_id}/pdf'
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0E0D0B;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0E0D0B;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1810;border-radius:12px;overflow:hidden;border:1px solid #333028;">
        <tr><td style="background:#C9A84C;height:4px;"></td></tr>
        <tr><td style="padding:28px 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#F0D080);color:#0E0D0B;font-weight:700;font-size:14px;padding:6px 10px;border-radius:6px;margin-right:10px;">L</span>
                <span style="color:#C9A84C;font-size:14px;font-weight:700;letter-spacing:0.5px;">LEGALEASE AI · INDIA</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0 0 8px;">Your Legal Report is Ready</h1>
          <p style="color:#7A7570;font-size:14px;margin:0;">Report ID: <strong style="color:#C9A84C;">{report_id}</strong></p>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <div style="background:#252320;border:1px solid #333028;border-left:4px solid #C9A84C;border-radius:8px;padding:16px 20px;">
            <p style="color:#7A7570;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px;">Business Analysed</p>
            <p style="color:#FFFFFF;font-size:18px;font-weight:700;margin:0;">{business_name}</p>
          </div>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="color:#E8E5DE;font-size:14px;margin:0 0 16px;">Your full compliance report is attached as a PDF and includes:</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:5px 0;color:#7A7570;font-size:13px;"><span style="color:#C9A84C;margin-right:8px;">&#10003;</span>All required licenses &amp; registrations with documents needed</td></tr>
            <tr><td style="padding:5px 0;color:#7A7570;font-size:13px;"><span style="color:#C9A84C;margin-right:8px;">&#10003;</span>Legal risks with exact penalty amounts under Indian law</td></tr>
            <tr><td style="padding:5px 0;color:#7A7570;font-size:13px;"><span style="color:#C9A84C;margin-right:8px;">&#10003;</span>Step-by-step action plan ordered chronologically</td></tr>
            <tr><td style="padding:5px 0;color:#7A7570;font-size:13px;"><span style="color:#C9A84C;margin-right:8px;">&#10003;</span>Non-compliance consequences for each requirement</td></tr>
            <tr><td style="padding:5px 0;color:#7A7570;font-size:13px;"><span style="color:#C9A84C;margin-right:8px;">&#10003;</span>Realistic cost estimates for every registration</td></tr>
            <tr><td style="padding:5px 0;color:#7A7570;font-size:13px;"><span style="color:#C9A84C;margin-right:8px;">&#10003;</span>Pre-launch compliance checklist</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;">
                <a href="{report_url}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#F0D080);color:#0E0D0B;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">View Report Online</a>
              </td>
              <td>
                <a href="{pdf_url}" style="display:inline-block;background:transparent;color:#C9A84C;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;border:1px solid rgba(201,168,76,0.4);">Download PDF</a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="background:#C9A84C;height:1px;"></td></tr>
        <tr><td style="padding:20px 32px;">
          <p style="color:#7A7570;font-size:12px;margin:0;line-height:1.6;">
            This report is for informational purposes only and does not constitute legal or financial advice.
            Please consult a qualified Chartered Accountant or Advocate before taking action.
            <br><br>
            &copy; {datetime.now().year} LegalEase AI · India
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""

    subject = f"Your LegalEase AI Report: {business_name} [{report_id}]"
    plain_text = (
        f"Your LegalEase AI report for {business_name} is ready.\n"
        f"View online: {report_url}\nReport ID: {report_id}"
    )

    if config["resend_api_key"]:
        logger.info("Trying HTTPS email delivery via Resend")
        if _send_via_resend(config, to_email, report_id, business_name, pdf_path, html, plain_text):
            return True
        logger.warning("Falling back to SMTP after Resend failure")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f'{config["from_name"]} <{config["from_addr"]}>'
    msg["To"] = to_email

    msg.attach(
        MIMEText(plain_text, "plain")
    )
    msg.attach(MIMEText(html, "html"))

    with open(pdf_path, "rb") as f:
        pdf_part = MIMEApplication(f.read(), Name=f"LegalEase-{report_id}.pdf")
        pdf_part["Content-Disposition"] = f'attachment; filename="LegalEase-{report_id}.pdf"'
        msg.attach(pdf_part)

    try:
        ctx = ssl.create_default_context()
        if config["smtp_port"] == 465:
            with smtplib.SMTP_SSL(
                config["smtp_host"],
                config["smtp_port"],
                context=ctx,
                timeout=SMTP_TIMEOUT_SECONDS,
            ) as server:
                server.login(config["smtp_user"], config["smtp_pass"])
                server.sendmail(config["from_addr"], to_email, msg.as_string())
        else:
            with smtplib.SMTP(
                config["smtp_host"],
                config["smtp_port"],
                timeout=SMTP_TIMEOUT_SECONDS,
            ) as server:
                server.ehlo()
                server.starttls(context=ctx)
                server.ehlo()
                server.login(config["smtp_user"], config["smtp_pass"])
                server.sendmail(config["from_addr"], to_email, msg.as_string())
        logger.info(
            f'Report email sent from {config["from_addr"]} '
            f'to {to_email} for report {report_id}'
        )
        return True
    except Exception as e:
        logger.exception(f"Failed to send email: {e}")
        return False
