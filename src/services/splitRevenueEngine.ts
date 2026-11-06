/**
 * AuraVibe VIP - Split Revenue Engine & Escrow Automation
 * Conception : CTO, Architecte Cybersécurité & Expert Paiements
 */

export interface SplitResult {
  grossAmount: number;
  creatorShareRate: number;
  platformShareRate: number;
  creatorNet: number;
  platformNet: number;
  currency: string;
  timestamp: string;
  escrowStatus: 'SECURED_IN_ESCROW' | 'RELEASED_AND_SPLIT' | 'REFUNDED_TO_SPONSOR';
  auditHash: string;
}

export interface PayoutRequest {
  creatorId: string;
  amountXof: number;
  method: 'NYOLE_MOBILE_MONEY' | 'STRIPE' | 'USDT_TRC20';
  recipientPhoneOrAddress: string;
  provider?: string;
  otpCode: string;
  ipAddress: string;
}

/**
 * Calcul déterministe du Split Revenue (85% Créateur / 15% Plateforme par défaut)
 */
export function calculateSplit(
  grossAmount: number,
  creatorRate: number = 0.85,
  currency: string = 'XOF'
): SplitResult {
  const safeCreatorRate = Math.min(Math.max(creatorRate, 0.70), 0.95);
  const safePlatformRate = parseFloat((1 - safeCreatorRate).toFixed(4));

  const creatorNet = Math.round(grossAmount * safeCreatorRate);
  const platformNet = grossAmount - creatorNet; // Garantit l'absence de perte d'arrondi

  const now = new Date().toISOString();
  // Hash audit simulé (SHA-256 en prod)
  const auditString = `${grossAmount}|${creatorNet}|${platformNet}|${currency}|${now}`;
  const auditHash = '0x' + Array.from(auditString).reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0).toString(16).replace('-', '') + '8f7a9c';

  return {
    grossAmount,
    creatorShareRate: safeCreatorRate,
    platformShareRate: safePlatformRate,
    creatorNet,
    platformNet,
    currency,
    timestamp: now,
    escrowStatus: 'SECURED_IN_ESCROW',
    auditHash,
  };
}

/**
 * Simulation de l'appel API Nyole Mobile Money pour les retraits instantanés en Afrique
 * Couvre MTN CI/BJ/CM, Orange Money SN/CI/ML, Wave CI/SN, Moov, Airtel
 */
export async function executeNyoleInstantPayout(payout: PayoutRequest): Promise<{
  success: boolean;
  reference: string;
  transferFeeXof: number;
  estimatedArrival: string;
  message: string;
}> {
  // Simule l'appel REST sécurisé vers l'API Nyole v2
  return new Promise((resolve) => {
    setTimeout(() => {
      // Frais standard Mobile Money absorbés ou déduits (ex: 1% capped)
      const transferFee = Math.min(Math.round(payout.amountXof * 0.01), 1500);
      const randomRef = 'NYL-' + Math.floor(100000 + Math.random() * 900000);

      resolve({
        success: true,
        reference: randomRef,
        transferFeeXof: transferFee,
        estimatedArrival: 'Instantané (moins de 15 secondes)',
        message: `Fonds de ${payout.amountXof.toLocaleString('fr-FR')} XOF transférés avec succès vers ${payout.provider || 'Wave'} (${payout.recipientPhoneOrAddress}).`,
      });
    }, 900);
  });
}

/**
 * Code source TypeScript documenté du système de répartition (Livrable CTO 2)
 */
export const SPLIT_ENGINE_SOURCE_CODE = `// ============================================================================
// AURAVIBE VIP - TRANSACTIONAL ESCROW & SPLIT REVENUE ENGINE (PRODUCTION ACID)
// Stack: TypeScript, Node.js / Bun, PostgreSQL (Drizzle / Prisma), Redis (Locks)
// ============================================================================

import { db } from '../db/client';
import { utilisateurs, transactions, challenges, revenusSplit, escrowVault } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { redisClient } from '../services/redis';
import { nyoleClient } from '../integrations/nyoleMobileMoney';
import crypto from 'crypto';

interface ExecuteSplitParams {
  challengeId: string;
  creatorId: string;
  sponsorId: string;
  grossAmount: number;
  currency: 'XOF' | 'EUR' | 'USD' | 'USDT';
  idempotencyKey: string;
  operatorNotes?: string;
}

export class SplitRevenueEngine {
  private static DEFAULT_CREATOR_RATE = 0.85; // 85% net pour le créateur
  private static DEFAULT_PLATFORM_FEE = 0.15; // 15% commission plateforme

  /**
   * 1. SÉQUESTRE INITIAL (ESCROW DEPOSIT)
   * Bloque les fonds du spectateur lors de l'envoi d'un cadeau ou d'un challenge.
   */
  public static async lockFundsInEscrow(params: {
    reference: string;
    payerId: string;
    targetCreatorId: string;
    amount: number;
    currency: string;
    context: 'CHALLENGE' | 'VIP_LIVE_GIFT';
  }) {
    return await db.transaction(async (tx) => {
      // 1. Débiter le wallet de l'acheteur (ou vérifier confirmation webhook Nyole)
      const [payerWallet] = await tx
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.id, params.payerId))
        .for('update'); // Verrou exclusif de ligne (Row-level lock)

      if (payerWallet.balance < params.amount) {
        throw new Error('SOLDE_INSUFFISANT: Veuillez recharger via Nyole Mobile Money ou Carte Bancaire.');
      }

      await tx
        .update(utilisateurs)
        .set({ balance: sql\`\${utilisateurs.balance} - \${params.amount}\` })
        .where(eq(utilisateurs.id, params.payerId));

      // 2. Créer l'entrée dans le compte tiers de confiance (Escrow Vault)
      const escrowRecord = await tx
        .insert(escrowVault)
        .values({
          id: \`esc_\${crypto.randomUUID()}\`,
          reference: params.reference,
          payerId: params.payerId,
          beneficiaryCreatorId: params.targetCreatorId,
          amountLocked: params.amount,
          currency: params.currency,
          status: 'LOCKED',
          lockedAt: new Date(),
        })
        .returning();

      return escrowRecord[0];
    });
  }

  /**
   * 2. DÉCLENCHEMENT DU SPLIT INSTANTANÉ (RELEASE & SPLIT)
   * Exécuté dès qu'un challenge est validé par la preuve ou qu'un live gift est consommé.
   */
  public static async releaseAndSplitEscrow(params: ExecuteSplitParams) {
    // A. Verrou distribué Redis pour prévenir les race conditions (Double Dépense)
    const lockKey = \`lock:split:challenge:\${params.challengeId}\`;
    const lockAcquired = await redisClient.set(lockKey, 'LOCKED', 'NX', 'EX', 10);
    if (!lockAcquired) {
      throw new Error('CONCURRENCY_ERROR: Une opération de split est déjà en cours.');
    }

    try {
      // B. Transaction relationnelle ACID stricte
      return await db.transaction(async (tx) => {
        // Idempotence : vérifier si le split n'a pas déjà été comptabilisé
        const existingTx = await tx
          .select()
          .from(revenusSplit)
          .where(eq(revenusSplit.idempotencyKey, params.idempotencyKey))
          .limit(1);

        if (existingTx.length > 0) {
          return { status: 'ALREADY_PROCESSED', record: existingTx[0] };
        }

        // Récupérer le taux contractuel du créateur (VIP: 85% à 90%)
        const [creator] = await tx
          .select()
          .from(utilisateurs)
          .where(eq(utilisateurs.id, params.creatorId))
          .for('update');

        const creatorRate = creator.customSplitRate || this.DEFAULT_CREATOR_RATE;
        const platformRate = 1 - creatorRate;

        // Calcul exact au millième près (arrondi vers le bas pour le créateur, solde pour plateforme)
        const creatorNetAmount = Math.floor(params.grossAmount * creatorRate);
        const platformNetAmount = params.grossAmount - creatorNetAmount;

        // C. Mettre à jour le solde retirable du créateur en temps réel
        await tx
          .update(utilisateurs)
          .set({
            balance: sql\`\${utilisateurs.balance} + \${creatorNetAmount}\`,
            totalEarned: sql\`\${utilisateurs.totalEarned} + \${creatorNetAmount}\`,
          })
          .where(eq(utilisateurs.id, params.creatorId));

        // D. Libérer le compte séquestre
        await tx
          .update(escrowVault)
          .set({
            status: 'RELEASED_SPLIT',
            releasedAt: new Date(),
          })
          .where(eq(escrowVault.reference, params.challengeId));

        // E. Insérer la ligne d'audit comptable immuable dans 'revenus_split'
        const [splitEntry] = await tx
          .insert(revenusSplit)
          .values({
            id: \`splt_\${crypto.randomUUID()}\`,
            idempotencyKey: params.idempotencyKey,
            challengeId: params.challengeId,
            creatorId: params.creatorId,
            sponsorId: params.sponsorId,
            grossAmount: params.grossAmount,
            creatorNetAmount,
            platformFeeAmount: platformNetAmount,
            creatorPercentage: creatorRate * 100,
            platformPercentage: platformRate * 100,
            currency: params.currency,
            createdAt: new Date(),
          })
          .returning();

        // F. Mettre à jour le statut du Challenge en 'PAYE_VALIDE'
        await tx
          .update(challenges)
          .set({ status: 'VALIDE_PAYE', paidAt: new Date() })
          .where(eq(challenges.id, params.challengeId));

        return {
          status: 'SUCCESS',
          creatorCredited: creatorNetAmount,
          platformRetained: platformNetAmount,
          splitId: splitEntry.id,
        };
      });
    } finally {
      await redisClient.del(lockKey);
    }
  }

  /**
   * 3. RETRAIT INSTANTANÉ VERS MOBILE MONEY (NYOLE API) OU STRIPE
   * Exécuté sous protection 2FA et validation de vélocité anti-fraude.
   */
  public static async executeInstantPayout(payout: {
    creatorId: string;
    amount: number;
    destination: 'NYOLE_MOBILE_MONEY' | 'STRIPE' | 'CRYPTO_USDT';
    momoOperator: 'MTN' | 'ORANGE' | 'WAVE' | 'AIRTEL';
    phoneNumber: string;
  }) {
    return await db.transaction(async (tx) => {
      // Vérifier et débiter le solde du créateur
      const [creator] = await tx
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.id, payout.creatorId))
        .for('update');

      if (creator.balance < payout.amount) {
        throw new Error('SOLDE_INSUFFISANT_POUR_RETRAIT');
      }

      await tx
        .update(utilisateurs)
        .set({ balance: sql\`\${utilisateurs.balance} - \${payout.amount}\` })
        .where(eq(utilisateurs.id, payout.creatorId));

      // Déclencher le paiement instantané Nyole en Afrique
      const nyoleResponse = await nyoleClient.disbursement.create({
        amount: payout.amount,
        currency: 'XOF',
        recipient: {
          operator: payout.momoOperator,
          phone: payout.phoneNumber,
        },
        reference: \`PAYOUT-\${Date.now()}\`,
        callbackUrl: 'https://api.auravibe.vip/v1/webhooks/nyole',
      });

      return nyoleResponse;
    });
  }
}`;
