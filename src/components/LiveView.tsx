import React, { useState, useEffect, useRef } from 'react';
import { GiftTier } from '../types';
import { GIFT_TIERS } from '../data/mockData';
import { GiftModal } from './GiftModal';
import {
  Radio,
  Users,
  Shield,
  Send,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Heart,
  Gift,
} from 'lucide-react';

import { formatXofForUserCountry } from '../services/currencyService';

interface LiveViewProps {
  onSendLiveGift: (gift: GiftTier, split: { creatorNet: number; platformFee: number }) => void;
  userCurrency?: string;
  activeUserName?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isGift?: boolean;
  giftIcon?: string;
  giftAmount?: number;
  time: string;
}

const LIVE_QUICK_REACTIONS = ['🔥', '❤️', '👏', '👑', '🍾', '💎'];

export const LiveView: React.FC<LiveViewProps> = ({
  onSendLiveGift,
  userCurrency = 'CDF',
  activeUserName = 'Cédric VIP',
}) => {
  const [viewersCount, setViewersCount] = useState(3842);
  const [isMuted, setIsMuted] = useState(false);
  const [recentGiftBanner, setRecentGiftBanner] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [liveGrossTotal, setLiveGrossTotal] = useState(245000); // Base live revenue
  const [isFullGiftModalOpen, setIsFullGiftModalOpen] = useState(false);

  // Live Likes feature
  const [liveLikes, setLiveLikes] = useState(14820);
  const [hasLikedLive, setHasLikedLive] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; left: number }>>([]);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Ibrahim_Abidjan', text: 'Bonsoir Sarah ! Le son est ultra propre ce soir 🎙️', time: '21:04' },
    { id: '2', sender: 'Fatou_Dakar', text: 'Merci pour les conseils sur la monétisation Mobile Money !', time: '21:05' },
    { id: '3', sender: 'Stephane_VIP', text: 'Superbe studio, hâte de voir le challenge exclusif de 22h', time: '21:05' },
    { id: '4', sender: 'Marc_K', text: 'Cadeau envoyé pour débloquer la suite du live !', isGift: true, giftIcon: '🍾', giftAmount: 15000, time: '21:06' },
  ]);

  // Viewers fluctuation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setViewersCount((prev) => prev + Math.floor(Math.random() * 11) - 5);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: activeUserName || 'Vous (Spectateur VIP)',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  const handleSendReaction = (emoji: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: activeUserName || 'Vous (VIP)',
      text: `${emoji} ${emoji} ${emoji}`,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  // 1. LIVE LIKES INTERACTION (STREAM HEARTS)
  const handleTriggerLiveLike = () => {
    setLiveLikes((prev) => prev + 1);
    setHasLikedLive(true);

    const newHeart = {
      id: Date.now() + Math.random(),
      left: Math.floor(20 + Math.random() * 60),
    };
    setFloatingHearts((prev) => [...prev.slice(-12), newHeart]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1800);
  };

  // 2. GIFT DISPATCH
  const handleTriggerGift = (gift: GiftTier) => {
    const creatorNet = Math.round(gift.amountXof * 0.85);
    const platformFee = gift.amountXof - creatorNet;

    setLiveGrossTotal((prev) => prev + gift.amountXof);

    // Banner alert
    setRecentGiftBanner(`${gift.icon} ${activeUserName || 'Vous'} avez envoyé ${gift.name} (${formatXofForUserCountry(gift.amountXof, userCurrency)}) !`);
    setTimeout(() => setRecentGiftBanner(null), 3500);

    // Chat message
    const giftMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: activeUserName || 'Vous',
      text: `a offert un(e) ${gift.name} ! Split exécuté : +${formatXofForUserCountry(creatorNet, userCurrency)} au créateur`,
      isGift: true,
      giftIcon: gift.icon,
      giftAmount: gift.amountXof,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, giftMsg]);

    onSendLiveGift(gift, { creatorNet, platformFee });
  };

  const liveCreatorNet = Math.round(liveGrossTotal * 0.85);
  const livePlatformCommission = liveGrossTotal - liveCreatorNet;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Top Banner / Stream Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-neutral-100">Live Studio VIP : Sarah Monroe & Guests</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                LIVE HD
              </span>
            </div>
            <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
              <span>WebRTC & CMAF Ultra-Basse Latence (750ms)</span>
              <span>·</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <Shield className="w-3 h-3" /> HLS AES-128 Sécurisé
              </span>
            </p>
          </div>
        </div>

        {/* Viewers & Revenue Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono">
            <Users className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-200 font-bold tabular-nums">
              {viewersCount.toLocaleString('fr-FR')}
            </span>
            <span className="text-neutral-500">spectateurs</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold tabular-nums">
              {formatXofForUserCountry(liveGrossTotal, userCurrency)}
            </span>
            <span className="text-neutral-400 text-[10px]">(85% Créateur)</span>
          </div>
        </div>
      </div>

      {/* Main Studio Viewport & Chat Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Main Live Video Canvas */}
        <div className="lg:col-span-2 relative aspect-[16/10] sm:aspect-[16/9] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex flex-col justify-between shadow-2xl select-none">
          {/* Background Live Stream Frame */}
          <div className="absolute inset-0">
            <img
              src="/src/assets/images/auravibe_live_stream_1793709855515.jpg"
              alt="Live VIP Studio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />
          </div>

          {/* Floating Hearts Stream Animation */}
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              style={{
                left: `${heart.left}%`,
                bottom: '15%',
              }}
              className="absolute pointer-events-none z-20 animate-fade-in"
            >
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500 drop-shadow-lg opacity-85 transition-all transform -translate-y-24 scale-125 duration-1000" />
            </div>
          ))}

          {/* Dynamic Watermark Overlay */}
          <div className="absolute top-4 right-4 pointer-events-none text-[10px] font-mono text-white/40 tracking-wider bg-black/40 px-2 py-0.5 rounded border border-white/10">
            STREAM-ID: LIVE-CI-8812 · VIEWER: 98124 · CMAF SECURE
          </div>

          {/* Top Live Badge */}
          <div className="relative z-10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-xs text-white">
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span className="font-semibold">EN DIRECT</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80 transition-colors"
                title={isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Floating Gift Banner Animation */}
          {recentGiftBanner && (
            <div className="relative z-20 mx-4 self-center py-2 px-4 rounded-full bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-neutral-950 font-bold text-xs shadow-xl animate-bounce flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{recentGiftBanner}</span>
            </div>
          )}

          {/* Bottom Live Split Telemetry & Floating Heart Action */}
          <div className="relative z-10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white text-xs">
            <div className="space-y-0.5">
              <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
                <span>Sarah Monroe VIP</span>
                <span className="text-amber-400 font-mono text-[11px] font-normal">@sarah_live</span>
              </div>
              <p className="text-[11px] text-neutral-300">
                Salon Privé · Échange interactif & Déblocage des défis en direct
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Telemetry card */}
              <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-xl p-2.5 flex items-center gap-4 font-mono text-[11px]">
                <div>
                  <span className="text-neutral-400 block text-[9px]">WALLET CRÉATEUR (85%)</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    +{formatXofForUserCountry(liveCreatorNet, userCurrency)}
                  </span>
                </div>
                <div className="border-l border-white/20 pl-3">
                  <span className="text-neutral-400 block text-[9px]">COMMISSION (15%)</span>
                  <span className="text-neutral-300 font-semibold tabular-nums">
                    {formatXofForUserCountry(livePlatformCommission, userCurrency)}
                  </span>
                </div>
              </div>

              {/* Live Likes interactive heart button */}
              <button
                type="button"
                onClick={handleTriggerLiveLike}
                className={`p-3 rounded-2xl backdrop-blur-md border transition-all active:scale-125 flex items-center gap-1.5 ${
                  hasLikedLive
                    ? 'bg-rose-500/90 border-rose-400 text-white shadow-lg shadow-rose-500/40'
                    : 'bg-black/60 border-white/20 text-neutral-200 hover:text-rose-400 hover:border-rose-400/50'
                }`}
                title="Aimer le live"
              >
                <Heart className={`w-5 h-5 ${hasLikedLive ? 'fill-current' : ''}`} />
                <span className="font-mono text-xs font-bold tabular-nums">
                  {liveLikes.toLocaleString('fr-FR')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Live Chat & Quick Gift Rail */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col h-[520px] lg:h-auto overflow-hidden">
          {/* Chat Header */}
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-200">Chat du Live VIP</span>
            <span className="text-[11px] text-neutral-400 font-mono">Modération active</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-xl transition-all ${
                  msg.isGift
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                    : 'bg-neutral-950/40 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-0.5 font-mono">
                  <span className={`font-semibold ${msg.isGift ? 'text-amber-400' : 'text-neutral-300'}`}>
                    @{msg.sender}
                  </span>
                  <span>{msg.time}</span>
                </div>
                <p className="text-xs leading-relaxed flex items-center gap-1.5">
                  {msg.isGift && <span className="text-base">{msg.giftIcon}</span>}
                  <span>{msg.text}</span>
                </p>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Gift Tiers + Catalog button */}
          <div className="p-2.5 bg-neutral-950 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wide font-medium">
                Cadeaux Instantanés (Split 85/15)
              </span>
              <button
                type="button"
                onClick={() => setIsFullGiftModalOpen(true)}
                className="text-[10px] text-amber-400 hover:underline font-medium flex items-center gap-1"
              >
                <Gift className="w-3 h-3" />
                <span>Tous les cadeaux</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {GIFT_TIERS.slice(0, 4).map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleTriggerGift(g)}
                  className="py-1.5 px-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 rounded-lg text-center transition-all group"
                  title={`${g.name} - ${formatXofForUserCountry(g.amountXof, userCurrency)}`}
                >
                  <span className="text-lg block group-hover:scale-110 transition-transform">{g.icon}</span>
                  <span className="text-[10px] font-mono text-amber-400 font-medium block tabular-nums">
                    {(g.amountXof / 1000).toFixed(0)}k
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Emoji Reaction Strip */}
          <div className="px-2.5 py-1.5 bg-neutral-950 border-t border-neutral-800/60 flex items-center justify-between gap-1">
            {LIVE_QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendReaction(emoji)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-sm transition-transform active:scale-125"
                title={`Envoyer ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendChatMessage} className="p-2.5 border-t border-neutral-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Message en tant que @${activeUserName || 'Vous'}...`}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2.5 rounded-xl bg-amber-400 text-neutral-950 hover:bg-amber-300 transition-colors disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Full Gift Modal for Live */}
      <GiftModal
        isOpen={isFullGiftModalOpen}
        onClose={() => setIsFullGiftModalOpen(false)}
        creatorName="Sarah Monroe VIP"
        creatorSplitRate={0.85}
        userCurrency={userCurrency}
        onSendGift={(gift, split) => {
          handleTriggerGift(gift);
        }}
      />
    </div>
  );
};
