/* global google */
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useContext,
} from "react";
import { io as socketIO } from "socket.io-client";
import { AuthContext } from "../Context/AuthContext";
import useCountdown from "../Utils/useCountdown";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import haversine from "../Utils/haversine";

export default function MapPanel() {
  const { user } = useContext(AuthContext);

  const [pos, setPos] = useState(null);
  const [spots, setSpots] = useState([]);
  const [active, setActive] = useState(null);
  const [route, setRoute] = useState(null);
  const [sortBy, setSortBy] = useState("distance");

  const mapRef = useRef(null);
  const prevPosRef = useRef(null);
  const lastRouteOrig = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
  });

  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      console.error,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    if (!pos) return;
    if (prevPosRef.current && haversine(prevPosRef.current, pos) < 200) return;
    prevPosRef.current = pos;

    (async () => {
      const qs = new URLSearchParams({ lat: pos.lat, lng: pos.lng, radius: 3 });
      const res = await fetch(`http://localhost:5000/api/spots/nearby?${qs}`);
      const data = await res.json();

      data.forEach((s) => {
        s.distM = haversine(pos, {
          lat: s.location.coordinates[1],
          lng: s.location.coordinates[0],
        });
      });

      data.sort((a, b) =>
        sortBy === "price"
          ? a.pricePerHour - b.pricePerHour
          : a.distM - b.distM
      );

      setSpots(data);
    })();
  }, [pos]);

  useEffect(() => {
    if (!spots.length || !pos) return;

    const sorted = [...spots];

    sorted.forEach((s) => {
      s.distM = haversine(pos, {
        lat: s.location.coordinates[1],
        lng: s.location.coordinates[0],
      });
    });

    sorted.sort((a, b) =>
      sortBy === "price"
        ? a.pricePerHour - b.pricePerHour
        : a.distM - b.distM
    );

    setSpots(sorted);
  }, [sortBy, pos]);

  useEffect(() => {
    const s = socketIO("http://localhost:5000", { withCredentials: true });

    s.on("spotUpdated", (up) =>
      setSpots((prev) =>
        prev.map((p) =>
          p._id === up._id
            ? {
                ...up,
                ...(p.reservationForMe && {
                  reservationForMe: true,
                  reservationId: p.reservationId,
                  expiresAt: p.expiresAt,
                  paid: p.paid,
                }),
              }
            : p
        )
      )
    );

    s.on("spotUpdated", () =>
      window.dispatchEvent(new Event("history-refresh"))
    );

    return () => s.disconnect();
  }, []);

  const buildRoute = useCallback(
    (spot) => {
      if (!pos) return;
      new google.maps.DirectionsService().route(
        {
          origin: pos,
          destination: {
            lat: spot.location.coordinates[1],
            lng: spot.location.coordinates[0],
          },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (res, status) => {
          if (status === "OK") {
            setRoute(res);
            lastRouteOrig.current = pos;
          }
        }
      );
    },
    [pos]
  );

  useEffect(() => {
    if (!route || !pos || !active) return;
    if (haversine(lastRouteOrig.current, pos) > 30) buildRoute(active);
  }, [pos, route, active, buildRoute]);

  useEffect(() => {
    if (mapRef.current && pos) mapRef.current.panTo(pos);
  }, [pos]);

  const onLoad = (map) => {
    mapRef.current = map;
    map.setZoom(13);
  };

  const reserve = async (spotId) => {
    const res = await fetch("http://localhost:5000/api/reservations", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotId }),
    });
    const r = await res.json();

    const mine = {
      reservationForMe: true,
      reservationId: r._id,
      expiresAt: new Date(r.expiresAt).getTime(),
      isOccupied: true,
      paid: false,
    };

    setSpots((prev) => prev.map((s) => (s._id === spotId ? { ...s, ...mine } : s)));
    setActive((curr) => (curr && curr._id === spotId ? { ...curr, ...mine } : curr));
    window.dispatchEvent(new Event("history-refresh"));
    return r;
  };

  const cancel = async (reservationId) => {
    await fetch(`http://localhost:5000/api/reservations/${reservationId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    window.dispatchEvent(new Event("history-refresh"));
  };

  const pay = async (reservationId) => {
    const res = await fetch("http://localhost:5000/api/pay/order", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    });
    const { orderId, razorKey, amount, name } = await res.json();

    new window.Razorpay({
      key: razorKey,
      amount,
      currency: "INR",
      name: "Park Smart",
      description: name,
      order_id: orderId,
      handler: () => window.dispatchEvent(new Event("history-refresh")),
      prefill: { email: user.email },
      theme: { color: "#2563eb" },
    }).open();
  };

  const myReservation = spots.find(
    (s) => s._id === active?._id && s.reservationForMe && s.paid
  );
  const millisLeft = useCountdown(myReservation?.expiresAt ?? Date.now());
  const mm = String(Math.floor(millisLeft / 60_000)).padStart(2, "0");
  const ss = String(Math.floor(millisLeft / 1_000) % 60).padStart(2, "0");

  if (!isLoaded) return <p className="text-gray-400">Loading map…</p>;
  if (!pos) return <p className="text-gray-400">Getting location…</p>;

  return (
    <>
      <div className="mb-2 flex gap-2 items-center">
        <label className="text-sm text-gray-700">Sort by:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        >
          <option value="distance">Distance</option>
          <option value="price">Price</option>
        </select>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "500px" }}
        center={pos}
        onLoad={onLoad}
        options={{ disableDefaultUI: true }}
      >
        <Marker
          position={pos}
          icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
        />

        {spots.map((s, i) =>
          s.isOccupied ? null : (
            <Marker
              key={s._id}
              position={{
                lat: s.location.coordinates[1],
                lng: s.location.coordinates[0],
              }}
              label={{ text: `${i + 1}`, className: "text-[10px]" }}
              onClick={() => {
                setActive(s);
                buildRoute(s);
              }}
            />
          )
        )}

        {active && (
          <InfoWindow
            position={{
              lat: active.location.coordinates[1],
              lng: active.location.coordinates[0],
            }}
            onCloseClick={() => {
              setActive(null);
              setRoute(null);
            }}
          >
            <div className="text-sm">
              <strong>{active.name}</strong><br />
              ₹{active.pricePerHour}/hr<br />
              {Math.round(active.distM)} m away
              {active.reservationForMe ? (
                active.paid ? (
                  <>
                    <p className="mt-1 text-yellow-400">⏱ {mm}:{ss} left</p>
                    <button
                      onClick={() => cancel(active.reservationId)}
                      className="mt-1 px-3 py-1 bg-gray-700 text-white rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <p className="mt-1 text-orange-400 text-xs">
                    Waiting for payment…
                  </p>
                )
              ) : (
                <button
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={async () => {
                    const r = await reserve(active._id);
                    pay(r._id);
                  }}
                >
                  Pay&nbsp;and&nbsp;Reserve
                </button>
              )}
            </div>
          </InfoWindow>
        )}

        {route && (
          <DirectionsRenderer
            directions={route}
            options={{ suppressMarkers: true }}
          />
        )}
      </GoogleMap>
    </>
  );
}
