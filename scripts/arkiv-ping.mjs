// Standalone Arkiv write test — bypasses Next.js + dev server.
// Run: cd apps/forum && node scripts/arkiv-ping.mjs
import "dotenv/config";
import { createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { braga } from "@arkiv-network/sdk/chains";
import { jsonToPayload } from "@arkiv-network/sdk/utils";

const PRIVATE_KEY = process.env.ARKIV_PRIVATE_KEY;
const PROJECT = process.env.ARKIV_POLL_PROJECT ?? "arkiv_test";

if (!PRIVATE_KEY?.startsWith("0x")) {
	console.error("Missing or malformed ARKIV_PRIVATE_KEY");
	process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
console.log(`Wallet: ${account.address}`);
console.log(`Project: ${PROJECT}`);
console.log(`Chain: ${braga.name} (id ${braga.id})`);
console.log("Creating a test entity (45s timeout)…");

const client = createWalletClient({
	chain: braga,
	transport: http(undefined, { timeout: 30_000 }),
	account,
});

const start = Date.now();
const timeout = setTimeout(() => {
	console.error(`\n⏰ Timed out after ${Date.now() - start}ms — RPC unresponsive`);
	process.exit(2);
}, 45_000);

try {
	const { txHash, entityKey } = await client.createEntity({
		payload: jsonToPayload({ kind: "ping", at: Date.now() }),
		contentType: "application/json",
		attributes: [
			{ key: "project", value: PROJECT },
			{ key: "type", value: "arkiv-ping" },
			{ key: "timestamp", value: Date.now() },
		],
		expiresIn: 60 * 60,
	});
	clearTimeout(timeout);
	const took = Date.now() - start;
	console.log(`\n✓ Wrote entity in ${took}ms`);
	console.log(`  txHash:    ${txHash}`);
	console.log(`  entityKey: ${entityKey}`);
	console.log(
		`  explorer:  https://explorer.braga.hoodi.arkiv.network/tx/${txHash}`,
	);
} catch (err) {
	clearTimeout(timeout);
	const took = Date.now() - start;
	console.error(`\n✗ Failed after ${took}ms`);
	console.error(err);
	process.exit(3);
}
