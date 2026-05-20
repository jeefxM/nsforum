import "server-only";
import { eq } from "@arkiv-network/sdk/query";
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import {
	PROJECT_ATTRIBUTE,
	THIRTY_DAYS_SECONDS,
	getPublicClient,
	getWalletClient,
} from "./arkiv-client";
import { deriveHandle } from "./handle";

export type ParentType = "thread" | "poll";

export type StoredComment = {
	parentType: ParentType;
	parentId: string;
	authorHandle: string;
	body: string;
	timestamp: number;
};

function attr<T extends string | number>(
	attrs: { key: string; value: string | number }[],
	key: string,
): T | undefined {
	return attrs.find((a) => a.key === key)?.value as T | undefined;
}

async function fetchAll(
	build: ReturnType<typeof getPublicClient>["buildQuery"],
	configure: (
		b: ReturnType<ReturnType<typeof getPublicClient>["buildQuery"]>,
	) => ReturnType<ReturnType<typeof getPublicClient>["buildQuery"]>,
): Promise<StoredComment[]> {
	let result = await configure(build())
		.withAttributes(true)
		.limit(200)
		.fetch();
	const out: StoredComment[] = [];
	while (true) {
		for (const entity of result.entities) {
			const a = entity.attributes;
			out.push({
				parentType: (attr<string>(a, "parent_type") as ParentType) ?? "thread",
				parentId: attr<string>(a, "parent_id") ?? "",
				authorHandle: attr<string>(a, "author_handle") ?? "ns_anon_????",
				body: attr<string>(a, "body") ?? "",
				timestamp: Number(attr(a, "timestamp") ?? 0),
			});
		}
		if (!result.hasNextPage()) break;
		await result.next();
	}
	out.sort((a, b) => a.timestamp - b.timestamp);
	return out;
}

export async function listAllComments(): Promise<StoredComment[]> {
	const client = getPublicClient();
	return fetchAll(client.buildQuery.bind(client), (q) =>
		q
			.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
			.where(eq("type", "comment")),
	);
}

export async function listComments(
	parentType: ParentType,
	parentId: string,
): Promise<StoredComment[]> {
	const client = getPublicClient();
	return fetchAll(client.buildQuery.bind(client), (q) =>
		q
			.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
			.where(eq("type", "comment"))
			.where(eq("parent_type", parentType))
			.where(eq("parent_id", parentId)),
	);
}

export type CreateCommentInput = {
	authorNullifier: string;
	parentType: ParentType;
	parentId: string;
	body: string;
};

export async function createComment(
	input: CreateCommentInput,
): Promise<{ authorHandle: string }> {
	const handleContext =
		input.parentType === "thread" ? input.parentId : "global";
	const authorHandle = deriveHandle(input.authorNullifier, handleContext);
	const client = getWalletClient();
	const body = input.body.slice(0, 4000);
	await client.createEntity({
		payload: jsonToPayload({}),
		contentType: "application/json",
		attributes: [
			PROJECT_ATTRIBUTE,
			{ key: "type", value: "comment" },
			{ key: "parent_type", value: input.parentType },
			{ key: "parent_id", value: input.parentId },
			{ key: "author_nullifier", value: input.authorNullifier },
			{ key: "author_handle", value: authorHandle },
			{ key: "body", value: body },
			{ key: "timestamp", value: Date.now() },
		],
		expiresIn: THIRTY_DAYS_SECONDS,
	});
	return { authorHandle };
}
