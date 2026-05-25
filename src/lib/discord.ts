import { NS_GUILD_ID, NS_MEMBER_ROLE_ID } from "./ns-config";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET ?? "";
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI ?? "";

export function buildAuthorizeUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: DISCORD_CLIENT_ID,
		redirect_uri: DISCORD_REDIRECT_URI,
		response_type: "code",
		scope: "identify guilds guilds.members.read",
		state,
		prompt: "consent",
	});
	return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

type TokenResponse = {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
};

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
	const body = new URLSearchParams({
		client_id: DISCORD_CLIENT_ID,
		client_secret: DISCORD_CLIENT_SECRET,
		grant_type: "authorization_code",
		code,
		redirect_uri: DISCORD_REDIRECT_URI,
	});
	const res = await fetch("https://discord.com/api/oauth2/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!res.ok) {
		throw new Error(
			`Discord token exchange failed: ${res.status} ${await res.text()}`,
		);
	}
	return (await res.json()) as TokenResponse;
}

export type DiscordUser = {
	id: string;
	username: string;
	global_name: string | null;
	avatar: string | null;
};

export async function fetchDiscordUser(
	accessToken: string,
): Promise<DiscordUser> {
	const res = await fetch("https://discord.com/api/users/@me", {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!res.ok) throw new Error(`fetchDiscordUser failed: ${res.status}`);
	return (await res.json()) as DiscordUser;
}

export async function isNSMember(accessToken: string): Promise<boolean> {
	const res = await fetch(
		`https://discord.com/api/users/@me/guilds/${NS_GUILD_ID}/member`,
		{ headers: { Authorization: `Bearer ${accessToken}` } },
	);
	if (res.status === 404) return false;
	if (!res.ok) throw new Error(`fetchGuildMember failed: ${res.status}`);
	const member = (await res.json()) as { roles: string[] };
	if (!NS_MEMBER_ROLE_ID) return true;
	return member.roles.includes(NS_MEMBER_ROLE_ID);
}
