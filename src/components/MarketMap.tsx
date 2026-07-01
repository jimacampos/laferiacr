"use client";

import "azure-maps-control/dist/atlas.min.css";

import type { Map as AzureMap } from "azure-maps-control";
import { useEffect, useRef, useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import type { MarketLocation } from "@/lib/markets";

// Roughly centers the Costa Rican mainland when a market has no coordinates yet.
const COSTA_RICA_CENTER: [number, number] = [-84.1, 9.75];

type MapStatus = "loading" | "ready" | "error";

export function MarketMap({
  location,
  name,
}: {
  location: MarketLocation | null;
  name: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const { t, lang } = useTranslation();
  const [status, setStatus] = useState<MapStatus>("loading");

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

      map = new atlas.Map(container.current, {
        center: location ? [location.lng, location.lat] : COSTA_RICA_CENTER,
        zoom: location ? 14 : 6.4,
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

      map.events.add("ready", () => {
        if (disposed || !map) return;
        if (location) {
          const source = new atlas.source.DataSource();
          map.sources.add(source);
          source.add(new atlas.data.Point([location.lng, location.lat]));
          map.layers.add(
            new atlas.layer.SymbolLayer(source, undefined, {
              iconOptions: { allowOverlap: true },
            }),
          );
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
      map?.dispose();
    };
  }, [location, name, lang]);

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
