import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteBackup } from "@/lib/backup-store";
import { discordCookie, parseDiscordSession } from "@/lib/discord-session";
import { leaveGroup } from "@/lib/group-store";
import { sessionCookie } from "@/lib/session";

/**
 * Full account wipe:
 *  - Tombstones the encrypted backup on Arkiv (we no longer try to restore it).
 *  - Removes this Discord's subject hash from the group so they can rejoin later
 *    with a fresh commitment. The current commitment becomes orphaned; its
 *    trapdoor only lived in the user's localStorage, so it's unrecoverable.
 *  - Clears the forum session + Discord cookie. Client clears localStorage.
 */
export async function POST() {
	const cookieStore = await cookies();
	const session = parseDiscordSession(
		cookieStore.get(discordCookie.name)?.value,
	);
	if (!session) {
		return NextResponse.json({ error: "no_discord" }, { status: 401 });
	}

	const txHashes: { backup?: string; leave?: string } = {};

	try {
		const leaveRes = await leaveGroup(session.subjectId);
		if (leaveRes?.txHash) txHashes.leave = leaveRes.txHash;
	} catch (e) {
		console.error("leaveGroup failed during delete", e);
	}

	try {
		const { txHash } = await deleteBackup(session.subjectId);
		txHashes.backup = txHash;
	} catch (e) {
		console.error("deleteBackup failed during delete", e);
	}

	cookieStore.delete(sessionCookie.name);
	cookieStore.delete(discordCookie.name);
	cookieStore.delete("forum.oauth_state");

	return NextResponse.json({ ok: true, txHashes });
}
