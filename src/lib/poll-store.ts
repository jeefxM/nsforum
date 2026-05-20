import "server-only";
import { eq } from "@arkiv-network/sdk/query";
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import {
	getPublicClient,
	getWalletClient,
	POLL_ID,
	PROJECT_ATTRIBUTE,
	THIRTY_DAYS_SECONDS,
} from "./arkiv-client";

export const POLL_QUESTION = "Should NS run weekly hackathons?";
export const POLL_OPTIONS = ["yes", "no"] as const;
export type PollOption = (typeof POLL_OPTIONS)[number];

export type Tally = Record<PollOption, number>;

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

export async function getTally(): Promise<{ tally: Tally; total: number }> {
	const client = getPublicClient();
	const tally: Tally = { yes: 0, no: 0 };
	let total = 0;
	let result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "vote"))
		.where(eq("poll_id", POLL_ID))
		.withAttributes(true)
		.limit(200)
		.fetch();

	while (true) {
		for (const entity of result.entities) {
			const option = entity.attributes.find((a) => a.key === "option_id")
				?.value as string | undefined;
			if (option === "yes" || option === "no") {
				tally[option] += 1;
				total += 1;
			}
		}
		if (!result.hasNextPage()) break;
		await result.next();
	}
	return { tally, total };
}

export async function hasVoted(voterNullifier: string): Promise<boolean> {
	const client = getPublicClient();
	const result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "vote"))
		.where(eq("poll_id", POLL_ID))
		.where(eq("voter_nullifier", voterNullifier))
		.limit(1)
		.fetch();
	return result.entities.length > 0;
}

export type CastResult =
	| { ok: true }
	| { ok: false; reason: "already_voted" | "invalid_option" };

export async function castVote(
	voterNullifier: string,
	option: string,
): Promise<CastResult> {
	if (option !== "yes" && option !== "no") {
		return { ok: false, reason: "invalid_option" };
	}

	return withLock(async () => {
		if (await hasVoted(voterNullifier)) {
			return { ok: false, reason: "already_voted" } as const;
		}
		const client = getWalletClient();
		await client.createEntity({
			payload: jsonToPayload({}),
			contentType: "application/json",
			attributes: [
				PROJECT_ATTRIBUTE,
				{ key: "type", value: "vote" },
				{ key: "poll_id", value: POLL_ID },
				{ key: "option_id", value: option },
				{ key: "voter_nullifier", value: voterNullifier },
				{ key: "timestamp", value: Date.now() },
			],
			expiresIn: THIRTY_DAYS_SECONDS,
		});
		return { ok: true as const };
	});
}
