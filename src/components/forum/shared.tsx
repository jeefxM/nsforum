"use client";

import type { ReactNode } from "react";
import { NS_COLORS } from "./atoms";

export function ViewHeader({
	eyebrow,
	title,
	body,
	action,
}: {
	eyebrow: string;
	title: string;
	body?: ReactNode;
	action?: ReactNode;
}) {
	return (
		<div
			style={{
				marginBottom: 18,
				display: "flex",
				alignItems: "flex-end",
				justifyContent: "space-between",
				gap: 20,
			}}
		>
			<div>
				<div
					style={{
						fontSize: 10.5,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: NS_COLORS.faint,
						fontWeight: 600,
					}}
				>
					{eyebrow}
				</div>
				<h1
					style={{
						margin: "6px 0 0",
						fontFamily: "var(--font-serif)",
						fontSize: 30,
						lineHeight: 1.05,
						letterSpacing: "-0.022em",
						color: NS_COLORS.ink,
						fontWeight: 700,
					}}
				>
					{title}
				</h1>
				{body ? (
					<p
						style={{
							margin: "6px 0 0",
							maxWidth: 520,
							fontSize: 13.5,
							color: NS_COLORS.muted,
							lineHeight: 1.5,
						}}
					>
						{body}
					</p>
				) : null}
			</div>
			{action}
		</div>
	);
}

export function SortTabs<T extends string>({
	tabs,
	value,
	onChange,
	right,
}: {
	tabs: { id: T; label: string }[];
	value: T;
	onChange: (id: T) => void;
	right?: ReactNode;
}) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				marginBottom: 14,
			}}
		>
			<div style={{ display: "flex", gap: 4 }}>
				{tabs.map((t) => {
					const on = t.id === value;
					return (
						<button
							key={t.id}
							type="button"
							onClick={() => onChange(t.id)}
							style={{
								background: on ? "#fff" : "transparent",
								border: on
									? `1px solid ${NS_COLORS.hairline}`
									: "1px solid transparent",
								padding: "6px 12px",
								borderRadius: 8,
								cursor: "pointer",
								fontSize: 12.5,
								color: on ? NS_COLORS.ink : NS_COLORS.muted,
								fontWeight: on ? 600 : 400,
							}}
						>
							{t.label}
						</button>
					);
				})}
			</div>
			{right ? (
				<div style={{ fontSize: 11.5, color: NS_COLORS.faint }}>{right}</div>
			) : null}
		</div>
	);
}
