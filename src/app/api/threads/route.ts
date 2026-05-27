import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { arkivRetry } from "@/lib/arkiv-client";
import { listAllComments } from "@/lib/comment-store";
import { createPoll, getVoterCounts } from "@/lib/poll-store";
import { parseSession, sessionCookie } from "@/lib/session";
import { createThread, listThreads } from "@/lib/thread-store";

export async function GET() {
	let threads, comments;
	try {
		[threads, comments] = await Promise.all([
			arkivRetry(() => listThreads()),
			arkivRetry(() => listAllComments()),
		]);
	} catch (err) {
		console.error("GET /api/threads failed after retries:", err);
		return NextResponse.json(
			{ error: "arkiv_read_failed" },
			{ status: 502 },
		);
	}
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

	// Resolve voter counts in one aggregate vote query instead of N×2 RPCs.
	// Decorative — if the lookup fails after retries, ship zeros rather than
	// failing the whole list.
	let votesByPoll = new Map<string, number>();
	try {
		votesByPoll = await arkivRetry(() => getVoterCounts());
	} catch (err) {
		console.warn(
			"[threads] voter counts failed:",
			err instanceof Error ? err.message.split("\n")[0] : err,
		);
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
			pollId: t.pollId,
			hasPoll: Boolean(t.pollId),
			voters: t.pollId ? (votesByPoll.get(t.pollId) ?? 0) : undefined,
			timestamp: t.timestamp,
			lastActivity: b?.last ? Math.max(t.timestamp, b.last.t) : t.timestamp,
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
	let body: {
		title?: unknown;
		body?: unknown;
		tag?: unknown;
		poll?: unknown;
	};
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

	let pollId: string | undefined;
	let pollTxHash: string | undefined;
	try {
		if (body.poll && typeof body.poll === "object") {
			const poll = body.poll as {
				options?: unknown;
				closesAt?: unknown;
			};
			const options = Array.isArray(poll.options)
				? poll.options
						.filter((o): o is string => typeof o === "string")
						.map((o) => o.trim())
						.filter((o) => o)
				: [];
			const closesAt =
				typeof poll.closesAt === "number" && Number.isFinite(poll.closesAt)
					? poll.closesAt
					: 0;
			if (options.length < 2) {
				return NextResponse.json(
					{ error: "need_two_options" },
					{ status: 400 },
				);
			}
			if (options.length > 8) {
				return NextResponse.json(
					{ error: "too_many_options" },
					{ status: 400 },
				);
			}
			const result = await arkivRetry(() =>
				createPoll({
					authorNullifier: session.nullifier,
					tag,
					question: title,
					options,
					closesAt,
				}),
			);
			pollId = result.pollId;
			pollTxHash = result.txHash;
		}

		const { threadId, txHash } = await arkivRetry(() =>
			createThread({
				authorNullifier: session.nullifier,
				tag,
				title,
				body: text,
				pollId,
			}),
		);
		return NextResponse.json({
			ok: true,
			threadId,
			pollId,
			txHash,
			pollTxHash,
		});
	} catch (err) {
		console.error(
			"POST /api/threads failed after retries:",
			err instanceof Error ? err.message.split("\n")[0] : err,
		);
		return NextResponse.json(
			{ error: "arkiv_write_failed" },
			{ status: 502 },
		);
	}
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
