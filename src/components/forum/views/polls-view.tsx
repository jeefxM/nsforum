"use client";

import { useState } from "react";
import type { Poll } from "@/lib/forum-data";
import {
	CheckBadge,
	Dot,
	LockWrap,
	type LockStyle,
	NS_COLORS,
	PlusIconSm,
	PollOptions,
	SpChat,
	SpVoters,
	TagChip,
	ns_primaryBtnCompact,
} from "../atoms";
import { SortTabs, ViewHeader } from "../shared";

type Density = "compact" | "regular";

export function PollsView({
	signedIn,
	lockStyle,
	density,
	activeCat,
	polls,
	votes,
	showCounts,
	onVote,
	onSignIn,
	onNewPoll,
}: {
	signedIn: boolean;
	lockStyle: LockStyle;
	density: Density;
	activeCat: string;
	polls: Poll[];
	votes: Record<string, number>;
	showCounts: boolean;
	onVote: (postId: string, idx: number) => void;
	onSignIn: () => void;
	onNewPoll: () => void;
}) {
	const [sort, setSort] = useState<"hot" | "new" | "closing">("hot");
	const filtered =
		activeCat === "all" ? polls : polls.filter((p) => p.tag === activeCat);

	const visible = filtered.slice(0, 1);
	const gated = filtered.slice(1);
	const empty = filtered.length === 0;

	return (
		<>
			<ViewHeader
				eyebrow="The NS Forum · Polls"
				title="Vote anonymously."
				body={
					<>
						Every vote is a zero-knowledge proof of your NS membership — never
						your handle.{" "}
						<span
							style={{
								fontFamily: "var(--font-serif)",
								fontStyle: "italic",
								color: NS_COLORS.ink,
							}}
						>
							Results update in real time.
						</span>
					</>
				}
				action={
					<button
						type="button"
						onClick={onNewPoll}
						style={ns_primaryBtnCompact()}
					>
						<PlusIconSm /> New poll
					</button>
				}
			/>

			<SortTabs
				tabs={[
					{ id: "hot", label: "Hot" },
					{ id: "new", label: "New" },
					{ id: "closing", label: "Closing soon" },
				]}
				value={sort}
				onChange={setSort}
				right={
					<>
						<strong style={{ color: NS_COLORS.muted, fontWeight: 600 }}>
							{filtered.length}
						</strong>{" "}
						open {filtered.length === 1 ? "poll" : "polls"}
					</>
				}
			/>

			{empty ? (
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
					{signedIn
						? "No polls yet — ask the network something."
						: "Sign in to see and start polls."}
					{signedIn ? (
						<div>
							<button
								type="button"
								onClick={onNewPoll}
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
								+ New poll
							</button>
						</div>
					) : null}
				</div>
			) : (
				<div
					style={{
						border: `1px solid ${NS_COLORS.hairline}`,
						borderRadius: 14,
						background: "#fff",
						overflow: "hidden",
					}}
				>
					{visible.map((p, i) => (
						<PollRow
							key={p.id}
							post={p}
							density={density}
							voted={votes[p.id] ?? null}
							onVote={(idx) => onVote(p.id, idx)}
							showCounts={showCounts}
							isFirst={i === 0}
						/>
					))}
					{gated.length > 0 ? (
						<LockWrap
							locked={!signedIn}
							lockStyle={lockStyle}
							onSignIn={onSignIn}
							height={700}
						>
							<div>
								{gated.map((p) => (
									<PollRow
										key={p.id}
										post={p}
										density={density}
										voted={votes[p.id] ?? null}
										onVote={(idx) => onVote(p.id, idx)}
										showCounts={showCounts}
										isFirst={false}
									/>
								))}
							</div>
						</LockWrap>
					) : null}
				</div>
			)}
		</>
	);
}

function PollRow({
	post,
	density,
	voted,
	onVote,
	showCounts,
	isFirst,
}: {
	post: Poll;
	density: Density;
	voted: number | null;
	onVote: (idx: number) => void;
	showCounts: boolean;
	isFirst: boolean;
}) {
	const padding = density === "compact" ? "14px 18px" : "18px 20px";
	const totalVotes =
		post.options.reduce((s, o) => s + o.votes, 0) + (voted != null ? 1 : 0);
	const maxIdx = post.options.reduce(
		(m, o, i, a) => (o.votes >= a[m].votes ? i : m),
		0,
	);
	const showResults = voted != null || showCounts || !!post.closed;
	const maxV = Math.max(...post.options.map((o) => o.votes), 1);

	return (
		<div
			style={{
				padding,
				borderTop: isFirst ? "none" : `1px solid ${NS_COLORS.hairline}`,
				display: "flex",
				gap: 16,
				alignItems: "flex-start",
				background: post.pinned ? "#fbfcff" : "#fff",
			}}
		>
			<div
				style={{
					width: 78,
					padding: 10,
					borderRadius: 10,
					flexShrink: 0,
					background: NS_COLORS.bg,
					border: `1px solid ${NS_COLORS.hairline}`,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 8,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "flex-end",
						height: 36,
						gap: 3,
					}}
				>
					{post.options.map((o, i) => {
						const v = o.votes + (voted === i ? 1 : 0);
						const h = Math.max(
							4,
							(v / Math.max(maxV, voted === i ? maxV + 1 : maxV)) * 36,
						);
						return (
							<span
								key={i}
								style={{
									width: 8,
									height: h,
									borderRadius: 2,
									background:
										i === maxIdx && showResults
											? NS_COLORS.navy
											: "#cbd0dd",
									transition: "height 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
								}}
							/>
						);
					})}
				</div>
				<div
					style={{
						fontSize: 10,
						color: NS_COLORS.faint,
						letterSpacing: "0.04em",
						textAlign: "center",
						lineHeight: 1.1,
					}}
				>
					{totalVotes} {totalVotes === 1 ? "vote" : "votes"}
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
					{post.pinned ? (
						<span
							style={{
								fontSize: 10,
								padding: "2px 7px",
								borderRadius: 4,
								background: NS_COLORS.navy,
								color: "#fff",
								letterSpacing: "0.1em",
								textTransform: "uppercase",
								fontWeight: 600,
							}}
						>
							Pinned
						</span>
					) : null}
					<TagChip tagId={post.tag} />
					<span style={{ fontSize: 11, color: NS_COLORS.faint }}>
						posted{" "}
						<span style={{ fontFamily: "var(--font-mono)" }}>
							{post.authorHandle}
						</span>{" "}
						· {post.time}
					</span>
				</div>
				<h3
					style={{
						margin: 0,
						fontFamily: "var(--font-serif)",
						fontSize: density === "compact" ? 17 : 19,
						fontWeight: 600,
						color: NS_COLORS.ink,
						letterSpacing: "-0.018em",
						lineHeight: 1.2,
					}}
				>
					{post.title}
				</h3>
				{post.body && density !== "compact" ? (
					<p
						style={{
							margin: "6px 0 0",
							fontSize: 13,
							color: NS_COLORS.muted,
							lineHeight: 1.5,
						}}
					>
						{post.body}
					</p>
				) : null}

				<div style={{ marginTop: 12 }}>
					<PollOptions
						post={post}
						voted={voted}
						onVote={onVote}
						showCounts={showCounts || !!post.closed}
					/>
				</div>

				<div
					style={{
						marginTop: 12,
						display: "flex",
						alignItems: "center",
						gap: 14,
						fontSize: 11.5,
						color: NS_COLORS.muted,
					}}
				>
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 5,
						}}
					>
						<SpVoters />{" "}
						<strong
							style={{
								color: NS_COLORS.ink,
								fontVariantNumeric: "tabular-nums",
							}}
						>
							{totalVotes}
						</strong>{" "}
						voted
					</span>
					{post.closesIn ? (
						<span
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 5,
							}}
						>
							<Dot color="#dde0ea" />
							closes in {post.closesIn}
						</span>
					) : null}
					{voted != null ? (
						<span
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 4,
								color: NS_COLORS.green,
							}}
						>
							<CheckBadge size={11} />
							your vote counted
						</span>
					) : null}
					<div style={{ flex: 1 }} />
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 5,
						}}
					>
						<SpChat /> <strong style={{ color: NS_COLORS.ink }}>
							{post.comments}
						</strong>{" "}
						replies
					</span>
				</div>
			</div>
		</div>
	);
}
