import os
import logging
import logging.handlers

def setup_logging():
    """Configures centralized log files under logs/ directory."""
    from app.config.settings import settings
    logs_dir = settings.LOGS_DIR
    os.makedirs(logs_dir, exist_ok=True)

    # Logging format: timestamp - module - function - log level - message
    log_format = logging.Formatter(
        '%(asctime)s - [%(name)s] [%(funcName)s] - %(levelname)s - %(message)s'
    )

    # 1. Application log handler
    app_log = os.path.join(logs_dir, "application.log")
    app_handler = logging.handlers.RotatingFileHandler(app_log, maxBytes=10*1024*1024, backupCount=5)
    app_handler.setFormatter(log_format)
    app_handler.setLevel(logging.INFO)

    # 2. Error log handler
    error_log = os.path.join(logs_dir, "errors.log")
    err_handler = logging.handlers.RotatingFileHandler(error_log, maxBytes=10*1024*1024, backupCount=5)
    err_handler.setFormatter(log_format)
    err_handler.setLevel(logging.WARNING)

    # 3. Scheduler log handler
    scheduler_log = os.path.join(logs_dir, "scheduler.log")
    sched_handler = logging.handlers.RotatingFileHandler(scheduler_log, maxBytes=5*1024*1024, backupCount=3)
    sched_handler.setFormatter(log_format)
    sched_handler.setLevel(logging.INFO)

    # Setup Root Logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    # Clear existing handlers
    root_logger.handlers = []
    root_logger.addHandler(app_handler)
    root_logger.addHandler(err_handler)

    # Setup Scheduler Logger specifically
    sched_logger = logging.getLogger("apscheduler")
    sched_logger.setLevel(logging.INFO)
    sched_logger.addHandler(sched_handler)

    # Add console handler in debug mode
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_format)
    root_logger.addHandler(console_handler)

setup_logging()
