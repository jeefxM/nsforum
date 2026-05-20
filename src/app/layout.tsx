import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
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

export const metadata: Metadata = {
	title: "NS Forum — Anonymous polls & threads",
	description:
		"NSPass-gated polls and threads. Every vote is a zero-knowledge proof of NS membership — never your handle.",
};

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${serif.variable} ${mono.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
