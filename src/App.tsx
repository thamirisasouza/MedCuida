/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  RotateCcw,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Filter,
  ShoppingCart,
  Tag,
  FileText,
  DollarSign
} from 'lucide-react';

// ==========================================
// TIPOS E CATEGORIAS CLÍNICAS PADRÃO
// ==========================================

export type MedicationCategory =
  | 'Uso Contínuo'
  | 'Receita Retida'
  | 'Enxaqueca'
  | 'Vitaminas'
  | 'Dor & Febre'
  | 'Gastrointestinal'
  | 'Respiratório & Alergia'
  | 'Primeiros Socorros';

export const FIXED_CATEGORIES: MedicationCategory[] = [
  'Uso Contínuo',
  'Receita Retida',
  'Enxaqueca',
  'Vitaminas',
  'Dor & Febre',
  'Gastrointestinal',
  'Respiratório & Alergia',
  'Primeiros Socorros'
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

export type MedicationFormType =
  | 'Comprimido'
  | 'Cápsula'
  | 'Gotas'
  | 'Xarope'
  | 'Pomada'
  | 'Spray';

export type ControlledType =
  | 'Venda Livre / Simples'
  | 'Receita Retida (Branca C1/Antibiótico)'
  | 'Receita Azul (Notificação B)';

export interface Medication {
  id: string;
  name: string;
  activeIngredient: string;
  purpose: string;
  clinicalTags: string[]; // Tags fixas e sintomas (ex: Enxaqueca, Vitaminas, Receita Retida)
  category: MedicationCategory;
  formType: MedicationFormType;
  unitLabel: string;
  dosageInstruction: string;
  controlled: ControlledType;
  // Estoque, Validade e Preço
  currentStock: number;
  boxCapacity: number;
  minStockAlert: number;
  expiryDate: string; // YYYY-MM-DD
  lastPaidPrice: number; // Último preço pago para comparação na farmácia
  // Dados de Tratamento Ativo
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

type ActiveTab = 'hoje' | 'historico' | 'biblioteca' | 'estoque' | 'novo';
type StockSubTab = 'inventario' | 'compras';

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
// DADOS INICIAIS REALISTAS (MOCK DATA PROFISSIONAL)
// ==========================================

const createInitialMedications = (): Medication[] => [
  {
    id: 'med-1',
    name: 'Losartana Potássica 50mg',
    activeIngredient: 'Losartana Potássica',
    purpose: 'Controle da hipertensão arterial e proteção cardiovascular contínua.',
    clinicalTags: ['Pressão Arterial', 'Uso Contínuo'],
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    dosageInstruction: 'Administrar 1 comprimido às 08:00 e 1 comprimido às 20:00.',
    controlled: 'Venda Livre / Simples',
    currentStock: 4, // Estoque baixo (< 5) -> Entra automaticamente na Lista de Compras!
    boxCapacity: 30,
    minStockAlert: 6,
    expiryDate: getOffsetDateISO(240),
    lastPaidPrice: 24.90,
    isActiveTreatment: true,
    scheduleTimes: ['08:00', '20:00'],
    doseAmount: 1,
    doseDisplay: '1 comprimido',
    frequencyLabel: '12 em 12h (Uso Contínuo)',
    isContinuous: true,
    treatmentStartDate: getOffsetDateISO(-13),
    treatmentTotalDays: 30,
    completedDosesCount: 52,
    targetTotalDoses: 60
  },
  {
    id: 'med-2',
    name: 'Oxalato de Escitalopram 10mg',
    activeIngredient: 'Oxalato de Escitalopram',
    purpose: 'Tratamento de manutenção para equilíbrio neuroquímico e controle de ansiedade.',
    clinicalTags: ['Receita Retida', 'Uso Contínuo'],
    category: 'Receita Retida',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    dosageInstruction: 'Administrar 1 comprimido pela manhã após o desjejum.',
    controlled: 'Receita Retida (Branca C1/Antibiótico)',
    currentStock: 5, // Estoque no limite (<= 6) -> Entra automaticamente na Lista de Compras!
    boxCapacity: 30,
    minStockAlert: 6,
    expiryDate: getOffsetDateISO(310),
    lastPaidPrice: 68.50,
    isActiveTreatment: true,
    scheduleTimes: ['09:00'],
    doseAmount: 1,
    doseDisplay: '1 comprimido',
    frequencyLabel: '1x ao dia (Uso Contínuo)',
    isContinuous: true,
    treatmentStartDate: getOffsetDateISO(-25),
    treatmentTotalDays: 30,
    completedDosesCount: 25,
    targetTotalDoses: 30
  },
  {
    id: 'med-3',
    name: 'Vitamina D3 2.000 UI (Colecalciferol)',
    activeIngredient: 'Colecalciferol',
    purpose: 'Suplementação contínua para saúde óssea e manutenção imunológica.',
    clinicalTags: ['Vitaminas', 'Suplementação', 'Uso Contínuo'],
    category: 'Vitaminas',
    formType: 'Cápsula',
    unitLabel: 'cápsulas',
    dosageInstruction: 'Administrar 1 cápsula junto ao almoço diariamente.',
    controlled: 'Venda Livre / Simples',
    currentStock: 12,
    boxCapacity: 30,
    minStockAlert: 5,
    expiryDate: getOffsetDateISO(-12), // Vencido -> Entra automaticamente na Lista de Compras!
    lastPaidPrice: 44.90,
    isActiveTreatment: true,
    scheduleTimes: ['12:30'],
    doseAmount: 1,
    doseDisplay: '1 cápsula',
    frequencyLabel: 'Diário (Uso Contínuo)',
    isContinuous: true,
    treatmentStartDate: getOffsetDateISO(-18),
    treatmentTotalDays: 30,
    completedDosesCount: 18,
    targetTotalDoses: 30
  },
  {
    id: 'med-4',
    name: 'Amoxicilina + Clavulanato 875mg',
    activeIngredient: 'Amoxicilina Tri-hidratada + Clavulanato de Potássio',
    purpose: 'Antibioticoterapia para infecção respiratória bacteriana (sinusite aguda).',
    clinicalTags: ['Receita Retida', 'Antibiótico'],
    category: 'Receita Retida',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    dosageInstruction: 'Administrar 1 comprimido a cada 12 horas por 7 dias completos.',
    controlled: 'Receita Retida (Branca C1/Antibiótico)',
    currentStock: 6,
    boxCapacity: 14,
    minStockAlert: 3,
    expiryDate: getOffsetDateISO(160),
    lastPaidPrice: 89.90,
    isActiveTreatment: true,
    scheduleTimes: ['10:00', '22:00'],
    doseAmount: 1,
    doseDisplay: '1 comprimido',
    frequencyLabel: 'Ciclo de 7 dias (12/12h)',
    isContinuous: false,
    treatmentStartDate: getOffsetDateISO(-4),
    treatmentTotalDays: 7,
    completedDosesCount: 9,
    targetTotalDoses: 14
  },
  {
    id: 'med-5',
    name: 'Sumatriptana 50mg',
    activeIngredient: 'Succinato de Sumatriptana',
    purpose: 'Tratamento específico para crises agudas de enxaqueca com ou sem aura.',
    clinicalTags: ['Enxaqueca', 'Dor de cabeça'],
    category: 'Enxaqueca',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    dosageInstruction: 'Administrar 1 comprimido ao início dos sintomas de crise de enxaqueca.',
    controlled: 'Venda Livre / Simples',
    currentStock: 3,
    boxCapacity: 4,
    minStockAlert: 1,
    expiryDate: getOffsetDateISO(21), // Vence em menos de 30 dias
    lastPaidPrice: 36.80,
    isActiveTreatment: false,
    scheduleTimes: [],
    doseAmount: 1,
    doseDisplay: '1 comprimido',
    frequencyLabel: 'Sob demanda (Crise)',
    isContinuous: false,
    completedDosesCount: 1,
    targetTotalDoses: 4
  },
  {
    id: 'med-6',
    name: 'Pantoprazol Sódico 40mg',
    activeIngredient: 'Pantoprazol Sódico Sesqui-hidratado',
    purpose: 'Inibidor de bomba de prótons para proteção gástrica, gastrite e refluxo.',
    clinicalTags: ['Controle Gástrico', 'Azia', 'Refluxo'],
    category: 'Gastrointestinal',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    dosageInstruction: 'Administrar 1 comprimido em jejum pela manhã.',
    controlled: 'Venda Livre / Simples',
    currentStock: 22,
    boxCapacity: 28,
    minStockAlert: 5,
    expiryDate: getOffsetDateISO(340),
    lastPaidPrice: 39.50,
    isActiveTreatment: false,
    scheduleTimes: [],
    doseAmount: 1,
    doseDisplay: '1 comprimido',
    frequencyLabel: 'Sob demanda',
    isContinuous: false,
    completedDosesCount: 6,
    targetTotalDoses: 28
  }
];

const createInitialDoseLogs = (): DoseLog[] => {
  const today = getTodayISO();
  const yesterday = getOffsetDateISO(-1);
  const twoDaysAgo = getOffsetDateISO(-2);

  return [
    {
      id: 'log-1',
      medicationId: 'med-1',
      medicationName: 'Losartana Potássica 50mg',
      purpose: 'Controle da hipertensão arterial',
      doseDisplay: '1 comprimido',
      doseAmount: 1,
      date: today,
      scheduledTime: '08:00',
      takenTime: '08:03',
      status: 'no_horario',
      notes: 'Administrado em jejum'
    },
    {
      id: 'log-2',
      medicationId: 'med-2',
      medicationName: 'Oxalato de Escitalopram 10mg',
      purpose: 'Equilíbrio neuroquímico',
      doseDisplay: '1 comprimido',
      doseAmount: 1,
      date: today,
      scheduledTime: '09:00',
      takenTime: '09:08',
      status: 'no_horario'
    },
    {
      id: 'log-3',
      medicationId: 'med-4',
      medicationName: 'Amoxicilina + Clavulanato 875mg',
      purpose: 'Antibioticoterapia (Sinusite)',
      doseDisplay: '1 comprimido',
      doseAmount: 1,
      date: yesterday,
      scheduledTime: '22:00',
      takenTime: '22:04',
      status: 'no_horario'
    },
    {
      id: 'log-4',
      medicationId: 'med-1',
      medicationName: 'Losartana Potássica 50mg',
      purpose: 'Controle da hipertensão arterial',
      doseDisplay: '1 comprimido',
      doseAmount: 1,
      date: yesterday,
      scheduledTime: '20:00',
      takenTime: '20:35',
      status: 'atrasado',
      notes: 'Após o jantar'
    },
    {
      id: 'log-5',
      medicationId: 'med-5',
      medicationName: 'Sumatriptana 50mg',
      purpose: 'Crise de enxaqueca',
      doseDisplay: '1 comprimido',
      doseAmount: 1,
      date: yesterday,
      takenTime: '15:20',
      status: 'avulso',
      notes: 'Episódio de enxaqueca à tarde'
    },
    {
      id: 'log-6',
      medicationId: 'med-3',
      medicationName: 'Vitamina D3 2.000 UI (Colecalciferol)',
      purpose: 'Suplementação contínua',
      doseDisplay: '1 cápsula',
      doseAmount: 1,
      date: yesterday,
      scheduledTime: '12:30',
      takenTime: '12:30',
      status: 'no_horario'
    },
    {
      id: 'log-7',
      medicationId: 'med-4',
      medicationName: 'Amoxicilina + Clavulanato 875mg',
      purpose: 'Antibioticoterapia (Sinusite)',
      doseDisplay: '1 comprimido',
      doseAmount: 1,
      date: twoDaysAgo,
      scheduledTime: '10:00',
      takenTime: '10:02',
      status: 'no_horario'
    }
  ];
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
// COMPONENTE PRINCIPAL DO SISTEMA
// ==========================================

const STORAGE_KEY_MEDS = 'cuidamed_medications_v2';
const STORAGE_KEY_LOGS = 'cuidamed_doselogs_v2';

export default function App() {
  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return createInitialMedications();
  });

  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return createInitialDoseLogs();
  });

  // Estados de navegação
  const [activeTab, setActiveTab] = useState<ActiveTab>('hoje');
  const [stockSubTab, setStockSubTab] = useState<StockSubTab>('inventario');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Estados do Formulário de Cadastro / Edição
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formActiveIngredient, setFormActiveIngredient] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formSelectedTags, setFormSelectedTags] = useState<string[]>([]);
  const [formCustomTagsText, setFormCustomTagsText] = useState('');
  const [formCategory, setFormCategory] = useState<MedicationCategory>('Uso Contínuo');
  const [formType, setFormType] = useState<MedicationFormType>('Comprimido');
  const [formDosageInstruction, setFormDosageInstruction] = useState('');
  const [formControlled, setFormControlled] = useState<ControlledType>('Venda Livre / Simples');
  const [formCurrentStock, setFormCurrentStock] = useState<number>(30);
  const [formBoxCapacity, setFormBoxCapacity] = useState<number>(30);
  const [formMinStockAlert, setFormMinStockAlert] = useState<number>(5);
  const [formExpiryDate, setFormExpiryDate] = useState<string>(getOffsetDateISO(240));
  const [formLastPaidPrice, setFormLastPaidPrice] = useState<number>(35.0);
  const [formIsActiveTreatment, setFormIsActiveTreatment] = useState<boolean>(false);
  const [formScheduleTimes, setFormScheduleTimes] = useState<string[]>(['08:00']);
  const [formNewTimeInput, setFormNewTimeInput] = useState<string>('20:00');
  const [formDoseAmount, setFormDoseAmount] = useState<number>(1);
  const [formDoseDisplay, setFormDoseDisplay] = useState<string>('1 comprimido');
  const [formIsContinuous, setFormIsContinuous] = useState<boolean>(true);
  const [formTreatmentDays, setFormTreatmentDays] = useState<number>(7);

  // Persistência em localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEDS, JSON.stringify(medications));
    } catch {
      // ignore
    }
  }, [medications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(doseLogs));
    } catch {
      // ignore
    }
  }, [doseLogs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
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
    totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 100;

  // Tratamentos ativos para os Círculos de Progresso de Tratamento Completo na Tela Inicial
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

    // Lista de Compras Automática: puxa medicamentos de Uso Contínuo (ou todos se ativado o filtro) que estão com estoque baixo ou vencidos
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
              : `Estoque baixo (restam ${m.currentStock} de ${m.boxCapacity} ${m.unitLabel})`
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
  // HANDLERS DE INTERAÇÃO
  // ==========================================

  const handleToggleScheduledDose = (med: Medication, scheduledTime: string) => {
    const existingLog = doseLogs.find(
      (log) =>
        log.medicationId === med.id &&
        log.date === todayISO &&
        log.scheduledTime === scheduledTime
    );

    if (existingLog) {
      setDoseLogs((prev) => prev.filter((l) => l.id !== existingLog.id));
      setMedications((prev) =>
        prev.map((m) =>
          m.id === med.id
            ? {
                ...m,
                currentStock: m.currentStock + med.doseAmount,
                completedDosesCount: Math.max(0, m.completedDosesCount - 1)
              }
            : m
        )
      );
      showToast(`Dose das ${scheduledTime} desmarcada. Estoque atualizado.`);
    } else {
      const daysToExpiry = getDaysUntilExpiry(med.expiryDate);
      if (daysToExpiry < 0) {
        showToast(
          `Atenção: ${med.name} está vencido. Verifique a Lista de Compras para reposição.`
        );
        return;
      }

      if (med.currentStock < med.doseAmount) {
        showToast(`Estoque insuficiente para ${med.name}.`);
        return;
      }

      const nowTime = getCurrentTimeHHMM();
      const newLog: DoseLog = {
        id: `log-${Date.now()}`,
        medicationId: med.id,
        medicationName: med.name,
        purpose: med.purpose.split('.')[0],
        doseDisplay: med.doseDisplay,
        doseAmount: med.doseAmount,
        date: todayISO,
        scheduledTime,
        takenTime: nowTime,
        status: 'no_horario',
        notes: 'Dose programada confirmada'
      };

      setDoseLogs((prev) => [newLog, ...prev]);
      setMedications((prev) =>
        prev.map((m) =>
          m.id === med.id
            ? {
                ...m,
                currentStock: Math.max(0, m.currentStock - med.doseAmount),
                completedDosesCount: m.completedDosesCount + 1
              }
            : m
        )
      );
      showToast(`Dose confirmada: ${med.name} (-${med.doseAmount} ${med.unitLabel}).`);
    }
  };

  const handleTakeSingleDoseNow = (
    med: Medication,
    customDate?: string,
    customTime?: string,
    customNotes?: string
  ) => {
    const daysToExpiry = getDaysUntilExpiry(med.expiryDate);
    if (daysToExpiry < 0) {
      showToast(`Atenção: ${med.name} encontra-se vencido.`);
      return;
    }

    if (med.currentStock < med.doseAmount) {
      showToast(`Estoque insuficiente para ${med.name}.`);
      return;
    }

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicationId: med.id,
      medicationName: med.name,
      purpose: med.purpose.split('.')[0],
      doseDisplay: med.doseDisplay,
      doseAmount: med.doseAmount,
      date: customDate || todayISO,
      takenTime: customTime || getCurrentTimeHHMM(),
      status: 'avulso',
      notes: customNotes || 'Administração sob demanda'
    };

    setDoseLogs((prev) => [newLog, ...prev]);
    setMedications((prev) =>
      prev.map((m) =>
        m.id === med.id
          ? {
              ...m,
              currentStock: Math.max(0, m.currentStock - med.doseAmount),
              completedDosesCount: m.completedDosesCount + 1
            }
          : m
      )
    );
    showToast(`Dose de ${med.name} registrada no Histórico.`);
  };

  const handleDeleteHistoryLog = (log: DoseLog) => {
    setDoseLogs((prev) => prev.filter((l) => l.id !== log.id));
    setMedications((prev) =>
      prev.map((m) =>
        m.id === log.medicationId
          ? {
              ...m,
              currentStock: m.currentStock + log.doseAmount,
              completedDosesCount: Math.max(0, m.completedDosesCount - 1)
            }
          : m
      )
    );
    showToast('Registro removido e unidade devolvida ao estoque.');
  };

  const handleAdjustStock = (medId: string, delta: number) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== medId) return m;
        const nextStock = Math.max(0, m.currentStock + delta);
        return {
          ...m,
          currentStock: nextStock,
          boxCapacity: Math.max(m.boxCapacity, nextStock)
        };
      })
    );
  };

  // Confirmar reposição de item na Lista de Compras Automática
  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalMed) return;

    const newPrice = parseFloat(restockPriceInput.replace(',', '.'));
    const addedQty = Math.max(1, Number(restockQuantityInput) || restockModalMed.boxCapacity);

    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== restockModalMed.id) return m;
        const wasExpired = getDaysUntilExpiry(m.expiryDate) < 0;
        const updatedStock = wasExpired ? addedQty : m.currentStock + addedQty;
        return {
          ...m,
          currentStock: updatedStock,
          boxCapacity: Math.max(m.boxCapacity, updatedStock),
          lastPaidPrice: !isNaN(newPrice) && newPrice > 0 ? newPrice : m.lastPaidPrice,
          expiryDate: restockExpiryInput || m.expiryDate
        };
      })
    );

    showToast(`Compra registrada! Estoque de ${restockModalMed.name} atualizado.`);
    setRestockModalMed(null);
  };

  const resetForm = () => {
    setEditingMedId(null);
    setFormName('');
    setFormActiveIngredient('');
    setFormPurpose('');
    setFormSelectedTags([]);
    setFormCustomTagsText('');
    setFormCategory('Uso Contínuo');
    setFormType('Comprimido');
    setFormDosageInstruction('');
    setFormControlled('Venda Livre / Simples');
    setFormCurrentStock(30);
    setFormBoxCapacity(30);
    setFormMinStockAlert(5);
    setFormExpiryDate(getOffsetDateISO(240));
    setFormLastPaidPrice(35.0);
    setFormIsActiveTreatment(false);
    setFormScheduleTimes(['08:00']);
    setFormDoseAmount(1);
    setFormDoseDisplay('1 comprimido');
    setFormIsContinuous(true);
    setFormTreatmentDays(7);
  };

  const handleStartEditMedication = (med: Medication) => {
    setEditingMedId(med.id);
    setFormName(med.name);
    setFormActiveIngredient(med.activeIngredient);
    setFormPurpose(med.purpose);
    const stdTags = med.clinicalTags.filter((t) => STANDARD_CLINICAL_TAGS.includes(t));
    const customTags = med.clinicalTags.filter((t) => !STANDARD_CLINICAL_TAGS.includes(t));
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
    setFormScheduleTimes(med.scheduleTimes.length > 0 ? med.scheduleTimes : ['08:00']);
    setFormDoseAmount(med.doseAmount);
    setFormDoseDisplay(med.doseDisplay);
    setFormIsContinuous(med.isContinuous);
    setFormTreatmentDays(med.treatmentTotalDays || 7);
    setSelectedMedDetail(null);
    setActiveTab('novo');
  };

  const handleDeleteMedication = (medId: string) => {
    const target = medications.find((m) => m.id === medId);
    setMedications((prev) => prev.filter((m) => m.id !== medId));
    setSelectedMedDetail(null);
    if (target) {
      showToast(`${target.name} removido do inventário.`);
    }
  };

  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPurpose.trim()) {
      showToast('Preencha o nome do medicamento e sua indicação clínica.');
      return;
    }

    const unitMap: Record<MedicationFormType, string> = {
      Comprimido: 'comprimidos',
      Cápsula: 'cápsulas',
      Gotas: 'gotas',
      Xarope: 'ml',
      Pomada: 'aplicações',
      Spray: 'jatos'
    };

    const extraTags = formCustomTagsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const combinedTags = Array.from(new Set([...formSelectedTags, ...extraTags]));
    if (combinedTags.length === 0) combinedTags.push(formCategory);

    const dosesPerDay = formIsActiveTreatment ? Math.max(1, formScheduleTimes.length) : 1;
    const totalDays = formIsContinuous ? 30 : Math.max(1, formTreatmentDays);
    const targetTotalDoses = dosesPerDay * totalDays;

    const newMedData: Medication = {
      id: editingMedId || `med-${Date.now()}`,
      name: formName.trim(),
      activeIngredient: formActiveIngredient.trim() || formName.trim(),
      purpose: formPurpose.trim(),
      clinicalTags: combinedTags,
      category: formCategory,
      formType: formType,
      unitLabel: unitMap[formType],
      dosageInstruction:
        formDosageInstruction.trim() ||
        (formIsActiveTreatment
          ? `Administrar ${formDoseDisplay} nos horários: ${formScheduleTimes.join(', ')}.`
          : `Administrar ${formDoseDisplay} conforme orientação clínica.`),
      controlled:
        formCategory === 'Receita Retida' && formControlled === 'Venda Livre / Simples'
          ? 'Receita Retida (Branca C1/Antibiótico)'
          : formControlled,
      currentStock: Number(formCurrentStock) || 0,
      boxCapacity: Math.max(Number(formBoxCapacity) || 1, Number(formCurrentStock) || 1),
      minStockAlert: Number(formMinStockAlert) || 5,
      expiryDate: formExpiryDate || getOffsetDateISO(180),
      lastPaidPrice: Number(formLastPaidPrice) || 0,
      isActiveTreatment: formIsActiveTreatment,
      scheduleTimes: formIsActiveTreatment ? [...formScheduleTimes].sort() : [],
      doseAmount: Math.max(1, Number(formDoseAmount) || 1),
      doseDisplay: formDoseDisplay.trim() || `1 ${formType.toLowerCase()}`,
      frequencyLabel: formIsActiveTreatment
        ? formIsContinuous
          ? 'Uso Contínuo'
          : `Ciclo de ${totalDays} dias`
        : 'Sob demanda',
      isContinuous: formIsContinuous,
      treatmentStartDate: getTodayISO(),
      treatmentTotalDays: totalDays,
      completedDosesCount: editingMedId
        ? medications.find((m) => m.id === editingMedId)?.completedDosesCount || 0
        : 0,
      targetTotalDoses
    };

    if (editingMedId) {
      setMedications((prev) => prev.map((m) => (m.id === editingMedId ? newMedData : m)));
      showToast(`Cadastro de ${newMedData.name} atualizado.`);
    } else {
      setMedications((prev) => [newMedData, ...prev]);
      showToast(`${newMedData.name} registrado com sucesso.`);
    }

    resetForm();
    setActiveTab(newMedData.isActiveTreatment ? 'hoje' : 'biblioteca');
  };

  const handleRestoreDemoData = () => {
    setMedications(createInitialMedications());
    setDoseLogs(createInitialDoseLogs());
    setIsMobileMenuOpen(false);
    showToast('Dados padrão do sistema restaurados.');
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
        med.clinicalTags.some((t) => t.toLowerCase() === selectedCategory.toLowerCase());
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
        if (historyMedFilter !== 'TODOS' && log.medicationId !== historyMedFilter) {
          return false;
        }
        if (historyStatusFilter !== 'TODOS' && log.status !== historyStatusFilter) {
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

    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
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
  // CONFIGURAÇÃO DOS MENUS DE NAVEGAÇÃO
  // ==========================================

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
    badgeTone?: 'teal' | 'amber';
  }> = [
    {
      id: 'hoje',
      label: 'Tratamentos de Hoje',
      subtitle: 'Agenda de horários e progresso',
      icon: Calendar,
      badgeCount:
        totalDosesToday - takenDosesToday > 0
          ? totalDosesToday - takenDosesToday
          : undefined,
      badgeTone: 'teal'
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
      subtitle: 'Finalidades clínicas e posologia',
      icon: BookOpen
    },
    {
      id: 'estoque',
      label: 'Estoque & Compras',
      subtitle: 'Validade e reposição automática',
      icon: Package,
      badgeCount:
        stockAlerts.shoppingList.length > 0
          ? stockAlerts.shoppingList.length
          : undefined,
      badgeTone: 'amber'
    },
    {
      id: 'novo',
      label: editingMedId ? 'Editar Medicamento' : 'Cadastrar Medicamento',
      subtitle: 'Incluir item ou prescrição',
      icon: Plus
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
                    className={`font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                      item.badgeTone === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Card de atalho para Lista de Compras Automática na Sidebar */}
        <div className="p-4 border-t border-sky-100 space-y-3 bg-sky-50/30">
          <button
            onClick={() => {
              setStockSubTab('compras');
              navigateToTab('estoque');
            }}
            className="w-full p-3.5 rounded-2xl bg-white border border-sky-100 hover:border-teal-300 text-left transition-all space-y-1.5 shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-teal-600" />
                Lista de Compras
              </span>
              <span className="font-mono-tabular font-bold text-teal-700">
                {stockAlerts.shoppingList.length} itens
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Estimativa de reposição:{' '}
              <span className="font-mono-tabular font-semibold text-slate-700">
                {formatCurrencyBRL(stockAlerts.shoppingTotalEstimated)}
              </span>
            </p>
          </button>

          <button
            onClick={handleRestoreDemoData}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-sky-100/50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Dados Padrão</span>
          </button>
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
                            className={`font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                              item.badgeTone === 'amber'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {item.badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Atalho direto para a Lista de Compras no Drawer Mobile */}
                <div className="px-4 pt-2">
                  <button
                    onClick={() => {
                      setStockSubTab('compras');
                      navigateToTab('estoque');
                    }}
                    className="w-full p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingCart className="w-4 h-4 text-teal-700 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-teal-950">
                          Lista de Compras Automática
                        </p>
                        <p className="text-[11px] text-teal-800 font-mono-tabular">
                          {stockAlerts.shoppingList.length} itens ·{' '}
                          {formatCurrencyBRL(stockAlerts.shoppingTotalEstimated)}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-sky-100 bg-sky-50/30">
                <button
                  onClick={handleRestoreDemoData}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-slate-600 bg-white border border-sky-200/70 hover:bg-sky-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restaurar Dados Padrão</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          ÁREA DE CONTEÚDO PRINCIPAL (CLEAN, SEM BOTÕES REPETIDOS)
      ========================================== */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <div className="w-full max-w-md lg:max-w-3xl mx-auto min-h-screen flex flex-col bg-[#F2F7FA] relative pb-24 lg:pb-12">
          {/* TOP BAR LIMPA — Apenas Menu Hambúrguer, Título da Seção e Data (Zero botões duplicados) */}
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
              </span>
            </div>

            <span className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
              {formatDateFriendly(todayISO).split('·')[1]?.trim() || 'Hoje'}
            </span>
          </header>

          {/* TOAST DE FEEDBACK DISCRETO */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{toastMessage}</span>
                </div>
                <button
                  onClick={() => setToastMessage(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CONTEÚDO COM TRANSIÇÃO SUAVE */}
          <main className="flex-1 px-4 pt-5">
            <AnimatePresence mode="wait">
              {/* =========================================================
                  ABA 1: HOJE (RESUMO, CÍRCULOS DE PROGRESSO E HORÁRIOS)
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
                  {/* Card Principal de Progresso do Dia */}
                  <section className="p-5 rounded-3xl bg-white border border-sky-100 shadow-2xs flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-teal-700">
                        Acompanhamento Diário
                      </span>
                      <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                        {takenDosesToday === totalDosesToday && totalDosesToday > 0
                          ? 'Todas as doses de hoje foram concluídas'
                          : `Você administrou ${takenDosesToday} de ${totalDosesToday} doses hoje`}
                      </h1>
                      <p className="text-xs text-slate-500">
                        Confirme cada horário abaixo para atualizar o prontuário e o estoque.
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

                  {/* CÍRCULOS DE PROGRESSO DE TRATAMENTO COMPLETO */}
                  <section className="space-y-3">
                    <div className="px-1">
                      <h2 className="text-sm font-bold text-slate-800">
                        Progresso dos Tratamentos Ativos
                      </h2>
                      <p className="text-xs text-slate-500">
                        Toque em um tratamento para filtrar seu histórico completo
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeTreatmentsProgress.map(
                        ({ med, completed, target, percentage }) => {
                          const ringColor =
                            percentage >= 80
                              ? 'text-teal-600'
                              : percentage >= 50
                              ? 'text-sky-600'
                              : 'text-emerald-500';

                          return (
                            <motion.div
                              key={med.id}
                              whileTap={{ scale: 0.98 }}
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
                              className="p-4 rounded-2xl bg-white border border-sky-100 hover:border-teal-300 transition-colors flex items-center gap-3.5 cursor-pointer"
                            >
                              <CircularProgress
                                percentage={percentage}
                                size={58}
                                strokeWidth={5}
                                colorClass={ringColor}
                                trackColorClass="text-sky-50"
                                label={`${percentage}%`}
                                sublabel={med.isContinuous ? 'adesão' : 'ciclo'}
                              />
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                  {med.name}
                                </h3>
                                <p className="text-xs text-slate-500 truncate">
                                  {med.category} · {med.frequencyLabel}
                                </p>
                                <p className="text-xs font-mono-tabular text-teal-700 font-medium pt-0.5">
                                  {completed} de {target} doses cumpridas
                                </p>
                              </div>
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  </section>

                  {/* CRONOGRAMA DE HORÁRIOS DO DIA */}
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

                                return (
                                  <motion.div
                                    key={`${medication.id}-${scheduledTime}`}
                                    layout
                                    className={`p-4 rounded-2xl border transition-colors ${
                                      isTaken
                                        ? 'bg-emerald-50/50 border-emerald-200/80'
                                        : 'bg-white border-sky-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                          <span className="font-mono-tabular font-bold text-sky-800">
                                            {scheduledTime}
                                          </span>
                                          <span aria-hidden="true">·</span>
                                          <span>{medication.doseDisplay}</span>
                                          <span aria-hidden="true">·</span>
                                          <span className="text-teal-700 font-medium truncate">
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

                                        <p className="text-xs text-slate-500 font-mono-tabular">
                                          Estoque: {medication.currentStock}{' '}
                                          {medication.unitLabel}
                                          {takenLog
                                            ? ` · Registrado às ${takenLog.takenTime}`
                                            : ''}
                                        </p>
                                      </div>

                                      <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() =>
                                          handleToggleScheduledDose(
                                            medication,
                                            scheduledTime
                                          )
                                        }
                                        className={`min-h-[44px] px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors ${
                                          isTaken
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-sky-50 text-sky-900 hover:bg-teal-600 hover:text-white border border-sky-200/70'
                                        }`}
                                      >
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                        <span>{isTaken ? 'Concluído' : 'Confirmar'}</span>
                                      </motion.button>
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
                </motion.div>
              )}

              {/* =========================================================
                  ABA 2: HISTÓRICO DE DOSES (ORGANIZADO POR DATA E HORÁRIO)
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
                  {/* Cabeçalho Limpo e Filtro por Medicamento */}
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
                    </div>

                    {/* Seletor de Filtro por Medicamento */}
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

                    {/* Filtro rápido de status */}
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

                  {/* Lista Cronológica Agrupada por Data */}
                  {groupedHistoryLogs.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-white border border-sky-100 text-center space-y-2">
                      <History className="w-7 h-7 text-slate-400 mx-auto" />
                      <p className="text-sm font-semibold text-slate-800">
                        Nenhum registro encontrado
                      </p>
                      <p className="text-xs text-slate-500">
                        Altere o filtro selecionado ou confirme uma dose na aba Tratamentos.
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
                              {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
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
                                    <p className="text-xs text-slate-500 truncate">
                                      {log.doseDisplay} · {log.purpose}
                                    </p>
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
                  ABA 3: BIBLIOTECA TERAPÊUTICA (COM TAGS FIXAS: ENXAQUECA, VITAMINAS, RECEITA RETIDA)
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
                  {/* Busca Inteligente para Evitar Compras Duplicadas */}
                  <section className="p-5 rounded-3xl bg-white border border-sky-100 space-y-3.5">
                    <div>
                      <h1 className="text-base font-bold text-slate-900">
                        Consulta de Medicamentos e Indicações
                      </h1>
                      <p className="text-xs text-slate-500">
                        Pesquise por sintoma, princípio ativo ou categoria clínica antes de adquirir novo item
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por sintoma, nome ou tag (ex: Enxaqueca, Vitaminas)..."
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

                    {/* Categorias e Tags Específicas Fixas */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                      {['Todos', ...FIXED_CATEGORIES].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            selectedCategory === cat
                              ? 'bg-teal-600 text-white'
                              : 'bg-sky-50/80 text-sky-900 hover:bg-sky-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Lista Limpa de Medicamentos */}
                  <div className="space-y-3">
                    {filteredLibraryMedications.map((med) => {
                      const daysLeft = getDaysUntilExpiry(med.expiryDate);
                      const isExpired = daysLeft < 0;

                      return (
                        <div
                          key={med.id}
                          className="p-4 rounded-2xl bg-white border border-sky-100 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center flex-wrap gap-1.5 text-xs text-teal-700 font-medium">
                                <span>{med.category}</span>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-500">{med.formType}</span>
                                {med.controlled !== 'Venda Livre / Simples' && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-sky-800 font-semibold">
                                      Receita Retida
                                    </span>
                                  </>
                                )}
                              </div>

                              <h3 className="text-base font-bold text-slate-900">
                                {med.name}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {med.activeIngredient}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`font-mono-tabular text-sm font-bold block ${
                                  isExpired ? 'text-rose-600' : 'text-teal-700'
                                }`}
                              >
                                {med.currentStock} {med.unitLabel}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono-tabular">
                                Último: {formatCurrencyBRL(med.lastPaidPrice)}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 bg-sky-50/40 p-3 rounded-xl border border-sky-100/80">
                            <strong className="text-slate-900">Indicação: </strong>
                            {med.purpose}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-500 truncate">
                              Tags: {med.clinicalTags.join(' · ')}
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setSelectedMedDetail(med)}
                                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-sky-50 text-sky-900 hover:bg-sky-100 text-xs font-semibold transition-colors"
                              >
                                Detalhes
                              </button>
                              {!isExpired && med.currentStock >= med.doseAmount && (
                                <button
                                  onClick={() => handleTakeSingleDoseNow(med)}
                                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold transition-colors"
                                >
                                  Registrar Dose
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                  {/* Seletor de Sub-aba: Posição de Estoque vs Lista de Compras Automática */}
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

                  {/* SUB-ABA A: LISTA DE COMPRAS AUTOMÁTICA */}
                  {stockSubTab === 'compras' ? (
                    <div className="space-y-4">
                      {/* Resumo Financeiro para Comparação na Farmácia */}
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
                              Itens de uso contínuo com estoque baixo ou vencidos, com o último preço pago para referência.
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
                            <span>Incluir também medicamentos de uso esporádico</span>
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
                            Todos os medicamentos de uso contínuo estão com estoque regular e dentro do prazo de validade.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {stockAlerts.shoppingList.map(({ medication, isExpired, reason }) => (
                            <div
                              key={medication.id}
                              className="p-4 rounded-2xl bg-white border border-sky-100 space-y-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center flex-wrap gap-1.5 text-xs">
                                    <span
                                      className={`font-semibold ${
                                        isExpired ? 'text-rose-600' : 'text-amber-700'
                                      }`}
                                    >
                                      {reason}
                                    </span>
                                    {medication.controlled !== 'Venda Livre / Simples' && (
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
                                  <p className="text-xs text-slate-500">
                                    Caixa padrão: {medication.boxCapacity}{' '}
                                    {medication.unitLabel} · {medication.category}
                                  </p>
                                </div>

                                {/* Último Preço Pago em Destaque para Comparar na Farmácia */}
                                <div className="text-right shrink-0 bg-sky-50/70 px-3 py-2 rounded-xl border border-sky-100">
                                  <span className="text-[10px] text-slate-500 block">
                                    Último preço pago
                                  </span>
                                  <span className="font-mono-tabular text-sm font-bold text-sky-950">
                                    {formatCurrencyBRL(medication.lastPaidPrice)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-sky-50">
                                <span className="text-xs text-slate-500">
                                  Princípio ativo: {medication.activeIngredient}
                                </span>
                                <button
                                  onClick={() => {
                                    setRestockModalMed(medication);
                                    setRestockPriceInput(
                                      medication.lastPaidPrice.toFixed(2)
                                    );
                                    setRestockQuantityInput(medication.boxCapacity);
                                    setRestockExpiryInput(getOffsetDateISO(365));
                                  }}
                                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Confirmar Compra</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SUB-ABA B: POSIÇÃO DE ESTOQUE & VALIDADE */
                    <div className="space-y-4">
                      {/* Cards de Resumo de Validade e Estoque */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() =>
                            setStockFilter(
                              stockFilter === 'vencendo' ? 'todos' : 'vencendo'
                            )
                          }
                          className={`p-4 rounded-2xl border text-left transition-colors ${
                            stockFilter === 'vencendo'
                              ? 'bg-amber-50/80 border-amber-300'
                              : 'bg-white border-sky-100'
                          }`}
                        >
                          <span className="text-xs text-slate-500 block">
                            Validade Crítica
                          </span>
                          <span className="font-mono-tabular text-xl font-bold text-slate-900 mt-0.5 block">
                            {stockAlerts.expiringSoon.length +
                              stockAlerts.expired.length}
                          </span>
                          <span className="text-[11px] text-amber-800 mt-1 block">
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
                              ? 'bg-sky-50 border-sky-300'
                              : 'bg-white border-sky-100'
                          }`}
                        >
                          <span className="text-xs text-slate-500 block">
                            Estoque Baixo
                          </span>
                          <span className="font-mono-tabular text-xl font-bold text-slate-900 mt-0.5 block">
                            {stockAlerts.lowStock.length}
                          </span>
                          <span className="text-[11px] text-teal-800 mt-1 block">
                            Abaixo do estoque mínimo
                          </span>
                        </button>
                      </div>

                      {/* Filtros Simples */}
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
                                f.id as 'todos' | 'vencendo' | 'acabando' | 'vencidos'
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

                      {/* Lista de Caixas com Barra de Quantidade */}
                      <div className="space-y-3">
                        {filteredStockMedications.map((med) => {
                          const daysLeft = getDaysUntilExpiry(med.expiryDate);
                          const isExpired = daysLeft < 0;
                          const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;
                          const isLowStock = med.currentStock <= med.minStockAlert;

                          const stockPercent = Math.min(
                            100,
                            Math.round(
                              (med.currentStock / Math.max(1, med.boxCapacity)) * 100
                            )
                          );

                          const barColor = isExpired
                            ? 'bg-rose-500'
                            : isLowStock || isExpiringSoon
                            ? 'bg-amber-500'
                            : 'bg-teal-600';

                          return (
                            <div
                              key={med.id}
                              className="p-4 rounded-2xl bg-white border border-sky-100 space-y-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    {isExpired ? (
                                      <span className="font-semibold text-rose-600">
                                        Vencido ({formatExpiryMMYYYY(med.expiryDate)})
                                      </span>
                                    ) : isExpiringSoon ? (
                                      <span className="font-semibold text-amber-700">
                                        Vence em {daysLeft} dias
                                      </span>
                                    ) : (
                                      <span className="font-medium text-teal-700">
                                        Validade regular ({formatExpiryMMYYYY(med.expiryDate)})
                                      </span>
                                    )}
                                    <span aria-hidden="true">·</span>
                                    <span className="font-mono-tabular text-slate-500">
                                      Último: {formatCurrencyBRL(med.lastPaidPrice)}
                                    </span>
                                  </div>

                                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                                    {med.name}
                                  </h3>
                                </div>

                                <div className="flex items-center gap-1 bg-sky-50/80 p-1 rounded-xl shrink-0">
                                  <button
                                    onClick={() => handleAdjustStock(med.id, -1)}
                                    aria-label="Reduzir 1 unidade"
                                    className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-sky-100 font-mono-tabular font-bold text-xs flex items-center justify-center"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono-tabular text-xs font-bold px-2 text-slate-900">
                                    {med.currentStock}
                                  </span>
                                  <button
                                    onClick={() => handleAdjustStock(med.id, 1)}
                                    aria-label="Adicionar 1 unidade"
                                    className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-sky-100 font-mono-tabular font-bold text-xs flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                  <span>Disponível na caixa</span>
                                  <span className="font-mono-tabular font-semibold text-slate-800">
                                    {med.currentStock} / {med.boxCapacity} {med.unitLabel}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-sky-50 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                    style={{ width: `${stockPercent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
                  {/* Seção 1: Identificação e Categorias Fixas */}
                  <section className="p-5 rounded-3xl bg-white border border-sky-100 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900">
                      1. Identificação Clínica e Categoria
                    </h2>

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
                          <select
                            value={formCategory}
                            onChange={(e) =>
                              setFormCategory(e.target.value as MedicationCategory)
                            }
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                          >
                            {FIXED_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Apresentação
                          </label>
                          <select
                            value={formType}
                            onChange={(e) => {
                              const nextType = e.target.value as MedicationFormType;
                              setFormType(nextType);
                              if (nextType === 'Gotas') setFormDoseDisplay('20 gotas');
                              else if (nextType === 'Xarope') setFormDoseDisplay('10 ml');
                              else setFormDoseDisplay(`1 ${nextType.toLowerCase()}`);
                            }}
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600"
                          >
                            <option value="Comprimido">Comprimido</option>
                            <option value="Cápsula">Cápsula</option>
                            <option value="Gotas">Gotas</option>
                            <option value="Xarope">Xarope</option>
                            <option value="Pomada">Pomada</option>
                            <option value="Spray">Spray</option>
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

                      {/* Tags Clínicas Padrão Fixas */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Tags Clínicas Padrão (Selecione as aplicáveis)
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

                  {/* Seção 2: Controle de Estoque, Validade e Último Preço Pago */}
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
                          onChange={(e) => setFormCurrentStock(Number(e.target.value))}
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
                          onChange={(e) => setFormBoxCapacity(Number(e.target.value))}
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
                          onChange={(e) => setFormLastPaidPrice(Number(e.target.value))}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Seção 3: Tratamento Ativo */}
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
                        onClick={() => setFormIsActiveTreatment(!formIsActiveTreatment)}
                        className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 ${
                          formIsActiveTreatment ? 'bg-teal-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                            formIsActiveTreatment ? 'translate-x-6' : 'translate-x-0'
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
                          <div className="flex items-center flex-wrap gap-2">
                            {formScheduleTimes.map((time) => (
                              <div
                                key={time}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-mono-tabular font-semibold text-sky-900"
                              >
                                <span>{time}</span>
                                {formScheduleTimes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormScheduleTimes(
                                        formScheduleTimes.filter((t) => t !== time)
                                      )
                                    }
                                    className="text-sky-700 hover:text-rose-600"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="time"
                              value={formNewTimeInput}
                              onChange={(e) => setFormNewTimeInput(e.target.value)}
                              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-sky-50/40 border border-sky-200 text-sm font-mono-tabular"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  formNewTimeInput &&
                                  !formScheduleTimes.includes(formNewTimeInput)
                                ) {
                                  setFormScheduleTimes([
                                    ...formScheduleTimes,
                                    formNewTimeInput
                                  ]);
                                }
                              }}
                              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-sky-100/80 hover:bg-sky-200/70 text-xs font-semibold text-sky-900"
                            >
                              + Incluir Horário
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Regime de Prescrição
                            </label>
                            <select
                              value={formControlled}
                              onChange={(e) =>
                                setFormControlled(e.target.value as ControlledType)
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
                                className="w-24 min-h-[44px] px-3 py-2 rounded-xl bg-sky-50/40 border border-sky-200/80 text-sm font-mono-tabular disabled:opacity-50"
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
                        ? 'Salvar Alterações'
                        : 'Confirmar Cadastro do Medicamento'}
                    </span>
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
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
                {stockAlerts.shoppingList.length > 0 && (
                  <span className="absolute top-1.5 right-3 w-4 h-4 rounded-full bg-teal-600 text-white font-mono-tabular text-[9px] font-bold flex items-center justify-center">
                    {stockAlerts.shoppingList.length}
                  </span>
                )}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* ==========================================
          MODAL DE CONFIRMAÇÃO DE COMPRA (ATUALIZA PREÇO E ESTOQUE)
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
                  onChange={(e) => setRestockQuantityInput(Number(e.target.value))}
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
          MODAL DE DETALHES DA BIBLIOTECA
      ========================================== */}
      {selectedMedDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/35 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-sky-100 p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-teal-700">
                  {selectedMedDetail.category} · {selectedMedDetail.formType}
                </p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedMedDetail.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Princípio ativo: {selectedMedDetail.activeIngredient}
                </p>
              </div>
              <button
                onClick={() => setSelectedMedDetail(null)}
                className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-sky-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-2 text-xs">
              <p className="text-slate-800">
                <strong className="text-slate-900">Indicação clínica: </strong>
                {selectedMedDetail.purpose}
              </p>
              <p className="text-slate-700">
                <strong className="text-slate-900">Posologia: </strong>
                {selectedMedDetail.dosageInstruction}
              </p>
              <p className="text-slate-700">
                <strong className="text-slate-900">Regime de prescrição: </strong>
                {selectedMedDetail.controlled}
              </p>
              <p className="text-slate-700 font-mono-tabular">
                <strong className="text-slate-900 font-sans">Último preço pago: </strong>
                {formatCurrencyBRL(selectedMedDetail.lastPaidPrice)} · Estoque:{' '}
                {selectedMedDetail.currentStock}/{selectedMedDetail.boxCapacity}{' '}
                {selectedMedDetail.unitLabel}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleStartEditMedication(selectedMedDetail)}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => handleDeleteMedication(selectedMedDetail.id)}
                aria-label="Excluir medicamento"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
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
