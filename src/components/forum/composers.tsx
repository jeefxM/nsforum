"use client";

import { useEffect, useState } from "react";
import { NS_TAGS, type TagId } from "@/lib/forum-data";
import { useToast } from "./toast";

const FZ_ORANGE = "#FE4C02";
const FZ_PAPER = "#f5f3ee";

const TAG_ORDER: TagId[] = [
	"general",
	"cohorts",
	"ai",
	"build",
	"trips",
	"housing",
	"food",
	"gym",
	"crypto",
	"marina",
];

const TITLE_MAX = 140;
const BODY_MAX = 4000;
const OPTION_MAX = 80;
const MAX_OPTIONS = 8;

const CLOSE_OPTIONS: { label: string; ms: number }[] = [
	{ label: "OPEN", ms: 0 },
	{ label: "24H", ms: 24 * 60 * 60 * 1000 },
	{ label: "3D", ms: 3 * 24 * 60 * 60 * 1000 },
	{ label: "7D", ms: 7 * 24 * 60 * 60 * 1000 },
];

import {
	Label,
	NS_COLORS,
	ZeroPassportGlyph,
	PlusIconSm,
	ns_ghostBtn,
	ns_inputStyle,
} from "./atoms";

const POLL_ERRORS: Record<string, string> = {
	no_session: "Your session expired — sign in again.",
	missing_question: "Question is required.",
	need_two_options: "Add at least 2 options.",
	too_many_options: "Polls can have at most 8 options.",
};

export function PollComposerSheet({
	onClose,
	onPosted,
}: { onClose: () => void; onPosted?: () => void }) {
	const [q, setQ] = useState("");
	const [opts, setOpts] = useState<string[]>(["", "", ""]);
	const [tag, setTag] = useState<TagId>("general");
	const [closes, setCloses] = useState("3d");
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		if (posting) return;
		setError(null);
		const question = q.trim();
		const cleanOpts = opts.map((o) => o.trim()).filter((o) => o.length > 0);
		if (!question) {
			setError("Question is required");
			return;
		}
		if (cleanOpts.length < 2) {
			setError("Add at least 2 options");
			return;
		}
		const dayMap: Record<string, number> = {
			"1d": 1,
			"3d": 3,
			"7d": 7,
			"14d": 14,
		};
		const days = dayMap[closes] ?? 3;
		const closesAt = Date.now() + days * 86_400_000;
		setPosting(true);
		try {
			const r = await fetch("/api/poll", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question, options: cleanOpts, tag, closesAt }),
			});
			const data = await r.json();
			if (!r.ok) {
				setError(POLL_ERRORS[data.error] ?? data.error ?? "Failed to post");
				return;
			}
			onPosted?.();
			onClose();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to post");
		} finally {
			setPosting(false);
		}
	}

	return (
		<div
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 40,
				background: "rgba(6,19,41,0.32)",
				backdropFilter: "blur(3px)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					width: "100%",
					maxWidth: 540,
					background: "#fff",
					borderRadius: 22,
					border: `1px solid ${NS_COLORS.hairline}`,
					padding: 30,
					boxShadow: "0 30px 80px rgba(6,19,41,0.20)",
					maxHeight: "88vh",
					overflow: "auto",
				}}
			>
				<div
					style={{
						fontSize: 11.5,
						letterSpacing: "0.16em",
						textTransform: "uppercase",
						color: NS_COLORS.faint,
						marginBottom: 8,
					}}
				>
					New poll · anonymous
				</div>
				<h3
					style={{
						margin: 0,
						fontFamily: "var(--font-serif)",
						fontSize: 26,
						fontWeight: 700,
						color: NS_COLORS.ink,
						letterSpacing: "-0.022em",
					}}
				>
					Ask the network.
				</h3>
				<p
					style={{
						marginTop: 6,
						fontSize: 13,
						color: NS_COLORS.muted,
					}}
				>
					Your handle isn't attached.{" "}
					<span
						style={{
							fontFamily: "var(--font-serif)",
							fontStyle: "italic",
							color: NS_COLORS.ink,
						}}
					>
						Only your ZeroPass membership proof.
					</span>
				</p>

				<div style={{ marginTop: 18 }}>
					<Label>Question</Label>
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="e.g. Should NS extend cohorts to 120 days?"
						style={ns_inputStyle()}
					/>
				</div>

				<div style={{ marginTop: 14 }}>
					<Label>Options</Label>
					<div
						style={{ display: "flex", flexDirection: "column", gap: 8 }}
					>
						{opts.map((o, i) => (
							<div
								key={i}
								style={{ display: "flex", gap: 8, alignItems: "center" }}
							>
								<span
									style={{
										width: 26,
										height: 26,
										borderRadius: 999,
										border: `1px solid ${NS_COLORS.hairline}`,
										fontSize: 11,
										color: NS_COLORS.muted,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexShrink: 0,
										fontFamily: "var(--font-mono)",
									}}
								>
									{i + 1}
								</span>
								<input
									value={o}
									onChange={(e) => {
										const c = [...opts];
										c[i] = e.target.value;
										setOpts(c);
									}}
									placeholder={`Option ${i + 1}`}
									style={{
										flex: 1,
										height: 40,
										border: `1px solid ${NS_COLORS.hairline}`,
										borderRadius: 10,
										padding: "0 12px",
										fontSize: 13.5,
										color: NS_COLORS.ink,
										outline: "none",
										fontFamily: "inherit",
									}}
								/>
								{opts.length > 2 ? (
									<button
										type="button"
										onClick={() => setOpts(opts.filter((_, j) => j !== i))}
										style={{
											background: "none",
											border: "none",
											cursor: "pointer",
											fontSize: 14,
											color: NS_COLORS.faint,
											width: 26,
											height: 26,
										}}
									>
										×
									</button>
								) : (
									<span style={{ width: 26 }} />
								)}
							</div>
						))}
						<button
							type="button"
							onClick={() => setOpts([...opts, ""])}
							style={{
								alignSelf: "flex-start",
								background: "none",
								border: "none",
								cursor: "pointer",
								fontSize: 12.5,
								color: NS_COLORS.muted,
								textDecoration: "underline",
								textDecorationColor: "#cbd0dd",
								textUnderlineOffset: 2,
								padding: 0,
							}}
						>
							+ add option
						</button>
					</div>
				</div>

				<div
					style={{
						marginTop: 14,
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 14,
					}}
				>
					<div>
						<Label>Tag</Label>
						<select
							value={tag}
							onChange={(e) => setTag(e.target.value as TagId)}
							style={ns_inputStyle()}
						>
							{(Object.keys(NS_TAGS) as TagId[]).map((k) => (
								<option key={k} value={k}>
									{NS_TAGS[k].label}
								</option>
							))}
						</select>
					</div>
					<div>
						<Label>Closes in</Label>
						<select
							value={closes}
							onChange={(e) => setCloses(e.target.value)}
							style={ns_inputStyle()}
						>
							<option value="1d">1 day</option>
							<option value="3d">3 days</option>
							<option value="7d">1 week</option>
							<option value="14d">2 weeks</option>
						</select>
					</div>
				</div>

				{error ? (
					<div style={{ marginTop: 12, fontSize: 12, color: "#b91c1c" }}>
						{error}
					</div>
				) : null}

				<div
					style={{
						marginTop: 22,
						display: "flex",
						gap: 10,
						alignItems: "center",
					}}
				>
					<span
						style={{
							flex: 1,
							fontSize: 11.5,
							color: NS_COLORS.muted,
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
						}}
					>
						<ZeroPassportGlyph size={12} /> One vote per NS member. Anonymous.
					</span>
					<button
						type="button"
						onClick={onClose}
						style={ns_ghostBtn({ height: 36, fontSize: 12.5 })}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={submit}
						disabled={posting}
						style={{
							height: 36,
							padding: "0 18px",
							borderRadius: 999,
							background: NS_COLORS.navy,
							color: "#fff",
							border: "none",
							fontSize: 13,
							fontWeight: 500,
							cursor: posting ? "not-allowed" : "pointer",
							opacity: posting ? 0.7 : 1,
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
						}}
					>
						<PlusIconSm /> {posting ? "Posting…" : "Post poll"}
					</button>
				</div>
			</div>
		</div>
	);
}

export function ThreadComposerSheet({
	onClose,
	onPosted,
}: { onClose: () => void; onPosted?: (id: string) => void }) {
	const toast = useToast();
	const [withPoll, setWithPoll] = useState(false);
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [options, setOptions] = useState<string[]>(["", ""]);
	const [closesInMs, setClosesInMs] = useState<number>(0);
	const [tag, setTag] = useState<TagId>("general");
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function updateOption(idx: number, value: string) {
		setOptions((prev) =>
			prev.map((o, i) => (i === idx ? value.slice(0, OPTION_MAX) : o)),
		);
	}
	function removeOption(idx: number) {
		setOptions((prev) => prev.filter((_, i) => i !== idx));
	}
	function addOption() {
		setOptions((prev) =>
			prev.length >= MAX_OPTIONS ? prev : [...prev, ""],
		);
	}

	async function submit() {
		if (posting) return;
		setError(null);

		if (!title.trim()) {
			setError("Title is required.");
			return;
		}
		if (!body.trim()) {
			setError("Body is required.");
			return;
		}

		let pollPayload: object | undefined;
		if (withPoll) {
			const cleanOptions = options.map((o) => o.trim()).filter((o) => o);
			if (cleanOptions.length < 2) {
				setError("A poll needs at least 2 options.");
				return;
			}
			if (cleanOptions.length > MAX_OPTIONS) {
				setError(`Polls can have at most ${MAX_OPTIONS} options.`);
				return;
			}
			pollPayload = {
				options: cleanOptions,
				closesAt: closesInMs > 0 ? Date.now() + closesInMs : 0,
			};
		}

		setPosting(true);
		const toastId = toast.pending(
			withPoll ? "Uploading thread + poll…" : "Uploading your thread…",
		);
		try {
			const r = await fetch("/api/threads", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: title.trim(),
					body: body.trim(),
					tag,
					poll: pollPayload,
				}),
			});
			const data = await r.json();
			if (!r.ok) {
				const message =
					POLL_ERRORS[data.error] ?? data.error ?? "Failed to post.";
				setError(message);
				toast.error(toastId, { title: "Post failed.", detail: message });
				return;
			}
			toast.success(toastId, {
				title: withPoll
					? "Thread + poll published on Arkiv."
					: "Thread published on Arkiv.",
				txHash: data.txHash,
			});
			onPosted?.(data.threadId);
			onClose();
		} catch (e) {
			const detail = e instanceof Error ? e.message : "Failed to post.";
			setError(detail);
			toast.error(toastId, { title: "Post failed.", detail });
		} finally {
			setPosting(false);
		}
	}

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
		}
		document.addEventListener("keydown", onKey);
		const { overflow } = document.body.style;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = overflow;
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: handler reads latest via closure
	}, [title, body, tag, posting]);

	return (
		<div
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 50,
				background:
					"radial-gradient(120% 80% at 50% 0%, rgba(254,76,2,0.10) 0%, rgba(0,0,0,0) 55%), rgba(10,10,10,0.55)",
				backdropFilter: "blur(6px)",
				display: "flex",
				alignItems: "flex-start",
				justifyContent: "center",
				padding: "max(20px, 4vh) 12px 24px",
				fontFamily: "var(--font-display)",
				animation: "fz-fade 180ms ease-out both",
			}}
		>
			<style>{`
				@keyframes fz-fade { from { opacity: 0 } to { opacity: 1 } }
				@keyframes fz-pop { from { opacity: 0; transform: translateY(-10px) scale(.985) } to { opacity: 1; transform: translateY(0) scale(1) } }
			`}</style>
			<div
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="fz-composer-title"
				style={{
					width: "100%",
					maxWidth: 640,
					background: FZ_PAPER,
					border: "2px solid #000",
					boxShadow: "8px 8px 0 #000",
					maxHeight: "calc(100vh - 80px)",
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					animation: "fz-pop 220ms cubic-bezier(.2,.8,.3,1) both",
				}}
			>
				{/* Header bar — cell grid, matches table header aesthetic */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 48px",
						borderBottom: "2px solid #000",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							padding: "14px 22px",
							fontSize: 11.5,
							fontWeight: 700,
							letterSpacing: "0.18em",
						}}
					>
						<span
							style={{
								display: "inline-block",
								width: 8,
								height: 8,
								borderRadius: 999,
								background: FZ_ORANGE,
							}}
						/>
						NEW&nbsp;POST · ANONYMOUS
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						style={{
							borderLeft: "2px solid #000",
							background: "transparent",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							transition: "background 120ms",
						}}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLElement).style.background = "#000";
							(e.currentTarget as HTMLElement).style.color = "#fff";
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLElement).style.background =
								"transparent";
							(e.currentTarget as HTMLElement).style.color = "#000";
						}}
					>
						<CloseGlyph />
					</button>
				</div>

				{/* Scrollable body */}
				<div
					className="overflow-auto px-5 pt-6 pb-2 md:px-7 md:pt-7"
				>
					<h2
						id="fz-composer-title"
						style={{
							margin: 0,
							fontFamily: "var(--font-display)",
							fontWeight: 700,
							fontSize: 38,
							lineHeight: 1.02,
							letterSpacing: "-0.01em",
							color: "#000",
						}}
					>
						start a discussion.
					</h2>
					<p
						style={{
							marginTop: 10,
							maxWidth: 520,
							fontSize: 13,
							lineHeight: 1.55,
							color: "rgba(0,0,0,0.6)",
						}}
					>
						A fresh anonymous handle is minted just for this thread — it
						won&apos;t match any other thread you&apos;ve posted in. Optionally
						attach a poll to ask the room.
					</p>

					<FieldLabel>Title</FieldLabel>
					<div style={{ position: "relative", marginTop: 8 }}>
						<input
							value={title}
							onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
							placeholder="How did you decide between cohorts?"
							autoFocus
							style={fzInputStyle()}
							onFocus={fzFocus}
							onBlur={fzBlur}
						/>
						<CharCount value={title.length} max={TITLE_MAX} />
					</div>

					<FieldLabel style={{ marginTop: 22 }}>Body</FieldLabel>
					<div style={{ position: "relative", marginTop: 8 }}>
						<textarea
							value={body}
							onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
							placeholder="Give context. Specific is better than vague."
							rows={7}
							style={{
								...fzInputStyle(),
								height: "auto",
								padding: "14px 16px",
								lineHeight: 1.55,
								fontFamily: "var(--font-sans)",
								fontSize: 14,
								resize: "vertical",
								minHeight: 160,
							}}
							onFocus={fzFocus}
							onBlur={fzBlur}
						/>
						<CharCount value={body.length} max={BODY_MAX} />
					</div>

					{/* Poll attach toggle */}
					<div
						style={{
							marginTop: 22,
							border: "2px solid #000",
							background: withPoll ? "rgba(254,76,2,0.04)" : "transparent",
							transition: "background 160ms",
						}}
					>
						<button
							type="button"
							onClick={() => setWithPoll((v) => !v)}
							style={{
								width: "100%",
								padding: "12px 16px",
								background: "transparent",
								border: "none",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 12,
								fontFamily: "var(--font-display)",
								fontSize: 12,
								fontWeight: 700,
								letterSpacing: "0.16em",
								color: "#000",
							}}
						>
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 10,
								}}
							>
								<span
									aria-hidden
									style={{
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
										width: 24,
										height: 24,
										border: "1.5px solid #000",
										background: withPoll ? FZ_ORANGE : "transparent",
										color: withPoll ? "#fff" : "#000",
										transition: "background 140ms",
									}}
								>
									{withPoll ? (
										<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
											<path
												d="M3 8.5l3 3 6-7"
												stroke="currentColor"
												strokeWidth="2.4"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									) : (
										<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
											<path
												d="M8 3v10M3 8h10"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
											/>
										</svg>
									)}
								</span>
								ATTACH A POLL
							</span>
							<span
								style={{
									fontSize: 10.5,
									letterSpacing: "0.14em",
									color: "rgba(0,0,0,0.5)",
								}}
							>
								{withPoll ? "ENABLED" : "OPTIONAL"}
							</span>
						</button>

						{withPoll ? (
							<div
								style={{
									borderTop: "2px solid #000",
									padding: "18px 16px 16px",
									display: "flex",
									flexDirection: "column",
									gap: 14,
								}}
							>
								<div>
									<FieldLabel style={{ marginTop: 0 }}>
										Options ({options.length}/{MAX_OPTIONS})
									</FieldLabel>
									<div
										style={{
											marginTop: 8,
											display: "flex",
											flexDirection: "column",
											gap: 8,
										}}
									>
										{options.map((value, i) => (
											<div
												key={i}
												style={{
													display: "grid",
													gridTemplateColumns: "32px 1fr 36px",
													alignItems: "stretch",
													border: "2px solid #000",
													background: "#fff",
												}}
											>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														borderRight: "2px solid #000",
														fontFamily: "var(--font-display)",
														fontSize: 12,
														fontWeight: 700,
														letterSpacing: "0.06em",
														color: "rgba(0,0,0,0.55)",
													}}
												>
													{String.fromCharCode(65 + i)}
												</div>
												<input
													value={value}
													onChange={(e) => updateOption(i, e.target.value)}
													placeholder={`Option ${i + 1}`}
													style={{
														border: "none",
														outline: "none",
														background: "transparent",
														padding: "0 14px",
														fontSize: 14,
														color: "#000",
														fontFamily: "var(--font-sans)",
														minWidth: 0,
													}}
												/>
												<button
													type="button"
													onClick={() => removeOption(i)}
													disabled={options.length <= 2}
													aria-label={`Remove option ${i + 1}`}
													style={{
														borderLeft: "2px solid #000",
														background: "transparent",
														cursor:
															options.length <= 2 ? "not-allowed" : "pointer",
														opacity: options.length <= 2 ? 0.25 : 1,
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														color: "#000",
														transition: "background 100ms",
													}}
													onMouseEnter={(e) => {
														if (options.length > 2) {
															(e.currentTarget as HTMLElement).style.background =
																FZ_ORANGE;
															(e.currentTarget as HTMLElement).style.color =
																"#fff";
														}
													}}
													onMouseLeave={(e) => {
														(e.currentTarget as HTMLElement).style.background =
															"transparent";
														(e.currentTarget as HTMLElement).style.color =
															"#000";
													}}
												>
													<CloseGlyph />
												</button>
											</div>
										))}
										{options.length < MAX_OPTIONS ? (
											<button
												type="button"
												onClick={addOption}
												style={{
													border: "2px dashed #000",
													background: "transparent",
													padding: "10px 14px",
													fontSize: 11,
													fontWeight: 700,
													letterSpacing: "0.18em",
													color: "#000",
													cursor: "pointer",
													fontFamily: "var(--font-display)",
													transition: "background 100ms",
												}}
												onMouseEnter={(e) =>
													((e.currentTarget as HTMLElement).style.background =
														"rgba(0,0,0,0.05)")
												}
												onMouseLeave={(e) =>
													((e.currentTarget as HTMLElement).style.background =
														"transparent")
												}
											>
												+ ADD OPTION
											</button>
										) : null}
									</div>
								</div>

								<div>
									<FieldLabel style={{ marginTop: 0 }}>Closes in</FieldLabel>
									<div
										style={{
											marginTop: 8,
											display: "flex",
											flexWrap: "wrap",
											gap: 6,
										}}
									>
										{CLOSE_OPTIONS.map((opt) => {
											const on = opt.ms === closesInMs;
											return (
												<button
													key={opt.label}
													type="button"
													onClick={() => setClosesInMs(opt.ms)}
													style={{
														padding: "7px 14px",
														border: "1.5px solid #000",
														background: on ? FZ_ORANGE : "transparent",
														color: on ? "#fff" : "#000",
														fontSize: 11,
														fontWeight: 700,
														letterSpacing: "0.14em",
														cursor: "pointer",
														fontFamily: "var(--font-display)",
														transition: "background 120ms",
													}}
													onMouseEnter={(e) => {
														if (!on)
															(e.currentTarget as HTMLElement).style.background =
																"rgba(0,0,0,0.06)";
													}}
													onMouseLeave={(e) => {
														if (!on)
															(e.currentTarget as HTMLElement).style.background =
																"transparent";
													}}
												>
													{opt.label}
												</button>
											);
										})}
									</div>
								</div>
							</div>
						) : null}
					</div>

					<FieldLabel style={{ marginTop: 22 }}>Category</FieldLabel>
					<div
						style={{
							marginTop: 8,
							display: "flex",
							flexWrap: "wrap",
							gap: 6,
						}}
					>
						{TAG_ORDER.map((k) => {
							const on = k === tag;
							return (
								<button
									key={k}
									type="button"
									onClick={() => setTag(k)}
									style={{
										padding: "7px 14px",
										border: "1.5px solid #000",
										background: on ? FZ_ORANGE : "transparent",
										color: on ? "#fff" : "#000",
										fontSize: 11,
										fontWeight: 700,
										letterSpacing: "0.14em",
										textTransform: "uppercase",
										cursor: "pointer",
										transition: "transform 100ms, background 120ms",
										fontFamily: "var(--font-display)",
									}}
									onMouseEnter={(e) => {
										if (!on)
											(e.currentTarget as HTMLElement).style.background =
												"rgba(0,0,0,0.06)";
									}}
									onMouseLeave={(e) => {
										if (!on)
											(e.currentTarget as HTMLElement).style.background =
												"transparent";
									}}
								>
									{NS_TAGS[k].label}
								</button>
							);
						})}
					</div>

					{error ? (
						<div
							role="alert"
							style={{
								marginTop: 18,
								padding: "10px 14px",
								border: `1.5px solid ${FZ_ORANGE}`,
								background: "rgba(254,76,2,0.08)",
								color: "#7a2200",
								fontSize: 12.5,
								fontWeight: 700,
								letterSpacing: "0.04em",
							}}
						>
							{error}
						</div>
					) : null}
				</div>

				{/* Footer bar */}
				<div
					style={{
						borderTop: "2px solid #000",
						background: FZ_PAPER,
						display: "grid",
						gridTemplateColumns: "1fr auto auto",
						alignItems: "stretch",
					}}
				>
					<div
						style={{
							padding: "14px 22px",
							display: "flex",
							alignItems: "center",
							gap: 8,
							fontSize: 11,
							letterSpacing: "0.12em",
							color: "rgba(0,0,0,0.55)",
							fontWeight: 700,
						}}
					>
						<ZeroKnowledgeGlyph />
						ZERO-KNOWLEDGE · NEW HANDLE
					</div>
					<button
						type="button"
						onClick={onClose}
						style={{
							padding: "0 22px",
							borderLeft: "2px solid #000",
							background: "transparent",
							cursor: "pointer",
							fontSize: 12,
							fontWeight: 700,
							letterSpacing: "0.16em",
							color: "#000",
							fontFamily: "var(--font-display)",
							transition: "background 120ms",
						}}
						onMouseEnter={(e) =>
							((e.currentTarget as HTMLElement).style.background =
								"rgba(0,0,0,0.06)")
						}
						onMouseLeave={(e) =>
							((e.currentTarget as HTMLElement).style.background =
								"transparent")
						}
					>
						CANCEL
					</button>
					<button
						type="button"
						onClick={submit}
						disabled={posting}
						style={{
							padding: "0 22px",
							borderLeft: "2px solid #000",
							background: FZ_ORANGE,
							color: "#fff",
							border: "none",
							borderLeftWidth: 2,
							borderLeftStyle: "solid",
							borderLeftColor: "#000",
							fontSize: 12,
							fontWeight: 700,
							letterSpacing: "0.16em",
							cursor: posting ? "wait" : "pointer",
							opacity: posting ? 0.85 : 1,
							fontFamily: "var(--font-display)",
							display: "inline-flex",
							alignItems: "center",
							gap: 8,
							transition: "filter 120ms",
						}}
						onMouseEnter={(e) =>
							((e.currentTarget as HTMLElement).style.filter =
								"brightness(1.08)")
						}
						onMouseLeave={(e) =>
							((e.currentTarget as HTMLElement).style.filter = "none")
						}
					>
						{posting ? "POSTING…" : withPoll ? "POST + POLL" : "POST THREAD"}
						<span
							aria-hidden
							style={{
								fontSize: 10,
								opacity: 0.7,
								letterSpacing: "0.1em",
							}}
						>
							⌘↵
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}

function FieldLabel({
	children,
	style,
}: {
	children: React.ReactNode;
	style?: React.CSSProperties;
}) {
	return (
		<div
			style={{
				fontSize: 11,
				fontWeight: 700,
				letterSpacing: "0.18em",
				color: "#000",
				textTransform: "uppercase",
				marginTop: 20,
				...style,
			}}
		>
			<span
				style={{ borderBottom: "2px solid #000", paddingBottom: 3 }}
			>
				{children}
			</span>
		</div>
	);
}

function CharCount({ value, max }: { value: number; max: number }) {
	const close = value > max * 0.85;
	return (
		<div
			style={{
				position: "absolute",
				bottom: 8,
				right: 10,
				fontSize: 10.5,
				fontWeight: 700,
				letterSpacing: "0.1em",
				color: close ? FZ_ORANGE : "rgba(0,0,0,0.4)",
				background: FZ_PAPER,
				padding: "2px 5px",
				pointerEvents: "none",
			}}
		>
			{value}/{max}
		</div>
	);
}

function fzInputStyle(): React.CSSProperties {
	return {
		width: "100%",
		height: 48,
		padding: "0 14px",
		border: "2px solid #000",
		background: "#fff",
		fontSize: 14,
		color: "#000",
		fontFamily: "var(--font-sans)",
		outline: "none",
		transition: "box-shadow 120ms",
	};
}

function fzFocus(e: React.FocusEvent<HTMLElement>) {
	(e.currentTarget as HTMLElement).style.boxShadow = `4px 4px 0 ${FZ_ORANGE}`;
}
function fzBlur(e: React.FocusEvent<HTMLElement>) {
	(e.currentTarget as HTMLElement).style.boxShadow = "none";
}

function CloseGlyph() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.4"
			strokeLinecap="round"
			aria-hidden
		>
			<path d="M6 6l12 12M18 6L6 18" />
		</svg>
	);
}

function ZeroKnowledgeGlyph() {
	return (
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
			<path d="M12 2 4 5v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V5l-8-3Z" />
		</svg>
	);
}
