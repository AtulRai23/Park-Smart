/*                     ONLY THE LINES THAT CHANGE ARE MARKED ▼                       */
/* ------------------------------------------------------------------------------- */
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

/* …(unchanged code above)… */

/* ─── Socket live updates ─────────────────────────────── */
useEffect(() => {
  const s = socketIO("http://localhost:5000", { withCredentials: true });

  s.on("spotUpdated", (up) =>
    setSpots((prev) =>
      prev.map((p) =>
        p._id === up._id
          ? {                                    // ▼ keep client-only flags
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

/* ─── reservation handlers ────────────────────────────── */
const reserve = async (spotId) => {
  const res = await fetch("http://localhost:5000/api/reservations", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spotId }),
  });
  const r = await res.json();

  const mine = {                               /* ▼ paid flag starts false */
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

/* …(cancel & pay remain the same)… */

/* ─── countdown only after payment ────────────────────── */
const myReservation = spots.find(
  (s) => s._id === active?._id && s.reservationForMe && s.paid      /* ▼ */
);
const millisLeft = useCountdown(myReservation?.expiresAt ?? Date.now());

/* ─── info-window markup ───────────────────────────────── */
{active && (
  <InfoWindow /* …positions unchanged… */>
    <div className="text-sm">
      <strong>{active.name}</strong><br />
      ₹{active.pricePerHour}/hr<br />
      {Math.round(active.distM)} m away
      {active.reservationForMe ? (
        active.paid ? (                                          /* ▼ show timer only when paid */
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
