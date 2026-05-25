// Read-only Arkiv probe — tells us whether the RPC is responsive at all.
import { createPublicClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";

const client = createPublicClient({
	chain: braga,
	transport: http(undefined, { timeout: 15_000 }),
});

console.log("Probing Braga RPC…");
const start = Date.now();
try {
	const blockNumber = await client.getBlockNumber();
	console.log(
		`✓ Latest block ${blockNumber} (${Date.now() - start}ms) — RPC reads OK`,
	);
} catch (err) {
	console.error(`✗ Read failed after ${Date.now() - start}ms`);
	console.error(err);
	process.exit(1);
}

console.log("\nChecking wallet balance…");
const start2 = Date.now();
try {
	const balance = await client.getBalance({
		address: "0x1135D4546611D7CcCC7C4E0315072Ef2E61b9483",
	});
	console.log(
		`✓ Balance: ${balance} wei (${Number(balance) / 1e18} GLM) (${Date.now() - start2}ms)`,
	);
} catch (err) {
	console.error(`✗ getBalance failed after ${Date.now() - start2}ms`);
	console.error(err);
}

console.log("\nChecking nonce (pending tx count)…");
const start3 = Date.now();
try {
	const nonce = await client.getTransactionCount({
		address: "0x1135D4546611D7CcCC7C4E0315072Ef2E61b9483",
		blockTag: "pending",
	});
	const mined = await client.getTransactionCount({
		address: "0x1135D4546611D7CcCC7C4E0315072Ef2E61b9483",
		blockTag: "latest",
	});
	console.log(
		`✓ Pending nonce: ${nonce}  /  Mined nonce: ${mined}  (diff = ${nonce - mined} stuck) (${Date.now() - start3}ms)`,
	);
} catch (err) {
	console.error(err);
}
