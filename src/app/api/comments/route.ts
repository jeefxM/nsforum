import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { arkivRetry } from "@/lib/arkiv-client";
import {
	type ParentType,
	createComment,
	listComments,
} from "@/lib/comment-store";
import { parseSession, sessionCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const parentType = url.searchParams.get("parent_type") as ParentType | null;
	const parentId = url.searchParams.get("parent_id");
	if (!parentType || !parentId) {
		return NextResponse.json(
			{ error: "missing_parent" },
			{ status: 400 },
		);
	}
	try {
		const comments = await arkivRetry(() => listComments(parentType, parentId));
		return NextResponse.json({ comments });
	} catch (err) {
		console.error(
			"GET /api/comments failed after retries:",
			err instanceof Error ? err.message.split("\n")[0] : err,
		);
		return NextResponse.json({ error: "arkiv_read_failed" }, { status: 502 });
	}
}

export async function POST(req: NextRequest) {
	const cookieStore = await cookies();
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);
	if (!session) {
		return NextResponse.json({ error: "no_session" }, { status: 401 });
	}
	let body: {
		parent_type?: unknown;
		parent_id?: unknown;
		body?: unknown;
	};
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "bad_json" }, { status: 400 });
	}
	const parentType = body.parent_type as ParentType | undefined;
	const parentId = body.parent_id as string | undefined;
	const text = typeof body.body === "string" ? body.body.trim() : "";
	if (!parentType || !parentId) {
		return NextResponse.json(
			{ error: "missing_parent" },
			{ status: 400 },
		);
	}
	if (!text) {
		return NextResponse.json({ error: "missing_body" }, { status: 400 });
	}
	try {
		const { authorHandle, txHash } = await arkivRetry(() =>
			createComment({
				authorNullifier: session.nullifier,
				parentType,
				parentId,
				body: text,
			}),
		);
		return NextResponse.json({ ok: true, authorHandle, txHash });
	} catch (err) {
		console.error(
			"POST /api/comments failed after retries:",
			err instanceof Error ? err.message.split("\n")[0] : err,
		);
		return NextResponse.json({ error: "arkiv_write_failed" }, { status: 502 });
	}
}
