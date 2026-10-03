const fs = require('fs');
const path = require('path');

const publicI18nDir = path.join(__dirname, '../frontend/curbi/public/assets/i18n');
const srcI18nDir = path.join(__dirname, '../frontend/curbi/src/assets/i18n');

// 1. Spanish (es)
const esExtensions = {
  HOME: {
    WELCOME: "Bienvenido",
    WELCOME_SUB: "Aquí tienes el resumen de tu actividad financiera y movimientos recientes."
  },
  LOGIN: {
    ERROR_REQUIRED: "Por favor ingresa tu correo o usuario y tu contraseña.",
    FORGOT_INFO: "Para restablecer tu contraseña, ingresa tus credenciales o accede con Google/Outlook.",
    HIDE_PASSWORD: "Ocultar contraseña",
    SHOW_PASSWORD: "Mostrar contraseña",
    CHAT_TIP_DEFAULT: "¡Hola! Soy Curbi, tu asistente inteligente para tus finanzas y ahorros.",
    CHAT_TIP_SAVINGS: "Con CURBI puedes crear metas de ahorro, fondos de emergencia y seguir la regla 50/30/20.",
    CHAT_TIP_CARDS: "Puedes vincular y administrar tus tarjetas de débito y crédito fácilmente.",
    CHAT_TIP_GENERAL: "Inicia sesión o regístrate para comenzar a tomar el control de tu dinero."
  },
  REGISTER: {
    ERROR_REQUIRED: "Por favor completa todos los campos obligatorios.",
    ERROR_EMAIL: "Por favor ingresa un correo electrónico válido.",
    ERROR_PASSWORD: "La contraseña debe tener al menos 8 caracteres.",
    ERROR_AGREED: "Debes aceptar la Política de Privacidad y los Términos de Servicio.",
    ERROR_SERVER: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
    CHAT_TIP_DEFAULT: "¡Crea tu cuenta en CURBI para empezar a gestionar tus ahorros y metas!",
    CHAT_TIP_FREE: "¡CURBI es 100% gratuito para ayudarte a alcanzar tu libertad financiera!",
    CHAT_TIP_GENERAL: "Completa el formulario a la derecha para unirte a CURBI en un minuto."
  },
  LEARN: {
    LEVELS: {
      STRATEGIST: {
        TITLE: "Estratega Financiero",
        DESC: "Dominio avanzado de finanzas personales"
      },
      SAVER: {
        TITLE: "Ahorrador Consciente",
        DESC: "Hábitos financieros en desarrollo"
      },
      LEARNER: {
        TITLE: "En Aprendizaje",
        DESC: "Explora las guías para empezar"
      },
      BASIC: "Básico",
      INTERMEDIATE: "Intermedio",
      ADVANCED: "Avanzado"
    },
    CATEGORIES: {
      BASICS: "Fundamentos",
      EXPENSES: "Control de Gastos",
      CREDIT: "Crédito y Deudas",
      FUTURE: "Inversión y Futuro"
    },
    CALC: {
      BUG: {
        TAG: "SIMULADOR",
        TITLE: "Calculadora de Gastos Hormiga",
        SUBTITLE: "Estima el impacto acumulado de pequeños consumos regulares a mediano y largo plazo.",
        CONCEPT_LABEL: "Concepto del gasto:",
        CONCEPT_PLACEHOLDER: "ej. Café, aperitivos, delivery",
        AMOUNT_LABEL: "Monto por día (Q):",
        FREQ_LABEL: "Frecuencia semanal:",
        DAYS_1: "1 día / semana",
        DAYS_2: "2 días / semana",
        DAYS_3: "3 días / semana",
        DAYS_4: "4 días / semana",
        DAYS_5: "5 días (Laborales)",
        DAYS_6: "6 días / semana",
        DAYS_7: "Todos los días (7)",
        RESULT_MONTHLY: "Gasto Mensual Estimado",
        RESULT_YEARLY: "Gasto Anual Acumulado",
        RESULT_5YEARS: "Proyección Ahorro a 5 años",
        ADVICE_TITLE: "Análisis CURBI",
        ADVICE_DESC: "Reasignar el 50% de este gasto representaría un ahorro mensual de",
        ADVICE_SUFFIX: "directo a tus metas de ahorro."
      },
      RULE: {
        TAG: "DISTRIBUCIÓN",
        TITLE: "Distribución de Ingresos 50 / 30 / 20",
        SUBTITLE: "Ingresa tu ingreso neto mensual para obtener una estructura de presupuesto recomendada.",
        INCOME_LABEL: "Ingreso mensual neto (Q):",
        NEEDS_TAG: "50% NECESIDADES BÁSICAS",
        NEEDS_DESC: "Vivienda, alimentación esencial, servicios básicos, salud y transporte.",
        WANTS_TAG: "30% GASTOS PERSONALES",
        WANTS_DESC: "Entretenimiento, salidas, compras personales y suscripciones.",
        SAVINGS_TAG: "20% AHORRO Y DEUDAS",
        SAVINGS_DESC: "Fondo de emergencia, metas en CURBI o amortización de créditos.",
        LINK_SAVES: "Configurar presupuestos en CURBI"
      },
      EMERG: {
        TAG: "PROTECCIÓN",
        TITLE: "Meta de Fondo de Emergencia",
        SUBTITLE: "Calcula el colchón de seguridad financiero necesario en función de tus gastos esenciales.",
        EXPENSES_LABEL: "Gastos esenciales mensuales (Q):",
        COVERAGE_LABEL: "Cobertura deseada:",
        MONTHS_3: "3 meses (Recomendado estándar)",
        MONTHS_6: "6 meses (Mayor tranquilidad)",
        MONTHS_9: "9 meses",
        MONTHS_12: "12 meses (Independientes o freelancers)",
        TARGET_LABEL: "Fondo de Emergencia Sugerido",
        TARGET_MONTHS_LABEL: "Plazo para completarlo",
        PLAN_6: "En 6 meses",
        PLAN_12: "En 12 meses",
        PLAN_18: "En 18 meses",
        PER_MONTH: "/ mes",
        LINK_GOAL: "Crear Meta en CURBI"
      }
    },
    GLOSSARY: {
      SEARCH_PLACEHOLDER: "Buscar concepto financiero (ej. fondo, inflación, interés, crédito, liquidez)...",
      PRACTICAL_EXAMPLE: "Ejemplo práctico",
      NO_RESULTS: "No se encontraron resultados para \"{{ query }}\".",
      VIEW_ALL: "Ver todos los términos",
      TAGS: {
        BASICS: "Fundamentos",
        SAVINGS: "Ahorro",
        BUDGETS: "Presupuestos",
        INVESTMENT: "Inversión",
        CREDIT: "Crédito",
        ECONOMY: "Economía",
        FINANCE: "Finanzas"
      },
      TERMS: {
        "emergency-fund": {
          TERM: "Fondo de Emergencia",
          SHORT_DESC: "Tu red de seguridad financiera ante imprevistos.",
          EXPLANATION: "Es una cantidad de dinero reservada exclusivamente para emergencias reales (problemas de salud, reparaciones mecánicas urgentes o pérdida temporal de empleo). Lo ideal es tener entre 3 y 6 meses de tus gastos fijos básicos.",
          EXAMPLE: "Si tus gastos fijos son Q3,000 al mes, un fondo de 3 meses sería de Q9,000."
        },
        "micro-expenses": {
          TERM: "Gastos Hormiga",
          SHORT_DESC: "Pequeñas compras cotidianas que pasan desapercibidas.",
          EXPLANATION: "Son aquellos gastos de bajo monto que hacemos casi a diario sin pensarlo (café de camino al trabajo, snacks, propinas extras, suscripciones no utilizadas). Individualmente parecen inofensivos, pero al mes o al año suman una cifra enorme.",
          EXAMPLE: "Gastar Q20 diarios en golosinas equivale a Q600 al mes y Q7,200 al año."
        },
        "rule-50-30-20": {
          TERM: "Regla 50 / 30 / 20",
          SHORT_DESC: "Fórmula sencilla para repartir tus ingresos mensuales.",
          EXPLANATION: "Un método clásico de presupuesto: el 50% de tus ingresos se destina a Necesidades básicas (vivienda, comida, servicios), el 30% a Deseos/Estilo de vida (salidas, entretenimiento) y el 20% al Ahorro o pago de deudas.",
          EXAMPLE: "Con un sueldo de Q5,000: Q2,500 para necesidades, Q1,500 para gustos y Q1,000 para ahorro."
        },
        "compound-interest": {
          TERM: "Interés Compuesto",
          SHORT_DESC: "Ganar intereses sobre los intereses ya ganados.",
          EXPLANATION: "Es el efecto multiplicador del dinero a lo largo del tiempo. Cuando ahorras o inviertes, las ganancias que generas se suman a tu capital original, y en el siguiente ciclo generas intereses sobre un monto mayor.",
          EXAMPLE: "Si ahorras Q1,000 al 5% anual, el primer año ganas Q50. El segundo año ganas el 5% sobre Q1,050."
        },
        "full-payer": {
          TERM: "Totalero (Tarjeta de Crédito)",
          SHORT_DESC: "Persona que paga el 100% de su estado de cuenta cada mes.",
          EXPLANATION: "Ser totalero significa pagar el saldo total adeudado antes de la fecha límite de pago. De esta manera disfrutas de los beneficios de la tarjeta (seguridad, puntos, financiamiento temporal) sin pagar ni un solo centavo de intereses.",
          EXAMPLE: "Compraste Q800 en el mes y pagas exactamente Q800 en la fecha de pago."
        },
        "inflation": {
          TERM: "Inflación",
          SHORT_DESC: "El aumento generalizado de precios y la pérdida de poder adquisitivo.",
          EXPLANATION: "Es cuando las cosas que compras habitualmente suben de precio con el tiempo, haciendo que con el mismo dinero puedas comprar menos productos que antes. Por eso dejar dinero guardado bajo el colchón pierde valor.",
          EXAMPLE: "Si un almuerzo costaba Q30 el año pasado y hoy cuesta Q33, la inflación fue del 10%."
        },
        "liquidity": {
          TERM: "Liquidez",
          SHORT_DESC: "La rapidez con la que puedes convertir un activo en dinero en efectivo.",
          EXPLANATION: "El dinero en tu cuenta bancaria de CURBI es 100% líquido porque puedes transferirlo de inmediato. Una casa o un automóvil tienen baja liquidez porque tardas semanas o meses en venderlos para tener efectivo.",
          EXAMPLE: "Tener dinero en tu cuenta monetaria o de ahorros te da liquidez instantánea."
        },
        "zero-based-budget": {
          TERM: "Presupuesto Base Cero",
          SHORT_DESC: "Darle un propósito específico a cada centavo que entra.",
          EXPLANATION: "Consiste en asignar cada quetzal de tus ingresos a una categoría (necesidades, gustos, ahorros, deudas) hasta que la resta de Ingresos - Gastos/Ahorros sea exactamente cero. No significa gastar todo, sino planificar todo.",
          EXAMPLE: "Si ganas Q4,000, asignas exactamente Q4,000 distribuidos entre tus gastos y tus metas."
        }
      }
    },
    MODAL: {
      CLOSE: "Cerrar lección",
      OF_READING: "de lectura",
      KEY_POINTS: "Puntos clave",
      ACTION_TIP: "Acción recomendada"
    },
    LESSONS: {
      "regla-50-30-20": {
        TITLE: "La regla 50 / 30 / 20 para organizar tu dinero",
        SUMMARY: "Aprende a distribuir tus ingresos sin cálculos complicados ni privarte de las cosas que te gustan.",
        ACTION_TIP: "Ve a la pestaña \"Calculadoras\" para calcular tu desglose 50/30/20 personalizado en segundos.",
        LINK_LABEL: "Configurar presupuestos en CURBI"
      },
      "fondo-emergencia": {
        TITLE: "Tu primer Fondo de Emergencia",
        SUMMARY: "Descubre por qué un colchón para imprevistos es la mejor protección contra las deudas.",
        ACTION_TIP: "Empieza con una meta pequeña pero alcanzable, como ahorrar Q200 esta quincena en tu meta de emergencia.",
        LINK_LABEL: "Crear Meta de Emergencia"
      },
      "gastos-hormiga": {
        TITLE: "Control de Gastos Hormiga y compras impulsivas",
        SUMMARY: "Cómo identificar los pequeños consumos diarios que reducen tu capacidad de ahorro.",
        ACTION_TIP: "Haz una revisión de tus suscripciones activas y cancela al menos una que no hayas utilizado recientemente.",
        LINK_LABEL: "Ver mis últimos movimientos"
      },
      "tarjetas-credito": {
        TITLE: "Tarjetas de Crédito: Uso responsable y sin intereses",
        SUMMARY: "Aprende a aprovechar los beneficios de una tarjeta de crédito sin generar cargos por financiamiento.",
        ACTION_TIP: "Programa un aviso previo a tu fecha de corte para revisar tus saldos.",
        LINK_LABEL: "Administrar mis cuentas"
      },
      "metodo-bola-de-nieve": {
        TITLE: "Método Bola de Nieve para liquidación de deudas",
        SUMMARY: "Una estrategia progresiva y estructurada para ordenar y liquidar compromisos financieros.",
        ACTION_TIP: "Lista tus saldos pendientes y calcula el plazo estimado para liquidar la menor de tus obligaciones.",
        LINK_LABEL: "Ver Metas de Ahorro"
      },
      "interes-compuesto": {
        TITLE: "El Interés Compuesto y la constancia de ahorro",
        SUMMARY: "Cómo los rendimientos continuos potencian el crecimiento del capital a mediano y largo plazo.",
        ACTION_TIP: "Define un aporte periódico automático, sin importar que el monto inicial sea modesto.",
        LINK_LABEL: "Ver Metas de Ahorro"
      }
    }
  }
};

// 2. English (en)
const enExtensions = {
  HOME: {
    WELCOME: "Welcome",
    WELCOME_SUB: "Here is the summary of your financial activity and recent transactions."
  },
  LOGIN: {
    ERROR_REQUIRED: "Please enter your email or username and password.",
    FORGOT_INFO: "To reset your password, contact support or log in with Google/Outlook.",
    HIDE_PASSWORD: "Hide password",
    SHOW_PASSWORD: "Show password",
    CHAT_TIP_DEFAULT: "Hello! I am Curbi, your smart finance and savings assistant.",
    CHAT_TIP_SAVINGS: "With CURBI you can create savings goals, emergency funds and follow the 50/30/20 rule.",
    CHAT_TIP_CARDS: "You can easily link and manage your credit and debit cards.",
    CHAT_TIP_GENERAL: "Log in or register to take control of your financial journey."
  },
  REGISTER: {
    ERROR_REQUIRED: "Please fill in all required fields.",
    ERROR_EMAIL: "Please enter a valid email address.",
    ERROR_PASSWORD: "Password must be at least 8 characters long.",
    ERROR_AGREED: "You must accept the Privacy Policy and Terms of Service.",
    ERROR_SERVER: "Could not connect to the server. Please try again.",
    CHAT_TIP_DEFAULT: "Create your account on CURBI to start managing your savings and goals!",
    CHAT_TIP_FREE: "CURBI is 100% free to help you achieve financial freedom!",
    CHAT_TIP_GENERAL: "Fill in the form on the right to join CURBI in one minute."
  },
  LEARN: {
    LEVELS: {
      STRATEGIST: {
        TITLE: "Financial Strategist",
        DESC: "Advanced personal finance mastery"
      },
      SAVER: {
        TITLE: "Conscious Saver",
        DESC: "Developing healthy financial habits"
      },
      LEARNER: {
        TITLE: "In Learning",
        DESC: "Explore the guides to get started"
      },
      BASIC: "Basic",
      INTERMEDIATE: "Intermediate",
      ADVANCED: "Advanced"
    },
    CATEGORIES: {
      BASICS: "Fundamentals",
      EXPENSES: "Expense Control",
      CREDIT: "Credit & Debt",
      FUTURE: "Investment & Future"
    },
    CALC: {
      BUG: {
        TAG: "SIMULATOR",
        TITLE: "Micro-Expenses Calculator",
        SUBTITLE: "Estimate the cumulative impact of small daily expenses over the medium and long term.",
        CONCEPT_LABEL: "Expense item:",
        CONCEPT_PLACEHOLDER: "e.g. Coffee, snacks, delivery",
        AMOUNT_LABEL: "Daily amount (Q):",
        FREQ_LABEL: "Weekly frequency:",
        DAYS_1: "1 day / week",
        DAYS_2: "2 days / week",
        DAYS_3: "3 days / week",
        DAYS_4: "4 days / week",
        DAYS_5: "5 days (Workdays)",
        DAYS_6: "6 days / week",
        DAYS_7: "Every day (7)",
        RESULT_MONTHLY: "Estimated Monthly Expense",
        RESULT_YEARLY: "Accumulated Yearly Expense",
        RESULT_5YEARS: "5-Year Savings Projection",
        ADVICE_TITLE: "CURBI Analysis",
        ADVICE_DESC: "Reallocating 50% of this expense would mean monthly savings of",
        ADVICE_SUFFIX: "straight towards your savings goals."
      },
      RULE: {
        TAG: "BUDGET RULE",
        TITLE: "50 / 30 / 20 Income Distribution",
        SUBTITLE: "Enter your monthly net income to generate a recommended budget breakdown.",
        INCOME_LABEL: "Net monthly income (Q):",
        NEEDS_TAG: "50% BASIC NEEDS",
        NEEDS_DESC: "Housing, essential groceries, utilities, healthcare and transportation.",
        WANTS_TAG: "30% PERSONAL EXPENSES",
        WANTS_DESC: "Dining out, entertainment, hobbies and streaming subscriptions.",
        SAVINGS_TAG: "20% SAVINGS & DEBT",
        SAVINGS_DESC: "Emergency fund, goals in CURBI or accelerating loan pay-offs.",
        LINK_SAVES: "Set up budgets in CURBI"
      },
      EMERG: {
        TAG: "PROTECTION",
        TITLE: "Emergency Fund Goal",
        SUBTITLE: "Calculate your ideal financial cushion based on your monthly essential costs.",
        EXPENSES_LABEL: "Monthly essential expenses (Q):",
        COVERAGE_LABEL: "Desired coverage:",
        MONTHS_3: "3 months (Standard recommendation)",
        MONTHS_6: "6 months (Extra peace of mind)",
        MONTHS_9: "9 months",
        MONTHS_12: "12 months (Freelancers / Contractors)",
        TARGET_LABEL: "Suggested Emergency Fund",
        TARGET_MONTHS_LABEL: "Target completion timeframe",
        PLAN_6: "In 6 months",
        PLAN_12: "In 12 months",
        PLAN_18: "In 18 months",
        PER_MONTH: "/ month",
        LINK_GOAL: "Create Goal in CURBI"
      }
    },
    GLOSSARY: {
      SEARCH_PLACEHOLDER: "Search financial term (e.g. fund, inflation, interest, credit, liquidity)...",
      PRACTICAL_EXAMPLE: "Practical example",
      NO_RESULTS: "No results found for \"{{ query }}\".",
      VIEW_ALL: "View all terms",
      TAGS: {
        BASICS: "Fundamentals",
        SAVINGS: "Savings",
        BUDGETS: "Budgets",
        INVESTMENT: "Investment",
        CREDIT: "Credit",
        ECONOMY: "Economy",
        FINANCE: "Finance"
      },
      TERMS: {
        "emergency-fund": {
          TERM: "Emergency Fund",
          SHORT_DESC: "Your financial safety net for unexpected life events.",
          EXPLANATION: "A pool of money set aside exclusively for genuine emergencies (medical bills, urgent car repairs, or temporary job loss). Ideally, it covers 3 to 6 months of basic living costs.",
          EXAMPLE: "If your basic monthly living costs are Q3,000, a 3-month fund is Q9,000."
        },
        "micro-expenses": {
          TERM: "Micro-Expenses (Phantom Spending)",
          SHORT_DESC: "Small, daily purchases that go largely unnoticed.",
          EXPLANATION: "Inconspicuous everyday purchases (daily coffee on the way to work, snacks, extra delivery tips, unused app subscriptions). Individually minor, but together they drain hundreds or thousands yearly.",
          EXAMPLE: "Spending Q20 daily on snacks equals Q600 per month and Q7,200 per year."
        },
        "rule-50-30-20": {
          TERM: "50 / 30 / 20 Rule",
          SHORT_DESC: "A straightforward formula for managing monthly income.",
          EXPLANATION: "A classic budgeting blueprint: 50% for Needs (housing, food, utilities), 30% for Wants (lifestyle, entertainment), and 20% for Savings and debt repayment.",
          EXAMPLE: "On a Q5,000 salary: Q2,500 for essentials, Q1,500 for lifestyle, and Q1,000 for savings."
        },
        "compound-interest": {
          TERM: "Compound Interest",
          SHORT_DESC: "Earning interest on interest you have already accumulated.",
          EXPLANATION: "The exponential growth of money over time. When you save or invest, your yields are added to your principal, meaning future returns are calculated on a progressively larger base.",
          EXAMPLE: "Saving Q1,000 at 5% annually earns Q50 in year one. In year two, you earn 5% on Q1,050."
        },
        "full-payer": {
          TERM: "Full-Payer (Grace Period User)",
          SHORT_DESC: "Someone who pays 100% of their credit card balance every month.",
          EXPLANATION: "Paying the entire statement balance before the due date, enjoying all card perks (security, points, cashflow cushion) without paying any interest or financing charges.",
          EXAMPLE: "If you spend Q800 during the billing cycle, you pay back exactly Q800 on the due date."
        },
        "inflation": {
          TERM: "Inflation",
          SHORT_DESC: "The general increase in prices and gradual loss of purchasing power.",
          EXPLANATION: "When everyday goods and services grow more expensive over time, meaning the same amount of cash buys less than before. Cash left idle loses value.",
          EXAMPLE: "If a lunch cost Q30 last year and Q33 today, the annual inflation rate was 10%."
        },
        "liquidity": {
          TERM: "Liquidity",
          SHORT_DESC: "How quickly and easily an asset can be converted into spendable cash.",
          EXPLANATION: "Money in your CURBI bank account is 100% liquid because you can transfer it instantly. Real estate or vehicles have low liquidity because selling them takes weeks or months.",
          EXAMPLE: "Money in your checking or savings account provides instant liquidity."
        },
        "zero-based-budget": {
          TERM: "Zero-Based Budget",
          SHORT_DESC: "Giving every single incoming cent a defined purpose.",
          EXPLANATION: "Allocating every quetzal of your income to a category (needs, desires, savings, debt) until Income minus Outflows equals zero. It means total intention, not reckless spending.",
          EXAMPLE: "If you earn Q4,000, you allocate all Q4,000 across your categories and goals."
        }
      }
    },
    MODAL: {
      CLOSE: "Close lesson",
      OF_READING: "read",
      KEY_POINTS: "Key Takeaways",
      ACTION_TIP: "Recommended Action"
    },
    LESSONS: {
      "regla-50-30-20": {
        TITLE: "The 50 / 30 / 20 Rule to Organize Your Money",
        SUMMARY: "Learn how to structure your income without complicated math or sacrificing what you love.",
        ACTION_TIP: "Head to the \"Calculators\" tab to find your custom 50/30/20 breakdown in seconds.",
        LINK_LABEL: "Configure budgets in CURBI"
      },
      "fondo-emergencia": {
        TITLE: "Your First Emergency Fund",
        SUMMARY: "Discover why a rainy-day cushion is your strongest shield against debt traps.",
        ACTION_TIP: "Start small but consistent: aim to save Q200 this fortnight towards your emergency goal.",
        LINK_LABEL: "Create Emergency Goal"
      },
      "gastos-hormiga": {
        TITLE: "Micro-Expenses & Curbing Impulsive Buying",
        SUMMARY: "How to identify sneaky daily purchases that silently drain your savings potential.",
        ACTION_TIP: "Audit your recurring subscriptions today and cancel at least one unused service.",
        LINK_LABEL: "Review Recent Transactions"
      },
      "tarjetas-credito": {
        TITLE: "Credit Cards: Smart Usage with Zero Interest",
        SUMMARY: "Harness the rewards and security of credit cards without ever paying financing fees.",
        ACTION_TIP: "Set a reminder two days before your card statement closing date to verify your balance.",
        LINK_LABEL: "Manage My Accounts"
      },
      "metodo-bola-de-nieve": {
        TITLE: "The Debt Snowball Strategy",
        SUMMARY: "A proven, motivating roadmap to systematically eliminate outstanding debts.",
        ACTION_TIP: "List your debt balances from smallest to largest and calculate payoff targets.",
        LINK_LABEL: "View Savings Goals"
      },
      "interes-compuesto": {
        TITLE: "Compound Interest & the Power of Consistency",
        SUMMARY: "How consistent compounding accelerates wealth accumulation over time.",
        ACTION_TIP: "Set up a recurring automatic contribution, even if starting with modest amounts.",
        LINK_LABEL: "View Savings Goals"
      }
    }
  }
};

// 3. French (fr)
const frExtensions = {
  HOME: {
    WELCOME: "Bienvenue",
    WELCOME_SUB: "Voici le résumé de votre activité financière et de vos transactions récentes."
  },
  LOGIN: {
    ERROR_REQUIRED: "Veuillez saisir votre email ou identifiant et votre mot de passe.",
    FORGOT_INFO: "Pour réinitialiser votre mot de passe, contactez le support ou connectez-vous avec Google/Outlook.",
    HIDE_PASSWORD: "Masquer le mot de passe",
    SHOW_PASSWORD: "Afficher le mot de passe",
    CHAT_TIP_DEFAULT: "Bonjour ! Je suis Curbi, votre assistant intelligent pour vos finances et votre épargne.",
    CHAT_TIP_SAVINGS: "Avec CURBI, créez des objectifs d'épargne, des fonds d'urgence et appliquez la règle 50/30/20.",
    CHAT_TIP_CARDS: "Gérez et liez facilement toutes vos cartes bancaires.",
    CHAT_TIP_GENERAL: "Connectez-vous ou inscrivez-vous pour prendre le contrôle de votre argent."
  },
  REGISTER: {
    ERROR_REQUIRED: "Veuillez remplir tous les champs obligatoires.",
    ERROR_EMAIL: "Veuillez saisir une adresse email valide.",
    ERROR_PASSWORD: "Le mot de passe doit comporter au moins 8 caractères.",
    ERROR_AGREED: "Vous devez accepter la politique de confidentialité et les conditions d'utilisation.",
    ERROR_SERVER: "Impossible de se connecter au serveur. Veuillez réessayer.",
    CHAT_TIP_DEFAULT: "Créez votre compte sur CURBI pour gérer vos finances et vos objectifs !",
    CHAT_TIP_FREE: "CURBI est 100% gratuit pour vous accompagner vers la liberté financière !",
    CHAT_TIP_GENERAL: "Remplissez le formulaire à droite pour rejoindre CURBI en une minute."
  },
  LEARN: {
    LEVELS: {
      STRATEGIST: {
        TITLE: "Stratège Financier",
        DESC: "Maîtrise avancée des finances personnelles"
      },
      SAVER: {
        TITLE: "Épargnant Conscient",
        DESC: "Habitudes financières en plein essor"
      },
      LEARNER: {
        TITLE: "En Apprentissage",
        DESC: "Explorez les guides pour démarrer"
      },
      BASIC: "Basique",
      INTERMEDIATE: "Intermédiaire",
      ADVANCED: "Avancé"
    },
    CATEGORIES: {
      BASICS: "Fondamentaux",
      EXPENSES: "Contrôle des Dépenses",
      CREDIT: "Crédit et Dettes",
      FUTURE: "Investissement et Futur"
    },
    CALC: {
      BUG: {
        TAG: "SIMULATEUR",
        TITLE: "Calculateur de Dépenses Invisibles",
        SUBTITLE: "Évaluez l'impact cumulé de petites dépenses quotidiennes sur le moyen et long terme.",
        CONCEPT_LABEL: "Type de dépense :",
        CONCEPT_PLACEHOLDER: "ex. Café, collations, livraison",
        AMOUNT_LABEL: "Montant journalier (Q) :",
        FREQ_LABEL: "Fréquence hebdomadaire :",
        DAYS_1: "1 jour / semaine",
        DAYS_2: "2 jours / semaine",
        DAYS_3: "3 jours / semaine",
        DAYS_4: "4 jours / semaine",
        DAYS_5: "5 jours (Ouvrés)",
        DAYS_6: "6 jours / semaine",
        DAYS_7: "Tous les jours (7)",
        RESULT_MONTHLY: "Dépense Mensuelle Estimée",
        RESULT_YEARLY: "Dépense Annuelle Cumulée",
        RESULT_5YEARS: "Projection d'Épargne sur 5 ans",
        ADVICE_TITLE: "Analyse CURBI",
        ADVICE_DESC: "Réallouer 50% de cette dépense représenterait une épargne mensuelle de",
        ADVICE_SUFFIX: "directement vers vos objectifs."
      },
      RULE: {
        TAG: "RÈGLE BUDGÉTAIRE",
        TITLE: "Répartition des Revenus 50 / 30 / 20",
        SUBTITLE: "Indiquez votre revenu net mensuel pour obtenir une structure budgétaire équilibrée.",
        INCOME_LABEL: "Revenu net mensuel (Q) :",
        NEEDS_TAG: "50% BESOINS FONDAMENTAUX",
        NEEDS_DESC: "Logement, alimentation essentielle, charges, santé et transport.",
        WANTS_TAG: "30% DÉPENSES PERSONNELLES",
        WANTS_DESC: "Sorties, loisirs, achats plaisir et abonnements de divertissement.",
        SAVINGS_TAG: "20% ÉPARGNE & DETTES",
        SAVINGS_DESC: "Fonds d'urgence, projets dans CURBI ou remboursement anticipé.",
        LINK_SAVES: "Définir mon budget dans CURBI"
      },
      EMERG: {
        TAG: "PROTECTION",
        TITLE: "Objectif Fonds d'Urgence",
        SUBTITLE: "Calculez votre matelas de sécurité indispensable selon vos dépenses courantes.",
        EXPENSES_LABEL: "Dépenses mensuelles essentielles (Q) :",
        COVERAGE_LABEL: "Couverture souhaitée :",
        MONTHS_3: "3 mois (Recommandation standard)",
        MONTHS_6: "6 mois (Plus de sérénité)",
        MONTHS_9: "9 mois",
        MONTHS_12: "12 mois (Indépendants / Freelances)",
        TARGET_LABEL: "Fonds d'Urgence Conseillé",
        TARGET_MONTHS_LABEL: "Délai pour l'atteindre",
        PLAN_6: "En 6 mois",
        PLAN_12: "En 12 mois",
        PLAN_18: "En 18 mois",
        PER_MONTH: "/ mois",
        LINK_GOAL: "Créer un objectif dans CURBI"
      }
    },
    GLOSSARY: {
      SEARCH_PLACEHOLDER: "Rechercher un terme (ex. fonds, inflation, intérêt, crédit, liquidité)...",
      PRACTICAL_EXAMPLE: "Exemple pratique",
      NO_RESULTS: "Aucun résultat trouvé pour \"{{ query }}\".",
      VIEW_ALL: "Voir tous les termes",
      TAGS: {
        BASICS: "Fondamentaux",
        SAVINGS: "Épargne",
        BUDGETS: "Budgets",
        INVESTMENT: "Investissement",
        CREDIT: "Crédit",
        ECONOMY: "Économie",
        FINANCE: "Finances"
      },
      TERMS: {
        "emergency-fund": {
          TERM: "Fonds d'Urgence",
          SHORT_DESC: "Votre filet de sécurité financière en cas d'imprévu.",
          EXPLANATION: "Somme réservée exclusivement aux imprévus graves (santé, panne, perte d'emploi). L'idéal est de disposer de 3 à 6 mois de dépenses de base.",
          EXAMPLE: "Si vos dépenses fixes sont de 3 000 Q, un fonds de 3 mois est de 9 000 Q."
        },
        "micro-expenses": {
          TERM: "Dépenses Invisibles (Fourmis)",
          SHORT_DESC: "Petits achats journaliers qui passent inaperçus.",
          EXPLANATION: "Achats anodins du quotidien (café, snacks, pourboires, abonnements oubliés). Isolés, ils paraissent futiles, mais cumulés ils grèvent lourdement votre budget.",
          EXAMPLE: "Dépenser 20 Q par jour représente 600 Q par mois et 7 200 Q par an."
        },
        "rule-50-30-20": {
          TERM: "Règle 50 / 30 / 20",
          SHORT_DESC: "Formule simple pour structurer ses revenus.",
          EXPLANATION: "Méthode budgétaire : 50% pour les Besoins essentiels, 30% pour les Envies et le style de vie, 20% pour l'Épargne et les dettes.",
          EXAMPLE: "Sur un salaire de 5 000 Q : 2 500 Q pour les besoins, 1 500 Q pour les loisirs, 1 000 Q pour l'épargne."
        },
        "compound-interest": {
          TERM: "Intérêts Composés",
          SHORT_DESC: "Générer des intérêts sur les intérêts déjà acquis.",
          EXPLANATION: "Effet boule de neige financier : les gains s'ajoutent au capital initial pour faire grossir exponentiellement la somme épargnée au fil du temps.",
          EXAMPLE: "Épargner 1 000 Q à 5% rapporte 50 Q la 1ère année, puis 5% sur 1 050 Q la 2ème."
        },
        "full-payer": {
          TERM: "Payeur Intégral (Carte de Crédit)",
          SHORT_DESC: "Personne réglant 100% de son relevé bancaire chaque mois.",
          EXPLANATION: "Régler l'intégralité du solde avant la date limite pour profiter des avantages de la carte sans payer aucun frais financier ni intérêt.",
          EXAMPLE: "Vous dépensez 800 Q dans le mois et réglez exactement 800 Q à échéance."
        },
        "inflation": {
          TERM: "Inflation",
          SHORT_DESC: "Hausse générale des prix et perte de pouvoir d'achat.",
          EXPLANATION: "Augmentation durable du coût de la vie qui fait perdre de la valeur à l'argent non investi ou conservé en espèces.",
          EXAMPLE: "Si un repas coûtait 30 Q l'an passé et 33 Q aujourd'hui, l'inflation est de 10%."
        },
        "liquidity": {
          TERM: "Liquidité",
          SHORT_DESC: "Facilité et rapidité de conversion d'un actif en argent disponible.",
          EXPLANATION: "L'argent sur votre compte CURBI est immédiatement disponible. Un bien immobilier présente une faible liquidité car sa vente prend des mois.",
          EXAMPLE: "Disposer de fonds sur son compte courant assure une liquidité immédiate."
        },
        "zero-based-budget": {
          TERM: "Budget Base Zéro",
          SHORT_DESC: "Donner un rôle précis à chaque centime perçu.",
          EXPLANATION: "Allouer l'intégralité de ses revenus à des catégories prédéfinies jusqu'à ce que Revenus moins Dépenses/Épargne soit égal à zéro.",
          EXAMPLE: "Pour 4 000 Q gagnés, exactement 4 000 Q sont répartis entre dépenses et projets."
        }
      }
    },
    MODAL: {
      CLOSE: "Fermer la leçon",
      OF_READING: "de lecture",
      KEY_POINTS: "Points clés",
      ACTION_TIP: "Action recommandée"
    },
    LESSONS: {
      "regla-50-30-20": {
        TITLE: "La règle 50 / 30 / 20 pour organiser votre argent",
        SUMMARY: "Structurez vos revenus facilement sans privation excessive ni calculs fastidieux.",
        ACTION_TIP: "Utilisez l'onglet Calculateurs pour simuler votre répartition 50/30/20.",
        LINK_LABEL: "Configurer mes budgets dans CURBI"
      },
      "fondo-emergencia": {
        TITLE: "Votre premier Fonds d'Urgence",
        SUMMARY: "Comprenez pourquoi une réserve financière est votre meilleur rempart contre les dettes.",
        ACTION_TIP: "Commencez petit : épargnez 200 Q dès ce mois-ci dans votre fonds d'urgence.",
        LINK_LABEL: "Créer un Objectif d'Urgence"
      },
      "gastos-hormiga": {
        TITLE: "Maîtriser les Dépenses Invisibles et Impulsives",
        SUMMARY: "Identifiez les petits achats anodins qui rongent silencieusement votre capacité d'épargne.",
        ACTION_TIP: "Vérifiez vos abonnements actifs et résiliez-en au moins un que vous n'utilisez plus.",
        LINK_LABEL: "Voir mes dernières transactions"
      },
      "tarjetas-credito": {
        TITLE: "Cartes de Crédit : Usage responsable et sans frais",
        SUMMARY: "Bénéficiez des protections bancaires sans jamais payer d'intérêts d'emprunt.",
        ACTION_TIP: "Notez la date de clôture de votre relevé pour toujours anticiper vos règlements.",
        LINK_LABEL: "Gérer mes comptes"
      },
      "metodo-bola-de-nieve": {
        TITLE: "La Méthode Boule de Neige contre l'endettement",
        SUMMARY: "Une stratégie psychologique et efficace pour rembourser méthodiquement ses créances.",
        ACTION_TIP: "Listez vos soldes restants et focalisez-vous sur le montant le plus faible en premier.",
        LINK_LABEL: "Voir les Objectifs d'Épargne"
      },
      "interes-compuesto": {
        TITLE: "Les Intérêts Composés et la régularité d'épargne",
        SUMMARY: "Comment la capitalisation transforme l'effort continu en patrimoine solide.",
        ACTION_TIP: "Mettez en place un virement récurrent automatique, même pour un petit montant.",
        LINK_LABEL: "Voir les Objectifs d'Épargne"
      }
    }
  }
};

// 4. Portuguese (pt)
const ptExtensions = {
  HOME: {
    WELCOME: "Bem-vindo",
    WELCOME_SUB: "Aqui está o resumo da sua atividade financeira e transações recentes."
  },
  LOGIN: {
    ERROR_REQUIRED: "Por favor, insira seu e-mail ou nome de usuário e sua senha.",
    FORGOT_INFO: "Para redefinir sua senha, entre em contato com o suporte ou faça login com o Google/Outlook.",
    HIDE_PASSWORD: "Ocultar senha",
    SHOW_PASSWORD: "Mostrar senha",
    CHAT_TIP_DEFAULT: "Olá! Sou o Curbi, seu assistente inteligente para finanças e economias.",
    CHAT_TIP_SAVINGS: "Com o CURBI você pode criar metas de economia, fundos de emergência e seguir a regra 50/30/20.",
    CHAT_TIP_CARDS: "Vincule e gerencie seus cartões de crédito e débito com muita facilidade.",
    CHAT_TIP_GENERAL: "Faça login ou cadastre-se para assumir o controle total do seu dinheiro."
  },
  REGISTER: {
    ERROR_REQUIRED: "Por favor, preencha todos os campos obrigatórios.",
    ERROR_EMAIL: "Por favor, insira um endereço de e-mail válido.",
    ERROR_PASSWORD: "A senha deve ter pelo menos 8 caracteres.",
    ERROR_AGREED: "Você deve aceitar a Política de Privacidade e os Termos de Serviço.",
    ERROR_SERVER: "Não foi possível conectar ao servidor. Tente novamente.",
    CHAT_TIP_DEFAULT: "Crie sua conta no CURBI e comece a gerenciar suas economias hoje mesmo!",
    CHAT_TIP_FREE: "O CURBI é 100% gratuito para te ajudar na conquista da liberdade financeira!",
    CHAT_TIP_GENERAL: "Preencha o formulário ao lado para se juntar ao CURBI em um instante."
  },
  LEARN: {
    LEVELS: {
      STRATEGIST: {
        TITLE: "Estrategista Financeiro",
        DESC: "Domínio avançado de finanças pessoais"
      },
      SAVER: {
        TITLE: "Poupador Consciente",
        DESC: "Bons hábitos financeiros em desenvolvimento"
      },
      LEARNER: {
        TITLE: "Em Aprendizado",
        DESC: "Explore as orientações para começar"
      },
      BASIC: "Básico",
      INTERMEDIATE: "Intermediário",
      ADVANCED: "Avançado"
    },
    CATEGORIES: {
      BASICS: "Fundamentos",
      EXPENSES: "Controle de Gastos",
      CREDIT: "Crédito e Dívidas",
      FUTURE: "Investimento e Futuro"
    },
    CALC: {
      BUG: {
        TAG: "SIMULADOR",
        TITLE: "Calculadora de Gastos Invisíveis",
        SUBTITLE: "Estime o impacto acumulado de pequenos consumos diários a médio e longo prazo.",
        CONCEPT_LABEL: "Descrição do gasto:",
        CONCEPT_PLACEHOLDER: "ex. Café, lanches, delivery",
        AMOUNT_LABEL: "Valor diário (Q):",
        FREQ_LABEL: "Frequência semanal:",
        DAYS_1: "1 dia / semana",
        DAYS_2: "2 dias / semana",
        DAYS_3: "3 dias / semana",
        DAYS_4: "4 dias / semana",
        DAYS_5: "5 dias (Úteis)",
        DAYS_6: "6 dias / semana",
        DAYS_7: "Todos os dias (7)",
        RESULT_MONTHLY: "Gasto Mensal Estimado",
        RESULT_YEARLY: "Gasto Anual Acumulado",
        RESULT_5YEARS: "Projeção de Economia em 5 anos",
        ADVICE_TITLE: "Análise CURBI",
        ADVICE_DESC: "Redirecionar 50% desse gasto representaria uma economia mensal de",
        ADVICE_SUFFIX: "direto para suas metas de poupança."
      },
      RULE: {
        TAG: "REGRA DE ORÇAMENTO",
        TITLE: "Divisão de Renda 50 / 30 / 20",
        SUBTITLE: "Informe sua renda líquida mensal para receber uma estrutura de orçamento recomendada.",
        INCOME_LABEL: "Renda mensal líquida (Q):",
        NEEDS_TAG: "50% NECESSIDADES BÁSICAS",
        NEEDS_DESC: "Moradia, alimentação básica, contas essenciais, saúde e transporte.",
        WANTS_TAG: "30% GASTOS PESSOAIS",
        WANTS_DESC: "Lazer, saídas, compras pessoais e assinaturas de entretenimento.",
        SAVINGS_TAG: "20% POUPANÇA E DÍVIDAS",
        SAVINGS_DESC: "Reserva de emergência, metas no CURBI ou quitação de empréstimos.",
        LINK_SAVES: "Configurar orçamentos no CURBI"
      },
      EMERG: {
        TAG: "PROTEÇÃO",
        TITLE: "Meta de Reserva de Emergência",
        SUBTITLE: "Calcule a proteção financeira necessária com base em seus gastos vitais.",
        EXPENSES_LABEL: "Gastos essenciais mensais (Q):",
        COVERAGE_LABEL: "Cobertura pretendida:",
        MONTHS_3: "3 meses (Padrão recomendado)",
        MONTHS_6: "6 meses (Maior segurança)",
        MONTHS_9: "9 meses",
        MONTHS_12: "12 meses (Autônomos / Freelancers)",
        TARGET_LABEL: "Reserva de Emergência Sugerida",
        TARGET_MONTHS_LABEL: "Prazo para concluir",
        PLAN_6: "Em 6 meses",
        PLAN_12: "Em 12 meses",
        PLAN_18: "Em 18 meses",
        PER_MONTH: "/ mês",
        LINK_GOAL: "Criar Meta no CURBI"
      }
    },
    GLOSSARY: {
      SEARCH_PLACEHOLDER: "Buscar termo financeiro (ex. reserva, inflação, juros, crédito, liquidez)...",
      PRACTICAL_EXAMPLE: "Exemplo prático",
      NO_RESULTS: "Nenhum resultado encontrado para \"{{ query }}\".",
      VIEW_ALL: "Ver todos os termos",
      TAGS: {
        BASICS: "Fundamentos",
        SAVINGS: "Poupança",
        BUDGETS: "Orçamentos",
        INVESTMENT: "Investimento",
        CREDIT: "Crédito",
        ECONOMY: "Economia",
        FINANCE: "Finanças"
      },
      TERMS: {
        "emergency-fund": {
          TERM: "Reserva de Emergência",
          SHORT_DESC: "Sua rede de proteção financeira contra imprevistos.",
          EXPLANATION: "Valor guardado exclusivamente para imprevistos urgentes (saúde, consertos mecânicos ou desemprego). Recomenda-se entre 3 e 6 meses de gastos fixos.",
          EXAMPLE: "Com gastos essenciais de Q3.000 ao mês, uma reserva de 3 meses totaliza Q9.000."
        },
        "micro-expenses": {
          TERM: "Gastos Formiga",
          SHORT_DESC: "Pequenos consumos diários que passam despercebidos.",
          EXPLANATION: "Gastos baixos feitos sem planejamento contínuo (café, guloseimas, gorjetas extras, assinaturas não utilizadas). No total do ano, somam valores expressivos.",
          EXAMPLE: "Gastar Q20 por dia em lanches equivale a Q600 no mês e Q7.200 ao ano."
        },
        "rule-50-30-20": {
          TERM: "Regra 50 / 30 / 20",
          SHORT_DESC: "Fórmula descomplicada para organizar o salário mensal.",
          EXPLANATION: "50% para Necessidades básicas, 30% para Desejos e estilo de vida, e 20% para Poupança e amortização de dívidas.",
          EXAMPLE: "Com salário de Q5.000: Q2.500 para necessidades, Q1.500 para lazer e Q1.000 para poupança."
        },
        "compound-interest": {
          TERM: "Juros Compostos",
          SHORT_DESC: "Rendimento calculado sobre o montante acumulado.",
          EXPLANATION: "O crescimento exponencial do capital ao longo do tempo, gerando rendimentos contínuos sobre os rendimentos anteriores.",
          EXAMPLE: "Poupar Q1.000 a 5% ao ano gera Q50 no 1º ano e 5% sobre Q1.050 no 2º ano."
        },
        "full-payer": {
          TERM: "Pagador Integral (Cartão)",
          SHORT_DESC: "Quem paga 100% da fatura do cartão em dia.",
          EXPLANATION: "Liquidar o saldo total da fatura antes do vencimento para usufruir de benefícios sem pagar taxas de juros rotativos.",
          EXAMPLE: "Se você gastou Q800 no mês, paga exatamente Q800 no vencimento."
        },
        "inflation": {
          TERM: "Inflação",
          SHORT_DESC: "Aumento contínuo de preços e perda do poder de compra.",
          EXPLANATION: "Quando os bens e serviços ficam mais caros com o tempo, reduzindo a capacidade de compra do dinheiro parado em espécie.",
          EXAMPLE: "Se um prato custava Q30 e passou a custar Q33, a inflação foi de 10%."
        },
        "liquidity": {
          TERM: "Liquidez",
          SHORT_DESC: "Velocidade com que um recurso se converte em dinheiro na mão.",
          EXPLANATION: "O saldo bancário no CURBI é 100% líquido por poder ser transferido na hora. Imóveis têm baixa liquidez por demorarem a ser vendidos.",
          EXAMPLE: "Ter dinheiro em conta corrente garante liquidez imediata."
        },
        "zero-based-budget": {
          TERM: "Orçamento Base Zero",
          SHORT_DESC: "Destinar cada centavo recebido a uma finalidade certa.",
          EXPLANATION: "Planejar a distribuição de toda a renda em categorias até que a equação Renda menos Despesas/Poupança seja igual a zero.",
          EXAMPLE: "Ao receber Q4.000, você direciona exatamente Q4.000 entre contas e metas."
        }
      }
    },
    MODAL: {
      CLOSE: "Fechar aula",
      OF_READING: "de leitura",
      KEY_POINTS: "Pontos-chave",
      ACTION_TIP: "Ação recomendada"
    },
    LESSONS: {
      "regla-50-30-20": {
        TITLE: "A regra 50 / 30 / 20 para estruturar seu dinheiro",
        SUMMARY: "Aprenda a planejar suas despesas sem contas difíceis e sem abrir mão do que gosta.",
        ACTION_TIP: "Vá para a aba Calculadoras para simular sua divisão de renda ideal em instantes.",
        LINK_LABEL: "Configurar orçamentos no CURBI"
      },
      "fondo-emergencia": {
        TITLE: "Sua primeira Reserva de Emergência",
        SUMMARY: "Saiba por que uma reserva de segurança é sua maior defesa contra endividamentos.",
        ACTION_TIP: "Comece com um objetivo viável: guarde Q200 nesta quinzena para sua reserva.",
        LINK_LABEL: "Criar Meta de Emergência"
      },
      "gastos-hormiga": {
        TITLE: "Controlando Gastos Formiga e Compras por Impulso",
        SUMMARY: "Descubra como pequenos gastos corriqueiros drenam silenciosamente seus recursos.",
        ACTION_TIP: "Examine suas assinaturas recorrentes e cancele pelo menos uma que não use com frequência.",
        LINK_LABEL: "Ver últimas movimentações"
      },
      "tarjetas-credito": {
        TITLE: "Cartões de Crédito: Uso inteligente e sem juros",
        SUMMARY: "Aproveite a segurança e benefícios dos cartões sem pagar tarifas de financiamento.",
        ACTION_TIP: "Ative um lembrete antes do fechamento da fatura para acompanhar seus gastos.",
        LINK_LABEL: "Gerenciar minhas contas"
      },
      "metodo-bola-de-nieve": {
        TITLE: "O Método Bola de Neve para quitar dívidas",
        SUMMARY: "Uma metodologia progressiva e motivadora para eliminar compromissos financeiros.",
        ACTION_TIP: "Ordene seus saldos em aberto e priorize a quitação da menor dívida primeiro.",
        LINK_LABEL: "Ver Metas de Economia"
      },
      "interes-compuesto": {
        TITLE: "Juros Compostos e o poder da regularidade",
        SUMMARY: "Como a constância nos aportes multiplica seu patrimônio com o passar do tempo.",
        ACTION_TIP: "Configure uma contribuição periódica automática, mesmo começando com pouco.",
        LINK_LABEL: "Ver Metas de Economia"
      }
    }
  }
};

// 5. Sindhi (sd)
const sdExtensions = {
  HOME: {
    WELCOME: "ڀلي ڪري آيا",
    WELCOME_SUB: "هتي توهان جي مالي سرگرمي ۽ تازين ڏيتي ليتي جو خلاصو آهي."
  },
  LOGIN: {
    ERROR_REQUIRED: "مهرباني ڪري پنهنجو اي ميل يا يوزر نالو ۽ پاسورڊ داخل ڪريو.",
    FORGOT_INFO: "پاسورڊ ريسيٽ ڪرڻ لاءِ، سپورٽ سان رابطو ڪريو يا گوگل/آئوٽ لڪ سان داخل ٿيو.",
    HIDE_PASSWORD: "پاسورڊ لڪايو",
    SHOW_PASSWORD: "پاسورڊ ڏيکاريو",
    CHAT_TIP_DEFAULT: "هيلو! آئون ڪربي آهيان، توهان جو ذهين مالي مددگار.",
    CHAT_TIP_SAVINGS: "ڪربي سان توهان بچت جا مقصد ۽ ايمرجنسي فنڊ ٺاهي سگهو ٿا.",
    CHAT_TIP_CARDS: "توهان پنهنجا بئنڪ ڪارڊ آساني سان منظم ڪري سگهو ٿا.",
    CHAT_TIP_GENERAL: "پنهنجي ماليات تي ضابطو آڻڻ لاءِ سائن ان يا رجسٽر ٿيو."
  },
  REGISTER: {
    ERROR_REQUIRED: "مهرباني ڪري سڀ گهربل خانا ڀريو.",
    ERROR_EMAIL: "مهرباني ڪري صحيح اي ميل داخل ڪريو.",
    ERROR_PASSWORD: "پاسورڊ گهٽ ۾ گهٽ 8 اکرن جو هجڻ گهرجي.",
    ERROR_AGREED: "توهان کي رازداري پاليسي ۽ شرطن کي قبول ڪرڻ گهرجي.",
    ERROR_SERVER: "سرور سان رابطو نه ٿي سگهيو. مهرباني ڪري ٻيهر ڪوشش ڪريو.",
    CHAT_TIP_DEFAULT: "بچت ۽ مقصدن جي انتظام لاءِ ڪربي تي کاتو ٺاهيو!",
    CHAT_TIP_FREE: "ڪربي مالي آزادي حاصل ڪرڻ ۾ توهان جي مدد لاءِ بلڪل مفت آهي!",
    CHAT_TIP_GENERAL: "هڪ منٽ ۾ ڪربي جو حصو بڻجڻ لاءِ ساڄي پاسي فارم ڀريو."
  },
  LEARN: {
    LEVELS: {
      STRATEGIST: {
        TITLE: "مالي ماهر",
        DESC: "ذاتي ماليات ۾ ترقي يافته مهارت"
      },
      SAVER: {
        TITLE: "سمجهدار بچت ڪندڙ",
        DESC: "مالي عادتون ترقي وٺي رهيون آهن"
      },
      LEARNER: {
        TITLE: "سکندڙ",
        DESC: "شروعات لاءِ هدايتون ڏسو"
      },
      BASIC: "بنيادي",
      INTERMEDIATE: "درميانو",
      ADVANCED: "اعليٰ"
    },
    CATEGORIES: {
      BASICS: "بنياد",
      EXPENSES: "خرچن تي ڪنٽرول",
      CREDIT: "قرض ۽ ڪريڊٽ",
      FUTURE: "سرمائيداري ۽ مستقبل"
    },
    CALC: {
      BUG: {
        TAG: "سموليٽر",
        TITLE: "روزاني نڪرندڙ خرچن جو حساب",
        SUBTITLE: "ننڍن روزاني خرچن جو ڊگهي مدي وارو اثر ڏسو.",
        CONCEPT_LABEL: "خرچ جو تفصيل:",
        CONCEPT_PLACEHOLDER: "مثال: چانهه، ناشتو، ڊليوري",
        AMOUNT_LABEL: "روزانو رقم (Q):",
        FREQ_LABEL: "هفتيوار ڏينهن:",
        DAYS_1: "1 ڏينهن / هفتو",
        DAYS_2: "2 ڏينهن / هفتو",
        DAYS_3: "3 ڏينهن / هفتو",
        DAYS_4: "4 ڏينهن / هفتو",
        DAYS_5: "5 ڏينهن (ڪم وارا)",
        DAYS_6: "6 ڏينهن / هفتو",
        DAYS_7: "روزانو (7)",
        RESULT_MONTHLY: "مهيني جو اندازي موجب خرچ",
        RESULT_YEARLY: "سال جو ڪل خرچ",
        RESULT_5YEARS: "5 سالن جي بچت جو اندازو",
        ADVICE_TITLE: "ڪربي تجزيو",
        ADVICE_DESC: "هن خرچ جو 50 سيڪڙو بچائڻ سان ماهوار بچت ٿيندي",
        ADVICE_SUFFIX: "سڌو توهان جي بچت جي مقصدن لاءِ."
      },
      RULE: {
        TAG: "بجيٽ اصول",
        TITLE: "50 / 30 / 20 آمدني ورهائڻ",
        SUBTITLE: "پنهنجي آمدني جي بهتر ورهائست لاءِ صاف ماهوار آمدني داخل ڪريو.",
        INCOME_LABEL: "صاف ماهوار آمدني (Q):",
        NEEDS_TAG: "50% بنيادي ضرورتون",
        NEEDS_DESC: "رهائش، ضروري کاڌو، يوٽيلٽيز، صحت ۽ ٽرانسپورٽ.",
        WANTS_TAG: "30% ذاتي خرچ",
        WANTS_DESC: "سير تفريح، وندر ۽ ذاتي خريداري.",
        SAVINGS_TAG: "20% بچت ۽ قرض جي ادائيگي",
        SAVINGS_DESC: "ايمرجنسي فنڊ يا ڪربي ۾ بچت جا مقصد.",
        LINK_SAVES: "ڪربي ۾ بجيٽ مقرر ڪريو"
      },
      EMERG: {
        TAG: "تحفظ",
        TITLE: "ايمرجنسي فنڊ جو مقصد",
        SUBTITLE: "ضروري خرچن جي بنياد تي مالي حفاظت جو حساب لڳايو.",
        EXPENSES_LABEL: "ضروري ماهوار خرچ (Q):",
        COVERAGE_LABEL: "گھربل مدت:",
        MONTHS_3: "3 مهينا (تجويز ڪيل)",
        MONTHS_6: "6 مهينا (وڌيڪ محفوظ)",
        MONTHS_9: "9 مهينا",
        MONTHS_12: "12 مهينا (فري لانسرز لاءِ)",
        TARGET_LABEL: "تجويز ڪيل ايمرجنسي فنڊ",
        TARGET_MONTHS_LABEL: "مڪمل ڪرڻ جي مدت",
        PLAN_6: "6 مهينن ۾",
        PLAN_12: "12 مهينن ۾",
        PLAN_18: "18 مهينن ۾",
        PER_MONTH: "/ مهينو",
        LINK_GOAL: "ڪربي ۾ مقصد ٺاهيو"
      }
    },
    GLOSSARY: {
      SEARCH_PLACEHOLDER: "مالي اصطلاح ڳوليو (مثال: فنڊ، مهانگائي، وياج، قرض، ليڪوئيڊٽي)...",
      PRACTICAL_EXAMPLE: "عملي مثال",
      NO_RESULTS: "\"{{ query }}\" لاءِ ڪي به نتيجا نه مليا.",
      VIEW_ALL: "سڀ اصطلاح ڏسو",
      TAGS: {
        BASICS: "بنياد",
        SAVINGS: "بچت",
        BUDGETS: "بجيٽ",
        INVESTMENT: "سرمائيداري",
        CREDIT: "ڪريڊٽ",
        ECONOMY: "معيشت",
        FINANCE: "ماليات"
      },
      TERMS: {
        "emergency-fund": {
          TERM: "ايمرجنسي فنڊ",
          SHORT_DESC: "اڻ ڄاتل حالتن لاءِ مالي تحفظ.",
          EXPLANATION: "طبي خرچن، مرمت يا نوڪري ختم ٿيڻ وقت مددگار رقم. 3 کان 6 مهينن جا بنيادي خرچ هجڻ بهتر آهي.",
          EXAMPLE: "جيڪڏهن خرچ Q3,000 آهن ته 3 مهينن جو فنڊ Q9,000 ٿيندو."
        },
        "micro-expenses": {
          TERM: "ننڍا غير ضروري خرچ",
          SHORT_DESC: "روزاني جا اهي ننڍا خرچ جن تي ڌيان نٿو وڃي.",
          EXPLANATION: "روزانو چانهه، سنئڪس ۽ اهڙا غير ضروري خرچ جيڪي سال جي آخر ۾ وڏي رقم بڻجي وڃن ٿا.",
          EXAMPLE: "روزانو Q20 خرچ ڪرڻ مهيني جو Q600 ۽ سال جو Q7,200 ٿئي ٿو."
        },
        "rule-50-30-20": {
          TERM: "50 / 30 / 20 قاعدو",
          SHORT_DESC: "آمدني ورهائڻ جو سولو طريقو.",
          EXPLANATION: "50% ضرورتن تي، 30% ذاتي شوق تي ۽ 20% بچت تي خرچ ڪرڻ گهرجي.",
          EXAMPLE: "Q5,000 پگهار مان: Q2,500 ضرورتون، Q1,500 شوق، Q1,000 بچت."
        },
        "compound-interest": {
          TERM: "مرڪب وياج (منافعو)",
          SHORT_DESC: "منافعي تي وڌيڪ منافعو ڪمائڻ.",
          EXPLANATION: "وقت سان گڏ پئسن جو ضرب ٿيڻ، جتي پراڻو منافعو به اصل رقم سان گڏ نئون منافعو پيدا ڪري ٿو.",
          EXAMPLE: "5% تي Q1,000 پهرين سال Q50 ڏيندو، ٻئي سال Q1,050 تي منافعو ملندو."
        },
        "full-payer": {
          TERM: "ڪريڊٽ ڪارڊ جا مڪمل ادا ڪندڙ",
          SHORT_DESC: "اهو شخص جيڪو هر مهيني ڪارڊ جو سڄو بل ادا ڪري.",
          EXPLANATION: "بل جي آخري تاريخ کان اڳ سمورو ادائيگي ڪرڻ سان بنا وياج جي ڪارڊ جا سڀ فائدا حاصل ٿين ٿا.",
          EXAMPLE: "جيڪڏهن توهان Q800 خرچ ڪيا ته تاريخ تي پورا Q800 واپس ڪريو."
        },
        "inflation": {
          TERM: "مهانگائي",
          SHORT_DESC: "قيمتن جو وڌڻ ۽ پئسي جي طاقت گهٽجڻ.",
          EXPLANATION: "جڏهن شيون مهانگيون ٿين ٿيون ۽ ساڳين پئسن مان گهٽ سامان خريد ڪري سگهجي ٿو.",
          EXAMPLE: "جيڪو کائو اڳ Q30 جو هو ۽ هاڻي Q33 جو آهي، ته مهانگائي 10% هئي."
        },
        "liquidity": {
          TERM: "رواني / ليڪوئيڊٽي",
          SHORT_DESC: "ڪنهن مالي اثاثي کي نقد رقم ۾ تبديل ڪرڻ جي رفتار.",
          EXPLANATION: "ڪربي اڪائونٽ ۾ موجود رقم فوري طور نقد وانگر استعمال ٿي سگهي ٿي، جڏهن ته گهر يا گاڏي وڪڻڻ ۾ مهينا لڳن ٿا.",
          EXAMPLE: "بئنڪ اڪائونٽ ۾ موجود رقم فوري رواني فراهم ڪري ٿي."
        },
        "zero-based-budget": {
          TERM: "زيرو بيسڊ بجيٽ",
          SHORT_DESC: "هر روپئي لاءِ اڳواٽ فيصلو ڪرڻ.",
          EXPLANATION: "سموري آمدني کي مختلف ڪمن ۾ ورهائڻ ته جيئن آمدني مان خرچ ۽ بچت ڪڍڻ بعد باقي صفر بچي.",
          EXAMPLE: "جيڪڏهن توهان Q4,000 ڪمايو ته پورا Q4,000 مختلف مقصدن لاءِ رکو."
        }
      }
    },
    MODAL: {
      CLOSE: "سبق بند ڪريو",
      OF_READING: "پڙهڻ جو وقت",
      KEY_POINTS: "اهم نقطا",
      ACTION_TIP: "تجويز ڪيل عمل"
    },
    LESSONS: {
      "regla-50-30-20": {
        TITLE: "پنهنجا پئسا سنڀالڻ لاءِ 50 / 30 / 20 قاعدو",
        SUMMARY: "بنا ڏکي حساب ڪتاب جي پنهنجي رقم کي منظم ڪرڻ سکو.",
        ACTION_TIP: "پنهنجو بجيٽ ڏسڻ لاءِ ڪيلڪيوليٽر واري ٽيب ۾ وڃو.",
        LINK_LABEL: "ڪربي ۾ بجيٽ ترتيب ڏيو"
      },
      "fondo-emergencia": {
        TITLE: "توهان جو پهريون ايمرجنسي فنڊ",
        SUMMARY: "ڄاڻو ته غير متوقع حالتن لاءِ رقم ڪيئن قرضن کان بچائي ٿي.",
        ACTION_TIP: "ننڍي شروعات ڪريو: هن مهيني Q200 ايمرجنسي فنڊ ۾ وجھو.",
        LINK_LABEL: "ايمرجنسي مقصد ٺاهيو"
      },
      "gastos-hormiga": {
        TITLE: "ننڍن غير ضروري خرچن تي ضابطو",
        SUMMARY: "اهي ننڍا خرچ سڃاڻو جيڪي توهان جي بچت کائي وڃن ٿا.",
        ACTION_TIP: "پنهنجا روزانو خرچ چيڪ ڪريو ۽ غير ضروري سبسڪرپشن ختم ڪريو.",
        LINK_LABEL: "تازا ٽرانزيڪشن ڏسو"
      },
      "tarjetas-credito": {
        TITLE: "ڪريڊٽ ڪارڊ: بغير وياج جي ذهين استعمال",
        SUMMARY: "بنا اضافي چارجز جي ڪريڊٽ ڪارڊ جا سڀ فائدا حاصل ڪريو.",
        ACTION_TIP: "ڪارڊ جي آخري تاريخ کان اڳ بل چيڪ ڪرڻ جو ياد ڏياريندڙ لڳايو.",
        LINK_LABEL: "کاتا منظم ڪريو"
      },
      "metodo-bola-de-nieve": {
        TITLE: "قرض ختم ڪرڻ جو سنو بال طريقو",
        SUMMARY: "مالي ذميوارين مان نڪرڻ لاءِ هڪ قدم قدم حڪمت عملي.",
        ACTION_TIP: "ننڍن قرضن کي پهرين ختم ڪري رفتار وڌايو.",
        LINK_LABEL: "بچت جا مقصد ڏسو"
      },
      "interes-compuesto": {
        TITLE: "مرڪب منافعو ۽ باقاعده بچت جي طاقت",
        SUMMARY: "مسلسل بچت سان سرمائي جي واڌاري کي تيز ڪريو.",
        ACTION_TIP: "هڪ خودڪار بچت وارو اصول مقرر ڪريو.",
        LINK_LABEL: "بچت جا مقصد ڏسو"
      }
    }
  }
};

// 6. Kaqchikel (kaq)
const kaqExtensions = {
  HOME: {
    WELCOME: "Ütz petenïk",
    WELCOME_SUB: "Wawe' k'o ri rutzijol ri apwaq chuqa' ri achi'jïk."
  },
  LOGIN: {
    ERROR_REQUIRED: "Tab'ana' utzil tatz'ib'aj ri ata'b'al chuqa' ri retokil.",
    FORGOT_INFO: "Richin nak'ëx ri retokil, katb'e ruk'in to'onïk o katok ruk'in Google/Outlook.",
    HIDE_PASSWORD: "Tewäx ri retokil",
    SHOW_PASSWORD: "Tik'ut ri retokil",
    CHAT_TIP_DEFAULT: "¡Xb'e k'a! In Curbi, ri ato'onel richin ri apwaq chuqa' yakoj pwaq.",
    CHAT_TIP_SAVINGS: "Ruk'in CURBI yatikïr naya' rayb'äl richin yakoj pwaq chuqa' ri regla 50/30/20.",
    CHAT_TIP_CARDS: "Yatikïr nachajij ri a-tarjetas pa jun b'ey.",
    CHAT_TIP_GENERAL: "Katok o tatz'ib'aj ab'i' richin nachap ri rusamajixik apwaq."
  },
  REGISTER: {
    ERROR_REQUIRED: "Tab'ana' utzil tanojisaj ronojel ri k'atzinel.",
    ERROR_EMAIL: "Tab'ana' utzil tatz'ib'aj jun ütz taqowäch.",
    ERROR_PASSWORD: "Ri retokil k'atzinel k'o waqxaqi' tz'ib'.",
    ERROR_AGREED: "K'atzinel nak'ul ri rutzijol k'amonïk chuqa' samaj.",
    ERROR_SERVER: "Man tikirel ta xutz'ët ri kematz'ib'. Titij chik jun b'ey.",
    CHAT_TIP_DEFAULT: "Tatz'ib'aj ab'i' pa CURBI richin nachäp yakoj pwaq chuqa' rayb'äl!",
    CHAT_TIP_FREE: "¡CURBI sipan richin nato'ik chi rij ri apwaq!",
    CHAT_TIP_GENERAL: "Tanojisaj ri rutzijol pa ri ajkiq'ab' richin katok pa jun ti ramaj."
  },
  LEARN: {
    LEVELS: {
      STRATEGIST: {
        TITLE: "Na'ojinel pa Pwaq",
        DESC: "Nimaläj etamab'äl chi rij ri pwaq"
      },
      SAVER: {
        TITLE: "Yakonel Na'ojil",
        DESC: "Ütz kib'anikil tajin nilitäj"
      },
      LEARNER: {
        TITLE: "Tajin netamäx",
        DESC: "Tatz'eta' ri peraj richin nachäp"
      },
      BASIC: "Ruxe'el",
      INTERMEDIATE: "Nik'aj",
      ADVANCED: "Ajtij"
    },
    CATEGORIES: {
      BASICS: "Ruxe'el",
      EXPENSES: "Q'atonem Gastos",
      CREDIT: "Qasomal chuqa' K'as",
      FUTURE: "Tiko'n chuqa' Chwa'q"
    },
    CALC: {
      BUG: {
        TAG: "K'AMB'ÄL",
        TITLE: "Retamab'al ri Ch'uti Gastos",
        SUBTITLE: "Tatz'eta' ri k'ayewal chi rij ri ch'uti gastos q'ij q'ij.",
        CONCEPT_LABEL: "Rutzijol ri gasto:",
        CONCEPT_PLACEHOLDER: "ej. Kape, q'utu'n, delivery",
        AMOUNT_LABEL: "Jarupe' pa q'ij (Q):",
        FREQ_LABEL: "Jarupe' q'ij pa wuqq'ij:",
        DAYS_1: "1 q'ij / wuqq'ij",
        DAYS_2: "2 q'ij / wuqq'ij",
        DAYS_3: "3 q'ij / wuqq'ij",
        DAYS_4: "4 q'ij / wuqq'ij",
        DAYS_5: "5 q'ij (Samajib'äl)",
        DAYS_6: "6 q'ij / wuqq'ij",
        DAYS_7: "Ronojel q'ij (7)",
        RESULT_MONTHLY: "Gasto Ik'ik'",
        RESULT_YEARLY: "Gasto Juna'",
        RESULT_5YEARS: "Yakoj pwaq pa 5 Juna'",
        ADVICE_TITLE: "Rutzijol CURBI",
        ADVICE_DESC: "Tuya' 50% chi re re gasto re' ntel jun yakoj ik'ik' chi",
        ADVICE_SUFFIX: "choj pa ri arayb'al chi yakoj pwaq."
      },
      RULE: {
        TAG: "RETAMAB'AL",
        TITLE: "Jachonïk Pwaq 50 / 30 / 20",
        SUBTITLE: "Tatz'ib'aj ri ch'ajch'öj pwaq ik'ik' richin jun ütz cholb'äl.",
        INCOME_LABEL: "Ch'ajch'öj ik'ik' pwaq (Q):",
        NEEDS_TAG: "50% RAJOWAXIKIL",
        NEEDS_DESC: "Jay, way, ya', q'aq', aq'omanïk chuqa' b'enam.",
        WANTS_TAG: "30% RAYB'ÄL ACHIK'",
        WANTS_DESC: "Etz'anem, q'utu'n, chuqa' loq'oj.",
        SAVINGS_TAG: "20% YAKOJ PWAQ CHUQA' K'AS",
        SAVINGS_DESC: "Yakoj pwaq k'atzinel pa CURBI o tojonïk k'as.",
        LINK_SAVES: "Tachojmirisaj ri apwaq pa CURBI"
      },
      EMERG: {
        TAG: "CHAJINÏK",
        TITLE: "Rayb'al Yakoj pa K'ayewal",
        SUBTITLE: "Tatz'eta' jarupe' pwaq rajowaxik richin colob'äl pa k'ayewal.",
        EXPENSES_LABEL: "Rajowaxikil gastos ik'ik' (Q):",
        COVERAGE_LABEL: "Jarupe' ik' nawajo':",
        MONTHS_3: "3 ik' (Ütz na'oj)",
        MONTHS_6: "6 ik' (Nimaläj jikomal)",
        MONTHS_9: "9 ik' ",
        MONTHS_12: "12 ik' (Aj-itij o freelancer)",
        TARGET_LABEL: "Yakoj pwaq rajowaxik",
        TARGET_MONTHS_LABEL: "Ramaj richin nak'ïs",
        PLAN_6: "Pa 6 ik'",
        PLAN_12: "Pa 12 ik'",
        PLAN_18: "Pa 18 ik'",
        PER_MONTH: "/ ik'",
        LINK_GOAL: "Tatz'uk Rayb'äl pa CURBI"
      }
    },
    GLOSSARY: {
      SEARCH_PLACEHOLDER: "Tikanöx ri tzij pa pwaq (ej. yakoj, k'as, rajil)...",
      PRACTICAL_EXAMPLE: "K'amb'äl tz'etb'äl",
      NO_RESULTS: "Majun xilitäj chi rij \"{{ query }}\".",
      VIEW_ALL: "Titz'et ronojel",
      TAGS: {
        BASICS: "Ruxe'el",
        SAVINGS: "Yakoj",
        BUDGETS: "Cholb'äl",
        INVESTMENT: "Tiko'n",
        CREDIT: "Qasomal",
        ECONOMY: "Aj-ik'",
        FINANCE: "Pwaq"
      },
      TERMS: {
        "emergency-fund": {
          TERM: "Yakoj pa K'ayewal",
          SHORT_DESC: "Achajinïk pwaq toq k'o k'ayewal.",
          EXPLANATION: "Pwaq yakon choj richin yabil, ruk'ojlem ch'ich' o sachoj samaj. Ütz 3 k'a 6 ik' gastos.",
          EXAMPLE: "We agastos e Q3,000 pa jun ik', 3 ik' e Q9,000."
        },
        "micro-expenses": {
          TERM: "Ch'uti Gastos",
          SHORT_DESC: "Ch'uti loq'oj q'ij q'ij man netamäx ta.",
          EXPLANATION: "Loq'oj q'ij q'ij nkisärisaj ri apwaq akuchi ntel nimaläj rajil pa jun juna'.",
          EXAMPLE: "We nak'ës Q20 pa q'ij, ntel Q600 ik'ik' chuqa' Q7,200 juna'."
        },
        "rule-50-30-20": {
          TERM: "Regla 50 / 30 / 20",
          SHORT_DESC: "Man k'ayew ta jachonïk apwaq ik'ik'.",
          EXPLANATION: "50% rajowaxik, 30% rayb'äl, 20% yakoj pwaq chuqa' tojonïk k'as.",
          EXAMPLE: "Pa Q5,000: Q2,500 rajowaxik, Q1,500 rayb'äl, Q1,000 yakoj."
        },
        "compound-interest": {
          TERM: "Poq'näq Ral Pwaq",
          SHORT_DESC: "Ral pwaq chi rij ral pwaq xch'ak chik.",
          EXPLANATION: "Toq ri ach'akoj ntz'aqat ruk'in ri apwaq ruxe'el richin npoq'an chik.",
          EXAMPLE: "Yakoj Q1,000 pa 5% nuch'äk Q50 ri nab'ey juna', chuqa' 5% chi rij Q1,050 ri ruka'n."
        },
        "full-payer": {
          TERM: "Tojonel Ronojel (Tarjeta)",
          SHORT_DESC: "Winaq nutöj ronojel ri tarjeta ik'ik'.",
          EXPLANATION: "Nutöj ronojel ri k'as chuwäch ri q'ij richin man nutöj ta ral pwaq.",
          EXAMPLE: "Xaloq' Q800 pa ri ik', natöj choj Q800 pa ri q'ij."
        },
        "inflation": {
          TERM: "Jotolïk Rajil",
          SHORT_DESC: "Jotolïk rajil q'ij q'ij chuqa' sachoj uchuq'a' pwaq.",
          EXPLANATION: "Toq ri jastaq njote' rajil pa ronojel q'ij, ri pwaq yakon pa warab'äl manäq chik nuloq'.",
          EXAMPLE: "We jun wa'ïk k'o Q30 kan chuqa' wakamin Q33, ri jotolïk xux 10%."
        },
        "liquidity": {
          TERM: "Aninek Pwaq (Liquidez)",
          SHORT_DESC: "Aninek yatikïr nakusaj ri apwaq.",
          EXPLANATION: "Ri apwaq pa CURBI chaq'ij aninek yatikïr nakusaj, xa jun jay man aninek ta nak'ayij.",
          EXAMPLE: "Pwaq k'o pa acolar nkiya' aninek pwaq chawa."
        },
        "zero-based-budget": {
          TERM: "Cholb'äl Base Cero",
          SHORT_DESC: "Naya' rusamaj ronojel centavo nok pe.",
          EXPLANATION: "Ronojel quetzal k'o rusamaj akuchi ri apwaq ntel cero toq xajäj ronojel gastos chuqa' yakoj.",
          EXAMPLE: "We nach'äk Q4,000, naya' rusamaj ronojel ri Q4,000."
        }
      }
    },
    MODAL: {
      CLOSE: "Titz'apïx tijonïk",
      OF_READING: "sik'inïk",
      KEY_POINTS: "Nimaläj na'oj",
      ACTION_TIP: "Samaj chilb'exik"
    },
    LESSONS: {
      "regla-50-30-20": {
        TITLE: "Ri regla 50 / 30 / 20 richin nacholmirisaj apwaq",
        SUMMARY: "Tetamäx jachonïk pwaq akuchi man nak'ës ta ri rayb'äl.",
        ACTION_TIP: "Katb'e pa K'amb'äl Retamab'al richin nachol apwaq.",
        LINK_LABEL: "Tachojmirisaj apwaq pa CURBI"
      },
      "fondo-emergencia": {
        TITLE: "Ri Nab'ey Yakoj pa K'ayewal",
        SUMMARY: "Rutzijol achike ruma ri yakoj pwaq nuchajij awi' chuwäch k'as.",
        ACTION_TIP: "Tachapa' ruk'in jun ti yakoj: tayaka' Q200 re ik' re'.",
        LINK_LABEL: "Tatz'uk Rayb'äl pa K'ayewal"
      },
      "gastos-hormiga": {
        TITLE: "Q'atonïk Ch'uti Gastos chuqa' aninek loq'oj",
        SUMMARY: "Ketamäx ri ch'uti loq'oj nkisach apwaq.",
        ACTION_TIP: "Tatz'eta' ri asuscripciones chuqa' tayuja' ri man nakusaj ta.",
        LINK_LABEL: "Tatz'eta' ri amovimientos"
      },
      "tarjetas-credito": {
        TITLE: "Tarjetas de Crédito: Ütz kusanïk majun ral pwaq",
        SUMMARY: "Takusaj ri utzil richin tarjeta majun tojonïk ral pwaq.",
        ACTION_TIP: "Tatz'ib'aj ri q'ij richin natöj chuwäch ri q'ij.",
        LINK_LABEL: "Tachajij ri acuentas"
      },
      "metodo-bola-de-nieve": {
        TITLE: "Ri Na'oj Bola de Nieve richin tojonïk k'as",
        SUMMARY: "Ruk'ojlemal cholajem richin nak'ïs ronojel ri ak'as.",
        ACTION_TIP: "Tatz'ib'aj ri ak'as chuqa' tatöj nab'ey ri mas ti k'as.",
        LINK_LABEL: "Tatz'eta' Yakoj Rayb'äl"
      },
      "interes-compuesto": {
        TITLE: "Ri Ral Pwaq Poq'näq chuqa' jikïl yakoj",
        SUMMARY: "Achike rub'anïk ri ral pwaq nunimirisaj ri apwaq pa juna'.",
        ACTION_TIP: "Tayaka' pwaq q'ij q'ij o ik'ik' stape' ti pwaq.",
        LINK_LABEL: "Tatz'eta' Yakoj Rayb'äl"
      }
    }
  }
};

const map = {
  es: esExtensions,
  en: enExtensions,
  fr: frExtensions,
  pt: ptExtensions,
  sd: sdExtensions,
  kaq: kaqExtensions
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: {} });
      deepMerge(target[key], source[key]);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }
  return target;
}

[publicI18nDir, srcI18nDir].forEach(dir => {
  for (const [lang, ext] of Object.entries(map)) {
    const file = path.join(dir, `${lang}.json`);
    if (fs.existsSync(file)) {
      const original = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const merged = deepMerge(original, ext);
      fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf-8');
      console.log(`Updated ${file}`);
    } else {
      console.warn(`File not found: ${file}`);
    }
  }
});

console.log('Translation extension complete!');
