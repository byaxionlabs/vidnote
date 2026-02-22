import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Test a Gemini API key by making a lightweight models.list call
export async function POST(request: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = request.headers.get("x-gemini-api-key");

    if (!apiKey) {
        return NextResponse.json(
            { error: "API key is required" },
            { status: 400 },
        );
    }

    try {
        // Use the lightweight models.list endpoint to verify the key works
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { method: "GET" },
        );

        if (res.status === 400 || res.status === 401 || res.status === 403) {
            return NextResponse.json(
                { valid: false, error: "Invalid API key. Please check your key and try again." },
                { status: 200 },
            );
        }

        if (res.status === 429) {
            return NextResponse.json(
                { valid: false, error: "Rate limit reached. Please wait a moment and try again." },
                { status: 200 },
            );
        }

        if (!res.ok) {
            return NextResponse.json(
                { valid: false, error: `API returned status ${res.status}. Please try again.` },
                { status: 200 },
            );
        }

        return NextResponse.json({ valid: true });
    } catch {
        return NextResponse.json(
            { valid: false, error: "Network error while validating API key. Please check your connection." },
            { status: 200 },
        );
    }
}
