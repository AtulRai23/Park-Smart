import React, { useEffect, useState } from "react";
import useCountdown from "../Utils/useCountdown";

/* ---------------- helper row ---------------- */
function Row({ r, onAction }) {
  const leftMs = useCountdown(new Date(r.expiresAt).getTime());
  const mm = String(Math.floor(leftMs / 60_000)).padStart(2, "0");
  const ss = String(Math.floor(leftMs / 1_000) % 60).padStart(2, "0");

  return (
    <li className="py-2 border-b border-slate-700 text-sm flex justify-between items-center">
      <div>
        <span>{r.spotId?.name || "Spot"}</span>
        <span className="text-xs text-gray-400">&nbsp;₹{r.pricePerHour}/hr</span>
        {r.status === "active" && !r.paid && (
          <span className="ml-2 text-yellow-400">⏱ {mm}:{ss}</span>
        )}
      </div>

      {/* ▶▶ status / action area  ◀◀ */}
      <span>
        {r.status === "active"
          ? r.paid
            ? "💰"              // paid & still active
            : (
              <div className="flex gap-2">
                <button
                  onClick={() => onAction(r._id, "completed")}
                  className="px-2 py-0.5 bg-green-600 text-white rounded text-xs"
                >
                  Complete
                </button>
                <button
                  onClick={() => onAction(r._id, "cancelled")}
                  className="px-2 py-0.5 bg-gray-700 text-white rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            )
          : r.status === "completed"
          ? "✅"
          : "✖"}
      </span>
    </li>
  );
}


/* ---------------- main panel ---------------- */
export default function HistoryPanel() {
  const [list, setList] = useState(null);

  const fetchList = async () => {
    const res = await fetch("http://localhost:5000/api/reservations/me", {
      credentials: "include",
    });
    setList(await res.json());
  };

  /* handle Cancel / Complete clicks */
  const patchStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/reservations/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    // refresh immediately
    fetchList();
    // let MapPanel know so it can show/hide marker
    window.dispatchEvent(new Event("history-refresh"));
  };

  /* initial + on custom event */
  useEffect(() => {
    fetchList();
    const h = () => fetchList();
    window.addEventListener("history-refresh", h);
    return () => window.removeEventListener("history-refresh", h);
  }, []);

  if (!list) return <p className="text-gray-400 px-4">Loading…</p>;

  return (
    <aside className="card h-[500px] overflow-y-auto bg-slate-900 px-4 py-3">
      <h3 className="text-lg font-semibold mb-3">My bookings</h3>
      <ul>
        {list.map((r) => (
          <Row key={r._id} r={r} onAction={patchStatus} />
        ))}
      </ul>
    </aside>
  );
}
