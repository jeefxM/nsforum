import { createHash, randomBytes } from "node:crypto";

const HANDLE_SECRET =
	process.env.FORUM_HANDLE_SECRET ?? process.env.FORUM_SESSION_SECRET ?? "dev-fallback-handle-salt";

/**
 * Derive an anonymous handle for a given nullifier within a context.
 *
 * - context = "global" → stable handle visible across the app (top bar, poll comments)
 * - context = "<thread_id>" → unique handle within that thread, unlinkable across threads
 *
 * The handle does NOT expose any prefix of the nullifier — it's a salted hash.
 */
export function deriveHandle(nullifier: string, context: string): string {
	const h = createHash("sha256")
		.update(HANDLE_SECRET)
		.update("\x00")
		.update(nullifier)
		.update("\x00")
		.update(context)
		.digest("hex");
	return `ns_anon_${h.slice(0, 4)}`;
}

export function randomShortId(bytes = 4): string {
	return randomBytes(bytes).toString("hex");
}
