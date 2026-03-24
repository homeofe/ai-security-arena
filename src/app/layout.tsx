import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Security Arena",
  description: "Interactive Red Team vs Blue Team AI security battles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
          <div className="mx-auto flex w-full items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚔️</span>
              <h1 className="text-xl font-bold tracking-tight">AI Security Arena</h1>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <a href="/" className="hover:text-white transition">Dashboard</a>
              <a href="/arena" className="hover:text-white transition">Arena</a>
              <a href="/history" className="hover:text-white transition">History</a>
              <a href="/replay" className="hover:text-white transition">Replay</a>
              <a href="/report" className="hover:text-white transition">Reports</a>
              <a href="/leaderboard" className="hover:text-white transition">Leaderboard</a>
              <a href="/scenarios" className="hover:text-white transition">Scenarios</a>
              <a href="/settings" className="hover:text-white transition">Settings</a>
              <a href="/status" className="hover:text-white transition">Status</a>
            </div>
          </div>
        </nav>
        <main className="w-full px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
