"use client";

import { useCallback, useEffect, useState } from "react";
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

	const [threads, setThreads] = useState<UiThread[]>([]);
	const [threadsLoading, setThreadsLoading] = useState(true);

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

	useEffect(() => {
		refreshThreads();
		// Background polling while the threads view is visible — catches
		// other members' posts without a websocket.
		const t = setInterval(() => {
			if (section === "threads" && !openThreadId) refreshThreads();
		}, 5000);
		return () => clearInterval(t);
	}, [refreshThreads, section, openThreadId]);

	// NSPass postMessage handshake
	useEffect(() => {
		function onMessage(e: MessageEvent) {
			if (e.origin !== NSPASS_ORIGIN) return;
			const data = e.data;
			if (!data || typeof data !== "object") return;
			if (data.type === "nspass.cancelled") {
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
					.finally(() => setSignInBusy(false));
			}
		}
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
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
		window.open(
			`${NSPASS_URL}/authorize?${params.toString()}`,
			"nspass-authorize",
			`width=${w},height=${h},left=${left},top=${top}`,
		);
		setSignInBusy(true);
	}

	async function handleSignOut() {
		await fetch("/api/sign-out", { method: "POST" });
		window.location.reload();
	}

	function goSection(s: Section) {
		setSection(s);
		setOpenThreadId(null);
	}

	function handleVote(postId: string, idx: number) {
		if (!signedIn) {
			handleSignIn();
			return;
		}
		setVotes((v) => ({ ...v, [postId]: idx }));
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
					onOpenThread={openThread}
					signedIn={signedIn}
				/>
			</div>

			{composer === "poll" ? (
				<PollComposerSheet onClose={() => setComposer(null)} />
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
