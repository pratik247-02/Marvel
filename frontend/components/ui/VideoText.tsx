"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface VideoTextProps {
  src: string;
  children: React.ReactNode;
  className?: string;
}

export function VideoText({ src, children, className }: VideoTextProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked
      });
    }
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Hidden video element */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Text with video as mask */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          mixBlendMode: "multiply",
        }}
      >
        <defs>
          <mask id="textMask">
            <rect width="100%" height="100%" fill="black" />
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="white"
              className="text-[20vw] font-black tracking-tighter"
              style={{ fontFamily: "inherit" }}
            >
              {children}
            </text>
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="black"
          mask="url(#textMask)"
        />
      </svg>

      {/* Fallback text overlay with clip-path for better browser support */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        <span
          className="text-[20vw] font-black tracking-tighter text-transparent bg-clip-text"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          {children}
        </span>
      </div>
    </div>
  );
}
