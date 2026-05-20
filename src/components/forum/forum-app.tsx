"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Poll } from "@/lib/forum-data";
import type { UiThread } from "@/lib/forum-ui-types";
import { NS_COLORS } from "./atoms";
import { PollComposerSheet, ThreadComposerSheet } from "./composers";
import { RightRail } from "./right-rail";
import { type Section, Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { PollsView } from "./views/polls-view";
import { ThreadDetail } from "./views/thread-detail";
import { ThreadsView } from "./views/threads-view";

const NSPASS_URL =
	process.env.NEXT_PUBLIC_NSPASS_URL ?? "https://nspass.vercel.app";
const NSPASS_ORIGIN =
	typeof window !== "undefined" ? new URL(NSPASS_URL).origin : "";
const CONTEXT = "ns-anon-poll-v1";

export function ForumApp({
	initialSignedIn,
	handle,
}: { initialSignedIn: boolean; handle?: string }) {
	const [signedIn, setSignedIn] = useState(initialSignedIn);
	const [section, setSection] = useState<Section>("polls");
	const [activeCat, setActiveCat] = useState("all");
	const [openThreadId, setOpenThreadId] = useState<string | null>(null);
	const [composer, setComposer] = useState<"poll" | "thread" | null>(null);
	const [votes, setVotes] = useState<Record<string, number>>({});
	const [signInBusy, setSignInBusy] = useState(false);
	const popupWatchRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const [threads, setThreads] = useState<UiThread[]>([]);
	const [threadsLoading, setThreadsLoading] = useState(true);
	const [polls, setPolls] = useState<Poll[]>([]);

	const refreshThreads = useCallback(async () => {
		try {
			const r = await fetch("/api/threads", { cache: "no-store" });
			if (r.ok) {
				const data = await r.json();
				setThreads(data.threads ?? []);
			}
		} finally {
			setThreadsLoading(false);
		}
	}, []);

	const refreshPolls = useCallback(async () => {
		try {
			const r = await fetch("/api/poll", { cache: "no-store" });
			if (!r.ok) return;
			const data = await r.json();
			const list: Poll[] = data.polls ?? [];
			setPolls(list);
			// Seed the local vote map from the server so a refresh reflects
			// votes cast on other devices.
			setVotes((prev) => {
				const next = { ...prev };
				for (const p of list) {
					if (typeof p.myVote === "number") next[p.id] = p.myVote;
				}
				return next;
			});
		} catch {}
	}, []);

	useEffect(() => {
		refreshThreads();
		refreshPolls();
		// Background polling while a list view is visible — catches other
		// members' posts and votes without a websocket.
		const t = setInterval(() => {
			if (openThreadId) return;
			if (section === "threads") refreshThreads();
			if (section === "polls") refreshPolls();
		}, 5000);
		return () => clearInterval(t);
	}, [refreshThreads, refreshPolls, section, openThreadId]);

	// NSPass postMessage handshake
	useEffect(() => {
		function onMessage(e: MessageEvent) {
			if (e.origin !== NSPASS_ORIGIN) return;
			const data = e.data;
			if (!data || typeof data !== "object") return;
			if (data.type === "nspass.cancelled") {
				if (popupWatchRef.current !== null) {
					clearInterval(popupWatchRef.current);
					popupWatchRef.current = null;
				}
				setSignInBusy(false);
				return;
			}
			if (data.type === "nspass.proof") {
				fetch("/api/verify-nspass", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ proof: data.proof }),
				})
					.then(async (r) => {
						if (r.ok) {
							setSignedIn(true);
							window.location.reload();
						}
					})
					.finally(() => {
						if (popupWatchRef.current !== null) {
							clearInterval(popupWatchRef.current);
							popupWatchRef.current = null;
						}
						setSignInBusy(false);
					});
			}
		}
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, []);

	// Stop the popup-close watcher if the forum unmounts mid-sign-in.
	useEffect(() => {
		return () => {
			if (popupWatchRef.current !== null) clearInterval(popupWatchRef.current);
		};
	}, []);

	function handleSignIn() {
		if (signInBusy) return;
		const params = new URLSearchParams({
			context: CONTEXT,
			origin: window.location.origin,
			app: "NS Forum",
		});
		const w = 480;
		const h = 640;
		const left = window.screenX + (window.outerWidth - w) / 2;
		const top = window.screenY + (window.outerHeight - h) / 2;
		const popup = window.open(
			`${NSPASS_URL}/authorize?${params.toString()}`,
			"nspass-authorize",
			`width=${w},height=${h},left=${left},top=${top}`,
		);
		// Popup blocked — leave the button usable so the user can retry.
		if (!popup) return;
		setSignInBusy(true);
		// If the popup is closed or abandoned without completing, the
		// postMessage handshake never fires — watch for that and free the
		// button so sign-in works again without a forum reload.
		if (popupWatchRef.current !== null) clearInterval(popupWatchRef.current);
		popupWatchRef.current = setInterval(() => {
			if (popup.closed) {
				if (popupWatchRef.current !== null) {
					clearInterval(popupWatchRef.current);
					popupWatchRef.current = null;
				}
				setSignInBusy(false);
			}
		}, 700);
	}

	async function handleSignOut() {
		await fetch("/api/sign-out", { method: "POST" });
		window.location.reload();
	}

	function goSection(s: Section) {
		setSection(s);
		setOpenThreadId(null);
	}

	async function handleVote(postId: string, idx: number) {
		if (!signedIn) {
			handleSignIn();
			return;
		}
		if (votes[postId] != null) return; // already voted
		setVotes((v) => ({ ...v, [postId]: idx })); // optimistic
		try {
			const r = await fetch("/api/poll/cast", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pollId: postId, option: idx }),
			});
			if (!r.ok) {
				const data = await r.json().catch(() => ({}));
				// already_voted: keep the vote shown; anything else: roll back.
				if (data.error !== "already_voted") {
					setVotes((v) => {
						const next = { ...v };
						delete next[postId];
						return next;
					});
				}
			}
		} catch {
			setVotes((v) => {
				const next = { ...v };
				delete next[postId];
				return next;
			});
		}
		refreshPolls();
	}

	function openThread(id: string) {
		setOpenThreadId(id);
	}

	function newPoll() {
		if (!signedIn) {
			handleSignIn();
			return;
		}
		setComposer("poll");
	}

	function newThread() {
		if (!signedIn) {
			handleSignIn();
			return;
		}
		setComposer("thread");
	}

	const openThread_ = openThreadId
		? threads.find((t) => t.id === openThreadId)
		: undefined;

	return (
		<div
			style={{
				minHeight: "100vh",
				background: NS_COLORS.bg,
				color: NS_COLORS.ink,
				fontFamily: "var(--font-sans)",
				position: "relative",
			}}
		>
			<TopBar
				signedIn={signedIn}
				onSignIn={handleSignIn}
				onSignOut={handleSignOut}
				handle={handle}
			/>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "244px 1fr 280px",
					gap: 0,
					maxWidth: 1280,
					margin: "0 auto",
					padding: "24px 36px 60px",
				}}
			>
				<Sidebar
					section={section}
					onSection={goSection}
					activeCat={activeCat}
					onCat={setActiveCat}
					signedIn={signedIn}
					onSignIn={handleSignIn}
					onNewPoll={newPoll}
					onNewThread={newThread}
				/>

				<main style={{ padding: "0 28px", minWidth: 0 }}>
					{openThreadId ? (
						<ThreadDetail
							threadId={openThreadId}
							signedIn={signedIn}
							lockStyle="light"
							onBack={() => setOpenThreadId(null)}
							onSignIn={handleSignIn}
						/>
					) : section === "polls" ? (
						<PollsView
							signedIn={signedIn}
							lockStyle="light"
							density="regular"
							activeCat={activeCat}
							polls={polls}
							votes={votes}
							showCounts={false}
							onVote={handleVote}
							onSignIn={handleSignIn}
							onNewPoll={newPoll}
						/>
					) : (
						<ThreadsView
							signedIn={signedIn}
							lockStyle="light"
							density="regular"
							activeCat={activeCat}
							threads={threads}
							loading={threadsLoading}
							onOpenThread={openThread}
							onSignIn={handleSignIn}
							onNewThread={newThread}
						/>
					)}
				</main>

				<RightRail
					section={section}
					openThreadId={openThreadId}
					openThreadTag={openThread_?.tag}
					threads={threads}
					polls={polls}
					onOpenThread={openThread}
					signedIn={signedIn}
				/>
			</div>

			{composer === "poll" ? (
				<PollComposerSheet
					onClose={() => setComposer(null)}
					onPosted={() => {
						setSection("polls");
						refreshPolls();
					}}
				/>
			) : composer === "thread" ? (
				<ThreadComposerSheet
					onClose={() => setComposer(null)}
					onPosted={(id) => {
						refreshThreads();
						setSection("threads");
						setOpenThreadId(id);
					}}
				/>
			) : null}
		</div>
	);
}
