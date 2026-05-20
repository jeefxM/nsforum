import { cookies } from "next/headers";
import { ForumApp } from "@/components/forum/forum-app";
import { parseSession, sessionCookie } from "@/lib/session";

export default async function HomePage() {
	const cookieStore = await cookies();
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);
	const signedIn = session != null;
	const handle = session
		? `ns_anon_${session.nullifier.slice(0, 4)}`
		: undefined;
	return <ForumApp initialSignedIn={signedIn} handle={handle} />;
}
