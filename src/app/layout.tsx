import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader, Tektur } from "next/font/google";
import "./globals.css";

const inter = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
});

const serif = Newsreader({
	variable: "--font-serif",
	weight: ["300", "400", "500", "600", "700"],
	subsets: ["latin"],
});

const mono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

const display = Tektur({
	variable: "--font-display",
	weight: ["400", "500", "600", "700", "800", "900"],
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL("https://forumzero.xyz"),
	title: {
		default: "forumzero",
		template: "%s · forumzero",
	},
	description:
		"An anonymous forum for Network School. Sign in once with Discord, then everything you post is signed by a zero-knowledge proof. The forum knows you belong but never learns who you are.",
	applicationName: "forumzero",
	keywords: [
		"forumzero",
		"network school",
		"anonymous forum",
		"zero-knowledge",
		"semaphore",
		"arkiv",
		"privacy",
		"web3",
	],
	openGraph: {
		title: "forumzero",
		description:
			"An anonymous NS forum on Arkiv. ZK proofs prove you belong without revealing who you are.",
		url: "https://forumzero.xyz",
		siteName: "forumzero",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "forumzero",
		description:
			"An anonymous NS forum on Arkiv. ZK proofs prove you belong without revealing who you are.",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${serif.variable} ${mono.variable} ${display.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
