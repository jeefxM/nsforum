import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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
	const result = await leaveGroup(session.subjectId);
	return NextResponse.json({ ok: true, ...(result ?? {}) });
}
