"use client";

export interface GifData {
  id: string;
  url: string;
  preview_url: string;
  title: string;
  source: "giphy" | "pinecone";
  selection_count?: number | null;
}

interface GifCardProps {
  gif: GifData;
  isSelected: boolean;
  onSelect: (gif: GifData) => void;
}

export default function GifCard({ gif, isSelected, onSelect }: GifCardProps) {
  const handleSelect = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSelected) return;
    onSelect(gif);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(gif.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${gif.title || gif.id}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(gif.url, "_blank");
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(gif.url).catch(() => {});
  };

  return (
    <div
      className={`gif-card ${isSelected ? "gif-card--selected" : ""}`}
      onClick={() => handleSelect()}
      role="button"
      tabIndex={0}
    >
      <div className="gif-card__img-wrap">
        <img
          src={gif.preview_url || gif.url}
          alt={gif.title}
          className="gif-card__img"
          loading="lazy"
        />

        {gif.source === "pinecone" && gif.selection_count && (
          <span className="gif-card__badge">
            {gif.selection_count}× picked
          </span>
        )}

        {!isSelected && (
          <div className="gif-card__overlay">
            <button className="gif-card__select-btn" onClick={handleSelect}>
              select
            </button>
          </div>
        )}

        {isSelected && (
          <div className="gif-card__selected-overlay">
            <span className="gif-card__check">✓</span>
            <div className="gif-card__actions">
              <button className="gif-card__action-btn" onClick={handleDownload}>
                ↓ Download
              </button>
              <button className="gif-card__action-btn" onClick={handleCopyLink}>
                📋 Copy URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
