/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, 
  collection, writeBatch, enableIndexedDbPersistence 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigJson from '../firebase-applet-config.json';
import { ClientObject, VideoTaskObject, StaffObject } from './types';
import { UserProfile } from './components/ProfileSettingsModal';
import { INITIAL_CLIENTS, INITIAL_STAFF, INITIAL_TASKS } from './initialData';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || "AIzaSyAD7_8-bDvGEjfFO4jM5ejdMj0dgQvml1o",
  authDomain: firebaseConfigJson.authDomain || "gen-lang-client-0696138502.firebaseapp.com",
  projectId: firebaseConfigJson.projectId || "gen-lang-client-0696138502",
  storageBucket: firebaseConfigJson.storageBucket || "gen-lang-client-0696138502.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "496717945327",
  appId: firebaseConfigJson.appId || "1:496717945327:web:0e07107f9440aa1481be1a"
};

const app = initializeApp(firebaseConfig);

// Try using Google AI Studio's assigned custom database ID, fallback to default
let firestoreDb: any;
try {
  const customDbId = firebaseConfigJson.firestoreDatabaseId || "ai-studio-deepfocusos-8d2a0c52-22d7-4199-af13-489c44897f8c";
  firestoreDb = getFirestore(app, customDbId);
} catch (e) {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const auth = getAuth(app);

// Enable IndexedDB persistence for offline & background sync
try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) {}

/**
 * Loads all data from Firestore Cloud.
 * First attempts to query Google AI Studio's Firestore Database.
 * If network hangs or times out (> 4s), it gracefully falls back to local data cache.
 */
export async function loadWorkspaceData() {
  const timeoutMs = 4000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Cloud Firestore connection timeout')), timeoutMs)
  );

  const fetchDataPromise = (async () => {
    const clientsSnap = await getDocs(collection(db, 'clients'));
    const staffSnap = await getDocs(collection(db, 'staff'));
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    const profileDocSnap = await getDoc(doc(db, 'profile', 'settings'));

    let clients: ClientObject[] = [];
    let staff: StaffObject[] = [];
    let tasks: VideoTaskObject[] = [];
    let profile: UserProfile | null = null;

    clientsSnap.forEach(doc => clients.push({ id: doc.id, ...doc.data() } as ClientObject));
    staffSnap.forEach(doc => staff.push({ id: doc.id, ...doc.data() } as StaffObject));
    tasksSnap.forEach(doc => tasks.push({ id: doc.id, ...doc.data() } as VideoTaskObject));

    if (profileDocSnap.exists()) {
      profile = profileDocSnap.data() as UserProfile;
    }

    // Seed initial data to Cloud Firestore if database is brand new
    if (clients.length === 0 && staff.length === 0 && tasks.length === 0) {
      console.log('Cloud Firestore is empty. Seeding initial data to Cloud...');
      const batch = writeBatch(db);

      INITIAL_CLIENTS.forEach(c => {
        batch.set(doc(db, 'clients', c.id), { displayName: c.displayName, tier: c.tier });
      });

      INITIAL_STAFF.forEach(s => {
        const data: any = {
          name: s.name,
          avatarUrl: s.avatarUrl,
          activeTaskCount: s.activeTaskCount,
          qualityScore: s.qualityScore,
          totalEarnings: s.totalEarnings
        };
        if (s.phone) data.phone = s.phone;
        if (s.role) data.role = s.role;
        batch.set(doc(db, 'staff', s.id), data);
      });

      INITIAL_TASKS.forEach(t => {
        batch.set(doc(db, 'tasks', t.id), {
          clientId: t.clientId,
          title: t.title,
          rawFootageLink: t.rawFootageLink,
          status: t.status,
          internalDeadline: t.internalDeadline,
          assignedEditorId: t.assignedEditorId,
          notes: t.notes,
          clientPay: t.clientPay,
          subPay: t.subPay,
          clientPaidStatus: t.clientPaidStatus,
          subPaidStatus: t.subPaidStatus,
          roughCutUrl: t.roughCutUrl || '',
          finalUrl: t.finalUrl || ''
        });
      });

      await batch.commit();

      clients = [...INITIAL_CLIENTS];
      staff = [...INITIAL_STAFF];
      tasks = [...INITIAL_TASKS];
    }

    return { clients, staff, tasks, profile };
  })();

  try {
    const data: any = await Promise.race([fetchDataPromise, timeoutPromise]);
    return data;
  } catch (error) {
    console.warn('Cloud Firestore connection attempt failed, using local cache:', error);
    throw error;
  }
}

// ---------------- CLIENT HELPERS ----------------
export async function saveClient(client: ClientObject) {
  try {
    const dRef = doc(db, 'clients', client.id);
    await setDoc(dRef, {
      displayName: client.displayName,
      tier: client.tier,
      ...(client.contractValue !== undefined ? { contractValue: client.contractValue } : {})
    });
  } catch (err) {
    console.error('Error saving client to Firestore:', err);
  }
}

export async function deleteClient(clientId: string) {
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (err) {
    console.error('Error deleting client from Firestore:', err);
  }
}

// ---------------- STAFF HELPERS ----------------
export async function saveStaff(staffMember: StaffObject) {
  try {
    const dRef = doc(db, 'staff', staffMember.id);
    const data: any = {
      name: staffMember.name,
      avatarUrl: staffMember.avatarUrl,
      activeTaskCount: staffMember.activeTaskCount,
      qualityScore: staffMember.qualityScore,
      totalEarnings: staffMember.totalEarnings
    };
    if (staffMember.phone) data.phone = staffMember.phone;
    if (staffMember.role) data.role = staffMember.role;
    await setDoc(dRef, data);
  } catch (err) {
    console.error('Error saving staff to Firestore:', err);
  }
}

export async function deleteStaff(staffId: string) {
  try {
    await deleteDoc(doc(db, 'staff', staffId));
  } catch (err) {
    console.error('Error deleting staff from Firestore:', err);
  }
}

// ---------------- TASK HELPERS ----------------
export async function saveTask(task: VideoTaskObject) {
  try {
    const dRef = doc(db, 'tasks', task.id);
    await setDoc(dRef, {
      clientId: task.clientId,
      title: task.title,
      rawFootageLink: task.rawFootageLink || '',
      status: task.status,
      internalDeadline: task.internalDeadline,
      assignedEditorId: task.assignedEditorId,
      notes: task.notes || '',
      clientPay: task.clientPay,
      subPay: task.subPay,
      clientPaidStatus: task.clientPaidStatus || 'Unpaid',
      subPaidStatus: task.subPaidStatus || 'Unpaid',
      roughCutUrl: task.roughCutUrl || '',
      finalUrl: task.finalUrl || ''
    });
  } catch (err) {
    console.error('Error saving task to Firestore:', err);
  }
}

export async function deleteTask(taskId: string) {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (err) {
    console.error('Error deleting task from Firestore:', err);
  }
}

// ---------------- PROFILE HELPERS ----------------
export async function saveProfile(profile: UserProfile) {
  try {
    const dRef = doc(db, 'profile', 'settings');
    await setDoc(dRef, {
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      role: profile.role,
      bio: profile.bio || '',
      focusMode: profile.focusMode,
      lowMarginAlert: profile.lowMarginAlert,
      denseLayout: profile.denseLayout,
      soundEnabled: profile.soundEnabled
    });
  } catch (err) {
    console.error('Error saving profile settings to Firestore:', err);
  }
}

// ---------------- WORKSPACE RESET & CLEAR HELPERS ----------------
export async function clearAllWorkspaceData(currentClients: ClientObject[], currentStaff: StaffObject[], currentTasks: VideoTaskObject[]) {
  try {
    const batch = writeBatch(db);
    currentClients.forEach(c => batch.delete(doc(db, 'clients', c.id)));
    currentStaff.forEach(s => batch.delete(doc(db, 'staff', s.id)));
    currentTasks.forEach(t => batch.delete(doc(db, 'tasks', t.id)));
    await batch.commit();
  } catch (err) {
    console.error('Error clearing workspace data from Firestore:', err);
    throw err;
  }
}

export async function resetWorkspaceDataToDefault(currentClients: ClientObject[], currentStaff: StaffObject[], currentTasks: VideoTaskObject[]) {
  try {
    const batch = writeBatch(db);
    currentClients.forEach(c => batch.delete(doc(db, 'clients', c.id)));
    currentStaff.forEach(s => batch.delete(doc(db, 'staff', s.id)));
    currentTasks.forEach(t => batch.delete(doc(db, 'tasks', t.id)));

    INITIAL_CLIENTS.forEach(c => {
      batch.set(doc(db, 'clients', c.id), { displayName: c.displayName, tier: c.tier });
    });
    INITIAL_STAFF.forEach(s => {
      const data: any = {
        name: s.name,
        avatarUrl: s.avatarUrl,
        activeTaskCount: s.activeTaskCount,
        qualityScore: s.qualityScore,
        totalEarnings: s.totalEarnings
      };
      if (s.phone) data.phone = s.phone;
      if (s.role) data.role = s.role;
      batch.set(doc(db, 'staff', s.id), data);
    });
    INITIAL_TASKS.forEach(t => {
      batch.set(doc(db, 'tasks', t.id), {
        clientId: t.clientId,
        title: t.title,
        rawFootageLink: t.rawFootageLink,
        status: t.status,
        internalDeadline: t.internalDeadline,
        assignedEditorId: t.assignedEditorId,
        notes: t.notes,
        clientPay: t.clientPay,
        subPay: t.subPay,
        clientPaidStatus: t.clientPaidStatus,
        subPaidStatus: t.subPaidStatus,
        roughCutUrl: t.roughCutUrl || '',
        finalUrl: t.finalUrl || ''
      });
    });

    await batch.commit();
  } catch (err) {
    console.error('Error resetting workspace data in Firestore:', err);
    throw err;
  }
}
