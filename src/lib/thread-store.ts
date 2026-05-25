import "server-only";
import { eq } from "@arkiv-network/sdk/query";
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import {
	PROJECT_ATTRIBUTE,
	THIRTY_DAYS_SECONDS,
	entityTxHash,
	getPublicClient,
	getWalletClient,
} from "./arkiv-client";
import { deriveHandle, randomShortId } from "./handle";

export type StoredThread = {
	threadId: string;
	tag: string;
	title: string;
	body: string;
	authorHandle: string;
	timestamp: number;
	pinned: boolean;
	pinnedWeekly: boolean;
	hot: boolean;
	pollId?: string;
};

function attr<T extends string | number>(
	attrs: { key: string; value: string | number }[],
	key: string,
): T | undefined {
	return attrs.find((a) => a.key === key)?.value as T | undefined;
}

export async function listThreads(): Promise<StoredThread[]> {
	const client = getPublicClient();
	const out: StoredThread[] = [];
	let result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "thread"))
		.withAttributes(true)
		.limit(200)
		.fetch();

	while (true) {
		for (const entity of result.entities) {
			const a = entity.attributes;
			const threadId = attr<string>(a, "thread_id");
			if (!threadId) continue;
			out.push({
				threadId,
				tag: attr<string>(a, "tag") ?? "general",
				title: attr<string>(a, "title") ?? "(no title)",
				body: attr<string>(a, "body") ?? "",
				authorHandle: attr<string>(a, "author_handle") ?? "ns_anon_????",
				timestamp: Number(attr(a, "timestamp") ?? 0),
				pinned: attr(a, "pinned") === "1",
				pinnedWeekly: attr(a, "pinned_weekly") === "1",
				hot: attr(a, "hot") === "1",
				pollId: attr<string>(a, "poll_id") || undefined,
			});
		}
		if (!result.hasNextPage()) break;
		await result.next();
	}
	out.sort((a, b) => b.timestamp - a.timestamp);
	return out;
}

export async function getThread(
	threadId: string,
): Promise<(StoredThread & { txHash?: string }) | null> {
	const client = getPublicClient();
	const result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "thread"))
		.where(eq("thread_id", threadId))
		.withAttributes(true)
		.withMetadata(true)
		.limit(1)
		.fetch();
	const entity = result.entities[0];
	if (!entity) return null;
	const a = entity.attributes;
	const txHash = await entityTxHash(entity);
	return {
		threadId,
		tag: attr<string>(a, "tag") ?? "general",
		title: attr<string>(a, "title") ?? "(no title)",
		body: attr<string>(a, "body") ?? "",
		authorHandle: attr<string>(a, "author_handle") ?? "ns_anon_????",
		timestamp: Number(attr(a, "timestamp") ?? 0),
		pinned: attr(a, "pinned") === "1",
		pinnedWeekly: attr(a, "pinned_weekly") === "1",
		hot: attr(a, "hot") === "1",
		pollId: attr<string>(a, "poll_id") || undefined,
		txHash,
	};
}

export type CreateThreadInput = {
	authorNullifier: string;
	tag: string;
	title: string;
	body: string;
	pinned?: boolean;
	pinnedWeekly?: boolean;
	hot?: boolean;
	pollId?: string;
	threadId?: string; // for seed use
};

export async function createThread(
	input: CreateThreadInput,
): Promise<{ threadId: string; authorHandle: string; txHash: string }> {
	const threadId = input.threadId ?? randomShortId(4);
	const authorHandle = deriveHandle(input.authorNullifier, threadId);
	const client = getWalletClient();
	const title = input.title.slice(0, 200);
	const body = input.body.slice(0, 4000);
	const { txHash } = await client.createEntity({
		payload: jsonToPayload({}),
		contentType: "application/json",
		attributes: [
			PROJECT_ATTRIBUTE,
			{ key: "type", value: "thread" },
			{ key: "thread_id", value: threadId },
			{ key: "tag", value: input.tag },
			{ key: "title", value: title },
			{ key: "body", value: body },
			{ key: "author_nullifier", value: input.authorNullifier },
			{ key: "author_handle", value: authorHandle },
			{ key: "timestamp", value: Date.now() },
			{ key: "pinned", value: input.pinned ? "1" : "0" },
			{ key: "pinned_weekly", value: input.pinnedWeekly ? "1" : "0" },
			{ key: "hot", value: input.hot ? "1" : "0" },
			{ key: "poll_id", value: input.pollId ?? "" },
		],
		expiresIn: THIRTY_DAYS_SECONDS,
	});
	return { threadId, authorHandle, txHash };
}
