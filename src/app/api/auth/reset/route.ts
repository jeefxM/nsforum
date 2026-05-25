import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { discordCookie } from "@/lib/discord-session";
import { sessionCookie } from "@/lib/session";

export async function POST() {
	const cookieStore = await cookies();
	cookieStore.delete(sessionCookie.name);
	cookieStore.delete(discordCookie.name);
	cookieStore.delete("forum.oauth_state");
	return NextResponse.json({ ok: true });
}
