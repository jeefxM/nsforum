"use client";

import type { CSSProperties } from "react";
import { FORUM_CATEGORIES } from "@/lib/forum-data";
import { ZeroPassportGlyph, NS_COLORS, PlusIcon } from "./atoms";

export type Section = "polls" | "threads";

function ns_sidebarPrimary(): CSSProperties {
	return {
		width: "100%",
		height: 38,
		marginBottom: 6,
		background: NS_COLORS.navy,
		color: "#fff",
		border: "none",
		borderRadius: 10,
		fontSize: 13,
		fontWeight: 500,
		cursor: "pointer",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: 7,
		letterSpacing: "-0.005em",
	};
}

export function Sidebar({
	section,
	onSection,
	activeCat,
	onCat,
	signedIn,
	onSignIn,
	onNewPoll,
	onNewThread,
}: {
	section: Section;
	onSection: (s: Section) => void;
	activeCat: string;
	onCat: (id: string) => void;
	signedIn: boolean;
	onSignIn: () => void;
	onNewPoll: () => void;
	onNewThread: () => void;
}) {
	const sections: { id: Section; label: string }[] = [
		{ id: "polls", label: "Polls" },
		{ id: "threads", label: "Threads" },
	];

	return (
		<aside style={{ padding: "0 8px 0 0" }}>
			<div
				style={{
					display: "flex",
					gap: 4,
					padding: 4,
					background: "#fff",
					border: `1px solid ${NS_COLORS.hairline}`,
					borderRadius: 12,
					marginBottom: 14,
				}}
			>
				{sections.map((s) => {
					const on = s.id === section;
					return (
						<button
							key={s.id}
							type="button"
							onClick={() => onSection(s.id)}
							style={{
								flex: 1,
								height: 30,
								borderRadius: 8,
								background: on ? NS_COLORS.navy : "transparent",
								color: on ? "#fff" : NS_COLORS.muted,
								border: "none",
								cursor: "pointer",
								fontSize: 12.5,
								fontWeight: on ? 600 : 500,
								letterSpacing: "-0.005em",
							}}
						>
							{s.label}
						</button>
					);
				})}
			</div>

			{section === "threads" ? (
				<button type="button" onClick={onNewThread} style={ns_sidebarPrimary()}>
					<PlusIcon /> New thread
				</button>
			) : (
				<button type="button" onClick={onNewPoll} style={ns_sidebarPrimary()}>
					<PlusIcon /> New poll
				</button>
			)}

			<div
				style={{
					fontSize: 10.5,
					letterSpacing: "0.18em",
					textTransform: "uppercase",
					color: NS_COLORS.faint,
					fontWeight: 600,
					marginBottom: 8,
					paddingLeft: 10,
					marginTop: 16,
				}}
			>
				Categories
			</div>
			<nav
				style={{ display: "flex", flexDirection: "column", gap: 1 }}
			>
				{FORUM_CATEGORIES.map((c) => {
					const on = c.id === activeCat;
					return (
						<button
							key={c.id}
							type="button"
							onClick={() => onCat(c.id)}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								padding: "7px 10px",
								borderRadius: 8,
								background: on ? "#fff" : "transparent",
								border: on
									? `1px solid ${NS_COLORS.hairline}`
									: "1px solid transparent",
								cursor: "pointer",
								fontSize: 13,
								color: on ? NS_COLORS.ink : NS_COLORS.muted,
								fontWeight: on ? 500 : 400,
								textAlign: "left",
							}}
						>
							<span>{c.label}</span>
							<span
								style={{
									fontSize: 11,
									color: NS_COLORS.faint,
									fontFamily: "var(--font-mono)",
								}}
							>
								{c.count}
							</span>
						</button>
					);
				})}
			</nav>

			<div
				style={{
					marginTop: 22,
					padding: 14,
					borderRadius: 12,
					border: `1px solid ${NS_COLORS.hairline}`,
					background: "#fff",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						marginBottom: 6,
					}}
				>
					<ZeroPassportGlyph size={13} />
					<span
						style={{ fontSize: 11.5, color: NS_COLORS.ink, fontWeight: 600 }}
					>
						ZeroPass
					</span>
				</div>
				{signedIn ? (
					<>
						<div style={{ fontSize: 11.5, color: NS_COLORS.muted }}>
							Verified anonymously.{" "}
							<span
								style={{
									fontFamily: "var(--font-serif)",
									fontStyle: "italic",
									color: NS_COLORS.ink,
								}}
							>
								Nothing shared.
							</span>
						</div>
					</>
				) : (
					<>
						<div style={{ fontSize: 11.5, color: NS_COLORS.muted }}>
							Sign in to vote, reply or post.{" "}
							<span
								style={{
									fontFamily: "var(--font-serif)",
									fontStyle: "italic",
									color: NS_COLORS.ink,
								}}
							>
								NS members only.
							</span>
						</div>
						<button
							type="button"
							onClick={onSignIn}
							style={{
								marginTop: 10,
								width: "100%",
								height: 32,
								background: "#fff",
								border: `1px solid ${NS_COLORS.hairline}`,
								borderRadius: 999,
								fontSize: 12,
								fontWeight: 500,
								color: NS_COLORS.ink,
								cursor: "pointer",
							}}
						>
							Sign in with NS
						</button>
					</>
				)}
			</div>
		</aside>
	);
}
