import { useState } from "react";
import InputTab from "./components/InputTab";
import TriageTab from "./components/TriageTab";
import ReportTab from "./components/ReportTab";

type TabId = "input" | "triage" | "report";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const tabs: Tab[] = [
  {
    id: "input",
    label: "Input",
    icon: "📝",
    description: "Record environmental data with full provenance",
  },
  {
    id: "triage",
    label: "Triage",
    icon: "🔬",
    description: "Validate ratios, balances, debris, and wind",
  },
  {
    id: "report",
    label: "Report",
    icon: "📄",
    description: "Generate uncertainty-labeled text reports",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("input");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Skynet Evidence Workbench
                </h1>
                <p className="text-xs text-gray-500 -mt-0.5">Lite — Offline Triage Tool</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                Offline
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                localStorage
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group relative flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Description */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <p className="text-sm text-gray-500">
          {tabs.find((t) => t.id === activeTab)?.description}
        </p>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "input" && <InputTab />}
        {activeTab === "triage" && <TriageTab />}
        {activeTab === "report" && <ReportTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              All processing is local. No data leaves your browser. No external actions taken.
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>Evidence classes: measured · estimated · comparison · unavailable</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
