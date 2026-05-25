import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import {
	discordCookie,
	serializeDiscordSession,
} from "@/lib/discord-session";
import {
	exchangeCodeForToken,
	fetchDiscordUser,
	isNSMember,
} from "@/lib/discord";

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const error = url.searchParams.get("error");

	const cookieStore = await cookies();
	const storedState = cookieStore.get("forum.oauth_state")?.value;
	cookieStore.delete("forum.oauth_state");

	if (error) {
		return NextResponse.redirect(new URL(`/auth?error=${error}`, req.url));
	}
	if (!code || !state) {
		return NextResponse.redirect(new URL("/auth?error=missing_code", req.url));
	}
	if (!storedState || storedState !== state) {
		return NextResponse.redirect(new URL("/auth?error=bad_state", req.url));
	}

	try {
		const token = await exchangeCodeForToken(code);
		const user = await fetchDiscordUser(token.access_token);
		const verified = await isNSMember(token.access_token);
		if (!verified) {
			return NextResponse.redirect(
				new URL("/auth?error=not_member", req.url),
			);
		}

		cookieStore.set(
			discordCookie.name,
			serializeDiscordSession({
				subjectId: user.id,
				username: user.global_name ?? user.username,
				createdAt: Date.now(),
			}),
			{
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: discordCookie.maxAgeSeconds,
			},
		);

		return NextResponse.redirect(new URL("/auth", req.url));
	} catch (e) {
		console.error("OAuth callback failed", e);
		return NextResponse.redirect(new URL("/auth?error=oauth_failed", req.url));
	}
}
