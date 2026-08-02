import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger("exceptions")

class FinanceAppException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class AuthenticationError(FinanceAppException):
    def __init__(self, message: str = "Authentication credentials invalid"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)

class AuthorizationError(FinanceAppException):
    def __init__(self, message: str = "Resource access forbidden"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)

class FileProcessingError(FinanceAppException):
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)

class OCRError(FinanceAppException):
    def __init__(self, message: str = "OCR document text scan failed"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)

class PredictionError(FinanceAppException):
    def __init__(self, message: str = "Expense prediction estimation failed"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)

def register_exception_handlers(app: FastAPI):
    """Registers global error capture handlers to sanitize output responses."""
    
    @app.exception_handler(FinanceAppException)
    async def custom_exception_handler(request: Request, exc: FinanceAppException):
        logger.error(f"Finance Exception: {exc.message} on path {request.url.path}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        logger.error(f"Validation failure on {request.url.path}: {errors}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": "Input validation failure.", "errors": errors}
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_exception_handler(request: Request, exc: SQLAlchemyError):
        logger.error(f"SQL Database constraint error: {str(exc)} on path {request.url.path}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Database execution error. Check field constraints."}
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled Server Error: {str(exc)} on path {request.url.path}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server execution error. Contact system administrators."}
        )
