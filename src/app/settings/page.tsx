"use client";

import { useState, useEffect, useCallback } from "react";

interface ApiKeyStatus {
  key: string;
  label: string;
  placeholder: string;
  source: "config" | "env" | "none";
  masked: string;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleSave = async (key: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: inputValue }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage({ type: "success", text: `${key} saved successfully` });
      setEditingKey(null);
      setInputValue("");
      await fetchKeys();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (key: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: "" }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage({ type: "success", text: `${key} removed` });
      setEditingKey(null);
      setInputValue("");
      await fetchKeys();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Remove failed" });
    } finally {
      setSaving(false);
    }
  };

  const sourceLabel = (source: string) => {
    switch (source) {
      case "config": return "UI";
      case "env": return "ENV";
      default: return null;
    }
  };

  const sourceBadgeColor = (source: string) => {
    switch (source) {
      case "config": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "env": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      default: return "";
    }
  };

  return (
    <div className="space-y-6 animate-float-in">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold gradient-text-battle mb-2">Settings</h2>
        <p className="text-sm text-gray-500">Configure API keys and provider credentials</p>
      </div>

      {/* Info banner */}
      <div className="glass-card p-4 border border-gray-700/50">
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">&#x1f6c8;</span>
          <div className="text-sm text-gray-400">
            <p>
              API keys are stored locally in <code className="text-gray-300 bg-gray-800 px-1 rounded">.data/config.json</code> (gitignored) and never exposed to the browser.
              Keys set here take priority over environment variables.
            </p>
            <p className="mt-1">
              For CLI mode, the respective CLI tools (claude, gemini, codex) must also be installed.
              Check the <a href="/status" className="text-purple-400 hover:text-purple-300 underline">Status page</a> for system health.
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error message */}
      {message && (
        <div className={`glass-card p-3 border text-sm ${
          message.type === "success"
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-5 bg-gray-800 rounded w-48 mb-3" />
              <div className="h-10 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* API Key Cards */}
      {!loading && (
        <div className="space-y-4">
          {keys.map((apiKey) => {
            const isEditing = editingKey === apiKey.key;
            const isConfigured = apiKey.source !== "none";

            return (
              <div
                key={apiKey.key}
                className={`glass-card p-5 border ${
                  isConfigured ? "border-gray-700/50" : "border-yellow-500/20"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-200">{apiKey.label}</h3>
                    {isConfigured && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${sourceBadgeColor(apiKey.source)}`}>
                        via {sourceLabel(apiKey.source)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isConfigured && apiKey.source === "config" && !isEditing && (
                      <button
                        onClick={() => handleRemove(apiKey.key)}
                        disabled={saving}
                        className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingKey(apiKey.key);
                          setInputValue("");
                          setMessage(null);
                        }}
                        className="text-xs px-3 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition"
                      >
                        {isConfigured ? "Update" : "Configure"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Current value (masked) */}
                {isConfigured && !isEditing && (
                  <div className="font-mono text-sm text-gray-500 bg-gray-900/50 rounded px-3 py-2 border border-gray-800/50">
                    {apiKey.masked}
                  </div>
                )}

                {/* Not configured hint */}
                {!isConfigured && !isEditing && (
                  <p className="text-sm text-yellow-500/70">Not configured - battles using this provider will fail</p>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={apiKey.placeholder}
                        autoFocus
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && inputValue.trim()) handleSave(apiKey.key);
                          if (e.key === "Escape") { setEditingKey(null); setInputValue(""); }
                        }}
                      />
                      <button
                        onClick={() => handleSave(apiKey.key)}
                        disabled={saving || !inputValue.trim()}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition disabled:opacity-50 disabled:hover:bg-purple-600"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingKey(null); setInputValue(""); }}
                        className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm border border-gray-700 transition"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-gray-600">
                      Key: <code className="text-gray-500">{apiKey.key}</code> - Press Enter to save, Escape to cancel
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Provider mapping info */}
      <div className="glass-card p-5">
        <h3 className="font-medium text-gray-200 mb-3">Provider Mapping</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 py-2 px-3 rounded bg-gray-900/50">
            <span className="w-28 text-gray-400">Claude models</span>
            <span className="text-gray-600">-&gt;</span>
            <span className="text-gray-300">claude CLI</span>
            <span className="text-gray-600">-&gt;</span>
            <code className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">ANTHROPIC_API_KEY</code>
          </div>
          <div className="flex items-center gap-3 py-2 px-3 rounded bg-gray-900/50">
            <span className="w-28 text-gray-400">Gemini models</span>
            <span className="text-gray-600">-&gt;</span>
            <span className="text-gray-300">gemini CLI</span>
            <span className="text-gray-600">-&gt;</span>
            <code className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">GOOGLE_API_KEY</code>
          </div>
          <div className="flex items-center gap-3 py-2 px-3 rounded bg-gray-900/50">
            <span className="w-28 text-gray-400">GPT / Codex</span>
            <span className="text-gray-600">-&gt;</span>
            <span className="text-gray-300">codex CLI</span>
            <span className="text-gray-600">-&gt;</span>
            <code className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">OPENAI_API_KEY</code>
          </div>
        </div>
      </div>
    </div>
  );
}
