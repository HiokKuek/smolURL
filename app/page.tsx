"use client";

import { useState } from "react";

function SuccessCheckmark() {
  return (
    <svg
      className="checkmark-svg mx-auto"
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
    >
      <circle
        className="checkmark-circle"
        cx="28"
        cy="28"
        r="26"
        stroke="#22c55e"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        className="checkmark-check"
        d="M17 28.5L24 35.5L39 20.5"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Home() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleShorten() {
    setError("");
    setShortUrl("");
    setCopied(false);

    if (!longUrl.startsWith("http://") && !longUrl.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: longUrl }),
      });
      const data: { short?: string; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setShortUrl(data.short ?? "");
    } catch {
      setError("Failed to shorten URL. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-lg space-y-8">
          {/* Logo & tagline */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              smolURL 🦈
            </h1>
            <p className="text-sm text-black">
              Shorten your links.
            </p>
          </div>

          {/* Input area */}
          <div className="space-y-3">
            <input
              type="url"
              placeholder="Paste your long URL here"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleShorten()}
              className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 text-base text-gray-900 placeholder-gray-300 outline-none transition-all duration-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />

            <button
              onClick={handleShorten}
              disabled={loading || !longUrl}
              className="w-full rounded-xl bg-gray-900 px-5 py-4 text-base font-medium text-white transition-all duration-200 hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Shortening
                </span>
              ) : (
                "Shorten"
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="animate-slide-up rounded-xl border border-red-100 bg-red-50 px-5 py-4">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Success result */}
          {shortUrl && (
            <div className="animate-slide-up space-y-5">
              <SuccessCheckmark />

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 flex items-center gap-3">
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-sm font-mono text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {shortUrl}
                </a>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 ${
                    copied
                      ? "bg-green-50 text-green-600 border border-green-200"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900"
                  }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-gray-500">
          built by hiokkuek &middot; 2026
        </p>
      </footer>
    </div>
  );
}
