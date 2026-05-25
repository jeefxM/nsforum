"use client";

import { useCallback, useEffect, useState } from "react";
import { arkivTxUrl } from "@/lib/arkiv-explorer";
import type { TagId } from "@/lib/forum-data";
import type { UiThread } from "@/lib/forum-ui-types";
import { ThreadComposerSheet } from "./composers";
import { ToastProvider, useToast } from "./toast";
import { BRAND_ORANGE, MobileMenuSheet, TopBar } from "./top-bar";

type SortKey = "hot" | "new" | "rising" | "discussions" | "polls";

const SORTS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
	{ key: "hot", label: "HOT", icon: <IconFlame /> },
	{ key: "new", label: "NEW", icon: <IconClock /> },
	{ key: "rising", label: "RISING", icon: <IconTrend /> },
	{ key: "discussions", label: "DISCUSSIONS", icon: <IconChat /> },
	{ key: "polls", label: "POLLS", icon: <IconBars /> },
];

const CATEGORIES: { id: TagId; name: string }[] = [
	{ id: "general", name: "General" },
	{ id: "cohorts", name: "Cohorts" },
	{ id: "ai", name: "AI" },
	{ id: "build", name: "Build" },
	{ id: "trips", name: "Trips" },
	{ id: "housing", name: "Housing" },
	{ id: "food", name: "Food" },
	{ id: "gym", name: "Gym" },
	{ id: "crypto", name: "Crypto" },
	{ id: "marina", name: "Marina Hotel" },
];

export function ForumApp(props: {
	initialSignedIn: boolean;
	handle?: string;
}) {
	return (
		<ToastProvider>
			<ForumAppInner {...props} />
		</ToastProvider>
	);
}

function ForumAppInner({
	initialSignedIn,
	handle,
}: { initialSignedIn: boolean; handle?: string }) {
	const [signedIn] = useState(initialSignedIn);
	const [sort, setSort] = useState<SortKey>("rising");
	const [composerOpen, setComposerOpen] = useState(false);
	const [openThreadId, setOpenThreadId] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<TagId | null>(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const [threads, setThreads] = useState<UiThread[]>([]);
	const [threadsLoading, setThreadsLoading] = useState(true);

	const refreshThreads = useCallback(async () => {
		try {
			const r = await fetch("/api/threads", { cache: "no-store" });
			if (r.ok) {
				const data = await r.json();
				setThreads(data.threads ?? []);
			}
		} finally {
			setThreadsLoading(false);
		}
	}, []);

	useEffect(() => {
		refreshThreads();
		const t = setInterval(refreshThreads, 5000);
		return () => clearInterval(t);
	}, [refreshThreads]);

	function handleSignIn() {
		window.location.href = "/auth";
	}

	async function handleSignOut() {
		await fetch("/api/sign-out", { method: "POST" });
		window.location.reload();
	}

	function newThread() {
		if (!signedIn) return handleSignIn();
		setComposerOpen(true);
	}

	return (
		<div
			className="min-h-screen text-black"
			style={{
				background: "var(--fz-paper)",
				fontFamily: "var(--font-display)",
			}}
		>
			<TopBar
				signedIn={signedIn}
				onSignIn={handleSignIn}
				onSignOut={handleSignOut}
				handle={handle}
				query={query}
				onQueryChange={setQuery}
				onOpenMenu={() => setMobileMenuOpen(true)}
			/>

			<WordmarkBlock />

			<div className="grid w-full border-t border-black md:[grid-template-columns:240px_1fr]">
				<div className="hidden md:block">
					<LeftRail
						sort={sort}
						onSort={(s) => {
							setSort(s);
							setCategoryFilter(null);
						}}
						categoryFilter={categoryFilter}
						onCategory={(c) => setCategoryFilter(c)}
						counts={countByCategory(threads)}
					/>
				</div>
				{openThreadId ? (
					<ThreadDetailPanel
						threadId={openThreadId}
						signedIn={signedIn}
						onBack={() => setOpenThreadId(null)}
						onSignIn={handleSignIn}
					/>
				) : (
					<ThreadsTable
						sort={sort}
						threads={filterThreads(threads, sort, query, categoryFilter)}
						loading={threadsLoading}
						onNewThread={newThread}
						onOpenThread={setOpenThreadId}
						query={query}
						signedIn={signedIn}
						onSignIn={handleSignIn}
					/>
				)}
			</div>

			<footer className="flex items-center justify-center border-t border-black py-5 text-[12px] tracking-[0.18em]">
				<button
					type="button"
					className="flex items-center gap-2 transition-transform hover:scale-[1.04] active:scale-[0.98]"
					style={{ color: BRAND_ORANGE }}
				>
					LOAD MORE
					<svg
						width="11"
						height="11"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>
			</footer>

			{composerOpen ? (
				<ThreadComposerSheet
					onClose={() => setComposerOpen(false)}
					onPosted={() => {
						setComposerOpen(false);
						refreshThreads();
					}}
				/>
			) : null}

			<MobileMenuSheet
				open={mobileMenuOpen}
				onClose={() => setMobileMenuOpen(false)}
			>
				<MobileMenuBody
					query={query}
					onQueryChange={setQuery}
					sort={sort}
					onSort={(s) => {
						setSort(s);
						setCategoryFilter(null);
						setMobileMenuOpen(false);
					}}
					categoryFilter={categoryFilter}
					onCategory={(c) => {
						setCategoryFilter(c);
						setMobileMenuOpen(false);
					}}
					counts={countByCategory(threads)}
				/>
			</MobileMenuSheet>
		</div>
	);
}

function MobileMenuBody({
	query,
	onQueryChange,
	sort,
	onSort,
	categoryFilter,
	onCategory,
	counts,
}: {
	query: string;
	onQueryChange: (q: string) => void;
	sort: SortKey;
	onSort: (s: SortKey) => void;
	categoryFilter: TagId | null;
	onCategory: (c: TagId | null) => void;
	counts: Partial<Record<TagId, number>>;
}) {
	return (
		<div className="flex flex-col">
			<div className="border-b border-black px-5 py-4">
				<div className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2.5">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-black/55"
						aria-hidden
					>
						<circle cx="11" cy="11" r="7" />
						<path d="m20 20-3.5-3.5" />
					</svg>
					<input
						value={query}
						onChange={(e) => onQueryChange(e.target.value)}
						placeholder="SEARCH"
						className="flex-1 bg-transparent text-[13px] font-bold tracking-[0.08em] text-black placeholder:text-black/35 placeholder:font-bold focus:outline-none"
						style={{ fontFamily: "var(--font-display)" }}
					/>
					{query ? (
						<button
							type="button"
							onClick={() => onQueryChange("")}
							aria-label="Clear search"
							className="text-black/55"
						>
							<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
								<path d="M6 6l12 12M18 6L6 18" />
							</svg>
						</button>
					) : null}
				</div>
			</div>

			<ul className="flex flex-col border-b border-black px-2 py-2">
				{SORTS.map((s) => {
					const active = s.key === sort;
					return (
						<li key={s.key}>
							<button
								type="button"
								onClick={() => onSort(s.key)}
								className="flex w-full items-center gap-3 px-3 py-2.5 text-[12.5px] font-bold tracking-[0.1em] transition-colors hover:bg-black/5"
								style={{
									color: active ? BRAND_ORANGE : "#0a0a0a",
								}}
							>
								<span className="flex h-4 w-4 items-center justify-center">
									{s.icon}
								</span>
								{s.label}
							</button>
						</li>
					);
				})}
			</ul>

			<div className="px-5 pt-5 pb-8">
				<div className="mb-3 flex items-baseline justify-between text-[11px] font-bold tracking-[0.18em]">
					<span className="border-b-2 border-black pb-1">CATEGORIES</span>
					{categoryFilter ? (
						<button
							type="button"
							onClick={() => onCategory(null)}
							className="text-[10px] font-bold tracking-[0.16em] text-black/55"
						>
							CLEAR
						</button>
					) : null}
				</div>
				<ul className="flex flex-wrap gap-2">
					{CATEGORIES.map((c) => {
						const active = categoryFilter === c.id;
						const count = counts[c.id] ?? 0;
						return (
							<li key={c.id}>
								<button
									type="button"
									onClick={() => onCategory(active ? null : c.id)}
									className="inline-flex items-center gap-2 border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-all active:scale-[0.96]"
									style={{
										fontFamily: "var(--font-display)",
										borderColor: "#000",
										background: active ? BRAND_ORANGE : "transparent",
										color: active ? "#fff" : "#000",
									}}
								>
									{c.name}
									<span
										className="rounded-sm px-1 py-0.5 text-[9.5px] tracking-[0.04em]"
										style={{
											fontFamily: "var(--font-mono)",
											background: active
												? "rgba(255,255,255,0.22)"
												: "rgba(0,0,0,0.06)",
											color: active ? "#fff" : "rgba(0,0,0,0.55)",
										}}
									>
										{count}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}

function filterThreads(
	list: UiThread[],
	sort: SortKey,
	query: string,
	category: TagId | null,
): UiThread[] {
	const q = query.trim().toLowerCase();
	const matchesQuery = (t: UiThread) =>
		!q ||
		t.title.toLowerCase().includes(q) ||
		t.body.toLowerCase().includes(q) ||
		t.authorHandle.toLowerCase().includes(q) ||
		t.tag.toLowerCase().includes(q);
	const matchesCategory = (t: UiThread) =>
		!category || t.tag === category;
	const filtered = (
		sort === "discussions"
			? list.filter((t) => !t.hasPoll)
			: sort === "polls"
				? list.filter((t) => t.hasPoll)
				: list.slice()
	)
		.filter(matchesQuery)
		.filter(matchesCategory);

	switch (sort) {
		case "new":
			return filtered.sort((a, b) => b.timestamp - a.timestamp);
		case "hot":
			// Activity weighted by recency — recent + many replies floats up.
			return filtered.sort((a, b) => hotScore(b) - hotScore(a));
		case "rising":
			// Replies per hour of age. Brand-new posts with traction beat older
			// posts that simply accumulated replies over time.
			return filtered.sort((a, b) => risingScore(b) - risingScore(a));
		default:
			return filtered.sort(
				(a, b) => (b.lastActivity ?? b.timestamp) - (a.lastActivity ?? a.timestamp),
			);
	}
}

function hotScore(t: UiThread): number {
	const ageHours = Math.max(
		1,
		(Date.now() - (t.lastActivity ?? t.timestamp)) / 3_600_000,
	);
	return (t.replies + 1) / Math.pow(ageHours, 0.6);
}

function risingScore(t: UiThread): number {
	const ageHours = Math.max(
		0.5,
		(Date.now() - t.timestamp) / 3_600_000,
	);
	if (ageHours > 48) return -1; // older than 2d → not "rising"
	return (t.replies + 0.5) / ageHours;
}

function WordmarkBlock() {
	return (
		<div className="overflow-hidden px-4 py-5 md:px-6 md:py-7 lg:px-9">
			<h1
				className="select-none whitespace-nowrap text-black"
				style={{
					fontFamily: "var(--font-display)",
					fontWeight: 700,
					fontSize: "clamp(48px, 16vw, 155px)",
					lineHeight: 0.85,
					letterSpacing: "-0.01em",
				}}
			>
				forumzero
			</h1>
		</div>
	);
}

function countByCategory(threads: UiThread[]): Partial<Record<TagId, number>> {
	const out: Partial<Record<TagId, number>> = {};
	for (const t of threads) {
		const k = t.tag as TagId;
		out[k] = (out[k] ?? 0) + 1;
	}
	return out;
}

function LeftRail({
	sort,
	onSort,
	categoryFilter,
	onCategory,
	counts,
}: {
	sort: SortKey;
	onSort: (s: SortKey) => void;
	categoryFilter: TagId | null;
	onCategory: (c: TagId | null) => void;
	counts: Partial<Record<TagId, number>>;
}) {
	return (
		<aside className="border-r border-black">
			<ul className="flex flex-col">
				{SORTS.map((s) => {
					const active = s.key === sort;
					return (
						<li key={s.key}>
							<button
								type="button"
								onClick={() => onSort(s.key)}
								className="group flex w-full items-center gap-3 px-6 py-2.5 text-[12.5px] font-bold tracking-[0.1em] transition-colors hover:bg-black/5"
								style={{
									color: active ? BRAND_ORANGE : "#0a0a0a",
								}}
								onMouseEnter={(e) => {
									if (!active)
										(e.currentTarget as HTMLElement).style.color = BRAND_ORANGE;
								}}
								onMouseLeave={(e) => {
									if (!active)
										(e.currentTarget as HTMLElement).style.color = "#0a0a0a";
								}}
							>
								<span className="flex h-4 w-4 items-center justify-center">
									{s.icon}
								</span>
								{s.label}
							</button>
						</li>
					);
				})}
			</ul>

			<div className="mt-2 border-t border-black px-6 pt-4 pb-6">
				<div className="mb-3 flex items-baseline justify-between text-[12px] font-bold tracking-[0.18em]">
					<span className="border-b-2 border-black pb-1">CATEGORIES</span>
					{categoryFilter ? (
						<button
							type="button"
							onClick={() => onCategory(null)}
							className="text-[10px] font-bold tracking-[0.16em] text-black/55 transition-colors hover:text-black"
						>
							CLEAR
						</button>
					) : null}
				</div>
				<ul className="-mx-2 flex flex-col gap-0.5">
					{CATEGORIES.map((c) => {
						const active = categoryFilter === c.id;
						const count = counts[c.id] ?? 0;
						return (
							<li key={c.id}>
								<button
									type="button"
									onClick={() => onCategory(active ? null : c.id)}
									className="group relative flex w-full items-center justify-between gap-3 px-2 py-2 text-left text-[12.5px] transition-all hover:translate-x-[2px] active:scale-[0.98]"
									style={
										{
											fontFamily: "var(--font-display)",
											color: active ? BRAND_ORANGE : "#0a0a0a",
											fontWeight: active ? 700 : 500,
											background: active
												? "rgba(254,76,2,0.07)"
												: "transparent",
											["--brand" as string]: BRAND_ORANGE,
										} as React.CSSProperties
									}
									onMouseEnter={(e) => {
										if (active) return;
										(e.currentTarget as HTMLElement).style.color =
											BRAND_ORANGE;
										(e.currentTarget as HTMLElement).style.background =
											"rgba(254,76,2,0.04)";
									}}
									onMouseLeave={(e) => {
										if (active) return;
										(e.currentTarget as HTMLElement).style.color = "#0a0a0a";
										(e.currentTarget as HTMLElement).style.background =
											"transparent";
									}}
								>
									<span
										aria-hidden
										className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] transition-transform duration-150 ${
											active
												? "scale-y-100"
												: "scale-y-0 group-hover:scale-y-100"
										}`}
										style={{
											background: BRAND_ORANGE,
											transformOrigin: "center",
										}}
									/>
									<span className="inline-flex items-center gap-2">
										{c.name}
									</span>
									<span
										className="rounded-sm px-1.5 py-0.5 text-[10.5px] tracking-[0.06em] transition-colors"
										style={{
											fontFamily: "var(--font-mono)",
											background: active
												? BRAND_ORANGE
												: "rgba(0,0,0,0.06)",
											color: active ? "#fff" : "rgba(0,0,0,0.55)",
										}}
									>
										{count}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			</div>
		</aside>
	);
}

function ThreadsTable({
	sort,
	threads,
	loading,
	onNewThread,
	onOpenThread,
	query,
	signedIn,
	onSignIn,
}: {
	sort: SortKey;
	threads: UiThread[];
	loading: boolean;
	onNewThread: () => void;
	onOpenThread: (id: string) => void;
	query: string;
	signedIn: boolean;
	onSignIn: () => void;
}) {
	const cols = "60px minmax(0,1fr) 170px 180px 130px 130px 180px";
	const sortLabel = SORTS.find((s) => s.key === sort)?.label ?? "RISING";
	const showLock = !signedIn && !loading && threads.length > 0;
	const hideDividers = showLock || threads.length === 0 || (loading && threads.length === 0);
	return (
		<section className="relative flex min-h-[640px] flex-col border-t border-black md:border-l md:border-t-0">
			{/* Header row — desktop grid */}
			<div
				className="hidden items-stretch border-b border-black text-[11.5px] font-bold tracking-[0.18em] text-black md:grid"
				style={{ gridTemplateColumns: cols }}
			>
				<div />
				<div className="flex items-center px-4 py-3.5">{sortLabel}</div>
				<div className="flex items-center justify-center border-l border-black px-4 py-3.5">
					TYPE
				</div>
				<div className="flex items-center justify-center border-l border-black px-4 py-3.5">
					CATEGORY
				</div>
				<div className="flex items-center justify-center border-l border-black px-4 py-3.5">
					REPLIES
				</div>
				<div className="flex items-center justify-center border-l border-black px-4 py-3.5">
					VOTES
				</div>
				<div className="flex items-center justify-center border-l border-black px-3 py-2">
					<button
						type="button"
						onClick={onNewThread}
						className="rounded-[3px] px-4 py-2 text-[11px] font-bold tracking-[0.16em] text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
						style={{ background: BRAND_ORANGE }}
					>
						NEW&nbsp;THREAD
					</button>
				</div>
			</div>

			{/* Header row — mobile: active sort label + NEW THREAD button */}
			<div className="flex items-stretch justify-between border-b-2 border-black md:hidden">
				<div className="flex items-center px-4 py-3 text-[11.5px] font-bold tracking-[0.18em] text-black">
					{sortLabel}
				</div>
				<button
					type="button"
					onClick={onNewThread}
					className="flex items-center justify-center border-l-2 border-black px-4 text-[11px] font-bold tracking-[0.16em] text-white"
					style={{ background: BRAND_ORANGE }}
				>
					NEW&nbsp;THREAD
				</button>
			</div>

			{/* Rows */}
			{loading && threads.length === 0 ? (
				<SkeletonRows cols={cols} count={6} />
			) : threads.length === 0 ? (
				<div className="px-6 py-14 text-center text-[12px] tracking-[0.1em] text-black/50">
					{query.trim()
						? `NO RESULTS FOR “${query.trim().toUpperCase()}”`
						: "NO THREADS YET — START ONE."}
				</div>
			) : (
				<div className={showLock ? "select-none [filter:blur(5px)]" : ""}>
					{threads.map((t, i) => (
						<ThreadRow
							key={t.id}
							thread={t}
							cols={cols}
							isLast={i === threads.length - 1}
							onOpen={() => (showLock ? onSignIn() : onOpenThread(t.id))}
						/>
					))}
				</div>
			)}

			{/* Empty-space filler that keeps column dividers extending down */}
			{hideDividers ? (
				<div className="flex-1" />
			) : (
				<div
					className="hidden flex-1 items-stretch md:grid"
					style={{ gridTemplateColumns: cols }}
					aria-hidden
				>
					<div />
					<div />
					<div className="border-l border-black" />
					<div className="border-l border-black" />
					<div className="border-l border-black" />
					<div className="border-l border-black" />
					<div className="border-l border-black" />
				</div>
			)}

			{showLock ? <LockOverlay onSignIn={onSignIn} /> : null}
		</section>
	);
}

function SkeletonRows({ cols, count }: { cols: string; count: number }) {
	return (
		<>
			<style>{`
				@keyframes fz-shimmer {
					0% { background-position: -200% 0; }
					100% { background-position: 200% 0; }
				}
				.fz-skel {
					background: linear-gradient(
						90deg,
						rgba(0,0,0,0.05) 0%,
						rgba(0,0,0,0.12) 50%,
						rgba(0,0,0,0.05) 100%
					);
					background-size: 200% 100%;
					animation: fz-shimmer 1.4s linear infinite;
				}
				@media (prefers-reduced-motion: reduce) {
					.fz-skel { animation: none; background: rgba(0,0,0,0.08); }
				}
			`}</style>
			{Array.from({ length: count }).map((_, i) => (
				<div key={i}>
					{/* Desktop grid skeleton */}
					<div
						className={`hidden items-stretch border-b text-[13px] md:grid ${
							i === count - 1 ? "border-black/15" : "border-black"
						}`}
						style={{ gridTemplateColumns: cols }}
					>
						<div className="flex items-center justify-center py-4 pl-4">
							<span className="fz-skel h-8 w-8 border border-black/20" />
						</div>
						<div className="flex flex-col justify-center gap-2 px-4 py-4">
							<span
								className="fz-skel h-3"
								style={{ width: `${55 + ((i * 11) % 35)}%` }}
							/>
							<span className="fz-skel h-2 w-1/4" />
						</div>
						<div className="flex items-center justify-center border-l border-black px-4 py-4">
							<span className="fz-skel h-5 w-20" />
						</div>
						<div className="flex items-center justify-center border-l border-black px-4 py-4">
							<span className="fz-skel h-3 w-16" />
						</div>
						<div className="flex items-center justify-center border-l border-black px-4 py-4">
							<span className="fz-skel h-3 w-6" />
						</div>
						<div className="flex items-center justify-center border-l border-black px-4 py-4">
							<span className="fz-skel h-3 w-6" />
						</div>
						<div className="flex items-center justify-center border-l border-black px-4 py-4">
							<span className="fz-skel h-3 w-10" />
						</div>
					</div>

					{/* Mobile card skeleton */}
					<div
						className={`flex flex-col gap-3 border-b px-4 py-4 md:hidden ${
							i === count - 1 ? "border-black/15" : "border-black"
						}`}
					>
						<div className="flex items-start gap-3">
							<span className="fz-skel h-9 w-9 shrink-0 border border-black/20" />
							<div className="flex flex-1 flex-col gap-2">
								<span
									className="fz-skel h-3.5"
									style={{ width: `${60 + ((i * 9) % 30)}%` }}
								/>
								<span className="fz-skel h-2.5 w-1/3" />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<span className="fz-skel h-5 w-20" />
							<span className="fz-skel h-5 w-16" />
							<span className="fz-skel ml-auto h-3 w-12" />
						</div>
					</div>
				</div>
			))}
		</>
	);
}

function LockOverlay({ onSignIn }: { onSignIn: () => void }) {
	return (
		<div className="absolute inset-0 z-10 flex items-center justify-center">
			<div className="pointer-events-none absolute inset-0 bg-[var(--fz-paper)]/70" />
			<div
				className="relative flex flex-col items-center gap-5 px-6 text-center"
				style={{ fontFamily: "var(--font-display)" }}
			>
				<div
					className="flex h-16 w-16 items-center justify-center border-2 border-black bg-[var(--fz-paper)]"
					style={{ boxShadow: "5px 5px 0 #000" }}
				>
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden
					>
						<rect x="5" y="11" width="14" height="9" rx="1.5" />
						<path d="M8 11V7a4 4 0 0 1 8 0v4" />
					</svg>
				</div>
				<div>
					<div className="text-[22px] font-bold tracking-[-0.005em] text-black">
						Locked to NS members
					</div>
					<p
						className="mt-1.5 max-w-[300px] text-[12.5px] leading-[1.55] text-black/55"
						style={{ fontFamily: "var(--font-sans)" }}
					>
						Discussions are gated by a zero-knowledge proof of NS membership —
						sign in to read and reply.
					</p>
				</div>
				<button
					type="button"
					onClick={onSignIn}
					className="inline-flex items-center gap-2 border-2 border-black px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-white transition-transform hover:-translate-y-[1px] active:translate-y-0"
					style={{
						background: BRAND_ORANGE,
						boxShadow: "3px 3px 0 #000",
					}}
				>
					SIGN IN TO READ
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.4"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden
					>
						<path d="M5 12h14M13 5l7 7-7 7" />
					</svg>
				</button>
			</div>
		</div>
	);
}

function ThreadRow({
	thread,
	cols,
	isLast,
	onOpen,
}: {
	thread: UiThread;
	cols: string;
	isLast: boolean;
	onOpen: () => void;
}) {
	const isPoll = Boolean(thread.hasPoll);
	const votesDisplay = isPoll ? String(thread.voters ?? 0) : "—";
	const brandVar = { ["--brand" as string]: BRAND_ORANGE } as React.CSSProperties;
	const onKey = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onOpen();
		}
	};
	return (
		<>
			{/* Desktop: grid row */}
			<div
				role="button"
				tabIndex={0}
				onClick={onOpen}
				onKeyDown={onKey}
				className={`group hidden cursor-pointer items-stretch border-b text-[13px] font-normal text-black/75 transition-colors hover:bg-black/[0.035] md:grid ${
					isLast ? "border-black/15" : "border-black"
				}`}
				style={{ gridTemplateColumns: cols }}
			>
				<div className="flex items-center justify-center py-4 pl-4">
					<span className="flex h-8 w-8 items-center justify-center border border-black">
						<RowGlyph kind={isPoll ? "poll" : thread.tag} />
					</span>
				</div>
				<div className="flex min-w-0 flex-col justify-center px-4 py-4">
					<span
						className="block truncate font-semibold text-black transition-colors group-hover:text-[color:var(--brand)]"
						style={brandVar}
					>
						{thread.title}
					</span>
					<div
						className="mt-0.5 truncate text-[11px] tracking-[0.04em] text-black/50"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{thread.authorHandle} · {thread.time}
					</div>
				</div>
				<div className="flex items-center justify-center border-l border-black px-4 py-4">
					<TypePill kind={isPoll ? "POLL" : "DISCUSSION"} />
				</div>
				<div className="flex items-center justify-center border-l border-black px-4 py-4">
					{thread.tag}
				</div>
				<div className="flex items-center justify-center border-l border-black px-4 py-4">
					{thread.replies}
				</div>
				<div className="flex items-center justify-center border-l border-black px-4 py-4 text-black/55">
					{votesDisplay}
				</div>
				<div className="flex items-center justify-center border-l border-black px-4 py-4">
					{thread.lastReply?.time ?? thread.time}
				</div>
			</div>

			{/* Mobile: card */}
			<div
				role="button"
				tabIndex={0}
				onClick={onOpen}
				onKeyDown={onKey}
				className={`group flex cursor-pointer flex-col gap-3 border-b px-4 py-4 text-[13px] text-black/75 transition-colors hover:bg-black/[0.035] active:bg-black/[0.06] md:hidden ${
					isLast ? "border-black/15" : "border-black"
				}`}
			>
				<div className="flex items-start gap-3">
					<span className="flex h-9 w-9 shrink-0 items-center justify-center border border-black">
						<RowGlyph kind={isPoll ? "poll" : thread.tag} />
					</span>
					<div className="flex min-w-0 flex-1 flex-col">
						<span
							className="line-clamp-2 break-words text-[15px] font-semibold leading-[1.3] text-black transition-colors group-hover:text-[color:var(--brand)]"
							style={brandVar}
						>
							{thread.title}
						</span>
						<div
							className="mt-1 truncate text-[11px] tracking-[0.04em] text-black/50"
							style={{ fontFamily: "var(--font-display)" }}
						>
							{thread.authorHandle} · {thread.time}
						</div>
					</div>
				</div>
				<div
					className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/55"
					style={{ fontFamily: "var(--font-display)" }}
				>
					<TypePill kind={isPoll ? "POLL" : "DISCUSSION"} />
					<span className="border border-black/30 px-2 py-1 text-black">
						{thread.tag}
					</span>
					<span className="ml-auto inline-flex items-center gap-1.5">
						<span title="Replies">💬 {thread.replies}</span>
						{isPoll ? <span title="Voters">▣ {votesDisplay}</span> : null}
					</span>
				</div>
			</div>
		</>
	);
}

type ThreadDetail = {
	id: string;
	tag: string;
	title: string;
	body: string;
	authorHandle: string;
	time: string;
	replies: number;
	pollId?: string;
	txHash?: string;
};

type CommentRow = {
	handle: string;
	body: string;
	time: string;
};

type PollDetail = {
	id: string;
	question: string;
	closesAt: number;
	closed: boolean;
	closesIn: string | null;
	voters: number;
	myVote: number | null;
	txHash?: string;
	options: { label: string; votes: number }[];
};

function ThreadDetailPanel({
	threadId,
	signedIn,
	onBack,
	onSignIn,
}: {
	threadId: string;
	signedIn: boolean;
	onBack: () => void;
	onSignIn: () => void;
}) {
	const toast = useToast();
	const [thread, setThread] = useState<ThreadDetail | null>(null);
	const [comments, setComments] = useState<CommentRow[]>([]);
	const [poll, setPoll] = useState<PollDetail | null>(null);
	const [voting, setVoting] = useState(false);
	const [loading, setLoading] = useState(true);
	const [draft, setDraft] = useState("");
	const [posting, setPosting] = useState(false);
	const [focused, setFocused] = useState(false);

	const refresh = useCallback(async () => {
		try {
			const r = await fetch(`/api/threads/${threadId}`, { cache: "no-store" });
			if (!r.ok) return;
			const data = await r.json();
			setThread(data.thread ?? null);
			setComments(data.comments ?? []);
			setPoll(data.poll ?? null);
		} finally {
			setLoading(false);
		}
	}, [threadId]);

	async function castVote(optionIdx: number) {
		if (!signedIn) return onSignIn();
		if (!poll || poll.myVote != null || poll.closed || voting) return;
		setVoting(true);
		const toastId = toast.pending("Casting your vote…");
		try {
			const r = await fetch("/api/poll/cast", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pollId: poll.id, option: optionIdx }),
			});
			const data = await r.json().catch(() => ({}));
			if (r.ok) {
				toast.success(toastId, {
					title: "Vote recorded on-chain.",
					txHash: data.txHash,
				});
				refresh();
			} else {
				toast.error(toastId, {
					title: "Vote failed.",
					detail: data.error,
				});
			}
		} catch (e) {
			toast.error(toastId, {
				title: "Vote failed.",
				detail: e instanceof Error ? e.message : undefined,
			});
		} finally {
			setVoting(false);
		}
	}

	useEffect(() => {
		refresh();
		const t = setInterval(refresh, 5000);
		return () => clearInterval(t);
	}, [refresh]);

	async function postReply() {
		if (!signedIn) return onSignIn();
		const text = draft.trim();
		if (!text || posting) return;
		setPosting(true);
		const toastId = toast.pending("Replying anonymously…");
		try {
			const r = await fetch("/api/comments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					parent_type: "thread",
					parent_id: threadId,
					body: text,
				}),
			});
			const data = await r.json().catch(() => ({}));
			if (r.ok) {
				setDraft("");
				toast.success(toastId, {
					title: "Reply published anonymously.",
					txHash: data.txHash,
				});
				refresh();
			} else {
				toast.error(toastId, {
					title: "Reply failed.",
					detail: data.error,
				});
			}
		} catch (e) {
			toast.error(toastId, {
				title: "Reply failed.",
				detail: e instanceof Error ? e.message : undefined,
			});
		} finally {
			setPosting(false);
		}
	}

	const isPoll = thread ? Boolean(thread.pollId) : false;
	const votes = thread ? Math.max(0, Math.round(thread.replies * 3.2)) : 0;
	const brandVar = { ["--brand" as string]: BRAND_ORANGE } as React.CSSProperties;

	return (
		<section className="relative flex min-h-[640px] flex-col border-t border-black md:border-l md:border-t-0">
			{/* Top action bar — cells like the table header */}
			<div className="flex items-stretch border-b border-black text-[11.5px] font-bold tracking-[0.18em] text-black">
				<button
					type="button"
					onClick={onBack}
					className="group inline-flex items-center gap-2 px-4 py-3.5 transition-colors hover:bg-black hover:text-white md:px-6"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.6"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
					BACK
				</button>
				<div className="hidden flex-1 items-center border-l border-black px-6 py-3.5 text-black/55 md:flex">
					DISCUSSION
				</div>
				<div className="flex-1 md:hidden" />
				{thread?.txHash ? (
					<a
						href={arkivTxUrl(thread.txHash)}
						target="_blank"
						rel="noopener noreferrer"
						className="group inline-flex items-center gap-2 border-l border-black px-3 py-3.5 text-black/65 transition-colors hover:bg-black hover:text-white md:px-5"
						title={`Arkiv tx ${thread.txHash}`}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden
						>
							<path d="M3 8l9-5 9 5-9 5-9-5Z" />
							<path d="M3 8v8l9 5 9-5V8" />
						</svg>
						<span className="text-[10.5px] tracking-[0.16em]">ARKIV</span>
						<span
							className="hidden text-[10.5px] tracking-[0.02em] text-black/45 group-hover:text-white sm:inline"
							style={{ fontFamily: "var(--font-mono)" }}
						>
							{thread.txHash.slice(0, 6)}…{thread.txHash.slice(-4)}
						</span>
						<svg
							width="10"
							height="10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden
						>
							<path d="M7 17 17 7M9 7h8v8" />
						</svg>
					</a>
				) : null}
				<div className="flex items-center gap-2 border-l border-black px-4 py-3.5 text-black/55 md:px-6">
					<span
						className="inline-block h-2 w-2 animate-pulse rounded-full"
						style={brandVar}
					>
						<span
							className="block h-full w-full rounded-full"
							style={{ background: BRAND_ORANGE }}
						/>
					</span>
					LIVE
				</div>
			</div>

			{loading && !thread ? (
				<div className="flex-1 px-6 py-12 text-center text-[12px] font-bold tracking-[0.2em] text-black/50">
					LOADING…
				</div>
			) : !thread ? (
				<div className="flex-1 px-6 py-14 text-center text-[12px] font-bold tracking-[0.2em] text-black/50">
					THREAD NOT FOUND.
				</div>
			) : (
				<article className="flex-1">
					{/* Hero — eyebrow, title, author */}
					<header className="border-b-2 border-black px-5 py-6 md:px-10 md:py-9">
						<div className="flex items-center gap-3">
							<span className="flex h-8 w-8 items-center justify-center border border-black">
								<RowGlyph kind={thread.tag} />
							</span>
							<TypePill kind={isPoll ? "POLL" : "DISCUSSION"} />
							<span
								className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/55"
								style={{ fontFamily: "var(--font-display)" }}
							>
								/ {thread.tag}
							</span>
						</div>
						<h1
							className="mt-6 text-black"
							style={{
								fontFamily: "var(--font-display)",
								fontWeight: 700,
								fontSize: "clamp(28px, 4.2vw, 48px)",
								lineHeight: 1.05,
								letterSpacing: "-0.015em",
							}}
						>
							{thread.title}
						</h1>
						<div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-bold tracking-[0.06em] text-black/55"
							style={{ fontFamily: "var(--font-display)" }}
						>
							<span className="inline-flex items-center gap-2">
								<span
									className="inline-block h-1.5 w-1.5 rounded-full"
									style={{ background: BRAND_ORANGE }}
								/>
								{thread.authorHandle}
							</span>
							<span className="text-black/30">·</span>
							<span>{thread.time}</span>
						</div>
					</header>


					{/* Body */}
					{thread.body ? (
						<div className="border-b-2 border-black px-5 py-6 md:px-10 md:py-8">
							<p
								className="max-w-[68ch] whitespace-pre-wrap text-[15px] leading-[1.7] text-black/85"
								style={{ fontFamily: "var(--font-sans)" }}
							>
								{thread.body}
							</p>
						</div>
					) : null}

					{/* Poll (optional) */}
					{poll ? (
						<PollBlock poll={poll} onVote={castVote} voting={voting} />
					) : null}

					{/* Replies */}
					<div className="px-5 py-6 md:px-10 md:py-7">
						<div className="mb-5 text-[12px] font-bold uppercase tracking-[0.18em]">
							<span className="border-b-2 border-black pb-1">
								Replies ({comments.length})
							</span>
						</div>

						{comments.length === 0 ? (
							<div className="border border-dashed border-black/30 px-5 py-8 text-center text-[12px] font-bold uppercase tracking-[0.16em] text-black/40">
								No replies yet — be the first.
							</div>
						) : (
							<ul className="flex flex-col gap-3">
								{comments.map((c, i) => (
									<li
										key={`${c.handle}-${i}`}
										className="group border border-black bg-white/40 p-5 transition-shadow hover:shadow-[4px_4px_0_#000]"
									>
										<div
											className="flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] text-black/65"
											style={{ fontFamily: "var(--font-display)" }}
										>
											<span
												className="inline-block h-1.5 w-1.5 rounded-full bg-black/40 transition-colors group-hover:bg-[color:var(--brand)]"
												style={brandVar}
											/>
											<span className="uppercase">{c.handle}</span>
											<span className="text-black/30">·</span>
											<span>{c.time}</span>
										</div>
										<p
											className="mt-2 whitespace-pre-wrap text-[14px] leading-[1.65] text-black/90"
											style={{ fontFamily: "var(--font-sans)" }}
										>
											{c.body}
										</p>
									</li>
								))}
							</ul>
						)}
					</div>

					{/* Reply composer */}
					<div className="border-t-2 border-black px-5 py-6 md:px-10 md:py-7">
						{signedIn ? (
							<div>
								<div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em]">
									<span className="border-b-2 border-black pb-1">
										Write a reply
									</span>
								</div>
								<div
									className="border-2 border-black bg-white transition-shadow"
									style={{
										boxShadow: focused ? `4px 4px 0 ${BRAND_ORANGE}` : "none",
									}}
								>
									<textarea
										value={draft}
										onChange={(e) => setDraft(e.target.value)}
										onFocus={() => setFocused(true)}
										onBlur={() => setFocused(false)}
										placeholder="Be specific. Mono replies welcome."
										rows={4}
										className="block w-full resize-y bg-transparent px-4 py-3 text-[14px] leading-[1.6] text-black placeholder:text-black/35 focus:outline-none"
										style={{ fontFamily: "var(--font-sans)" }}
										onKeyDown={(e) => {
											if ((e.metaKey || e.ctrlKey) && e.key === "Enter")
												postReply();
										}}
									/>
								</div>
								<div className="mt-3 flex items-center justify-between">
									<div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/45">
										⌘↵ to post · fresh anonymous handle
									</div>
									<button
										type="button"
										onClick={postReply}
										disabled={!draft.trim() || posting}
										className="inline-flex items-center gap-2 border-2 border-black px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-white transition-all hover:-translate-y-[1px] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
										style={{
											background: BRAND_ORANGE,
											boxShadow: "3px 3px 0 #000",
										}}
									>
										{posting ? "POSTING…" : "POST REPLY"}
									</button>
								</div>
							</div>
						) : (
							<button
								type="button"
								onClick={onSignIn}
								className="flex w-full items-center justify-center gap-2 border-2 border-black bg-transparent px-4 py-4 text-[12px] font-bold tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white"
							>
								SIGN IN TO REPLY
								<svg
									width="13"
									height="13"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.4"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M5 12h14M13 5l7 7-7 7" />
								</svg>
							</button>
						)}
					</div>
				</article>
			)}
		</section>
	);
}

function PollBlock({
	poll,
	onVote,
	voting,
}: {
	poll: PollDetail;
	onVote: (idx: number) => void;
	voting: boolean;
}) {
	const total = poll.options.reduce((a, b) => a + b.votes, 0);
	const showResults = poll.myVote != null || poll.closed;
	return (
		<div className="border-b-2 border-black px-5 py-6 md:px-10 md:py-7">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div className="text-[12px] font-bold uppercase tracking-[0.18em]">
					<span className="border-b-2 border-black pb-1">Poll</span>
				</div>
				<div
					className="flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/55"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{poll.txHash ? <ArkivPill txHash={poll.txHash} /> : null}
					<span>{poll.voters} voters</span>
					<span className="text-black/25">·</span>
					<span style={{ color: poll.closed ? "#a3460a" : undefined }}>
						{poll.closed
							? "CLOSED"
							: poll.closesIn
								? `CLOSES IN ${poll.closesIn.toUpperCase()}`
								: "OPEN"}
					</span>
				</div>
			</div>
			<ul className="flex flex-col gap-2">
				{poll.options.map((opt, i) => {
					const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
					const isMine = poll.myVote === i;
					const canVote = !showResults && !voting;
					return (
						<li key={i}>
							<button
								type="button"
								onClick={() => onVote(i)}
								disabled={!canVote}
								className="group relative block w-full overflow-hidden border-2 border-black bg-white text-left transition-shadow hover:enabled:shadow-[3px_3px_0_#000] disabled:cursor-default"
							>
								{showResults ? (
									<span
										aria-hidden
										className="absolute inset-0 origin-left"
										style={{
											width: `${pct}%`,
											background: isMine
												? BRAND_ORANGE
												: "rgba(0,0,0,0.07)",
											transition: "width 400ms cubic-bezier(.2,.8,.2,1)",
										}}
									/>
								) : null}
								<div className="relative flex items-center justify-between gap-4 px-4 py-3">
									<span className="flex items-center gap-3">
										<span
											className="flex h-6 w-6 items-center justify-center border border-black text-[11px] font-bold"
											style={{
												fontFamily: "var(--font-display)",
												background: isMine ? "#000" : "transparent",
												color: isMine ? "#fff" : "#000",
											}}
										>
											{String.fromCharCode(65 + i)}
										</span>
										<span
											className="text-[14px] font-semibold"
											style={{
												color: showResults && isMine ? "#fff" : "#000",
												fontFamily: "var(--font-sans)",
											}}
										>
											{opt.label}
										</span>
									</span>
									{showResults ? (
										<span
											className="text-[12px] font-bold tracking-[0.06em]"
											style={{
												fontFamily: "var(--font-display)",
												color: isMine ? "#fff" : "#000",
											}}
										>
											{pct}% · {opt.votes}
										</span>
									) : (
										<span
											className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/45 group-hover:text-[color:var(--brand)]"
											style={
												{
													fontFamily: "var(--font-display)",
													["--brand" as string]: BRAND_ORANGE,
												} as React.CSSProperties
											}
										>
											Vote ▸
										</span>
									)}
								</div>
							</button>
						</li>
					);
				})}
			</ul>
			{!showResults ? (
				<p className="mt-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/40">
					One vote per member · cast a vote to see results
				</p>
			) : null}
		</div>
	);
}

function ArkivPill({ txHash }: { txHash: string }) {
	return (
		<a
			href={arkivTxUrl(txHash)}
			target="_blank"
			rel="noopener noreferrer"
			title={`Arkiv tx ${txHash}`}
			className="group inline-flex items-center gap-1.5 border border-black/30 px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-black/65 transition-colors hover:border-black hover:bg-black hover:text-white"
		>
			<svg
				width="10"
				height="10"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden
			>
				<path d="M3 8l9-5 9 5-9 5-9-5Z" />
				<path d="M3 8v8l9 5 9-5V8" />
			</svg>
			ARKIV
			<span
				className="text-[10px] tracking-[0.02em] text-black/45 group-hover:text-white"
				style={{ fontFamily: "var(--font-mono)" }}
			>
				{txHash.slice(0, 6)}…{txHash.slice(-4)}
			</span>
		</a>
	);
}

function TypePill({ kind }: { kind: "POLL" | "DISCUSSION" }) {
	return (
		<span className="inline-flex items-center rounded-[4px] border border-black/35 px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.16em] text-black/80">
			{kind}
		</span>
	);
}

function RowGlyph({ kind }: { kind: string }) {
	const k = kind.toLowerCase();
	if (k.includes("poll")) return <IconBars />;
	if (k.includes("food")) return <IconFork />;
	if (k.includes("gym")) return <IconDumbbell />;
	if (k.includes("crypto")) return <IconCoin />;
	if (k.includes("ai")) return <IconSpark />;
	if (k.includes("build")) return <IconHammer />;
	if (k.includes("trip")) return <IconPlane />;
	if (k.includes("hous")) return <IconHouse />;
	if (k.includes("marina")) return <IconBuilding />;
	if (k.includes("cohort")) return <IconUsers />;
	return <IconChat />;
}

/* ---------- icons ---------- */

function svgProps(extra?: string) {
	return {
		width: 16,
		height: 16,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.8,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
		className: extra,
		"aria-hidden": true,
	};
}

function IconFlame() {
	return (
		<svg {...svgProps()}>
			<path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .3-2 1-3-1 1-3 3-3 6a6 6 0 0 0 12 0c0-5-6-11-6-11Z" />
		</svg>
	);
}
function IconClock() {
	return (
		<svg {...svgProps()}>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" />
		</svg>
	);
}
function IconTrend() {
	return (
		<svg {...svgProps()}>
			<path d="M3 17 9 11l4 4 8-8" />
			<path d="M14 7h7v7" />
		</svg>
	);
}
function IconBars() {
	return (
		<svg {...svgProps()}>
			<path d="M5 20V12M12 20V6M19 20v-10" />
		</svg>
	);
}
function IconChat() {
	return (
		<svg {...svgProps()}>
			<path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4a8 8 0 0 1 8-12h2a8 8 0 0 1 8 5" />
		</svg>
	);
}
function IconFork() {
	return (
		<svg {...svgProps()}>
			<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v6a2 2 0 0 0 2 2M11 3v6a2 2 0 0 1-2 2" />
			<path d="M17 3c-1.5 0-3 1-3 4v6h3v8" />
		</svg>
	);
}
function IconDumbbell() {
	return (
		<svg {...svgProps()}>
			<path d="M2 12h2M20 12h2" />
			<rect x="4" y="9" width="3" height="6" rx="0.5" />
			<rect x="17" y="9" width="3" height="6" rx="0.5" />
			<path d="M7 12h10" strokeWidth={2.2} />
		</svg>
	);
}
function IconCoin() {
	return (
		<svg {...svgProps()}>
			<circle cx="12" cy="12" r="9" />
			<path d="M14 9h-3.5a1.5 1.5 0 0 0 0 3h3a1.5 1.5 0 0 1 0 3H10" />
			<path d="M12 7v1.5M12 15.5V17" />
		</svg>
	);
}
function IconSpark() {
	return (
		<svg {...svgProps()}>
			<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
			<path d="M19 16l.7 2L22 19l-2.3.7-.7 2-.7-2L16 19l2.3-.7L19 16Z" />
		</svg>
	);
}
function IconHammer() {
	return (
		<svg {...svgProps()}>
			<path d="M14 4l6 6-2 2-6-6 2-2Z" />
			<path d="M12 8L4 16v4h4l8-8" />
		</svg>
	);
}
function IconPlane() {
	return (
		<svg {...svgProps()}>
			<path d="M2 12l8 2 4 6 2-1-2-6 7-3 1 1-5 5 1 1" strokeLinejoin="round" />
		</svg>
	);
}
function IconHouse() {
	return (
		<svg {...svgProps()}>
			<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9Z" />
		</svg>
	);
}
function IconBuilding() {
	return (
		<svg {...svgProps()}>
			<rect x="5" y="3" width="14" height="18" rx="1" />
			<path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
		</svg>
	);
}
function IconUsers() {
	return (
		<svg {...svgProps()}>
			<circle cx="9" cy="9" r="3.2" />
			<path d="M3 20c.6-3.4 3-5 6-5s5.4 1.6 6 5" />
			<circle cx="17" cy="8" r="2.5" />
			<path d="M15 14c2-.4 4 0 5.6 1.6.6.6 1 1.4 1.2 2.4" />
		</svg>
	);
}
