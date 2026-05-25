"use client";

import { useState } from "react";
import { BrandMark } from "@/components/forum/top-bar";
import { arkivTxUrl } from "@/lib/arkiv-explorer";

const BRAND_ORANGE = "#FE4C02";

type DeleteState =
	| { kind: "idle" }
	| { kind: "confirm" }
	| { kind: "deleting"; step: string }
	| { kind: "done"; txHashes: { leave?: string; backup?: string } }
	| { kind: "error"; detail: string };

export function ProfileClient({
	handle,
	joinedAt,
	discordUsername,
}: {
	handle: string;
	joinedAt: number;
	discordUsername?: string;
}) {
	const [del, setDel] = useState<DeleteState>({ kind: "idle" });
	const [signingOut, setSigningOut] = useState(false);

	async function signOut() {
		if (signingOut) return;
		setSigningOut(true);
		await fetch("/api/sign-out", { method: "POST" });
		window.location.href = "/";
	}

	async function deleteIdentity() {
		setDel({ kind: "deleting", step: "Leaving the NS group on Arkiv…" });
		try {
			const res = await fetch("/api/identity/delete", { method: "POST" });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error ?? "delete_failed");
			}
			const data = (await res.json()) as {
				txHashes: { leave?: string; backup?: string };
			};
			// Wipe local identity store after server cleanup succeeded.
			try {
				localStorage.removeItem("zeropass.identity.ns");
			} catch {}
			setDel({ kind: "done", txHashes: data.txHashes });
		} catch (e) {
			setDel({
				kind: "error",
				detail: e instanceof Error ? e.message : "Couldn't delete identity.",
			});
		}
	}

	const joinedDate = new Date(joinedAt).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});

	return (
		<div
			className="min-h-screen text-black"
			style={{
				background: "var(--fz-paper)",
				fontFamily: "var(--font-display)",
			}}
		>
			<header className="flex items-center justify-between border-b-2 border-black px-5 py-4 md:px-9">
				<a href="/" className="flex items-center gap-2.5 no-underline">
					<BrandMark size={26} />
					<span className="text-[22px] font-bold lowercase tracking-[0.01em] text-black md:text-[24px]">
						forumzero
					</span>
				</a>
				<a
					href="/"
					className="text-[11px] font-bold tracking-[0.18em] text-black/55 transition-colors hover:text-black"
				>
					BACK&nbsp;TO&nbsp;FORUM
				</a>
			</header>

			<main className="mx-auto flex max-w-[720px] flex-col px-5 pt-10 pb-16 md:pt-14">
				<div className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">
					<span className="border-b-2 border-black pb-1">PROFILE</span>
				</div>
				<h1
					className="mt-5 text-black"
					style={{
						fontFamily: "var(--font-display)",
						fontWeight: 700,
						fontSize: "clamp(38px, 7vw, 64px)",
						lineHeight: 1.0,
						letterSpacing: "-0.015em",
					}}
				>
					<span style={{ color: BRAND_ORANGE }}>{handle}</span>
				</h1>
				<p
					className="mt-3 max-w-[480px] text-[14px] text-black/60"
					style={{ fontFamily: "var(--font-sans)" }}
				>
					Your anonymous handle for forumzero. It&apos;s derived from the
					nullifier in your zero-knowledge proof — unique to this app, and
					not linkable to your Discord by anyone.
				</p>

				{/* Stats card */}
				<dl
					className="mt-9 grid border-2 border-black md:grid-cols-3"
					style={{ background: "rgba(255,255,255,0.4)" }}
				>
					<StatCell label="Handle" value={handle} mono />
					<StatCell
						label="Signed in"
						value={joinedDate}
						bordered
					/>
					<StatCell
						label="Discord"
						value={discordUsername ?? "—"}
						bordered
					/>
				</dl>

				{/* Sign out */}
				<section className="mt-10">
					<div className="text-[11px] font-bold uppercase tracking-[0.18em]">
						<span className="border-b-2 border-black pb-1">SESSION</span>
					</div>
					<div className="mt-4 flex flex-col gap-3 border-2 border-black p-5 md:flex-row md:items-center md:justify-between">
						<div className="max-w-[420px]">
							<div
								className="text-[14px] font-bold text-black"
								style={{ fontFamily: "var(--font-display)" }}
							>
								Sign out of this device
							</div>
							<div
								className="mt-1 text-[12.5px] text-black/55"
								style={{ fontFamily: "var(--font-sans)" }}
							>
								Clears the forum session cookie. Your encrypted identity stays
								in this browser and on Arkiv — sign back in any time without
								re-verifying Discord.
							</div>
						</div>
						<button
							type="button"
							onClick={signOut}
							disabled={signingOut}
							className="inline-flex w-fit items-center gap-2 border-2 border-black bg-transparent px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white disabled:opacity-40"
						>
							{signingOut ? "SIGNING OUT…" : "SIGN OUT"}
						</button>
					</div>
				</section>

				{/* Danger zone */}
				<section className="mt-10">
					<div className="text-[11px] font-bold uppercase tracking-[0.18em]">
						<span
							className="border-b-2 pb-1"
							style={{ borderColor: BRAND_ORANGE, color: BRAND_ORANGE }}
						>
							DANGER ZONE
						</span>
					</div>
					<div
						className="mt-4 border-2 p-5"
						style={{
							borderColor: BRAND_ORANGE,
							background: "rgba(254,76,2,0.04)",
						}}
					>
						<div
							className="text-[14px] font-bold text-black"
							style={{ fontFamily: "var(--font-display)" }}
						>
							Delete my anonymous identity
						</div>
						<div
							className="mt-1.5 text-[12.5px] leading-[1.55] text-black/65"
							style={{ fontFamily: "var(--font-sans)" }}
						>
							Tombstones your encrypted backup on Arkiv, removes your Discord
							hash from the group, and wipes this device. Your past posts and
							votes remain on Arkiv — anonymous and unattributable — but the
							identity that made them is unrecoverable.
						</div>

						{del.kind === "idle" ? (
							<button
								type="button"
								onClick={() => setDel({ kind: "confirm" })}
								className="mt-4 inline-flex items-center gap-2 border-2 px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] transition-colors"
								style={{
									borderColor: BRAND_ORANGE,
									color: BRAND_ORANGE,
									background: "transparent",
								}}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLElement).style.background =
										BRAND_ORANGE;
									(e.currentTarget as HTMLElement).style.color = "#fff";
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLElement).style.background =
										"transparent";
									(e.currentTarget as HTMLElement).style.color = BRAND_ORANGE;
								}}
							>
								DELETE IDENTITY
							</button>
						) : null}

						{del.kind === "confirm" ? (
							<div className="mt-4 border-2 border-black bg-white p-4">
								<div
									className="text-[12.5px] font-bold text-black"
									style={{ fontFamily: "var(--font-sans)" }}
								>
									Are you absolutely sure? This is permanent.
								</div>
								<div className="mt-3 flex flex-wrap items-center gap-3">
									<button
										type="button"
										onClick={deleteIdentity}
										className="inline-flex items-center gap-2 border-2 border-black px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-white transition-transform hover:-translate-y-[1px] active:translate-y-0"
										style={{
											background: BRAND_ORANGE,
											boxShadow: "3px 3px 0 #000",
										}}
									>
										YES, DELETE EVERYTHING
									</button>
									<button
										type="button"
										onClick={() => setDel({ kind: "idle" })}
										className="text-[11px] font-bold tracking-[0.18em] text-black/55 transition-colors hover:text-black"
									>
										CANCEL
									</button>
								</div>
							</div>
						) : null}

						{del.kind === "deleting" ? (
							<div className="mt-4 flex items-center gap-3 border-2 border-black bg-white px-4 py-3">
								<Pulse />
								<div
									className="text-[12.5px] font-bold text-black"
									style={{ fontFamily: "var(--font-display)" }}
								>
									{del.step}
								</div>
							</div>
						) : null}

						{del.kind === "done" ? (
							<div className="mt-4 flex flex-col gap-3 border-2 border-black bg-white p-4">
								<div
									className="text-[13px] font-bold text-black"
									style={{ fontFamily: "var(--font-display)" }}
								>
									✓ Identity deleted on Arkiv.
								</div>
								<div className="grid gap-2 md:grid-cols-2">
									{del.txHashes.leave ? (
										<ArkivTxLink
											label="GROUP LEAVE"
											txHash={del.txHashes.leave}
										/>
									) : null}
									{del.txHashes.backup ? (
										<ArkivTxLink
											label="BACKUP TOMBSTONE"
											txHash={del.txHashes.backup}
										/>
									) : null}
								</div>
								<a
									href="/"
									className="inline-flex w-fit items-center gap-2 border-2 border-black px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-white transition-transform hover:-translate-y-[1px] active:translate-y-0"
									style={{
										background: BRAND_ORANGE,
										boxShadow: "3px 3px 0 #000",
									}}
								>
									BACK TO FORUM →
								</a>
							</div>
						) : null}

						{del.kind === "error" ? (
							<div
								className="mt-4 border-2 px-3 py-2 text-[12.5px]"
								style={{
									borderColor: BRAND_ORANGE,
									background: "rgba(254,76,2,0.08)",
									color: "#7a2200",
									fontFamily: "var(--font-sans)",
								}}
							>
								{del.detail}
							</div>
						) : null}
					</div>
				</section>
			</main>
		</div>
	);
}

function StatCell({
	label,
	value,
	mono,
	bordered,
}: {
	label: string;
	value: string;
	mono?: boolean;
	bordered?: boolean;
}) {
	return (
		<div
			className={`flex flex-col gap-1 px-5 py-4 ${
				bordered ? "border-t-2 border-black md:border-l-2 md:border-t-0" : ""
			}`}
		>
			<dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/55">
				{label}
			</dt>
			<dd
				className="truncate text-[14.5px] text-black"
				style={{
					fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
					fontWeight: mono ? 500 : 600,
				}}
			>
				{value}
			</dd>
		</div>
	);
}

function ArkivTxLink({ label, txHash }: { label: string; txHash: string }) {
	const short = `${txHash.slice(0, 6)}…${txHash.slice(-4)}`;
	return (
		<a
			href={arkivTxUrl(txHash)}
			target="_blank"
			rel="noopener noreferrer"
			className="group flex items-center justify-between gap-3 border-2 border-black bg-[var(--fz-paper)] px-3 py-2 transition-colors hover:bg-black hover:text-white"
		>
			<span className="flex items-center gap-2">
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden
				>
					<path d="M3 8l9-5 9 5-9 5-9-5Z" />
					<path d="M3 8v8l9 5 9-5V8" />
				</svg>
				<span
					className="text-[10px] font-bold uppercase tracking-[0.16em]"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{label}
				</span>
			</span>
			<span className="flex items-center gap-1.5">
				<span
					className="text-[10.5px] tracking-[0.02em] text-black/55 group-hover:text-white/85"
					style={{ fontFamily: "var(--font-mono)" }}
				>
					{short}
				</span>
				<svg
					width="10"
					height="10"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden
				>
					<path d="M7 17 17 7M9 7h8v8" />
				</svg>
			</span>
		</a>
	);
}

function Pulse() {
	return (
		<span className="relative flex h-3 w-3 items-center justify-center">
			<span
				className="absolute h-3 w-3 animate-ping rounded-full"
				style={{ background: BRAND_ORANGE, opacity: 0.45 }}
			/>
			<span
				className="h-2 w-2 rounded-full"
				style={{ background: BRAND_ORANGE }}
			/>
		</span>
	);
}
