"""邮件发送（F-01）：未配置 SMTP 时开发模式仅写日志。"""
import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def configured(self) -> bool:
        return bool(settings.SMTP_HOST.strip())

    def send(self, to_email: str, subject: str, body: str) -> bool:
        if not self.configured():
            logger.info("[DEV 邮件] to=%s subject=%s\n%s", to_email, subject, body)
            return True

        message = MIMEText(body, "plain", "utf-8")
        message["Subject"] = subject
        message["From"] = settings.SMTP_FROM
        message["To"] = to_email

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                if settings.SMTP_USER:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM, [to_email], message.as_string())
            return True
        except Exception as exc:
            logger.error("发送邮件失败: %s", exc)
            return False

    def send_password_reset(self, to_email: str, reset_url: str) -> bool:
        subject = "MindHug 密码重置"
        body = (
            "您好，\n\n"
            "我们收到了您的密码重置请求。请点击以下链接设置新密码（30 分钟内有效）：\n\n"
            f"{reset_url}\n\n"
            "如非本人操作，请忽略此邮件。\n\n"
            "MindHug 心语陪伴"
        )
        return self.send(to_email, subject, body)


email_service = EmailService()
