import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createPoll, getTally, getVote, listPolls } from "@/lib/poll-store";
import { parseSession, sessionCookie } from "@/lib/session";

export async function GET() {
	const cookieStore = await cookies();
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);
	const polls = await listPolls();

	const ui = await Promise.all(
		polls.map(async (p) => {
			const { tally, total } = await getTally(p.pollId, p.options.length);
			const myVote = session
				? await getVote(p.pollId, session.nullifier)
				: null;
			return {
				id: p.pollId,
				kind: "poll" as const,
				tag: p.tag,
				title: p.question,
				authorHandle: p.authorHandle,
				time: relTime(p.timestamp),
				closesIn: closesIn(p.closesAt),
				closed: p.closesAt > 0 && Date.now() > p.closesAt,
				voters: total,
				comments: 0,
				options: p.options.map((label, i) => ({
					label,
					votes: tally[i] ?? 0,
				})),
				myVote,
			};
		}),
	);
	return NextResponse.json({ polls: ui });
}

export async function POST(req: NextRequest) {
	const cookieStore = await cookies();
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);
	if (!session) {
		return NextResponse.json({ error: "no_session" }, { status: 401 });
	}

	let body: {
		question?: unknown;
		options?: unknown;
		tag?: unknown;
		closesAt?: unknown;
	};
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "bad_json" }, { status: 400 });
	}

	const question =
		typeof body.question === "string" ? body.question.trim() : "";
	const tag = typeof body.tag === "string" ? body.tag : "general";
	const options = Array.isArray(body.options)
		? body.options
				.filter((o): o is string => typeof o === "string")
				.map((o) => o.trim())
				.filter((o) => o.length > 0)
		: [];
	const closesAt =
		typeof body.closesAt === "number" && Number.isFinite(body.closesAt)
			? body.closesAt
			: 0;

	if (!question) {
		return NextResponse.json({ error: "missing_question" }, { status: 400 });
	}
	if (options.length < 2) {
		return NextResponse.json({ error: "need_two_options" }, { status: 400 });
	}
	if (options.length > 8) {
		return NextResponse.json({ error: "too_many_options" }, { status: 400 });
	}

	const { pollId } = await createPoll({
		authorNullifier: session.nullifier,
		tag,
		question,
		options,
		closesAt,
	});
	return NextResponse.json({ ok: true, pollId });
}

function relTime(ts: number): string {
	const diff = Date.now() - ts;
	const m = Math.floor(diff / 60_000);
	if (m < 1) return "now";
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	return `${Math.floor(h / 24)}d`;
}

function closesIn(closesAt: number): string | undefined {
	if (!closesAt) return undefined;
	const diff = closesAt - Date.now();
	if (diff <= 0) return "closed";
	const h = Math.floor(diff / 3_600_000);
	if (h < 1) return "<1h";
	if (h < 24) return `${h}h`;
	return `${Math.floor(h / 24)}d`;
}
