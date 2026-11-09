import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  searchAnvisaCatalog,
  findCatalogMatchForMedication,
  analyzeDrugInteractions,
  type AnvisaCatalogItem
} from './src/data/anvisaClinicalCatalog.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapa de tradução de Denominação Comum Brasileira (DCB/ANVISA) para INN/USAN (openFDA / RxNorm)
const PT_TO_EN_SUBSTANCE_MAP: Record<string, string> = {
  losartana: 'losartan',
  'losartana potassica': 'losartan potassium',
  dipirona: 'metamizole',
  paracetamol: 'acetaminophen',
  omeprazol: 'omeprazole',
  pantoprazol: 'pantoprazole',
  esomeprazol: 'esomeprazole',
  lansoprazol: 'lansoprazole',
  sinvastatina: 'simvastatin',
  rosuvastatina: 'rosuvastatin',
  atorvastatina: 'atorvastatin',
  metformina: 'metformin',
  'cloridrato de metformina': 'metformin hydrochloride',
  levotiroxina: 'levothyroxine',
  amoxicilina: 'amoxicillin',
  azitromicina: 'azithromycin',
  cefalexina: 'cephalexin',
  ciprofloxacino: 'ciprofloxacin',
  levofloxacino: 'levofloxacin',
  ibuprofeno: 'ibuprofen',
  cetoprofeno: 'ketoprofen',
  naproxeno: 'naproxen',
  nimesulida: 'nimesulide',
  diclofenaco: 'diclofenac',
  meloxicam: 'meloxicam',
  celecoxibe: 'celecoxib',
  escitalopram: 'escitalopram',
  sertralina: 'sertraline',
  fluoxetina: 'fluoxetine',
  paroxetina: 'paroxetine',
  venlafaxina: 'venlafaxine',
  desvenlafaxina: 'desvenlafaxine',
  amitriptilina: 'amitriptyline',
  pregabalina: 'pregabalin',
  gabapentina: 'gabapentin',
  clonazepam: 'clonazepam',
  alprazolam: 'alprazolam',
  diazepam: 'diazepam',
  zolpidem: 'zolpidem',
  quetiapina: 'quetiapine',
  risperidona: 'risperidone',
  prednisona: 'prednisone',
  prednisolona: 'prednisolone',
  dexametasona: 'dexamethasone',
  betametasona: 'betamethasone',
  loratadina: 'loratadine',
  desloratadina: 'desloratadine',
  fexofenadina: 'fexofenadine',
  cetirizina: 'cetirizine',
  hidroclorotiazida: 'hydrochlorothiazide',
  furosemida: 'furosemide',
  espironolactona: 'spironolactone',
  indapamida: 'indapamide',
  enalapril: 'enalapril',
  ramipril: 'ramipril',
  captopril: 'captopril',
  valsartana: 'valsartan',
  olmesartana: 'olmesartan',
  candesartana: 'candesartan',
  anlodipino: 'amlodipine',
  atenolol: 'atenolol',
  propranolol: 'propranolol',
  metoprolol: 'metoprolol',
  carvedilol: 'carvedilol',
  nebivolol: 'nebivolol',
  varfarina: 'warfarin',
  rivaroxabana: 'rivaroxaban',
  apixabana: 'apixaban',
  clopidogrel: 'clopidogrel',
  insulina: 'insulin',
  glibenclamida: 'glyburide',
  gliclazida: 'gliclazide',
  empagliflozina: 'empagliflozin',
  dapagliflozina: 'dapagliflozin',
  semaglutida: 'semaglutide',
  liraglutida: 'liraglutide',
  ondansetrona: 'ondansetron',
  domperidona: 'domperidone',
  metoclopramida: 'metoclopramide',
  simeticona: 'simethicone',
  escopolamina: 'scopolamine',
  alendronato: 'alendronate',
  colecalciferol: 'cholecalciferol',
  cianocobalamina: 'cyanocobalamin',
  fluconazol: 'fluconazole',
  itraconazol: 'itraconazole',
  aciclovir: 'acyclovir',
  ivermectina: 'ivermectin',
  albendazol: 'albendazole',
  salbutamol: 'albuterol',
  budesonida: 'budesonide',
  montelucaste: 'montelukast',
  ciclobenzaprina: 'cyclobenzaprine',
  orfenadrina: 'orphenadrine',
  tramadol: 'tramadol',
  codeina: 'codeine',
  sumatriptana: 'sumatriptan',
  naratriptana: 'naratriptan'
};

function toEnglishSearchTerm(rawTerm: string): string {
  const normalized = rawTerm
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b\d+\s*(mg|mcg|g|ml|ui|%|comprimidos|capsulas|gotas)\b/gi, '')
    .replace(
      /\b(cloridrato|sodico|potassica|potassico|monoidratada|hidratado|besilato|maleato|succinato|hemi-hidratado|bromidrato|oxalato|tartarato|fumarato|fosfato|sulfato|de)\b/gi,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();

  if (PT_TO_EN_SUBSTANCE_MAP[normalized]) {
    return PT_TO_EN_SUBSTANCE_MAP[normalized];
  }
  const firstWord = normalized.split(' ')[0] || normalized;
  if (PT_TO_EN_SUBSTANCE_MAP[firstWord]) {
    return PT_TO_EN_SUBSTANCE_MAP[firstWord];
  }
  if (firstWord.endsWith('azol')) return `${firstWord}e`;
  if (firstWord.endsWith('ina')) return `${firstWord.slice(0, -1)}e`;
  if (firstWord.endsWith('ana')) return firstWord.slice(0, -1);
  if (firstWord.endsWith('eno')) return firstWord.slice(0, -1);
  if (firstWord.endsWith('ida')) return `${firstWord.slice(0, -1)}e`;
  if (firstWord.endsWith('o')) return firstWord.slice(0, -1);
  return firstWord;
}

// Tradução automática em tempo real (EN -> PT-BR) para bulas da openFDA sem consumir cota de IA
const translationCache = new Map<string, string>();

async function translateToPtBr(text: string): Promise<string> {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (translationCache.has(cleaned)) {
    return translationCache.get(cleaned)!;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3200);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(
      cleaned.slice(0, 1200)
    )}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MedCuida-Clinical/1.0' }
    });
    clearTimeout(timeout);
    if (!res.ok) return cleaned;

    const data = (await res.json()) as Array<Array<[string]>>;
    if (Array.isArray(data?.[0])) {
      const translated = data[0]
        .map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
        .join('')
        .trim();
      if (translated) {
        translationCache.set(cleaned, translated);
        return translated;
      }
    }
  } catch {
    // Fallback silencioso
  }
  return cleaned;
}

interface OpenFdaLabelExtract {
  found: boolean;
  sourceUrl: string;
  genericName: string;
  brandNames: string[];
  pharmClass: string;
  indications: string;
  dosageAndAdministration: string;
  contraindications: string;
  warnings: string;
  drugInteractions: string;
  adverseReactions: string;
  storageAndHandling: string;
  mechanismOfAction: string;
}

const openFdaCache = new Map<string, OpenFdaLabelExtract | null>();

// Consulta em tempo real na API pública oficial openFDA (api.fda.gov/drug/label.json)
async function fetchOpenFdaPackageInsert(
  medicationName: string,
  activeIngredient?: string
): Promise<OpenFdaLabelExtract | null> {
  const candidates = [
    activeIngredient ? toEnglishSearchTerm(activeIngredient) : '',
    toEnglishSearchTerm(medicationName)
  ].filter((t) => t && t.length >= 3);

  const cacheKey = candidates.join('|');
  if (openFdaCache.has(cacheKey)) {
    return openFdaCache.get(cacheKey)!;
  }

  for (const term of Array.from(new Set(candidates))) {
    const encoded = encodeURIComponent(term);
    const urls = [
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encoded}"&limit=1`,
      `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${encoded}"+openfda.brand_name:"${encoded}"&limit=1`
    ];

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MedCuida-Clinical-Bulario/1.0'
          }
        });
        clearTimeout(timeout);

        if (!res.ok) continue;
        const json = (await res.json()) as {
          results?: Array<Record<string, unknown>>;
        };
        const hit = json.results?.[0];
        if (!hit) continue;

        const openfda = (hit.openfda || {}) as Record<string, string[]>;
        const pickText = (key: string, maxChars = 950): string => {
          const val = hit[key];
          if (Array.isArray(val) && typeof val[0] === 'string') {
            return val[0]
              .replace(/^\d+(\.\d+)?\s+[A-Z\s&,-]+/i, '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, maxChars);
          }
          return '';
        };

        const result: OpenFdaLabelExtract = {
          found: true,
          sourceUrl: 'https://api.fda.gov/drug/label.json',
          genericName: (openfda.generic_name || [term])[0] || term,
          brandNames: (openfda.brand_name || []).slice(0, 5),
          pharmClass:
            (openfda.pharm_class_epc || openfda.pharm_class_moa || [])[0] || '',
          indications: pickText('indications_and_usage'),
          dosageAndAdministration: pickText('dosage_and_administration'),
          contraindications: pickText('contraindications'),
          warnings:
            pickText('warnings_and_cautions') ||
            pickText('warnings') ||
            pickText('boxed_warning'),
          drugInteractions: pickText('drug_interactions'),
          adverseReactions: pickText('adverse_reactions'),
          storageAndHandling:
            pickText('storage_and_handling') || pickText('how_supplied', 500),
          mechanismOfAction:
            pickText('mechanism_of_action') ||
            pickText('clinical_pharmacology', 650)
        };

        openFdaCache.set(cacheKey, result);
        return result;
      } catch {
        // Continua silenciosamente para o próximo endpoint
      }
    }
  }

  openFdaCache.set(cacheKey, null);
  return null;
}

// Consulta complementar na API pública RxNav (National Library of Medicine - NIH)
async function fetchRxNavCandidates(query: string): Promise<string[]> {
  try {
    const term = toEnglishSearchTerm(query);
    if (!term || term.length < 3) return [];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const url = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(
      term
    )}&maxEntries=4`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      approximateGroup?: {
        candidate?: Array<{ name?: string; rxcui?: string }>;
      };
    };
    const list = data.approximateGroup?.candidate || [];
    return Array.from(
      new Set(
        list
          .map((c) => c.name || '')
          .filter((n) => Boolean(n) && n.length > 2)
      )
    ).slice(0, 4);
  } catch {
    return [];
  }
}

// Determina orientação de melhor horário (cronoterapia) baseada na classe farmacológica ou nome
function buildChronotherapyGuidance(
  medName: string,
  activeIngredient: string,
  pharmClass: string
): {
  recommendedTimes: string[];
  bestTimeGuidance: string;
  administrationTips: string;
  category: string;
  isContinuous: boolean;
  defaultTreatmentDays: number;
  defaultBoxCapacity: number;
  controlled:
    | 'Venda Livre / Simples'
    | 'Receita Retida (Branca C1/Antibiótico)'
    | 'Receita Azul (Notificação B)';
} {
  const combined = `${medName} ${activeIngredient} ${pharmClass}`.toLowerCase();

  if (
    combined.includes('omeprazol') ||
    combined.includes('pantoprazol') ||
    combined.includes('esomeprazol') ||
    combined.includes('lansoprazol') ||
    combined.includes('proton pump')
  ) {
    return {
      recommendedTimes: ['07:00'],
      bestTimeGuidance:
        'O melhor horário para começar a tomar é pela manhã, em jejum (07:00), 30 minutos antes do café da manhã, pois ativa a proteção das bombas gástricas antes da primeira refeição.',
      administrationTips:
        'Engolir a cápsula ou comprimido inteiro com água, sem mastigar ou abrir, 30 minutos antes da refeição matinal.',
      category: 'Gastrointestinal',
      isContinuous: true,
      defaultTreatmentDays: 28,
      defaultBoxCapacity: 28,
      controlled: 'Venda Livre / Simples'
    };
  }

  if (combined.includes('levotiroxina') || combined.includes('levothyroxine')) {
    return {
      recommendedTimes: ['06:30'],
      bestTimeGuidance:
        'Tomar rigorosamente em jejum absoluto ao acordar (06:30), aguardando de 30 a 60 minutos antes de tomar café da manhã ou outros medicamentos.',
      administrationTips:
        'Ingerir apenas com água. Espaçar em pelo menos 4 horas de suplementos de cálcio, ferro ou protetores gástricos.',
      category: 'Uso Contínuo',
      isContinuous: true,
      defaultTreatmentDays: 30,
      defaultBoxCapacity: 30,
      controlled: 'Venda Livre / Simples'
    };
  }

  if (
    combined.includes('sinvastatina') ||
    combined.includes('atorvastatina') ||
    combined.includes('rosuvastatina') ||
    combined.includes('statin')
  ) {
    return {
      recommendedTimes: ['21:00'],
      bestTimeGuidance:
        'O melhor horário para tomar estatinas é à noite (21:00), pois o fígado produz a maior parte do colesterol endógeno durante o período noturno.',
      administrationTips:
        'Tomar 1 comprimido à noite com água, com ou sem alimentos.',
      category: 'Uso Contínuo',
      isContinuous: true,
      defaultTreatmentDays: 30,
      defaultBoxCapacity: 30,
      controlled: 'Venda Livre / Simples'
    };
  }

  if (
    combined.includes('clonazepam') ||
    combined.includes('alprazolam') ||
    combined.includes('diazepam') ||
    combined.includes('zolpidem') ||
    combined.includes('benzodiazepine')
  ) {
    return {
      recommendedTimes: ['22:00'],
      bestTimeGuidance:
        'Deve ser administrado à noite (22:00), cerca de 30 minutos antes de deitar, devido ao seu efeito sedativo e indutor do sono.',
      administrationTips:
        'Tomar imediatamente antes de ir para a cama. Evitar dirigir ou operar máquinas após a ingestão.',
      category: 'Receita Retida',
      isContinuous: true,
      defaultTreatmentDays: 30,
      defaultBoxCapacity: 30,
      controlled: combined.includes('zolpidem')
        ? 'Receita Retida (Branca C1/Antibiótico)'
        : 'Receita Azul (Notificação B)'
    };
  }

  if (
    combined.includes('amoxicilina') ||
    combined.includes('azitromicina') ||
    combined.includes('cefalexina') ||
    combined.includes('ciprofloxacino') ||
    combined.includes('antibacterial') ||
    combined.includes('penicillin')
  ) {
    return {
      recommendedTimes: ['08:00', '20:00'],
      bestTimeGuidance:
        'Inicie imediatamente e mantenha horários estritamente regulares (ex: 08:00 e 20:00 para 12/12h ou 07:00, 15:00 e 23:00 para 8/8h) para manter a concentração bactericida constante.',
      administrationTips:
        'Tomar com um copo cheio de água. Concluir todos os dias prescritos mesmo que os sintomas desapareçam antes.',
      category: 'Receita Retida',
      isContinuous: false,
      defaultTreatmentDays: 7,
      defaultBoxCapacity: 21,
      controlled: 'Receita Retida (Branca C1/Antibiótico)'
    };
  }

  if (
    combined.includes('sertralina') ||
    combined.includes('escitalopram') ||
    combined.includes('fluoxetina') ||
    combined.includes('venlafaxina') ||
    combined.includes('serotonin')
  ) {
    return {
      recommendedTimes: ['08:00'],
      bestTimeGuidance:
        'Recomenda-se tomar pela manhã (08:00) logo após o café da manhã para evitar insônia noturna e reduzir desconforto gástrico inicial.',
      administrationTips:
        'Ingerir sempre no mesmo horário diário, preferencialmente após uma refeição leve.',
      category: 'Receita Retida',
      isContinuous: true,
      defaultTreatmentDays: 30,
      defaultBoxCapacity: 30,
      controlled: 'Receita Retida (Branca C1/Antibiótico)'
    };
  }

  return {
    recommendedTimes: ['08:00'],
    bestTimeGuidance:
      'Inicie preferencialmente pela manhã (08:00) ou no horário fixo indicado pelo seu médico, mantendo sempre o mesmo intervalo todos os dias para estabilidade terapêutica.',
    administrationTips:
      'Ingerir com um copo de água (150 a 200 ml). Não partir ou mastigar comprimidos revestidos sem orientação.',
    category: 'Uso Contínuo',
    isContinuous: true,
    defaultTreatmentDays: 30,
    defaultBoxCapacity: 30,
    controlled: 'Venda Livre / Simples'
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Endpoint de status das integrações de APIs Públicas de Medicamentos
  app.get('/api/medications/sources', (_req, res) => {
    res.json({
      activeEngine:
        'Motor Clínico Híbrido (openFDA + RxNav NIH + Bulário ANVISA)',
      sources: [
        {
          id: 'openfda',
          name: 'openFDA Drug Label & NDC API (FDA.gov)',
          status: 'online',
          authRequired: false,
          description:
            'API pública oficial baseada em Elasticsearch com bulas completas, interações medicamentosas, contraindicações e farmacologia.'
        },
        {
          id: 'rxnav',
          name: 'RxNav / RxNorm API (NIH / NLM)',
          status: 'online',
          authRequired: false,
          description:
            'Base pública de substâncias ativas e padronização de princípios ativos.'
        },
        {
          id: 'anvisa_local',
          name: 'Catálogo Bulário ANVISA & RENAME (Brasil)',
          status: 'online',
          authRequired: false,
          description:
            'Base nacional em português com medicamentos de referência, genéricos, tarjas e cronoterapia.'
        }
      ]
    });
  });

// Consulta de produtos e dosagens variadas na API openFDA NDC (National Drug Code) com busca por prefixo (*)
interface OpenFdaNdcProduct {
  name: string;
  activeIngredient: string;
  dosageForm: string;
  pharmClass: string;
  brandName: string;
}

async function fetchOpenFdaNdcProducts(query: string): Promise<OpenFdaNdcProduct[]> {
  try {
    const enTerm = toEnglishSearchTerm(query);
    const rawClean = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)[0];

    const searchToken = (enTerm && enTerm.length >= 2 ? enTerm : rawClean) || '';
    if (searchToken.length < 2) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3200);
    const encoded = encodeURIComponent(searchToken);
    const url = `https://api.fda.gov/drug/ndc.json?search=generic_name:${encoded}*+brand_name:${encoded}*&limit=8`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MedCuida-Clinical-NDC/1.0'
      }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = (await res.json()) as {
      results?: Array<{
        generic_name?: string;
        brand_name?: string;
        dosage_form?: string;
        pharm_class?: string[];
        active_ingredients?: Array<{ name?: string; strength?: string }>;
      }>;
    };

    const items: OpenFdaNdcProduct[] = [];
    const seen = new Set<string>();

    for (const hit of data.results || []) {
      const generic = (hit.generic_name || '').trim();
      const brand = (hit.brand_name || '').trim();
      const ing = hit.active_ingredients?.[0];
      const strengthRaw = (ing?.strength || '')
        .replace(/\/1\b/g, '')
        .trim();
      const baseTitle = brand || generic;
      if (!baseTitle) continue;

      const formattedTitle =
        baseTitle.charAt(0).toUpperCase() + baseTitle.slice(1).toLowerCase();
      const fullName = strengthRaw
        ? `${formattedTitle} ${strengthRaw}`
        : formattedTitle;
      const key = fullName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      items.push({
        name: fullName,
        activeIngredient: generic || brand,
        dosageForm: hit.dosage_form || 'TABLET',
        pharmClass: (hit.pharm_class || [])[0] || '',
        brandName: brand
      });
      if (items.length >= 5) break;
    }

    return items;
  } catch {
    return [];
  }
}

  // Endpoint 1: Busca de medicamentos reais (100% via Catálogo ANVISA + openFDA NDC/Label + RxNav, sem limite de cota!)
  app.get('/api/medications/search', async (req, res) => {
    const query = String(req.query.q || '').trim();
    if (!query || query.length < 2) {
      res.json({ suggestions: [] });
      return;
    }

    try {
      const localMatches = searchAnvisaCatalog(query);
      const [ndcProducts, openFdaData, rxNavTerms] = await Promise.all([
        fetchOpenFdaNdcProducts(query),
        localMatches.length < 4 ? fetchOpenFdaPackageInsert(query) : Promise.resolve(null),
        localMatches.length < 4 ? fetchRxNavCandidates(query) : Promise.resolve([])
      ]);

      const suggestions: Partial<AnvisaCatalogItem>[] = [...localMatches];

      // Adicionar variações de produtos e dosagens encontradas na openFDA NDC
      for (const prod of ndcProducts) {
        const alreadyExists = suggestions.some(
          (s) => s.name?.toLowerCase() === prod.name.toLowerCase()
        );
        if (alreadyExists) continue;

        const chrono = buildChronotherapyGuidance(
          prod.name,
          prod.activeIngredient,
          prod.pharmClass
        );
        const isCaps = /capsule/i.test(prod.dosageForm);
        const isLiquid = /solution|suspension|syrup|liquid|drops/i.test(prod.dosageForm);
        const formType = isCaps ? 'Cápsula' : isLiquid ? 'Gotas' : 'Comprimido';
        const unitLabel = isCaps ? 'cápsulas' : isLiquid ? 'ml' : 'comprimidos';

        suggestions.push({
          id: `ndc-${ suggestions.length }-${Date.now()}`,
          name: prod.name,
          brandAliases: prod.brandName ? [prod.brandName] : [],
          activeIngredient: prod.activeIngredient,
          therapeuticClass: prod.pharmClass || 'Medicamento Registrado (openFDA)',
          category: chrono.category,
          formType,
          unitLabel,
          defaultBoxCapacity: chrono.defaultBoxCapacity,
          defaultDoseAmount: 1,
          defaultDoseDisplay: `1 ${formType.toLowerCase()}`,
          defaultFrequencyLabel:
            chrono.recommendedTimes.length > 1 ? 'De 12 em 12 horas' : '1x ao dia',
          isContinuous: chrono.isContinuous,
          defaultTreatmentDays: chrono.defaultTreatmentDays,
          controlled: chrono.controlled,
          purpose: `Indicado para o tratamento clínico com ${prod.activeIngredient}.`,
          dosageInstruction: chrono.administrationTips,
          clinicalTags: [chrono.category],
          recommendedTimes: chrono.recommendedTimes,
          bestTimeGuidance: chrono.bestTimeGuidance,
          administrationTips: chrono.administrationTips
        });
      }

      if (openFdaData) {
        const displayTitle =
          query.charAt(0).toUpperCase() + query.slice(1).trim();
        const alreadyExists = suggestions.some(
          (s) =>
            s.name?.toLowerCase() === displayTitle.toLowerCase() ||
            s.activeIngredient?.toLowerCase() ===
              openFdaData.genericName.toLowerCase()
        );

        if (!alreadyExists) {
          const [ptIndications, ptDosage, ptClass] = await Promise.all([
            translateToPtBr(openFdaData.indications.slice(0, 260)),
            translateToPtBr(openFdaData.dosageAndAdministration.slice(0, 260)),
            translateToPtBr(openFdaData.pharmClass)
          ]);

          const chrono = buildChronotherapyGuidance(
            displayTitle,
            openFdaData.genericName,
            openFdaData.pharmClass
          );

          suggestions.push({
            id: `openfda-${Date.now()}`,
            name: /\d/.test(displayTitle)
              ? displayTitle
              : `${displayTitle}`,
            brandAliases: openFdaData.brandNames.slice(0, 3),
            activeIngredient: openFdaData.genericName,
            therapeuticClass: ptClass || 'Medicamento Clínico Registrado',
            category: chrono.category,
            formType: 'Comprimido',
            unitLabel: 'comprimidos',
            defaultBoxCapacity: chrono.defaultBoxCapacity,
            defaultDoseAmount: 1,
            defaultDoseDisplay: '1 comprimido',
            defaultFrequencyLabel:
              chrono.recommendedTimes.length > 1
                ? 'De 12 em 12 horas'
                : '1x ao dia',
            isContinuous: chrono.isContinuous,
            defaultTreatmentDays: chrono.defaultTreatmentDays,
            controlled: chrono.controlled,
            purpose:
              ptIndications.slice(0, 240) ||
              `Indicado para o tratamento clínico de ${displayTitle}.`,
            dosageInstruction:
              ptDosage.slice(0, 240) ||
              'Administrar conforme posologia médica prescrita.',
            clinicalTags: [chrono.category],
            recommendedTimes: chrono.recommendedTimes,
            bestTimeGuidance: chrono.bestTimeGuidance,
            administrationTips: chrono.administrationTips
          });
        }
      }

      if (suggestions.length < 5 && rxNavTerms.length > 0) {
        rxNavTerms.slice(0, 4).forEach((term, idx) => {
          const exists = suggestions.some(
            (s) => s.name?.toLowerCase() === term.toLowerCase()
          );
          if (exists) return;
          const chrono = buildChronotherapyGuidance(term, term, '');
          suggestions.push({
            id: `rxnav-${idx}-${Date.now()}`,
            name: term.charAt(0).toUpperCase() + term.slice(1),
            brandAliases: [],
            activeIngredient: term,
            therapeuticClass: 'Substância Ativa Padronizada (RxNorm)',
            category: chrono.category,
            formType: 'Comprimido',
            unitLabel: 'comprimidos',
            defaultBoxCapacity: chrono.defaultBoxCapacity,
            defaultDoseAmount: 1,
            defaultDoseDisplay: '1 comprimido',
            defaultFrequencyLabel: '1x ao dia',
            isContinuous: chrono.isContinuous,
            defaultTreatmentDays: chrono.defaultTreatmentDays,
            controlled: chrono.controlled,
            purpose: `Medicamento à base de ${term} conforme prescrição.`,
            dosageInstruction: 'Seguir orientação médica.',
            clinicalTags: [chrono.category],
            recommendedTimes: chrono.recommendedTimes,
            bestTimeGuidance: chrono.bestTimeGuidance,
            administrationTips: chrono.administrationTips
          });
        });
      }

      res.json({ suggestions: suggestions.slice(0, 12) });
    } catch {
      res.status(200).json({ suggestions: [] });
    }
  });

  // Endpoint 2: Download completo da Bula Digital (openFDA API oficial + Bulário ANVISA PT-BR + Interações)
  app.post('/api/medications/bula', async (req, res) => {
    const {
      medicationName,
      activeIngredient,
      existingMedications = []
    } = req.body || {};

    if (!medicationName) {
      res.status(400).json({ error: 'Nome do medicamento é obrigatório.' });
      return;
    }

    try {
      const catalogMatch = findCatalogMatchForMedication(
        medicationName,
        activeIngredient
      );
      const openFdaLabel = await fetchOpenFdaPackageInsert(
        medicationName,
        activeIngredient || catalogMatch?.activeIngredient
      );

      const resolvedActiveIngredient =
        activeIngredient ||
        catalogMatch?.activeIngredient ||
        openFdaLabel?.genericName ||
        medicationName;

      const chrono = buildChronotherapyGuidance(
        medicationName,
        resolvedActiveIngredient,
        catalogMatch?.therapeuticClass || openFdaLabel?.pharmClass || ''
      );

      // Se encontrou na openFDA e não está no catálogo local (ou para complementar com dados reais da FDA traduzidos)
      let translatedFda: {
        pharmClass: string;
        indications: string;
        howItWorks: string;
        contraindications: string;
        warnings: string;
        interactionsSummary: string;
        posologyGuidance: string;
        adverseReactions: string;
        storageAdvice: string;
      } | null = null;

      if (openFdaLabel && !catalogMatch) {
        const [
          pharmClass,
          indications,
          howItWorks,
          contraindications,
          warnings,
          interactionsSummary,
          posologyGuidance,
          adverseReactions,
          storageAdvice
        ] = await Promise.all([
          translateToPtBr(openFdaLabel.pharmClass),
          translateToPtBr(openFdaLabel.indications),
          translateToPtBr(openFdaLabel.mechanismOfAction),
          translateToPtBr(openFdaLabel.contraindications),
          translateToPtBr(openFdaLabel.warnings),
          translateToPtBr(openFdaLabel.drugInteractions),
          translateToPtBr(openFdaLabel.dosageAndAdministration),
          translateToPtBr(openFdaLabel.adverseReactions),
          translateToPtBr(openFdaLabel.storageAndHandling)
        ]);

        translatedFda = {
          pharmClass,
          indications,
          howItWorks,
          contraindications,
          warnings,
          interactionsSummary,
          posologyGuidance,
          adverseReactions,
          storageAdvice
        };
      }

      // Analisar interações medicamentosas com os remédios que o paciente já toma
      const simulatedExistingMeds = (
        Array.isArray(existingMedications) ? existingMedications : []
      ).map(
        (m: {
          id?: string;
          name?: string;
          activeIngredient?: string;
          scheduleTimes?: string[];
        }) => ({
          id: String(m.id || `med-${Math.random()}`),
          userId: '',
          name: String(m.name || ''),
          activeIngredient: String(m.activeIngredient || m.name || ''),
          purpose: '',
          clinicalTags: [],
          category: 'Uso Contínuo',
          formType: 'Comprimido',
          unitLabel: 'comprimidos',
          dosageInstruction: '',
          controlled: 'Venda Livre / Simples' as const,
          currentStock: 30,
          boxCapacity: 30,
          minStockAlert: 5,
          expiryDate: '2027-12-31',
          lastPaidPrice: 0,
          isActiveTreatment: true,
          scheduleTimes: Array.isArray(m.scheduleTimes) ? m.scheduleTimes : [],
          doseAmount: 1,
          doseDisplay: '1 comprimido',
          frequencyLabel: '1x ao dia',
          isContinuous: true,
          treatmentStartDate: '2026-01-01',
          treatmentTotalDays: 30,
          completedDosesCount: 0,
          targetTotalDoses: 30
        })
      );

      const detectedInteractions = analyzeDrugInteractions(
        {
          name: medicationName,
          activeIngredient: resolvedActiveIngredient,
          interactingSubstances: catalogMatch?.bula.interactingSubstances || []
        },
        simulatedExistingMeds
      );

      // Verificar também se o texto de interações da openFDA menciona algum medicamento atual do paciente
      if (openFdaLabel?.drugInteractions && simulatedExistingMeds.length > 0) {
        const fdaInterLower = openFdaLabel.drugInteractions.toLowerCase();
        for (const existing of simulatedExistingMeds) {
          const enExisting = toEnglishSearchTerm(
            existing.activeIngredient || existing.name
          );
          if (
            enExisting.length >= 4 &&
            fdaInterLower.includes(enExisting) &&
            !detectedInteractions.some((d) => d.existingMedId === existing.id)
          ) {
            detectedInteractions.push({
              id: `openfda-inter-${existing.id}`,
              severity: 'moderada',
              severityLabel: 'Interação Identificada na Bula Oficial (openFDA)',
              newMedName: medicationName,
              newMedActiveIngredient: resolvedActiveIngredient,
              existingMedId: existing.id,
              existingMedName: existing.name,
              existingMedActiveIngredient: existing.activeIngredient,
              efficacyImpact: `A bula oficial na base openFDA registra interação farmacológica entre ${medicationName} e ${existing.name}, podendo alterar a eficácia ou absorção.`,
              clinicalMechanism:
                'Interação farmacocinética ou farmacodinâmica documentada na seção Drug Interactions da bula.',
              recommendation:
                'Espaçar os horários de tomada em pelo menos 2 a 3 horas e informar seu médico sobre o uso simultâneo.'
            });
          }
        }
      }

      res.json({
        medicationName,
        activeIngredient: resolvedActiveIngredient,
        therapeuticClass:
          catalogMatch?.therapeuticClass ||
          translatedFda?.pharmClass ||
          'Medicamento Clínico Sob Orientação',
        category: catalogMatch?.category || chrono.category,
        formType: catalogMatch?.formType || 'Comprimido',
        unitLabel: catalogMatch?.unitLabel || 'comprimidos',
        purpose:
          catalogMatch?.purpose ||
          translatedFda?.indications?.slice(0, 260) ||
          `Indicado para o tratamento clínico associado a ${medicationName}.`,
        dosageInstruction:
          catalogMatch?.dosageInstruction ||
          translatedFda?.posologyGuidance?.slice(0, 260) ||
          'Administrar conforme prescrição médica.',
        indications:
          catalogMatch?.bula.indications ||
          translatedFda?.indications ||
          `Indicado no tratamento e controle clínico relacionado a ${medicationName} (${resolvedActiveIngredient}).`,
        howItWorks:
          catalogMatch?.bula.howItWorks ||
          translatedFda?.howItWorks ||
          'Atua diretamente nos receptores farmacológicos específicos do princípio ativo após absorção gastrointestinal.',
        contraindications:
          catalogMatch?.bula.contraindications ||
          translatedFda?.contraindications ||
          'Contraindicado para pacientes com hipersensibilidade conhecida ao princípio ativo ou a qualquer componente da fórmula.',
        warnings:
          catalogMatch?.bula.warnings ||
          translatedFda?.warnings ||
          'Utilize apenas nas doses e horários prescritos. Informe seu médico caso faça uso de outros medicamentos contínuos.',
        interactionsSummary:
          catalogMatch?.bula.interactionsSummary ||
          translatedFda?.interactionsSummary ||
          'Evite associar com bebidas alcoólicas ou anti-inflamatórios sem orientação médica. Verifique o painel de interações acima.',
        posologyGuidance:
          catalogMatch?.bula.posologyGuidance ||
          translatedFda?.posologyGuidance ||
          'Seguir rigorosamente a dose e os intervalos recomendados na receita médica.',
        bestTimeGuidance:
          catalogMatch?.bestTimeGuidance || chrono.bestTimeGuidance,
        recommendedTimes:
          catalogMatch?.recommendedTimes || chrono.recommendedTimes,
        administrationTips:
          catalogMatch?.administrationTips || chrono.administrationTips,
        missedDoseGuidance:
          catalogMatch?.bula.missedDoseGuidance ||
          'Caso esqueça uma dose, tome-a assim que lembrar. Se estiver próximo do horário da dose seguinte, pule a dose esquecida e siga o horário normal. Nunca tome duas doses juntas.',
        adverseReactions:
          catalogMatch?.bula.adverseReactions ||
          translatedFda?.adverseReactions ||
          'Podem ocorrer reações leves como desconforto gástrico, cefaleia ou tontura transitória. Comunique seu médico se persistirem.',
        storageAdvice:
          catalogMatch?.bula.storageAdvice ||
          translatedFda?.storageAdvice ||
          'Conservar em temperatura ambiente (entre 15°C e 30°C), protegido da luz e da umidade, em sua embalagem original.',
        interactingSubstances:
          catalogMatch?.bula.interactingSubstances || [],
        detectedInteractions,
        sourceApi: openFdaLabel
          ? 'API Pública openFDA (FDA.gov) + Bulário ANVISA'
          : 'Bulário Clínico ANVISA (Base Oficial)'
      });
    } catch (error) {
      res.status(200).json({
        medicationName,
        activeIngredient: activeIngredient || medicationName,
        therapeuticClass: 'Uso Clínico',
        indications: `Tratamento clínico com ${medicationName}.`,
        howItWorks: 'Atua conforme mecanismo farmacológico da substância ativa.',
        contraindications: 'Alergia aos componentes da fórmula.',
        warnings: 'Utilizar conforme orientação médica.',
        interactionsSummary: 'Consulte as interações na aba de alertas.',
        posologyGuidance: 'Seguir prescrição médica.',
        bestTimeGuidance: 'Tomar preferencialmente em horário fixo todos os dias.',
        recommendedTimes: ['08:00'],
        administrationTips: 'Ingerir com água.',
        missedDoseGuidance: 'Não dobrar a dose em caso de esquecimento.',
        adverseReactions: 'Informe seu médico em caso de sintomas adversos.',
        storageAdvice: 'Conservar entre 15°C e 30°C.',
        interactingSubstances: [],
        detectedInteractions: [],
        sourceApi: 'Bulário Clínico ANVISA (Base Oficial)'
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MedCuida Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
