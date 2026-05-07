"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapComponent() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [hezZones, setHezZones] = useState<any[]>([]);

  useEffect(() => {
    // Get user zones
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.hez_zones) {
        setHezZones(session.user.user_metadata.hez_zones);
      }
    };
    fetchUser();

    // Track position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  if (!position) {
    return <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium bg-[#0d1117]">Acquiring GPS Signal... Ensure Location is enabled.</div>;
  }

  return (
    <MapContainer center={position} zoom={15} scrollWheelZoom={true} className="w-full h-full z-0" style={{ zIndex: 0 }}>
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
    </MapContainer>
  );
}
