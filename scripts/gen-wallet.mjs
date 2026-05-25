// Generates a fresh Arkiv wallet (private key + address).
// Run: node scripts/gen-wallet.mjs
import {
	generatePrivateKey,
	privateKeyToAccount,
} from "@arkiv-network/sdk/accounts";

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("");
console.log("═══════════════════════════════════════════════════════════════");
console.log("  Fresh Arkiv Braga wallet");
console.log("═══════════════════════════════════════════════════════════════");
console.log("");
console.log("  Address:     ", account.address);
console.log("  Private key: ", privateKey);
console.log("");
console.log("  Faucet:");
console.log("    https://faucet.braga.hoodi.arkiv.network");
console.log("");
console.log("  Explorer:");
console.log(
	`    https://explorer.braga.hoodi.arkiv.network/address/${account.address}`,
);
console.log("");
console.log("  Next: put this in apps/forum/.env (and .env.local):");
console.log("    ARKIV_PRIVATE_KEY=" + privateKey);
console.log("");
console.log("  ⚠ Treat the private key like a password. Don't commit it.");
console.log("═══════════════════════════════════════════════════════════════");
