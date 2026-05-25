import type { PinBackup } from "./zeropass-backup-types";

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function b64encode(bytes: ArrayBuffer | Uint8Array): string {
	const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let bin = "";
	for (const b of u8) bin += String.fromCharCode(b);
	return btoa(bin);
}

function b64decode(s: string): Uint8Array {
	const bin = atob(s);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
	return out;
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
	const pinBytes = new TextEncoder().encode(pin);
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		pinBytes as BufferSource,
		"PBKDF2",
		false,
		["deriveKey"],
	);
	return await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt as BufferSource,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);
}

export async function encryptBackup(
	plaintext: string,
	pin: string,
): Promise<PinBackup> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const key = await deriveKey(pin, salt);
	const ciphertext = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv: iv as BufferSource },
		key,
		new TextEncoder().encode(plaintext) as BufferSource,
	);
	return {
		method: "pin",
		v: 1,
		kdf: "PBKDF2-SHA256",
		iterations: PBKDF2_ITERATIONS,
		salt: b64encode(salt),
		iv: b64encode(iv),
		ciphertext: b64encode(ciphertext),
	};
}

export async function decryptBackup(
	backup: PinBackup,
	pin: string,
): Promise<string> {
	if (backup.v !== 1) throw new Error("Unsupported backup version");
	const salt = b64decode(backup.salt);
	const iv = b64decode(backup.iv);
	const ciphertext = b64decode(backup.ciphertext);
	const key = await deriveKey(pin, salt);
	const plaintext = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv: iv as BufferSource },
		key,
		ciphertext as BufferSource,
	);
	return new TextDecoder().decode(plaintext);
}
