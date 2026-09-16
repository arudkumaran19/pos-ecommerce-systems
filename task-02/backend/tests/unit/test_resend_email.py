from unittest.mock import patch, MagicMock
from app.services.email_service import EmailService
from app.core.config import settings

def test_email_service_skips_when_no_api_key():
    with patch.object(settings, "RESEND_API_KEY", ""):
        service = EmailService()
        result = service.send_password_reset_email("customer@techloom.com", "sample-raw-token-123")
        assert result is False

def test_email_service_sends_branded_email():
    with patch.object(settings, "RESEND_API_KEY", "re_test_key_12345"), \
         patch.object(settings, "FRONTEND_URL", "https://pos-ecommerce-systems-zb3q.vercel.app"), \
         patch("resend.Emails.send") as mock_send:
        mock_send.return_value = {"id": "msg_12345"}
        
        service = EmailService()
        result = service.send_password_reset_email(
            recipient_email="customer@techloom.com",
            raw_token="secure-token-abc",
            recipient_name="Alex Morgan"
        )
        
        assert result is True
        assert mock_send.called
        call_kwargs = mock_send.call_args[0][0]
        assert call_kwargs["to"] == ["customer@techloom.com"]
        assert "Reset your TechLoom password" in call_kwargs["subject"]
        assert "https://pos-ecommerce-systems-zb3q.vercel.app/reset-password?token=secure-token-abc" in call_kwargs["html"]
        assert "#07111F" in call_kwargs["html"]
        assert "#16B89A" in call_kwargs["html"]
        assert "Alex Morgan" in call_kwargs["html"]
        assert "Alex Morgan" in call_kwargs["text"]

def test_email_service_handles_resend_failure_gracefully():
    with patch.object(settings, "RESEND_API_KEY", "re_test_key_12345"), \
         patch("resend.Emails.send", side_effect=Exception("Network error")):
        service = EmailService()
        result = service.send_password_reset_email("customer@techloom.com", "token123")
        assert result is False
