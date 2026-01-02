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


def _supabase_url() -> str:
    supabase_url = os.getenv('SUPABASE_URL', '').rstrip('/')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not supabase_url or not service_key:
        raise RuntimeError(
            'Supabase env vars not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    return supabase_url


def _supabase_service_key() -> str:
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not service_key:
        raise RuntimeError(
            'Supabase env vars not configured (SUPABASE_SERVICE_ROLE_KEY)')
    return service_key


def create_public_url(*, bucket: str, path: str) -> str:
    """Create a public URL for a public bucket object.

    For public buckets like vehicle-photos and qr-codes.
    Returns a full URL that never expires.
    """
    driver = _storage_driver()
    if driver == 'memory':
        return f"https://example.local/{bucket}/{path}"

    if driver != 'supabase':
        raise RuntimeError(f"Unknown STORAGE_DRIVER={driver}")

    # Use public base URL for public object access; this does not require the
    # SUPABASE_SERVICE_ROLE_KEY to be present.
    supabase_url = _supabase_public_base()
    # URL encode the path to handle spaces and special characters
    from urllib.parse import quote
    encoded_path = quote(path, safe='/')

    # Public URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{encoded_path}"
    print(f"[DEBUG] Created public URL: {public_url}")
    return public_url


def create_signed_url(*, bucket: str, path: str, expires_in: int = 60 * 60) -> str:
    """Create a signed URL for a private bucket object.

    Returns a full URL.
    """

    driver = _storage_driver()
    if driver == 'memory':
        return f"https://example.local/{bucket}/{path}?signed=1"

    if driver != 'supabase':
        raise RuntimeError(f"Unknown STORAGE_DRIVER={driver}")

    supabase_url = _supabase_url()
    service_key = _supabase_service_key()

    try:
        import httpx
    except Exception as e:
        raise RuntimeError('httpx is required for Supabase signed URLs') from e

    sign_url = f"{supabase_url}/storage/v1/object/sign/{bucket}/{path}"
    headers = {
        'Authorization': f'Bearer {service_key}',
        'apikey': service_key,
        'Content-Type': 'application/json',
    }

    print(f"[DEBUG] Creating signed URL for: bucket={bucket}, path={path}")
    print(f"[DEBUG] Sign URL endpoint: {sign_url}")

    with httpx.Client(timeout=30.0) as client:
        r = client.post(
            sign_url, json={'expiresIn': int(expires_in)}, headers=headers)
        if r.status_code not in (200, 201):
            print(f"[ERROR] Signed URL failed: {r.status_code}")
            print(f"[ERROR] Response: {r.text}")
            print(f"[ERROR] Bucket: {bucket}")
            print(f"[ERROR] Path: {path}")
            raise RuntimeError(
                f"Supabase signed URL failed: {r.status_code} {r.text}")

    data = r.json() if r.text else {}
    signed_path = data.get('signedURL') or data.get('signedUrl')
    if not signed_path:
        raise RuntimeError(
            f"Supabase signed URL response missing signedURL: {data}")

    if signed_path.startswith('http://') or signed_path.startswith('https://'):
        return signed_path
    return f"{supabase_url}{signed_path}"


def upload_bytes(
    *,
    folder: str,
    content: bytes,
    content_type: str,
    filename: Optional[str] = None,
    bucket: Optional[str] = None,
) -> Tuple[str, str]:
    """Upload raw bytes to the configured storage backend.

    Returns: (path, url)

    For Supabase, we return a signed URL (private buckets).
    """

    bucket = bucket or os.getenv('SUPABASE_STORAGE_BUCKET', 'traffic-files')
    filename = filename or f"{uuid.uuid4().hex}"

    # Sanitize filename: remove spaces, parentheses, and special chars that break signed URLs
    import re
    if filename:
        # Keep only alphanumeric, dots, hyphens, and underscores
        name_parts = filename.rsplit('.', 1)
        if len(name_parts) == 2:
            name, ext = name_parts
            # Replace spaces and special chars with underscores
            name = re.sub(r'[^\w\-]', '_', name)
            # Remove consecutive underscores
            name = re.sub(r'_+', '_', name)
            # Remove leading/trailing underscores
            name = name.strip('_')
            filename = f"{name}.{ext}" if name else f"{uuid.uuid4().hex}.{ext}"
        else:
            filename = re.sub(r'[^\w\-\.]', '_', filename)

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

    supabase_url = _supabase_url()
    service_key = _supabase_service_key()

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

    print(f"[DEBUG] Uploading to Supabase: bucket={bucket}, path={path}")
    print(f"[DEBUG] Upload URL: {upload_url}")

    with httpx.Client(timeout=30.0) as client:
        r = client.post(upload_url, content=content, headers=headers)
        if r.status_code not in (200, 201):
            print(f"[ERROR] Upload failed: {r.status_code} {r.text}")
            raise RuntimeError(
                f"Supabase upload failed: {r.status_code} {r.text}")

    # Use public URLs for public buckets, signed URLs for private buckets
    public_buckets = ['vehicle-photos', 'qr-codes']

    if bucket in public_buckets:
        print(f"[DEBUG] Creating public URL for public bucket: {bucket}")
        print(f"[DEBUG] Path: {path}")
        public_url = create_public_url(bucket=bucket, path=path)
        return path, public_url
    else:
        print(f"[DEBUG] Creating signed URL for private bucket: {bucket}")
        signed_url = create_signed_url(bucket=bucket, path=path, expires_in=int(
            os.getenv('SUPABASE_SIGNED_URL_TTL_SECONDS', '3600')))
        print(f"[DEBUG] Signed URL created successfully")
        return path, signed_url
