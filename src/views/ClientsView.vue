<template>
  <div class="clients-view-wrapper">
    <div class="clients-toolbar px-4 py-3 d-flex align-center justify-space-between bg-surface">
      <div class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-account-group-outline</v-icon>
        <div>
          <div class="text-subtitle-1 font-weight-bold">Клиенты</div>
          <div class="text-caption text-medium-emphasis">
            {{ showArchived ? 'Показаны архивные' : 'Активные клиенты' }}
          </div>
        </div>
      </div>
    </div>

    <div class="clients-list-container">
      <div v-if="!isLoggedIn" class="empty-state">
        <v-icon size="48">mdi-lock-outline</v-icon>
        <h3 class="mt-4">Нужен вход</h3>
        <p>Войдите, чтобы работать со списком клиентов.</p>
        <v-btn class="mt-4" color="primary" to="/settings">Перейти в настройки</v-btn>
      </div>

      <div v-else-if="loading && !clients.length" class="empty-state">
        <v-icon size="48">mdi-timer-sand</v-icon>
        <h3 class="mt-4">Загрузка...</h3>
        <p>Список клиентов загружается.</p>
      </div>

      <div v-else class="clients-content">
        <div class="px-4 pt-3 d-flex flex-column" style="gap: 12px;">
          <v-text-field
            v-model="localSearch"
            label="Поиск по имени или телефону"
            clearable
            density="comfortable"
            hide-details
          />
          <div class="d-flex align-center justify-space-between">
            <v-switch v-model="showArchived" color="primary" inset hide-details label="Показывать архивные" />
            <div class="text-caption text-medium-emphasis">
              {{ filteredClients.length }} найдено
            </div>
          </div>
        </div>

        <div v-if="!filteredClients.length" class="empty-state">
          <v-icon size="48">mdi-account-search-outline</v-icon>
          <h3 class="mt-4">Клиенты не найдены</h3>
          <p>Попробуйте изменить запрос или добавьте нового клиента.</p>
        </div>

        <v-list v-else class="clients-list" lines="two">
          <v-list-item v-for="client in filteredClients" :key="client.phone || client.id" class="client-card-item">
            <v-list-item-title class="client-name-line">
              <span class="font-weight-bold text-truncate">{{ client.name }}</span>
              <span v-if="client.lastName" class="ml-1 font-weight-bold text-truncate">{{ client.lastName }}</span>
              <v-chip v-if="client.isArchived" size="x-small" color="warning" variant="tonal" class="ml-2">Архив</v-chip>
            </v-list-item-title>

            <v-list-item-subtitle class="d-flex align-center">
              <span>{{ client.phone || 'Телефон не указан' }}</span>
              <v-spacer />
              <span v-if="client.notes" class="text-caption text-medium-emphasis text-truncate">
                {{ client.notes }}
              </span>
            </v-list-item-subtitle>

            <template #append>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props" />
                </template>

                <v-list>
                  <v-list-item @click="openEditDialog(client)">
                    <v-list-item-title>Редактировать</v-list-item-title>
                    <template #prepend><v-icon>mdi-pencil</v-icon></template>
                  </v-list-item>

                  <v-list-item @click="createOrderForClient(client)">
                    <v-list-item-title>Новый заказ</v-list-item-title>
                    <template #prepend><v-icon>mdi-plus</v-icon></template>
                  </v-list-item>

                  <v-list-item v-if="!client.isArchived" @click="archiveClient(client)" color="warning">
                    <v-list-item-title>В архив</v-list-item-title>
                    <template #prepend><v-icon>mdi-archive-arrow-down-outline</v-icon></template>
                  </v-list-item>

                  <v-list-item v-else @click="unarchiveClient(client)" color="success">
                    <v-list-item-title>Вернуть из архива</v-list-item-title>
                    <template #prepend><v-icon>mdi-archive-arrow-up-outline</v-icon></template>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </div>

    <ClientFormDialog v-model="isDialogOpen" :client="editingClient" @save="handleSave" />

    <v-fab-transition>
      <v-btn
        v-if="isLoggedIn"
        position="fixed"
        location="bottom right"
        icon="mdi-plus"
        size="x-large"
        color="primary"
        elevation="4"
        class="mb-4 mr-4"
        style="bottom: 80px; z-index: 90;"
        @click="openCreateDialog"
      />
    </v-fab-transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useAuthStore } from '@/stores/authStore';
import { useClientsStore } from '@/stores/clientsStore';

import ClientFormDialog from '@/components/ClientFormDialog.vue';

const router = useRouter();
const authStore = useAuthStore();
const clientsStore = useClientsStore();

const { clients, loading } = storeToRefs(clientsStore);

const showArchived = ref(false);
const localSearch = ref('');
const isDialogOpen = ref(false);
const editingClient = ref(null);

const isLoggedIn = computed(() => authStore.isAuthenticated);

const filteredClients = computed(() => {
  const query = (localSearch.value || '').trim().toLowerCase();

  const source = showArchived.value ? clients.value : clientsStore.activeItems;

  if (!query) {
    return [...source].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  // можно использовать clientsStore.searchClients(query), но тут оставил фильтр 1в1 как UI ожидает
  const filtered = source.filter((c) => {
    const name = (c.name || '').toLowerCase();
    const last = (c.lastName || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    return name.includes(query) || last.includes(query) || phone.includes(query);
  });

  return [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
});

const openCreateDialog = () => {
  editingClient.value = null;
  isDialogOpen.value = true;
};

const openEditDialog = (client) => {
  editingClient.value = client;
  isDialogOpen.value = true;
};

const handleSave = async (payload) => {
  // В твоём сторе логика сохранения 1-в-1 внутри addOrUpdateClient (по телефону)
  await clientsStore.addOrUpdateClient(payload);
  isDialogOpen.value = false;
};

const archiveClient = async (client) => {
  await clientsStore.archiveClient(client.phone);
};

const unarchiveClient = async (client) => {
  await clientsStore.unarchiveClient(client.phone);
};

const createOrderForClient = (client) => {
  router.push({
    name: 'home',
    query: {
      newOrder: '1',
      clientId: client.phone, // если ты используешь clientId — у тебя это по факту phone/docId
      clientName: client.name || '',
      clientLastName: client.lastName || '',
      clientPhone: client.phone || '',
    },
  });
};
</script>

<style scoped>
.clients-view-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.clients-list-container {
  flex-grow: 1;
  min-height: 0;
  background-color: rgb(var(--v-theme-background));
}
.clients-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.clients-list { background: transparent; }
.client-name-line { display: flex; align-items: center; gap: 8px; }
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  padding: 0 16px;
}
</style>