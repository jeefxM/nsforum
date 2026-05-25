import "server-only";
import { createHash } from "node:crypto";
import { desc, eq } from "@arkiv-network/sdk/query";
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import {
	ONE_YEAR_SECONDS,
	PROJECT_ATTRIBUTE,
	getPublicClient,
	getWalletClient,
} from "./arkiv-client";

const BACKUP_SALT = "zeropass.v1.backup";

export function backupLookupHash(subjectId: string): string {
	return createHash("sha256")
		.update(`${BACKUP_SALT}:ns:${subjectId}`)
		.digest("hex");
}

export async function getBackup(
	subjectId: string,
): Promise<unknown | null> {
	const client = getPublicClient();
	const hash = backupLookupHash(subjectId);
	const result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "identity-backup"))
		.where(eq("subject_lookup_hash", hash))
		.orderBy(desc("version", "number"))
		.withPayload(true)
		.limit(1)
		.fetch();

	const latest = result.entities[0];
	if (!latest) return null;
	const payload = latest.toJson();
	if (isTombstone(payload)) return null;
	return payload;
}

async function fetchLatestVersion(hash: string): Promise<number> {
	const client = getPublicClient();
	const result = await client
		.buildQuery()
		.where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
		.where(eq("type", "identity-backup"))
		.where(eq("subject_lookup_hash", hash))
		.orderBy(desc("version", "number"))
		.withAttributes(true)
		.limit(1)
		.fetch();

	const latest = result.entities[0];
	if (!latest) return 0;
	const versionAttr = latest.attributes.find((a) => a.key === "version");
	return typeof versionAttr?.value === "number"
		? versionAttr.value
		: Number(versionAttr?.value ?? 0);
}

export async function putBackup(
	subjectId: string,
	backup: unknown,
): Promise<{ txHash: string }> {
	const client = getWalletClient();
	const hash = backupLookupHash(subjectId);
	const previousVersion = await fetchLatestVersion(hash);

	const { txHash } = await client.createEntity({
		payload: jsonToPayload(backup as Record<string, unknown>),
		contentType: "application/json",
		attributes: [
			PROJECT_ATTRIBUTE,
			{ key: "type", value: "identity-backup" },
			{ key: "subject_lookup_hash", value: hash },
			{ key: "version", value: previousVersion + 1 },
		],
		expiresIn: ONE_YEAR_SECONDS,
	});
	return { txHash };
}

function isTombstone(backup: unknown): boolean {
	return (
		!!backup &&
		typeof backup === "object" &&
		(backup as { deleted?: boolean }).deleted === true
	);
}

/** Write a tombstone entity that supersedes the latest backup. */
export async function deleteBackup(
	subjectId: string,
): Promise<{ txHash: string }> {
	return putBackup(subjectId, { deleted: true });
}
