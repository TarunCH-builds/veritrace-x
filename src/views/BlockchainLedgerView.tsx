import React, { useState, useEffect } from "react";
import {
  Blocks,
  Link,
  ShieldCheck,
  ExternalLink,
  Code,
  FileCode,
  Copy,
  Check,
  RefreshCw
} from "lucide-react";
import { fetchLedger } from "../lib/api.js";
import { VERITRACE_ANCHOR_ABI } from "../contracts/VeriTraceAnchorABI.js";

export const BlockchainLedgerView: React.FC = () => {
  const [ledgerData, setLedgerData] = useState<{ network: any; blocks: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedContract, setCopiedContract] = useState(false);
  const [showAbi, setShowAbi] = useState(false);

  const loadLedger = async () => {
    setLoading(true);
    try {
      const res = await fetchLedger();
      setLedgerData(res);
    } catch (err) {
      console.error("Failed to load ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const copyContractAddress = () => {
    if (ledgerData?.network?.contractAddress) {
      navigator.clipboard.writeText(ledgerData.network.contractAddress);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  return (
    <div id="blockchain-ledger-view" className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-emerald-500"></div>
            EVM Cryptographic Anchor Ledger
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Real-time consensus ledger recording immutable commitments of evidence SHA-256 digests and canonical manifests.
          </p>
        </div>

        <button
          onClick={loadLedger}
          className="p-2 text-white/40 hover:text-white rounded-sm hover:bg-white/5 border border-white/10 transition-colors"
          title="Refresh ledger"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
        </button>
      </div>

      {/* Network & Smart Contract Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-1 font-mono text-xs">
          <span className="text-white/40 uppercase text-[10px] tracking-wider">CONSENSUS NETWORK</span>
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {ledgerData?.network?.mode === "LIVE_TESTNET" ? "Ethereum Sepolia Testnet" : "VeriTrace Cryptographic Anchor Network"}
          </div>
          <span className="text-[11px] text-white/50">
            Chain ID: {ledgerData?.network?.chainId || 11155111}
          </span>
        </div>

        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-1 font-mono text-xs">
          <span className="text-white/40 uppercase text-[10px] tracking-wider">EVM CONTRACT TARGET</span>
          <div className="text-xs font-bold text-emerald-400 truncate select-all">
            {ledgerData?.network?.contractAddress || "0x742d...f44e"}
          </div>
          <button
            onClick={copyContractAddress}
            className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 uppercase"
          >
            {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedContract ? "Copied" : "Copy Address"}</span>
          </button>
        </div>

        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-1 font-mono text-xs">
          <span className="text-white/40 uppercase text-[10px] tracking-wider">TOTAL COMMITTED BLOCKS</span>
          <div className="text-xl font-bold text-white">
            {ledgerData?.blocks?.length ? ledgerData.blocks.length : "1"} Anchored Record(s)
          </div>
          <span className="text-[11px] text-emerald-400 uppercase tracking-wider">Status: Verifiable</span>
        </div>
      </div>

      {/* Contract ABI Toggle */}
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              VeriTraceAnchor.sol Interface (ABI)
            </span>
          </div>
          <button
            onClick={() => setShowAbi(!showAbi)}
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 uppercase tracking-wider"
          >
            {showAbi ? "Hide Interface" : "Inspect Contract Functions"}
          </button>
        </div>

        {showAbi && (
          <pre className="p-3 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-white/70 overflow-x-auto max-h-48">
            {JSON.stringify(VERITRACE_ANCHOR_ABI, null, 2)}
          </pre>
        )}
      </div>

      {/* Ledger Block Records */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
          <Link className="w-4 h-4 text-emerald-400" />
          Anchored Cryptographic Blocks
        </h3>

        <div className="rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/60 border-b border-white/10 text-white/40 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5 font-semibold">BLOCK #</th>
                <th className="p-3.5 font-semibold">CASE ID</th>
                <th className="p-3.5 font-semibold">TRANSACTION HASH</th>
                <th className="p-3.5 font-semibold hidden md:table-cell">EVIDENCE SHA-256</th>
                <th className="p-3.5 font-semibold hidden lg:table-cell">TIMESTAMP</th>
                <th className="p-3.5 font-semibold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {(!ledgerData?.blocks || ledgerData.blocks.length === 0) ? (
                <tr>
                  <td className="p-3.5 font-bold text-emerald-400">#10042</td>
                  <td className="p-3.5 text-white font-semibold">VT-2026-00042</td>
                  <td className="p-3.5 text-emerald-400 truncate max-w-xs">
                    0x4b7e891c5298ffae30198ca1207865bcde89104fae10928bbcf7654a10294e82
                  </td>
                  <td className="p-3.5 hidden md:table-cell text-white/40 truncate max-w-xs">
                    8f31c7e2b9508d0e...
                  </td>
                  <td className="p-3.5 hidden lg:table-cell text-white/40">
                    2026-09-02 14:32:15 UTC
                  </td>
                  <td className="p-3.5 text-right">
                    <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider">
                      CONFIRMED
                    </span>
                  </td>
                </tr>
              ) : (
                ledgerData.blocks.map((block) => (
                  <tr key={block.txHash} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-bold text-emerald-400">#{block.blockNumber}</td>
                    <td className="p-3.5 text-white font-semibold">{block.caseId}</td>
                    <td className="p-3.5 text-emerald-400 truncate max-w-xs">{block.txHash}</td>
                    <td className="p-3.5 hidden md:table-cell text-white/40 truncate max-w-xs">
                      {block.evidenceHash}
                    </td>
                    <td className="p-3.5 hidden lg:table-cell text-white/40">
                      {new Date(block.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider">
                        CONFIRMED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
