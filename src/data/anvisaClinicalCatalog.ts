import type { ControlledType, Medication } from '../App';

export interface MedicationBula {
  id: string; // igual ao medicationId
  userId: string;
  medicationId: string;
  medicationName: string;
  activeIngredient: string;
  therapeuticClass: string;
  indications: string;
  howItWorks: string;
  contraindications: string;
  warnings: string;
  interactionsSummary: string;
  posologyGuidance: string;
  bestTimeGuidance: string;
  recommendedTimes: string[];
  administrationTips: string;
  missedDoseGuidance: string;
  adverseReactions: string;
  storageAdvice: string;
  interactingSubstances: string[];
  sourceApi: string;
  downloadedAt: string;
}

export interface AnvisaCatalogItem {
  id: string;
  name: string; // Nome comercial / apresentação padrão
  brandAliases: string[]; // Nomes comerciais conhecidos no Brasil (ex: Novalgina, Puran T4, Glifage)
  activeIngredient: string;
  therapeuticClass: string;
  category: string;
  formType: string;
  unitLabel: string;
  defaultBoxCapacity: number;
  defaultDoseAmount: number;
  defaultDoseDisplay: string;
  defaultFrequencyLabel: string;
  isContinuous: boolean;
  defaultTreatmentDays: number;
  controlled: ControlledType;
  purpose: string;
  dosageInstruction: string;
  clinicalTags: string[];
  recommendedTimes: string[];
  bestTimeGuidance: string;
  administrationTips: string;
  bula: {
    indications: string;
    howItWorks: string;
    contraindications: string;
    warnings: string;
    interactionsSummary: string;
    posologyGuidance: string;
    missedDoseGuidance: string;
    adverseReactions: string;
    storageAdvice: string;
    interactingSubstances: string[];
  };
}

export interface DrugInteractionAlert {
  id: string;
  severity: 'alta' | 'moderada' | 'horario';
  severityLabel: string;
  newMedName: string;
  newMedActiveIngredient: string;
  existingMedId: string;
  existingMedName: string;
  existingMedActiveIngredient: string;
  efficacyImpact: string;
  clinicalMechanism: string;
  recommendation: string;
  suggestedSpacingHours?: number;
}

// Regras clínicas estruturadas de interação medicamentosa (Princípios Ativos e Classes)
interface InteractionRule {
  groupA: string[];
  groupB: string[];
  severity: 'alta' | 'moderada' | 'horario';
  severityLabel: string;
  efficacyImpact: string;
  clinicalMechanism: string;
  recommendation: string;
  suggestedSpacingHours?: number;
}

export const CLINICAL_INTERACTION_RULES: InteractionRule[] = [
  {
    groupA: ['losartana', 'enalapril', 'valsartana', 'ramipril', 'captopril', 'olmesartana', 'candesartana', 'atenolol', 'propranolol', 'hidroclorotiazida', 'furosemida', 'anlodipino'],
    groupB: ['ibuprofeno', 'nimesulida', 'cetoprofeno', 'diclofenaco', 'naproxeno', 'meloxicam', 'celecoxibe', 'piroxicam', 'torsilax'],
    severity: 'alta',
    severityLabel: 'Redução de Eficácia & Risco Renal',
    efficacyImpact: 'Pode reduzir o efeito anti-hipertensivo (aumentando a pressão arterial) e sobrecarregar a função dos rins.',
    clinicalMechanism: 'Anti-inflamatórios não esteroides (AINEs) inibem prostaglandinas vasodilatadoras renais, antagonizando diretamente medicamentos para pressão arterial.',
    recommendation: 'Evite o uso contínuo de anti-inflamatórios sem aval médico. Prefira analgésicos simples (como Dipirona ou Paracetamol) caso permitido pelo seu médico e monitore a pressão arterial.'
  },
  {
    groupA: ['levotiroxina', 'puran', 'euthyrox', 'synthroid'],
    groupB: ['omeprazol', 'pantoprazol', 'esomeprazol', 'lansoprazol', 'dexlansoprazol', 'carbonato de cálcio', 'cálcio', 'sulfato ferroso', 'ferro', 'hidróxido de alumínio', 'magnésio', 'simeticona'],
    severity: 'horario',
    severityLabel: 'Alteração de Absorção (Exige Espaçamento)',
    efficacyImpact: 'Reduz significativamente a absorção da Levotiroxina no estômago/intestino, diminuindo a eficácia do controle da tireoide.',
    clinicalMechanism: 'Protetores gástricos alteram o pH estomacal e sais de ferro/cálcio formam quelatos insolúveis com o hormônio tireoidiano se administrados próximos.',
    recommendation: 'Tome a Levotiroxina em jejum absoluto pela manhã (ex: 06:30 ou 07:00) e aguarde de 1h a 4h antes de administrar protetores gástricos, cálcio ou ferro.',
    suggestedSpacingHours: 4
  },
  {
    groupA: ['rivaroxabana', 'xarelto', 'apixabana', 'varfarina', 'clopidogrel', 'ácido acetilsalicílico', 'aas', 'aspirina'],
    groupB: ['ibuprofeno', 'nimesulida', 'cetoprofeno', 'diclofenaco', 'naproxeno', 'ácido acetilsalicílico', 'aas', 'sertralina', 'escitalopram', 'fluoxetina', 'venlafaxina'],
    severity: 'alta',
    severityLabel: 'Aumento de Risco de Sangramento',
    efficacyImpact: 'Potencializa o efeito anticoagulante/antiagregante e aumenta o risco de sangramento gastrointestinal.',
    clinicalMechanism: 'Efeito sinérgico sobre a agregação plaquetária e mucosa gástrica.',
    recommendation: 'Não associe anti-inflamatórios ou AAS com anticoagulantes sem prescrição expressa. Comunique imediatamente seu médico em caso de manchas roxas ou dor estomacal.'
  },
  {
    groupA: ['clonazepam', 'rivotril', 'alprazolam', 'diazepam', 'lorazepam', 'bromazepam'],
    groupB: ['zolpidem', 'stilnox', 'amitriptilina', 'quetiapina', 'pregabalina', 'gabapentina', 'ciclobenzaprina', 'miosan', 'orfenadrina', 'dorflex', 'prometazina'],
    severity: 'alta',
    severityLabel: 'Sedação Excessiva e Potencialização no SNC',
    efficacyImpact: 'Aumenta intensamente a sonolência, tontura, risco de quedas e redução dos reflexos motores.',
    clinicalMechanism: 'Depressão aditiva do Sistema Nervoso Central (SNC) por múltiplos fármacos sedativos ou relaxantes musculares.',
    recommendation: 'Se ambos foram prescritos, concentre a administração no horário de dormir (ex: 22:00) e nunca dirija ou opere máquinas após tomar.'
  },
  {
    groupA: ['sertralina', 'escitalopram', 'fluoxetina', 'paroxetina', 'venlafaxina', 'desvenlafaxina', 'amitriptilina'],
    groupB: ['sumatriptana', 'sumax', 'naratriptana', 'zolmitriptana', 'tramadol', 'ciclobenzaprina', 'miosan'],
    severity: 'moderada',
    severityLabel: 'Interação Serotoninérgica',
    efficacyImpact: 'Pode causar agitação, taquicardia, tremores ou sudorese pelo excesso de serotonina.',
    clinicalMechanism: 'Soma de efeitos serotoninérgicos entre antidepressivos e triptanos (enxaqueca) ou relaxantes tricíclicos.',
    recommendation: 'Utilize apenas sob acompanhamento médico, respeitando rigorosamente o intervalo mínimo entre doses de crise de enxaqueca e o antidepressivo.'
  },
  {
    groupA: ['sinvastatina', 'atorvastatina', 'rosuvastatina'],
    groupB: ['azitromicina', 'claritromicina', 'ciprofloxacino', 'fluconazol', 'itraconazol', 'anlodipino'],
    severity: 'moderada',
    severityLabel: 'Aumento da Concentração da Estatina',
    efficacyImpact: 'Pode elevar os níveis sanguíneos da estatina, aumentando o risco de dores ou fadiga muscular (miopatia).',
    clinicalMechanism: 'Competição pela metabolização hepática via enzimas do citocromo P450 (CYP3A4).',
    recommendation: 'Informe seu médico caso inicie um antibiótico durante o uso contínuo de colesterol. Observe dores musculares incomuns.'
  },
  {
    groupA: ['ciprofloxacino', 'levofloxacino', 'norfloxacino', 'amoxicilina', 'azitromicina', 'cefalexina', 'doxiciclina'],
    groupB: ['carbonato de cálcio', 'cálcio', 'sulfato ferroso', 'ferro', 'magnésio', 'zinco', 'polivitamínico', 'omeprazol'],
    severity: 'horario',
    severityLabel: 'Redução da Eficácia do Antibiótico',
    efficacyImpact: 'Minerais (cálcio, ferro, magnésio) podem diminuir em até 50% a absorção do antibiótico, reduzindo sua eficácia contra a infecção.',
    clinicalMechanism: 'Formação de complexos insolúveis no trato gastrointestinal que impedem a passagem do antibiótico para o sangue.',
    recommendation: 'Administre suplementos minerais, vitaminas ou antiácidos com pelo menos 2 horas de distância do horário do antibiótico.',
    suggestedSpacingHours: 2
  },
  {
    groupA: ['losartana', 'enalapril', 'valsartana', 'ramipril', 'captopril'],
    groupB: ['espironolactona', 'cloreto de potássio'],
    severity: 'moderada',
    severityLabel: 'Retenção de Potássio (Hipercalemia)',
    efficacyImpact: 'Ambos poupam potássio no organismo; o uso conjunto exige acompanhamento laboratorial.',
    clinicalMechanism: 'Redução combinada da excreção renal de potássio via inibição do sistema renina-angiotensina-aldosterona.',
    recommendation: 'Mantenha acompanhamento médico periódico de exames de sangue (potássio e função renal) e evite substitutos de sal ricos em potássio.'
  },
  {
    groupA: ['omeprazol', 'pantoprazol', 'esomeprazol', 'lansoprazol'],
    groupB: ['clopidogrel', 'cianocobalamina', 'vitamina b12', 'sulfato ferroso'],
    severity: 'moderada',
    severityLabel: 'Redução de Ativação ou Absorção de Nutrientes',
    efficacyImpact: 'O Omeprazol pode reduzir a eficácia antiplaquetária do Clopidogrel e diminuir a absorção de Vitamina B12 e Ferro a longo prazo.',
    clinicalMechanism: 'Inibição da enzima CYP2C19 (no caso do Clopidogrel) e redução da acidez gástrica necessária para liberar ferro e vitamina B12.',
    recommendation: 'Espaçar os horários de tomada em pelo menos 2 a 4 horas. Se usar Clopidogrel, o Pantoprazol costuma ter menor interferência que o Omeprazol.'
  },
  {
    groupA: ['metformina', 'glifage', 'glibenclamida', 'gliclazida', 'dapagliflozina', 'empagliflozina'],
    groupB: ['prednisolona', 'prednisona', 'dexametasona', 'betametasona'],
    severity: 'alta',
    severityLabel: 'Redução da Eficácia Antidiabética (Elevação da Glicemia)',
    efficacyImpact: 'Corticoides como Prednisona/Prednisolona aumentam a glicose no sangue, reduzindo a eficácia da Metformina e outros antidiabéticos.',
    clinicalMechanism: 'Glicocorticoides estimulam a gliconeogênese hepática e aumentam a resistência periférica à insulina.',
    recommendation: 'Monitore a glicemia capilar com maior frequência durante os dias de uso do corticoide e avise seu médico se houver elevação acentuada.'
  },
  {
    groupA: ['saccharomyces boulardii', 'floratil'],
    groupB: ['fluconazol', 'itraconazol', 'cetoconazol', 'nistatina'],
    severity: 'alta',
    severityLabel: 'Inativação Total do Probiótico',
    efficacyImpact: 'Antifúngicos destroem o Saccharomyces boulardii (que é uma levedura probiótica), anulando sua eficácia intestinal.',
    clinicalMechanism: 'Ação antifúngica direta contra a cepa probiótica viva.',
    recommendation: 'Não tome Floratil (Saccharomyces boulardii) no mesmo horário que antifúngicos; aguarde a conclusão do antifúngico ou utilize probióticos bacterianos (Lactobacillus).'
  }
];

// Catálogo oficial ANVISA / Bulário Digital com nomes reais, princípios ativos, posologia, melhor horário e bula completa
export const ANVISA_CLINICAL_CATALOG: AnvisaCatalogItem[] = [
  {
    id: 'anvisa-dipirona-500',
    name: 'Dipirona Monoidratada 500mg',
    brandAliases: ['Novalgina 500mg', 'Anador 500mg', 'Dorona', 'Maxalgina'],
    activeIngredient: 'Dipirona Monoidratada',
    therapeuticClass: 'Analgésico e Antitérmico',
    category: 'Dor & Febre',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 20,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'De 6 em 6 horas',
    isContinuous: false,
    defaultTreatmentDays: 5,
    controlled: 'Venda Livre / Simples',
    purpose: 'Alívio rápido de dores agudas, cefaleia tensional, dores musculares e redução de estados febris.',
    dosageInstruction: 'Tomar 1 comprimido com meio copo de água a cada 6 horas, se houver dor ou febre (máximo de 4 tomadas ao dia).',
    clinicalTags: ['Dor & Febre', 'Enxaqueca'],
    recommendedTimes: ['08:00', '14:00', '20:00'],
    bestTimeGuidance: 'Pode ser iniciado imediatamente no momento da dor ou febre. Para controle regular, os horários 08:00, 14:00 e 20:00 garantem cobertura ao longo do dia sem interromper o sono profundo.',
    administrationTips: 'Engolir o comprimido inteiro com água (150 ml). Pode ser tomado com ou sem alimentos. Não exceder 4g (8 comprimidos de 500mg) em 24 horas.',
    bula: {
      indications: 'Indicado como analgésico (medicamento para dor) e antitérmico (medicamento para febre) em quadros agudos ou pós-operatórios.',
      howItWorks: 'Atua no sistema nervoso central e periférico inibindo a síntese de prostaglandinas e reduzindo a sensibilidade dos receptores de dor e o centro termorregulador hipotalâmico. O início de ação ocorre entre 30 e 60 minutos após a administração oral, durando aproximadamente 4 a 6 horas.',
      contraindications: 'Contraindicado para pacientes com alergia à dipirona ou pirazolonas, função da medula óssea prejudicada, histórico de broncoespasmo induzido por analgésicos, porfiria hepática aguda e nos últimos 3 meses de gravidez.',
      warnings: 'Suspenda o uso e procure atendimento médico caso surjam sinais de reação alérgica na pele, queda acentuada da pressão arterial ou febre persistente com dor de garganta. Pacientes com pressão baixa devem usar com cautela.',
      interactionsSummary: 'Pode reduzir os níveis sanguíneos de ciclosporina. Quando associado a clorpromazina pode provocar hipotermia grave. O uso com álcool potencializa alterações psicomotoras.',
      posologyGuidance: 'Adultos e adolescentes acima de 15 anos: 1 a 2 comprimidos de 500mg até 4 vezes ao dia, respeitando o intervalo mínimo de 6 horas entre as doses.',
      missedDoseGuidance: 'Por ser um medicamento voltado ao alívio de sintomas, tome a dose assim que lembrar caso a dor ou febre persista, respeitando o intervalo mínimo de 6 horas para a próxima dose. Nunca tome dose dupla.',
      adverseReactions: 'Pode causar hipotensão transitória (queda de pressão), reações cutâneas alérgicas (coceira ou vermelhidão) e, raramente, alterações hematológicas. A urina pode apresentar coloração avermelhada inofensiva devido ao metabólito ácido rubazônico.',
      storageAdvice: 'Conservar em temperatura ambiente (entre 15°C e 30°C), protegido da luz e da umidade, em sua embalagem original.',
      interactingSubstances: ['ciclosporina', 'clorpromazina', 'metotrexato', 'ácido acetilsalicílico']
    }
  },
  {
    id: 'anvisa-dipirona-1g',
    name: 'Dipirona Monoidratada 1g',
    brandAliases: ['Novalgina 1g', 'Dipirona 1000mg'],
    activeIngredient: 'Dipirona Monoidratada',
    therapeuticClass: 'Analgésico e Antitérmico de Alta Concentração',
    category: 'Dor & Febre',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 10,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'De 8 em 8 horas',
    isContinuous: false,
    defaultTreatmentDays: 5,
    controlled: 'Venda Livre / Simples',
    purpose: 'Controle de dores moderadas a intensas, crises de enxaqueca e febre alta.',
    dosageInstruction: 'Tomar 1 comprimido de 1g com um copo de água a cada 6 ou 8 horas (máximo de 4 comprimidos de 1g em 24 horas).',
    clinicalTags: ['Dor & Febre', 'Enxaqueca'],
    recommendedTimes: ['08:00', '16:00', '23:00'],
    bestTimeGuidance: 'Para crises de dor ou febre, iniciar imediatamente. Em regime programado de 8/8h, iniciar às 08:00 permite doses às 16:00 e 23:00, garantindo noite sem dor.',
    administrationTips: 'Tomar com bastante água. Os comprimidos de 1g possuem sulco e podem ser partidos ao meio caso o médico recomende 500mg.',
    bula: {
      indications: 'Indicado para dor aguda moderada a intensa (incluindo enxaqueca, cólicas renais/biliares e dores pós-cirúrgicas) e febre alta.',
      howItWorks: 'Promove analgesia central e periférica e ação antipirética com início de efeito entre 30 e 60 minutos após ingestão.',
      contraindications: 'Hipersensibilidade à dipirona ou derivados pirazolônicos, aplasia medular, deficiência de G6PD e terceiro trimestre gestacional.',
      warnings: 'Monitorar possível queda de pressão arterial em pacientes sensíveis ou desidratados. Não ultrapassar 4g por dia.',
      interactionsSummary: 'Pode reduzir o efeito antiplaquetário do ácido acetilsalicílico (AAS) de baixa dose quando tomado simultaneamente; espaçar em pelo menos 2 horas.',
      posologyGuidance: 'Adultos acima de 15 anos: meio a 1 comprimido de 1g até 4 vezes ao dia, com intervalos de 6 a 8 horas.',
      missedDoseGuidance: 'Tome apenas se necessitar de alívio sintomático ou no próximo horário agendado. Nunca dobre a dose.',
      adverseReactions: 'Queda transitória da pressão arterial, reações alérgicas cutâneas, suor frio e coloração avermelhada inócua na urina.',
      storageAdvice: 'Manter em local seco e fresco (15°C a 30°C), longe do alcance de crianças.',
      interactingSubstances: ['ácido acetilsalicílico', 'aas', 'ciclosporina', 'metotrexato']
    }
  },
  {
    id: 'anvisa-losartana-50',
    name: 'Losartana Potássica 50mg',
    brandAliases: ['Aradois 50mg', 'Cozaar 50mg', 'Corus 50mg', 'Zart 50mg'],
    activeIngredient: 'Losartana Potássica',
    therapeuticClass: 'Anti-hipertensivo (Antagonista do Receptor de Angiotensina II - BRA)',
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia (Manhã)',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Controle contínuo da pressão arterial (hipertensão) e proteção cardiovascular e renal.',
    dosageInstruction: 'Tomar 1 comprimido de 50mg todos os dias sempre no mesmo horário, com ou sem alimentos.',
    clinicalTags: ['Pressão Arterial', 'Uso Contínuo'],
    recommendedTimes: ['08:00'],
    bestTimeGuidance: 'O melhor horário para começar é pela manhã (às 08:00), pois a pressão arterial sofre elevação fisiológica matinal ao despertar. Caso o médico prescreva 2x ao dia (12/12h), utilize 08:00 e 20:00.',
    administrationTips: 'Tome sempre no mesmo horário para manter a pressão estável por 24 horas. Evite anti-inflamatórios (como Ibuprofeno, Nimesulida ou Diclofenaco), pois eles cortam o efeito da Losartana.',
    bula: {
      indications: 'Tratamento da hipertensão arterial sistêmica, insuficiência cardíaca e proteção renal em pacientes com diabetes tipo 2 e proteinúria.',
      howItWorks: 'Bloqueia seletivamente os receptores AT1 da angiotensina II, promovendo o relaxamento dos vasos sanguíneos e reduzindo a resistência vascular periférica e a pressão arterial de forma sustentada.',
      contraindications: 'Contraindicado durante a gravidez, em pacientes com alergia à losartana e em uso concomitante com alisquireno em pacientes diabéticos.',
      warnings: 'Não interrompa o uso mesmo que a pressão esteja normalizada. Desidratação intensa (vômitos ou diarreia) pode causar queda excessiva da pressão. Evite suplementos de potássio sem orientação.',
      interactionsSummary: 'Anti-inflamatórios não esteroides (Ibuprofeno, Nimesulida, Cetoprofeno, Diclofenaco) reduzem o efeito anti-hipertensivo da Losartana e podem prejudicar os rins. Diuréticos poupadores de potássio (Espironolactona) podem elevar o potássio no sangue.',
      posologyGuidance: 'Dose usual de manutenção: 50mg uma vez ao dia, podendo ser ajustada pelo médico para 50mg de 12 em 12 horas (100mg/dia).',
      missedDoseGuidance: 'Se esquecer uma dose, tome-a assim que lembrar no mesmo dia. Se já estiver próximo do horário da dose seguinte, pule a esquecida e siga o horário normal. Nunca tome 2 comprimidos juntos.',
      adverseReactions: 'Tontura leve ao levantar rapidamente (hipotensão postural), fadiga, congestão nasal e, raramente, elevação do potássio sérico.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da luz e umidade.',
      interactingSubstances: ['ibuprofeno', 'nimesulida', 'cetoprofeno', 'diclofenaco', 'naproxeno', 'espironolactona', 'lítio', 'torsilax']
    }
  },
  {
    id: 'anvisa-omeprazol-20',
    name: 'Omeprazol 20mg',
    brandAliases: ['Losec Mups', 'Peprazol', 'Gastrium', 'Lopigrel'],
    activeIngredient: 'Omeprazol',
    therapeuticClass: 'Inibidor da Bomba de Prótons (Protetor Gástrico)',
    category: 'Gastrointestinal',
    formType: 'Cápsula',
    unitLabel: 'cápsulas',
    defaultBoxCapacity: 28,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 cápsula',
    defaultFrequencyLabel: '1x ao dia em jejum',
    isContinuous: false,
    defaultTreatmentDays: 28,
    controlled: 'Venda Livre / Simples',
    purpose: 'Tratamento de gastrite, refluxo gastroesofágico, azia e proteção da mucosa do estômago.',
    dosageInstruction: 'Tomar 1 cápsula em jejum pela manhã, 30 minutos antes do café da manhã, com meio copo de água.',
    clinicalTags: ['Controle Gástrico'],
    recommendedTimes: ['07:00'],
    bestTimeGuidance: 'O melhor horário para tomar é às 07:00 da manhã em jejum (30 minutos antes do café da manhã). O Omeprazol precisa ser absorvido antes que o alimento ative as bombas de ácido do estômago.',
    administrationTips: 'Engula a cápsula inteira com água; nunca abra, mastigue ou esmague os microgrânulos, pois o revestimento protege o medicamento até chegar ao intestino.',
    bula: {
      indications: 'Indicado para úlcera gástrica e duodenal, esofagite de refluxo, doença do refluxo gastroesofágico (DRGE), dispepsia ácida e prevenção de lesões gástricas por medicamentos.',
      howItWorks: 'Inibe especificamente a enzima H+/K+-ATPase (bomba de prótons) nas células parietais do estômago, reduzindo de forma potente a secreção diária de ácido clorídrico.',
      contraindications: 'Hipersensibilidade ao omeprazol ou a outros benzimidazóis substituídos, e uso concomitante com nelfinavir.',
      warnings: 'O uso prolongado por muitos meses sem reavaliação médica pode reduzir a absorção de Vitamina B12, magnésio e cálcio. Respeite rigorosamente o jejum de 30 minutos antes da refeição.',
      interactionsSummary: 'Pode diminuir a absorção de Levotiroxina, Sulfato Ferroso, Cetoconazol e Itraconazol (espaçar em pelo menos 2 a 4 horas). Reduz a conversão ativa do antiplaquetário Clopidogrel.',
      posologyGuidance: '1 cápsula de 20mg uma vez ao dia, em jejum, antes do desjejum, por 14 a 28 dias ou conforme prescrição médica.',
      missedDoseGuidance: 'Caso esqueça de tomar antes do café da manhã, tome 30 minutos antes do almoço. Não tome dose dobrada.',
      adverseReactions: 'Cefaleia leve, gases, constipação ou diarreia transitória e náusea ocasional.',
      storageAdvice: 'Manter no frasco ou blíster original bem fechado, protegido do calor e umidade (15°C a 30°C).',
      interactingSubstances: ['levotiroxina', 'clopidogrel', 'sulfato ferroso', 'cetoconazol', 'itraconazol', 'cianocobalamina']
    }
  },
  {
    id: 'anvisa-levotiroxina-50',
    name: 'Levotiroxina Sódica 50mcg',
    brandAliases: ['Puran T4 50mcg', 'Euthyrox 50mcg', 'Synthroid 50mcg', 'Levoid'],
    activeIngredient: 'Levotiroxina Sódica',
    therapeuticClass: 'Hormônio Tireoidiano',
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia em jejum absoluto',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Reposição hormonal da tireoide (tratamento do hipotireoidismo).',
    dosageInstruction: 'Tomar 1 comprimido em jejum absoluto pela manhã, aguardando de 30 a 60 minutos antes de tomar café da manhã ou outros remédios.',
    clinicalTags: ['Uso Contínuo'],
    recommendedTimes: ['06:30'],
    bestTimeGuidance: 'O horário ideal é logo ao acordar (ex: 06:30 ou 07:00), em jejum absoluto, apenas com água pura. Aguardar pelo menos 30 a 60 minutos antes de ingerir café, leite, pão ou outros medicamentos.',
    administrationTips: 'Café expresso, leite, fibras, soja, Omeprazol, Cálcio e Ferro impedem a absorção da Levotiroxina se tomados juntos. Espaçar suplementos de ferro/cálcio em pelo menos 4 horas.',
    bula: {
      indications: 'Terapia de reposição ou suplementação hormonal em pacientes com hipotireoidismo de qualquer etiologia e supressão do TSH.',
      howItWorks: 'Fornece o hormônio tiroxina (T4) sintético idêntico ao produzido pela glândula tireoide humana, regularizando o metabolismo basal, energia corporal, frequência cardíaca e temperatura.',
      contraindications: 'Hipersensibilidade aos componentes, infarto agudo do miocárdio recente, tireotoxicose não tratada e insuficiência adrenal descompensada.',
      warnings: 'É um medicamento de índice terapêutico estreito: mantenha sempre a mesma marca ou valide com seu endocrinologista antes de trocar, e respeite rigorosamente o jejum matinal.',
      interactionsSummary: 'Carbonato de cálcio, sulfato ferroso, antiácidos, simeticona e inibidores de bomba de prótons (omeprazol/pantoprazol) reduzem drasticamente a absorção da levotiroxina se administrados próximos.',
      posologyGuidance: 'Dose individualizada conforme exames de TSH e T4 livre, administrada em dose única diária pela manhã, 30 a 60 minutos antes do café da manhã.',
      missedDoseGuidance: 'Se esquecer de tomar pela manhã e já tiver tomado café, tome após 3 horas sem comer ou no dia seguinte no horário habitual. Não dobre a dose sem orientação médica.',
      adverseReactions: 'Quando na dose correta, não costuma causar reações. Doses excessivas podem provocar palpitações, insônia, nervosismo, suor excessivo e perda de peso.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da luz e da umidade.',
      interactingSubstances: ['omeprazol', 'pantoprazol', 'esomeprazol', 'carbonato de cálcio', 'sulfato ferroso', 'simeticona']
    }
  },
  {
    id: 'anvisa-amoxicilina-clavulanato-875',
    name: 'Amoxicilina + Clavulanato 875mg + 125mg',
    brandAliases: ['Clavulin BD 875mg', 'Novamox 2X', 'Sigma-Clav BD', 'Sinot Clav'],
    activeIngredient: 'Amoxicilina Tri-hidratada + Clavulanato de Potássio',
    therapeuticClass: 'Antibiótico Penicilínico com Inibidor de Beta-lactamase',
    category: 'Receita Retida',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 14,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'De 12 em 12 horas',
    isContinuous: false,
    defaultTreatmentDays: 7,
    controlled: 'Receita Retida (Branca C1/Antibiótico)',
    purpose: 'Tratamento de infecções bacterianas respiratórias (sinusite, amigdalite, otite, pneumonia), urinárias e dentárias.',
    dosageInstruction: 'Tomar 1 comprimido exatamente a cada 12 horas, no início de uma refeição, até completar todos os dias prescritos.',
    clinicalTags: ['Antibiótico', 'Receita Retida'],
    recommendedTimes: ['08:00', '20:00'],
    bestTimeGuidance: 'Os melhores horários são 08:00 (junto ao café da manhã) e 20:00 (junto ao jantar). Tomar no início da refeição melhora a absorção do clavulanato e reduz desconfortos estomacais ou diarreia.',
    administrationTips: 'Nunca interrompa o antibiótico antes do fim dos dias prescritos, mesmo que os sintomas desapareçam no 3º dia, para evitar resistência bacteriana. Tome no início da refeição.',
    bula: {
      indications: 'Tratamento de infecções bacterianas do trato respiratório superior e inferior (sinusite aguda, otite média, amigdalite, bronquite, pneumonia), infecções urinárias e de pele.',
      howItWorks: 'A amoxicilina destrói a parede celular das bactérias sensíveis, enquanto o ácido clavulânico bloqueia as enzimas beta-lactamases produzidas por bactérias resistentes.',
      contraindications: 'Contraindicado para pacientes com histórico de alergia a penicilinas, cefalosporinas ou icterícia/disfunção hepática associada ao medicamento.',
      warnings: 'Mantenha hidratação adequada durante o tratamento. Caso ocorra diarreia intensa ou placas avermelhadas na pele (urticária), comunique imediatamente seu médico.',
      interactionsSummary: 'Pode reduzir a eficácia de anticoncepcionais orais e interagir com alopurinol (aumentando risco de reação cutânea) e anticoagulantes orais.',
      posologyGuidance: 'Adultos: 1 comprimido de 875mg/125mg a cada 12 horas (2 vezes ao dia) por 7 a 14 dias, administrado no início das refeições.',
      missedDoseGuidance: 'Tome a dose esquecida assim que lembrar. Porém, se faltarem menos de 4 horas para a próxima dose, aguarde o horário seguinte e mantenha o intervalo de 12 horas. Não tome 2 comprimidos de uma vez.',
      adverseReactions: 'Diarreia leve, náusea, desconforto abdominal (reduzidos quando tomado no início da refeição) e candidíase mucocutânea.',
      storageAdvice: 'Manter os comprimidos no envelope laminado fechado, em local seco (abaixo de 25°C). Após aberto o envelope, consumir em até 14 dias.',
      interactingSubstances: ['alopurinol', 'varfarina', 'rivaroxabana', 'metotrexato', 'carbonato de cálcio', 'sulfato ferroso']
    }
  },
  {
    id: 'anvisa-ibuprofeno-600',
    name: 'Ibuprofeno 600mg',
    brandAliases: ['Alivium 600mg', 'Advil', 'Buscofem', 'Motrin'],
    activeIngredient: 'Ibuprofeno',
    therapeuticClass: 'Anti-inflamatório Não Esteroide (AINE), Analgésico e Antitérmico',
    category: 'Dor & Febre',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 20,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'De 8 em 8 horas',
    isContinuous: false,
    defaultTreatmentDays: 5,
    controlled: 'Venda Livre / Simples',
    purpose: 'Redução de inflamações, dores articulares, dores de garganta, dores odontológicas e cólicas.',
    dosageInstruction: 'Tomar 1 comprimido a cada 8 horas, sempre logo após uma refeição ou lanche para proteger o estômago.',
    clinicalTags: ['Dor & Febre'],
    recommendedTimes: ['08:00', '16:00', '23:00'],
    bestTimeGuidance: 'Inicie sempre após uma refeição (ex: 08:00 após o café da manhã, 16:00 após o lanche e 23:00 com leite ou biscoito). Nunca tome de estômago vazio.',
    administrationTips: 'Tomar sempre após comer para evitar gastrite. Atenção: se você toma remédios para pressão alta (como Losartana ou Enalapril), o Ibuprofeno pode reduzir a eficácia deles.',
    bula: {
      indications: 'Alívio de processos inflamatórios musculoesqueléticos, dor de garganta, dor dentária, dismenorreia (cólica menstrual), cefaleia e febre.',
      howItWorks: 'Inibe a enzima ciclo-oxigenase (COX-1 e COX-2), bloqueando a síntese de prostaglandinas mediadoras da inflamação, dor e febre.',
      contraindications: 'Úlcera péptica ativa, sangramento gastrointestinal, insuficiência renal ou cardíaca grave, histórico de asma induzida por AAS e terceiro trimestre de gestação.',
      warnings: 'Utilizar pelo menor tempo necessário (geralmente 3 a 5 dias). O uso prolongado aumenta o risco de gastrite, úlcera e sobrecarga renal.',
      interactionsSummary: 'Reduz o efeito de anti-hipertensivos (Losartana, Enalapril, Hidroclorotiazida, Furosemida). Aumenta o risco de sangramento quando combinado com AAS, Rivaroxabana, Clopidogrel, Corticoides ou Sertralina/Escitalopram.',
      posologyGuidance: 'Adultos: 1 comprimido de 600mg de 8 em 8 horas (3 vezes ao dia), preferencialmente após as refeições. Dose máxima diária: 2.400mg.',
      missedDoseGuidance: 'Se esquecer uma dose e ainda houver dor/inflamação, tome após se alimentar, ajustando o próximo horário para manter 8h de intervalo.',
      adverseReactions: 'Azia, dor epigástrica, náusea, retenção de líquidos e leve elevação da pressão arterial.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da umidade.',
      interactingSubstances: ['losartana', 'enalapril', 'valsartana', 'hidroclorotiazida', 'furosemida', 'rivaroxabana', 'ácido acetilsalicílico', 'aas', 'sertralina', 'escitalopram', 'prednisona']
    }
  },
  {
    id: 'anvisa-sinvastatina-20',
    name: 'Sinvastatina 20mg',
    brandAliases: ['Zocor 20mg', 'Sinvascor', 'Clinfar'],
    activeIngredient: 'Sinvastatina',
    therapeuticClass: 'Hipolipemiante (Estatina - Redutor de Colesterol)',
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia à noite',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Redução do colesterol LDL, triglicerídeos e prevenção de eventos cardiovasculares.',
    dosageInstruction: 'Tomar 1 comprimido em dose única diária à noite (junto ou após o jantar, por volta das 21:00).',
    clinicalTags: ['Uso Contínuo'],
    recommendedTimes: ['21:00'],
    bestTimeGuidance: 'O melhor horário para tomar a Sinvastatina é à noite (21:00), pois a maior produção natural de colesterol pelo fígado ocorre durante a madrugada.',
    administrationTips: 'Tome todos os dias à noite. Evite o consumo de suco de toranja (grapefruit) e informe seu médico caso surjam dores musculares inexplicáveis.',
    bula: {
      indications: 'Redução dos níveis elevados de colesterol total, LDL-colesterol e triglicerídeos, e prevenção de infarto e AVC em pacientes com risco cardiovascular.',
      howItWorks: 'Inibe a enzima HMG-CoA redutase no fígado, principal responsável pela síntese de colesterol, cuja atividade biológica é máxima no período noturno.',
      contraindications: 'Doença hepática ativa, elevação persistente das transaminases, gravidez e amamentação.',
      warnings: 'Comunique ao médico caso apresente dor, sensibilidade ou fraqueza muscular difusa sem causa aparente.',
      interactionsSummary: 'Antibióticos macrolídeos (claritromicina, azitromicina), antifúngicos azólicos (itraconazol, cetoconazol) e anlodipino em altas doses aumentam a concentração da sinvastatina no sangue.',
      posologyGuidance: '1 comprimido de 20mg (ou conforme prescrição de 10mg a 40mg) em dose única à noite.',
      missedDoseGuidance: 'Se esquecer de tomar à noite, não tome pela manhã seguinte; aguarde o horário noturno habitual do dia seguinte.',
      adverseReactions: 'Mialgia (dor muscular leve), cefaleia, constipação e alterações leves nas enzimas hepáticas.',
      storageAdvice: 'Manter em temperatura ambiente (15°C a 30°C), protegido da luz e umidade.',
      interactingSubstances: ['azitromicina', 'claritromicina', 'itraconazol', 'fluconazol', 'anlodipino', 'ciprofloxacino']
    }
  },
  {
    id: 'anvisa-rosuvastatina-10',
    name: 'Rosuvastatina Cálcica 10mg',
    brandAliases: ['Crestor 10mg', 'Rosucor 10mg', 'Plenance 10mg', 'Trezor'],
    activeIngredient: 'Rosuvastatina Cálcica',
    therapeuticClass: 'Hipolipemiante de Alta Potência (Estatina)',
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia (Noite)',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Controle rigoroso do colesterol LDL, aumento do HDL e proteção arterial.',
    dosageInstruction: 'Tomar 1 comprimido uma vez ao dia, preferencialmente à noite, com ou sem alimentos.',
    clinicalTags: ['Uso Contínuo'],
    recommendedTimes: ['21:00'],
    bestTimeGuidance: 'Embora tenha meia-vida longa (19 horas), tomar às 21:00 ajuda a criar rotina fixa noturna e sincroniza com o pico de síntese hepática de colesterol.',
    administrationTips: 'Se você utiliza antiácidos com hidróxido de alumínio ou magnésio, aguarde pelo menos 2 horas após tomar a Rosuvastatina.',
    bula: {
      indications: 'Tratamento da hipercolesterolemia primária, dislipidemia mista e prevenção de eventos cardiovasculares maiores.',
      howItWorks: 'Estatina seletiva de longa duração que aumenta o número de receptores hepáticos de LDL na superfície celular, acelerando a remoção do colesterol do sangue.',
      contraindications: 'Doença hepática ativa, insuficiência renal grave, gravidez e lactação.',
      warnings: 'Evite consumo excessivo de bebidas alcoólicas e comunique dores musculares persistentes.',
      interactionsSummary: 'Antiácidos contendo alumínio e magnésio reduzem a concentração plasmática da rosuvastatina se tomados simultaneamente (espaçar em 2 horas).',
      posologyGuidance: '1 comprimido de 10mg uma vez ao dia, a qualquer hora do dia (preferencialmente à noite), com ou sem alimentos.',
      missedDoseGuidance: 'Tome no próximo horário programado. Não tome duas doses ao mesmo tempo.',
      adverseReactions: 'Cefaleia, mialgia eventual, astenia e desconforto gastrointestinal leve.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), na embalagem original.',
      interactingSubstances: ['hidróxido de alumínio', 'magnésio', 'varfarina', 'ciclosporina']
    }
  },
  {
    id: 'anvisa-metformina-500-xr',
    name: 'Cloridrato de Metformina 500mg XR',
    brandAliases: ['Glifage XR 500mg', 'Dimefor', 'Glucoformin'],
    activeIngredient: 'Cloridrato de Metformina',
    therapeuticClass: 'Antidiabético Oral (Biguanida de Liberação Prolongada)',
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia no jantar',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Controle da glicemia no diabetes tipo 2, pré-diabetes e resistência à insulina.',
    dosageInstruction: 'Tomar 1 comprimido junto com o jantar (nunca partir ou mastigar o comprimido XR).',
    clinicalTags: ['Uso Contínuo'],
    recommendedTimes: ['20:00'],
    bestTimeGuidance: 'O melhor horário para a Metformina XR (liberação prolongada) é às 20:00, durante ou imediatamente após o jantar. Isso reduz em mais de 70% qualquer desconforto gastrointestinal e controla a glicemia de jejum matinal.',
    administrationTips: 'Engula o comprimido XR inteiro com água durante a refeição. Nunca parta ou mastigue, pois isso destrói a matriz de liberação lenta.',
    bula: {
      indications: 'Tratamento do diabetes mellitus tipo 2, síndrome dos ovários policísticos (SOP) e prevenção do diabetes em pacientes com pré-diabetes.',
      howItWorks: 'Reduz a produção hepática de glicose (gliconeogênese), diminui a absorção intestinal de açúcares e melhora a sensibilidade periférica à insulina sem causar hipoglicemia isolada.',
      contraindications: 'Insuficiência renal grave, cetoacidose diabética, desidratação aguda e insuficiência cardíaca ou hepática descompensada.',
      warnings: 'Caso vá realizar exame de imagem com contraste iodado, informe o médico para suspensão temporária de 48h. O uso por muitos anos requer monitoramento de Vitamina B12.',
      interactionsSummary: 'Corticoides (Prednisona, Prednisolona, Dexametasona) e diuréticos tiazídicos elevam a glicose no sangue e podem reduzir a eficácia da Metformina. Evitar consumo de álcool.',
      posologyGuidance: '1 a 2 comprimidos de 500mg XR uma vez ao dia, sempre junto com o jantar.',
      missedDoseGuidance: 'Se esquecer de tomar no jantar, não tome em jejum; aguarde a próxima refeição principal ou o jantar seguinte.',
      adverseReactions: 'No início do tratamento pode causar leve desconforto abdominal ou alteração do trânsito intestinal, que desaparecem ao tomar junto com a refeição.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da umidade.',
      interactingSubstances: ['prednisona', 'prednisolona', 'dexametasona', 'hidroclorotiazida', 'furosemida']
    }
  },
  {
    id: 'anvisa-sertralina-50',
    name: 'Cloridrato de Sertralina 50mg',
    brandAliases: ['Zoloft 50mg', 'Assert 50mg', 'Tolrest 50mg', 'Serenata 50mg'],
    activeIngredient: 'Cloridrato de Sertralina',
    therapeuticClass: 'Antidepressivo e Ansiolítico (ISRS - Inibidor Seletivo de Recaptação de Serotonina)',
    category: 'Receita Retida',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia (Manhã)',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Receita Retida (Branca C1/Antibiótico)',
    purpose: 'Tratamento da ansiedade, depressão, síndrome do pânico e regulação do humor.',
    dosageInstruction: 'Tomar 1 comprimido de 50mg uma vez ao dia pela manhã, logo após o café da manhã.',
    clinicalTags: ['Receita Retida', 'Uso Contínuo'],
    recommendedTimes: ['08:00'],
    bestTimeGuidance: 'O melhor horário para começar é às 08:00 da manhã, logo após o café da manhã. Tomar pela manhã evita insônia noturna e tomar com alimento evita náusea nos primeiros dias.',
    administrationTips: 'Não interrompa o uso abruptamente sem orientação médica. O efeito pleno na ansiedade e humor se consolida após 2 a 4 semanas de uso diário contínuo.',
    bula: {
      indications: 'Transtorno depressivo maior, transtorno de ansiedade generalizada e social, síndrome do pânico, TOC e transtorno de estresse pós-traumático.',
      howItWorks: 'Inibe seletivamente a recaptação neuronal de serotonina (5-HT) no sistema nervoso central, aumentando sua disponibilidade sináptica e restaurando o equilíbrio neuroquímico.',
      contraindications: 'Uso concomitante com inibidores da monoaminoxidase (IMAO) ou pimozida, e hipersensibilidade à sertralina.',
      warnings: 'Não suspenda de forma repentina para evitar sintomas de descontinuação (tontura, formigamento, irritabilidade). Evite bebidas alcoólicas.',
      interactionsSummary: 'Aumenta o risco de sangramento gástrico quando associada a anti-inflamatórios (Ibuprofeno, Nimesulida, AAS) ou anticoagulantes. Pode interagir com triptanos para enxaqueca (Sumatriptana) e Tramadol.',
      posologyGuidance: 'Dose inicial usual de 50mg uma vez ao dia, pela manhã (ou à noite caso cause sonolência), preferencialmente com alimentos.',
      missedDoseGuidance: 'Tome assim que lembrar no mesmo dia. Se já estiver perto do horário do dia seguinte, pule a dose esquecida. Nunca dobre a dose.',
      adverseReactions: 'Nos primeiros 7 a 10 dias podem ocorrer náusea leve, boca seca, cefaleia ou leve alteração do sono, que costumam regredir espontaneamente.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da luz e umidade.',
      interactingSubstances: ['ibuprofeno', 'nimesulida', 'ácido acetilsalicílico', 'aas', 'rivaroxabana', 'sumatriptana', 'tramadol', 'ciclobenzaprina']
    }
  },
  {
    id: 'anvisa-escitalopram-10',
    name: 'Oxalato de Escitalopram 10mg',
    brandAliases: ['Lexapro 10mg', 'Reconter 10mg', 'Exodus 10mg', 'Espran 10mg'],
    activeIngredient: 'Oxalato de Escitalopram',
    therapeuticClass: 'Antidepressivo e Ansiolítico Seletivo (ISRS)',
    category: 'Receita Retida',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia (Manhã)',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Receita Retida (Branca C1/Antibiótico)',
    purpose: 'Controle da ansiedade generalizada, prevenção de ataques de pânico e equilíbrio do humor.',
    dosageInstruction: 'Tomar 1 comprimido de 10mg uma vez ao dia, sempre no mesmo horário, com ou sem alimentos.',
    clinicalTags: ['Receita Retida', 'Uso Contínuo'],
    recommendedTimes: ['08:00'],
    bestTimeGuidance: 'Recomenda-se iniciar às 08:00 da manhã após o café. Caso você sinta leve sonolência diurna na primeira semana, o horário pode ser transferido para as 20:00.',
    administrationTips: 'Mantenha regularidade diária. Nos primeiros 5 dias, alguns médicos orientam iniciar com meio comprimido (5mg) antes de passar para 10mg.',
    bula: {
      indications: 'Tratamento e prevenção de recaída de depressão, transtorno do pânico, transtorno de ansiedade generalizada (TAG) e ansiedade social.',
      howItWorks: 'É o isômero S puro e altamente seletivo na inibição da recaptação de serotonina, apresentando baixa interação com outros receptores cerebrais.',
      contraindications: 'Uso concomitante com IMAOs, pacientes com prolongamento conhecido do intervalo QT cardíaco e hipersensibilidade ao fármaco.',
      warnings: 'Não interromper o tratamento sem desmame orientado pelo médico, mesmo ao sentir melhora completa.',
      interactionsSummary: 'Cautela ao associar com anti-inflamatórios (Ibuprofeno, Nimesulida), anticoagulantes (Rivaroxabana, AAS), medicamentos para enxaqueca (Sumatriptana) e Omeprazol em altas doses.',
      posologyGuidance: 'Dose habitual de 10mg uma vez ao dia, podendo ser ajustada até 20mg/dia conforme avaliação médica.',
      missedDoseGuidance: 'Se lembrar antes de dormir, tome a dose. Se lembrar apenas no dia seguinte, siga o horário normal sem dobrar.',
      adverseReactions: 'Náusea transitória na primeira semana, bocejos, boca seca ou sudorese leve.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), na embalagem original.',
      interactingSubstances: ['ibuprofeno', 'nimesulida', 'ácido acetilsalicílico', 'rivaroxabana', 'sumatriptana', 'omeprazol']
    }
  },
  {
    id: 'anvisa-clonazepam-2',
    name: 'Clonazepam 2mg',
    brandAliases: ['Rivotril 2mg', 'Clopam', 'Navotrax'],
    activeIngredient: 'Clonazepam',
    therapeuticClass: 'Ansiolítico e Anticonvulsivante (Benzodiazepínico)',
    category: 'Receita Retida',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia à noite',
    isContinuous: false,
    defaultTreatmentDays: 30,
    controlled: 'Receita Azul (Notificação B)',
    purpose: 'Controle de crises agudas de ansiedade, transtorno do pânico, insônia associada à ansiedade e distúrbios epilépticos.',
    dosageInstruction: 'Tomar a dose prescrita à noite, cerca de 30 a 40 minutos antes de deitar.',
    clinicalTags: ['Receita Retida'],
    recommendedTimes: ['22:00'],
    bestTimeGuidance: 'O melhor horário para tomar é às 22:00 (30 minutos antes de dormir), já deitado ou pronto para repousar, pois induz relaxamento muscular e sonolência.',
    administrationTips: 'Evite dirigir, operar máquinas ou ingerir qualquer bebida alcoólica. Não misture com outros indutores do sono (como Zolpidem) ou relaxantes musculares sem ordem médica.',
    bula: {
      indications: 'Transtornos de ansiedade, síndrome do pânico, crises epilépticas e espasmos musculares de origem central.',
      howItWorks: 'Potencializa a ação inibitória do neurotransmissor GABA no sistema nervoso central, reduzindo a hiperexcitabilidade neuronal e promovendo efeito calmante e sedativo.',
      contraindications: 'Insuficiência respiratória grave, comprometimento hepático severo, glaucoma agudo de ângulo fechado e histórico de apneia do sono grave.',
      warnings: 'Medicamento sujeito a controle especial (Notificação de Receita B - Azul): o uso prolongado pode causar dependência física e tolerância. A retirada deve ser sempre gradual.',
      interactionsSummary: 'Forte interação aditiva com Zolpidem, Amitriptilina, Quetiapina, Pregabalina, relaxantes musculares (Ciclobenzaprina/Miosan, Orfenadrina/Dorflex), anti-histamínicos sedativos e álcool.',
      posologyGuidance: 'Dose individualizada conforme prescrição médica, geralmente administrada ao deitar.',
      missedDoseGuidance: 'Se esquecer de tomar à noite e já tiver amanhecido, não tome pela manhã para evitar sonolência intensa durante o dia.',
      adverseReactions: 'Sonolência, redução da coordenação motora, tontura ao despertar e fadiga muscular.',
      storageAdvice: 'Manter em local seguro, fora do alcance de terceiros e crianças, entre 15°C e 30°C.',
      interactingSubstances: ['zolpidem', 'amitriptilina', 'quetiapina', 'pregabalina', 'gabapentina', 'ciclobenzaprina', 'orfenadrina', 'dorflex']
    }
  },
  {
    id: 'anvisa-sumatriptana-50',
    name: 'Succinato de Sumatriptana 50mg',
    brandAliases: ['Sumax 50mg', 'Imigran 50mg', 'Sumaxpro'],
    activeIngredient: 'Succinato de Sumatriptana',
    therapeuticClass: 'Antienxaquecoso Específico (Agonista Seletivo de Serotonina 5-HT1)',
    category: 'Enxaqueca',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 4,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'No início da crise de enxaqueca',
    isContinuous: false,
    defaultTreatmentDays: 4,
    controlled: 'Venda Livre / Simples',
    purpose: 'Abortar crises agudas de enxaqueca (com ou sem aura) logo nos primeiros sinais de dor.',
    dosageInstruction: 'Tomar 1 comprimido de 50mg logo no início da crise de enxaqueca. Se necessário, uma segunda dose pode ser tomada após no mínimo 2 horas.',
    clinicalTags: ['Enxaqueca'],
    recommendedTimes: ['08:00'],
    bestTimeGuidance: 'A eficácia máxima ocorre quando tomado nos primeiros 15 a 30 minutos do início da dor de cabeça da enxaqueca. Não deve ser usado preventivamente sem dor.',
    administrationTips: 'Engolir o comprimido inteiro com água e permanecer em ambiente calmo e com pouca luz por 30 minutos. Respeite o intervalo mínimo de 2 horas caso precise repetir.',
    bula: {
      indications: 'Alívio agudo das crises de enxaqueca com ou sem aura em adultos.',
      howItWorks: 'Atua seletivamente nos receptores vasculares 5-HT1B/1D, promovendo a constrição dos vasos sanguíneos cranianos dilatados durante a crise de enxaqueca e inibindo a inflamação neurogênica do nervo trigêmeo.',
      contraindications: 'Hipertensão arterial não controlada, histórico de infarto, angina, AVC, doença vascular periférica e uso concomitante de ergotamina ou IMAOs.',
      warnings: 'Não utilizar para prevenção diária; o uso excessivo (mais de 10 dias por mês) pode causar cefaleia por uso excessivo de analgésicos.',
      interactionsSummary: 'Pode apresentar interação serotoninérgica quando associado a antidepressivos (Sertralina, Escitalopram, Fluoxetina, Venlafaxina, Amitriptilina). Proibido associar com derivados da ergotamina (Ormigrein/Cefalium) nas mesmas 24 horas.',
      posologyGuidance: '1 comprimido de 50mg ao surgir a crise. Dose máxima em 24 horas: 200mg, com intervalo mínimo de 2 horas entre tomadas.',
      missedDoseGuidance: 'Por ser medicação de resgate para crise aguda, administra-se apenas na presença de sintomas.',
      adverseReactions: 'Sensação transitória de calor, formigamento ou leve pressão no tórax/pescoço (que costumam passar em poucos minutos), tontura e sonolência.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da luz.',
      interactingSubstances: ['sertralina', 'escitalopram', 'fluoxetina', 'venlafaxina', 'amitriptilina', 'ergotamina', 'di-hidroergotamina']
    }
  },
  {
    id: 'anvisa-vitamina-d3-7000',
    name: 'Colecalciferol (Vitamina D3) 7.000 UI',
    brandAliases: ['Addera D3 7.000 UI', 'Depura', 'Doss', 'Sany D'],
    activeIngredient: 'Colecalciferol (Vitamina D3)',
    therapeuticClass: 'Suplemento Vitamínico Lipossolúvel e Regulador do Metabolismo Ósseo',
    category: 'Vitaminas',
    formType: 'Cápsula',
    unitLabel: 'cápsulas',
    defaultBoxCapacity: 12,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 cápsula',
    defaultFrequencyLabel: '1x ao dia ou semanal (no almoço)',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Suplementação e tratamento da deficiência de Vitamina D, fortalecimento ósseo e suporte imunológico.',
    dosageInstruction: 'Tomar 1 cápsula junto com a principal refeição do dia (almoço), pois a Vitamina D precisa de gorduras boas da alimentação para ser absorvida.',
    clinicalTags: ['Vitaminas', 'Suplementação'],
    recommendedTimes: ['12:30'],
    bestTimeGuidance: 'O melhor horário para tomar Vitamina D3 é às 12:30 (durante ou logo após o almoço). Por ser uma vitamina lipossolúvel (solúvel em gordura), tomá-la no almoço aumenta sua absorção intestinal em até 50% em comparação ao jejum.',
    administrationTips: 'Nunca tome Vitamina D em jejum com água apenas; tome sempre junto ao almoço ou jantar.',
    bula: {
      indications: 'Prevenção e tratamento auxiliar na desmineralização óssea, osteoporose, hipovitaminose D e manutenção do sistema imune e muscular.',
      howItWorks: 'Atua na regulação positiva do transporte e absorção intestinal de cálcio e fósforo, essencial para a mineralização óssea e função neuromuscular.',
      contraindications: 'Hipercalcemia (excesso de cálcio no sangue), hipervitaminose D e osteodistrofia renal com hiperfosfatemia.',
      warnings: 'Respeite a dose e periodicidade (diária ou semanal) indicada pelo médico conforme seus níveis sanguíneos de 25(OH)D.',
      interactionsSummary: 'Colestiramina e óleo mineral reduzem a absorção intestinal da Vitamina D. Diuréticos tiazídicos (Hidroclorotiazida) associados a altas doses podem aumentar o cálcio sanguíneo.',
      posologyGuidance: 'Ingerir com água junto à refeição principal (almoço), na frequência prescrita pelo médico.',
      missedDoseGuidance: 'Se esquecer de tomar no almoço, tome junto com o jantar no mesmo dia.',
      adverseReactions: 'Nas doses recomendadas é muito bem tolerada e não apresenta efeitos adversos.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da luz e umidade.',
      interactingSubstances: ['colestiramina', 'orlistate']
    }
  },
  {
    id: 'anvisa-vitamina-b12-1000',
    name: 'Cianocobalamina / Mecobalamina (Vitamina B12) 1.000mcg',
    brandAliases: ['Citoneurin', 'B12 Sublingual', 'Mecobalamina'],
    activeIngredient: 'Cianocobalamina',
    therapeuticClass: 'Vitamina Neurotrófica e Hematopoiética (Complexo B)',
    category: 'Vitaminas',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia (Manhã)',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Reposição de Vitamina B12, saúde neurológica, memória, disposição e formação de glóbulos vermelhos.',
    dosageInstruction: 'Tomar 1 comprimido pela manhã (se for sublingual, deixar dissolver sob a língua sem engolir).',
    clinicalTags: ['Vitaminas', 'Suplementação'],
    recommendedTimes: ['08:30'],
    bestTimeGuidance: 'O melhor horário é pela manhã (08:30), pois a Vitamina B12 participa do metabolismo energético celular e dá mais disposição para o dia.',
    administrationTips: 'Se você usa Omeprazol ou Metformina continuamente, afaste o horário da Vitamina B12 em pelo menos 2 horas para melhor aproveitamento.',
    bula: {
      indications: 'Prevenção e tratamento da deficiência de Vitamina B12, anemias megaloblásticas e suporte em neuropatias periféricas.',
      howItWorks: 'Essencial para a síntese de mielina nos nervos periféricos e centrais, síntese de DNA e maturação das células sanguíneas.',
      contraindications: 'Hipersensibilidade ao cobalto ou à vitamina B12 e doença de Leber.',
      warnings: 'Pacientes em uso prolongado de protetores gástricos (Omeprazol) ou Metformina têm maior necessidade de acompanhamento dos níveis de B12.',
      interactionsSummary: 'Inibidores da bomba de prótons (Omeprazol, Pantoprazol) e Metformina diminuem a absorção gastrointestinal da cianocobalamina oral comum.',
      posologyGuidance: '1 comprimido ao dia pela manhã, conforme orientação médica ou nutricional.',
      missedDoseGuidance: 'Tome assim que lembrar durante o dia.',
      adverseReactions: 'Raramente pode provocar erupções acneiformes em doses muito elevadas.',
      storageAdvice: 'Manter protegido da luz e umidade (15°C a 30°C).',
      interactingSubstances: ['omeprazol', 'pantoprazol', 'metformina']
    }
  },
  {
    id: 'anvisa-sulfato-ferroso-40',
    name: 'Sulfato Ferroso 40mg (Ferro Elementar)',
    brandAliases: ['Neutrofer', 'Noripurum', 'Combiron'],
    activeIngredient: 'Sulfato Ferroso',
    therapeuticClass: 'Antianêmico (Suplemento de Ferro)',
    category: 'Vitaminas',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia (30 min antes do almoço)',
    isContinuous: false,
    defaultTreatmentDays: 60,
    controlled: 'Venda Livre / Simples',
    purpose: 'Tratamento e prevenção da anemia ferropriva e reposição dos estoques de ferritina.',
    dosageInstruction: 'Tomar 1 comprimido 30 minutos antes do almoço, preferencialmente com água ou suco de laranja/limão (rico em Vitamina C).',
    clinicalTags: ['Vitaminas', 'Suplementação'],
    recommendedTimes: ['11:30'],
    bestTimeGuidance: 'O melhor horário para tomar Ferro é às 11:30 (30 minutos antes do almoço) acompanhado de suco cítrico (Vitamina C), longe do café da manhã e de medicamentos da manhã como Levotiroxina ou Omeprazol.',
    administrationTips: 'Não tome com leite, queijo, café, chá preto ou refrigerantes, pois o cálcio e a cafeína bloqueiam a absorção do ferro. Afaste em 4 horas da Levotiroxina e 2 horas de antibióticos.',
    bula: {
      indications: 'Tratamento da anemia por deficiência de ferro e reposição de ferritina sérica.',
      howItWorks: 'Fornece ferro essencial para a síntese de hemoglobina nos eritrócitos e mioglobina muscular, restaurando o transporte de oxigênio nos tecidos.',
      contraindications: 'Hemocromatose, anemias não causadas por deficiência de ferro (como talassemia) e úlcera péptica ativa.',
      warnings: 'O ferro pode escurecer as fezes, o que é um efeito esperado e benigno.',
      interactionsSummary: 'Reduz intensamente a absorção de Levotiroxina (Puran T4) e antibióticos (Ciprofloxacino, Tetraciclinas, Amoxicilina) se tomados juntos. O Omeprazol e o Carbonato de Cálcio reduzem a absorção do ferro.',
      posologyGuidance: '1 comprimido ao dia, 30 minutos antes do almoço, com água ou suco rico em vitamina C.',
      missedDoseGuidance: 'Tome 30 minutos antes do jantar caso tenha esquecido antes do almoço.',
      adverseReactions: 'Constipação leve, gosto metálico, desconforto epigástrico e escurecimento benigno das fezes.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), longe do alcance de crianças.',
      interactingSubstances: ['levotiroxina', 'omeprazol', 'pantoprazol', 'ciprofloxacino', 'carbonato de cálcio', 'amoxicilina']
    }
  },
  {
    id: 'anvisa-azitromicina-500',
    name: 'Azitromicina Di-hidratada 500mg',
    brandAliases: ['Astro 500mg', 'Zitromax 500mg', 'Azi 500mg'],
    activeIngredient: 'Azitromicina Di-hidratada',
    therapeuticClass: 'Antibiótico Macrolídeo',
    category: 'Receita Retida',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 5,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia (a cada 24 horas)',
    isContinuous: false,
    defaultTreatmentDays: 5,
    controlled: 'Receita Retida (Branca C1/Antibiótico)',
    purpose: 'Tratamento de infecções bacterianas respiratórias (sinusite, faringite, bronquite, pneumonia atípica).',
    dosageInstruction: 'Tomar 1 comprimido de 500mg uma vez ao dia, exatamente no mesmo horário, durante 3 ou 5 dias conforme receita.',
    clinicalTags: ['Antibiótico', 'Receita Retida'],
    recommendedTimes: ['10:00'],
    bestTimeGuidance: 'Escolha um horário fixo pela manhã ou tarde (ex: 10:00 ou 15:00), longe de antiácidos ou suplementos minerais, e repita exatamente a cada 24 horas até o último comprimido.',
    administrationTips: 'Os comprimidos revestidos de Azitromicina podem ser tomados com ou sem alimentos (tomar após um lanche leve ajuda a evitar enjoo). Não tome junto com antiácidos.',
    bula: {
      indications: 'Infecções bacterianas do trato respiratório superior e inferior, pele e tecidos moles causadas por microrganismos sensíveis à azitromicina.',
      howItWorks: 'Inibe a síntese proteica bacteriana ligando-se à subunidade ribossomal 50S, concentrando-se intensamente nos tecidos infectados com longa meia-vida tecidual.',
      contraindications: 'Histórico de alergia à azitromicina, eritromicina ou qualquer antibiótico macrolídeo.',
      warnings: 'Complete todos os dias prescritos. Pacientes com arritmias cardíacas devem informar o médico antes do uso.',
      interactionsSummary: 'Antiácidos (alumínio/magnésio) reduzem o pico de absorção da azitromicina (espaçar em 2h). Pode aumentar os níveis de estatinas (Sinvastatina) e anticoagulantes.',
      posologyGuidance: 'Adultos: 1 comprimido de 500mg ao dia por 3 a 5 dias, sempre no mesmo horário.',
      missedDoseGuidance: 'Tome assim que lembrar e mantenha o intervalo de 24 horas para a dose seguinte.',
      adverseReactions: 'Desconforto abdominal leve, diarreia transitória ou náusea.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da umidade.',
      interactingSubstances: ['sinvastatina', 'atorvastatina', 'hidróxido de alumínio', 'magnésio', 'varfarina']
    }
  },
  {
    id: 'anvisa-paracetamol-750',
    name: 'Paracetamol 750mg',
    brandAliases: ['Tylenol 750mg', 'Resfenol', 'Cimegripe', 'Sonridor'],
    activeIngredient: 'Paracetamol',
    therapeuticClass: 'Analgésico e Antitérmico',
    category: 'Dor & Febre',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 20,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'De 6 em 6 ou 8 em 8 horas',
    isContinuous: false,
    defaultTreatmentDays: 5,
    controlled: 'Venda Livre / Simples',
    purpose: 'Alívio de dores de cabeça, dores no corpo associadas a gripes e resfriados, e febre.',
    dosageInstruction: 'Tomar 1 comprimido de 750mg a cada 6 ou 8 horas, sem ultrapassar 4 comprimidos por dia.',
    clinicalTags: ['Dor & Febre'],
    recommendedTimes: ['08:00', '16:00', '23:00'],
    bestTimeGuidance: 'Pode ser iniciado no momento da dor ou febre. É uma excelente opção analgésica para quem usa medicamentos de pressão alta (como Losartana), pois não reduz a eficácia anti-hipertensiva como os anti-inflamatórios.',
    administrationTips: 'Ingerir com água. Nunca associe dois medicamentos diferentes que contenham Paracetamol na fórmula (ex: antigripais + Paracetamol isolado) e evite bebidas alcoólicas.',
    bula: {
      indications: 'Redução da febre e alívio temporário de dores leves a moderadas (cefaleia, dores musculares, dor de dente, estados gripais).',
      howItWorks: 'Atua predominantemente no sistema nervoso central elevando o limiar da dor e regulando o centro hipotalâmico da temperatura corporal.',
      contraindications: 'Alergia ao paracetamol e doença hepática grave ou ativa.',
      warnings: 'Atenção: não exceder 4.000mg (5 comprimidos de 750mg) em 24 horas devido ao risco de sobrecarga hepática. Não ingerir bebidas alcoólicas durante o tratamento.',
      interactionsSummary: 'O uso contínuo em altas doses pode potencializar o efeito de anticoagulantes cumarínicos (varfarina). Álcool e anticonvulsivantes aumentam a hepatotoxicidade.',
      posologyGuidance: 'Adultos e maiores de 12 anos: 1 comprimido de 750mg de 3 a 4 vezes ao dia, respeitando intervalos de 6 a 8 horas.',
      missedDoseGuidance: 'Tome apenas se os sintomas de dor ou febre persistirem, mantendo o intervalo mínimo de 6 horas.',
      adverseReactions: 'Muito raro nas doses terapêuticas; ocasionalmente reações alérgicas cutâneas.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da luz.',
      interactingSubstances: ['varfarina', 'carbamazepina', 'fenitoína']
    }
  },
  {
    id: 'anvisa-loratadina-10',
    name: 'Loratadina 10mg',
    brandAliases: ['Claritin 10mg', 'Loralerg', 'Histadin'],
    activeIngredient: 'Loratadina',
    therapeuticClass: 'Anti-histamínico de 2ª Geração (Antialérgico não sedativo)',
    category: 'Respiratório & Alergia',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 12,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia',
    isContinuous: false,
    defaultTreatmentDays: 7,
    controlled: 'Venda Livre / Simples',
    purpose: 'Alívio de rinite alérgica, espirros, coriza, coceira nasal/ocular e urticária.',
    dosageInstruction: 'Tomar 1 comprimido de 10mg uma vez ao dia.',
    clinicalTags: [],
    recommendedTimes: ['08:00'],
    bestTimeGuidance: 'Tomar às 08:00 da manhã protege contra crises de rinite durante todo o dia (24h de ação) sem causar sonolência. Se os sintomas alérgicos forem piores de madrugada, pode ser tomado às 20:00.',
    administrationTips: 'Tomar 1 comprimido com água. Não exceda 1 comprimido em 24 horas, pois doses maiores podem causar sonolência.',
    bula: {
      indications: 'Alívio dos sintomas associados à rinite alérgica (coriza, espirros, prurido nasal e ocular) e urticária crônica ou aguda.',
      howItWorks: 'Bloqueia seletivamente os receptores periféricos H1 da histamina com mínima penetração na barreira hematoencefálica.',
      contraindications: 'Hipersensibilidade à loratadina ou componentes da fórmula.',
      warnings: 'Pacientes com insuficiência hepática grave devem iniciar em dias alternados conforme orientação médica.',
      interactionsSummary: 'Cetoconazol, eritromicina e cimetidina podem aumentar as concentrações plasmáticas da loratadina, embora sem alterações clínicas relevantes.',
      posologyGuidance: 'Adultos e crianças acima de 12 anos: 1 comprimido de 10mg uma vez ao dia.',
      missedDoseGuidance: 'Tome assim que lembrar no mesmo dia, sem dobrar a dose.',
      adverseReactions: 'Raramente boca seca, cefaleia leve ou fadiga.',
      storageAdvice: 'Manter em temperatura ambiente (15°C a 30°C).',
      interactingSubstances: ['cetoconazol', 'eritromicina', 'cimetidina']
    }
  },
  {
    id: 'anvisa-prednisolona-20',
    name: 'Fosfato Sódico de Prednisolona 20mg',
    brandAliases: ['Prelone 20mg', 'Predsim 20mg', 'Meticorten (Prednisona)'],
    activeIngredient: 'Prednisolona',
    therapeuticClass: 'Anti-inflamatório Hormonal (Corticosteroide Sistêmico)',
    category: 'Respiratório & Alergia',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 10,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia pela manhã',
    isContinuous: false,
    defaultTreatmentDays: 5,
    controlled: 'Venda Livre / Simples',
    purpose: 'Tratamento potente de processos inflamatórios agudos, crises alérgicas severas, sinusite, asma e dores articulares.',
    dosageInstruction: 'Tomar 1 comprimido pela manhã, logo após o café da manhã.',
    clinicalTags: [],
    recommendedTimes: ['08:00'],
    bestTimeGuidance: 'O melhor horário obrigatório para tomar Prednisolona/Prednisona é às 08:00 da manhã (após o café). Esse horário imita o pico natural de cortisol do organismo e evita insônia ou agitação à noite.',
    administrationTips: 'Tome sempre pela manhã e após comer. Atenção: se você usa medicamentos para diabetes (como Metformina) ou pressão alta, monitore seus índices, pois corticoides podem elevar a glicose e reter líquidos.',
    bula: {
      indications: 'Distúrbios alérgicos, inflamatórios, respiratórios (asma, bronquite, sinusite severa), reumatológicos e dermatológicos.',
      howItWorks: 'Exerce potente ação anti-inflamatória e imunomoduladora ao inibir a migração de leucócitos e a síntese de mediadores inflamatórios.',
      contraindications: 'Infecções fúngicas sistêmicas não tratadas e hipersensibilidade à prednisolona.',
      warnings: 'Tomar pela manhã após refeição. Tratamentos superiores a 7-10 dias não devem ser interrompidos abruptamente sem desmame médico.',
      interactionsSummary: 'Reduz a eficácia de antidiabéticos (Metformina, Insulina) por elevar a glicemia. Quando associado a anti-inflamatórios não esteroides (Ibuprofeno, AAS), aumenta significativamente o risco de gastrite e úlcera.',
      posologyGuidance: 'Dose conforme prescrição médica, preferencialmente em tomada única matinal (08:00) após o desjejum.',
      missedDoseGuidance: 'Se esquecer pela manhã, tome até o horário do almoço. Evite tomar tarde da noite para não prejudicar o sono.',
      adverseReactions: 'Aumento do apetite, retenção hídrica leve, agitação/insônia (se tomado à noite), azia e elevação transitória da glicemia.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da luz.',
      interactingSubstances: ['metformina', 'ibuprofeno', 'nimesulida', 'cetoprofeno', 'ácido acetilsalicílico', 'aas', 'furosemida']
    }
  },
  {
    id: 'anvisa-dorflex',
    name: 'Dipirona + Orfenadrina + Cafeína (Dorflex)',
    brandAliases: ['Dorflex', 'Miorrelax', 'Nevralgex'],
    activeIngredient: 'Dipirona Monoidratada + Citrato de Orfenadrina + Cafeína',
    therapeuticClass: 'Relaxante Muscular e Analgésico',
    category: 'Dor & Febre',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 36,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'De 8 em 8 horas',
    isContinuous: false,
    defaultTreatmentDays: 5,
    controlled: 'Venda Livre / Simples',
    purpose: 'Alívio de dores associadas a contraturas musculares, torcicolo, dor lombar e cefaleia tensional.',
    dosageInstruction: 'Tomar 1 comprimido com água de 3 a 4 vezes ao dia.',
    clinicalTags: ['Dor & Febre'],
    recommendedTimes: ['08:00', '16:00', '22:00'],
    bestTimeGuidance: 'Pode ser iniciado no momento da dor muscular. À noite (22:00) ajuda a relaxar a musculatura para dormir, mas atenção: a orfenadrina pode aumentar a sonolência se você já toma calmantes.',
    administrationTips: 'Ingerir com água sem mastigar. Evite associar com Clonazepam, Zolpidem ou álcool devido à potencialização da tontura e sedação.',
    bula: {
      indications: 'Alívio da dor associada a contraturas musculares de origem traumática ou inflamatória e cefaleia tensional.',
      howItWorks: 'Combina a ação analgésica da dipirona e cafeína com a ação miorrelaxante central do citrato de orfenadrina.',
      contraindications: 'Glaucoma, obstrução pilórica ou duodenal, miastenia gravis, hipertrofia prostática sintomática e alergia à dipirona.',
      warnings: 'A orfenadrina pode causar boca seca, leve visão turva ou sonolência em pessoas sensíveis.',
      interactionsSummary: 'Interage com medicamentos depressores do Sistema Nervoso Central (Clonazepam, Zolpidem, Amitriptilina, Ciclobenzaprina), potencializando sedação e efeitos anticolinérgicos.',
      posologyGuidance: '1 a 2 comprimidos, 3 a 4 vezes ao dia, com água.',
      missedDoseGuidance: 'Tome apenas se houver persistência da dor muscular, respeitando o intervalo de 6 a 8 horas.',
      adverseReactions: 'Boca seca, sonolência leve, tontura e redução da sudorese.',
      storageAdvice: 'Manter em temperatura ambiente (15°C a 30°C).',
      interactingSubstances: ['clonazepam', 'zolpidem', 'amitriptilina', 'ciclobenzaprina', 'quetiapina']
    }
  },
  {
    id: 'anvisa-ondansetrona-8',
    name: 'Cloridrato de Ondansetrona 8mg',
    brandAliases: ['Vonau Flash 8mg', 'Nausedron', 'Zofran'],
    activeIngredient: 'Cloridrato de Ondansetrona',
    therapeuticClass: 'Antiemético (Controle de Náuseas e Vômitos)',
    category: 'Gastrointestinal',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 10,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'De 8 em 8 horas',
    isContinuous: false,
    defaultTreatmentDays: 3,
    controlled: 'Venda Livre / Simples',
    purpose: 'Prevenção e alívio rápido de náuseas, enjoos intensos e vômitos.',
    dosageInstruction: 'Colocar 1 comprimido sobre a língua para dissolver rapidamente (ou engolir com água) 30 minutos antes das refeições.',
    clinicalTags: ['Controle Gástrico'],
    recommendedTimes: ['07:30', '15:30', '21:30'],
    bestTimeGuidance: 'Para evitar enjoos alimentares, tome 30 minutos antes das refeições. Em crises de enxaqueca com náusea, pode ser tomado imediatamente no início do enjoo.',
    administrationTips: 'Na versão orodispersível (Flash), retire do blíster com as mãos secas e coloque sobre a língua: ele dissolve em segundos sem precisar de água.',
    bula: {
      indications: 'Prevenção e tratamento de náuseas e vômitos de diversas origens (gastroenterites, enxaqueca, pós-operatório).',
      howItWorks: 'Antagonista seletivo dos receptores de serotonina 5-HT3 no trato gastrointestinal e na zona de gatilho quimiorreceptora central.',
      contraindications: 'Uso concomitante com apomorfina, síndrome congênita do QT longo e hipersensibilidade à ondansetrona.',
      warnings: 'Pode diminuir o trânsito intestinal (causar constipação leve); mantenha hidratação oral em pequenos goles.',
      interactionsSummary: 'Requer cautela quando associada a outros fármacos serotoninérgicos (Sertralina, Escitalopram) ou medicamentos que prolongam o intervalo QT.',
      posologyGuidance: 'Adultos: 1 comprimido de 8mg até de 8 em 8 horas por curto período.',
      missedDoseGuidance: 'Administre se o sintoma de náusea retornar, respeitando o intervalo mínimo de 8 horas.',
      adverseReactions: 'Cefaleia leve, sensação de calor e constipação intestinal.',
      storageAdvice: 'Conservar na embalagem original de alumínio (15°C a 30°C).',
      interactingSubstances: ['apomorfina', 'tramadol', 'sertralina', 'escitalopram']
    }
  },
  {
    id: 'anvisa-floratil-200',
    name: 'Saccharomyces boulardii 200mg (Floratil)',
    brandAliases: ['Floratil 200mg', 'Repoflor', 'Florent'],
    activeIngredient: 'Saccharomyces boulardii CNCM I-745',
    therapeuticClass: 'Probiótico Restaurador da Flora Intestinal',
    category: 'Gastrointestinal',
    formType: 'Cápsula',
    unitLabel: 'cápsulas',
    defaultBoxCapacity: 12,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 cápsula',
    defaultFrequencyLabel: 'De 12 em 12 horas',
    isContinuous: false,
    defaultTreatmentDays: 5,
    controlled: 'Venda Livre / Simples',
    purpose: 'Restauração da flora intestinal, tratamento de diarreia aguda e prevenção de diarreia causada por antibióticos.',
    dosageInstruction: 'Tomar 1 cápsula de 12 em 12 horas com água em temperatura ambiente (nunca com líquidos quentes).',
    clinicalTags: ['Controle Gástrico'],
    recommendedTimes: ['09:00', '21:00'],
    bestTimeGuidance: 'Excelente para tomar durante tratamentos com antibióticos (como Amoxicilina): por ser uma levedura, os antibióticos bacterianos não o destroem! Tome às 09:00 e 21:00 com água fresca.',
    administrationTips: 'Nunca tome com água morna/quente, chá quente, café ou bebidas alcoólicas, pois o calor mata os microrganismos vivos da cápsula. Não associe com antifúngicos (como Fluconazol).',
    bula: {
      indications: 'Tratamento da diarreia aguda infecciosa e prevenção/tratamento da diarreia associada ao uso de antibióticos.',
      howItWorks: 'Levedura probiótica viva que inibe o crescimento de microrganismos patogênicos no intestino, neutraliza toxinas bacterianas e estimula a imunidade da mucosa intestinal.',
      contraindications: 'Pacientes gravemente imunocomprometidos ou em uso de cateter venoso central, e hipersensibilidade a leveduras.',
      warnings: 'Não ingerir com líquidos acima de 50°C ou bebidas alcoólicas.',
      interactionsSummary: 'Antifúngicos orais (Fluconazol, Itraconazol, Cetoconazol, Nistatina) inativam completamente o Saccharomyces boulardii e não devem ser usados simultaneamente.',
      posologyGuidance: '1 cápsula de 200mg de 12 em 12 horas por 3 a 5 dias.',
      missedDoseGuidance: 'Tome assim que lembrar com água fria ou em temperatura ambiente.',
      adverseReactions: 'Ocasionalmente leve produção de gases intestinais.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido do calor e umidade.',
      interactingSubstances: ['fluconazol', 'itraconazol', 'cetoconazol', 'nistatina']
    }
  },
  {
    id: 'anvisa-acetilcisteina-600',
    name: 'Acetilcisteína 600mg Granulado',
    brandAliases: ['Fluimucil 600mg', 'Aires 600mg', 'Cisteil'],
    activeIngredient: 'Acetilcisteína',
    therapeuticClass: 'Mucolítico e Expectorante Respiratório',
    category: 'Respiratório & Alergia',
    formType: 'Sachê',
    unitLabel: 'sachês',
    defaultBoxCapacity: 16,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 sachê',
    defaultFrequencyLabel: '1x ao dia à noite',
    isContinuous: false,
    defaultTreatmentDays: 7,
    controlled: 'Venda Livre / Simples',
    purpose: 'Fluidificação de secreções respiratórias densas, tosse produtiva (com catarro), bronquite e sinusite.',
    dosageInstruction: 'Dissolver 1 sachê de 600mg em meio copo de água em temperatura ambiente e beber imediatamente, 1x ao dia.',
    clinicalTags: [],
    recommendedTimes: ['20:00'],
    bestTimeGuidance: 'Tome às 20:00 (no início da noite, cerca de 2 a 3 horas antes de deitar) e beba bastante água ao longo do dia para ajudar a fluidificar o muco.',
    administrationTips: 'Se você também estiver usando antibiótico oral (como Amoxicilina ou Azitromicina), aguarde pelo menos 2 horas de intervalo entre o sachê de Acetilcisteína e o antibiótico.',
    bula: {
      indications: 'Tratamento de afecções respiratórias caracterizadas por hipersecreção densa e viscosa (bronquite, sinusite, pneumonia, tosse produtiva).',
      howItWorks: 'Quebra as pontes dissulfeto das mucoproteínas do catarro, tornando a secreção mais fluida e fácil de ser eliminada pelas vias respiratórias.',
      contraindications: 'Alergia à acetilcisteína e crianças menores de 2 anos.',
      warnings: 'Não associar com antitussígenos (inibidores da tosse), pois impedir o reflexo da tosse pode acumular a secreção fluidificada nos brônquios.',
      interactionsSummary: 'Pode reduzir a absorção de alguns antibióticos orais se administrada exatamente no mesmo horário; recomenda-se intervalo de 2 horas.',
      posologyGuidance: 'Adultos: 1 sachê de 600mg uma vez ao dia (preferencialmente à noite), dissolvido em meio copo de água.',
      missedDoseGuidance: 'Tome assim que lembrar no mesmo dia.',
      adverseReactions: 'Ocasionalmente leve azia ou náusea.',
      storageAdvice: 'Manter os sachês fechados em local seco (15°C a 30°C).',
      interactingSubstances: ['amoxicilina', 'cefalexina', 'ciprofloxacino', 'nitroglicerina']
    }
  },
  {
    id: 'anvisa-rivaroxabana-20',
    name: 'Rivaroxabana 20mg',
    brandAliases: ['Xarelto 20mg', 'Rivaxa', 'Varelto'],
    activeIngredient: 'Rivaroxabana',
    therapeuticClass: 'Anticoagulante Oral Direto (Inibidor do Fator Xa)',
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 28,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia junto com refeição',
    isContinuous: true,
    defaultTreatmentDays: 28,
    controlled: 'Venda Livre / Simples',
    purpose: 'Prevenção e tratamento de trombose venosa, embolia pulmonar e prevenção de AVC em arritmias.',
    dosageInstruction: 'Tomar 1 comprimido de 20mg OBRIGATORIAMENTE junto com uma refeição principal (almoço ou jantar).',
    clinicalTags: ['Uso Contínuo'],
    recommendedTimes: ['12:30'],
    bestTimeGuidance: 'O melhor horário para a Rivaroxabana 15mg/20mg é às 12:30 (durante o almoço) ou às 20:00 (durante o jantar). Tomar em jejum reduz a eficácia anticoagulante em mais de 30%!',
    administrationTips: 'Nunca tome Rivaroxabana 15mg ou 20mg de estômago vazio; tome sempre com comida. Evite terminantemente tomar anti-inflamatórios (Ibuprofeno, Nimesulida, AAS) sem ordem expressa do cardiologista.',
    bula: {
      indications: 'Prevenção de AVC e embolia sistêmica em fibrilação atrial, e tratamento/prevenção de trombose venosa profunda (TVP) e embolia pulmonar (EP).',
      howItWorks: 'Inibe seletivamente e diretamente o Fator Xa da cascata de coagulação sanguínea, prevenindo a formação de trombos.',
      contraindications: 'Sangramento ativo clinicamente significativo, doença hepática associada a coagulopatia e gravidez.',
      warnings: 'Atenção: as doses de 15mg e 20mg DEVEM ser ingeridas com alimentos para atingir 100% de biodisponibilidade. Não interrompa o uso sem falar com seu médico.',
      interactionsSummary: 'Alto risco de sangramento se associado a anti-inflamatórios (Ibuprofeno, Nimesulida, Cetoprofeno, Diclofenaco), AAS, Clopidogrel ou antidepressivos ISRS. Antifúngicos azólicos aumentam seus níveis.',
      posologyGuidance: '1 comprimido de 20mg uma vez ao dia, sempre junto com o almoço ou jantar.',
      missedDoseGuidance: 'Se esquecer uma dose, tome imediatamente junto com um lanche ou refeição no mesmo dia e siga com a tomada única diária no dia seguinte.',
      adverseReactions: 'Sangramento gengival leve ao escovar os dentes, equimoses (manchas roxas) mais fáceis na pele.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C).',
      interactingSubstances: ['ibuprofeno', 'nimesulida', 'cetoprofeno', 'diclofenaco', 'ácido acetilsalicílico', 'aas', 'clopidogrel', 'sertralina', 'escitalopram', 'cetoconazol', 'itraconazol']
    }
  },
  {
    id: 'anvisa-nimesulida-100',
    name: 'Nimesulida 100mg',
    brandAliases: ['Scaflam 100mg', 'Nisulid 100mg', 'Maxsulid', 'Cimelide'],
    activeIngredient: 'Nimesulida',
    therapeuticClass: 'Anti-inflamatório Não Esteroide (AINE), Analgésico e Antitérmico',
    category: 'Dor & Febre',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 12,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'De 12 em 12 horas',
    isContinuous: false,
    defaultTreatmentDays: 5,
    controlled: 'Venda Livre / Simples',
    purpose: 'Tratamento de dor de garganta, inflamações agudas, dor de dente, dor articular e febre.',
    dosageInstruction: 'Tomar 1 comprimido de 100mg de 12 em 12 horas, sempre após as refeições.',
    clinicalTags: ['Dor & Febre'],
    recommendedTimes: ['08:00', '20:00'],
    bestTimeGuidance: 'Os melhores horários são 08:00 (logo após o café da manhã) e 20:00 (logo após o jantar). Nunca tome Nimesulida em jejum.',
    administrationTips: 'Utilize pelo menor tempo possível (3 a 5 dias). Atenção: a Nimesulida pode reduzir o efeito de remédios de pressão alta (como Losartana e Enalapril) e irritar o estômago.',
    bula: {
      indications: 'Condições que requeiram atividade anti-inflamatória, analgésica e antipirética (faringite, amigdalite, dor osteoarticular e dismenorreia).',
      howItWorks: 'Inibe preferencialmente a enzima ciclo-oxigenase-2 (COX-2), reduzindo a produção de prostaglandinas inflamatórias e radicais livres.',
      contraindications: 'Úlcera péptica ativa, insuficiência hepática ou renal, distúrbios de coagulação, menores de 12 anos e gestantes.',
      warnings: 'Não associar com bebidas alcoólicas ou outros medicamentos potencialmente hepatotóxicos. Usar pelo menor tempo eficaz.',
      interactionsSummary: 'Reduz a eficácia de anti-hipertensivos (Losartana, Enalapril, Furosemida, Hidroclorotiazida) e aumenta o risco de sangramento com anticoagulantes (Rivaroxabana, AAS) e antidepressivos ISRS.',
      posologyGuidance: 'Adultos e maiores de 12 anos: 100mg (1 comprimido) duas vezes ao dia (12/12h), após as refeições.',
      missedDoseGuidance: 'Tome após se alimentar assim que lembrar, respeitando o intervalo de 12 horas para a próxima dose.',
      adverseReactions: 'Azia, dor estomacal, náusea e, raramente, elevação das enzimas do fígado.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da luz e umidade.',
      interactingSubstances: ['losartana', 'enalapril', 'valsartana', 'furosemida', 'hidroclorotiazida', 'rivaroxabana', 'ácido acetilsalicílico', 'aas', 'sertralina', 'escitalopram']
    }
  },
  {
    id: 'anvisa-pantoprazol-40',
    name: 'Pantoprazol Sódico 40mg',
    brandAliases: ['Pantozol 40mg', 'Adipept', 'Inzelm', 'Tecta'],
    activeIngredient: 'Pantoprazol Sódico Sesqui-hidratado',
    therapeuticClass: 'Inibidor da Bomba de Prótons (Protetor Gástrico)',
    category: 'Gastrointestinal',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 28,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia em jejum',
    isContinuous: false,
    defaultTreatmentDays: 28,
    controlled: 'Venda Livre / Simples',
    purpose: 'Controle de refluxo gastroesofágico, esofagite, gastrite moderada a grave e úlceras.',
    dosageInstruction: 'Tomar 1 comprimido inteiro com água em jejum, 30 minutos antes do café da manhã.',
    clinicalTags: ['Controle Gástrico'],
    recommendedTimes: ['07:00'],
    bestTimeGuidance: 'Tomar às 07:00 da manhã em jejum (30 minutos antes do café). Se você também toma Levotiroxina (Puran T4), tome a Levotiroxina às 06:30 e o Pantoprazol antes do almoço (11:30).',
    administrationTips: 'Os comprimidos revestidos gastrorresistentes não devem ser partidos, mastigados ou triturados. Engula inteiros com água.',
    bula: {
      indications: 'Tratamento de esofagite de refluxo, úlcera gástrica e duodenal e síndrome de Zollinger-Ellison.',
      howItWorks: 'Inibe a secreção basal e estimulada de ácido clorídrico no estômago através do bloqueio específico das bombas de prótons das células parietais.',
      contraindications: 'Hipersensibilidade ao pantoprazol ou benzimidazóis substituídos.',
      warnings: 'Apresenta menor interação hepática que o omeprazol, porém ainda reduz a acidez gástrica necessária para absorção de ferro e levotiroxina.',
      interactionsSummary: 'Pode diminuir a absorção de medicamentos dependentes do pH gástrico (Levotiroxina, Sulfato Ferroso, Cetoconazol). Espaçar em pelo menos 2 a 4 horas.',
      posologyGuidance: '1 comprimido de 40mg ao dia em jejum, antes do café da manhã.',
      missedDoseGuidance: 'Tome 30 minutos antes da próxima refeição do dia.',
      adverseReactions: 'Cefaleia eventual, desconforto abdominal leve ou flatulência.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C).',
      interactingSubstances: ['levotiroxina', 'sulfato ferroso', 'cetoconazol', 'itraconazol']
    }
  },
  {
    id: 'anvisa-enalapril-10',
    name: 'Maleato de Enalapril 10mg',
    brandAliases: ['Renitec 10mg', 'Eupressin', 'Atens'],
    activeIngredient: 'Maleato de Enalapril',
    therapeuticClass: 'Anti-hipertensivo (Inibidor da ECA)',
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'De 12 em 12 horas ou 1x ao dia',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Controle da hipertensão arterial e proteção da função cardíaca.',
    dosageInstruction: 'Tomar conforme prescrição médica (1x ou 2x ao dia), sempre nos mesmos horários.',
    clinicalTags: ['Pressão Arterial', 'Uso Contínuo'],
    recommendedTimes: ['08:00', '20:00'],
    bestTimeGuidance: 'Inicie às 08:00 da manhã (e às 20:00 se prescrito de 12/12h). Pode ser tomado com ou sem alimentos.',
    administrationTips: 'Evite o uso de anti-inflamatórios (Ibuprofeno, Nimesulida, Diclofenaco), pois eles reduzem o efeito do Enalapril sobre a pressão.',
    bula: {
      indications: 'Todos os graus de hipertensão arterial essencial, hipertensão renovascular e insuficiência cardíaca congestiva.',
      howItWorks: 'Inibe a enzima conversora de angiotensina (ECA), diminuindo a formação de angiotensina II (vasoconstritora) e promovendo vasodilatação arterial.',
      contraindications: 'Histórico de angioedema, gravidez e estenose bilateral das artérias renais.',
      warnings: 'Pode causar tosse seca persistente em alguns pacientes; caso ocorra, informe seu cardiologista para possível substituição.',
      interactionsSummary: 'AINEs (Ibuprofeno, Nimesulida, Cetoprofeno) diminuem o efeito hipotensor e aumentam risco renal. Espironolactona e suplementos de potássio podem causar hipercalemia.',
      posologyGuidance: '10mg a 20mg ao dia em dose única ou dividida de 12 em 12 horas.',
      missedDoseGuidance: 'Tome assim que lembrar, exceto se estiver próximo da dose seguinte. Não dobre a dose.',
      adverseReactions: 'Tosse seca não produtiva, tontura postural inicial e fadiga leve.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da umidade.',
      interactingSubstances: ['ibuprofeno', 'nimesulida', 'cetoprofeno', 'diclofenaco', 'espironolactona', 'lítio']
    }
  },
  {
    id: 'anvisa-anlodipino-5',
    name: 'Besilato de Anlodipino 5mg',
    brandAliases: ['Norvasc 5mg', 'Pressat 5mg', 'Cordarex'],
    activeIngredient: 'Besilato de Anlodipino',
    therapeuticClass: 'Anti-hipertensivo (Bloqueador dos Canais de Cálcio)',
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Controle da pressão alta (hipertensão) e prevenção de angina no peito.',
    dosageInstruction: 'Tomar 1 comprimido de 5mg uma vez ao dia com água.',
    clinicalTags: ['Pressão Arterial', 'Uso Contínuo'],
    recommendedTimes: ['08:00'],
    bestTimeGuidance: 'Possui ação prolongada de mais de 24 horas. Tomar às 08:00 da manhã garante excelente controle pressórico ao longo de todo o dia.',
    administrationTips: 'Tome todos os dias no mesmo horário. Caso note leve inchaço nos tornozelos ao final do dia, elevar as pernas ao descansar ajuda a aliviar.',
    bula: {
      indications: 'Medicamento de primeira escolha no tratamento da hipertensão arterial e isquemia miocárdica (angina).',
      howItWorks: 'Inibe o influxo de íons cálcio na musculatura lisa vascular e cardíaca, relaxando diretamente as artérias periféricas e coronárias.',
      contraindications: 'Hipersensibilidade às di-hidropiridinas ou ao anlodipino e hipotensão grave.',
      warnings: 'Não interrompa o uso por conta própria.',
      interactionsSummary: 'Pode aumentar a exposição sanguínea da Sinvastatina (recomenda-se limitar a dose de sinvastatina a 20mg/dia quando associada ao anlodipino). Anti-inflamatórios podem antagonizar o controle da pressão.',
      posologyGuidance: 'Dose inicial usual de 5mg uma vez ao dia, podendo chegar a 10mg/dia conforme orientação médica.',
      missedDoseGuidance: 'Tome assim que lembrar no mesmo dia. Se passaram mais de 12 horas, aguarde a dose do dia seguinte.',
      adverseReactions: 'Edema maleolar (leve inchaço nos tornozelos), rubor facial e cefaleia inicial.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C).',
      interactingSubstances: ['sinvastatina', 'ibuprofeno', 'nimesulida', 'cetoprofeno']
    }
  },
  {
    id: 'anvisa-hidroclorotiazida-25',
    name: 'Hidroclorotiazida 25mg',
    brandAliases: ['Clorana 25mg', 'Drenol 25mg'],
    activeIngredient: 'Hidroclorotiazida',
    therapeuticClass: 'Diurético Tiazídico e Anti-hipertensivo',
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia pela manhã',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Controle da pressão arterial e redução da retenção de líquidos (inchaço/edema).',
    dosageInstruction: 'Tomar 1 comprimido de 25mg SEMPRE pela manhã.',
    clinicalTags: ['Pressão Arterial', 'Uso Contínuo'],
    recommendedTimes: ['08:00'],
    bestTimeGuidance: 'O melhor horário obrigatório para qualquer diurético (Hidroclorotiazida ou Furosemida) é às 08:00 da manhã! Tomar à tarde ou à noite fará você acordar várias vezes de madrugada para urinar.',
    administrationTips: 'Tome pela manhã após o café. Alimente-se com frutas ricas em potássio (como banana ou água de coco) caso recomendado pelo médico.',
    bula: {
      indications: 'Tratamento da hipertensão arterial (isolada ou associada a outros anti-hipertensivos) e edemas associados a problemas cardíacos ou renais.',
      howItWorks: 'Aumenta a excreção renal de sódio e água no túbulo contorcido distal, reduzindo o volume plasmático e a resistência periférica.',
      contraindications: 'Anúria (ausência de produção de urina) e alergia a sulfonamidas ou tiazídicos.',
      warnings: 'Tomar pela manhã para evitar noctúria (urinar à noite). Pode elevar discretamente o ácido úrico e a glicose.',
      interactionsSummary: 'Anti-inflamatórios (Ibuprofeno, Nimesulida) reduzem o efeito diurético e anti-hipertensivo. Corticoides aumentam a perda de potássio. Pode reduzir levemente o efeito de antidiabéticos.',
      posologyGuidance: '12,5mg a 25mg em dose única diária pela manhã.',
      missedDoseGuidance: 'Se lembrar até as 14:00, pode tomar. Após esse horário, pule a dose para não atrapalhar seu sono noturno.',
      adverseReactions: 'Aumento da frequência urinária nas primeiras horas, cãibras leves se houver queda de potássio ou magnésio.',
      storageAdvice: 'Manter em temperatura ambiente (15°C a 30°C), protegido da luz.',
      interactingSubstances: ['ibuprofeno', 'nimesulida', 'cetoprofeno', 'metformina', 'prednisona', 'lítio']
    }
  },
  {
    id: 'anvisa-simeticona-125',
    name: 'Simeticona 125mg Cápsula Gel',
    brandAliases: ['Luftal Max 125mg', 'Flagass', 'Flatex'],
    activeIngredient: 'Simeticona',
    therapeuticClass: 'Antiflatulento (Eliminação de Gases Intestinais)',
    category: 'Gastrointestinal',
    formType: 'Cápsula',
    unitLabel: 'cápsulas',
    defaultBoxCapacity: 10,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 cápsula',
    defaultFrequencyLabel: 'Após as refeições e ao deitar',
    isContinuous: false,
    defaultTreatmentDays: 5,
    controlled: 'Venda Livre / Simples',
    purpose: 'Alívio do estufamento abdominal, excesso de gases, cólicas por gases e desconforto gástrico.',
    dosageInstruction: 'Tomar 1 cápsula após as principais refeições e ao deitar (máximo de 4 cápsulas ao dia).',
    clinicalTags: ['Controle Gástrico'],
    recommendedTimes: ['12:30', '20:30'],
    bestTimeGuidance: 'Tome logo após o almoço (12:30) e jantar (20:30), momentos de maior formação de gases digestivos. Se usar Levotiroxina pela manhã, mantenha pelo menos 4 horas de distância.',
    administrationTips: 'A Simeticona não é absorvida pelo sangue (atua apenas dentro do intestino rompendo as bolhas de gás). Mesmo assim, não tome no mesmo horário da Levotiroxina.',
    bula: {
      indications: 'Alívio dos sintomas do excesso de gases no aparelho digestivo (flatulência, meteorismo, eructação e distensão abdominal).',
      howItWorks: 'Reduz a tensão superficial das bolhas mucosas de gás no estômago e intestino, fazendo com que se rompam e sejam eliminadas sem dor.',
      contraindications: 'Distensão abdominal grave com suspeita de obstrução ou perfuração intestinal e alergia aos componentes.',
      warnings: 'Medicamento de ação exclusivamente local no tubo digestivo.',
      interactionsSummary: 'Pode diminuir a absorção da Levotiroxina Sódica se administrada simultaneamente; espaçar em no mínimo 4 horas.',
      posologyGuidance: '1 cápsula gelatinosa de 125mg até 4 vezes ao dia (após as refeições e ao deitar).',
      missedDoseGuidance: 'Administre apenas quando houver desconforto por gases.',
      adverseReactions: 'Praticamente isento de reações adversas por não ser absorvido.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C).',
      interactingSubstances: ['levotiroxina']
    }
  },
  {
    id: 'anvisa-zolpidem-10',
    name: 'Hemitartarato de Zolpidem 10mg',
    brandAliases: ['Stilnox 10mg', 'Patz', 'Turno', 'Lioram'],
    activeIngredient: 'Hemitartarato de Zolpidem',
    therapeuticClass: 'Hipnótico Não Benzodiazepínico (Indutor do Sono)',
    category: 'Receita Retida',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 20,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x à noite imediatamente ao deitar',
    isContinuous: false,
    defaultTreatmentDays: 20,
    controlled: 'Receita Azul (Notificação B)',
    purpose: 'Tratamento da insônia ocasional, transitória ou crônica (dificuldade para iniciar o sono).',
    dosageInstruction: 'Tomar 1 comprimido IMEDIATAMENTE antes de deitar na cama, garantindo pelo menos 7 a 8 horas de sono.',
    clinicalTags: ['Receita Retida'],
    recommendedTimes: ['22:30'],
    bestTimeGuidance: 'Tome às 22:30 JÁ DEITADO na cama, com as luzes e o celular desligados. O Zolpidem faz efeito em apenas 15 a 20 minutos!',
    administrationTips: 'Nunca tome Zolpidem e continue mexendo no celular, caminhando pela casa ou realizando tarefas, pois pode causar amnésia ou sonambulismo. Não tome junto com refeição pesada (atrasa o efeito).',
    bula: {
      indications: 'Tratamento de curta duração da insônia primária ou secundária.',
      howItWorks: 'Agonista seletivo da subunidade ômega-1 do receptor GABA-A, induzindo rapidamente o sono preservando a arquitetura das fases profundas.',
      contraindications: 'Insuficiência respiratória severa, síndrome da apneia do sono grave, insuficiência hepática severa e menores de 18 anos.',
      warnings: 'Deve ser ingerido imediatamente ao deitar. Risco de comportamentos complexos durante o sono se o paciente permanecer acordado após tomar.',
      interactionsSummary: 'Perigo de sedação excessiva e depressão respiratória se associado a Clonazepam, Alprazolam, Amitriptilina, Quetiapina, Pregabalina, relaxantes musculares (Miosan/Dorflex) ou álcool.',
      posologyGuidance: 'Adultos: 10mg (ou 5mg conforme prescrição) em dose única imediatamente ao deitar.',
      missedDoseGuidance: 'Só tome se ainda tiver pelo menos 7 horas inteiras disponíveis para dormir até o horário de acordar.',
      adverseReactions: 'Sonolência residual se dormir menos de 7 horas, tontura e amnésia anterógrada (se não deitar logo após tomar).',
      storageAdvice: 'Conservar em local seguro (15°C a 30°C).',
      interactingSubstances: ['clonazepam', 'alprazolam', 'diazepam', 'amitriptilina', 'quetiapina', 'pregabalina', 'ciclobenzaprina', 'orfenadrina', 'dorflex']
    }
  },
  {
    id: 'anvisa-ciclobenzaprina-10',
    name: 'Cloridrato de Ciclobenzaprina 10mg',
    brandAliases: ['Miosan 10mg', 'Musculare', 'Mirtax', 'Dolamin Flex'],
    activeIngredient: 'Cloridrato de Ciclobenzaprina',
    therapeuticClass: 'Relaxante Muscular de Ação Central',
    category: 'Dor & Febre',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 15,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia à noite',
    isContinuous: false,
    defaultTreatmentDays: 7,
    controlled: 'Venda Livre / Simples',
    purpose: 'Tratamento de espasmos musculares dolorosos, lombalgia, torcicolo, fibromialgia e cefaleia tensional.',
    dosageInstruction: 'Tomar 1 comprimido à noite (1 hora antes de dormir) com água.',
    clinicalTags: ['Dor & Febre'],
    recommendedTimes: ['21:30'],
    bestTimeGuidance: 'O melhor horário para tomar a Ciclobenzaprina (Miosan) é às 21:30 (cerca de 1 hora antes de deitar), pois causa forte relaxamento muscular e sonolência que ajudam no sono reparador.',
    administrationTips: 'Evite tomar pela manhã se precisar dirigir ou trabalhar com atenção intensa. Cuidado ao associar com calmantes ou antidepressivos.',
    bula: {
      indications: 'Espasmos musculares associados a condições musculoesqueléticas agudas e dolorosas e coadjuvante na fibromialgia.',
      howItWorks: 'Alivia o espasmo muscular de origem local sem interferir na função muscular normal, atuando predominantemente no tronco cerebral.',
      contraindications: 'Glaucoma, retenção urinária, arritmias cardíacas, hipertireoidismo e uso concomitante de IMAOs.',
      warnings: 'Provoca sonolência acentuada na maioria dos pacientes; evite dirigir veículos.',
      interactionsSummary: 'Potencializa fortemente a sedação de Clonazepam, Zolpidem e álcool. Possui estrutura tricíclica e pode interagir com antidepressivos serotoninérgicos (Sertralina, Escitalopram, Fluoxetina) e Tramadol.',
      posologyGuidance: '5mg a 10mg à noite ao deitar (ou conforme posologia médica por até 2 semanas).',
      missedDoseGuidance: 'Se esquecer à noite, não tome pela manhã seguinte devido à sonolência diurna.',
      adverseReactions: 'Sonolência, boca seca e tontura leve.',
      storageAdvice: 'Manter em temperatura ambiente (15°C a 30°C).',
      interactingSubstances: ['clonazepam', 'zolpidem', 'sertralina', 'escitalopram', 'fluoxetina', 'tramadol', 'dorflex']
    }
  },
  {
    id: 'anvisa-ciprofloxacino-500',
    name: 'Cloridrato de Ciprofloxacino 500mg',
    brandAliases: ['Cipro 500mg', 'Ciflox', 'Maxiflox'],
    activeIngredient: 'Cloridrato de Ciprofloxacino',
    therapeuticClass: 'Antibiótico Fluoroquinolona',
    category: 'Receita Retida',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 14,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: 'De 12 em 12 horas',
    isContinuous: false,
    defaultTreatmentDays: 7,
    controlled: 'Receita Retida (Branca C1/Antibiótico)',
    purpose: 'Tratamento de infecções urinárias (cistite, pielonefrite), gastrointestinais e respiratórias.',
    dosageInstruction: 'Tomar 1 comprimido de 500mg exatamente a cada 12 horas com um copo cheio de água (longe de leite/derivados).',
    clinicalTags: ['Antibiótico', 'Receita Retida'],
    recommendedTimes: ['09:00', '21:00'],
    bestTimeGuidance: 'Os melhores horários são 09:00 e 21:00, longe do café com leite! Nunca tome Ciprofloxacino junto com leite, iogurte, queijo, cálcio ou ferro, pois o cálcio bloqueia a absorção do antibiótico.',
    administrationTips: 'Beba bastante água durante todo o dia. Espaçar em pelo menos 2 horas de laticínios, antiácidos, cálcio, ferro ou polivitamínicos.',
    bula: {
      indications: 'Infecções complicadas e não complicadas do trato urinário, rins, próstata, trato gastrointestinal e vias aéreas.',
      howItWorks: 'Bactericida que inibe a enzima DNA-girase bacteriana, impedindo a replicação do material genético das bactérias.',
      contraindications: 'Alergia a quinolonas, uso concomitante de tizanidina e gestantes/lactantes.',
      warnings: 'Evitar exposição solar excessiva e exercícios físicos extenuantes (risco de tendinite). Não ingerir com derivados do leite isoladamente.',
      interactionsSummary: 'Cálcio, Ferro, Magnésio, Zinco, Antiácidos e Sucralfato reduzem drasticamente a absorção do Ciprofloxacino (espaçar em no mínimo 2h). Aumenta o efeito da cafeína e anticoagulantes.',
      posologyGuidance: '1 comprimido de 500mg de 12 em 12 horas pelo período prescrito (geralmente 7 a 10 dias).',
      missedDoseGuidance: 'Tome assim que lembrar e mantenha o ciclo de 12 horas.',
      adverseReactions: 'Náusea leve, diarreia, sensibilidade da pele ao sol e dor articular/tendínea.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C).',
      interactingSubstances: ['carbonato de cálcio', 'sulfato ferroso', 'magnésio', 'hidróxido de alumínio', 'varfarina', 'rivaroxabana', 'sinvastatina']
    }
  },
  {
    id: 'anvisa-fexofenadina-120',
    name: 'Cloridrato de Fexofenadina 120mg',
    brandAliases: ['Allegra 120mg', 'Altiva 120mg', 'Fexodane'],
    activeIngredient: 'Cloridrato de Fexofenadina',
    therapeuticClass: 'Anti-histamínico de 2ª Geração (Não causa sono)',
    category: 'Respiratório & Alergia',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 10,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia com água',
    isContinuous: false,
    defaultTreatmentDays: 10,
    controlled: 'Venda Livre / Simples',
    purpose: 'Alívio rápido de rinite alérgica, conjuntivite alérgica e urticária sem dar sono.',
    dosageInstruction: 'Tomar 1 comprimido por dia com água pura (nunca tomar com suco de frutas).',
    clinicalTags: [],
    recommendedTimes: ['08:00'],
    bestTimeGuidance: 'Tome às 08:00 da manhã apenas com ÁGUA PURA. Importante: nunca tome Fexofenadina (Allegra) com suco de laranja, maçã ou toranja, pois os sucos de frutas reduzem sua absorção em quase 40%!',
    administrationTips: 'Tomar com água antes da refeição. Não dá sono, podendo ser usado antes de trabalhar ou estudar.',
    bula: {
      indications: 'Alívio das manifestações alérgicas da rinite alérgica sazonal ou perene e urticária.',
      howItWorks: 'Metabólito farmacologicamente ativo da terfenadina que bloqueia seletivamente receptores H1 periféricos sem atravessar a barreira hematoencefálica.',
      contraindications: 'Hipersensibilidade à fexofenadina e menores de 12 anos (para comprimidos de 120mg).',
      warnings: 'Não administrar com sucos de frutas (laranja, maçã, uva) nem próximo a antiácidos com alumínio/magnésio.',
      interactionsSummary: 'Antiácidos contendo hidróxido de alumínio e magnésio e sucos de frutas reduzem significativamente a biodisponibilidade da fexofenadina.',
      posologyGuidance: '1 comprimido de 120mg (ou 180mg) uma vez ao dia com água.',
      missedDoseGuidance: 'Tome assim que lembrar com água.',
      adverseReactions: 'Muito bem tolerado; raramente cefaleia leve.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C).',
      interactingSubstances: ['hidróxido de alumínio', 'magnésio']
    }
  },
  {
    id: 'anvisa-aas-100',
    name: 'Ácido Acetilsalicílico 100mg (AAS Protect / Somalgin Cardio)',
    brandAliases: ['AAS 100mg', 'Aspirina Prevent 100mg', 'Somalgin Cardio'],
    activeIngredient: 'Ácido Acetilsalicílico',
    therapeuticClass: 'Antiagregante Plaquetário Cardiovascular',
    category: 'Uso Contínuo',
    formType: 'Comprimido',
    unitLabel: 'comprimidos',
    defaultBoxCapacity: 30,
    defaultDoseAmount: 1,
    defaultDoseDisplay: '1 comprimido',
    defaultFrequencyLabel: '1x ao dia após o almoço',
    isContinuous: true,
    defaultTreatmentDays: 30,
    controlled: 'Venda Livre / Simples',
    purpose: 'Prevenção de trombose arterial, infarto do miocárdio e AVC conforme prescrição cardiológica.',
    dosageInstruction: 'Tomar 1 comprimido de 100mg logo após o almoço com um copo de água.',
    clinicalTags: ['Uso Contínuo'],
    recommendedTimes: ['12:30'],
    bestTimeGuidance: 'O melhor horário é às 12:30 (logo após o almoço), protegendo a mucosa do estômago. Se precisar tomar Ibuprofeno ou Dipirona no mesmo dia, aguarde pelo menos 2 horas após o AAS.',
    administrationTips: 'Engolir inteiro com água após a refeição. Evite associar com anti-inflamatórios sem orientação médica.',
    bula: {
      indications: 'Prevenção secundária de infarto agudo do miocárdio, angina instável e acidentes vasculares cerebrais isquêmicos.',
      howItWorks: 'Inibe irreversivelmente a enzima COX-1 plaquetária, bloqueando a síntese de tromboxano A2 e impedindo a agregação excessiva das plaquetas.',
      contraindications: 'Úlcera gastroduodenal ativa, diátese hemorrágica, dengue suspeita ou confirmada e alergia a salicilatos.',
      warnings: 'Contraindicado em qualquer suspeita de Dengue. Informar dentistas e cirurgiões antes de procedimentos.',
      interactionsSummary: 'Ibuprofeno e Dipirona tomados no mesmo horário podem competir pelo sítio de ligação plaquetário e reduzir o efeito cardioprotetor do AAS (espaçar em 2h). Aumenta risco de sangramento com Rivaroxabana, Clopidogrel, Corticoides e Sertralina.',
      posologyGuidance: '1 comprimido de 100mg uma vez ao dia após o almoço.',
      missedDoseGuidance: 'Tome após o jantar se esquecer no almoço. Não dobre a dose no dia seguinte.',
      adverseReactions: 'Desconforto gástrico leve e maior facilidade para pequenos hematomas na pele.',
      storageAdvice: 'Conservar em temperatura ambiente (15°C a 30°C), protegido da umidade.',
      interactingSubstances: ['ibuprofeno', 'nimesulida', 'cetoprofeno', 'rivaroxabana', 'clopidogrel', 'prednisona', 'sertralina', 'escitalopram', 'dipirona']
    }
  }
];

function makeQuickCatalogItem(
  id: string,
  name: string,
  brandAliases: string[],
  activeIngredient: string,
  therapeuticClass: string,
  category: string,
  formType: string,
  unitLabel: string,
  defaultBoxCapacity: number,
  defaultFrequencyLabel: string,
  recommendedTimes: string[],
  isContinuous: boolean,
  defaultTreatmentDays: number,
  controlled: ControlledType,
  purpose: string,
  bestTimeGuidance: string,
  administrationTips: string,
  interactingSubstances: string[] = []
): AnvisaCatalogItem {
  const defaultDoseDisplay =
    formType === 'Gotas'
      ? '30 gotas'
      : formType === 'Xarope' || formType === 'mL'
      ? '10 mL'
      : formType === 'Spray'
      ? '2 jatos'
      : formType === 'Sachê'
      ? '1 sachê'
      : `1 ${formType.toLowerCase()}`;

  return {
    id,
    name,
    brandAliases,
    activeIngredient,
    therapeuticClass,
    category,
    formType,
    unitLabel,
    defaultBoxCapacity,
    defaultDoseAmount: 1,
    defaultDoseDisplay,
    defaultFrequencyLabel,
    isContinuous,
    defaultTreatmentDays,
    controlled,
    purpose,
    dosageInstruction: `Administrar ${defaultDoseDisplay} (${defaultFrequencyLabel.toLowerCase()}). ${administrationTips}`,
    clinicalTags: [category],
    recommendedTimes,
    bestTimeGuidance,
    administrationTips,
    bula: {
      indications: purpose,
      howItWorks: `Atua farmacologicamente por meio do princípio ativo ${activeIngredient} (${therapeuticClass}), promovendo o controle clínico descrito na bula oficial.`,
      contraindications: `Contraindicado em caso de alergia ou hipersensibilidade conhecida a ${activeIngredient} ou a qualquer componente da fórmula.`,
      warnings: `Utilize rigorosamente nas doses e intervalos prescritos. Informe seu médico sobre outros medicamentos de uso contínuo.`,
      interactionsSummary:
        interactingSubstances.length > 0
          ? `Atenção para o uso concomitante com: ${interactingSubstances.join(', ')}.`
          : 'Verifique com seu médico ou farmacêutico antes de associar novos medicamentos.',
      posologyGuidance: `${defaultDoseDisplay} · ${defaultFrequencyLabel}.`,
      missedDoseGuidance:
        'Tome assim que lembrar. Se estiver próximo do horário da dose seguinte, aguarde o próximo horário sem dobrar a dose.',
      adverseReactions:
        'Podem ocorrer reações leves e transitórias como desconforto gástrico, sonolência ou cefaleia leve em pacientes sensíveis.',
      storageAdvice:
        'Conservar em temperatura ambiente (15°C a 30°C), protegido da luz e umidade.',
      interactingSubstances
    }
  };
}

const EXTRA_BRAZIL_MEDICATIONS: AnvisaCatalogItem[] = [
  makeQuickCatalogItem('br-neosaldina', 'Neosaldina (Dipirona + Isometepteno + Cafeína)', ['Neosaldina Drágeas', 'Neosaldor'], 'Dipirona + Mucato de Isometepteno + Cafeína', 'Analgésico e Antienxaquecoso', 'Enxaqueca', 'Comprimido', 'comprimidos', 20, 'De 6 em 6 horas', ['08:00', '14:00', '20:00'], false, 5, 'Venda Livre / Simples', 'Alívio de dores de cabeça e crises agudas de enxaqueca.', 'Iniciar ao primeiro sinal de dor de cabeça. Evitar após as 20h se tiver sensibilidade à cafeína.', 'Tomar 1 a 2 drágeas com água.', ['clorpromazina', 'ciclosporina']),
  makeQuickCatalogItem('br-torsilax', 'Torsilax (Cafeína + Carisoprodol + Diclofenaco + Paracetamol)', ['Torsilax', 'Tandrilax', 'Infralax'], 'Carisoprodol + Diclofenaco Sódico + Paracetamol + Cafeína', 'Relaxante Muscular e Anti-inflamatório', 'Dor & Febre', 'Comprimido', 'comprimidos', 30, 'De 12 em 12 horas', ['08:00', '20:00'], false, 5, 'Venda Livre / Simples', 'Reumatismo, lombalgia, torcicolo e dores musculares inflamatórias agudas.', 'Tomar de 12 em 12 horas logo após as refeições (08:00 e 20:00).', 'Ingerir inteiro após comer para proteger o estômago. Pode causar leve sonolência.', ['losartana', 'enalapril', 'rivaroxabana', 'varfarina', 'clonazepam']),
  makeQuickCatalogItem('br-miosan-5', 'Miosan 5mg (Cloridrato de Ciclobenzaprina)', ['Miosan 5mg', 'Miosan 10mg', 'Musculare'], 'Cloridrato de Ciclobenzaprina', 'Relaxante Muscular de Ação Central', 'Dor & Febre', 'Comprimido', 'comprimidos', 15, '1x ao dia à noite ou de 12/12h', ['21:30'], false, 7, 'Venda Livre / Simples', 'Espasmos musculares agudos, fibromialgia, lombalgia e cervicalgia.', 'O melhor horário é à noite (21:30), 30 min antes de deitar, pois provoca relaxamento e sonolência.', 'Tomar com água. Evitar dirigir após a tomada.', ['clonazepam', 'zolpidem', 'sertralina', 'escitalopram']),
  makeQuickCatalogItem('br-flanax-550', 'Flanax 550mg (Naproxeno Sódico)', ['Flanax 550mg', 'Flanax 275mg', 'Naproxeno 500mg'], 'Naproxeno Sódico', 'Anti-inflamatório e Analgésico', 'Dor & Febre', 'Comprimido', 'comprimidos', 10, 'De 12 em 12 horas ou 24/24h', ['08:00', '20:00'], false, 5, 'Venda Livre / Simples', 'Dores inflamatórias, dor muscular, dor de dente, cólica menstrual e enxaqueca.', 'Tomar após o café da manhã (08:00) ou jantar (20:00).', 'Ingerir sempre após alimentação.', ['losartana', 'enalapril', 'rivaroxabana', 'ácido acetilsalicílico']),
  makeQuickCatalogItem('br-profenid-100', 'Profenid Entérico 100mg (Cetoprofeno)', ['Profenid 100mg', 'Biprofenid 150mg', 'Cetoprofeno 100mg'], 'Cetoprofeno', 'Anti-inflamatório Não Esteroidal', 'Dor & Febre', 'Comprimido', 'comprimidos', 20, 'De 12 em 12 horas', ['08:00', '20:00'], false, 5, 'Venda Livre / Simples', 'Processos inflamatórios articulares, dores lombares, garganta inflamada e pós-operatório.', 'Tomar de 12 em 12 horas (08:00 e 20:00) durante ou logo após as refeições.', 'Tomar com um copo cheio de água após refeição.', ['losartana', 'enalapril', 'rivaroxabana', 'varfarina']),
  makeQuickCatalogItem('br-cataflam-50', 'Cataflam 50mg (Diclofenaco Potássico)', ['Cataflam 50mg', 'Voltaren 50mg', 'Diclofenaco Sódico 50mg'], 'Diclofenaco Potássico', 'Anti-inflamatório e Analgésico', 'Dor & Febre', 'Comprimido', 'comprimidos', 20, 'De 8 em 8 horas ou 12/12h', ['08:00', '16:00', '23:00'], false, 5, 'Venda Livre / Simples', 'Dor de garganta, entorses, dor lombar, cólica menstrual e inflamações agudas.', 'Tomar após as refeições (08:00, 16:00 e 23:00 para 8/8h ou 08:00 e 20:00 para 12/12h).', 'Não tomar em jejum.', ['losartana', 'enalapril', 'rivaroxabana']),
  makeQuickCatalogItem('br-buscopan-composto', 'Buscopan Composto (Butilbrometo de Escopolamina + Dipirona)', ['Buscopan Composto', 'Buscopan Simples', 'Buscoduo'], 'Butilbrometo de Escopolamina + Dipirona', 'Antiespasmódico e Analgésico', 'Gastrointestinal', 'Comprimido', 'comprimidos', 20, 'De 6 em 6 horas ou 8/8h', ['08:00', '16:00', '23:00'], false, 5, 'Venda Livre / Simples', 'Alívio de cólicas abdominais, intestinais, renais, biliares e cólicas menstruais.', 'Iniciar no momento da cólica e manter de 8 em 8 horas (08:00, 16:00 e 23:00) se necessário.', 'Engolir inteiro com água.', []),
  makeQuickCatalogItem('br-luftal-125', 'Luftal 125mg Cápsula Gel (Simeticona)', ['Luftal 125mg', 'Luftal 40mg', 'Luftal Gotas', 'Flagass'], 'Simeticona', 'Antiflatulento', 'Gastrointestinal', 'Cápsula', 'cápsulas', 10, 'De 6 em 6 horas', ['08:00', '13:00', '19:00', '23:00'], false, 5, 'Venda Livre / Simples', 'Alívio do excesso de gases no aparelho digestivo, estufamento e cólicas por flatulência.', 'Tomar após as principais refeições e ao deitar.', 'Ingerir com água. Se usar Levotiroxina, espaçar em 4 horas.', ['levotiroxina']),
  makeQuickCatalogItem('br-vonau-8', 'Vonau Flash 8mg (Cloridrato de Ondansetrona)', ['Vonau Flash 4mg', 'Vonau Flash 8mg', 'Ansentron', 'Nausedron'], 'Cloridrato de Ondansetrona', 'Antiemético (Contra Náuseas e Vômitos)', 'Gastrointestinal', 'Comprimido', 'comprimidos', 10, 'De 8 em 8 horas', ['07:00', '15:00', '23:00'], false, 5, 'Venda Livre / Simples', 'Prevenção e tratamento de náuseas, enjoos e vômitos.', 'Tomar 30 minutos antes da refeição ou imediatamente em caso de náusea, de 8 em 8 horas.', 'Colocar o comprimido sobre a língua para dissolver em segundos e engolir com a saliva.', ['tramadol', 'sertralina']),
  makeQuickCatalogItem('br-plasil-10', 'Plasil 10mg (Cloridrato de Metoclopramida)', ['Plasil 10mg', 'Metoclopramida Gotas'], 'Cloridrato de Metoclopramida', 'Procinético e Antiemético', 'Gastrointestinal', 'Comprimido', 'comprimidos', 20, 'De 8 em 8 horas', ['07:30', '15:30', '23:00'], false, 5, 'Venda Livre / Simples', 'Náuseas, vômitos e esvaziamento gástrico lento (empachamento).', 'Tomar 30 minutos antes das refeições, respeitando intervalo mínimo de 6 a 8 horas.', 'Ingerir com água. Pode causar sonolência leve.', ['levodopa', 'clonazepam']),
  makeQuickCatalogItem('br-dramin-b6', 'Dramin B6 50mg (Dimenidrinato + Piridoxina)', ['Dramin B6', 'Dramin Capsgel'], 'Dimenidrinato + Cloridrato de Piridoxina (Vitamina B6)', 'Antiemético e Antivertiginoso', 'Gastrointestinal', 'Comprimido', 'comprimidos', 30, 'De 6 em 6 horas ou 8/8h', ['08:00', '16:00', '23:00'], false, 5, 'Venda Livre / Simples', 'Enjoos em viagens (cinetose), labirintite, vertigens e náuseas.', 'Para viagem, tomar 30 min antes de sair. No dia a dia, de 6/6h ou 8/8h.', 'Causa sonolência; evite dirigir após tomar.', ['clonazepam', 'zolpidem']),
  makeQuickCatalogItem('br-motilium-10', 'Motilium 10mg (Domperidona)', ['Motilium 10mg', 'Peridal 10mg', 'Domperidona 10mg'], 'Domperidona', 'Procinético Digestivo', 'Gastrointestinal', 'Comprimido', 'comprimidos', 30, 'De 8 em 8 horas antes das refeições', ['07:30', '12:00', '19:30'], false, 14, 'Venda Livre / Simples', 'Refluxo gastroesofágico, sensação de estômago cheio, azia e náuseas.', 'Tomar 15 a 30 minutos antes do café, almoço e jantar.', 'Se tomado após as refeições, a absorção é retardada.', ['cetoconazol', 'claritromicina', 'azitromicina']),
  makeQuickCatalogItem('br-pantoprazol-40', 'Pantoprazol Sódico 40mg (Pantozol)', ['Pantozol 40mg', 'Pantozol 20mg', 'Pantoprazol 20mg', 'Adipept'], 'Pantoprazol Sódico Sesqui-hidratado', 'Inibidor da Bomba de Prótons (Protetor Gástrico)', 'Gastrointestinal', 'Comprimido', 'comprimidos', 28, '1x ao dia em jejum', ['07:00'], true, 28, 'Venda Livre / Simples', 'Gastrite, esofagite de refluxo, úlcera gástrica e proteção estomacal.', 'O melhor horário é às 07:00 em jejum, 30 min antes do café da manhã.', 'Engolir inteiro com água sem partir ou mastigar.', ['levotiroxina', 'sulfato ferroso']),
  makeQuickCatalogItem('br-esomeprazol-40', 'Esomeprazol Magnésico 40mg (Nexium)', ['Nexium 40mg', 'Nexium 20mg', 'Esomex'], 'Esomeprazol Magnésico', 'Inibidor da Bomba de Prótons', 'Gastrointestinal', 'Comprimido', 'comprimidos', 28, '1x ao dia em jejum', ['07:00'], true, 28, 'Venda Livre / Simples', 'Doença do refluxo gastroesofágico (DRGE), azia intensa e esofagite erosiva.', 'Tomar às 07:00 em jejum, 30 min antes da primeira refeição.', 'Tomar inteiro com água.', ['clopidogrel', 'levotiroxina']),
  makeQuickCatalogItem('br-enterogermina', 'Enterogermina Plus (Esporos de Bacillus clausii)', ['Enterogermina', 'Enterogermina Plus'], 'Bacillus clausii', 'Probiótico Restaurador da Flora Intestinal', 'Gastrointestinal', 'mL', 'flaconetes', 10, '1 flaconete ao dia (ou de 12/12h)', ['09:00'], false, 10, 'Venda Livre / Simples', 'Restauração da flora intestinal durante o uso de antibióticos ou diarreia.', 'Tomar às 09:00 (no intervalo entre as doses do antibiótico).', 'Agitar o flaconete, girar a tampa e beber o conteúdo diretamente.', []),
  makeQuickCatalogItem('br-allegra-120', 'Allegra 120mg (Cloridrato de Fexofenadina)', ['Allegra 120mg', 'Allegra 180mg', 'Allegra 60mg', 'Allegra D', 'Altiva'], 'Cloridrato de Fexofenadina', 'Anti-histamínico (Antialérgico Sem Sono)', 'Respiratório & Alergia', 'Comprimido', 'comprimidos', 10, '1x ao dia', ['08:00'], false, 10, 'Venda Livre / Simples', 'Rinite alérgica, espirros, coriza, coceira ocular e urticária (não dá sono).', 'Tomar pela manhã (08:00) com água.', 'Tomar apenas com água (evitar suco de laranja ou maçã próximo ao comprimido, pois reduz a absorção).', ['hidróxido de alumínio', 'magnésio']),
  makeQuickCatalogItem('br-desalex-5', 'Desalex 5mg (Desloratadina)', ['Desalex 5mg', 'Desloratadina Xarope', 'Esalerg'], 'Desloratadina', 'Antialérgico de 2ª Geração', 'Respiratório & Alergia', 'Comprimido', 'comprimidos', 10, '1x ao dia', ['08:00'], false, 10, 'Venda Livre / Simples', 'Controle de rinite alérgica, congestão nasal, tosse alérgica e urticária.', 'Tomar 1x ao dia pela manhã (08:00), com ou sem alimentos.', 'Ingerir com água.', []),
  makeQuickCatalogItem('br-zyrtec-10', 'Zyrtec 10mg (Dicloridrato de Cetirizina)', ['Zyrtec 10mg', 'Cetirizina 10mg'], 'Dicloridrato de Cetirizina', 'Antialérgico', 'Respiratório & Alergia', 'Comprimido', 'comprimidos', 12, '1x ao dia à noite', ['20:00'], false, 10, 'Venda Livre / Simples', 'Rinite alérgica sazonal, conjuntivite alérgica e urticária.', 'Prefira tomar à noite (20:00), pois pode causar leve relaxamento em pessoas sensíveis.', 'Ingerir com um copo de água.', ['clonazepam']),
  makeQuickCatalogItem('br-hixizine-25', 'Hixizine 25mg (Dicloridrato de Hidroxizina)', ['Hixizine 25mg', 'Hidroxizina Xarope'], 'Dicloridrato de Hidroxizina', 'Anti-histamínico Sedativo Antipruriginoso', 'Respiratório & Alergia', 'Comprimido', 'comprimidos', 30, 'De 8 em 8 horas ou à noite', ['21:00'], false, 7, 'Venda Livre / Simples', 'Coceiras intensas na pele (prurido), dermatite atópica e urticária.', 'Ideal iniciar à noite (21:00) devido ao efeito sedativo.', 'Evitar bebidas alcoólicas e direção de veículos.', ['clonazepam', 'zolpidem']),
  makeQuickCatalogItem('br-decongex-plus', 'Decongex Plus (Bronfeniramina + Fenilefrina)', ['Decongex Plus Comprimidos', 'Decongex Gotas', 'Benegrip', 'Cimegripe', 'Resfenol'], 'Maleato de Bronfeniramina + Cloridrato de Fenilefrina', 'Descongestionante Nasal e Antialérgico', 'Respiratório & Alergia', 'Comprimido', 'comprimidos', 12, 'De 12 em 12 horas', ['08:00', '20:00'], false, 5, 'Venda Livre / Simples', 'Congestão nasal, coriza, gripes, resfriados e sinusite aguda.', 'Tomar de 12 em 12 horas (08:00 e 20:00).', 'Pode causar sonolência. Pacientes hipertensos devem monitorar a pressão.', ['losartana', 'enalapril']),
  makeQuickCatalogItem('br-meticorten-20', 'Meticorten 20mg (Prednisona)', ['Meticorten 20mg', 'Meticorten 5mg', 'Prednisona 20mg', 'Prednisona 5mg'], 'Prednisona', 'Corticoide Sistêmico Anti-inflamatório', 'Respiratório & Alergia', 'Comprimido', 'comprimidos', 10, '1x ao dia pela manhã', ['08:00'], false, 5, 'Venda Livre / Simples', 'Processos inflamatórios, alérgicos, crise de asma, sinusite e afecções reumáticas.', 'Tomar sempre pela manhã (08:00) logo após o café da manhã, acompanhando o pico natural de cortisol e evitando insônia.', 'Nunca tomar em jejum.', ['metformina', 'ibuprofeno', 'cetoprofeno']),
  makeQuickCatalogItem('br-decadron-4', 'Decadron 4mg (Dexametasona)', ['Decadron 4mg', 'Dexametasona Elixir', 'Celestamine'], 'Dexametasona', 'Corticoide Potente', 'Respiratório & Alergia', 'Comprimido', 'comprimidos', 10, '1x ao dia pela manhã ou de 12/12h', ['08:00'], false, 5, 'Venda Livre / Simples', 'Inflamações agudas graves, laringite, alergias intensas e edemas.', 'Tomar pela manhã (08:00) após o café da manhã.', 'Ingerir com alimentos.', ['metformina', 'ibuprofeno']),
  makeQuickCatalogItem('br-fluimucil-600', 'Fluimucil 600mg (Acetilcisteína)', ['Fluimucil 600mg Granulado', 'Acetilcisteína Xarope', 'Aires 600mg'], 'Acetilcisteína', 'Mucolítico e Expectorante', 'Respiratório & Alergia', 'Sachê', 'sachês', 16, '1x ao dia à noite', ['20:00'], false, 7, 'Venda Livre / Simples', 'Tosse carregada com catarro, bronquite, sinusite e fluidificação de secreções.', 'Tomar 1 sachê de 600mg à noite (20:00) após o jantar.', 'Dissolver o conteúdo do sachê em meio copo de água e beber imediatamente. Beber bastante água durante o dia.', []),
  makeQuickCatalogItem('br-aerolin-spray', 'Aerolin Spray 100mcg (Sulfato de Salbutamol)', ['Aerolin 100mcg', 'Salbutamol Spray'], 'Sulfato de Salbutamol', 'Broncodilatador de Alívio Rápido', 'Respiratório & Alergia', 'Spray', 'jatos', 200, 'Se houver falta de ar ou de 6/6h', ['08:00', '20:00'], false, 7, 'Venda Livre / Simples', 'Alívio e prevenção de broncoespasmo, crise de asma e falta de ar.', 'Usar imediatamente no início de falta de ar ou chiado no peito, ou 15 min antes de exercício.', 'Agitar o inalador, expirar profundamente e inspirar firmemente ao acionar o jato.', ['propranolol', 'atenolol']),
  makeQuickCatalogItem('br-busonid-nasal', 'Busonid Aquoso Nasal 50mcg (Budesonida)', ['Busonid 50mcg', 'Busonid 100mcg', 'Noex', 'Avamys'], 'Budesonida', 'Corticoide Nasal Tópico', 'Respiratório & Alergia', 'Spray', 'jatos', 120, 'De 12 em 12 horas', ['08:00', '20:00'], true, 30, 'Venda Livre / Simples', 'Tratamento e prevenção de rinite alérgica, obstrução nasal crônica e sinusite.', 'Aplicar pela manhã (08:00) e à noite (20:00) após higienizar as narinas com soro fisiológico.', 'Agitar antes de usar e direcionar o bico levemente para a lateral da narina.', []),
  makeQuickCatalogItem('br-clavulin-875', 'Clavulin BD 875mg + 125mg (Amoxicilina + Clavulanato)', ['Clavulin BD 875mg', 'Amoxicilina + Clavulanato 875mg', 'Novamox 2X'], 'Amoxicilina Tri-hidratada + Clavulanato de Potássio', 'Antibiótico de Amplo Espectro', 'Receita Retida', 'Comprimido', 'comprimidos', 14, 'De 12 em 12 horas', ['08:00', '20:00'], false, 7, 'Receita Retida (Branca C1/Antibiótico)', 'Infecções bacterianas de garganta, sinusite aguda, otite, infecções respiratórias e dentárias.', 'Tomar rigorosamente de 12 em 12 horas (ex: 08:00 e 20:00) no início da refeição.', 'Tomar no início da refeição para melhor absorção e para evitar desconforto intestinal.', ['varfarina', 'metotrexato']),
  makeQuickCatalogItem('br-cefalexina-500', 'Cefalexina 500mg (Keflex)', ['Keflex 500mg', 'Cefalexina 500mg'], 'Cefalexina Monoidratada', 'Antibiótico Cefalosporina', 'Receita Retida', 'Comprimido', 'comprimidos', 28, 'De 6 em 6 horas', ['06:00', '12:00', '18:00', '00:00'], false, 7, 'Receita Retida (Branca C1/Antibiótico)', 'Infecções de pele, infecção urinária, faringite bacteriana e infecções dentárias.', 'Manter intervalos exatos de 6 em 6 horas (06:00, 12:00, 18:00 e 00:00).', 'Tomar com um copo de água, com ou sem alimentos.', ['metformina']),
  makeQuickCatalogItem('br-ciprofloxacino-500', 'Cloridrato de Ciprofloxacino 500mg (Cipro)', ['Cipro 500mg', 'Ciprofloxacino 500mg'], 'Cloridrato de Ciprofloxacino', 'Antibiótico Fluoroquinolona', 'Receita Retida', 'Comprimido', 'comprimidos', 14, 'De 12 em 12 horas', ['08:00', '20:00'], false, 7, 'Receita Retida (Branca C1/Antibiótico)', 'Infecção do trato urinário (cistite, pielonefrite) e infecções gastrointestinais.', 'Tomar exatamente de 12 em 12 horas (08:00 e 20:00).', 'NÃO tomar com leite, iogurte, cálcio ou ferro (reduzem a absorção do antibiótico). Tomar apenas com água.', ['carbonato de cálcio', 'sulfato ferroso', 'magnésio', 'varfarina']),
  makeQuickCatalogItem('br-levofloxacino-500', 'Levofloxacino 500mg (Levaquin / Tamiram)', ['Tamiram 500mg', 'Tamiram 750mg', 'Levofloxacino 500mg'], 'Levofloxacino Hemi-hidratado', 'Antibiótico Respiratório e Urinário', 'Receita Retida', 'Comprimido', 'comprimidos', 10, '1x ao dia (24/24h)', ['09:00'], false, 7, 'Receita Retida (Branca C1/Antibiótico)', 'Pneumonia comunitária, sinusite bacteriana aguda e infecções urinárias.', 'Tomar 1x ao dia sempre no mesmo horário (09:00).', 'Ingerir com bastante água e longe de antiácidos, cálcio ou ferro.', ['carbonato de cálcio', 'sulfato ferroso', 'ibuprofeno']),
  makeQuickCatalogItem('br-macrodantina-100', 'Macrodantina 100mg (Nitrofurantoína)', ['Macrodantina 100mg', 'Nitrofurantoína 100mg'], 'Nitrofurantoína', 'Antisséptico e Antibiótico Urinário', 'Receita Retida', 'Cápsula', 'cápsulas', 28, 'De 6 em 6 horas', ['06:00', '12:00', '18:00', '00:00'], false, 7, 'Receita Retida (Branca C1/Antibiótico)', 'Tratamento e prevenção de infecção urinária aguda (cistite).', 'Tomar de 6 em 6 horas junto com alimentos ou leite para melhorar a tolerância gástrica.', 'Ingerir sempre acompanhado de alimento.', ['magnésio']),
  makeQuickCatalogItem('br-fluconazol-150', 'Fluconazol 150mg (Zoltec)', ['Zoltec 150mg', 'Fluconazol 150mg'], 'Fluconazol', 'Antifúngico Sistêmico', 'Dor & Febre', 'Cápsula', 'cápsulas', 2, 'Dose única ou 1x por semana', ['10:00'], false, 7, 'Venda Livre / Simples', 'Candidíase vaginal ou oral e micoses superficiais da pele e unhas.', 'Pode ser tomado a qualquer hora do dia (ex: 10:00), com ou sem alimentos.', 'Engolir a cápsula inteira com água.', ['sinvastatina', 'atorvastatina', 'saccharomyces boulardii', 'floratil']),
  makeQuickCatalogItem('br-ivermectina-6', 'Ivermectina 6mg (Revectina)', ['Revectina 6mg', 'Ivermectina 6mg'], 'Ivermectina', 'Antiparasitário', 'Dor & Febre', 'Comprimido', 'comprimidos', 4, 'Dose única conforme peso corporal', ['09:00'], false, 2, 'Venda Livre / Simples', 'Tratamento de parasitoses intestinais (estrongiloidíase, ascaridíase), escabiose e pediculose.', 'Tomar pela manhã com água, cerca de 1 hora antes da refeição.', 'Ingerir com um copo cheio de água.', ['varfarina']),
  makeQuickCatalogItem('br-annita-500', 'Annita 500mg (Nitazoxanida)', ['Annita 500mg', 'Nitazoxanida 500mg'], 'Nitazoxanida', 'Antiparasitário e Antiviral Gastroenterológico', 'Gastrointestinal', 'Comprimido', 'comprimidos', 6, 'De 12 em 12 horas por 3 dias', ['08:00', '20:00'], false, 3, 'Receita Retida (Branca C1/Antibiótico)', 'Gastroenterites virais (rotavírus, norovírus) e parasitoses intestinais (giardíase, amebíase).', 'Tomar de 12 em 12 horas (08:00 e 20:00) obrigatoriamente junto com alimentos.', 'Tomar com refeição. Pode deixar a urina esverdeada/amarelada (efeito normal e passageiro).', []),
  makeQuickCatalogItem('br-enalapril-10', 'Maleato de Enalapril 10mg (Renitec)', ['Renitec 10mg', 'Renitec 20mg', 'Enalapril 20mg', 'Eupressin'], 'Maleato de Enalapril', 'Anti-hipertensivo (IECA)', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia ou de 12/12h', ['08:00', '20:00'], true, 30, 'Venda Livre / Simples', 'Controle da hipertensão arterial (pressão alta) e insuficiência cardíaca.', 'Tomar às 08:00 (e às 20:00 se prescrito 2x ao dia), mantendo horário fixo.', 'Pode ser tomado com ou sem alimentos.', ['ibuprofeno', 'nimesulida', 'cetoprofeno', 'diclofenaco', 'espironolactona']),
  makeQuickCatalogItem('br-valsartana-160', 'Valsartana 160mg (Diovan / Brasart)', ['Diovan 160mg', 'Diovan 80mg', 'Diovan 320mg', 'Brasart', 'Tareg'], 'Valsartana', 'Anti-hipertensivo (BRA)', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia', ['08:00'], true, 30, 'Venda Livre / Simples', 'Tratamento contínuo da pressão arterial elevada e proteção cardiovascular.', 'Tomar 1x ao dia pela manhã (08:00).', 'Ingerir com água.', ['ibuprofeno', 'nimesulida', 'cetoprofeno', 'espironolactona']),
  makeQuickCatalogItem('br-olmesartana-20', 'Olmesartana Medoxomila 20mg (Benicar)', ['Benicar 20mg', 'Benicar 40mg', 'Benicar Anlo', 'Olsar'], 'Olmesartana Medoxomila', 'Anti-hipertensivo (BRA)', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia', ['08:00'], true, 30, 'Venda Livre / Simples', 'Controle diário da pressão alta (hipertensão arterial).', 'Tomar sempre no mesmo horário matinal (08:00).', 'Engolir inteiro com água.', ['ibuprofeno', 'nimesulida', 'cetoprofeno']),
  makeQuickCatalogItem('br-anlodipino-5', 'Besilato de Anlodipino 5mg (Norvasc / Pressat)', ['Norvasc 5mg', 'Pressat 5mg', 'Anlodipino 10mg'], 'Besilato de Anlodipino', 'Anti-hipertensivo Bloqueador dos Canais de Cálcio', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia', ['08:00'], true, 30, 'Venda Livre / Simples', 'Hipertensão arterial e prevenção de angina no peito.', 'Tomar 1x ao dia pela manhã (08:00).', 'Ingerir com água, independente das refeições.', ['sinvastatina', 'ibuprofeno']),
  makeQuickCatalogItem('br-hidroclorotiazida-25', 'Hidroclorotiazida 25mg (Clorana)', ['Clorana 25mg', 'Hidroclorotiazida 25mg', 'Higroton', 'Clortalidona'], 'Hidroclorotiazida', 'Diurético Tiazídico e Anti-hipertensivo', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia pela manhã', ['08:00'], true, 30, 'Venda Livre / Simples', 'Controle da pressão alta e redução de retenção de líquidos (inchaço/edema).', 'Tomar SEMPRE pela manhã (08:00) para que o efeito diurético não atrapalhe seu sono à noite.', 'Tomar após o café da manhã.', ['ibuprofeno', 'nimesulida', 'cetoprofeno']),
  makeQuickCatalogItem('br-furosemida-40', 'Furosemida 40mg (Lasix)', ['Lasix 40mg', 'Furosemida 40mg'], 'Furosemida', 'Diurético de Alça Potente', 'Uso Contínuo', 'Comprimido', 'comprimidos', 20, '1x ao dia pela manhã', ['08:00'], true, 30, 'Venda Livre / Simples', 'Retenção de líquidos (edema cardíaco, renal ou hepático) e hipertensão.', 'Tomar pela manhã (08:00), pois o efeito diurético inicia em 30 a 60 minutos.', 'Tomar com líquido em jejum ou café leve.', ['ibuprofeno', 'cetoprofeno']),
  makeQuickCatalogItem('br-espironolactona-25', 'Espironolactona 25mg (Aldactone)', ['Aldactone 25mg', 'Aldactone 100mg', 'Espironolactona 50mg'], 'Espironolactona', 'Diurético Poupador de Potássio / Antiandrogênico', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia', ['08:00'], true, 30, 'Venda Livre / Simples', 'Controle de pressão arterial, retenção hídrica, insuficiência cardíaca e acne/queda capilar hormonal.', 'Tomar pela manhã (08:00) junto ou logo após o café da manhã.', 'Tomar com alimento aumenta a biodisponibilidade.', ['losartana', 'enalapril']),
  makeQuickCatalogItem('br-atenolol-50', 'Atenolol 50mg (Ablok)', ['Ablok 50mg', 'Ablok 25mg', 'Atenol 50mg', 'Atenolol 25mg'], 'Atenolol', 'Betabloqueador Cardiosseletivo', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia', ['08:00'], true, 30, 'Venda Livre / Simples', 'Controle da hipertensão arterial, arritmias, taquicardia e angina.', 'Tomar pela manhã (08:00) sempre no mesmo horário.', 'Não interromper o uso abruptamente sem orientação médica.', ['ibuprofeno', 'salbutamol']),
  makeQuickCatalogItem('br-selozok-50', 'Selozok 50mg (Succinato de Metoprolol)', ['Selozok 50mg', 'Selozok 25mg', 'Selozok 100mg', 'Metoprolol'], 'Succinato de Metoprolol', 'Betabloqueador de Liberação Controlada', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia pela manhã', ['08:00'], true, 30, 'Venda Livre / Simples', 'Hipertensão arterial, controle da frequência cardíaca, insuficiência cardíaca e prevenção de enxaqueca.', 'Tomar 1x ao dia pela manhã (08:00).', 'Ingerir com líquido.', ['ibuprofeno', 'nimesulida']),
  makeQuickCatalogItem('br-rosuvastatina-10', 'Rosuvastatina Cálcica 10mg (Crestor / Rosucor)', ['Crestor 10mg', 'Crestor 20mg', 'Rosucor 10mg', 'Trezor 10mg', 'Rosuvastatina 20mg'], 'Rosuvastatina Cálcica', 'Redutor de Colesterol (Estatina de Alta Potência)', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia à noite', ['21:00'], true, 30, 'Venda Livre / Simples', 'Redução do colesterol LDL, triglicerídeos e prevenção cardiovascular.', 'Pode ser tomada a qualquer hora, mas às 21:00 facilita a rotina noturna das estatinas.', 'Engolir inteiro com água.', ['azitromicina', 'claritromicina', 'varfarina']),
  makeQuickCatalogItem('br-atorvastatina-20', 'Atorvastatina Cálcica 20mg (Lipitor / Citalor)', ['Lipitor 20mg', 'Citalor 20mg', 'Atorvastatina 10mg', 'Atorvastatina 40mg'], 'Atorvastatina Cálcica', 'Hipolipemiante (Estatina)', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia à noite', ['21:00'], true, 30, 'Venda Livre / Simples', 'Controle de hipercolesterolemia (colesterol alto) e proteção arterial.', 'Tomar preferencialmente à noite (21:00).', 'Tomar com água, com ou sem alimentos.', ['claritromicina', 'itraconazol', 'fluconazol']),
  makeQuickCatalogItem('br-jardiance-25', 'Jardiance 25mg (Empagliflozina)', ['Jardiance 25mg', 'Jardiance 10mg', 'Forxiga 10mg', 'Dapagliflozina 10mg'], 'Empagliflozina', 'Antidiabético e Protetor Cardiorrenal (iSGLT2)', 'Uso Contínuo', 'Comprimido', 'comprimidos', 30, '1x ao dia pela manhã', ['08:00'], true, 30, 'Venda Livre / Simples', 'Controle do Diabetes tipo 2, insuficiência cardíaca e proteção renal.', 'Tomar pela manhã (08:00), pois promove eliminação de glicose pela urina ao longo do dia.', 'Manter boa hidratação (beber água ao longo do dia).', ['furosemida', 'prednisona']),
  makeQuickCatalogItem('br-xarelto-20', 'Xarelto 20mg (Rivaroxabana)', ['Xarelto 20mg', 'Xarelto 15mg', 'Xarelto 10mg', 'Rivaroxabana 20mg', 'Eliquis 5mg'], 'Rivaroxabana', 'Anticoagulante Oral Direto', 'Uso Contínuo', 'Comprimido', 'comprimidos', 28, '1x ao dia junto com o almoço ou jantar', ['12:30'], true, 28, 'Venda Livre / Simples', 'Prevenção e tratamento de trombose venosa profunda, embolia pulmonar e fibrilação atrial.', 'As doses de 15mg e 20mg DEVEM ser tomadas junto com uma refeição principal (ex: 12:30 no almoço ou 20:00 no jantar) para garantir 100% de absorção.', 'Ingerir obrigatoriamente com alimentos.', ['ibuprofeno', 'cetoprofeno', 'nimesulida', 'ácido acetilsalicílico', 'clopidogrel']),
  makeQuickCatalogItem('br-clopidogrel-75', 'Bissulfato de Clopidogrel 75mg (Plavix)', ['Plavix 75mg', 'Clopidogrel 75mg', 'Plagrel'], 'Bissulfato de Clopidogrel', 'Antiagregante Plaquetário', 'Uso Contínuo', 'Comprimido', 'comprimidos', 28, '1x ao dia', ['12:30'], true, 28, 'Venda Livre / Simples', 'Prevenção de eventos aterotrombóticos (infarto, AVC e pós-implante de stent coronariano).', 'Tomar 1x ao dia sempre no mesmo horário (ex: 12:30 após o almoço).', 'Se usar protetor gástrico, prefira Pantoprazol em vez de Omeprazol.', ['omeprazol', 'esomeprazol', 'ibuprofeno', 'rivaroxabana']),
  makeQuickCatalogItem('br-sertralina-50', 'Cloridrato de Sertralina 50mg (Zoloft / Assert)', ['Zoloft 50mg', 'Assert 50mg', 'Tolrest 50mg', 'Sertralina 100mg'], 'Cloridrato de Sertralina', 'Antidepressivo e Ansiolítico (ISRS)', 'Receita Retida', 'Comprimido', 'comprimidos', 30, '1x ao dia pela manhã', ['08:00'], true, 30, 'Receita Retida (Branca C1/Antibiótico)', 'Tratamento de ansiedade, depressão, síndrome do pânico e TOC.', 'Tomar pela manhã (08:00) logo após o café da manhã.', 'Ingerir com alimentos para melhor conforto gástrico.', ['tramadol', 'sumatriptana', 'ibuprofeno']),
  makeQuickCatalogItem('br-fluoxetina-20', 'Cloridrato de Fluoxetina 20mg (Prozac / Daforin)', ['Prozac 20mg', 'Daforin 20mg', 'Fluoxetina 20mg'], 'Cloridrato de Fluoxetina', 'Antidepressivo (ISRS)', 'Receita Retida', 'Cápsula', 'cápsulas', 30, '1x ao dia pela manhã', ['08:00'], true, 30, 'Receita Retida (Branca C1/Antibiótico)', 'Depressão, transtorno de ansiedade e compulsão alimentar.', 'Tomar sempre pela manhã (08:00), pois tem perfil ativador e pode dar insônia se tomado à noite.', 'Ingerir com água.', ['tramadol', 'sumatriptana']),
  makeQuickCatalogItem('br-venlafaxina-75', 'Cloridrato de Venlafaxina 75mg (Efexor XR)', ['Efexor XR 75mg', 'Venlafaxina 75mg', 'Venlafaxina 150mg', 'Alenthus XR'], 'Cloridrato de Venlafaxina', 'Antidepressivo Dual (IRSN)', 'Receita Retida', 'Cápsula', 'cápsulas', 30, '1x ao dia pela manhã com alimentos', ['08:00'], true, 30, 'Receita Retida (Branca C1/Antibiótico)', 'Transtorno de ansiedade generalizada, depressão e prevenção de enxaqueca.', 'Tomar pela manhã (08:00) obrigatoriamente junto com o café da manhã.', 'Nunca esquecer doses ou interromper subitamente.', ['tramadol', 'sumatriptana']),
  makeQuickCatalogItem('br-desvenlafaxina-50', 'Succinato de Desvenlafaxina 50mg (Pristiq / Deller)', ['Pristiq 50mg', 'Deller 50mg', 'Desvenlafaxina 100mg', 'Imense'], 'Succinato de Desvenlafaxina Monoidratado', 'Antidepressivo e Ansiolítico (IRSN)', 'Receita Retida', 'Comprimido', 'comprimidos', 30, '1x ao dia', ['08:00'], true, 30, 'Receita Retida (Branca C1/Antibiótico)', 'Controle de depressão e transtornos ansiosos.', 'Tomar 1x ao dia pela manhã (08:00) sempre no mesmo horário.', 'Engolir inteiro sem partir ou mastigar.', ['tramadol', 'sumatriptana']),
  makeQuickCatalogItem('br-zolpidem-10', 'Hemifumarato de Zolpidem 10mg (Stilnox / Patz)', ['Stilnox 10mg', 'Patz SL 5mg', 'Turn 10mg', 'Zolpidem 10mg'], 'Hemifumarato de Zolpidem', 'Indutor Rápido do Sono', 'Receita Retida', 'Comprimido', 'comprimidos', 20, '1x à noite imediatamente ao deitar', ['22:30'], false, 20, 'Receita Retida (Branca C1/Antibiótico)', 'Tratamento de curto prazo da insônia (dificuldade para iniciar o sono).', 'Tomar às 22:30 já deitado na cama, pois a ação inicia em 15 minutos.', 'Deitar-se imediatamente após engolir. Garantir 7 a 8h de sono.', ['clonazepam', 'alprazolam']),
  makeQuickCatalogItem('br-alprazolam-05', 'Alprazolam 0,5mg (Frontal)', ['Frontal 0,5mg', 'Frontal 1mg', 'Alprazolam 1mg', 'Apraz'], 'Alprazolam', 'Ansiolítico Benzodiazepínico', 'Receita Retida', 'Comprimido', 'comprimidos', 30, '1x à noite ou conforme prescrição', ['21:30'], true, 30, 'Receita Azul (Notificação B)', 'Transtornos de ansiedade aguda e síndrome do pânico.', 'Tomar à noite (21:30) ou nos horários definidos pelo médico.', 'Provoca sedação; evite álcool e direção.', ['zolpidem', 'ciclobenzaprina']),
  makeQuickCatalogItem('br-pregabalina-75', 'Pregabalina 75mg (Lyrica / Dorene)', ['Lyrica 75mg', 'Dorene 75mg', 'Pregabalina 150mg', 'Insensa'], 'Pregabalina', 'Neuromodulador para Dor Neuropática e Ansiedade', 'Receita Retida', 'Cápsula', 'cápsulas', 30, '1x à noite ou de 12/12h', ['21:00'], true, 30, 'Receita Retida (Branca C1/Antibiótico)', 'Dor neuropática, fibromialgia, dor ciática e transtorno de ansiedade.', 'Iniciar preferencialmente à noite (21:00) devido à sonolência inicial.', 'Ingerir com água.', ['clonazepam', 'zolpidem']),
  makeQuickCatalogItem('br-donaren-50', 'Donaren 50mg (Cloridrato de Trazodona)', ['Donaren 50mg', 'Donaren Retard 150mg', 'Trazodona 50mg'], 'Cloridrato de Trazodona', 'Antidepressivo e Regulador da Arquitetura do Sono', 'Receita Retida', 'Comprimido', 'comprimidos', 60, '1x à noite antes de dormir', ['21:30'], true, 30, 'Receita Retida (Branca C1/Antibiótico)', 'Insônia, manutenção do sono profundo, ansiedade e depressão.', 'Tomar à noite (21:30) logo após um lanche leve, 30 min antes de dormir.', 'Tomar após comer reduz tontura matinal.', ['clonazepam']),
  makeQuickCatalogItem('br-citoneurin-5000', 'Citoneurin 5000 (Vitaminas B1 + B6 + B12)', ['Citoneurin 5000', 'Complexo B', 'Vitamina B12 Cianocobalamina'], 'Tiamina (B1) + Piridoxina (B6) + Cianocobalamina (B12)', 'Suplemento Neurotrófico do Complexo B', 'Vitaminas', 'Comprimido', 'comprimidos', 20, '1x ao dia após o almoço', ['12:30'], true, 30, 'Venda Livre / Simples', 'Reposição de vitaminas B1, B6 e B12 e alívio de dores neuríticas / formigamentos.', 'Tomar após o almoço (12:30) com água.', 'Engolir sem mastigar.', ['omeprazol', 'metformina']),
  makeQuickCatalogItem('br-neutrofer-300', 'Neutrofer 300mg (Ferro Quelato / Sulfato Ferroso)', ['Neutrofer 300mg', 'Noripurum Comprimidos', 'Combiron', 'Sulfato Ferroso'], 'Glicinato Férrico (Ferro Quelato)', 'Suplemento Antianêmico de Ferro', 'Vitaminas', 'Comprimido', 'comprimidos', 30, '1x ao dia antes do almoço', ['11:30'], true, 60, 'Venda Livre / Simples', 'Prevenção e tratamento de anemia ferropriva (deficiência de ferro e ferritina baixa).', 'Tomar às 11:30 (30 min antes do almoço, longe da Levotiroxina e do Omeprazol da manhã).', 'Tomar com água ou suco de laranja (a vitamina C aumenta a absorção). Evitar leite ou café junto.', ['levotiroxina', 'omeprazol', 'pantoprazol', 'ciprofloxacino', 'carbonato de cálcio']),
  makeQuickCatalogItem('br-targifor-c', 'Targifor C 1g (Vitamina C + Aspartato de Arginina)', ['Targifor C', 'Redoxon 1g', 'Cewin 500mg', 'Vitamina C'], 'Ácido Ascórbico (Vitamina C) + Aspartato de Arginina', 'Suplemento Vitamínico e Imunidade', 'Vitaminas', 'Comprimido', 'comprimidos', 16, '1x ao dia pela manhã', ['08:30'], false, 16, 'Venda Livre / Simples', 'Combate ao cansaço físico, fadiga e reforço do sistema imunológico.', 'Tomar pela manhã (08:30) após o café da manhã.', 'Dissolver em um copo de água (se efervescente) ou engolir com água.', []),
  makeQuickCatalogItem('br-omega-3', 'Ômega 3 EPA + DHA 1000mg', ['Ômega 3 1000mg', 'Lavitan A-Z', 'Centrum', 'Magnésio Dimalato'], 'Ácidos Graxos EPA e DHA (Óleo de Peixe)', 'Suplemento Cardiovascular e Cognitivo', 'Vitaminas', 'Cápsula', 'cápsulas', 60, '1 a 2x ao dia junto às refeições', ['12:30', '20:00'], true, 60, 'Venda Livre / Simples', 'Saúde cardiovascular, controle de triglicerídeos e suporte cerebral.', 'Tomar junto com o almoço (12:30) e/ou jantar (20:00).', 'Ingerir junto às refeições evita sabor residual.', [])
];

ANVISA_CLINICAL_CATALOG.push(...EXTRA_BRAZIL_MEDICATIONS);

// Função para normalizar strings para comparação clínica (remove acentos e caixa)
export const normalizeClinicalText = (str: string): string => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Busca instantânea no catálogo ANVISA por nome comercial, genérico, apelido, princípio ativo ou sintoma
export const searchAnvisaCatalog = (query: string): AnvisaCatalogItem[] => {
  const q = normalizeClinicalText(query);
  if (!q || q.length < 2) return ANVISA_CLINICAL_CATALOG.slice(0, 10);

  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = ANVISA_CLINICAL_CATALOG.map((item) => {
    const normName = normalizeClinicalText(item.name);
    const normActive = normalizeClinicalText(item.activeIngredient);
    const normAliases = item.brandAliases.map(normalizeClinicalText);
    const normPurpose = normalizeClinicalText(item.purpose);
    const normCategory = normalizeClinicalText(item.category);

    let score = 0;
    if (normName.startsWith(q)) score += 100;
    else if (normName.includes(q)) score += 70;

    if (normAliases.some((a) => a.startsWith(q))) score += 90;
    else if (normAliases.some((a) => a.includes(q))) score += 65;

    if (normActive.startsWith(q)) score += 80;
    else if (normActive.includes(q)) score += 55;

    if (normPurpose.includes(q) || normCategory.includes(q)) score += 30;

    // Multi-word token match (ex: "dipirona 1g", "puran 50", "dor de cabeca")
    if (tokens.length > 1) {
      const fullHaystack = `${normName} ${normActive} ${normAliases.join(' ')} ${normPurpose}`;
      const matchedTokens = tokens.filter((t) => fullHaystack.includes(t));
      if (matchedTokens.length === tokens.length) {
        score += 60;
      }
    }

    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 15).map((entry) => entry.item);
};

// Encontra correspondência no catálogo ANVISA dado um nome ou princípio ativo
export const findCatalogMatchForMedication = (
  name: string,
  activeIngredient?: string
): AnvisaCatalogItem | null => {
  const normName = normalizeClinicalText(name);
  const normActive = normalizeClinicalText(activeIngredient || '');

  for (const item of ANVISA_CLINICAL_CATALOG) {
    const itemNormName = normalizeClinicalText(item.name);
    const itemNormActive = normalizeClinicalText(item.activeIngredient);
    const baseWord = itemNormActive.split(' ')[0];

    if (
      normName === itemNormName ||
      normName.includes(baseWord) ||
      (normActive && normActive.includes(baseWord)) ||
      item.brandAliases.some((a) => normName.includes(normalizeClinicalText(a.split(' ')[0])))
    ) {
      return item;
    }
  }
  return null;
};

// Motor de Verificação de Interações Medicamentosas entre um medicamento (novo ou existente) e a lista atual do paciente
export const analyzeDrugInteractions = (
  targetMed: {
    id?: string;
    name: string;
    activeIngredient: string;
    interactingSubstances?: string[];
  },
  existingMedications: Medication[]
): DrugInteractionAlert[] => {
  const alerts: DrugInteractionAlert[] = [];
  const targetText = normalizeClinicalText(
    `${targetMed.name} ${targetMed.activeIngredient}`
  );

  if (!targetText) return alerts;

  existingMedications.forEach((existing) => {
    if (targetMed.id && existing.id === targetMed.id) return;

    const existingText = normalizeClinicalText(
      `${existing.name} ${existing.activeIngredient}`
    );

    // 1. Verificar duplicidade de Princípio Ativo (mesmo remédio com nomes diferentes, ex: Novalgina + Dipirona ou Tylenol + Paracetamol)
    const targetCatalog = findCatalogMatchForMedication(
      targetMed.name,
      targetMed.activeIngredient
    );
    const existingCatalog = findCatalogMatchForMedication(
      existing.name,
      existing.activeIngredient
    );

    const targetActiveClean = normalizeClinicalText(
      targetMed.activeIngredient || targetCatalog?.activeIngredient || ''
    );
    const existingActiveClean = normalizeClinicalText(
      existing.activeIngredient || existingCatalog?.activeIngredient || ''
    );

    if (
      targetActiveClean &&
      existingActiveClean &&
      targetActiveClean.length >= 4 &&
      (targetActiveClean === existingActiveClean ||
        targetActiveClean.includes(existingActiveClean.split(' ')[0]) &&
          existingActiveClean.split(' ')[0].length >= 6)
    ) {
      alerts.push({
        id: `dup-${existing.id}-${targetMed.name}`,
        severity: 'alta',
        severityLabel: 'Duplicidade de Princípio Ativo (Risco de Superdosagem)',
        newMedName: targetMed.name,
        newMedActiveIngredient: targetMed.activeIngredient || targetCatalog?.activeIngredient || targetMed.name,
        existingMedId: existing.id,
        existingMedName: existing.name,
        existingMedActiveIngredient: existing.activeIngredient || existingCatalog?.activeIngredient || existing.name,
        efficacyImpact: `Você já possui "${existing.name}" cadastrado com o mesmo princípio ativo. Tomar ambos simultaneamente pode causar superdosagem.`,
        clinicalMechanism: 'Duplicidade farmacológica do mesmo princípio ativo em apresentações ou marcas diferentes.',
        recommendation: 'Verifique com seu médico se o novo medicamento substitui o anterior ou se ambos pertencem à mesma prescrição antes de administrar juntos.'
      });
      return;
    }

    // 2. Verificar regras clínicas de interação (Grupo A <-> Grupo B)
    for (const rule of CLINICAL_INTERACTION_RULES) {
      const targetInA = rule.groupA.some((term) =>
        targetText.includes(normalizeClinicalText(term))
      );
      const existingInB = rule.groupB.some((term) =>
        existingText.includes(normalizeClinicalText(term))
      );

      const targetInB = rule.groupB.some((term) =>
        targetText.includes(normalizeClinicalText(term))
      );
      const existingInA = rule.groupA.some((term) =>
        existingText.includes(normalizeClinicalText(term))
      );

      if ((targetInA && existingInB) || (targetInB && existingInA)) {
        const alertId = `rule-${existing.id}-${rule.severityLabel}`;
        if (!alerts.some((a) => a.existingMedId === existing.id)) {
          alerts.push({
            id: alertId,
            severity: rule.severity,
            severityLabel: rule.severityLabel,
            newMedName: targetMed.name,
            newMedActiveIngredient:
              targetMed.activeIngredient ||
              targetCatalog?.activeIngredient ||
              targetMed.name,
            existingMedId: existing.id,
            existingMedName: existing.name,
            existingMedActiveIngredient:
              existing.activeIngredient ||
              existingCatalog?.activeIngredient ||
              existing.name,
            efficacyImpact: rule.efficacyImpact,
            clinicalMechanism: rule.clinicalMechanism,
            recommendation: rule.recommendation,
            suggestedSpacingHours: rule.suggestedSpacingHours
          });
        }
      }
    }

    // 3. Verificar lista customizada de substâncias conflitantes da bula baixada via API
    if (
      targetMed.interactingSubstances &&
      targetMed.interactingSubstances.length > 0
    ) {
      const matchedSubstance = targetMed.interactingSubstances.find((sub) => {
        const cleanSub = normalizeClinicalText(sub);
        return cleanSub.length >= 4 && existingText.includes(cleanSub);
      });

      if (
        matchedSubstance &&
        !alerts.some((a) => a.existingMedId === existing.id)
      ) {
        alerts.push({
          id: `bula-${existing.id}-${matchedSubstance}`,
          severity: 'moderada',
          severityLabel: 'Interação Identificada na Bula',
          newMedName: targetMed.name,
          newMedActiveIngredient:
            targetMed.activeIngredient || targetMed.name,
          existingMedId: existing.id,
          existingMedName: existing.name,
          existingMedActiveIngredient:
            existing.activeIngredient || existing.name,
          efficacyImpact: `A bula de "${targetMed.name}" aponta interação farmacológica com "${existing.name}" (${matchedSubstance}), podendo alterar a eficácia ou absorção.`,
          clinicalMechanism: 'Interação descrita na seção de interações medicamentosas da bula oficial.',
          recommendation: 'Espaçar os horários de administração em pelo menos 2 a 3 horas e confirmar a associação com seu médico ou farmacêutico.',
          suggestedSpacingHours: 2
        });
      }
    }
  });

  return alerts;
};

// Sanitiza e garante que todos os campos de MedicationBula respeitam os limites exatos do Firestore Rules
export const sanitizeBulaForFirestore = (
  raw: Partial<MedicationBula>,
  userId: string,
  medicationId: string,
  medicationName: string,
  activeIngredient: string
): MedicationBula => {
  const catalogMatch = findCatalogMatchForMedication(
    medicationName,
    activeIngredient
  );

  const recTimes = Array.isArray(raw.recommendedTimes) && raw.recommendedTimes.length > 0
    ? raw.recommendedTimes.slice(0, 12).map((t) => String(t).slice(0, 10))
    : catalogMatch?.recommendedTimes || ['08:00'];

  const interSubs = Array.isArray(raw.interactingSubstances) && raw.interactingSubstances.length > 0
    ? raw.interactingSubstances.slice(0, 40).map((s) => String(s).slice(0, 80))
    : catalogMatch?.bula.interactingSubstances || [];

  return {
    id: medicationId.slice(0, 128),
    userId: userId.slice(0, 128),
    medicationId: medicationId.slice(0, 128),
    medicationName: (raw.medicationName || medicationName || 'Medicamento').slice(0, 160),
    activeIngredient: (
      raw.activeIngredient ||
      activeIngredient ||
      catalogMatch?.activeIngredient ||
      medicationName
    ).slice(0, 160),
    therapeuticClass: (
      raw.therapeuticClass ||
      catalogMatch?.therapeuticClass ||
      'Uso Clínico Sob Orientação'
    ).slice(0, 120),
    indications: (
      raw.indications ||
      catalogMatch?.bula.indications ||
      catalogMatch?.purpose ||
      'Indicado conforme prescrição médica para o tratamento clínico descrito.'
    ).slice(0, 1500),
    howItWorks: (
      raw.howItWorks ||
      catalogMatch?.bula.howItWorks ||
      'Atua farmacologicamente no organismo para promover o efeito terapêutico esperado após absorção.'
    ).slice(0, 1200),
    contraindications: (
      raw.contraindications ||
      catalogMatch?.bula.contraindications ||
      'Contraindicado em caso de hipersensibilidade conhecida ao princípio ativo ou a qualquer componente da fórmula.'
    ).slice(0, 1200),
    warnings: (
      raw.warnings ||
      catalogMatch?.bula.warnings ||
      'Utilize rigorosamente nas doses e horários recomendados pelo seu médico. Informe seu médico sobre outros medicamentos em uso.'
    ).slice(0, 1500),
    interactionsSummary: (
      raw.interactionsSummary ||
      catalogMatch?.bula.interactionsSummary ||
      'Informe seu médico ou farmacêutico caso utilize medicamentos contínuos para pressão, tireoide, diabetes, anticoagulantes ou anti-inflamatórios.'
    ).slice(0, 1500),
    posologyGuidance: (
      raw.posologyGuidance ||
      catalogMatch?.bula.posologyGuidance ||
      catalogMatch?.dosageInstruction ||
      'Administrar por via oral conforme posologia e intervalos definidos na receita médica.'
    ).slice(0, 1200),
    bestTimeGuidance: (
      raw.bestTimeGuidance ||
      catalogMatch?.bestTimeGuidance ||
      'Inicie preferencialmente em um horário fixo pela manhã (08:00) ou conforme o intervalo da receita médica para manter níveis estáveis no organismo.'
    ).slice(0, 800),
    recommendedTimes: recTimes,
    administrationTips: (
      raw.administrationTips ||
      catalogMatch?.administrationTips ||
      'Ingerir com um copo de água em temperatura ambiente, mantendo a regularidade dos horários.'
    ).slice(0, 1000),
    missedDoseGuidance: (
      raw.missedDoseGuidance ||
      catalogMatch?.bula.missedDoseGuidance ||
      'Caso esqueça uma dose, tome-a assim que lembrar. Se já estiver próximo do horário da próxima dose, aguarde o horário habitual sem dobrar a dose.'
    ).slice(0, 800),
    adverseReactions: (
      raw.adverseReactions ||
      catalogMatch?.bula.adverseReactions ||
      'Podem ocorrer reações leves e transitórias em pacientes sensíveis; comunique seu médico caso note qualquer sintoma incomum.'
    ).slice(0, 1200),
    storageAdvice: (
      raw.storageAdvice ||
      catalogMatch?.bula.storageAdvice ||
      'Conservar em temperatura ambiente (entre 15°C e 30°C), protegido da luz e da umidade, em sua embalagem original.'
    ).slice(0, 600),
    interactingSubstances: interSubs,
    sourceApi: (
      raw.sourceApi ||
      (catalogMatch
        ? 'Bulário Clínico ANVISA (Base Oficial)'
        : 'API Farmacêutica & Bulário Digital')
    ).slice(0, 120),
    downloadedAt: (raw.downloadedAt || new Date().toISOString().slice(0, 19)).slice(0, 40)
  };
};
