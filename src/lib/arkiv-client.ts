import "server-only";
import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { braga } from "@arkiv-network/sdk/chains";

const PRIVATE_KEY = process.env.ARKIV_PRIVATE_KEY ?? "";
const PROJECT = process.env.ARKIV_POLL_PROJECT ?? "zeropass-poll";

let _walletClient: ReturnType<typeof createWalletClient> | null = null;
let _publicClient: ReturnType<typeof createPublicClient> | null = null;

export function getWalletClient() {
	if (!_walletClient) {
		if (!PRIVATE_KEY.startsWith("0x")) {
			throw new Error("ARKIV_PRIVATE_KEY missing or malformed");
		}
		_walletClient = createWalletClient({
			chain: braga,
			transport: http(),
			account: privateKeyToAccount(PRIVATE_KEY as `0x${string}`),
		});
	}
	return _walletClient;
}

export function getPublicClient() {
	if (!_publicClient) {
		_publicClient = createPublicClient({
			chain: braga,
			transport: http(),
		});
	}
	return _publicClient;
}

export const PROJECT_ATTRIBUTE = { key: "project", value: PROJECT };
export const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
export const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

/**
 * Retry a flaky Arkiv RPC call. Braga frequently cancels in-flight
 * queries with "context cancelled" and similar transient errors. We try
 * up to 6 times with exponential-ish backoff before giving up.
 *
 * Total worst-case wait: ~7.75s before the final failure surfaces.
 */
export async function arkivRetry<T>(
	fn: () => Promise<T>,
	attempts = 6,
	baseDelayMs = 250,
): Promise<T> {
	let lastErr: unknown;
	for (let i = 0; i < attempts; i++) {
		try {
			return await fn();
		} catch (err) {
			lastErr = err;
			const msg = err instanceof Error ? err.message : String(err);
			const transient =
				/context cancelled|RPC Request failed|timeout|ECONNRESET|fetch failed/i.test(
					msg,
				);
			if (!transient || i === attempts - 1) throw err;
			// One-line log instead of the full viem stack trace. The full
			// trace floods the dev console and signals nothing useful since
			// the next attempt usually succeeds.
			console.warn(
				`[arkiv] transient (attempt ${i + 1}/${attempts}): ${msg.split("\n")[0]}`,
			);
			// 250, 500, 1000, 1500, 2000, 2500 ms
			const wait = Math.min(baseDelayMs * 2 ** i, 2500);
			await new Promise((r) => setTimeout(r, wait));
		}
	}
	throw lastErr;
}

/** Resolve the creation tx hash for an entity loaded with `.withMetadata(true)`. */
export async function entityTxHash(entity: {
	createdAtBlock?: bigint;
	transactionIndexInBlock?: bigint;
}): Promise<string | undefined> {
	if (
		entity.createdAtBlock === undefined ||
		entity.transactionIndexInBlock === undefined
	) {
		return undefined;
	}
	try {
		const block = await getPublicClient().getBlock({
			blockNumber: entity.createdAtBlock,
		});
		const hash = block.transactions[Number(entity.transactionIndexInBlock)];
		return typeof hash === "string" ? hash : undefined;
	} catch {
		return undefined;
	}
}
