import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BOMBAYCHAT",
  description: "Red & Black realtime chat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="theme-bombay text-white">
        <header className="sticky top-0 z-50">
          <div className="bombay-surface mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <a href="/chat" className="select-none">
              <h1 className="logo-bombay">BOMBAYCHAT</h1>
            </a>
            <nav className="flex gap-3">
              <a href="/chat" className="underline">Chat</a>
              <a href="/settings" className="underline">Settings</a>
              <a href="/login" className="underline">Login</a>
              <a href="/signup" className="underline">Signup</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
