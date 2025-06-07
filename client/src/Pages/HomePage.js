import React, { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { LogOut } from "lucide-react";
import MapPanel from "../Components/MapPanel";
import HistoryPanel from "../Components/HistoryPanel";

export default function HomePage() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-darkbg flex flex-col text-gray-200">
      {/* ─── top bar ───────────────────────────────────────────── */}
      <header className="bg-slate-900 shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-lg font-semibold text-brand">Park&nbsp;Smart</span>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm
                       bg-brand text-white rounded-full hover:bg-brand/90 transition">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      {/* ─── main content ─────────────────────────────────────── */}
      <main className="flex-grow max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">
          Welcome,&nbsp;
          <span className="text-brand">{user?.name || user?.email}</span>
        </h2>

        {/* map + history layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* map card (takes 2/3 width on large screens) */}
          <section
            className="card lg:col-span-2"
            style={{ height: "500px" }}     // ensures MapPanel has space
          >
            <MapPanel />
          </section>

          {/* booking-history card */}
          <HistoryPanel />
        </div>
      </main>

      <footer className="text-center text-xs text-gray-500 py-4">
        © {new Date().getFullYear()} Park Smart
      </footer>
    </div>
  );
}
