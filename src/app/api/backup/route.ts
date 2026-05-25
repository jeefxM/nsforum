import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
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
	const backup = await getBackup(session.subjectId);
	return NextResponse.json({ backup });
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
	const { txHash } = await putBackup(session.subjectId, body.backup);
	return NextResponse.json({ ok: true, txHash });
}

export async function DELETE() {
	const session = await requireDiscord();
	if (!session) {
		return NextResponse.json({ error: "no_discord" }, { status: 401 });
	}
	const { txHash } = await deleteBackup(session.subjectId);
	return NextResponse.json({ ok: true, txHash });
}
