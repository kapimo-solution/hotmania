import React, { useState } from 'react';
import { Challenge } from '../types';
import { MOCK_CHALLENGES } from '../data/mockData';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  Zap,
  ArrowRight,
  ShieldCheck,
  X,
  FileCheck,
  Upload,
  Search,
  Filter,
} from 'lucide-react';

import { formatXofForUserCountry } from '../services/currencyService';

interface ChallengesViewProps {
  onChallengeSplitExecuted: (challenge: Challenge, split: { creatorNet: number; platformFee: number }) => void;
  creatorBalance: number;
  creatorEscrow: number;
  userCurrency?: string;
  currentRole?: string;
  activeCreatorName?: string;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  onChallengeSplitExecuted,
  userCurrency = 'CDF',
  currentRole = 'viewer',
  activeCreatorName = 'Adesuwa Global',
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>(MOCK_CHALLENGES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProofVideo, setSelectedProofVideo] = useState<string | null>(null);
  const [submitProofTarget, setSubmitProofTarget] = useState<Challenge | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'en_attente_preuve' | 'preuve_soumise' | 'valide_paye'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bountyAmount, setBountyAmount] = useState('50000');
  const [gateway, setGateway] = useState<'NYOLE' | 'STRIPE'>('NYOLE');
  const [operator, setOperator] = useState('WAVE');

  // Submit Proof state
  const [proofNotes, setProofNotes] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  const handleValidateChallenge = (challengeId: string) => {
    const target = challenges.find((c) => c.id === challengeId);
    if (!target) return;

    const creatorNet = Math.round(target.bountyAmountXof * 0.85);
    const platformFee = target.bountyAmountXof - creatorNet;

    const updated = challenges.map((c) => {
      if (c.id === challengeId) {
        return {
          ...c,
          status: 'valide_paye' as const,
          splitExecutedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        };
      }
      return c;
    });

    setChallenges(updated);
    onChallengeSplitExecuted(target, { creatorNet, platformFee });
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(bountyAmount, 10) || 50000;
    const newChallenge: Challenge = {
      id: `chl_${Date.now()}`,
      title,
      description,
      sponsorName: 'Vous (Sponsor VIP)',
      creatorId: 'usr_creator_adsuwa_01',
      creatorName: activeCreatorName || 'Adesuwa Global',
      bountyAmountXof: amount,
      status: 'en_attente_preuve',
      deadline: '72 heures restantes',
      escrowTxId: `ESC-2026-XOF-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    setChallenges([newChallenge, ...challenges]);
    setIsCreateModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const handleCompleteSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitProofTarget) return;

    setIsSubmittingProof(true);
    setTimeout(() => {
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === submitProofTarget.id
            ? {
                ...c,
                status: 'preuve_soumise',
                proofVideoUrl: '/src/assets/images/auravibe_creator_challenge_1793709855910.jpg',
              }
            : c
        )
      );
      setIsSubmittingProof(false);
      setSubmitProofTarget(null);
      setProofNotes('');
    }, 900);
  };

  // Filter challenges
  const filteredChallenges = challenges.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.title.toLowerCase().includes(q) ||
        c.creatorName.toLowerCase().includes(q) ||
        c.sponsorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Escrow Explanation */}
      <div className="p-6 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/20 border border-neutral-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-neutral-100">Module de Challenges Payants sous Séquestre (Escrow)</h2>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Les fonds sont verrouillés dans un compte tiers de confiance. Le créateur n’est crédité de ses <span className="text-amber-400 font-semibold">85% net</span> qu’après validation irrévocable de la preuve vidéo du défi.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-400 text-neutral-950 hover:bg-amber-300 transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Proposer un Défi Sponsorisé</span>
        </button>
      </div>

      {/* Sub-bar: Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Tous ({challenges.length})
          </button>
          <button
            onClick={() => setFilterStatus('en_attente_preuve')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'en_attente_preuve'
                ? 'bg-cyan-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            En Attente de Preuve ({challenges.filter((c) => c.status === 'en_attente_preuve').length})
          </button>
          <button
            onClick={() => setFilterStatus('preuve_soumise')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'preuve_soumise'
                ? 'bg-purple-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Preuves à Valider ({challenges.filter((c) => c.status === 'preuve_soumise').length})
          </button>
          <button
            onClick={() => setFilterStatus('valide_paye')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'valide_paye'
                ? 'bg-emerald-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Split 85/15 Payé ({challenges.filter((c) => c.status === 'valide_paye').length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher défi, créateur..."
            className="py-1.5 pl-8 pr-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Challenges Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChallenges.map((chl) => {
          const creatorNet = Math.round(chl.bountyAmountXof * 0.85);
          const platformFee = chl.bountyAmountXof - creatorNet;

          return (
            <div
              key={chl.id}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all"
            >
              <div>
                {/* Status bar */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-neutral-400">
                    ID: {chl.escrowTxId}
                  </span>
                  {chl.status === 'valide_paye' && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> SPLIT 85/15 PAYÉ
                    </span>
                  )}
                  {chl.status === 'preuve_soumise' && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      <FileCheck className="w-3 h-3" /> PREUVE EN ATTENTE
                    </span>
                  )}
                  {chl.status === 'en_attente_preuve' && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      <Clock className="w-3 h-3" /> SÉQUESTRE ACTIF
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-sm text-neutral-100 leading-snug line-clamp-2">
                  {chl.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {chl.description}
                </p>

                <div className="mt-3 text-[11px] text-neutral-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Créateur ciblé :</span>
                    <span className="text-neutral-200 font-medium">@{chl.creatorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sponsor du défi :</span>
                    <span className="text-neutral-200">{chl.sponsorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Échéance :</span>
                    <span className="text-neutral-300 font-mono">{chl.deadline}</span>
                  </div>
                </div>
              </div>

              {/* Escrow & Split Financial Breakdown */}
              <div className="pt-3 border-t border-neutral-800">
                <div className="bg-neutral-950 p-3 rounded-xl font-mono text-xs space-y-1">
                  <div className="flex justify-between text-neutral-300">
                    <span>Prime Totale Séquestrée :</span>
                    <span className="font-bold text-amber-400 tabular-nums">
                      {formatXofForUserCountry(chl.bountyAmountXof, userCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-400">
                    <span>Part Créateur (85%) :</span>
                    <span className="tabular-nums">+{formatXofForUserCountry(creatorNet, userCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>Commission AuraVibe (15%) :</span>
                    <span className="tabular-nums">{formatXofForUserCountry(platformFee, userCurrency)}</span>
                  </div>
                </div>

                {/* Proof preview if available */}
                {chl.proofVideoUrl && (
                  <button
                    onClick={() => setSelectedProofVideo(chl.proofVideoUrl || null)}
                    className="w-full mt-2 py-2 px-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-950/60 text-xs text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    <span>Visionner la preuve vidéo transmise</span>
                  </button>
                )}

                {/* Action 1: Creator Submits Proof */}
                {chl.status === 'en_attente_preuve' && (
                  <button
                    onClick={() => setSubmitProofTarget(chl)}
                    className="w-full mt-2.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-[0.98]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Soumettre la Preuve Vidéo (Créateur)</span>
                  </button>
                )}

                {/* Action 2: Sponsor / Admin Validates & Releases Escrow */}
                {chl.status === 'preuve_soumise' && (
                  <button
                    onClick={() => handleValidateChallenge(chl.id)}
                    className="w-full mt-2.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Valider la Preuve & Déclencher le Split</span>
                  </button>
                )}

                {chl.status === 'valide_paye' && (
                  <div className="w-full mt-2.5 py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-[11px] text-center font-mono">
                    ✓ Séquestre libéré · Split 85/15 Payé
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Challenge Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl text-neutral-100">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-semibold text-sm text-neutral-100">Créer un Challenge Payant</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Titre du Challenge</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Danse Afro-Fusion tempo 130 BPM"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Description & Critères de Réussite</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Précisez les exigences et la durée de la vidéo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Montant de la Prime Séquestrée (Base XOF - adaptée en {userCurrency})</label>
                <select
                  value={bountyAmount}
                  onChange={(e) => setBountyAmount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
                >
                  <option value="25000">25 000 XOF ({formatXofForUserCountry(25000, userCurrency)})</option>
                  <option value="50000">50 000 XOF ({formatXofForUserCountry(50000, userCurrency)})</option>
                  <option value="100000">100 000 XOF ({formatXofForUserCountry(100000, userCurrency)})</option>
                  <option value="250000">250 000 XOF ({formatXofForUserCountry(250000, userCurrency)})</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Moyen de Dépôt sous Séquestre</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGateway('NYOLE')}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      gateway === 'NYOLE'
                        ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-medium'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    Nyole Mobile Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setGateway('STRIPE')}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      gateway === 'STRIPE'
                        ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-medium'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    Carte Bancaire (Nyole Pay)
                  </button>
                </div>
              </div>

              {gateway === 'NYOLE' && (
                <div>
                  <label className="text-neutral-400 block mb-1 font-medium">Opérateur Mobile</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="WAVE">Wave (Sénégal & Côte d'Ivoire)</option>
                    <option value="MTN">MTN MoMo (Côte d'Ivoire, Bénin, Cameroun)</option>
                    <option value="ORANGE">Orange Money (Afrique de l'Ouest)</option>
                    <option value="AIRTEL">Airtel Money (Afrique Centrale & Est)</option>
                    <option value="MPESA">Vodacom M-Pesa (RDC & Kenya)</option>
                  </select>
                </div>
              )}

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-400 space-y-1">
                <div className="flex justify-between">
                  <span>Dépôt Séquestre ({userCurrency}) :</span>
                  <span className="text-neutral-200 font-bold">
                    {formatXofForUserCountry(parseInt(bountyAmount, 10) || 50000, userCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Part future créateur (85%) :</span>
                  <span>+{formatXofForUserCountry(Math.round((parseInt(bountyAmount, 10) || 50000) * 0.85), userCurrency)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-medium text-xs text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
              >
                <span>Déposer en Séquestre & Lancer le Challenge</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Submit Proof Modal for Creator */}
      {submitProofTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-neutral-100">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-sm">Transmettre la Preuve du Challenge</h3>
              </div>
              <button
                onClick={() => setSubmitProofTarget(null)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmitProof} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-neutral-400 text-[11px] block">Défi concerné :</span>
                <h4 className="font-bold text-neutral-100">{submitProofTarget.title}</h4>
                <span className="text-amber-400 font-mono font-bold block">
                  Prime à débloquer : +{formatXofForUserCountry(Math.round(submitProofTarget.bountyAmountXof * 0.85), userCurrency)} (85% net)
                </span>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Notes / Description de la Preuve</label>
                <textarea
                  required
                  rows={3}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Expliquez comment vous avez relevé le défi et la teneur de la chorégraphie..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Preuve Upload Simulation */}
              <div className="p-4 bg-neutral-950 border border-dashed border-neutral-700 rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="font-semibold text-neutral-200 block">Preuve Vidéo HD Enregistrée</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Hachage forensique DRM certifié
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingProof}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmittingProof ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    Transmission au coffre-fort séquestre...
                  </span>
                ) : (
                  <>
                    <span>Soumettre la Preuve au Sponsor</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Proof Video Preview Modal */}
      {selectedProofVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-neutral-800 flex justify-between items-center text-xs text-neutral-300">
              <span className="font-semibold">Preuve Vidéo Soumise</span>
              <button
                onClick={() => setSelectedProofVideo(null)}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-[9/16] relative bg-neutral-900">
              <img
                src={selectedProofVideo}
                alt="Proof"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                DRM WATERMARK HASH VERIFIED
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
