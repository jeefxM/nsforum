"use client";

import { CheckBadge, NSLogo, NSPassportGlyph, NS_COLORS, SearchIcon } from "./atoms";

export function TopBar({
	signedIn,
	onSignIn,
	onSignOut,
	handle,
}: {
	signedIn: boolean;
	onSignIn: () => void;
	onSignOut: () => void;
	handle?: string;
}) {
	return (
		<header
			style={{
				background: "#fff",
				borderBottom: `1px solid ${NS_COLORS.hairline}`,
			}}
		>
			<div
				style={{
					maxWidth: 1280,
					margin: "0 auto",
					padding: "14px 36px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 24,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 24 }}>
					<a
						href="/"
						style={{ display: "inline-flex", textDecoration: "none" }}
					>
						<NSLogo size={20} />
					</a>
					<span
						style={{
							padding: "3px 10px",
							borderRadius: 6,
							background: "#f1f3f7",
							fontSize: 10.5,
							letterSpacing: "0.14em",
							textTransform: "uppercase",
							color: NS_COLORS.muted,
							fontWeight: 600,
						}}
					>
						Forum
					</span>
				</div>

				<div
					style={{
						flex: 1,
						maxWidth: 460,
						display: "flex",
						alignItems: "center",
						gap: 8,
						background: NS_COLORS.bg,
						border: `1px solid ${NS_COLORS.hairline}`,
						borderRadius: 10,
						padding: "0 12px",
						height: 36,
					}}
				>
					<SearchIcon />
					<input
						placeholder="Search polls, threads, tags…"
						style={{
							flex: 1,
							height: "100%",
							border: "none",
							background: "transparent",
							fontSize: 13,
							color: NS_COLORS.ink,
							outline: "none",
						}}
					/>
					<span
						style={{
							fontSize: 10.5,
							color: NS_COLORS.faint,
							padding: "2px 5px",
							borderRadius: 4,
							border: `1px solid ${NS_COLORS.hairline}`,
							background: "#fff",
						}}
					>
						⌘K
					</span>
				</div>

				{signedIn ? (
					<div
						style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
					>
						<span
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 7,
								padding: "6px 11px",
								borderRadius: 999,
								background: "#ecfdf5",
								fontSize: 12,
								color: "#065f46",
								border: "1px solid #c8e3d0",
								whiteSpace: "nowrap",
							}}
						>
							<CheckBadge size={11} />
							<span style={{ fontFamily: "var(--font-mono)" }}>
								{handle ?? "ns_anon"}
							</span>
						</span>
						<button
							type="button"
							onClick={onSignOut}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								fontSize: 12,
								color: NS_COLORS.muted,
								whiteSpace: "nowrap",
							}}
						>
							sign out
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={onSignIn}
						style={{
							height: 36,
							padding: "0 14px",
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
						}}
					>
						<NSPassportGlyph size={13} />
						Sign in with NS
					</button>
				)}
			</div>
		</header>
	);
}
