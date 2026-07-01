"use client";

import "azure-maps-control/dist/atlas.min.css";

import type { Map as AzureMap, source as AtlasSource } from "azure-maps-control";
import { useEffect, useRef, useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import type { MarketLocation } from "@/lib/markets";

// Roughly centers the Costa Rican mainland when a market has no coordinates yet.
const COSTA_RICA_CENTER: [number, number] = [-84.1, 9.75];

type MapStatus = "loading" | "ready" | "error";

export function MarketMap({
  location,
  name,
  editable = false,
  picked = null,
  onPick,
}: {
  location: MarketLocation | null;
  name: string;
  /** Enable pin-drop editing for a location proposal. */
  editable?: boolean;
  /** Currently picked point in edit mode (drives the movable pin). */
  picked?: MarketLocation | null;
  /** Called when the user taps the map (edit mode). */
  onPick?: (loc: MarketLocation) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const { t, lang } = useTranslation();
  const [status, setStatus] = useState<MapStatus>("loading");

  const mapRef = useRef<AzureMap | undefined>(undefined);
  const pickSourceRef = useRef<AtlasSource.DataSource | undefined>(undefined);
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let disposed = false;
    let map: AzureMap | undefined;

    async function init() {
      setStatus("loading");
      // Probe auth first so we can degrade gracefully when Maps isn't configured.
      let clientId: string;
      try {
        const res = await fetch("/api/maps/token", { cache: "no-store" });
        if (!res.ok) throw new Error("maps auth unavailable");
        clientId = (await res.json()).clientId;
      } catch {
        if (!disposed) setStatus("error");
        return;
      }

      const atlas = await import("azure-maps-control");
      if (disposed || !container.current) return;

      const start = picked ?? location;
      map = new atlas.Map(container.current, {
        center: start ? [start.lng, start.lat] : COSTA_RICA_CENTER,
        zoom: start ? 14 : 6.4,
        language: lang === "es" ? "es-ES" : "en-US",
        style: "road",
        authOptions: {
          authType: atlas.AuthenticationType.anonymous,
          clientId,
          getToken: async (resolve, reject) => {
            try {
              const r = await fetch("/api/maps/token", { cache: "no-store" });
              if (!r.ok) throw new Error("token unavailable");
              resolve((await r.json()).token);
            } catch (error) {
              reject(error instanceof Error ? error : new Error("token"));
            }
          },
        },
      });
      mapRef.current = map;

      map.events.add("ready", () => {
        if (disposed || !map) return;
        const source = new atlas.source.DataSource();
        map.sources.add(source);
        map.layers.add(
          new atlas.layer.SymbolLayer(source, undefined, {
            iconOptions: { allowOverlap: true },
          }),
        );
        pickSourceRef.current = source;

        const initial = editable ? picked : location;
        if (initial) {
          source.add(new atlas.data.Point([initial.lng, initial.lat]));
        }

        if (editable) {
          map.events.add("click", (e) => {
            const position = e.position;
            if (!position) return;
            const [lng, lat] = position;
            source.clear();
            source.add(new atlas.data.Point([lng, lat]));
            onPickRef.current?.({ lat, lng });
          });
        }

        map.controls.add(new atlas.control.ZoomControl(), {
          position: atlas.ControlPosition.TopRight,
        });
        setStatus("ready");
      });

      map.events.add("error", () => {
        if (!disposed) setStatus("error");
      });
    }

    void init();

    return () => {
      disposed = true;
      mapRef.current = undefined;
      pickSourceRef.current = undefined;
      map?.dispose();
    };
    // Re-init only on inputs that change the base map, not on `picked` (synced below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, name, lang, editable]);

  // In edit mode, reflect an externally-set pick (e.g. "use my location") onto the map.
  useEffect(() => {
    if (!editable || status !== "ready" || !picked) return;
    const map = mapRef.current;
    const source = pickSourceRef.current;
    if (!map || !source) return;
    let cancelled = false;
    void import("azure-maps-control").then((atlas) => {
      if (cancelled) return;
      source.clear();
      source.add(new atlas.data.Point([picked.lng, picked.lat]));
      map.setCamera({ center: [picked.lng, picked.lat], zoom: 15 });
    });
    return () => {
      cancelled = true;
    };
  }, [picked, editable, status]);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
      <div
        ref={container}
        className="h-full w-full"
        role="img"
        aria-label={t("map.pinLabel", { name })}
      />
      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-stone-400">
          {status === "loading" ? t("map.loading") : t("map.unavailable")}
        </div>
      )}
    </div>
  );
}
