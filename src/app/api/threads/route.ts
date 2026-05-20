import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { listAllComments } from "@/lib/comment-store";
import { parseSession, sessionCookie } from "@/lib/session";
import { createThread, listThreads } from "@/lib/thread-store";

export async function GET() {
	const [threads, comments] = await Promise.all([
		listThreads(),
		listAllComments(),
	]);
	const counts = new Map<
		string,
		{ count: number; last?: { handle: string; t: number } }
	>();
	for (const c of comments) {
		if (c.parentType !== "thread") continue;
		const bucket = counts.get(c.parentId) ?? { count: 0 };
		bucket.count += 1;
		if (!bucket.last || c.timestamp > bucket.last.t) {
			bucket.last = { handle: c.authorHandle, t: c.timestamp };
		}
		counts.set(c.parentId, bucket);
	}

	const ui = threads.map((t) => {
		const b = counts.get(t.threadId);
		return {
			id: t.threadId,
			tag: t.tag,
			title: t.title,
			body: t.body,
			authorHandle: t.authorHandle,
			time: relTime(t.timestamp),
			pinned: t.pinned,
			pinnedWeekly: t.pinnedWeekly,
			hot: t.hot,
			replies: b?.count ?? 0,
			lastReply: b?.last
				? { handle: b.last.handle, time: relTime(b.last.t) }
				: undefined,
		};
	});
	return NextResponse.json({ threads: ui });
}

export async function POST(req: NextRequest) {
	const cookieStore = await cookies();
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);
	if (!session) {
		return NextResponse.json({ error: "no_session" }, { status: 401 });
	}
	let body: { title?: unknown; body?: unknown; tag?: unknown };
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "bad_json" }, { status: 400 });
	}
	const title = typeof body.title === "string" ? body.title.trim() : "";
	const text = typeof body.body === "string" ? body.body.trim() : "";
	const tag = typeof body.tag === "string" ? body.tag : "general";
	if (!title) {
		return NextResponse.json({ error: "missing_title" }, { status: 400 });
	}
	if (!text) {
		return NextResponse.json({ error: "missing_body" }, { status: 400 });
	}
	const { threadId } = await createThread({
		authorNullifier: session.nullifier,
		tag,
		title,
		body: text,
	});
	return NextResponse.json({ ok: true, threadId });
}

function relTime(ts: number): string {
	const diff = Date.now() - ts;
	const m = Math.floor(diff / 60_000);
	if (m < 1) return "now";
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	const d = Math.floor(h / 24);
	return `${d}d`;
}
