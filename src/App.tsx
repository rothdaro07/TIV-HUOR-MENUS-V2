import React, { useState, useEffect } from 'react';
import { Product, Currency, Category, CompanyProfile, AdminAuthSettings, SystemBackupData, CartItem, Order, BankPaymentAccount, ProductGroupId, PriceMode } from './types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, COMPANY_INFO, INITIAL_BANK_ACCOUNTS } from './data/initialProducts';
import { Header } from './components/Header';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { LoadingScreen } from './components/LoadingScreen';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { sendOrderToTelegram } from './lib/telegram';
import {
  subscribeToProducts,
  subscribeToCategories,
  subscribeToCompanyProfile,
  subscribeToAdminAuth,
  subscribeToBankAccounts,
  saveBankAccountsToFirestore,
  subscribeToOrders,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  initializeFirestoreDataIfEmpty,
  saveProductToFirestore,
  deleteProductFromFirestore,
  batchSaveProductsToFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  batchSaveCategoriesToFirestore,
  saveCompanyProfileToFirestore,
  saveAdminAuthToFirestore,
  restoreFullBackupToFirestore,
  resetFirestoreToFactory,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
} from './lib/firebase';

const STORAGE_KEY_PRODUCTS = 'tivhuor_fertilizer_products_v3';
const STORAGE_KEY_CATEGORIES = 'tivhuor_fertilizer_categories_v2';
const STORAGE_KEY_COMPANY = 'tivhuor_company_profile_v1';
const STORAGE_KEY_AUTH = 'tivhuor_admin_auth_settings_v1';
const STORAGE_KEY_CART = 'tivhuor_cart_items_v1';
const STORAGE_KEY_ORDERS = 'tivhuor_orders_history_v1';
const STORAGE_KEY_BANK_ACCOUNTS = 'tivhuor_bank_accounts_v1';

// Helper to clean legacy branding from product nameKh if present
function sanitizeProductName(p: Product): Product {
  if (p.nameKh && p.nameKh.includes('ជីកសិកម្ម សញ្ញាមហាកំពែង')) {
    return {
      ...p,
      nameKh: p.nameKh.replace(/ជីកសិកម្ម សញ្ញាមហាកំពែង\s*/g, '').trim() || p.name,
    };
  }
  return p;
}

export default function App() {
  // Load company profile from localStorage or fallback to default COMPANY_INFO
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPANY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.brandName) return { ...COMPANY_INFO, ...parsed };
      }
    } catch (e) {
      console.error('Error loading stored company profile', e);
    }
    return COMPANY_INFO;
  });

  // Load products from localStorage or initialize with standard SKUs
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeProductName);
        }
      }
    } catch (e) {
      console.error('Error loading stored products', e);
    }
    return INITIAL_PRODUCTS;
  });

  // Load categories from localStorage or initialize with INITIAL_CATEGORIES
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading stored categories', e);
    }
    return INITIAL_CATEGORIES;
  });

  // Active view: 'catalog' | 'detail' | 'admin' | 'login'
  const [activeTab, setActiveTab] = useState<'catalog' | 'detail' | 'calculator' | 'admin' | 'contact'>('catalog');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ProductGroupId>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Handle group switch with category reset
  const handleSelectGroup = (group: ProductGroupId) => {
    setSelectedGroup(group);
    setSelectedCategory('all');
  };

  // Currency: USD or KHR
  const [currency, setCurrency] = useState<Currency>('USD');

  // Price Mode: retail (លក់រាយ) vs wholesale (បោះដុំ)
  const [priceMode, setPriceMode] = useState<PriceMode>('retail');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Initial App Opening Loading Screen State
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Smooth initial loading splash screen timer
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 950);
    return () => clearTimeout(timer);
  }, []);

  // Firebase Realtime Sync state
  const [isFirebaseSynced, setIsFirebaseSynced] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Admin auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('tivhuor_admin_auth') === 'true';
  });

  // Admin Auth Settings (Verified Email: loymedia7@gmail.com, Password)
  const [authSettings, setAuthSettings] = useState<AdminAuthSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading stored auth settings', e);
    }
    return {
      email: DEFAULT_ADMIN_EMAIL,
      isEmailVerified: true,
      password: DEFAULT_ADMIN_PASSWORD,
    };
  });

  // Bank Accounts state (static QR images configured by admin)
  const [bankAccounts, setBankAccounts] = useState<BankPaymentAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BANK_ACCOUNTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading stored bank accounts', e);
    }
    return INITIAL_BANK_ACCOUNTS;
  });

  // Orders History State for Analytics
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading stored orders', e);
    }
    return [];
  });

  // Shopping Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading stored cart items', e);
    }
    return [];
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Sync bank accounts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BANK_ACCOUNTS, JSON.stringify(bankAccounts));
    } catch (e) {
      console.error('Failed to persist bank accounts', e);
    }
  }, [bankAccounts]);

  // Sync orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to persist orders', e);
    }
  }, [orders]);

  // Sync cart items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to persist cart items', e);
    }
  }, [cartItems]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setIsCartDrawerOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, deltaOrQuantity: number) => {
    setCartItems((prev) => {
      return (prev || [])
        .map((item) => {
          if (item.product.id === productId) {
            const newQty =
              deltaOrQuantity === 1 || deltaOrQuantity === -1
                ? item.quantity + deltaOrQuantity
                : deltaOrQuantity;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => (prev || []).filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderCompleted = async (order: Order) => {
    // 1. Automatically dispatch order notification & invoice slip to Telegram Bot
    const finalOrder = { ...order };
    try {
      const tgConfig = companyProfile?.telegramConfig;
      if (tgConfig?.botToken && tgConfig?.chatId && tgConfig?.isEnabled !== false) {
        const tgResult = await sendOrderToTelegram(finalOrder, companyProfile);
        if (tgResult.success) {
          finalOrder.telegramNotified = true;
          finalOrder.telegramMessageId = tgResult.messageId;
        }
      }
    } catch (tgError) {
      console.warn('Telegram automated bot dispatch error:', tgError);
    }

    // 2. Store in order history state & localStorage
    setOrders((prev) => [finalOrder, ...prev.filter((o) => o.id !== finalOrder.id)]);
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      const ordersList: Order[] = saved ? JSON.parse(saved) : [];
      const updatedList = [finalOrder, ...ordersList.filter((o) => o.id !== finalOrder.id)];
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedList.slice(0, 200)));
    } catch (e) {
      console.error('Failed to save order to local history', e);
    }

    // 3. Sync to Firestore
    try {
      await saveOrderToFirestore(finalOrder);
    } catch (e) {
      console.error('Failed to sync order to Firestore', e);
    }

    // 4. Clear cart and show receipt modal
    setCartItems([]);
    setIsCartDrawerOpen(false);
    setActiveReceiptOrder(finalOrder);
  };

  const totalCartItemCount = (cartItems || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Connect Firebase Firestore Real-Time Listener & Initial Seeding
  useEffect(() => {
    let unsubscribeProducts: (() => void) | undefined;
    let unsubscribeCategories: (() => void) | undefined;
    let unsubscribeCompany: (() => void) | undefined;
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeBankAccounts: (() => void) | undefined;
    let unsubscribeOrders: (() => void) | undefined;

    const setupFirebase = async () => {
      try {
        // Seed if first time
        await initializeFirestoreDataIfEmpty();

        // Subscribe to real-time company profile
        unsubscribeCompany = subscribeToCompanyProfile(
          (liveProfile) => {
            if (liveProfile && (liveProfile.brandName || liveProfile.logoUrl || liveProfile.nameKh)) {
              setCompanyProfile((prev) => ({ ...prev, ...liveProfile }));
              setIsFirebaseSynced(true);
            }
          },
          (err) => {
            console.warn('Firebase company profile sync warning:', err);
          }
        );

        // Subscribe to real-time products
        unsubscribeProducts = subscribeToProducts(
          (liveProducts) => {
            if (liveProducts && liveProducts.length > 0) {
              setProducts(liveProducts.map(sanitizeProductName));
              setIsFirebaseSynced(true);
              setFirebaseError(null);
            }
          },
          (err) => {
            console.warn('Firebase products sync offline/warning:', err);
            setFirebaseError(err.message);
          }
        );

        // Subscribe to real-time categories
        unsubscribeCategories = subscribeToCategories(
          (liveCategories) => {
            if (liveCategories && liveCategories.length > 0) {
              setCategories(liveCategories);
              setIsFirebaseSynced(true);
            }
          },
          (err) => {
            console.warn('Firebase categories sync offline/warning:', err);
          }
        );

        // Subscribe to real-time admin auth settings
        unsubscribeAuth = subscribeToAdminAuth(
          (liveAuth) => {
            if (liveAuth) {
              setAuthSettings(liveAuth);
              localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(liveAuth));
            }
          },
          (err) => {
            console.warn('Firebase admin auth sync warning:', err);
          }
        );

        // Subscribe to real-time Bank Accounts
        unsubscribeBankAccounts = subscribeToBankAccounts(
          (liveBanks) => {
            if (liveBanks && liveBanks.length > 0) {
              setBankAccounts(liveBanks);
            }
          },
          (err) => {
            console.warn('Firebase bank accounts sync warning:', err);
          }
        );

        // Subscribe to real-time Orders
        unsubscribeOrders = subscribeToOrders(
          (liveOrders) => {
            if (liveOrders && liveOrders.length > 0) {
              setOrders(liveOrders);
            }
          },
          (err) => {
            console.warn('Firebase orders sync warning:', err);
          }
        );
      } catch (err: any) {
        console.error('Error initializing Firebase in App:', err);
        setFirebaseError(err?.message || 'Firebase sync error');
      }
    };

    setupFirebase();

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeCategories) unsubscribeCategories();
      if (unsubscribeCompany) unsubscribeCompany();
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeBankAccounts) unsubscribeBankAccounts();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  // Save company profile to localStorage and update browser favicon / home screen icon dynamically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(companyProfile));

      // Update page title
      if (companyProfile.brandName || companyProfile.nameKh) {
        document.title = `${companyProfile.nameKh || companyProfile.brandName} - កាតាឡុកជីកសិកម្ម`;
      }

      // Update dynamic favicon and Apple touch icon for Add to Home Screen
      if (companyProfile.logoUrl) {
        const favicon = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
        if (favicon) favicon.href = companyProfile.logoUrl;

        const appleIcon = document.getElementById('dynamic-apple-icon') as HTMLLinkElement | null;
        if (appleIcon) appleIcon.href = companyProfile.logoUrl;
      }
    } catch (e) {
      console.error('Failed to persist company profile to localStorage', e);
    }
  }, [companyProfile]);

  // Save products to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to persist products to localStorage', e);
    }
  }, [products]);

  // Save categories to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to persist categories to localStorage', e);
    }
  }, [categories]);

  // Handle saving company profile
  const handleSaveCompanyProfile = async (newProfile: CompanyProfile) => {
    setCompanyProfile(newProfile);
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(newProfile));
      await saveCompanyProfileToFirestore(newProfile);
    } catch (e) {
      console.error('Failed to save company profile to Firestore', e);
    }
  };

  // Product CRUD with Firestore sync
  const handleAddProduct = async (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    try {
      await saveProductToFirestore(newProduct);
    } catch (e) {
      console.error('Failed to save product to Firestore', e);
    }
  };

  const handleUpdateProduct = async (updated: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    try {
      await saveProductToFirestore(updated);
    } catch (e) {
      console.error('Failed to update product in Firestore', e);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      await deleteProductFromFirestore(productId);
    } catch (e) {
      console.error('Failed to delete product in Firestore', e);
    }
  };

  const handleReorderProducts = async (reordered: Product[]) => {
    setProducts(reordered);
    try {
      await batchSaveProductsToFirestore(reordered);
    } catch (e) {
      console.error('Failed to batch save products in Firestore', e);
    }
  };

  // Category CRUD with Firestore sync
  const handleAddCategory = async (newCategory: Category) => {
    setCategories((prev) => [...prev, newCategory]);
    try {
      await saveCategoryToFirestore(newCategory);
    } catch (e) {
      console.error('Failed to save category to Firestore', e);
    }
  };

  const handleUpdateCategory = async (updated: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    // Also sync categoryKh in products if it changed
    const updatedProducts = products.map((p) => {
      if (p.category === updated.id) {
        return { ...p, categoryKh: updated.nameKh };
      }
      return p;
    });
    setProducts(updatedProducts);

    try {
      await saveCategoryToFirestore(updated);
      await batchSaveProductsToFirestore(updatedProducts);
    } catch (e) {
      console.error('Failed to update category in Firestore', e);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    try {
      await deleteCategoryFromFirestore(categoryId);
    } catch (e) {
      console.error('Failed to delete category in Firestore', e);
    }
  };

  const handleReorderCategories = async (reordered: Category[]) => {
    setCategories(reordered);
    try {
      await batchSaveCategoriesToFirestore(reordered);
    } catch (e) {
      console.error('Failed to batch save categories in Firestore', e);
    }
  };

  const handleResetFactory = async () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    try {
      await resetFirestoreToFactory();
    } catch (e) {
      console.error('Failed to reset Firestore to factory', e);
    }
  };

  // Save / Update Admin Auth Settings (Verified Email & Password)
  const handleSaveAdminAuthSettings = async (newSettings: AdminAuthSettings) => {
    setAuthSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newSettings));
      await saveAdminAuthToFirestore(newSettings);
    } catch (e) {
      console.error('Failed to save admin auth to Firestore', e);
    }
  };

  // Direct Password Reset from Login Forgot Password modal
  const handleResetPasswordDirectly = async (newPassword: string) => {
    const updated: AdminAuthSettings = {
      ...authSettings,
      password: newPassword,
      isEmailVerified: true,
      updatedAt: new Date().toISOString(),
    };
    await handleSaveAdminAuthSettings(updated);
  };

  // Restore Full System Backup
  const handleRestoreFullBackup = async (backupData: SystemBackupData) => {
    if (backupData.products && backupData.products.length > 0) {
      setProducts(backupData.products.map(sanitizeProductName));
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(backupData.products));
    }
    if (backupData.categories && backupData.categories.length > 0) {
      setCategories(backupData.categories);
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(backupData.categories));
    }
    if (backupData.companyProfile) {
      setCompanyProfile(backupData.companyProfile);
      localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(backupData.companyProfile));
    }

    try {
      await restoreFullBackupToFirestore(backupData);
    } catch (e) {
      console.error('Failed to restore backup to Firestore', e);
    }
  };

  // Save / Update Bank Accounts
  const handleSaveBankAccounts = async (newAccounts: BankPaymentAccount[]) => {
    setBankAccounts(newAccounts);
    try {
      localStorage.setItem(STORAGE_KEY_BANK_ACCOUNTS, JSON.stringify(newAccounts));
      await saveBankAccountsToFirestore(newAccounts);
    } catch (e) {
      console.error('Failed to save bank accounts to Firestore', e);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) {
        const parsed: Order[] = JSON.parse(saved);
        const updated = parsed.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord));
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
      }
      await updateOrderStatusInFirestore(orderId, newStatus);
    } catch (e) {
      console.error('Failed to update order status in Firestore', e);
    }
  };

  // Selected product for Detail Page
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('tivhuor_admin_auth');
    setIsAdminLoggedIn(false);
    setActiveTab('catalog');
  };

  const handleAdminLoginSuccess = () => {
    localStorage.setItem('tivhuor_admin_auth', 'true');
    setIsAdminLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Battambang'] text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* App Launch Splash & Loading Screen */}
      <LoadingScreen isLoading={isInitialLoading} companyProfile={companyProfile} />

      {/* When Admin is Logged In, display the full-screen Admin Dashboard with standard docked sidebar */}
      {activeTab === 'admin' && isAdminLoggedIn ? (
        <AdminDashboard
          products={products}
          categories={categories}
          companyProfile={companyProfile}
          authSettings={authSettings}
          bankAccounts={bankAccounts}
          orders={orders}
          isFirebaseSynced={isFirebaseSynced}
          firebaseError={firebaseError}
          onUpdateProduct={handleUpdateProduct}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onReorderProducts={handleReorderProducts}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onReorderCategories={handleReorderCategories}
          onSaveCompanyProfile={handleSaveCompanyProfile}
          onSaveAuthSettings={handleSaveAdminAuthSettings}
          onSaveBankAccounts={handleSaveBankAccounts}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onRestoreBackup={handleRestoreFullBackup}
          onResetFactory={handleResetFactory}
          onLogout={handleAdminLogout}
          currency={currency}
          onViewStore={() => setActiveTab('catalog')}
          onCurrencyChange={setCurrency}
        />
      ) : (
        <>
          {/* Global Header */}
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currency={currency}
            setCurrency={setCurrency}
            priceMode={priceMode}
            setPriceMode={setPriceMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isAdminLoggedIn={isAdminLoggedIn}
            companyProfile={companyProfile}
            cartItemCount={totalCartItemCount}
            onOpenCart={() => setIsCartDrawerOpen(true)}
            selectedGroup={selectedGroup}
            onSelectGroup={handleSelectGroup}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Main Page Routing Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
            {/* TAB 1: Catalog Home Page */}
            {activeTab === 'catalog' && (
              <Home
                products={products}
                categories={categories}
                currency={currency}
                priceMode={priceMode}
                onSelectProduct={handleSelectProduct}
                onAddToCart={handleAddToCart}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedGroup={selectedGroup}
                onSelectGroup={handleSelectGroup}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            )}

            {/* TAB 2: Product Detail Page */}
            {activeTab === 'detail' && selectedProduct && (
              <ProductDetail
                product={selectedProduct}
                allProducts={products}
                currency={currency}
                priceMode={priceMode}
                onBack={() => setActiveTab('catalog')}
                onSelectProduct={handleSelectProduct}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            )}

            {/* Admin Login (when not logged in) */}
            {activeTab === 'admin' && !isAdminLoggedIn && (
              <AdminLogin
                authSettings={authSettings}
                onLoginSuccess={handleAdminLoginSuccess}
                onCancel={() => setActiveTab('catalog')}
                onResetPasswordDirectly={handleResetPasswordDirectly}
              />
            )}
          </main>

          {/* Cart & Checkout Slide-Over Drawer with VET Delivery & Multi-Bank Static QR Checkout */}
          <CartCheckoutDrawer
            isOpen={isCartDrawerOpen}
            onClose={() => setIsCartDrawerOpen(false)}
            items={cartItems}
            currency={currency}
            bankAccounts={bankAccounts}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onOrderCompleted={handleOrderCompleted}
            companyProfile={companyProfile}
          />

          {/* Post-Order Receipt Modal */}
          {activeReceiptOrder && (
            <OrderReceiptModal
              order={activeReceiptOrder}
              onClose={() => setActiveReceiptOrder(null)}
              companyProfile={companyProfile}
            />
          )}

          {/* Install PWA / Add to Home Screen Prompt with Custom Company Logo */}
          <InstallPwaPrompt companyProfile={companyProfile} />

          {/* Clean Minimal Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-['Battambang'] flex flex-wrap items-center justify-between gap-2">
              <div>
                © {new Date().getFullYear()} {companyProfile.nameKh || companyProfile.brandName} — រក្សាសិទ្ធិគ្រប់យ៉ាង
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-['Kantumruy_Pro']">
                <span>ប្រព័ន្ធកុម្ម៉ង់ជីកសិកម្មអនឡាញផ្លូវការ</span>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
