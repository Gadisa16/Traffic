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
