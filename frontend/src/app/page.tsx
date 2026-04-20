"use client";

import { useState, useCallback, useEffect } from "react";
import DropZone from "../components/DropZone";
import LoadingState from "../components/LoadingState";
import GifGrid from "../components/GifGrid";
import GifCarousel from "../components/GifCarousel";
import type { GifData } from "../components/GifCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface ContextData {
  conversation_text: string;
  emotional_tone: string;
  context_summary: string;
  gif_search_query: string;
}

export default function Home() {
  const [status, setStatus] = useState<"idle" | "analyzing" | "results">("idle");
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState<ContextData | null>(null);
  const [trendingGifs, setTrendingGifs] = useState<GifData[]>([]);
  const [freshGifs, setFreshGifs] = useState<GifData[]>([]);
  const [selectedGifId, setSelectedGifId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // System theme detection
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const saved = localStorage.getItem("theme");
    const dark = saved ? saved === "dark" : mq.matches;
    setIsDark(dark);
    if (dark) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    if (next) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setError(null);
    setSelectedGifId(null);
    setContext(null);
    setTrendingGifs([]);
    setFreshGifs([]);
    setStatus("idle");
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setStatus("analyzing");
    setError(null);
    setSelectedGifId(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/analyze-screenshot`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "analysis failed");
      }
      const data = await res.json();
      setContext(data.context);
      setTrendingGifs(data.trending_gifs || []);
      setFreshGifs(data.fresh_gifs || []);
      setStatus("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "something went wrong");
      setStatus("idle");
    }
  }, [file]);

  const handleSelectGif = useCallback(
    async (gif: GifData) => {
      setSelectedGifId(gif.id);
      showToast("gif selected — download or copy url below");
      try {
        const res = await fetch(`${API_BASE}/select-gif`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gif_id: gif.id,
            gif_url: gif.url,
            gif_preview_url: gif.preview_url,
            gif_title: gif.title,
            context_summary: context?.context_summary || "",
            emotional_tone: context?.emotional_tone || "",
            search_query: context?.gif_search_query || "",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          showToast(data.message);
        }
      } catch {
        showToast("gif selected");
      }
    },
    [context]
  );

  const handleReset = () => {
    setStatus("idle");
    setFile(null);
    setContext(null);
    setTrendingGifs([]);
    setFreshGifs([]);
    setSelectedGifId(null);
    setError(null);
  };

  return (
    <>
      {/* Hero */}
      <section className={`hero ${status === "results" ? "hero--compact" : ""}`}>
        <div className="hero__content">
          <div className="hero__left">
            <h1 className="hero__title">
              findmy
              <span className="hero__title-gif">
                gif
                <svg className="hero__circle" viewBox="0 0 100 70" preserveAspectRatio="none">
                  <ellipse cx="50" cy="35" rx="46" ry="30" />
                </svg>
              </span>
            </h1>
            <p className="hero__desc">
              find the perfect gif for your instagram reel comment, or response to your friends
            </p>
          </div>

          <div className="hero__right">
            {status === "analyzing" ? (
              <LoadingState />
            ) : (
              <>
                <DropZone onFileSelect={handleFileSelect} disabled={false} />
                {file && status === "idle" && (
                  <button className="btn-primary" onClick={handleAnalyze}>
                    Find GIFs
                  </button>
                )}
                {error && <div className="error">{error}</div>}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Trending Carousel — shown when idle */}
      {status !== "results" && <GifCarousel />}

      {/* Results */}
      {status === "results" && (
        <section className="results">
          {context && (
            <div className="context">
              <div className="context__label">Analysis</div>
              <div className="context__grid">
                <div>
                  <div className="context__item-label">Tone</div>
                  <div className="context__item-value">{context.emotional_tone}</div>
                </div>
                <div>
                  <div className="context__item-label">Context</div>
                  <div className="context__item-value">{context.context_summary}</div>
                </div>
                <div>
                  <div className="context__item-label">Search</div>
                  <div className="context__item-value">{context.gif_search_query}</div>
                </div>
              </div>
            </div>
          )}

          <GifGrid
            trendingGifs={trendingGifs}
            freshGifs={freshGifs}
            selectedGifId={selectedGifId}
            onSelectGif={handleSelectGif}
          />

          <button className="btn-outline" onClick={handleReset}>
            Try Another
          </button>
        </section>
      )}

      <div className={`toast ${toast ? "toast--visible" : ""}`}>{toast}</div>
    </>
  );
}
