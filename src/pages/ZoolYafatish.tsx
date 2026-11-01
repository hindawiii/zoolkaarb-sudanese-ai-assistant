import BackButton from "@/components/BackButton";
import { MapPin, Loader2, Pill, Hospital, UtensilsCrossed, Wrench, Navigation, Phone } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/store/userStore";
import { Category, Place, fetchOverpassNearby, haversineKm, nearestFromMock } from "@/lib/places";
import { pickSudaneseMessage } from "@/lib/sudaneseLoading";

const CATEGORIES: { id: Category; label: string; labelAr: string; icon: typeof Pill; color: string; bg: string }[] = [
  { id: "pharmacy", label: "Pharmacies", labelAr: "صيدليات", icon: Pill, color: "text-nile", bg: "bg-nile/15" },
  { id: "hospital", label: "Hospitals", labelAr: "مستشفيات", icon: Hospital, color: "text-gold", bg: "bg-gold/15" },
  { id: "restaurant", label: "Restaurants", labelAr: "مطاعم", icon: UtensilsCrossed, color: "text-earth-light", bg: "bg-earth/15" },
  { id: "service", label: "Service Centers", labelAr: "مراكز خدمات", icon: Wrench, color: "text-sand-dark", bg: "bg-sand-dark/15" },
];

const ZoolYafatish = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = (params.get("category") as Category) || null;
  const { lastLocation, setLastLocation } = useUser();

  const [category, setCategory] = useState<Category | null>(initial);
  const [loc, setLoc] = useState<{ lat: number; lon: number } | null>(lastLocation);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [msg, setMsg] = useState("");

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported. Using Khartoum as default.");
      const fallback = { lat: 15.5007, lon: 32.5599 };
      setLoc(fallback);
      setLastLocation({ ...fallback, city: "Khartoum" });
      return;
    }
    setLocLoading(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLoc(next);
        setLastLocation(next);
        setLocLoading(false);
      },
      () => {
        setLocError("ما قدرنا نجيب موقعك. خلينا نستخدم الخرطوم.");
        const fallback = { lat: 15.5007, lon: 32.5599 };
        setLoc(fallback);
        setLastLocation({ ...fallback, city: "Khartoum" });
        setLocLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: false },
    );
  };

  useEffect(() => {
    if (!loc) requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loc || !category) return;
    let cancelled = false;
    (async () => {
      setPlacesLoading(true);
      setMsg(pickSudaneseMessage());
      setUsedFallback(false);
      try {
        const live = await fetchOverpassNearby(loc, category);
        if (cancelled) return;
        if (live.length === 0) throw new Error("empty");
        setPlaces(
          live
            .map((p) => ({ ...p, _d: haversineKm(loc, p) }))
            .sort((a, b) => (a as Place & { _d: number })._d - (b as Place & { _d: number })._d),
        );
      } catch {
        if (cancelled) return;
        setUsedFallback(true);
        setPlaces(nearestFromMock(loc, category));
      } finally {
        if (!cancelled) setPlacesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loc, category]);

  const enriched = useMemo(
    () => places.map((p) => ({ ...p, distanceKm: loc ? haversineKm(loc, p) : 0 })),
    [places, loc],
  );

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <BackButton onClick={() => (category ? setCategory(null) : navigate("/"))} />
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground" dir="rtl">الزول يفتش</h1>
          <p className="text-[10px] text-muted-foreground">Smart Directory</p>
        </div>
        <button
          onClick={requestLocation}
          className="p-2 rounded-full bg-card border border-border active:scale-95 transition-transform"
          aria-label="Refresh location"
        >
          {locLoading ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Navigation className="w-4 h-4 text-nile" />}
        </button>
      </header>

      {/* Location banner */}
      <div className="mx-5 mt-4 rounded-2xl gradient-sand border border-border p-3 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-gold shrink-0" />
        <p className="text-xs text-foreground flex-1 truncate">
          {loc ? `${loc.lat.toFixed(3)}, ${loc.lon.toFixed(3)}` : "Detecting your location…"}
        </p>
        {locError && <span className="text-[10px] text-muted-foreground font-cairo" dir="rtl">{locError}</span>}
      </div>

      {/* Category grid */}
      {!category && (
        <div className="px-5 mt-5">
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="rounded-2xl bg-card border border-border p-4 text-start active:scale-[0.97] transition-transform"
              >
                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <p className="text-sm font-semibold text-foreground">{c.label}</p>
                <p className="text-[11px] font-cairo text-earth-light mt-1" dir="rtl">{c.labelAr}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results list */}
      {category && (
        <div className="px-5 mt-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {CATEGORIES.find((c) => c.id === category)?.label}
            </p>
            {usedFallback && (
              <span className="text-[10px] text-earth-light font-cairo" dir="rtl">من قاعدة البيانات المحلية</span>
            )}
          </div>

          {placesLoading && (
            <div className="rounded-2xl bg-card border border-border p-5 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-gold animate-spin shrink-0" />
              <p className="text-sm font-cairo text-foreground" dir="rtl">{msg}</p>
            </div>
          )}

          {!placesLoading && enriched.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 font-cairo" dir="rtl">
              ما لقينا حاجة قريبة منك يا غالي.
            </p>
          )}

          {!placesLoading &&
            enriched.map((p) => {
              const mapsUrl = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}`;
              return (
                <div key={p.id} className="rounded-2xl bg-card border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-[11px] font-cairo text-earth-light mt-0.5 truncate" dir="rtl">{p.nameAr}</p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{p.distanceKm.toFixed(1)} km</span>
                        {p.open247 && <span className="text-nile font-semibold">• 24/7</span>}
                        {p.city && <span>• {p.city}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-full gradient-gold text-primary-foreground py-2 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Directions
                    </a>
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="px-4 rounded-full border border-border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default ZoolYafatish;
