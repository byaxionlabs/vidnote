"use client";

// ─── Secure API Key Storage ─────────────────────────────────────────────
// Uses AES-GCM via the Web Crypto API to encrypt the API key before
// storing it in localStorage. The encryption key is derived from a
// static passphrase + the user's ID so keys are scoped per-user.

const STORAGE_KEY = "theo-notes-gemini-key";
const PASSPHRASE = "theo-notes-byok-v1"; // static app-level passphrase

async function deriveKey(userId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(PASSPHRASE + userId),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("theo-notes-salt-" + userId),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function saveApiKey(apiKey: string, userId: string): Promise<void> {
    if (!apiKey.trim()) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    const key = await deriveKey(userId);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(apiKey)
    );

    // Store as base64: iv + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    const base64 = btoa(String.fromCharCode(...combined));
    localStorage.setItem(STORAGE_KEY, base64);
}

export async function loadApiKey(userId: string): Promise<string | null> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
        const key = await deriveKey(userId);
        const combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));

        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch {
        // If decryption fails (wrong user, corrupted data), return null
        return null;
    }
}

export function clearApiKey(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function hasStoredApiKey(): boolean {
    return !!localStorage.getItem(STORAGE_KEY);
}

// Mask the key for display: show first 8 chars + last 4 chars
export function maskApiKey(key: string): string {
    if (key.length <= 12) return "••••••••";
    return key.slice(0, 8) + "••••" + key.slice(-4);
}

// Validate API key format: Gemini keys start with "AIzaSy" and are 39 chars
// Examples: AIzaSyBXE85u8CAR9uYpqBQ7LvZ9sD1oGOvnwl8, AIzaSyDILsF0ER6WihahuyIEeW6DyYIFaHeXqsU
export function isValidApiKeyFormat(key: string): boolean {
    return /^AIzaSy[A-Za-z0-9_-]{33}$/.test(key);
}
