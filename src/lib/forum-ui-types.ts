// UI-facing thread/comment shapes returned by /api/threads and /api/threads/[id]

export type UiThread = {
	id: string;
	tag: string;
	title: string;
	body: string;
	authorHandle: string;
	time: string;
	pinned: boolean;
	pinnedWeekly: boolean;
	hot: boolean;
	replies: number;
	lastReply?: { handle: string; time: string };
	pollId?: string;
	hasPoll?: boolean;
	voters?: number;
	timestamp: number;
	lastActivity: number;
};

export type UiComment = {
	handle: string;
	body: string;
	time: string;
	timestamp: number;
};
