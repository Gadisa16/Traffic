import os
import uuid
from typing import Optional, Tuple


_MEMORY_STORE = {}


def _storage_driver() -> str:
    drv = os.getenv('STORAGE_DRIVER')
    if drv:
        return drv
    if os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_SERVICE_ROLE_KEY'):
        return 'supabase'
    return 'memory'


def _supabase_public_base() -> str:
    # If you use a custom CDN domain, put it here.
    return os.getenv('SUPABASE_PUBLIC_BASE_URL') or os.getenv('SUPABASE_URL', '').rstrip('/')


def upload_bytes(
    *,
    folder: str,
    content: bytes,
    content_type: str,
    filename: Optional[str] = None,
    bucket: Optional[str] = None,
) -> Tuple[str, str]:
    """Upload raw bytes to the configured storage backend.

    Returns: (path, public_url)

    For Supabase, this assumes the bucket is public (MVP). For private buckets, you would
    generate signed URLs instead.
    """

    bucket = bucket or os.getenv('SUPABASE_STORAGE_BUCKET', 'traffic-files')
    filename = filename or f"{uuid.uuid4().hex}"
    folder = (folder or '').strip('/').replace('\\', '/')

    path = f"{folder}/{filename}" if folder else filename
    path = path.replace('\\', '/')

    driver = _storage_driver()
    if driver == 'memory':
        key = f"{bucket}/{path}"
        _MEMORY_STORE[key] = {
            'content': content,
            'content_type': content_type,
        }
        return path, f"https://example.local/{bucket}/{path}"

    if driver != 'supabase':
        raise RuntimeError(f"Unknown STORAGE_DRIVER={driver}")

    supabase_url = os.getenv('SUPABASE_URL', '').rstrip('/')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not supabase_url or not service_key:
        raise RuntimeError('Supabase env vars not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')

    try:
        import httpx
    except Exception as e:
        raise RuntimeError('httpx is required for Supabase uploads') from e

    # Supabase Storage upload endpoint
    # POST /storage/v1/object/{bucket}/{path}
    upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{path}"

    headers = {
        'Authorization': f'Bearer {service_key}',
        'apikey': service_key,
        'Content-Type': content_type,
        'x-upsert': 'true',
    }

    with httpx.Client(timeout=30.0) as client:
        r = client.post(upload_url, content=content, headers=headers)
        if r.status_code not in (200, 201):
            raise RuntimeError(f"Supabase upload failed: {r.status_code} {r.text}")

    public_base = _supabase_public_base()
    public_url = f"{public_base}/storage/v1/object/public/{bucket}/{path}"
    return path, public_url
