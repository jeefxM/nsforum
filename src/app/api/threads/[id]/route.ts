import { NextResponse } from "next/server";
import { listComments } from "@/lib/comment-store";
import { getThread } from "@/lib/thread-store";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const [thread, comments] = await Promise.all([
		getThread(id),
		listComments("thread", id),
	]);
	if (!thread) {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
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
		},
		comments: comments.map((c) => ({
			handle: c.authorHandle,
			body: c.body,
			time: relTime(c.timestamp),
			timestamp: c.timestamp,
		})),
	});
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
