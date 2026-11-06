import React, { useState } from 'react';
import { User, KycSubmissionRequest, TransactionRecord, AdminConfig } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  Video,
  Wallet,
  Zap,
  Lock,
  Search,
  Filter,
  AlertTriangle,
  Server,
  Activity,
  ArrowUpRight,
  FileText,
  Camera,
  Check,
  Smartphone,
  Download,
} from 'lucide-react';

interface AdminConsoleViewProps {
  adminUser: User;
  kycRequests: KycSubmissionRequest[];
  onApproveCreator: (requestId: string) => void;
  onRejectCreator: (requestId: string, reason: string) => void;
  transactions: TransactionRecord[];
  allUsersCount: number;
  adminConfig?: AdminConfig;
  onUpdateAdminConfig?: (newConfig: AdminConfig) => void;
  onResetAdminConfig?: () => void;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  adminUser,
  kycRequests,
  onApproveCreator,
  onRejectCreator,
  transactions,
  allUsersCount,
  adminConfig,
  onUpdateAdminConfig,
  onResetAdminConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'kyc' | 'transactions' | 'settings'>('kyc');
  const [selectedKycFilter, setSelectedKycFilter] = useState<'en_attente_admin' | 'approuve' | 'rejete'>('en_attente_admin');
  const [rejectModalTarget, setRejectModalTarget] = useState<KycSubmissionRequest | null>(null);

  // Custom Admin Credentials Local Form State
  const [editAdminEmail, setEditAdminEmail] = useState(adminConfig?.email || '');
  const [editAdminPassword, setEditAdminPassword] = useState(adminConfig?.password || '');
  const [editAdminSecretCode, setEditAdminSecretCode] = useState(adminConfig?.secretAccessCode || '');
  const [codeSavedSuccess, setCodeSavedSuccess] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Document d’identité flou ou illisible');
  const [searchQuery, setSearchQuery] = useState('');

  // Platform commission setting
  const [platformCommissionRate, setPlatformCommissionRate] = useState(15); // 15%

  const pendingRequests = kycRequests.filter((r) => r.status === 'en_attente_admin');
  const approvedRequests = kycRequests.filter((r) => r.status === 'approuve');
  const rejectedRequests = kycRequests.filter((r) => r.status === 'rejete');

  const filteredKycList = kycRequests.filter((r) => {
    if (r.status !== selectedKycFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.creatorName.toLowerCase().includes(q) ||
        r.creatorUsername.toLowerCase().includes(q) ||
        r.documentNumber.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalGrossRevenue = transactions
    .filter((tx) => tx.status === 'complete')
    .reduce((sum, tx) => sum + tx.grossAmountXof, 0);

  const totalPlatformFees = transactions
    .filter((tx) => tx.status === 'complete')
    .reduce((sum, tx) => sum + tx.platformFeeAmountXof, 0);

  const viewerPassCount = transactions.filter((tx) => tx.type === 'Pass_Visionneur_1_99').length;

  const handleExportGlobalLedgerCsv = () => {
    const headers = ['Reference', 'Date', 'Type', 'Payeur', 'Passerelle', 'Montant_Brut_XOF', 'Net_Createur_XOF', 'Commission_AuraVibe_XOF', 'Devise', 'Statut', 'Notes'];
    const rows = transactions.map((tx) => [
      `"${tx.reference}"`,
      `"${tx.createdAt}"`,
      `"${tx.type}"`,
      `"${tx.payerName.replace(/"/g, '""')}"`,
      `"${tx.paymentGateway}"`,
      tx.grossAmountXof,
      tx.creatorNetAmountXof,
      tx.platformFeeAmountXof,
      `"${tx.currency || 'XOF'}"`,
      `"${tx.status}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `grand_livre_auravibe_global_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmReject = () => {
    if (!rejectModalTarget) return;
    onRejectCreator(rejectModalTarget.id, rejectionReason);
    setRejectModalTarget(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Admin Top Master Bar */}
      <div className="p-6 bg-gradient-to-r from-neutral-900 via-neutral-900 to-purple-950/30 border border-neutral-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-100">Console d'Administration Générale</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                MASTER ADMIN
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Supervision globale d'AuraVibe VIP : validation KYC créateurs, contrôle des flux financiers et sécurité.
            </p>
          </div>
        </div>

        {/* Global Operational Status */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neutral-300">WAF & Ingestion : NOMINAL</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Nyole API : CONNECTÉE</span>
          </div>
        </div>
      </div>

      {/* 4 Master Admin KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users & Viewers */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Visionneurs Actifs</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
              {allUsersCount + 420}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Dont {viewerPassCount + 180} pass à 1,99 $ payés
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-800 text-[11px] text-emerald-400 font-mono">
            +18 nouveaux aujourd'hui
          </div>
        </div>

        {/* Pending KYC Creators Queue */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Créateurs en Attente KYC</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-purple-400 tabular-nums">
              {pendingRequests.length}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Dossiers d'identité 18+ à valider par l'admin
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-800 text-[11px] text-amber-400 font-mono">
            Publication bloquée sans validation
          </div>
        </div>

        {/* Total Platform Revenue */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Commissions AuraVibe (15%)</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {totalPlatformFees.toLocaleString('fr-FR')} XOF
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              ≈ {(totalPlatformFees / 655.957).toFixed(2)} EUR de revenus nets
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 font-mono">
            Sur {totalGrossRevenue.toLocaleString('fr-FR')} XOF brut
          </div>
        </div>

        {/* Active Escrow Volume */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Fonds Séquestrés (Escrow)</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {adminUser.escrowPendingXof.toLocaleString('fr-FR')} XOF
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Garantie des challenges en cours
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-800 text-[11px] text-cyan-400 font-mono">
            Libération automatique sous contrôle
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('kyc')}
            className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              activeTab === 'kyc'
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 font-bold'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Validation des Créateurs (KYC 18+)</span>
            {pendingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-purple-500 text-neutral-950 font-bold text-[10px] flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              activeTab === 'transactions'
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 font-bold'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Flux & Transactions ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 font-bold'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Configuration & Passerelles</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KYC VALIDATION QUEUE */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          {/* Sub-filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                onClick={() => setSelectedKycFilter('en_attente_admin')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  selectedKycFilter === 'en_attente_admin'
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                En Attente d'Action ({pendingRequests.length})
              </button>
              <button
                onClick={() => setSelectedKycFilter('approuve')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  selectedKycFilter === 'approuve'
                    ? 'bg-emerald-400 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Créateurs Approuvés ({approvedRequests.length})
              </button>
              <button
                onClick={() => setSelectedKycFilter('rejete')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  selectedKycFilter === 'rejete'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Dossiers Rejetés ({rejectedRequests.length})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher créateur, pièce..."
                className="py-1.5 pl-8 pr-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-purple-400 w-48 sm:w-60"
              />
            </div>
          </div>

          {/* KYC Requests List */}
          {filteredKycList.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-neutral-200">Aucun dossier dans cette catégorie</p>
              <p className="text-xs text-neutral-400">Tous les créateurs soumis ont été traités par l'administrateur.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredKycList.map((req) => (
                <div
                  key={req.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-all"
                >
                  <div>
                    {/* Top Creator Info */}
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={req.creatorAvatar}
                          alt={req.creatorName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-purple-400"
                        />
                        <div>
                          <h4 className="font-semibold text-sm text-neutral-100">{req.creatorName}</h4>
                          <span className="text-[11px] font-mono text-purple-300">@{req.creatorUsername}</span>
                        </div>
                      </div>

                      {req.status === 'en_attente_admin' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          EN ATTENTE ADMIN
                        </span>
                      )}
                      {req.status === 'approuve' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          CERTIFIÉ 18+ ACTIF
                        </span>
                      )}
                      {req.status === 'rejete' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          REJETÉ
                        </span>
                      )}
                    </div>

                    {/* KYC Document & Liveness Details */}
                    <div className="mt-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 font-mono text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Document :</span>
                        <span className="text-neutral-200 font-semibold">{req.documentType} ({req.documentNumber})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Pays émetteur :</span>
                        <span className="text-neutral-200">{req.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Âge certifié :</span>
                        <span className={`font-bold ${req.calculatedAge >= 18 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {req.calculatedAge} ans (Né(e) le {req.birthDate})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Liveness Biométrie :</span>
                        <span className="text-emerald-400">{req.biometricScore}% Anti-Deepfake OK</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-900">
                        <span>Soumis le :</span>
                        <span>{req.submittedAt}</span>
                      </div>
                    </div>

                    {/* Document Thumbnails Preview */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-neutral-400">
                      <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="truncate">Scan {req.documentType} validé</span>
                      </div>
                      <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">Selfie 3D Conforme</span>
                      </div>
                    </div>

                    {req.rejectionReason && (
                      <p className="mt-2 text-xs text-rose-400 font-mono">
                        Motif de rejet : {req.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Admin Decision Actions */}
                  {req.status === 'en_attente_admin' && (
                    <div className="pt-3 border-t border-neutral-800 flex gap-2">
                      <button
                        onClick={() => setRejectModalTarget(req)}
                        className="py-2.5 px-3 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejeter</span>
                      </button>

                      <button
                        onClick={() => onApproveCreator(req.id)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approuver & Activer le Créateur</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSACTIONS & CASH FLOW */}
      {activeTab === 'transactions' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-neutral-200 block sm:inline">
                Grand Livre Comptable Global (Nyole Mobile Money & Cartes CB)
              </span>
              <span className="font-mono text-neutral-400 sm:ml-3 text-[11px]">
                Total Encaissé : {totalGrossRevenue.toLocaleString('fr-FR')} XOF
              </span>
            </div>
            <button
              onClick={handleExportGlobalLedgerCsv}
              className="py-1.5 px-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
              title="Télécharger l'intégralité du Grand Livre en format CSV"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Exporter le Grand Livre (CSV)</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Réf & Horodatage</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Payeur / Canal</th>
                  <th className="py-3 px-4 text-right">Montant Brut</th>
                  <th className="py-3 px-4 text-right text-emerald-400">Net Créateur (85%)</th>
                  <th className="py-3 px-4 text-right text-amber-400">Part AuraVibe (15%)</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-800/30">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-neutral-200 block">{tx.reference}</span>
                      <span className="text-[10px] text-neutral-500">{tx.createdAt}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-300">
                      {tx.type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-neutral-200 block font-sans text-xs">{tx.payerName}</span>
                      <span className="text-[10px] text-amber-400">{tx.paymentGateway.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-neutral-200">
                      {tx.grossAmountXof.toLocaleString('fr-FR')} XOF
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-emerald-400 font-semibold">
                      {tx.creatorNetAmountXof > 0 ? `+${tx.creatorNetAmountXof.toLocaleString('fr-FR')} XOF` : '0 XOF'}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-amber-400 font-semibold">
                      +{tx.platformFeeAmountXof.toLocaleString('fr-FR')} XOF
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM & GATEWAY SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Commission Control */}
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
            <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Taux de Commission Plateforme par Défaut</span>
            </h4>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              Ce taux s'applique automatiquement sur tous les abonnements, pourboires, cadeaux et déblocages de challenges validés.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setPlatformCommissionRate(15)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono ${
                  platformCommissionRate === 15
                    ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-bold'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                }`}
              >
                15% AuraVibe / 85% Créateur (Standard)
              </button>
              <button
                onClick={() => setPlatformCommissionRate(20)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono ${
                  platformCommissionRate === 20
                    ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-bold'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                }`}
              >
                20% AuraVibe / 80% Créateur (Marge Haute)
              </button>
            </div>
          </div>

          {/* Gateways Health */}
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
            <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Passerelles Financières & Statut Réseau</span>
            </h4>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex justify-between items-center">
                <span className="text-neutral-300">API Nyole Mobile Money (Wave, MTN, Orange)</span>
                <span className="text-emerald-400 font-bold">EN LIGNE (Latence: 120ms)</span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex justify-between items-center">
                <span className="text-neutral-300">Passerelle Cartes Bancaires (Nyole Pay)</span>
                <span className="text-emerald-400 font-bold">OPÉRATIONNEL</span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex justify-between items-center">
                <span className="text-neutral-300">Cloudflare Stream HLS AES-128 & WAF</span>
                <span className="text-emerald-400 font-bold">PROTECTION 100% ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Custom Admin Credentials & Secret Access Code Editor */}
          {adminConfig && onUpdateAdminConfig && (
            <div className="md:col-span-2 p-5 bg-neutral-900 border border-purple-500/30 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                <div>
                  <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Mes Identifiants & Mon Code d'Accès Secret Personnel</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Modifiez à tout moment votre adresse email de connexion, votre mot de passe et votre code d'accès secret d'administration.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded shrink-0">
                  Contrôle Exclusif
                </span>
              </div>

              {codeSavedSuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono">
                  ✓ Nouveaux identifiants et code secret enregistrés avec succès !
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1 font-medium">Email Administrateur</label>
                  <input
                    type="email"
                    value={editAdminEmail}
                    onChange={(e) => setEditAdminEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-medium">Mot de Passe Admin</label>
                  <input
                    type="text"
                    value={editAdminPassword}
                    onChange={(e) => setEditAdminPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-purple-300 block mb-1 font-semibold">Mon Code d'Accès Secret Choisi</label>
                  <input
                    type="text"
                    value={editAdminSecretCode}
                    onChange={(e) => setEditAdminSecretCode(e.target.value)}
                    placeholder="Ex: 884920"
                    className="w-full bg-neutral-950 border border-purple-500/40 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold text-center focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                {onResetAdminConfig && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Réinitialiser complètement la configuration administrateur ? Vous pourrez choisir de nouveaux identifiants et un nouveau code d'accès.")) {
                        onResetAdminConfig();
                      }
                    }}
                    className="text-xs text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    Réinitialiser les identifiants pour choisir un autre compte
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!editAdminEmail.trim() || !editAdminPassword.trim() || !editAdminSecretCode.trim()) {
                      alert('Veuillez renseigner tous les champs.');
                      return;
                    }
                    onUpdateAdminConfig({
                      email: editAdminEmail.trim(),
                      password: editAdminPassword.trim(),
                      secretAccessCode: editAdminSecretCode.trim(),
                      isConfigured: true,
                      configuredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    });
                    setCodeSavedSuccess(true);
                    setTimeout(() => setCodeSavedSuccess(false), 2500);
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-neutral-950 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-300 hover:to-purple-400 transition-all flex items-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-[0.98]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer mes modifications</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl text-neutral-100">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-semibold text-sm text-neutral-100">Rejeter le Dossier de Créateur</h3>
              <button
                onClick={() => setRejectModalTarget(null)}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mt-2">
              Indiquez le motif de refus pour <strong className="text-neutral-200">@{rejectModalTarget.creatorUsername}</strong>. Le créateur recevra une notification pour renouveler sa pièce d'identité.
            </p>

            <div className="my-3 text-xs space-y-2">
              <label className="text-neutral-400 block font-medium">Motif du Rejet :</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200"
              >
                <option value="Document d’identité flou ou illisible">Document d’identité flou ou illisible</option>
                <option value="Discordance entre le nom du document et le selfie">Discordance entre le nom du document et le selfie</option>
                <option value="Date de naissance suspecte ou non conforme 18+">Date de naissance suspecte ou non conforme 18+</option>
                <option value="Tentative de soumission d'une photo d'écran (Deepfake)">Tentative de soumission d'une photo d'écran (Deepfake)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectModalTarget(null)}
                className="py-2.5 px-4 rounded-xl border border-neutral-800 text-neutral-400 text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs transition-colors"
              >
                Confirmer le Rejet du Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
