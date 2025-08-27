export default function Home() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Chat App</h1>
      <nav className="space-x-4">
        <a href="/login" className="underline">Login</a>
        <a href="/signup" className="underline">Signup</a>
        <a href="/chat" className="underline">Chat</a>
        <a href="/settings" className="underline">Settings</a>
      </nav>
    </main>
  );
}