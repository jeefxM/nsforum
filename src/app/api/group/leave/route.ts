import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { arkivRetry } from "@/lib/arkiv-client";
import { discordCookie, parseDiscordSession } from "@/lib/discord-session";
import { leaveGroup } from "@/lib/group-store";

export async function POST() {
	const cookieStore = await cookies();
	const session = parseDiscordSession(
		cookieStore.get(discordCookie.name)?.value,
	);
	if (!session) {
		return NextResponse.json({ error: "no_discord" }, { status: 401 });
	}
	try {
		const result = await arkivRetry(() => leaveGroup(session.subjectId));
		return NextResponse.json({ ok: true, ...(result ?? {}) });
	} catch (err) {
		console.error(
			"POST /api/group/leave failed after retries:",
			err instanceof Error ? err.message.split("\n")[0] : err,
		);
		return NextResponse.json({ error: "arkiv_write_failed" }, { status: 502 });
	}
}
