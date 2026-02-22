"""Local file storage — no S3/MinIO needed for development."""

import os
import uuid

from src.config import settings


def _ensure_dir(path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)


def get_file_path(file_key: str) -> str:
    return os.path.join(settings.upload_dir, file_key)


def generate_upload_url(
    prefix: str,
    file_name: str,
    content_type: str,
    expires_in: int = 3600,
) -> tuple[str, str]:
    """Returns a local upload endpoint URL and a file_key."""
    file_key = f"{prefix}/{uuid.uuid4()}/{file_name}"
    upload_url = f"/api/v1/files/upload/{file_key}"
    return upload_url, file_key


def generate_download_url(file_key: str, expires_in: int = 3600) -> str:
    """Returns a local download endpoint URL."""
    return f"/api/v1/files/download/{file_key}"


def save_file_to_disk(file_key: str, content: bytes) -> str:
    """Save file content to local disk. Returns full path."""
    full_path = get_file_path(file_key)
    _ensure_dir(full_path)
    with open(full_path, "wb") as f:
        f.write(content)
    return full_path
