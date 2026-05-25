// Inspects the stuck pending txs on the old wallet.
import { createPublicClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";

const ADDR = "0x1135D4546611D7CcCC7C4E0315072Ef2E61b9483";

const client = createPublicClient({
	chain: braga,
	transport: http(undefined, { timeout: 15_000 }),
});

const [mined, pending, balance, gas] = await Promise.all([
	client.getTransactionCount({ address: ADDR, blockTag: "latest" }),
	client.getTransactionCount({ address: ADDR, blockTag: "pending" }),
	client.getBalance({ address: ADDR }),
	client.getGasPrice(),
]);

console.log(`Address      ${ADDR}`);
console.log(`Mined nonce  ${mined}`);
console.log(`Pending nonce ${pending}`);
console.log(`Stuck slots  nonces ${mined}..${pending - 1} (${pending - mined} txs)`);
console.log(`Balance      ${balance} wei = ${Number(balance) / 1e18} GLM`);
console.log(`Network gas  ${gas} wei`);
console.log("");

// Try to fetch each pending tx by replaying mempool — viem doesn't expose
// txpool_content, so we walk nonces and ask for the tx via eth_getTransactionByHash
// where we can. Simpler: ask getBlock("pending") which on some chains lists pending txs.
try {
	const block = await client.getBlock({ blockTag: "pending" });
	const ours = (block.transactions ?? []).filter(
		(t) => typeof t === "object" && t.from?.toLowerCase() === ADDR.toLowerCase(),
	);
	console.log(`Pending block has ${ours.length} txs from our wallet:`);
	for (const t of ours) {
		console.log(
			`  nonce=${t.nonce}  hash=${t.hash}  gas=${t.gasPrice ?? t.maxFeePerGas}  to=${t.to}`,
		);
	}
} catch (e) {
	console.log(`(couldn't read pending block: ${e.message})`);
}
