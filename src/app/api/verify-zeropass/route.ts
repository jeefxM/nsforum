import { type SemaphoreProof, verifyProof } from "@semaphore-protocol/core";
import { encodeBytes32String, toBigInt } from "ethers";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { arkivRetry } from "@/lib/arkiv-client";
import { getGroupSnapshot } from "@/lib/group-store";
import { serializeSession, sessionCookie } from "@/lib/session";

const EXPECTED_SCOPE = toBigInt(
	encodeBytes32String("ns-anon-poll-v1"),
).toString();

export async function POST(req: NextRequest) {
	let body: { proof?: unknown };
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "bad_json" }, { status: 400 });
	}

	const proof = body.proof as SemaphoreProof | undefined;
	if (!proof || typeof proof !== "object") {
		return NextResponse.json({ error: "missing_proof" }, { status: 400 });
	}

	if (String(proof.scope) !== EXPECTED_SCOPE) {
		return NextResponse.json({ error: "wrong_scope" }, { status: 400 });
	}

	let snapshot;
	try {
		snapshot = await arkivRetry(() => getGroupSnapshot());
	} catch (err) {
		console.error(
			"POST /api/verify-zeropass snapshot read failed:",
			err instanceof Error ? err.message.split("\n")[0] : err,
		);
		return NextResponse.json(
			{ error: "arkiv_read_failed" },
			{ status: 502 },
		);
	}
	if (String(proof.merkleTreeRoot) !== snapshot.root) {
		return NextResponse.json({ error: "stale_root" }, { status: 400 });
	}

	const ok = await verifyProof(proof);
	if (!ok) {
		return NextResponse.json({ error: "invalid_proof" }, { status: 400 });
	}

	const nullifier = String(proof.nullifier);
	const cookieStore = await cookies();
	cookieStore.set(
		sessionCookie.name,
		serializeSession({ nullifier, createdAt: Date.now() }),
		{
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: sessionCookie.maxAgeSeconds,
		},
	);

	return NextResponse.json({ ok: true, nullifier });
}
