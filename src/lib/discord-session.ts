import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET =
	process.env.FORUM_SESSION_SECRET ??
	"dev-fallback-secret-change-me-32+chars-12345678";
const COOKIE_NAME = "forum.discord";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type DiscordSession = {
	subjectId: string;
	username: string;
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
	const pad =
		padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
	return Buffer.from(padded + pad, "base64");
}

function sign(payload: string): string {
	return b64UrlEncode(createHmac("sha256", SECRET).update(payload).digest());
}

export function serializeDiscordSession(session: DiscordSession): string {
	const payload = b64UrlEncode(JSON.stringify(session));
	return `${payload}.${sign(payload)}`;
}

export function parseDiscordSession(
	value: string | undefined,
): DiscordSession | null {
	if (!value) return null;
	const [payload, signature] = value.split(".");
	if (!payload || !signature) return null;
	const expected = sign(payload);
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	try {
		const session = JSON.parse(
			b64UrlDecode(payload).toString("utf8"),
		) as DiscordSession;
		const ageSeconds = (Date.now() - session.createdAt) / 1000;
		if (ageSeconds > MAX_AGE_SECONDS) return null;
		return session;
	} catch {
		return null;
	}
}

export const discordCookie = {
	name: COOKIE_NAME,
	maxAgeSeconds: MAX_AGE_SECONDS,
};
