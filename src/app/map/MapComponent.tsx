"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface HighExpenseZone {
  lat: number;
  lng: number;
  timestamp: string;
}

interface AutoHezZone extends HighExpenseZone {
  id: string;
  name: string;
  kind: string;
}

const SCAN_RADIUS_METERS = 2000;
const RESCAN_DISTANCE_METERS = 500;

function getDistanceMeters(from: [number, number], to: [number, number]) {
  const earthRadius = 6371e3;
  const lat1 = from[0] * Math.PI / 180;
  const lat2 = to[0] * Math.PI / 180;
  const deltaLat = (to[0] - from[0]) * Math.PI / 180;
  const deltaLng = (to[1] - from[1]) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [map, position]);
  return null;
}

// Fix default Leaflet icon paths in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

export default function MapComponent() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [hezZones, setHezZones] = useState<HighExpenseZone[]>([]);
  const [autoZones, setAutoZones] = useState<AutoHezZone[]>([]);
  const [scanStatus, setScanStatus] = useState("Acquiring GPS Signal");
  const lastScanPositionRef = useRef<[number, number] | null>(null);
  const isScanningRef = useRef(false);

  const pulseIcon = useMemo(() => L.divIcon({
    className: "hez-pulse-marker",
    html: '<span class="hez-pulse-core"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  }), []);

  const scanHighExpenseZones = async (coords: [number, number]) => {
    if (isScanningRef.current) return;
    const lastScan = lastScanPositionRef.current;
    if (lastScan && getDistanceMeters(lastScan, coords) < RESCAN_DISTANCE_METERS) return;

    isScanningRef.current = true;
    setScanStatus("Sweeping 2km HEZ grid");

    const [lat, lng] = coords;
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="restaurant"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        way["amenity"="restaurant"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        relation["amenity"="restaurant"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        node["shop"="mall"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        way["shop"="mall"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        relation["shop"="mall"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        node["amenity"="cafe"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        way["amenity"="cafe"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        relation["amenity"="cafe"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        node["tourism"="attraction"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        way["tourism"="attraction"](around:${SCAN_RADIUS_METERS},${lat},${lng});
        relation["tourism"="attraction"](around:${SCAN_RADIUS_METERS},${lat},${lng});
      );
      out center tags 60;
    `;

    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({ data: query }),
      });
      if (!response.ok) throw new Error(`Overpass sweep failed: ${response.status}`);
      const data = await response.json();
      const zones = (data.elements || [])
        .map((item: { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }) => {
          const zoneLat = item.lat ?? item.center?.lat;
          const zoneLng = item.lon ?? item.center?.lon;
          if (!zoneLat || !zoneLng) return null;
          const kind = item.tags?.amenity || item.tags?.shop || item.tags?.tourism || "expense";
          return {
            id: String(item.id),
            lat: zoneLat,
            lng: zoneLng,
            timestamp: new Date().toISOString(),
            name: item.tags?.name || "Unlabeled HEZ",
            kind,
          };
        })
        .filter(Boolean) as AutoHezZone[];

      setAutoZones(zones);
      lastScanPositionRef.current = coords;
      setScanStatus(`${zones.length} HEZ contacts detected`);
    } catch (error) {
      console.error("Overpass HEZ scan error:", error);
      setScanStatus("HEZ sweep unavailable");
    } finally {
      isScanningRef.current = false;
    }
  };

  useEffect(() => {
    // Get user zones
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.hez_zones) {
        setHezZones(session.user.user_metadata.hez_zones);
      }
    };
    fetchUser();

    // Track position and rescan only after meaningful movement.
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(coords);
          scanHighExpenseZones(coords);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  if (!position) {
    return <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium bg-[#0d1117]">Acquiring GPS Signal... Ensure Location is enabled.</div>;
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer center={position} zoom={15} scrollWheelZoom={true} className="w-full h-full z-0" style={{ zIndex: 0 }}>
      <RecenterMap position={position} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* User Live Location */}
      <Marker position={position}>
        <Popup>Your Current Location</Popup>
      </Marker>

      {/* HEZ Zones */}
      {hezZones.map((zone, index) => (
        <Circle 
          key={index}
          center={[zone.lat, zone.lng]} 
          pathOptions={{ color: 'red', fillColor: '#ef4444', fillOpacity: 0.4 }} 
          radius={500}
        >
          <Popup>High Expense Zone <br/> Logged: {new Date(zone.timestamp).toLocaleDateString()}</Popup>
        </Circle>
      ))}

      {autoZones.map((zone) => (
        <Marker key={zone.id} position={[zone.lat, zone.lng]} icon={pulseIcon}>
          <Popup>
            <strong>High Expense Zone</strong><br />
            {zone.name}<br />
            Tag: {zone.kind}
          </Popup>
        </Marker>
      ))}
      </MapContainer>
      <div className="pointer-events-none absolute right-3 top-3 z-[500] border border-red-500/30 bg-[#0d1117]/90 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-300 shadow-lg">
        {scanStatus}
      </div>
    </div>
  );
}
