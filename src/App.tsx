/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { FeedView } from './components/FeedView';
import { LiveView } from './components/LiveView';
import { ChallengesView } from './components/ChallengesView';
import { CreatorDashboard } from './components/CreatorDashboard';
import { AdminConsoleView } from './components/AdminConsoleView';
import { AdminLoginPortal } from './components/AdminLoginPortal';
import { CtoArchitectureView } from './components/CtoArchitectureView';
import { KycVerificationModal } from './components/KycVerificationModal';
import { RegisterModal } from './components/RegisterModal';
import { TopUpModal } from './components/TopUpModal';
import {
  CURRENT_CREATOR,
  CURRENT_VIEWER,
  MASTER_ADMIN,
  MOCK_TRANSACTIONS,
  INITIAL_KYC_REQUESTS,
  MOCK_VIDEOS,
} from './data/mockData';
import { TransactionRecord, GiftTier, Challenge, User, KycSubmissionRequest, UserRole, AdminConfig, VideoItem } from './types';
import { getCurrencyForCountry, getAdaptedPassPrice, formatXofForUserCountry } from './services/currencyService';
import {
  Compass,
  Radio,
  Trophy,
  Wallet,
  Cpu,
  Zap,
  CheckCircle2,
  X,
  ShieldAlert,
  Lock,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'live' | 'challenges' | 'dashboard' | 'admin' | 'admin_login' | 'cto'>('feed');
  const [currentRole, setCurrentRole] = useState<UserRole>('viewer');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Configuration personnalisée de l'administrateur maître (email, mot de passe et code secret choisi exclusivement par l'utilisateur)
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => {
    const saved = localStorage.getItem('auravibe_admin_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email && parsed.secretAccessCode && parsed.isConfigured) {
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    return {
      email: '',
      password: '',
      secretAccessCode: '',
      isConfigured: false,
      configuredAt: '',
    };
  });

  // Core entities
  const [creator, setCreator] = useState<User>(CURRENT_CREATOR);
  const [viewer, setViewer] = useState<User>(CURRENT_VIEWER);
  const [admin, setAdmin] = useState<User>(() => ({
    ...MASTER_ADMIN,
    email: '',
  }));
  const [transactions, setTransactions] = useState<TransactionRecord[]>(MOCK_TRANSACTIONS);
  const [kycRequests, setKycRequests] = useState<KycSubmissionRequest[]>(INITIAL_KYC_REQUESTS);
  const [videos, setVideos] = useState<VideoItem[]>(MOCK_VIDEOS);

  // Modals
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const handleUpdateAdminConfig = (newConfig: AdminConfig) => {
    setAdminConfig(newConfig);
    localStorage.setItem('auravibe_admin_config', JSON.stringify(newConfig));
    setAdmin((prev) => ({
      ...prev,
      email: newConfig.email,
      displayName: `Admin Maître (${newConfig.email.split('@')[0]})`,
    }));
    showToast(`🔐 Identifiants et Code Secret d'Administration enregistrés avec succès !`);
  };

  const handleResetAdminConfig = () => {
    localStorage.removeItem('auravibe_admin_config');
    setAdminConfig({
      email: '',
      password: '',
      secretAccessCode: '',
      isConfigured: false,
      configuredAt: '',
    });
    setIsAdminAuthenticated(false);
    if (currentRole === 'admin') {
      setCurrentRole('viewer');
      setActiveTab('feed');
    }
    showToast('🔄 Identifiants Admin réinitialisés. Définissez votre adresse email et code secret selon vos choix.');
  };

  const showToast = (message: string) => {
    setToastNotification(message);
    setTimeout(() => {
      setToastNotification(null);
    }, 5000);
  };

  // 1. Inscription d'un nouvel utilisateur (Visionneur ou Créateur dans sa devise locale)
  const handleUserRegistered = (newUser: User, kycRequest?: KycSubmissionRequest) => {
    const userCurrency = newUser.currency || getCurrencyForCountry(newUser.country).code;
    const passInfo = getAdaptedPassPrice(userCurrency);

    if (newUser.role === 'viewer') {
      setViewer(newUser);
      setCurrentRole('viewer');
      setActiveTab('feed');

      const passTx: TransactionRecord = {
        id: `tx_${Date.now()}`,
        reference: `AV-PASS-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'Pass_Visionneur_1_99',
        grossAmountXof: 1250, // Équivalent 1,99 USD base
        creatorNetAmountXof: 0,
        platformFeeAmountXof: 1250,
        currency: userCurrency,
        status: 'complete',
        payerName: `${newUser.displayName} (${newUser.country})`,
        paymentGateway: 'Nyole_MobileMoney',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: `Pass Visionneur VIP (${passInfo.formatted} · ~1,99 $) réglé et activé (${newUser.country})`,
        idempotencyKey: `idem_pass_${Date.now()}`,
      };

      setTransactions((prev) => [passTx, ...prev]);
      if (!adminConfig.isConfigured) {
        showToast(`🎉 Bienvenue ${newUser.displayName} ! Pass Visionneur (${passInfo.formatted}) activé. 👑 Ce premier compte devient l'Administrateur Maître ! Devise : ${userCurrency}`);
      } else {
        showToast(`🎉 Bienvenue ${newUser.displayName} ! Pass Visionneur (${passInfo.formatted}) activé. Devise configurée : ${userCurrency} (${newUser.country}).`);
      }
    } else {
      setCreator(newUser);
      setCurrentRole('creator');
      setActiveTab('dashboard');

      if (kycRequest) {
        setKycRequests((prev) => [kycRequest, ...prev]);
      }

      if (!adminConfig.isConfigured) {
        showToast(`⏳ Compte Créateur @${newUser.username} (${newUser.country}) créé ! 👑 Ce premier compte devient l'Administrateur Maître. Devise : ${userCurrency}.`);
      } else {
        showToast(`⏳ Compte Créateur @${newUser.username} (${newUser.country}) créé ! Devise de paiement : ${userCurrency}. En attente de validation d'identité.`);
      }
    }
  };

  // 2. Connexion Administrateur sécurisée via portail dédié
  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setCurrentRole('admin');
    setActiveTab('admin');
    showToast('🔐 Connexion Administrateur validée (2FA TOTP vérifié). Espace de gestion générale déverrouillé.');
  };

  // 3. Déconnexion Administrateur
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentRole('viewer');
    setActiveTab('feed');
    showToast('🔒 Session Administrateur fermée. Retour au mode public sécurisé.');
  };

  // 4. Action Admin : Approbation d'un créateur en attente
  const handleApproveCreator = (requestId: string) => {
    const targetRequest = kycRequests.find((r) => r.id === requestId);
    if (!targetRequest) return;

    setKycRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approuve' as const } : r))
    );

    if (creator.id === targetRequest.creatorId || creator.username === targetRequest.creatorUsername) {
      setCreator((prev) => ({
        ...prev,
        creatorApprovalStatus: 'approuve',
        kycStatus: 'valide',
      }));
    }

    showToast(`✓ Succès Admin : Créateur @${targetRequest.creatorUsername} certifié 18+ et activé sur la plateforme !`);
  };

  // 5. Action Admin : Rejet d'un dossier KYC avec motif
  const handleRejectCreator = (requestId: string, reason: string) => {
    setKycRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejete' as const, rejectionReason: reason } : r))
    );
    showToast(`Dossier rejeté par l'Admin : ${reason}`);
  };

  // 6. Cadeau & Split
  const handleSendGift = (gift: GiftTier, split: { creatorNet: number; platformFee: number }) => {
    setCreator((prev) => ({
      ...prev,
      balanceXof: prev.balanceXof + split.creatorNet,
    }));

    setViewer((prev) => ({
      ...prev,
      balanceXof: Math.max(0, prev.balanceXof - gift.amountXof),
    }));

    const newTx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      reference: `AV-GIFT-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'Cadeau_Live',
      grossAmountXof: gift.amountXof,
      creatorNetAmountXof: split.creatorNet,
      platformFeeAmountXof: split.platformFee,
      currency: activeUserCurrency,
      status: 'complete',
      creatorId: creator.id,
      payerName: activeUser.displayName,
      paymentGateway: 'Nyole_MobileMoney',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes: `Cadeau "${gift.name}" envoyé avec split instantané 85/15`,
      idempotencyKey: `idem_${Date.now()}`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    showToast(`⚡ Split Exécuté : +${formatXofForUserCountry(split.creatorNet, activeUserCurrency)} crédités au créateur (85%) · ${formatXofForUserCountry(split.platformFee, activeUserCurrency)} retenus (15%)`);
  };

  // 7. Validation Défi & Séquestre
  const handleChallengeSplit = (challenge: Challenge, split: { creatorNet: number; platformFee: number }) => {
    setCreator((prev) => ({
      ...prev,
      balanceXof: prev.balanceXof + split.creatorNet,
      escrowPendingXof: Math.max(0, prev.escrowPendingXof - challenge.bountyAmountXof),
    }));

    const newTx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      reference: `AV-SPLT-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'Challenge_Escrow',
      grossAmountXof: challenge.bountyAmountXof,
      creatorNetAmountXof: split.creatorNet,
      platformFeeAmountXof: split.platformFee,
      currency: activeUserCurrency,
      status: 'complete',
      creatorId: creator.id,
      payerName: challenge.sponsorName,
      paymentGateway: 'Nyole_MobileMoney',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes: `Déblocage Séquestre : Défi "${challenge.title}" validé`,
      idempotencyKey: `idem_challenge_${challenge.id}`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    showToast(`✓ Défi Validé : Séquestre libéré ! +${formatXofForUserCountry(split.creatorNet, activeUserCurrency)} transférés au solde retirable`);
  };

  // 8. Retrait Mobile Money
  const handlePayoutSuccess = (payoutTx: TransactionRecord) => {
    setCreator((prev) => ({
      ...prev,
      balanceXof: Math.max(0, prev.balanceXof - payoutTx.grossAmountXof),
    }));
    setTransactions((prev) => [payoutTx, ...prev]);
    showToast(`💸 Virement Exécuté : -${formatXofForUserCountry(payoutTx.grossAmountXof, activeUserCurrency)} transférés via l’API Nyole`);
  };

  // 9. Recharge Portefeuille Visionneur via Nyole
  const handleTopUpSuccess = (amountXof: number, gateway: string, reference: string) => {
    setViewer((prev) => ({
      ...prev,
      balanceXof: prev.balanceXof + amountXof,
    }));

    const topUpTx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      reference,
      type: 'Recharge_Portefeuille',
      grossAmountXof: amountXof,
      creatorNetAmountXof: 0,
      platformFeeAmountXof: 0,
      currency: activeUserCurrency,
      status: 'complete',
      payerName: `${viewer.displayName} (${viewer.country})`,
      paymentGateway: gateway.includes('CARD') ? 'Carte_Bancaire' : 'Nyole_MobileMoney',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes: `Recharge de portefeuille instantanée (${gateway})`,
      idempotencyKey: `idem_topup_${Date.now()}`,
    };

    setTransactions((prev) => [topUpTx, ...prev]);
    showToast(`⚡ Portefeuille Rechargé : +${formatXofForUserCountry(amountXof, activeUserCurrency)} ajoutés à votre solde via Nyole !`);
  };

  // 10. Déblocage Vidéo Paywall (Split 85/15 déterministe)
  const handleUnlockVideo = (video: VideoItem): boolean => {
    const unlockPrice = video.priceXof || 1500;
    if (viewer.balanceXof < unlockPrice) {
      showToast(`⚠️ Solde insuffisant (${formatXofForUserCountry(viewer.balanceXof, activeUserCurrency)}). Veuillez recharger votre portefeuille pour débloquer cette vidéo.`);
      setIsTopUpModalOpen(true);
      return false;
    }

    const creatorNet = Math.round(unlockPrice * 0.85);
    const platformFee = unlockPrice - creatorNet;

    setViewer((prev) => ({
      ...prev,
      balanceXof: Math.max(0, prev.balanceXof - unlockPrice),
    }));

    setCreator((prev) => ({
      ...prev,
      balanceXof: prev.balanceXof + creatorNet,
    }));

    const unlockTx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      reference: `AV-UNLK-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'Deblocage_Video',
      grossAmountXof: unlockPrice,
      creatorNetAmountXof: creatorNet,
      platformFeeAmountXof: platformFee,
      currency: activeUserCurrency,
      status: 'complete',
      creatorId: video.creatorId,
      payerName: viewer.displayName,
      paymentGateway: 'Nyole_MobileMoney',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes: `Accès PPV vidéo débloqué "${video.title}" (Split 85/15)`,
      idempotencyKey: `idem_unlock_${video.id}_${Date.now()}`,
    };

    setTransactions((prev) => [unlockTx, ...prev]);
    showToast(`🔓 Vidéo Débloquée ! +${formatXofForUserCountry(creatorNet, activeUserCurrency)} reversés à ${video.creatorName} (85%) · Frais Plateforme 15%`);
    return true;
  };

  // 11. Publication Vidéo par un Créateur
  const handlePublishVideo = (newVideo: VideoItem) => {
    setVideos((prev) => [newVideo, ...prev]);
    showToast(`🎬 Vidéo "${newVideo.title}" publiée avec succès dans le Feed VIP (Chiffrement HLS AES-128 activé) !`);
  };

  const handleKycComplete = () => {
    setCreator((prev) => ({ ...prev, kycStatus: 'valide', creatorApprovalStatus: 'approuve' }));
    showToast('🎉 Certification 18+ Approuvée : Badge Créateur VIP débloqué.');
  };

  const pendingKycCount = kycRequests.filter((r) => r.status === 'en_attente_admin').length;
  const activeUser = currentRole === 'admin' ? admin : currentRole === 'creator' ? creator : viewer;
  const activeUserCurrency = activeUser.currency || getCurrencyForCountry(activeUser.country).code;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-400/20 selection:text-amber-300 pb-20 md:pb-6">
      {/* Top Bar Navigation (Admin option is invisible to normal users) */}
      <Navbar
        activeTab={activeTab === 'admin_login' ? 'feed' : activeTab}
        onSelectTab={(tab) => {
          if (tab === 'admin' && !isAdminAuthenticated) {
            setActiveTab('admin_login');
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        pendingKycCount={pendingKycCount}
        currentRole={currentRole}
        onSwitchUserRole={setCurrentRole}
        activeUserName={activeUser.displayName}
        activeUserCountry={activeUser.country}
        activeUserCurrency={activeUserCurrency}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
        viewerBalance={viewer.balanceXof}
        onOpenTopUpModal={() => setIsTopUpModalOpen(true)}
      />

      {/* Floating Global Toast Notification */}
      {toastNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-neutral-900/95 border border-amber-500/40 text-neutral-100 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="leading-snug">{toastNotification}</span>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full px-3 sm:px-6 py-4">
        {/* DEDICATED ADMIN LOGIN PORTAL */}
        {activeTab === 'admin_login' && (
          <AdminLoginPortal
            adminConfig={adminConfig}
            onUpdateAdminConfig={handleUpdateAdminConfig}
            onLoginSuccess={handleAdminLoginSuccess}
            onBackToPublicSite={() => setActiveTab('feed')}
            onResetAdminConfig={handleResetAdminConfig}
          />
        )}

        {/* FEED VIEW */}
        {activeTab === 'feed' && (
          <FeedView
            videos={videos}
            onSendGiftToCreator={handleSendGift}
            viewerBalance={viewer.balanceXof}
            userCurrency={activeUserCurrency}
            activeUserName={activeUser.displayName}
            onUnlockVideo={handleUnlockVideo}
            onOpenTopUpModal={() => setIsTopUpModalOpen(true)}
          />
        )}

        {/* LIVE VIEW */}
        {activeTab === 'live' && (
          <LiveView
            onSendLiveGift={handleSendGift}
            userCurrency={activeUserCurrency}
            activeUserName={activeUser.displayName}
          />
        )}

        {/* CHALLENGES VIEW */}
        {activeTab === 'challenges' && (
          <ChallengesView
            onChallengeSplitExecuted={handleChallengeSplit}
            creatorBalance={creator.balanceXof}
            creatorEscrow={creator.escrowPendingXof}
            userCurrency={activeUserCurrency}
          />
        )}

        {/* CREATOR DASHBOARD */}
        {activeTab === 'dashboard' && (
          <CreatorDashboard
            creator={creator}
            transactions={transactions}
            onPayoutSuccess={handlePayoutSuccess}
            onOpenKycModal={() => setIsKycModalOpen(true)}
            onPublishVideo={handlePublishVideo}
          />
        )}

        {/* ADMIN CONSOLE VIEW (ONLY ACCESSIBLE ONCE AUTHENTICATED) */}
        {activeTab === 'admin' && (
          isAdminAuthenticated ? (
            <AdminConsoleView
              adminUser={admin}
              kycRequests={kycRequests}
              onApproveCreator={handleApproveCreator}
              onRejectCreator={handleRejectCreator}
              transactions={transactions}
              allUsersCount={kycRequests.length + 1}
              adminConfig={adminConfig}
              onUpdateAdminConfig={handleUpdateAdminConfig}
              onResetAdminConfig={handleResetAdminConfig}
            />
          ) : (
            <AdminLoginPortal
              adminConfig={adminConfig}
              onUpdateAdminConfig={handleUpdateAdminConfig}
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToPublicSite={() => setActiveTab('feed')}
              onResetAdminConfig={handleResetAdminConfig}
            />
          )
        )}

        {/* CTO ARCHITECTURE VIEW */}
        {activeTab === 'cto' && <CtoArchitectureView />}
      </main>

      {/* Discrete Footer with Staff/Admin access link */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2 border-t border-neutral-900 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px]">
          <span>© 2026 AuraVibe VIP Inc.</span>
          <span aria-hidden="true">·</span>
          <span>Protection 18+ Certifiée</span>
          <span aria-hidden="true">·</span>
          <span>Streaming Chiffré HLS AES-128</span>
          <span aria-hidden="true">·</span>
          <span>Rails Sécurisés Nyole (Mobile Money & Cartes CB)</span>
        </div>

        {/* Discreet Staff Portal Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isAdminAuthenticated) {
                setActiveTab('admin');
              } else {
                setActiveTab('admin_login');
              }
            }}
            className="text-[11px] text-neutral-600 hover:text-neutral-400 font-mono transition-colors flex items-center gap-1.5 focus:outline-none"
            title="Accès réservé au personnel administratif d'AuraVibe VIP"
          >
            <Lock className="w-3 h-3 text-neutral-600" />
            <span>Portail Staff & Administration</span>
          </button>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar (NEVER shows Admin unless authenticated) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/90 backdrop-blur-md border-t border-neutral-800 px-2 py-1.5">
        <div className={`grid ${isAdminAuthenticated ? 'grid-cols-5' : 'grid-cols-5'} items-center h-14`}>
          <button
            onClick={() => setActiveTab('feed')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'feed' ? 'text-amber-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] mt-1">Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'live' ? 'text-amber-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            <Radio className="w-5 h-5" />
            <span className="text-[10px] mt-1">Live</span>
          </button>

          <button
            onClick={() => setActiveTab('challenges')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'challenges' ? 'text-amber-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] mt-1">Défis</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'dashboard' ? 'text-amber-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] mt-1">Créateur</span>
          </button>

          {isAdminAuthenticated ? (
            <button
              onClick={() => setActiveTab('admin')}
              className={`min-h-[44px] flex flex-col items-center justify-center transition-colors relative ${
                activeTab === 'admin' ? 'text-purple-400 font-semibold' : 'text-neutral-400'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span className="text-[10px] mt-1">Admin</span>
              {pendingKycCount > 0 && (
                <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              )}
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('cto')}
              className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
                activeTab === 'cto' ? 'text-amber-400 font-semibold' : 'text-neutral-400'
              }`}
            >
              <Cpu className="w-5 h-5" />
              <span className="text-[10px] mt-1">CTO</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Creation Modal (Viewer $1.99 vs Free Creator Pending Admin KYC) */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onUserRegistered={handleUserRegistered}
        isFirstAccountCreated={!adminConfig.isConfigured}
        onSetupFirstAdmin={handleUpdateAdminConfig}
      />

      {/* Automated KYC 18+ Verification Modal */}
      <KycVerificationModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        onComplete={handleKycComplete}
      />

      {/* Wallet Top-Up Modal (Nyole Mobile Money & Cartes Bancaires) */}
      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        onTopUpSuccess={handleTopUpSuccess}
        userCurrency={activeUserCurrency}
        userCountry={activeUser.country}
      />
    </div>
  );
}
