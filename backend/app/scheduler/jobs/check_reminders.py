from sqlalchemy.orm import Session
from sqlalchemy import func, Date
from datetime import date, datetime, timedelta
from app.models.reminder import Reminder
from app.models.notification import Notification
from app.services.notification_service import NotificationService

def check_reminders_job(db: Session) -> None:
    """Detects upcoming due payments and overdue payments, sending notifications."""
    notification_service = NotificationService(db)
    today = date.today()
    
    # 1. Fetch incomplete reminders
    reminders = db.query(Reminder).filter(Reminder.is_completed == False).all()
    
    for rem in reminders:
        # Overdue checks
        if rem.due_date < today:
            title = f"Overdue Payment: {rem.title}"
            msg = f"Your bill for '{rem.title}' (${rem.amount}) was due on {rem.due_date} and is currently overdue."
            
            # Check if warning already sent today
            already_notified = db.query(Notification).filter(
                Notification.user_id == rem.user_id,
                Notification.title == title,
                func.cast(Notification.created_at, Date) == today
            ).first()
            
            if not already_notified:
                notification_service.create_notification(
                    user_id=rem.user_id,
                    title=title,
                    message=msg,
                    notification_type="ERROR"
                )
        
        # Upcoming checks (due in next 3 days)
        elif today <= rem.due_date <= (today + timedelta(days=3)):
            days_left = (rem.due_date - today).days
            day_str = "today" if days_left == 0 else f"in {days_left} days"
            
            title = f"Upcoming Bill Due: {rem.title}"
            msg = f"Reminder: Your bill for '{rem.title}' (${rem.amount}) is due {day_str} ({rem.due_date})."
            
            # Check if notification already sent today
            already_notified = db.query(Notification).filter(
                Notification.user_id == rem.user_id,
                Notification.title == title,
                func.cast(Notification.created_at, Date) == today
            ).first()
            
            if not already_notified:
                notification_service.create_notification(
                    user_id=rem.user_id,
                    title=title,
                    message=msg,
                    notification_type="WARNING"
                )
