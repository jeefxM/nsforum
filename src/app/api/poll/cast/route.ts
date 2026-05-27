import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { arkivRetry } from "@/lib/arkiv-client";
import { castVote } from "@/lib/poll-store";
import { parseSession, sessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
	const cookieStore = await cookies();
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);
	if (!session) {
		return NextResponse.json({ error: "no_session" }, { status: 401 });
	}

	let body: { pollId?: unknown; option?: unknown };
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "bad_json" }, { status: 400 });
	}

	if (typeof body.pollId !== "string") {
		return NextResponse.json({ error: "missing_poll" }, { status: 400 });
	}
	if (typeof body.option !== "number") {
		return NextResponse.json({ error: "missing_option" }, { status: 400 });
	}

	try {
		const result = await arkivRetry(() =>
			castVote(body.pollId as string, session.nullifier, body.option as number),
		);
		if (!result.ok) {
			return NextResponse.json({ error: result.reason }, { status: 409 });
		}
		return NextResponse.json({ ok: true, txHash: result.txHash });
	} catch (err) {
		console.error(
			"POST /api/poll/cast failed after retries:",
			err instanceof Error ? err.message.split("\n")[0] : err,
		);
		return NextResponse.json({ error: "arkiv_write_failed" }, { status: 502 });
	}
}
