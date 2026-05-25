"use client";

import { useState } from "react";
import type { UiThread } from "@/lib/forum-ui-types";
import {
	BadgePinned,
	Dot,
	LockWrap,
	type LockStyle,
	NS_COLORS,
	ZeroPassportGlyph,
	PlusIconSm,
	TagChip,
	ns_primaryBtnCompact,
} from "../atoms";
import { SortTabs, ViewHeader } from "../shared";

type Density = "compact" | "regular";

export function ThreadsView({
	signedIn,
	lockStyle,
	density,
	activeCat,
	threads,
	loading,
	onOpenThread,
	onSignIn,
	onNewThread,
}: {
	signedIn: boolean;
	lockStyle: LockStyle;
	density: Density;
	activeCat: string;
	threads: UiThread[];
	loading: boolean;
	onOpenThread: (id: string) => void;
	onSignIn: () => void;
	onNewThread: () => void;
}) {
	const [sort, setSort] = useState<
		"hot" | "new" | "unanswered" | "top-week"
	>("hot");

	let filtered = threads;
	if (activeCat !== "all") filtered = filtered.filter((t) => t.tag === activeCat);

	const pinned = filtered.filter((t) => t.pinned || t.pinnedWeekly);
	const rest = filtered.filter((t) => !(t.pinned || t.pinnedWeekly));
	const ordered = [...pinned, ...rest];
	const visible = ordered.slice(0, 2);
	const gated = ordered.slice(2);

	return (
		<>
			<ViewHeader
				eyebrow="The NS Forum · Threads"
				title="Start a conversation."
				body={
					<>
						Long-form, anonymous discussion between NS members.{" "}
						<span
							style={{
								fontFamily: "var(--font-serif)",
								fontStyle: "italic",
								color: NS_COLORS.ink,
							}}
						>
							Per-thread handles never repeat across threads.
						</span>
					</>
				}
				action={
					<button
						type="button"
						onClick={onNewThread}
						style={ns_primaryBtnCompact()}
					>
						<PlusIconSm /> New thread
					</button>
				}
			/>

			<SortTabs
				tabs={[
					{ id: "hot", label: "Hot" },
					{ id: "new", label: "New" },
					{ id: "unanswered", label: "Unanswered" },
					{ id: "top-week", label: "Top · week" },
				]}
				value={sort}
				onChange={setSort}
				right={
					<>
						<strong style={{ color: NS_COLORS.muted, fontWeight: 600 }}>
							{filtered.length}
						</strong>{" "}
						threads
					</>
				}
			/>

			{loading ? (
				<EmptyCard text="Loading threads…" />
			) : ordered.length === 0 ? (
				<EmptyCard
					text={
						signedIn
							? "No threads yet — start the first one."
							: "Sign in to see and start threads."
					}
					action={
						signedIn ? (
							<button
								type="button"
								onClick={onNewThread}
								style={{
									marginTop: 12,
									height: 36,
									padding: "0 16px",
									borderRadius: 999,
									background: NS_COLORS.navy,
									color: "#fff",
									border: "none",
									fontSize: 12.5,
									fontWeight: 500,
									cursor: "pointer",
								}}
							>
								+ New thread
							</button>
						) : null
					}
				/>
			) : (
				<div
					style={{
						border: `1px solid ${NS_COLORS.hairline}`,
						borderRadius: 14,
						background: "#fff",
						overflow: "hidden",
					}}
				>
					{visible.map((t, i) => (
						<ThreadRow
							key={t.id}
							thread={t}
							density={density}
							onOpen={() => onOpenThread(t.id)}
							isFirst={i === 0}
						/>
					))}
					{gated.length > 0 ? (
						<LockWrap
							locked={!signedIn}
							lockStyle={lockStyle}
							onSignIn={onSignIn}
							height={650}
						>
							<div>
								{gated.map((t) => (
									<ThreadRow
										key={t.id}
										thread={t}
										density={density}
										onOpen={() => onOpenThread(t.id)}
										isFirst={false}
									/>
								))}
							</div>
						</LockWrap>
					) : null}
				</div>
			)}

			<div
				style={{
					marginTop: 24,
					padding: "14px 18px",
					background: "#fff",
					border: `1px solid ${NS_COLORS.hairline}`,
					borderRadius: 12,
					display: "flex",
					alignItems: "center",
					gap: 14,
				}}
			>
				<div
					style={{
						width: 36,
						height: 36,
						borderRadius: 999,
						background: NS_COLORS.bg,
						border: `1px solid ${NS_COLORS.hairline}`,
						flexShrink: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<ZeroPassportGlyph size={15} />
				</div>
				<div style={{ flex: 1 }}>
					<div
						style={{
							fontSize: 12.5,
							fontWeight: 600,
							color: NS_COLORS.ink,
							letterSpacing: "-0.005em",
						}}
					>
						Thread etiquette
					</div>
					<div
						style={{ fontSize: 11.5, color: NS_COLORS.muted, marginTop: 2 }}
					>
						Anonymous doesn't mean reckless. Be specific. Don't dox cohort-mates.{" "}
						<span
							style={{
								fontFamily: "var(--font-serif)",
								fontStyle: "italic",
								color: NS_COLORS.ink,
							}}
						>
							Bring receipts.
						</span>
					</div>
				</div>
			</div>
		</>
	);
}

function EmptyCard({
	text,
	action,
}: { text: string; action?: React.ReactNode }) {
	return (
		<div
			style={{
				padding: "40px 24px",
				border: `1px solid ${NS_COLORS.hairline}`,
				borderRadius: 14,
				background: "#fff",
				textAlign: "center",
				color: NS_COLORS.muted,
				fontSize: 13.5,
			}}
		>
			{text}
			{action}
		</div>
	);
}

function ThreadRow({
	thread,
	density,
	onOpen,
	isFirst,
}: {
	thread: UiThread;
	density: Density;
	onOpen: () => void;
	isFirst: boolean;
}) {
	const padding = density === "compact" ? "14px 18px" : "18px 22px";
	const pinned = thread.pinned || thread.pinnedWeekly;

	return (
		<button
			type="button"
			onClick={onOpen}
			style={{
				width: "100%",
				textAlign: "left",
				padding,
				border: "none",
				cursor: "pointer",
				background: pinned ? "#fbfcff" : "#fff",
				borderTop: isFirst ? "none" : `1px solid ${NS_COLORS.hairline}`,
				display: "flex",
				gap: 18,
				alignItems: "flex-start",
				transition: "background 0.15s",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.background = "#fbfcff";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = pinned ? "#fbfcff" : "#fff";
			}}
		>
			<div
				style={{
					width: 72,
					padding: 10,
					borderRadius: 10,
					flexShrink: 0,
					background: NS_COLORS.bg,
					border: `1px solid ${NS_COLORS.hairline}`,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 2,
				}}
			>
				<div
					style={{
						fontFamily: "var(--font-serif)",
						fontSize: 22,
						fontWeight: 700,
						color: NS_COLORS.ink,
						lineHeight: 1,
						letterSpacing: "-0.02em",
					}}
				>
					{thread.replies}
				</div>
				<div
					style={{
						fontSize: 10,
						color: NS_COLORS.faint,
						letterSpacing: "0.06em",
					}}
				>
					replies
				</div>
			</div>

			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						flexWrap: "wrap",
						marginBottom: 6,
					}}
				>
					{thread.pinned ? <BadgePinned label="Pinned" /> : null}
					{thread.pinnedWeekly ? (
						<BadgePinned label="Weekly" tone="weekly" />
					) : null}
					{thread.hot ? <BadgePinned label="Hot" tone="hot" /> : null}
					<TagChip tagId={thread.tag} />
					<span style={{ fontSize: 11, color: NS_COLORS.faint }}>
						opened by{" "}
						<span style={{ fontFamily: "var(--font-mono)" }}>
							{thread.authorHandle}
						</span>{" "}
						· {thread.time}
					</span>
				</div>
				<div
					style={{
						fontFamily: "var(--font-serif)",
						fontSize: density === "compact" ? 18 : 20,
						fontWeight: 600,
						color: NS_COLORS.ink,
						letterSpacing: "-0.018em",
						lineHeight: 1.2,
					}}
				>
					{thread.title}
				</div>
				{thread.body && density !== "compact" ? (
					<p
						style={{
							margin: "6px 0 0",
							fontSize: 13,
							color: NS_COLORS.muted,
							lineHeight: 1.5,
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
							overflow: "hidden",
						}}
					>
						{thread.body}
					</p>
				) : null}

				{thread.lastReply ? (
					<div
						style={{
							marginTop: 10,
							padding: "8px 12px",
							borderRadius: 8,
							background: NS_COLORS.bg,
							border: `1px solid ${NS_COLORS.hairline}`,
							display: "flex",
							alignItems: "center",
							gap: 10,
							fontSize: 11.5,
							color: NS_COLORS.muted,
						}}
					>
						<div
							style={{
								width: 22,
								height: 22,
								borderRadius: 999,
								background: "linear-gradient(135deg, #0a0f1f, #2a3658)",
								color: "#fff",
								flexShrink: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 9,
								fontFamily: "var(--font-mono)",
							}}
						>
							{thread.lastReply.handle.slice(-2).toUpperCase()}
						</div>
						<span
							style={{
								fontFamily: "var(--font-mono)",
								color: NS_COLORS.ink,
								fontSize: 11.5,
							}}
						>
							{thread.lastReply.handle}
						</span>
						<Dot color="#dde0ea" />
						<span>{thread.lastReply.time}</span>
						<div style={{ flex: 1 }} />
						<span
							style={{
								fontSize: 11,
								color: NS_COLORS.muted,
								fontWeight: 500,
							}}
						>
							last reply →
						</span>
					</div>
				) : null}
			</div>
		</button>
	);
}
