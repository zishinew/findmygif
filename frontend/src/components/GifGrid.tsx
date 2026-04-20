"use client";

import GifCard, { GifData } from "./GifCard";

interface GifGridProps {
  trendingGifs: GifData[];
  freshGifs: GifData[];
  selectedGifId: string | null;
  onSelectGif: (gif: GifData) => void;
}

export default function GifGrid({
  trendingGifs,
  freshGifs,
  selectedGifId,
  onSelectGif,
}: GifGridProps) {
  const hasTrending = trendingGifs.length > 0;
  const hasFresh = freshGifs.length > 0;

  if (!hasTrending && !hasFresh) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        no gifs found — try a different screenshot
      </div>
    );
  }

  return (
    <div>
      {hasTrending && (
        <div className="section">
          <div className="section__header">
            <span className="section__title">trending picks</span>
            <span className="section__count">({trendingGifs.length})</span>
          </div>
          <div className="gif-grid">
            {trendingGifs.map((gif) => (
              <GifCard
                key={gif.id}
                gif={gif}
                isSelected={selectedGifId === gif.id}
                onSelect={onSelectGif}
              />
            ))}
          </div>
        </div>
      )}

      {hasFresh && (
        <div className="section">
          <div className="section__header">
            <span className="section__title">results</span>
            <span className="section__count">({freshGifs.length})</span>
          </div>
          <div className="gif-grid">
            {freshGifs.map((gif) => (
              <GifCard
                key={gif.id}
                gif={gif}
                isSelected={selectedGifId === gif.id}
                onSelect={onSelectGif}
              />
            ))}
          </div>
        </div>
      )}

      <div className="attribution">
        powered by{" "}
        <a href="https://giphy.com" target="_blank" rel="noopener noreferrer">
          GIPHY
        </a>
      </div>
    </div>
  );
}
