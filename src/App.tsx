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
  RotateCcw,
  FileText,
  Download,
  Sparkles,
  Info
} from 'lucide-react';
import {
  AnvisaCatalogItem,
  MedicationBula,
  DrugInteractionAlert,
  searchAnvisaCatalog,
  findCatalogMatchForMedication,
  analyzeDrugInteractions,
  sanitizeBulaForFirestore
} from './data/anvisaClinicalCatalog';

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

export const PRESET_HEX_MAP: Record<string, string> = {
  sky: '#0284c7',
  teal: '#0d9488',
  emerald: '#059669',
  cyan: '#0891b2',
  indigo: '#4f46e5',
  violet: '#7c3aed',
  amber: '#d97706',
  rose: '#e11d48'
};

export const CLINICAL_COLOR_PALETTE = [
  { hex: '#0284c7', label: 'Azul Clínico' },
  { hex: '#0d9488', label: 'Verde Hospitalar' },
  { hex: '#059669', label: 'Esmeralda Saúde' },
  { hex: '#0891b2', label: 'Ciano Sereno' },
  { hex: '#4f46e5', label: 'Índigo Controlado' },
  { hex: '#7c3aed', label: 'Lavanda' },
  { hex: '#d97706', label: 'Âmbar Suplemento' },
  { hex: '#e11d48', label: 'Coral Alívio' },
  { hex: '#ec4899', label: 'Rosa Pediátrico' },
  { hex: '#84cc16', label: 'Lima' },
  { hex: '#64748b', label: 'Ardósia Neutro' }
];

export const hexToRgba = (hex: string, alpha: number): string => {
  let clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    return `rgba(2, 132, 199, ${alpha})`;
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface CategoryColorTheme {
  key: string;
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
  colorKey: string; // Suporta tanto chaves pré-definidas quanto códigos HTML hexadecimais (#0284c7)
}

export interface PresentationOption {
  name: string; // ex: "Comprimido", "Sachê", "mL"
  unitLabel: string; // ex: "comprimidos", "sachês", "ml"
  defaultDose: string; // ex: "1 comprimido", "1 sachê", "5 ml"
}

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { name: 'Uso Contínuo', colorKey: '#0d9488' },
  { name: 'Receita Retida', colorKey: '#4f46e5' },
  { name: 'Enxaqueca', colorKey: '#7c3aed' },
  { name: 'Vitaminas', colorKey: '#059669' },
  { name: 'Dor & Febre', colorKey: '#e11d48' },
  { name: 'Gastrointestinal', colorKey: '#d97706' },
  { name: 'Respiratório & Alergia', colorKey: '#0284c7' },
  { name: 'Primeiros Socorros', colorKey: '#0891b2' }
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

const getDefaultColorForCategoryName = (name: string, index = 0): string => {
  const matched = DEFAULT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === name.trim().toLowerCase()
  );
  if (matched) return matched.colorKey;
  const key = CATEGORY_COLOR_KEYS[index % CATEGORY_COLOR_KEYS.length];
  return PRESET_HEX_MAP[key] || '#0284c7';
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
        let validColor: string = getDefaultColorForCategoryName(cleanName, idx);
        if (rawColor) {
          const trimmed = rawColor.trim();
          if (trimmed.startsWith('#') && trimmed.length >= 4 && trimmed.length <= 9) {
            validColor = trimmed;
          } else if (trimmed in PRESET_HEX_MAP) {
            validColor = PRESET_HEX_MAP[trimmed];
          } else if (CATEGORY_COLOR_KEYS.includes(trimmed as CategoryColorKey)) {
            validColor = trimmed;
          }
        }
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

export const calculateElapsedDosesFromStart = (
  startDate: string,
  startTime: string,
  scheduleTimes: string[],
  todayStr: string,
  currentTimeStr: string
): number => {
  if (!startDate || scheduleTimes.length === 0) return 0;
  if (startDate > todayStr) return 0;

  let elapsed = 0;
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(todayStr + 'T00:00:00');

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dayStr = `${year}-${month}-${day}`;

    const isStartDay = dayStr === startDate;
    const isToday = dayStr === todayStr;

    scheduleTimes.forEach((time) => {
      if (isStartDay && time < startTime) return;
      if (isToday && time > currentTimeStr) return;
      elapsed += 1;
    });

    current.setDate(current.getDate() + 1);
  }

  return elapsed;
};

const formatBoxBreakdown = (
  currentStock: number,
  boxCapacity: number,
  unitLabel: string
): string => {
  const cap = Math.max(1, Number(boxCapacity) || 1);
  const stock = Math.max(0, Number(currentStock) || 0);
  if (stock === 0) {
    return `Sem estoque · 1 caixa contém ${cap} ${unitLabel}`;
  }
  const fullBoxes = Math.floor(stock / cap);
  const looseUnits = stock % cap;
  if (fullBoxes >= 1 && looseUnits === 0) {
    return fullBoxes === 1
      ? `Equivale a 1 caixa fechada de ${cap} ${unitLabel}`
      : `Equivale a ${fullBoxes} caixas de ${cap} ${unitLabel} (${stock} no total)`;
  }
  if (fullBoxes >= 1 && looseUnits > 0) {
    return `Equivale a ${fullBoxes} ${fullBoxes === 1 ? 'caixa' : 'caixas'} de ${cap} + ${looseUnits} ${unitLabel} avulso${looseUnits === 1 ? '' : 's'}`;
  }
  return ` Caixa em uso: restam ${stock} de ${cap} ${unitLabel} (capacidade de 1 cx)`;
};

// ==========================================
// COMPONENTE DE CÍRCULO DE PROGRESSO (SVG)
// ==========================================

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  strokeColor?: string;
  trackColorClass?: string;
  label?: string;
  sublabel?: string;
}

function CircularProgress({
  percentage,
  size = 64,
  strokeWidth = 6,
  colorClass = 'text-teal-600',
  strokeColor,
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
          className={strokeColor ? 'transition-all duration-300 ease-out' : `${colorClass} transition-all duration-300 ease-out`}
          stroke={strokeColor || 'currentColor'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
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
  const [restockQuantityInput, setRestockQuantityInput] = useState<number | ''>(30);
  const [restockExpiryInput, setRestockExpiryInput] = useState<string>(getOffsetDateISO(365));

  // Estados do Gerenciador de Categorias e Apresentações (Aba 'opcoes')
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<string>('#0284c7');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [editingCategoryColor, setEditingCategoryColor] = useState<string>('#0284c7');

  const [newPresName, setNewPresName] = useState('');
  const [newPresUnit, setNewPresUnit] = useState('');
  const [newPresDefaultDose, setNewPresDefaultDose] = useState('');
  const [editingPresIndex, setEditingPresIndex] = useState<number | null>(null);
  const [editingPresName, setEditingPresName] = useState('');
  const [editingPresUnit, setEditingPresUnit] = useState('');
  const [editingPresDefaultDose, setEditingPresDefaultDose] = useState('');

  // Estados do Modal de Confirmação de Horário da Dose e Arquivamento
  const [doseToConfirm, setDoseToConfirm] = useState<{
    medication: Medication;
    scheduledTime: string;
    period: 'Manhã' | 'Tarde' | 'Noite';
  } | null>(null);
  const [confirmTakenTime, setConfirmTakenTime] = useState<string>(getCurrentTimeHHMM());
  const [confirmDoseNotes, setConfirmDoseNotes] = useState<string>('');
  const [isArchivedSectionOpen, setIsArchivedSectionOpen] = useState<boolean>(false);

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
  const [formCurrentStock, setFormCurrentStock] = useState<number | ''>(30);
  const [formBoxCapacity, setFormBoxCapacity] = useState<number | ''>(30);
  const [formMinStockAlert, setFormMinStockAlert] = useState<number | ''>(5);
  const [formExpiryDate, setFormExpiryDate] = useState<string>(getOffsetDateISO(240));
  const [formLastPaidPrice, setFormLastPaidPrice] = useState<number | ''>(35.0);
  const [formIsActiveTreatment, setFormIsActiveTreatment] = useState<boolean>(false);
  const [formIntervalHours, setFormIntervalHours] = useState<number | ''>('');
  const [formScheduleTimes, setFormScheduleTimes] = useState<string[]>([]);
  const [formNewTimeInput, setFormNewTimeInput] = useState<string>('');
  const [formDoseAmount, setFormDoseAmount] = useState<number | ''>(1);
  const [formDoseDisplay, setFormDoseDisplay] = useState<string>('1 comprimido');
  const [formIsContinuous, setFormIsContinuous] = useState<boolean>(true);
  const [formTreatmentStartDate, setFormTreatmentStartDate] = useState<string>(getTodayISO());
  const [formTreatmentStartTime, setFormTreatmentStartTime] = useState<string>('08:00');
  const [formTreatmentDays, setFormTreatmentDays] = useState<number | ''>(7);

  // Calcula automaticamente os melhores horários do dia a partir do intervalo em horas e do 1º horário
  const generateScheduleTimesByInterval = (
    intervalHours: number,
    baseStartTime?: string
  ): string[] => {
    const cleanInterval = Math.max(1, Math.min(24, Math.round(intervalHours)));
    const defaultStartByInterval: Record<number, string> = {
      24: '08:00',
      12: '08:00',
      8: '07:00',
      6: '06:00',
      4: '06:00'
    };
    const startStr =
      baseStartTime && /^\d{2}:\d{2}$/.test(baseStartTime)
        ? baseStartTime
        : defaultStartByInterval[cleanInterval] || '08:00';

    const [startH, startM] = startStr.split(':').map(Number);
    const baseMinutes = (startH || 0) * 60 + (startM || 0);
    const stepMinutes = cleanInterval * 60;
    const dosesPerDay = Math.max(1, Math.floor((24 * 60) / stepMinutes));

    const times: string[] = [];
    for (let i = 0; i < dosesPerDay; i++) {
      const totalMins = (baseMinutes + i * stepMinutes) % (24 * 60);
      const hh = String(Math.floor(totalMins / 60)).padStart(2, '0');
      const mm = String(totalMins % 60).padStart(2, '0');
      const formatted = `${hh}:${mm}`;
      if (!times.includes(formatted)) {
        times.push(formatted);
      }
    }
    return times.sort();
  };

  // Estados de Autocompletar ANVISA, Bulas Salvas na Biblioteca e Interações Medicamentosas
  const [savedBulas, setSavedBulas] = useState<Record<string, MedicationBula>>({});
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState<boolean>(false);
  const [remoteSearchSuggestions, setRemoteSearchSuggestions] = useState<AnvisaCatalogItem[]>([]);
  const [isSearchingRemoteCatalog, setIsSearchingRemoteCatalog] = useState<boolean>(false);
  const [pendingBulaDraft, setPendingBulaDraft] = useState<Partial<MedicationBula> | null>(null);
  const [formShouldSaveBula, setFormShouldSaveBula] = useState<boolean>(true);
  const [isDownloadingBula, setIsDownloadingBula] = useState<boolean>(false);
  const [aiDetectedInteractions, setAiDetectedInteractions] = useState<DrugInteractionAlert[]>([]);
  const [bulaViewerModal, setBulaViewerModal] = useState<{
    med: Medication;
    bula: MedicationBula;
  } | null>(null);
  const [downloadingBulaMedId, setDownloadingBulaMedId] = useState<string | null>(null);
  const [bulaModalTab, setBulaModalTab] = useState<'guia' | 'bula' | 'interacoes'>('guia');

  // Utilitário para obter o tema visual da categoria de um medicamento (suporta cores HTML # e pré-definidas)
  const getCategoryTheme = (categoryName: string) => {
    const matched = categoriesList.find(
      (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
    );
    const colorVal = matched
      ? matched.colorKey
      : getDefaultColorForCategoryName(categoryName || '');

    let hex = '#0284c7';
    if (colorVal.startsWith('#')) {
      hex = colorVal;
    } else if (PRESET_HEX_MAP[colorVal]) {
      hex = PRESET_HEX_MAP[colorVal];
    }

    const presetKey = (colorVal in CATEGORY_COLOR_THEMES)
      ? (colorVal as CategoryColorKey)
      : 'sky';
    const baseTheme =
      CATEGORY_COLOR_THEMES[presetKey] || CATEGORY_COLOR_THEMES.sky;

    return {
      ...baseTheme,
      hex,
      cardStyle: {
        backgroundColor: hexToRgba(hex, 0.05),
        borderColor: hexToRgba(hex, 0.28),
        borderLeft: `4px solid ${hex}`
      },
      badgeStyle: {
        backgroundColor: hexToRgba(hex, 0.12),
        color: hex,
        borderColor: hexToRgba(hex, 0.3)
      },
      swatchStyle: {
        backgroundColor: hex
      }
    };
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
        setSavedBulas({});
        setCategoriesList(DEFAULT_CATEGORIES);
        setPresentationsList(DEFAULT_PRESENTATIONS);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sincronizar medicamentos, histórico, bulas e configurações de catálogo do usuário no Cloud Firestore
  useEffect(() => {
    if (!authReady || !currentUser) return;

    setIsLoadingData(true);
    setDbError(null);

    const medsPath = `users/${currentUser.uid}/medications`;
    const logsPath = `users/${currentUser.uid}/doseLogs`;
    const bulasPath = `users/${currentUser.uid}/bulas`;
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

    const unsubBulas = onSnapshot(
      collection(db, bulasPath),
      (snapshot) => {
        const map: Record<string, MedicationBula> = {};
        snapshot.forEach((docSnap) => {
          const bulaData = docSnap.data() as MedicationBula;
          map[bulaData.medicationId || docSnap.id] = bulaData;
        });
        setSavedBulas(map);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, bulasPath);
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
      unsubBulas();
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

  // Alterar rapidamente apenas a cor de uma categoria existente (código HTML # ou preset)
  const handleQuickChangeCategoryColor = async (
    index: number,
    colorKey: string
  ) => {
    const updatedCategories = categoriesList.map((c, idx) =>
      idx === index ? { ...c, colorKey } : c
    );
    setCategoriesList(updatedCategories);
    await saveCatalogSettingsToFirestore(updatedCategories, presentationsList);
    showToast(
      `Cor da categoria "${categoriesList[index].name}" atualizada para ${colorKey}.`,
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

  const handleOpenConfirmDoseModal = (
    med: Medication,
    scheduledTime: string,
    period: 'Manhã' | 'Tarde' | 'Noite'
  ) => {
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
        `Atenção: Estoque insuficiente para administrar ${med.name}.`,
        'warning'
      );
      return;
    }

    setDoseToConfirm({
      medication: med,
      scheduledTime,
      period
    });
    setConfirmTakenTime(getCurrentTimeHHMM());
    setConfirmDoseNotes('');
  };

  const handleExecuteConfirmDose = async () => {
    if (!currentUser || !doseToConfirm) return;
    const med = doseToConfirm.medication;
    const scheduledTime = doseToConfirm.scheduledTime;
    const takenTimeVal = confirmTakenTime.trim() || getCurrentTimeHHMM();

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
      takenTime: takenTimeVal,
      status: 'no_horario',
      notes: confirmDoseNotes.trim() || 'Dose programada confirmada'
    };

    const medRef = doc(db, `users/${currentUser.uid}/medications`, med.id);

    try {
      await setDoc(doc(db, `users/${currentUser.uid}/doseLogs`, logId), newLog);
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
        `Dose de ${med.name} confirmada às ${takenTimeVal} e arquivada (-${med.doseAmount} ${med.unitLabel}).`,
        'success'
      );
      setDoseToConfirm(null);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `users/${currentUser.uid}/doseLogs`
      );
      showToast('Erro ao confirmar dose no Firestore.', 'danger');
    }
  };

  const handleUndoDose = async (
    med: Medication,
    scheduledTime: string,
    existingLog: DoseLog
  ) => {
    if (!currentUser) return;
    const medRef = doc(db, `users/${currentUser.uid}/medications`, med.id);
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
        `Dose das ${scheduledTime} desmarcada e retornada para a lista do dia.`,
        'warning'
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `users/${currentUser.uid}/doseLogs`
      );
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
          boxCapacity: Math.max(1, med.boxCapacity)
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
          boxCapacity: Math.max(1, restockModalMed.boxCapacity),
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
    setFormIntervalHours('');
    setFormScheduleTimes([]);
    setFormNewTimeInput('');
    setFormDoseAmount(1);
    setFormDoseDisplay(defaultPres.defaultDose);
    setFormIsContinuous(true);
    setFormTreatmentStartDate(getTodayISO());
    setFormTreatmentStartTime('08:00');
    setFormTreatmentDays(7);
    setPendingBulaDraft(null);
    setFormShouldSaveBula(true);
    setAiDetectedInteractions([]);
    setIsAutocompleteOpen(false);
  };

  // Busca remota complementar na API quando o usuário digita 2+ caracteres
  useEffect(() => {
    const trimmed = formName.trim();
    if (!isAutocompleteOpen || trimmed.length < 2) {
      setRemoteSearchSuggestions([]);
      setIsSearchingRemoteCatalog(false);
      return;
    }

    const localResults = searchAnvisaCatalog(trimmed);
    if (localResults.length >= 10) {
      setRemoteSearchSuggestions([]);
      setIsSearchingRemoteCatalog(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingRemoteCatalog(true);
      try {
        const res = await fetch(
          `/api/medications/search?q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestions)) {
            const mapped: AnvisaCatalogItem[] = data.suggestions.map(
              (s: Record<string, unknown>, idx: number) => ({
                id: `remote-${idx}-${Date.now()}`,
                name: String(s.name || trimmed),
                brandAliases: Array.isArray(s.brandAliases)
                  ? s.brandAliases.map(String)
                  : [],
                activeIngredient: String(s.activeIngredient || trimmed),
                therapeuticClass: String(
                  s.therapeuticClass || 'Medicamento Registrado'
                ),
                category: String(s.category || 'Uso Contínuo'),
                formType: String(s.formType || 'Comprimido'),
                unitLabel: String(s.unitLabel || 'comprimidos'),
                defaultBoxCapacity: Number(s.defaultBoxCapacity) || 30,
                defaultDoseAmount: Number(s.defaultDoseAmount) || 1,
                defaultDoseDisplay: `${Number(s.defaultDoseAmount) || 1} ${String(s.formType || 'comprimido').toLowerCase()}`,
                defaultFrequencyLabel: String(
                  s.defaultFrequencyLabel || '1x ao dia'
                ),
                isContinuous: Boolean(s.isContinuous),
                defaultTreatmentDays: Number(s.defaultTreatmentDays) || 7,
                controlled: (s.controlled as ControlledType) || 'Venda Livre / Simples',
                purpose: String(s.purpose || ''),
                dosageInstruction: String(s.dosageInstruction || ''),
                clinicalTags: [],
                recommendedTimes: Array.isArray(s.recommendedTimes)
                  ? s.recommendedTimes.map(String)
                  : ['08:00'],
                bestTimeGuidance: String(
                  s.bestTimeGuidance ||
                    'Inicie preferencialmente pela manhã ou conforme orientação médica.'
                ),
                administrationTips: String(
                  s.administrationTips ||
                    'Ingerir com água respeitando os intervalos entre as doses.'
                ),
                bula: {
                  indications: String(s.purpose || ''),
                  howItWorks: 'Atua conforme mecanismo farmacológico específico do princípio ativo.',
                  contraindications: 'Alergia aos componentes da fórmula.',
                  warnings: 'Utilize conforme orientação médica.',
                  interactionsSummary: 'Consulte a análise de interações clínicas.',
                  posologyGuidance: String(s.dosageInstruction || ''),
                  missedDoseGuidance: 'Tome assim que lembrar, sem dobrar a dose.',
                  adverseReactions: 'Comunique ao médico qualquer sintoma inesperado.',
                  storageAdvice: 'Conservar entre 15°C e 30°C.',
                  interactingSubstances: []
                }
              })
            );
            setRemoteSearchSuggestions(mapped);
          }
        }
      } catch {
        // Ignorar falha de rede silenciosamente, mantendo o catálogo local
      } finally {
        setIsSearchingRemoteCatalog(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formName, isAutocompleteOpen]);

  // Sugestões combinadas (Catálogo Oficial ANVISA local + sugestões remotas da API)
  const combinedAutocompleteSuggestions = useMemo(() => {
    const local = searchAnvisaCatalog(formName);
    const localNames = new Set(local.map((i) => i.name.toLowerCase()));
    const remoteFiltered = remoteSearchSuggestions.filter(
      (r) => !localNames.has(r.name.toLowerCase())
    );
    return [...local, ...remoteFiltered].slice(0, 12);
  }, [formName, remoteSearchSuggestions]);

  // Baixar Bula Completa + Analisar Interações e Melhor Horário via API (com fallback instantâneo ANVISA)
  const handleFetchBulaAndAnalyzeInteractions = async (
    targetName?: string,
    targetActiveIngredient?: string,
    catalogPreset?: AnvisaCatalogItem
  ) => {
    const medName = (targetName ?? formName).trim();
    const activeIng = (targetActiveIngredient ?? formActiveIngredient).trim();
    if (!medName) {
      showToast(
        'Atenção: Digite o nome do medicamento para buscar a bula.',
        'warning'
      );
      return;
    }

    setIsDownloadingBula(true);
    const matchedCatalog =
      catalogPreset || findCatalogMatchForMedication(medName, activeIng);

    // Se houver correspondência imediata no catálogo ANVISA, já prepara a bula imediatamente
    if (matchedCatalog) {
      setPendingBulaDraft({
        medicationName: matchedCatalog.name,
        activeIngredient: matchedCatalog.activeIngredient,
        therapeuticClass: matchedCatalog.therapeuticClass,
        indications: matchedCatalog.bula.indications,
        howItWorks: matchedCatalog.bula.howItWorks,
        contraindications: matchedCatalog.bula.contraindications,
        warnings: matchedCatalog.bula.warnings,
        interactionsSummary: matchedCatalog.bula.interactionsSummary,
        posologyGuidance: matchedCatalog.bula.posologyGuidance,
        bestTimeGuidance: matchedCatalog.bestTimeGuidance,
        recommendedTimes: matchedCatalog.recommendedTimes,
        administrationTips: matchedCatalog.administrationTips,
        missedDoseGuidance: matchedCatalog.bula.missedDoseGuidance,
        adverseReactions: matchedCatalog.bula.adverseReactions,
        storageAdvice: matchedCatalog.bula.storageAdvice,
        interactingSubstances: matchedCatalog.bula.interactingSubstances,
        sourceApi: 'Bulário Clínico ANVISA (Base Oficial)',
        downloadedAt: new Date().toISOString().slice(0, 19)
      });
    }

    try {
      const otherMeds = medications
        .filter((m) => !editingMedId || m.id !== editingMedId)
        .map((m) => ({
          id: m.id,
          name: m.name,
          activeIngredient: m.activeIngredient,
          scheduleTimes: m.scheduleTimes
        }));

      const res = await fetch('/api/medications/bula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationName: medName,
          activeIngredient: activeIng || matchedCatalog?.activeIngredient || '',
          existingMedications: otherMeds
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPendingBulaDraft({
          medicationName: data.medicationName || medName,
          activeIngredient:
            data.activeIngredient ||
            activeIng ||
            matchedCatalog?.activeIngredient ||
            medName,
          therapeuticClass:
            data.therapeuticClass ||
            matchedCatalog?.therapeuticClass ||
            'Uso Clínico',
          indications:
            data.indications || matchedCatalog?.bula.indications || '',
          howItWorks: data.howItWorks || matchedCatalog?.bula.howItWorks || '',
          contraindications:
            data.contraindications ||
            matchedCatalog?.bula.contraindications ||
            '',
          warnings: data.warnings || matchedCatalog?.bula.warnings || '',
          interactionsSummary:
            data.interactionsSummary ||
            matchedCatalog?.bula.interactionsSummary ||
            '',
          posologyGuidance:
            data.posologyGuidance ||
            matchedCatalog?.bula.posologyGuidance ||
            '',
          bestTimeGuidance:
            data.bestTimeGuidance || matchedCatalog?.bestTimeGuidance || '',
          recommendedTimes:
            Array.isArray(data.recommendedTimes) &&
            data.recommendedTimes.length > 0
              ? data.recommendedTimes
              : matchedCatalog?.recommendedTimes || ['08:00'],
          administrationTips:
            data.administrationTips || matchedCatalog?.administrationTips || '',
          missedDoseGuidance:
            data.missedDoseGuidance ||
            matchedCatalog?.bula.missedDoseGuidance ||
            '',
          adverseReactions:
            data.adverseReactions ||
            matchedCatalog?.bula.adverseReactions ||
            '',
          storageAdvice:
            data.storageAdvice || matchedCatalog?.bula.storageAdvice || '',
          interactingSubstances: Array.isArray(data.interactingSubstances)
            ? data.interactingSubstances
            : matchedCatalog?.bula.interactingSubstances || [],
          sourceApi:
            data.sourceApi || 'API Bulário ANVISA & Farmacologia Clínica',
          downloadedAt: new Date().toISOString().slice(0, 19)
        });

        // Preencher campos clínicos vazios caso o usuário tenha apenas digitado o nome
        if (!activeIng && data.activeIngredient) {
          setFormActiveIngredient(String(data.activeIngredient));
        }
        if (!formPurpose.trim() && (data.purpose || data.indications)) {
          setFormPurpose(String(data.purpose || data.indications).slice(0, 480));
        }
        if (
          !formDosageInstruction.trim() &&
          (data.dosageInstruction || data.posologyGuidance)
        ) {
          setFormDosageInstruction(
            String(data.dosageInstruction || data.posologyGuidance).slice(0, 480)
          );
        }

        if (Array.isArray(data.detectedInteractions)) {
          const mappedAlerts: DrugInteractionAlert[] =
            data.detectedInteractions.map(
              (
                inter: {
                  existingMedId?: string;
                  existingMedName?: string;
                  existingMedActiveIngredient?: string;
                  severity?: string;
                  severityLabel?: string;
                  efficacyImpact?: string;
                  clinicalMechanism?: string;
                  recommendation?: string;
                },
                i: number
              ) => ({
                id: `ai-inter-${i}-${Date.now()}`,
                severity:
                  inter.severity === 'alta' || inter.severity === 'horario'
                    ? inter.severity
                    : 'moderada',
                severityLabel:
                  inter.severityLabel || 'Interação Farmacológica Detectada',
                newMedName: medName,
                newMedActiveIngredient:
                  data.activeIngredient || activeIng || medName,
                existingMedId: inter.existingMedId || '',
                existingMedName: inter.existingMedName || 'Medicamento em uso',
                existingMedActiveIngredient:
                  inter.existingMedActiveIngredient || '',
                efficacyImpact: inter.efficacyImpact || '',
                clinicalMechanism: inter.clinicalMechanism || '',
                recommendation: inter.recommendation || ''
              })
            );
          setAiDetectedInteractions(mappedAlerts);
        }

        showToast(
          `Bula de "${medName}" pronta!`,
          'success'
        );
      } else if (matchedCatalog) {
        showToast(
          `Bula de "${matchedCatalog.name}" carregada!`,
          'success'
        );
      }
    } catch {
      if (matchedCatalog) {
        showToast(
          `Bula de "${matchedCatalog.name}" carregada!`,
          'success'
        );
      }
    } finally {
      setIsDownloadingBula(false);
    }
  };

  // Ao selecionar um medicamento verdadeiro na barra de sugestões (Autocompletar)
  const handleSelectAnvisaSuggestion = (item: AnvisaCatalogItem) => {
    setFormName(item.name);
    setFormActiveIngredient(item.activeIngredient);
    setFormPurpose(item.purpose);

    // Verificar se a categoria existe na lista do usuário; caso contrário usar a mais próxima
    const hasCat = categoriesList.some(
      (c) => c.name.toLowerCase() === item.category.toLowerCase()
    );
    if (hasCat) {
      setFormCategory(item.category);
    }

    // Verificar apresentação
    const hasPres = presentationsList.some(
      (p) => p.name.toLowerCase() === item.formType.toLowerCase()
    );
    if (hasPres) {
      setFormType(item.formType);
    }

    setFormControlled(item.controlled);
    setFormBoxCapacity(item.defaultBoxCapacity);
    setFormCurrentStock(item.defaultBoxCapacity);
    setFormDoseAmount(item.defaultDoseAmount);
    setFormDoseDisplay(item.defaultDoseDisplay);
    setFormDosageInstruction(item.dosageInstruction);
    setFormIsContinuous(item.isContinuous);
    setFormTreatmentDays(item.defaultTreatmentDays);
    setFormSelectedTags(
      item.clinicalTags.filter((t) => STANDARD_CLINICAL_TAGS.includes(t))
    );

    // Pré-preencher os melhores horários recomendados para começar a tomar e intervalo
    if (item.recommendedTimes && item.recommendedTimes.length > 0) {
      setFormIsActiveTreatment(true);
      setFormScheduleTimes([...item.recommendedTimes].sort());
      setFormTreatmentStartTime(item.recommendedTimes[0]);
      const count = item.recommendedTimes.length;
      if (count === 1) setFormIntervalHours(24);
      else if (count === 2) setFormIntervalHours(12);
      else if (count === 3) setFormIntervalHours(8);
      else if (count === 4) setFormIntervalHours(6);
      else setFormIntervalHours(Math.max(1, Math.round(24 / count)));
    }

    setIsAutocompleteOpen(false);
    setFormShouldSaveBula(true);
    setAiDetectedInteractions([]);

    // Baixar bula e analisar interações com os remédios que o usuário já toma
    handleFetchBulaAndAnalyzeInteractions(
      item.name,
      item.activeIngredient,
      item
    );
  };

  // Alertas de Interação Medicamentosa em tempo real no Formulário (compara o remédio sendo lançado com os que o paciente já toma)
  const currentFormInteractions = useMemo(() => {
    const localAlerts = analyzeDrugInteractions(
      {
        id: editingMedId || undefined,
        name: formName,
        activeIngredient: formActiveIngredient,
        interactingSubstances: pendingBulaDraft?.interactingSubstances
      },
      medications
    );

    const existingNames = new Set(
      localAlerts.map((a) => a.existingMedName.toLowerCase())
    );
    const extraAi = aiDetectedInteractions.filter(
      (a) => !existingNames.has(a.existingMedName.toLowerCase())
    );

    return [...localAlerts, ...extraAi];
  }, [
    editingMedId,
    formName,
    formActiveIngredient,
    pendingBulaDraft,
    medications,
    aiDetectedInteractions
  ]);

  // Orientação de Melhor Horário para Começar a Tomar & Como Administrar no Formulário
  const currentFormGuidance = useMemo(() => {
    const catalogMatch = findCatalogMatchForMedication(
      formName,
      formActiveIngredient
    );
    const bestTimeGuidance =
      pendingBulaDraft?.bestTimeGuidance || catalogMatch?.bestTimeGuidance || '';
    const recommendedTimes =
      (pendingBulaDraft?.recommendedTimes &&
      pendingBulaDraft.recommendedTimes.length > 0
        ? pendingBulaDraft.recommendedTimes
        : catalogMatch?.recommendedTimes) || [];
    const administrationTips =
      pendingBulaDraft?.administrationTips ||
      catalogMatch?.administrationTips ||
      '';
    const therapeuticClass =
      pendingBulaDraft?.therapeuticClass || catalogMatch?.therapeuticClass || '';

    if (!bestTimeGuidance && !administrationTips) return null;
    return {
      bestTimeGuidance,
      recommendedTimes,
      administrationTips,
      therapeuticClass,
      hasReadyBula: Boolean(pendingBulaDraft || catalogMatch)
    };
  }, [formName, formActiveIngredient, pendingBulaDraft]);

  // Aplica o intervalo "de quantas em quantas horas" calculando os melhores horários automaticamente
  const applyIntervalSchedule = (
    intervalValue: number | '',
    customBaseTime?: string
  ) => {
    setFormIntervalHours(intervalValue);
    if (intervalValue === '' || Number(intervalValue) <= 0) return;
    const hrs = Math.max(1, Math.min(24, Number(intervalValue)));
    const recommendedFirst =
      customBaseTime ||
      currentFormGuidance?.recommendedTimes?.[0] ||
      formScheduleTimes[0] ||
      (hrs === 8 ? '07:00' : hrs <= 6 ? '06:00' : '08:00');
    const generated = generateScheduleTimesByInterval(hrs, recommendedFirst);
    setFormIsActiveTreatment(true);
    setFormScheduleTimes(generated);
    setFormTreatmentStartTime(recommendedFirst);
  };

  // Painel Geral de Interações entre os medicamentos já cadastrados pelo usuário
  const libraryWideInteractions = useMemo(() => {
    const pairMap = new Map<string, DrugInteractionAlert>();
    medications.forEach((med) => {
      const bula = savedBulas[med.id];
      const alerts = analyzeDrugInteractions(
        {
          id: med.id,
          name: med.name,
          activeIngredient: med.activeIngredient,
          interactingSubstances: bula?.interactingSubstances
        },
        medications
      );
      alerts.forEach((alert) => {
        const pairKey = [med.id, alert.existingMedId].sort().join('--');
        if (!pairMap.has(pairKey)) {
          pairMap.set(pairKey, alert);
        }
      });
    });
    return Array.from(pairMap.values());
  }, [medications, savedBulas]);

  // Baixar e guardar a bula diretamente de um card da Biblioteca (para remédios antigos ou atualizar bula)
  const handleDownloadBulaForLibraryMed = async (
    med: Medication,
    openModalAfter = true
  ) => {
    if (!currentUser) return;
    setDownloadingBulaMedId(med.id);

    const catalogMatch = findCatalogMatchForMedication(
      med.name,
      med.activeIngredient
    );
    let rawBula: Partial<MedicationBula> = catalogMatch
      ? {
          medicationName: med.name,
          activeIngredient:
            med.activeIngredient || catalogMatch.activeIngredient,
          therapeuticClass: catalogMatch.therapeuticClass,
          indications: catalogMatch.bula.indications,
          howItWorks: catalogMatch.bula.howItWorks,
          contraindications: catalogMatch.bula.contraindications,
          warnings: catalogMatch.bula.warnings,
          interactionsSummary: catalogMatch.bula.interactionsSummary,
          posologyGuidance: catalogMatch.bula.posologyGuidance,
          bestTimeGuidance: catalogMatch.bestTimeGuidance,
          recommendedTimes: catalogMatch.recommendedTimes,
          administrationTips: catalogMatch.administrationTips,
          missedDoseGuidance: catalogMatch.bula.missedDoseGuidance,
          adverseReactions: catalogMatch.bula.adverseReactions,
          storageAdvice: catalogMatch.bula.storageAdvice,
          interactingSubstances: catalogMatch.bula.interactingSubstances,
          sourceApi: 'Bulário Clínico ANVISA (Base Oficial)',
          downloadedAt: new Date().toISOString().slice(0, 19)
        }
      : {};

    try {
      const otherMeds = medications
        .filter((m) => m.id !== med.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          activeIngredient: m.activeIngredient,
          scheduleTimes: m.scheduleTimes
        }));

      const res = await fetch('/api/medications/bula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationName: med.name,
          activeIngredient: med.activeIngredient,
          existingMedications: otherMeds
        })
      });

      if (res.ok) {
        const apiData = await res.json();
        rawBula = {
          ...rawBula,
          ...apiData,
          downloadedAt: new Date().toISOString().slice(0, 19)
        };
      }
    } catch {
      // Usa fallback local ANVISA
    }

    const sanitized = sanitizeBulaForFirestore(
      rawBula,
      currentUser.uid,
      med.id,
      med.name,
      med.activeIngredient
    );

    try {
      await setDoc(
        doc(db, `users/${currentUser.uid}/bulas`, med.id),
        sanitized
      );
      showToast(
        `Bula de "${med.name}" baixada e guardada na Biblioteca!`,
        'success'
      );
      if (openModalAfter) {
        setBulaModalTab('guia');
        setBulaViewerModal({ med, bula: sanitized });
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `users/${currentUser.uid}/bulas/${med.id}`
      );
    } finally {
      setDownloadingBulaMedId(null);
    }
  };

  // Remover a bula salva de um medicamento na Biblioteca (/users/{uid}/bulas/{med.id})
  const handleRemoveBulaForMedication = async (med: Medication) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/bulas`, med.id));
      if (bulaViewerModal?.med.id === med.id) {
        setBulaViewerModal(null);
      }
      showToast(
        `Bula de "${med.name}" removida da Biblioteca.`,
        'warning'
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `users/${currentUser.uid}/bulas/${med.id}`
      );
      showToast('Erro ao remover a bula.', 'danger');
    }
  };

  // Exportar / fazer download do arquivo da bula (.TXT formatado) para o dispositivo do usuário
  const handleExportBulaFile = (bula: MedicationBula) => {
    const content = [
      '====================================================================',
      `BULA DIGITAL DO PACIENTE & GUIA FARMACÊUTICO — MEDCUIDA`,
      '====================================================================',
      `MEDICAMENTO: ${bula.medicationName}`,
      `PRINCÍPIO ATIVO: ${bula.activeIngredient}`,
      `CLASSE TERAPÊUTICA: ${bula.therapeuticClass}`,
      `FONTE: ${bula.sourceApi} | Baixada em: ${bula.downloadedAt.replace('T', ' ')}`,
      '--------------------------------------------------------------------',
      '',
      '>>> MELHOR HORÁRIO PARA COMEÇAR A TOMAR & CRONOTERAPIA:',
      `Horários Recomendados: ${bula.recommendedTimes.join(', ')}`,
      `${bula.bestTimeGuidance}`,
      '',
      '>>> COMO ADMINISTRAR CORRETAMENTE:',
      `${bula.administrationTips}`,
      '',
      '--------------------------------------------------------------------',
      '1. PARA QUE ESTE MEDICAMENTO É INDICADO?',
      `${bula.indications}`,
      '',
      '2. COMO ESTE MEDICAMENTO FUNCIONA?',
      `${bula.howItWorks}`,
      '',
      '3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO? (CONTRAINDICAÇÕES)',
      `${bula.contraindications}`,
      '',
      '4. O QUE DEVO SABER ANTES DE USAR? (ADVERTÊNCIAS E PRECAUÇÕES)',
      `${bula.warnings}`,
      '',
      '5. INTERAÇÕES MEDICAMENTOSAS E ALIMENTARES:',
      `${bula.interactionsSummary}`,
      `Substâncias de atenção: ${bula.interactingSubstances.join(', ') || 'Nenhuma específica listada'}`,
      '',
      '6. COMO DEVO USAR ESTE MEDICAMENTO? (POSOLOGIA)',
      `${bula.posologyGuidance}`,
      '',
      '7. O QUE FAZER QUANDO ESQUECER DE TOMAR UMA DOSE?',
      `${bula.missedDoseGuidance}`,
      '',
      '8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE CAUSAR? (REAÇÕES ADVERSAS)',
      `${bula.adverseReactions}`,
      '',
      '9. ONDE, COMO E POR QUANTO TEMPO POSSO GUARDAR?',
      `${bula.storageAdvice}`,
      '===================================================================='
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bula_${bula.medicationName.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Arquivo da bula de "${bula.medicationName}" baixado no dispositivo!`, 'success');
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
    if (med.scheduleTimes.length === 1) setFormIntervalHours(24);
    else if (med.scheduleTimes.length === 2) setFormIntervalHours(12);
    else if (med.scheduleTimes.length === 3) setFormIntervalHours(8);
    else if (med.scheduleTimes.length === 4) setFormIntervalHours(6);
    else if (med.scheduleTimes.length > 4)
      setFormIntervalHours(Math.max(1, Math.round(24 / med.scheduleTimes.length)));
    else setFormIntervalHours('');
    setFormNewTimeInput('');
    setFormDoseAmount(med.doseAmount);
    setFormDoseDisplay(med.doseDisplay);
    setFormIsContinuous(med.isContinuous);
    const [savedStartDate, savedStartTime] = (med.treatmentStartDate || '').split('T');
    setFormTreatmentStartDate(savedStartDate || getTodayISO());
    setFormTreatmentStartTime(savedStartTime || med.scheduleTimes[0] || '08:00');
    setFormTreatmentDays(med.treatmentTotalDays || 7);
    setPendingBulaDraft(savedBulas[med.id] || null);
    setFormShouldSaveBula(Boolean(savedBulas[med.id]));
    setAiDetectedInteractions([]);
    setIsAutocompleteOpen(false);
    setSelectedMedDetail(null);
    setActiveTab('novo');
  };

  const handleConfirmDeleteMedication = async () => {
    if (!medToDelete || !currentUser) return;
    try {
      await deleteDoc(
        doc(db, `users/${currentUser.uid}/medications`, medToDelete.id)
      );
      if (savedBulas[medToDelete.id]) {
        await deleteDoc(
          doc(db, `users/${currentUser.uid}/bulas`, medToDelete.id)
        );
      }
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
    const totalDays = formIsContinuous ? 30 : Math.max(1, Number(formTreatmentDays) || 7);
    const targetTotalDoses = dosesPerDay * totalDays;

    const chosenStartDate = formTreatmentStartDate || getTodayISO();
    const chosenStartTime = formTreatmentStartTime || (effectiveScheduleTimes[0] || '08:00');

    // Calcular doses decorridas desde a data e hora de início até o momento atual
    const elapsedDosesCount = formIsActiveTreatment && effectiveScheduleTimes.length > 0
      ? calculateElapsedDosesFromStart(
          chosenStartDate,
          chosenStartTime,
          effectiveScheduleTimes,
          todayISO,
          getCurrentTimeHHMM()
        )
      : 0;

    const existingMed = editingMedId
      ? medications.find((m) => m.id === editingMedId)
      : undefined;

    const startDateTimeString = `${chosenStartDate}T${chosenStartTime}`;
    const isNewOrStartChanged =
      !existingMed ||
      existingMed.treatmentStartDate !== startDateTimeString ||
      JSON.stringify(existingMed.scheduleTimes) !== JSON.stringify(effectiveScheduleTimes);

    const doseAmountNum = Math.max(1, Number(formDoseAmount) || 1);
    const inputStockNum = Number(formCurrentStock) || 0;

    // Descontar os remédios decorridos até o dia e horário atual se o tratamento foi iniciado anteriormente
    const resolvedCurrentStock = isNewOrStartChanged && elapsedDosesCount > 0
      ? Math.max(0, inputStockNum - (elapsedDosesCount * doseAmountNum))
      : inputStockNum;

    const resolvedCompletedDosesCount = isNewOrStartChanged && elapsedDosesCount > 0
      ? Math.min(targetTotalDoses, elapsedDosesCount)
      : (existingMed ? existingMed.completedDosesCount : 0);

    const intervalNum = Number(formIntervalHours) || (effectiveScheduleTimes.length > 0 ? Math.round(24 / effectiveScheduleTimes.length) : 0);
    const intervalPrefix = intervalNum === 24
      ? '1x ao dia'
      : intervalNum > 0
      ? `De ${intervalNum} em ${intervalNum}h`
      : `${effectiveScheduleTimes.length}x ao dia`;

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
          ? `Administrar ${formDoseDisplay} (${intervalPrefix}) nos horários: ${effectiveScheduleTimes.join(', ')}.`
          : `Administrar ${formDoseDisplay} conforme orientação clínica.`)
      ).slice(0, 500),
      controlled:
        formCategory === 'Receita Retida' &&
        formControlled === 'Venda Livre / Simples'
          ? 'Receita Retida (Branca C1/Antibiótico)'
          : formControlled,
      currentStock: resolvedCurrentStock,
      boxCapacity: Math.max(1, Number(formBoxCapacity) || 20),
      minStockAlert: Number(formMinStockAlert) || 5,
      expiryDate: formExpiryDate || getOffsetDateISO(180),
      lastPaidPrice: Number(formLastPaidPrice) || 0,
      isActiveTreatment: formIsActiveTreatment,
      scheduleTimes: effectiveScheduleTimes.slice(0, 24),
      doseAmount: doseAmountNum,
      doseDisplay: (
        formDoseDisplay.trim() ||
        matchedPres?.defaultDose ||
        `1 ${formType.toLowerCase()}`
      ).slice(0, 80),
      frequencyLabel: formIsActiveTreatment
        ? formIsContinuous
          ? `${intervalPrefix} · Contínuo`
          : `${intervalPrefix} · ${totalDays} dias`
        : 'Sob demanda',
      isContinuous: formIsContinuous,
      treatmentStartDate: startDateTimeString.slice(0, 20),
      treatmentTotalDays: totalDays,
      completedDosesCount: resolvedCompletedDosesCount,
      targetTotalDoses
    };

    // Gerar registros no histórico para as doses retroativas calculadas
    if (isNewOrStartChanged && elapsedDosesCount > 0) {
      try {
        const batch = writeBatch(db);
        let logCounter = 0;
        const curDate = new Date(chosenStartDate + 'T00:00:00');
        const endDate = new Date(todayISO + 'T00:00:00');

        while (curDate <= endDate && logCounter < 30) {
          const y = curDate.getFullYear();
          const m = String(curDate.getMonth() + 1).padStart(2, '0');
          const d = String(curDate.getDate()).padStart(2, '0');
          const dayStr = `${y}-${m}-${d}`;
          const isStartDay = dayStr === chosenStartDate;
          const isToday = dayStr === todayISO;

          for (const time of effectiveScheduleTimes) {
            if (isStartDay && time < chosenStartTime) continue;
            if (isToday && time > getCurrentTimeHHMM()) continue;

            const pastLogId = `log-retro-${medId}-${dayStr}-${time.replace(':', '')}`;
            batch.set(doc(db, `users/${currentUser.uid}/doseLogs`, pastLogId), {
              id: pastLogId,
              userId: currentUser.uid,
              medicationId: medId,
              medicationName: formName.trim().slice(0, 160),
              purpose: formPurpose.trim().slice(0, 300),
              doseDisplay: (formDoseDisplay.trim() || matchedPres?.defaultDose || '1 unidade').slice(0, 80),
              doseAmount: doseAmountNum,
              date: dayStr,
              scheduledTime: time,
              takenTime: time,
              status: 'no_horario',
              notes: 'Dose decorrida calculada pelo início retroativo do tratamento'
            });
            logCounter++;
            if (logCounter >= 30) break;
          }
          curDate.setDate(curDate.getDate() + 1);
        }
        if (logCounter > 0) {
          await batch.commit();
        }
      } catch {
        // Non-fatal
      }
    }

    try {
      await setDoc(
        doc(db, `users/${currentUser.uid}/medications`, medId),
        newMedData
      );

      if (formShouldSaveBula) {
        // Salvar automaticamente a Bula Digital na Biblioteca (/users/{uid}/bulas/{medId})
        const bulaToSave = sanitizeBulaForFirestore(
          pendingBulaDraft || {
            indications: newMedData.purpose,
            posologyGuidance: newMedData.dosageInstruction,
            recommendedTimes:
              newMedData.scheduleTimes.length > 0
                ? newMedData.scheduleTimes
                : ['08:00']
          },
          currentUser.uid,
          medId,
          newMedData.name,
          newMedData.activeIngredient
        );

        await setDoc(
          doc(db, `users/${currentUser.uid}/bulas`, medId),
          bulaToSave
        );
      } else if (editingMedId && savedBulas[editingMedId]) {
        // Se o usuário optou por remover a bula durante a edição
        await deleteDoc(
          doc(db, `users/${currentUser.uid}/bulas`, editingMedId)
        );
      }

      showToast(
        editingMedId
          ? formShouldSaveBula
            ? `Cadastro e bula de ${newMedData.name} atualizados.`
            : `Cadastro de ${newMedData.name} atualizado (sem bula).`
          : formShouldSaveBula
          ? `${newMedData.name} e sua bula foram salvos na Biblioteca!`
          : `${newMedData.name} salvo sem bula na Biblioteca.`,
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
                    className="space-y-5"
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
                        className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/90 flex items-center justify-between gap-3 cursor-pointer hover:bg-orange-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                          <span className="text-xs font-bold text-orange-950">
                            {stockAlerts.totalAlertCount}{' '}
                            {stockAlerts.totalAlertCount === 1
                              ? 'item em alerta de estoque/validade'
                              : 'itens em alerta de estoque/validade'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-orange-800 shrink-0">
                          Ver lista →
                        </span>
                      </div>
                    )}

                    <section className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-100 shadow-2xs flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-teal-700">
                          Resumo do Dia
                        </span>
                        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          {totalDosesToday === 0
                            ? 'Nenhuma dose programada'
                            : takenDosesToday === totalDosesToday
                            ? 'Doses de hoje concluídas!'
                            : `${takenDosesToday} de ${totalDosesToday} doses tomadas`}
                        </h1>
                      </div>

                      <CircularProgress
                        percentage={dailyProgressPercentage}
                        size={64}
                        strokeWidth={5.5}
                        colorClass="text-teal-600"
                        trackColorClass="text-sky-100"
                        label={`${takenDosesToday}/${totalDosesToday}`}
                        sublabel="hoje"
                      />
                    </section>

                    {medications.length === 0 ? (
                      <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center space-y-3">
                        <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                          <Plus className="w-5 h-5" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-900">
                          Nenhum medicamento cadastrado
                        </h2>
                        <button
                          onClick={() => navigateToTab('novo')}
                          className="min-h-[42px] px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Medicamento</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {activeTreatmentsProgress.length > 0 && (
                          <section className="space-y-2.5">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                              Em Tratamento
                            </h2>

                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                              {activeTreatmentsProgress.map(
                                ({ med, completed, target, percentage }) => {
                                  const isLow = med.currentStock <= med.minStockAlert;
                                  const catTheme = getCategoryTheme(med.category);

                                  return (
                                    <div
                                      key={med.id}
                                      style={catTheme.cardStyle}
                                      className="p-2.5 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors relative"
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
                                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                                      >
                                        <CircularProgress
                                          percentage={percentage}
                                          size={42}
                                          strokeWidth={4}
                                          strokeColor={isLow ? '#f97316' : catTheme.hex}
                                          trackColorClass="text-slate-200/80"
                                          label={`${percentage}%`}
                                        />
                                        <div className="min-w-0 flex-1">
                                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                            {med.name}
                                          </h3>
                                          <p className="text-[10px] sm:text-xs text-slate-600 truncate">
                                            {med.frequencyLabel}
                                          </p>
                                          <p
                                            style={{ color: catTheme.hex }}
                                            className="text-[10px] font-mono-tabular font-semibold"
                                          >
                                            {completed}/{target} doses
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center sm:flex-col justify-end gap-1 shrink-0">
                                        <button
                                          onClick={() => handleStartEditMedication(med)}
                                          title="Editar"
                                          aria-label="Editar medicamento"
                                          className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-sky-900 border border-sky-200/70 flex items-center justify-center transition-colors"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setMedToDelete(med)}
                                          title="Excluir"
                                          aria-label="Excluir medicamento"
                                          className="w-7 h-7 rounded-lg bg-white/90 hover:bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center transition-colors"
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

                        {todayScheduledDoses.length > 0 && (() => {
                          const pendingDoses = todayScheduledDoses.filter((d) => !d.takenLog);
                          const archivedDoses = todayScheduledDoses.filter((d) => Boolean(d.takenLog));

                          return (
                            <section className="space-y-3.5">
                              <div className="flex items-center justify-between px-1">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Horários de Hoje ({pendingDoses.length} pendentes)
                                </h2>
                                {archivedDoses.length > 0 && (
                                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    {archivedDoses.length} tomadas
                                  </span>
                                )}
                              </div>

                              {pendingDoses.length === 0 && archivedDoses.length > 0 && (
                                <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200 text-center space-y-1">
                                  <Check className="w-6 h-6 text-emerald-600 mx-auto stroke-[2.5]" />
                                  <h3 className="text-sm font-bold text-emerald-950">
                                    Tudo em dia hoje!
                                  </h3>
                                </div>
                              )}

                              {(['Manhã', 'Tarde', 'Noite'] as const).map((period) => {
                                const periodPending = pendingDoses.filter(
                                  (d) => d.period === period
                                );
                                if (periodPending.length === 0) return null;

                                return (
                                  <div key={period} className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-900 px-1">
                                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                                      <span>{period}</span>
                                    </div>

                                    <div className="space-y-2">
                                      {periodPending.map(
                                        ({ medication, scheduledTime }) => {
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
                                              style={catTheme.cardStyle}
                                              className="p-3.5 rounded-2xl border transition-colors relative"
                                            >
                                              <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0 flex-1 space-y-0.5">
                                                  <div className="flex items-center flex-wrap gap-1.5 text-xs">
                                                    <span className="font-mono-tabular font-bold text-slate-900 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200/80">
                                                      {scheduledTime}
                                                    </span>
                                                    <span className="text-slate-600 font-medium">
                                                      {medication.doseDisplay}
                                                    </span>
                                                    {isLowStock && (
                                                      <span className="text-orange-600 font-semibold text-[11px] inline-flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Restam {medication.currentStock}
                                                      </span>
                                                    )}
                                                  </div>

                                                  <h3 className="text-sm font-bold text-slate-900 truncate pt-0.5">
                                                    {medication.name}
                                                  </h3>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  <button
                                                    onClick={() =>
                                                      handleStartEditMedication(medication)
                                                    }
                                                    title="Editar"
                                                    aria-label="Editar medicamento"
                                                    className="min-h-[38px] min-w-[36px] rounded-xl bg-white/90 hover:bg-white text-sky-900 border border-sky-200/70 flex items-center justify-center transition-colors"
                                                  >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                  </button>
                                                  <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() =>
                                                      handleOpenConfirmDoseModal(
                                                        medication,
                                                        scheduledTime,
                                                        period
                                                      )
                                                    }
                                                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                                                  >
                                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                                    <span>Confirmar</span>
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

                              {archivedDoses.length > 0 && (
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setIsArchivedSectionOpen(!isArchivedSectionOpen)
                                    }
                                    className="w-full p-3 rounded-2xl bg-white border border-sky-100 hover:bg-sky-50/50 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
                                  >
                                    <span className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      Arquivadas hoje ({archivedDoses.length})
                                    </span>
                                    <span className="text-[11px] font-bold text-teal-700">
                                      {isArchivedSectionOpen ? 'Ocultar ▲' : 'Mostrar ▼'}
                                    </span>
                                  </button>

                                  {isArchivedSectionOpen && (
                                    <div className="mt-2 space-y-1.5">
                                      {archivedDoses.map(
                                        ({ medication, scheduledTime, takenLog }) => (
                                          <div
                                            key={`archived-${medication.id}-${scheduledTime}`}
                                            className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                                          >
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono-tabular text-slate-400 line-through">
                                                  {scheduledTime}
                                                </span>
                                                <span className="text-emerald-800 font-semibold bg-emerald-100/80 px-1.5 py-0.5 rounded text-[10px]">
                                                  Tomado às {takenLog?.takenTime}
                                                </span>
                                              </div>
                                              <p className="font-semibold text-slate-800 truncate mt-0.5">
                                                {medication.name}
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleUndoDose(
                                                  medication,
                                                  scheduledTime,
                                                  takenLog!
                                                )
                                              }
                                              className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[11px] font-semibold shrink-0"
                                            >
                                              Desfazer
                                            </button>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </section>
                          );
                        })()}
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
                    className="space-y-4"
                  >
                    <section className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-100 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h1 className="text-sm font-bold text-slate-900">
                          Histórico de Doses ({doseLogs.length})
                        </h1>
                        {medications.length > 0 && (
                          <button
                            onClick={() => {
                              setManualDoseMedId(medications[0]?.id || '');
                              setManualDoseDate(getTodayISO());
                              setManualDoseTime(getCurrentTimeHHMM());
                              setIsManualDoseModalOpen(true);
                            }}
                            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 flex items-center gap-1 shrink-0 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Lançar Dose</span>
                          </button>
                        )}
                      </div>

                      <select
                        id="history-med-filter"
                        value={historyMedFilter}
                        onChange={(e) => setHistoryMedFilter(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-sky-50/50 border border-sky-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-600"
                      >
                        <option value="TODOS">
                          Todos os medicamentos ({doseLogs.length})
                        </option>
                        {medications.map((med) => {
                          const count = doseLogs.filter(
                            (l) => l.medicationId === med.id
                          ).length;
                          return (
                            <option key={med.id} value={med.id}>
                              {med.name} ({count})
                            </option>
                          );
                        })}
                      </select>

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {[
                          { id: 'TODOS', label: 'Todos' },
                          { id: 'no_horario', label: 'No horário' },
                          { id: 'atrasado', label: 'Com atraso' },
                          { id: 'avulso', label: 'Avulso' }
                        ].map((st) => (
                          <button
                            key={st.id}
                            onClick={() => setHistoryStatusFilter(st.id)}
                            className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
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
                      <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center space-y-1.5">
                        <History className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-sm font-semibold text-slate-800">
                          Nenhum registro encontrado
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {groupedHistoryLogs.map(([dateStr, logs]) => (
                          <div key={dateStr} className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                              <h3 className="text-xs font-bold text-sky-900">
                                {formatDateFriendly(dateStr)}
                              </h3>
                              <span className="font-mono-tabular text-[11px] text-slate-500">
                                {logs.length} {logs.length === 1 ? 'dose' : 'doses'}
                              </span>
                            </div>

                            <div className="bg-white rounded-2xl border border-sky-100 divide-y divide-sky-50 overflow-hidden">
                              {logs.map((log) => (
                                <div
                                  key={log.id}
                                  className="p-3.5 flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-900 font-mono-tabular text-xs font-bold shrink-0">
                                      {log.takenTime}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-sm font-bold text-slate-900 truncate">
                                        {log.medicationName}
                                      </h4>
                                      <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
                                        <span>{log.doseDisplay}</span>
                                        {log.status === 'atrasado' && (
                                          <span className="text-orange-600 font-semibold">
                                            · Atrasado
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleDeleteHistoryLog(log)}
                                    title="Remover"
                                    aria-label="Remover registro do histórico"
                                    className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
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
                    className="space-y-4"
                  >
                    <section className="p-4 rounded-3xl bg-white border border-sky-100 space-y-3">
                      <div className="relative">
                        <Search className="w-4 h-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar medicamento, princípio ativo ou sintoma..."
                          className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-2xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-600"
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

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <button
                          onClick={() => setSelectedCategory('Todos')}
                          className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            selectedCategory === 'Todos'
                              ? 'bg-slate-900 text-white'
                              : 'bg-sky-50/80 text-sky-900 hover:bg-sky-100'
                          }`}
                        >
                          Todos
                        </button>
                        {categoriesList.map((cat) => {
                          const catTheme = getCategoryTheme(cat.name);
                          const isSelected = selectedCategory === cat.name;
                          return (
                            <button
                              key={cat.name}
                              onClick={() => setSelectedCategory(cat.name)}
                              style={!isSelected ? catTheme.badgeStyle : undefined}
                              className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-slate-900 text-white'
                                  : 'hover:opacity-90 border'
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={catTheme.swatchStyle}
                              />
                              <span>{cat.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {/* Painel Compacto de Interações Detectadas na Biblioteca */}
                    {libraryWideInteractions.length > 0 && (
                      <section className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300/90 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Interações identificadas ({libraryWideInteractions.length})
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {libraryWideInteractions.map((inter) => (
                            <div
                              key={inter.id}
                              className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900">
                                  {inter.newMedName} ↔ {inter.existingMedName}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                                  {inter.severityLabel}
                                </span>
                              </div>
                              <p className="text-slate-600">{inter.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {filteredLibraryMedications.length === 0 ? (
                      <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center space-y-2">
                        <BookOpen className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-sm font-semibold text-slate-800">
                          Nenhum medicamento encontrado
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredLibraryMedications.map((med) => {
                          const daysLeft = getDaysUntilExpiry(med.expiryDate);
                          const isExpired = daysLeft < 0;
                          const isLowStock = med.currentStock <= med.minStockAlert;
                          const catTheme = getCategoryTheme(med.category);
                          const savedBula = savedBulas[med.id];

                          return (
                            <div
                              key={med.id}
                              style={catTheme.cardStyle}
                              className="p-4 rounded-2xl border space-y-2.5 transition-colors relative"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center flex-wrap gap-1.5 text-xs">
                                    <span
                                      style={catTheme.badgeStyle}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border text-[11px]"
                                    >
                                      <span
                                        style={catTheme.swatchStyle}
                                        className="w-1.5 h-1.5 rounded-full"
                                      />
                                      {med.category}
                                    </span>
                                    <span className="text-slate-500 text-[11px]">
                                      {med.formType}
                                    </span>
                                    {savedBula && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-semibold">
                                        Bula
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate pt-0.5">
                                    {med.name}
                                  </h3>
                                  <p className="text-xs text-slate-600 truncate">
                                    {med.activeIngredient} · {med.purpose}
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  <span
                                    className={`font-mono-tabular text-xs sm:text-sm font-bold block ${
                                      isExpired
                                        ? 'text-rose-600'
                                        : isLowStock
                                        ? 'text-orange-600'
                                        : 'text-teal-700'
                                    }`}
                                  >
                                    {med.currentStock} {med.unitLabel}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono-tabular">
                                    1 cx: {med.boxCapacity}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between flex-wrap gap-1.5 pt-1 border-t border-black/5">
                                <div className="flex items-center flex-wrap gap-1.5">
                                  <button
                                    type="button"
                                    disabled={downloadingBulaMedId === med.id}
                                    onClick={() => {
                                      if (savedBula) {
                                        setBulaModalTab('guia');
                                        setBulaViewerModal({ med, bula: savedBula });
                                      } else {
                                        handleDownloadBulaForLibraryMed(med, true);
                                      }
                                    }}
                                    className="min-h-[34px] px-2.5 py-1 rounded-xl bg-sky-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors inline-flex items-center gap-1 disabled:opacity-60"
                                  >
                                    {downloadingBulaMedId === med.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <FileText className="w-3.5 h-3.5" />
                                    )}
                                    <span>{savedBula ? 'Ler Bula' : 'Baixar Bula'}</span>
                                  </button>

                                  {savedBula && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveBulaForMedication(med)
                                      }
                                      title="Remover Bula"
                                      className="min-h-[34px] px-2.5 py-1 rounded-xl bg-rose-50/90 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Remover Bula</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleStartEditMedication(med)}
                                    className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white/90 text-sky-900 hover:bg-white border border-sky-200/70 text-xs font-semibold inline-flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={() => setMedToDelete(med)}
                                    className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white/90 text-rose-700 hover:bg-rose-50 border border-rose-200/70 text-xs font-semibold inline-flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {!isExpired && med.currentStock >= med.doseAmount && (
                                  <button
                                    onClick={() => handleTakeSingleDoseNow(med)}
                                    className="min-h-[34px] px-3 py-1 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold transition-colors shrink-0"
                                  >
                                    Tomar
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
                    className="space-y-4"
                  >
                    <div className="p-1.5 rounded-2xl bg-white border border-sky-100 grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setStockSubTab('inventario')}
                        className={`min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                          stockSubTab === 'inventario'
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-600 hover:bg-sky-50'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        <span>Estoque</span>
                      </button>

                      <button
                        onClick={() => setStockSubTab('compras')}
                        className={`min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                          stockSubTab === 'compras'
                            ? 'bg-teal-600 text-white'
                            : 'text-slate-600 hover:bg-emerald-50/60'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>
                          Compras ({stockAlerts.shoppingList.length})
                        </span>
                      </button>
                    </div>

                    {stockSubTab === 'compras' ? (
                      <div className="space-y-3.5">
                        <section className="p-4 rounded-3xl bg-white border border-teal-200/80 flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <h2 className="text-sm font-bold text-slate-900">
                              Lista de Compras
                            </h2>
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer mt-1">
                              <input
                                type="checkbox"
                                checked={showAllInShoppingList}
                                onChange={(e) =>
                                  setShowAllInShoppingList(e.target.checked)
                                }
                                className="w-3.5 h-3.5 rounded accent-teal-600"
                              />
                              <span>Incluir uso esporádico</span>
                            </label>
                          </div>

                          <div className="text-right bg-emerald-50/80 px-3 py-2 rounded-2xl border border-emerald-200/70">
                            <span className="text-[10px] text-teal-800 block">
                              Total Estimado
                            </span>
                            <span className="font-mono-tabular text-sm font-bold text-teal-950">
                              {formatCurrencyBRL(stockAlerts.shoppingTotalEstimated)}
                            </span>
                          </div>
                        </section>

                        {stockAlerts.shoppingList.length === 0 ? (
                          <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center space-y-1.5">
                            <CheckCircle2 className="w-7 h-7 text-teal-600 mx-auto" />
                            <p className="text-sm font-bold text-slate-800">
                              Estoque em dia
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {stockAlerts.shoppingList.map(
                              ({ medication, isExpired, reason }) => {
                                const catTheme = getCategoryTheme(
                                  medication.category
                                );
                                return (
                                  <div
                                    key={medication.id}
                                    className={`p-4 rounded-2xl ${catTheme.cardBgClass} border border-orange-200/90 ${catTheme.accentStripClass} space-y-2.5`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <span
                                          className={`text-xs font-semibold inline-flex items-center gap-1 ${
                                            isExpired
                                              ? 'text-rose-600'
                                              : 'text-orange-600'
                                          }`}
                                        >
                                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                          {reason}
                                        </span>
                                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                                          {medication.name}
                                        </h3>
                                        <p className="text-xs text-slate-600">
                                          1 cx: {medication.boxCapacity} {medication.unitLabel}
                                        </p>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <span className="font-mono-tabular text-xs font-bold text-sky-950 block">
                                          {formatCurrencyBRL(medication.lastPaidPrice)}
                                        </span>
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
                                          className="mt-1.5 min-h-[34px] px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Repor</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                          {[
                            { id: 'todos', label: `Todos (${medications.length})` },
                            { id: 'acabando', label: `Estoque Baixo (${stockAlerts.lowStock.length})` },
                            { id: 'vencendo', label: `Vencendo (${stockAlerts.expiringSoon.length})` },
                            { id: 'vencidos', label: `Vencidos (${stockAlerts.expired.length})` }
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
                              className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
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
                          <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center">
                            <p className="text-sm font-semibold text-slate-700">
                              Nenhum item encontrado
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
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
                                  className={`p-3.5 rounded-2xl ${catTheme.cardBgClass} border ${catTheme.accentStripClass} space-y-2.5 ${
                                    isLowStock || isExpiringSoon
                                      ? 'border-orange-200'
                                      : isExpired
                                      ? 'border-rose-200'
                                      : catTheme.cardBorderClass
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <h3 className="text-sm font-bold text-slate-900 truncate">
                                        {med.name}
                                      </h3>
                                      <p className="text-[11px] text-slate-600 font-mono-tabular">
                                        Val: {formatExpiryMMYYYY(med.expiryDate)} · {formatCurrencyBRL(med.lastPaidPrice)}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAdjustStock(
                                            med,
                                            Math.max(1, med.boxCapacity)
                                          )
                                        }
                                        title={`Adicionar +1 caixa (+${med.boxCapacity})`}
                                        className="min-h-[32px] px-2 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-mono-tabular font-bold text-[11px]"
                                      >
                                        +1 cx (+{med.boxCapacity})
                                      </button>

                                      <div className="flex items-center gap-1 bg-white/90 p-0.5 rounded-xl border border-sky-100">
                                        <button
                                          onClick={() => handleAdjustStock(med, -1)}
                                          aria-label="Reduzir 1 unidade"
                                          className="w-7 h-7 rounded-lg bg-sky-50 text-slate-700 hover:bg-sky-100 font-mono-tabular font-bold text-xs flex items-center justify-center"
                                        >
                                          -
                                        </button>
                                        <span className="font-mono-tabular text-xs font-bold px-1.5 text-slate-900">
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
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                                      <span>
                                        Atual: <strong className="font-mono-tabular text-slate-900">{med.currentStock} {med.unitLabel}</strong>
                                      </span>
                                      <span className="font-mono-tabular text-sky-900">
                                        1 cx: {med.boxCapacity} {med.unitLabel}
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/90 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                        style={{ width: `${stockPercent}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between pt-0.5">
                                      <span className="text-[11px] text-slate-500">
                                        {formatBoxBreakdown(
                                          med.currentStock,
                                          med.boxCapacity,
                                          med.unitLabel
                                        )}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleStartEditMedication(med)}
                                          className="p-1 text-sky-800 hover:text-sky-950"
                                          title="Editar"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setMedToDelete(med)}
                                          className="p-1 text-rose-600 hover:text-rose-800"
                                          title="Excluir"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
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
                    className="space-y-4"
                  >
                    <section className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-100 space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-slate-900">
                          1. Medicamento
                        </h2>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => navigateToTab('opcoes')}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Categorias</span>
                          </button>
                          {editingMedId && (
                            <button
                              type="button"
                              onClick={resetForm}
                              className="text-xs font-medium text-slate-500 hover:text-slate-800"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Barra de Pesquisa de Nomes Verdadeiros (Base ANVISA + openFDA + RxNav) */}
                        <div className="relative">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nome do Medicamento e Dosagem *
                          </label>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="relative flex-1">
                              <Search className="w-4 h-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                required
                                value={formName}
                                onFocus={() => setIsAutocompleteOpen(true)}
                                onChange={(e) => {
                                  setFormName(e.target.value);
                                  setIsAutocompleteOpen(true);
                                }}
                                placeholder="Buscar ex: Losartana, Dipirona, Neosaldina, Torsilax, Amoxicilina..."
                                className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600 font-medium"
                              />
                              {formName && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormName('');
                                    setFormActiveIngredient('');
                                    setPendingBulaDraft(null);
                                    setAiDetectedInteractions([]);
                                    setIsAutocompleteOpen(true);
                                  }}
                                  aria-label="Limpar nome"
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={isDownloadingBula || !formName.trim()}
                              onClick={() =>
                                handleFetchBulaAndAnalyzeInteractions(
                                  formName,
                                  formActiveIngredient
                                )
                              }
                              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                            >
                              {isDownloadingBula ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Buscando...</span>
                                </>
                              ) : (
                                <>
                                  <FileText className="w-4 h-4" />
                                  <span>Buscar Bula</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Dropdown de Sugestões de Medicamentos */}
                          {isAutocompleteOpen && (
                            <div className="mt-1.5 rounded-2xl bg-white border border-sky-200 shadow-lg overflow-hidden z-30">
                              <div className="px-3.5 py-2 bg-sky-50/80 border-b border-sky-100 flex items-center justify-between text-[11px] text-sky-950 font-semibold">
                                <span>
                                  {formName.trim().length < 2
                                    ? 'Sugestões rápidas'
                                    : `${combinedAutocompleteSuggestions.length} medicamentos encontrados`}
                                </span>
                                <div className="flex items-center gap-2">
                                  {isSearchingRemoteCatalog && (
                                    <span className="inline-flex items-center gap-1 text-teal-700">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      API...
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setIsAutocompleteOpen(false)}
                                    className="text-slate-500 hover:text-slate-800 font-bold px-1.5 py-0.5 rounded-md hover:bg-sky-100"
                                  >
                                    Fechar
                                  </button>
                                </div>
                              </div>

                              {combinedAutocompleteSuggestions.length === 0 ? (
                                <div className="p-3 text-xs text-slate-600">
                                  Clique em <strong>Buscar Bula</strong> para consultar &ldquo;{formName}&rdquo; na base openFDA/ANVISA.
                                </div>
                              ) : (
                                <div className="max-h-64 overflow-y-auto divide-y divide-sky-50">
                                  {combinedAutocompleteSuggestions.map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => handleSelectAnvisaSuggestion(item)}
                                      className="w-full text-left px-3.5 py-2.5 hover:bg-sky-50/80 transition-colors flex items-center justify-between gap-3"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center flex-wrap gap-1.5">
                                          <span className="text-xs font-bold text-slate-900">
                                            {item.name}
                                          </span>
                                          {item.brandAliases.length > 0 && (
                                            <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 font-medium">
                                              {item.brandAliases.slice(0, 2).join(', ')}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate">
                                          {item.activeIngredient} · {item.formType} · {item.category}
                                        </p>
                                      </div>

                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 text-[10px] font-mono-tabular font-bold shrink-0">
                                        <Clock className="w-2.5 h-2.5" />
                                        {item.recommendedTimes.join(', ')}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Princípio Ativo
                          </label>
                          <input
                            type="text"
                            value={formActiveIngredient}
                            onChange={(e) => setFormActiveIngredient(e.target.value)}
                            placeholder="Ex: Losartana Potássica, Dipirona..."
                            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                          />
                        </div>

                        {/* ALERTA AUTOMÁTICO DE INTERAÇÃO COM OUTROS MEDICAMENTOS */}
                        {currentFormInteractions.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-2.5">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <h3 className="text-xs font-bold text-amber-950">
                                Interação com medicamento em uso ({currentFormInteractions.length})
                              </h3>
                            </div>

                            <div className="space-y-2">
                              {currentFormInteractions.map((alert) => (
                                <div
                                  key={alert.id}
                                  className="p-2.5 rounded-xl bg-white border border-amber-200 space-y-1.5 text-xs"
                                >
                                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                                    <span className="font-bold text-rose-700">
                                      Conflito com {alert.existingMedName}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                                      {alert.severityLabel}
                                    </span>
                                  </div>
                                  <p className="text-slate-700">{alert.efficacyImpact}</p>
                                  <div className="p-2 rounded-lg bg-teal-50/90 border border-teal-200/80 text-teal-950 flex items-center justify-between flex-wrap gap-2">
                                    <span>
                                      <strong>Orientação:</strong> {alert.recommendation}
                                    </span>
                                    {alert.suggestedSpacingHours && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const conflictMed = medications.find(
                                            (m) => m.id === alert.existingMedId
                                          );
                                          const baseTime =
                                            conflictMed?.scheduleTimes?.[0] || '07:00';
                                          const [bh, bm] = baseTime
                                            .split(':')
                                            .map(Number);
                                          const safeHour =
                                            ((bh || 7) +
                                              (alert.suggestedSpacingHours || 4)) %
                                            24;
                                          const safeTime = `${String(safeHour).padStart(2, '0')}:${String(bm || 0).padStart(2, '0')}`;
                                          if (formIntervalHours && Number(formIntervalHours) > 0) {
                                            applyIntervalSchedule(Number(formIntervalHours), safeTime);
                                          } else {
                                            setFormIsActiveTreatment(true);
                                            setFormScheduleTimes([safeTime]);
                                            setFormTreatmentStartTime(safeTime);
                                          }
                                          showToast(
                                            `Horário ajustado para ${safeTime} (+${alert.suggestedSpacingHours}h de ${alert.existingMedName}).`,
                                            'success'
                                          );
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors shrink-0"
                                      >
                                        <Clock className="w-3 h-3" />
                                        <span>Espaçar +{alert.suggestedSpacingHours}h</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* PAINEL COMPACTO: BULA E MELHOR HORÁRIO */}
                        {currentFormGuidance && (
                          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-teal-200/90 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs font-bold text-teal-950 inline-flex items-center gap-1.5">
                                <Info className="w-4 h-4 text-teal-600" />
                                Orientação da Bula
                              </span>

                              <div className="flex items-center gap-1.5">
                                {formShouldSaveBula ? (
                                  <>
                                    <span className="px-2 py-0.5 rounded-md bg-white text-teal-800 border border-teal-200 text-[11px] font-semibold">
                                      Bula vinculada
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormShouldSaveBula(false);
                                        setPendingBulaDraft(null);
                                        showToast('Bula removida deste cadastro.', 'warning');
                                      }}
                                      className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Remover Bula</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormShouldSaveBula(true);
                                      handleFetchBulaAndAnalyzeInteractions(
                                        formName,
                                        formActiveIngredient,
                                        findCatalogMatchForMedication(
                                          formName,
                                          formActiveIngredient
                                        ) || undefined
                                      );
                                    }}
                                    className="px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Baixar Bula</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {currentFormGuidance.bestTimeGuidance && (
                              <p className="text-xs text-slate-700 bg-white/90 p-2.5 rounded-xl border border-teal-100">
                                <strong className="text-teal-900">
                                  Melhor horário ({currentFormGuidance.recommendedTimes.join(', ')}):{' '}
                                </strong>
                                {currentFormGuidance.bestTimeGuidance}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Categoria
                            </label>
                            <div className="relative">
                              <select
                                value={formCategory}
                                onChange={(e) => setFormCategory(e.target.value)}
                                className="w-full min-h-[44px] pl-9 pr-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                              >
                                {categoriesList.map((cat) => (
                                  <option key={cat.name} value={cat.name}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                              <span
                                className="w-3.5 h-3.5 rounded-full absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={getCategoryTheme(formCategory).swatchStyle}
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
                                setFormDoseDisplay(
                                  matched
                                    ? matched.defaultDose
                                    : `1 ${nextType.toLowerCase()}`
                                );
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
                            Para que serve (Indicação) *
                          </label>
                          <input
                            type="text"
                            required
                            value={formPurpose}
                            onChange={(e) => setFormPurpose(e.target.value)}
                            placeholder="Ex: Controle de pressão arterial, dor e febre..."
                            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-100 space-y-3.5">
                      <h2 className="text-sm font-bold text-slate-900">
                        2. Estoque e Caixa
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-2xl bg-sky-50/40 border border-sky-100 space-y-2">
                          <label className="block text-xs font-bold text-slate-800">
                            Capacidade de 1 Caixa
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={formBoxCapacity}
                            onChange={(e) => {
                              const v = e.target.value;
                              setFormBoxCapacity(v === '' ? '' : Math.max(1, Number(v)));
                            }}
                            placeholder="Ex: 20"
                            className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-white border border-sky-200/90 text-sm font-mono-tabular font-semibold text-slate-900"
                          />
                          <div className="flex items-center flex-wrap gap-1">
                            {[10, 14, 20, 30, 60].map((capPreset) => (
                              <button
                                key={capPreset}
                                type="button"
                                onClick={() => setFormBoxCapacity(capPreset)}
                                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono-tabular font-semibold border transition-colors ${
                                  Number(formBoxCapacity) === capPreset
                                    ? 'bg-sky-700 text-white border-sky-700'
                                    : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-100/70'
                                }`}
                              >
                                {capPreset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-teal-50/35 border border-teal-200/70 space-y-2">
                          <label className="block text-xs font-bold text-slate-800">
                            Quantidade Atual Total
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={formCurrentStock}
                            onChange={(e) => {
                              const v = e.target.value;
                              setFormCurrentStock(v === '' ? '' : Math.max(0, Number(v)));
                            }}
                            placeholder="Ex: 40 (2 caixas)"
                            className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-white border border-teal-300/90 text-sm font-mono-tabular font-semibold text-slate-900"
                          />
                          {(() => {
                            const boxCap = Math.max(1, Number(formBoxCapacity) || 20);
                            const curr = Number(formCurrentStock) || 0;
                            const unitLabel =
                              presentationsList.find((p) => p.name === formType)
                                ?.unitLabel || 'unidades';
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center flex-wrap gap-1">
                                  {[1, 2, 3, 4].map((boxesCount) => {
                                    const totalForBoxes = boxCap * boxesCount;
                                    const isSelected = curr === totalForBoxes;
                                    return (
                                      <button
                                        key={boxesCount}
                                        type="button"
                                        onClick={() =>
                                          setFormCurrentStock(totalForBoxes)
                                        }
                                        className={`px-2 py-0.5 rounded-lg text-[11px] font-mono-tabular font-semibold border transition-colors ${
                                          isSelected
                                            ? 'bg-teal-600 text-white border-teal-600'
                                            : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-100/70'
                                        }`}
                                      >
                                        {boxesCount}x ({totalForBoxes})
                                      </button>
                                    );
                                  })}
                                </div>
                                <p className="text-[11px] font-medium text-teal-900">
                                  {formatBoxBreakdown(curr, boxCap, unitLabel)}
                                </p>
                              </div>
                            );
                          })()}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Validade
                          </label>
                          <input
                            type="date"
                            value={formExpiryDate}
                            onChange={(e) => setFormExpiryDate(e.target.value)}
                            className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Último Preço (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={formLastPaidPrice}
                            onChange={(e) => {
                              const v = e.target.value;
                              setFormLastPaidPrice(v === '' ? '' : Math.max(0, Number(v)));
                            }}
                            className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-100 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">
                            3. Posologia, Intervalo e Horários
                          </h2>
                          <p className="text-xs text-slate-500">
                            Escolha de quantas em quantas horas e edite os horários se desejar
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={formIsActiveTreatment}
                          onClick={() => {
                            const next = !formIsActiveTreatment;
                            setFormIsActiveTreatment(next);
                            if (next && formScheduleTimes.length === 0) {
                              applyIntervalSchedule(formIntervalHours || 24);
                            }
                          }}
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
                          {/* SELETOR DE QUANTAS EM QUANTAS HORAS + 1º HORÁRIO */}
                          <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-teal-600" />
                                <span>De quantas em quantas horas?</span>
                              </label>
                              <span className="text-[11px] text-teal-800 font-medium">
                                Ajusta os melhores horários automaticamente
                              </span>
                            </div>

                            <div className="flex items-center flex-wrap gap-1.5">
                              {[
                                { hours: 24, label: '24h (1x/dia)' },
                                { hours: 12, label: '12/12h (2x)' },
                                { hours: 8, label: '8/8h (3x)' },
                                { hours: 6, label: '6/6h (4x)' },
                                { hours: 4, label: '4/4h (6x)' }
                              ].map((preset) => {
                                const isSelected =
                                  Number(formIntervalHours) === preset.hours;
                                return (
                                  <button
                                    key={preset.hours}
                                    type="button"
                                    onClick={() =>
                                      applyIntervalSchedule(
                                        preset.hours,
                                        formTreatmentStartTime
                                      )
                                    }
                                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                                      isSelected
                                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                        : 'bg-white text-slate-700 border-sky-200 hover:bg-sky-100/60'
                                    }`}
                                  >
                                    {preset.label}
                                  </button>
                                );
                              })}

                              <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-sky-200 min-h-[36px]">
                                <span className="text-[11px] font-medium text-slate-600">
                                  A cada
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  max={24}
                                  value={formIntervalHours}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                      setFormIntervalHours('');
                                    } else {
                                      const hrs = Math.max(
                                        1,
                                        Math.min(24, Number(val))
                                      );
                                      applyIntervalSchedule(
                                        hrs,
                                        formTreatmentStartTime
                                      );
                                    }
                                  }}
                                  placeholder="h"
                                  className="w-12 text-center font-mono-tabular text-xs font-bold text-slate-900 bg-sky-50/70 rounded-lg py-1 border border-sky-200 focus:outline-none focus:border-teal-600"
                                />
                                <span className="text-[11px] font-medium text-slate-600">
                                  horas
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-sky-100">
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700">
                                  1º Horário (Base):
                                </label>
                                <input
                                  type="time"
                                  required
                                  value={formTreatmentStartTime}
                                  onChange={(e) => {
                                    const newStart = e.target.value;
                                    setFormTreatmentStartTime(newStart);
                                    if (
                                      formIntervalHours &&
                                      Number(formIntervalHours) > 0
                                    ) {
                                      const recalculated =
                                        generateScheduleTimesByInterval(
                                          Number(formIntervalHours),
                                          newStart
                                        );
                                      setFormScheduleTimes(recalculated);
                                    }
                                  }}
                                  className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white border border-sky-200 text-xs font-mono-tabular font-bold text-slate-900"
                                />
                              </div>

                              {currentFormGuidance?.recommendedTimes?.[0] && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const bestStart =
                                      currentFormGuidance.recommendedTimes[0];
                                    const hrs =
                                      Number(formIntervalHours) ||
                                      Math.max(
                                        1,
                                        Math.round(
                                          24 /
                                            currentFormGuidance.recommendedTimes
                                              .length
                                        )
                                      );
                                    applyIntervalSchedule(hrs, bestStart);
                                    showToast(
                                      `Ajustado a partir do melhor horário (${bestStart})!`,
                                      'success'
                                    );
                                  }}
                                  className="text-[11px] font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>
                                    Usar melhor horário sugerido ({currentFormGuidance.recommendedTimes[0]})
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* HORÁRIOS GERADOS (CADA UM PODE SER EDITADO DIRETAMENTE OU REMOVIDO) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-800">
                                Horários do Dia ({formScheduleTimes.length}{' '}
                                {formScheduleTimes.length === 1
                                  ? 'dose'
                                  : 'doses'}
                                ) — toque no horário para editar
                              </label>
                            </div>

                            {formScheduleTimes.length === 0 ? (
                              <p className="text-xs text-slate-500 bg-sky-50/50 px-3 py-2 rounded-xl border border-sky-100">
                                Selecione um intervalo acima ou adicione um horário abaixo.
                              </p>
                            ) : (
                              <div className="flex items-center flex-wrap gap-2">
                                {formScheduleTimes.map((time, idx) => (
                                  <div
                                    key={`${idx}-${time}`}
                                    className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-xl bg-teal-50/80 border border-teal-200 text-xs font-mono-tabular font-bold text-teal-950"
                                  >
                                    <span className="text-[10px] text-teal-700 font-sans font-semibold">
                                      {idx + 1}ª:
                                    </span>
                                    <input
                                      type="time"
                                      value={time}
                                      aria-label={`Editar ${idx + 1}º horário`}
                                      onChange={(e) => {
                                        const updatedTime = e.target.value;
                                        if (!updatedTime) return;
                                        const nextList = [...formScheduleTimes];
                                        nextList[idx] = updatedTime;
                                        const deduped = Array.from(
                                          new Set(nextList)
                                        ).sort();
                                        setFormScheduleTimes(deduped);
                                        if (idx === 0) {
                                          setFormTreatmentStartTime(updatedTime);
                                        }
                                      }}
                                      className="bg-white px-2 py-0.5 rounded-lg border border-teal-200 text-xs font-mono-tabular font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFormScheduleTimes(
                                          formScheduleTimes.filter(
                                            (_, i) => i !== idx
                                          )
                                        )
                                      }
                                      aria-label={`Remover horário ${time}`}
                                      className="p-0.5 text-slate-400 hover:text-rose-600"
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
                                className="min-h-[38px] px-3 py-1 rounded-xl bg-sky-50/40 border border-sky-200 text-xs font-mono-tabular"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!formNewTimeInput) {
                                    showToast(
                                      'Selecione um horário ao lado para adicionar.',
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
                                className="min-h-[38px] px-3 py-1 rounded-xl bg-sky-100/80 hover:bg-sky-200/70 text-xs font-semibold text-sky-900"
                              >
                                + Horário Extra
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Data de Início *
                              </label>
                              <input
                                type="date"
                                required
                                value={formTreatmentStartDate}
                                onChange={(e) =>
                                  setFormTreatmentStartDate(e.target.value)
                                }
                                className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Receituário
                              </label>
                              <select
                                value={formControlled}
                                onChange={(e) =>
                                  setFormControlled(
                                    e.target.value as ControlledType
                                  )
                                }
                                className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800"
                              >
                                <option value="Venda Livre / Simples">
                                  Simples / Venda Livre
                                </option>
                                <option value="Receita Retida (Branca C1/Antibiótico)">
                                  Receita Retida (C1 / Antibiótico)
                                </option>
                                <option value="Receita Azul (Notificação B)">
                                  Receita Azul (B)
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
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setFormTreatmentDays(v === '' ? '' : Math.max(1, Number(v)));
                                  }}
                                  className="w-20 min-h-[42px] px-3 py-1.5 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular disabled:opacity-50"
                                />
                                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formIsContinuous}
                                    onChange={(e) =>
                                      setFormIsContinuous(e.target.checked)
                                    }
                                    className="w-4 h-4 rounded accent-teal-600"
                                  />
                                  <span>Contínuo</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Resumo compacto de desconto retroativo (só aparece se iniciado em data passada) */}
                          {(() => {
                            if (!formIsActiveTreatment || formScheduleTimes.length === 0) return null;
                            const pastElapsed = calculateElapsedDosesFromStart(
                              formTreatmentStartDate,
                              formTreatmentStartTime,
                              formScheduleTimes,
                              todayISO,
                              getCurrentTimeHHMM()
                            );
                            if (pastElapsed <= 0) return null;
                            const doseAmt = Math.max(1, Number(formDoseAmount) || 1);
                            const unitsDeducted = pastElapsed * doseAmt;
                            const rawStock = Number(formCurrentStock) || 0;
                            const remainingStock = Math.max(0, rawStock - unitsDeducted);
                            const unitLabel = presentationsList.find((p) => p.name === formType)?.unitLabel || 'un.';

                            return (
                              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-center justify-between flex-wrap gap-2">
                                <span>
                                  Início retroativo: <strong>{pastElapsed} doses decorridas</strong> (-{unitsDeducted} {unitLabel})
                                </span>
                                <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 border border-teal-200 text-teal-900 font-mono-tabular font-bold">
                                  Restante: {remainingStock} {unitLabel}
                                </span>
                              </div>
                            );
                          })()}
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
                          ? 'Salvar Alterações'
                          : 'Salvar Medicamento'}
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

                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-700 block">
                              Cor da categoria por código HTML (#) ou paleta:
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs"
                                style={{
                                  backgroundColor: newCategoryColor.startsWith('#')
                                    ? newCategoryColor
                                    : (PRESET_HEX_MAP[newCategoryColor] || '#0284c7')
                                }}
                              />
                              {newCategoryColor.startsWith('#')
                                ? newCategoryColor.toUpperCase()
                                : `#${newCategoryColor}`}
                            </span>
                          </div>

                          <div className="flex items-center flex-wrap gap-2.5">
                            {/* Seletor nativo de cor HTML + campo de digitação do código hex # */}
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-sky-200 shadow-2xs">
                              <input
                                type="color"
                                value={
                                  newCategoryColor.startsWith('#') && newCategoryColor.length === 7
                                    ? newCategoryColor
                                    : (PRESET_HEX_MAP[newCategoryColor] || '#0284c7')
                                }
                                onChange={(e) => setNewCategoryColor(e.target.value)}
                                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                                title="Abrir seletor de cor HTML"
                              />
                              <div className="flex items-center pr-2">
                                <span className="text-xs font-mono font-bold text-slate-400 pl-1">
                                  #
                                </span>
                                <input
                                  type="text"
                                  value={newCategoryColor.replace('#', '')}
                                  onChange={(e) => {
                                    const cleaned = e.target.value
                                      .replace(/[^0-9A-Fa-f]/g, '')
                                      .slice(0, 6);
                                    setNewCategoryColor('#' + cleaned);
                                  }}
                                  placeholder="0284c7"
                                  maxLength={6}
                                  className="w-20 px-1 py-0.5 text-xs font-mono uppercase bg-transparent text-slate-800 focus:outline-none font-bold"
                                />
                              </div>
                            </div>

                            {/* Paleta rápida de cores hospitalares */}
                            <div className="flex items-center flex-wrap gap-1.5">
                              {CLINICAL_COLOR_PALETTE.map((pal) => {
                                const isSelected =
                                  newCategoryColor.toLowerCase() === pal.hex.toLowerCase();
                                return (
                                  <button
                                    key={pal.hex}
                                    type="button"
                                    onClick={() => setNewCategoryColor(pal.hex)}
                                    title={pal.label}
                                    className={`w-7 h-7 rounded-lg border transition-all ${
                                      isSelected
                                        ? 'scale-110 ring-2 ring-slate-800/40 shadow-xs'
                                        : 'border-black/10 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: pal.hex }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </form>

                      {/* Lista de Categorias com Editar Nome, Editar Cor HTML # e Excluir */}
                      <div className="space-y-2.5">
                        {categoriesList.map((cat, idx) => {
                          const catTheme = getCategoryTheme(cat.name);

                          return (
                            <div
                              key={`${cat.name}-${idx}`}
                              style={catTheme.cardStyle}
                              className="p-3.5 rounded-2xl border transition-colors relative"
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
                                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-teal-500 text-sm text-slate-900 focus:outline-none"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveCategoryEdit(idx)}
                                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs hover:bg-teal-700"
                                      >
                                        Salvar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingCategoryIndex(null)
                                        }
                                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-semibold text-slate-700 block">
                                        Editar cor em código HTML (#):
                                      </span>
                                      <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                                        <span
                                          className="w-3.5 h-3.5 rounded-full border border-black/15"
                                          style={{
                                            backgroundColor: editingCategoryColor.startsWith('#')
                                              ? editingCategoryColor
                                              : (PRESET_HEX_MAP[editingCategoryColor] || '#0284c7')
                                          }}
                                        />
                                        {editingCategoryColor.startsWith('#')
                                          ? editingCategoryColor.toUpperCase()
                                          : `#${editingCategoryColor}`}
                                      </span>
                                    </div>

                                    <div className="flex items-center flex-wrap gap-2">
                                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-sky-200">
                                        <input
                                          type="color"
                                          value={
                                            editingCategoryColor.startsWith('#') && editingCategoryColor.length === 7
                                              ? editingCategoryColor
                                              : (PRESET_HEX_MAP[editingCategoryColor] || '#0284c7')
                                          }
                                          onChange={(e) =>
                                            setEditingCategoryColor(e.target.value)
                                          }
                                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                                        />
                                        <div className="flex items-center pr-2">
                                          <span className="text-xs font-mono font-bold text-slate-400 pl-1">
                                            #
                                          </span>
                                          <input
                                            type="text"
                                            value={editingCategoryColor.replace('#', '')}
                                            onChange={(e) => {
                                              const cleaned = e.target.value
                                                .replace(/[^0-9A-Fa-f]/g, '')
                                                .slice(0, 6);
                                              setEditingCategoryColor('#' + cleaned);
                                            }}
                                            placeholder="0284c7"
                                            maxLength={6}
                                            className="w-20 px-1 py-0.5 text-xs font-mono uppercase bg-transparent text-slate-800 focus:outline-none font-bold"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center flex-wrap gap-1.5">
                                        {CLINICAL_COLOR_PALETTE.map((pal) => (
                                          <button
                                            key={pal.hex}
                                            type="button"
                                            onClick={() =>
                                              setEditingCategoryColor(pal.hex)
                                            }
                                            title={pal.label}
                                            className={`w-6 h-6 rounded-md border transition-transform ${
                                              editingCategoryColor.toLowerCase() === pal.hex.toLowerCase()
                                                ? 'scale-110 ring-2 ring-slate-800/40 shadow-xs'
                                                : 'border-black/10 hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: pal.hex }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      style={catTheme.swatchStyle}
                                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-black/10"
                                    />
                                    <div>
                                      <span className="text-sm font-bold text-slate-900 block">
                                        {cat.name}
                                      </span>
                                      <span
                                        style={{ color: catTheme.hex }}
                                        className="text-[11px] font-mono font-semibold"
                                      >
                                        Código HTML: {catTheme.hex.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                                    {/* Paleta rápida de bolinhas de cor com seletor HTML */}
                                    <div
                                      className="flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-xl border border-sky-100 shadow-2xs"
                                      title="Trocar cor rapidamente com código HTML #"
                                    >
                                      <input
                                        type="color"
                                        value={catTheme.hex}
                                        onChange={(e) =>
                                          handleQuickChangeCategoryColor(
                                            idx,
                                            e.target.value
                                          )
                                        }
                                        className="w-5 h-5 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                                        title="Escolher qualquer cor HTML #"
                                      />
                                      {CLINICAL_COLOR_PALETTE.slice(0, 6).map((pal) => {
                                        const isCurrent =
                                          catTheme.hex.toLowerCase() === pal.hex.toLowerCase();
                                        return (
                                          <button
                                            key={pal.hex}
                                            type="button"
                                            onClick={() =>
                                              handleQuickChangeCategoryColor(
                                                idx,
                                                pal.hex
                                              )
                                            }
                                            title={`Trocar para ${pal.label} (${pal.hex})`}
                                            className={`w-4 h-4 rounded-full transition-transform ${
                                              isCurrent
                                                ? 'scale-125 ring-2 ring-slate-700 shadow-xs'
                                                : 'opacity-70 hover:opacity-100 hover:scale-110'
                                            }`}
                                            style={{ backgroundColor: pal.hex }}
                                          />
                                        );
                                      })}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCategoryIndex(idx);
                                          setEditingCategoryValue(cat.name);
                                          setEditingCategoryColor(catTheme.hex);
                                        }}
                                        aria-label={`Editar categoria ${cat.name}`}
                                        className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-sky-900 border border-sky-200/70 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
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
                  Unidades Adquiridas (1 cx = {restockModalMed.boxCapacity})
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={restockQuantityInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRestockQuantityInput(v === '' ? '' : Math.max(1, Number(v)));
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-sm font-mono-tabular"
                />
                <div className="flex items-center flex-wrap gap-1 mt-1.5">
                  {[1, 2, 3].map((boxes) => {
                    const qty = restockModalMed.boxCapacity * boxes;
                    return (
                      <button
                        key={boxes}
                        type="button"
                        onClick={() => setRestockQuantityInput(qty)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono-tabular font-semibold border ${
                          Number(restockQuantityInput) === qty
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
                        }`}
                      >
                        +{boxes} {boxes === 1 ? 'cx' : 'cxs'} ({qty})
                      </button>
                    );
                  })}
                </div>
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

      {/* ==========================================
          MODAL DE CONFIRMAÇÃO DE HORÁRIO DA DOSE E ARQUIVAMENTO
      ========================================== */}
      {doseToConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-sky-100 p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Confirmar Administração
                  </h3>
                  <p className="text-xs text-slate-500">
                    Horário programado: <strong className="font-mono-tabular text-slate-800">{doseToConfirm.scheduledTime}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDoseToConfirm(null)}
                className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:bg-sky-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              style={getCategoryTheme(doseToConfirm.medication.category).cardStyle}
              className="p-3.5 rounded-2xl border space-y-1"
            >
              <div className="flex items-center gap-2">
                <span
                  style={getCategoryTheme(doseToConfirm.medication.category).badgeStyle}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                >
                  {doseToConfirm.medication.category}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {doseToConfirm.medication.formType}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {doseToConfirm.medication.name}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1 font-mono-tabular">
                <span>Dose: <strong>{doseToConfirm.medication.doseDisplay}</strong></span>
                <span>Estoque: <strong>{doseToConfirm.medication.currentStock} {doseToConfirm.medication.unitLabel}</strong></span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Em qual horário você tomou este medicamento? *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    required
                    value={confirmTakenTime}
                    onChange={(e) => setConfirmTakenTime(e.target.value)}
                    className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-sm font-mono-tabular text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmTakenTime(getCurrentTimeHHMM())}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-xs font-bold text-sky-900 whitespace-nowrap"
                  >
                    Agora ({getCurrentTimeHHMM()})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Clínicas (Opcional)
                </label>
                <input
                  type="text"
                  value={confirmDoseNotes}
                  onChange={(e) => setConfirmDoseNotes(e.target.value)}
                  placeholder="Ex: Tomado com água após refeição"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDoseToConfirm(null)}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmDose}
                className="flex-1 min-h-[44px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Confirmar e Arquivar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL LEITOR DE BULA DIGITAL COMPLETA & GUIA DE ADMINISTRAÇÃO
      ========================================== */}
      {bulaViewerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl border border-sky-100 flex flex-col shadow-2xl overflow-hidden">
            {/* Cabeçalho do Modal da Bula */}
            <div className="p-5 bg-gradient-to-r from-sky-900 to-teal-900 text-white flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/30 border border-teal-300/40 text-[10px] font-bold uppercase tracking-wider">
                    <FileText className="w-3 h-3" />
                    Bula Salva na Biblioteca
                  </span>
                  <span className="text-[11px] text-sky-200">
                    {bulaViewerModal.bula.therapeuticClass}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold truncate">
                  {bulaViewerModal.bula.medicationName}
                </h3>
                <p className="text-xs text-sky-100">
                  <strong>Princípio Ativo:</strong>{' '}
                  {bulaViewerModal.bula.activeIngredient}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBulaViewerModal(null)}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas Internas da Bula */}
            <div className="px-5 pt-3 pb-2 bg-sky-50/70 border-b border-sky-100 grid grid-cols-3 gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setBulaModalTab('guia')}
                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  bulaModalTab === 'guia'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-sky-100/60 border border-sky-200/70'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Melhor Horário & Guia</span>
              </button>

              <button
                type="button"
                onClick={() => setBulaModalTab('interacoes')}
                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  bulaModalTab === 'interacoes'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-amber-50 border border-sky-200/70'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Interações</span>
              </button>

              <button
                type="button"
                onClick={() => setBulaModalTab('bula')}
                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  bulaModalTab === 'bula'
                    ? 'bg-sky-800 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-sky-100/60 border border-sky-200/70'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>Bula Completa</span>
              </button>
            </div>

            {/* Conteúdo Rolável */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm text-slate-700">
              {bulaModalTab === 'guia' && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-emerald-50/90 border border-teal-200 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-teal-950 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-teal-700" />
                        <span>Melhor Horário para Começar a Tomar</span>
                      </h4>
                      {bulaViewerModal.bula.recommendedTimes.length > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-teal-700 text-white font-mono-tabular text-xs font-bold">
                          Sugerido: {bulaViewerModal.bula.recommendedTimes.join(' · ')}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      {bulaViewerModal.bula.bestTimeGuidance}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-sky-950">
                      Como Administrar Corretamente (Passo a Passo)
                    </h4>
                    <p className="leading-relaxed">
                      {bulaViewerModal.bula.administrationTips}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-sky-100 space-y-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Posologia Oficial da Bula
                    </h4>
                    <p className="leading-relaxed">
                      {bulaViewerModal.bula.posologyGuidance}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                      O que fazer se eu esquecer de tomar uma dose?
                    </h4>
                    <p className="leading-relaxed text-amber-950">
                      {bulaViewerModal.bula.missedDoseGuidance}
                    </p>
                  </div>
                </div>
              )}

              {bulaModalTab === 'interacoes' && (
                <div className="space-y-3.5">
                  {(() => {
                    const activeConflicts = analyzeDrugInteractions(
                      {
                        id: bulaViewerModal.med.id,
                        name: bulaViewerModal.med.name,
                        activeIngredient: bulaViewerModal.med.activeIngredient,
                        interactingSubstances:
                          bulaViewerModal.bula.interactingSubstances
                      },
                      medications
                    );

                    if (activeConflicts.length === 0) {
                      return (
                        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-teal-950">
                              Nenhum conflito direto com seus outros medicamentos cadastrados
                            </h4>
                            <p className="text-xs text-teal-800 mt-0.5">
                              Cruzamos o princípio ativo ({bulaViewerModal.bula.activeIngredient}) com todos os outros medicamentos da sua biblioteca e não detectamos interações graves.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                          Interações detectadas com medicamentos que você já toma:
                        </h4>
                        {activeConflicts.map((inter) => (
                          <div
                            key={inter.id}
                            className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-1.5"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-1.5">
                              <span className="font-bold text-slate-900">
                                {inter.newMedName} ↔ {inter.existingMedName}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase">
                                {inter.severityLabel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-800">
                              <strong>Efeito na eficácia: </strong>
                              {inter.efficacyImpact}
                            </p>
                            <p className="text-xs text-teal-950 bg-white p-2.5 rounded-xl border border-amber-200">
                              <strong>Como proceder: </strong>
                              {inter.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="p-4 rounded-2xl bg-white border border-sky-100 space-y-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Resumo de Interações Medicamentosas e Alimentares (Bula)
                    </h4>
                    <p className="leading-relaxed">
                      {bulaViewerModal.bula.interactionsSummary}
                    </p>
                    {bulaViewerModal.bula.interactingSubstances.length > 0 && (
                      <div className="pt-2 flex items-center flex-wrap gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500">
                          Substâncias monitoradas:
                        </span>
                        {bulaViewerModal.bula.interactingSubstances.map(
                          (sub) => (
                            <span
                              key={sub}
                              className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-900 text-[11px] font-medium"
                            >
                              {sub}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-rose-950">
                      Contraindicações (Quando não usar)
                    </h4>
                    <p className="leading-relaxed text-rose-900">
                      {bulaViewerModal.bula.contraindications}
                    </p>
                  </div>
                </div>
              )}

              {bulaModalTab === 'bula' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1">
                    <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                      1. Para que este medicamento é indicado?
                    </h4>
                    <p className="leading-relaxed">
                      {bulaViewerModal.bula.indications}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-1">
                    <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                      2. Como este medicamento funciona?
                    </h4>
                    <p className="leading-relaxed">
                      {bulaViewerModal.bula.howItWorks}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-1">
                    <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                      3. Quando não devo usar este medicamento?
                    </h4>
                    <p className="leading-relaxed">
                      {bulaViewerModal.bula.contraindications}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-1">
                    <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                      4. O que devo saber antes de usar? (Advertências)
                    </h4>
                    <p className="leading-relaxed">
                      {bulaViewerModal.bula.warnings}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-1">
                    <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                      5. Quais os males que este medicamento pode causar?
                    </h4>
                    <p className="leading-relaxed">
                      {bulaViewerModal.bula.adverseReactions}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-1">
                    <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                      6. Onde, como e por quanto tempo posso guardar?
                    </h4>
                    <p className="leading-relaxed">
                      {bulaViewerModal.bula.storageAdvice}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center pt-1">
                    Fonte: {bulaViewerModal.bula.sourceApi} · Salva na Biblioteca em{' '}
                    {bulaViewerModal.bula.downloadedAt.replace('T', ' às ')}
                  </p>
                </div>
              )}
            </div>

            {/* Rodapé do Modal da Bula */}
            <div className="p-4 bg-sky-50/70 border-t border-sky-100 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleExportBulaFile(bulaViewerModal.bula)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo da Bula (.TXT)</span>
                </button>

                <button
                  type="button"
                  disabled={downloadingBulaMedId === bulaViewerModal.med.id}
                  onClick={() =>
                    handleDownloadBulaForLibraryMed(bulaViewerModal.med, true)
                  }
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-900 border border-sky-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {downloadingBulaMedId === bulaViewerModal.med.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Atualizar via openFDA + ANVISA</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleRemoveBulaForMedication(bulaViewerModal.med)
                  }
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Bula</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setBulaViewerModal(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
