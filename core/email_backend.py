import json
import urllib.request
import urllib.error
from email.utils import parseaddr
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend


class SendGridWebAPIBackend(BaseEmailBackend):
    """
    Envía correos mediante la API HTTP v3 de SendGrid (puerto 443 HTTPS),
    evitando bloqueos de puertos SMTP (587/465) en proveedores cloud como Render.
    """

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        api_key = getattr(settings, 'EMAIL_HOST_PASSWORD', None) or getattr(settings, 'SENDGRID_API_KEY', None)
        if not api_key:
            if not self.fail_silently:
                raise ValueError("SENDGRID_API_KEY no está configurada.")
            return 0

        sent_count = 0

        for message in email_messages:
            from_name, from_email = parseaddr(message.from_email or settings.DEFAULT_FROM_EMAIL)
            from_obj = {"email": from_email}
            if from_name:
                from_obj["name"] = from_name

            content = [{"type": "text/plain", "value": message.body or ""}]

            # Adjuntar versión HTML si existe (EmailMultiAlternatives / PasswordReset html_email)
            if hasattr(message, 'alternatives'):
                for alt_content, mimetype in message.alternatives:
                    if mimetype == 'text/html':
                        content.append({"type": "text/html", "value": alt_content})

            payload = {
                "personalizations": [
                    {"to": [{"email": addr} for addr in message.to]}
                ],
                "from": from_obj,
                "subject": message.subject,
                "content": content,
            }

            req = urllib.request.Request(
                "https://api.sendgrid.com/v3/mail/send",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )

            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    if 200 <= response.status < 300:
                        sent_count += 1
            except Exception:
                if not self.fail_silently:
                    raise

        return sent_count