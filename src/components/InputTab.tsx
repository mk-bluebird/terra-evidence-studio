import { useState, useEffect } from "react";
import type { EnvironmentalRecord } from "../types";
import { CANONICAL_UNITS } from "../types";

const STORAGE_KEY = "skynet_records";

export default function InputTab() {
  const [records, setRecords] = useState<EnvironmentalRecord[]>([]);
  const [form, setForm] = useState({
    quantityName: "",
    value: "",
    unit: "",
    startTime: "",
    endTime: "",
    timezone: "UTC",
    spatialSupport: "",
    method: "",
    qualityFlags: "",
  });

  // Load records from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecords(JSON.parse(stored));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Save records to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quantityName || !form.unit) return;

    const newRecord: EnvironmentalRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
      quantityName: form.quantityName,
      value: form.value || "unavailable",
      unit: form.unit,
      startTime: form.startTime || "unspecified",
      endTime: form.endTime || "unspecified",
      timezone: form.timezone,
      spatialSupport: form.spatialSupport || "point",
      method: form.method || "unspecified",
      qualityFlags: form.qualityFlags || "none",
      createdAt: new Date().toISOString(),
    };

    setRecords((prev) => [...prev, newRecord]);
    setForm({
      quantityName: "",
      value: "",
      unit: "",
      startTime: "",
      endTime: "",
      timezone: "UTC",
      spatialSupport: "",
      method: "",
      qualityFlags: "",
    });
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    if (confirm("Clear all records? This cannot be undone.")) {
      setRecords([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          📝 Add Environmental Record
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Name *
            </label>
            <input
              type="text"
              value={form.quantityName}
              onChange={(e) => setForm({ ...form, quantityName: e.target.value })}
              placeholder="e.g., temperature, precipitation, ETa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value (or leave empty for "unavailable")
            </label>
            <input
              type="text"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="Numeric value or leave blank"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            >
              <option value="">Select unit...</option>
              {Object.entries(CANONICAL_UNITS).map(([key, unit]) => (
                <option key={key} value={unit}>
                  {unit} ({key})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <input
              type="text"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="UTC"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spatial Support
            </label>
            <input
              type="text"
              value={form.spatialSupport}
              onChange={(e) => setForm({ ...form, spatialSupport: e.target.value })}
              placeholder="point, polygon, grid cell..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method
            </label>
            <input
              type="text"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              placeholder="sensor, model, manual observation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality Flags
            </label>
            <input
              type="text"
              value={form.qualityFlags}
              onChange={(e) => setForm({ ...form, qualityFlags: e.target.value })}
              placeholder="e.g., gap-filled, outlier-flagged, raw"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Add Record
            </button>
            {records.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Records Table */}
      {records.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Stored Records ({records.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Quantity</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Value</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Unit</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Method</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Flags</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium text-gray-800">{record.quantityName}</td>
                    <td className="py-2 px-2">
                      <span
                        className={
                          record.value === "unavailable"
                            ? "text-amber-600 font-medium"
                            : "text-gray-800"
                        }
                      >
                        {record.value}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-600">{record.unit}</td>
                    <td className="py-2 px-2 text-gray-600">{record.method}</td>
                    <td className="py-2 px-2 text-gray-600">{record.qualityFlags}</td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
