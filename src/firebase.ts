/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection, writeBatch } from 'firebase/firestore';
import { ClientObject, VideoTaskObject, StaffObject } from './types';
import { UserProfile } from './components/ProfileSettingsModal';
import { INITIAL_CLIENTS, INITIAL_STAFF, INITIAL_TASKS } from './initialData';

const firebaseConfig = {
  apiKey: "AIzaSyAD7_8-bDvGEjfFO4jM5ejdMj0dgQvml1o",
  authDomain: "gen-lang-client-0696138502.firebaseapp.com",
  projectId: "gen-lang-client-0696138502",
  storageBucket: "gen-lang-client-0696138502.firebasestorage.app",
  messagingSenderId: "496717945327",
  appId: "1:496717945327:web:0e07107f9440aa1481be1a"
};

// Initialize Firebase and use the custom named databaseId
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-deepfocusos-8d2a0c52-22d7-4199-af13-489c44897f8c");

/**
 * Loads all data from Firestore.
 * If Firestore is completely empty, it seeds the database with INITIAL_CLIENTS, INITIAL_STAFF, and INITIAL_TASKS.
 */
export async function loadWorkspaceData() {
  try {
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

    // Check if we need to seed because Firestore is empty
    if (clients.length === 0 && staff.length === 0 && tasks.length === 0) {
      console.log('Firestore is empty. Seeding initial data...');
      const batch = writeBatch(db);

      // Seed clients
      INITIAL_CLIENTS.forEach(c => {
        const dRef = doc(db, 'clients', c.id);
        batch.set(dRef, { displayName: c.displayName, tier: c.tier });
      });

      // Seed staff
      INITIAL_STAFF.forEach(s => {
        const dRef = doc(db, 'staff', s.id);
        const data: any = {
          name: s.name,
          avatarUrl: s.avatarUrl,
          activeTaskCount: s.activeTaskCount,
          qualityScore: s.qualityScore,
          totalEarnings: s.totalEarnings
        };
        if (s.phone) data.phone = s.phone;
        if (s.role) data.role = s.role;
        batch.set(dRef, data);
      });

      // Seed tasks
      INITIAL_TASKS.forEach(t => {
        const dRef = doc(db, 'tasks', t.id);
        batch.set(dRef, {
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

      // Return seeded lists
      clients = [...INITIAL_CLIENTS];
      staff = [...INITIAL_STAFF];
      tasks = [...INITIAL_TASKS];
    }

    return { clients, staff, tasks, profile };
  } catch (error) {
    console.error('Failed to load workspace data from Firestore:', error);
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
      clientPaidStatus: task.clientPaidStatus,
      subPaidStatus: task.subPaidStatus,
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
    // Delete current items
    currentClients.forEach(c => batch.delete(doc(db, 'clients', c.id)));
    currentStaff.forEach(s => batch.delete(doc(db, 'staff', s.id)));
    currentTasks.forEach(t => batch.delete(doc(db, 'tasks', t.id)));

    // Add back the default seeds
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

