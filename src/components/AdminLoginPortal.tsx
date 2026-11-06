import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  AlertTriangle,
  Sparkles,
  Settings,
  CheckCircle2,
  Key,
  Eye,
  EyeOff,
  RotateCcw,
  Unlock,
  HelpCircle,
} from 'lucide-react';
import { AdminConfig } from '../types';

interface AdminLoginPortalProps {
  adminConfig: AdminConfig;
  onUpdateAdminConfig: (newConfig: AdminConfig) => void;
  onLoginSuccess: () => void;
  onBackToPublicSite: () => void;
  onResetAdminConfig?: () => void;
}

export const AdminLoginPortal: React.FC<AdminLoginPortalProps> = ({
  adminConfig,
  onUpdateAdminConfig,
  onLoginSuccess,
  onBackToPublicSite,
  onResetAdminConfig,
}) => {
  // Mode : 'login' ou 'setup' (pour choisir / modifier ses identifiants)
  const [mode, setMode] = useState<'login' | 'setup'>(
    adminConfig.isConfigured ? 'login' : 'setup'
  );

  // Formulaire de connexion
  const [loginEmail, setLoginEmail] = useState(adminConfig.email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginAccessCode, setLoginAccessCode] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordMismatchHelp, setPasswordMismatchHelp] = useState(false);

  // Visibilité des mots de passe
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showLoginAccessCode, setShowLoginAccessCode] = useState(false);
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCustomAccessCode, setShowCustomAccessCode] = useState(false);

  // Formulaire de configuration / réinitialisation personnalisé
  const [customEmail, setCustomEmail] = useState(adminConfig.email || '');
  const [customPassword, setCustomPassword] = useState(adminConfig.password || '');
  const [customAccessCode, setCustomAccessCode] = useState(adminConfig.secretAccessCode || '');
  const [confirmPassword, setConfirmPassword] = useState(adminConfig.password || '');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Synchronisation dynamique si la configuration admin change
  useEffect(() => {
    if (adminConfig.email) {
      setLoginEmail(adminConfig.email);
      setCustomEmail(adminConfig.email);
    }
    if (adminConfig.password) {
      setCustomPassword(adminConfig.password);
      setConfirmPassword(adminConfig.password);
    }
    if (adminConfig.secretAccessCode) {
      setCustomAccessCode(adminConfig.secretAccessCode);
    }
    if (adminConfig.isConfigured) {
      setMode('login');
    }
  }, [adminConfig]);

  // 1. Validation de la connexion avec les identifiants choisis par l'utilisateur
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPasswordMismatchHelp(false);

    if (!adminConfig.isConfigured) {
      setErrorMessage("Aucun compte administrateur n'a encore été configuré. Cliquez ci-dessous pour choisir vos identifiants.");
      setMode('setup');
      return;
    }

    const cleanInputEmail = loginEmail.trim().toLowerCase();
    const cleanConfigEmail = (adminConfig.email || '').trim().toLowerCase();

    if (cleanInputEmail !== cleanConfigEmail) {
      setErrorMessage(`Adresse email incorrecte (${cleanInputEmail}). L'adresse enregistrée est ${adminConfig.email || 'non définie'}.`);
      return;
    }

    const cleanInputPassword = loginPassword.trim();
    const cleanConfigPassword = (adminConfig.password || '').trim();

    if (cleanInputPassword !== cleanConfigPassword) {
      setErrorMessage('Mot de passe administrateur incorrect.');
      setPasswordMismatchHelp(true);
      return;
    }

    const cleanInputCode = loginAccessCode.trim().toLowerCase();
    const cleanConfigCode = (adminConfig.secretAccessCode || '').trim().toLowerCase();

    if (cleanInputCode !== cleanConfigCode) {
      setErrorMessage(`Code d'accès secret d'administration incorrect.`);
      return;
    }

    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      onLoginSuccess();
    }, 700);
  };

  // Déverrouillage d'urgence avec le Code Secret si le mot de passe est oublié
  const handleUnlockWithSecretCode = () => {
    if (!loginAccessCode.trim()) {
      setErrorMessage("Veuillez saisir votre Code d'Accès Secret ci-dessous pour déverrouiller.");
      return;
    }

    const cleanInputCode = loginAccessCode.trim().toLowerCase();
    const cleanConfigCode = (adminConfig.secretAccessCode || '').trim().toLowerCase();

    if (cleanInputCode === cleanConfigCode) {
      setIsAuthenticating(true);
      setTimeout(() => {
        setIsAuthenticating(false);
        onLoginSuccess();
      }, 700);
    } else {
      setErrorMessage("Le Code d'Accès Secret saisi ne correspond pas à celui configuré.");
    }
  };

  // Basculer vers le mode réinitialisation immédiate du mot de passe
  const handleOpenPasswordReset = () => {
    setCustomEmail(loginEmail.trim() || adminConfig.email || 'ckapimo@gmail.com');
    setCustomPassword('');
    setConfirmPassword('');
    setCustomAccessCode(adminConfig.secretAccessCode || '');
    setErrorMessage(null);
    setPasswordMismatchHelp(false);
    setMode('setup');
  };

  // 2. Enregistrement du choix personnalisé de l'utilisateur (Email, Mot de passe, Code d'accès)
  const handleSaveCustomCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customEmail.trim() || !customEmail.includes('@')) {
      setErrorMessage('Veuillez renseigner une adresse email valide.');
      return;
    }

    if (!customPassword || customPassword.length < 4) {
      setErrorMessage('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    if (customPassword !== confirmPassword) {
      setErrorMessage('Les deux mots de passe saisis ne sont pas identiques.');
      return;
    }

    if (!customAccessCode.trim()) {
      setErrorMessage('Veuillez définir votre propre code d’accès secret.');
      return;
    }

    const updatedConfig: AdminConfig = {
      email: customEmail.trim(),
      password: customPassword,
      secretAccessCode: customAccessCode.trim(),
      isConfigured: true,
      configuredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    onUpdateAdminConfig(updatedConfig);
    setLoginEmail(customEmail.trim());
    setLoginPassword(customPassword);
    setLoginAccessCode(customAccessCode.trim());

    setSaveSuccessMessage('Identifiants et code d’accès enregistrés ! Déverrouillage immédiat...');
    setTimeout(() => {
      setSaveSuccessMessage(null);
      onLoginSuccess();
    }, 900);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-neutral-100 relative overflow-hidden">
        {/* Glow de fond */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 mx-auto flex items-center justify-center shadow-lg shadow-purple-500/10">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-purple-400 block">
              PORTAIL D'ADMINISTRATION EXCLUSIF
            </span>
            <h2 className="text-xl font-bold text-neutral-100 tracking-tight mt-0.5">
              {mode === 'setup'
                ? 'Définir / Réinitialiser Identifiants Admin'
                : 'Connexion Administrateur'}
            </h2>
          </div>

          <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
            {mode === 'setup'
              ? 'Choisissez librement votre adresse email, votre mot de passe et votre code secret.'
              : 'Accès restreint à l’administrateur du site avec vérification du code secret personnel.'}
          </p>
        </div>

        {/* Message d'erreur avec actions directes */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-2.5 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{errorMessage}</span>
            </div>

            {/* Boutons d'aide rapide en cas d'erreur de mot de passe */}
            {passwordMismatchHelp && (
              <div className="pt-2 border-t border-rose-500/20 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleOpenPasswordReset}
                  className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Définir un nouveau mot de passe maintenant (1 Clic)</span>
                </button>

                {adminConfig.secretAccessCode && (
                  <button
                    type="button"
                    onClick={handleUnlockWithSecretCode}
                    className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Déverrouiller directement avec mon Code Secret d'Accès</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {saveSuccessMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* MODE 1 : CONFIGURATION / CHOIX DU CODE D'ACCÈS ET EMAIL PAR L'UTILISATEUR */}
        {mode === 'setup' ? (
          <form onSubmit={handleSaveCustomCredentials} className="space-y-4 text-xs">
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-300 text-[11px] leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-neutral-200 block">
                  Configuration Directe du Compte Administrateur
                </span>
                <span>
                  Définissez un nouveau mot de passe et votre code d'accès secret pour accéder immédiatement à votre espace administrateur.
                </span>
              </div>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1 font-medium">
                Mon Adresse Email Administrateur
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="ex: ckapimo@gmail.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-neutral-200 font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-neutral-400 block mb-1 font-medium">
                  Nouveau Mot de Passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCustomPassword ? 'text' : 'password'}
                    required
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Nouveau mot de passe"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-10 text-neutral-200 font-mono focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomPassword(!showCustomPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    title={showCustomPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showCustomPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium">
                  Confirmer Mot de Passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer mot de passe"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-10 text-neutral-200 font-mono focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    title={showConfirmPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* LE CODE D'ACCÈS SECRET CHOISI PAR L'UTILISATEUR SEUL */}
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-1.5">
              <label className="text-purple-300 font-semibold flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span>Mon Code d'Accès Secret de Connexion</span>
                </span>
                <span className="text-[10px] text-purple-300/80">Choisi par vous</span>
              </label>
              <p className="text-[11px] text-neutral-400 leading-snug">
                Définissez un code secret personnel mémorisable (ex: <span className="font-mono text-purple-300 font-bold">VIP-7788</span>, <span className="font-mono text-purple-300 font-bold">2026ADMIN</span> ou un code PIN).
              </p>
              <div className="relative">
                <input
                  type={showCustomAccessCode ? 'text' : 'password'}
                  required
                  value={customAccessCode}
                  onChange={(e) => setCustomAccessCode(e.target.value)}
                  placeholder="Ex: 884920 ou VIP-7788"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 pr-10 text-amber-300 font-mono text-sm tracking-wider font-bold focus:outline-none focus:border-purple-400 text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowCustomAccessCode(!showCustomAccessCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  title={showCustomAccessCode ? 'Masquer' : 'Afficher'}
                >
                  {showCustomAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {adminConfig.isConfigured && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  className="py-2.5 px-4 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 transition-colors"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-neutral-950 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-300 hover:to-purple-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-[0.99]"
              >
                <span>Enregistrer & Déverrouiller Immédiatement</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* MODE 2 : CONNEXION ADMIN AVEC L'EMAIL, MOT DE PASSE ET CODE SECRET CHOISIS */
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1 font-medium">
                Adresse Email Administrateur
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@domaine.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-neutral-200 font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-neutral-400 font-medium">
                  Mot de Passe
                </label>
                <button
                  type="button"
                  onClick={handleOpenPasswordReset}
                  className="text-[11px] text-purple-400 hover:text-purple-300 hover:underline inline-flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Mot de passe oublié ?</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Entrez votre mot de passe"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-10 text-neutral-200 font-mono focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  title={showLoginPassword ? 'Masquer' : 'Afficher'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* CODE D'ACCÈS SECRET UNIQUE DE L'ADMIN */}
            <div className="p-3 bg-neutral-950 border border-purple-500/30 rounded-2xl space-y-1.5">
              <label className="text-purple-300 font-semibold flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span>Votre Code d'Accès Secret Personnel</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Choisi par vous</span>
              </label>
              <div className="relative">
                <input
                  type={showLoginAccessCode ? 'text' : 'password'}
                  required
                  value={loginAccessCode}
                  onChange={(e) => {
                    setLoginAccessCode(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Entrez votre code secret choisi..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 pr-10 text-neutral-100 font-mono tracking-wider text-center text-sm font-bold focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginAccessCode(!showLoginAccessCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  title={showLoginAccessCode ? 'Masquer' : 'Afficher'}
                >
                  {showLoginAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-neutral-950 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-300 hover:to-purple-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-[0.99] disabled:opacity-50"
            >
              {isAuthenticating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  Vérification du code secret...
                </span>
              ) : (
                <>
                  <span>Déverrouiller l'Espace Administrateur</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Options pour modifier ou réinitialiser ses identifiants à tout moment */}
            <div className="pt-2 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleOpenPasswordReset}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1 hover:underline"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Modifier mon adresse email, mot de passe ou code d'accès</span>
              </button>

              {onResetAdminConfig && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Réinitialiser les identifiants Admin ? Vous pourrez choisir à nouveau une adresse email, mot de passe et un code d'accès secret.")) {
                      onResetAdminConfig();
                      setCustomEmail(loginEmail || 'ckapimo@gmail.com');
                      setCustomPassword('');
                      setConfirmPassword('');
                      setCustomAccessCode('');
                      setLoginPassword('');
                      setLoginAccessCode('');
                      setMode('setup');
                    }
                  }}
                  className="text-[10px] text-neutral-500 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réinitialiser le compte Admin pour tout recommencer</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Back to Public Site */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center">
          <button
            onClick={onBackToPublicSite}
            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la plateforme publique AuraVibe VIP</span>
          </button>
        </div>
      </div>
    </div>
  );
};

