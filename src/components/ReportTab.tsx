import { useState } from "react";
import { generateReport, validateRatio, checkWaterBalance, validateDebris, validateWind } from "../utils/validators";
import type { RatioResult, WaterBalanceResult, DebrisResult, WindResult } from "../types";

export default function ReportTab() {
  const [reportText, setReportText] = useState<string>("");
  const [hasGenerated, setHasGenerated] = useState(false);

  // Form state for report inputs
  const [ratioData, setRatioData] = useState({ eta: "", eto: "", threshold: "0.1" });
  const [wbData, setWbData] = useState({
    precipitation: "",
    irrigation: "",
    inflows: "",
    et: "",
    outflows: "",
  });
  const [debrisData, setDebrisData] = useState({
    volume: "",
    type: "",
    density: "",
    estimatedMass: "",
    measuredMass: "",
  });
  const [windData, setWindData] = useState({
    surfaceWind: "",
    height: "",
    gustDuration: "",
    atmosphericContext: "",
    damageObservation: "",
  });

  const handleGenerate = () => {
    // Run all validators
    let ratio: RatioResult | null = null;
    let waterBalance: WaterBalanceResult | null = null;
    let debris: DebrisResult | null = null;
    let wind: WindResult | null = null;

    if (ratioData.eta || ratioData.eto) {
      ratio = validateRatio(ratioData.eta, ratioData.eto, parseFloat(ratioData.threshold) || 0.1);
    }

    if (wbData.precipitation || wbData.irrigation || wbData.inflows || wbData.et || wbData.outflows) {
      waterBalance = checkWaterBalance(wbData);
    }

    if (debrisData.volume || debrisData.density || debrisData.measuredMass) {
      debris = validateDebris({
        ...debrisData,
        volumeUnit: "m3",
        densityUnit: "kg/m3",
        massUnit: "kg",
      });
    }

    if (windData.surfaceWind) {
      wind = validateWind({
        ...windData,
        windUnit: "m/s",
      });
    }

    const report = generateReport({ ratio, waterBalance, debris, wind });
    setReportText(report);
    setHasGenerated(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText).then(() => {
      alert("Report copied to clipboard!");
    });
  };

  const handleClear = () => {
    setReportText("");
    setHasGenerated(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          📄 Report Generator
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Generate a plain-language, uncertainty-labeled triage report. Enter values below or
          leave blank to skip a section. All "unavailable" values are preserved — never zeroed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ratio inputs */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-indigo-700 mb-3">ETa/ETo Ratio</h4>
            <div className="space-y-2">
              <input
                type="text"
                value={ratioData.eta}
                onChange={(e) => setRatioData({ ...ratioData, eta: e.target.value })}
                placeholder="ETa (mm/day)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={ratioData.eto}
                onChange={(e) => setRatioData({ ...ratioData, eto: e.target.value })}
                placeholder="ETo (mm/day)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={ratioData.threshold}
                onChange={(e) => setRatioData({ ...ratioData, threshold: e.target.value })}
                placeholder="Threshold (default 0.1)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          {/* Water Balance inputs */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-teal-700 mb-3">Water Balance</h4>
            <div className="space-y-2">
              <input
                type="text"
                value={wbData.precipitation}
                onChange={(e) => setWbData({ ...wbData, precipitation: e.target.value })}
                placeholder="Precipitation (mm)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={wbData.irrigation}
                onChange={(e) => setWbData({ ...wbData, irrigation: e.target.value })}
                placeholder="Irrigation (mm)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={wbData.inflows}
                onChange={(e) => setWbData({ ...wbData, inflows: e.target.value })}
                placeholder="Inflows (mm)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={wbData.et}
                onChange={(e) => setWbData({ ...wbData, et: e.target.value })}
                placeholder="ETa (mm)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={wbData.outflows}
                onChange={(e) => setWbData({ ...wbData, outflows: e.target.value })}
                placeholder="Outflows (mm)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          {/* Debris inputs */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-orange-700 mb-3">Debris Assessment</h4>
            <div className="space-y-2">
              <input
                type="text"
                value={debrisData.volume}
                onChange={(e) => setDebrisData({ ...debrisData, volume: e.target.value })}
                placeholder="Volume (m³)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={debrisData.density}
                onChange={(e) => setDebrisData({ ...debrisData, density: e.target.value })}
                placeholder="Density (kg/m³)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={debrisData.measuredMass}
                onChange={(e) => setDebrisData({ ...debrisData, measuredMass: e.target.value })}
                placeholder="Measured mass (kg)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          {/* Wind inputs */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-cyan-700 mb-3">Wind Analysis</h4>
            <div className="space-y-2">
              <input
                type="text"
                value={windData.surfaceWind}
                onChange={(e) => setWindData({ ...windData, surfaceWind: e.target.value })}
                placeholder="Surface wind (m/s)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={windData.height}
                onChange={(e) => setWindData({ ...windData, height: e.target.value })}
                placeholder="Height (m)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={windData.gustDuration}
                onChange={(e) => setWindData({ ...windData, gustDuration: e.target.value })}
                placeholder="Gust duration (s)"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={windData.damageObservation}
                onChange={(e) => setWindData({ ...windData, damageObservation: e.target.value })}
                placeholder="Damage observation"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleGenerate}
            className="px-6 py-2.5 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors text-sm font-medium"
          >
            Generate Report
          </button>
          {hasGenerated && (
            <>
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                📋 Copy
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Output */}
      {hasGenerated && reportText && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📑 Generated Report
          </h3>
          <div className="bg-gray-900 text-green-400 rounded-md p-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
            {reportText}
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>⚠ Disclaimer:</strong> This report is generated locally from the values you
              provided. No external data was fetched, no actions were taken. All "unavailable"
              values are preserved rather than zeroed. Evidence classes are labeled per term.
              This is a triage tool — not a final assessment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
