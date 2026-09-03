import { Language } from './types';

export const translations = {
  EN: {
    // Brand & Header
    brandTitle: 'Sollviera',
    brandSub: 'Housekeeping PMS',
    loginTitle: 'Cabinet Sign In',
    loginSub: 'Enter your credentials to manage your hotel shift & assignments',
    
    // Auth
    emailLabel: 'Email or Staff Login ID',
    emailPlaceholder: 'e.g. cleaner.elena@sollviera.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    showPassword: 'Show',
    hidePassword: 'Hide',
    loginButton: 'Sign In to Shift',
    loggingIn: 'Authenticating...',
    loginError: 'Invalid credentials. Please use quick demo accounts below.',
    demoAccountsTitle: 'Quick Demo Profiles',
    demoRoleSenior: 'Senior Cleaner',
    demoRoleCleaner: 'Cleaner',
    demoRoleSupervisor: 'Housekeeping Supervisor',
    forgotPassword: 'Forgot password?',
    contactHelpdesk: 'Contact IT Helpdesk',

    // Profile Screen
    profileTitle: 'Employee Profile',
    badgeIdLabel: 'Staff ID',
    roleLabel: 'Role',
    assignedFloor: 'Assigned Floor',
    roleCleaner: 'Cleaner',
    roleSeniorCleaner: 'Senior Cleaner',
    roleSupervisor: 'Supervisor',

    // Shift Management
    shiftSectionTitle: 'Current Shift Management',
    shiftNumLabel: 'Shift Number',
    shiftDateLabel: 'Shift Date',
    shiftStatusTitle: 'Active Shift Status',
    statusOnShift: 'On Shift',
    statusOnBreak: 'On Break',
    statusShiftEnded: 'Shift Ended',
    statusDescriptionOnShift: 'Active on floor. Room tracking enabled.',
    statusDescriptionOnBreak: 'On scheduled rest break (15-30m).',
    statusDescriptionShiftEnded: 'Shift concluded. All clean reports submitted.',

    // Shift Stats
    roomsCleanedLabel: 'Rooms Cleaned',
    avgTimeLabel: 'Avg Time / Room',
    shiftDuration: 'Shift Elapsed',

    // Supervisor & Support
    supervisorTitle: 'Supervisor & Direct Support',
    callSupervisor: 'Call Supervisor',
    sendMessage: 'Report Issue / Message',
    supportHotline: 'Hotline Support',
    supervisorRoleText: 'Floor Supervisor',

    // Shift History
    historyTitle: 'Recent Shift History',
    historyRooms: 'rooms cleaned',
    historyScore: 'Quality Score',
    historyHours: 'hrs worked',
    noHistory: 'No shift history found.',

    // Message Modal
    reportModalTitle: 'Send Urgent Report to Supervisor',
    roomNumberLabel: 'Room Number',
    categoryLabel: 'Category',
    catLinen: 'Linen / Towels Request',
    catMaintenance: 'Maintenance / Repair Needed',
    catInspection: 'Ready for Inspection',
    catUrgent: 'Urgent Issue',
    messageLabel: 'Describe problem or request',
    messagePlaceholder: 'e.g. Minibar unlocked or water leak detected...',
    sendReportButton: 'Send Report',
    reportSuccess: 'Report sent to Supervisor!',
    cancel: 'Cancel',

    // Footer & Actions
    logoutButton: 'Log Out',
    versionText: 'Sollviera PMS v2.4 • Housekeeping Mobile',

    // Cleaning Dashboard Screen
    dashGreeting: 'Hello',
    dashSub: 'Your Housekeeping Assignments',
    statRemaining: 'Remaining rooms',
    statCompleted: 'Completed today',
    statTotal: 'Total assigned',
    statUrgent: 'Urgent / VIP',
    searchPlaceholder: 'Search',
    
    // Status Filter Chips
    filterAll: 'All',
    filterPending: 'Pending',
    filterInProgress: 'In Progress',
    filterReady: 'Ready',
    filterProblem: 'Problem',
    filterVerified: 'Verified',

    // Cleaning Type Labels
    typeCheckout: 'Checkout',
    typeStayover: 'Current / Stayover',
    typeDeepClean: 'Deep Clean',
    typeAfterMaintenance: 'After Maintenance',
    typeAll: 'All Types',

    // Floor Selector
    floorAll: 'All Floors',
    floorLabel: 'Floor',

    // Room Card Details
    roomFloorLabel: 'Floor',
    guestsLabel: 'Guests',
    adultsShort: 'Ad',
    childrenShort: 'Ch',
    checkoutShort: 'Check-out',
    checkinShort: 'Check-in',
    deadlineLabel: 'Target',
    overdueBadge: 'OVERDUE',
    
    // Room Actions
    btnStartCleaning: 'Start Cleaning',
    btnContinueCleaning: 'Continue Checklist',
    btnMarkReady: 'Mark as Ready',
    btnViewDetails: 'View Task Checklist',
    
    // Checklist Modal
    checklistTitle: 'Room Cleaning Checklist',
    notesTitle: 'PMS Special Instructions',
    markAllDone: 'Complete All Tasks',
    submitInspection: 'Submit for Inspection',
    roomVerifiedText: 'Room has been inspected & verified by Supervisor.',
    
    // Tab bar labels
    tabDashboard: 'Rooms',
    tabActiveRoom: 'Active Task',
    tabMaintenance: 'Maintenance',
    tabSupplies: 'Supplies',
    tabReports: 'Analytics',
    tabMessages: 'Messages',
    tabProfile: 'Profile',

    // Active Room / Checklist Screen
    selectRoomWarning: 'Please select a room from the Rooms tab to start cleaning.',
    noActiveRoom: 'No Active Room',
    timerCleaning: 'Cleaning duration',
    btnPause: 'Pause',
    btnResume: 'Resume',
    btnComplete: 'Finish & Submit',
    reportIssue: 'Issue',
    zoneBedroom: 'Bedroom',
    zoneBathroom: 'Bathroom',
    zoneMinibar: 'Minibar & Tea',
    zoneBalcony: 'Balcony',
    zoneOther: 'Other Area',
    photoBefore: 'Photo BEFORE',
    photoAfter: 'Photo AFTER',
    btnUpload: 'Upload Photo',
    requestHelp: 'Request Supplies / Help',
    cleanerConfirm: 'I confirm that all tasks have been completed in accordance with Sollviera hotel standards.',

    // Maintenance / Issues
    reportedIssues: 'Request History',
    issueBlockWarning: 'Blocks cleaning of this room',
    categoryPlumbing: 'Plumbing',
    categoryElectrical: 'Electrical',
    categoryFurniture: 'Furniture',
    categoryAppliances: 'Appliances',
    categoryCleanliness: 'Cleanliness',
    categoryOther: 'Other Issue',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityCritical: 'Critical',
    statusCreated: 'Created',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    blocksCleaningLabel: 'Blocks Room Cleaning?',
    voiceMemoSim: 'Audio Description (Voice Memo)',
    voiceMemoRecord: 'Record Voice Memo',
    voiceMemoRecording: 'Recording... Press to Stop',
    submitTicket: 'Submit Maintenance Ticket',
    blocksCleaningYes: 'Yes',
    blocksCleaningNo: 'No',

    // Supplies Screen
    suppliesTitle: 'Inventory',
    trolleyStock: 'My Trolley Stock',
    neededQtyLabel: 'Needed Target',
    requestRefill: 'Request Refills',
    submitRequest: 'Send Supply Request',
    refillSuccess: 'Supply request submitted to warehouse!',
    categoryLinenLabel: 'Bed Linen',
    categoryTowelsLabel: 'Towels',
    categoryAmenitiesLabel: 'Guest Amenities',
    categoryCleaningLabel: 'Cleaning Products',

    // Reports Screen
    analyticsTitle: 'Performance & Analytics',
    qualityScoreAverage: 'Avg Quality Score',
    avgTimeRoom: 'Avg Time per Room',
    totalCleaned: 'Total Cleaned',
    timePerRoomChart: 'Cleaning Duration',
    shiftHistoryDetail: 'Shift History Detail',

    // Messages Screen
    chatSupervisor: 'Supervisor Chat',
    systemNotifications: 'Push Notifications',
    pushFeed: 'Notification History',
    chatPlaceholder: 'Write a message to supervisor...',
    btnSend: 'Send',

    // Settings / Utilities
    offlineModeLabel: 'Offline Mode (Local Cache)',
    offlineSynced: 'All data synchronized',
    offlineUnsynced: 'Offline. Queueing changes...',
    developerConsole: 'Developer Console Logs',
    themeLabel: 'Application Theme',
    themeDark: 'Dark Theme',
    themeLight: 'Light Theme',
    logsExport: 'Export Debug Logs',
  },
  RU: {
    // Brand & Header
    brandTitle: 'Sollviera',
    brandSub: 'PMS Управление Клинингом',
    loginTitle: 'Вход в личный кабинет',
    loginSub: 'Введите учетные данные для доступа к смене и номерам',
    
    // Auth
    emailLabel: 'Email или Табельный номер',
    emailPlaceholder: 'например: cleaner.elena@sollviera.com',
    passwordLabel: 'Пароль',
    passwordPlaceholder: '••••••••',
    showPassword: 'Показать',
    hidePassword: 'Скрыть',
    loginButton: 'Войти на смену',
    loggingIn: 'Авторизация...',
    loginError: 'Неверные данные. Воспользуйтесь демо-аккаунтами ниже.',
    demoAccountsTitle: 'Быстрые Демо-Профили',
    demoRoleSenior: 'Старший клинер',
    demoRoleCleaner: 'Клинер',
    demoRoleSupervisor: 'Супервайзер клининга',
    forgotPassword: 'Забыли пароль?',
    contactHelpdesk: 'Связаться с ИТ-поддержкой',

    // Profile Screen
    profileTitle: 'Профиль сотрудника',
    badgeIdLabel: 'Табельный №',
    roleLabel: 'Должность',
    assignedFloor: 'Закрепленный этаж',
    roleCleaner: 'Клинер',
    roleSeniorCleaner: 'Старший клинер',
    roleSupervisor: 'Супервайзер',

    // Shift Management
    shiftSectionTitle: 'Управление текущей сменой',
    shiftNumLabel: 'Номер смены',
    shiftDateLabel: 'Дата смены',
    shiftStatusTitle: 'Статус рабочей смены',
    statusOnShift: 'На смене',
    statusOnBreak: 'На перерыве',
    statusShiftEnded: 'Смена завершена',
    statusDescriptionOnShift: 'Активная работа на этаже. Учет номеров включен.',
    statusDescriptionOnBreak: 'Перерыв на отдых (15-30 мин).',
    statusDescriptionShiftEnded: 'Смена завершена. Все отчеты переданы.',

    // Shift Stats
    roomsCleanedLabel: 'Убрано номеров',
    avgTimeLabel: 'Средн. время на номер',
    shiftDuration: 'Время на смене',

    // Supervisor & Support
    supervisorTitle: 'Супервайзер и Поддержка',
    callSupervisor: 'Позвонить супервайзеру',
    sendMessage: 'Сообщить о проблеме',
    supportHotline: 'Горячая линия',
    supervisorRoleText: 'Супервайзер этажа',

    // Shift History
    historyTitle: 'Краткая история смен',
    historyRooms: 'номеров убрано',
    historyScore: 'Оценка качества',
    historyHours: 'часов отработано',
    noHistory: 'История смен отсутствует.',

    // Message Modal
    reportModalTitle: 'Отправить сообщение супервайзеру',
    roomNumberLabel: 'Номер комнаты',
    categoryLabel: 'Категория',
    catLinen: 'Нехватка белья / полотенец',
    catMaintenance: 'Требуется ремонт / техник',
    catInspection: 'Готово к инспекции',
    catUrgent: 'Срочный вопрос',
    messageLabel: 'Опишите проблему или запрос',
    messagePlaceholder: 'например: Протечка воды в ванне или открытый мини-бар...',
    sendReportButton: 'Отправить',
    reportSuccess: 'Сообщение отправлено супервайзеру!',
    cancel: 'Отмена',

    // Footer & Actions
    logoutButton: 'Выйти из аккаунта',
    versionText: 'Sollviera PMS v2.4 • Мобильный клининг',

    // Cleaning Dashboard Screen
    dashGreeting: 'Привет,',
    dashSub: 'Задачи по уборке номеров',
    statRemaining: 'Осталось номеров',
    statCompleted: 'Убрано сегодня',
    statTotal: 'Всего назначено',
    statUrgent: 'Срочные / VIP',
    searchPlaceholder: 'Поиск',
    
    // Status Filter Chips
    filterAll: 'Все',
    filterPending: 'Ожидают',
    filterInProgress: 'В процессе',
    filterReady: 'Готовы',
    filterProblem: 'Проблема',
    filterVerified: 'Проверено',

    // Cleaning Type Labels
    typeCheckout: 'Выездная',
    typeStayover: 'Текущая',
    typeDeepClean: 'Генеральная',
    typeAfterMaintenance: 'После ремонта',
    typeAll: 'Все типы',

    // Floor Selector
    floorAll: 'Все этажи',
    floorLabel: 'Этаж',

    // Room Card Details
    roomFloorLabel: 'Этаж',
    guestsLabel: 'Гости',
    adultsShort: 'Взр',
    childrenShort: 'Дет',
    checkoutShort: 'Выезд',
    checkinShort: 'Заезд',
    deadlineLabel: 'Срок до',
    overdueBadge: 'ПРОСРОЧЕНО',
    
    // Room Actions
    btnStartCleaning: 'Начать уборку',
    btnContinueCleaning: 'Продолжить чек-лист',
    btnMarkReady: 'Отметить готовой',
    btnViewDetails: 'Чек-лист задачи',
    
    // Checklist Modal
    checklistTitle: 'Чек-лист уборки номера',
    notesTitle: 'Особые указания PMS',
    markAllDone: 'Выполнить все пункты',
    submitInspection: 'Передать на инспекцию',
    roomVerifiedText: 'Номер проверен и утвержден супервайзером.',

    // Tab bar labels
    tabDashboard: 'Номера',
    tabActiveRoom: 'Активный номер',
    tabMaintenance: 'Неполадки',
    tabSupplies: 'Расходники',
    tabReports: 'Отчеты',
    tabMessages: 'Сообщения',
    tabProfile: 'Профиль',

    // Active Room / Checklist Screen
    selectRoomWarning: 'Пожалуйста, выберите номер во вкладке «Номера», чтобы начать уборку.',
    noActiveRoom: 'Нет активного номера',
    timerCleaning: 'Время уборки номера',
    btnPause: 'Пауза',
    btnResume: 'Возобновить',
    btnComplete: 'Завершить уборку',
    reportIssue: 'Поломка',
    zoneBedroom: 'Спальня',
    zoneBathroom: 'Ванная комната',
    zoneMinibar: 'Мини-бар и Чай',
    zoneBalcony: 'Балкон',
    zoneOther: 'Другие зоны',
    photoBefore: 'Фото ДО',
    photoAfter: 'Фото ПОСЛЕ',
    btnUpload: 'Загрузить фото',
    requestHelp: 'Запросить расходники / помощь',
    cleanerConfirm: 'Подтверждаю выполнение всех работ по стандартам отеля Sollviera.',

    // Maintenance / Issues
    reportedIssues: 'История заявлений',
    issueBlockWarning: 'Блокирует уборку этой комнаты',
    categoryPlumbing: 'Сантехника',
    categoryElectrical: 'Электрика',
    categoryFurniture: 'Мебель',
    categoryAppliances: 'Бытовая техника',
    categoryCleanliness: 'Чистота / Грязь',
    categoryOther: 'Другая проблема',
    priorityLow: 'Низкий',
    priorityMedium: 'Средний',
    priorityHigh: 'Высокий',
    priorityCritical: 'Критический',
    statusCreated: 'Создана',
    statusInProgress: 'В работе',
    statusResolved: 'Устранена',
    blocksCleaningLabel: 'Блокирует уборку номера?',
    voiceMemoSim: 'Голосовое описание (Аудиозапись)',
    voiceMemoRecord: 'Записать аудиосообщение',
    voiceMemoRecording: 'Идет запись... Нажмите для остановки',
    submitTicket: 'Отправить заявку в техслужбу',
    blocksCleaningYes: 'Да',
    blocksCleaningNo: 'Нет',

    // Supplies Screen
    suppliesTitle: 'Инвентарь',
    trolleyStock: 'Запас моей тележки',
    neededQtyLabel: 'Целевой норматив',
    requestRefill: 'Запрос на пополнение',
    submitRequest: 'Отправить запрос на склад',
    refillSuccess: 'Заявка успешно отправлена на склад!',
    categoryLinenLabel: 'Постельное белье',
    categoryTowelsLabel: 'Полотенца',
    categoryAmenitiesLabel: 'Косметика и гигиена',
    categoryCleaningLabel: 'Чистящие средства',

    // Reports Screen
    analyticsTitle: 'Аналитика и Отчеты',
    qualityScoreAverage: 'Средняя оценка',
    avgTimeRoom: 'Средн. время на номер',
    totalCleaned: 'Всего номеров убрано',
    timePerRoomChart: 'Длительность уборки',
    shiftHistoryDetail: 'Детализированная история смен',

    // Messages Screen
    chatSupervisor: 'Чат с супервайзером',
    systemNotifications: 'Push-уведомления',
    pushFeed: 'История уведомлений',
    chatPlaceholder: 'Написать супервайзеру...',
    btnSend: 'Отправить',

    // Settings / Utilities
    offlineModeLabel: 'Офлайн-режим (Локальный кэш)',
    offlineSynced: 'Все данные синхронизированы',
    offlineUnsynced: 'Офлайн. Запросы в очереди...',
    developerConsole: 'Консоль логов разработчика',
    themeLabel: 'Цветовая тема приложения',
    themeDark: 'Темная тема',
    themeLight: 'Светлая тема',
    logsExport: 'Экспортировать логи отладки',
  }
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.EN;
}

