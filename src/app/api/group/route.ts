import { NextResponse } from "next/server";
import { arkivRetry } from "@/lib/arkiv-client";
import { getGroupSnapshot } from "@/lib/group-store";

export async function GET() {
	try {
		const snapshot = await arkivRetry(() => getGroupSnapshot());
		return NextResponse.json(snapshot);
	} catch (err) {
		console.error(
			"GET /api/group failed after retries:",
			err instanceof Error ? err.message.split("\n")[0] : err,
		);
		return NextResponse.json({ error: "arkiv_read_failed" }, { status: 502 });
	}
}
