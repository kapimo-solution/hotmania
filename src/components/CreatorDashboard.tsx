import React, { useState } from 'react';
import { User, TransactionRecord, VideoItem } from '../types';
import {
  Wallet,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building,
  Coins,
  X,
  Zap,
  UploadCloud,
  Download,
} from 'lucide-react';
import { executeNyoleInstantPayout } from '../services/splitRevenueEngine';
import { formatXofForUserCountry, getCurrencyForCountry } from '../services/currencyService';
import { PublishVideoModal } from './PublishVideoModal';

interface CreatorDashboardProps {
  creator: User;
  transactions: TransactionRecord[];
  onPayoutSuccess: (payoutTx: TransactionRecord) => void;
  onOpenKycModal: () => void;
  onPublishVideo?: (video: VideoItem) => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  creator,
  transactions,
  onPayoutSuccess,
  onOpenKycModal,
  onPublishVideo,
}) => {
  const creatorCurrency = creator.currency || getCurrencyForCountry(creator.country).code;
  const currencyMeta = getCurrencyForCountry(creator.country || creatorCurrency);

  const [filterPeriod, setFilterPeriod] = useState<'jour' | 'semaine' | 'mois'>('semaine');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'NYOLE' | 'STRIPE' | 'USDT'>('NYOLE');
  const [momoOperator, setMomoOperator] = useState<string>('MPESA_RDC');
  const [payoutAmount, setPayoutAmount] = useState('100000');
  const [phoneNumber, setPhoneNumber] = useState(creator.phoneNumber || '+225 07 48 92 11 04');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [is2faSent, setIs2faSent] = useState(false);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSuccessMessage, setPayoutSuccessMessage] = useState<string | null>(null);

  // Split Rate Configuration
  const [splitRate, setSplitRate] = useState<number>(creator.creatorSplitRate || 0.85);

  const handleExportLedgerCsv = () => {
    const headers = ['Reference', 'Date', 'Type', 'Payeur', 'Passerelle', 'Montant_Brut_XOF', 'Net_Createur_XOF', 'Commission_Plateforme_XOF', 'Devise', 'Statut', 'Notes'];
    const rows = filteredTransactions.map((tx) => [
      `"${tx.reference}"`,
      `"${tx.createdAt}"`,
      `"${tx.type}"`,
      `"${tx.payerName.replace(/"/g, '""')}"`,
      `"${tx.paymentGateway}"`,
      tx.grossAmountXof,
      tx.creatorNetAmountXof,
      tx.platformFeeAmountXof,
      `"${tx.currency || creatorCurrency}"`,
      `"${tx.status}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `releve_createur_${creator.username}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tx.reference.toLowerCase().includes(q) ||
        tx.notes.toLowerCase().includes(q) ||
        tx.payerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCommissions = transactions
    .filter((tx) => tx.status === 'complete')
    .reduce((sum, tx) => sum + tx.platformFeeAmountXof, 0);

  const totalGrossRevenue = transactions
    .filter((tx) => tx.status === 'complete')
    .reduce((sum, tx) => sum + tx.grossAmountXof, 0);

  const handleRequest2faCode = () => {
    setIs2faSent(true);
    // Simule l'envoi d'un code SMS sécurisé vers le numéro
    setTwoFactorCode('482910');
  };

  const handleExecutePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(payoutAmount, 10);
    if (amount > creator.balanceXof) {
      alert('Le montant demandé dépasse votre solde retirable.');
      return;
    }
    if (!twoFactorCode) {
      alert('Veuillez renseigner le code 2FA reçu par SMS.');
      return;
    }

    setIsProcessingPayout(true);
    try {
      const result = await executeNyoleInstantPayout({
        creatorId: creator.id,
        amountXof: amount,
        method: payoutMethod === 'NYOLE' ? 'NYOLE_MOBILE_MONEY' : 'STRIPE',
        recipientPhoneOrAddress: phoneNumber,
        provider: momoOperator,
        otpCode: twoFactorCode,
        ipAddress: '197.234.12.8',
      });

      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}`,
        reference: result.reference,
        type: 'Retrait_Nyole',
        grossAmountXof: amount,
        creatorNetAmountXof: amount,
        platformFeeAmountXof: 0,
        currency: creatorCurrency,
        status: 'complete',
        creatorId: creator.id,
        payerName: 'AuraVibe Payout Engine (Nyole API)',
        paymentGateway: 'Nyole_MobileMoney',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: `Retrait instantané ${momoOperator} (${phoneNumber}) - 2FA Validé`,
        idempotencyKey: `idem_${result.reference}`,
      };

      onPayoutSuccess(newTx);
      setIsProcessingPayout(false);
      setPayoutSuccessMessage(result.message);
      setTimeout(() => {
        setPayoutSuccessMessage(null);
        setIsPayoutModalOpen(false);
      }, 2500);
    } catch {
      setIsProcessingPayout(false);
      alert('Erreur lors du traitement du retrait. Veuillez réessayer.');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner / KYC Certification Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <img
            src={creator.avatar}
            alt={creator.displayName}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-neutral-100">{creator.displayName}</h2>
              <span className="text-amber-400 font-mono text-xs">@{creator.username}</span>
              {creator.creatorApprovalStatus === 'en_attente_admin' ? (
                <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" /> EN ATTENTE VALIDATION ADMIN
                </span>
              ) : creator.kycStatus === 'valide' ? (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> KYC 18+ CERTIFIÉ ADMIN
                </span>
              ) : (
                <button
                  onClick={onOpenKycModal}
                  className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/20"
                >
                  Certification KYC requise
                </button>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Portefeuille Principal · Rail Nyole Mobile Money & Passerelles Internationales
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {creator.creatorApprovalStatus === 'en_attente_admin' ? (
            <div className="py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 text-xs font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Publication & Retrait Verrouillés (Attente Validation Admin)</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
              >
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span>Publier une Vidéo VIP</span>
              </button>

              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Retrait Instantané Nyole</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Warning banner when pending admin approval */}
      {creator.creatorApprovalStatus === 'en_attente_admin' && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
              <span>Authentificateur d'Identité en cours de vérification par l'Administrateur</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold">
                VALIDATION 18+ REQUISE
              </span>
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Votre inscription créateur gratuite est bien enregistrée ! Pour la sécurité des spectateurs et la conformité légale, <strong className="text-amber-400">vous ne pourrez publier de vidéos ou lancer des streams qu'après validation formelle de votre pièce d'identité par l'Administrateur</strong>. Vous pouvez basculer sur le compte Administrateur dans le menu supérieur pour examiner et approuver le dossier immédiatement.
            </p>
          </div>
        </div>
      )}

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Solde Retirable Immédiat</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {formatXofForUserCountry(creator.balanceXof, creatorCurrency)}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              ≈ {(creator.balanceXof / 625).toFixed(2)} USD · Monnaie : {currencyMeta.name}
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-emerald-400/90 font-mono">
            Retrait Nyole sans délai ({creatorCurrency})
          </div>
        </div>

        {/* Pending Escrow */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Fonds sous Séquestre (Escrow)</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {formatXofForUserCountry(creator.escrowPendingXof, creatorCurrency)}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Garantis par tiers de confiance ({creatorCurrency})
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 font-mono">
            Libération sur validation vidéo
          </div>
        </div>

        {/* Total Gross Volume */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Volume Brut Encaissé</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
              {formatXofForUserCountry(totalGrossRevenue, creatorCurrency)}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Abonnements, lives & challenges
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-amber-400 font-mono">
            Taux net actuel : {(splitRate * 100).toFixed(0)}%
          </div>
        </div>

        {/* Platform Fees */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Commissions AuraVibe</span>
            <Lock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-neutral-300 tabular-nums">
              {formatXofForUserCountry(totalCommissions, creatorCurrency)}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Commission plateforme fixe (15%)
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 font-mono">
            Hébergement CDN & Sécurité WAF
          </div>
        </div>
      </div>

      {/* Split Engine Configuration Widget */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="font-semibold text-xs text-neutral-100 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Moteur de Répartition des Gains (Split Revenue Engine)</span>
          </h4>
          <p className="text-[11px] text-neutral-400">
            AuraVibe reverse par défaut 85% net au créateur. Ajustable selon le rang VIP ou volume mensuel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium">Formule :</span>
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
            <button
              onClick={() => setSplitRate(0.80)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                splitRate === 0.80 ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400'
              }`}
            >
              80% Créateur / 20%
            </button>
            <button
              onClick={() => setSplitRate(0.85)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                splitRate === 0.85 ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400'
              }`}
            >
              85% Créateur / 15% (VIP)
            </button>
            <button
              onClick={() => setSplitRate(0.90)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                splitRate === 0.90 ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400'
              }`}
            >
              90% Créateur / 10% (Elite)
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History & Filter Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-neutral-100">Journal Comptable des Transactions</h3>
            <span className="text-xs font-mono text-neutral-500">
              ({filteredTransactions.length} enregistrements)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Réf ou payeur..."
                className="py-1.5 pl-8 pr-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 w-36 sm:w-44"
              />
            </div>

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-1.5 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Tous les types</option>
              <option value="Cadeau_Live">Cadeaux Live</option>
              <option value="Challenge_Escrow">Challenges (Séquestre)</option>
              <option value="Abonnement">Abonnements VIP</option>
              <option value="Deblocage_Video">Déblocages Vidéos</option>
              <option value="Retrait_Nyole">Retraits Mobile Money</option>
            </select>

            {/* Export CSV button */}
            <button
              onClick={handleExportLedgerCsv}
              className="py-1.5 px-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
              title="Exporter les transactions filtrées au format CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Exporter (CSV)</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950/60 text-neutral-400 border-b border-neutral-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-medium">Référence & Date</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Payeur / Canal</th>
                <th className="py-3 px-4 font-medium text-right">Montant Brut</th>
                <th className="py-3 px-4 font-medium text-right text-emerald-400">Net Créateur</th>
                <th className="py-3 px-4 font-medium text-right">Commission (15%)</th>
                <th className="py-3 px-4 font-medium text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-semibold text-neutral-200 block">{tx.reference}</span>
                    <span className="text-[10px] text-neutral-500">{tx.createdAt}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-neutral-300">
                    <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-neutral-200 block font-sans text-xs">{tx.payerName}</span>
                    <span className="text-[10px] text-amber-400">{tx.paymentGateway.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-neutral-200">
                    {formatXofForUserCountry(tx.grossAmountXof, creatorCurrency)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-400">
                    +{formatXofForUserCountry(tx.creatorNetAmountXof, creatorCurrency)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-neutral-400">
                    {tx.platformFeeAmountXof > 0 ? formatXofForUserCountry(tx.platformFeeAmountXof, creatorCurrency) : `0 ${currencyMeta.symbol}`}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {tx.status === 'complete' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        COMPLÉTÉ
                      </span>
                    )}
                    {tx.status === 'en_sequestre' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        SÉQUESTRE
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instant Payout Modal with Nyole & Mandatory 2FA */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-neutral-100">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-base text-neutral-100">Retrait Instantané Nyole & Banques</h3>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payoutSuccessMessage ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-semibold text-neutral-100">Retrait Effectué !</h4>
                <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
                  {payoutSuccessMessage}
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecutePayout} className="space-y-4 mt-4 text-xs">
                {/* Method selector */}
                <div>
                  <label className="text-neutral-400 block mb-1 font-medium">Destination des Fonds</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('NYOLE')}
                      className={`p-2.5 rounded-xl border text-center transition-colors ${
                        payoutMethod === 'NYOLE'
                          ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-semibold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mx-auto mb-1" />
                      Mobile Money (Nyole)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('STRIPE')}
                      className={`p-2.5 rounded-xl border text-center transition-colors ${
                        payoutMethod === 'STRIPE'
                          ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-semibold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      <Building className="w-4 h-4 mx-auto mb-1" />
                      Compte Bancaire / Carte (Nyole)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('USDT')}
                      className={`p-2.5 rounded-xl border text-center transition-colors relative ${
                        payoutMethod === 'USDT'
                          ? 'border-amber-400/60 bg-amber-400/10 text-neutral-300 font-semibold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      <Coins className="w-4 h-4 mx-auto mb-1" />
                      <span className="block text-[11px]">Crypto USDT</span>
                      <span className="text-[9px] text-amber-400 font-bold block mt-0.5">Bientôt disponible</span>
                    </button>
                  </div>
                  {payoutMethod === 'USDT' && (
                    <p className="text-[11px] text-amber-400/90 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
                      Le retrait vers un wallet USDT (TRC-20) sera bientôt disponible. Veuillez choisir le virement Mobile Money ou Compte Bancaire via Nyole.
                    </p>
                  )}
                </div>

                {payoutMethod === 'NYOLE' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-neutral-400 block mb-1 font-medium">Opérateur Réseau</label>
                        <select
                          value={momoOperator}
                          onChange={(e) => setMomoOperator(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
                        >
                          <optgroup label="🇨🇩 RDC (Kinshasa)">
                            <option value="Vodacom M-Pesa (RDC)">Vodacom M-Pesa (RDC)</option>
                            <option value="Orange Money (RDC)">Orange Money (RDC)</option>
                            <option value="Airtel Money (RDC)">Airtel Money (RDC)</option>
                            <option value="Afrimoney (RDC)">Afrimoney (RDC)</option>
                          </optgroup>
                          <optgroup label="🇨🇬 Congo-Brazzaville">
                            <option value="MTN MoMo (Congo-Brazza)">MTN Mobile Money (Congo-Brazza)</option>
                            <option value="Airtel Money (Congo-Brazza)">Airtel Money (Congo-Brazza)</option>
                          </optgroup>
                          <optgroup label="Afrique de l'Ouest & Centrale">
                            <option value="Wave (CI / Sénégal)">Wave (CI / Sénégal)</option>
                            <option value="MTN MoMo (CI, Bénin, Cameroun)">MTN MoMo (CI, Bénin, Cameroun)</option>
                            <option value="Orange Money (Afrique Ouest/Centre)">Orange Money (CI, SN, CM, ML)</option>
                            <option value="Moov Money">Moov Money (Afrique de l'Ouest)</option>
                            <option value="Airtel Money (Gabon, Tchad)">Airtel Money (Gabon, Tchad)</option>
                          </optgroup>
                          <optgroup label="Afrique de l'Est">
                            <option value="Safaricom / Vodacom M-Pesa">Safaricom / Vodacom M-Pesa (Est)</option>
                            <option value="Airtel Money (Rwanda, Ouganda)">Airtel Money (Rwanda, Ouganda)</option>
                            <option value="MTN MoMo (Rwanda, Ouganda)">MTN MoMo (Rwanda, Ouganda)</option>
                          </optgroup>
                        </select>
                      </div>
                      <div>
                        <label className="text-neutral-400 block mb-1 font-medium">Numéro de Téléphone (avec indicatif)</label>
                        <input
                          type="text"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-neutral-400 font-medium">Montant à retirer (Versé en {creatorCurrency})</label>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Max : {formatXofForUserCountry(creator.balanceXof, creatorCurrency)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="5000"
                    max={creator.balanceXof}
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 font-mono text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 2FA Security Step (Mandatory for Withdrawals) */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Authentification 2FA Obligatoire
                    </span>
                    {!is2faSent ? (
                      <button
                        type="button"
                        onClick={handleRequest2faCode}
                        className="text-amber-400 hover:underline text-[11px] font-medium"
                      >
                        Envoyer code SMS
                      </button>
                    ) : (
                      <span className="text-emerald-400 text-[10px] font-mono">Code transmis au {phoneNumber}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Protection anti-usurpation : entrez le code à 6 chiffres pour autoriser le décaissement instantané.
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Code 2FA (ex: 482910)"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono text-center tracking-widest text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingPayout || payoutMethod === 'USDT'}
                  className="w-full py-3 px-4 rounded-xl font-medium text-xs text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isProcessingPayout ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      Appel API Nyole en cours...
                    </span>
                  ) : payoutMethod === 'USDT' ? (
                    <span>Crypto bientôt disponible (Choisir Nyole)</span>
                  ) : (
                    <>
                      <span>Confirmer le Virement Instantané de {formatXofForUserCountry(parseInt(payoutAmount || '0', 10), creatorCurrency)}</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Publish Video Modal */}
      <PublishVideoModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        creator={creator}
        onPublishVideo={onPublishVideo}
      />
    </div>
  );
};
