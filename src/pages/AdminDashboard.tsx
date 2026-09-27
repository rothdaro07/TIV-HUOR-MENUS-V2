import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  LogOut,
  Check,
  Layers,
  Tag,
  Package,
  Database,
  Building2,
  Shield,
  TrendingUp,
  ClipboardList,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  Bot,
  Tractor,
  FlaskConical,
  Sprout,
  Store,
  DollarSign,
  User,
  Boxes,
} from 'lucide-react';
import {
  Product,
  Currency,
  Category,
  CompanyProfile,
  AdminAuthSettings,
  SystemBackupData,
  BankPaymentAccount,
  Order,
  ProductGroupId,
} from '../types';
import { ProductBagIllustration } from '../components/ProductBagIllustration';
import { AdminTableRowSkeleton } from '../components/CatalogSkeleton';
import { AdminProductForm, getInitialUnitPackage } from './AdminProductForm';
import { AdminCategoryManager } from '../components/AdminCategoryManager';
import { AdminCompanySettings } from '../components/AdminCompanySettings';
import { AdminSecuritySettings } from '../components/AdminSecuritySettings';
import { AdminBackupManager } from '../components/AdminBackupManager';
import { AdminBankQrManager } from '../components/AdminBankQrManager';
import { AdminAnalyticsManager } from '../components/AdminAnalyticsManager';
import { AdminOrdersManager } from '../components/AdminOrdersManager';
import { AdminTelegramBotManager } from '../components/AdminTelegramBotManager';
import { ProductStockAnalytics } from '../components/ProductStockAnalytics';
import {
  INITIAL_CATEGORIES,
  COMPANY_INFO,
  INITIAL_BANK_ACCOUNTS,
  PRODUCT_GROUPS,
  EXCHANGE_RATE_KHR,
} from '../data/initialProducts';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../lib/firebase';

export type AdminNavSection =
  | 'analytics'
  | 'orders'
  | 'products'
  | 'stock'
  | 'categories'
  | 'bank_qr'
  | 'telegram'
  | 'company'
  | 'backup'
  | 'security';

interface AdminDashboardProps {
  products: Product[];
  categories?: Category[];
  companyProfile?: CompanyProfile;
  authSettings?: AdminAuthSettings;
  bankAccounts?: BankPaymentAccount[];
  orders?: Order[];
  isLoading?: boolean;
  isFirebaseSynced?: boolean;
  firebaseError?: string | null;
  initialSection?: AdminNavSection;
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
  authSettings = {
    email: DEFAULT_ADMIN_EMAIL,
    isEmailVerified: true,
    password: DEFAULT_ADMIN_PASSWORD,
  },
  bankAccounts = INITIAL_BANK_ACCOUNTS,
  orders = [],
  isLoading = false,
  isFirebaseSynced = true,
  initialSection = 'products',
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
  const [activeSection, setActiveSection] = useState<AdminNavSection>(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const [viewState, setViewState] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ProductGroupId>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<
    'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overseas_stock'
  >('all');
  const [quickPriceEditId, setQuickPriceEditId] = useState<string | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<string>('');
  const [quickStockEditId, setQuickStockEditId] = useState<string | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // Merge categories with INITIAL_CATEGORIES so all 26 subcategories are always available
  const allCategories = useMemo(() => {
    const map = new Map<string, Category>();
    INITIAL_CATEGORIES.forEach((c) => map.set(c.id, c));
    categories.forEach((c) => {
      const existing = map.get(c.id);
      map.set(c.id, { ...existing, ...c });
    });
    return Array.from(map.values());
  }, [categories]);

  // Pending orders counter for badge
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending_payment').length;

  // Out of stock / low stock counter for badge
  const lowOrOutStockCount = useMemo(() => {
    return products.filter((p) => {
      const qty = p.stockQty ?? 0;
      return qty <= 20 || p.inStock === false || p.stockStatus === 'out_of_stock';
    }).length;
  }, [products]);

  // Filtered categories according to selected main group
  const availableCategories = useMemo(() => {
    if (selectedGroup === 'all') return allCategories;
    return allCategories.filter(
      (c) => (c.groupId || 'chemical_fertilizer') === selectedGroup
    );
  }, [allCategories, selectedGroup]);

  // Filter products by search, main group, sub-category, and stock status
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.nameKh.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        p.npk.toLowerCase().includes(q) ||
        p.categoryKh.toLowerCase().includes(q) ||
        (p.groupKh && p.groupKh.toLowerCase().includes(q)) ||
        (p.nicknameKh && p.nicknameKh.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      // Group match
      const prodCat = allCategories.find(
        (c) => c.id === p.category || c.nameKh === p.categoryKh
      );
      const prodGroupId = p.groupId || prodCat?.groupId || 'chemical_fertilizer';

      if (selectedGroup !== 'all' && prodGroupId !== selectedGroup) {
        return false;
      }

      // Sub-category match
      if (selectedCategoryFilter !== 'all') {
        const catObj = allCategories.find((c) => c.id === selectedCategoryFilter);
        const matchCat =
          p.category === selectedCategoryFilter ||
          p.categoryKh === selectedCategoryFilter ||
          (catObj && p.categoryKh === catObj.nameKh);
        if (!matchCat) return false;
      }

      // Stock filter match
      if (selectedStockFilter !== 'all') {
        const qty = p.stockQty ?? 0;
        const isOut = qty <= 0 || p.inStock === false || p.stockStatus === 'out_of_stock';
        if (selectedStockFilter === 'out_of_stock' && !isOut) return false;
        if (selectedStockFilter === 'low_stock' && (isOut || qty > 20)) return false;
        if (selectedStockFilter === 'in_stock' && (isOut || qty <= 20)) return false;
        if (
          selectedStockFilter === 'overseas_stock' &&
          (p.stockStatus !== 'overseas_stock' || isOut)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    products,
    searchQuery,
    selectedGroup,
    selectedCategoryFilter,
    selectedStockFilter,
    allCategories,
  ]);

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
      if (!isNaN(num) && num >= 0) {
        onUpdateProduct({ ...p, price: num });
      }
    }
    setQuickPriceEditId(null);
  };

  const handleQuickStockSave = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (p) {
      const num = parseInt(quickStockValue, 10);
      if (!isNaN(num) && num >= 0) {
        onUpdateProduct({
          ...p,
          stockQty: num,
          inStock: num > 0,
          stockStatus:
            num <= 0
              ? 'out_of_stock'
              : p.stockStatus === 'out_of_stock'
              ? 'in_stock'
              : p.stockStatus || 'in_stock',
          updatedAt: new Date().toISOString(),
        });
      }
    }
    setQuickStockEditId(null);
  };

  // Grouped Navigation Items
  const navGroups: NavGroup[] = [
    {
      groupNameKh: 'គ្រប់គ្រងទំនិញ & ស្តុក',
      groupNameEn: 'Catalog & Stock',
      items: [
        {
          id: 'products',
          label: 'មុខទំនិញកសិកម្ម',
          sublabel: 'Products & Specs',
          icon: Package,
          badge: `${products.length}`,
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'stock',
          label: 'ស្តុកទំនិញ (Stock)',
          sublabel: 'View & Edit Product Stock',
          icon: Boxes,
          badge: lowOrOutStockCount > 0 ? `${lowOrOutStockCount} ជិតអស់/ដាច់` : `${products.length}`,
          badgeColor:
            lowOrOutStockCount > 0
              ? 'bg-amber-100 text-amber-800 font-bold'
              : 'bg-blue-100 text-blue-800',
        },
        {
          id: 'categories',
          label: 'ប្រភេទ & ក្រុមទំនិញ',
          sublabel: 'Categories & Groups',
          icon: Tag,
          badge: `${allCategories.length}`,
          badgeColor: 'bg-slate-100 text-slate-700',
        },
      ],
    },
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
          badgeColor:
            pendingOrdersCount > 0
              ? 'bg-amber-500 text-white font-bold animate-pulse'
              : 'bg-slate-100 text-slate-700',
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
          badge:
            companyProfile?.telegramConfig?.isEnabled &&
            companyProfile?.telegramConfig?.botToken
              ? 'Bot Live'
              : 'Setup',
          badgeColor:
            companyProfile?.telegramConfig?.isEnabled &&
            companyProfile?.telegramConfig?.botToken
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800',
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

  const flatNavItems = navGroups.flatMap((g) => g.items);
  const currentNav =
    flatNavItems.find((item) => item.id === activeSection) || flatNavItems[0];
  const CurrentIcon = currentNav.icon;

  return (
    <div className="min-h-screen bg-slate-100/80 flex font-['Battambang'] text-slate-800 antialiased">
      {/* ========================================================================= */}
      {/* MOBILE SIDEBAR DRAWER                                                     */}
      {/* ========================================================================= */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                          isActive
                            ? 'bg-white text-[#1E5FA8]'
                            : item.badgeColor || 'bg-slate-100 text-slate-600'
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
      {/* DESKTOP DOCKED SIDEBAR                                                    */}
      {/* ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-slate-200/90 sticky top-0 h-screen z-30 transition-all duration-300 ${
          isDesktopCollapsed ? 'w-20' : 'w-64 xl:w-72'
        }`}
      >
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
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isFirebaseSynced ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      {isFirebaseSynced ? 'Cloud' : 'Local'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  <span className="font-black text-sm text-white">
                    {companyProfile.logoText || 'TH'}
                  </span>
                </div>
              </div>
            )}

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
                          isActive
                            ? 'bg-white text-[#1E5FA8]'
                            : item.badgeColor || 'bg-slate-100 text-slate-600'
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

        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2 shrink-0">
          {!isDesktopCollapsed ? (
            <>
              {onViewStore && (
                <button
                  onClick={onViewStore}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#1E5FA8] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer font-['Kantumruy_Pro']"
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
                    <div className="text-[9px] text-slate-400 truncate">Administrator</div>
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
                  title="មើលហាងទំនិញ"
                >
                  <Store className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onLogout}
                className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                title="ចាកចេញពីគណនី"
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
        {/* 🌟 TOP NAVBAR WITH QUICK ACCESS TO PRODUCTS & STOCK */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          {/* Left: Mobile Drawer Button, Desktop Collapse Button, and Current Section Title */}
          <div className="flex items-center gap-3 min-w-0">
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

            <button
              type="button"
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              className="hidden lg:flex p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E5FA8] flex items-center justify-center font-bold shrink-0 shadow-2xs border border-blue-100">
                <CurrentIcon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-['Kantumruy_Pro'] leading-none">
                  <span>ផ្ទាំងគ្រប់គ្រង</span>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-slate-600 font-bold truncate">
                    {currentNav.sublabel}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight mt-0.5 font-['Battambang']">
                  {currentNav.label}
                </h1>
              </div>
            </div>
          </div>

          {/* 🌟 Center/Right Quick Navbar Switcher: Products, Stock, Orders, Analytics */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-['Battambang']">
              <button
                type="button"
                onClick={() => {
                  setActiveSection('products');
                  setViewState('list');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSection === 'products'
                    ? 'bg-[#1E5FA8] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>មុខទំនិញ (Products)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSection('stock');
                  setViewState('list');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSection === 'stock'
                    ? 'bg-[#1E5FA8] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>ស្តុកទំនិញ (Stock)</span>
                {lowOrOutStockCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      activeSection === 'stock'
                        ? 'bg-white text-[#1E5FA8]'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {lowOrOutStockCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSection('orders');
                  setViewState('list');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSection === 'orders'
                    ? 'bg-[#1E5FA8] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ការកុម្ម៉ង់</span>
                {pendingOrdersCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSection('analytics');
                  setViewState('list');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSection === 'analytics'
                    ? 'bg-[#1E5FA8] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="hidden md:inline">វិភាគចំណូល</span>
              </button>
            </div>

            {/* Currency Switcher */}
            {onCurrencyChange && (
              <button
                onClick={() => onCurrencyChange(currency === 'USD' ? 'KHR' : 'USD')}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1 font-['Kantumruy_Pro']"
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
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">មើលហាង</span>
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
          {activeSection === 'analytics' ? (
            <AdminAnalyticsManager
              orders={orders}
              products={products}
              companyProfile={companyProfile}
              onUpdateOrderStatus={onUpdateOrderStatus}
              currency={currency}
            />
          ) : activeSection === 'stock' ? (
            /* Dedicated Product Stock View & Management */
            <ProductStockAnalytics
              products={products}
              orders={orders}
              categories={allCategories}
              exchangeRateKHR={EXCHANGE_RATE_KHR}
              onUpdateProduct={onUpdateProduct}
              onEditProduct={handleEdit}
              onAddProductClick={handleCreateNew}
            />
          ) : activeSection === 'orders' ? (
            <AdminOrdersManager
              orders={orders}
              products={products}
              companyProfile={companyProfile}
              onUpdateOrderStatus={onUpdateOrderStatus}
              currency={currency}
            />
          ) : activeSection === 'bank_qr' ? (
            <AdminBankQrManager
              bankAccounts={bankAccounts}
              onSaveBankAccounts={onSaveBankAccounts || (() => {})}
              isFirebaseSynced={isFirebaseSynced}
            />
          ) : activeSection === 'security' ? (
            <AdminSecuritySettings
              authSettings={authSettings}
              onSaveAuthSettings={onSaveAuthSettings || (() => {})}
              isFirebaseSynced={isFirebaseSynced}
            />
          ) : activeSection === 'backup' ? (
            <AdminBackupManager
              products={products}
              categories={allCategories}
              companyProfile={companyProfile}
              onRestoreBackup={onRestoreBackup || (() => {})}
              onResetFactory={onResetFactory}
              isFirebaseSynced={isFirebaseSynced}
            />
          ) : activeSection === 'telegram' ? (
            <AdminTelegramBotManager
              companyProfile={companyProfile}
              onSaveCompanyProfile={onSaveCompanyProfile || (() => {})}
              isFirebaseSynced={isFirebaseSynced}
            />
          ) : activeSection === 'company' ? (
            <AdminCompanySettings
              companyProfile={companyProfile}
              onSaveCompanyProfile={onSaveCompanyProfile || (() => {})}
              isFirebaseSynced={isFirebaseSynced}
            />
          ) : activeSection === 'categories' ? (
            <AdminCategoryManager
              categories={allCategories}
              products={products}
              onAddCategory={onAddCategory || (() => {})}
              onUpdateCategory={onUpdateCategory || (() => {})}
              onDeleteCategory={onDeleteCategory || (() => {})}
              onReorderCategories={onReorderCategories || (() => {})}
            />
          ) : (
            /* Products Section */
            <div className="space-y-4 font-['Plus_Jakarta_Sans','Battambang',sans-serif]">
              {/* Top Filter & Action Bar with Group, Sub-category & Stock Selects */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  {/* 1. Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors"
                    />
                  </div>

                  {/* 2. Group Select Dropdown */}
                  <select
                    value={selectedGroup}
                    onChange={(e) => {
                      setSelectedGroup(e.target.value as ProductGroupId);
                      setSelectedCategoryFilter('all');
                    }}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-800 outline-none cursor-pointer min-w-[185px]"
                  >
                    <option value="all">All groups (គ្រប់ក្រុមទាំង ៧)</option>
                    {PRODUCT_GROUPS.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name.replace('Agricultural ', '').replace('Materials', 'Material')} (
                        {grp.nameKh})
                      </option>
                    ))}
                  </select>

                  {/* 3. Sub-category Select Dropdown (Always visible for easy viewing) */}
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-800 outline-none cursor-pointer min-w-[180px]"
                  >
                    <option value="all">
                      {selectedGroup === 'all'
                        ? 'All sub-categories (គ្រប់ប្រភេទរង)'
                        : `All sub-categories (${availableCategories.length})`}
                    </option>
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameKh} ({c.name})
                      </option>
                    ))}
                  </select>

                  {/* 4. Stock Status Select Dropdown */}
                  <select
                    value={selectedStockFilter}
                    onChange={(e) => setSelectedStockFilter(e.target.value as any)}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#165b9e] rounded-xl text-sm text-slate-800 outline-none cursor-pointer min-w-[155px]"
                  >
                    <option value="all">All stock (គ្រប់ស្តុក)</option>
                    <option value="in_stock">In stock (&gt;20)</option>
                    <option value="low_stock">Low stock (≤20)</option>
                    <option value="out_of_stock">Out of stock (0)</option>
                    <option value="overseas_stock">Overseas stock</option>
                  </select>
                </div>

                {/* Right Action Buttons: View Stock Details & Add Product */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection('stock')}
                    className="px-4 py-2.5 bg-white hover:bg-blue-50 text-[#165b9e] border border-blue-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Boxes className="w-4 h-4" />
                    <span>ពិនិត្យស្តុកលម្អិត</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="px-5 py-2.5 bg-[#165b9e] hover:bg-[#124b82] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add product</span>
                  </button>
                </div>
              </div>

              {/* Clean Products Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-500 text-xs font-medium">
                      <tr>
                        <th className="py-3.5 px-4">Product</th>
                        <th className="py-3.5 px-4">Group / Sub-category</th>
                        <th className="py-3.5 px-4">Price</th>
                        <th className="py-3.5 px-4"></th>
                        <th className="py-3.5 px-4">Stock (ចុចដើម្បីកែ)</th>
                        <th className="py-3.5 px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading || products.length === 0 ? (
                        <AdminTableRowSkeleton rows={6} cols={6} />
                      ) : filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                            No products match your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => {
                          const isQuickEditing = quickPriceEditId === product.id;
                          const isQuickStockEditing = quickStockEditId === product.id;
                          const isDeleting = deleteConfirmId === product.id;
                          const stockQty = product.stockQty ?? 0;
                          const isOutOfStock =
                            stockQty <= 0 ||
                            product.inStock === false ||
                            product.stockStatus === 'out_of_stock';

                          const prodCat = allCategories.find(
                            (c) =>
                              c.id === product.category || c.nameKh === product.categoryKh
                          );
                          const prodGroupId =
                            product.groupId || prodCat?.groupId || 'chemical_fertilizer';
                          const groupObj = PRODUCT_GROUPS.find((g) => g.id === prodGroupId);

                          const groupLabelDisplay = groupObj
                            ? `${groupObj.name
                                .replace('Agricultural ', '')
                                .replace('Materials', 'Material')} (${groupObj.nameKh})`
                            : product.groupKh || 'Chemical Fertilizer';

                          const subCatLabelDisplay = prodCat
                            ? `${prodCat.nameKh} (${prodCat.name})`
                            : product.categoryKh || product.category;

                          const unitPkgDisplay = getInitialUnitPackage(product);
                          const stockShortUnit =
                            product.stockUnit &&
                            /^[a-zA-Z0-9.\s-]+$/.test(product.stockUnit)
                              ? product.stockUnit
                              : prodGroupId === 'machinery'
                              ? 'unit'
                              : (product.weight || '50kg').replace(/\s+/g, '');

                          return (
                            <tr
                              key={product.id}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              {/* 1. Product Thumbnail + Khmer & English Names */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3.5">
                                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
                                    <ProductBagIllustration
                                      product={product}
                                      size="sm"
                                      showGranulesBadge={false}
                                      className="w-full h-full"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 font-['Battambang'] text-sm leading-snug truncate max-w-xs">
                                      {product.nameKh}
                                    </div>
                                    <div className="text-xs text-slate-500 leading-snug truncate max-w-xs mt-0.5">
                                      {product.name}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Group / Sub-category */}
                              <td className="py-3.5 px-4">
                                <div className="text-sm font-medium text-slate-800 leading-snug">
                                  {groupLabelDisplay}
                                </div>
                                <div className="text-xs text-slate-500 leading-snug mt-0.5">
                                  {subCatLabelDisplay}
                                </div>
                              </td>

                              {/* 3. Price */}
                              <td className="py-3.5 px-4 tabular-nums">
                                {isQuickEditing ? (
                                  <div className="inline-flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      value={quickPriceValue}
                                      onChange={(e) => setQuickPriceValue(e.target.value)}
                                      className="w-20 bg-white border border-[#165b9e] rounded-lg px-2 py-1 text-xs font-semibold tabular-nums outline-none"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                          handleQuickPriceSave(product.id);
                                        if (e.key === 'Escape') setQuickPriceEditId(null);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleQuickPriceSave(product.id)}
                                      className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span
                                    onClick={() => {
                                      setQuickPriceEditId(product.id);
                                      setQuickPriceValue(product.price.toString());
                                    }}
                                    className="text-sm text-slate-900 cursor-pointer hover:text-[#165b9e] transition-colors"
                                    title="Click to quick-edit price"
                                  >
                                    {Number(product.price.toFixed(2))}
                                  </span>
                                )}
                              </td>

                              {/* 4. Unit / Package */}
                              <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                                / {unitPkgDisplay}
                              </td>

                              {/* 5. Stock Pill (Click to Quick-Edit Stock Quantity) */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {isQuickStockEditing ? (
                                  <div className="inline-flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      value={quickStockValue}
                                      onChange={(e) => setQuickStockValue(e.target.value)}
                                      className="w-16 bg-white border border-[#165b9e] rounded-lg px-2 py-1 text-xs font-semibold tabular-nums outline-none"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                          handleQuickStockSave(product.id);
                                        if (e.key === 'Escape') setQuickStockEditId(null);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleQuickStockSave(product.id)}
                                      className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer"
                                      title="Save stock"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : isOutOfStock ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickStockEditId(product.id);
                                      setQuickStockValue('0');
                                    }}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                                    title="ចុចដើម្បីបញ្ចូលចំនួនស្តុកថ្មី"
                                  >
                                    Out of stock
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickStockEditId(product.id);
                                      setQuickStockValue(String(stockQty));
                                    }}
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tabular-nums cursor-pointer transition-colors ${
                                      stockQty <= 20
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                    }`}
                                    title="ចុចដើម្បីកែប្រែចំនួនស្តុកភ្លាមៗ"
                                  >
                                    {stockQty} {stockShortUnit}
                                  </button>
                                )}
                              </td>

                              {/* 6. Edit & Delete Actions */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                {isDeleting ? (
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteProduct(product.id);
                                        setDeleteConfirmId(null);
                                      }}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEdit(product)}
                                      className="p-1.5 text-slate-500 hover:text-[#165b9e] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                      title="Edit product & specification table"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmId(product.id)}
                                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete product"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Global Add / Edit Product Modal Overlay (works from both Products and Stock tabs) */}
          {(viewState === 'create' || viewState === 'edit') && (
            <AdminProductForm
              initialProduct={selectedProduct}
              categories={allCategories}
              onSave={handleSaveForm}
              onCancel={() => setViewState('list')}
              onQuickAddCategory={onAddCategory}
            />
          )}
        </main>
      </div>
    </div>
  );
};
