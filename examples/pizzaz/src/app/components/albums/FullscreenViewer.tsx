import { useEffect, useState } from "react";

import { FilmStrip } from "./FilmStrip";

interface Photo {
  id: string;
  title: string;
  url: string;
}

interface Album {
  id: string;
  title: string;
  cover: string;
  photos: Photo[];
}

interface FullscreenViewerProps {
  album: Album;
}

export function FullscreenViewer({ album }: FullscreenViewerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(0);
  }, [album?.id]);

  const photo = album?.photos?.[index];

  return (
    <div className="relative w-full h-full bg-white min-h-[600px]">
      <div className="absolute inset-0 flex flex-row overflow-hidden">
        {/* Film strip */}
        <div className="hidden md:block absolute pointer-events-none z-10 left-0 top-0 bottom-0 w-40">
          <FilmStrip album={album} selectedIndex={index} onSelect={setIndex} />
        </div>
        {/* Main photo */}
        <div className="flex-1 min-w-0 px-40 py-10 relative flex items-center justify-center flex-auto">
          <div className="relative w-full h-full">
            {photo ? (
              <img
                src={photo.url}
                alt={photo.title || album.title}
                className="absolute inset-0 m-auto rounded-3xl shadow-sm border border-black/10 max-w-full max-h-full object-contain"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
