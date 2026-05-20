import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getTally, hasVoted } from "@/lib/poll-store";
import { parseSession, sessionCookie } from "@/lib/session";

export async function GET() {
	const cookieStore = await cookies();
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);
	const { tally, total } = await getTally();
	const youVoted = session ? await hasVoted(session.nullifier) : false;
	return NextResponse.json({ tally, total, youVoted });
}
