import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { discordCookie, parseDiscordSession } from "@/lib/discord-session";
import { joinGroup } from "@/lib/group-store";

export async function POST(req: NextRequest) {
	const cookieStore = await cookies();
	const session = parseDiscordSession(
		cookieStore.get(discordCookie.name)?.value,
	);
	if (!session) {
		return NextResponse.json({ error: "no_discord" }, { status: 401 });
	}

	let body: { commitment?: unknown };
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "bad_json" }, { status: 400 });
	}
	const commitment =
		typeof body.commitment === "string" ? body.commitment : "";
	if (!commitment) {
		return NextResponse.json({ error: "missing_commitment" }, { status: 400 });
	}

	const result = await joinGroup(session.subjectId, commitment);
	if (!result.ok) {
		return NextResponse.json(
			{ error: result.reason, ok: false },
			{ status: 409 },
		);
	}
	return NextResponse.json({
		ok: true,
		txHash: result.txHash,
		snapshot: result.snapshot,
	});
}
