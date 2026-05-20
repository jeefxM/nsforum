// Dev-only: nukes all type=thread and type=comment entities under the project.
// Use to reset to a blank slate after seeding.

import { eq } from "@arkiv-network/sdk/query";
import { NextResponse } from "next/server";
import {
	PROJECT_ATTRIBUTE,
	getPublicClient,
	getWalletClient,
} from "@/lib/arkiv-client";

export async function POST() {
	if (process.env.NODE_ENV === "production") {
		return NextResponse.json({ error: "disabled_in_prod" }, { status: 403 });
	}

	const publicClient = getPublicClient();
	const walletClient = getWalletClient();

	const keys: `0x${string}`[] = [];

	for (const type of ["thread", "comment"] as const) {
		const result = await publicClient
			.buildQuery()
			.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
			.where(eq("type", type))
			.limit(200)
			.fetch();
		while (true) {
			for (const entity of result.entities) {
				keys.push(entity.key as `0x${string}`);
			}
			if (!result.hasNextPage()) break;
			await result.next();
		}
	}

	let deleted = 0;
	for (const entityKey of keys) {
		try {
			await walletClient.deleteEntity({ entityKey });
			deleted += 1;
		} catch {
			// best effort
		}
	}

	return NextResponse.json({ ok: true, deleted });
}
