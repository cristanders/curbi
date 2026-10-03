import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Topbar, TopbarActive } from '../shell/topbar';

export type LearnCategory = 'all' | 'basics' | 'expenses' | 'credit' | 'future';
export type ActiveTab = 'lessons' | 'calculators' | 'glossary';

export interface Lesson {
  id: string;
  category: 'basics' | 'expenses' | 'credit' | 'future';
  categoryLabel: string;
  title: string;
  readTime: string;
  level: 'Básico' | 'Intermedio' | 'Avanzado';
  summary: string;
  icon: string;
  keyPoints: string[];
  content: string[];
  actionTip: string;
  curbiLink?: {
    label: string;
    route: string;
  };
}

export interface GlossaryTerm {
  id: string;
  term: string;
  shortDesc: string;
  explanation: string;
  example: string;
  tag: string;
  tagId: 'BASICS' | 'SAVINGS' | 'BUDGETS' | 'INVESTMENT' | 'CREDIT' | 'ECONOMY' | 'FINANCE';
}

@Component({
  imports: [CommonModule, FormsModule, RouterLink, Topbar, TranslatePipe],
  selector: 'app-learn',
  styleUrl: './learn.css',
  templateUrl: './learn.html',
})
export class Learn implements OnInit {
  readonly active: TopbarActive = 'learn';
  readonly activeTab = signal<ActiveTab>('lessons');
  readonly selectedCategory = signal<LearnCategory>('all');
  readonly selectedLesson = signal<Lesson | null>(null);
  readonly completedLessons = signal<string[]>([]);
  readonly glossarySearch = signal<string>('');

  private readonly translate = inject(TranslateService);

  // Calculadora de Gastos Hormiga
  readonly bugExpenseName = signal<string>('Café y snacks diarios');
  readonly bugExpenseAmount = signal<number>(25);
  readonly bugExpenseDays = signal<number>(5);

  // Calculadora Regla 50/30/20
  readonly salaryInput = signal<number>(5000);

  // Calculadora Fondo de Emergencia
  readonly emergencyMonthlyExpenses = signal<number>(3200);
  readonly emergencyMonths = signal<number>(3);
  readonly emergencySavingsMonthsTarget = signal<number>(12);

  // Glosario
  readonly terms: GlossaryTerm[] = [
    {
      id: 'emergency-fund',
      term: 'Fondo de Emergencia',
      shortDesc: 'Tu red de seguridad financiera ante imprevistos.',
      explanation:
        'Es una cantidad de dinero reservada exclusivamente para emergencias reales (problemas de salud, reparaciones mecánicas urgentes o pérdida temporal de empleo). Lo ideal es tener entre 3 y 6 meses de tus gastos fijos básicos.',
      example: 'Si tus gastos fijos son Q3,000 al mes, un fondo de 3 meses sería de Q9,000.',
      tag: 'Fundamentos',
      tagId: 'BASICS',
    },
    {
      id: 'micro-expenses',
      term: 'Gastos Hormiga',
      shortDesc: 'Pequeñas compras cotidianas que pasan desapercibidas.',
      explanation:
        'Son aquellos gastos de bajo monto que hacemos casi a diario sin pensarlo (café de camino al trabajo, snacks, propinas extras, suscripciones no utilizadas). Individualmente parecen inofensivos, pero al mes o al año suman una cifra enorme.',
      example: 'Gastar Q20 diarios en golosinas equivale a Q600 al mes y Q7,200 al año.',
      tag: 'Ahorro',
      tagId: 'SAVINGS',
    },
    {
      id: 'rule-50-30-20',
      term: 'Regla 50 / 30 / 20',
      shortDesc: 'Fórmula sencilla para repartir tus ingresos mensuales.',
      explanation:
        'Un método clásico de presupuesto: el 50% de tus ingresos se destina a Necesidades básicas (vivienda, comida, servicios), el 30% a Deseos/Estilo de vida (salidas, entretenimiento) y el 20% al Ahorro o pago de deudas.',
      example:
        'Con un sueldo de Q5,000: Q2,500 para necesidades, Q1,500 para gustos y Q1,000 para ahorro.',
      tag: 'Presupuestos',
      tagId: 'BUDGETS',
    },
    {
      id: 'compound-interest',
      term: 'Interés Compuesto',
      shortDesc: 'Ganar intereses sobre los intereses ya ganados.',
      explanation:
        'Es el efecto multiplicador del dinero a lo largo del tiempo. Cuando ahorras o inviertes, las ganancias que generas se suman a tu capital original, y en el siguiente ciclo generas intereses sobre un monto mayor.',
      example:
        'Si ahorras Q1,000 al 5% anual, el primer año ganas Q50. El segundo año ganas el 5% sobre Q1,050.',
      tag: 'Inversión',
      tagId: 'INVESTMENT',
    },
    {
      id: 'full-payer',
      term: 'Totalero (Tarjeta de Crédito)',
      shortDesc: 'Persona que paga el 100% de su estado de cuenta cada mes.',
      explanation:
        'Ser totalero significa pagar el saldo total adeudado antes de la fecha límite de pago. De esta manera disfrutas de los beneficios de la tarjeta (seguridad, puntos, financiamiento temporal) sin pagar ni un solo centavo de intereses.',
      example: 'Compraste Q800 en el mes y pagas exactamente Q800 en la fecha de pago.',
      tag: 'Crédito',
      tagId: 'CREDIT',
    },
    {
      id: 'inflation',
      term: 'Inflación',
      shortDesc: 'El aumento generalizado de precios y la pérdida de poder adquisitivo.',
      explanation:
        'Es cuando las cosas que compras habitualmente suben de precio con el tiempo, haciendo que con el mismo dinero puedas comprar menos productos que antes. Por eso dejar dinero guardado bajo el colchón pierde valor.',
      example: 'Si un almuerzo costaba Q30 el año pasado y hoy cuesta Q33, la inflación fue del 10%.',
      tag: 'Economía',
      tagId: 'ECONOMY',
    },
    {
      id: 'liquidity',
      term: 'Liquidez',
      shortDesc: 'La rapidez con la que puedes convertir un activo en dinero en efectivo.',
      explanation:
        'El dinero en tu cuenta bancaria de CURBI es 100% líquido porque puedes transferirlo de inmediato. Una casa o un automóvil tienen baja liquidez porque tardas semanas o meses en venderlos para tener efectivo.',
      example: 'Tener dinero en tu cuenta monetaria o de ahorros te da liquidez instantánea.',
      tag: 'Finanzas',
      tagId: 'FINANCE',
    },
    {
      id: 'zero-based-budget',
      term: 'Presupuesto Base Cero',
      shortDesc: 'Darle un propósito específico a cada centavo que entra.',
      explanation:
        'Consiste en asignar cada quetzal de tus ingresos a una categoría (necesidades, gustos, ahorros, deudas) hasta que la resta de Ingresos - Gastos/Ahorros sea exactamente cero. No significa gastar todo, sino planificar todo.',
      example:
        'Si ganas Q4,000, asignas exactamente Q4,000 distribuidos entre tus gastos y tus metas.',
      tag: 'Presupuestos',
      tagId: 'BUDGETS',
    },
  ];

  // Lecciones completas
  readonly lessons: Lesson[] = [
    {
      id: 'regla-50-30-20',
      category: 'basics',
      categoryLabel: 'Fundamentos',
      title: 'La regla 50 / 30 / 20 para organizar tu dinero',
      readTime: '3 min',
      level: 'Básico',
      icon: '01',
      summary:
        'Aprende a distribuir tus ingresos sin cálculos complicados ni privarte de las cosas que te gustan.',
      keyPoints: [
        '50% para Necesidades básicas indispensables para vivir.',
        '30% para Deseos y estilo de vida (gastos personales y recreación).',
        '20% para tu Futuro: ahorro, metas y fondo de emergencia.',
      ],
      content: [
        'Muchas personas creen que hacer un presupuesto significa recortar todos los gustos y vivir con restricciones extremas. La realidad es que un presupuesto bien hecho te da permiso para gastar en lo que disfrutas sin culpa.',
        'La regla 50/30/20 es el punto de partida ideal: toma tus ingresos netos del mes (lo que realmente llega a tu cuenta) y divídelo en tres partes.',
        'El 50% se va en Necesidades: alquiler, hipoteca, comida básica del supermercado, luz, agua, transporte y medicamentos. Si tus necesidades superan el 50%, tu meta debe ser buscar opciones para optimizar esos costos fijos.',
        'El 30% es para tus Deseos: salidas a comer, cine, compras personales, suscripciones de streaming y pasatiempos. Este porcentaje es vital para mantener la motivación.',
        'El 20% es para tu Yo del Futuro: ahorros en tus metas de CURBI, aportes a tu fondo de emergencia o abono a deudas si las tienes.',
      ],
      actionTip:
        'Ve a la pestaña "Calculadoras" para calcular tu desglose 50/30/20 personalizado en segundos.',
      curbiLink: {
        label: 'Configurar presupuestos en CURBI',
        route: '/saves',
      },
    },
    {
      id: 'fondo-emergencia',
      category: 'basics',
      categoryLabel: 'Fundamentos',
      title: 'Tu primer Fondo de Emergencia',
      readTime: '3 min',
      level: 'Básico',
      icon: '02',
      summary:
        'Descubre por qué un colchón para imprevistos es la mejor protección contra las deudas.',
      keyPoints: [
        'Una emergencia no es un capricho: es salud, trabajo o reparaciones urgentes.',
        'La meta recomendada es acumular entre 3 y 6 meses de tus gastos fijos.',
        'Guárdalo en un lugar accesible pero separado de tu dinero de gasto diario.',
      ],
      content: [
        'La vida está llena de imprevistos: una visita al dentista, una llanta pinchada o un electrodoméstico que se arruina. Cuando no tienes un fondo de emergencia, cualquier gasto inesperado te obliga a endeudarte con tarjetas o préstamos caros.',
        'El fondo de emergencia no es para generar grandes rendimientos, sino para darte tranquilidad y evitar que un tropiezo temporal destruya tus finanzas.',
        '¿Cuánto necesitas? Si tus gastos esenciales son Q2,500 al mes, una meta inicial excelente es juntar Q2,500 (1 mes) y progresar paulatinamente hasta alcanzar Q7,500 (3 meses).',
        'Crea una meta de ahorro dedicada en CURBI llamada "Fondo de Emergencia" y programa aportes quincenales constantes.',
      ],
      actionTip:
        'Empieza con una meta pequeña pero alcanzable, como ahorrar Q200 esta quincena en tu meta de emergencia.',
      curbiLink: {
        label: 'Crear Meta de Emergencia',
        route: '/saves',
      },
    },
    {
      id: 'gastos-hormiga',
      category: 'expenses',
      categoryLabel: 'Control de Gastos',
      title: 'Control de Gastos Hormiga y compras impulsivas',
      readTime: '2 min',
      level: 'Básico',
      icon: '03',
      summary:
        'Cómo identificar los pequeños consumos diarios que reducen tu capacidad de ahorro.',
      keyPoints: [
        'Los gastos hormiga parecen insignificantes en el día a día pero son relevantes al año.',
        'Identificarlos no significa eliminarlos todos, sino elegir cuáles realmente aportan valor.',
        'La regla de las 48 horas te ayudará a evaluar compras antes de pagar.',
      ],
      content: [
        '¿Alguna vez te has preguntado en qué se fue el presupuesto del mes? Casi siempre la respuesta son los gastos no planificados.',
        'Un café diario, suscripciones a servicios en desuso o pagos extras de envíos pueden sumar una cifra considerable al cabo de unas semanas.',
        'Para gestionarlos: 1) Revisa tus movimientos en CURBI e identifica patrones de consumo. 2) Aplica la "Regla de las 48 horas": ante una compra no planificada, espera dos días. Si después de 48 horas todavía es necesaria, adquiérela.',
      ],
      actionTip:
        'Haz una revisión de tus suscripciones activas y cancela al menos una que no hayas utilizado recientemente.',
      curbiLink: {
        label: 'Ver mis últimos movimientos',
        route: '/transactions',
      },
    },
    {
      id: 'tarjetas-credito',
      category: 'credit',
      categoryLabel: 'Crédito y Deudas',
      title: 'Tarjetas de Crédito: Uso responsable y sin intereses',
      readTime: '3 min',
      level: 'Intermedio',
      icon: '04',
      summary:
        'Aprende a aprovechar los beneficios de una tarjeta de crédito sin generar cargos por financiamiento.',
      keyPoints: [
        'Fecha de corte: el día en que el banco totaliza los consumos del periodo.',
        'Fecha de pago: el plazo límite para liquidar lo consumido sin recargos.',
        'Pagar el saldo total es la regla clave para evitar el pago de intereses.',
      ],
      content: [
        'La tarjeta de crédito no es una extensión de los ingresos: es un medio de pago que requiere respaldo en tus cuentas.',
        'Usada adecuadamente, ofrece seguridad en transacciones, beneficios en compras y financiamiento temporal a corto plazo.',
        'Para mantener un historial sano: no comprometas montos superiores a tus fondos disponibles y liquida el total del estado de cuenta antes del vencimiento.',
      ],
      actionTip: 'Programa un aviso previo a tu fecha de corte para revisar tus saldos.',
      curbiLink: {
        label: 'Administrar mis cuentas',
        route: '/wallet',
      },
    },
    {
      id: 'metodo-bola-de-nieve',
      category: 'credit',
      categoryLabel: 'Crédito y Deudas',
      title: 'Método Bola de Nieve para liquidación de deudas',
      readTime: '3 min',
      level: 'Intermedio',
      icon: '05',
      summary:
        'Una estrategia progresiva y estructurada para ordenar y liquidar compromisos financieros.',
      keyPoints: [
        'Organiza tus deudas de menor a mayor saldo.',
        'Cubre el pago mínimo en todas y concentra el saldo disponible en la menor.',
        'Al cancelar la primera, traslada ese flujo de pago a la siguiente obligación.',
      ],
      content: [
        'El método bola de nieve permite ganar tracción enfocándose en metas alcanzables a corto plazo.',
        'Paso 1: Registra tus obligaciones pendientes ordenadas por monto.',
        'Paso 2: Mantén los pagos mínimos al día para conservar un buen estado crediticio.',
        'Paso 3: Dirige cualquier ingreso adicional a amortizar la obligación más pequeña hasta liquidarla por completo.',
        'Al cerrar la primera deuda, la cuota liberada se suma directamente al pago de la siguiente, acelerando el proceso de forma continua.',
      ],
      actionTip:
        'Lista tus saldos pendientes y calcula el plazo estimado para liquidar la menor de tus obligaciones.',
      curbiLink: {
        label: 'Ver Metas de Ahorro',
        route: '/saves',
      },
    },
    {
      id: 'interes-compuesto',
      category: 'future',
      categoryLabel: 'Inversión y Futuro',
      title: 'El Interés Compuesto y la constancia de ahorro',
      readTime: '3 min',
      level: 'Avanzado',
      icon: '06',
      summary:
        'Cómo los rendimientos continuos potencian el crecimiento del capital a mediano y largo plazo.',
      keyPoints: [
        'El interés compuesto reinvierte las ganancias para generar nuevos rendimientos.',
        'El factor tiempo es determinante para la acumulación de capital.',
        'La regularidad de los aportes tiene mayor impacto que montos aislados.',
      ],
      content: [
        'El principio del interés compuesto consiste en sumar las ganancias periódicas al capital principal, de modo que en el siguiente ciclo el cálculo se realice sobre una base mayor.',
        'Por ejemplo, aportes mensuales constantes de Q300 con un rendimiento moderado generan un crecimiento geométrico tras varios periodos, superando con creces el ahorro estático en efectivo.',
        'El valor fundamental radica en la disciplina de mantener los depósitos y respetar los plazos establecidos.',
      ],
      actionTip:
        'Define un aporte periódico automático, sin importar que el monto inicial sea modesto.',
      curbiLink: {
        label: 'Ver Metas de Ahorro',
        route: '/saves',
      },
    },
  ];

  // Cálculos reactivos para la calculadora de Gastos Hormiga
  readonly bugWeekly = computed(() => this.bugExpenseAmount() * this.bugExpenseDays());
  readonly bugMonthly = computed(() => this.bugWeekly() * 4.33);
  readonly bugYearly = computed(() => this.bugWeekly() * 52);
  readonly bugThreeYears = computed(() => this.bugYearly() * 3);
  readonly bugFiveYearsWithInterest = computed(() => {
    // Estimación con rendimiento conservador del 6% anual
    const monthly = this.bugMonthly();
    let total = 0;
    for (let m = 0; m < 60; m++) {
      total = (total + monthly) * (1 + 0.06 / 12);
    }
    return Math.round(total);
  });

  // Cálculos reactivos para la calculadora 50/30/20
  readonly ruleNeeds = computed(() => Math.round(this.salaryInput() * 0.5));
  readonly ruleWants = computed(() => Math.round(this.salaryInput() * 0.3));
  readonly ruleSavings = computed(() => Math.round(this.salaryInput() * 0.2));

  // Cálculos reactivos para la calculadora de Fondo de Emergencia
  readonly emergencyTarget = computed(
    () => this.emergencyMonthlyExpenses() * this.emergencyMonths(),
  );
  readonly emergencyMonthlyDeposit = computed(() => {
    const target = this.emergencyTarget();
    const months = this.emergencySavingsMonthsTarget() || 1;
    return Math.round(target / months);
  });

  // Lecciones filtradas
  readonly filteredLessons = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.lessons;
    return this.lessons.filter((l) => l.category === cat);
  });

  // Glosario filtrado
  readonly filteredTerms = computed(() => {
    const query = this.glossarySearch().toLowerCase().trim();
    if (!query) return this.terms;
    return this.terms.filter((t) => {
      const termTr = this.translate.instant(`LEARN.GLOSSARY.TERMS.${t.id}.TERM`)?.toLowerCase() || '';
      const expTr = this.translate.instant(`LEARN.GLOSSARY.TERMS.${t.id}.EXPLANATION`)?.toLowerCase() || '';
      const shortTr = this.translate.instant(`LEARN.GLOSSARY.TERMS.${t.id}.SHORT_DESC`)?.toLowerCase() || '';
      const tagTr = this.translate.instant(`LEARN.GLOSSARY.TAGS.${t.tagId}`)?.toLowerCase() || '';
      return (
        t.term.toLowerCase().includes(query) ||
        t.explanation.toLowerCase().includes(query) ||
        t.shortDesc.toLowerCase().includes(query) ||
        t.tag.toLowerCase().includes(query) ||
        termTr.includes(query) ||
        expTr.includes(query) ||
        shortTr.includes(query) ||
        tagTr.includes(query)
      );
    });
  });

  // Progreso general
  readonly completedCount = computed(() => this.completedLessons().length);
  readonly progressPercentage = computed(() =>
    Math.round((this.completedCount() / this.lessons.length) * 100),
  );

  readonly userLevel = computed(() => {
    const count = this.completedCount();
    if (count >= 5) {
      return {
        title: this.translate.instant('LEARN.LEVELS.STRATEGIST.TITLE') || 'Estratega Financiero',
        desc: this.translate.instant('LEARN.LEVELS.STRATEGIST.DESC') || 'Dominio avanzado de finanzas personales',
      };
    }
    if (count >= 2) {
      return {
        title: this.translate.instant('LEARN.LEVELS.SAVER.TITLE') || 'Ahorrador Consciente',
        desc: this.translate.instant('LEARN.LEVELS.SAVER.DESC') || 'Hábitos financieros en desarrollo',
      };
    }
    return {
      title: this.translate.instant('LEARN.LEVELS.LEARNER.TITLE') || 'En Aprendizaje',
      desc: this.translate.instant('LEARN.LEVELS.LEARNER.DESC') || 'Explora las guías para empezar',
    };
  });

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('curbi_completed_lessons');
        if (saved) {
          this.completedLessons.set(JSON.parse(saved));
        }
      } catch {
        /* ignore */
      }
    }
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }

  setCategory(cat: LearnCategory): void {
    this.selectedCategory.set(cat);
  }

  openLesson(lesson: Lesson): void {
    this.selectedLesson.set(lesson);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeLesson(): void {
    this.selectedLesson.set(null);
  }

  toggleLessonComplete(id: string): void {
    const current = this.completedLessons();
    let updated: string[];
    if (current.includes(id)) {
      updated = current.filter((x) => x !== id);
    } else {
      updated = [...current, id];
    }
    this.completedLessons.set(updated);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('curbi_completed_lessons', JSON.stringify(updated));
      } catch {
        /* ignore */
      }
    }
  }

  isLessonCompleted(id: string): boolean {
    return this.completedLessons().includes(id);
  }

  setGlossaryFilter(term: string): void {
    this.glossarySearch.set(term);
  }

  getLessonTitle(lesson: Lesson): string {
    const key = `LEARN.LESSONS.${lesson.id}.TITLE`;
    const tr = this.translate.instant(key);
    return tr && tr !== key ? tr : lesson.title;
  }

  getLessonSummary(lesson: Lesson): string {
    const key = `LEARN.LESSONS.${lesson.id}.SUMMARY`;
    const tr = this.translate.instant(key);
    return tr && tr !== key ? tr : lesson.summary;
  }

  getLessonActionTip(lesson: Lesson): string {
    const key = `LEARN.LESSONS.${lesson.id}.ACTION_TIP`;
    const tr = this.translate.instant(key);
    return tr && tr !== key ? tr : lesson.actionTip;
  }

  getLessonLinkLabel(lesson: Lesson): string {
    const key = `LEARN.LESSONS.${lesson.id}.LINK_LABEL`;
    const tr = this.translate.instant(key);
    return tr && tr !== key ? tr : (lesson.curbiLink?.label || '');
  }

  getLessonLevel(lesson: Lesson): string {
    const mapLevel: Record<string, string> = {
      Básico: 'LEARN.LEVELS.BASIC',
      Intermedio: 'LEARN.LEVELS.INTERMEDIATE',
      Avanzado: 'LEARN.LEVELS.ADVANCED',
    };
    const key = mapLevel[lesson.level];
    if (key) {
      const tr = this.translate.instant(key);
      if (tr && tr !== key) return tr;
    }
    return lesson.level;
  }

  getLessonCategory(lesson: Lesson): string {
    const key = `LEARN.CATEGORIES.${lesson.category.toUpperCase()}`;
    const tr = this.translate.instant(key);
    return tr && tr !== key ? tr : lesson.categoryLabel;
  }

  getTermName(item: GlossaryTerm): string {
    const key = `LEARN.GLOSSARY.TERMS.${item.id}.TERM`;
    const tr = this.translate.instant(key);
    return tr && tr !== key ? tr : item.term;
  }

  getTermTag(item: GlossaryTerm): string {
    const key = `LEARN.GLOSSARY.TAGS.${item.tagId}`;
    const tr = this.translate.instant(key);
    return tr && tr !== key ? tr : item.tag;
  }

  getTermShortDesc(item: GlossaryTerm): string {
    const key = `LEARN.GLOSSARY.TERMS.${item.id}.SHORT_DESC`;
    const tr = this.translate.instant(key);
    return tr && tr !== key ? tr : item.shortDesc;
  }

  getTermExplanation(item: GlossaryTerm): string {
    const key = `LEARN.GLOSSARY.TERMS.${item.id}.EXPLANATION`;
    const tr = this.translate.instant(key);
    return tr && tr !== key ? tr : item.explanation;
  }

  getTermExample(item: GlossaryTerm): string {
    const key = `LEARN.GLOSSARY.TERMS.${item.id}.EXAMPLE`;
    const tr = this.translate.instant(key);
    return tr && tr !== key ? tr : item.example;
  }
}
