"use client";

import { useState, useEffect, useRef } from "react";

interface CarouselGif {
  id: string;
  url: string;
  title: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GifCarousel() {
  const [gifs, setGifs] = useState<CarouselGif[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch trending GIFs from our backend (or directly from Giphy)
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_BASE}/trending-gifs?limit=20`);
        if (res.ok) {
          const data = await res.json();
          setGifs(data.gifs || []);
        }
      } catch {
        // Fallback: use placeholder GIF URLs from Giphy trending
        try {
          const res = await fetch(
            "https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=20&rating=g"
          );
          if (res.ok) {
            const data = await res.json();
            const mapped = data.data.map((g: { id: string; images: { fixed_height: { url: string } }; title: string }) => ({
              id: g.id,
              url: g.images.fixed_height.url,
              title: g.title,
            }));
            setGifs(mapped);
          }
        } catch {
          // No GIFs available
        }
      }
    };
    fetchTrending();
  }, []);

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || gifs.length === 0) return;

    let animId: number;
    let scrollPos = 0;
    const speed = 0.5; // pixels per frame

    const scroll = () => {
      scrollPos += speed;
      // Reset when we've scrolled past the first set
      if (scrollPos >= el.scrollWidth / 2) {
        scrollPos = 0;
      }
      el.scrollLeft = scrollPos;
      animId = requestAnimationFrame(scroll);
    };

    animId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animId);
  }, [gifs]);

  if (gifs.length === 0) return null;

  // Duplicate the array for seamless infinite scroll
  const doubledGifs = [...gifs, ...gifs];

  return (
    <div className="carousel">
      <div className="carousel__label">trending right now</div>
      <div className="carousel__track" ref={scrollRef}>
        {doubledGifs.map((gif, i) => (
          <div key={`${gif.id}-${i}`} className="carousel__item">
            <img src={gif.url} alt={gif.title} className="carousel__img" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}
