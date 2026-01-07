import mapboxgl from "mapbox-gl";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import "mapbox-gl/dist/mapbox-gl.css";

import { AnimatePresence } from "framer-motion";
import { Maximize2 } from "lucide-react";
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router";

import markersData from "../data/markers.json";
import { useDisplayMode } from "../openai/hooks/useDisplayMode";
import { useMaxHeight } from "../openai/hooks/useMaxHeight";
import { Inspector } from "./map/Inspector";
import { Sidebar } from "./map/Sidebar";

import "../index.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZXJpY25pbmciLCJhIjoiY21icXlubWM1MDRiczJvb2xwM2p0amNyayJ9.n-3O6JI5nOp_Lw96ZO5vJQ";

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

interface ViewState {
  center: [number, number];
  zoom: number;
}

function fitMapToMarkers(
  map: mapboxgl.Map | null,
  coords: Array<[number, number]>
) {
  if (!map || !coords.length) return;
  if (coords.length === 1) {
    map.flyTo({ center: coords[0], zoom: 12 });
    return;
  }
  const bounds = coords.reduce(
    (b, c) => b.extend(c),
    new mapboxgl.LngLatBounds(coords[0], coords[0])
  );
  map.fitBounds(bounds, { padding: 60, animate: true });
}

export function PizzaMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<mapboxgl.Map | null>(null);
  const markerObjs = useRef<mapboxgl.Marker[]>([]);
  const places = markersData?.places || [];
  const markerCoords = places.map((p) => p.coords);
  const navigate = useNavigate();
  const params = useParams();

  const selectedId = params.placeId ?? null;

  const selectedPlace = places.find((p) => p.id === selectedId) || null;

  const [viewState, setViewState] = useState<ViewState>(() => ({
    center:
      markerCoords.length > 0 ? (markerCoords[0] as [number, number]) : [0, 0],
    zoom: markerCoords.length > 0 ? 12 : 2,
  }));

  const displayMode = useDisplayMode();
  const maxHeight = useMaxHeight();
  const allowInspector = displayMode === "fullscreen";

  // Initialize map
  useEffect(() => {
    if (mapObj.current || !mapRef.current) return;

    mapObj.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center:
        markerCoords.length > 0
          ? (markerCoords[0] as [number, number])
          : [0, 0],
      zoom: markerCoords.length > 0 ? 12 : 2,
      attributionControl: false,
    });

    addAllMarkers(places as Place[]);
    setTimeout(() => {
      fitMapToMarkers(mapObj.current, markerCoords as Array<[number, number]>);
    }, 0);

    // Ensure resize after first paint
    requestAnimationFrame(() => mapObj.current?.resize());

    const handleResize = () => mapObj.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      mapObj.current?.remove();
      mapObj.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track map movement
  useEffect(() => {
    if (!mapObj.current) return;

    const handler = () => {
      if (!mapObj.current) return;
      const c = mapObj.current.getCenter();
      setViewState({ center: [c.lng, c.lat], zoom: mapObj.current.getZoom() });
    };

    mapObj.current.on("moveend", handler);
    return () => {
      mapObj.current?.off("moveend", handler);
    };
  }, []);

  function getInspectorOffsetPx() {
    if (displayMode !== "fullscreen") return 0;
    if (typeof window === "undefined") return 0;

    const isXlUp =
      window.matchMedia && window.matchMedia("(min-width: 1280px)").matches;
    const el = document.querySelector(".pizzaz-inspector");
    const w = el ? el.getBoundingClientRect().width : 360;
    const half = Math.round(w / 2);

    // xl: inspector on right → negative x offset; lg: inspector on left → positive x offset
    return isXlUp ? -half : half;
  }

  function panTo(
    coord: [number, number],
    options?: { offsetForInspector?: boolean }
  ) {
    if (!mapObj.current) return;

    const offsetForInspector = options?.offsetForInspector ?? false;
    const inspectorOffset = offsetForInspector ? getInspectorOffsetPx() : 0;

    const flyOpts: mapboxgl.EasingOptions = {
      center: coord,
      zoom: 14,
      speed: 1.2,
      curve: 1.6,
    };

    if (inspectorOffset) {
      flyOpts.offset = [inspectorOffset, 0];
    }

    mapObj.current.flyTo(flyOpts);
  }

  function addAllMarkers(placesList: Place[]) {
    markerObjs.current.forEach((m) => m.remove());
    markerObjs.current = [];

    placesList.forEach((place) => {
      if (!mapObj.current) return;

      const marker = new mapboxgl.Marker({
        color: "#F46C21",
      })
        .setLngLat(place.coords)
        .addTo(mapObj.current);

      const el = marker.getElement();
      if (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => {
          navigate(`/place/${place.id}`);
          panTo(place.coords, { offsetForInspector: true });
        });
      }

      markerObjs.current.push(marker);
    });
  }

  // Update markers when places change
  useEffect(() => {
    if (!mapObj.current) return;
    addAllMarkers(places as Place[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  // Pan to selected place
  useEffect(() => {
    if (!mapObj.current || !selectedPlace) return;
    panTo(selectedPlace.coords as [number, number], {
      offsetForInspector: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Resize map on dimension changes
  useEffect(() => {
    if (!mapObj.current) return;
    mapObj.current.resize();
  }, [maxHeight, displayMode]);

  // Sync state with OpenAI widget
  useEffect(() => {
    if (typeof window !== "undefined" && window.openai?.setWidgetState) {
      window.openai.setWidgetState({
        center: viewState.center,
        zoom: viewState.zoom,
        markers: markerCoords,
      });
    }
  }, [viewState, markerCoords]);

  const containerHeight =
    displayMode === "fullscreen"
      ? maxHeight
        ? maxHeight - 40
        : undefined
      : 480;

  return (
    <>
      <div
        style={{
          maxHeight: maxHeight || undefined,
          height: containerHeight,
        }}
        className={
          "relative antialiased w-full min-h-[480px] overflow-hidden " +
          (displayMode === "fullscreen"
            ? "rounded-none border-0"
            : "border border-black/10 rounded-2xl sm:rounded-3xl")
        }
      >
        {displayMode !== "fullscreen" && (
          <button
            aria-label="Enter fullscreen"
            className="absolute top-4 right-4 z-30 rounded-full bg-white text-black shadow-lg ring ring-black/5 p-2.5 pointer-events-auto"
            onClick={() => {
              if (selectedId) {
                navigate("..", { replace: true });
              }
              window.openai?.requestDisplayMode?.({ mode: "fullscreen" });
            }}
          >
            <Maximize2
              strokeWidth={1.5}
              className="h-4.5 w-4.5"
              aria-hidden="true"
            />
          </button>
        )}

        {/* Sidebar */}
        <Sidebar
          places={places as Place[]}
          selectedId={selectedId}
          onSelectPlace={(place) => {
            navigate(`/place/${place.id}`);
            panTo(place.coords, { offsetForInspector: true });
          }}
        />

        {/* Inspector (right) */}
        <AnimatePresence>
          {allowInspector && selectedPlace && (
            <Inspector
              key={selectedPlace.id}
              place={selectedPlace as Place}
              onClose={() => navigate("..", { replace: true })}
            />
          )}
        </AnimatePresence>

        {/* Map */}
        <div
          className={
            "absolute inset-0 overflow-hidden" +
            (displayMode === "fullscreen"
              ? " left-[340px] right-2 top-2 bottom-4 border border-black/10 rounded-3xl"
              : "")
          }
        >
          <div
            ref={mapRef}
            className="w-full h-full relative absolute bottom-0 left-0 right-0"
            style={{
              maxHeight: maxHeight || undefined,
              height: displayMode === "fullscreen" ? maxHeight : undefined,
            }}
          />
        </div>
      </div>

      {/* Suggestion chips (bottom, fullscreen) */}
      {displayMode === "fullscreen" && (
        <div className="hidden antialiased md:flex absolute inset-x-0 bottom-2 z-30 justify-center pointer-events-none">
          <div className="flex gap-3 pointer-events-auto">
            {["Open now", "Top rated", "Vegeterian friendly"].map((label) => (
              <button
                key={label}
                className="rounded-full font-base bg-white ring ring-black/10 text-black px-4 py-1.5 text-sm hover:bg-[#f7f7f7] cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function PizzaMapRoot() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<PizzaMap />}>
          <Route path="place/:placeId" element={<></>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <PizzaMapRoot />
    </StrictMode>
  );
}
