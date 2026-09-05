import React, { useState, useEffect } from "react";
import { Topbar } from "./components/Topbar.js";
import { Sidebar } from "./components/Sidebar.js";
import { CommandPalette } from "./components/CommandPalette.js";
import { SplashScreen } from "./components/SplashScreen.js";
import { AnimatedBackground } from "./components/AnimatedBackground.js";

// Views
import { DashboardView } from "./views/DashboardView.js";
import { NewInvestigationView } from "./views/NewInvestigationView.js";
import { EvidenceVaultView } from "./views/EvidenceVaultView.js";
import { CaseDetailView } from "./views/CaseDetailView.js";
import { CrossCaseNetworkView } from "./views/CrossCaseNetworkView.js";
import { VerifyEvidenceView } from "./views/VerifyEvidenceView.js";
import { ForensicLabView } from "./views/ForensicLabView.js";
import { EvidenceReportsArchiveView } from "./views/EvidenceReportsArchiveView.js";
import { BlockchainLedgerView } from "./views/BlockchainLedgerView.js";
import { PrivacySecurityView } from "./views/PrivacySecurityView.js";
import { SystemHealthView } from "./views/SystemHealthView.js";
import { SettingsView } from "./views/SettingsView.js";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Check if splash has been shown in this session
  useEffect(() => {
    const splashSeen = sessionStorage.getItem("veritrace_splash_seen");
    if (splashSeen) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem("veritrace_splash_seen", "true");
  };

  const navigateTo = (view: string, caseId?: string) => {
    setActiveView(view);
    if (caseId) {
      setSelectedCaseId(caseId);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200 relative overflow-x-hidden">
      {/* Animated Dark Cyber & Forensic Background */}
      <AnimatedBackground />

      {/* Splash Screen Initialization */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={navigateTo}
      />

      {/* Header Topbar */}
      <Topbar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onNavigate={navigateTo}
        activeView={activeView}
      />

      {/* Layout Body with Sidebar and Main Content */}
      <div className="flex-1 flex pt-14 relative z-10">
        {/* Sidebar */}
        <Sidebar
          activeView={activeView}
          onNavigate={navigateTo}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <main
          id="main-content"
          className={`flex-1 transition-all duration-300 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ${
            sidebarCollapsed ? "ml-16" : "ml-64"
          }`}
        >
          {activeView === "dashboard" && <DashboardView onNavigate={navigateTo} />}

          {activeView === "new" && <NewInvestigationView onNavigate={navigateTo} />}

          {activeView === "vault" && <EvidenceVaultView onNavigate={navigateTo} />}

          {activeView === "reports" && <EvidenceReportsArchiveView onNavigate={navigateTo} />}

          {activeView === "network" && <CrossCaseNetworkView onNavigate={navigateTo} />}

          {activeView === "case-detail" && selectedCaseId && (
            <CaseDetailView caseId={selectedCaseId} onNavigate={navigateTo} />
          )}

          {activeView === "verify" && (
            <VerifyEvidenceView initialCaseId={selectedCaseId} onNavigate={navigateTo} />
          )}

          {activeView === "lab" && <ForensicLabView />}

          {activeView === "ledger" && <BlockchainLedgerView />}

          {activeView === "privacy" && <PrivacySecurityView />}

          {activeView === "health" && <SystemHealthView />}

          {activeView === "settings" && (
            <SettingsView onResetComplete={() => navigateTo("dashboard")} />
          )}
        </main>
      </div>
    </div>
  );
}
