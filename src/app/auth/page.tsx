import { cookies } from "next/headers";
import { discordCookie, parseDiscordSession } from "@/lib/discord-session";
import { parseSession, sessionCookie } from "@/lib/session";
import { AuthFlow } from "./auth-flow";

export default async function AuthPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const params = await searchParams;
	const cookieStore = await cookies();
	const discord = parseDiscordSession(
		cookieStore.get(discordCookie.name)?.value,
	);
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);

	return (
		<AuthFlow
			discordUsername={discord?.username}
			alreadySignedIn={session != null}
			error={params.error}
		/>
	);
}
