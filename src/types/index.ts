export type Currency = 'CDF' | 'XAF' | 'XOF' | 'EUR' | 'USD' | 'USDT' | 'NGN' | 'KES' | 'ZAR' | 'GHS' | 'GNF' | 'RWF' | string;

export type UserRole = 'viewer' | 'creator' | 'admin';

export type KycStatus = 'non_verifie' | 'en_cours' | 'valide' | 'rejete';

export type CreatorApprovalStatus = 'en_attente_admin' | 'approuve' | 'rejete';

export interface AdminConfig {
  email: string;
  password: string;
  secretAccessCode: string;
  isConfigured: boolean;
  configuredAt: string;
}

export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatar: string;
  role: UserRole;
  country: string;
  countryCode: string;
  currency?: string; // Code devise adapté (ex: CDF pour RDC, XAF pour Congo, XOF pour CI/SN, EUR, USD, etc.)
  isVip: boolean;
  kycStatus: KycStatus;
  creatorApprovalStatus?: CreatorApprovalStatus;
  hasPaidAccessPass?: boolean; // Pour les visionneurs: 1.99$
  paidPassDate?: string;
  balanceXof: number; // Solde retirable (base XOF de référence)
  escrowPendingXof: number; // En séquestre
  creatorSplitRate: number; // ex: 0.85 (85%)
  platformFeeRate: number; // ex: 0.15 (15%)
  mobileMoneyProvider?: string;
  phoneNumber?: string;
  twoFactorEnabled: boolean;
}

export interface KycSubmissionRequest {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  documentType: 'CNI' | 'PASSEPORT' | 'PERMIS';
  documentNumber: string;
  country: string;
  birthDate: string;
  calculatedAge: number;
  selfieLivenessUrl: string;
  documentFrontUrl: string;
  submittedAt: string;
  status: CreatorApprovalStatus;
  rejectionReason?: string;
  biometricScore: number; // ex: 99.4%
}

export interface VideoItem {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorCountry: string;
  isVerifiedKyc: boolean;
  title: string;
  description: string;
  category: 'Ambiance' | 'Exclusif' | 'Live' | 'Challenges';
  tags: string[];
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  giftsCount: number;
  isVipLocked: boolean;
  priceXof?: number;
  hlsStreamUrl: string;
  drmProtected: boolean;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  sponsorName: string;
  creatorId: string;
  creatorName: string;
  bountyAmountXof: number;
  status: 'en_attente_preuve' | 'preuve_soumise' | 'valide_paye' | 'annule';
  deadline: string;
  description: string;
  proofVideoUrl?: string;
  escrowTxId: string;
  splitExecutedAt?: string;
}

export interface TransactionRecord {
  id: string;
  reference: string;
  type: 'Pass_Visionneur_1_99' | 'Abonnement' | 'Cadeau_Live' | 'Challenge_Escrow' | 'Pourboire' | 'Retrait_Nyole' | 'Retrait_Stripe' | 'Retrait_Crypto' | 'Recharge_Portefeuille' | 'Deblocage_Video';
  grossAmountXof: number;
  creatorNetAmountXof: number;
  platformFeeAmountXof: number;
  currency: Currency;
  status: 'complete' | 'en_sequestre' | 'en_cours_payout' | 'echec';
  creatorId?: string;
  payerName: string;
  paymentGateway: 'Nyole_MobileMoney' | 'Stripe' | 'USDT_TRON' | 'Carte_Bancaire';
  createdAt: string;
  notes: string;
  idempotencyKey: string;
}

export interface GiftTier {
  id: string;
  name: string;
  icon: string;
  amountXof: number;
  approxUsd: number;
  animationType: 'sparkle' | 'flame' | 'fireworks' | 'supernova';
}
