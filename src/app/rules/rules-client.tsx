"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/forum/top-bar";

const BRAND_ORANGE = "#FE4C02";

type Rule = {
	title: string;
	body: ReactNode;
	tone?: "default" | "warn";
};

const RULES: Rule[] = [
	{
		title: "you're anonymous to the room.",
		body: (
			<>
				Your handle is a hash of a private nullifier. It&apos;s unique to
				this app and not tied to your Discord. The forum, Arkiv, and anyone
				reading the chain can prove you&apos;re NS, but never which NS
				member. Don&apos;t leak the link by signing posts with your real
				name.
			</>
		),
	},
	{
		title: "you're not anonymous to yourself.",
		body: (
			<>
				One member, one vote. The same nullifier signs every action you take
				here. Polls can&apos;t be brigaded. A thread can&apos;t be flooded
				by one person pretending to be many.
			</>
		),
	},
	{
		title: "no doxxing. yours or anyone else's.",
		body: (
			<>
				No real names. No Discord IDs. No room numbers, photos, or anything
				else that could out a member. The whole thing breaks if one person
				cracks the lid.
			</>
		),
	},
	{
		title: "posts are permanent.",
		tone: "warn",
		body: (
			<>
				Every thread, comment, poll, and vote is an Arkiv entity. The forum
				can&apos;t delete them. Neither can you. Think before you post.
				Past-you is forever.
			</>
		),
	},
	{
		title: "stay on theme.",
		body: (
			<>
				Pick the right category before you post:{" "}
				<Tag>food</Tag>, <Tag>gym</Tag>, <Tag>crypto</Tag>,{" "}
				<Tag>build</Tag>, <Tag>trips</Tag>, <Tag>housing</Tag>,{" "}
				<Tag>marina hotel</Tag>, <Tag>cohorts</Tag>, <Tag>ai</Tag>, or{" "}
				<Tag>general</Tag>. The wrong tag annoys people faster than the
				wrong opinion.
			</>
		),
	},
	{
		title: "no spam. no shilling.",
		body: (
			<>
				No airdrops. No referral codes. No "check out my project bro" drops.
				If you built something NS people would actually use, post what you
				learned and let them ask.
			</>
		),
	},
	{
		title: "argue the take, not the human.",
		body: (
			<>
				Civility is the default. Personal attacks, slurs, and bait will get
				a thread locked. You don&apos;t know who&apos;s on the other side
				of the handle. That&apos;s the point.
			</>
		),
	},
	{
		title: "lose your passphrase, lose your identity.",
		tone: "warn",
		body: (
			<>
				Your encrypted backup lives on Arkiv. Your passphrase only lives in
				your head (and maybe a password manager). Lose it and nobody can
				recover it. Not us. Not Arkiv. Save it somewhere off-device.
			</>
		),
	},
	{
		title: "you can start over.",
		body: (
			<>
				Don&apos;t like the identity you have? Open{" "}
				<a
					href="/profile"
					className="font-bold underline decoration-2 underline-offset-2 transition-colors hover:text-[color:var(--brand)]"
					style={{ ["--brand" as string]: BRAND_ORANGE } as React.CSSProperties}
				>
					Profile
				</a>{" "}
				and hit Delete Identity. We tombstone your backup on Arkiv, drop
				your subject hash from the group, and wipe this device. Old posts
				stay on chain, still anonymous. New posts come from a new handle.
			</>
		),
	},
];

export function RulesClient({
	signedIn,
	handle,
}: {
	signedIn: boolean;
	handle?: string;
}) {
	const [query, setQuery] = useState("");
	return (
		<div
			className="min-h-screen text-black"
			style={{
				background: "var(--fz-paper)",
				fontFamily: "var(--font-display)",
			}}
		>
			<style>{`
				@keyframes fz-rise {
					from { opacity: 0; transform: translateY(14px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				@keyframes fz-pulse {
					0%,100% { opacity: 0.55; transform: scale(1); }
					50%     { opacity: 1;    transform: scale(1.06); }
				}
				.fz-rise   { animation: fz-rise .55s cubic-bezier(.21,.7,.2,1) both; }
				.fz-pulse  { animation: fz-pulse 2.6s ease-in-out infinite; }
				@media (prefers-reduced-motion: reduce) {
					.fz-rise { animation: none; opacity: 1; transform: none; }
					.fz-pulse { animation: none; opacity: .85; }
				}
			`}</style>

			<TopBar
				signedIn={signedIn}
				onSignIn={() => {
					window.location.href = "/auth";
				}}
				onSignOut={async () => {
					await fetch("/api/sign-out", { method: "POST" });
					window.location.href = "/";
				}}
				handle={handle}
				query={query}
				onQueryChange={(q) => {
					setQuery(q);
					if (q.trim()) {
						window.location.href = `/?q=${encodeURIComponent(q.trim())}`;
					}
				}}
				onOpenMenu={() => {
					window.location.href = "/";
				}}
				activeNav="RULES"
			/>

			<Hero count={RULES.length} />

			<main className="mx-auto flex max-w-[1180px] flex-col gap-7 px-5 pb-24 pt-10 md:px-9">
				<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
					{RULES.map((rule, i) => (
						<RuleCard
							key={rule.title}
							index={i + 1}
							title={rule.title}
							body={rule.body}
							tone={rule.tone}
							delayMs={(i % 3) * 60}
						/>
					))}
				</div>

				<Closer count={RULES.length} />
			</main>
		</div>
	);
}

function Hero({ count }: { count: number }) {
	const [shown, setShown] = useState(0);
	useEffect(() => {
		let raf = 0;
		const start = performance.now();
		const dur = 900;
		const tick = (t: number) => {
			const p = Math.min(1, (t - start) / dur);
			const eased = 1 - (1 - p) ** 3;
			setShown(Math.round(eased * count));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [count]);

	return (
		<section className="relative overflow-hidden border-b-2 border-black">
			<OrbitingMarks />
			<div className="relative mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-9 md:py-20">
				<div className="fz-rise">
					<div className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/55">
						<span className="border-b-2 border-black pb-1">THE CONTRACT</span>
					</div>
					<h1
						className="mt-5 text-black"
						style={{
							fontFamily: "var(--font-display)",
							fontWeight: 700,
							fontSize: "clamp(54px, 11vw, 130px)",
							lineHeight: 0.88,
							letterSpacing: "-0.02em",
						}}
					>
						the&nbsp;rules.
					</h1>
					<p
						className="mt-5 max-w-[460px] text-[14px] leading-[1.6] text-black/65"
						style={{ fontFamily: "var(--font-sans)" }}
					>
						forumzero stays anonymous on purpose. That only works if
						everyone plays by the same rules. Read these once. They&apos;re
						short.
					</p>
				</div>

				<div
					className="fz-rise relative flex flex-col items-end"
					style={{ animationDelay: "120ms" }}
				>
					<div
						className="border-2 border-black p-5"
						style={{
							background: "rgba(254,76,2,0.06)",
							boxShadow: "6px 6px 0 #000",
						}}
					>
						<div className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-black/55">
							in effect
						</div>
						<div
							className="mt-1"
							style={{
								fontFamily: "var(--font-display)",
								fontWeight: 700,
								fontSize: 64,
								lineHeight: 1,
								letterSpacing: "-0.02em",
								color: BRAND_ORANGE,
							}}
						>
							{String(shown).padStart(2, "0")}
						</div>
						<div className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/55">
							rules total
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function OrbitingMarks() {
	return (
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0"
			style={{
				background:
					"radial-gradient(100% 60% at 50% -8%, rgba(254,76,2,0.10) 0%, rgba(0,0,0,0) 60%)",
			}}
		>
			<svg
				className="absolute -left-12 -top-10 fz-pulse text-black/[0.04]"
				width="240"
				height="240"
				viewBox="0 0 24 24"
				fill="currentColor"
			>
				<path d="M12 2 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
			</svg>
			<svg
				className="absolute -right-16 -bottom-12 fz-pulse text-black/[0.05]"
				width="280"
				height="280"
				viewBox="0 0 24 24"
				fill="currentColor"
				style={{ animationDelay: "1s" }}
			>
				<rect x="5" y="11" width="14" height="9" rx="1.5" />
				<path d="M8 11V7a4 4 0 0 1 8 0v4" />
			</svg>
		</div>
	);
}

function RuleCard({
	index,
	title,
	body,
	tone = "default",
	delayMs,
}: {
	index: number;
	title: string;
	body: ReactNode;
	tone?: "default" | "warn";
	delayMs: number;
}) {
	const ref = useRef<HTMLElement>(null);
	const [visible, setVisible] = useState(false);
	const [hover, setHover] = useState(false);
	const isWarn = tone === "warn";

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						setVisible(true);
						io.unobserve(e.target);
					}
				}
			},
			{ rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	return (
		<article
			ref={ref}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			className="flex flex-col gap-3 border-2 border-black p-5 transition-all duration-200 ease-out md:p-6"
			style={{
				background: isWarn ? "rgba(254,76,2,0.05)" : "rgba(255,255,255,0.5)",
				transform: visible
					? hover
						? "translate(-3px, -3px)"
						: "translate(0,0)"
					: "translateY(22px)",
				opacity: visible ? 1 : 0,
				boxShadow: hover ? "8px 8px 0 #000" : "4px 4px 0 #000",
				transitionProperty: "transform, opacity, box-shadow, background",
				transitionDuration: visible ? "220ms" : "560ms",
				transitionDelay: visible ? `${delayMs}ms` : "0ms",
			}}
		>
			<div className="flex items-center justify-between">
				<div
					className="flex items-baseline gap-2.5 px-3 py-1.5"
					style={{
						background: isWarn ? BRAND_ORANGE : "#000",
						color: "#fff",
					}}
				>
					<span
						style={{
							fontFamily: "var(--font-display)",
							fontWeight: 700,
							fontSize: 22,
							lineHeight: 1,
							letterSpacing: "-0.01em",
						}}
					>
						{String(index).padStart(2, "0")}
					</span>
					<span
						className="text-[9.5px] font-bold uppercase tracking-[0.22em]"
						style={{ opacity: 0.65 }}
					>
						RULE
					</span>
				</div>
				{isWarn ? (
					<div
						className="inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.18em]"
						style={{
							borderColor: BRAND_ORANGE,
							color: BRAND_ORANGE,
							background: "rgba(254,76,2,0.10)",
						}}
					>
						<svg
							width="9"
							height="9"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.4"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden
						>
							<path d="M12 2L2 21h20L12 2z" />
							<path d="M12 10v5M12 18v0.5" />
						</svg>
						heads up
					</div>
				) : null}
			</div>

			<h2
				className="text-black"
				style={{
					fontFamily: "var(--font-display)",
					fontWeight: 700,
					fontSize: "clamp(20px, 2vw, 24px)",
					lineHeight: 1.15,
					letterSpacing: "-0.005em",
				}}
			>
				{title}
			</h2>
			<p
				className="text-[14px] leading-[1.65] text-black/75"
				style={{ fontFamily: "var(--font-sans)" }}
			>
				{body}
			</p>
		</article>
	);
}

function Closer({ count }: { count: number }) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						setVisible(true);
						io.unobserve(e.target);
					}
				}
			},
			{ threshold: 0.4 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className="mt-4 flex flex-col items-start gap-4 border-2 border-black px-6 py-7 md:flex-row md:items-center md:justify-between md:px-9"
			style={{
				background: "#000",
				color: "#fff",
				transform: visible ? "translateY(0)" : "translateY(20px)",
				opacity: visible ? 1 : 0,
				transition: "transform 500ms cubic-bezier(.21,.7,.2,1), opacity 500ms",
				boxShadow: "8px 8px 0 rgba(254,76,2,1)",
			}}
		>
			<div>
				<div className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/55">
					that&apos;s it
				</div>
				<div
					className="mt-1.5"
					style={{
						fontFamily: "var(--font-display)",
						fontWeight: 700,
						fontSize: "clamp(22px, 3.4vw, 30px)",
						lineHeight: 1.1,
						letterSpacing: "-0.01em",
					}}
				>
					{count} rules. read them once. now go post.
				</div>
			</div>
			<a
				href="/"
				className="inline-flex items-center gap-2 border-2 px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] transition-transform hover:-translate-y-[1px] active:translate-y-0"
				style={{
					borderColor: BRAND_ORANGE,
					background: BRAND_ORANGE,
					color: "#fff",
					boxShadow: "3px 3px 0 #fff",
				}}
			>
				BACK TO FORUM →
			</a>
		</div>
	);
}

function Tag({ children }: { children: ReactNode }) {
	return (
		<span
			className="mx-0.5 inline-flex items-center border px-1.5 py-px text-[12px] font-bold uppercase tracking-[0.06em]"
			style={{
				fontFamily: "var(--font-display)",
				background: "rgba(254,76,2,0.08)",
				borderColor: BRAND_ORANGE,
				color: BRAND_ORANGE,
			}}
		>
			{children}
		</span>
	);
}
