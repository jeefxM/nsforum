import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { arkivRetry } from "@/lib/arkiv-client";
import { deleteBackup, getBackup, putBackup } from "@/lib/backup-store";
import { discordCookie, parseDiscordSession } from "@/lib/discord-session";

async function requireDiscord() {
	const cookieStore = await cookies();
	return parseDiscordSession(cookieStore.get(discordCookie.name)?.value);
}

export async function GET() {
	const session = await requireDiscord();
	if (!session) {
		return NextResponse.json({ error: "no_discord" }, { status: 401 });
	}
	// Wrap in arkivRetry. A transient "context cancelled" here would
	// silently return null, and the auth flow would push the user to
	// "set new passphrase" instead of restoring their existing identity.
	// That permanently orphans their old identity if they then mint a
	// new one. Better to fail loudly after retries than to lie.
	try {
		const backup = await arkivRetry(() => getBackup(session.subjectId));
		return NextResponse.json({ backup });
	} catch (err) {
		console.error("GET /api/backup failed after retries:", err);
		return NextResponse.json(
			{ error: "arkiv_read_failed" },
			{ status: 502 },
		);
	}
}

export async function PUT(req: NextRequest) {
	const session = await requireDiscord();
	if (!session) {
		return NextResponse.json({ error: "no_discord" }, { status: 401 });
	}
	let body: { backup?: unknown };
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "bad_json" }, { status: 400 });
	}
	if (!body.backup || typeof body.backup !== "object") {
		return NextResponse.json({ error: "missing_backup" }, { status: 400 });
	}
	try {
		const { txHash } = await arkivRetry(() =>
			putBackup(session.subjectId, body.backup),
		);
		return NextResponse.json({ ok: true, txHash });
	} catch (err) {
		console.error("PUT /api/backup failed after retries:", err);
		return NextResponse.json(
			{ error: "arkiv_write_failed" },
			{ status: 502 },
		);
	}
}

export async function DELETE() {
	const session = await requireDiscord();
	if (!session) {
		return NextResponse.json({ error: "no_discord" }, { status: 401 });
	}
	try {
		const { txHash } = await arkivRetry(() => deleteBackup(session.subjectId));
		return NextResponse.json({ ok: true, txHash });
	} catch (err) {
		console.error("DELETE /api/backup failed after retries:", err);
		return NextResponse.json(
			{ error: "arkiv_write_failed" },
			{ status: 502 },
		);
	}
}
