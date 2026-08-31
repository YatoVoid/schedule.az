// Builds a Google Maps link to point a customer at a store, for reminder
// messages. Coordinates are preferred (they drop a pin exactly), address is
// the fallback, and a store with neither gets no link rather than a vague
// name search. This is the outbound counterpart to resolveGoogleMapsLink in
// maps-link.ts, which parses links pasted the other direction.

type StoreLocation = {
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function buildMapsUrl(store: StoreLocation): string | null {
  if (typeof store.latitude === "number" && typeof store.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
  }
  if (store.address && store.address.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address.trim())}`;
  }
  return null;
}
