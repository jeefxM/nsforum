"use client";

import { useState } from "react";
import { NS_TAGS, type TagId } from "@/lib/forum-data";
import {
	Label,
	NS_COLORS,
	NSPassportGlyph,
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
						Only your NSPass membership proof.
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
						<NSPassportGlyph size={12} /> One vote per NS member. Anonymous.
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
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [tag, setTag] = useState<TagId>("general");
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		if (posting) return;
		setError(null);
		if (!title.trim()) {
			setError("Title is required");
			return;
		}
		if (!body.trim()) {
			setError("Body is required");
			return;
		}
		setPosting(true);
		try {
			const r = await fetch("/api/threads", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: title.trim(), body: body.trim(), tag }),
			});
			const data = await r.json();
			if (!r.ok) {
				setError(data.error ?? "Failed to post");
				return;
			}
			onPosted?.(data.threadId);
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
					maxWidth: 600,
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
					New thread · anonymous
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
					Start a discussion.
				</h3>
				<p
					style={{
						marginTop: 6,
						fontSize: 13,
						color: NS_COLORS.muted,
					}}
				>
					A fresh anonymous handle will be generated for this thread.{" "}
					<span
						style={{
							fontFamily: "var(--font-serif)",
							fontStyle: "italic",
							color: NS_COLORS.ink,
						}}
					>
						It won't match any other thread you've posted in.
					</span>
				</p>

				<div style={{ marginTop: 18 }}>
					<Label>Title</Label>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="e.g. How did you decide between cohorts?"
						style={ns_inputStyle()}
					/>
				</div>

				<div style={{ marginTop: 14 }}>
					<Label>Body</Label>
					<textarea
						value={body}
						onChange={(e) => setBody(e.target.value)}
						placeholder="Give context. Specific is better than vague."
						rows={6}
						style={{
							...ns_inputStyle(),
							height: "auto",
							padding: 14,
							lineHeight: 1.55,
							fontFamily: "inherit",
							resize: "vertical",
							minHeight: 120,
						}}
					/>
				</div>

				<div style={{ marginTop: 14 }}>
					<Label>Tag</Label>
					<div
						style={{
							display: "flex",
							gap: 6,
							flexWrap: "wrap",
							marginTop: 6,
						}}
					>
						{(Object.keys(NS_TAGS) as TagId[]).map((k) => {
							const on = k === tag;
							return (
								<button
									key={k}
									type="button"
									onClick={() => setTag(k)}
									style={{
										padding: "5px 11px",
										borderRadius: 999,
										background: on ? NS_COLORS.ink : "#fff",
										color: on ? "#fff" : NS_COLORS.muted,
										border: `1px solid ${on ? NS_COLORS.ink : NS_COLORS.hairline}`,
										fontSize: 11.5,
										fontWeight: on ? 500 : 400,
										cursor: "pointer",
									}}
								>
									{NS_TAGS[k].label}
								</button>
							);
						})}
					</div>
				</div>

				{error ? (
					<div
						style={{
							marginTop: 12,
							fontSize: 12,
							color: "#b91c1c",
						}}
					>
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
						<NSPassportGlyph size={12} /> Posting as a fresh anonymous handle
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
						<PlusIconSm /> {posting ? "Posting…" : "Post thread"}
					</button>
				</div>
			</div>
		</div>
	);
}
