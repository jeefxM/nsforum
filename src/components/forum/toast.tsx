"use client";

import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { arkivTxUrl } from "@/lib/arkiv-explorer";

const FZ_ORANGE = "#FE4C02";

export type ToastState =
	| { status: "pending"; title: string }
	| { status: "success"; title: string; txHash?: string }
	| { status: "error"; title: string; detail?: string };

type Entry = ToastState & { id: number };

type ToastApi = {
	pending: (title: string) => number;
	success: (id: number, patch: Omit<ToastState & { status: "success" }, "status">) => void;
	error: (id: number, patch: Omit<ToastState & { status: "error" }, "status">) => void;
	dismiss: (id: number) => void;
};

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
	const ctx = useContext(ToastCtx);
	if (!ctx) throw new Error("useToast must be used within ToastProvider");
	return ctx;
}

let _id = 0;
const nextId = () => ++_id;

export function ToastProvider({ children }: { children: ReactNode }) {
	const [entries, setEntries] = useState<Entry[]>([]);

	const dismiss = useCallback((id: number) => {
		setEntries((es) => es.filter((e) => e.id !== id));
	}, []);

	const pending = useCallback((title: string) => {
		const id = nextId();
		setEntries((es) => [...es, { id, status: "pending", title }]);
		return id;
	}, []);

	const success = useCallback<ToastApi["success"]>((id, patch) => {
		setEntries((es) =>
			es.map((e) => (e.id === id ? { ...e, status: "success", ...patch } : e)),
		);
		setTimeout(() => dismiss(id), 6500);
	}, [dismiss]);

	const error = useCallback<ToastApi["error"]>((id, patch) => {
		setEntries((es) =>
			es.map((e) => (e.id === id ? { ...e, status: "error", ...patch } : e)),
		);
		setTimeout(() => dismiss(id), 6500);
	}, [dismiss]);

	return (
		<ToastCtx.Provider value={{ pending, success, error, dismiss }}>
			{children}
			<div
				aria-live="polite"
				className="fixed bottom-3 left-3 right-3 z-[60] flex flex-col items-end gap-2 pointer-events-none md:bottom-5 md:left-auto md:right-5 md:gap-2.5"
			>
				{entries.map((e) => (
					<ToastCard key={e.id} entry={e} onDismiss={() => dismiss(e.id)} />
				))}
			</div>
			<style>{`
				@keyframes fz-toast-in {
					from { opacity: 0; transform: translateY(8px) translateX(6px); }
					to   { opacity: 1; transform: translateY(0) translateX(0); }
				}
				@keyframes fz-bar {
					0%   { transform: translateX(-105%); }
					100% { transform: translateX(420%); }
				}
				.fz-toast { animation: fz-toast-in 220ms cubic-bezier(.2,.8,.2,1) both; }
				.fz-toast-bar { animation: fz-bar 1.25s cubic-bezier(.5,0,.5,1) infinite; }
				@media (prefers-reduced-motion: reduce) {
					.fz-toast { animation: none !important; opacity: 1 !important; transform: none !important; }
					.fz-toast-bar { animation: none !important; }
				}
			`}</style>
		</ToastCtx.Provider>
	);
}

function ToastCard({
	entry,
	onDismiss,
}: { entry: Entry; onDismiss: () => void }) {
	const isPending = entry.status === "pending";
	const isSuccess = entry.status === "success";
	const isError = entry.status === "error";

	return (
		<div
			className="fz-toast w-full max-w-[420px] md:w-[320px]"
			style={{
				pointerEvents: "auto",
				background: "#f5f3ee",
				border: "2px solid #000",
				boxShadow: "5px 5px 0 #000",
				fontFamily: "var(--font-display)",
			}}
		>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 32px",
					borderBottom: "2px solid #000",
				}}
			>
				<div
					style={{
						padding: "10px 14px",
						fontSize: 10.5,
						fontWeight: 700,
						letterSpacing: "0.18em",
						color: "#000",
						display: "flex",
						alignItems: "center",
						gap: 8,
					}}
				>
					<StatusDot status={entry.status} />
					{isPending
						? "UPLOADING TO ARKIV"
						: isSuccess
							? "PUBLISHED ON-CHAIN"
							: "FAILED"}
				</div>
				<button
					type="button"
					onClick={onDismiss}
					aria-label="Dismiss"
					style={{
						borderLeft: "2px solid #000",
						background: "transparent",
						cursor: "pointer",
						color: "#000",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						transition: "background 100ms",
					}}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLElement).style.background = "#000";
						(e.currentTarget as HTMLElement).style.color = "#fff";
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLElement).style.background = "transparent";
						(e.currentTarget as HTMLElement).style.color = "#000";
					}}
				>
					<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</div>

			<div style={{ padding: "12px 14px 14px" }}>
				<div
					style={{
						fontSize: 13.5,
						color: "#000",
						fontFamily: "var(--font-sans)",
						lineHeight: 1.45,
					}}
				>
					{entry.title}
				</div>

				{isPending ? (
					<div
						style={{
							marginTop: 10,
							height: 3,
							overflow: "hidden",
							background: "rgba(0,0,0,0.1)",
						}}
					>
						<div
							className="fz-toast-bar"
							style={{
								height: "100%",
								width: "28%",
								background: FZ_ORANGE,
							}}
						/>
					</div>
				) : null}

				{isSuccess && entry.txHash ? (
					<a
						href={arkivTxUrl(entry.txHash)}
						target="_blank"
						rel="noopener noreferrer"
						style={{
							marginTop: 10,
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
							fontSize: 11,
							fontWeight: 700,
							letterSpacing: "0.16em",
							color: FZ_ORANGE,
							textDecoration: "none",
						}}
					>
						VIEW TRANSACTION
						<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
							<path d="M7 17 17 7M9 7h8v8" />
						</svg>
					</a>
				) : null}

				{isError && entry.detail ? (
					<div
						style={{
							marginTop: 8,
							fontSize: 12,
							color: "rgba(0,0,0,0.6)",
							fontFamily: "var(--font-sans)",
						}}
					>
						{entry.detail}
					</div>
				) : null}
			</div>
		</div>
	);
}

function StatusDot({ status }: { status: Entry["status"] }) {
	if (status === "pending") {
		return (
			<span
				aria-hidden
				style={{
					display: "inline-block",
					width: 10,
					height: 10,
					borderRadius: 999,
					background: FZ_ORANGE,
					boxShadow: `0 0 0 4px rgba(254,76,2,0.18)`,
					animation: "fz-pulse 1.4s ease-in-out infinite",
				}}
			>
				<style>{`@keyframes fz-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.35) } }`}</style>
			</span>
		);
	}
	if (status === "success") {
		return (
			<span
				aria-hidden
				style={{
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					width: 14,
					height: 14,
					borderRadius: 999,
					background: "#000",
				}}
			>
				<svg width="9" height="9" viewBox="0 0 16 16" fill="none">
					<path d="M3 8.5l3 3 6-7" stroke={FZ_ORANGE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</span>
		);
	}
	return (
		<span
			aria-hidden
			style={{
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: 14,
				height: 14,
				borderRadius: 999,
				background: "#000",
				color: "#fff",
				fontSize: 9,
				fontWeight: 700,
			}}
		>
			!
		</span>
	);
}
