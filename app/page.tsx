"use client";

import { useState, useRef, useCallback } from "react";
import { PDFDocument } from "pdf-lib";

// ─── Shared helpers ──────────────────────────────────────────────────────────

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

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── URL Shortener tab ────────────────────────────────────────────────────────

function UrlShortener() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleShorten() {
    setError("");
    setShortUrl("");
    setCopied(false);

    let url = longUrl;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
      setLongUrl(url);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
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
    <div className="space-y-6">
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
            <span className="inline-flex items-center justify-center gap-2">
              <Spinner />
              Shortening
            </span>
          ) : (
            "Shorten"
          )}
        </button>
      </div>

      {error && (
        <div className="animate-slide-up rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

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
  );
}

// ─── PDF Compressor tab ───────────────────────────────────────────────────────

interface CompressResult {
  name: string;
  originalSize: number;
  compressedSize: number;
  url: string;
}

function PdfCompressor() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CompressResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function compressPdf(file: File) {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        updateMetadata: false,
      });

      // Re-save with object streams & compression enabled
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([new Uint8Array(compressedBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setResult({
        name: file.name,
        originalSize: file.size,
        compressedSize: compressedBytes.byteLength,
        url,
      });
    } catch {
      setError("Failed to compress PDF. Please make sure the file is a valid PDF.");
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    compressPdf(file);
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    compressPdf(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const savings = result
    ? Math.max(0, Math.round((1 - result.compressedSize / result.originalSize) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload PDF file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 py-10 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? "border-gray-400 bg-gray-50 drop-zone-active"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* PDF icon */}
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-gray-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="9" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>

        <div>
          <p className="text-sm font-medium text-gray-700">
            {dragging ? "Drop your PDF here" : "Click or drag a PDF to compress"}
          </p>
          <p className="mt-1 text-xs text-gray-400">Only PDF files are supported</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="animate-slide-up flex items-center justify-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
          <Spinner />
          <span className="text-sm text-gray-600">Compressing&hellip;</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="animate-slide-up rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="animate-slide-up space-y-5">
          <SuccessCheckmark />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Original</p>
              <p className="text-sm font-medium text-gray-700">{formatBytes(result.originalSize)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Compressed</p>
              <p className="text-sm font-medium text-gray-700">{formatBytes(result.compressedSize)}</p>
            </div>
            <div className={`rounded-xl border px-4 py-3 text-center ${savings > 0 ? "border-green-100 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
              <p className="text-xs text-gray-400 mb-1">Saved</p>
              <p className={`text-sm font-medium ${savings > 0 ? "text-green-600" : "text-gray-500"}`}>
                {savings > 0 ? `${savings}%` : "—"}
              </p>
            </div>
          </div>

          {/* Download */}
          <a
            href={result.url}
            download={result.name.replace(/\.pdf$/i, "_compressed.pdf")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-4 text-base font-medium text-white transition-all duration-200 hover:bg-gray-800 active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Download compressed PDF
          </a>

          {/* Compress another */}
          <button
            onClick={() => {
              setResult(null);
              setError("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition-all duration-200 hover:border-gray-300 hover:text-gray-900 active:scale-[0.98]"
          >
            Compress another PDF
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────

type Tab = "url" | "pdf";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("url");
  const [renderKey, setRenderKey] = useState(0);

  function switchTab(tab: Tab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setRenderKey((k) => k + 1);
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
            <p className="text-sm text-gray-500">
              {activeTab === "url" ? "Shorten your links." : "Shrink your PDFs."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl border border-gray-100 bg-gray-50 p-1 gap-1">
            <button
              onClick={() => switchTab("url")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === "url"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              URL Shortener
            </button>
            <button
              onClick={() => switchTab("pdf")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === "pdf"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              PDF Compressor
            </button>
          </div>

          {/* Tab content */}
          <div key={renderKey} className="tab-panel-enter">
            {activeTab === "url" ? <UrlShortener /> : <PdfCompressor />}
          </div>

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
