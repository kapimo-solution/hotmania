import React, { useState, useEffect, useRef } from 'react';
import { VideoItem, GiftTier } from '../types';
import { MOCK_VIDEOS } from '../data/mockData';
import { GiftModal } from './GiftModal';
import { formatXofForUserCountry } from '../services/currencyService';
import {
  Heart,
  MessageCircle,
  Share2,
  Gift,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Shield,
  Lock,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Send,
  X,
  Sparkles,
  Zap,
  Smile,
  ThumbsUp,
  Copy,
  Search,
  Wallet,
  AlertCircle,
} from 'lucide-react';

interface FeedComment {
  id: string;
  user: string;
  text: string;
  time: string;
  likes: number;
  hasLiked?: boolean;
  isVip?: boolean;
  avatar?: string;
}

interface FeedViewProps {
  videos?: VideoItem[];
  onSendGiftToCreator: (gift: GiftTier, split: { creatorNet: number; platformFee: number }) => void;
  viewerBalance: number;
  userCurrency?: string;
  activeUserName?: string;
  onUnlockVideo?: (video: VideoItem) => boolean;
  onOpenTopUpModal?: () => void;
}

const INITIAL_COMMENTS_BY_VIDEO: Record<string, FeedComment[]> = {
  vid_001: [
    {
      id: 'c1_1',
      user: 'Marc_Dakar',
      text: 'Incroyable chorégraphie sur le rooftop du Plateau ! Respect pour la qualité du flux 4K 🙌',
      time: 'Il y a 4 min',
      likes: 42,
      isVip: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    },
    {
      id: 'c1_2',
      user: 'Fatou_Babi',
      text: 'Le coucher de soleil sur Abidjan est juste magique, fierté africaine ✨🇨🇮',
      time: 'Il y a 12 min',
      likes: 28,
      isVip: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    },
    {
      id: 'c1_3',
      user: 'Patrick_Kinshasa',
      text: 'Depuis Kinshasa on valide fort ! La qualité sonore et le streaming sont parfaits 🔥',
      time: 'Il y a 25 min',
      likes: 19,
      isVip: false,
    },
    {
      id: 'c1_4',
      user: 'Cedric_VIP',
      text: 'Cadeau envoyé pour débloquer la session VIP suivante ! @Adesuwa au top !',
      time: 'Il y a 40 min',
      likes: 14,
      isVip: true,
    },
  ],
  vid_002: [
    {
      id: 'c2_1',
      user: 'Sophie_Paris',
      text: 'Ambiance tellement chic et intimiste 🍾🥂 Le streaming sécurisé tourne sans accroc.',
      time: 'Il y a 8 min',
      likes: 56,
      isVip: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    },
    {
      id: 'c2_2',
      user: 'Jean_Bruxelles',
      text: 'La qualité du flux chiffré est incroyable, zéro lag depuis l’Europe !',
      time: 'Il y a 18 min',
      likes: 31,
      isVip: true,
    },
    {
      id: 'c2_3',
      user: 'Amadou_Bamako',
      text: 'Magnifique dégustation, quel standing et élégance ✨',
      time: 'Il y a 1 heure',
      likes: 22,
      isVip: false,
    },
  ],
  vid_003: [
    {
      id: 'c3_1',
      user: 'Samuel_Douala',
      text: 'Force au frère camerounais 🇨🇲 Le saut acrobatique est d’une précision chirurgicale !',
      time: 'Il y a 2 min',
      likes: 67,
      isVip: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    },
    {
      id: 'c3_2',
      user: 'Coach_Didier',
      text: 'La technique de réception est parfaite. Séquestre mérité 👏',
      time: 'Il y a 15 min',
      likes: 45,
      isVip: true,
    },
    {
      id: 'c3_3',
      user: 'Aicha_Conakry',
      text: 'Preuve validée par le tiers de confiance, bravo AuraVibe !',
      time: 'Il y a 30 min',
      likes: 38,
      isVip: false,
    },
  ],
};

const QUICK_EMOJI_REACTIONS = [
  '🔥 Masterclass',
  '👑 Reine',
  '👏 Bravo',
  '❤️ Respect',
  '🍾 Ambiance VIP',
  '💎 Pure énergie',
];

export const FeedView: React.FC<FeedViewProps> = ({
  videos,
  onSendGiftToCreator,
  viewerBalance,
  userCurrency = 'CDF',
  activeUserName = 'Cédric VIP',
  onUnlockVideo,
  onOpenTopUpModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(35);

  // Likes state
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ visible: boolean; x: number; y: number } | null>(null);

  // Comments state
  const [commentsByVideo, setCommentsByVideo] = useState<Record<string, FeedComment[]>>(INITIAL_COMMENTS_BY_VIDEO);
  const [newCommentText, setNewCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  // Gifts state
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [extraGiftsCount, setExtraGiftsCount] = useState<Record<string, number>>({});
  const [activeGiftCelebration, setActiveGiftCelebration] = useState<{
    giftName: string;
    giftIcon: string;
    amountFormatted: string;
    creatorName: string;
    senderName: string;
  } | null>(null);

  // Interactive feedback
  const [playPauseFeedback, setPlayPauseFeedback] = useState<'play' | 'pause' | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkPos, setWatermarkPos] = useState({ x: 24, y: 35 });
  const [unlockedVideos, setUnlockedVideos] = useState<Record<string, boolean>>({});

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sourceVideos = videos && videos.length > 0 ? videos : MOCK_VIDEOS;
  const filteredVideos = sourceVideos.filter((v) => {
    const matchesCategory = selectedCategory === 'Tous' || v.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      v.title.toLowerCase().includes(q) ||
      v.creatorName.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const activeVideo = filteredVideos[currentIndex] || sourceVideos[0] || MOCK_VIDEOS[0];
  const isLocked = activeVideo.isVipLocked && !unlockedVideos[activeVideo.id];

  // Dynamic watermark slight oscillation
  useEffect(() => {
    if (!watermarkEnabled) return;
    const interval = setInterval(() => {
      setWatermarkPos({
        x: Math.floor(15 + Math.random() * 50),
        y: Math.floor(20 + Math.random() * 50),
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [watermarkEnabled]);

  // Smooth simulated video progress
  useEffect(() => {
    if (!isPlaying || isLocked) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1.2));
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, isLocked, currentIndex]);

  const handleNext = () => {
    setProgress(0);
    if (currentIndex < filteredVideos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(filteredVideos.length - 1);
    }
  };

  // 1. LIKE TOGGLE
  const handleToggleLike = () => {
    const vidId = activeVideo.id;
    const currentLiked = !!hasLiked[vidId];
    setHasLiked((prev) => ({ ...prev, [vidId]: !currentLiked }));
    setLikes((prev) => {
      const baseCount = prev[vidId] !== undefined ? prev[vidId] : activeVideo.likesCount;
      return {
        ...prev,
        [vidId]: currentLiked ? Math.max(0, baseCount - 1) : baseCount + 1,
      };
    });
  };

  // 2. DOUBLE TAP TO LIKE WITH FLOATING HEART
  const handleVideoAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickTimeoutRef.current) {
      // Double click detected!
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDoubleTapHeart({ visible: true, x, y });
      setTimeout(() => setDoubleTapHeart(null), 900);

      // Force like to true
      const vidId = activeVideo.id;
      if (!hasLiked[vidId]) {
        setHasLiked((prev) => ({ ...prev, [vidId]: true }));
        setLikes((prev) => {
          const baseCount = prev[vidId] !== undefined ? prev[vidId] : activeVideo.likesCount;
          return { ...prev, [vidId]: baseCount + 1 };
        });
      }
    } else {
      // First click: wait to distinguish single click (play/pause) from double click
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        if (!isLocked) {
          setIsPlaying((prev) => {
            const next = !prev;
            setPlayPauseFeedback(next ? 'play' : 'pause');
            setTimeout(() => setPlayPauseFeedback(null), 700);
            return next;
          });
        }
      }, 260);
    }
  };

  // 3. POST A COMMENT
  const handlePostComment = (textToPost: string) => {
    const cleanText = textToPost.trim();
    if (!cleanText) return;

    const vidId = activeVideo.id;
    const newEntry: FeedComment = {
      id: `comm_${Date.now()}`,
      user: activeUserName || 'Vous (VIP)',
      text: cleanText,
      time: 'À l’instant',
      likes: 0,
      isVip: true,
    };

    setCommentsByVideo((prev) => ({
      ...prev,
      [vidId]: [newEntry, ...(prev[vidId] || [])],
    }));

    setNewCommentText('');
  };

  // 4. LIKE A COMMENT
  const handleToggleCommentLike = (commentId: string) => {
    const vidId = activeVideo.id;
    setCommentsByVideo((prev) => {
      const list = prev[vidId] || [];
      return {
        ...prev,
        [vidId]: list.map((c) => {
          if (c.id === commentId) {
            const isLiked = !!c.hasLiked;
            return {
              ...c,
              hasLiked: !isLiked,
              likes: isLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
            };
          }
          return c;
        }),
      };
    });
  };

  // 5. SEND GIFT WITH CELEBRATION
  const handleSendGiftWithCelebration = (gift: GiftTier, split: { creatorNet: number; platformFee: number }) => {
    onSendGiftToCreator(gift, split);

    // Increase gift counter for this video
    const vidId = activeVideo.id;
    setExtraGiftsCount((prev) => ({
      ...prev,
      [vidId]: (prev[vidId] || 0) + 1,
    }));

    // Trigger celebration card
    setActiveGiftCelebration({
      giftName: gift.name,
      giftIcon: gift.icon,
      amountFormatted: formatXofForUserCountry(gift.amountXof, userCurrency),
      creatorName: activeVideo.creatorName,
      senderName: activeUserName || 'Vous',
    });

    setTimeout(() => {
      setActiveGiftCelebration(null);
    }, 4500);
  };

  // Unlock video with 85/15 Split Engine
  const handleUnlockVideo = (video: VideoItem) => {
    const price = video.priceXof || 5000;
    if (viewerBalance < price) {
      if (onOpenTopUpModal) {
        onOpenTopUpModal();
      }
      return;
    }
    if (onUnlockVideo) {
      const ok = onUnlockVideo(video);
      if (ok) {
        setUnlockedVideos((prev) => ({ ...prev, [video.id]: true }));
      }
    } else {
      setUnlockedVideos((prev) => ({ ...prev, [video.id]: true }));
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  // Derived counts
  const currentLikesCount =
    likes[activeVideo.id] !== undefined ? likes[activeVideo.id] : activeVideo.likesCount;
  const currentCommentsList = commentsByVideo[activeVideo.id] || [];
  const currentCommentsCount = activeVideo.commentsCount + (currentCommentsList.length - (INITIAL_COMMENTS_BY_VIDEO[activeVideo.id]?.length || 0));
  const currentGiftsCount = activeVideo.giftsCount + (extraGiftsCount[activeVideo.id] || 0);

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* Category Segmented Control & Search Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-2">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto no-scrollbar w-full sm:w-auto">
          {(['Tous', 'Ambiance', 'Exclusif', 'Challenges', 'Live'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
                setProgress(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              placeholder="Rechercher #titre, créateur..."
              className="w-full py-1.5 pl-8 pr-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Security & Watermark Inspection Toggle */}
          <button
            onClick={() => setWatermarkEnabled(!watermarkEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors shrink-0 ${
              watermarkEnabled
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400'
            }`}
            title="Activer/Désactiver le filigrane forensique anti-rip"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Watermark HLS :</span>
            <span>{watermarkEnabled ? 'ACTIF' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main TikTok-style Player Shell */}
      <div className="relative w-full max-w-[420px] aspect-[9/16] max-h-[82vh] bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800/80 shadow-2xl flex flex-col justify-between select-none">
        {/* Background Image / Video Simulation */}
        <div
          onClick={handleVideoAreaClick}
          className="absolute inset-0 z-0 cursor-pointer"
        >
          <img
            src={activeVideo.imageUrl}
            alt={activeVideo.title}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isLocked ? 'blur-md scale-105' : isPlaying ? 'scale-[1.02]' : 'scale-100'
            }`}
          />
          {/* Measured gradient scrim for high legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

          {/* Double Tap Flying Heart Animation */}
          {doubleTapHeart && (
            <div
              style={{
                position: 'absolute',
                left: `${doubleTapHeart.x}px`,
                top: `${doubleTapHeart.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="pointer-events-none z-30 animate-ping"
            >
              <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl" />
            </div>
          )}

          {/* Play / Pause Feedback Pulse */}
          {playPauseFeedback && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="p-4 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white animate-fade-in">
                {playPauseFeedback === 'play' ? (
                  <Play className="w-10 h-10 fill-current ml-1" />
                ) : (
                  <Pause className="w-10 h-10 fill-current" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Forensic Watermark (Anti-Rip & Screen Recording Deterrent) */}
        {watermarkEnabled && !isLocked && (
          <div
            style={{
              top: `${watermarkPos.y}%`,
              left: `${watermarkPos.x}%`,
              transition: 'all 2s ease-in-out',
            }}
            className="absolute z-10 pointer-events-none select-none text-[10px] font-mono text-white/35 font-semibold tracking-wider rotate-[-8deg] bg-black/25 backdrop-blur-[1px] px-2 py-0.5 rounded border border-white/10"
          >
            VIP-ID: 98124 · IP: 197.234.12.8 · UTC: {new Date().toISOString().substring(11, 19)} · AES-128 DRM
          </div>
        )}

        {/* Top Floating Controls */}
        <div className="relative z-20 flex items-center justify-between p-4 text-white text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-[11px] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {activeVideo.category}
            </span>
            {activeVideo.drmProtected && (
              <span className="bg-amber-500/20 text-amber-300 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono border border-amber-500/30">
                DRM HLS-128
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white hover:bg-black/60 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white hover:bg-black/60 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Floating Celebratory VIP Gift Overlay Banner */}
        {activeGiftCelebration && (
          <div className="absolute top-16 left-3 right-3 z-30 animate-bounce">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/90 via-amber-400/90 to-amber-500/90 text-neutral-950 font-bold shadow-2xl border border-white/40 backdrop-blur-md flex items-center gap-3">
              <span className="text-3xl shrink-0 p-1 bg-white/20 rounded-xl">{activeGiftCelebration.giftIcon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-neutral-900 font-extrabold">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Cadeau VIP Offert !</span>
                </div>
                <p className="text-xs truncate">
                  <span className="font-extrabold text-neutral-950">@{activeGiftCelebration.senderName}</span> a offert {activeGiftCelebration.giftName} à @{activeGiftCelebration.creatorName} !
                </p>
                <span className="text-[10px] font-mono block text-neutral-900">
                  Valeur : {activeGiftCelebration.amountFormatted} (Split instantané garanti)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Share Feedback Toast */}
        {shareToast && (
          <div className="absolute top-16 inset-x-8 z-30 flex items-center justify-center animate-fade-in">
            <div className="px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-300 font-mono text-xs flex items-center gap-2 shadow-xl">
              <Copy className="w-3.5 h-3.5" />
              <span>Lien chiffré copié dans le presse-papier !</span>
            </div>
          </div>
        )}

        {/* VIP Locked Overlay */}
        {isLocked ? (
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-neutral-100">Contenu VIP Exclusif</h3>
            <p className="text-xs text-neutral-300 mt-1 max-w-xs leading-relaxed">
              Ce contenu exclusif de <span className="text-amber-400 font-semibold">{activeVideo.creatorName}</span> est réservé aux membres VIP ou accessible à la séance.
            </p>
            <div className="mt-4 p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl w-full max-w-xs text-xs font-mono">
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Prix de déblocage :</span>
                <span className="text-neutral-100 font-bold tabular-nums">
                  {formatXofForUserCountry(activeVideo.priceXof || 5000, userCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-400">
                <span>Split Créateur (85%) :</span>
                <span className="tabular-nums">
                  +{formatXofForUserCountry(Math.round((activeVideo.priceXof || 5000) * 0.85), userCurrency)}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleUnlockVideo(activeVideo)}
              className="mt-4 w-full max-w-xs py-3 px-4 rounded-xl font-medium text-xs text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              {viewerBalance < (activeVideo.priceXof || 5000) ? (
                <span>Solde insuffisant · Recharger {formatXofForUserCountry(activeVideo.priceXof || 5000, userCurrency)}</span>
              ) : (
                <span>Débloquer avec le Portefeuille (Solde : {formatXofForUserCountry(viewerBalance, userCurrency)})</span>
              )}
            </button>

            {onOpenTopUpModal && (
              <button
                type="button"
                onClick={onOpenTopUpModal}
                className="mt-2 text-xs text-amber-400 hover:underline flex items-center gap-1.5 font-mono"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Recharger mon portefeuille en {userCurrency}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right Vertical Action Stack */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4">
          {/* Creator Avatar with Follow */}
          <div className="relative flex flex-col items-center">
            <img
              src={activeVideo.creatorAvatar}
              alt={activeVideo.creatorName}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full border-2 border-amber-400 object-cover shadow-lg"
            />
            {activeVideo.isVerifiedKyc && (
              <span className="absolute -bottom-1 bg-amber-400 text-neutral-950 rounded-full p-0.5 shadow">
                <CheckCircle className="w-3 h-3 fill-current" />
              </span>
            )}
          </div>

          {/* 1. Like Button with Pop Animation */}
          <button
            onClick={handleToggleLike}
            className="flex flex-col items-center gap-1 text-white group"
            title="Aimer cette vidéo"
          >
            <div
              className={`p-2.5 rounded-full backdrop-blur-md transition-all active:scale-125 ${
                hasLiked[activeVideo.id]
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 scale-105'
                  : 'bg-black/40 text-neutral-200 group-hover:bg-black/60'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-transform ${
                  hasLiked[activeVideo.id] ? 'fill-current scale-110' : ''
                }`}
              />
            </div>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-white drop-shadow">
              {currentLikesCount.toLocaleString('fr-FR')}
            </span>
          </button>

          {/* 2. Comment Button */}
          <button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1 text-white group"
            title="Voir les commentaires"
          >
            <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-neutral-200 group-hover:bg-black/60 transition-transform active:scale-110">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-white drop-shadow">
              {currentCommentsCount.toLocaleString('fr-FR')}
            </span>
          </button>

          {/* 3. Gift VIP Button */}
          <button
            onClick={() => setIsGiftModalOpen(true)}
            className="flex flex-col items-center gap-1 text-white group"
            title="Envoyer un cadeau VIP au créateur"
          >
            <div className="p-2.5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 shadow-lg shadow-amber-500/30 transition-transform active:scale-110 hover:rotate-6">
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider drop-shadow">
              {currentGiftsCount > 0 ? `${currentGiftsCount}` : 'Cadeau'}
            </span>
          </button>

          {/* 4. Share */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 text-white group"
            title="Partager le flux chiffré"
          >
            <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-neutral-200 group-hover:bg-black/60 transition-transform active:scale-110">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-white drop-shadow">
              {activeVideo.sharesCount.toLocaleString('fr-FR')}
            </span>
          </button>
        </div>

        {/* Bottom Metadata & Controls */}
        <div className="relative z-20 p-4 pt-0 text-white">
          <div className="pr-16 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-1">
                {activeVideo.creatorName}
              </h4>
              <span className="text-neutral-400 text-xs">·</span>
              <span className="text-xs text-neutral-300">{activeVideo.creatorCountry}</span>
            </div>

            <p className="text-xs text-neutral-200 line-clamp-2 leading-relaxed">
              {activeVideo.description}
            </p>

            <div className="flex flex-wrap gap-2 text-[11px] text-amber-300 font-medium pt-0.5">
              {activeVideo.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Video Playback Progress Bar */}
          <div className="w-full bg-white/20 h-1 rounded-full mt-3 overflow-hidden cursor-pointer">
            <div
              style={{ width: `${progress}%` }}
              className="bg-amber-400 h-full transition-all duration-200"
            />
          </div>
        </div>

        {/* Swipe Vertical Navigation Buttons (for desktop convenience) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-md transition-colors"
            title="Vidéo précédente"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-md transition-colors"
            title="Vidéo suivante"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Comments Drawer Modal */}
      {showComments && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl p-5 shadow-2xl text-neutral-100 max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm">
                  Commentaires ({currentCommentsList.length})
                </h3>
              </div>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Emoji Reaction Chips */}
            <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-neutral-800/60">
              {QUICK_EMOJI_REACTIONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handlePostComment(chip)}
                  className="px-2.5 py-1 rounded-full bg-neutral-800/80 hover:bg-amber-400/15 hover:border-amber-400/40 border border-neutral-700/60 text-[11px] font-medium text-neutral-300 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
              {currentCommentsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  Soyez le premier membre VIP à commenter cette vidéo !
                </div>
              ) : (
                currentCommentsList.map((comm) => (
                  <div key={comm.id} className="flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {comm.avatar ? (
                        <img
                          src={comm.avatar}
                          alt={comm.user}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-neutral-700 mt-0.5"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          {comm.user.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-neutral-200 truncate">@{comm.user}</span>
                          {comm.isVip && (
                            <span className="px-1.5 py-0.2 bg-amber-400/15 text-amber-300 border border-amber-400/30 rounded text-[9px] font-mono font-bold">
                              VIP
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-500">· {comm.time}</span>
                        </div>
                        <p className="text-neutral-300 leading-relaxed break-words">{comm.text}</p>
                      </div>
                    </div>

                    {/* Like comment button */}
                    <button
                      type="button"
                      onClick={() => handleToggleCommentLike(comm.id)}
                      className={`flex flex-col items-center gap-0.5 shrink-0 px-1 py-1 rounded transition-colors ${
                        comm.hasLiked ? 'text-rose-400' : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${comm.hasLiked ? 'fill-current' : ''}`} />
                      <span className="text-[10px] font-mono">{comm.likes}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Comment Post Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePostComment(newCommentText);
              }}
              className="pt-3 border-t border-neutral-800 flex gap-2"
            >
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={`Commenter en tant que @${activeUserName || 'Vous'}...`}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="p-2.5 rounded-xl bg-amber-400 text-neutral-950 hover:bg-amber-300 transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        creatorName={activeVideo.creatorName}
        creatorSplitRate={0.85}
        userCurrency={userCurrency}
        onSendGift={(gift, split) => {
          handleSendGiftWithCelebration(gift, split);
        }}
      />
    </div>
  );
};
