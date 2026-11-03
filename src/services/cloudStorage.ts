import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  query,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Account,
  AppSettings,
  Category,
  Profile,
  Transaction,
  CustomerUser,
  GlobalCategory,
  AppConfig,
  PlatformAnnouncement,
  AdminLog,
} from '../types';
import { User as FirebaseUser } from 'firebase/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const SUPER_ADMIN_EMAIL = 'anshul.kumar012@gmail.com';

export const DEFAULT_APP_CONFIG: AppConfig = {
  appName: 'Day to Day Expenses',
  appLogo: 'wallet',
  maintenanceMode: {
    enabled: false,
    message: 'We are currently performing scheduled maintenance to upgrade services. Please check back shortly.',
  },
  features: {
    voiceInput: true,
    standaloneDownload: true,
    pinLock: true,
    pdfExport: true,
    excelExport: true,
    customCategories: true,
  },
  supportedCurrencies: ['NPR', 'INR', 'USD', 'EUR', 'GBP'],
  supportedLanguages: ['en', 'hi'],
  updatedAt: new Date().toISOString(),
  updatedBy: 'System',
};

export const CloudStorageService = {
  // ==========================================
  // 1. CUSTOMER REAL-TIME PRIVATE LISTENERS
  // ==========================================

  /**
   * Listen to current user's profile status in real-time (to detect if active or suspended)
   */
  subscribeToUserAccount(
    userId: string,
    onData: (user: CustomerUser | null) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          onData(snap.data() as CustomerUser);
        } else {
          onData(null);
        }
      },
      (error) => {
        console.warn('User account snapshot error:', error.message);
        onError?.(error);
      }
    );
  },

  /**
   * Listen in real-time to all user's private collections
   */
  subscribeToUserData(
    userId: string,
    onData: {
      onTransactions: (txs: Transaction[]) => void;
      onCategories: (cats: Category[]) => void;
      onAccounts: (accs: Account[]) => void;
      onProfiles: (profs: Profile[]) => void;
      onSettings: (settings: Partial<AppSettings>) => void;
      onError?: (err: any) => void;
    }
  ): Unsubscribe {
    const unsubscribes: Unsubscribe[] = [];

    try {
      // 1. Transactions Listener
      const txRef = collection(db, 'users', userId, 'transactions');
      const unTx = onSnapshot(
        txRef,
        (snapshot) => {
          const list: Transaction[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Transaction);
          });
          list.sort((a, b) => {
            const dateCmp = (b.date || '').localeCompare(a.date || '');
            if (dateCmp !== 0) return dateCmp;
            return (b.time || '').localeCompare(a.time || '');
          });
          onData.onTransactions(list);
        },
        (error) => {
          console.warn('Transactions snapshot error:', error.message);
          onData.onError?.(error);
        }
      );
      unsubscribes.push(unTx);

      // 2. Categories Listener
      const catRef = collection(db, 'users', userId, 'categories');
      const unCat = onSnapshot(
        catRef,
        (snapshot) => {
          const list: Category[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Category);
          });
          if (list.length > 0) {
            onData.onCategories(list);
          }
        },
        (error) => {
          console.warn('Categories snapshot error:', error.message);
        }
      );
      unsubscribes.push(unCat);

      // 3. Accounts Listener
      const accRef = collection(db, 'users', userId, 'accounts');
      const unAcc = onSnapshot(
        accRef,
        (snapshot) => {
          const list: Account[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Account);
          });
          if (list.length > 0) {
            onData.onAccounts(list);
          }
        },
        (error) => {
          console.warn('Accounts snapshot error:', error.message);
        }
      );
      unsubscribes.push(unAcc);

      // 4. Profiles Listener
      const profRef = collection(db, 'users', userId, 'profiles');
      const unProf = onSnapshot(
        profRef,
        (snapshot) => {
          const list: Profile[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Profile);
          });
          if (list.length > 0) {
            onData.onProfiles(list);
          }
        },
        (error) => {
          console.warn('Profiles snapshot error:', error.message);
        }
      );
      unsubscribes.push(unProf);

      // 5. User Settings Listener
      const userDocRef = doc(db, 'users', userId);
      const unSettings = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            onData.onSettings(docSnap.data() as Partial<AppSettings>);
          }
        },
        (error) => {
          console.warn('Settings snapshot error:', error.message);
        }
      );
      unsubscribes.push(unSettings);
    } catch (e) {
      console.error('Failed to attach listeners:', e);
    }

    return () => {
      unsubscribes.forEach((un) => un());
    };
  },

  // ==========================================
  // 2. CUSTOMER RECORD MUTATIONS
  // ==========================================

  async saveTransaction(userId: string, tx: Transaction): Promise<void> {
    const path = `users/${userId}/transactions/${tx.id}`;
    try {
      const docRef = doc(db, 'users', userId, 'transactions', tx.id);
      const payload = {
        ...tx,
        userId,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteTransaction(userId: string, txId: string): Promise<void> {
    const path = `users/${userId}/transactions/${txId}`;
    try {
      const docRef = doc(db, 'users', userId, 'transactions', txId);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async saveCategory(userId: string, category: Category): Promise<void> {
    const path = `users/${userId}/categories/${category.id}`;
    try {
      const docRef = doc(db, 'users', userId, 'categories', category.id);
      await setDoc(docRef, { ...category, userId }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const path = `users/${userId}/categories/${categoryId}`;
    try {
      const docRef = doc(db, 'users', userId, 'categories', categoryId);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async saveAccount(userId: string, account: Account): Promise<void> {
    const path = `users/${userId}/accounts/${account.id}`;
    try {
      const docRef = doc(db, 'users', userId, 'accounts', account.id);
      await setDoc(docRef, { ...account, userId }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async saveProfile(userId: string, profile: Profile): Promise<void> {
    const path = `users/${userId}/profiles/${profile.id}`;
    try {
      const docRef = doc(db, 'users', userId, 'profiles', profile.id);
      await setDoc(docRef, { ...profile, userId }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async saveUserSettings(
    userId: string,
    settings: Partial<AppSettings>,
    email?: string,
    displayName?: string
  ): Promise<void> {
    const path = `users/${userId}`;
    try {
      const docRef = doc(db, 'users', userId);
      await setDoc(
        docRef,
        {
          ...settings,
          userId,
          email: email || '',
          displayName: displayName || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async getCloudTransactionCount(userId: string): Promise<number> {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'transactions'));
      return snap.size;
    } catch {
      return 0;
    }
  },

  async migrateLocalData(
    userId: string,
    data: {
      transactions: Transaction[];
      categories: Category[];
      accounts: Account[];
      profiles: Profile[];
      settings?: AppSettings;
    }
  ): Promise<{ importedCount: number }> {
    let imported = 0;
    const batch = writeBatch(db);

    const existingSnap = await getDocs(collection(db, 'users', userId, 'transactions'));
    const existingIds = new Set<string>();
    existingSnap.forEach((d) => existingIds.add(d.id));

    for (const tx of data.transactions) {
      if (!existingIds.has(tx.id)) {
        const ref = doc(db, 'users', userId, 'transactions', tx.id);
        batch.set(ref, { ...tx, userId });
        imported++;
      }
    }

    for (const cat of data.categories) {
      const ref = doc(db, 'users', userId, 'categories', cat.id);
      batch.set(ref, { ...cat, userId }, { merge: true });
    }

    for (const acc of data.accounts) {
      const ref = doc(db, 'users', userId, 'accounts', acc.id);
      batch.set(ref, { ...acc, userId }, { merge: true });
    }

    for (const prof of data.profiles) {
      const ref = doc(db, 'users', userId, 'profiles', prof.id);
      batch.set(ref, { ...prof, userId }, { merge: true });
    }

    if (data.settings) {
      const ref = doc(db, 'users', userId);
      batch.set(ref, { ...data.settings, userId }, { merge: true });
    }

    await batch.commit();
    return { importedCount: imported };
  },

  // ==========================================
  // 3. USER ONBOARDING & ADMIN PROVISIONING
  // ==========================================

  /**
   * Called on every login. Records or updates user record in /users/{uid}
   * and bootstraps /admins/{uid} if user is the designated Super Admin.
   */
  async recordUserSession(user: FirebaseUser): Promise<CustomerUser> {
    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
    const now = new Date().toISOString();
    const userDocRef = doc(db, 'users', user.uid);

    let existingData: Partial<CustomerUser> | null = null;
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        existingData = snap.data() as CustomerUser;
      }
    } catch {
      // ignore
    }

    const userData: CustomerUser = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || '',
      status: existingData?.status || 'active',
      role: isSuperAdmin ? 'admin' : (existingData?.role || 'customer'),
      createdAt: existingData?.createdAt || now,
      lastLoginAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(userDocRef, userData, { merge: true });
    } catch (e) {
      console.warn('Could not record user session:', e);
    }

    // If Super Admin, ensure admin registry doc exists in /admins/{uid}
    if (isSuperAdmin) {
      try {
        const adminDocRef = doc(db, 'admins', user.uid);
        await setDoc(adminDocRef, {
          uid: user.uid,
          email: user.email,
          role: 'super_admin',
          assignedAt: now,
        }, { merge: true });
      } catch (e) {
        console.warn('Could not ensure admin document:', e);
      }
    }

    return userData;
  },

  // ==========================================
  // 4. SUPER ADMIN: CUSTOMER MANAGEMENT
  // ==========================================

  /**
   * Fetch all registered customers
   */
  async fetchCustomers(): Promise<CustomerUser[]> {
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, path));
      const list: CustomerUser[] = [];
      snap.forEach((d) => {
        const data = d.data() as CustomerUser;
        list.push({
          uid: d.id,
          email: data.email || 'No email',
          displayName: data.displayName || 'User',
          photoURL: data.photoURL || '',
          status: data.status || 'active',
          role: data.role || 'customer',
          createdAt: data.createdAt || '',
          lastLoginAt: data.lastLoginAt || '',
        });
      });
      list.sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  /**
   * Toggle Customer Status: Activate or Suspend
   */
  async setUserStatus(
    admin: FirebaseUser,
    targetUid: string,
    targetEmail: string,
    status: 'active' | 'suspended',
    reason?: string
  ): Promise<void> {
    const path = `users/${targetUid}`;
    try {
      const ref = doc(db, 'users', targetUid);
      await setDoc(ref, { status, updatedAt: new Date().toISOString() }, { merge: true });

      // Log to admin activity logs
      await this.logAdminAction(admin, {
        action: status === 'suspended' ? 'SUSPEND_CUSTOMER' : 'ACTIVATE_CUSTOMER',
        details: `Customer [${targetEmail}] status changed to ${status.toUpperCase()}${reason ? ` (${reason})` : ''}`,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // ==========================================
  // 5. GLOBAL CATEGORIES (SYNCED TO ALL CUSTOMERS)
  // ==========================================

  subscribeToGlobalCategories(
    onData: (categories: GlobalCategory[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    const catRef = collection(db, 'global_categories');
    return onSnapshot(
      catRef,
      (snap) => {
        const list: GlobalCategory[] = [];
        snap.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as GlobalCategory);
        });
        list.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
        onData(list);
      },
      (error) => {
        console.warn('Global categories snapshot error:', error.message);
        onError?.(error);
      }
    );
  },

  async saveGlobalCategory(admin: FirebaseUser, category: GlobalCategory): Promise<void> {
    const path = `global_categories/${category.id}`;
    try {
      const ref = doc(db, 'global_categories', category.id);
      const now = new Date().toISOString();
      const payload: GlobalCategory = {
        ...category,
        updatedAt: now,
        createdAt: category.createdAt || now,
      };
      await setDoc(ref, payload, { merge: true });

      await this.logAdminAction(admin, {
        action: 'SAVE_GLOBAL_CATEGORY',
        details: `Saved global category: ${category.name} (${category.type})`,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async toggleArchiveGlobalCategory(
    admin: FirebaseUser,
    categoryId: string,
    categoryName: string,
    isArchived: boolean
  ): Promise<void> {
    const path = `global_categories/${categoryId}`;
    try {
      const ref = doc(db, 'global_categories', categoryId);
      await setDoc(ref, { isArchived, updatedAt: new Date().toISOString() }, { merge: true });

      await this.logAdminAction(admin, {
        action: isArchived ? 'ARCHIVE_GLOBAL_CATEGORY' : 'UNARCHIVE_GLOBAL_CATEGORY',
        details: `${isArchived ? 'Archived' : 'Unarchived'} global category: ${categoryName} (Preserving all historical transactions)`,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteGlobalCategory(admin: FirebaseUser, categoryId: string, categoryName: string): Promise<void> {
    const path = `global_categories/${categoryId}`;
    try {
      const ref = doc(db, 'global_categories', categoryId);
      await deleteDoc(ref);

      await this.logAdminAction(admin, {
        action: 'DELETE_GLOBAL_CATEGORY',
        details: `Deleted global category definition: ${categoryName}`,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  /**
   * Auto-seed standard starter categories into global_categories if empty
   */
  async seedStarterGlobalCategories(admin: FirebaseUser, starterCategories: Category[]): Promise<number> {
    try {
      const existing = await getDocs(collection(db, 'global_categories'));
      if (existing.size > 0) return 0;

      const batch = writeBatch(db);
      let count = 0;
      starterCategories.forEach((cat, idx) => {
        const ref = doc(db, 'global_categories', cat.id);
        const payload: GlobalCategory = {
          id: cat.id,
          name: cat.name,
          nameHi: cat.nameHi,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          isArchived: false,
          order: idx,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        batch.set(ref, payload);
        count++;
      });
      await batch.commit();

      await this.logAdminAction(admin, {
        action: 'SEED_GLOBAL_CATEGORIES',
        details: `Seeded ${count} standard global categories across all customers`,
      });
      return count;
    } catch (e) {
      console.warn('Could not seed global categories:', e);
      return 0;
    }
  },

  // ==========================================
  // 6. GLOBAL APP CONFIG & MAINTENANCE MODE
  // ==========================================

  subscribeToAppConfig(
    onData: (config: AppConfig) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    const ref = doc(db, 'app_config', 'global');
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          onData(snap.data() as AppConfig);
        } else {
          onData(DEFAULT_APP_CONFIG);
        }
      },
      (error) => {
        console.warn('App config snapshot error:', error.message);
        onError?.(error);
      }
    );
  },

  async saveAppConfig(admin: FirebaseUser, config: Partial<AppConfig>): Promise<void> {
    const path = 'app_config/global';
    try {
      const ref = doc(db, path);
      const payload = {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: admin.email || 'Admin',
      };
      await setDoc(ref, payload, { merge: true });

      await this.logAdminAction(admin, {
        action: 'UPDATE_APP_CONFIG',
        details: `Updated platform configuration (Maintenance: ${config.maintenanceMode?.enabled ? 'ENABLED' : 'DISABLED'})`,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // ==========================================
  // 7. BROADCAST ANNOUNCEMENTS
  // ==========================================

  subscribeToAnnouncements(
    onData: (announcements: PlatformAnnouncement[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    const ref = collection(db, 'announcements');
    return onSnapshot(
      ref,
      (snap) => {
        const list: PlatformAnnouncement[] = [];
        snap.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as PlatformAnnouncement);
        });
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onData(list);
      },
      (error) => {
        console.warn('Announcements snapshot error:', error.message);
        onError?.(error);
      }
    );
  },

  async saveAnnouncement(admin: FirebaseUser, announcement: PlatformAnnouncement): Promise<void> {
    const path = `announcements/${announcement.id}`;
    try {
      const ref = doc(db, 'announcements', announcement.id);
      await setDoc(ref, { ...announcement, updatedAt: new Date().toISOString() }, { merge: true });

      await this.logAdminAction(admin, {
        action: 'PUBLISH_ANNOUNCEMENT',
        details: `Published announcement [${announcement.title}] (${announcement.type})`,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteAnnouncement(admin: FirebaseUser, announcementId: string, title: string): Promise<void> {
    const path = `announcements/${announcementId}`;
    try {
      const ref = doc(db, 'announcements', announcementId);
      await deleteDoc(ref);

      await this.logAdminAction(admin, {
        action: 'DELETE_ANNOUNCEMENT',
        details: `Removed announcement [${title}]`,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // ==========================================
  // 8. ADMIN ACTIVITY AUDIT LOGS
  // ==========================================

  subscribeToAdminLogs(
    onData: (logs: AdminLog[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    const q = query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(
      q,
      (snap) => {
        const list: AdminLog[] = [];
        snap.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as AdminLog);
        });
        onData(list);
      },
      (error) => {
        console.warn('Admin logs snapshot error:', error.message);
        onError?.(error);
      }
    );
  },

  async logAdminAction(
    admin: FirebaseUser,
    data: { action: string; details: string }
  ): Promise<void> {
    const path = 'admin_logs';
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = doc(db, 'admin_logs', logId);
      const logEntry: AdminLog = {
        id: logId,
        adminUid: admin.uid,
        adminEmail: admin.email || 'Admin',
        action: data.action,
        details: data.details,
        timestamp: new Date().toISOString(),
      };
      await setDoc(ref, logEntry);
    } catch (e) {
      console.warn('Could not write admin log:', e);
    }
  },
};
