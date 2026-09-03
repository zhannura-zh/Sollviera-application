import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import {
  Users, Award, Wrench, ShieldCheck, LayoutDashboard, ChevronRight, ChevronDown, ChevronLeft, Check, X,
  AlertTriangle, Play, Pause, Trash2, Edit2, ShieldAlert, WifiOff, Globe, LogOut, CheckCircle2, User,
  Calendar, Layers, Clock, Camera, FileText, Smartphone, Monitor, Search, Sparkles, ArrowLeft, Package, Coffee, MessageSquare, Bell, Settings,
  RotateCw, Lock, HelpCircle, Send, Pin, BarChart3, Sliders, Plus, Minus, Info, GripVertical, UserMinus, UserPlus, Download, Share2, CheckSquare, DoorClosed, Wine, Tag, Filter
} from 'lucide-react-native';
import { Language, HotelRoom, RoomStatus, CleanerProfile, MaintenanceRequest } from '../../types';
import { COLORS, FONTS } from '../../theme/tokens';

interface SupervisorScreensNativeProps {
  lang: Language;
  rooms: HotelRoom[];
  onUpdateRooms: (rooms: HotelRoom[]) => void;
  maintenanceRequests: MaintenanceRequest[];
  onUpdateMaintenanceRequests: (reqs: MaintenanceRequest[]) => void;
  cleanerProfile: CleanerProfile;
  onLogout: () => void;
  activeTab: 'SV_DASHBOARD' | 'SV_INSPECTION' | 'SV_MAINTENANCE' | 'SV_TEAM' | 'SV_PROFILE';
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
}

export const SupervisorScreensNative: React.FC<SupervisorScreensNativeProps> = ({
  lang,
  rooms,
  onUpdateRooms,
  maintenanceRequests,
  onUpdateMaintenanceRequests,
  cleanerProfile,
  onLogout,
  activeTab,
  onOpenChat,
  onOpenNotifications,
  onOpenSettings
}) => {
  const [svActiveSubscreen, setSvActiveSubscreen] = useState<
    | 'NONE'
    | 'SHIFT_REPORT'
    | 'STAFF_MANAGEMENT'
    | 'EMPLOYEE_CARD'
    | 'APP_CONFIG'
    | 'CHECKLIST_CONFIG'
    | 'MINIBAR_CONFIG'
  >('NONE');

  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'ALL' | 'CLEANERS' | 'SUPERVISORS' | 'TECHS'>('ALL');
  const [selectedStaffMember, setSelectedStaffMember] = useState<any>({
    id: 'cln-002',
    name: 'Маркус Броди',
    nameEn: 'Marcus Brody',
    initials: 'МБ',
    roleTitleRu: 'Клинер · 2 этаж',
    position: 'CLEANER',
    zone: '2 этаж, 201–218',
    phone: '+7 701 555 81 05',
    badgeId: 'SLV-8105',
    shiftStatus: 'ON_BREAK',
    shiftStart: '08:00',
    schedule: '2 через 2',
    personalNormMin: 25,
    permissions: {
      ownRooms: true,
      allRooms: false,
      inspection: false,
      maintenanceRequests: true,
      staffManagement: false,
      appSettings: false
    }
  });

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'CLEANER' | 'SUPERVISOR' | 'TECH'>('CLEANER');
  const [showFireConfirmModal, setShowFireConfirmModal] = useState(false);

  const [invitedStaffList, setInvitedStaffList] = useState([
    { id: 'inv-1', phone: '+7 701 555 20 14', role: 'Клинер', sentDate: '26 авг' }
  ]);

  const [supervisorStaffList, setSupervisorStaffList] = useState([
    {
      id: 'cln-001',
      name: 'Елена Вэнс',
      nameEn: 'Elena Vance',
      initials: 'ЕВ',
      roleTitleRu: 'Старший клинер · 3 этаж',
      position: 'SENIOR_CLEANER',
      zone: '3 этаж, 301–320',
      phone: '+7 701 555 12 34',
      badgeId: 'SLV-4011',
      shiftStatus: 'ON_SHIFT',
      shiftStart: '08:00',
      schedule: '2 через 2',
      personalNormMin: 22,
      permissions: { ownRooms: true, allRooms: true, inspection: false, maintenanceRequests: true, staffManagement: false, appSettings: false }
    },
    {
      id: 'cln-002',
      name: 'Маркус Броди',
      nameEn: 'Marcus Brody',
      initials: 'МБ',
      roleTitleRu: 'Клинер · 2 этаж',
      position: 'CLEANER',
      zone: '2 этаж, 201–218',
      phone: '+7 701 555 81 05',
      badgeId: 'SLV-8105',
      shiftStatus: 'ON_BREAK',
      shiftStart: '08:00',
      schedule: '2 через 2',
      personalNormMin: 25,
      permissions: { ownRooms: true, allRooms: false, inspection: false, maintenanceRequests: true, staffManagement: false, appSettings: false }
    },
    {
      id: 'cln-003',
      name: 'Айгуль Мукан',
      nameEn: 'Aigul Mukan',
      initials: 'АМ',
      roleTitleRu: 'Клинер · 4 этаж',
      position: 'CLEANER',
      zone: '4 этаж, 401–418',
      phone: '+7 701 555 90 22',
      badgeId: 'SLV-4033',
      shiftStatus: 'ON_SHIFT',
      shiftStart: '08:00',
      schedule: '5 через 2',
      personalNormMin: 20,
      permissions: { ownRooms: true, allRooms: false, inspection: false, maintenanceRequests: true, staffManagement: false, appSettings: false }
    }
  ]);

  const [deluxeChecklist, setDeluxeChecklist] = useState({
    name: 'Deluxe Suite',
    bedrooms: 2,
    bathrooms: 2,
    hasLivingRoom: true,
    hasKitchen: false,
    hasMinibar: true,
    normMinutes: 40,
    photoEachZone: true,
    bedroomTasks: ['Смена белья и наволочек', 'Пылесос ковров и влажная уборка', 'Протереть поверхности и зеркала'],
    bathroomTasks: ['Дезинфекция санузла', 'Замена полотенец и косметики']
  });

  const [minibarTab, setMinibarTab] = useState<'MINIBAR' | 'SUPPLIES' | 'TROLLEY'>('MINIBAR');
  const [minibarDrinks, setMinibarDrinks] = useState([
    { id: 'mb-1', name: 'Вода 0,5 л', qty: 4 },
    { id: 'mb-2', name: 'Сок яблочный', qty: 2 },
    { id: 'mb-3', name: 'Газированный напиток', qty: 2 }
  ]);

  const renderShiftReportScreen = () => (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSvActiveSubscreen('NONE')} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>{lang === 'RU' ? 'Отчёт по смене' : 'Shift Report'}</Text>
            <Text style={styles.screenSubtitle}>SH-4092 · 27 авг · с 08:00</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ИТОГИ СМЕНЫ' : 'SHIFT SUMMARY'}</Text>
          <View style={styles.card}>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>14 <Text style={styles.statSub}>/ 24</Text></Text>
                <Text style={styles.statLabel}>{lang === 'RU' ? 'сдано' : 'accepted'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>21 <Text style={styles.statSub}>мин</Text></Text>
                <Text style={styles.statLabel}>{lang === 'RU' ? 'в среднем' : 'avg time'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>92<Text style={styles.statSub}>%</Text></Text>
                <Text style={styles.statLabel}>{lang === 'RU' ? 'принято сразу' : 'first pass'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ПО СОТРУДНИКАМ' : 'BY HOUSEKEEPER'}</Text>
          <View style={[styles.card, { padding: 0 }]}>
            {supervisorStaffList.map((staff, idx) => (
              <TouchableOpacity
                key={staff.id}
                onPress={() => {
                  setSelectedStaffMember(staff);
                  setSvActiveSubscreen('EMPLOYEE_CARD');
                }}
                style={[styles.listItem, idx > 0 && styles.itemBorderTop]}
              >
                <View style={styles.avatarBubble}>
                  <Text style={styles.avatarText}>{staff.initials}</Text>
                </View>
                <View style={styles.flexOne}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemTitle}>{lang === 'RU' ? staff.name : staff.nameEn}</Text>
                    <Text style={styles.itemSubText}>{staff.id === 'cln-001' ? '8 из 12' : '5 из 10'}</Text>
                  </View>
                  <Text style={styles.itemSubtitle}>
                    {staff.personalNormMin} мин на номер · {staff.id === 'cln-002' ? <Text style={{ color: COLORS.error }}>1 отклонение</Text> : 'без отклонений'}
                  </Text>
                </View>
                <ChevronRight size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBarDouble}>
        <TouchableOpacity onPress={() => Alert.alert('Отчёт', 'Отправлен')} style={[styles.secondaryButton, { flex: 1 }]}>
          <Text style={styles.secondaryButtonText}>{lang === 'RU' ? 'Отправить руководителю' : 'Send'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('PDF', 'Выгружен')} style={[styles.primaryButton, { flex: 1 }]}>
          <Text style={styles.primaryButtonText}>{lang === 'RU' ? 'Выгрузить отчёт' : 'Export PDF'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStaffManagementScreen = () => (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSvActiveSubscreen('NONE')} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>{lang === 'RU' ? 'Персонал' : 'Staff'}</Text>
            <Text style={styles.screenSubtitle}>12 {lang === 'RU' ? 'сотрудников · 5 на смене' : 'staff · 5 on shift'}</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.textSecondary} />
          <TextInput
            placeholder={lang === 'RU' ? 'Поиск по имени или роли' : 'Search'}
            placeholderTextColor={COLORS.textSecondary}
            value={staffSearchQuery}
            onChangeText={setStaffSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>{lang === 'RU' ? 'СОТРУДНИКИ' : 'EMPLOYEES'}</Text>
          <View style={[styles.card, { padding: 0 }]}>
            {supervisorStaffList.map((staff, idx) => (
              <TouchableOpacity
                key={staff.id}
                onPress={() => {
                  setSelectedStaffMember(staff);
                  setSvActiveSubscreen('EMPLOYEE_CARD');
                }}
                style={[styles.listItem, idx > 0 && styles.itemBorderTop]}
              >
                <View style={styles.avatarBubble}>
                  <Text style={styles.avatarText}>{staff.initials}</Text>
                </View>
                <View style={styles.flexOne}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemTitle}>{lang === 'RU' ? staff.name : staff.nameEn}</Text>
                    <View style={[styles.badgePill, styles.badgeGreen]}>
                      <Text style={[styles.badgePillText, styles.badgeGreenText]}>{lang === 'RU' ? 'на смене' : 'on shift'}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemSubtitle}>{staff.roleTitleRu}</Text>
                </View>
                <ChevronRight size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBarSingle}>
        <TouchableOpacity onPress={() => setShowAddStaffModal(true)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{lang === 'RU' ? 'Добавить сотрудника' : 'Add Employee'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmployeeCardScreen = () => {
    const s = selectedStaffMember;
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setSvActiveSubscreen('STAFF_MANAGEMENT')} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.dark} />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenTitle}>{lang === 'RU' ? s.name : s.nameEn}</Text>
              <Text style={styles.screenSubtitle}>{s.badgeId} · на смене с {s.shiftStart}</Text>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ДОЛЖНОСТЬ' : 'POSITION'}</Text>
            <View style={styles.card}>
              <View style={styles.keyValRow}>
                <Text style={styles.keyText}>{lang === 'RU' ? 'Зона ответственности' : 'Zone'}</Text>
                <Text style={styles.valText}>{s.zone}</Text>
              </View>
              <View style={styles.keyValRow}>
                <Text style={styles.keyText}>{lang === 'RU' ? 'Телефон' : 'Phone'}</Text>
                <Text style={styles.valText}>{s.phone}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ДОСТУП В ПРИЛОЖЕНИИ' : 'PERMISSIONS'}</Text>
            <View style={[styles.card, { padding: 0 }]}>
              {[
                { key: 'ownRooms', title: 'Свои номера', sub: 'список задач и чек-листы' },
                { key: 'allRooms', title: 'Все номера отеля', sub: 'мониторинг чужих задач' },
                { key: 'inspection', title: 'Инспекция и приёмка', sub: 'принимать и отклонять номера' }
              ].map((perm, idx) => (
                <View key={perm.key} style={[styles.toggleRow, idx > 0 && styles.itemBorderTop]}>
                  <View style={styles.flexOne}>
                    <Text style={styles.toggleTitle}>{perm.title}</Text>
                    <Text style={styles.toggleSub}>{perm.sub}</Text>
                  </View>
                  <Switch
                    value={s.permissions[perm.key]}
                    onValueChange={(val) => setSelectedStaffMember((p: any) => ({ ...p, permissions: { ...p.permissions, [perm.key]: val } }))}
                    trackColor={{ false: COLORS.border, true: COLORS.success }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBarDouble}>
          <TouchableOpacity onPress={() => onOpenChat?.()} style={[styles.secondaryButton, { flex: 1 }]}>
            <Text style={styles.secondaryButtonText}>{lang === 'RU' ? 'Написать' : 'Message'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Сохранено', 'Права сохранены');
              setSvActiveSubscreen('STAFF_MANAGEMENT');
            }}
            style={[styles.primaryButton, { flex: 1 }]}
          >
            <Text style={styles.primaryButtonText}>{lang === 'RU' ? 'Сохранить' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAppConfigScreen = () => (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSvActiveSubscreen('NONE')} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>{lang === 'RU' ? 'Настроить приложение' : 'App Settings'}</Text>
            <Text style={styles.screenSubtitle}>{lang === 'RU' ? 'Конструктор объекта и чек-листов' : 'Property & Checklists'}</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>{lang === 'RU' ? 'НОМЕРНОЙ ФОНД' : 'ROOMS'}</Text>
          <View style={[styles.card, { padding: 0 }]}>
            <TouchableOpacity onPress={() => setSvActiveSubscreen('CHECKLIST_CONFIG')} style={styles.listItem}>
              <View style={styles.flexOne}>
                <Text style={styles.itemTitle}>{lang === 'RU' ? 'Чек-листы по типам номеров' : 'Checklists'}</Text>
                <Text style={styles.itemSubtitle}>Standard, Twin, Junior, Deluxe Suite</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSvActiveSubscreen('MINIBAR_CONFIG')} style={[styles.listItem, styles.itemBorderTop]}>
              <View style={styles.flexOne}>
                <Text style={styles.itemTitle}>{lang === 'RU' ? 'Мини-бар и расходники' : 'Minibar & Inventory'}</Text>
                <Text style={styles.itemSubtitle}>12 позиций бара · 18 расходников</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderChecklistConfigScreen = () => (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSvActiveSubscreen('APP_CONFIG')} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>{deluxeChecklist.name}</Text>
            <Text style={styles.screenSubtitle}>{lang === 'RU' ? 'Шаблон уборки · применён к 6 номерам' : 'Template applied to 6 rooms'}</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>{lang === 'RU' ? 'СПАЛЬНЯ' : 'BEDROOM'}</Text>
          <View style={[styles.card, { padding: 0 }]}>
            {deluxeChecklist.bedroomTasks.map((t, idx) => (
              <View key={idx} style={[styles.listItem, idx > 0 && styles.itemBorderTop]}>
                <Text style={[styles.itemTitle, { flex: 1 }]}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBarSingle}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Сохранено', 'Шаблон сохранён');
            setSvActiveSubscreen('APP_CONFIG');
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>{lang === 'RU' ? 'Сохранить шаблон' : 'Save Template'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMinibarConfigScreen = () => (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSvActiveSubscreen('APP_CONFIG')} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>{lang === 'RU' ? 'Наполнение' : 'Inventory'}</Text>
            <Text style={styles.screenSubtitle}>{lang === 'RU' ? 'Позиции и нормативы' : 'Items'}</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>{lang === 'RU' ? 'НАПИТКИ' : 'DRINKS'}</Text>
          <View style={[styles.card, { padding: 0 }]}>
            {minibarDrinks.map((item, idx) => (
              <View key={item.id} style={[styles.listItem, idx > 0 && styles.itemBorderTop]}>
                <Text style={[styles.itemTitle, { flex: 1 }]}>{item.name}</Text>
                <Text style={styles.itemSubText}>{item.qty} шт</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBarSingle}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Сохранено', 'Нормативы сохранены');
            setSvActiveSubscreen('APP_CONFIG');
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>{lang === 'RU' ? 'Сохранить' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileTab = () => {
    if (svActiveSubscreen === 'SHIFT_REPORT') return renderShiftReportScreen();
    if (svActiveSubscreen === 'STAFF_MANAGEMENT') return renderStaffManagementScreen();
    if (svActiveSubscreen === 'EMPLOYEE_CARD') return renderEmployeeCardScreen();
    if (svActiveSubscreen === 'APP_CONFIG') return renderAppConfigScreen();
    if (svActiveSubscreen === 'CHECKLIST_CONFIG') return renderChecklistConfigScreen();
    if (svActiveSubscreen === 'MINIBAR_CONFIG') return renderMinibarConfigScreen();

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Text style={styles.screenTitle}>{lang === 'RU' ? 'Профиль' : 'Profile'}</Text>
            <View style={styles.topIconsRow}>
              <TouchableOpacity onPress={() => onOpenChat?.()} style={styles.topIconBtn}>
                <MessageSquare size={18} color={COLORS.dark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onOpenNotifications?.()} style={styles.topIconBtn}>
                <Bell size={18} color={COLORS.dark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onOpenSettings?.()} style={styles.topIconBtn}>
                <Settings size={18} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>СК</Text>
            </View>
            <View style={styles.flexOne}>
              <Text style={styles.userName}>{lang === 'RU' ? 'Светлана Ким' : 'Svetlana Kim'}</Text>
              <Text style={styles.userRole}>{lang === 'RU' ? 'Супервайзер · все этажи, VIP и контроль' : 'Supervisor'}</Text>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}</Text>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.shiftBadgeId}>SH-4092</Text>
                <Text style={styles.shiftTime}>27 авг · с 08:00</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>14 <Text style={styles.statSub}>/ 24</Text></Text>
                  <Text style={styles.statLabel}>{lang === 'RU' ? 'номеров сдано' : 'rooms checked'}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>0</Text>
                  <Text style={styles.statLabel}>{lang === 'RU' ? 'ждут проверки' : 'pending audit'}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>4</Text>
                  <Text style={styles.statLabel}>{lang === 'RU' ? 'клинеров' : 'housekeepers'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>{lang === 'RU' ? 'РАБОТА' : 'JOB CONTROLS'}</Text>
            <View style={[styles.card, { padding: 0 }]}>
              <TouchableOpacity onPress={() => setSvActiveSubscreen('SHIFT_REPORT')} style={styles.listItem}>
                <BarChart3 size={18} color={COLORS.textSecondary} />
                <Text style={[styles.itemTitle, { flex: 1, marginLeft: 12 }]}>{lang === 'RU' ? 'Отчёты по смене' : 'Shift reports'}</Text>
                <ChevronRight size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Alert.alert('Перераспределение', 'Открыто перераспределение задач')} style={[styles.listItem, styles.itemBorderTop]}>
                <Layers size={18} color={COLORS.textSecondary} />
                <Text style={[styles.itemTitle, { flex: 1, marginLeft: 12 }]}>{lang === 'RU' ? 'Перераспределение задач' : 'Reallocate workload'}</Text>
                <ChevronRight size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSvActiveSubscreen('STAFF_MANAGEMENT')} style={[styles.listItem, styles.itemBorderTop]}>
                <Users size={18} color={COLORS.textSecondary} />
                <Text style={[styles.itemTitle, { flex: 1, marginLeft: 12 }]}>{lang === 'RU' ? 'Управление персоналом' : 'Staff management'}</Text>
                <ChevronRight size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSvActiveSubscreen('APP_CONFIG')} style={[styles.listItem, styles.itemBorderTop]}>
                <Sliders size={18} color={COLORS.textSecondary} />
                <Text style={[styles.itemTitle, { flex: 1, marginLeft: 12 }]}>{lang === 'RU' ? 'Настроить приложение' : 'App configuration'}</Text>
                <ChevronRight size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sectionBlock, { marginBottom: 30 }]}>
            <TouchableOpacity onPress={onLogout} style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <LogOut size={18} color={COLORS.textSecondary} />
              <Text style={{ fontFamily: FONTS.jost500, fontSize: 14, color: COLORS.textPrimary }}>{lang === 'RU' ? 'Выйти из аккаунта' : 'Log out'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  if (activeTab === 'SV_PROFILE') {
    return renderProfileTab();
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>
            {activeTab === 'SV_DASHBOARD' ? (lang === 'RU' ? 'Обзор' : 'Dashboard')
            : activeTab === 'SV_INSPECTION' ? (lang === 'RU' ? 'Инспекция' : 'Inspection')
            : activeTab === 'SV_MAINTENANCE' ? (lang === 'RU' ? 'Техслужба' : 'Maintenance')
            : (lang === 'RU' ? 'Команда' : 'Team')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.itemTitle}>{activeTab === 'SV_DASHBOARD' ? '14 номеров сдано из 24' : 'Активный режим супервайзера'}</Text>
          <Text style={styles.itemSubtitle}>{lang === 'RU' ? 'Все данные синхронизированы в реальном времени' : 'All live data synchronized'}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flex: 1, padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  topIconsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topIconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  screenTitle: { fontFamily: FONTS.spectral500, fontSize: 22, color: COLORS.dark },
  screenSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 12 },
  userAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FAF6F0', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontFamily: FONTS.jost500, fontSize: 16, color: COLORS.dark },
  userName: { fontFamily: FONTS.spectral500, fontSize: 19, color: COLORS.dark },
  userRole: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionBlock: { marginTop: 16 },
  sectionHeader: { fontFamily: FONTS.jost500, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: 8 },
  card: { backgroundColor: COLORS.backgroundCard, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shiftBadgeId: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark },
  shiftTime: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statCol: { alignItems: 'center', flex: 1 },
  statNumber: { fontFamily: FONTS.jost500, fontSize: 17, color: COLORS.dark },
  statSub: { fontFamily: FONTS.jost400, fontSize: 11, color: COLORS.textSecondary },
  statLabel: { fontFamily: FONTS.jost400, fontSize: 10, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.borderLight },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  itemBorderTop: { borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  itemTitle: { fontFamily: FONTS.jost500, fontSize: 14, color: COLORS.dark },
  itemSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  itemSubText: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary },
  flexOne: { flex: 1 },
  avatarBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E0D8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontFamily: FONTS.jost500, fontSize: 12, color: COLORS.textSecondary },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 10, marginVertical: 10 },
  searchInput: { flex: 1, fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.dark, padding: 0 },
  badgePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePillText: { fontFamily: FONTS.jost500, fontSize: 10 },
  badgeGreen: { backgroundColor: COLORS.successLight },
  badgeGreenText: { color: COLORS.successText },
  keyValRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  keyText: { fontFamily: FONTS.jost400, fontSize: 13, color: COLORS.textSecondary },
  valText: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  toggleTitle: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark },
  toggleSub: { fontFamily: FONTS.jost400, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  bottomBarSingle: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
  bottomBarDouble: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: FONTS.jost500, fontSize: 13, color: '#FFFFFF' },
  secondaryButton: { backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark },
});
