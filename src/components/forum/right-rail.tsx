"use client";

import type { CSSProperties, ReactNode } from "react";
import { FORUM_POLLS, NS_TAGS, type TagId } from "@/lib/forum-data";
import type { UiThread } from "@/lib/forum-ui-types";
import { NSPassportGlyph, NS_COLORS, TagChip } from "./atoms";
import type { Section } from "./sidebar";

function ns_railWrap(): CSSProperties {
	return {
		padding: "0 0 0 10px",
		display: "flex",
		flexDirection: "column",
		gap: 14,
	};
}
function ns_railCard(): CSSProperties {
	return {
		padding: 14,
		borderRadius: 12,
		border: `1px solid ${NS_COLORS.hairline}`,
		background: "#fff",
	};
}
function ns_railNavyCard(): CSSProperties {
	return {
		padding: 14,
		borderRadius: 12,
		background: NS_COLORS.navy,
		color: "#fff",
	};
}

function RailTitle({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				fontSize: 10.5,
				letterSpacing: "0.16em",
				textTransform: "uppercase",
				color: NS_COLORS.faint,
				fontWeight: 600,
				marginBottom: 10,
			}}
		>
			{children}
		</div>
	);
}

export function RightRail({
	section,
	openThreadId,
	openThreadTag,
	threads,
	onOpenThread,
	signedIn,
}: {
	section: Section;
	openThreadId: string | null;
	openThreadTag?: string;
	threads: UiThread[];
	onOpenThread: (id: string) => void;
	signedIn: boolean;
}) {
	if (openThreadId) {
		const sameTag = threads
			.filter((t) => t.tag === openThreadTag && t.id !== openThreadId)
			.slice(0, 4);
		return (
			<aside style={ns_railWrap()}>
				<div style={ns_railCard()}>
					<RailTitle>
						More in{" "}
						{NS_TAGS[openThreadTag as TagId]?.label || "this tag"}
					</RailTitle>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 12,
						}}
					>
						{sameTag.length === 0 ? (
							<div style={{ fontSize: 12, color: NS_COLORS.faint }}>
								Nothing else here yet.
							</div>
						) : (
							sameTag.map((t) => (
								<button
									key={t.id}
									type="button"
									onClick={() => onOpenThread(t.id)}
									style={{
										background: "none",
										border: "none",
										cursor: "pointer",
										padding: 0,
										textAlign: "left",
									}}
								>
									<div
										style={{
											fontFamily: "var(--font-serif)",
											fontSize: 13,
											fontWeight: 500,
											color: NS_COLORS.ink,
											letterSpacing: "-0.01em",
											lineHeight: 1.3,
										}}
									>
										{t.title}
									</div>
									<div
										style={{
											fontSize: 10.5,
											color: NS_COLORS.faint,
											marginTop: 2,
										}}
									>
										{t.replies} replies · {t.time}
									</div>
								</button>
							))
						)}
					</div>
				</div>
				<div style={ns_railNavyCard()}>
					<div
						style={{
							fontSize: 10.5,
							letterSpacing: "0.14em",
							textTransform: "uppercase",
							color: "rgba(255,255,255,0.55)",
							fontWeight: 600,
							marginBottom: 6,
						}}
					>
						Your handle in this thread
					</div>
					<div
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: 14,
							color: "#fff",
						}}
					>
						{signedIn ? "derived on send" : "— sign in —"}
					</div>
					<div
						style={{
							marginTop: 6,
							fontSize: 11,
							color: "rgba(255,255,255,0.7)",
							lineHeight: 1.4,
						}}
					>
						A fresh ID. Doesn't link to anything you've posted elsewhere.
					</div>
				</div>
			</aside>
		);
	}

	if (section === "threads") {
		const hot = threads.filter((t) => t.hot).slice(0, 3);
		return (
			<aside style={ns_railWrap()}>
				<div style={ns_railCard()}>
					<RailTitle>Hot right now</RailTitle>
					<div
						style={{ display: "flex", flexDirection: "column", gap: 11 }}
					>
						{hot.length === 0 ? (
							<div style={{ fontSize: 12, color: NS_COLORS.faint }}>
								No hot threads yet.
							</div>
						) : (
							hot.map((t) => (
								<button
									key={t.id}
									type="button"
									onClick={() => onOpenThread(t.id)}
									style={{
										background: "none",
										border: "none",
										cursor: "pointer",
										padding: 0,
										textAlign: "left",
									}}
								>
									<div
										style={{
											fontFamily: "var(--font-serif)",
											fontSize: 13,
											fontWeight: 500,
											color: NS_COLORS.ink,
											letterSpacing: "-0.01em",
											lineHeight: 1.3,
										}}
									>
										{t.title}
									</div>
									<div
										style={{
											fontSize: 10.5,
											color: NS_COLORS.faint,
											marginTop: 2,
										}}
									>
										{t.replies} replies
									</div>
								</button>
							))
						)}
					</div>
				</div>
				<div style={ns_railCard()}>
					<RailTitle>Browse tags</RailTitle>
					<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
						{Object.keys(NS_TAGS).map((k) => (
							<TagChip key={k} tagId={k as TagId} />
						))}
					</div>
				</div>
				<div style={ns_railNavyCard()}>
					<div
						style={{
							fontSize: 10.5,
							letterSpacing: "0.14em",
							textTransform: "uppercase",
							color: "rgba(255,255,255,0.55)",
							fontWeight: 600,
							marginBottom: 6,
						}}
					>
						The pact
					</div>
					<div
						style={{
							fontFamily: "var(--font-serif)",
							fontSize: 14,
							fontStyle: "italic",
							color: "#fff",
							lineHeight: 1.35,
						}}
					>
						"Write like the network is reading. Because nothing else can."
					</div>
				</div>
			</aside>
		);
	}

	const closingSoon = FORUM_POLLS.filter((p) => p.closesIn).slice(0, 3);
	return (
		<aside style={ns_railWrap()}>
			{closingSoon.length > 0 ? (
				<div style={ns_railCard()}>
					<RailTitle>Closing soon</RailTitle>
					<div
						style={{ display: "flex", flexDirection: "column", gap: 10 }}
					>
						{closingSoon.map((p) => (
							<div
								key={p.id}
								style={{ fontSize: 12, color: NS_COLORS.ink, lineHeight: 1.35 }}
							>
								<div
									style={{
										fontFamily: "var(--font-serif)",
										fontWeight: 500,
									}}
								>
									{p.title}
								</div>
								<div
									style={{
										fontSize: 10.5,
										color: NS_COLORS.faint,
										marginTop: 2,
									}}
								>
									closes in {p.closesIn} · {p.voters} voted
								</div>
							</div>
						))}
					</div>
				</div>
			) : null}
			<div style={ns_railCard()}>
				<RailTitle>Trending tags</RailTitle>
				<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
					{Object.keys(NS_TAGS).map((k) => (
						<TagChip key={k} tagId={k as TagId} />
					))}
				</div>
			</div>
			<div style={ns_railNavyCard()}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 7,
						marginBottom: 6,
					}}
				>
					<NSPassportGlyph size={13} />
					<span
						style={{
							fontSize: 11,
							letterSpacing: "0.14em",
							textTransform: "uppercase",
							fontWeight: 600,
						}}
					>
						The pact
					</span>
				</div>
				<div
					style={{
						fontFamily: "var(--font-serif)",
						fontSize: 15,
						lineHeight: 1.3,
						fontStyle: "italic",
						color: "#fff",
					}}
				>
					"Vote like the network is watching. Because nothing else is."
				</div>
			</div>
		</aside>
	);
}
