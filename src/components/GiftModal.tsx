import React, { useState } from 'react';
import { GiftTier } from '../types';
import { GIFT_TIERS } from '../data/mockData';
import { X, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { formatXofForUserCountry } from '../services/currencyService';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  creatorSplitRate?: number;
  onSendGift: (gift: GiftTier, split: { creatorNet: number; platformFee: number }) => void;
  userCurrency?: string;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  isOpen,
  onClose,
  creatorName,
  creatorSplitRate = 0.85,
  onSendGift,
  userCurrency = 'CDF',
}) => {
  const [selectedGift, setSelectedGift] = useState<GiftTier>(GIFT_TIERS[1]);
  const [selectedGateway, setSelectedGateway] = useState<'NYOLE_MOMO' | 'NYOLE_CARD' | 'CRYPTO'>('NYOLE_MOMO');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const creatorNet = Math.round(selectedGift.amountXof * creatorSplitRate);
  const platformFee = selectedGift.amountXof - creatorNet;

  const handleSend = () => {
    if (selectedGateway === 'CRYPTO') {
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSendGift(selectedGift, { creatorNet, platformFee });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base text-neutral-100">Envoyer un Cadeau VIP</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 mt-2">
          Soutenez <span className="text-amber-400 font-medium">@{creatorName}</span> avec un cadeau exclusif en <span className="text-amber-400 font-semibold">{userCurrency}</span>. Répartition instantanée garantie via le Split Engine AuraVibe.
        </p>

        {/* Gift grid */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          {GIFT_TIERS.map((gift) => {
            const isSelected = selectedGift.id === gift.id;
            return (
              <button
                key={gift.id}
                onClick={() => setSelectedGift(gift)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                    : 'border-neutral-800 bg-neutral-800/40 hover:border-neutral-700'
                }`}
              >
                <span className="text-2xl mb-1">{gift.icon}</span>
                <span className="text-xs font-medium text-neutral-200 truncate w-full text-center">
                  {gift.name}
                </span>
                <span className="text-xs font-mono tabular-nums text-amber-400 font-semibold mt-0.5">
                  {formatXofForUserCountry(gift.amountXof, userCurrency)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Split Engine Transparency Box */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 text-xs mb-4">
          <div className="flex items-center justify-between font-mono text-neutral-300 pb-2 border-b border-neutral-800/60">
            <span>Montant Brut</span>
            <span className="font-semibold text-neutral-100 tabular-nums">
              {formatXofForUserCountry(selectedGift.amountXof, userCurrency)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-1 font-mono">
            <div className="flex flex-col">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Part Créateur (85%)
              </span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">
                +{formatXofForUserCountry(creatorNet, userCurrency)}
              </span>
              <span className="text-[10px] text-neutral-500">Crédité au wallet instantanément</span>
            </div>
            <div className="flex flex-col border-l border-neutral-800 pl-3">
              <span className="text-neutral-400 font-medium">Commission Plateforme (15%)</span>
              <span className="text-sm font-semibold text-neutral-300 tabular-nums mt-0.5">
                {formatXofForUserCountry(platformFee, userCurrency)}
              </span>
              <span className="text-[10px] text-neutral-500">Frais réseau & maintenance</span>
            </div>
          </div>
        </div>

        {/* Payment selector */}
        <div className="mb-4">
          <label className="text-[11px] text-neutral-400 block mb-1.5 uppercase tracking-wide font-medium">
            Moyen de Paiement
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSelectedGateway('NYOLE_MOMO')}
              className={`py-2 px-2 rounded-lg border text-center transition-colors flex flex-col items-center justify-center ${
                selectedGateway === 'NYOLE_MOMO'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-medium'
                  : 'border-neutral-800 bg-neutral-800/50 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Mobile Money</span>
              <span className="text-[10px] opacity-75">Nyole Pay</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGateway('NYOLE_CARD')}
              className={`py-2 px-2 rounded-lg border text-center transition-colors flex flex-col items-center justify-center ${
                selectedGateway === 'NYOLE_CARD'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-medium'
                  : 'border-neutral-800 bg-neutral-800/50 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Carte Bancaire</span>
              <span className="text-[10px] opacity-75">Via Nyole</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGateway('CRYPTO')}
              className={`py-2 px-1.5 rounded-lg border text-center transition-colors flex flex-col items-center justify-center relative ${
                selectedGateway === 'CRYPTO'
                  ? 'border-amber-500/50 bg-amber-500/10 text-neutral-300'
                  : 'border-neutral-800/80 bg-neutral-900/60 text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <span>Crypto USDT</span>
              <span className="text-[9px] text-amber-400 font-medium mt-0.5">Bientôt disponible</span>
            </button>
          </div>
          {selectedGateway === 'CRYPTO' && (
            <p className="text-[11px] text-amber-400/90 mt-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md p-1.5 text-center">
              Le paiement par USDT (TRC-20) sera bientôt disponible. Veuillez choisir Mobile Money ou Carte Bancaire via Nyole.
            </p>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSend}
          disabled={isProcessing || selectedGateway === 'CRYPTO'}
          className="w-full py-3 px-4 rounded-xl font-medium text-sm text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.99] disabled:opacity-50"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              Traitement du Split en cours...
            </span>
          ) : selectedGateway === 'CRYPTO' ? (
            <span>Crypto bientôt disponible (Choisir Nyole)</span>
          ) : (
            <>
              <span>Envoyer pour {formatXofForUserCountry(selectedGift.amountXof, userCurrency)}</span>
              <ShieldCheck className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
