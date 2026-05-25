/** Arkiv (Golem Base · braga) block explorer — client-safe constants. */
export const ARKIV_EXPLORER_URL = "https://explorer.braga.hoodi.arkiv.network";

/** Link to a single transaction on the Arkiv explorer. */
export function arkivTxUrl(txHash: string): string {
	return `${ARKIV_EXPLORER_URL}/tx/${txHash}`;
}
