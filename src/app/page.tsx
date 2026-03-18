import { BUILTIN_SCENARIOS } from "@/lib/scenarios";
import { AVAILABLE_MODELS } from "@/lib/models";

export default function Dashboard() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12">
        <h2 className="text-5xl font-bold mb-4">
          <span className="text-red-500">Red</span> vs{" "}
          <span className="text-blue-500">Blue</span>
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Pit AI models against each other in cybersecurity battles.
          Choose your models, pick a scenario, and watch the battle unfold in real-time.
        </p>
        <a
          href="/arena"
          className="mt-8 inline-block rounded-lg bg-gradient-to-r from-red-600 to-blue-600 px-8 py-3 font-semibold text-white hover:opacity-90 transition"
        >
          Start a Battle
        </a>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
          <div className="text-3xl font-bold text-red-400">{AVAILABLE_MODELS.length}</div>
          <div className="mt-1 text-sm text-gray-400">Available Models</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
          <div className="text-3xl font-bold text-blue-400">{BUILTIN_SCENARIOS.length}</div>
          <div className="mt-1 text-sm text-gray-400">Battle Scenarios</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
          <div className="text-3xl font-bold text-purple-400">0</div>
          <div className="mt-1 text-sm text-gray-400">Matches Played</div>
        </div>
      </section>

      {/* Scenarios Preview */}
      <section>
        <h3 className="text-2xl font-bold mb-6">Scenarios</h3>
        <div className="grid grid-cols-2 gap-4">
          {BUILTIN_SCENARIOS.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-600 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{s.name}</h4>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.difficulty === "beginner"
                      ? "bg-green-900 text-green-300"
                      : s.difficulty === "intermediate"
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-red-900 text-red-300"
                  }`}
                >
                  {s.difficulty}
                </span>
              </div>
              <p className="text-sm text-gray-400">{s.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {s.services.map((svc) => (
                  <span
                    key={svc}
                    className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
