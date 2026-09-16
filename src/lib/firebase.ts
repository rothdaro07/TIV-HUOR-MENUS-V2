import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Category, CompanyProfile, AdminAuthSettings, SystemBackupData, BankPaymentAccount, Order } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, COMPANY_INFO, INITIAL_BANK_ACCOUNTS } from '../data/initialProducts';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const PRODUCTS_COLLECTION = 'products';
export const CATEGORIES_COLLECTION = 'categories';
export const SETTINGS_COLLECTION = 'settings';
export const BANK_ACCOUNTS_COLLECTION = 'bank_accounts';
export const ORDERS_COLLECTION = 'orders';
export const COMPANY_DOC_ID = 'company_profile';
export const ADMIN_AUTH_DOC_ID = 'admin_auth';
export const BANK_SETTINGS_DOC_ID = 'bank_accounts_list';

export const DEFAULT_ADMIN_EMAIL = 'loymedia7@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = 'admin123';

/**
 * Real-time listener for company settings document
 */
export function subscribeToCompanyProfile(
  onSuccess: (profile: CompanyProfile) => void,
  onError: (error: Error) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, COMPANY_DOC_ID);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onSuccess(docSnap.data() as CompanyProfile);
      }
    },
    (err) => {
      console.error('Firestore company profile subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Save / Update company profile in Firestore
 */
export async function saveCompanyProfileToFirestore(profile: CompanyProfile): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, COMPANY_DOC_ID);
  const cleanProfile = removeUndefinedValues(profile);
  await setDoc(docRef, { ...cleanProfile, updatedAt: new Date().toISOString() }, { merge: true });
}

/**
 * Real-time listener for products collection
 */
export function subscribeToProducts(
  onSuccess: (products: Product[]) => void,
  onError: (error: Error) => void
) {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as Product), id: docSnap.id });
      });
      // Sort by order or name
      items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      onSuccess(items);
    },
    (err) => {
      console.error('Firestore products subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Real-time listener for categories collection
 */
export function subscribeToCategories(
  onSuccess: (categories: Category[]) => void,
  onError: (error: Error) => void
) {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as Category), id: docSnap.id });
      });
      items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      onSuccess(items);
    },
    (err) => {
      console.error('Firestore categories subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Seed initial data to Firestore if collections are empty
 */
export async function initializeFirestoreDataIfEmpty(): Promise<boolean> {
  try {
    const productsSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const categoriesSnap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, COMPANY_DOC_ID);
    const settingsDocSnap = await getDoc(settingsDocRef);

    const batch = writeBatch(db);
    let needCommit = false;

    if (categoriesSnap.empty) {
      console.log('Seeding initial categories to Firestore...');
      INITIAL_CATEGORIES.forEach((cat, index) => {
        const docRef = doc(db, CATEGORIES_COLLECTION, cat.id);
        batch.set(docRef, { ...cat, order: index + 1 });
      });
      needCommit = true;
    }

    if (productsSnap.empty) {
      console.log('Seeding initial products to Firestore...');
      INITIAL_PRODUCTS.forEach((prod, index) => {
        const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
        batch.set(docRef, { ...prod, order: index + 1 });
      });
      needCommit = true;
    }

    // Only seed company profile if it doesn't exist yet
    if (!settingsDocSnap.exists()) {
      console.log('Seeding initial company profile to Firestore...');
      batch.set(settingsDocRef, COMPANY_INFO);
      needCommit = true;
    }

    if (needCommit) {
      await batch.commit();
      console.log('Firestore initial seeding completed successfully.');
      return true;
    }
  } catch (error) {
    console.error('Error initializing Firestore data:', error);
  }
  return false;
}

/**
 * Save / Update a single product in Firestore
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
  await setDoc(docRef, removeUndefinedValues(product), { merge: true });
}

/**
 * Delete a product from Firestore
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await deleteDoc(docRef);
}

/**
 * Save / Update a single category in Firestore
 */
export async function saveCategoryToFirestore(category: Category): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, category.id);
  await setDoc(docRef, removeUndefinedValues(category), { merge: true });
}

/**
 * Delete a category from Firestore
 */
export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
  await deleteDoc(docRef);
}

/**
 * Batch update products (e.g. on reorder or import)
 */
export async function batchSaveProductsToFirestore(products: Product[]): Promise<void> {
  const batch = writeBatch(db);
  products.forEach((prod, idx) => {
    const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
    batch.set(docRef, { ...prod, order: idx + 1 });
  });
  await batch.commit();
}

/**
 * Batch update categories
 */
export async function batchSaveCategoriesToFirestore(categories: Category[]): Promise<void> {
  const batch = writeBatch(db);
  categories.forEach((cat, idx) => {
    const docRef = doc(db, CATEGORIES_COLLECTION, cat.id);
    batch.set(docRef, { ...cat, order: idx + 1 });
  });
  await batch.commit();
}

/**
 * Reset Firestore to factory defaults
 */
export async function resetFirestoreToFactory(): Promise<void> {
  // Delete existing
  const productsSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
  const categoriesSnap = await getDocs(collection(db, CATEGORIES_COLLECTION));

  const deleteBatch = writeBatch(db);
  productsSnap.forEach((d) => deleteBatch.delete(d.ref));
  categoriesSnap.forEach((d) => deleteBatch.delete(d.ref));
  await deleteBatch.commit();

  // Re-seed
  const seedBatch = writeBatch(db);
  INITIAL_CATEGORIES.forEach((cat, index) => {
    const docRef = doc(db, CATEGORIES_COLLECTION, cat.id);
    seedBatch.set(docRef, { ...cat, order: index + 1 });
  });
  INITIAL_PRODUCTS.forEach((prod, index) => {
    const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
    seedBatch.set(docRef, { ...prod, order: index + 1 });
  });
  await seedBatch.commit();
}

/**
 * Subscribe to admin auth settings (verified email, password)
 */
export function subscribeToAdminAuth(
  onSuccess: (authSettings: AdminAuthSettings) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, ADMIN_AUTH_DOC_ID);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onSuccess(docSnap.data() as AdminAuthSettings);
      } else {
        // Return default verified admin settings
        onSuccess({
          email: DEFAULT_ADMIN_EMAIL,
          isEmailVerified: true,
          password: DEFAULT_ADMIN_PASSWORD,
        });
      }
    },
    (err) => {
      console.error('Firestore admin auth subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save Admin Auth Settings to Firestore (Email & Password)
 */
export async function saveAdminAuthToFirestore(authSettings: AdminAuthSettings): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, ADMIN_AUTH_DOC_ID);
  await setDoc(
    docRef,
    {
      ...authSettings,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Restore Full System Backup (Company Profile + Categories + Products)
 */
export async function restoreFullBackupToFirestore(backupData: SystemBackupData): Promise<void> {
  const { products, categories, companyProfile } = backupData;

  // Clear existing products & categories
  const productsSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
  const categoriesSnap = await getDocs(collection(db, CATEGORIES_COLLECTION));

  const deleteBatch = writeBatch(db);
  productsSnap.forEach((d) => deleteBatch.delete(d.ref));
  categoriesSnap.forEach((d) => deleteBatch.delete(d.ref));
  await deleteBatch.commit();

  // Write new restored data
  const restoreBatch = writeBatch(db);

  if (categories && categories.length > 0) {
    categories.forEach((cat, idx) => {
      const docRef = doc(db, CATEGORIES_COLLECTION, cat.id);
      restoreBatch.set(docRef, { ...cat, order: cat.order ?? idx + 1 });
    });
  }

  if (products && products.length > 0) {
    products.forEach((prod, idx) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
      restoreBatch.set(docRef, { ...prod, order: prod.order ?? idx + 1 });
    });
  }

  if (companyProfile) {
    const compDocRef = doc(db, SETTINGS_COLLECTION, COMPANY_DOC_ID);
    restoreBatch.set(compDocRef, {
      ...companyProfile,
      updatedAt: new Date().toISOString(),
    });
  }

  await restoreBatch.commit();
}

/**
 * Real-time listener for Bank Accounts
 */
export function subscribeToBankAccounts(
  onSuccess: (accounts: BankPaymentAccount[]) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, BANK_SETTINGS_DOC_ID);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.accounts) && data.accounts.length > 0) {
          onSuccess(data.accounts as BankPaymentAccount[]);
          return;
        }
      }
      // Return default bank accounts
      onSuccess(INITIAL_BANK_ACCOUNTS);
    },
    (err) => {
      console.error('Firestore bank accounts subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save / Update Bank Accounts List in Firestore
 */
export async function saveBankAccountsToFirestore(accounts: BankPaymentAccount[]): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, BANK_SETTINGS_DOC_ID);
  await setDoc(
    docRef,
    {
      accounts,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Real-time listener for Orders collection
 */
export function subscribeToOrders(
  onSuccess: (orders: Order[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, ORDERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Order[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as Order), id: docSnap.id });
      });
      // Sort by newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onSuccess(items);
    },
    (err) => {
      console.error('Firestore orders subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Deeply removes all undefined properties recursively from an object
 * because Firestore does not support undefined field values.
 */
export function removeUndefinedValues<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedValues(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Save new Order to Firestore
 */
export async function saveOrderToFirestore(order: Order): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, order.id);
  const cleanOrder = removeUndefinedValues(order);
  await setDoc(docRef, { ...cleanOrder, updatedAt: new Date().toISOString() });
}

/**
 * Update Order status in Firestore
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  newStatus: Order['status']
): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await setDoc(docRef, { status: newStatus, updatedAt: new Date().toISOString() }, { merge: true });
}
