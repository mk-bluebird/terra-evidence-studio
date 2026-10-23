import { useState } from "react";
import { validateRatio, checkWaterBalance, validateDebris, validateWind } from "../utils/validators";
import type { RatioResult, WaterBalanceResult, DebrisResult, WindResult } from "../types";

export default function TriageTab() {
  // ETa/ETo Ratio state
  const [eta, setEta] = useState("");
  const [eto, setEto] = useState("");
  const [threshold, setThreshold] = useState("0.1");
  const [ratioResult, setRatioResult] = useState<RatioResult | null>(null);

  // Water Balance state
  const [wbTerms, setWbTerms] = useState({
    precipitation: "",
    irrigation: "",
    inflows: "",
    et: "",
    outflows: "",
  });
  const [wbResult, setWbResult] = useState<WaterBalanceResult | null>(null);

  // Debris state
  const [debrisInput, setDebrisInput] = useState({
    volume: "",
    volumeUnit: "m3",
    type: "",
    density: "",
    densityUnit: "kg/m3",
    estimatedMass: "",
    measuredMass: "",
    massUnit: "kg",
  });
  const [debrisResult, setDebrisResult] = useState<DebrisResult | null>(null);

  // Wind state
  const [windInput, setWindInput] = useState({
    surfaceWind: "",
    windUnit: "m/s",
    height: "",
    gustDuration: "",
    atmosphericContext: "",
    damageObservation: "",
  });
  const [windResult, setWindResult] = useState<WindResult | null>(null);

  const handleRatioCalc = () => {
    const result = validateRatio(eta, eto, parseFloat(threshold) || 0.1);
    setRatioResult(result);
  };

  const handleWBCalc = () => {
    const result = checkWaterBalance(wbTerms);
    setWbResult(result);
  };

  const handleDebrisCalc = () => {
    const result = validateDebris(debrisInput);
    setDebrisResult(result);
  };

  const handleWindCalc = () => {
    const result = validateWind(windInput);
    setWindResult(result);
  };

  const classBadge = (cls: string) => {
    const colors: Record<string, string> = {
      measured: "bg-green-100 text-green-800",
      estimated: "bg-blue-100 text-blue-800",
      comparison: "bg-purple-100 text-purple-800",
      unavailable: "bg-amber-100 text-amber-800",
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[cls] || "bg-gray-100 text-gray-800"}`}>
        {cls}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ETa/ETo Ratio */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          📊 ETa/ETo Ratio Validator
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Protects near-zero denominator. Returns "unavailable" instead of misleading ratios.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ETa (mm/day)</label>
            <input
              type="text"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              placeholder="e.g., 3.2 or 'unavailable'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ETo (mm/day)</label>
            <input
              type="text"
              value={eto}
              onChange={(e) => setEto(e.target.value)}
              placeholder="e.g., 5.1 or 'unavailable'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Threshold</label>
            <input
              type="text"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRatioCalc}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Validate
            </button>
          </div>
        </div>
        {ratioResult && (
          <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-700">Result:</span>
              <span className="text-lg font-bold text-gray-900">{ratioResult.value}</span>
              <span className="text-sm text-gray-500">{ratioResult.unit}</span>
              {classBadge(ratioResult.class)}
            </div>
            {ratioResult.reason && (
              <p className="text-sm text-amber-700 mt-1">⚠ {ratioResult.reason}</p>
            )}
          </div>
        )}
      </div>

      {/* Water Balance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          💧 Water Balance Residual Check
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          P + I + Inflows − ETa − Outflows. Blocked if any term is unavailable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Precipitation (mm)</label>
            <input
              type="text"
              value={wbTerms.precipitation}
              onChange={(e) => setWbTerms({ ...wbTerms, precipitation: e.target.value })}
              placeholder="mm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Irrigation (mm)</label>
            <input
              type="text"
              value={wbTerms.irrigation}
              onChange={(e) => setWbTerms({ ...wbTerms, irrigation: e.target.value })}
              placeholder="mm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Inflows (mm)</label>
            <input
              type="text"
              value={wbTerms.inflows}
              onChange={(e) => setWbTerms({ ...wbTerms, inflows: e.target.value })}
              placeholder="mm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ETa (mm)</label>
            <input
              type="text"
              value={wbTerms.et}
              onChange={(e) => setWbTerms({ ...wbTerms, et: e.target.value })}
              placeholder="mm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Outflows (mm)</label>
            <input
              type="text"
              value={wbTerms.outflows}
              onChange={(e) => setWbTerms({ ...wbTerms, outflows: e.target.value })}
              placeholder="mm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleWBCalc}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors text-sm font-medium"
        >
          Check Balance
        </button>
        {wbResult && (
          <div className="bg-gray-50 rounded-md p-4 border border-gray-200 mt-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-700">Residual:</span>
              <span className="text-lg font-bold text-gray-900">{wbResult.residual}</span>
              <span className="text-sm text-gray-500">mm</span>
              {classBadge(wbResult.class)}
            </div>
            <p className="text-sm text-gray-600">Status: {wbResult.status}</p>
            {wbResult.details && (
              <p className="text-xs text-gray-500 mt-1">{wbResult.details}</p>
            )}
          </div>
        )}
      </div>

      {/* Debris Separator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          🪨 Debris Separator
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Volume × Density → Estimated Mass vs. Measured Mass. Checks consistency.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Volume</label>
            <input
              type="text"
              value={debrisInput.volume}
              onChange={(e) => setDebrisInput({ ...debrisInput, volume: e.target.value })}
              placeholder="e.g., 150"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Debris Type</label>
            <select
              value={debrisInput.type}
              onChange={(e) => setDebrisInput({ ...debrisInput, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select type...</option>
              <option value="wood">Wood/Timber</option>
              <option value="concrete">Concrete/Rubble</option>
              <option value="metal">Metal</option>
              <option value="soil">Soil/Sediment</option>
              <option value="vegetation">Vegetation</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Density (kg/m³)</label>
            <input
              type="text"
              value={debrisInput.density}
              onChange={(e) => setDebrisInput({ ...debrisInput, density: e.target.value })}
              placeholder="e.g., 600"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Measured Mass (kg)</label>
            <input
              type="text"
              value={debrisInput.measuredMass}
              onChange={(e) => setDebrisInput({ ...debrisInput, measuredMass: e.target.value })}
              placeholder="if available"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Mass (kg, if known separately)</label>
            <input
              type="text"
              value={debrisInput.estimatedMass}
              onChange={(e) => setDebrisInput({ ...debrisInput, estimatedMass: e.target.value })}
              placeholder="Alternative to volume×density"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleDebrisCalc}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              Assess Debris
            </button>
          </div>
        </div>
        {debrisResult && (
          <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Estimated Mass:</span>{" "}
                <span className="font-bold">{debrisResult.estimatedMass} kg</span>
              </div>
              <div>
                <span className="text-gray-600">Measured Mass:</span>{" "}
                <span className="font-bold">{debrisResult.measuredMass} kg</span>
              </div>
              <div>
                <span className="text-gray-600">Discrepancy:</span>{" "}
                <span className="font-bold">
                  {debrisResult.discrepancy}
                  {typeof debrisResult.discrepancy === "number" ? "%" : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {classBadge(debrisResult.class)}
              <span className="text-sm text-gray-700">{debrisResult.status}</span>
            </div>
          </div>
        )}
      </div>

      {/* Wind Separator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          💨 Wind Separator
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Surface wind + height/gust duration → adjusted peak wind vs. damage observation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Surface Wind (m/s)</label>
            <input
              type="text"
              value={windInput.surfaceWind}
              onChange={(e) => setWindInput({ ...windInput, surfaceWind: e.target.value })}
              placeholder="e.g., 15"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Measurement Height (m)</label>
            <input
              type="text"
              value={windInput.height}
              onChange={(e) => setWindInput({ ...windInput, height: e.target.value })}
              placeholder="default: 10m"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gust Duration (s)</label>
            <input
              type="text"
              value={windInput.gustDuration}
              onChange={(e) => setWindInput({ ...windInput, gustDuration: e.target.value })}
              placeholder="e.g., 3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Atmospheric Context</label>
            <select
              value={windInput.atmosphericContext}
              onChange={(e) => setWindInput({ ...windInput, atmosphericContext: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select context...</option>
              <option value="stable">Stable atmosphere</option>
              <option value="frontal">Frontal passage</option>
              <option value="convective">Convective/thunderstorm</option>
              <option value="tropical">Tropical cyclone</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Damage Observation</label>
            <input
              type="text"
              value={windInput.damageObservation}
              onChange={(e) => setWindInput({ ...windInput, damageObservation: e.target.value })}
              placeholder="e.g., tree branches broken, no damage, structural..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleWindCalc}
          className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors text-sm font-medium"
        >
          Analyze Wind
        </button>
        {windResult && (
          <div className="bg-gray-50 rounded-md p-4 border border-gray-200 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-2">
              <div>
                <span className="text-gray-600">Peak Adjusted Wind:</span>{" "}
                <span className="font-bold">{windResult.adjustedWind} m/s</span>
              </div>
              <div>
                <span className="text-gray-600">Classification:</span>{" "}
                <span className="font-bold">{windResult.classification}</span>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-1">
              <span className="text-gray-600">Damage Consistency:</span>{" "}
              {windResult.consistencyWithDamage}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {classBadge(windResult.class)}
              <span className="text-sm text-gray-700">{windResult.status}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
