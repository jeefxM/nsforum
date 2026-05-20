import "server-only";
import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { braga } from "@arkiv-network/sdk/chains";

const PRIVATE_KEY = process.env.ARKIV_PRIVATE_KEY ?? "";
const PROJECT = process.env.ARKIV_POLL_PROJECT ?? "nspass-poll";
export const POLL_ID = process.env.ARKIV_POLL_ID ?? "ns-weekly-hackathons-v1";

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
