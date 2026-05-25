import { cookies } from "next/headers";
import { parseSession, sessionCookie } from "@/lib/session";
import { RulesClient } from "./rules-client";

export const metadata = {
	title: "Rules · forumzero",
	description:
		"How forumzero works: anonymity, permanence, and the social contract.",
};

export default async function RulesPage() {
	const cookieStore = await cookies();
	const session = parseSession(cookieStore.get(sessionCookie.name)?.value);
	const signedIn = session != null;
	const handle = session
		? `ns_anon_${session.nullifier.slice(0, 4)}`
		: undefined;
	return <RulesClient signedIn={signedIn} handle={handle} />;
}
