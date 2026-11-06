import React, { useState } from 'react';
import {
  ARCHITECTURE_COMPONENTS,
  CYBERSECURITY_PROTOCOLS,
  DATABASE_SCHEMA_SQL,
} from '../data/ctoSpecifications';
import { SPLIT_ENGINE_SOURCE_CODE, calculateSplit } from '../services/splitRevenueEngine';
import {
  Cpu,
  ShieldAlert,
  Database,
  Code2,
  Copy,
  Check,
  Zap,
  Server,
  Lock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Play,
  RotateCcw,
} from 'lucide-react';

export const CtoArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'code' | 'security' | 'database'>('architecture');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Split Engine Sandbox state
  const [sandboxAmount, setSandboxAmount] = useState<number>(50000);
  const [sandboxRate, setSandboxRate] = useState<number>(0.85);
  const [sandboxTxType, setSandboxTxType] = useState<'CHALLENGE_ESCROW' | 'LIVE_GIFT' | 'VIP_SUBSCRIPTION'>('CHALLENGE_ESCROW');
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [lastSplitResult, setLastSplitResult] = useState<any>(null);

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleRunSandboxSplit = () => {
    const result = calculateSplit(sandboxAmount, sandboxRate, 'XOF');
    setLastSplitResult(result);

    const now = new Date().toLocaleTimeString('fr-FR');
    const logs = [
      `[${now}] 1. REDIS LOCK ACQUIRED: lock:split:tx_${Date.now()} (TTL: 10s)`,
      `[${now}] 2. POSTGRES BEGIN TRANSACTION (ISOLATION: SERIALIZABLE)`,
      `[${now}] 3. SELECT * FROM utilisateurs WHERE id = 'usr_creator' FOR UPDATE`,
      `[${now}] 4. CALCUL SPLIT DÉTERMINISTE: Brut: ${result.grossAmount.toLocaleString('fr-FR')} XOF | Part Créateur (${(result.creatorShareRate * 100).toFixed(0)}%): +${result.creatorNet.toLocaleString('fr-FR')} XOF | Commission Plateforme (${(result.platformShareRate * 100).toFixed(0)}%): ${result.platformNet.toLocaleString('fr-FR')} XOF`,
      `[${now}] 5. UPDATE utilisateurs SET solde = solde + ${result.creatorNet} WHERE id = 'usr_creator'`,
      `[${now}] 6. INSERT INTO revenus_split (id, gross, creator_net, platform_fee, audit_hash) VALUES ('${result.auditHash}', ...)`,
      `[${now}] 7. POSTGRES COMMIT TRANSACTION SUCCESSFUL`,
      `[${now}] 8. NYOLE WEBHOOK NOTIFICATION DISPATCHED -> RETRAIT DISPONIBLE EN TEMPS RÉEL`,
    ];
    setSandboxLogs(logs);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-neutral-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-neutral-100">Console d’Architecture CTO & Cybersécurité</h2>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Spécifications de référence pour <span className="text-neutral-200 font-semibold">AuraVibe VIP</span> : architecture de streaming vidéo anti-rip HLS AES-128, moteur transactionnel ACID de Split Revenue (Nyole Mobile Money & Cartes Bancaires), et schéma relationnel PostgreSQL.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono shrink-0">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Moteur Split (Code)</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Cybersécurité</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Schéma SQL</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Architecture Technique Globale */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          {/* Visual Architecture Topology Diagram */}
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <h3 className="font-semibold text-sm text-neutral-100 mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              <span>Topologie Système Globale (Flux Ingestion, Sécurité & Split Financier)</span>
            </h3>

            {/* Architecture Flowchart Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
              {/* Block 1 */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-semibold block uppercase">Couche 1 : Client</span>
                  <h4 className="font-bold text-neutral-200 mt-1">PWA & Lecteur HLS</h4>
                  <p className="text-[11px] text-neutral-400 font-sans mt-1">
                    React 19 + HLS.js DRM, Dynamic Canvas Watermarking, Anti-Screen Recording API.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-neutral-800/80 text-[10px] text-emerald-400">
                  WebRTC / CMAF Low Latency
                </div>
              </div>

              {/* Block 2 */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-semibold block uppercase">Couche 2 : Edge & WAF</span>
                  <h4 className="font-bold text-neutral-200 mt-1">Cloudflare WAF / CDN</h4>
                  <p className="text-[11px] text-neutral-400 font-sans mt-1">
                    Défense Anti-DDoS Anycast, Rate Limiting strict, validation Signed URLs éphémères (60s).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-neutral-800/80 text-[10px] text-emerald-400">
                  OWASP CRS 3.3 Active
                </div>
              </div>

              {/* Block 3 */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-semibold block uppercase">Couche 3 : Ingestion & DRM</span>
                  <h4 className="font-bold text-neutral-200 mt-1">Transcodage Chiffré</h4>
                  <p className="text-[11px] text-neutral-400 font-sans mt-1">
                    MediaConvert / FFmpeg scission HLS en chunks chiffrés AES-128, clés KMS tournantes.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-neutral-800/80 text-[10px] text-emerald-400">
                  FairPlay & Widevine Support
                </div>
              </div>

              {/* Block 4 */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-semibold block uppercase">Couche 4 : Finance</span>
                  <h4 className="font-bold text-neutral-200 mt-1">Split Engine & Nyole</h4>
                  <p className="text-[11px] text-neutral-400 font-sans mt-1">
                    Transactions ACID, Escrow séquestre, API Nyole Mobile Money (Wave, MTN, Orange, Moov).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-neutral-800/80 text-[10px] text-emerald-400">
                  Split Instantané 85/15
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Component Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ARCHITECTURE_COMPONENTS.map((comp) => (
              <div
                key={comp.layer}
                className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[11px] font-mono text-amber-400 font-semibold block">
                    {comp.layer}
                  </span>
                  <h4 className="font-bold text-base text-neutral-100 mt-0.5">{comp.title}</h4>
                  <p className="text-xs text-neutral-300 leading-relaxed mt-2">{comp.description}</p>

                  <div className="mt-3 space-y-1.5">
                    {comp.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-neutral-400">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap gap-1.5">
                  {comp.tech.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-950 border border-neutral-800 text-neutral-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Code du Moteur de Split Revenue (Livrable 2) */}
      {activeTab === 'code' && (
        <div className="space-y-6">
          {/* Interactive Split Sandbox */}
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Bac à Sable Interactif du Moteur de Split Revenue</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Simulez une transaction réelle pour observer le verrouillage ACID, le calcul de commission et le dispatching des fonds.
                </p>
              </div>

              <button
                onClick={handleRunSandboxSplit}
                className="py-2 px-4 rounded-xl text-xs font-semibold bg-amber-400 text-neutral-950 hover:bg-amber-300 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-[0.98] shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Exécuter la Transaction ACID</span>
              </button>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Type d'Événement</label>
                <select
                  value={sandboxTxType}
                  onChange={(e) => setSandboxTxType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
                >
                  <option value="CHALLENGE_ESCROW">Validation Challenge Escrow (Défi)</option>
                  <option value="LIVE_GIFT">Cadeau VIP en Direct (Live Gift)</option>
                  <option value="VIP_SUBSCRIPTION">Abonnement Mensuel VIP</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Montant Brut (XOF)</label>
                <input
                  type="number"
                  step="5000"
                  value={sandboxAmount}
                  onChange={(e) => setSandboxAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Taux de Split Créateur</label>
                <select
                  value={sandboxRate}
                  onChange={(e) => setSandboxRate(parseFloat(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
                >
                  <option value={0.80}>80% Créateur / 20% Plateforme</option>
                  <option value={0.85}>85% Créateur / 15% Plateforme (Standard VIP)</option>
                  <option value={0.90}>90% Créateur / 10% Plateforme (Elite)</option>
                </select>
              </div>
            </div>

            {/* Sandbox Execution Terminal Logs */}
            {sandboxLogs.length > 0 && (
              <div className="mt-3 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 font-mono text-[11px] space-y-1">
                <span className="text-neutral-500 block pb-1 border-b border-neutral-900">
                  CONSOLE TRANSACTIONNELLE (JOURNAL ACID POSTGRESQL & REDIS) :
                </span>
                {sandboxLogs.map((log, i) => (
                  <div key={i} className="text-neutral-300 leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Code Snippet with Copy Button */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-xs text-neutral-200 font-mono">
                  src/services/SplitRevenueEngine.ts (Code TypeScript Complet & Documenté)
                </span>
              </div>
              <button
                onClick={() => handleCopy(SPLIT_ENGINE_SOURCE_CODE, 'split_code')}
                className="py-1 px-2.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors"
              >
                {copiedSection === 'split_code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le Code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono bg-neutral-950 text-neutral-300 overflow-x-auto leading-relaxed max-h-[500px]">
              {SPLIT_ENGINE_SOURCE_CODE}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Cybersécurité & Anti-Piratage (Livrable 3) */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {CYBERSECURITY_PROTOCOLS.map((proto) => (
            <div
              key={proto.id}
              className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                    {proto.category}
                  </span>
                  <h4 className="font-bold text-base text-neutral-100">{proto.title}</h4>
                </div>
                <span className="text-xs text-neutral-400 max-w-md text-right sm:block hidden">
                  {proto.summary}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {proto.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Schéma Base de Données Relationnelle (Livrable 4) */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-xs text-neutral-200 font-mono">
                  schema.sql (PostgreSQL 16+ : Utilisateurs, Transactions, Challenges, Revenus_Split)
                </span>
              </div>
              <button
                onClick={() => handleCopy(DATABASE_SCHEMA_SQL, 'schema_sql')}
                className="py-1 px-2.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors"
              >
                {copiedSection === 'schema_sql' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le Schéma SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono bg-neutral-950 text-neutral-300 overflow-x-auto leading-relaxed max-h-[550px]">
              {DATABASE_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
