import React, { useState } from 'react';
import { UserPlus, ShieldAlert, ChevronDown, Check, LogOut, Wallet } from 'lucide-react';
import { UserRole } from '../types';
import { formatXofForUserCountry } from '../services/currencyService';

interface NavbarProps {
  activeTab: 'feed' | 'live' | 'challenges' | 'dashboard' | 'admin' | 'cto';
  onSelectTab: (tab: 'feed' | 'live' | 'challenges' | 'dashboard' | 'admin' | 'cto') => void;
  onOpenRegisterModal: () => void;
  pendingKycCount: number;
  currentRole: UserRole;
  onSwitchUserRole: (role: UserRole) => void;
  activeUserName: string;
  isAdminAuthenticated: boolean;
  onAdminLogout: () => void;
  activeUserCountry?: string;
  activeUserCurrency?: string;
  onOpenTopUpModal?: () => void;
  viewerBalance?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenRegisterModal,
  pendingKycCount,
  currentRole,
  onSwitchUserRole,
  activeUserName,
  isAdminAuthenticated,
  onAdminLogout,
  activeUserCountry,
  activeUserCurrency,
  onOpenTopUpModal,
  viewerBalance,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/85 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single text element Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('feed')}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-1.5 focus:outline-none"
          >
            <span className="text-amber-400">AuraVibe</span>
            <span className="text-xs bg-amber-400/10 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-400/30">
              VIP
            </span>
          </button>

          {activeUserCurrency && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-neutral-400">{activeUserCountry?.substring(0, 15)}</span>
              <span className="font-bold text-amber-400">{activeUserCurrency}</span>
            </div>
          )}
        </div>

        {/* Zone 2: 4–5 single-line clean text nav links (ADMIN IS INVISIBLE TO NORMAL USERS) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-neutral-400">
          <button
            onClick={() => onSelectTab('feed')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-neutral-100 ${
              activeTab === 'feed' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Feed Vidéos
          </button>
          <button
            onClick={() => onSelectTab('live')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-neutral-100 ${
              activeTab === 'live' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Live VIP
          </button>
          <button
            onClick={() => onSelectTab('challenges')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-neutral-100 ${
              activeTab === 'challenges' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Challenges Escrow
          </button>
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-neutral-100 ${
              activeTab === 'dashboard' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Finances Créateur
          </button>

          {/* ADMIN LINK: ONLY VISIBLE WHEN ADMINISTRATOR IS AUTHENTICATED */}
          {isAdminAuthenticated && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-neutral-100 flex items-center gap-1.5 ${
                activeTab === 'admin' ? 'text-purple-400 font-semibold' : 'text-purple-300/80'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Administration</span>
              {pendingKycCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-500 text-neutral-950">
                  {pendingKycCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => onSelectTab('cto')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-neutral-100 ${
              activeTab === 'cto' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Console CTO
          </button>
        </nav>

        {/* Zone 3: 1 primary action lockup with Role switcher & Create Account / Admin Logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Wallet Top-up button for viewers */}
          {currentRole === 'viewer' && onOpenTopUpModal && (
            <button
              onClick={onOpenTopUpModal}
              className="px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono flex items-center gap-1.5 transition-colors shadow-sm"
              title="Recharger mon solde instantanément"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold tabular-nums">
                {formatXofForUserCountry(viewerBalance || 0, activeUserCurrency || 'CDF')}
              </span>
              <span className="text-[10px] bg-amber-400 text-neutral-950 font-extrabold rounded px-1 py-0.2">
                +
              </span>
            </button>
          )}

          {/* User Profile Switcher (Only shows public profiles: Viewer vs Creator) */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="px-2.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-neutral-700 text-neutral-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${isAdminAuthenticated && currentRole === 'admin' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
              <span className="hidden sm:inline font-semibold">
                {isAdminAuthenticated && currentRole === 'admin'
                  ? 'Session Admin'
                  : currentRole === 'creator'
                  ? 'Créateur'
                  : 'Visionneur (1,99$)'}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 shadow-2xl z-50 text-xs space-y-1">
                <span className="text-[10px] text-neutral-500 px-2 py-1 block uppercase font-mono font-semibold">
                  Profil Actif :
                </span>

                <button
                  onClick={() => {
                    onSwitchUserRole('viewer');
                    onSelectTab('feed');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between transition-colors ${
                    currentRole === 'viewer' ? 'bg-amber-400/10 text-amber-300 font-semibold' : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>Visionneur VIP</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Pass 1,99$ Activé</span>
                  </div>
                  {currentRole === 'viewer' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                <button
                  onClick={() => {
                    onSwitchUserRole('creator');
                    onSelectTab('dashboard');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between transition-colors ${
                    currentRole === 'creator' ? 'bg-amber-400/10 text-amber-300 font-semibold' : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>Créateur de Contenu</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Espace Revenus & Payout</span>
                  </div>
                  {currentRole === 'creator' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {isAdminAuthenticated && (
                  <button
                    onClick={() => {
                      onSwitchUserRole('admin');
                      onSelectTab('admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between transition-colors ${
                      currentRole === 'admin' ? 'bg-purple-500/15 text-purple-300 font-semibold' : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1">
                        <span>Console Administrateur</span>
                        {pendingKycCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                        )}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">Session Sécurisée</span>
                    </div>
                    {currentRole === 'admin' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* If Admin is logged in, show Logout Admin button */}
          {isAdminAuthenticated ? (
            <button
              onClick={onAdminLogout}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
              title="Quitter la session administrateur"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion Admin</span>
            </button>
          ) : (
            /* Primary Public Action: Créer un Compte */
            <button
              onClick={onOpenRegisterModal}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-md shadow-amber-500/15 active:scale-[0.98]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Créer un Compte</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
