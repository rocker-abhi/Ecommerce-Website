import logging
import sys
from pathlib import Path
from datetime import datetime


class RequestIDFilter(logging.Filter):
    """Logging filter that injects a request_id attribute into LogRecord.

    The filter attempts to read the request id from Flask's `g` when a
    request context is active. If not available, it sets a placeholder '-'.
    """

    def filter(self, record):
        try:
            # Import here to avoid importing Flask at module import time
            # and to keep this module usable in non-flask contexts.
            from flask import has_request_context, g

            if has_request_context():
                record.request_id = getattr(g, "request_id", "-")
            else:
                record.request_id = "-"
        except Exception:
            # If Flask isn't installed or anything goes wrong, fall back.
            record.request_id = "-"

        return True


def configure_logger(log_level: str = "INFO"):
    root_logger = logging.getLogger()

    # Ensure every LogRecord has a `request_id` attribute by using a
    # custom LogRecord factory. This is more robust than filters because
    # the record is populated at creation time and works for all
    # loggers/handlers regardless of how they are configured.
    old_factory = logging.getLogRecordFactory()

    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        try:
            from flask import has_request_context, g

            if has_request_context():
                record.request_id = getattr(g, "request_id", "-")
            else:
                record.request_id = "-"
        except Exception:
            record.request_id = "-"
        return record

    logging.setLogRecordFactory(record_factory)

    root_logger.setLevel(log_level.upper())

    formatter = logging.Formatter(
        fmt=(
            "%(asctime)s | %(request_id)s | "
            "%(levelname)s | "
            "%(name)s | "
            "%(filename)s:%(lineno)d | "
            "%(message)s"
        ),
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Log file: logs/YYYY-MM-DD.log
    log_file = log_dir / f"{datetime.now().strftime('%Y-%m-%d')}.log"

    # Console Handler
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)

    # File Handler
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(formatter)

    # Attach filter to root logger so every record gets request_id
    root_logger.addFilter(RequestIDFilter())

    root_logger.addHandler(stream_handler)
    root_logger.addHandler(file_handler)