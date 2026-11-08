/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType
} from './firebase';
import {
  Calendar,
  Clock,
  Check,
  Search,
  Package,
  Plus,
  AlertTriangle,
  HeartPulse,
  BookOpen,
  History,
  Menu,
  X,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Filter,
  ShoppingCart,
  LogOut,
  ShieldCheck,
  Loader2,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

// ==========================================
// TIPOS E CATEGORIAS / APRESENTAÇÕES PADRÃO
// ==========================================

export type MedicationCategory = string;
export type MedicationFormType = string;

export type CategoryColorKey =
  | 'sky'
  | 'teal'
  | 'emerald'
  | 'cyan'
  | 'indigo'
  | 'violet'
  | 'amber'
  | 'rose';

export interface CategoryColorTheme {
  key: CategoryColorKey;
  label: string;
  swatchClass: string;
  cardBgClass: string;
  cardBorderClass: string;
  accentStripClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
  ringTextClass: string;
}

export const CATEGORY_COLOR_THEMES: Record<CategoryColorKey, CategoryColorTheme> = {
  sky: {
    key: 'sky',
    label: 'Azul Clínico',
    swatchClass: 'bg-sky-500',
    cardBgClass: 'bg-sky-50/45',
    cardBorderClass: 'border-sky-200/90',
    accentStripClass: 'border-l-4 border-l-sky-500',
    badgeBgClass: 'bg-sky-100/90 border border-sky-200',
    badgeTextClass: 'text-sky-900',
    ringTextClass: 'text-sky-600'
  },
  teal: {
    key: 'teal',
    label: 'Verde Hospitalar',
    swatchClass: 'bg-teal-500',
    cardBgClass: 'bg-teal-50/45',
    cardBorderClass: 'border-teal-200/90',
    accentStripClass: 'border-l-4 border-l-teal-500',
    badgeBgClass: 'bg-teal-100/90 border border-teal-200',
    badgeTextClass: 'text-teal-900',
    ringTextClass: 'text-teal-600'
  },
  emerald: {
    key: 'emerald',
    label: 'Esmeralda Saúde',
    swatchClass: 'bg-emerald-500',
    cardBgClass: 'bg-emerald-50/45',
    cardBorderClass: 'border-emerald-200/90',
    accentStripClass: 'border-l-4 border-l-emerald-500',
    badgeBgClass: 'bg-emerald-100/90 border border-emerald-200',
    badgeTextClass: 'text-emerald-900',
    ringTextClass: 'text-emerald-600'
  },
  cyan: {
    key: 'cyan',
    label: 'Ciano Sereno',
    swatchClass: 'bg-cyan-500',
    cardBgClass: 'bg-cyan-50/45',
    cardBorderClass: 'border-cyan-200/90',
    accentStripClass: 'border-l-4 border-l-cyan-500',
    badgeBgClass: 'bg-cyan-100/90 border border-cyan-200',
    badgeTextClass: 'text-cyan-900',
    ringTextClass: 'text-cyan-600'
  },
  indigo: {
    key: 'indigo',
    label: 'Índigo Controlado',
    swatchClass: 'bg-indigo-500',
    cardBgClass: 'bg-indigo-50/45',
    cardBorderClass: 'border-indigo-200/90',
    accentStripClass: 'border-l-4 border-l-indigo-500',
    badgeBgClass: 'bg-indigo-100/90 border border-indigo-200',
    badgeTextClass: 'text-indigo-900',
    ringTextClass: 'text-indigo-600'
  },
  violet: {
    key: 'violet',
    label: 'Lavanda Neurológico',
    swatchClass: 'bg-violet-500',
    cardBgClass: 'bg-violet-50/45',
    cardBorderClass: 'border-violet-200/90',
    accentStripClass: 'border-l-4 border-l-violet-500',
    badgeBgClass: 'bg-violet-100/90 border border-violet-200',
    badgeTextClass: 'text-violet-900',
    ringTextClass: 'text-violet-600'
  },
  amber: {
    key: 'amber',
    label: 'Âmbar Suplemento',
    swatchClass: 'bg-amber-500',
    cardBgClass: 'bg-amber-50/45',
    cardBorderClass: 'border-amber-200/90',
    accentStripClass: 'border-l-4 border-l-amber-500',
    badgeBgClass: 'bg-amber-100/90 border border-amber-200',
    badgeTextClass: 'text-amber-900',
    ringTextClass: 'text-amber-600'
  },
  rose: {
    key: 'rose',
    label: 'Coral Alívio',
    swatchClass: 'bg-rose-500',
    cardBgClass: 'bg-rose-50/45',
    cardBorderClass: 'border-rose-200/90',
    accentStripClass: 'border-l-4 border-l-rose-500',
    badgeBgClass: 'bg-rose-100/90 border border-rose-200',
    badgeTextClass: 'text-rose-900',
    ringTextClass: 'text-rose-600'
  }
};

export const CATEGORY_COLOR_KEYS: CategoryColorKey[] = [
  'sky',
  'teal',
  'emerald',
  'cyan',
  'indigo',
  'violet',
  'amber',
  'rose'
];

export interface CategoryOption {
  name: string;
  colorKey: CategoryColorKey;
}

export interface PresentationOption {
  name: string; // ex: "Comprimido", "Sachê", "mL"
  unitLabel: string; // ex: "comprimidos", "sachês", "ml"
  defaultDose: string; // ex: "1 comprimido", "1 sachê", "5 ml"
}

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { name: 'Uso Contínuo', colorKey: 'teal' },
  { name: 'Receita Retida', colorKey: 'indigo' },
  { name: 'Enxaqueca', colorKey: 'violet' },
  { name: 'Vitaminas', colorKey: 'emerald' },
  { name: 'Dor & Febre', colorKey: 'rose' },
  { name: 'Gastrointestinal', colorKey: 'amber' },
  { name: 'Respiratório & Alergia', colorKey: 'sky' },
  { name: 'Primeiros Socorros', colorKey: 'cyan' }
];

export const DEFAULT_PRESENTATIONS: PresentationOption[] = [
  { name: 'Comprimido', unitLabel: 'comprimidos', defaultDose: '1 comprimido' },
  { name: 'Cápsula', unitLabel: 'cápsulas', defaultDose: '1 cápsula' },
  { name: 'Gotas', unitLabel: 'gotas', defaultDose: '20 gotas' },
  { name: 'Xarope', unitLabel: 'ml', defaultDose: '10 ml' },
  { name: 'mL', unitLabel: 'ml', defaultDose: '5 ml' },
  { name: 'Sachê', unitLabel: 'sachês', defaultDose: '1 sachê' },
  { name: 'Pomada', unitLabel: 'aplicações', defaultDose: '1 aplicação' },
  { name: 'Spray', unitLabel: 'jatos', defaultDose: '2 jatos' }
];

export const STANDARD_CLINICAL_TAGS: string[] = [
  'Enxaqueca',
  'Vitaminas',
  'Receita Retida',
  'Pressão Arterial',
  'Antibiótico',
  'Suplementação',
  'Controle Gástrico',
  'Termolábil / Geladeira'
];

export type ControlledType =
  | 'Venda Livre / Simples'
  | 'Receita Retida (Branca C1/Antibiótico)'
  | 'Receita Azul (Notificação B)';

export interface Medication {
  id: string;
  userId: string;
  name: string;
  activeIngredient: string;
  purpose: string;
  clinicalTags: string[];
  category: string;
  formType: string;
  unitLabel: string;
  dosageInstruction: string;
  controlled: ControlledType;
  currentStock: number;
  boxCapacity: number;
  minStockAlert: number;
  expiryDate: string; // YYYY-MM-DD
  lastPaidPrice: number;
  isActiveTreatment: boolean;
  scheduleTimes: string[];
  doseAmount: number;
  doseDisplay: string;
  frequencyLabel: string;
  isContinuous: boolean;
  treatmentStartDate?: string;
  treatmentTotalDays?: number;
  completedDosesCount: number;
  targetTotalDoses: number;
}

export interface DoseLog {
  id: string;
  userId: string;
  medicationId: string;
  medicationName: string;
  purpose: string;
  doseDisplay: string;
  doseAmount: number;
  date: string; // YYYY-MM-DD
  scheduledTime?: string;
  takenTime: string; // HH:mm
  status: 'no_horario' | 'atrasado' | 'avulso';
  notes?: string;
}

type ActiveTab = 'hoje' | 'historico' | 'biblioteca' | 'estoque' | 'novo' | 'opcoes';
type StockSubTab = 'inventario' | 'compras';

// ==========================================
// SERIALIZAÇÃO DE CATEGORIAS E APRESENTAÇÕES PARA O FIRESTORE
// ==========================================

const getDefaultColorForCategoryName = (name: string, index = 0): CategoryColorKey => {
  const matched = DEFAULT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === name.trim().toLowerCase()
  );
  if (matched) return matched.colorKey;
  return CATEGORY_COLOR_KEYS[index % CATEGORY_COLOR_KEYS.length];
};

const serializeCategories = (list: CategoryOption[]): string[] => {
  return list.map(
    (c) => `${c.name.replace(/\|/g, '').trim()}|${c.colorKey}`
  );
};

const deserializeCategories = (rawList: unknown): CategoryOption[] => {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return DEFAULT_CATEGORIES;
  }
  const parsed: CategoryOption[] = [];
  rawList.forEach((item, idx) => {
    if (typeof item === 'string') {
      const [rawName, rawColor] = item.split('|');
      const cleanName = (rawName || '').trim();
      if (cleanName) {
        const validColor =
          rawColor &&
          CATEGORY_COLOR_KEYS.includes(rawColor.trim() as CategoryColorKey)
            ? (rawColor.trim() as CategoryColorKey)
            : getDefaultColorForCategoryName(cleanName, idx);
        parsed.push({
          name: cleanName,
          colorKey: validColor
        });
      }
    }
  });
  return parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
};

const serializePresentations = (list: PresentationOption[]): string[] => {
  return list.map(
    (p) =>
      `${p.name.replace(/\|/g, '').trim()}|${p.unitLabel
        .replace(/\|/g, '')
        .trim()}|${p.defaultDose.replace(/\|/g, '').trim()}`
  );
};

const deserializePresentations = (rawList: unknown): PresentationOption[] => {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return DEFAULT_PRESENTATIONS;
  }
  const parsed: PresentationOption[] = [];
  rawList.forEach((item) => {
    if (typeof item === 'string') {
      const [name, unitLabel, defaultDose] = item.split('|');
      if (name && name.trim()) {
        parsed.push({
          name: name.trim(),
          unitLabel: (unitLabel || 'unidades').trim(),
          defaultDose: (defaultDose || `1 ${name.trim().toLowerCase()}`).trim()
        });
      }
    }
  });
  return parsed.length > 0 ? parsed : DEFAULT_PRESENTATIONS;
};

// ==========================================
// UTILITÁRIOS DE DATA E FORMATAÇÃO
// ==========================================

const getTodayISO = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getOffsetDateISO = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeHHMM = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const getDaysUntilExpiry = (expiryDateStr: string): number => {
  const today = new Date(getTodayISO() + 'T00:00:00');
  const exp = new Date(expiryDateStr + 'T00:00:00');
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatExpiryMMYYYY = (expiryDateStr: string): string => {
  if (!expiryDateStr) return '--/----';
  const parts = expiryDateStr.split('-');
  if (parts.length < 2) return expiryDateStr;
  return `${parts[1]}/${parts[0]}`;
};

const formatCurrencyBRL = (value: number): string => {
  return `R$ ${(Number(value) || 0).toFixed(2).replace('.', ',')}`;
};

const formatDateFriendly = (dateStr: string): string => {
  const today = getTodayISO();
  const yesterday = getOffsetDateISO(-1);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dayNum = parts[2];
  const monthName = months[parseInt(parts[1], 10) - 1] || parts[1];

  if (dateStr === today) return `Hoje · ${dayNum} de ${monthName}`;
  if (dateStr === yesterday) return `Ontem · ${dayNum} de ${monthName}`;
  return `${dayNum} de ${monthName} de ${parts[0]}`;
};

const getPeriodOfDay = (timeHHMM: string): 'Manhã' | 'Tarde' | 'Noite' => {
  const hour = parseInt(timeHHMM.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'Manhã';
  if (hour >= 12 && hour < 18) return 'Tarde';
  return 'Noite';
};

// ==========================================
// COMPONENTE DE CÍRCULO DE PROGRESSO (SVG)
// ==========================================

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  trackColorClass?: string;
  label?: string;
  sublabel?: string;
}

function CircularProgress({
  percentage,
  size = 64,
  strokeWidth = 6,
  colorClass = 'text-teal-600',
  trackColorClass = 'text-sky-100',
  label,
  sublabel
}: CircularProgressProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={trackColorClass}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-300 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        <span className="font-mono-tabular text-xs font-semibold text-slate-800">
          {label ?? `${clamped}%`}
        </span>
        {sublabel && (
          <span className="text-[9px] text-slate-500 mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL DO SISTEMA (MEDCUIDA)
// ==========================================

export default function App() {
  // Estados de Autenticação Firebase
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Estados de Dados no Cloud Firestore
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryOption[]>(
    DEFAULT_CATEGORIES
  );
  const [presentationsList, setPresentationsList] = useState<PresentationOption[]>(
    DEFAULT_PRESENTATIONS
  );
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Estados de Navegação
  const [activeTab, setActiveTab] = useState<ActiveTab>('hoje');
  const [stockSubTab, setStockSubTab] = useState<StockSubTab>('inventario');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    tone: 'success' | 'warning' | 'danger';
  } | null>(null);

  // Confirmação de exclusão de medicamento ou limpeza geral
  const [medToDelete, setMedToDelete] = useState<Medication | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState<boolean>(false);

  // Estados da Biblioteca
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedMedDetail, setSelectedMedDetail] = useState<Medication | null>(null);

  // Estados do Histórico
  const [historyMedFilter, setHistoryMedFilter] = useState<string>('TODOS');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('TODOS');
  const [isManualDoseModalOpen, setIsManualDoseModalOpen] = useState(false);
  const [manualDoseMedId, setManualDoseMedId] = useState<string>('');
  const [manualDoseTime, setManualDoseTime] = useState<string>(getCurrentTimeHHMM());
  const [manualDoseDate, setManualDoseDate] = useState<string>(getTodayISO());
  const [manualDoseNotes, setManualDoseNotes] = useState<string>('');

  // Estados do Estoque & Lista de Compras
  const [stockFilter, setStockFilter] = useState<'todos' | 'vencendo' | 'acabando' | 'vencidos'>('todos');
  const [showAllInShoppingList, setShowAllInShoppingList] = useState<boolean>(false);
  const [restockModalMed, setRestockModalMed] = useState<Medication | null>(null);
  const [restockPriceInput, setRestockPriceInput] = useState<string>('');
  const [restockQuantityInput, setRestockQuantityInput] = useState<number>(30);
  const [restockExpiryInput, setRestockExpiryInput] = useState<string>(getOffsetDateISO(365));

  // Estados do Gerenciador de Categorias e Apresentações (Aba 'opcoes')
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<CategoryColorKey>('sky');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [editingCategoryColor, setEditingCategoryColor] = useState<CategoryColorKey>('sky');

  const [newPresName, setNewPresName] = useState('');
  const [newPresUnit, setNewPresUnit] = useState('');
  const [newPresDefaultDose, setNewPresDefaultDose] = useState('');
  const [editingPresIndex, setEditingPresIndex] = useState<number | null>(null);
  const [editingPresName, setEditingPresName] = useState('');
  const [editingPresUnit, setEditingPresUnit] = useState('');
  const [editingPresDefaultDose, setEditingPresDefaultDose] = useState('');

  // Estados do Formulário de Cadastro / Edição de Medicamentos
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formActiveIngredient, setFormActiveIngredient] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formSelectedTags, setFormSelectedTags] = useState<string[]>([]);
  const [formCustomTagsText, setFormCustomTagsText] = useState('');
  const [formCategory, setFormCategory] = useState<string>(DEFAULT_CATEGORIES[0].name);
  const [formType, setFormType] = useState<string>(DEFAULT_PRESENTATIONS[0].name);
  const [formDosageInstruction, setFormDosageInstruction] = useState('');
  const [formControlled, setFormControlled] = useState<ControlledType>('Venda Livre / Simples');
  const [formCurrentStock, setFormCurrentStock] = useState<number>(30);
  const [formBoxCapacity, setFormBoxCapacity] = useState<number>(30);
  const [formMinStockAlert, setFormMinStockAlert] = useState<number>(5);
  const [formExpiryDate, setFormExpiryDate] = useState<string>(getOffsetDateISO(240));
  const [formLastPaidPrice, setFormLastPaidPrice] = useState<number>(35.0);
  const [formIsActiveTreatment, setFormIsActiveTreatment] = useState<boolean>(false);
  const [formScheduleTimes, setFormScheduleTimes] = useState<string[]>([]);
  const [formNewTimeInput, setFormNewTimeInput] = useState<string>('');
  const [formDoseAmount, setFormDoseAmount] = useState<number>(1);
  const [formDoseDisplay, setFormDoseDisplay] = useState<string>('1 comprimido');
  const [formIsContinuous, setFormIsContinuous] = useState<boolean>(true);
  const [formTreatmentStartDate, setFormTreatmentStartDate] = useState<string>(getTodayISO());
  const [formTreatmentDays, setFormTreatmentDays] = useState<number>(7);

  // Utilitário para obter o tema visual da categoria de um medicamento
  const getCategoryTheme = (categoryName: string): CategoryColorTheme => {
    const matched = categoriesList.find(
      (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
    );
    if (matched && CATEGORY_COLOR_THEMES[matched.colorKey]) {
      return CATEGORY_COLOR_THEMES[matched.colorKey];
    }
    const defaultKey = getDefaultColorForCategoryName(categoryName || '');
    return CATEGORY_COLOR_THEMES[defaultKey] || CATEGORY_COLOR_THEMES.sky;
  };

  // Limpar quaisquer chaves antigas de localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('cuidamed_medications_v1');
      localStorage.removeItem('cuidamed_doselogs_v1');
      localStorage.removeItem('cuidamed_medications_v2');
      localStorage.removeItem('cuidamed_doselogs_v2');
    } catch {
      // ignore
    }
  }, []);

  // Monitorar estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (!user) {
        setMedications([]);
        setDoseLogs([]);
        setCategoriesList(DEFAULT_CATEGORIES);
        setPresentationsList(DEFAULT_PRESENTATIONS);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sincronizar medicamentos, histórico e configurações de catálogo do usuário no Cloud Firestore
  useEffect(() => {
    if (!authReady || !currentUser) return;

    setIsLoadingData(true);
    setDbError(null);

    const medsPath = `users/${currentUser.uid}/medications`;
    const logsPath = `users/${currentUser.uid}/doseLogs`;
    const settingsDocPath = `users/${currentUser.uid}/settings/catalog`;

    const unsubMeds = onSnapshot(
      collection(db, medsPath),
      (snapshot) => {
        const list: Medication[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Medication);
        });
        setMedications(list);
        setIsLoadingData(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, medsPath);
        setDbError(
          'Permissão pendente no Firestore (medcuida1). Verifique as regras de segurança no Firebase Console.'
        );
        setIsLoadingData(false);
      }
    );

    const unsubLogs = onSnapshot(
      collection(db, logsPath),
      (snapshot) => {
        const list: DoseLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as DoseLog);
        });
        setDoseLogs(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, logsPath);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, settingsDocPath),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategoriesList(deserializeCategories(data.categories));
          }
          if (Array.isArray(data.presentations) && data.presentations.length > 0) {
            setPresentationsList(deserializePresentations(data.presentations));
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, settingsDocPath);
      }
    );

    return () => {
      unsubMeds();
      unsubLogs();
      unsubSettings();
    };
  }, [authReady, currentUser]);

  const showToast = (
    text: string,
    tone: 'success' | 'warning' | 'danger' = 'success'
  ) => {
    setToastMessage({ text, tone });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  // ==========================================
  // PERSISTÊNCIA DAS CATEGORIAS E APRESENTAÇÕES NO FIRESTORE
  // ==========================================

  const saveCatalogSettingsToFirestore = async (
    nextCategories: CategoryOption[],
    nextPresentations: PresentationOption[]
  ) => {
    if (!currentUser) return;
    const docRef = doc(db, `users/${currentUser.uid}/settings`, 'catalog');
    const payload = {
      id: 'catalog',
      userId: currentUser.uid,
      categories: serializeCategories(nextCategories.slice(0, 50)).map((c) =>
        c.slice(0, 80)
      ),
      presentations: serializePresentations(nextPresentations.slice(0, 50)).map(
        (p) => p.slice(0, 160)
      )
    };
    try {
      await setDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `users/${currentUser.uid}/settings/catalog`
      );
    }
  };

  // Adicionar nova categoria com cor personalizada
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showToast('Atenção: Digite o nome da nova categoria.', 'warning');
      return;
    }
    if (
      categoriesList.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      showToast('Atenção: Esta categoria já existe na lista.', 'warning');
      return;
    }
    const updated: CategoryOption[] = [
      ...categoriesList,
      { name: trimmed, colorKey: newCategoryColor }
    ];
    setCategoriesList(updated);
    setNewCategoryName('');
    await saveCatalogSettingsToFirestore(updated, presentationsList);
    showToast(`Categoria "${trimmed}" adicionada com sucesso.`, 'success');
  };

  // Salvar edição de categoria existente (nome e/ou cor) e atualizar medicamentos vinculados
  const handleSaveCategoryEdit = async (index: number) => {
    const trimmed = editingCategoryValue.trim();
    if (!trimmed) {
      showToast('Atenção: O nome da categoria não pode ficar vazio.', 'warning');
      return;
    }
    const oldCat = categoriesList[index];
    if (
      categoriesList.some(
        (c, idx) => idx !== index && c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      showToast('Atenção: Já existe outra categoria com este nome.', 'warning');
      return;
    }

    const updatedCategories = categoriesList.map((c, idx) =>
      idx === index ? { name: trimmed, colorKey: editingCategoryColor } : c
    );
    setCategoriesList(updatedCategories);
    setEditingCategoryIndex(null);
    setEditingCategoryValue('');

    await saveCatalogSettingsToFirestore(updatedCategories, presentationsList);

    // Atualizar categoria nos medicamentos que usavam o nome antigo
    if (currentUser && oldCat.name !== trimmed) {
      const affectedMeds = medications.filter((m) => m.category === oldCat.name);
      if (affectedMeds.length > 0) {
        const batch = writeBatch(db);
        affectedMeds.forEach((m) => {
          batch.set(
            doc(db, `users/${currentUser.uid}/medications`, m.id),
            { ...m, category: trimmed },
            { merge: true }
          );
        });
        await batch.commit();
      }
      if (formCategory === oldCat.name) setFormCategory(trimmed);
      if (selectedCategory === oldCat.name) setSelectedCategory(trimmed);
    }

    showToast(`Categoria "${trimmed}" e cor atualizadas.`, 'success');
  };

  // Alterar rapidamente apenas a cor de uma categoria existente
  const handleQuickChangeCategoryColor = async (
    index: number,
    colorKey: CategoryColorKey
  ) => {
    const updatedCategories = categoriesList.map((c, idx) =>
      idx === index ? { ...c, colorKey } : c
    );
    setCategoriesList(updatedCategories);
    await saveCatalogSettingsToFirestore(updatedCategories, presentationsList);
    showToast(
      `Cor da categoria "${categoriesList[index].name}" alterada para ${CATEGORY_COLOR_THEMES[colorKey].label}.`,
      'success'
    );
  };

  // Excluir categoria
  const handleDeleteCategory = async (index: number) => {
    if (categoriesList.length <= 1) {
      showToast(
        'Atenção: É necessário manter pelo menos uma categoria cadastrada.',
        'warning'
      );
      return;
    }
    const removed = categoriesList[index];
    const updated = categoriesList.filter((_, idx) => idx !== index);
    setCategoriesList(updated);
    if (formCategory === removed.name) setFormCategory(updated[0].name);
    if (selectedCategory === removed.name) setSelectedCategory('Todos');
    await saveCatalogSettingsToFirestore(updated, presentationsList);
    showToast(`Categoria "${removed.name}" removida.`, 'warning');
  };

  // Adicionar nova apresentação
  const handleAddPresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPresName.trim();
    if (!name) {
      showToast('Atenção: Informe o nome da apresentação.', 'warning');
      return;
    }
    if (
      presentationsList.some((p) => p.name.toLowerCase() === name.toLowerCase())
    ) {
      showToast('Atenção: Esta apresentação já está cadastrada.', 'warning');
      return;
    }
    const unit = newPresUnit.trim() || `${name.toLowerCase()}s`;
    const defDose =
      newPresDefaultDose.trim() || `1 ${name.toLowerCase()}`;

    const updated = [
      ...presentationsList,
      { name, unitLabel: unit, defaultDose: defDose }
    ];
    setPresentationsList(updated);
    setNewPresName('');
    setNewPresUnit('');
    setNewPresDefaultDose('');
    await saveCatalogSettingsToFirestore(categoriesList, updated);
    showToast(`Apresentação "${name}" adicionada com sucesso.`, 'success');
  };

  // Salvar edição de apresentação existente
  const handleSavePresentationEdit = async (index: number) => {
    const name = editingPresName.trim();
    if (!name) {
      showToast('Atenção: O nome da apresentação não pode ficar vazio.', 'warning');
      return;
    }
    const oldPres = presentationsList[index];
    if (
      presentationsList.some(
        (p, idx) => idx !== index && p.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      showToast('Atenção: Já existe outra apresentação com este nome.', 'warning');
      return;
    }

    const unit = editingPresUnit.trim() || oldPres.unitLabel;
    const defDose = editingPresDefaultDose.trim() || oldPres.defaultDose;

    const updatedPresentations = presentationsList.map((p, idx) =>
      idx === index
        ? { name, unitLabel: unit, defaultDose: defDose }
        : p
    );
    setPresentationsList(updatedPresentations);
    setEditingPresIndex(null);

    await saveCatalogSettingsToFirestore(categoriesList, updatedPresentations);

    // Atualizar medicamentos que usavam a apresentação antiga
    if (currentUser && (oldPres.name !== name || oldPres.unitLabel !== unit)) {
      const affectedMeds = medications.filter((m) => m.formType === oldPres.name);
      if (affectedMeds.length > 0) {
        const batch = writeBatch(db);
        affectedMeds.forEach((m) => {
          batch.set(
            doc(db, `users/${currentUser.uid}/medications`, m.id),
            { ...m, formType: name, unitLabel: unit },
            { merge: true }
          );
        });
        await batch.commit();
      }
      if (formType === oldPres.name) setFormType(name);
    }

    showToast(`Apresentação "${name}" atualizada.`, 'success');
  };

  // Excluir apresentação
  const handleDeletePresentation = async (index: number) => {
    if (presentationsList.length <= 1) {
      showToast(
        'Atenção: É necessário manter pelo menos uma apresentação cadastrada.',
        'warning'
      );
      return;
    }
    const removed = presentationsList[index];
    const updated = presentationsList.filter((_, idx) => idx !== index);
    setPresentationsList(updated);
    if (formType === removed.name) setFormType(updated[0].name);
    await saveCatalogSettingsToFirestore(categoriesList, updated);
    showToast(`Apresentação "${removed.name}" removida.`, 'warning');
  };

  // Restaurar categorias e apresentações padrão
  const handleResetCatalogDefaults = async () => {
    setCategoriesList(DEFAULT_CATEGORIES);
    setPresentationsList(DEFAULT_PRESENTATIONS);
    await saveCatalogSettingsToFirestore(
      DEFAULT_CATEGORIES,
      DEFAULT_PRESENTATIONS
    );
    showToast('Categorias e apresentações padrão restauradas.', 'success');
  };

  // ==========================================
  // LOGIN COM GOOGLE E LOGOUT
  // ==========================================

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/unauthorized-domain')) {
        setAuthError(
          `Domínio não autorizado no Firebase (${window.location.hostname}). Adicione este domínio em Firebase Console > Authentication > Settings > Authorized domains no projeto medcuida1.`
        );
      } else if (msg.includes('auth/popup-closed-by-user')) {
        setAuthError('A janela de autenticação foi fechada antes de concluir o acesso.');
      } else if (msg.includes('auth/operation-not-allowed')) {
        setAuthError(
          'O provedor Google não está habilitado no Firebase Console (Authentication > Sign-in method > Google).'
        );
      } else {
        setAuthError(`Não foi possível autenticar com Google: ${msg}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false);
    } catch {
      showToast('Erro ao encerrar sessão.', 'warning');
    }
  };

  // Limpar todos os dados do usuário no Firestore
  const handleClearAllUserData = async () => {
    if (!currentUser) return;
    const batch = writeBatch(db);
    medications.forEach((m) => {
      batch.delete(doc(db, `users/${currentUser.uid}/medications`, m.id));
    });
    doseLogs.forEach((l) => {
      batch.delete(doc(db, `users/${currentUser.uid}/doseLogs`, l.id));
    });

    try {
      await batch.commit();
      setIsClearAllConfirmOpen(false);
      setIsMobileMenuOpen(false);
      showToast('Todos os dados da conta foram limpos com sucesso.', 'warning');
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `users/${currentUser.uid}`
      );
      showToast('Erro ao limpar dados no Firestore.', 'danger');
    }
  };

  // ==========================================
  // CÁLCULOS DERIVADOS E LISTA DE COMPRAS AUTOMÁTICA
  // ==========================================

  const todayISO = getTodayISO();

  const todayScheduledDoses = useMemo(() => {
    const items: Array<{
      medication: Medication;
      scheduledTime: string;
      period: 'Manhã' | 'Tarde' | 'Noite';
      takenLog?: DoseLog;
    }> = [];

    medications
      .filter((m) => m.isActiveTreatment)
      .forEach((med) => {
        med.scheduleTimes.forEach((time) => {
          const takenLog = doseLogs.find(
            (log) =>
              log.medicationId === med.id &&
              log.date === todayISO &&
              log.scheduledTime === time
          );
          items.push({
            medication: med,
            scheduledTime: time,
            period: getPeriodOfDay(time),
            takenLog
          });
        });
      });

    return items.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [medications, doseLogs, todayISO]);

  const totalDosesToday = todayScheduledDoses.length;
  const takenDosesToday = todayScheduledDoses.filter((d) => Boolean(d.takenLog)).length;
  const dailyProgressPercentage =
    totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 0;

  const activeTreatmentsProgress = useMemo(() => {
    return medications
      .filter((m) => m.isActiveTreatment)
      .map((med) => {
        const target = Math.max(1, med.targetTotalDoses || 30);
        const completed = Math.min(target, Math.max(0, med.completedDosesCount));
        const percentage = Math.round((completed / target) * 100);
        const takenTodayForMed = doseLogs.filter(
          (l) => l.medicationId === med.id && l.date === todayISO
        ).length;
        const totalTodayForMed = med.scheduleTimes.length;

        return {
          med,
          completed,
          target,
          percentage,
          takenTodayForMed,
          totalTodayForMed
        };
      });
  }, [medications, doseLogs, todayISO]);

  // Alertas de Estoque, Validade e Lista de Compras Automática
  const stockAlerts = useMemo(() => {
    const expiringSoon: Medication[] = [];
    const expired: Medication[] = [];
    const lowStock: Medication[] = [];

    medications.forEach((m) => {
      const days = getDaysUntilExpiry(m.expiryDate);
      if (days < 0) {
        expired.push(m);
      } else if (days <= 30) {
        expiringSoon.push(m);
      }
      if (m.currentStock <= m.minStockAlert) {
        lowStock.push(m);
      }
    });

    const shoppingList = medications
      .filter((m) => {
        const days = getDaysUntilExpiry(m.expiryDate);
        const isExpiredOrLow = days < 0 || m.currentStock <= m.minStockAlert;
        if (!isExpiredOrLow) return false;
        if (showAllInShoppingList) return true;
        return (
          m.isContinuous ||
          m.category === 'Uso Contínuo' ||
          m.isActiveTreatment
        );
      })
      .map((m) => {
        const days = getDaysUntilExpiry(m.expiryDate);
        const isExpired = days < 0;
        const isLow = m.currentStock <= m.minStockAlert;
        return {
          medication: m,
          isExpired,
          isLow,
          reason:
            isExpired && isLow
              ? `Vencido e estoque baixo (${m.currentStock} ${m.unitLabel})`
              : isExpired
              ? `Medicamento vencido (${formatExpiryMMYYYY(m.expiryDate)})`
              : `Atenção: Estoque baixo (restam ${m.currentStock} de ${m.boxCapacity} ${m.unitLabel})`
        };
      });

    const shoppingTotalEstimated = shoppingList.reduce(
      (acc, item) => acc + (item.medication.lastPaidPrice || 0),
      0
    );

    return {
      expiringSoon,
      expired,
      lowStock,
      shoppingList,
      shoppingTotalEstimated,
      totalAlertCount: expiringSoon.length + expired.length + lowStock.length
    };
  }, [medications, showAllInShoppingList]);

  // ==========================================
  // OPERAÇÕES NO FIRESTORE (DOSES, ESTOQUE, EDIÇÃO E EXCLUSÃO)
  // ==========================================

  const handleToggleScheduledDose = async (
    med: Medication,
    scheduledTime: string
  ) => {
    if (!currentUser) return;

    const existingLog = doseLogs.find(
      (log) =>
        log.medicationId === med.id &&
        log.date === todayISO &&
        log.scheduledTime === scheduledTime
    );

    const medRef = doc(db, `users/${currentUser.uid}/medications`, med.id);

    if (existingLog) {
      const logRef = doc(db, `users/${currentUser.uid}/doseLogs`, existingLog.id);
      try {
        await deleteDoc(logRef);
        await setDoc(
          medRef,
          {
            ...med,
            currentStock: med.currentStock + med.doseAmount,
            completedDosesCount: Math.max(0, med.completedDosesCount - 1)
          },
          { merge: true }
        );
        showToast(
          `Dose das ${scheduledTime} desmarcada. Estoque atualizado.`,
          'warning'
        );
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `users/${currentUser.uid}/doseLogs`
        );
      }
    } else {
      const daysToExpiry = getDaysUntilExpiry(med.expiryDate);
      if (daysToExpiry < 0) {
        showToast(
          `Atenção: ${med.name} está vencido. Verifique a Lista de Compras.`,
          'danger'
        );
        return;
      }

      if (med.currentStock < med.doseAmount) {
        showToast(
          `Atenção: Estoque insuficiente para ${med.name}.`,
          'warning'
        );
        return;
      }

      const nowTime = getCurrentTimeHHMM();
      const logId = `log-${Date.now()}`;
      const newLog: DoseLog = {
        id: logId,
        userId: currentUser.uid,
        medicationId: med.id,
        medicationName: med.name.slice(0, 160),
        purpose: (med.purpose.split('.')[0] || med.purpose).slice(0, 300),
        doseDisplay: med.doseDisplay.slice(0, 80),
        doseAmount: Math.max(1, Number(med.doseAmount) || 1),
        date: todayISO,
        scheduledTime,
        takenTime: nowTime,
        status: 'no_horario',
        notes: 'Dose programada confirmada'
      };

      try {
        await setDoc(
          doc(db, `users/${currentUser.uid}/doseLogs`, logId),
          newLog
        );
        await setDoc(
          medRef,
          {
            ...med,
            currentStock: Math.max(0, med.currentStock - med.doseAmount),
            completedDosesCount: med.completedDosesCount + 1
          },
          { merge: true }
        );
        showToast(
          `Dose confirmada: ${med.name} (-${med.doseAmount} ${med.unitLabel}).`,
          'success'
        );
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `users/${currentUser.uid}/doseLogs`
        );
      }
    }
  };

  const handleTakeSingleDoseNow = async (
    med: Medication,
    customDate?: string,
    customTime?: string,
    customNotes?: string
  ) => {
    if (!currentUser) return;

    const daysToExpiry = getDaysUntilExpiry(med.expiryDate);
    if (daysToExpiry < 0) {
      showToast(`Atenção: ${med.name} encontra-se vencido.`, 'danger');
      return;
    }

    if (med.currentStock < med.doseAmount) {
      showToast(`Atenção: Estoque insuficiente para ${med.name}.`, 'warning');
      return;
    }

    const logId = `log-${Date.now()}`;
    const newLog: DoseLog = {
      id: logId,
      userId: currentUser.uid,
      medicationId: med.id,
      medicationName: med.name.slice(0, 160),
      purpose: (med.purpose.split('.')[0] || med.purpose).slice(0, 300),
      doseDisplay: med.doseDisplay.slice(0, 80),
      doseAmount: Math.max(1, Number(med.doseAmount) || 1),
      date: customDate || todayISO,
      scheduledTime: '',
      takenTime: customTime || getCurrentTimeHHMM(),
      status: 'avulso',
      notes: (customNotes || 'Administração sob demanda').slice(0, 400)
    };

    try {
      await setDoc(doc(db, `users/${currentUser.uid}/doseLogs`, logId), newLog);
      await setDoc(
        doc(db, `users/${currentUser.uid}/medications`, med.id),
        {
          ...med,
          currentStock: Math.max(0, med.currentStock - med.doseAmount),
          completedDosesCount: med.completedDosesCount + 1
        },
        { merge: true }
      );
      showToast(`Dose de ${med.name} registrada no Histórico.`, 'success');
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `users/${currentUser.uid}/doseLogs`
      );
    }
  };

  const handleDeleteHistoryLog = async (log: DoseLog) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/doseLogs`, log.id));
      const parentMed = medications.find((m) => m.id === log.medicationId);
      if (parentMed) {
        await setDoc(
          doc(db, `users/${currentUser.uid}/medications`, parentMed.id),
          {
            ...parentMed,
            currentStock: parentMed.currentStock + log.doseAmount,
            completedDosesCount: Math.max(0, parentMed.completedDosesCount - 1)
          },
          { merge: true }
        );
      }
      showToast('Registro removido e unidade devolvida ao estoque.', 'warning');
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `users/${currentUser.uid}/doseLogs/${log.id}`
      );
    }
  };

  const handleAdjustStock = async (med: Medication, delta: number) => {
    if (!currentUser) return;
    const nextStock = Math.max(0, med.currentStock + delta);
    try {
      await setDoc(
        doc(db, `users/${currentUser.uid}/medications`, med.id),
        {
          ...med,
          currentStock: nextStock,
          boxCapacity: Math.max(med.boxCapacity, nextStock)
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `users/${currentUser.uid}/medications/${med.id}`
      );
    }
  };

  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalMed || !currentUser) return;

    const newPrice = parseFloat(restockPriceInput.replace(',', '.'));
    const addedQty = Math.max(
      1,
      Number(restockQuantityInput) || restockModalMed.boxCapacity
    );
    const wasExpired = getDaysUntilExpiry(restockModalMed.expiryDate) < 0;
    const updatedStock = wasExpired
      ? addedQty
      : restockModalMed.currentStock + addedQty;

    try {
      await setDoc(
        doc(db, `users/${currentUser.uid}/medications`, restockModalMed.id),
        {
          ...restockModalMed,
          currentStock: updatedStock,
          boxCapacity: Math.max(restockModalMed.boxCapacity, updatedStock),
          lastPaidPrice:
            !isNaN(newPrice) && newPrice >= 0
              ? newPrice
              : restockModalMed.lastPaidPrice,
          expiryDate: restockExpiryInput || restockModalMed.expiryDate
        },
        { merge: true }
      );
      showToast(
        `Compra registrada! Estoque de ${restockModalMed.name} atualizado.`,
        'success'
      );
      setRestockModalMed(null);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `users/${currentUser.uid}/medications/${restockModalMed.id}`
      );
    }
  };

  const resetForm = () => {
    const defaultCat = categoriesList[0]?.name || DEFAULT_CATEGORIES[0].name;
    const defaultPres = presentationsList[0] || DEFAULT_PRESENTATIONS[0];
    setEditingMedId(null);
    setFormName('');
    setFormActiveIngredient('');
    setFormPurpose('');
    setFormSelectedTags([]);
    setFormCustomTagsText('');
    setFormCategory(defaultCat);
    setFormType(defaultPres.name);
    setFormDosageInstruction('');
    setFormControlled('Venda Livre / Simples');
    setFormCurrentStock(30);
    setFormBoxCapacity(30);
    setFormMinStockAlert(5);
    setFormExpiryDate(getOffsetDateISO(240));
    setFormLastPaidPrice(35.0);
    setFormIsActiveTreatment(false);
    setFormScheduleTimes([]);
    setFormNewTimeInput('');
    setFormDoseAmount(1);
    setFormDoseDisplay(defaultPres.defaultDose);
    setFormIsContinuous(true);
    setFormTreatmentStartDate(getTodayISO());
    setFormTreatmentDays(7);
  };

  const handleStartEditMedication = (med: Medication) => {
    setEditingMedId(med.id);
    setFormName(med.name);
    setFormActiveIngredient(med.activeIngredient);
    setFormPurpose(med.purpose);
    const stdTags = med.clinicalTags.filter((t) =>
      STANDARD_CLINICAL_TAGS.includes(t)
    );
    const customTags = med.clinicalTags.filter(
      (t) => !STANDARD_CLINICAL_TAGS.includes(t)
    );
    setFormSelectedTags(stdTags);
    setFormCustomTagsText(customTags.join(', '));
    setFormCategory(med.category);
    setFormType(med.formType);
    setFormDosageInstruction(med.dosageInstruction);
    setFormControlled(med.controlled);
    setFormCurrentStock(med.currentStock);
    setFormBoxCapacity(med.boxCapacity);
    setFormMinStockAlert(med.minStockAlert);
    setFormExpiryDate(med.expiryDate);
    setFormLastPaidPrice(med.lastPaidPrice);
    setFormIsActiveTreatment(med.isActiveTreatment);
    setFormScheduleTimes([...med.scheduleTimes]);
    setFormNewTimeInput('');
    setFormDoseAmount(med.doseAmount);
    setFormDoseDisplay(med.doseDisplay);
    setFormIsContinuous(med.isContinuous);
    setFormTreatmentStartDate(med.treatmentStartDate || getTodayISO());
    setFormTreatmentDays(med.treatmentTotalDays || 7);
    setSelectedMedDetail(null);
    setActiveTab('novo');
  };

  const handleConfirmDeleteMedication = async () => {
    if (!medToDelete || !currentUser) return;
    try {
      await deleteDoc(
        doc(db, `users/${currentUser.uid}/medications`, medToDelete.id)
      );
      showToast(`${medToDelete.name} excluído com sucesso.`, 'warning');
      setMedToDelete(null);
      setSelectedMedDetail(null);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `users/${currentUser.uid}/medications/${medToDelete.id}`
      );
      showToast('Erro ao excluir medicamento.', 'danger');
    }
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formName.trim() || !formPurpose.trim()) {
      showToast(
        'Atenção: Preencha o nome do medicamento e sua indicação clínica.',
        'warning'
      );
      return;
    }

    const effectiveScheduleTimes = formIsActiveTreatment
      ? Array.from(
          new Set(
            formNewTimeInput.trim()
              ? [...formScheduleTimes, formNewTimeInput.trim()]
              : [...formScheduleTimes]
          )
        ).sort()
      : [];

    if (formIsActiveTreatment && effectiveScheduleTimes.length === 0) {
      showToast(
        'Atenção: Adicione pelo menos um horário de administração para o tratamento ativo.',
        'warning'
      );
      return;
    }

    const matchedPres = presentationsList.find((p) => p.name === formType);
    const resolvedUnitLabel = matchedPres ? matchedPres.unitLabel : 'unidades';

    const extraTags = formCustomTagsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const combinedTags = Array.from(
      new Set([...formSelectedTags, ...extraTags])
    );
    if (combinedTags.length === 0) combinedTags.push(formCategory);

    const dosesPerDay = formIsActiveTreatment
      ? Math.max(1, effectiveScheduleTimes.length)
      : 1;
    const totalDays = formIsContinuous ? 30 : Math.max(1, formTreatmentDays);
    const targetTotalDoses = dosesPerDay * totalDays;

    const chosenStartDate = formTreatmentStartDate || getTodayISO();

    // Calcular doses anteriores automaticamente caso o tratamento tenha começado em data passada
    const calculatePastCompletedDoses = (): number => {
      if (!formIsActiveTreatment) return 0;
      const startObj = new Date(chosenStartDate + 'T00:00:00');
      const todayObj = new Date(getTodayISO() + 'T00:00:00');
      const diffDays = Math.floor(
        (todayObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 0) return 0;
      return Math.min(targetTotalDoses, diffDays * dosesPerDay);
    };

    const existingMed = editingMedId
      ? medications.find((m) => m.id === editingMedId)
      : undefined;

    const resolvedCompletedDosesCount = existingMed
      ? existingMed.treatmentStartDate !== chosenStartDate
        ? calculatePastCompletedDoses()
        : existingMed.completedDosesCount
      : calculatePastCompletedDoses();

    const medId = editingMedId || `med-${Date.now()}`;
    const newMedData: Medication = {
      id: medId,
      userId: currentUser.uid,
      name: formName.trim().slice(0, 160),
      activeIngredient: (
        formActiveIngredient.trim() || formName.trim()
      ).slice(0, 160),
      purpose: formPurpose.trim().slice(0, 500),
      clinicalTags: combinedTags.slice(0, 20),
      category: formCategory.slice(0, 80),
      formType: formType.slice(0, 40),
      unitLabel: resolvedUnitLabel.slice(0, 40),
      dosageInstruction: (
        formDosageInstruction.trim() ||
        (formIsActiveTreatment
          ? `Administrar ${formDoseDisplay} nos horários: ${effectiveScheduleTimes.join(', ')}.`
          : `Administrar ${formDoseDisplay} conforme orientação clínica.`)
      ).slice(0, 500),
      controlled:
        formCategory === 'Receita Retida' &&
        formControlled === 'Venda Livre / Simples'
          ? 'Receita Retida (Branca C1/Antibiótico)'
          : formControlled,
      currentStock: Number(formCurrentStock) || 0,
      boxCapacity: Math.max(
        Number(formBoxCapacity) || 1,
        Number(formCurrentStock) || 1
      ),
      minStockAlert: Number(formMinStockAlert) || 5,
      expiryDate: formExpiryDate || getOffsetDateISO(180),
      lastPaidPrice: Number(formLastPaidPrice) || 0,
      isActiveTreatment: formIsActiveTreatment,
      scheduleTimes: effectiveScheduleTimes.slice(0, 24),
      doseAmount: Math.max(1, Number(formDoseAmount) || 1),
      doseDisplay: (
        formDoseDisplay.trim() ||
        matchedPres?.defaultDose ||
        `1 ${formType.toLowerCase()}`
      ).slice(0, 80),
      frequencyLabel: formIsActiveTreatment
        ? formIsContinuous
          ? 'Uso Contínuo'
          : `Ciclo de ${totalDays} dias`
        : 'Sob demanda',
      isContinuous: formIsContinuous,
      treatmentStartDate: chosenStartDate.slice(0, 20),
      treatmentTotalDays: totalDays,
      completedDosesCount: resolvedCompletedDosesCount,
      targetTotalDoses
    };

    try {
      await setDoc(
        doc(db, `users/${currentUser.uid}/medications`, medId),
        newMedData
      );
      showToast(
        editingMedId
          ? `Cadastro de ${newMedData.name} atualizado.`
          : `${newMedData.name} salvo no banco de dados.`,
        'success'
      );
      resetForm();
      setActiveTab(newMedData.isActiveTreatment ? 'hoje' : 'biblioteca');
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `users/${currentUser.uid}/medications/${medId}`
      );
      showToast('Erro ao salvar medicamento no Firestore.', 'danger');
    }
  };

  // ==========================================
  // FILTROS DE BUSCA (BIBLIOTECA, HISTÓRICO E ESTOQUE)
  // ==========================================

  const filteredLibraryMedications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return medications.filter((med) => {
      const matchesCategory =
        selectedCategory === 'Todos' ||
        med.category === selectedCategory ||
        med.clinicalTags.some(
          (t) => t.toLowerCase() === selectedCategory.toLowerCase()
        );
      if (!matchesCategory) return false;
      if (!q) return true;

      const inName = med.name.toLowerCase().includes(q);
      const inIngredient = med.activeIngredient.toLowerCase().includes(q);
      const inPurpose = med.purpose.toLowerCase().includes(q);
      const inTags = med.clinicalTags.some((t) => t.toLowerCase().includes(q));
      return inName || inIngredient || inPurpose || inTags;
    });
  }, [medications, searchQuery, selectedCategory]);

  const groupedHistoryLogs = useMemo(() => {
    const filtered = doseLogs
      .filter((log) => {
        if (
          historyMedFilter !== 'TODOS' &&
          log.medicationId !== historyMedFilter
        ) {
          return false;
        }
        if (
          historyStatusFilter !== 'TODOS' &&
          log.status !== historyStatusFilter
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.takenTime.localeCompare(a.takenTime);
      });

    const groups: Record<string, DoseLog[]> = {};
    filtered.forEach((log) => {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
    });

    return Object.entries(groups).sort(([dateA], [dateB]) =>
      dateB.localeCompare(dateA)
    );
  }, [doseLogs, historyMedFilter, historyStatusFilter]);

  const filteredStockMedications = useMemo(() => {
    return medications.filter((med) => {
      const days = getDaysUntilExpiry(med.expiryDate);
      if (stockFilter === 'vencidos') return days < 0;
      if (stockFilter === 'vencendo') return days >= 0 && days <= 30;
      if (stockFilter === 'acabando') return med.currentStock <= med.minStockAlert;
      return true;
    });
  }, [medications, stockFilter]);

  const navigateToTab = (tab: ActiveTab) => {
    if (tab === 'novo' && activeTab !== 'novo') {
      resetForm();
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // ==========================================
  // TELA DE CARREGAMENTO DE AUTENTICAÇÃO
  // ==========================================

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F2F7FA] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white flex items-center justify-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Iniciando MedCuida...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA DE LOGIN MODERNA (ENTRAR COM GOOGLE)
  // ==========================================

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F2F7FA] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl border border-sky-100 shadow-sm p-7 sm:p-8 space-y-6"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                  MedCuida
                </h1>
                <p className="text-xs font-medium text-teal-700 mt-1">
                  Gestão de Tratamentos &amp; Estoque Clínico
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">
                Acesse seu prontuário pessoal de medicamentos
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sincronize seus horários de tratamento, histórico de doses administradas, controle de validade e lista de compras automática na nuvem.
              </p>
            </div>

            <div className="space-y-2.5 bg-sky-50/50 p-4 rounded-2xl border border-sky-100/90">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Acompanhamento de ciclos e uso contínuo em tempo real</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Alertas visuais de estoque baixo e validade próxima</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Dados vinculados exclusivamente à sua conta Google</span>
              </div>
            </div>

            {authError && (
              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Atenção na Autenticação</p>
                  <p className="text-orange-800 leading-relaxed">{authError}</p>
                </div>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full min-h-[50px] py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>
                {isLoggingIn ? 'Conectando ao Google...' : 'Entrar com Google'}
              </span>
            </motion.button>

            <p className="text-[11px] text-center text-slate-400">
              Conectado ao banco de dados Cloud Firestore · Projeto medcuida1
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CONFIGURAÇÃO DOS MENUS DE NAVEGAÇÃO (INCLUINDO CATEGORIAS & APRESENTAÇÕES)
  // ==========================================

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
    isWarning?: boolean;
  }> = [
    {
      id: 'hoje',
      label: 'Tratamentos de Hoje',
      subtitle: 'Agenda de horários e progresso',
      icon: Calendar,
      badgeCount:
        totalDosesToday - takenDosesToday > 0
          ? totalDosesToday - takenDosesToday
          : undefined
    },
    {
      id: 'historico',
      label: 'Histórico de Doses',
      subtitle: 'Prontuário por data e medicamento',
      icon: History
    },
    {
      id: 'biblioteca',
      label: 'Biblioteca Terapêutica',
      subtitle: 'Finalidades clínicas e edição',
      icon: BookOpen
    },
    {
      id: 'estoque',
      label: 'Estoque & Compras',
      subtitle: 'Validade e reposição automática',
      icon: Package,
      badgeCount:
        stockAlerts.totalAlertCount > 0 ? stockAlerts.totalAlertCount : undefined,
      isWarning: true
    },
    {
      id: 'novo',
      label: editingMedId ? 'Editar Medicamento' : 'Cadastrar Medicamento',
      subtitle: 'Incluir item ou prescrição',
      icon: Plus
    },
    {
      id: 'opcoes',
      label: 'Categorias & Apresentações',
      subtitle: 'Adicionar ou editar opções',
      icon: SlidersHorizontal
    }
  ];

  return (
    <div className="min-h-screen bg-[#F2F7FA] text-slate-800 flex flex-col lg:flex-row">
      {/* ==========================================
          MENU LATERAL FIXO (SIDEBAR DESKTOP lg:)
      ========================================== */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-sky-100 z-30 select-none">
        <div className="p-6 border-b border-sky-100/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 block leading-none">
              MedCuida
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Gestão Clínica &amp; Estoque
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateToTab(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-left transition-all ${
                  isActive
                    ? 'bg-sky-50/90 text-sky-950 font-semibold border border-sky-200/70'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{item.label}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                {item.badgeCount !== undefined && (
                  <span
                    className={`font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 ${
                      item.isWarning
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {item.isWarning && (
                      <AlertTriangle className="w-3 h-3 text-orange-600" />
                    )}
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Perfil do Usuário Autenticado e Ações de Conta */}
        <div className="p-4 border-t border-sky-100 space-y-3 bg-sky-50/30">
          <div className="p-3 rounded-2xl bg-white border border-sky-100 flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentUser.displayName || 'Usuário Autenticado'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {currentUser.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Encerrar sessão"
              aria-label="Sair da conta"
              className="min-h-[38px] min-w-[38px] rounded-xl text-slate-500 hover:text-slate-900 hover:bg-sky-50 flex items-center justify-center shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {(medications.length > 0 || doseLogs.length > 0) && (
            <button
              onClick={() => setIsClearAllConfirmOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-orange-700 hover:bg-orange-50 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
              <span>Limpar Todos os Dados</span>
            </button>
          )}
        </div>
      </aside>

      {/* ==========================================
          MENU HAMBÚRGUER DRAWER (MOBILE)
      ========================================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-80 max-w-[85vw] bg-white h-full shadow-xl flex flex-col z-10 justify-between overflow-y-auto"
            >
              <div>
                <div className="p-5 border-b border-sky-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white flex items-center justify-center">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-base font-bold text-slate-900 block leading-none">
                        MedCuida
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Gestão Clínica Doméstica
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Fechar menu"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-sky-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="p-4 space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateToTab(item.id)}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-left transition-colors ${
                          isActive
                            ? 'bg-sky-50 text-sky-950 font-semibold border border-sky-200/80'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-teal-600 text-white'
                                : 'bg-sky-50 text-sky-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm truncate">{item.label}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        {item.badgeCount !== undefined && (
                          <span
                            className={`font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 ${
                              item.isWarning
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {item.isWarning && (
                              <AlertTriangle className="w-3 h-3 text-orange-600" />
                            )}
                            {item.badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-sky-100 space-y-2.5 bg-sky-50/30">
                <div className="p-3 rounded-2xl bg-white border border-sky-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.displayName || 'Usuário'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-900 text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </div>

                {(medications.length > 0 || doseLogs.length > 0) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsClearAllConfirmOpen(true);
                    }}
                    className="w-full min-h-[42px] flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200/80 hover:bg-orange-100 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>Limpar Todos os Dados</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          ÁREA DE CONTEÚDO PRINCIPAL
      ========================================== */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <div className="w-full max-w-md lg:max-w-3xl mx-auto min-h-screen flex flex-col bg-[#F2F7FA] relative pb-24 lg:pb-12">
          {/* TOP BAR LIMPA */}
          <header className="sticky top-0 z-30 h-14 px-4 bg-white/90 backdrop-blur-md border-b border-sky-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Abrir menu de navegação"
                className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-slate-700 hover:bg-sky-50 active:scale-95 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-base font-bold tracking-tight text-slate-900 truncate">
                {activeTab === 'hoje' && 'Tratamentos de Hoje'}
                {activeTab === 'historico' && 'Histórico de Doses'}
                {activeTab === 'biblioteca' && 'Biblioteca Terapêutica'}
                {activeTab === 'estoque' && 'Estoque & Compras'}
                {activeTab === 'novo' &&
                  (editingMedId ? 'Editar Medicamento' : 'Cadastrar Medicamento')}
                {activeTab === 'opcoes' && 'Categorias & Apresentações'}
              </span>
            </div>

            <span className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
              {formatDateFriendly(todayISO).split('·')[1]?.trim() || 'Hoje'}
            </span>
          </header>

          {/* NOTIFICAÇÃO TOAST HARMONIZADA */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md text-xs font-medium px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 border ${
                  toastMessage.tone === 'warning'
                    ? 'bg-orange-50 border-orange-300 text-orange-950'
                    : toastMessage.tone === 'danger'
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-teal-900 border-teal-800 text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {toastMessage.tone === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                  ) : toastMessage.tone === 'danger' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
                  )}
                  <span>{toastMessage.text}</span>
                </div>
                <button
                  onClick={() => setToastMessage(null)}
                  className="opacity-70 hover:opacity-100 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {dbError && (
            <div className="mx-4 mt-4 p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Atenção: Configuração do Firestore</p>
                <p className="mt-0.5 text-orange-800">{dbError}</p>
              </div>
            </div>
          )}

          {/* CONTEÚDO PRINCIPAL */}
          <main className="flex-1 px-4 pt-5">
            {isLoadingData ? (
              <div className="p-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">
                  Sincronizando seus dados com o Cloud Firestore...
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* =========================================================
                    ABA 1: HOJE (AGENDA DIÁRIA E CÍRCULOS DE PROGRESSO)
                ========================================================= */}
                {activeTab === 'hoje' && (
                  <motion.div
                    key="tab-hoje"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-6"
                  >
                    {stockAlerts.totalAlertCount > 0 && (
                      <div
                        onClick={() => {
                          setStockSubTab('compras');
                          setActiveTab('estoque');
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setStockSubTab('compras');
                            setActiveTab('estoque');
                          }
                        }}
                        className="p-4 rounded-2xl bg-orange-50 border border-orange-200/90 flex items-center justify-between gap-3 cursor-pointer hover:bg-orange-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-orange-950">
                              Atenção ao Estoque e Validade ({stockAlerts.totalAlertCount})
                            </p>
                            <p className="text-[11px] text-orange-800">
                              Toque para verificar os itens em alerta e a Lista de Compras.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <section className="p-5 rounded-3xl bg-white border border-sky-100 shadow-2xs flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-teal-700">
                          Acompanhamento Diário
                        </span>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                          {totalDosesToday === 0
                            ? 'Nenhum tratamento ativo programado'
                            : takenDosesToday === totalDosesToday
                            ? 'Todas as doses de hoje foram concluídas'
                            : `Você administrou ${takenDosesToday} de ${totalDosesToday} doses hoje`}
                        </h1>
                        <p className="text-xs text-slate-500">
                          {totalDosesToday === 0
                            ? 'Cadastre seus medicamentos na aba Cadastrar (+) para iniciar o acompanhamento.'
                            : 'Confirme cada horário abaixo para atualizar o prontuário e o estoque.'}
                        </p>
                      </div>

                      <CircularProgress
                        percentage={dailyProgressPercentage}
                        size={72}
                        strokeWidth={6}
                        colorClass="text-teal-600"
                        trackColorClass="text-sky-100"
                        label={`${takenDosesToday}/${totalDosesToday}`}
                        sublabel="hoje"
                      />
                    </section>

                    {medications.length === 0 ? (
                      <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-base font-bold text-slate-900">
                            Seu inventário clínico está vazio
                          </h2>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto">
                            Cadastre seus medicamentos de uso contínuo ou estoque residencial para acompanhar horários, validades e preços.
                          </p>
                        </div>
                        <button
                          onClick={() => navigateToTab('novo')}
                          className="min-h-[42px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Primeiro Medicamento</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {activeTreatmentsProgress.length > 0 && (
                          <section className="space-y-3">
                            <div className="px-1">
                              <h2 className="text-sm font-bold text-slate-800">
                                Progresso dos Tratamentos Ativos
                              </h2>
                              <p className="text-xs text-slate-500">
                                Acompanhe o ciclo de cada tratamento ou edite/exclua diretamente
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {activeTreatmentsProgress.map(
                                ({ med, completed, target, percentage }) => {
                                  const isLow = med.currentStock <= med.minStockAlert;
                                  const catTheme = getCategoryTheme(med.category);
                                  const ringColor = isLow
                                    ? 'text-orange-500'
                                    : catTheme.ringTextClass;

                                  return (
                                    <div
                                      key={med.id}
                                      className={`p-4 rounded-2xl ${catTheme.cardBgClass} border ${catTheme.cardBorderClass} ${catTheme.accentStripClass} flex items-center justify-between gap-3 transition-colors`}
                                    >
                                      <div
                                        onClick={() => {
                                          setHistoryMedFilter(med.id);
                                          setActiveTab('historico');
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            setHistoryMedFilter(med.id);
                                            setActiveTab('historico');
                                          }
                                        }}
                                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                                      >
                                        <CircularProgress
                                          percentage={percentage}
                                          size={56}
                                          strokeWidth={5}
                                          colorClass={ringColor}
                                          trackColorClass="text-white/80"
                                          label={`${percentage}%`}
                                          sublabel={med.isContinuous ? 'adesão' : 'ciclo'}
                                        />
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className={`w-2 h-2 rounded-full shrink-0 ${catTheme.swatchClass}`}
                                            />
                                            <span
                                              className={`text-[11px] font-semibold truncate ${catTheme.badgeTextClass}`}
                                            >
                                              {med.category}
                                            </span>
                                          </div>
                                          <h3 className="text-sm font-bold text-slate-900 truncate">
                                            {med.name}
                                          </h3>
                                          <p className="text-xs text-slate-600 truncate">
                                            {med.frequencyLabel}
                                            {med.treatmentStartDate
                                              ? ` · Início: ${med.treatmentStartDate
                                                  .split('-')
                                                  .reverse()
                                                  .join('/')}`
                                              : ''}
                                          </p>
                                          <p
                                            className={`text-xs font-mono-tabular font-semibold ${catTheme.badgeTextClass}`}
                                          >
                                            {completed}/{target} doses
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex flex-col gap-1 shrink-0">
                                        <button
                                          onClick={() => handleStartEditMedication(med)}
                                          title="Editar medicamento"
                                          aria-label="Editar medicamento"
                                          className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white text-sky-900 border border-sky-200/70 flex items-center justify-center transition-colors"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setMedToDelete(med)}
                                          title="Excluir medicamento"
                                          aria-label="Excluir medicamento"
                                          className="w-8 h-8 rounded-lg bg-white/90 hover:bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </section>
                        )}

                        {todayScheduledDoses.length > 0 && (
                          <section className="space-y-4">
                            <h2 className="text-sm font-bold text-slate-800 px-1">
                              Agenda de Horários
                            </h2>

                            {(['Manhã', 'Tarde', 'Noite'] as const).map((period) => {
                              const periodDoses = todayScheduledDoses.filter(
                                (d) => d.period === period
                              );
                              if (periodDoses.length === 0) return null;

                              return (
                                <div key={period} className="space-y-2.5">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-800 px-1">
                                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                                    <span>{period}</span>
                                  </div>

                                  <div className="space-y-2.5">
                                    {periodDoses.map(
                                      ({ medication, scheduledTime, takenLog }) => {
                                        const isTaken = Boolean(takenLog);
                                        const isLowStock =
                                          medication.currentStock <=
                                          medication.minStockAlert;
                                        const catTheme = getCategoryTheme(
                                          medication.category
                                        );

                                        return (
                                          <motion.div
                                            key={`${medication.id}-${scheduledTime}`}
                                            layout
                                            className={`p-4 rounded-2xl border transition-colors ${
                                              isTaken
                                                ? 'bg-emerald-50/60 border-emerald-200/80 border-l-4 border-l-emerald-500'
                                                : `${catTheme.cardBgClass} ${catTheme.cardBorderClass} ${catTheme.accentStripClass}`
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-3">
                                              <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600">
                                                  <span className="font-mono-tabular font-bold text-slate-900">
                                                    {scheduledTime}
                                                  </span>
                                                  <span aria-hidden="true">·</span>
                                                  <span>{medication.doseDisplay}</span>
                                                  <span aria-hidden="true">·</span>
                                                  <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${catTheme.badgeBgClass} ${catTheme.badgeTextClass}`}
                                                  >
                                                    <span
                                                      className={`w-1.5 h-1.5 rounded-full ${catTheme.swatchClass}`}
                                                    />
                                                    {medication.category}
                                                  </span>
                                                </div>

                                                <h3
                                                  className={`text-sm font-bold ${
                                                    isTaken
                                                      ? 'text-slate-500 line-through'
                                                      : 'text-slate-900'
                                                  }`}
                                                >
                                                  {medication.name}
                                                </h3>

                                                <div className="flex items-center flex-wrap gap-2 text-xs font-mono-tabular">
                                                  {isLowStock ? (
                                                    <span className="text-orange-600 font-semibold inline-flex items-center gap-1">
                                                      <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                                      Atenção: Restam {medication.currentStock}{' '}
                                                      {medication.unitLabel}
                                                    </span>
                                                  ) : (
                                                    <span className="text-slate-600">
                                                      Estoque: {medication.currentStock}{' '}
                                                      {medication.unitLabel}
                                                    </span>
                                                  )}
                                                  {takenLog && (
                                                    <span className="text-teal-700 font-medium">
                                                      · Concluído às {takenLog.takenTime}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                  onClick={() =>
                                                    handleStartEditMedication(medication)
                                                  }
                                                  title="Editar medicamento"
                                                  aria-label="Editar medicamento"
                                                  className="min-h-[42px] min-w-[38px] rounded-xl bg-white/90 hover:bg-white text-sky-900 border border-sky-200/70 flex items-center justify-center transition-colors"
                                                >
                                                  <Edit3 className="w-4 h-4" />
                                                </button>
                                                <motion.button
                                                  whileTap={{ scale: 0.95 }}
                                                  onClick={() =>
                                                    handleToggleScheduledDose(
                                                      medication,
                                                      scheduledTime
                                                    )
                                                  }
                                                  className={`min-h-[42px] px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors ${
                                                    isTaken
                                                      ? 'bg-teal-600 text-white'
                                                      : 'bg-white text-sky-950 hover:bg-teal-600 hover:text-white border border-sky-200'
                                                  }`}
                                                >
                                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                                  <span>
                                                    {isTaken ? 'Concluído' : 'Confirmar'}
                                                  </span>
                                                </motion.button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </section>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* =========================================================
                    ABA 2: HISTÓRICO DE DOSES
                ========================================================= */}
                {activeTab === 'historico' && (
                  <motion.div
                    key="tab-historico"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-5"
                  >
                    <section className="p-5 rounded-3xl bg-white border border-sky-100 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h1 className="text-base font-bold text-slate-900">
                            Prontuário de Doses Administradas
                          </h1>
                          <p className="text-xs text-slate-500">
                            Consulte o histórico cronológico por medicamento
                          </p>
                        </div>
                        {medications.length > 0 && (
                          <button
                            onClick={() => {
                              setManualDoseMedId(medications[0]?.id || '');
                              setManualDoseDate(getTodayISO());
                              setManualDoseTime(getCurrentTimeHHMM());
                              setIsManualDoseModalOpen(true);
                            }}
                            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 flex items-center gap-1.5 shrink-0 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Lançar Dose</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="history-med-filter"
                          className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                        >
                          <Filter className="w-3.5 h-3.5 text-sky-600" />
                          <span>Filtrar por medicamento</span>
                        </label>
                        <select
                          id="history-med-filter"
                          value={historyMedFilter}
                          onChange={(e) => setHistoryMedFilter(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200/80 text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-600"
                        >
                          <option value="TODOS">
                            Todos os medicamentos ({doseLogs.length} registros)
                          </option>
                          {medications.map((med) => {
                            const count = doseLogs.filter(
                              (l) => l.medicationId === med.id
                            ).length;
                            return (
                              <option key={med.id} value={med.id}>
                                {med.name} ({count} registros)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {[
                          { id: 'TODOS', label: 'Todos' },
                          { id: 'no_horario', label: 'No horário' },
                          { id: 'atrasado', label: 'Com atraso' },
                          { id: 'avulso', label: 'Sob demanda' }
                        ].map((st) => (
                          <button
                            key={st.id}
                            onClick={() => setHistoryStatusFilter(st.id)}
                            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                              historyStatusFilter === st.id
                                ? 'bg-sky-700 text-white'
                                : 'bg-sky-50/70 text-slate-600 hover:bg-sky-100/70'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </section>

                    {groupedHistoryLogs.length === 0 ? (
                      <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center space-y-2">
                        <History className="w-7 h-7 text-slate-400 mx-auto" />
                        <p className="text-sm font-semibold text-slate-800">
                          Nenhum registro de dose encontrado
                        </p>
                        <p className="text-xs text-slate-500">
                          Quando você confirmar doses na aba Hoje ou lançar uma dose manual, elas aparecerão aqui organizadas por data e horário.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {groupedHistoryLogs.map(([dateStr, logs]) => (
                          <div key={dateStr} className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                              <h3 className="text-xs font-bold text-sky-900">
                                {formatDateFriendly(dateStr)}
                              </h3>
                              <span className="font-mono-tabular text-xs text-slate-500">
                                {logs.length}{' '}
                                {logs.length === 1 ? 'registro' : 'registros'}
                              </span>
                            </div>

                            <div className="bg-white rounded-2xl border border-sky-100 divide-y divide-sky-50 overflow-hidden">
                              {logs.map((log) => (
                                <div
                                  key={log.id}
                                  className="p-4 flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-900 font-mono-tabular text-xs font-semibold shrink-0">
                                      {log.takenTime}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-sm font-bold text-slate-900 truncate">
                                        {log.medicationName}
                                      </h4>
                                      <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
                                        <span>{log.doseDisplay}</span>
                                        <span aria-hidden="true">·</span>
                                        <span>{log.purpose}</span>
                                        {log.status === 'atrasado' && (
                                          <>
                                            <span aria-hidden="true">·</span>
                                            <span className="text-orange-600 font-semibold inline-flex items-center gap-1">
                                              <AlertTriangle className="w-3 h-3 text-orange-500" />
                                              Com atraso
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleDeleteHistoryLog(log)}
                                    title="Remover registro"
                                    aria-label="Remover registro do histórico"
                                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* =========================================================
                    ABA 3: BIBLIOTECA TERAPÊUTICA
                ========================================================= */}
                {activeTab === 'biblioteca' && (
                  <motion.div
                    key="tab-biblioteca"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-5"
                  >
                    <section className="p-5 rounded-3xl bg-white border border-sky-100 space-y-3.5">
                      <div>
                        <h1 className="text-base font-bold text-slate-900">
                          Biblioteca Terapêutica e Indicações
                        </h1>
                        <p className="text-xs text-slate-500">
                          Consulte por sintoma ou categoria clínica, edite ou exclua medicamentos
                        </p>
                      </div>

                      <div className="relative">
                        <Search className="w-4 h-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar por sintoma, nome ou categoria..."
                          className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-2xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-600"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            aria-label="Limpar busca"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                        <button
                          onClick={() => setSelectedCategory('Todos')}
                          className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            selectedCategory === 'Todos'
                              ? 'bg-slate-900 text-white'
                              : 'bg-sky-50/80 text-sky-900 hover:bg-sky-100'
                          }`}
                        >
                          Todos
                        </button>
                        {categoriesList.map((cat) => {
                          const catTheme = CATEGORY_COLOR_THEMES[cat.colorKey] || CATEGORY_COLOR_THEMES.sky;
                          const isSelected = selectedCategory === cat.name;
                          return (
                            <button
                              key={cat.name}
                              onClick={() => setSelectedCategory(cat.name)}
                              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-slate-900 text-white'
                                  : `${catTheme.badgeBgClass} ${catTheme.badgeTextClass} hover:opacity-90`
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${catTheme.swatchClass}`}
                              />
                              <span>{cat.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {filteredLibraryMedications.length === 0 ? (
                      <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center space-y-2">
                        <BookOpen className="w-7 h-7 text-slate-400 mx-auto" />
                        <p className="text-sm font-semibold text-slate-800">
                          Nenhum medicamento encontrado
                        </p>
                        <p className="text-xs text-slate-500">
                          Utilize a aba Cadastrar (+) para adicionar medicamentos à sua biblioteca.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredLibraryMedications.map((med) => {
                          const daysLeft = getDaysUntilExpiry(med.expiryDate);
                          const isExpired = daysLeft < 0;
                          const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;
                          const isLowStock = med.currentStock <= med.minStockAlert;
                          const catTheme = getCategoryTheme(med.category);

                          return (
                            <div
                              key={med.id}
                              className={`p-4 rounded-2xl ${catTheme.cardBgClass} border ${catTheme.cardBorderClass} ${catTheme.accentStripClass} space-y-3 transition-colors`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center flex-wrap gap-1.5 text-xs font-medium">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-semibold ${catTheme.badgeBgClass} ${catTheme.badgeTextClass}`}
                                    >
                                      <span
                                        className={`w-2 h-2 rounded-full ${catTheme.swatchClass}`}
                                      />
                                      {med.category}
                                    </span>
                                    <span aria-hidden="true" className="text-slate-400">
                                      ·
                                    </span>
                                    <span className="text-slate-600">
                                      {med.formType}
                                    </span>
                                    {med.controlled !== 'Venda Livre / Simples' && (
                                      <>
                                        <span aria-hidden="true" className="text-slate-400">
                                          ·
                                        </span>
                                        <span className="text-sky-900 font-semibold">
                                          Receita Retida
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  <h3 className="text-base font-bold text-slate-900">
                                    {med.name}
                                  </h3>
                                  <p className="text-xs text-slate-600">
                                    {med.activeIngredient}
                                    {med.isActiveTreatment && med.treatmentStartDate
                                      ? ` · Início do tratamento: ${med.treatmentStartDate
                                          .split('-')
                                          .reverse()
                                          .join('/')}`
                                      : ''}
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  <span
                                    className={`font-mono-tabular text-sm font-bold block ${
                                      isExpired
                                        ? 'text-rose-600'
                                        : isLowStock
                                        ? 'text-orange-600'
                                        : 'text-teal-700'
                                    }`}
                                  >
                                    {med.currentStock} {med.unitLabel}
                                  </span>
                                  <span className="text-[11px] text-slate-600 font-mono-tabular">
                                    Último: {formatCurrencyBRL(med.lastPaidPrice)}
                                  </span>
                                </div>
                              </div>

                              {(isLowStock || isExpiringSoon) && !isExpired && (
                                <div className="px-3 py-2 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-800 text-xs font-medium flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                                  <span>
                                    Atenção:{' '}
                                    {isLowStock &&
                                      `Estoque baixo (${med.currentStock} un.) `}
                                    {isExpiringSoon && `Vence em ${daysLeft} dias`}
                                  </span>
                                </div>
                              )}

                              <p className="text-xs text-slate-700 bg-white/85 p-3 rounded-xl border border-white">
                                <strong className="text-slate-900">
                                  Indicação:{' '}
                                </strong>
                                {med.purpose}
                              </p>

                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleStartEditMedication(med)}
                                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white/90 text-sky-900 hover:bg-white border border-sky-200/70 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={() => setMedToDelete(med)}
                                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white/90 text-rose-700 hover:bg-rose-50 border border-rose-200/70 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Excluir</span>
                                  </button>
                                </div>

                                {!isExpired && med.currentStock >= med.doseAmount && (
                                  <button
                                    onClick={() => handleTakeSingleDoseNow(med)}
                                    className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold transition-colors shrink-0"
                                  >
                                    Registrar Dose
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* =========================================================
                    ABA 4: ESTOQUE & LISTA DE COMPRAS AUTOMÁTICA
                ========================================================= */}
                {activeTab === 'estoque' && (
                  <motion.div
                    key="tab-estoque"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-5"
                  >
                    <div className="p-1.5 rounded-2xl bg-white border border-sky-100 grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setStockSubTab('inventario')}
                        className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                          stockSubTab === 'inventario'
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-600 hover:bg-sky-50'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        <span>Posição de Estoque</span>
                      </button>

                      <button
                        onClick={() => setStockSubTab('compras')}
                        className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                          stockSubTab === 'compras'
                            ? 'bg-teal-600 text-white'
                            : 'text-slate-600 hover:bg-emerald-50/60'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>
                          Lista de Compras ({stockAlerts.shoppingList.length})
                        </span>
                      </button>
                    </div>

                    {stockSubTab === 'compras' ? (
                      <div className="space-y-4">
                        <section className="p-5 rounded-3xl bg-white border border-teal-200/80 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-xs font-semibold text-teal-700">
                                Reposição Automática
                              </span>
                              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                                Lista de Compras para a Farmácia
                              </h2>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Medicamentos de uso contínuo com estoque baixo ou vencidos, com o último preço pago para comparar na farmácia.
                              </p>
                            </div>

                            <div className="text-right shrink-0 bg-emerald-50/80 px-3.5 py-2.5 rounded-2xl border border-emerald-200/70">
                              <span className="text-[11px] text-teal-800 block">
                                Total Estimado
                              </span>
                              <span className="font-mono-tabular text-base font-bold text-teal-950">
                                {formatCurrencyBRL(stockAlerts.shoppingTotalEstimated)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-sky-100 text-xs">
                            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={showAllInShoppingList}
                                onChange={(e) =>
                                  setShowAllInShoppingList(e.target.checked)
                                }
                                className="w-4 h-4 rounded accent-teal-600"
                              />
                              <span>
                                Incluir também medicamentos de uso esporádico
                              </span>
                            </label>
                          </div>
                        </section>

                        {stockAlerts.shoppingList.length === 0 ? (
                          <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
                            <p className="text-sm font-bold text-slate-800">
                              Nenhum medicamento pendente de compra
                            </p>
                            <p className="text-xs text-slate-500">
                              Quando um medicamento de uso contínuo atingir estoque baixo ou vencer, ele será listado automaticamente aqui.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {stockAlerts.shoppingList.map(
                              ({ medication, isExpired, reason }) => {
                                const catTheme = getCategoryTheme(
                                  medication.category
                                );
                                return (
                                  <div
                                    key={medication.id}
                                    className={`p-4 rounded-2xl ${catTheme.cardBgClass} border border-orange-200/90 ${catTheme.accentStripClass} space-y-3`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="space-y-1 min-w-0">
                                        <div className="flex items-center flex-wrap gap-1.5 text-xs">
                                          <span
                                            className={`font-semibold inline-flex items-center gap-1 ${
                                              isExpired
                                                ? 'text-rose-600'
                                                : 'text-orange-600'
                                            }`}
                                          >
                                            <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                            {reason}
                                          </span>
                                          {medication.controlled !==
                                            'Venda Livre / Simples' && (
                                            <>
                                              <span aria-hidden="true">·</span>
                                              <span className="text-sky-800 font-semibold">
                                                Levar Receita Retida
                                              </span>
                                            </>
                                          )}
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900">
                                          {medication.name}
                                        </h3>
                                        <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-600">
                                          <span>
                                            Caixa padrão: {medication.boxCapacity}{' '}
                                            {medication.unitLabel}
                                          </span>
                                          <span aria-hidden="true">·</span>
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${catTheme.badgeBgClass} ${catTheme.badgeTextClass}`}
                                          >
                                            <span
                                              className={`w-1.5 h-1.5 rounded-full ${catTheme.swatchClass}`}
                                            />
                                            {medication.category}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0 bg-white/90 px-3 py-2 rounded-xl border border-sky-100">
                                        <span className="text-[10px] text-slate-500 block">
                                          Último preço pago
                                        </span>
                                        <span className="font-mono-tabular text-sm font-bold text-sky-950">
                                          {formatCurrencyBRL(medication.lastPaidPrice)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-sky-100/70">
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() =>
                                            handleStartEditMedication(medication)
                                          }
                                          className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white/90 text-sky-900 hover:bg-white border border-sky-200/70 text-xs font-medium inline-flex items-center gap-1"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          <span>Editar</span>
                                        </button>
                                        <button
                                          onClick={() => setMedToDelete(medication)}
                                          className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white/90 text-rose-700 hover:bg-rose-50 border border-rose-200/70 text-xs font-medium inline-flex items-center gap-1"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Excluir</span>
                                        </button>
                                      </div>

                                      <button
                                        onClick={() => {
                                          setRestockModalMed(medication);
                                          setRestockPriceInput(
                                            medication.lastPaidPrice.toFixed(2)
                                          );
                                          setRestockQuantityInput(
                                            medication.boxCapacity
                                          );
                                          setRestockExpiryInput(
                                            getOffsetDateISO(365)
                                          );
                                        }}
                                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Confirmar Compra</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() =>
                              setStockFilter(
                                stockFilter === 'vencendo' ? 'todos' : 'vencendo'
                              )
                            }
                            className={`p-4 rounded-2xl border text-left transition-colors ${
                              stockFilter === 'vencendo'
                                ? 'bg-orange-50 border-orange-300'
                                : 'bg-white border-sky-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-600">
                                Validade em Atenção
                              </span>
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            </div>
                            <span className="font-mono-tabular text-xl font-bold text-slate-900 mt-1 block">
                              {stockAlerts.expiringSoon.length +
                                stockAlerts.expired.length}
                            </span>
                            <span className="text-[11px] text-orange-700 font-medium mt-0.5 block">
                              {stockAlerts.expiringSoon.length} &lt;30d ·{' '}
                              {stockAlerts.expired.length} vencido(s)
                            </span>
                          </button>

                          <button
                            onClick={() =>
                              setStockFilter(
                                stockFilter === 'acabando' ? 'todos' : 'acabando'
                              )
                            }
                            className={`p-4 rounded-2xl border text-left transition-colors ${
                              stockFilter === 'acabando'
                                ? 'bg-orange-50 border-orange-300'
                                : 'bg-white border-sky-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-600">
                                Estoque Baixo
                              </span>
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            </div>
                            <span className="font-mono-tabular text-xl font-bold text-slate-900 mt-1 block">
                              {stockAlerts.lowStock.length}
                            </span>
                            <span className="text-[11px] text-orange-700 font-medium mt-0.5 block">
                              Abaixo do mínimo configurado
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                          {[
                            { id: 'todos', label: 'Todos' },
                            { id: 'acabando', label: 'Estoque Baixo' },
                            { id: 'vencendo', label: 'Vencendo (<30d)' },
                            { id: 'vencidos', label: 'Vencidos' }
                          ].map((f) => (
                            <button
                              key={f.id}
                              onClick={() =>
                                setStockFilter(
                                  f.id as
                                    | 'todos'
                                    | 'vencendo'
                                    | 'acabando'
                                    | 'vencidos'
                                )
                              }
                              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                                stockFilter === f.id
                                  ? 'bg-sky-700 text-white'
                                  : 'bg-white text-slate-600 border border-sky-100 hover:bg-sky-50'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        {filteredStockMedications.length === 0 ? (
                          <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center space-y-2">
                            <Package className="w-7 h-7 text-slate-400 mx-auto" />
                            <p className="text-sm font-semibold text-slate-800">
                              Nenhum item nesta categoria de estoque
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {filteredStockMedications.map((med) => {
                              const daysLeft = getDaysUntilExpiry(med.expiryDate);
                              const isExpired = daysLeft < 0;
                              const isExpiringSoon =
                                daysLeft >= 0 && daysLeft <= 30;
                              const isLowStock =
                                med.currentStock <= med.minStockAlert;
                              const catTheme = getCategoryTheme(med.category);

                              const stockPercent = Math.min(
                                100,
                                Math.round(
                                  (med.currentStock /
                                    Math.max(1, med.boxCapacity)) *
                                    100
                                )
                              );

                              const barColor = isExpired
                                ? 'bg-rose-500'
                                : isLowStock || isExpiringSoon
                                ? 'bg-orange-500'
                                : catTheme.swatchClass;

                              return (
                                <div
                                  key={med.id}
                                  className={`p-4 rounded-2xl ${catTheme.cardBgClass} border ${catTheme.accentStripClass} space-y-3 ${
                                    isLowStock || isExpiringSoon
                                      ? 'border-orange-200'
                                      : isExpired
                                      ? 'border-rose-200'
                                      : catTheme.cardBorderClass
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex items-center flex-wrap gap-1.5 text-xs">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${catTheme.badgeBgClass} ${catTheme.badgeTextClass}`}
                                        >
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full ${catTheme.swatchClass}`}
                                          />
                                          {med.category}
                                        </span>
                                        <span aria-hidden="true">·</span>
                                        {isExpired ? (
                                          <span className="font-semibold text-rose-600 inline-flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Vencido (
                                            {formatExpiryMMYYYY(med.expiryDate)})
                                          </span>
                                        ) : isExpiringSoon ? (
                                          <span className="font-semibold text-orange-600 inline-flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                            Atenção: Vence em {daysLeft} dias
                                          </span>
                                        ) : (
                                          <span className="font-medium text-teal-800">
                                            Validade regular (
                                            {formatExpiryMMYYYY(med.expiryDate)})
                                          </span>
                                        )}
                                        {isLowStock && !isExpired && (
                                          <>
                                            <span aria-hidden="true">·</span>
                                            <span className="font-semibold text-orange-600 inline-flex items-center gap-1">
                                              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                              Estoque baixo
                                            </span>
                                          </>
                                        )}
                                      </div>

                                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                                        {med.name}
                                      </h3>
                                      <p className="text-xs text-slate-600 font-mono-tabular">
                                        Último preço:{' '}
                                        {formatCurrencyBRL(med.lastPaidPrice)}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-sky-100 shrink-0">
                                      <button
                                        onClick={() => handleAdjustStock(med, -1)}
                                        aria-label="Reduzir 1 unidade"
                                        className="w-7 h-7 rounded-lg bg-sky-50 text-slate-700 hover:bg-sky-100 font-mono-tabular font-bold text-xs flex items-center justify-center"
                                      >
                                        -
                                      </button>
                                      <span className="font-mono-tabular text-xs font-bold px-2 text-slate-900">
                                        {med.currentStock}
                                      </span>
                                      <button
                                        onClick={() => handleAdjustStock(med, 1)}
                                        aria-label="Adicionar 1 unidade"
                                        className="w-7 h-7 rounded-lg bg-sky-50 text-slate-700 hover:bg-sky-100 font-mono-tabular font-bold text-xs flex items-center justify-center"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs text-slate-600">
                                      <span>Disponível na caixa</span>
                                      <span className="font-mono-tabular font-semibold text-slate-900">
                                        {med.currentStock} / {med.boxCapacity}{' '}
                                        {med.unitLabel}
                                      </span>
                                    </div>
                                    <div className="w-full h-2 bg-white/90 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                        style={{ width: `${stockPercent}%` }}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-sky-100/70">
                                    <button
                                      onClick={() => handleStartEditMedication(med)}
                                      className="min-h-[34px] px-3 py-1 rounded-xl bg-white/90 text-sky-900 hover:bg-white border border-sky-200/70 text-xs font-semibold inline-flex items-center gap-1.5"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => setMedToDelete(med)}
                                      className="min-h-[34px] px-3 py-1 rounded-xl bg-white/90 text-rose-700 hover:bg-rose-50 border border-rose-200/70 text-xs font-semibold inline-flex items-center gap-1.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Excluir</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* =========================================================
                    ABA 5: CADASTRAR / EDITAR MEDICAMENTO (+)
                ========================================================= */}
                {activeTab === 'novo' && (
                  <motion.form
                    key="tab-novo"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    onSubmit={handleSaveMedication}
                    className="space-y-5"
                  >
                    <section className="p-5 rounded-3xl bg-white border border-sky-100 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-slate-900">
                          1. Identificação Clínica e Categoria
                        </h2>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => navigateToTab('opcoes')}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Gerenciar categorias e cores</span>
                          </button>
                          {editingMedId && (
                            <button
                              type="button"
                              onClick={resetForm}
                              className="text-xs font-medium text-slate-500 hover:text-slate-800"
                            >
                              Cancelar edição
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nome Comercial ou Genérico + Dosagem *
                          </label>
                          <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Ex: Losartana Potássica 50mg"
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Categoria Principal
                            </label>
                            <div className="relative">
                              <select
                                value={formCategory}
                                onChange={(e) => setFormCategory(e.target.value)}
                                className="w-full min-h-[44px] pl-9 pr-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                              >
                                {categoriesList.map((cat) => (
                                  <option key={cat.name} value={cat.name}>
                                    {cat.name} ({CATEGORY_COLOR_THEMES[cat.colorKey]?.label || 'Azul'})
                                  </option>
                                ))}
                              </select>
                              <span
                                className={`w-3.5 h-3.5 rounded-full absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                                  getCategoryTheme(formCategory).swatchClass
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Apresentação
                            </label>
                            <select
                              value={formType}
                              onChange={(e) => {
                                const nextType = e.target.value;
                                setFormType(nextType);
                                const matched = presentationsList.find(
                                  (p) => p.name === nextType
                                );
                                if (matched) {
                                  setFormDoseDisplay(matched.defaultDose);
                                } else {
                                  setFormDoseDisplay(
                                    `1 ${nextType.toLowerCase()}`
                                  );
                                }
                              }}
                              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                            >
                              {presentationsList.map((pres) => (
                                <option key={pres.name} value={pres.name}>
                                  {pres.name} ({pres.unitLabel})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Finalidade Terapêutica (Para que serve) *
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={formPurpose}
                            onChange={(e) => setFormPurpose(e.target.value)}
                            placeholder="Descreva a finalidade clínica e sintomas tratados."
                            className="w-full p-3 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700">
                            Tags Clínicas Padrão
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {STANDARD_CLINICAL_TAGS.map((tag) => {
                              const isSelected = formSelectedTags.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() =>
                                    setFormSelectedTags((prev) =>
                                      prev.includes(tag)
                                        ? prev.filter((t) => t !== tag)
                                        : [...prev, tag]
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                                    isSelected
                                      ? 'bg-teal-600 text-white font-semibold'
                                      : 'bg-sky-50 text-sky-900 hover:bg-sky-100'
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="p-5 rounded-3xl bg-white border border-sky-100 space-y-4">
                      <h2 className="text-sm font-bold text-slate-900">
                        2. Estoque, Validade e Último Preço Pago
                      </h2>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Quantidade Atual
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={formCurrentStock}
                            onChange={(e) =>
                              setFormCurrentStock(Number(e.target.value))
                            }
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Capacidade da Caixa
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={formBoxCapacity}
                            onChange={(e) =>
                              setFormBoxCapacity(Number(e.target.value))
                            }
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Data de Validade
                          </label>
                          <input
                            type="date"
                            value={formExpiryDate}
                            onChange={(e) => setFormExpiryDate(e.target.value)}
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Último Preço Pago (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={formLastPaidPrice}
                            onChange={(e) =>
                              setFormLastPaidPrice(Number(e.target.value))
                            }
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="p-5 rounded-3xl bg-white border border-sky-100 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">
                            3. Tratamento Ativo com Horários Programados
                          </h2>
                          <p className="text-xs text-slate-500">
                            Incluir na agenda diária e nos círculos de progresso
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={formIsActiveTreatment}
                          onClick={() =>
                            setFormIsActiveTreatment(!formIsActiveTreatment)
                          }
                          className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 ${
                            formIsActiveTreatment
                              ? 'bg-teal-600'
                              : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                              formIsActiveTreatment
                                ? 'translate-x-6'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {formIsActiveTreatment && (
                        <div className="space-y-4 pt-2 border-t border-sky-50">
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-700">
                              Horários de Administração
                            </label>
                            {formScheduleTimes.length === 0 ? (
                              <p className="text-xs text-slate-500 bg-sky-50/50 px-3 py-2 rounded-xl border border-sky-100">
                                Nenhum horário adicionado. Selecione o horário abaixo e clique em &ldquo;+ Incluir Horário&rdquo; para adicionar quantos horários forem necessários.
                              </p>
                            ) : (
                              <div className="flex items-center flex-wrap gap-2">
                                {formScheduleTimes.map((time) => (
                                  <div
                                    key={time}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-mono-tabular font-semibold text-sky-900"
                                  >
                                    <span>{time}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFormScheduleTimes(
                                          formScheduleTimes.filter(
                                            (t) => t !== time
                                          )
                                        )
                                      }
                                      aria-label={`Remover horário ${time}`}
                                      className="text-sky-700 hover:text-rose-600"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="time"
                                value={formNewTimeInput}
                                onChange={(e) =>
                                  setFormNewTimeInput(e.target.value)
                                }
                                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-sky-50/40 border border-sky-200 text-sm font-mono-tabular"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!formNewTimeInput) {
                                    showToast(
                                      'Atenção: Selecione um horário no campo ao lado para incluir.',
                                      'warning'
                                    );
                                    return;
                                  }
                                  if (
                                    !formScheduleTimes.includes(formNewTimeInput)
                                  ) {
                                    setFormScheduleTimes(
                                      [...formScheduleTimes, formNewTimeInput].sort()
                                    );
                                  }
                                  setFormNewTimeInput('');
                                }}
                                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-sky-100/80 hover:bg-sky-200/70 text-xs font-semibold text-sky-900"
                              >
                                + Incluir Horário
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Data de Início do Tratamento
                              </label>
                              <input
                                type="date"
                                value={formTreatmentStartDate}
                                onChange={(e) =>
                                  setFormTreatmentStartDate(e.target.value)
                                }
                                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                              />
                              <p className="text-[11px] text-slate-500 mt-1">
                                Selecione uma data passada para tratamentos já iniciados
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Regime de Prescrição
                              </label>
                              <select
                                value={formControlled}
                                onChange={(e) =>
                                  setFormControlled(
                                    e.target.value as ControlledType
                                  )
                                }
                                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800"
                              >
                                <option value="Venda Livre / Simples">
                                  Venda Livre / Receituário Simples
                                </option>
                                <option value="Receita Retida (Branca C1/Antibiótico)">
                                  Receita Retida (Controle Especial / Antibiótico)
                                </option>
                                <option value="Receita Azul (Notificação B)">
                                  Receita Azul (Notificação B)
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Duração (Dias)
                              </label>
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="number"
                                  min={1}
                                  disabled={formIsContinuous}
                                  value={formTreatmentDays}
                                  onChange={(e) =>
                                    setFormTreatmentDays(Number(e.target.value))
                                  }
                                  className="w-20 min-h-[44px] px-3 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular disabled:opacity-50"
                                />
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formIsContinuous}
                                    onChange={(e) =>
                                      setFormIsContinuous(e.target.checked)
                                    }
                                    className="w-4 h-4 rounded accent-teal-600"
                                  />
                                  <span>Uso Contínuo</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>

                    <motion.button
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      <span>
                        {editingMedId
                          ? 'Salvar Alterações no Banco de Dados'
                          : 'Confirmar Cadastro do Medicamento'}
                      </span>
                    </motion.button>
                  </motion.form>
                )}

                {/* =========================================================
                    ABA 6: GERENCIAR CATEGORIAS & APRESENTAÇÕES
                ========================================================= */}
                {activeTab === 'opcoes' && (
                  <motion.div
                    key="tab-opcoes"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-6"
                  >
                    {/* Bloco 1: Gerenciar Categorias e Cores dos Cards */}
                    <section className="p-5 rounded-3xl bg-white border border-sky-100 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h1 className="text-base font-bold text-slate-900">
                            Categorias e Cores dos Cards
                          </h1>
                          <p className="text-xs text-slate-500">
                            Cada categoria possui uma cor exclusiva nos cards. Você pode adicionar novas categorias ou editar o nome e a cor das existentes.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetCatalogDefaults}
                          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar Padrão</span>
                        </button>
                      </div>

                      {/* Formulário de Nova Categoria + Seletor de Cor */}
                      <form
                        onSubmit={handleAddCategory}
                        className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100 space-y-3"
                      >
                        <p className="text-xs font-bold text-sky-950">
                          Adicionar Nova Categoria
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Nome da categoria (ex: Oftalmológico, Pediátrico)..."
                            className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-sky-200/80 text-sm text-slate-800 focus:outline-none focus:border-teal-600"
                          />
                          <button
                            type="submit"
                            className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0 inline-flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Adicionar Categoria</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-600 block">
                            Escolha a cor dos cards desta categoria:
                          </span>
                          <div className="flex items-center flex-wrap gap-2">
                            {CATEGORY_COLOR_KEYS.map((colorKey) => {
                              const theme = CATEGORY_COLOR_THEMES[colorKey];
                              const isSelected = newCategoryColor === colorKey;
                              return (
                                <button
                                  key={colorKey}
                                  type="button"
                                  onClick={() => setNewCategoryColor(colorKey)}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 border transition-all ${
                                    isSelected
                                      ? `${theme.badgeBgClass} ${theme.badgeTextClass} ring-2 ring-slate-800/20 font-bold`
                                      : 'bg-white border-sky-100 text-slate-600 hover:bg-sky-50/50'
                                  }`}
                                >
                                  <span
                                    className={`w-3 h-3 rounded-full ${theme.swatchClass}`}
                                  />
                                  <span>{theme.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </form>

                      {/* Lista de Categorias com Editar Nome, Editar Cor e Excluir */}
                      <div className="space-y-2.5">
                        {categoriesList.map((cat, idx) => {
                          const catTheme =
                            CATEGORY_COLOR_THEMES[cat.colorKey] ||
                            CATEGORY_COLOR_THEMES.sky;
                          return (
                            <div
                              key={`${cat.name}-${idx}`}
                              className={`p-3.5 rounded-2xl border ${catTheme.cardBgClass} ${catTheme.cardBorderClass} ${catTheme.accentStripClass} transition-colors`}
                            >
                              {editingCategoryIndex === idx ? (
                                <div className="space-y-3">
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingCategoryValue}
                                      onChange={(e) =>
                                        setEditingCategoryValue(e.target.value)
                                      }
                                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-teal-500 text-sm text-slate-900"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveCategoryEdit(idx)}
                                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                                      >
                                        Salvar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingCategoryIndex(null)
                                        }
                                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-medium"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <span className="text-[11px] font-semibold text-slate-700 block">
                                      Cor da categoria nos cards:
                                    </span>
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      {CATEGORY_COLOR_KEYS.map((colorKey) => {
                                        const theme =
                                          CATEGORY_COLOR_THEMES[colorKey];
                                        const isSelected =
                                          editingCategoryColor === colorKey;
                                        return (
                                          <button
                                            key={colorKey}
                                            type="button"
                                            onClick={() =>
                                              setEditingCategoryColor(colorKey)
                                            }
                                            className={`px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1.5 border transition-all ${
                                              isSelected
                                                ? `${theme.badgeBgClass} ${theme.badgeTextClass} ring-2 ring-slate-900/20 font-bold`
                                                : 'bg-white border-slate-200 text-slate-600'
                                            }`}
                                          >
                                            <span
                                              className={`w-2.5 h-2.5 rounded-full ${theme.swatchClass}`}
                                            />
                                            <span>{theme.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className={`w-3.5 h-3.5 rounded-full shrink-0 ${catTheme.swatchClass}`}
                                    />
                                    <div>
                                      <span className="text-sm font-bold text-slate-900 block">
                                        {cat.name}
                                      </span>
                                      <span
                                        className={`text-[11px] font-medium ${catTheme.badgeTextClass}`}
                                      >
                                        Cor atual: {catTheme.label}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                                    {/* Seletor rápido de bolinhas de cor */}
                                    <div
                                      className="flex items-center gap-1 bg-white/85 px-2 py-1 rounded-xl border border-sky-100"
                                      title="Trocar cor rapidamente"
                                    >
                                      {CATEGORY_COLOR_KEYS.map((colorKey) => {
                                        const theme =
                                          CATEGORY_COLOR_THEMES[colorKey];
                                        const isCurrent =
                                          cat.colorKey === colorKey;
                                        return (
                                          <button
                                            key={colorKey}
                                            type="button"
                                            onClick={() =>
                                              handleQuickChangeCategoryColor(
                                                idx,
                                                colorKey
                                              )
                                            }
                                            title={`Cor: ${theme.label}`}
                                            aria-label={`Mudar cor de ${cat.name} para ${theme.label}`}
                                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform ${
                                              isCurrent
                                                ? 'scale-110 ring-2 ring-slate-700'
                                                : 'opacity-70 hover:opacity-100 hover:scale-105'
                                            }`}
                                          >
                                            <span
                                              className={`w-3.5 h-3.5 rounded-full ${theme.swatchClass}`}
                                            />
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCategoryIndex(idx);
                                          setEditingCategoryValue(cat.name);
                                          setEditingCategoryColor(cat.colorKey);
                                        }}
                                        aria-label={`Editar categoria ${cat.name}`}
                                        className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-sky-900 border border-sky-200/70 text-xs font-semibold inline-flex items-center gap-1"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Editar</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCategory(idx)}
                                        aria-label={`Excluir categoria ${cat.name}`}
                                        className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white/90 hover:bg-rose-50 text-rose-700 border border-rose-200/70 text-xs font-semibold inline-flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Excluir</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Bloco 2: Gerenciar Apresentações */}
                    <section className="p-5 rounded-3xl bg-white border border-sky-100 space-y-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Apresentações e Unidades
                        </h2>
                        <p className="text-xs text-slate-500">
                          Configure as formas farmacêuticas (Comprimido, Sachê, mL, Ampola, etc.) e suas unidades de estoque
                        </p>
                      </div>

                      {/* Formulário de Nova Apresentação */}
                      <form
                        onSubmit={handleAddPresentation}
                        className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100 space-y-3"
                      >
                        <p className="text-xs font-bold text-sky-950">
                          Adicionar Nova Apresentação
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <input
                            type="text"
                            value={newPresName}
                            onChange={(e) => setNewPresName(e.target.value)}
                            placeholder="Nome (ex: Ampola, Colírio)"
                            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-xs text-slate-800"
                          />
                          <input
                            type="text"
                            value={newPresUnit}
                            onChange={(e) => setNewPresUnit(e.target.value)}
                            placeholder="Unidade no estoque (ex: ampolas)"
                            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-xs text-slate-800"
                          />
                          <input
                            type="text"
                            value={newPresDefaultDose}
                            onChange={(e) =>
                              setNewPresDefaultDose(e.target.value)
                            }
                            placeholder="Dose padrão (ex: 1 ampola)"
                            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-xs text-slate-800"
                          />
                        </div>
                        <button
                          type="submit"
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Adicionar Apresentação</span>
                        </button>
                      </form>

                      {/* Lista de Apresentações com Editar e Excluir */}
                      <div className="divide-y divide-sky-50 border border-sky-100 rounded-2xl overflow-hidden">
                        {presentationsList.map((pres, idx) => (
                          <div
                            key={`${pres.name}-${idx}`}
                            className="p-3.5 bg-white space-y-2"
                          >
                            {editingPresIndex === idx ? (
                              <div className="space-y-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    value={editingPresName}
                                    onChange={(e) =>
                                      setEditingPresName(e.target.value)
                                    }
                                    placeholder="Nome da apresentação"
                                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-sky-50/50 border border-teal-500 text-xs text-slate-900"
                                  />
                                  <input
                                    type="text"
                                    value={editingPresUnit}
                                    onChange={(e) =>
                                      setEditingPresUnit(e.target.value)
                                    }
                                    placeholder="Unidade (ex: sachês, ml)"
                                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-sky-50/50 border border-teal-500 text-xs text-slate-900"
                                  />
                                  <input
                                    type="text"
                                    value={editingPresDefaultDose}
                                    onChange={(e) =>
                                      setEditingPresDefaultDose(e.target.value)
                                    }
                                    placeholder="Dose padrão"
                                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-sky-50/50 border border-teal-500 text-xs text-slate-900"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSavePresentationEdit(idx)
                                    }
                                    className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                                  >
                                    Salvar Alterações
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPresIndex(null)}
                                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {pres.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Unidade: {pres.unitLabel} · Dose sugerida:{' '}
                                    {pres.defaultDose}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPresIndex(idx);
                                      setEditingPresName(pres.name);
                                      setEditingPresUnit(pres.unitLabel);
                                      setEditingPresDefaultDose(pres.defaultDose);
                                    }}
                                    aria-label={`Editar apresentação ${pres.name}`}
                                    className="min-h-[34px] px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-medium inline-flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeletePresentation(idx)
                                    }
                                    aria-label={`Excluir apresentação ${pres.name}`}
                                    className="min-h-[34px] px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium inline-flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Excluir</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </main>

          {/* ==========================================
              BOTTOM NAVIGATION BAR FIXA (MOBILE)
          ========================================== */}
          <nav
            aria-label="Navegação inferior"
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-sky-100"
          >
            <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
              <button
                onClick={() => navigateToTab('hoje')}
                className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
                  activeTab === 'hoje'
                    ? 'text-teal-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] mt-1 tracking-tight">Hoje</span>
              </button>

              <button
                onClick={() => navigateToTab('historico')}
                className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
                  activeTab === 'historico'
                    ? 'text-teal-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-5 h-5" />
                <span className="text-[10px] mt-1 tracking-tight">Histórico</span>
              </button>

              <div className="flex items-center justify-center">
                <button
                  onClick={() => navigateToTab('novo')}
                  aria-label="Cadastrar medicamento"
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform active:scale-95 ${
                    activeTab === 'novo'
                      ? 'bg-sky-800 text-white'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              <button
                onClick={() => navigateToTab('biblioteca')}
                className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
                  activeTab === 'biblioteca'
                    ? 'text-teal-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-[10px] mt-1 tracking-tight">Biblioteca</span>
              </button>

              <button
                onClick={() => navigateToTab('estoque')}
                className={`relative min-h-[48px] flex flex-col items-center justify-center transition-colors ${
                  activeTab === 'estoque'
                    ? 'text-teal-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="text-[10px] mt-1 tracking-tight">Estoque</span>
                {stockAlerts.totalAlertCount > 0 && (
                  <span className="absolute top-1.5 right-3 w-4 h-4 rounded-full bg-orange-500 text-white font-mono-tabular text-[9px] font-bold flex items-center justify-center">
                    {stockAlerts.totalAlertCount}
                  </span>
                )}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* ==========================================
          MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE MEDICAMENTO
      ========================================== */}
      {medToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-sky-100 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Excluir Medicamento?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação removerá o medicamento do banco de dados.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-sky-50/60 p-3 rounded-xl border border-sky-100">
              Tem certeza que deseja excluir{' '}
              <strong className="text-slate-900">{medToDelete.name}</strong>?
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setMedToDelete(null)}
                className="flex-1 min-h-[42px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteMedication}
                className="flex-1 min-h-[42px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DE CONFIRMAÇÃO PARA LIMPAR TODOS OS DADOS
      ========================================== */}
      {isClearAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-orange-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Atenção: Limpar Todos os Dados
                </h3>
                <p className="text-xs text-slate-500">
                  Todos os medicamentos e registros serão removidos da sua conta.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsClearAllConfirmOpen(false)}
                className="flex-1 min-h-[42px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearAllUserData}
                className="flex-1 min-h-[42px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DE CONFIRMAÇÃO DE COMPRA (REPOSIÇÃO)
      ========================================== */}
      {restockModalMed && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/35 backdrop-blur-xs p-0 sm:p-4">
          <form
            onSubmit={handleConfirmRestock}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-sky-100 p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-teal-700">
                  Reposição de Estoque
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {restockModalMed.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Último preço registrado:{' '}
                  <strong className="font-mono-tabular text-slate-700">
                    {formatCurrencyBRL(restockModalMed.lastPaidPrice)}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRestockModalMed(null)}
                className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-sky-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Novo Preço Pago (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={restockPriceInput}
                  onChange={(e) => setRestockPriceInput(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-sm font-mono-tabular"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unidades Adquiridas
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={restockQuantityInput}
                  onChange={(e) =>
                    setRestockQuantityInput(Number(e.target.value))
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-sm font-mono-tabular"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Validade da Nova Caixa
              </label>
              <input
                type="date"
                required
                value={restockExpiryInput}
                onChange={(e) => setRestockExpiryInput(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-sm font-mono-tabular"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
            >
              Confirmar Reposição e Atualizar Preço
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL DE LANÇAMENTO DE DOSE NO HISTÓRICO
      ========================================== */}
      {isManualDoseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/35 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-sky-100 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Lançar Dose no Prontuário
              </h3>
              <button
                onClick={() => setIsManualDoseModalOpen(false)}
                className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-sky-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medicamento
                </label>
                <select
                  value={manualDoseMedId}
                  onChange={(e) => setManualDoseMedId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-sm text-slate-800"
                >
                  {medications.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.currentStock} {m.unitLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={manualDoseDate}
                    onChange={(e) => setManualDoseDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-sm font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={manualDoseTime}
                    onChange={(e) => setManualDoseTime(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-sm font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observação Clínica (opcional)
                </label>
                <input
                  type="text"
                  value={manualDoseNotes}
                  onChange={(e) => setManualDoseNotes(e.target.value)}
                  placeholder="Ex: Administração pós-prandial"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const med = medications.find((m) => m.id === manualDoseMedId);
                if (med) {
                  handleTakeSingleDoseNow(
                    med,
                    manualDoseDate,
                    manualDoseTime,
                    manualDoseNotes.trim() || undefined
                  );
                  setManualDoseNotes('');
                  setIsManualDoseModalOpen(false);
                }
              }}
              className="w-full min-h-[46px] py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
            >
              Confirmar Registro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
