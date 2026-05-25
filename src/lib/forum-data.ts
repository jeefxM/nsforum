// Forum mock data — polls, threads, archive, tags, categories.
// Ported from the V2 design prototype (zeropass/project/forum-data.jsx).

export type TagId =
	| "general"
	| "cohorts"
	| "ai"
	| "build"
	| "trips"
	| "housing"
	| "food"
	| "gym"
	| "crypto"
	| "marina";

export type TagStyle = { label: string; bg: string; fg: string };

export const NS_TAGS: Record<TagId, TagStyle> = {
	general: { label: "General", bg: "#f1f5f9", fg: "#334155" },
	cohorts: { label: "Cohorts", bg: "#f5f3ff", fg: "#5b21b6" },
	ai: { label: "AI", bg: "#eef4ff", fg: "#1f4ed8" },
	build: { label: "Build", bg: "#fefce8", fg: "#854d0e" },
	trips: { label: "Trips", bg: "#ecfeff", fg: "#155e75" },
	housing: { label: "Housing", bg: "#fdf4ff", fg: "#86198f" },
	food: { label: "Food", bg: "#fff1e6", fg: "#9a3412" },
	gym: { label: "Gym", bg: "#fef2f2", fg: "#991b1b" },
	crypto: { label: "Crypto", bg: "#fef9c3", fg: "#854d0e" },
	marina: { label: "Marina Hotel", bg: "#ecfdf5", fg: "#065f46" },
};

export type PollOption = { label: string; votes: number };

export type Poll = {
	id: string;
	kind: "poll";
	tag: TagId;
	pinned?: boolean;
	title: string;
	body?: string;
	authorHandle: string;
	voters: number;
	comments: number;
	time: string;
	closesIn?: string;
	closed?: boolean;
	myVote?: number | null;
	options: PollOption[];
};


export type Category = { id: string; label: string; count: number };


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
