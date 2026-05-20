import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/session";

export async function POST(req: Request) {
	const cookieStore = await cookies();
	cookieStore.delete(sessionCookie.name);
	return NextResponse.redirect(new URL("/", req.url));
}
