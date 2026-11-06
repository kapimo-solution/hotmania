import React, { useState } from 'react';
import { User, KycSubmissionRequest, UserRole } from '../types';
import {
  X,
  UserCheck,
  Video,
  Eye,
  ShieldCheck,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  Camera,
  Coins,
  Sparkles,
} from 'lucide-react';

import { AdminConfig } from '../types';
import { ALL_AFRICAN_COUNTRIES } from '../data/africanCountries';
import { getCurrencyForCountry, getAdaptedPassPrice } from '../services/currencyService';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserRegistered: (newUser: User, kycRequest?: KycSubmissionRequest) => void;
  isFirstAccountCreated?: boolean;
  onSetupFirstAdmin?: (adminConfig: AdminConfig) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onUserRegistered,
  isFirstAccountCreated = false,
  onSetupFirstAdmin,
}) => {
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'creator'>('viewer');
  const [step, setStep] = useState<1 | 2>(1); // 1 = info/choix, 2 = paiement pass adapté (visionneur) ou KYC (créateur)

  // Common fields (démarrage avec la RDC mise en avant)
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('RDC - République Démocratique du Congo (Kinshasa)');
  const [phone, setPhone] = useState('+243 ');
  const [firstAdminSecretCode, setFirstAdminSecretCode] = useState('');

  // Viewer 1.99$ Payment state
  const [paymentGateway, setPaymentGateway] = useState<'NYOLE' | 'STRIPE' | 'USDT'>('NYOLE');
  const [momoOperator, setMomoOperator] = useState<string>('MPESA_RDC');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Creator KYC state
  const [docType, setDocType] = useState<'CNI' | 'PASSEPORT' | 'PERMIS'>('CNI');
  const [docNumber, setDocNumber] = useState('');
  const [birthDate, setBirthDate] = useState('2000-05-15');
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  if (!isOpen) return null;

  // Calcul âge
  const birthYear = new Date(birthDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  // Devise adaptée automatiquement selon le pays de résidence choisi
  const adaptedCurrency = getCurrencyForCountry(country);
  const passPrice = getAdaptedPassPrice(country);

  const handleCountrySelectChange = (newCountryName: string) => {
    setCountry(newCountryName);
    const matched = ALL_AFRICAN_COUNTRIES.find((c) => c.name === newCountryName);
    if (matched) {
      setPhone(`${matched.dialCode} `);
      if (matched.code === 'CD') {
        setMomoOperator('MPESA_RDC');
      } else if (matched.code === 'CG') {
        setMomoOperator('MTN_CONGO');
      } else if (matched.code === 'CI' || matched.code === 'SN') {
        setMomoOperator('WAVE');
      } else if (matched.code === 'CM') {
        setMomoOperator('MTN_CAMEROUN');
      }
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !username || !email || !password) {
      alert('Veuillez renseigner tous les champs obligatoires.');
      return;
    }
    if (isFirstAccountCreated && !firstAdminSecretCode.trim()) {
      alert("En tant que premier compte de la plateforme, vous devez définir votre code d'accès secret d'administration.");
      return;
    }
    setStep(2);
  };

  // Submit Viewer Account with Local Currency Pass Payment
  const handleCompleteViewerRegistration = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);

      if (isFirstAccountCreated && onSetupFirstAdmin) {
        onSetupFirstAdmin({
          email: email.trim(),
          password,
          secretAccessCode: firstAdminSecretCode.trim(),
          isConfigured: true,
          configuredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        });
      }

      const selectedCountryObj = ALL_AFRICAN_COUNTRIES.find((c) => c.name === country);
      const matchedCountryCode = selectedCountryObj?.code || 'CD';

      const newViewerUser: User = {
        id: `usr_viewer_${Date.now()}`,
        email: email.trim(),
        username: username.toLowerCase().replace(/\s+/g, '_'),
        displayName,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
        role: 'viewer',
        country,
        countryCode: matchedCountryCode,
        currency: adaptedCurrency.code, // Devise adaptée au pays de résidence
        isVip: true,
        hasPaidAccessPass: true,
        paidPassDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        kycStatus: 'valide',
        balanceXof: 50000,
        escrowPendingXof: 0,
        creatorSplitRate: 0.85,
        platformFeeRate: 0.15,
        twoFactorEnabled: false,
      };

      onUserRegistered(newViewerUser);
      onClose();
    }, 1200);
  };

  // Submit Creator Account (Free, but Pending Admin Approval)
  const handleCompleteCreatorRegistration = () => {
    if (age < 18) {
      alert('Erreur légale : Vous devez obligatoirement avoir au moins 18 ans pour vous inscrire en tant que créateur.');
      return;
    }
    if (!docNumber) {
      alert('Veuillez renseigner le numéro officiel de votre pièce d’identité.');
      return;
    }

    setIsSubmittingKyc(true);
    setTimeout(() => {
      setIsSubmittingKyc(false);

      if (isFirstAccountCreated && onSetupFirstAdmin) {
        onSetupFirstAdmin({
          email: email.trim(),
          password,
          secretAccessCode: firstAdminSecretCode.trim(),
          isConfigured: true,
          configuredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        });
      }

      const selectedCountryObj = ALL_AFRICAN_COUNTRIES.find((c) => c.name === country);
      const matchedCountryCode = selectedCountryObj?.code || 'CD';

      const newCreatorId = `usr_creator_${Date.now()}`;
      const newCreatorUser: User = {
        id: newCreatorId,
        email: email.trim(),
        username: username.toLowerCase().replace(/\s+/g, '_'),
        displayName,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
        role: 'creator',
        country,
        countryCode: matchedCountryCode,
        currency: adaptedCurrency.code, // Devise de paiement adaptée au créateur
        isVip: true,
        kycStatus: 'en_cours',
        creatorApprovalStatus: 'en_attente_admin',
        balanceXof: 0,
        escrowPendingXof: 0,
        creatorSplitRate: 0.85,
        platformFeeRate: 0.15,
        phoneNumber: phone,
        twoFactorEnabled: true,
      };

      const kycRequest: KycSubmissionRequest = {
        id: `kyc_sub_${Date.now()}`,
        creatorId: newCreatorId,
        creatorName: displayName,
        creatorUsername: username.toLowerCase().replace(/\s+/g, '_'),
        creatorAvatar: newCreatorUser.avatar,
        documentType: docType,
        documentNumber: docNumber,
        country,
        birthDate,
        calculatedAge: age,
        selfieLivenessUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
        documentFrontUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'en_attente_admin',
        biometricScore: 99.2,
      };

      onUserRegistered(newCreatorUser, kycRequest);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-neutral-100 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-lg tracking-tight">AuraVibe</span>
              <span className="text-xs font-mono bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                INSCRIPTION
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Rejoignez la plateforme mondiale de vidéos exclusives et monétisation locale
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          /* STEP 1 : CHOIX DU TYPE DE COMPTE & INFOS DE BASE */
          <form onSubmit={handleNextStep} className="space-y-5 mt-5 text-xs">
            {/* Account Type Selector Cards */}
            <div>
              <label className="text-neutral-300 font-semibold block mb-2 uppercase tracking-wider text-[11px]">
                Choisissez votre Type de Compte :
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Compte Visionneur */}
                <div
                  onClick={() => setSelectedRole('viewer')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedRole === 'viewer'
                      ? 'border-amber-400 bg-amber-400/10 shadow-md shadow-amber-400/5'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300">
                        <Eye className="w-5 h-5" />
                      </div>
                      <span className="font-mono font-bold text-sm text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                        {passPrice.formatted}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-neutral-100">Compte Visionneur</h4>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      Accès payant mondial illimité au feed infini, lives interactifs et challenges exclusifs.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-neutral-800/80 text-[10px] text-neutral-400 font-mono flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pass d'accès ({passPrice.formatted})</span>
                    </div>
                    <span className="text-amber-400 font-semibold">{adaptedCurrency.code}</span>
                  </div>
                </div>

                {/* 2. Compte Créateur de Contenu */}
                <div
                  onClick={() => setSelectedRole('creator')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedRole === 'creator'
                      ? 'border-amber-400 bg-amber-400/10 shadow-md shadow-amber-400/5'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300">
                        <Video className="w-5 h-5" />
                      </div>
                      <span className="font-mono font-bold text-sm text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">
                        GRATUIT (0 {adaptedCurrency.symbol})
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-neutral-100">Créateur de Contenu</h4>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      Reçevez 85% net de vos gains dans votre devise locale ({adaptedCurrency.code}) via Mobile Money.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-neutral-800/80 text-[10px] text-amber-400/90 font-mono flex items-start gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Actif après validation identité par l'Admin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Input fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Nom complet / Nom d'artiste</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Sarah Monroe"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Nom d'utilisateur (@)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="sarah_vip"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Adresse Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@exemple.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Mot de passe (Argon2id)</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium flex items-center justify-between">
                  <span>Pays de résidence (Afrique & Monde)</span>
                  <span className="text-[10px] text-amber-400 font-mono font-normal">54 pays africains</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => handleCountrySelectChange(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400 font-sans"
                >
                  <optgroup label="⭐ Priorité : RDC & Congo-Brazzaville">
                    <option value="RDC - République Démocratique du Congo (Kinshasa)">
                      🇨🇩 RDC - République Démocratique du Congo (+243)
                    </option>
                    <option value="Congo-Brazzaville (République du Congo)">
                      🇨🇬 Congo-Brazzaville (+242)
                    </option>
                  </optgroup>

                  <optgroup label="Afrique Centrale">
                    {ALL_AFRICAN_COUNTRIES.filter(
                      (c) =>
                        c.region === 'Afrique Centrale' &&
                        c.code !== 'CD' &&
                        c.code !== 'CG'
                    ).map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Afrique de l'Ouest">
                    {ALL_AFRICAN_COUNTRIES.filter(
                      (c) => c.region === "Afrique de l'Ouest"
                    ).map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Afrique de l'Est & Grands Lacs">
                    {ALL_AFRICAN_COUNTRIES.filter(
                      (c) => c.region === "Afrique de l'Est"
                    ).map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Afrique du Nord">
                    {ALL_AFRICAN_COUNTRIES.filter(
                      (c) => c.region === 'Afrique du Nord'
                    ).map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Afrique Australe">
                    {ALL_AFRICAN_COUNTRIES.filter(
                      (c) => c.region === 'Afrique Australe'
                    ).map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Diaspora VIP & International">
                    {ALL_AFRICAN_COUNTRIES.filter(
                      (c) => c.region === 'Diaspora & International'
                    ).map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* Badge visuel de la Devise locale détectée */}
                <div className="mt-2 p-2.5 bg-neutral-950/90 border border-neutral-800 rounded-xl flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Devise locale adaptée :</span>
                    <strong className="text-amber-400 font-bold">{adaptedCurrency.name} ({adaptedCurrency.code})</strong>
                  </div>
                  <span className="text-neutral-400 font-semibold">1 $ = {adaptedCurrency.ratePerUsd.toLocaleString('fr-FR')} {adaptedCurrency.code}</span>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">Numéro Mobile Money</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+243 00 000 0000"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* PROMOTION AUTOMATIQUE EN COMPTE ADMINISTRATEUR MAÎTRE SI PREMIER COMPTE */}
            {isFirstAccountCreated && (
              <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Promotion Automatique : Premier Compte Administrateur Maître</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Cette première adresse email et ce mot de passe deviendront automatiquement les identifiants administrateur du site. Vous devez choisir seul votre code d'accès secret d'administration ci-dessous :
                </p>
                <div>
                  <label className="text-purple-300 block mb-1 font-semibold text-xs">
                    Code d'Accès Secret Admin Personnalisé (que vous choisissez seul) :
                  </label>
                  <input
                    type="text"
                    required
                    value={firstAdminSecretCode}
                    onChange={(e) => setFirstAdminSecretCode(e.target.value)}
                    placeholder="Ex: 884920 ou MON_CODE_SECRET"
                    className="w-full bg-neutral-950 border border-purple-500/40 rounded-xl py-2 px-3 text-amber-300 font-mono text-center font-bold text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-medium text-xs text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15"
            >
              <span>
                {selectedRole === 'viewer'
                  ? `Continuer vers le Paiement du Pass (${passPrice.formatted})`
                  : 'Continuer vers l’Authentificateur d’Identité (Gratuit)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* STEP 2 : CONDITIONNÉ SELON LE RÔLE */
          <div className="mt-5 space-y-4 text-xs">
            {selectedRole === 'viewer' ? (
              /* PAIEMENT DU PASS VISIONNEUR DANS LA DEVISE LOCALE */
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-neutral-100 text-sm">Pass Visionneur VIP : {passPrice.formatted} (~{passPrice.equivalentUsdString})</h4>
                    <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                      L'accès au contenu et aux flux vidéo est payant pour garantir une communauté exclusive. Facturé dans la devise officielle de votre pays ({adaptedCurrency.name}).
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1.5 font-medium">
                    Sélectionnez votre moyen de paiement instantané :
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentGateway('NYOLE')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        paymentGateway === 'NYOLE'
                          ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-semibold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mx-auto mb-1" />
                      Mobile Money (Nyole)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentGateway('STRIPE')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        paymentGateway === 'STRIPE'
                          ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-semibold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1" />
                      Carte Bancaire (Nyole)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentGateway('USDT')}
                      className={`p-3 rounded-xl border text-center transition-all relative ${
                        paymentGateway === 'USDT'
                          ? 'border-amber-400/60 bg-amber-400/10 text-neutral-300 font-semibold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      <Coins className="w-4 h-4 mx-auto mb-1" />
                      <span className="block text-[11px]">Crypto USDT</span>
                      <span className="text-[9px] text-amber-400 font-bold block mt-0.5">Bientôt disponible</span>
                    </button>
                  </div>
                  {paymentGateway === 'USDT' && (
                    <p className="text-[11px] text-amber-400/90 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
                      Le paiement par USDT (TRC-20) sera bientôt disponible. Veuillez opter pour Mobile Money ou Carte Bancaire via Nyole.
                    </p>
                  )}
                </div>

                {paymentGateway === 'NYOLE' && (
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <label className="text-neutral-400 block font-medium">Opérateur Réseau Africain</label>
                    <select
                      value={momoOperator}
                      onChange={(e) => setMomoOperator(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200"
                    >
                      <optgroup label="🇨🇩 RDC (Kinshasa) - Mobile Money">
                        <option value="MPESA_RDC">Vodacom M-Pesa (RDC)</option>
                        <option value="ORANGE_RDC">Orange Money (RDC)</option>
                        <option value="AIRTEL_RDC">Airtel Money (RDC)</option>
                        <option value="AFRIMONEY_RDC">Afrimoney (RDC)</option>
                      </optgroup>
                      <optgroup label="🇨🇬 Congo-Brazzaville - Mobile Money">
                        <option value="MTN_CONGO">MTN Mobile Money (Congo-Brazzaville)</option>
                        <option value="AIRTEL_CONGO">Airtel Money (Congo-Brazzaville)</option>
                      </optgroup>
                      <optgroup label="Afrique de l'Ouest & Centrale">
                        <option value="WAVE">Wave (Côte d'Ivoire & Sénégal)</option>
                        <option value="ORANGE_WEST">Orange Money (CI, Sénégal, Mali, Guinée)</option>
                        <option value="MTN_WEST">MTN MoMo (CI, Bénin, Cameroun)</option>
                        <option value="MOOV_AFRICA">Moov Money (Afrique de l'Ouest & Centrale)</option>
                        <option value="AIRTEL_GABON">Airtel Money (Gabon & Tchad)</option>
                      </optgroup>
                      <optgroup label="Afrique de l'Est & Réseaux Partenaires Nyole">
                        <option value="MPESA_EAST">Safaricom / Vodacom M-Pesa (Kenya, Tanzanie)</option>
                        <option value="AIRTEL_EAST">Airtel Money (Rwanda, Ouganda)</option>
                        <option value="MTN_EAST">MTN MoMo (Rwanda, Ouganda)</option>
                      </optgroup>
                    </select>
                    <span className="text-[10px] text-amber-400 font-mono block">
                      Débit direct de {passPrice.formatted} sur votre compte {phone} ({adaptedCurrency.code})
                    </span>
                  </div>
                )}

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-[11px] space-y-1.5">
                  <div className="flex justify-between text-neutral-400">
                    <span>Frais d'accès au Pass :</span>
                    <span className="text-neutral-100 font-bold">{passPrice.formatted} (~{passPrice.equivalentUsdString})</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Devise locale de votre compte :</span>
                    <span className="text-amber-400 font-bold">{adaptedCurrency.name} ({adaptedCurrency.code})</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 pt-1 border-t border-neutral-800/80">
                    <span>Statut après validation :</span>
                    <span>Accès Illimité Débloqué</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3 px-4 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingPayment || paymentGateway === 'USDT'}
                    onClick={handleCompleteViewerRegistration}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-xs text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        Paiement Nyole ({passPrice.formatted}) en cours...
                      </span>
                    ) : paymentGateway === 'USDT' ? (
                      <span>Crypto bientôt disponible (Choisir Nyole)</span>
                    ) : (
                      <>
                        <span>Régler {passPrice.formatted} & Entrer sur AuraVibe VIP</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* INSCRIPTION CRÉATEUR : AUTHENTIFICATEUR D'IDENTITÉ OBLIGATOIRE (SOUMIS À L'ADMIN) */
              <div className="space-y-4">
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-neutral-100 text-sm">
                      Authentificateur d'Identité & Certification 18+ (Gratuit)
                    </h4>
                    <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                      Conformément à la politique de sécurité d'AuraVibe, <strong className="text-amber-400">vous ne pourrez publier de vidéos ou lancer des lives qu'après la validation formelle de votre profil par l'Administrateur</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-400 block mb-1 font-medium">Type de Pièce Officielle</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200"
                    >
                      <option value="CNI">Carte Nationale d'Identité (CNI)</option>
                      <option value="PASSEPORT">Passeport International</option>
                      <option value="PERMIS">Permis de Conduire</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1 font-medium">Numéro de Document</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CI-04918204"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1 font-medium">Date de Naissance (18+ Obligatoire)</label>
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1 font-medium">Âge Calculé</label>
                    <div className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 font-mono">
                      <span className={age >= 18 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {age} ans ({age >= 18 ? 'Conforme 18+' : 'Rejeté : Mineur'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upload simulation */}
                <div className="p-4 bg-neutral-950 border border-dashed border-neutral-700 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Camera className="w-6 h-6 text-amber-400" />
                    <div>
                      <span className="font-semibold text-neutral-200 block text-xs">
                        Document {docType} & Selfie Liveness 3D
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Chiffré AES-256 · Transmis au serveur d'audit sécurisé
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Capturé (Score 99.2%)
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3 px-4 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingKyc || age < 18}
                    onClick={handleCompleteCreatorRegistration}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-xs text-neutral-950 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-300 hover:to-purple-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
                  >
                    {isSubmittingKyc ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        Transmission à l'Administrateur...
                      </span>
                    ) : (
                      <>
                        <span>Soumettre mon Profil à l'Administrateur</span>
                        <ShieldCheck className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
