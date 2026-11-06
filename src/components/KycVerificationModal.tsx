import React, { useState } from 'react';
import { X, ShieldCheck, Camera, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { ALL_AFRICAN_COUNTRIES } from '../data/africanCountries';

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const KycVerificationModal: React.FC<KycVerificationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [docType, setDocType] = useState<'PASSEPORT' | 'CNI' | 'PERMIS'>('CNI');
  const [country, setCountry] = useState('RDC - République Démocratique du Congo (Kinshasa)');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  if (!isOpen) return null;

  const handleStartBiometrics = () => {
    setStep(2);
  };

  const handleSimulateLiveness = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerified(true);
      setStep(3);
    }, 1500);
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-neutral-100">Certification Créateur VIP & KYC 18+</h3>
              <p className="text-[11px] text-neutral-400">Vérification d’âge obligatoire et conformité anti-fraude</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between my-5 px-2">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              step >= 1 ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
            }`}>
              1
            </div>
            <span className="text-xs font-medium text-neutral-300">Pièce d'Identité</span>
          </div>
          <div className="w-10 h-0.5 bg-neutral-800" />
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              step >= 2 ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
            }`}>
              2
            </div>
            <span className="text-xs font-medium text-neutral-300">Selfie Liveness</span>
          </div>
          <div className="w-10 h-0.5 bg-neutral-800" />
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              step === 3 ? 'bg-emerald-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
            }`}>
              3
            </div>
            <span className="text-xs font-medium text-neutral-300">Validation</span>
          </div>
        </div>

        {/* Step 1: ID document scan */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-300 leading-relaxed">
                AuraVibe VIP applique une tolérance zéro pour les mineurs et les faux profils. Vos données sont chiffrées en AES-256 et stockées dans un coffre-fort RGPD sécurisé.
              </p>
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1 font-medium flex items-center justify-between">
                <span>Pays émetteur du document (54 pays africains & Monde)</span>
                <span className="text-[10px] text-amber-400 font-mono">18+ obligatoire</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full py-2.5 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
              >
                <optgroup label="⭐ RDC & Congo-Brazzaville">
                  <option value="RDC - République Démocratique du Congo (Kinshasa)">
                    🇨🇩 RDC - République Démocratique du Congo
                  </option>
                  <option value="Congo-Brazzaville (République du Congo)">
                    🇨🇬 Congo-Brazzaville (République du Congo)
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
                      {c.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Afrique de l'Ouest">
                  {ALL_AFRICAN_COUNTRIES.filter(
                    (c) => c.region === "Afrique de l'Ouest"
                  ).map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Afrique de l'Est & Grands Lacs">
                  {ALL_AFRICAN_COUNTRIES.filter(
                    (c) => c.region === "Afrique de l'Est"
                  ).map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Afrique du Nord">
                  {ALL_AFRICAN_COUNTRIES.filter(
                    (c) => c.region === 'Afrique du Nord'
                  ).map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Afrique Australe">
                  {ALL_AFRICAN_COUNTRIES.filter(
                    (c) => c.region === 'Afrique Australe'
                  ).map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Diaspora & International">
                  {ALL_AFRICAN_COUNTRIES.filter(
                    (c) => c.region === 'Diaspora & International'
                  ).map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1 font-medium">Type de document officiel</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CNI', 'PASSEPORT', 'PERMIS'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDocType(type)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      docType === type
                        ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Upload Area Simulation */}
            <div className="border border-dashed border-neutral-700 bg-neutral-950/80 rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer hover:border-amber-400/60 transition-colors">
              <Camera className="w-8 h-8 text-neutral-400 mb-2" />
              <span className="text-xs font-semibold text-neutral-200">
                Document {docType} détecté & pré-chargé
              </span>
              <span className="text-[11px] text-neutral-500 mt-1">
                Recto-verso analysé : Date de naissance certifiée (Âge &gt; 18 ans)
              </span>
            </div>

            <button
              onClick={handleStartBiometrics}
              className="w-full py-3 px-4 rounded-xl font-medium text-xs text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
            >
              <span>Continuer vers le Test Biométrique (Selfie 3D)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Biometric Liveness test */}
        {step === 2 && (
          <div className="space-y-4 text-center">
            <div className="relative w-44 h-44 mx-auto rounded-full border-2 border-dashed border-amber-400/80 p-2 flex items-center justify-center bg-neutral-950">
              {isVerifying ? (
                <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
              ) : null}
              <div className="w-full h-full rounded-full bg-neutral-900 flex flex-col items-center justify-center overflow-hidden">
                <Camera className="w-10 h-10 text-amber-400/80 mb-2" />
                <span className="text-[11px] text-neutral-300 px-4">
                  {isVerifying ? 'Analyse anti-deepfake...' : 'Centrez votre visage'}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              L'IA certifie en temps réel que vous êtes une personne vivante et physique correspondant à la pièce d'identité officielle.
            </p>

            <button
              onClick={handleSimulateLiveness}
              disabled={isVerifying}
              className="w-full py-3 px-4 rounded-xl font-medium text-xs text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <span>Vérification biométrique en cours...</span>
              ) : (
                <span>Déclencher le scan biométrique</span>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Verified Badge */}
        {step === 3 && (
          <div className="space-y-4 text-center py-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-semibold text-neutral-100">Identité Certifiée avec Succès !</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Statut Créateur VIP approuvé. Âge certifié conforme (18+). Le badge de sécurité est désormais affiché sur votre profil et vos flux en direct.
              </p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-left font-mono text-[11px] text-neutral-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Document :</span>
                <span>{docType} ({country})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Âge certifié :</span>
                <span className="text-emerald-400 font-bold">23 ans (18+ Confirmé)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Confiance Anti-Deepfake :</span>
                <span className="text-emerald-400">99.8% Liveness OK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">ID Vérification :</span>
                <span>KYC-2026-XOF-9912</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 px-4 rounded-xl font-medium text-xs text-neutral-950 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2"
            >
              <span>Accéder à mon Espace Créateur</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
