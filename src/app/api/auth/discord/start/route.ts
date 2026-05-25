import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/discord";

export async function GET(_req: NextRequest) {
	const state = randomBytes(16).toString("hex");
	const cookieStore = await cookies();
	cookieStore.set("forum.oauth_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 10,
	});
	return NextResponse.redirect(buildAuthorizeUrl(state));
}
