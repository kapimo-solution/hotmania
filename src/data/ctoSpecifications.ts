/**
 * AuraVibe VIP - Spécifications Techniques & Cybersécurité CTO
 * Livrables 1, 3 et 4 du Cahier des Charges
 */

export const DATABASE_SCHEMA_SQL = `-- ============================================================================
-- AURAVIBE VIP - SCHEMA RELATIONNEL POSTGRESQL PRODUCTION-GRADE
-- Tables Requises: Utilisateurs, Transactions, Challenges, Revenus_Split + Escrow & KYC
-- Moteur: PostgreSQL 16+ avec contraintes ACID, UUIDv7 et verrous pessimistes
-- ============================================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE type_role AS ENUM ('visionneur', 'createur', 'moderateur', 'super_admin');
CREATE TYPE type_kyc_statut AS ENUM ('non_soumis', 'en_attente_ia', 'en_revue_manuelle', 'approuve_18plus', 'rejete');
CREATE TYPE type_transaction AS ENUM ('abonnement', 'cadeau_live', 'challenge_escrow', 'pourboire', 'retrait_mobile_money', 'retrait_stripe', 'retrait_crypto');
CREATE TYPE statut_transaction AS ENUM ('initialise', 'en_sequestre', 'complete', 'echec', 'rembourse');
CREATE TYPE statut_challenge AS ENUM ('en_attente_acceptation', 'sequestre_verrouille', 'preuve_soumise', 'valide_paye', 'litige', 'expire');
CREATE TYPE passerelle_paiement AS ENUM ('nyole_mobile_money', 'stripe_connect', 'usdt_trc20', 'carte_bancaire');

-- ----------------------------------------------------------------------------
-- 1. TABLE: UTILISATEURS
-- Gère les spectateurs et les créateurs certifiés avec KYC 18+ strict
-- ----------------------------------------------------------------------------
CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(30) UNIQUE,
    nom_utilisateur VARCHAR(50) UNIQUE NOT NULL,
    nom_complet VARCHAR(150),
    mot_de_passe_hash VARCHAR(255) NOT NULL, -- Haché avec Argon2id (Memory: 64MB, Iterations: 3)
    role type_role NOT NULL DEFAULT 'visionneur',
    statut_kyc type_kyc_statut NOT NULL DEFAULT 'non_soumis',
    est_age_verifie_18 BOOLEAN NOT NULL DEFAULT FALSE,
    pays_code CHAR(2) NOT NULL, -- Ex: 'CI', 'SN', 'CM', 'FR', 'US'
    devise_preferee VARCHAR(5) NOT NULL DEFAULT 'XOF',
    
    -- Portefeuille & Paramètres de Split
    solde_disponible_xof BIGINT NOT NULL DEFAULT 0 CHECK (solde_disponible_xof >= 0),
    solde_en_sequestre_xof BIGINT NOT NULL DEFAULT 0 CHECK (solde_en_sequestre_xof >= 0),
    taux_split_createur NUMERIC(4, 3) NOT NULL DEFAULT 0.850 CHECK (taux_split_createur BETWEEN 0.700 AND 0.950),
    
    -- Sécurité & 2FA
    deux_facteurs_actif BOOLEAN NOT NULL DEFAULT FALSE,
    deux_facteurs_secret VARCHAR(100), -- Secret TOTP chiffré AES-256-GCM
    operateur_mobile_money VARCHAR(20), -- 'WAVE', 'MTN', 'ORANGE', 'AIRTEL', 'MOOV'
    numero_retrait_momo VARCHAR(30),
    score_risque_fraude SMALLINT NOT NULL DEFAULT 0 CHECK (score_risque_fraude BETWEEN 0 AND 100),
    compte_verrouille BOOLEAN NOT NULL DEFAULT FALSE,
    
    derniere_connexion_at TIMESTAMPTZ,
    derniere_ip INET,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_utilisateurs_role_kyc ON utilisateurs(role, statut_kyc);
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);

-- ----------------------------------------------------------------------------
-- 2. TABLE: KYC_VERIFICATIONS
-- Audit complet de conformité légale NSFW & certification d'âge 18+
-- ----------------------------------------------------------------------------
CREATE TABLE kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    createur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    type_document VARCHAR(50) NOT NULL, -- 'PASSEPORT', 'CNI', 'PERMIS'
    document_chiffre_url VARCHAR(500) NOT NULL, -- Stocké dans un bucket S3 privé isolé
    score_biometrie_liveness NUMERIC(5, 2) NOT NULL, -- Confiance IA anti-deepfake
    date_naissance DATE NOT NULL,
    age_calcule SMALLINT NOT NULL CHECK (age_calcule >= 18),
    verifie_par_fournisseur VARCHAR(50) NOT NULL DEFAULT 'AuraVibe_Automated_KYC',
    statut type_kyc_statut NOT NULL DEFAULT 'en_attente_ia',
    notes_audit TEXT,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kyc_createur ON kyc_verifications(createur_id);

-- ----------------------------------------------------------------------------
-- 3. TABLE: CHALLENGES (DÉFIS PAYANTS EN SÉQUESTRE)
-- Moteur de challenges avec garantie financière tiers de confiance
-- ----------------------------------------------------------------------------
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL, -- Ex: 'CHL-2026-XOF-44102'
    sponsor_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE RESTRICT,
    createur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE RESTRICT,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    montant_prime_xof BIGINT NOT NULL CHECK (montant_prime_xof > 0),
    statut statut_challenge NOT NULL DEFAULT 'en_attente_acceptation',
    delai_expiration TIMESTAMPTZ NOT NULL,
    
    -- Preuve vidéo fournie par le créateur
    preuve_video_hls_url VARCHAR(500),
    preuve_soumise_le TIMESTAMPTZ,
    validation_sponsor_le TIMESTAMPTZ,
    validation_auto_le TIMESTAMPTZ,
    
    -- Horodatage
    cree_le TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challenges_createur ON challenges(createur_id, statut);
CREATE INDEX idx_challenges_sponsor ON challenges(sponsor_id);

-- ----------------------------------------------------------------------------
-- 4. TABLE: TRANSACTIONS
-- Journal comptable central de tous les flux entrants et sortants
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(64) UNIQUE NOT NULL, -- Ex: 'AV-TX-88392104'
    cle_idempotence VARCHAR(128) UNIQUE NOT NULL, -- Prévient les doubles paiements
    type type_transaction NOT NULL,
    payeur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
    beneficiaire_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    
    montant_brut_xof BIGINT NOT NULL CHECK (montant_brut_xof >= 0),
    montant_net_createur_xof BIGINT NOT NULL DEFAULT 0,
    commission_plateforme_xof BIGINT NOT NULL DEFAULT 0,
    devise VARCHAR(5) NOT NULL DEFAULT 'XOF',
    
    passerelle passerelle_paiement NOT NULL,
    passerelle_reference_externe VARCHAR(150), -- ID de transaction Nyole / Stripe PI
    statut statut_transaction NOT NULL DEFAULT 'initialise',
    donnees_webhook JSONB,
    code_erreur VARCHAR(50),
    
    cree_le TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mis_a_jour_le TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_beneficiaire ON transactions(beneficiaire_id, type, statut);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_created ON transactions(cree_le DESC);

-- ----------------------------------------------------------------------------
-- 5. TABLE: REVENUS_SPLIT (LIVRABLE EXCLUSIF RÉPARTITION DES GAINS)
-- Enregistrement immuable de chaque répartition calculée et exécutée
-- ----------------------------------------------------------------------------
CREATE TABLE revenus_split (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cle_idempotence VARCHAR(128) UNIQUE NOT NULL,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    createur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE RESTRICT,
    
    montant_total_brut BIGINT NOT NULL,
    montant_part_createur BIGINT NOT NULL, -- 80% ou 85% net
    montant_commission_plateforme BIGINT NOT NULL, -- 15% ou 20%
    taux_applique_createur NUMERIC(5, 2) NOT NULL, -- Ex: 85.00
    taux_applique_plateforme NUMERIC(5, 2) NOT NULL, -- Ex: 15.00
    devise VARCHAR(5) NOT NULL DEFAULT 'XOF',
    
    frais_passerelle_absorbes BIGINT NOT NULL DEFAULT 0,
    solde_createur_apres_split BIGINT NOT NULL,
    hash_audit_cryptographique VARCHAR(128) NOT NULL, -- SHA-256 pour intégrité financière
    
    execute_le TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_revenus_split_createur ON revenus_split(createur_id, execute_le DESC);
CREATE INDEX idx_revenus_split_tx ON revenus_split(transaction_id);

-- ----------------------------------------------------------------------------
-- 6. TRIGGER AUTOMATIQUE: MISE À JOUR HORODATAGE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.mis_a_jour_le = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_utilisateurs
BEFORE UPDATE ON utilisateurs
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_challenges
BEFORE UPDATE ON challenges
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
`;

export const ARCHITECTURE_COMPONENTS = [
  {
    layer: '1. Frontend & Client Edge',
    title: 'Progressive Web App (PWA) & Mobile Hybrid',
    description: 'Interface ultra-réactive construite en React 19 + Vite + Tailwind v4, optimisée pour un chargement instantané même sur réseaux 3G/4G en Afrique de l’Ouest et Centrale.',
    tech: ['React 19', 'Tailwind CSS v4', 'PWA Service Workers', 'IndexedDB Offline Cache', 'HLS.js with DRM EME'],
    highlights: [
      'Lecteur vertical TikTok-style avec swipe fluide et preloading des 3 vidéos suivantes',
      'Watermarking dynamique au niveau Canvas (protection contre la capture d’écran)',
      'Détection automatique de la vitesse réseau et adaptation de résolution HLS (360p à 1080p)',
    ],
  },
  {
    layer: '2. API Gateway & Microservices Backend',
    title: 'API Haute Performance & Traitement des Flux',
    description: 'Architecture microservices conteneurisée sur Kubernetes / Cloud Run avec cluster Redis pour les verrous distribués et WebSockets à faible latence.',
    tech: ['Node.js / Bun & Golang', 'Express / Fastify', 'Redis 7 (Distributed Locks & Pub/Sub)', 'PostgreSQL 16 Multi-AZ', 'Kafka Event Bus'],
    highlights: [
      'Gestionnaire de transactions ACID pour le Split Revenue Engine avec garanties d’idempotence',
      'Webhooks bidirectionnels avec l’API Nyole Mobile Money et Stripe Connect',
      'Services isolés pour la modération NSFW et la vérification automatisée de l’âge KYC 18+',
    ],
  },
  {
    layer: '3. Stockage Sécurisé & Pipeline Transcodage Vidéo',
    title: 'Pipeline Ingestion, Chiffrement HLS & CDN Mondial',
    description: 'Chaque vidéo uploadée est immédiatement chiffrée, scindée en segments HLS (.ts/.m4s) de 2 à 4 secondes chiffrés par clé tournante AES-128, puis distribuée via Cloudflare Stream.',
    tech: ['AWS S3 / Wasabi (Buckets Privés Chiffrés)', 'AWS MediaConvert / FFmpeg NVENC', 'Cloudflare Stream & Global CDN', 'AES-128 Key Rotation Service'],
    highlights: [
      'Segments vidéo inexploitables en cas de téléchargement direct sans jeton de décryptage',
      'URL signées éphémères (Signed URLs d’une validité maximale de 60 secondes liée à l’IP)',
      'Intégration DRM Apple FairPlay & Google Widevine pour flux VIP haute valeur',
    ],
  },
  {
    layer: '4. Moteur de Répartition & Passerelle Financière',
    title: 'Universal Payment & Automated Escrow Split Engine',
    description: 'Orchestrateur de paiements combinant monnaies fiduciaires locales africaines (Mobile Money) et rails internationaux (Cartes & Crypto).',
    tech: ['API Nyole (MTN, Orange, Airtel, Wave, Moov)', 'Stripe Connect Custom', 'Passerelle Crypto USDT TRC-20', 'Coffre-fort Séquestre (Escrow Vault)'],
    highlights: [
      'Retraits instantanés vers Mobile Money en moins de 15 secondes après confirmation 2FA',
      'Isolation des commissions de la plateforme (15%) et versement direct des 85% au créateur',
      'Séquestre automatisé pour les challenges garantissant la livraison de la preuve vidéo',
    ],
  },
];

export const CYBERSECURITY_PROTOCOLS = [
  {
    id: 'anti_ddos_waf',
    category: 'Protection Réseau & WAF',
    title: 'Pare-Feu Applicatif (WAF) & Défense Anti-DDoS Anycast',
    summary: 'Filtrage systématique en périphérie de réseau contre les attaques volumétriques L3/L4 et les injections applicatives L7.',
    rules: [
      'Déploiement Cloudflare Enterprise / AWS CloudFront WAF avec règles OWASP Core Rule Set (CRS 3.3).',
      'Rate-limiting agressif : maximum 60 requêtes/minute sur les routes sensibles d’authentification et de paiement.',
      'Protection stricte contre les injections SQL via requêtes préparées systématiques (Parameterized Queries) et validation Zod.',
      'En-têtes de sécurité obligatoires : Content-Security-Policy (CSP) stricte, HSTS préchargé (2 ans), X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin.',
    ],
  },
  {
    id: 'hls_anti_rip',
    category: 'Anti-Piratage & Streaming Sécurisé',
    title: 'Chiffrement HLS AES-128, URL Signées & Tatouage Dynamique (Watermarking)',
    summary: 'Système à 4 couches interdisant le scraping, le téléchargement direct et l’enregistrement pirate d’écran.',
    rules: [
      'Chiffrement HLS AES-128 : chaque playlist .m3u8 contient des balises #EXT-X-KEY avec URI pointant vers un KMS éphémère.',
      'Jeton KMS éphémère (JWT) d’une durée de vie de 60 secondes, invalidé dès que l’adresse IP ou la session change.',
      'Forensic Watermarking Dynamique : superposition permanente et semi-transparente de l’identifiant spectateur (User ID), horodatage UTC et adresse IP, oscillant subtilement pour résister au rognage vidéo.',
      'Détection anti-capture : injection de l’API Web Visibility & Screen Capture Block pour couper le flux dès qu’un outil d’enregistrement ou de partage d’écran est activé.',
    ],
  },
  {
    id: 'payout_2fa_fraud',
    category: 'Sécurité Financière & Portefeuilles',
    title: 'Authentification 2FA Forte & Moteur d’Analyse Comportementale Anti-Fraude',
    summary: 'Validation multi-facteurs stricte pour les retraits et scoring du risque en temps réel.',
    rules: [
      '2FA obligatoire (Code OTP par SMS via passerelle locale ou Email ou TOTP Authenticator) pour tout ajout de numéro Mobile Money ou demande de retrait.',
      'Algorithme de vélocité des retraits : blocage automatique si un créateur effectue plus de 3 retraits en moins de 2 heures ou si le montant dépasse le seuil de vélocité moyen.',
      'Détection d’anomalie géographique (Impossible Travel Time) : alerte critique et gel préventif si une connexion intervient depuis un autre pays en moins de 3 heures.',
      'Hachage des mots de passe en Argon2id (Memory: 64 Mo, 3 itérations) avec sel cryptographique de 32 octets.',
    ],
  },
];
