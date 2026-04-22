import { useState } from "react";

function App() {
  const [open, setOpen] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gray-200 flex justify-center pt-10 pb-10 font-sans">
      <div className="w-full max-w-md bg-gray-50 flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-gray-300 relative">
        <header className="bg-blue-600 text-white p-4 h-24 flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-wide">TrueGigs</h1>
        </header>

        <div className={`p-4 space-y-4 flex-1 ${open ? "opacity-40 blur-[1px] pointer-events-none" : ""}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Upcoming Shift</p>
                <p className="font-bold text-gray-900 mt-1">Lunch Service</p>
                <p className="text-sm text-gray-600 mt-1">12:03 PM - 8:00 PM</p>
                <p className="text-sm text-gray-500 mt-1">
                  <i className="fas fa-map-marker-alt mr-1 text-blue-500" />
                  Manhattan
                </p>
              </div>
              {!clockedIn ? (
                <button
                  onClick={() => setOpen(true)}
                  className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Clock In
                </button>
              ) : (
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                  ON SHIFT
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">This Week</p>
            <div className="flex justify-between mt-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">0.0</p>
                <p className="text-xs text-gray-500">hours logged</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">$0</p>
                <p className="text-xs text-gray-500">earned</p>
              </div>
            </div>
          </div>
        </div>

        {open && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all">
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">Ready to Clock In?</h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition"
                >
                  <i className="fas fa-times" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-3 text-sm">
                  <InfoRow icon="fas fa-concierge-bell" label="Event" value="Lunch Service" />
                  <InfoRow icon="far fa-clock" label="Shift Time" value="12:03 PM - 8:00 PM" />
                  <InfoRow icon="fas fa-map-marker-alt" label="Location" value="Manhattan" />
                </div>

                <div className="flex justify-between items-center px-2 pt-2">
                  <span className="text-sm font-medium text-gray-600">Total Time Logged:</span>
                  <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                    0.0 hours
                  </span>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => {
                    setClockedIn(true);
                    setOpen(false);
                  }}
                  className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 relative overflow-hidden group"
                >
                  <span className="absolute w-full h-full rounded-xl ring-4 ring-blue-400 opacity-0 group-hover:animate-pulse group-hover:opacity-50 transition-opacity" />
                  <i className="fas fa-stopwatch text-xl" />
                  <span>Clock In Now</span>
                </button>
                <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center">
                  <i className="fas fa-location-arrow mr-1" /> Location verified
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center">
      <div className="w-8 flex justify-center text-blue-500">
        <i className={icon} />
      </div>
      <div className="flex flex-col ml-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
}

export default App;
