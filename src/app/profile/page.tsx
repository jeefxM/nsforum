import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { discordCookie, parseDiscordSession } from "@/lib/discord-session";
import { parseSession, sessionCookie } from "@/lib/session";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
	const cookieStore = await cookies();
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);
	if (!session) {
		redirect("/auth");
	}
	const discord = parseDiscordSession(
		cookieStore.get(discordCookie.name)?.value,
	);

	const handle = `ns_anon_${session.nullifier.slice(0, 4)}`;
	return (
		<ProfileClient
			handle={handle}
			joinedAt={session.createdAt}
			discordUsername={discord?.username}
		/>
	);
}
