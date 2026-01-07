import { Star } from "lucide-react";

interface Place {
  id: string;
  name: string;
  coords: [number, number];
  description: string;
  city: string;
  rating: number;
  price: string;
  thumbnail: string;
}

interface SidebarProps {
  places: Place[];
  selectedId: string | null;
  onSelectPlace: (place: Place) => void;
}

export function Sidebar({ places, selectedId, onSelectPlace }: SidebarProps) {
  return (
    <div className="pizzaz-sidebar absolute z-20 top-0 bottom-4 left-0 right-auto xl:left-6 xl:top-6 xl:bottom-8 w-[340px] xl:w-[360px] pointer-events-auto">
      <div className="relative h-full overflow-y-auto rounded-none xl:rounded-3xl bg-white text-black xl:shadow-xl xl:ring ring-black/10">
        <div className="p-4 sm:p-5 border-b border-black/5">
          <div className="text-2xl font-medium">Best Pizza in SF</div>
          <div className="text-sm mt-1 opacity-70">
            Discover the finest pizza spots around the city
          </div>
        </div>

        <div className="divide-y divide-black/5">
          {places.map((place) => {
            const isSelected = place.id === selectedId;
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => onSelectPlace(place)}
                className={
                  "w-full text-left p-4 hover:bg-black/5 transition-colors" +
                  (isSelected ? " bg-[#F46C21]/10" : "")
                }
              >
                <div className="flex items-start gap-3">
                  <img
                    src={place.thumbnail}
                    alt={place.name}
                    className="h-14 w-14 rounded-lg object-cover ring ring-black/5 flex-none"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">
                      {place.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-black/70">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      {place.rating.toFixed(1)}
                      {place.price ? <span>· {place.price}</span> : null}
                    </div>
                    <div className="mt-1 text-sm text-black/60 line-clamp-2">
                      {place.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
