import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  RotateCcw,
  LogOut,
  Check,
  Layers,
  Tag,
  Package,
  Database,
  Building2,
  Shield,
  TrendingUp,
  QrCode,
  ClipboardList,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  Bot,
  Tractor,
  FlaskConical,
  Sprout,
  Filter,
  Store,
  ExternalLink,
  DollarSign,
  User,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Product, Currency, Category, CompanyProfile, AdminAuthSettings, SystemBackupData, BankPaymentAccount, Order, ProductGroupId } from '../types';
import { ProductBagIllustration } from '../components/ProductBagIllustration';
import { AdminProductForm } from './AdminProductForm';
import { AdminCategoryManager } from '../components/AdminCategoryManager';
import { AdminCompanySettings } from '../components/AdminCompanySettings';
import { AdminSecuritySettings } from '../components/AdminSecuritySettings';
import { AdminBackupManager } from '../components/AdminBackupManager';
import { AdminBankQrManager } from '../components/AdminBankQrManager';
import { AdminAnalyticsManager } from '../components/AdminAnalyticsManager';
import { AdminOrdersManager } from '../components/AdminOrdersManager';
import { AdminTelegramBotManager } from '../components/AdminTelegramBotManager';
import { INITIAL_CATEGORIES, COMPANY_INFO, INITIAL_BANK_ACCOUNTS, PRODUCT_GROUPS } from '../data/initialProducts';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../lib/firebase';

interface AdminDashboardProps {
  products: Product[];
  categories?: Category[];
  companyProfile?: CompanyProfile;
  authSettings?: AdminAuthSettings;
  bankAccounts?: BankPaymentAccount[];
  orders?: Order[];
  isFirebaseSynced?: boolean;
  firebaseError?: string | null;
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onReorderProducts: (products: Product[]) => void;
  onAddCategory?: (category: Category) => void;
  onUpdateCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onReorderCategories?: (categories: Category[]) => void;
  onSaveCompanyProfile?: (profile: CompanyProfile) => void;
  onSaveAuthSettings?: (settings: AdminAuthSettings) => Promise<void> | void;
  onSaveBankAccounts?: (accounts: BankPaymentAccount[]) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void;
  onRestoreBackup?: (backupData: SystemBackupData) => Promise<void> | void;
  onResetFactory: () => void;
  onLogout: () => void;
  currency: Currency;
  onViewStore?: () => void;
  onCurrencyChange?: (c: Currency) => void;
}

type AdminNavSection =
  | 'analytics'
  | 'orders'
  | 'products'
  | 'categories'
  | 'bank_qr'
  | 'telegram'
  | 'company'
  | 'backup'
  | 'security';

interface NavGroup {
  groupNameKh: string;
  groupNameEn: string;
  items: {
    id: AdminNavSection;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  categories = INITIAL_CATEGORIES,
  companyProfile = COMPANY_INFO,
  authSettings = { email: DEFAULT_ADMIN_EMAIL, isEmailVerified: true, password: DEFAULT_ADMIN_PASSWORD },
  bankAccounts = INITIAL_BANK_ACCOUNTS,
  orders = [],
  isFirebaseSynced = true,
  firebaseError,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onReorderProducts,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
  onSaveCompanyProfile,
  onSaveAuthSettings,
  onSaveBankAccounts,
  onUpdateOrderStatus,
  onRestoreBackup,
  onResetFactory,
  onLogout,
  currency,
  onViewStore,
  onCurrencyChange,
}) => {
  const [activeSection, setActiveSection] = useState<AdminNavSection>('analytics');
  const [viewState, setViewState] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ProductGroupId>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [quickPriceEditId, setQuickPriceEditId] = useState<string | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // Pending orders counter for badge
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending_payment').length;

  // Filtered categories according to selected main group
  const availableCategories = useMemo(() => {
    if (selectedGroup === 'all') return categories;
    return categories.filter((c) => (c.groupId || 'chemical_fertilizer') === selectedGroup);
  }, [categories, selectedGroup]);

  // Filter products by search, main group, and sub-category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        p.name.toLowerCase().includes(q) ||
        p.nameKh.toLowerCase().includes(q) ||
        p.npk.toLowerCase().includes(q) ||
        p.categoryKh.toLowerCase().includes(q) ||
        (p.nicknameKh && p.nicknameKh.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      // Group match (check product's groupId or look up its category's groupId)
      if (selectedGroup !== 'all') {
        const prodCat = categories.find((c) => c.id === p.category || c.nameKh === p.categoryKh);
        const prodGroupId = p.groupId || prodCat?.groupId || 'chemical_fertilizer';
        if (prodGroupId !== selectedGroup) return false;
      }

      // Sub-category match
      if (selectedCategoryFilter !== 'all') {
        if (p.category !== selectedCategoryFilter && p.categoryKh !== selectedCategoryFilter) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchQuery, selectedGroup, selectedCategoryFilter, categories]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setViewState('edit');
  };

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setViewState('create');
  };

  const handleSaveForm = (product: Product) => {
    if (viewState === 'create') {
      onAddProduct(product);
    } else {
      onUpdateProduct(product);
    }
    setViewState('list');
  };

  const handleQuickPriceSave = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (p) {
      const num = parseFloat(quickPriceValue);
      if (!isNaN(num) && num > 0) {
        onUpdateProduct({ ...p, price: num });
      }
    }
    setQuickPriceEditId(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...products];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newProducts.length) {
      const temp = newProducts[index];
      newProducts[index] = newProducts[targetIndex];
      newProducts[targetIndex] = temp;
      // Re-assign order indices
      newProducts.forEach((p, idx) => {
        p.order = idx + 1;
      });
      onReorderProducts(newProducts);
    }
  };

  const handleExportJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      categories,
      products,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tivhuor_catalog_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.products && Array.isArray(parsed.products)) {
            parsed.products.forEach((p: Product) => onAddProduct(p));
          }
          alert('បានបញ្ចូលទិន្នន័យពីឯកសារ Backup ដោយជោគជ័យ!');
        } catch (err) {
          alert('ឯកសារ JSON មិនត្រឹមត្រូវ សូមពិនិត្យឡើងវិញ');
        }
      };
      reader.readAsText(file);
    }
  };

  // Helper function for Product Group Icons
  const getGroupIcon = (id: string) => {
    switch (id) {
      case 'machinery':
        return <Tractor className="w-3.5 h-3.5" />;
      case 'chemical_fertilizer':
        return <FlaskConical className="w-3.5 h-3.5" />;
      case 'organic_fertilizer':
        return <Sprout className="w-3.5 h-3.5" />;
      case 'raw_material':
        return <Layers className="w-3.5 h-3.5" />;
      default:
        return <Package className="w-3.5 h-3.5" />;
    }
  };

  // Grouped Navigation Items (Normal Dashboard Structure)
  const navGroups: NavGroup[] = [
    {
      groupNameKh: 'ទិដ្ឋភាពទូទៅ & ការលក់',
      groupNameEn: 'Overview & Sales',
      items: [
        {
          id: 'analytics',
          label: 'វិភាគចំណូល & របាយការណ៍',
          sublabel: 'Sales & Analytics',
          icon: TrendingUp,
          badge: `${orders.length}`,
          badgeColor: 'bg-blue-100 text-blue-800',
        },
        {
          id: 'orders',
          label: 'ការកុម្ម៉ង់ & វិក្កយបត្រ',
          sublabel: 'Orders & Invoices',
          icon: ClipboardList,
          badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} ថ្មី` : `${orders.length}`,
          badgeColor: pendingOrdersCount > 0 ? 'bg-amber-500 text-white font-bold animate-pulse' : 'bg-slate-100 text-slate-700',
        },
      ],
    },
    {
      groupNameKh: 'គ្រប់គ្រងទំនិញ & ទូទាត់',
      groupNameEn: 'Catalog & Payments',
      items: [
        {
          id: 'products',
          label: 'មុខទំនិញកសិកម្ម',
          sublabel: 'Products & Inventory',
          icon: Package,
          badge: `${products.length}`,
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'categories',
          label: 'ប្រភេទ & ក្រុមទំនិញ',
          sublabel: 'Categories & Groups',
          icon: Tag,
          badge: `${categories.length}`,
          badgeColor: 'bg-slate-100 text-slate-700',
        },
      ],
    },
    {
      groupNameKh: 'ប្រព័ន្ធ & ការកំណត់',
      groupNameEn: 'System & Settings',
      items: [
        {
          id: 'telegram',
          label: 'Telegram Bot API',
          sublabel: 'Bot Alerts & Notifications',
          icon: Bot,
          badge: companyProfile?.telegramConfig?.isEnabled && companyProfile?.telegramConfig?.botToken ? 'Bot Live' : 'Setup',
          badgeColor: companyProfile?.telegramConfig?.isEnabled && companyProfile?.telegramConfig?.botToken ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
        },
        {
          id: 'company',
          label: 'ព័ត៌មានក្រុមហ៊ុន & ឡូហ្គោ',
          sublabel: 'Company Profile & Branding',
          icon: Building2,
        },
        {
          id: 'backup',
          label: 'បម្រុងទុកទិន្នន័យ (Backup)',
          sublabel: 'Backup & Restore Data',
          icon: Database,
        },
        {
          id: 'security',
          label: 'សុវត្ថិភាព & ពាក្យសម្ងាត់',
          sublabel: 'Admin Auth & Password',
          icon: Shield,
        },
      ],
    },
  ];

  // Flat nav items list for quick lookup
  const flatNavItems = navGroups.flatMap((g) => g.items);
  const currentNav = flatNavItems.find((item) => item.id === activeSection) || flatNavItems[0];
  const CurrentIcon = currentNav.icon;

  return (
    <div className="min-h-screen bg-slate-100/80 flex font-['Battambang'] text-slate-800 antialiased">
      {/* ========================================================================= */}
      {/* MOBILE SIDEBAR DRAWER (Small screens < lg)                                */}
      {/* ========================================================================= */}
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Off-Canvas Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-gradient-to-br from-[#1E5FA8] to-[#124278] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {companyProfile.logoUrl ? (
                <img
                  src={companyProfile.logoUrl}
                  alt={companyProfile.brandName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-black text-sm text-white">
                  {companyProfile.logoText || 'TH'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate leading-snug">
                {companyProfile.nameKh || companyProfile.brandName}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white/20 text-white rounded">
                  Admin Portal
                </span>
                <span className="text-[10px] text-blue-100 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseSynced ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {isFirebaseSynced ? 'Cloud Live' : 'Local'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="បិទមឺនុយ (Close Menu)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation List with Groups */}
        <div className="p-3 space-y-4 overflow-y-auto flex-1 font-['Battambang']">
          {navGroups.map((group, grpIdx) => (
            <div key={grpIdx} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.groupNameKh}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setViewState('list');
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-[#1E5FA8] text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs truncate">{item.label}</div>
                        <div
                          className={`text-[10px] truncate ${
                            isActive ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 ${
                          isActive ? 'bg-white text-[#1E5FA8]' : item.badgeColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Mobile Drawer Footer Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80 space-y-2 shrink-0">
          {onViewStore && (
            <button
              onClick={() => {
                setIsMobileSidebarOpen(false);
                onViewStore();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#1E5FA8] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>មើលហាងទំនិញ (View Customer Store)</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsMobileSidebarOpen(false);
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>ចាកចេញពីគណនី (Logout)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP NORMAL DOCKED SIDEBAR (Screens >= lg)                             */}
      {/* ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-slate-200/90 sticky top-0 h-screen z-30 transition-all duration-300 ${
          isDesktopCollapsed ? 'w-20' : 'w-64 xl:w-72'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-[#1E5FA8] to-[#124278] text-white shrink-0">
          <div className="flex items-center justify-between gap-2">
            {!isDesktopCollapsed ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {companyProfile.logoUrl ? (
                    <img
                      src={companyProfile.logoUrl}
                      alt={companyProfile.brandName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-black text-sm text-white">
                      {companyProfile.logoText || 'TH'}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate leading-snug">
                    {companyProfile.nameKh || companyProfile.brandName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white/20 text-white rounded">
                      Admin Portal
                    </span>
                    <span className="text-[10px] text-blue-100 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseSynced ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {isFirebaseSynced ? 'Cloud' : 'Local'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {companyProfile.logoUrl ? (
                    <img
                      src={companyProfile.logoUrl}
                      alt={companyProfile.brandName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-black text-sm text-white">
                      {companyProfile.logoText || 'TH'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            {!isDesktopCollapsed && (
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed(true)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                title="បង្រួមមឺនុយចំហៀង (Collapse Sidebar)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* If collapsed, show small expand button */}
        {isDesktopCollapsed && (
          <div className="p-2 border-b border-slate-100 flex justify-center bg-slate-50">
            <button
              type="button"
              onClick={() => setIsDesktopCollapsed(false)}
              className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-600 hover:text-[#1E5FA8] border border-slate-200 transition-colors cursor-pointer"
              title="ពង្រីកមឺនុយចំហៀង (Expand Sidebar)"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 font-['Battambang']">
          {navGroups.map((group, grpIdx) => (
            <div key={grpIdx} className="space-y-1">
              {!isDesktopCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.groupNameKh}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                if (isDesktopCollapsed) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setViewState('list');
                      }}
                      className={`w-full h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                        isActive
                          ? 'bg-[#1E5FA8] text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      title={`${item.label} (${item.sublabel})`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.badge && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setViewState('list');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-[#1E5FA8] text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs truncate">{item.label}</div>
                        <div
                          className={`text-[10px] truncate ${
                            isActive ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 ${
                          isActive ? 'bg-white text-[#1E5FA8]' : item.badgeColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer with Quick Store View & Admin Profile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2 shrink-0">
          {!isDesktopCollapsed ? (
            <>
              {onViewStore && (
                <button
                  onClick={onViewStore}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#1E5FA8] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer font-['Kantumruy_Pro']"
                  title="ត្រឡប់ទៅមើលទំព័រហាងសម្រាប់អតិថិជន"
                >
                  <Store className="w-4 h-4" />
                  <span>មើលហាង (View Store)</span>
                </button>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 truncate">
                      {authSettings.email.split('@')[0]}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      Administrator
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                  title="ចាកចេញពីគណនី (Logout)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {onViewStore && (
                <button
                  onClick={onViewStore}
                  className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E5FA8] flex items-center justify-center transition-colors cursor-pointer"
                  title="មើលហាងទំនិញ (View Customer Store)"
                >
                  <Store className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onLogout}
                className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                title="ចាកចេញពីគណនី (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN DASHBOARD CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-slate-50/70 overflow-x-hidden">
        {/* Professional Dashboard Sticky Topbar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
          {/* Left: Mobile Drawer Button, Desktop Collapse Button, and Current Section Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs relative"
              title="បើកមឺនុយបញ្ជា (Open Menu)"
            >
              <Menu className="w-5 h-5" />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Desktop Quick Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              className="hidden lg:flex p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              title={isDesktopCollapsed ? 'ពង្រីកមឺនុយចំហៀង (Expand Sidebar)' : 'បង្រួមមឺនុយចំហៀង (Collapse Sidebar)'}
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Current Section Icon and Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E5FA8] flex items-center justify-center font-bold shrink-0 shadow-2xs border border-blue-100">
                <CurrentIcon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-['Kantumruy_Pro'] leading-none">
                  <span>ផ្ទាំងគ្រប់គ្រង</span>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-slate-600 font-bold truncate">{currentNav.sublabel}</span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight mt-0.5 font-['Battambang']">
                  {currentNav.label}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Topbar Actions: Live Status, Currency, View Store, and Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Real-time Cloud Sync Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-['Kantumruy_Pro'] border shadow-2xs ${
                isFirebaseSynced
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isFirebaseSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{isFirebaseSynced ? 'Cloud Live' : 'Local Sync'}</span>
            </div>

            {/* Pending Orders Notification Pill (if any) */}
            {pendingOrdersCount > 0 && (
              <button
                onClick={() => setActiveSection('orders')}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold transition-all shadow-xs animate-pulse cursor-pointer font-['Kantumruy_Pro']"
                title="មានការកុម្ម៉ង់ថ្មីរង់ចាំការបញ្ជាក់"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>{pendingOrdersCount} កុម្ម៉ង់ថ្មី</span>
              </button>
            )}

            {/* Currency Switcher (if handler provided) */}
            {onCurrencyChange && (
              <button
                onClick={() => onCurrencyChange(currency === 'USD' ? 'KHR' : 'USD')}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1 font-['Kantumruy_Pro']"
                title="ផ្លាស់ប្តូររូបិយប័ណ្ណបង្ហាញ"
              >
                <DollarSign className="w-3.5 h-3.5 text-[#1E5FA8]" />
                <span>{currency === 'USD' ? '$ USD' : '៛ KHR'}</span>
              </button>
            )}

            {/* View Store Quick Button */}
            {onViewStore && (
              <button
                onClick={onViewStore}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1E5FA8] border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs font-['Kantumruy_Pro']"
                title="ត្រឡប់ទៅមើលទំព័រហាងសម្រាប់អតិថិជន"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">មើលហាង</span>
              </button>
            )}

            {/* Quick Action in Products section */}
            {activeSection === 'products' && viewState === 'list' && (
              <button
                onClick={handleCreateNew}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs font-['Battambang']"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">+ បង្កើតមុខទំនិញថ្មី</span>
                <span className="sm:hidden">ថ្មី</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-1.5 bg-white hover:bg-red-50 hover:text-red-600 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="ចាកចេញពី Admin (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ចាកចេញ</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* If Creating / Editing a Product, render the form INSIDE the dashboard body with a back button */}
          {activeSection === 'products' && (viewState === 'create' || viewState === 'edit') ? (
            <div className="space-y-4">
              <button
                onClick={() => setViewState('list')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-[#1E5FA8] bg-white rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer font-['Kantumruy_Pro']"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ត្រឡប់ទៅបញ្ជីមុខទំនិញ (Back to Products List)</span>
              </button>
              <AdminProductForm
                initialProduct={selectedProduct}
                categories={categories}
                onSave={handleSaveForm}
                onCancel={() => setViewState('list')}
                onQuickAddCategory={onAddCategory}
              />
            </div>
          ) : activeSection === 'analytics' ? (
            /* Daily Sales & Orders Analytics Dashboard */
            <AdminAnalyticsManager
              orders={orders}
              products={products}
              companyProfile={companyProfile}
              onUpdateOrderStatus={onUpdateOrderStatus}
              currency={currency}
            />
          ) : activeSection === 'orders' ? (
            /* Manager Order Approvals & Invoice Receipts Manager */
            <AdminOrdersManager
              orders={orders}
              products={products}
              companyProfile={companyProfile}
              onUpdateOrderStatus={onUpdateOrderStatus}
              currency={currency}
            />
          ) : activeSection === 'bank_qr' ? (
            /* Bank QR & Image Upload Manager */
            <AdminBankQrManager
              bankAccounts={bankAccounts}
              onSaveBankAccounts={onSaveBankAccounts || (() => {})}
              isFirebaseSynced={isFirebaseSynced}
            />
          ) : activeSection === 'security' ? (
            /* Security & Admin Auth Settings */
            <AdminSecuritySettings
              authSettings={authSettings}
              onSaveAuthSettings={onSaveAuthSettings || (() => {})}
              isFirebaseSynced={isFirebaseSynced}
            />
          ) : activeSection === 'backup' ? (
            /* Backup & Restore Manager */
            <AdminBackupManager
              products={products}
              categories={categories}
              companyProfile={companyProfile}
              onRestoreBackup={onRestoreBackup || (() => {})}
              onResetFactory={onResetFactory}
              isFirebaseSynced={isFirebaseSynced}
            />
          ) : activeSection === 'telegram' ? (
            /* Dedicated Telegram Bot API Token Manager */
            <AdminTelegramBotManager
              companyProfile={companyProfile}
              onSaveCompanyProfile={onSaveCompanyProfile || (() => {})}
              isFirebaseSynced={isFirebaseSynced}
            />
          ) : activeSection === 'company' ? (
            /* Company Profile & Logo */
            <AdminCompanySettings
              companyProfile={companyProfile}
              onSaveCompanyProfile={onSaveCompanyProfile || (() => {})}
              isFirebaseSynced={isFirebaseSynced}
            />
          ) : activeSection === 'categories' ? (
            /* Categories Manager */
            <AdminCategoryManager
              categories={categories}
              products={products}
              onAddCategory={onAddCategory || (() => {})}
              onUpdateCategory={onUpdateCategory || (() => {})}
              onDeleteCategory={onDeleteCategory || (() => {})}
              onReorderCategories={onReorderCategories || (() => {})}
            />
          ) : (
            /* Products Section */
          <div className="space-y-4 font-['Battambang']">
            {/* Product Group Filter Chips (មុខទំនិញ) */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Filter className="w-4 h-4 text-[#1E5FA8]" />
                  <span>ជ្រើសរើសមុខទំនិញធំ (Main Product Group):</span>
                </div>
                <span className="text-[11px] text-slate-400 font-['Kantumruy_Pro']">
                  បង្ហាញ {filteredProducts.length} ក្នុងចំណោម {products.length} មុខ
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedGroup('all');
                    setSelectedCategoryFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedGroup === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>មុខទំនិញទាំងអស់ ({products.length})</span>
                </button>

                {PRODUCT_GROUPS.map((grp) => {
                  const groupCount = products.filter((p) => {
                    const prodCat = categories.find((c) => c.id === p.category || c.nameKh === p.categoryKh);
                    const gId = p.groupId || prodCat?.groupId || 'chemical_fertilizer';
                    return gId === grp.id;
                  }).length;

                  return (
                    <button
                      key={grp.id}
                      onClick={() => {
                        setSelectedGroup(grp.id);
                        setSelectedCategoryFilter('all');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedGroup === grp.id
                          ? 'bg-[#1E5FA8] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {getGroupIcon(grp.id)}
                      <span>{grp.nameKh} ({groupCount})</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-category Filter (ប្រភេទរង) */}
              {availableCategories.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">
                    ប្រភេទរង ({availableCategories.length}):
                  </span>
                  <button
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      selectedCategoryFilter === 'all'
                        ? 'bg-blue-100 text-blue-900 font-black'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    ទាំងអស់
                  </button>
                  {availableCategories.map((c) => {
                    const catCount = products.filter((p) => p.category === c.id || p.categoryKh === c.nameKh).length;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategoryFilter(c.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          selectedCategoryFilter === c.id
                            ? 'bg-blue-600 text-white font-black shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                        }`}
                      >
                        {c.nameKh} <span className="opacity-75">({catCount})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter and Backup Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ស្វែងរកតាមឈ្មោះទំនិញ, រូបមន្ត, ឬប្រភេទ..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1E5FA8] rounded-xl text-xs outline-none font-['Kantumruy_Pro']"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 font-['Kantumruy_Pro']">
                {/* Quick Add Product Button */}
                <button
                  onClick={handleCreateNew}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload/បន្ថែមទំនិញ</span>
                </button>

                {/* Export JSON */}
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="ទាញយកទិន្នន័យជាឯកសារ JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Backup</span>
                </button>

                {/* Import JSON */}
                <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Backup</span>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>

                {/* Reset to Factory Default */}
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'តើអ្នកប្រាកដជាចង់កំណត់ទិន្នន័យទាំងអស់ត្រឡប់ទៅជាទិន្នន័យដើមរបស់ក្រុមហ៊ុន ទីវ ហៃ វិញទេ?'
                      )
                    ) {
                      onResetFactory();
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="កំណត់ឡើងវិញនូវមុខទំនិញ និងប្រភេទដើម"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reset Factory</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5 text-center w-12">លំដាប់</th>
                      <th className="p-3.5 text-center w-16">រូបរាង</th>
                      <th className="p-3.5">ឈ្មោះទំនិញ & NPK</th>
                      <th className="p-3.5">ប្រភេទ</th>
                      <th className="p-3.5 text-center">ស្តុកទំនិញ</th>
                      <th className="p-3.5 text-right">តម្លៃលក់រាយ ($)</th>
                      <th className="p-3.5 text-center">ស្ថានភាព</th>
                      <th className="p-3.5 text-center">តម្រៀប</th>
                      <th className="p-3.5 text-center">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-['Kantumruy_Pro']">
                    {filteredProducts.map((product, index) => {
                      const isQuickEditing = quickPriceEditId === product.id;
                      const isDeleting = deleteConfirmId === product.id;
                      const isOverseas = product.stockStatus === 'overseas_stock';
                      const stockQty = product.stockQty ?? 100;
                      const stockUnit = product.stockUnit || (product.groupId === 'machinery' ? 'គ្រឿង' : 'បាវ');
                      const sizeOptionsCount = product.availableSizes?.length || 0;

                      return (
                        <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Index */}
                          <td className="p-3.5 text-center font-mono font-bold text-slate-400">
                            {index + 1}
                          </td>

                          {/* Thumbnail */}
                          <td className="p-2 text-center">
                            <div className="w-10 h-12 mx-auto flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                              <ProductBagIllustration product={product} size="sm" showGranulesBadge={false} className="w-full h-full" />
                            </div>
                          </td>

                          {/* Name & NPK */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 font-['Battambang'] text-sm">
                              {product.nameKh}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded text-[10px]">
                                {product.npk}
                              </span>
                              {product.nicknameKh && (
                                <span className="text-xs text-emerald-700 font-semibold font-['Battambang']">
                                  • {product.nicknameKh}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="p-3.5 font-semibold text-slate-600 font-['Battambang']">
                            {product.categoryKh}
                          </td>

                          {/* Stock Status & Packaging Sizes */}
                          <td className="p-3.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {isOverseas ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-full font-bold font-['Battambang']">
                                  <span>ស្ដុកក្រៅប្រទេស</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-full font-bold font-['Battambang']">
                                  <span>មានស្ដុក</span>
                                </span>
                              )}
                              <span className="text-[11px] font-mono font-bold text-slate-700">
                                {stockQty} {stockUnit}
                              </span>
                              {sizeOptionsCount > 0 && (
                                <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                                  {sizeOptionsCount} ខ្នាតទំហំ
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Price with Inline Quick Editor */}
                          <td className="p-3.5 text-right">
                            {isQuickEditing ? (
                              <div className="inline-flex items-center gap-1">
                                <span className="text-slate-500 font-mono font-bold">$</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={quickPriceValue}
                                  onChange={(e) => setQuickPriceValue(e.target.value)}
                                  className="w-20 bg-white border border-blue-500 rounded px-1.5 py-0.5 text-xs font-mono font-bold"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQuickPriceSave(product.id);
                                    if (e.key === 'Escape') setQuickPriceEditId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleQuickPriceSave(product.id)}
                                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setQuickPriceEditId(product.id);
                                  setQuickPriceValue(product.price.toString());
                                }}
                                className="cursor-pointer group flex items-center justify-end gap-1 font-mono font-black text-blue-900 text-sm"
                                title="ចុចដើម្បីកែប្រែតម្លៃរហ័ស"
                              >
                                <span>${product.price.toFixed(2)}</span>
                                <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-blue-600" />
                              </div>
                            )}
                          </td>

                          {/* Badges */}
                          <td className="p-3.5 text-center">
                            <div className="flex flex-col gap-1 items-center font-['Battambang']">
                              {product.isPopular && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                                  ★ ពេញនិយម
                                </span>
                              )}
                              {product.isNew && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                                  ✨ ថ្មី
                                </span>
                              )}
                              {!product.isPopular && !product.isNew && (
                                <span className="text-[9px] text-slate-400">ធម្មតា</span>
                              )}
                            </div>
                          </td>

                          {/* Reorder Buttons */}
                          <td className="p-3.5 text-center">
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => handleMove(index, 'up')}
                                disabled={index === 0}
                                className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600 cursor-pointer"
                                title="រំកិលឡើងលើ"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMove(index, 'down')}
                                disabled={index === products.length - 1}
                                className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600 cursor-pointer"
                                title="រំកិលចុះក្រោម"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Actions: Edit & Delete */}
                          <td className="p-3.5 text-center">
                            {isDeleting ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    onDeleteProduct(product.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  លុបចោល
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
                                >
                                  ទេ
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                                  title="កែប្រែទិន្នន័យ & រូបភាពទំនិញ"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>កែប្រែ / Upload</span>
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(product.id)}
                                  className="p-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition-colors cursor-pointer"
                                  title="លុបមុខទំនិញនេះ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};
