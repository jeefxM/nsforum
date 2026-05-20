"use client";

import type { CSSProperties, ReactNode } from "react";
import { NS_TAGS, type Poll, type TagId } from "@/lib/forum-data";

export const NS_COLORS = {
	bg: "#fbfbfd",
	ink: "#0a0f1f",
	muted: "#5a627a",
	faint: "#8a92ac",
	hairline: "#e8e9ef",
	navy: "#061329",
	navyHov: "#0d1f3b",
	green: "#10b981",
	card: "#ffffff",
} as const;

// ─── Logo + glyph ───────────────────────────────────────────────

export function NSLogo({ size = 22 }: { size?: number }) {
	return (
		<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
			<svg
				width={size * 0.85}
				height={size}
				viewBox="0 0 184 254"
				fill="none"
				aria-hidden
			>
				<path
					d="M8.05 24.55c5.58-.27 12.75-.06 18.44-.07h142.16c4.51 0 8.04.18 11.46 3.55 4.45 4.39 3.67 10.62 3.67 16.4l-.09 70.22c-9.55 2.13-17.65 8.06-19.64 17.98-2.86 14.27 5.7 25.2 19.51 27.98l-.06 53.3v15.89c0 3.45.08 7.63-.24 11.01-1.74 15.19-18.8 12.52-29.75 12.48L26.99 253.26c-6.33 0-15.56.94-20.83-2.62-2.91-1.93-4.93-4.94-5.62-8.37-.82-4.3-.48-19.09-.46-24.04l.11-42.83.02-124.34c0-5.38.01-10.77.03-16.15.03-5.55 2.08-9.25 7.8-10.37Z"
					fill="#061329"
				/>
				<path
					d="M82.13 95.58c2.97-.17 18.51-.76 20.01.58 1.57 3.11-.27 27.24 1.12 27.92 3.31 1.6 25.51-.88 27.85 1.39.63 2.16.7 18.9-.27 20.76-2.36 1.14-22.97.07-27.87.81-.82 6.19.2 14.1-.18 20.41-.14 2.3.23 4.79-.31 7.07-.2.85-.57.89-1.24 1.23-4.06.02-17.03.35-20.36-.38-.49-2.81-.35-7.63-.35-10.59.05-5.95.04-11.9-.03-17.85-5.28-.55-24.66.44-27.99-.66-1.49-1.3-1.18-19.36-.26-21.08 1.94-1.13 24.01-.49 28.21-.76.41-9.09-.38-18.59.34-27.67.05-.66.78-.88 1.33-1.17Z"
					fill="#fff"
				/>
				<path
					d="M156.9.1c12.5-1.36 10.34 11.75 10.15 20.06-14.88.14-29.76.18-44.64.1L34.7 20.28c-3.83-.03-7.73.13-11.54.04C31.69 18.02 43.67 16.26 52.41 14.97L87.02 9.94 131.81 3.65C139.83 2.51 148.97.9 156.9.1Z"
					fill="#061329"
				/>
			</svg>
			<span
				style={{
					fontFamily: "var(--font-serif)",
					fontWeight: 700,
					fontSize: size * 0.78,
					letterSpacing: "-0.02em",
					color: NS_COLORS.ink,
					lineHeight: 1,
				}}
			>
				NSForum
			</span>
		</span>
	);
}

export function NSPassportGlyph({ size = 16 }: { size?: number }) {
	return (
		<svg
			width={size * 0.85}
			height={size}
			viewBox="0 0 184 254"
			fill="none"
			aria-hidden
		>
			<path
				d="M8.05 24.55c5.58-.27 12.75-.06 18.44-.07h142.16c4.51 0 8.04.18 11.46 3.55 4.45 4.39 3.67 10.62 3.67 16.4l-.09 70.22c-9.55 2.13-17.65 8.06-19.64 17.98-2.86 14.27 5.7 25.2 19.51 27.98l-.06 53.3v15.89c0 3.45.08 7.63-.24 11.01-1.74 15.19-18.8 12.52-29.75 12.48L26.99 253.26c-6.33 0-15.56.94-20.83-2.62-2.91-1.93-4.93-4.94-5.62-8.37-.82-4.3-.48-19.09-.46-24.04l.11-42.83.02-124.34c0-5.38.01-10.77.03-16.15.03-5.55 2.08-9.25 7.8-10.37Z"
				fill="#fff"
			/>
			<path
				d="M82.13 95.58c2.97-.17 18.51-.76 20.01.58 1.57 3.11-.27 27.24 1.12 27.92 3.31 1.6 25.51-.88 27.85 1.39.63 2.16.7 18.9-.27 20.76-2.36 1.14-22.97.07-27.87.81-.82 6.19.2 14.1-.18 20.41-.14 2.3.23 4.79-.31 7.07-.2.85-.57.89-1.24 1.23-4.06.02-17.03.35-20.36-.38-.49-2.81-.35-7.63-.35-10.59.05-5.95.04-11.9-.03-17.85-5.28-.55-24.66.44-27.99-.66-1.49-1.3-1.18-19.36-.26-21.08 1.94-1.13 24.01-.49 28.21-.76.41-9.09-.38-18.59.34-27.67.05-.66.78-.88 1.33-1.17Z"
				fill="#061329"
			/>
		</svg>
	);
}

// ─── Chips + dots + badges ──────────────────────────────────────

export function TagChip({
	tagId,
	size = "sm",
}: { tagId: TagId | string; size?: "sm" | "md" }) {
	const t = (NS_TAGS as Record<string, { label: string; bg: string; fg: string }>)[tagId] ?? {
		label: tagId,
		bg: "#f1f5f9",
		fg: "#334155",
	};
	const px = size === "sm" ? "4px 10px" : "6px 12px";
	const fs = size === "sm" ? 11 : 12.5;
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 4,
				padding: px,
				borderRadius: 999,
				background: t.bg,
				color: t.fg,
				fontSize: fs,
				fontWeight: 500,
				letterSpacing: "-0.005em",
				whiteSpace: "nowrap",
			}}
		>
			{t.label}
		</span>
	);
}

export function Dot({ color = NS_COLORS.faint }: { color?: string }) {
	return (
		<span
			style={{
				display: "inline-block",
				width: 5,
				height: 5,
				borderRadius: 999,
				background: color,
			}}
		/>
	);
}

export function CheckBadge({
	size = 14,
	color = NS_COLORS.green,
}: { size?: number; color?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
			<circle cx="8" cy="8" r="7" fill={color} />
			<path
				d="M5 8.2l2 2 4-4.4"
				stroke="#fff"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function LockIcon({
	size = 14,
	color = NS_COLORS.faint,
}: { size?: number; color?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
			<rect
				x="3.25"
				y="7"
				width="9.5"
				height="7"
				rx="1.6"
				stroke={color}
				strokeWidth="1.4"
			/>
			<path
				d="M5 7V5a3 3 0 016 0v2"
				stroke={color}
				strokeWidth="1.4"
				strokeLinecap="round"
			/>
		</svg>
	);
}

// ─── Misc small icons ───────────────────────────────────────────

export function PlusIconSm({
	color = "currentColor",
}: { color?: string }) {
	return (
		<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
			<path
				d="M8 3v10M3 8h10"
				stroke={color}
				strokeWidth="1.6"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function PlusIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
			<path d="M8 3v10M3 8h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
		</svg>
	);
}

export function SearchIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
			<circle cx="7" cy="7" r="4.5" stroke={NS_COLORS.faint} strokeWidth="1.4" />
			<path
				d="M10.5 10.5L13 13"
				stroke={NS_COLORS.faint}
				strokeWidth="1.4"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function SpVoters() {
	return (
		<svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
			<circle cx="5" cy="6" r="2.5" stroke={NS_COLORS.muted} strokeWidth="1.2" />
			<circle cx="11" cy="6" r="2.5" stroke={NS_COLORS.muted} strokeWidth="1.2" />
			<path
				d="M2 13c.5-1.5 1.7-2.5 3-2.5s2.5 1 3 2.5M8 13c.5-1.5 1.7-2.5 3-2.5s2.5 1 3 2.5"
				stroke={NS_COLORS.muted}
				strokeWidth="1.2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function SpChat({ size = 11 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
			<path
				d="M2.5 7.5c0-2.5 2-4.5 5.5-4.5s5.5 2 5.5 4.5-2 4.5-5.5 4.5c-.8 0-1.5-.1-2.1-.3L3 13l.5-2.2C2.8 10 2.5 8.9 2.5 7.5z"
				stroke={NS_COLORS.muted}
				strokeWidth="1.2"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function ShareIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
			<path
				d="M11 6V3l4 4-4 4V8H8C5 8 3 10 3 13"
				stroke={NS_COLORS.muted}
				strokeWidth="1.3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function BellIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
			<path
				d="M4 11.5h8m-1 0V7a3 3 0 00-6 0v4.5m1.5 1.5a1.5 1.5 0 003 0"
				stroke={NS_COLORS.muted}
				strokeWidth="1.3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

// ─── Button styles ──────────────────────────────────────────────

export function ns_primaryBtn(extra: CSSProperties = {}): CSSProperties {
	return {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		width: "100%",
		height: 48,
		borderRadius: 999,
		background: NS_COLORS.navy,
		color: "#fff",
		border: "none",
		fontSize: 14.5,
		fontWeight: 500,
		letterSpacing: "-0.01em",
		cursor: "pointer",
		transition: "background 0.15s",
		fontFamily: "var(--font-sans)",
		...extra,
	};
}

export function ns_ghostBtn(extra: CSSProperties = {}): CSSProperties {
	return {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 40,
		padding: "0 18px",
		borderRadius: 999,
		background: "#fff",
		color: NS_COLORS.ink,
		border: `1px solid ${NS_COLORS.hairline}`,
		fontSize: 13.5,
		fontWeight: 500,
		cursor: "pointer",
		transition: "all 0.15s",
		fontFamily: "var(--font-sans)",
		...extra,
	};
}

export function ns_primaryBtnCompact(): CSSProperties {
	return {
		height: 38,
		padding: "0 16px",
		borderRadius: 999,
		background: NS_COLORS.navy,
		color: "#fff",
		border: "none",
		fontSize: 13,
		fontWeight: 500,
		cursor: "pointer",
		display: "inline-flex",
		alignItems: "center",
		gap: 7,
		whiteSpace: "nowrap",
		flexShrink: 0,
	};
}

// ─── Sign-in prompt (used by LockWrap) ──────────────────────────

export function SignInPrompt({
	onSignIn,
	compact = false,
}: { onSignIn: () => void; compact?: boolean }) {
	return (
		<div
			style={{
				width: compact ? 320 : 380,
				maxWidth: "90%",
				background: NS_COLORS.card,
				border: `1px solid ${NS_COLORS.hairline}`,
				borderRadius: 20,
				padding: compact ? 20 : "28px 28px 24px",
				boxShadow:
					"0 18px 50px rgba(6, 19, 41, 0.10), 0 4px 14px rgba(6, 19, 41, 0.04)",
				textAlign: "center",
			}}
		>
			<div
				style={{
					margin: "0 auto 12px",
					width: 38,
					height: 38,
					borderRadius: 999,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: NS_COLORS.navy,
				}}
			>
				<LockIcon size={16} color="#fff" />
			</div>
			<div
				style={{
					fontSize: 11,
					letterSpacing: "0.16em",
					textTransform: "uppercase",
					color: NS_COLORS.faint,
					marginBottom: 8,
					fontWeight: 500,
				}}
			>
				NS members only
			</div>
			<div
				style={{
					fontFamily: "var(--font-serif)",
					fontSize: compact ? 22 : 26,
					lineHeight: 1.1,
					letterSpacing: "-0.022em",
					color: NS_COLORS.ink,
					fontWeight: 700,
				}}
			>
				Sign in to see the polls.
			</div>
			<div
				style={{
					marginTop: 8,
					fontSize: 13.5,
					lineHeight: 1.5,
					color: NS_COLORS.muted,
					textWrap: "pretty" as unknown as undefined,
				}}
			>
				Anonymous, NS-verified. Your handle is never linked to your vote or
				your comment.
			</div>
			<button
				type="button"
				onClick={onSignIn}
				style={ns_primaryBtn({ marginTop: 16, height: 44 })}
			>
				<NSPassportGlyph /> Sign in with NSPass
			</button>
			<div
				style={{
					marginTop: 12,
					fontSize: 11.5,
					color: NS_COLORS.faint,
					display: "flex",
					gap: 14,
					justifyContent: "center",
				}}
			>
				<span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
					<Dot color="#cbd0dd" /> Anonymous
				</span>
				<span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
					<Dot color="#cbd0dd" /> Verified
				</span>
				<span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
					<Dot color="#cbd0dd" /> No tracking
				</span>
			</div>
		</div>
	);
}

// ─── Lock overlay wrapper ───────────────────────────────────────

export type LockStyle = "light" | "heavy" | "rows" | "mixed";

export function LockWrap({
	locked,
	lockStyle,
	onSignIn,
	children,
	height,
}: {
	locked: boolean;
	lockStyle: LockStyle;
	onSignIn: () => void;
	children: ReactNode;
	height?: number;
}) {
	if (!locked) return <div style={{ position: "relative" }}>{children}</div>;

	const blurAmount =
		lockStyle === "heavy"
			? "blur(7px)"
			: lockStyle === "rows"
				? "blur(0px)"
				: lockStyle === "mixed"
					? "blur(2.5px)"
					: "blur(3.5px)";

	const showOverlayCTA = lockStyle !== "rows";

	const maskImage =
		lockStyle === "light"
			? "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 100%)"
			: undefined;

	return (
		<div style={{ position: "relative" }}>
			<div
				style={{
					filter: blurAmount,
					userSelect: "none",
					pointerEvents: "none",
					WebkitMaskImage: maskImage,
					maskImage,
				}}
			>
				{children}
			</div>
			{showOverlayCTA ? (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "center",
						paddingTop: height ? height * 0.18 : 96,
						background:
							lockStyle === "heavy"
								? "linear-gradient(180deg, rgba(251,251,253,0.4) 0%, rgba(251,251,253,0.92) 70%)"
								: "linear-gradient(180deg, rgba(251,251,253,0) 0%, rgba(251,251,253,0) 30%, rgba(251,251,253,0.7) 70%, rgba(251,251,253,0.95) 100%)",
					}}
				>
					<SignInPrompt onSignIn={onSignIn} />
				</div>
			) : null}
		</div>
	);
}

// ─── Vote bar + Poll options ────────────────────────────────────

export function VoteBar({
	pct,
	leading,
	animate = true,
}: { pct: number; leading: boolean; animate?: boolean }) {
	return (
		<div
			style={{
				position: "relative",
				height: 8,
				borderRadius: 999,
				background: "#f1f3f7",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: 0,
					width: `${pct}%`,
					background: leading ? NS_COLORS.navy : "#cbd0dd",
					borderRadius: 999,
					transition: animate
						? "width 0.7s cubic-bezier(0.22, 1, 0.36, 1)"
						: "none",
				}}
			/>
		</div>
	);
}

export function PollOptions({
	post,
	voted,
	onVote,
	showCounts,
}: {
	post: Poll;
	voted: number | null;
	onVote: (idx: number) => void;
	showCounts: boolean;
}) {
	const totalVotes =
		post.options.reduce((s, o) => s + o.votes, 0) + (voted != null ? 1 : 0);
	const maxIdx = post.options.reduce(
		(m, o, i, a) => (o.votes >= a[m].votes ? i : m),
		0,
	);
	const showResults = voted != null || showCounts;
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
			{post.options.map((opt, i) => {
				const votes = opt.votes + (voted === i ? 1 : 0);
				const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
				const isLeading = i === maxIdx && showResults;
				const isMine = voted === i;
				if (!showResults) {
					return (
						<button
							key={i}
							type="button"
							onClick={() => onVote(i)}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								padding: "10px 14px",
								borderRadius: 12,
								border: `1px solid ${NS_COLORS.hairline}`,
								background: "#fff",
								cursor: "pointer",
								fontFamily: "var(--font-sans)",
								fontSize: 13.5,
								color: NS_COLORS.ink,
								textAlign: "left",
								transition: "all 0.15s",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = NS_COLORS.ink;
								e.currentTarget.style.background = "#fbfbfd";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = NS_COLORS.hairline;
								e.currentTarget.style.background = "#fff";
							}}
						>
							{opt.label}
							<span style={{ fontSize: 11.5, color: NS_COLORS.faint }}>
								Vote
							</span>
						</button>
					);
				}
				return (
					<div
						key={i}
						style={{
							padding: "10px 14px",
							borderRadius: 12,
							border: `1px solid ${isMine ? NS_COLORS.navy : NS_COLORS.hairline}`,
							background: isMine ? "rgba(6,19,41,0.025)" : "#fff",
							position: "relative",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 6,
								fontSize: 13.5,
							}}
						>
							<span
								style={{
									color: NS_COLORS.ink,
									display: "inline-flex",
									alignItems: "center",
									gap: 6,
								}}
							>
								{opt.label}
								{isMine ? <CheckBadge size={12} color={NS_COLORS.navy} /> : null}
							</span>
							<span
								style={{
									color: isLeading ? NS_COLORS.ink : NS_COLORS.muted,
									fontWeight: isLeading ? 600 : 500,
									fontVariantNumeric: "tabular-nums",
									fontFamily: "var(--font-mono)",
									fontSize: 12,
								}}
							>
								{pct}% · {votes}
							</span>
						</div>
						<VoteBar pct={pct} leading={isLeading} />
					</div>
				);
			})}
		</div>
	);
}

// ─── Misc shared bits ───────────────────────────────────────────

export function BadgePinned({
	label,
	tone,
}: { label: string; tone?: "hot" | "weekly" }) {
	const colors =
		tone === "hot"
			? { bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca" }
			: tone === "weekly"
				? { bg: "#eef4ff", fg: "#1f4ed8", border: "#c7d8fd" }
				: { bg: NS_COLORS.navy, fg: "#fff", border: NS_COLORS.navy };
	return (
		<span
			style={{
				fontSize: 10,
				padding: "2px 7px",
				borderRadius: 4,
				background: colors.bg,
				color: colors.fg,
				border: `1px solid ${colors.border}`,
				letterSpacing: "0.1em",
				textTransform: "uppercase",
				fontWeight: 600,
			}}
		>
			{label}
		</span>
	);
}

export function Label({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				fontSize: 11,
				letterSpacing: "0.14em",
				textTransform: "uppercase",
				color: NS_COLORS.faint,
				fontWeight: 600,
				marginBottom: 6,
			}}
		>
			{children}
		</div>
	);
}

export function ns_inputStyle(): CSSProperties {
	return {
		width: "100%",
		height: 46,
		border: `1px solid ${NS_COLORS.hairline}`,
		borderRadius: 12,
		padding: "0 14px",
		fontSize: 14,
		color: NS_COLORS.ink,
		outline: "none",
		fontFamily: "var(--font-sans)",
		background: "#fff",
	};
}
