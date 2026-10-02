const fs = require('fs');
const path = require('path');

const extensions = {
  es: {
    TRANSACTIONS: {
      FORM: {
        TITLE: "Nueva transacción",
        DESCRIPTION: "Descripción",
        AMOUNT: "Monto",
        TYPE: "Tipo",
        EXPENSE: "Gasto",
        INCOME: "Ingreso",
        CATEGORY: "Categoría",
        ACCOUNT: "Cuenta",
        CHOOSE_ACCOUNT: "Elige una cuenta",
        CLEAR: "Limpiar",
        SAVE: "Guardar movimiento",
        SAVING: "Guardando…"
      },
      STATS: {
        INCOME: "INGRESOS",
        EXPENSE: "GASTOS",
        TOTAL: "TOTAL MOVIMIENTOS"
      },
      FILTERS: {
        SEARCH: "Buscar",
        SEARCH_PLACEHOLDER: "Descripción o categoría",
        TYPE: "Tipo",
        ALL: "Todas",
        INCOME: "Ingresos",
        EXPENSE: "Gastos",
        CATEGORY: "Categoría",
        CLEAR: "Limpiar"
      },
      EMPTY_FILTERED: "No hay transacciones con esos filtros."
    },
    SAVES: {
      VIEW_DETAILS: "Ver detalles",
      GOAL_COMPLETE: "Meta completa",
      CONTRIBUTE_BTN: "Aportar $",
      MODAL_NEW: {
        TITLE: "Nueva meta de ahorro",
        NAME_LABEL: "¿Para qué ahorras?",
        NAME_PLACEHOLDER: "Ej. Viaje a Antigua",
        CATEGORY_LABEL: "Categoría",
        CATEGORY_HINT: "El icono de la tarjeta sale de la categoría que elijas.",
        TARGET_LABEL: "Monto objetivo (Q)",
        TARGET_HINT: "La meta empieza en Q0.00 y vas sumando aportes hasta llegar al objetivo.",
        CANCEL: "Cancelar",
        CREATING: "Creando...",
        SUBMIT: "Crear meta"
      },
      MODAL_CONTRIBUTE: {
        TITLE_PREFIX: "Aportar a",
        CARD_BALANCE: "Saldo disponible en tarjeta:",
        MAX_AFFORDABLE: "Máximo con esta tarjeta:",
        AMOUNT_LABEL: "Monto a aportar (Q)",
        COMPLETE_GOAL: "Completar meta",
        PROJECTED: "Progreso proyectado:",
        CONFIRM: "Confirmar aporte",
        SUBMITTING: "Aportando..."
      }
    },
    WALLET: {
      STACK_LABEL: "Tus tarjetas",
      CARD: {
        HOLDER: "Titular",
        EXPIRY: "Vigencia",
        AVAILABLE_BALANCE: "Saldo Disponible",
        REMOVE: "Quitar tarjeta",
        CREDIT: "crédito",
        DEBIT: "débito"
      },
      ACCOUNT_DEPOSIT: "Número de cuenta para que te depositen",
      COPY: "Copiar",
      COPIED: "¡Copiado!",
      EMPTY: {
        TITLE: "Aún no tienes tarjetas",
        SUBTITLE: "Agrega una tarjeta de débito o crédito para empezar a ver tu saldo y movimientos.",
        BTN: "Agregar mi primera tarjeta"
      },
      QUICK: {
        TITLE: "Acciones rápidas",
        TRANSFER: "Transferir",
        REQUEST: "Solicitar",
        PAY_BILL: "Pagar servicio",
        ADD_CARD: "Agregar tarjeta",
        INCOME_MONTH: "Ingresos (mes)",
        EXPENSE_MONTH: "Gastos (mes)"
      },
      MOVEMENTS: {
        TITLE: "ÚLTIMOS MOVIMIENTOS",
        SEE_ALL: "Ver todos",
        EMPTY: "Aún no hay movimientos registrados."
      }
    },
    LEARN: {
      FILTERS: {
        ALL: "Todas",
        BASICS: "Fundamentos",
        EXPENSES: "Control de Gastos",
        CREDIT: "Crédito y Deudas",
        FUTURE: "Inversión y Futuro"
      },
      CARD: {
        READ_GUIDE: "Leer guía →",
        COMPLETED: "✓ Completada",
        MARK_READ: "Marcar leída",
        PENDING: "Marcar como pendiente"
      },
      CALCULATORS: {
        SIMULATOR: "SIMULADOR",
        BUG_TITLE: "Calculadora de Gastos Hormiga",
        BUG_DESC: "Estima el impacto acumulado de pequeños consumos regulares a mediano y largo plazo.",
        RULE_TITLE: "Simulador Regla 50/30/20",
        RULE_DESC: "Distribuye tu ingreso mensual en Necesidades (50%), Deseos (30%) y Ahorro (20%)."
      }
    }
  },
  en: {
    TRANSACTIONS: {
      FORM: {
        TITLE: "New transaction",
        DESCRIPTION: "Description",
        AMOUNT: "Amount",
        TYPE: "Type",
        EXPENSE: "Expense",
        INCOME: "Income",
        CATEGORY: "Category",
        ACCOUNT: "Account",
        CHOOSE_ACCOUNT: "Choose an account",
        CLEAR: "Clear",
        SAVE: "Save transaction",
        SAVING: "Saving…"
      },
      STATS: {
        INCOME: "INCOME",
        EXPENSE: "EXPENSES",
        TOTAL: "TOTAL TRANSACTIONS"
      },
      FILTERS: {
        SEARCH: "Search",
        SEARCH_PLACEHOLDER: "Description or category",
        TYPE: "Type",
        ALL: "All",
        INCOME: "Income",
        EXPENSE: "Expenses",
        CATEGORY: "Category",
        CLEAR: "Clear"
      },
      EMPTY_FILTERED: "No transactions found with these filters."
    },
    SAVES: {
      VIEW_DETAILS: "View details",
      GOAL_COMPLETE: "Goal completed",
      CONTRIBUTE_BTN: "Contribute $",
      MODAL_NEW: {
        TITLE: "New savings goal",
        NAME_LABEL: "What are you saving for?",
        NAME_PLACEHOLDER: "e.g. Trip to Antigua",
        CATEGORY_LABEL: "Category",
        CATEGORY_HINT: "The card icon comes from the category you pick.",
        TARGET_LABEL: "Target amount (Q)",
        TARGET_HINT: "The goal starts at Q0.00 and you add contributions until reaching the target.",
        CANCEL: "Cancel",
        CREATING: "Creating...",
        SUBMIT: "Create goal"
      },
      MODAL_CONTRIBUTE: {
        TITLE_PREFIX: "Contribute to",
        CARD_BALANCE: "Available balance on card:",
        MAX_AFFORDABLE: "Max with this card:",
        AMOUNT_LABEL: "Amount to contribute (Q)",
        COMPLETE_GOAL: "Complete goal",
        PROJECTED: "Projected progress:",
        CONFIRM: "Confirm contribution",
        SUBMITTING: "Contributing..."
      }
    },
    WALLET: {
      STACK_LABEL: "Your cards",
      CARD: {
        HOLDER: "Holder",
        EXPIRY: "Expires",
        AVAILABLE_BALANCE: "Available Balance",
        REMOVE: "Remove card",
        CREDIT: "credit",
        DEBIT: "debit"
      },
      ACCOUNT_DEPOSIT: "Account number to receive deposits",
      COPY: "Copy",
      COPIED: "Copied!",
      EMPTY: {
        TITLE: "No cards yet",
        SUBTITLE: "Add a debit or credit card to start seeing your balance and movements.",
        BTN: "Add my first card"
      },
      QUICK: {
        TITLE: "Quick actions",
        TRANSFER: "Transfer",
        REQUEST: "Request",
        PAY_BILL: "Pay bill",
        ADD_CARD: "Add card",
        INCOME_MONTH: "Income (month)",
        EXPENSE_MONTH: "Expenses (month)"
      },
      MOVEMENTS: {
        TITLE: "RECENT MOVEMENTS",
        SEE_ALL: "View all",
        EMPTY: "No transactions recorded yet."
      }
    },
    LEARN: {
      FILTERS: {
        ALL: "All",
        BASICS: "Foundations",
        EXPENSES: "Expense Control",
        CREDIT: "Credit & Debt",
        FUTURE: "Investing & Future"
      },
      CARD: {
        READ_GUIDE: "Read guide →",
        COMPLETED: "✓ Completed",
        MARK_READ: "Mark as read",
        PENDING: "Mark as pending"
      },
      CALCULATORS: {
        SIMULATOR: "SIMULATOR",
        BUG_TITLE: "Micro-expense Calculator",
        BUG_DESC: "Estimate the cumulative impact of daily small expenses over time.",
        RULE_TITLE: "50/30/20 Rule Simulator",
        RULE_DESC: "Split your monthly income into Needs (50%), Wants (30%) and Savings (20%)."
      }
    }
  },
  fr: {
    TRANSACTIONS: {
      FORM: {
        TITLE: "Nouvelle transaction",
        DESCRIPTION: "Description",
        AMOUNT: "Montant",
        TYPE: "Type",
        EXPENSE: "Dépense",
        INCOME: "Revenu",
        CATEGORY: "Catégorie",
        ACCOUNT: "Compte",
        CHOOSE_ACCOUNT: "Choisir un compte",
        CLEAR: "Effacer",
        SAVE: "Enregistrer l'opération",
        SAVING: "Enregistrement…"
      },
      STATS: {
        INCOME: "REVENUS",
        EXPENSE: "DÉPENSES",
        TOTAL: "TOTAL DES OPÉRATIONS"
      },
      FILTERS: {
        SEARCH: "Rechercher",
        SEARCH_PLACEHOLDER: "Description ou catégorie",
        TYPE: "Type",
        ALL: "Toutes",
        INCOME: "Revenus",
        EXPENSE: "Dépenses",
        CATEGORY: "Catégorie",
        CLEAR: "Effacer"
      },
      EMPTY_FILTERED: "Aucune transaction avec ces filtres."
    },
    SAVES: {
      VIEW_DETAILS: "Voir les détails",
      GOAL_COMPLETE: "Objectif atteint",
      CONTRIBUTE_BTN: "Contribuer $",
      MODAL_NEW: {
        TITLE: "Nouvel objectif d'épargne",
        NAME_LABEL: "Pourquoi épargnez-vous ?",
        NAME_PLACEHOLDER: "ex. Voyage à Antigua",
        CATEGORY_LABEL: "Catégorie",
        CATEGORY_HINT: "L'icône de la carte dépend de la catégorie choisie.",
        TARGET_LABEL: "Montant cible (Q)",
        TARGET_HINT: "L'objectif démarre à Q0.00 et progresse au fil de vos versements.",
        CANCEL: "Annuler",
        CREATING: "Création...",
        SUBMIT: "Créer l'objectif"
      },
      MODAL_CONTRIBUTE: {
        TITLE_PREFIX: "Contribuer à",
        CARD_BALANCE: "Solde disponible sur la carte :",
        MAX_AFFORDABLE: "Maximum avec cette carte :",
        AMOUNT_LABEL: "Montant à verser (Q)",
        COMPLETE_GOAL: "Compléter l'objectif",
        PROJECTED: "Progression projetée :",
        CONFIRM: "Confirmer la contribution",
        SUBMITTING: "Versement en cours..."
      }
    },
    WALLET: {
      STACK_LABEL: "Vos cartes",
      CARD: {
        HOLDER: "Titulaire",
        EXPIRY: "Expiration",
        AVAILABLE_BALANCE: "Solde disponible",
        REMOVE: "Retirer la carte",
        CREDIT: "crédit",
        DEBIT: "débit"
      },
      ACCOUNT_DEPOSIT: "Numéro de compte pour vos dépôts",
      COPY: "Copier",
      COPIED: "Copié !",
      EMPTY: {
        TITLE: "Aucune carte pour l'instant",
        SUBTITLE: "Ajoutez une carte de débit ou crédit pour afficher vos soldes et opérations.",
        BTN: "Ajouter ma première carte"
      },
      QUICK: {
        TITLE: "Actions rapides",
        TRANSFER: "Transférer",
        REQUEST: "Demander",
        PAY_BILL: "Payer facture",
        ADD_CARD: "Ajouter carte",
        INCOME_MONTH: "Revenus (mois)",
        EXPENSE_MONTH: "Dépenses (mois)"
      },
      MOVEMENTS: {
        TITLE: "DERNIERS MOUVEMENTS",
        SEE_ALL: "Voir tout",
        EMPTY: "Aucune opération enregistrée."
      }
    },
    LEARN: {
      FILTERS: {
        ALL: "Toutes",
        BASICS: "Fondamentaux",
        EXPENSES: "Gestion des Dépenses",
        CREDIT: "Crédit et Dettes",
        FUTURE: "Investissement & Avenir"
      },
      CARD: {
        READ_GUIDE: "Lire le guide →",
        COMPLETED: "✓ Terminé",
        MARK_READ: "Marquer comme lu",
        PENDING: "Marquer comme à lire"
      },
      CALCULATORS: {
        SIMULATOR: "SIMULATEUR",
        BUG_TITLE: "Calculateur de Dépenses Fantômes",
        BUG_DESC: "Estimez l'impact cumulé des petites dépenses quotidiennes sur le long terme.",
        RULE_TITLE: "Simulateur Règle 50/30/20",
        RULE_DESC: "Répartissez vos revenus entre Besoins (50%), Envies (30%) et Épargne (20%)."
      }
    }
  },
  pt: {
    TRANSACTIONS: {
      FORM: {
        TITLE: "Nova transação",
        DESCRIPTION: "Descrição",
        AMOUNT: "Valor",
        TYPE: "Tipo",
        EXPENSE: "Despesa",
        INCOME: "Receita",
        CATEGORY: "Categoria",
        ACCOUNT: "Conta",
        CHOOSE_ACCOUNT: "Escolha uma conta",
        CLEAR: "Limpar",
        SAVE: "Salvar transação",
        SAVING: "Salvando…"
      },
      STATS: {
        INCOME: "RECEITAS",
        EXPENSE: "DESPESAS",
        TOTAL: "TOTAL DE TRANSAÇÕES"
      },
      FILTERS: {
        SEARCH: "Buscar",
        SEARCH_PLACEHOLDER: "Descrição ou categoria",
        TYPE: "Tipo",
        ALL: "Todas",
        INCOME: "Receitas",
        EXPENSE: "Despesas",
        CATEGORY: "Categoria",
        CLEAR: "Limpar"
      },
      EMPTY_FILTERED: "Nenhuma transação com estes filtros."
    },
    SAVES: {
      VIEW_DETAILS: "Ver detalhes",
      GOAL_COMPLETE: "Meta concluída",
      CONTRIBUTE_BTN: "Contribuir $",
      MODAL_NEW: {
        TITLE: "Nova meta de economia",
        NAME_LABEL: "Para que você está guardando?",
        NAME_PLACEHOLDER: "Ex. Viagem para Antigua",
        CATEGORY_LABEL: "Categoria",
        CATEGORY_HINT: "O ícone do cartão depende da categoria selecionada.",
        TARGET_LABEL: "Valor alvo (Q)",
        TARGET_HINT: "A meta começa em Q0.00 e vai aumentando com seus aportes.",
        CANCEL: "Cancelar",
        CREATING: "Criando...",
        SUBMIT: "Criar meta"
      },
      MODAL_CONTRIBUTE: {
        TITLE_PREFIX: "Contribuir para",
        CARD_BALANCE: "Saldo disponível no cartão:",
        MAX_AFFORDABLE: "Máximo com este cartão:",
        AMOUNT_LABEL: "Valor do aporte (Q)",
        COMPLETE_GOAL: "Completar meta",
        PROJECTED: "Progresso projetado:",
        CONFIRM: "Confirmar aporte",
        SUBMITTING: "Contribuindo..."
      }
    },
    WALLET: {
      STACK_LABEL: "Seus cartões",
      CARD: {
        HOLDER: "Titular",
        EXPIRY: "Validade",
        AVAILABLE_BALANCE: "Saldo Disponível",
        REMOVE: "Remover cartão",
        CREDIT: "crédito",
        DEBIT: "débito"
      },
      ACCOUNT_DEPOSIT: "Número da conta para receber depósitos",
      COPY: "Copiar",
      COPIED: "Copiado!",
      EMPTY: {
        TITLE: "Ainda não tem cartões",
        SUBTITLE: "Adicione um cartão de débito ou crédito para ver seu saldo e transações.",
        BTN: "Adicionar meu primeiro cartão"
      },
      QUICK: {
        TITLE: "Ações rápidas",
        TRANSFER: "Transferir",
        REQUEST: "Solicitar",
        PAY_BILL: "Pagar conta",
        ADD_CARD: "Adicionar cartão",
        INCOME_MONTH: "Receitas (mês)",
        EXPENSE_MONTH: "Despesas (mês)"
      },
      MOVEMENTS: {
        TITLE: "ÚLTIMOS MOVIMENTOS",
        SEE_ALL: "Ver todos",
        EMPTY: "Nenhum movimento registrado ainda."
      }
    },
    LEARN: {
      FILTERS: {
        ALL: "Todas",
        BASICS: "Fundamentos",
        EXPENSES: "Controle de Gastos",
        CREDIT: "Crédito e Dívidas",
        FUTURE: "Investimento e Futuro"
      },
      CARD: {
        READ_GUIDE: "Ler guia →",
        COMPLETED: "✓ Concluído",
        MARK_READ: "Marcar como lido",
        PENDING: "Marcar como pendente"
      },
      CALCULATORS: {
        SIMULATOR: "SIMULADOR",
        BUG_TITLE: "Calculadora de Gastos Formiga",
        BUG_DESC: "Estime o impacto acumulado de pequenos gastos frequentes a longo prazo.",
        RULE_TITLE: "Simulador Regra 50/30/20",
        RULE_DESC: "Divida sua renda mensal em Necessidades (50%), Desejos (30%) e Poupança (20%)."
      }
    }
  },
  sd: {
    TRANSACTIONS: {
      FORM: {
        TITLE: "نئين ڏي وٺ",
        DESCRIPTION: "تفصيل",
        AMOUNT: "رقم",
        TYPE: "قسم",
        EXPENSE: "خرچ",
        INCOME: "آمدني",
        CATEGORY: "درجو",
        ACCOUNT: "کاتو",
        CHOOSE_ACCOUNT: "کاتو چونڊيو",
        CLEAR: "صاف ڪريو",
        SAVE: "ڏي وٺ محفوظ ڪريو",
        SAVING: "محفوظ ٿي رهيو آهي…"
      },
      STATS: {
        INCOME: "آمدني",
        EXPENSE: "خرچ",
        TOTAL: "ڪل ڏي وٺ"
      },
      FILTERS: {
        SEARCH: "ڳوليو",
        SEARCH_PLACEHOLDER: "تفصيل يا زمرو",
        TYPE: "قسم",
        ALL: "سڀ",
        INCOME: "آمدني",
        EXPENSE: "خرچ",
        CATEGORY: "درجو",
        CLEAR: "صاف ڪريو"
      },
      EMPTY_FILTERED: "انهن فلٽرن سان ڪا به ڏي وٺ نه ملي."
    },
    SAVES: {
      VIEW_DETAILS: "تفصيل ڏسو",
      GOAL_COMPLETE: "هدف مڪمل",
      CONTRIBUTE_BTN: "حصو ڏيو $",
      MODAL_NEW: {
        TITLE: "نئون بچت جو مقصد",
        NAME_LABEL: "توهان ڪهڙي لاءِ بچت ڪري رهيا آهيو؟",
        NAME_PLACEHOLDER: "مثال طور سير و تفريح",
        CATEGORY_LABEL: "درجو",
        CATEGORY_HINT: "ڪارڊ جو آئڪن منتخب ڪيل درجي مان ايندو.",
        TARGET_LABEL: "هدف رقم (Q)",
        TARGET_HINT: "مقصد Q0.00 کان شروع ٿئي ٿو ۽ توهان اضافو ڪندا رهو ٿا.",
        CANCEL: "منسوخ ڪريو",
        CREATING: "ٺهي رهيو آهي...",
        SUBMIT: "مقصد ٺاهيو"
      },
      MODAL_CONTRIBUTE: {
        TITLE_PREFIX: "۾ حصو وٺو",
        CARD_BALANCE: "ڪارڊ تي موجود بيلنس:",
        MAX_AFFORDABLE: "هن ڪارڊ سان وڌ ۾ وڌ:",
        AMOUNT_LABEL: "حصيداري رقم (Q)",
        COMPLETE_GOAL: "هدف پورو ڪريو",
        PROJECTED: "متوقع ترقي:",
        CONFIRM: "حصيداري جي تصديق ڪريو",
        SUBMITTING: "حصو شامل ٿي رهيو آهي..."
      }
    },
    WALLET: {
      STACK_LABEL: "توهان جا ڪارڊ",
      CARD: {
        HOLDER: "کاتي دار",
        EXPIRY: "مدت ختم",
        AVAILABLE_BALANCE: "موجود بيلنس",
        REMOVE: "ڪارڊ هٽايو",
        CREDIT: "ڪريڊٽ",
        DEBIT: "ڊيبٽ"
      },
      ACCOUNT_DEPOSIT: "رقم جمع ڪرائڻ لاءِ کاتو نمبر",
      COPY: "ڪاپي ڪريو",
      COPIED: "ڪاپي ٿي ويو!",
      EMPTY: {
        TITLE: "اڃا تائين ڪو ڪارڊ ناهي",
        SUBTITLE: "پنهنجو بيلنس ۽ ڏي وٺ ڏسڻ لاءِ ڊيبٽ يا ڪريڊٽ ڪارڊ شامل ڪريو.",
        BTN: "پنهنجو پهريون ڪارڊ شامل ڪريو"
      },
      QUICK: {
        TITLE: "فوري عمل",
        TRANSFER: "منتقل ڪريو",
        REQUEST: "طلب ڪريو",
        PAY_BILL: "بل ادا ڪريو",
        ADD_CARD: "ڪارڊ شامل ڪريو",
        INCOME_MONTH: "آمدني (مهينو)",
        EXPENSE_MONTH: "خرچ (مهينو)"
      },
      MOVEMENTS: {
        TITLE: "تازو ڏي وٺ",
        SEE_ALL: "سڀ ڏسو",
        EMPTY: "ڪا به ڏي وٺ درج ناهي ٿيل."
      }
    },
    LEARN: {
      FILTERS: {
        ALL: "سڀ",
        BASICS: "بنيادي ڳالهيون",
        EXPENSES: "خرچن تي ضابطو",
        CREDIT: "قرض ۽ ڪريڊٽ",
        FUTURE: "سيڙپڪاري ۽ مستقبل"
      },
      CARD: {
        READ_GUIDE: "رهنما پڙهو ←",
        COMPLETED: "✓ مڪمل ٿيو",
        MARK_READ: "پڙهيل نشان لڳايو",
        PENDING: "باقي طور نشان لڳايو"
      },
      CALCULATORS: {
        SIMULATOR: "سموليٽر",
        BUG_TITLE: "ننڍن خرچن جو حساب ڪتاب",
        BUG_DESC: "وقت گذرڻ سان ننڍن روزاني خرچن جي مجموعي اثر جو اندازو لڳايو.",
        RULE_TITLE: "50/30/20 اصول سموليٽر",
        RULE_DESC: "پنهنجي مهيني جي آمدني کي بنيادي ضرورتن، خواهشن ۽ بچت ۾ ورهايو."
      }
    }
  },
  kaq: {
    TRANSACTIONS: {
      FORM: {
        TITLE: "K'ak'a' tojb'äl",
        DESCRIPTION: "Rutzijol",
        AMOUNT: "Rajil",
        TYPE: "Ruwa",
        EXPENSE: "Sik'inïk",
        INCOME: "Ch'akoj",
        CATEGORY: "Ruwa",
        ACCOUNT: "Yakb'äl",
        CHOOSE_ACCOUNT: "Tacha' jun yakb'äl",
        CLEAR: "Tajosq'ij",
        SAVE: "Tiyak ri tojb'äl",
        SAVING: "Tajin niyak..."
      },
      STATS: {
        INCOME: "CH'AKOJ",
        EXPENSE: "SIK'INÏK",
        TOTAL: "RONOJEL TOJB'ÄL"
      },
      FILTERS: {
        SEARCH: "Tikanöx",
        SEARCH_PLACEHOLDER: "Rutzijol o ruwa",
        TYPE: "Ruwa",
        ALL: "Ronojel",
        INCOME: "Ch'akoj",
        EXPENSE: "Sik'inïk",
        CATEGORY: "Ruwa",
        CLEAR: "Tajosq'ij"
      },
      EMPTY_FILTERED: "Majun tojb'äl ruk'in re cha'oj."
    },
    SAVES: {
      VIEW_DETAILS: "Titz'ët rutzijol",
      GOAL_COMPLETE: "Tz'aqät ri rayb'äl",
      CONTRIBUTE_BTN: "Tiya' pwäq $",
      MODAL_NEW: {
        TITLE: "K'ak'a' rayb'äl richin yakoj pwäq",
        NAME_LABEL: "¿Achike ruma nayäk ri apwäq?",
        NAME_PLACEHOLDER: "Achi'el: B'enam pa Antigua",
        CATEGORY_LABEL: "Ruwa",
        CATEGORY_HINT: "Ri ruwäch wuj npe pa ri ruwa nacha'.",
        TARGET_LABEL: "Rajil rayb'äl (Q)",
        TARGET_HINT: "Ri rayb'äl ntikïr ruk'in Q0.00 chuqa' ntz'aqat ruk'in ato'ik.",
        CANCEL: "Tiq'at",
        CREATING: "Tajin nib'an...",
        SUBMIT: "Tib'an rayb'äl"
      },
      MODAL_CONTRIBUTE: {
        TITLE_PREFIX: "Tiya' pwäq chi re",
        CARD_BALANCE: "Pwäq k'o pa ri wuj:",
        MAX_AFFORDABLE: "Ri nïm ruk'in re wuj:",
        AMOUNT_LABEL: "Rajil naya' (Q)",
        COMPLETE_GOAL: "Titz'aqatisaj rayb'äl",
        PROJECTED: "B'enam nilitäj:",
        CONFIRM: "Tijikib'äx ya'oj",
        SUBMITTING: "Tajin niya'..."
      }
    },
    WALLET: {
      STACK_LABEL: "Ri awuj",
      CARD: {
        HOLDER: "Rajaw wuj",
        EXPIRY: "K'isb'äl q'ij",
        AVAILABLE_BALANCE: "Pwäq K'o",
        REMOVE: "Tiq'at ri wuj",
        CREDIT: "qajon",
        DEBIT: "k'o"
      },
      ACCOUNT_DEPOSIT: "Rajilab'al yakb'äl richin niya' apwäq",
      COPY: "Tiwachib'ëx",
      COPIED: "Xwachib'ëx yan!",
      EMPTY: {
        TITLE: "Majun wuj k'o ta na",
        SUBTITLE: "Tatz'aqatisaj jun debito o credito wuj richin natz'ët ri apwäq chuqa' b'enam.",
        BTN: "Tatz'aqatisaj ri nab'ey awuj"
      },
      QUICK: {
        TITLE: "Aninäq samaj",
        TRANSFER: "Tiq'axäx",
        REQUEST: "Tik'utuj",
        PAY_BILL: "Titoj ri samaj",
        ADD_CARD: "Tatz'aqatisaj wuj",
        INCOME_MONTH: "Ch'akoj (ik')",
        EXPENSE_MONTH: "Sik'inïk (ik')"
      },
      MOVEMENTS: {
        TITLE: "RUK'ISB'ÄL B'ENAM",
        SEE_ALL: "Titz'ët ronojel",
        EMPTY: "Majun b'enam tz'ib'an ta."
      }
    },
    LEARN: {
      FILTERS: {
        ALL: "Ronojel",
        BASICS: "Ruxe'el",
        EXPENSES: "Q'atonïk Sik'inïk",
        CREDIT: "Qajon chuqa' K'as",
        FUTURE: "Ilinïk chuqa' Chwa'q Kab'ij"
      },
      CARD: {
        READ_GUIDE: "Tasik'ij ri wuj →",
        COMPLETED: "✓ Xk'is yan",
        MARK_READ: "Tatz'ib'aj chi sik'in chik",
        PENDING: "Tatz'ib'aj chi man k'isinaq ta"
      },
      CALCULATORS: {
        SIMULATOR: "K'UTB'ÄL",
        BUG_TITLE: "Ajilanel Koköj Sik'inïk",
        BUG_DESC: "Tatz'ët ri nïm rajil ri koköj sik'inïk q'ij q'ij chpan ri juna'.",
        RULE_TITLE: "K'utb'äl Rucholanil 50/30/20",
        RULE_DESC: "Tach'aka' ri apwäq chpan rajawaxik (50%), rayb'äl (30%) chuqa' yakoj pwäq (20%)."
      }
    }
  }
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

const targetDirs = [
  path.join(__dirname, '../frontend/curbi/src/assets/i18n'),
  path.join(__dirname, '../frontend/curbi/public/assets/i18n')
];

for (const dir of targetDirs) {
  for (const [lang, ext] of Object.entries(extensions)) {
    const file = path.join(dir, `${lang}.json`);
    if (fs.existsSync(file)) {
      const current = JSON.parse(fs.readFileSync(file, 'utf8'));
      const updated = deepMerge(current, ext);
      fs.writeFileSync(file, JSON.stringify(updated, null, 2), 'utf8');
      console.log(`Updated ${file}`);
    }
  }
}
console.log('Extensions merged successfully!');
