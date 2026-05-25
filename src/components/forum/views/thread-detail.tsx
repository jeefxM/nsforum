"use client";

import { type CSSProperties, useEffect, useState } from "react";
import type { UiComment, UiThread } from "@/lib/forum-ui-types";
import {
	BadgePinned,
	BellIcon,
	Dot,
	LockWrap,
	type LockStyle,
	NS_COLORS,
	ZeroPassportGlyph,
	ShareIcon,
	TagChip,
} from "../atoms";

function ns_replyAction(): CSSProperties {
	return {
		background: "none",
		border: "none",
		cursor: "pointer",
		fontSize: 11.5,
		color: NS_COLORS.muted,
		padding: 0,
		fontFamily: "inherit",
	};
}

export function ThreadDetail({
	threadId,
	signedIn,
	lockStyle,
	onBack,
	onSignIn,
}: {
	threadId: string;
	signedIn: boolean;
	lockStyle: LockStyle;
	onBack: () => void;
	onSignIn: () => void;
}) {
	const [thread, setThread] = useState<UiThread | null>(null);
	const [comments, setComments] = useState<UiComment[]>([]);
	const [loading, setLoading] = useState(true);
	const [draft, setDraft] = useState("");
	const [posting, setPosting] = useState(false);

	async function refresh() {
		const r = await fetch(`/api/threads/${threadId}`, { cache: "no-store" });
		if (!r.ok) {
			setLoading(false);
			return;
		}
		const data = await r.json();
		setThread(data.thread);
		setComments(data.comments ?? []);
		setLoading(false);
	}

	useEffect(() => {
		setLoading(true);
		refresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [threadId]);

	async function submit() {
		if (!signedIn) {
			onSignIn();
			return;
		}
		const body = draft.trim();
		if (!body || posting) return;
		setPosting(true);
		try {
			const r = await fetch("/api/comments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					parent_type: "thread",
					parent_id: threadId,
					body,
				}),
			});
			if (r.ok) {
				setDraft("");
				await refresh();
			}
		} finally {
			setPosting(false);
		}
	}

	if (loading) {
		return (
			<div
				style={{
					padding: "40px 24px",
					textAlign: "center",
					color: NS_COLORS.muted,
					fontSize: 13.5,
				}}
			>
				Loading thread…
			</div>
		);
	}

	if (!thread) {
		return (
			<div
				style={{
					padding: "40px 24px",
					textAlign: "center",
					color: NS_COLORS.muted,
					fontSize: 13.5,
				}}
			>
				Thread not found.
				<div>
					<button
						type="button"
						onClick={onBack}
						style={{
							marginTop: 12,
							background: "none",
							border: "none",
							cursor: "pointer",
							color: NS_COLORS.ink,
							textDecoration: "underline",
						}}
					>
						Back to threads
					</button>
				</div>
			</div>
		);
	}

	return (
		<article>
			<button
				type="button"
				onClick={onBack}
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: 6,
					background: "none",
					border: "none",
					cursor: "pointer",
					fontSize: 12.5,
					color: NS_COLORS.muted,
					padding: 0,
					marginBottom: 14,
				}}
			>
				<span style={{ fontSize: 14 }}>←</span> Back to threads
			</button>

			<div
				style={{
					background: "#fff",
					border: `1px solid ${NS_COLORS.hairline}`,
					borderRadius: 14,
					padding: "24px 26px",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						flexWrap: "wrap",
						marginBottom: 10,
					}}
				>
					{thread.pinned ? <BadgePinned label="Pinned" /> : null}
					{thread.hot ? <BadgePinned label="Hot" tone="hot" /> : null}
					<TagChip tagId={thread.tag} />
					<span style={{ fontSize: 11.5, color: NS_COLORS.faint }}>
						opened by{" "}
						<span style={{ fontFamily: "var(--font-mono)" }}>
							{thread.authorHandle}
						</span>{" "}
						· {thread.time}
					</span>
				</div>
				<h1
					style={{
						margin: 0,
						fontFamily: "var(--font-serif)",
						fontSize: 28,
						fontWeight: 700,
						letterSpacing: "-0.022em",
						color: NS_COLORS.ink,
						lineHeight: 1.15,
					}}
				>
					{thread.title}
				</h1>

				<div
					style={{
						marginTop: 14,
						fontSize: 15,
						color: NS_COLORS.ink,
						lineHeight: 1.6,
						whiteSpace: "pre-wrap",
					}}
				>
					{thread.body}
				</div>

				<div
					style={{
						marginTop: 18,
						paddingTop: 14,
						borderTop: `1px dashed ${NS_COLORS.hairline}`,
						display: "flex",
						alignItems: "center",
						gap: 14,
						fontSize: 11.5,
						color: NS_COLORS.muted,
					}}
				>
					<span>
						<strong style={{ color: NS_COLORS.ink }}>{thread.replies}</strong>{" "}
						replies
					</span>
					<div style={{ flex: 1 }} />
					<button
						type="button"
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							fontSize: 12,
							color: NS_COLORS.muted,
							display: "inline-flex",
							alignItems: "center",
							gap: 5,
						}}
					>
						<ShareIcon /> share
					</button>
					<button
						type="button"
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							fontSize: 12,
							color: NS_COLORS.muted,
							display: "inline-flex",
							alignItems: "center",
							gap: 5,
						}}
					>
						<BellIcon /> watch
					</button>
				</div>
			</div>

			<div
				style={{
					marginTop: 18,
					marginBottom: 8,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div
					style={{
						fontSize: 11,
						letterSpacing: "0.16em",
						textTransform: "uppercase",
						color: NS_COLORS.faint,
						fontWeight: 600,
					}}
				>
					{thread.replies} replies
				</div>
				<div style={{ display: "flex", gap: 4 }}>
					{["Top", "Newest", "Oldest"].map((l, i) => (
						<button
							key={l}
							type="button"
							style={{
								background: i === 0 ? "#fff" : "transparent",
								border:
									i === 0
										? `1px solid ${NS_COLORS.hairline}`
										: "1px solid transparent",
								padding: "4px 9px",
								borderRadius: 6,
								cursor: "pointer",
								fontSize: 11.5,
								color: i === 0 ? NS_COLORS.ink : NS_COLORS.muted,
								fontWeight: i === 0 ? 600 : 400,
							}}
						>
							{l}
						</button>
					))}
				</div>
			</div>

			<LockWrap
				locked={!signedIn}
				lockStyle={lockStyle}
				onSignIn={onSignIn}
				height={400}
			>
				{comments.length === 0 ? (
					<div
						style={{
							padding: "32px 20px",
							border: `1px solid ${NS_COLORS.hairline}`,
							borderRadius: 14,
							background: "#fff",
							textAlign: "center",
							color: NS_COLORS.muted,
							fontSize: 13,
						}}
					>
						No replies yet. Be the first.
					</div>
				) : (
					<div
						style={{
							background: "#fff",
							border: `1px solid ${NS_COLORS.hairline}`,
							borderRadius: 14,
							overflow: "hidden",
						}}
					>
						{comments.map((c, i) => (
							<ReplyRow key={i} reply={c} isFirst={i === 0} />
						))}
					</div>
				)}
			</LockWrap>

			<div
				style={{
					marginTop: 18,
					background: "#fff",
					border: `1px solid ${NS_COLORS.hairline}`,
					borderRadius: 14,
					padding: 18,
				}}
			>
				<div
					style={{
						fontSize: 10.5,
						letterSpacing: "0.16em",
						textTransform: "uppercase",
						color: NS_COLORS.faint,
						fontWeight: 600,
						marginBottom: 8,
					}}
				>
					Reply · anonymous
				</div>
				<textarea
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					placeholder={
						signedIn
							? "Add to the thread…"
							: "Sign in with NS to reply anonymously"
					}
					rows={3}
					disabled={!signedIn}
					style={{
						width: "100%",
						minHeight: 76,
						padding: 12,
						fontSize: 14,
						borderRadius: 10,
						border: `1px solid ${NS_COLORS.hairline}`,
						background: signedIn ? "#fff" : NS_COLORS.bg,
						color: NS_COLORS.ink,
						outline: "none",
						resize: "vertical",
						fontFamily: "inherit",
						lineHeight: 1.5,
					}}
				/>
				<div
					style={{
						marginTop: 10,
						display: "flex",
						alignItems: "center",
						gap: 12,
					}}
				>
					<span
						style={{
							fontSize: 11.5,
							color: NS_COLORS.muted,
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
						}}
					>
						<ZeroPassportGlyph size={12} /> Posting as a fresh handle for this
						thread
					</span>
					<div style={{ flex: 1 }} />
					<button
						type="button"
						onClick={submit}
						disabled={!signedIn || posting}
						style={{
							height: 36,
							padding: "0 16px",
							borderRadius: 999,
							background: signedIn ? NS_COLORS.navy : "#cbd0dd",
							color: "#fff",
							border: "none",
							fontSize: 13,
							fontWeight: 500,
							cursor: signedIn && !posting ? "pointer" : "not-allowed",
							opacity: posting ? 0.7 : 1,
						}}
					>
						{posting ? "Posting…" : "Reply"}
					</button>
				</div>
			</div>
		</article>
	);
}

function ReplyRow({
	reply,
	isFirst,
}: { reply: UiComment; isFirst: boolean }) {
	return (
		<div
			style={{
				padding: "16px 20px",
				borderTop: isFirst ? "none" : `1px solid ${NS_COLORS.hairline}`,
				display: "flex",
				gap: 14,
			}}
		>
			<div
				style={{
					width: 34,
					height: 34,
					borderRadius: 999,
					flexShrink: 0,
					background: "linear-gradient(135deg, #0a0f1f, #2a3658)",
					color: "#fff",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: 11,
					fontFamily: "var(--font-mono)",
				}}
			>
				{reply.handle.slice(-2).toUpperCase()}
			</div>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{ fontSize: 11.5, color: NS_COLORS.faint, marginBottom: 4 }}
				>
					<span
						style={{
							fontFamily: "var(--font-mono)",
							color: NS_COLORS.muted,
							fontSize: 11.5,
						}}
					>
						{reply.handle}
					</span>
					<span> · {reply.time}</span>
				</div>
				<div
					style={{
						fontSize: 14,
						color: NS_COLORS.ink,
						lineHeight: 1.55,
						whiteSpace: "pre-wrap",
					}}
				>
					{reply.body}
				</div>
				<div
					style={{
						marginTop: 10,
						display: "flex",
						alignItems: "center",
						gap: 14,
						fontSize: 11.5,
						color: NS_COLORS.muted,
					}}
				>
					<button type="button" style={ns_replyAction()}>
						↑ upvote
					</button>
					<button type="button" style={ns_replyAction()}>
						↳ reply
					</button>
					<button type="button" style={ns_replyAction()}>
						flag
					</button>
				</div>
			</div>
		</div>
	);
}
