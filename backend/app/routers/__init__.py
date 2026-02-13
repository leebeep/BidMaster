from .config import router as config_router
from .content import router as content_router
from .document import router as document_router
from .expand import router as expand_router
from .outline import router as outline_router
from .search import router as search_router

__all__ = [
    "config_router",
    "content_router",
    "document_router",
    "expand_router",
    "outline_router",
    "search_router"
]