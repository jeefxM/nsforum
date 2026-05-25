"use client";

import { Group, generateProof } from "@semaphore-protocol/core";
import { encodeBytes32String, toBigInt } from "ethers";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/forum/top-bar";
import { arkivTxUrl } from "@/lib/arkiv-explorer";
import {
	decryptBackup,
	encryptBackup,
} from "@/lib/zeropass-backup-crypto";
import type { PinBackup } from "@/lib/zeropass-backup-types";
import {
	createIdentity,
	loadIdentity,
	saveIdentity,
} from "@/lib/zeropass-identity";
import { Identity } from "@semaphore-protocol/core";

const BRAND_ORANGE = "#FE4C02";
const CONTEXT = "ns-anon-poll-v1";

type Phase =
	| "discord"
	| "checking"
	| "passphrase-create"
	| "passphrase-restore"
	| "working"
	| "done"
	| "error"
	| "already-signed-in";

const ERRORS: Record<string, string> = {
	not_member: "Your Discord account isn't in the NS server.",
	missing_code: "Discord didn't return an authorization code.",
	bad_state: "OAuth state mismatch — please try again.",
	oauth_failed: "Discord sign-in failed. Try again.",
	access_denied: "You declined the Discord authorization.",
};

export function AuthFlow({
	discordUsername,
	alreadySignedIn,
	error,
}: {
	discordUsername?: string;
	alreadySignedIn: boolean;
	error?: string;
}) {
	const [phase, setPhase] = useState<Phase>(() => {
		if (alreadySignedIn) return "already-signed-in";
		if (error) return "error";
		if (!discordUsername) return "discord";
		return "checking";
	});
	const [detail, setDetail] = useState<string | null>(() =>
		error ? (ERRORS[error] ?? error) : null,
	);
	const [statusLine, setStatusLine] = useState<string>("");
	const [storedBackup, setStoredBackup] = useState<PinBackup | null>(null);
	const [joinTxHash, setJoinTxHash] = useState<string | null>(null);
	const [backupTxHash, setBackupTxHash] = useState<string | null>(null);
	const ranCheckRef = useRef(false);

	useEffect(() => {
		if (ranCheckRef.current) return;
		if (phase !== "checking") return;
		ranCheckRef.current = true;
		void runCheck();
		// biome-ignore lint/correctness/useExhaustiveDependencies: one-shot
	}, [phase]);

	async function runCheck() {
		try {
			// Local identity already exists → straight to proving.
			if (loadIdentity()) {
				setStatusLine("Resuming with your existing identity…");
				setPhase("working");
				await finishWithIdentity();
				return;
			}
			// Fetch the backup status from Arkiv (gated by Discord cookie).
			const r = await fetch("/api/backup", { cache: "no-store" });
			if (!r.ok) throw new Error("backup_lookup_failed");
			const data = (await r.json()) as { backup: PinBackup | null };
			if (data.backup && data.backup.method === "pin") {
				setStoredBackup(data.backup);
				setPhase("passphrase-restore");
			} else {
				setPhase("passphrase-create");
			}
		} catch (e) {
			setPhase("error");
			setDetail(e instanceof Error ? e.message : "Failed to check backup.");
		}
	}

	async function handleCreate(pin: string) {
		setPhase("working");
		setStatusLine("Minting anonymous identity…");
		try {
			const identity = createIdentity();
			saveIdentity(identity);

			setStatusLine("Encrypting backup with your passphrase…");
			const backup = await encryptBackup(identity.export(), pin);

			setStatusLine("Uploading backup to Arkiv…");
			const backupRes = await fetch("/api/backup", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ backup }),
			});
			if (!backupRes.ok) throw new Error("backup_save_failed");
			const backupData = await backupRes.json().catch(() => ({}));
			if (backupData.txHash) setBackupTxHash(backupData.txHash);

			await finishWithIdentity();
		} catch (e) {
			setPhase("error");
			setDetail(e instanceof Error ? e.message : "Couldn't create backup.");
		}
	}

	async function handleRestore(pin: string) {
		if (!storedBackup) {
			setPhase("error");
			setDetail("No backup found.");
			return;
		}
		setPhase("working");
		setStatusLine("Decrypting backup with your passphrase…");
		try {
			const exported = await decryptBackup(storedBackup, pin);
			const identity = Identity.import(exported);
			saveIdentity(identity);
			await finishWithIdentity();
		} catch {
			// Wrong passphrase: AES-GCM throws on integrity check.
			setPhase("passphrase-restore");
			setDetail("Wrong passphrase. Try again.");
		}
	}

	async function finishWithIdentity() {
		setStatusLine("Joining the NS group on Arkiv…");
		const identity = loadIdentity();
		if (!identity) throw new Error("identity_missing");

		let snapshot = await fetchSnapshot();
		const commitmentStr = identity.commitment.toString();
		if (!snapshot.commitments.includes(commitmentStr)) {
			let joinRes = await fetch("/api/group/join", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ commitment: commitmentStr }),
			});
			if (!joinRes.ok) {
				const data = await joinRes.json().catch(() => ({}));
				if (data.error === "already_joined") {
					setStatusLine("Replacing orphaned identity on Arkiv…");
					const leaveRes = await fetch("/api/group/leave", { method: "POST" });
					if (!leaveRes.ok) throw new Error("leave_failed");
					setStatusLine("Re-joining the NS group on Arkiv…");
					joinRes = await fetch("/api/group/join", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ commitment: commitmentStr }),
					});
					if (!joinRes.ok) {
						const retry = await joinRes.json().catch(() => ({}));
						throw new Error(retry.error ?? "join_failed");
					}
				} else {
					throw new Error(data.error ?? "join_failed");
				}
			}
			const joinData = await joinRes.json().catch(() => ({}));
			if (joinData.txHash) setJoinTxHash(joinData.txHash);
			snapshot = await fetchSnapshot();
		}

		setStatusLine("Generating zero-knowledge proof…");
		const group = new Group(snapshot.commitments.map((c) => BigInt(c)));
		const scope = toBigInt(encodeBytes32String(CONTEXT));
		const proof = await generateProof(identity, group, 1, scope);

		setStatusLine("Verifying with the forum…");
		const verifyRes = await fetch("/api/verify-zeropass", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ proof }),
		});
		if (!verifyRes.ok) {
			const data = await verifyRes.json().catch(() => ({}));
			throw new Error(data.error ?? "verify_failed");
		}

		setPhase("done");
		setTimeout(() => {
			window.location.href = "/";
		}, 5000);
	}

	return (
		<div
			className="min-h-screen text-black"
			style={{
				background: "var(--fz-paper)",
				fontFamily: "var(--font-display)",
			}}
		>
			{/* Brand bar */}
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

			<main className="mx-auto flex max-w-[640px] flex-col px-5 pt-10 pb-16 md:pt-16">
				<div className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">
					<span className="border-b-2 border-black pb-1">
						ANONYMOUS SIGN-IN
					</span>
				</div>
				<h1
					className="mt-5 text-black"
					style={{
						fontFamily: "var(--font-display)",
						fontWeight: 700,
						fontSize: "clamp(36px, 7vw, 60px)",
						lineHeight: 1.0,
						letterSpacing: "-0.015em",
					}}
				>
					prove you&apos;re&nbsp;NS.
					<br />
					<span style={{ color: BRAND_ORANGE }}>stay anonymous.</span>
				</h1>
				<p
					className="mt-5 max-w-[520px] text-[14.5px] leading-[1.6] text-black/65"
					style={{ fontFamily: "var(--font-sans)" }}
				>
					forumzero gates discussions to verified NS members. A zero-knowledge
					proof shows you belong without revealing who you are. Your identity
					is encrypted with a passphrase only you know — backed up on Arkiv so
					you can sign in from any device.
				</p>

				<div className="mt-9">
					{phase === "discord" ? <DiscordStep /> : null}

					{phase === "checking" ? (
						<StatusCard
							pulse
							title="Checking for an existing backup…"
							sub={discordUsername ? `Discord verified as ${discordUsername}.` : ""}
						/>
					) : null}

					{phase === "passphrase-create" ? (
						<PassphraseForm
							mode="create"
							username={discordUsername}
							error={detail}
							onSubmit={(pin) => {
								setDetail(null);
								void handleCreate(pin);
							}}
						/>
					) : null}

					{phase === "passphrase-restore" ? (
						<PassphraseForm
							mode="restore"
							username={discordUsername}
							error={detail}
							onSubmit={(pin) => {
								setDetail(null);
								void handleRestore(pin);
							}}
						/>
					) : null}

					{phase === "working" ? (
						<StatusCard
							pulse
							title={statusLine || "Working…"}
							sub="Your secrets never leave this browser."
						/>
					) : null}

					{phase === "done" ? (
						<div
							className="flex flex-col gap-4 border-2 border-black p-4 md:p-5"
							style={{
								background: "rgba(254,76,2,0.06)",
								boxShadow: "5px 5px 0 #000",
							}}
						>
							<div className="flex items-center gap-3">
								<span
									className="flex h-8 w-8 items-center justify-center rounded-full"
									style={{ background: BRAND_ORANGE }}
								>
									<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
										<path
											d="M3 8.5l3 3 6-7"
											stroke="#fff"
											strokeWidth="2.4"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</span>
								<div>
									<div
										className="text-[15px] font-bold tracking-[0.02em] text-black"
										style={{ fontFamily: "var(--font-display)" }}
									>
										You&apos;re in. Anonymously.
									</div>
									<div
										className="mt-0.5 text-[11.5px] text-black/55"
										style={{ fontFamily: "var(--font-sans)" }}
									>
										Your identity is encrypted on Arkiv. You&apos;ve joined
										the NS group as an anonymous member.
									</div>
								</div>
							</div>

							{joinTxHash || backupTxHash ? (
								<div className="grid gap-2 md:grid-cols-2">
									{joinTxHash ? (
										<ArkivTxLink
											label="GROUP JOIN"
											txHash={joinTxHash}
										/>
									) : null}
									{backupTxHash ? (
										<ArkivTxLink
											label="ENCRYPTED BACKUP"
											txHash={backupTxHash}
										/>
									) : null}
								</div>
							) : null}

							<div className="flex flex-wrap items-center gap-3">
								<a
									href="/"
									className="inline-flex items-center gap-2 border-2 border-black px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-white transition-transform hover:-translate-y-[1px] active:translate-y-0"
									style={{
										background: BRAND_ORANGE,
										boxShadow: "3px 3px 0 #000",
									}}
								>
									GO TO FORUM →
								</a>
								<span
									className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/45"
									style={{ fontFamily: "var(--font-display)" }}
								>
									redirecting in 5s…
								</span>
							</div>
						</div>
					) : null}

					{phase === "already-signed-in" ? (
						<div className="flex flex-col gap-3">
							<div
								className="border-2 border-black bg-white/40 px-4 py-3 text-[12.5px]"
								style={{ fontFamily: "var(--font-sans)" }}
							>
								You&apos;re already signed in. Head back to the forum.
							</div>
							<div className="flex flex-wrap items-center gap-3">
								<a
									href="/"
									className="inline-flex items-center gap-2 border-2 border-black px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-white transition-transform hover:-translate-y-[1px] active:translate-y-0"
									style={{
										background: BRAND_ORANGE,
										boxShadow: "3px 3px 0 #000",
									}}
								>
									GO TO FORUM →
								</a>
								<ResetButton />
							</div>
						</div>
					) : null}

					{phase === "error" ? (
						<div className="flex flex-col gap-3">
							<div
								role="alert"
								className="border-2 px-4 py-3 text-[12.5px]"
								style={{
									fontFamily: "var(--font-sans)",
									background: "rgba(254,76,2,0.08)",
									borderColor: BRAND_ORANGE,
									color: "#7a2200",
								}}
							>
								{detail ?? "Something went wrong."}
							</div>
							<a
								href="/auth"
								className="inline-flex w-fit items-center gap-2 border-2 border-black bg-transparent px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white"
							>
								TRY AGAIN
							</a>
						</div>
					) : null}
				</div>

				{/* Promise footer */}
				<div
					className="mt-12 grid gap-3 text-[11.5px] text-black/55 md:grid-cols-3"
					style={{ fontFamily: "var(--font-display)" }}
				>
					<PromiseCard label="ANONYMOUS">
						Server never learns which post is yours.
					</PromiseCard>
					<PromiseCard label="ON-CHAIN">
						Membership set + every post live on Arkiv.
					</PromiseCard>
					<PromiseCard label="PORTABLE">
						Sign in from any device with your passphrase.
					</PromiseCard>
				</div>
			</main>
		</div>
	);
}

function DiscordStep() {
	return (
		<a
			href="/api/auth/discord/start"
			className="inline-flex items-center justify-center gap-2 border-2 border-black px-6 py-3.5 text-[12px] font-bold tracking-[0.18em] text-white transition-transform hover:-translate-y-[1px] active:translate-y-0"
			style={{
				background: BRAND_ORANGE,
				boxShadow: "4px 4px 0 #000",
			}}
		>
			<DiscordIcon />
			CONNECT&nbsp;DISCORD
		</a>
	);
}

function ResetButton() {
	const [busy, setBusy] = useState(false);
	async function reset() {
		if (busy) return;
		if (
			!window.confirm(
				"Reset will wipe your forum session, your local anonymous identity, and your Discord verification on this device. Your encrypted backup on Arkiv stays — you can restore it with your passphrase. Continue?",
			)
		)
			return;
		setBusy(true);
		try {
			localStorage.removeItem("zeropass.identity.ns");
			await fetch("/api/auth/reset", { method: "POST" });
		} finally {
			window.location.href = "/auth";
		}
	}
	return (
		<button
			type="button"
			onClick={reset}
			disabled={busy}
			className="inline-flex items-center gap-2 border-2 border-black bg-transparent px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white disabled:opacity-40"
		>
			{busy ? "RESETTING…" : "RESET & START OVER"}
		</button>
	);
}

function PassphraseForm({
	mode,
	username,
	error,
	onSubmit,
}: {
	mode: "create" | "restore";
	username?: string;
	error: string | null;
	onSubmit: (pin: string) => void;
}) {
	const [pin, setPin] = useState("");
	const [confirm, setConfirm] = useState("");
	const [show, setShow] = useState(false);
	const create = mode === "create";

	function submit(e: React.FormEvent) {
		e.preventDefault();
		if (pin.length < 8) return;
		if (create && pin !== confirm) return;
		onSubmit(pin);
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-4">
			<div className="border-2 border-black bg-white/40 p-5">
				<div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">
					{create ? "Step 2 · Choose a passphrase" : "Step 2 · Enter your passphrase"}
				</div>
				<div
					className="mb-4 text-[13px] text-black/65"
					style={{ fontFamily: "var(--font-sans)" }}
				>
					{create
						? "Pick a passphrase to encrypt your anonymous identity. We'll back it up to Arkiv so any future device can sign you in with the same passphrase."
						: username
							? `Your Discord (${username}) has an existing identity backed up on Arkiv. Enter your passphrase to restore it on this device.`
							: "Enter your passphrase to decrypt your identity."}
				</div>

				<label className="flex flex-col gap-2">
					<span className="text-[11px] font-bold uppercase tracking-[0.16em]">
						Passphrase
					</span>
					<div className="flex items-stretch border-2 border-black bg-white">
						<input
							type={show ? "text" : "password"}
							value={pin}
							onChange={(e) => setPin(e.target.value)}
							autoFocus
							autoComplete={create ? "new-password" : "current-password"}
							placeholder="at least 8 characters"
							className="flex-1 bg-transparent px-4 py-3 text-[14px] text-black placeholder:text-black/35 focus:outline-none"
							style={{ fontFamily: "var(--font-sans)" }}
						/>
						<button
							type="button"
							onClick={() => setShow((v) => !v)}
							aria-label={show ? "Hide passphrase" : "Show passphrase"}
							className="border-l-2 border-black px-3 text-[10px] font-bold tracking-[0.16em] text-black transition-colors hover:bg-black hover:text-white"
						>
							{show ? "HIDE" : "SHOW"}
						</button>
					</div>
				</label>

				{create ? (
					<label className="mt-3 flex flex-col gap-2">
						<span className="text-[11px] font-bold uppercase tracking-[0.16em]">
							Confirm
						</span>
						<input
							type={show ? "text" : "password"}
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							autoComplete="new-password"
							placeholder="type it again"
							className="border-2 border-black bg-white px-4 py-3 text-[14px] text-black placeholder:text-black/35 focus:outline-none"
							style={{ fontFamily: "var(--font-sans)" }}
						/>
					</label>
				) : null}

				{create ? (
					<p
						className="mt-3 text-[11.5px] leading-[1.5] text-black/55"
						style={{ fontFamily: "var(--font-sans)" }}
					>
						⚠ If you lose this passphrase you lose access to your anonymous
						identity. Nobody — not the forum, not Arkiv — can recover it for
						you.
					</p>
				) : null}

				{error ? (
					<div
						className="mt-3 border-2 px-3 py-2 text-[12px] font-bold tracking-[0.04em]"
						style={{
							borderColor: BRAND_ORANGE,
							color: "#7a2200",
							background: "rgba(254,76,2,0.08)",
							fontFamily: "var(--font-sans)",
						}}
					>
						{error}
					</div>
				) : null}
			</div>

			<button
				type="submit"
				disabled={
					pin.length < 8 || (create && pin !== confirm)
				}
				className="inline-flex w-fit items-center gap-2 border-2 border-black px-6 py-3 text-[12px] font-bold tracking-[0.18em] text-white transition-transform hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
				style={{
					background: BRAND_ORANGE,
					boxShadow: "4px 4px 0 #000",
				}}
			>
				{create ? "BACK UP & CONTINUE" : "RESTORE & CONTINUE"}
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.4"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M5 12h14M13 5l7 7-7 7" />
				</svg>
			</button>
		</form>
	);
}

function ArkivTxLink({ label, txHash }: { label: string; txHash: string }) {
	const short = `${txHash.slice(0, 6)}…${txHash.slice(-4)}`;
	return (
		<a
			href={arkivTxUrl(txHash)}
			target="_blank"
			rel="noopener noreferrer"
			className="group flex items-center justify-between gap-3 border-2 border-black bg-white/60 px-3 py-2 transition-colors hover:bg-black hover:text-white"
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

function StatusCard({
	title,
	sub,
	pulse,
}: {
	title: string;
	sub?: string;
	pulse?: boolean;
}) {
	return (
		<div className="flex items-center gap-3 border-2 border-black bg-white/40 px-4 py-3">
			{pulse ? <Pulse /> : null}
			<div className="text-[12.5px]">
				<div
					className="font-bold tracking-[0.05em] text-black"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{title}
				</div>
				{sub ? (
					<div
						className="mt-0.5 text-[11.5px] text-black/55"
						style={{ fontFamily: "var(--font-sans)" }}
					>
						{sub}
					</div>
				) : null}
			</div>
		</div>
	);
}

async function fetchSnapshot(): Promise<{ commitments: string[] }> {
	const r = await fetch("/api/group", { cache: "no-store" });
	if (!r.ok) throw new Error("group_unreachable");
	return (await r.json()) as { commitments: string[] };
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

function PromiseCard({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="border border-black/20 px-3 py-3">
			<div className="text-[10px] font-bold uppercase tracking-[0.18em] text-black">
				{label}
			</div>
			<div
				className="mt-1.5 text-[12px] leading-[1.45] text-black/65"
				style={{ fontFamily: "var(--font-sans)" }}
			>
				{children}
			</div>
		</div>
	);
}

function DiscordIcon() {
	return (
		<svg width="16" height="12" viewBox="0 0 20 15" fill="none" aria-hidden>
			<path
				d="M16.93 1.25A16.5 16.5 0 0 0 12.84.07a.06.06 0 0 0-.06.03c-.18.31-.37.72-.5 1.04a15.3 15.3 0 0 0-4.56 0 10.5 10.5 0 0 0-.5-1.04.06.06 0 0 0-.06-.03A16.45 16.45 0 0 0 3.07 1.25a.05.05 0 0 0-.02.02C.5 5.04-.2 8.71.14 12.34a.07.07 0 0 0 .03.05 16.6 16.6 0 0 0 5 2.5.07.07 0 0 0 .07-.02c.39-.53.73-1.09 1.02-1.67a.06.06 0 0 0-.03-.08 11 11 0 0 1-1.56-.74.06.06 0 0 1-.01-.1l.31-.24a.06.06 0 0 1 .06-.01 11.85 11.85 0 0 0 10.03 0 .06.06 0 0 1 .06.01l.31.24c.05.04.05.13-.01.16-.5.3-1.02.55-1.56.74a.06.06 0 0 0-.03.08c.3.58.64 1.14 1.02 1.67a.07.07 0 0 0 .07.02 16.55 16.55 0 0 0 5-2.5.07.07 0 0 0 .03-.04c.4-4.21-.68-7.85-2.91-11.07a.05.05 0 0 0-.03-.02ZM6.68 10.13c-.97 0-1.77-.89-1.77-1.98 0-1.1.79-1.99 1.77-1.99.99 0 1.78.9 1.77 2 0 1.08-.79 1.97-1.77 1.97Zm6.55 0c-.97 0-1.77-.89-1.77-1.98 0-1.1.79-1.99 1.77-1.99.99 0 1.78.9 1.77 2 0 1.08-.78 1.97-1.77 1.97Z"
				fill="currentColor"
			/>
		</svg>
	);
}
