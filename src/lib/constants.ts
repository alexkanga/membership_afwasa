// AAEA / AfWASA Brand Colors
export const COLORS = {
  violet: {
    primary: '#362981',
    secondary: '#372D72',
    dark: '#37305E',
  },
  green: {
    primary: '#009446',
    secondary: '#0A8E4D',
  },
  teal: {
    primary: '#029CB1',
    dark: '#0C7998',
  },
  blue: {
    light: '#9AD2E2',
  },
  neutral: {
    aqua: '#C7FFEE',
    white: '#EBF8F9',
    pure: '#FFFFFF',
  },
} as const;

// Status color mapping
export const STATUS_COLORS = {
  green: 'bg-emerald-500 text-white',
  orange: 'bg-amber-500 text-white',
  red: 'bg-red-500 text-white',
  blue: 'bg-[#029CB1] text-white',
  gray: 'bg-gray-400 text-white',
  violet: 'bg-[#362981] text-white',
} as const;

// KPI Threshold defaults
export const THRESHOLDS = {
  paymentRate: { green: 80, orange: 60 },
  recoveryRate: { green: 85, orange: 65 },
  activationRate: { green: 80, orange: 60 },
  duplicateEmails: { green: 0, orange: 10 },
  unaccountedPayments: { green: 0, orange: 10 },
  oldDebt90Days: { green: 5, orange: 15 },
} as const;

// African countries list for geo classification
export const AFRICAN_COUNTRIES = [
  'Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cabo Verde','Cameroon',
  'Central African Republic','Chad','Comoros','Congo','Côte d\'Ivoire','Cote d\'Ivoire',
  'Ivory Coast','Democratic Republic of the Congo','Djibouti','Egypt','Equatorial Guinea',
  'Eritrea','Eswatini','Ethiopia','Gabon','Gambia','Ghana','Guinea','Guinea-Bissau',
  'Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi','Mali','Mauritania',
  'Mauritius','Morocco','Mozambique','Namibia','Niger','Nigeria','Rwanda','São Tomé and Príncipe',
  'Senegal','Seychelles','Sierra Leone','Somalia','South Africa','South Sudan','Sudan',
  'Tanzania','Togo','Tunisia','Uganda','Zambia','Zimbabwe',
  // French names
  'Algérie','Bénin','Botswana','Burkina Faso','Burundi','Cameroun','Congo','Côte d\'Ivoire',
  'République Démocratique du Congo','République du Congo','Djibouti','Égypte','Érythrée',
  'Eswatini','Éthiopie','Gabon','Gambie','Ghana','Guinée','Guinée-Bissau','Kenya',
  'Lesotho','Liberia','Libye','Madagascar','Malawi','Mali','Mauritanie','Maroc',
  'Mozambique','Namibie','Niger','Nigeria','Ouganda','Rwanda','Sénégal','Seychelles',
  'Sierra Leone','Somalie','Soudan','Soudan du Sud','Tanzanie','Tchad','Togo','Tunisie',
  'Zambie','Zimbabwe','Afrique du Sud','Cap-Vert','Comores','Guinée équatoriale',
  'Maurice','Sao Tomé-et-Principe','Réunion','Mayotte',
] as const;

export const AFRICAN_REGIONS: Record<string, string> = {
  'North Africa': 'Maghreb / Afrique du Nord',
  'West Africa': 'Afrique de l\'Ouest',
  'East Africa': 'Afrique de l\'Est',
  'Central Africa': 'Afrique Centrale',
  'Southern Africa': 'Afrique Australe',
};

export const REGION_COUNTRY_MAP: Record<string, string> = {
  'Morocco': 'North Africa', 'Algeria': 'North Africa', 'Tunisia': 'North Africa',
  'Libya': 'North Africa', 'Egypt': 'North Africa', 'Sudan': 'North Africa',
  'Maroc': 'North Africa', 'Algérie': 'North Africa', 'Tunisie': 'North Africa',
  'Libye': 'North Africa', 'Égypte': 'North Africa', 'Soudan': 'North Africa',
  'Senegal': 'West Africa', 'Gambia': 'West Africa', 'Guinea-Bissau': 'West Africa',
  'Guinea': 'West Africa', 'Sierra Leone': 'West Africa', 'Liberia': 'West Africa',
  'Côte d\'Ivoire': 'West Africa', 'Cote d\'Ivoire': 'West Africa', 'Ivory Coast': 'West Africa',
  'Ghana': 'West Africa', 'Togo': 'West Africa', 'Benin': 'West Africa',
  'Burkina Faso': 'West Africa', 'Mali': 'West Africa', 'Nigeria': 'West Africa',
  'Niger': 'West Africa', 'Mauritania': 'West Africa', 'Senegal': 'West Africa',
  'Sénégal': 'West Africa', 'Gambie': 'West Africa', 'Guinée-Bissau': 'West Africa',
  'Guinée': 'West Africa', 'Bénin': 'West Africa',
  'Cape Verde': 'West Africa', 'Cabo Verde': 'West Africa', 'Cap-Vert': 'West Africa',
  'Chad': 'Central Africa', 'Cameroon': 'Central Africa',
  'Central African Republic': 'Central Africa', 'Gabon': 'Central Africa',
  'Congo': 'Central Africa', 'Equatorial Guinea': 'Central Africa',
  'Tchad': 'Central Africa', 'Cameroun': 'Central Africa',
  'République Centrafricaine': 'Central Africa', 'Guinée équatoriale': 'Central Africa',
  'République Démocratique du Congo': 'Central Africa',
  'Democratic Republic of the Congo': 'Central Africa',
  'São Tomé and Príncipe': 'Central Africa',
  'Ethiopia': 'East Africa', 'Eritrea': 'East Africa', 'Djibouti': 'East Africa',
  'Somalia': 'East Africa', 'Kenya': 'East Africa', 'Uganda': 'East Africa',
  'Rwanda': 'East Africa', 'Burundi': 'East Africa', 'Tanzania': 'East Africa',
  'South Sudan': 'East Africa',
  'Éthiopie': 'East Africa', 'Érythrée': 'East Africa', 'Somalie': 'East Africa',
  'Ouganda': 'East Africa', 'Tanzanie': 'East Africa', 'Soudan du Sud': 'East Africa',
  'Angola': 'Southern Africa', 'Malawi': 'Southern Africa', 'Mozambique': 'Southern Africa',
  'Zambia': 'Southern Africa', 'Zimbabwe': 'Southern Africa', 'Botswana': 'Southern Africa',
  'Namibia': 'Southern Africa', 'South Africa': 'Southern Africa', 'Eswatini': 'Southern Africa',
  'Lesotho': 'Southern Africa', 'Madagascar': 'Southern Africa',
  'Mauritius': 'Southern Africa', 'Seychelles': 'Southern Africa',
  'Afrique du Sud': 'Southern Africa', 'Mozambique': 'Southern Africa',
  'Zambie': 'Southern Africa', 'Zimbabwe': 'Southern Africa', 'Botswana': 'Southern Africa',
  'Namibie': 'Southern Africa', 'Madagascar': 'Southern Africa', 'Maurice': 'Southern Africa',
  'Réunion': 'Southern Africa', 'Mayotte': 'Southern Africa',
} as const;

// Excel column mapping
export const EXCEL_COLUMNS = [
  'PLAN_ADHESION',
  'SOCIETE / INSTITUTION / UNIVERSITE',
  'PAYS',
  'EMAIL',
  'MONTANT',
  'DATE INSCRIPTION',
  'NUM FACTURE',
  'MODE PAIEMENT',
  'DATE PAIEMENT / ACTIVATION',
  'ID',
  'EST ACTIVE ?',
  'TYPE ADHESION',
  'CODE MEMBRE',
  'DATE PAIEMENT COMPTABILITE',
  'A PAYE ?',
] as const;

export const EXPECTED_SHEET = 'INSCRIPTIONS ET ADHESIONS';

// Dashboard pages
export const DASHBOARD_PAGES = [
  { id: 'executive', label: 'Vue Exécutive', icon: 'LayoutDashboard' },
  { id: 'members', label: 'Portefeuille Membres', icon: 'Users' },
  { id: 'geography', label: 'Géographie', icon: 'Globe' },
  { id: 'finance', label: 'Cotisations & Recouvrement', icon: 'DollarSign' },
  { id: 'renewals', label: 'Renouvellements', icon: 'RefreshCw' },
  { id: 'quality', label: 'Qualité des Données', icon: 'ShieldCheck' },
  { id: 'risks', label: 'Risques & Alertes', icon: 'AlertTriangle' },
  { id: 'uploads', label: 'Historique Uploads', icon: 'Upload' },
  { id: 'admin', label: 'Administration', icon: 'Settings' },
] as const;
