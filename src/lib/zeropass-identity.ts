import { Identity } from "@semaphore-protocol/core";

const STORAGE_KEY = "zeropass.identity.ns";

export function loadIdentity(): Identity | null {
	if (typeof window === "undefined") return null;
	const exported = window.localStorage.getItem(STORAGE_KEY);
	if (!exported) return null;
	try {
		return Identity.import(exported);
	} catch {
		return null;
	}
}

export function saveIdentity(identity: Identity): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(STORAGE_KEY, identity.export());
}

export function clearIdentity(): void {
	if (typeof window === "undefined") return;
	window.localStorage.removeItem(STORAGE_KEY);
}

export function createIdentity(): Identity {
	return new Identity();
}
