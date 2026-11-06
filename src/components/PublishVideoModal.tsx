import React, { useState } from 'react';
import { X, Upload, Video, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { VideoItem, User } from '../types';
import { formatXofForUserCountry } from '../services/currencyService';

interface PublishVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: User;
  userCurrency?: string;
  onPublishVideo?: (video: VideoItem) => void;
}

const PRESET_COVERS = [
  {
    label: 'Studio Lounge Afro',
    url: '/src/assets/images/auravibe_creator_afro_1793709838425.jpg',
  },
  {
    label: 'Soirée Privée Velvet',
    url: '/src/assets/images/auravibe_creator_vip_1793709824039.jpg',
  },
  {
    label: 'Performance Acrobatique',
    url: '/src/assets/images/auravibe_creator_challenge_1793709855910.jpg',
  },
  {
    label: 'Live VIP Streaming',
    url: '/src/assets/images/auravibe_live_stream_1793709855515.jpg',
  },
];

export const PublishVideoModal: React.FC<PublishVideoModalProps> = ({
  isOpen,
  onClose,
  creator,
  userCurrency = creator.currency || 'CDF',
  onPublishVideo,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Ambiance' | 'Exclusif' | 'Challenges' | 'Live'>('Exclusif');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('#VIP #Kinshasa #Exclusive');
  const [selectedCoverUrl, setSelectedCoverUrl] = useState(PRESET_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [isVipLocked, setIsVipLocked] = useState(false);
  const [priceXof, setPriceXof] = useState('5000');
  const [drmProtected, setDrmProtected] = useState(true);

  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsPublishing(true);

    setTimeout(() => {
      const tags = tagsInput
        .split(' ')
        .map((t) => (t.startsWith('#') ? t : `#${t}`))
        .filter((t) => t.length > 1);

      const finalCover = customCoverUrl.trim() || selectedCoverUrl;

      const newVideo: VideoItem = {
        id: `vid_${Date.now()}`,
        creatorId: creator.id,
        creatorName: creator.displayName,
        creatorAvatar: creator.avatar,
        creatorCountry: creator.country,
        isVerifiedKyc: true,
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tags.length > 0 ? tags : ['#VIPExclusive', '#AuraVibe'],
        imageUrl: finalCover,
        likesCount: 1,
        commentsCount: 0,
        sharesCount: 0,
        giftsCount: 0,
        isVipLocked,
        priceXof: isVipLocked ? parseInt(priceXof, 10) || 5000 : undefined,
        hlsStreamUrl: `https://stream.auravibe.vip/hls/enc_creator_${Date.now()}/master.m3u8?token=jwt_sec_${Date.now()}`,
        drmProtected,
        createdAt: 'À l’instant',
      };

      if (onPublishVideo) {
        onPublishVideo(newVideo);
      }
      setIsPublishing(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1300);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base text-neutral-100">Publier une Nouvelle Vidéo VIP</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-base text-neutral-100">Vidéo Publiée avec Succès !</h4>
            <p className="text-xs text-neutral-300">
              Votre contenu est désormais chiffré HLS AES-128 et accessible en tête de votre flux public AuraVibe VIP.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            {/* Titre */}
            <div>
              <label className="text-neutral-400 block mb-1 font-medium">Titre de la vidéo</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Soirée privée rooftop & Session inédite"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="text-neutral-400 block mb-1 font-medium">Catégorie du flux</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200"
              >
                <option value="Ambiance">Ambiance</option>
                <option value="Exclusif">Exclusif</option>
                <option value="Challenges">Challenges</option>
                <option value="Live">Live</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-neutral-400 block mb-1 font-medium">Description</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le contenu exclusif réservé à votre communauté..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-neutral-400 block mb-1 font-medium">Hashtags (séparés par un espace)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-amber-300 font-mono"
              />
            </div>

            {/* Choix Visuel Couverture */}
            <div>
              <label className="text-neutral-400 block mb-1.5 font-medium">Image de couverture / Poster HD</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_COVERS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => {
                      setSelectedCoverUrl(preset.url);
                      setCustomCoverUrl('');
                    }}
                    className={`relative rounded-xl overflow-hidden border p-1 text-left transition-all ${
                      selectedCoverUrl === preset.url && !customCoverUrl
                        ? 'border-amber-400 ring-1 ring-amber-400'
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-16 object-cover rounded-lg"
                    />
                    <span className="text-[10px] text-neutral-300 block truncate mt-1 px-1">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accès Payant / Séance */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-200 block text-xs">Accès Pay-per-view (Verrouillé)</span>
                  <span className="text-[10px] text-neutral-400">Les spectateurs devront régler ce montant pour débloquer</span>
                </div>
                <input
                  type="checkbox"
                  checked={isVipLocked}
                  onChange={(e) => setIsVipLocked(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400"
                />
              </div>

              {isVipLocked && (
                <div className="pt-2 border-t border-neutral-800">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-neutral-400 text-[11px]">Prix de déblocage :</label>
                    <span className="text-amber-400 font-mono font-bold">
                      {formatXofForUserCountry(parseInt(priceXof, 10) || 5000, userCurrency)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={priceXof}
                    onChange={(e) => setPriceXof(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 font-mono"
                  />
                  <span className="text-[10px] text-emerald-400 font-mono block mt-1">
                    Part Créateur (85%) : +{formatXofForUserCountry(Math.round((parseInt(priceXof, 10) || 5000) * 0.85), userCurrency)}
                  </span>
                </div>
              )}
            </div>

            {/* Chiffrement DRM */}
            <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold text-neutral-200 block text-xs">Protection HLS AES-128 & Filigrane</span>
                  <span className="text-[10px] text-neutral-400">Anti-téléchargement et anti-capture d'écran</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={drmProtected}
                onChange={(e) => setDrmProtected(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-400 focus:ring-emerald-400"
              />
            </div>

            {/* Bouton de publication */}
            <button
              type="submit"
              disabled={isPublishing}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isPublishing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  Chiffrement AES-128 & Encodage CMAF...
                </span>
              ) : (
                <>
                  <span>Publier sur le Feed AuraVibe VIP</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
