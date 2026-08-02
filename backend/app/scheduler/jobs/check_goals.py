from sqlalchemy.orm import Session
from datetime import date
from app.models.savings_goal import SavingsGoal
from app.services.notification_service import NotificationService

def check_goals_job(db: Session) -> None:
    """Checks for active goals that have reached their target dates without being completed."""
    notification_service = NotificationService(db)
    today = date.today()

    # Get active goals
    active_goals = db.query(SavingsGoal).filter(SavingsGoal.status == "IN_PROGRESS").all()

    for goal in active_goals:
        # Check expired status
        if goal.target_date < today:
            goal.status = "EXPIRED"
            db.commit()

            # Trigger warning notification
            notification_service.create_notification(
                user_id=goal.user_id,
                title="Savings Goal Expired",
                message=f"Your savings goal '{goal.goal_name}' has expired as of {goal.target_date} without reaching the target amount of ${goal.target_amount}.",
                notification_type="WARNING"
            )
        # Double check completed goals just in case
        elif goal.saved_amount >= goal.target_amount:
            goal.status = "COMPLETED"
            db.commit()

            notification_service.create_notification(
                user_id=goal.user_id,
                title="Savings Goal Completed!",
                message=f"Congratulations! You have reached your savings goal target of ${goal.target_amount} for '{goal.goal_name}'.",
                notification_type="SUCCESS"
            )
        else:
            db.commit()
