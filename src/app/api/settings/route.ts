import { NextResponse } from "next/server";
import { getApiKeyStatuses, setApiKey, removeApiKey } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/settings - Get API key statuses (masked values only)
 */
export async function GET() {
  try {
    const keys = getApiKeyStatuses();
    return NextResponse.json({ keys });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/settings - Set or remove an API key
 * Body: { key: string, value: string } to set, or { key: string, value: "" } to remove
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing or invalid key" }, { status: 400 });
    }

    if (value && typeof value === "string" && value.trim().length > 0) {
      setApiKey(key, value.trim());
      return NextResponse.json({ status: "saved", key });
    } else {
      removeApiKey(key);
      return NextResponse.json({ status: "removed", key });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
