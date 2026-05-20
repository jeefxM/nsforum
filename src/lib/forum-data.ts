// Forum mock data — polls, threads, archive, tags, categories.
// Ported from the V2 design prototype (nspass/project/forum-data.jsx).

export type TagId =
	| "hackathons"
	| "cofounders"
	| "logistics"
	| "meta"
	| "campus"
	| "offtopic"
	| "ama"
	| "general"
	| "help";

export type TagStyle = { label: string; bg: string; fg: string };

export const NS_TAGS: Record<TagId, TagStyle> = {
	hackathons: { label: "Hackathons", bg: "#eef4ff", fg: "#1f4ed8" },
	cofounders: { label: "Cofounders", bg: "#fef0e7", fg: "#9a3412" },
	logistics: { label: "Logistics", bg: "#f1f4ee", fg: "#3f6212" },
	meta: { label: "Meta", bg: "#f5f3ff", fg: "#5b21b6" },
	campus: { label: "Campus", bg: "#ecfdf5", fg: "#065f46" },
	offtopic: { label: "Off-topic", bg: "#f3f4f6", fg: "#374151" },
	ama: { label: "AMA", bg: "#fff7ed", fg: "#9a3412" },
	general: { label: "General", bg: "#f1f5f9", fg: "#334155" },
	help: { label: "Help", bg: "#fef2f2", fg: "#991b1b" },
};

export type PollOption = { label: string; votes: number };

export type Poll = {
	id: string;
	kind: "poll";
	tag: TagId;
	pinned?: boolean;
	title: string;
	body?: string;
	voters: number;
	comments: number;
	time: string;
	closesIn?: string;
	options: PollOption[];
};


export type Category = { id: string; label: string; count: number };

export const FORUM_POLLS: Poll[] = [];


export const FORUM_CATEGORIES: Category[] = [
	{ id: "all", label: "All", count: 142 },
	{ id: "hackathons", label: "Hackathons", count: 18 },
	{ id: "cofounders", label: "Cofounders", count: 24 },
	{ id: "logistics", label: "Logistics", count: 19 },
	{ id: "meta", label: "Meta", count: 12 },
	{ id: "ama", label: "AMA", count: 6 },
	{ id: "help", label: "Help", count: 9 },
	{ id: "offtopic", label: "Off-topic", count: 32 },
];
