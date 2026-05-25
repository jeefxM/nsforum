import "server-only";
import { createHash } from "node:crypto";
import { Group } from "@semaphore-protocol/core";
import { desc, eq } from "@arkiv-network/sdk/query";
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import {
	ONE_YEAR_SECONDS,
	PROJECT_ATTRIBUTE,
	getPublicClient,
	getWalletClient,
} from "./arkiv-client";
import { NS_GROUP_ID } from "./ns-config";

const JOIN_SALT = "zeropass.v1.join";

type GroupPayload = {
	v: 2;
	commitments: string[];
	joinedSubjectIdHashes: Record<string, true>;
};

let inflight: Promise<unknown> = Promise.resolve();

function subjectIdHash(subjectId: string): string {
	return createHash("sha256")
		.update(`${JOIN_SALT}:ns:${subjectId}`)
		.digest("hex");
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
	const previous = inflight;
	let resolve: () => void;
	inflight = new Promise<void>((r) => {
		resolve = r;
	});
	await previous;
	try {
		return await fn();
	} finally {
		// biome-ignore lint/style/noNonNullAssertion: resolve assigned synchronously
		resolve!();
	}
}

async function fetchLatestSnapshot(): Promise<{
	payload: GroupPayload;
	version: number;
} | null> {
	const client = getPublicClient();
	const result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "group-snapshot"))
		.where(eq("group_id", NS_GROUP_ID))
		.orderBy(desc("version", "number"))
		.withPayload(true)
		.withAttributes(true)
		.limit(1)
		.fetch();

	const latest = result.entities[0];
	if (!latest) return null;

	const versionAttr = latest.attributes.find((a) => a.key === "version");
	const version =
		typeof versionAttr?.value === "number"
			? versionAttr.value
			: Number(versionAttr?.value ?? 0);

	const raw = latest.toJson() as Partial<GroupPayload>;
	return {
		version,
		payload: {
			v: 2,
			commitments: Array.isArray(raw.commitments) ? raw.commitments : [],
			joinedSubjectIdHashes:
				raw.joinedSubjectIdHashes &&
				typeof raw.joinedSubjectIdHashes === "object"
					? raw.joinedSubjectIdHashes
					: {},
		},
	};
}

async function writeSnapshot(
	payload: GroupPayload,
	version: number,
): Promise<string> {
	const client = getWalletClient();
	const { txHash } = await client.createEntity({
		payload: jsonToPayload(payload),
		contentType: "application/json",
		attributes: [
			PROJECT_ATTRIBUTE,
			{ key: "type", value: "group-snapshot" },
			{ key: "group_id", value: NS_GROUP_ID },
			{ key: "version", value: version },
		],
		expiresIn: ONE_YEAR_SECONDS,
	});
	return txHash;
}

function buildSemaphoreGroup(commitments: string[]): Group {
	return new Group(commitments.map((c) => BigInt(c)));
}

export type GroupSnapshot = {
	root: string;
	depth: number;
	size: number;
	commitments: string[];
};

export async function getGroupSnapshot(): Promise<GroupSnapshot> {
	const snapshot = await fetchLatestSnapshot();
	const commitments = snapshot?.payload.commitments ?? [];
	const group = buildSemaphoreGroup(commitments);
	return {
		root: group.root.toString(),
		depth: group.depth,
		size: group.size,
		commitments,
	};
}

export type JoinResult =
	| { ok: true; snapshot: GroupSnapshot; txHash: string }
	| {
			ok: false;
			reason: "already_joined" | "duplicate_commitment" | "invalid_commitment";
	  };

export async function joinGroup(
	subjectId: string,
	commitmentStr: string,
): Promise<JoinResult> {
	let commitment: bigint;
	try {
		commitment = BigInt(commitmentStr);
		if (commitment <= BigInt(0)) throw new Error("non-positive");
	} catch {
		return { ok: false, reason: "invalid_commitment" };
	}

	return withLock(async () => {
		const latest = await fetchLatestSnapshot();
		const previousVersion = latest?.version ?? 0;
		const previousPayload: GroupPayload = latest?.payload ?? {
			v: 2,
			commitments: [],
			joinedSubjectIdHashes: {},
		};

		const subjectHash = subjectIdHash(subjectId);
		if (previousPayload.joinedSubjectIdHashes[subjectHash]) {
			return { ok: false, reason: "already_joined" } as const;
		}
		if (previousPayload.commitments.includes(commitmentStr)) {
			return { ok: false, reason: "duplicate_commitment" } as const;
		}

		const nextPayload: GroupPayload = {
			v: 2,
			commitments: [...previousPayload.commitments, commitmentStr],
			joinedSubjectIdHashes: {
				...previousPayload.joinedSubjectIdHashes,
				[subjectHash]: true,
			},
		};
		const nextVersion = previousVersion + 1;

		const txHash = await writeSnapshot(nextPayload, nextVersion);

		const group = buildSemaphoreGroup(nextPayload.commitments);
		return {
			ok: true as const,
			txHash,
			snapshot: {
				root: group.root.toString(),
				depth: group.depth,
				size: group.size,
				commitments: nextPayload.commitments,
			},
		};
	});
}

export async function hasJoined(subjectId: string): Promise<boolean> {
	const latest = await fetchLatestSnapshot();
	if (!latest) return false;
	return !!latest.payload.joinedSubjectIdHashes[subjectIdHash(subjectId)];
}

/**
 * Removes this Discord's subject hash so they can re-join with a fresh
 * commitment (e.g. after wiping local identity without a backup). The old
 * commitment stays in the Merkle tree but is unusable — its trapdoor is
 * gone forever.
 */
export async function leaveGroup(subjectId: string): Promise<{ txHash: string } | null> {
	return withLock(async () => {
		const latest = await fetchLatestSnapshot();
		if (!latest) return null;
		const subjectHash = subjectIdHash(subjectId);
		if (!latest.payload.joinedSubjectIdHashes[subjectHash]) return null;
		const { [subjectHash]: _gone, ...rest } =
			latest.payload.joinedSubjectIdHashes;
		const nextPayload: GroupPayload = {
			v: 2,
			commitments: latest.payload.commitments,
			joinedSubjectIdHashes: rest,
		};
		const txHash = await writeSnapshot(nextPayload, latest.version + 1);
		return { txHash };
	});
}
