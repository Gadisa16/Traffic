// Owner Document API methods
export async function getOwnerDocuments(ownerId: string): Promise<any[]> {
    return fetchJson(`/owners/${ownerId}/documents`);
}

export async function uploadOwnerDocument(ownerId: string, doc: { doc_type: string; file_url: string; file_bucket?: string; file_path?: string }): Promise<any> {
    return fetchJson(`/owners/${ownerId}/documents`, {
        method: 'POST',
        body: JSON.stringify(doc),
        headers: { 'Content-Type': 'application/json' },
    });
}

// Vehicles by owner
export async function getVehiclesByOwner(ownerId: string): Promise<any[]> {
    // fallback: filter client-side if no backend endpoint
    const all = await getVehicles();
    return all.filter(v => v.owner && String(v.owner.id) === String(ownerId));
}
export type ApiError = {
    message: string;
    status?: number;
};

export type Token = {
    access_token: string;
    token_type: string;
};

export type BackendUserOut = {
    id: number;
    username: string;
    role: string;
    status?: string | null;
    email?: string | null;
    phone?: string | null;
    email_verified?: number | null;
    phone_verified?: number | null;
};

const getBaseUrl = () => {
    return (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000';
};

const ACCESS_TOKEN_KEY = 'access_token';

export function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function fetchJson<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const url = `${getBaseUrl()}${path}`;

    const headers: Record<string, string> = {
        ...(opts.headers as Record<string, string> | undefined),
    };

    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { ...opts, headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        const message = data?.detail ? String(data.detail) : res.statusText;
        const err: ApiError = { message, status: res.status };
        throw err;
    }

    return data as T;
}

export async function login(username: string, password: string): Promise<Token> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    body.set('grant_type', 'password');

    const token = await fetchJson<Token>('/auth/login', {
        method: 'POST',
        body: body.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    setAccessToken(token.access_token);
    return token;
}

export async function getCurrentUser(): Promise<BackendUserOut> {
    return fetchJson<BackendUserOut>('/auth/me');
}

export async function refreshToken(): Promise<Token> {
    const token = await fetchJson<Token>('/auth/refresh', { method: 'POST' });
    setAccessToken(token.access_token);
    return token;
}

export function logout(): void {
    clearAccessToken();
}

export async function registerAdmin(username: string, password: string, email?: string, phone?: string): Promise<Token> {
    const token = await fetchJson<Token>('/auth/admin/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, email, phone }),
        headers: { 'Content-Type': 'application/json' },
    });

    setAccessToken(token.access_token);
    return token;
}

// Vehicle API methods
export async function getVehicles(includeDeleted = false): Promise<any[]> {
    const endpoint = includeDeleted ? '/vehicles?include_deleted=true' : '/vehicles';
    return fetchJson(endpoint);
}

export async function getDeletedVehicles(): Promise<any[]> {
    return fetchJson('/vehicles/deleted');
}

export async function getVehicle(id: string): Promise<any> {
    return fetchJson(`/vehicles/${id}`);
}

export async function getVehicleByPlate(plateNumber: string): Promise<any> {
    return fetchJson(`/vehicles/by_plate/${plateNumber}`);
}

export async function createVehicle(vehicle: any): Promise<any> {
    return fetchJson('/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicle),
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function updateVehicle(id: string, vehicle: any): Promise<any> {
    return fetchJson(`/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vehicle),
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function deleteVehicle(id: string): Promise<any> {
    return fetchJson(`/vehicles/${id}`, { method: 'DELETE' });
}

export async function restoreVehicle(id: string): Promise<any> {
    return fetchJson(`/vehicles/${id}/undelete`, { method: 'POST' });
}

export async function purgeVehicle(id: string): Promise<any> {
    return fetchJson(`/vehicles/${id}/purge`, { method: 'POST' });
}

export async function getStats(): Promise<any> {
    return fetchJson('/vehicles/stats/summary');
}

// Owner API methods
export async function getOwners(): Promise<any[]> {
    return fetchJson('/owners');
}

export async function getOwner(id: string): Promise<any> {
    return fetchJson(`/owners/${id}`);
}

export async function createOwner(owner: any): Promise<any> {
    return fetchJson('/owners', {
        method: 'POST',
        body: JSON.stringify(owner),
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function updateOwner(id: string, owner: any): Promise<any> {
    return fetchJson(`/owners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(owner),
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function deleteOwner(id: string): Promise<any> {
    return fetchJson(`/owners/${id}`, { method: 'DELETE' });
}

// Vehicle Photo API methods
export async function uploadVehiclePhotos(vehicleId: string, files: File[], kind?: string): Promise<any[]> {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });
    if (kind) {
        formData.append('kind', kind);
    }

    const token = getAccessToken();
    const response = await fetch(`${getBaseUrl()}/vehicles/${vehicleId}/photos`, {
        method: 'POST',
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to upload photos');
    }

    return response.json();
}

export async function deleteVehiclePhoto(vehicleId: string, photoId: string): Promise<any> {
    return fetchJson(`/vehicles/${vehicleId}/photos/${photoId}`, { method: 'DELETE' });
}

// Vehicle QR Code API methods
export async function generateVehicleQR(vehicleId: string): Promise<{ vehicle_id: number; qr_value: string; qr_png_url: string }> {
    return fetchJson(`/vehicles/${vehicleId}/qr`, { method: 'POST' });
}
