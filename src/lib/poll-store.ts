import "server-only";
import { eq } from "@arkiv-network/sdk/query";
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import {
	PROJECT_ATTRIBUTE,
	THIRTY_DAYS_SECONDS,
	getPublicClient,
	getWalletClient,
} from "./arkiv-client";
import { deriveHandle, randomShortId } from "./handle";

export type StoredPoll = {
	pollId: string;
	tag: string;
	question: string;
	options: string[];
	authorHandle: string;
	timestamp: number;
	closesAt: number;
};

type Attr = { key: string; value: string | number };

let inflight: Promise<unknown> = Promise.resolve();

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

function attr<T extends string | number>(
	attrs: Attr[],
	key: string,
): T | undefined {
	return attrs.find((a) => a.key === key)?.value as T | undefined;
}

function parsePoll(attrs: Attr[]): StoredPoll | null {
	const pollId = attr<string>(attrs, "poll_id");
	if (!pollId) return null;
	let options: string[] = [];
	try {
		const raw = attr<string>(attrs, "options_json");
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		if (Array.isArray(parsed)) {
			options = parsed.filter((o): o is string => typeof o === "string");
		}
	} catch {
		return null;
	}
	if (options.length < 2) return null;
	return {
		pollId,
		tag: attr<string>(attrs, "tag") ?? "general",
		question: attr<string>(attrs, "question") ?? "(no question)",
		options,
		authorHandle: attr<string>(attrs, "author_handle") ?? "ns_anon_????",
		timestamp: Number(attr(attrs, "timestamp") ?? 0),
		closesAt: Number(attr(attrs, "closes_at") ?? 0),
	};
}

export async function listPolls(): Promise<StoredPoll[]> {
	const client = getPublicClient();
	const out: StoredPoll[] = [];
	let result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "poll"))
		.withAttributes(true)
		.limit(200)
		.fetch();

	while (true) {
		for (const entity of result.entities) {
			const poll = parsePoll(entity.attributes);
			if (poll) out.push(poll);
		}
		if (!result.hasNextPage()) break;
		await result.next();
	}
	out.sort((a, b) => b.timestamp - a.timestamp);
	return out;
}

export async function getPoll(pollId: string): Promise<StoredPoll | null> {
	const client = getPublicClient();
	const result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "poll"))
		.where(eq("poll_id", pollId))
		.withAttributes(true)
		.limit(1)
		.fetch();
	const entity = result.entities[0];
	if (!entity) return null;
	return parsePoll(entity.attributes);
}

export type CreatePollInput = {
	authorNullifier: string;
	tag: string;
	question: string;
	options: string[];
	closesAt: number;
};

export async function createPoll(
	input: CreatePollInput,
): Promise<{ pollId: string; authorHandle: string }> {
	const pollId = randomShortId(4);
	const authorHandle = deriveHandle(input.authorNullifier, `poll:${pollId}`);
	const client = getWalletClient();
	const question = input.question.slice(0, 280);
	const options = input.options.slice(0, 8).map((o) => o.slice(0, 80));
	await client.createEntity({
		payload: jsonToPayload({}),
		contentType: "application/json",
		attributes: [
			PROJECT_ATTRIBUTE,
			{ key: "type", value: "poll" },
			{ key: "poll_id", value: pollId },
			{ key: "tag", value: input.tag },
			{ key: "question", value: question },
			{ key: "options_json", value: JSON.stringify(options) },
			{ key: "author_nullifier", value: input.authorNullifier },
			{ key: "author_handle", value: authorHandle },
			{ key: "timestamp", value: Date.now() },
			{ key: "closes_at", value: input.closesAt },
		],
		expiresIn: THIRTY_DAYS_SECONDS,
	});
	return { pollId, authorHandle };
}

/** Tallies votes by option index. */
export async function getTally(
	pollId: string,
	optionCount: number,
): Promise<{ tally: number[]; total: number }> {
	const client = getPublicClient();
	const tally = new Array<number>(optionCount).fill(0);
	let total = 0;
	let result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "vote"))
		.where(eq("poll_id", pollId))
		.withAttributes(true)
		.limit(200)
		.fetch();

	while (true) {
		for (const entity of result.entities) {
			const idx = Number(
				entity.attributes.find((a) => a.key === "option_id")?.value ?? -1,
			);
			if (Number.isInteger(idx) && idx >= 0 && idx < optionCount) {
				tally[idx] += 1;
				total += 1;
			}
		}
		if (!result.hasNextPage()) break;
		await result.next();
	}
	return { tally, total };
}

/** Returns the option index this voter picked, or null if they haven't voted. */
export async function getVote(
	pollId: string,
	voterNullifier: string,
): Promise<number | null> {
	const client = getPublicClient();
	const result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "vote"))
		.where(eq("poll_id", pollId))
		.where(eq("voter_nullifier", voterNullifier))
		.withAttributes(true)
		.limit(1)
		.fetch();
	const entity = result.entities[0];
	if (!entity) return null;
	const idx = Number(
		entity.attributes.find((a) => a.key === "option_id")?.value ?? -1,
	);
	return Number.isInteger(idx) && idx >= 0 ? idx : null;
}

export type CastResult =
	| { ok: true }
	| {
			ok: false;
			reason: "already_voted" | "invalid_option" | "poll_not_found" | "poll_closed";
	  };

export async function castVote(
	pollId: string,
	voterNullifier: string,
	optionIdx: number,
): Promise<CastResult> {
	return withLock(async () => {
		const poll = await getPoll(pollId);
		if (!poll) return { ok: false, reason: "poll_not_found" } as const;
		if (poll.closesAt > 0 && Date.now() > poll.closesAt) {
			return { ok: false, reason: "poll_closed" } as const;
		}
		if (
			!Number.isInteger(optionIdx) ||
			optionIdx < 0 ||
			optionIdx >= poll.options.length
		) {
			return { ok: false, reason: "invalid_option" } as const;
		}
		if ((await getVote(pollId, voterNullifier)) !== null) {
			return { ok: false, reason: "already_voted" } as const;
		}
		const client = getWalletClient();
		await client.createEntity({
			payload: jsonToPayload({}),
			contentType: "application/json",
			attributes: [
				PROJECT_ATTRIBUTE,
				{ key: "type", value: "vote" },
				{ key: "poll_id", value: pollId },
				{ key: "option_id", value: optionIdx },
				{ key: "voter_nullifier", value: voterNullifier },
				{ key: "timestamp", value: Date.now() },
			],
			expiresIn: THIRTY_DAYS_SECONDS,
		});
		return { ok: true as const };
	});
}
