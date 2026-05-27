"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

export const BRAND_ORANGE = "#FE4C02";

export function BrandMark({ size = 22 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={(size * 302) / 298}
			viewBox="0 0 298 302"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			<path
				d="M143.955 0.121846C154.543 -0.470646 171.741 1.16225 182.039 3.61812C220.675 12.8343 253.269 35.8135 274.463 69.1419C295.504 102.745 302.394 143.307 293.63 181.975C284.92 220.313 261.404 253.657 228.212 274.73C193.288 296.867 152.927 302.078 112.941 293.095C98.4146 289.634 86.9066 284.741 73.7275 277.604C58.189 283.487 42.6088 289.259 26.988 294.923C22.7139 296.461 8.00233 302.608 4.30702 301.555C2.69711 301.099 1.34386 300.003 0.562234 298.525C-1.4111 294.838 5.86428 275.67 7.51662 270.417C12.0363 255.626 16.7042 240.884 21.5198 226.189C8.7122 204.953 1.37955 180.872 0.179718 156.104C-1.75013 116.773 11.9239 78.2686 38.2291 48.9636C66.1537 18.1738 102.717 2.11532 143.955 0.121846Z"
				fill={BRAND_ORANGE}
			/>
			<path
				d="M144.397 58.8881C194.179 56.5751 236.414 95.0559 238.733 144.84C241.048 194.624 202.572 236.862 152.789 239.185C102.998 241.507 60.7534 203.024 58.4354 153.234C56.1177 103.442 94.6047 61.2012 144.397 58.8881Z"
				fill="#FFFFFE"
			/>
		</svg>
	);
}

const NAV: { label: string; href: string }[] = [
	{ label: "HOME", href: "/" },
	{ label: "RULES", href: "/rules" },
];

export function TopBar({
	signedIn,
	onSignIn,
	onSignOut,
	handle,
	query,
	onQueryChange,
	onOpenMenu,
	activeNav = "HOME",
}: {
	signedIn: boolean;
	onSignIn: () => void;
	onSignOut: () => void;
	handle?: string;
	query: string;
	onQueryChange: (q: string) => void;
	onOpenMenu: () => void;
	activeNav?: "HOME" | "RULES";
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				inputRef.current?.focus();
				inputRef.current?.select();
			}
			if (e.key === "Escape" && document.activeElement === inputRef.current) {
				inputRef.current?.blur();
				onQueryChange("");
			}
		}
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onQueryChange]);
	const userLabel = handle ?? "anon_2048";
	return (
		<header
			className="grid h-[60px] w-full items-stretch border-b border-black [grid-template-columns:1fr_auto_auto] md:h-[68px] md:[grid-template-columns:300px_1fr_420px_220px]"
			style={{
				background: "var(--fz-paper)",
				fontFamily: "var(--font-display)",
			}}
		>
			{/* Brand */}
			<a
				href="/"
				className="flex items-center gap-2 border-r border-black px-4 no-underline md:gap-2.5 md:px-6"
			>
				<span className="hidden md:inline-flex">
					<BrandMark size={28} />
				</span>
				<span className="inline-flex md:hidden">
					<BrandMark size={22} />
				</span>
				<span className="text-[19px] font-bold lowercase tracking-[0.01em] text-black md:text-[24px]">
					forumzero
				</span>
			</a>

			{/* Nav — desktop only */}
			<nav className="hidden items-center gap-9 border-r border-black px-9 md:flex">
				{NAV.map((item) => {
					const active = item.label === activeNav;
					return (
						<a
							key={item.label}
							href={item.href}
							className="group relative py-1 text-[13px] font-bold tracking-[0.08em] no-underline transition-colors hover:!text-[var(--brand)]"
							style={
								{
									color: active ? BRAND_ORANGE : "#0a0a0a",
									"--brand": BRAND_ORANGE,
								} as React.CSSProperties
							}
						>
							{item.label}
							<span
								className={`absolute -bottom-0.5 left-0 right-0 h-[2px] transition-transform duration-200 ${
									active
										? "scale-x-100"
										: "scale-x-0 group-hover:scale-x-100"
								}`}
								style={{ background: BRAND_ORANGE, transformOrigin: "left" }}
							/>
						</a>
					);
				})}
			</nav>

			{/* Search — desktop only */}
			<div className="hidden items-center gap-3 border-r border-black px-5 md:flex">
				<SearchIcon />
				<input
					ref={inputRef}
					value={query}
					onChange={(e) => onQueryChange(e.target.value)}
					placeholder="SEARCH DISCUSSIONS..."
					className="flex-1 bg-transparent text-[12px] font-bold tracking-[0.08em] text-black/80 placeholder:text-black/35 placeholder:font-bold focus:outline-none"
					style={{ fontFamily: "var(--font-display)" }}
				/>
				{query ? (
					<button
						type="button"
						onClick={() => onQueryChange("")}
						aria-label="Clear search"
						className="flex h-4 w-4 items-center justify-center text-black/45 transition-colors hover:text-black"
					>
						<svg
							width="10"
							height="10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.6"
							strokeLinecap="round"
						>
							<path d="M6 6l12 12M18 6L6 18" />
						</svg>
					</button>
				) : (
					<kbd className="rounded border border-black/30 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.05em] text-black/55">
						⌘K
					</kbd>
				)}
			</div>

			{/* User cell */}
			{signedIn ? (
				<UserMenu userLabel={userLabel} onSignOut={onSignOut} />
			) : (
				<button
					type="button"
					onClick={onSignIn}
					className="flex items-center justify-center px-4 text-[12px] font-bold tracking-[0.12em] text-black transition-colors hover:bg-black/5 md:px-5 md:text-[13px] md:tracking-[0.08em]"
				>
					SIGN&nbsp;IN
				</button>
			)}

			{/* Menu trigger — mobile only */}
			<button
				type="button"
				aria-label="Open menu"
				onClick={onOpenMenu}
				className="flex items-center justify-center border-l border-black px-4 text-black transition-colors hover:bg-black/5 md:hidden"
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.4"
					strokeLinecap="round"
				>
					<path d="M3 6h18M3 12h18M3 18h18" />
				</svg>
			</button>
		</header>
	);
}

function UserMenu({
	userLabel,
	onSignOut,
}: {
	userLabel: string;
	onSignOut: () => void;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onDoc(e: MouseEvent) {
			if (!ref.current?.contains(e.target as Node)) setOpen(false);
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onDoc);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDoc);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	return (
		<div ref={ref} className="relative flex">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex flex-1 items-center justify-between gap-2 px-4 text-[12px] font-bold tracking-[0.05em] text-black transition-colors hover:bg-black/5 md:px-5 md:text-[13px]"
			>
				<span className="flex items-center gap-2.5">
					<span
						className="inline-block h-2.5 w-2.5 rounded-full"
						style={{ background: BRAND_ORANGE }}
					/>
					<span className="hidden sm:inline">ns_anon</span>
				</span>
				<span className={`transition-transform ${open ? "rotate-180" : ""}`}>
					<ChevronDown />
				</span>
			</button>
			{open ? (
				<div className="absolute right-2 top-full z-50 mt-1 w-[220px] border border-black bg-[var(--fz-paper)] shadow-[4px_4px_0_rgba(0,0,0,1)] md:right-3">
					<div className="border-b border-black px-4 py-3">
						<div className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">
							Signed in as
						</div>
						<div className="mt-1 truncate text-[13px] font-bold text-black">
							ns_anon
						</div>
						<div
							className="mt-1 text-[10.5px] tracking-[0.04em] text-black/45"
							style={{ fontFamily: "var(--font-sans)" }}
						>
							Your post handle rotates per thread.
						</div>
					</div>
					<a
						href="/profile"
						className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[12.5px] font-bold tracking-[0.05em] text-black no-underline transition-colors hover:bg-black/5"
					>
						Profile
						<span className="text-[10px] tracking-[0.16em] text-black/40">
							→
						</span>
					</a>
					<button
						type="button"
						onClick={() => {
							setOpen(false);
							onSignOut();
						}}
						className="flex w-full items-center border-t border-black/15 px-4 py-2.5 text-left text-[12.5px] font-bold tracking-[0.05em] transition-colors hover:bg-black/5"
						style={{ color: BRAND_ORANGE }}
					>
						Sign out
					</button>
				</div>
			) : null}
		</div>
	);
}

/**
 * Mobile slide-in sheet that holds search + nav + sort + categories.
 * Rendered by ForumApp so we can pass live filter state without prop drilling.
 */
export function MobileMenuSheet({
	open,
	onClose,
	children,
}: {
	open: boolean;
	onClose: () => void;
	children: ReactNode;
}) {
	useEffect(() => {
		if (!open) return;
		const { overflow } = document.body.style;
		document.body.style.overflow = "hidden";
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = overflow;
			document.removeEventListener("keydown", onKey);
		};
	}, [open, onClose]);

	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 md:hidden">
			<button
				type="button"
				aria-label="Close menu"
				onClick={onClose}
				className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
			/>
			<aside
				className="absolute right-0 top-0 flex h-full w-[min(340px,86vw)] flex-col border-l-2 border-black bg-[var(--fz-paper)] shadow-[-8px_0_0_rgba(0,0,0,0.08)]"
				style={{ fontFamily: "var(--font-display)" }}
			>
				<header className="flex items-center justify-between border-b-2 border-black px-5 py-4">
					<span className="flex items-center gap-2">
						<BrandMark size={20} />
						<span className="text-[18px] font-bold lowercase tracking-[0.01em] text-black">
							forumzero
						</span>
					</span>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close menu"
						className="flex h-8 w-8 items-center justify-center border border-black text-black transition-colors hover:bg-black hover:text-white"
					>
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.6"
							strokeLinecap="round"
						>
							<path d="M6 6l12 12M18 6L6 18" />
						</svg>
					</button>
				</header>
				<div className="flex-1 overflow-y-auto">{children}</div>
			</aside>
		</div>
	);
}

function SearchIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="text-black/60"
			aria-hidden
		>
			<circle cx="11" cy="11" r="7" />
			<path d="m20 20-3.5-3.5" />
		</svg>
	);
}

function ChevronDown() {
	return (
		<svg
			width="11"
			height="11"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="text-black/70"
			aria-hidden
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}
