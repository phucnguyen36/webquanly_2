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

// Active Google Cloud Firestore Database ID with permanent read/write access
const customDbId = (firebaseConfigJson as any)?.firestoreDatabaseId || "ai-studio-phttrinbnthn-8807863b-b799-48b6-9223-f8e98883d044";

export const db = getFirestore(app, customDbId);
export const auth = getAuth(app);

// Dedicated namespace collections for Deep Focus OS CRM
export const COLL_CLIENTS = 'crm_clients';
export const COLL_STAFF = 'crm_staff';
export const COLL_TASKS = 'crm_tasks';
export const COLL_PROFILE = 'crm_profile';

// Enable IndexedDB persistence for offline & background sync
try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) {}

/**
 * Loads all data from Firestore Cloud.
 * If Cloud database is empty, automatically restores / seeds from user's localStorage (or INITIAL data).
 */
export async function loadWorkspaceData() {
  const timeoutMs = 8000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Cloud Firestore connection timeout')), timeoutMs)
  );

  const fetchDataPromise = (async () => {
    const clientsSnap = await getDocs(collection(db, COLL_CLIENTS));
    const staffSnap = await getDocs(collection(db, COLL_STAFF));
    const tasksSnap = await getDocs(collection(db, COLL_TASKS));
    const profileDocSnap = await getDoc(doc(db, COLL_PROFILE, 'settings'));

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

    // If Cloud Firestore is empty, preserve existing user data from localStorage
    if (clients.length === 0 && staff.length === 0 && tasks.length === 0) {
      let localClients: ClientObject[] = [];
      let localStaff: StaffObject[] = [];
      let localTasks: VideoTaskObject[] = [];
      try {
        const sc = localStorage.getItem('deep_focus_os_clients');
        if (sc) localClients = JSON.parse(sc);
        const ss = localStorage.getItem('deep_focus_os_staff');
        if (ss) localStaff = JSON.parse(ss);
        const st = localStorage.getItem('deep_focus_os_tasks');
        if (st) localTasks = JSON.parse(st);
      } catch (e) {}

      const seedClients = localClients.length > 0 ? localClients : INITIAL_CLIENTS;
      const seedStaff = localStaff.length > 0 ? localStaff : INITIAL_STAFF;
      const seedTasks = localTasks.length > 0 ? localTasks : INITIAL_TASKS;

      console.log('Cloud Firestore is initializing. Seeding workspace data to Cloud...', {
        clients: seedClients.length,
        tasks: seedTasks.length
      });

      const batch = writeBatch(db);

      seedClients.forEach(c => {
        batch.set(doc(db, COLL_CLIENTS, c.id), { 
          displayName: c.displayName, 
          tier: c.tier,
          ...(c.contractValue !== undefined ? { contractValue: c.contractValue } : {}),
          ...(c.currency ? { currency: c.currency } : {})
        });
      });

      seedStaff.forEach(s => {
        const data: any = {
          name: s.name,
          avatarUrl: s.avatarUrl,
          activeTaskCount: s.activeTaskCount,
          qualityScore: s.qualityScore,
          totalEarnings: s.totalEarnings
        };
        if (s.phone) data.phone = s.phone;
        if (s.role) data.role = s.role;
        batch.set(doc(db, COLL_STAFF, s.id), data);
      });

      seedTasks.forEach(t => {
        batch.set(doc(db, COLL_TASKS, t.id), {
          clientId: t.clientId,
          title: t.title,
          rawFootageLink: t.rawFootageLink || '',
          status: t.status,
          internalDeadline: t.internalDeadline,
          assignedEditorId: t.assignedEditorId,
          notes: t.notes || '',
          clientPay: t.clientPay,
          subPay: t.subPay,
          currency: t.currency || 'USD',
          clientPaidStatus: t.clientPaidStatus || 'Unpaid',
          subPaidStatus: t.subPaidStatus || 'Unpaid',
          roughCutUrl: t.roughCutUrl || '',
          finalUrl: t.finalUrl || ''
        });
      });

      await batch.commit();

      clients = [...seedClients];
      staff = [...seedStaff];
      tasks = [...seedTasks];
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
    const dRef = doc(db, COLL_CLIENTS, client.id);
    await setDoc(dRef, {
      displayName: client.displayName,
      tier: client.tier,
      ...(client.contractValue !== undefined ? { contractValue: client.contractValue } : {}),
      ...(client.currency ? { currency: client.currency } : {})
    });
  } catch (err) {
    console.error('Error saving client to Firestore:', err);
  }
}

export async function deleteClient(clientId: string) {
  try {
    await deleteDoc(doc(db, COLL_CLIENTS, clientId));
  } catch (err) {
    console.error('Error deleting client from Firestore:', err);
  }
}

// ---------------- STAFF HELPERS ----------------
export async function saveStaff(staffMember: StaffObject) {
  try {
    const dRef = doc(db, COLL_STAFF, staffMember.id);
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
    await deleteDoc(doc(db, COLL_STAFF, staffId));
  } catch (err) {
    console.error('Error deleting staff from Firestore:', err);
  }
}

// ---------------- TASK HELPERS ----------------
export async function saveTask(task: VideoTaskObject) {
  try {
    const dRef = doc(db, COLL_TASKS, task.id);
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
      currency: task.currency || 'USD',
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
    await deleteDoc(doc(db, COLL_TASKS, taskId));
  } catch (err) {
    console.error('Error deleting task from Firestore:', err);
  }
}

// ---------------- PROFILE HELPERS ----------------
export async function saveProfile(profile: UserProfile) {
  try {
    const dRef = doc(db, COLL_PROFILE, 'settings');
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
    currentClients.forEach(c => batch.delete(doc(db, COLL_CLIENTS, c.id)));
    currentStaff.forEach(s => batch.delete(doc(db, COLL_STAFF, s.id)));
    currentTasks.forEach(t => batch.delete(doc(db, COLL_TASKS, t.id)));
    await batch.commit();
  } catch (err) {
    console.error('Error clearing workspace data from Firestore:', err);
    throw err;
  }
}

export async function resetWorkspaceDataToDefault(currentClients: ClientObject[], currentStaff: StaffObject[], currentTasks: VideoTaskObject[]) {
  try {
    const batch = writeBatch(db);
    currentClients.forEach(c => batch.delete(doc(db, COLL_CLIENTS, c.id)));
    currentStaff.forEach(s => batch.delete(doc(db, COLL_STAFF, s.id)));
    currentTasks.forEach(t => batch.delete(doc(db, COLL_TASKS, t.id)));

    INITIAL_CLIENTS.forEach(c => {
      batch.set(doc(db, COLL_CLIENTS, c.id), { displayName: c.displayName, tier: c.tier });
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
      batch.set(doc(db, COLL_STAFF, s.id), data);
    });
    INITIAL_TASKS.forEach(t => {
      batch.set(doc(db, COLL_TASKS, t.id), {
        clientId: t.clientId,
        title: t.title,
        rawFootageLink: t.rawFootageLink,
        status: t.status,
        internalDeadline: t.internalDeadline,
        assignedEditorId: t.assignedEditorId,
        notes: t.notes,
        clientPay: t.clientPay,
        subPay: t.subPay,
        currency: t.currency || 'USD',
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

// ---------------- SYNC LOCAL DATA TO CLOUD FIRESTORE ----------------
export async function uploadLocalDataToCloud(clients: ClientObject[], staff: StaffObject[], tasks: VideoTaskObject[], profile?: UserProfile | null) {
  try {
    const batch = writeBatch(db);

    (clients || []).forEach(c => {
      if (c && c.id) {
        batch.set(doc(db, COLL_CLIENTS, c.id), {
          displayName: c.displayName,
          tier: c.tier,
          ...(c.contractValue !== undefined ? { contractValue: c.contractValue } : {}),
          ...(c.currency ? { currency: c.currency } : {})
        });
      }
    });

    (staff || []).forEach(s => {
      if (s && s.id) {
        const data: any = {
          name: s.name,
          avatarUrl: s.avatarUrl,
          activeTaskCount: s.activeTaskCount,
          qualityScore: s.qualityScore,
          totalEarnings: s.totalEarnings
        };
        if (s.phone) data.phone = s.phone;
        if (s.role) data.role = s.role;
        batch.set(doc(db, COLL_STAFF, s.id), data);
      }
    });

    (tasks || []).forEach(t => {
      if (t && t.id) {
        batch.set(doc(db, COLL_TASKS, t.id), {
          clientId: t.clientId,
          title: t.title,
          rawFootageLink: t.rawFootageLink || '',
          status: t.status,
          internalDeadline: t.internalDeadline,
          assignedEditorId: t.assignedEditorId,
          notes: t.notes || '',
          clientPay: t.clientPay,
          subPay: t.subPay,
          currency: t.currency || 'USD',
          clientPaidStatus: t.clientPaidStatus || 'Unpaid',
          subPaidStatus: t.subPaidStatus || 'Unpaid',
          roughCutUrl: t.roughCutUrl || '',
          finalUrl: t.finalUrl || ''
        });
      }
    });

    if (profile) {
      batch.set(doc(db, COLL_PROFILE, 'settings'), {
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        bio: profile.bio || '',
        focusMode: profile.focusMode,
        lowMarginAlert: profile.lowMarginAlert,
        denseLayout: profile.denseLayout,
        soundEnabled: profile.soundEnabled
      });
    }

    await batch.commit();
    return true;
  } catch (err) {
    console.error('Failed to upload local data to Cloud Firestore:', err);
    throw err;
  }
}
