import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/firebase';

export const useClientsStore = defineStore('clients', () => {
  const clients = ref([]);
  const loading = ref(false);
  const ready = ref(false);
  const error = ref(null);
  const user = ref(null);

  let unsubscribeSnapshot = null;
  let unsubscribeAuth = null;
  let isSubscribed = false;
  let currentUserId = null;

  const normalizeClient = (docSnap) => {
    const data = docSnap.data() || {};
    return {
      id: docSnap.id,
      ...data,
      isArchived: data.isArchived ?? false
    };
  };

  const activeClients = computed(() => clients.value.filter((client) => !client.isArchived));
  const archivedClients = computed(() => clients.value.filter((client) => client.isArchived));
  const getClientById = (id) => clients.value.find((client) => client.id === id);

  const clearState = () => {
    clients.value = [];
    loading.value = false;
    ready.value = false;
    error.value = null;
    currentUserId = null;
  };

  const setSnapshot = (userId) => {
    if (!userId) return;
    if (currentUserId === userId && unsubscribeSnapshot) return;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    currentUserId = userId;
    loading.value = true;
    ready.value = false;
    error.value = null;

    const clientsQuery = query(collection(db, 'users', userId, 'clients'), orderBy('name'));
    unsubscribeSnapshot = onSnapshot(
      clientsQuery,
      (snapshot) => {
        clients.value = snapshot.docs.map(normalizeClient);
        loading.value = false;
        ready.value = true;
      },
      (err) => {
        console.error('Ошибка синхронизации клиентов:', err);
        error.value = err;
        loading.value = false;
        ready.value = true;
      }
    );
  };

  const subscribeClients = () => {
    if (isSubscribed) return;
    isSubscribed = true;

    unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;
      if (!currentUser) {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        clearState();
        return;
      }
      setSnapshot(currentUser.uid);
    });
  };

  const unsubscribeClients = () => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    if (unsubscribeAuth) {
      unsubscribeAuth();
      unsubscribeAuth = null;
    }
    isSubscribed = false;
    user.value = null;
    clearState();
  };

  const addClient = async ({ name, phone, notes } = {}) => {
    if (!user.value) return null;
    const trimmedName = (name || '').trim();
    if (!trimmedName) return null;

    const docRef = doc(collection(db, 'users', user.value.uid, 'clients'));
    const clientRecord = {
      name: trimmedName,
      ...(phone ? { phone } : {}),
      ...(notes ? { notes } : {}),
      isArchived: false
    };

    await setDoc(docRef, clientRecord);
    return docRef.id;
  };

  const updateClient = async (id, { name, phone, notes } = {}) => {
    if (!user.value || !id) return;
    const trimmedName = name !== undefined ? name.trim() : undefined;
    const updatePayload = {
      ...(trimmedName ? { name: trimmedName } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(notes !== undefined ? { notes } : {})
    };
    if (!Object.keys(updatePayload).length) return;
    await updateDoc(doc(db, 'users', user.value.uid, 'clients', id), updatePayload);
  };

  const archiveClient = async (id) => {
    if (!user.value || !id) return;
    await updateDoc(doc(db, 'users', user.value.uid, 'clients', id), {
      isArchived: true,
      archivedAt: serverTimestamp()
    });
  };

  const unarchiveClient = async (id) => {
    if (!user.value || !id) return;
    await updateDoc(doc(db, 'users', user.value.uid, 'clients', id), {
      isArchived: false,
      archivedAt: null
    });
  };

  return {
    clients,
    loading,
    ready,
    error,
    user,
    activeClients,
    archivedClients,
    getClientById,
    subscribeClients,
    unsubscribeClients,
    addClient,
    updateClient,
    archiveClient,
    unarchiveClient
  };
});
