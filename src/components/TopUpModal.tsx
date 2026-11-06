import React, { useState } from 'react';
import { X, Smartphone, CreditCard, ShieldCheck, Zap, Wallet, CheckCircle2 } from 'lucide-react';
import { formatXofForUserCountry, convertXofToCurrency, convertUsdToCurrency } from '../services/currencyService';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCurrency: string;
  userCountry?: string;
  onTopUpSuccess: (amountXof: number, gateway: string, reference: string) => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  userCurrency,
  userCountry,
  onTopUpSuccess,
}) => {
  // Preset amounts in XOF base
  const presetAmountsXof = [5000, 15000, 30000, 60000];
  const [selectedAmountXof, setSelectedAmountXof] = useState<number>(presetAmountsXof[1]);
  const [customAmountLocal, setCustomAmountLocal] = useState<string>('');
  const [useCustom, setUseCustom] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'CARD'>('MOMO');
  const [momoOperator, setMomoOperator] = useState('MPESA_RDC');
  const [phone, setPhone] = useState('+243 81 234 5678');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Calcul du montant final en XOF
  const activeAmountXof = useCustom
    ? Math.max(1000, Math.round((parseFloat(customAmountLocal) || 1000) / (convertXofToCurrency(1000, userCurrency) / 1000)))
    : selectedAmountXof;

  const handleExecuteRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      const reference = `TOPUP-NYOLE-${Math.floor(10000 + Math.random() * 90000)}`;

      setTimeout(() => {
        onTopUpSuccess(activeAmountXof, paymentMethod === 'MOMO' ? 'Nyole_MobileMoney' : 'Carte_Bancaire', reference);
        setIsSuccess(false);
        onClose();
      }, 1400);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base text-neutral-100">Recharger mon Solde VIP</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-base text-neutral-100">Recharge Effectuée avec Succès !</h4>
            <p className="text-xs text-neutral-300">
              Votre portefeuille a été crédité de <strong className="text-amber-400 font-mono font-bold">{formatXofForUserCountry(activeAmountXof, userCurrency)}</strong> via l'API Nyole.
            </p>
          </div>
        ) : (
          <form onSubmit={handleExecuteRecharge} className="mt-4 space-y-4 text-xs">
            {/* Choisir le montant */}
            <div>
              <label className="text-neutral-400 block mb-2 font-medium">
                Montant de la recharge ({userCurrency}) :
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presetAmountsXof.map((amt) => {
                  const isSelected = !useCustom && selectedAmountXof === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmountXof(amt);
                        setUseCustom(false);
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-bold shadow-sm'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <span className="block text-sm font-mono">
                        {formatXofForUserCountry(amt, userCurrency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Moyen de Paiement */}
            <div>
              <label className="text-neutral-400 block mb-1.5 font-medium">
                Passerelle de Paiement Instantané :
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOMO')}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'MOMO'
                      ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-semibold'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile Money (Nyole)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-semibold'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Carte Bancaire (Nyole)</span>
                </button>
              </div>
            </div>

            {/* Opérateur si Mobile Money */}
            {paymentMethod === 'MOMO' ? (
              <div className="space-y-2 p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div>
                  <label className="text-neutral-400 block mb-1 font-medium">Opérateur Réseau</label>
                  <select
                    value={momoOperator}
                    onChange={(e) => setMomoOperator(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200"
                  >
                    <optgroup label="🇨🇩 RDC (Kinshasa)">
                      <option value="MPESA_RDC">Vodacom M-Pesa (RDC)</option>
                      <option value="ORANGE_RDC">Orange Money (RDC)</option>
                      <option value="AIRTEL_RDC">Airtel Money (RDC)</option>
                      <option value="AFRIMONEY_RDC">Afrimoney (RDC)</option>
                    </optgroup>
                    <optgroup label="🇨🇬 Congo-Brazzaville">
                      <option value="MTN_CONGO">MTN Mobile Money (Congo-Brazza)</option>
                      <option value="AIRTEL_CONGO">Airtel Money (Congo-Brazza)</option>
                    </optgroup>
                    <optgroup label="Afrique de l'Ouest & Centrale">
                      <option value="WAVE">Wave (Côte d'Ivoire & Sénégal)</option>
                      <option value="ORANGE_WEST">Orange Money (Afrique de l'Ouest)</option>
                      <option value="MTN_WEST">MTN MoMo (CI, Bénin, Cameroun)</option>
                      <option value="MOOV_AFRICA">Moov Money (Afrique)</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1 font-medium">Numéro de Téléphone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <p className="text-[11px] text-neutral-300">
                  Paiement sécurisé par carte Visa / Mastercard via le terminal Nyole Pay chiffré 3D-Secure.
                </p>
                <input
                  type="text"
                  placeholder="Numéro de carte (4000 1234 5678 9010)"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 font-mono"
                  defaultValue="4532 •••• •••• 8812"
                />
              </div>
            )}

            {/* Récapitulatif */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs flex justify-between items-center">
              <span className="text-neutral-400">Total à débiter :</span>
              <span className="text-amber-400 font-bold text-sm">
                {formatXofForUserCountry(activeAmountXof, userCurrency)}
              </span>
            </div>

            {/* Bouton d'action */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  Confirmation Nyole en cours...
                </span>
              ) : (
                <>
                  <span>Créditer {formatXofForUserCountry(activeAmountXof, userCurrency)}</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
