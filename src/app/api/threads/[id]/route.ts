import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { arkivRetry } from "@/lib/arkiv-client";
import { listComments } from "@/lib/comment-store";
import { getPoll, getTally, getVote } from "@/lib/poll-store";
import { parseSession, sessionCookie } from "@/lib/session";
import { getThread } from "@/lib/thread-store";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const cookieStore = await cookies();
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);

	let thread, comments;
	try {
		[thread, comments] = await Promise.all([
			arkivRetry(() => getThread(id)),
			arkivRetry(() => listComments("thread", id)),
		]);
	} catch (err) {
		console.error(`GET /api/threads/${id} failed after retries:`, err);
		return NextResponse.json(
			{ error: "arkiv_read_failed" },
			{ status: 502 },
		);
	}
	if (!thread) {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}

	let pollPayload: unknown = undefined;
	if (thread.pollId) {
		const poll = await getPoll(thread.pollId);
		if (poll) {
			const { tally, total } = await getTally(poll.pollId, poll.options.length);
			const myVote = session
				? await getVote(poll.pollId, session.nullifier)
				: null;
			pollPayload = {
				id: poll.pollId,
				question: poll.question,
				closesAt: poll.closesAt,
				closed: poll.closesAt > 0 && Date.now() > poll.closesAt,
				closesIn: closesIn(poll.closesAt),
				voters: total,
				myVote,
				txHash: poll.txHash,
				options: poll.options.map((label, i) => ({
					label,
					votes: tally[i] ?? 0,
				})),
			};
		}
	}

	return NextResponse.json({
		thread: {
			id: thread.threadId,
			tag: thread.tag,
			title: thread.title,
			body: thread.body,
			authorHandle: thread.authorHandle,
			time: relTime(thread.timestamp),
			pinned: thread.pinned,
			pinnedWeekly: thread.pinnedWeekly,
			hot: thread.hot,
			replies: comments.length,
			pollId: thread.pollId,
			txHash: thread.txHash,
		},
		poll: pollPayload,
		comments: comments.map((c) => ({
			handle: c.authorHandle,
			body: c.body,
			time: relTime(c.timestamp),
			timestamp: c.timestamp,
		})),
	});
}

function closesIn(closesAt: number): string | null {
	if (!closesAt) return null;
	const diff = closesAt - Date.now();
	if (diff <= 0) return "closed";
	const h = Math.floor(diff / 3_600_000);
	if (h < 1) return "<1h";
	if (h < 24) return `${h}h`;
	const d = Math.floor(h / 24);
	return `${d}d`;
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
