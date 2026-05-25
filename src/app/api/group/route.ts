import { NextResponse } from "next/server";
import { getGroupSnapshot } from "@/lib/group-store";

export async function GET() {
	const snapshot = await getGroupSnapshot();
	return NextResponse.json(snapshot);
}
