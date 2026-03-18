"use client";

import { useState, useEffect, useCallback } from "react";
import type { Scenario } from "@/types";

type Category = Scenario["category"];
type Difficulty = Scenario["difficulty"];

const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "web", label: "Web", icon: "🌐" },
  { value: "network", label: "Network", icon: "🔌" },
  { value: "cloud", label: "Cloud", icon: "☁️" },
  { value: "iot", label: "IoT", icon: "📡" },
  { value: "custom", label: "Custom", icon: "🔧" },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: "beginner", label: "Beginner", color: "bg-green-900 text-green-300 border-green-700" },
  { value: "intermediate", label: "Intermediate", color: "bg-yellow-900 text-yellow-300 border-yellow-700" },
  { value: "advanced", label: "Advanced", color: "bg-red-900 text-red-300 border-red-700" },
];

interface FormState {
  name: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  services: string[];
  maxRounds: number;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  category: "web",
  difficulty: "beginner",
  services: [],
  maxRounds: 10,
};

export default function ScenarioBuilderPage() {
  const [builtinScenarios, setBuiltinScenarios] = useState<Scenario[]>([]);
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [serviceInput, setServiceInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showExport, setShowExport] = useState<string | null>(null);

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch("/api/scenarios");
      const data = await res.json();
      setBuiltinScenarios(data.builtin ?? []);
      setCustomScenarios(data.custom ?? []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const addService = () => {
    const svc = serviceInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (svc && !form.services.includes(svc)) {
      setForm((f) => ({ ...f, services: [...f.services, svc] }));
      setServiceInput("");
    }
  };

  const removeService = (svc: string) => {
    setForm((f) => ({ ...f, services: f.services.filter((s) => s !== svc) }));
  };

  const handleServiceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addService();
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }
    if (!form.description.trim()) {
      setMessage({ type: "error", text: "Description is required" });
      return;
    }
    if (form.services.length === 0) {
      setMessage({ type: "error", text: "Add at least one service" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create scenario");
      }

      setMessage({ type: "success", text: "Scenario created!" });
      setForm({ ...emptyForm });
      fetchScenarios();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/scenarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchScenarios();
      }
    } catch {
      // Ignore
    }
  };

  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      if (data.name && data.description && data.category && data.services) {
        setForm({
          name: data.name,
          description: data.description,
          category: data.category,
          difficulty: data.difficulty || "beginner",
          services: data.services,
          maxRounds: data.maxRounds || 10,
        });
        setMessage({ type: "success", text: "Imported from clipboard" });
      } else {
        setMessage({ type: "error", text: "Invalid scenario format in clipboard" });
      }
    } catch {
      setMessage({ type: "error", text: "Could not read clipboard or invalid JSON" });
    }
  };

  const handleExport = (scenario: Scenario) => {
    const json = JSON.stringify({
      name: scenario.name,
      description: scenario.description,
      category: scenario.category,
      difficulty: scenario.difficulty,
      services: scenario.services,
      maxRounds: scenario.maxRounds,
    }, null, 2);

    setShowExport(showExport === scenario.id ? null : scenario.id);
    navigator.clipboard.writeText(json).catch(() => {});
  };

  return (
    <div className="space-y-6 animate-float-in">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold gradient-text-battle mb-2">Scenario Builder</h2>
        <p className="text-sm text-gray-500">Create custom battle scenarios for the arena</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">New Scenario</h3>

            {/* Name */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="My Custom Scenario"
                className="w-full rounded-lg bg-gray-900/60 border border-gray-700/50 py-2 px-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the scenario and what teams should focus on..."
                rows={3}
                className="w-full rounded-lg bg-gray-900/60 border border-gray-700/50 py-2 px-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer
                      ${form.category === cat.value
                        ? "bg-purple-500/20 border border-purple-500/50 text-purple-300"
                        : "bg-gray-900/40 border border-gray-700/50 text-gray-400 hover:border-gray-600/50"
                      }
                    `}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff.value}
                    onClick={() => setForm((f) => ({ ...f, difficulty: diff.value }))}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border
                      ${form.difficulty === diff.value ? diff.color : "bg-gray-900/40 border-gray-700/50 text-gray-400 hover:border-gray-600/50"}
                    `}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Services</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {form.services.map((svc) => (
                  <span
                    key={svc}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-300"
                  >
                    {svc}
                    <button
                      onClick={() => removeService(svc)}
                      className="text-gray-500 hover:text-red-400 transition cursor-pointer ml-1"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  onKeyDown={handleServiceKeyDown}
                  placeholder="Type service name, press Enter"
                  className="flex-1 rounded-lg bg-gray-900/60 border border-gray-700/50 py-1.5 px-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50"
                />
                <button
                  onClick={addService}
                  className="glass-card px-3 py-1.5 text-sm text-gray-300 hover:border-purple-500/50 transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Max Rounds */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Max Rounds</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={3}
                  max={25}
                  value={form.maxRounds}
                  onChange={(e) => setForm((f) => ({ ...f, maxRounds: Number(e.target.value) }))}
                  className="flex-1 accent-purple-500"
                />
                <span className="text-sm text-mono text-gray-300 w-6 text-center">{form.maxRounds}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="start-button rounded-lg px-6 py-2 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create Scenario"}
              </button>
              <button
                onClick={handleImport}
                className="glass-card px-4 py-2 text-xs text-gray-400 hover:border-purple-500/50 transition cursor-pointer"
              >
                📋 Import JSON
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`text-xs ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>

        {/* Preview + Existing Scenarios */}
        <div className="space-y-4">
          {/* Live preview */}
          {form.name && (
            <div className="glass-card p-4">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Preview</h3>
              <ScenarioCard scenario={{
                id: "preview",
                name: form.name,
                description: form.description || "No description yet",
                category: form.category,
                difficulty: form.difficulty,
                services: form.services,
                maxRounds: form.maxRounds,
              }} />
            </div>
          )}

          {/* Custom scenarios */}
          {customScenarios.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-3">Custom Scenarios ({customScenarios.length})</h3>
              <div className="space-y-2">
                {customScenarios.map((s) => (
                  <div key={s.id} className="relative">
                    <ScenarioCard scenario={s} />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => handleExport(s)}
                        className="text-xs text-gray-500 hover:text-purple-400 transition cursor-pointer px-1"
                        title="Export JSON"
                      >
                        📤
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-xs text-gray-500 hover:text-red-400 transition cursor-pointer px-1"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                    {showExport === s.id && (
                      <div className="mt-1 text-xs text-green-400">Copied to clipboard!</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Builtin scenarios */}
          <div>
            <h3 className="text-sm font-bold text-gray-300 mb-3">
              Built-in Scenarios ({builtinScenarios.length})
            </h3>
            <div className="space-y-2">
              {builtinScenarios.map((s) => (
                <div key={s.id} className="relative">
                  <ScenarioCard scenario={s} />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleExport(s)}
                      className="text-xs text-gray-500 hover:text-purple-400 transition cursor-pointer px-1"
                      title="Export JSON"
                    >
                      📤
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <div className="glass-card p-4 hover:border-gray-600/50 transition">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm text-gray-200">{scenario.name}</h4>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            scenario.difficulty === "beginner"
              ? "bg-green-900 text-green-300"
              : scenario.difficulty === "intermediate"
                ? "bg-yellow-900 text-yellow-300"
                : "bg-red-900 text-red-300"
          }`}
        >
          {scenario.difficulty}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-2">{scenario.description}</p>
      <div className="flex flex-wrap gap-1">
        {scenario.services.map((svc) => (
          <span
            key={svc}
            className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300"
          >
            {svc}
          </span>
        ))}
        <span className="text-xs text-gray-600 ml-auto">{scenario.maxRounds} rounds</span>
      </div>
    </div>
  );
}
