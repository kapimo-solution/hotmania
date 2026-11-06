/**
 * AuraVibe VIP - Currency & Foreign Exchange Engine
 * Moteur d'adaptation automatique de devises selon le pays de résidence de l'utilisateur
 */

import { ALL_AFRICAN_COUNTRIES } from '../data/africanCountries';

export interface CurrencyMetadata {
  code: string;
  symbol: string;
  name: string;
  ratePerUsd: number; // Combien d'unités de cette devise pour 1 USD
  decimals: number;
  symbolPosition: 'before' | 'after';
}

/**
 * Taux de change déterministes par rapport à 1 USD (Référence mondiale)
 * 1 USD = 625 XOF (Franc CFA Afrique de l'Ouest)
 * 1 USD = 625 XAF (Franc CFA Afrique Centrale)
 * 1 USD = 2850 CDF (Franc Congolais RDC)
 */
export const CURRENCY_REGISTRY: Record<string, CurrencyMetadata> = {
  CDF: {
    code: 'CDF',
    symbol: 'CDF',
    name: 'Franc Congolais (RDC)',
    ratePerUsd: 2850,
    decimals: 0,
    symbolPosition: 'after',
  },
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Franc CFA BEAC (Afrique Centrale)',
    ratePerUsd: 625,
    decimals: 0,
    symbolPosition: 'after',
  },
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    name: 'Franc CFA BCEAO (Afrique de l’Ouest)',
    ratePerUsd: 625,
    decimals: 0,
    symbolPosition: 'after',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dollar Américain',
    ratePerUsd: 1.0,
    decimals: 2,
    symbolPosition: 'before',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (Zone Euro)',
    ratePerUsd: 0.92,
    decimals: 2,
    symbolPosition: 'after',
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Naira Nigérian',
    ratePerUsd: 1450,
    decimals: 0,
    symbolPosition: 'before',
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Shilling Kenyan',
    ratePerUsd: 130,
    decimals: 0,
    symbolPosition: 'after',
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'Rand Sud-Africain',
    ratePerUsd: 18.5,
    decimals: 2,
    symbolPosition: 'before',
  },
  GHS: {
    code: 'GHS',
    symbol: 'GH₵',
    name: 'Cedi Ghanéen',
    ratePerUsd: 15.5,
    decimals: 2,
    symbolPosition: 'before',
  },
  GNF: {
    code: 'GNF',
    symbol: 'FG',
    name: 'Franc Guinéen',
    ratePerUsd: 8650,
    decimals: 0,
    symbolPosition: 'after',
  },
  RWF: {
    code: 'RWF',
    symbol: 'FRw',
    name: 'Franc Rwandais',
    ratePerUsd: 1350,
    decimals: 0,
    symbolPosition: 'after',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Dollar Canadien',
    ratePerUsd: 1.36,
    decimals: 2,
    symbolPosition: 'before',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'Livre Sterling',
    ratePerUsd: 0.79,
    decimals: 2,
    symbolPosition: 'before',
  },
  MAD: {
    code: 'MAD',
    symbol: 'DH',
    name: 'Dirham Marocain',
    ratePerUsd: 10.0,
    decimals: 2,
    symbolPosition: 'after',
  },
  DZD: {
    code: 'DZD',
    symbol: 'DA',
    name: 'Dinar Algérien',
    ratePerUsd: 135.0,
    decimals: 2,
    symbolPosition: 'after',
  },
  TND: {
    code: 'TND',
    symbol: 'DT',
    name: 'Dinar Tunisien',
    ratePerUsd: 3.1,
    decimals: 2,
    symbolPosition: 'after',
  },
  EGP: {
    code: 'EGP',
    symbol: 'E£',
    name: 'Livre Égyptienne',
    ratePerUsd: 49.0,
    decimals: 2,
    symbolPosition: 'after',
  },
  TZS: {
    code: 'TZS',
    symbol: 'TSh',
    name: 'Shilling Tanzanien',
    ratePerUsd: 2650,
    decimals: 0,
    symbolPosition: 'after',
  },
  UGX: {
    code: 'UGX',
    symbol: 'USh',
    name: 'Shilling Ougandais',
    ratePerUsd: 3750,
    decimals: 0,
    symbolPosition: 'after',
  },
  BIF: {
    code: 'BIF',
    symbol: 'FBu',
    name: 'Franc Burundais',
    ratePerUsd: 2900,
    decimals: 0,
    symbolPosition: 'after',
  },
  AOA: {
    code: 'AOA',
    symbol: 'Kz',
    name: 'Kwanza Angolais',
    ratePerUsd: 910,
    decimals: 0,
    symbolPosition: 'after',
  },
  USDT: {
    code: 'USDT',
    symbol: 'USDT',
    name: 'Tether TRC-20',
    ratePerUsd: 1.0,
    decimals: 2,
    symbolPosition: 'after',
  },
};

/**
 * Récupère la devise officielle d'après le pays de résidence
 */
export function getCurrencyForCountry(countryNameOrCode?: string): CurrencyMetadata {
  if (!countryNameOrCode) return CURRENCY_REGISTRY.CDF; // Default pour ce projet prioritaire RDC

  const clean = countryNameOrCode.toLowerCase();

  // 1. Détection prioritaire RDC
  if (
    clean.includes('rdc') ||
    clean.includes('kinshasa') ||
    clean.includes('démocratique du congo') ||
    clean === 'cd'
  ) {
    return CURRENCY_REGISTRY.CDF;
  }

  // 2. Détection Congo-Brazzaville
  if (
    clean.includes('brazzaville') ||
    (clean.includes('congo') && !clean.includes('rdc') && !clean.includes('démocratique')) ||
    clean === 'cg'
  ) {
    return CURRENCY_REGISTRY.XAF;
  }

  // 3. Recherche dans la liste des 54 pays africains
  const matched = ALL_AFRICAN_COUNTRIES.find(
    (c) =>
      c.name.toLowerCase() === clean ||
      c.code.toLowerCase() === clean ||
      clean.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(clean)
  );

  if (matched && matched.currency) {
    // Cas où la devise est 'CDF/USD'
    const primaryCode = matched.currency.split('/')[0].trim().toUpperCase();
    if (CURRENCY_REGISTRY[primaryCode]) {
      return CURRENCY_REGISTRY[primaryCode];
    }
  }

  // 4. Détections internationales directes
  if (clean.includes('france') || clean.includes('belgique') || clean === 'fr' || clean === 'be') {
    return CURRENCY_REGISTRY.EUR;
  }
  if (clean.includes('états-unis') || clean.includes('usa') || clean === 'us') {
    return CURRENCY_REGISTRY.USD;
  }
  if (clean.includes('canada') || clean === 'ca') {
    return CURRENCY_REGISTRY.CAD;
  }
  if (clean.includes('royaume-uni') || clean.includes('uk') || clean === 'gb') {
    return CURRENCY_REGISTRY.GBP;
  }

  return CURRENCY_REGISTRY.CDF;
}

/**
 * Convertit un montant exprimé en XOF (base du système) vers la devise cible
 */
export function convertXofToCurrency(amountXof: number, targetCurrencyCode: string): number {
  const target = CURRENCY_REGISTRY[targetCurrencyCode] || CURRENCY_REGISTRY.CDF;
  // 1 USD = 625 XOF
  const amountUsd = amountXof / 625;
  const converted = amountUsd * target.ratePerUsd;

  if (target.decimals === 0) {
    return Math.round(converted);
  }
  return parseFloat(converted.toFixed(target.decimals));
}

/**
 * Convertit un montant exprimé en USD (référence 1.99$) vers la devise cible
 */
export function convertUsdToCurrency(amountUsd: number, targetCurrencyCode: string): number {
  const target = CURRENCY_REGISTRY[targetCurrencyCode] || CURRENCY_REGISTRY.CDF;
  const converted = amountUsd * target.ratePerUsd;

  if (target.decimals === 0) {
    return Math.round(converted);
  }
  return parseFloat(converted.toFixed(target.decimals));
}

/**
 * Formate un montant dans la devise du pays
 * Exemple : 5700 CDF, 1 250 FCFA, 1,99 $, 1,85 €
 */
export function formatAmountWithCurrency(
  amount: number,
  currencyCodeOrCountry: string,
  options?: { showApproxUsd?: boolean }
): string {
  let meta: CurrencyMetadata;

  if (CURRENCY_REGISTRY[currencyCodeOrCountry]) {
    meta = CURRENCY_REGISTRY[currencyCodeOrCountry];
  } else {
    meta = getCurrencyForCountry(currencyCodeOrCountry);
  }

  const formattedNum = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });

  const mainString =
    meta.symbolPosition === 'before'
      ? `${meta.symbol} ${formattedNum}`
      : `${formattedNum} ${meta.symbol}`;

  if (options?.showApproxUsd && meta.code !== 'USD') {
    const approxUsd = (amount / meta.ratePerUsd).toFixed(2);
    return `${mainString} (~${approxUsd} $)`;
  }

  return mainString;
}

/**
 * Formate un montant de base XOF directement adapté au pays de l'utilisateur
 */
export function formatXofForUserCountry(
  amountXof: number,
  userCountryOrCurrency: string,
  options?: { showApproxUsd?: boolean }
): string {
  const meta = CURRENCY_REGISTRY[userCountryOrCurrency] || getCurrencyForCountry(userCountryOrCurrency);
  const localAmount = convertXofToCurrency(amountXof, meta.code);
  return formatAmountWithCurrency(localAmount, meta.code, options);
}

/**
 * Calcul du prix adapté pour le Pass Visionneur (Base 1,99 USD)
 */
export function getAdaptedPassPrice(countryOrCurrency: string): {
  localAmount: number;
  currencyCode: string;
  currencySymbol: string;
  formatted: string;
  equivalentUsdString: string;
} {
  const meta = CURRENCY_REGISTRY[countryOrCurrency] || getCurrencyForCountry(countryOrCurrency);
  const localAmount = convertUsdToCurrency(1.99, meta.code);

  return {
    localAmount,
    currencyCode: meta.code,
    currencySymbol: meta.symbol,
    formatted: formatAmountWithCurrency(localAmount, meta.code),
    equivalentUsdString: '1,99 $',
  };
}
