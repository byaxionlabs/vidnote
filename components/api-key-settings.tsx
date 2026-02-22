"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Key,
    Eye,
    EyeOff,
    Check,
    X,
    Loader2,
    Shield,
    AlertTriangle,
    ExternalLink,
} from "lucide-react";
import {
    saveApiKey,
    loadApiKey,
    clearApiKey,
    maskApiKey,
    isValidApiKeyFormat,
} from "@/lib/api-key";

interface ApiKeySettingsProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ApiKeySettings({ userId, isOpen, onClose }: ApiKeySettingsProps) {
    const [apiKey, setApiKey] = useState("");
    const [savedKey, setSavedKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");

    // Load existing key on mount
    const loadExistingKey = useCallback(async () => {
        if (!userId) return;
        const key = await loadApiKey(userId);
        setSavedKey(key);
        if (key) setApiKey(key);
    }, [userId]);

    useEffect(() => {
        if (isOpen) {
            loadExistingKey();
            setShowKey(false);
            setStatus("idle");
            setStatusMessage("");
        }
    }, [isOpen, loadExistingKey]);

    const handleSave = async () => {
        setSaving(true);
        setStatus("idle");

        try {
            // Format validation
            const trimmedKey = apiKey.trim();
            if (trimmedKey && !isValidApiKeyFormat(trimmedKey)) {
                setStatus("error");
                setStatusMessage("Invalid key format. Gemini API keys start with 'AIzaSy' and are 39 characters long.");
                setSaving(false);
                return;
            }

            await saveApiKey(trimmedKey, userId);
            setSavedKey(trimmedKey || null);
            setStatus("success");
            setStatusMessage(trimmedKey ? "API key saved securely!" : "API key removed.");

            setTimeout(() => {
                setStatus("idle");
                setStatusMessage("");
            }, 3000);
        } catch {
            setStatus("error");
            setStatusMessage("Failed to save API key. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        clearApiKey();
        setApiKey("");
        setSavedKey(null);
        setStatus("success");
        setStatusMessage("API key removed.");
        setTimeout(() => {
            setStatus("idle");
            setStatusMessage("");
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-card border border-border rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-primary/20 to-chart-2/20 border border-primary/30 mb-4">
                        <Key size={28} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        API Key Settings
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Bring your own Gemini API key for unlimited usage
                    </p>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                    <Shield size={20} className="text-primary mt-0.5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-medium text-foreground mb-1">Encrypted & Secure</p>
                        <p className="text-muted-foreground leading-relaxed">
                            Your key is encrypted with AES-256-GCM and stored locally in your
                            browser. It&apos;s never stored on our servers.
                        </p>
                    </div>
                </div>

                {/* Current Key Status */}
                {savedKey && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-chart-2/5 border border-chart-2/20 mb-6">
                        <Check size={18} className="text-chart-2 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">Key Active</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                                {maskApiKey(savedKey)}
                            </p>
                        </div>
                        <button
                            onClick={handleRemove}
                            className="px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-all"
                        >
                            Remove
                        </button>
                    </div>
                )}

                {/* Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-foreground">
                        Gemini API Key
                    </label>
                    <div className="relative">
                        <input
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                setStatus("idle");
                            }}
                            placeholder="AIza..."
                            className="w-full px-4 py-3.5 pr-12 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all font-mono text-sm"
                            autoComplete="off"
                            spellCheck="false"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* Get API Key Link */}
                <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6 transition-colors"
                >
                    <ExternalLink size={14} />
                    Get a free Gemini API key from Google AI Studio
                </a>

                {/* Status Messages */}
                {status === "success" && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-chart-2/10 border border-chart-2/30 text-chart-2 text-sm mb-4 animate-in fade-in duration-200">
                        <Check size={16} />
                        {statusMessage}
                    </div>
                )}
                {status === "error" && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4 animate-in fade-in duration-200">
                        <AlertTriangle size={16} />
                        {statusMessage}
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || !apiKey.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                    {saving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Key size={18} />
                            {savedKey ? "Update API Key" : "Save API Key"}
                        </>
                    )}
                </button>

                {/* Info Text */}
                <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
                    A Gemini API key is required to extract notes.
                    Get a free key from Google AI Studio above.
                </p>
            </div>
        </div>
    );
}
