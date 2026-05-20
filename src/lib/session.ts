import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.FORUM_SESSION_SECRET ?? "dev-fallback-secret-change-me-32+chars-12345678";
const COOKIE_NAME = "forum.session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type ForumSession = {
	nullifier: string;
	createdAt: number;
};

function b64UrlEncode(input: Buffer | string): string {
	const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
	return buf
		.toString("base64")
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replace(/=+$/, "");
}

function b64UrlDecode(input: string): Buffer {
	const padded = input.replaceAll("-", "+").replaceAll("_", "/");
	const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
	return Buffer.from(padded + pad, "base64");
}

function sign(payload: string): string {
	return b64UrlEncode(createHmac("sha256", SECRET).update(payload).digest());
}

export function serializeSession(session: ForumSession): string {
	const payload = b64UrlEncode(JSON.stringify(session));
	const signature = sign(payload);
	return `${payload}.${signature}`;
}

export function parseSession(value: string | undefined): ForumSession | null {
	if (!value) return null;
	const [payload, signature] = value.split(".");
	if (!payload || !signature) return null;
	const expected = sign(payload);
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	try {
		const session = JSON.parse(b64UrlDecode(payload).toString("utf8")) as ForumSession;
		const ageSeconds = (Date.now() - session.createdAt) / 1000;
		if (ageSeconds > MAX_AGE_SECONDS) return null;
		return session;
	} catch {
		return null;
	}
}

export const sessionCookie = {
	name: COOKIE_NAME,
	maxAgeSeconds: MAX_AGE_SECONDS,
};
