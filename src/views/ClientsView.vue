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
          ></v-text-field>
          <div class="d-flex align-center justify-space-between">
            <v-switch
              v-model="showArchived"
              color="primary"
              inset
              hide-details
              label="Показывать архивные"
            ></v-switch>
            <div class="text-caption text-medium-emphasis">
              {{ filteredClients.length }} найдено
            </div>
          </div>
        </div>

        <div v-if="!filteredClients.length" class="empty-state">
          <v-icon size="48">mdi-account-search-outline</v-icon>
          <h3 class="mt-4">Клиенты не найдены</h3>
          <p>Попробуйте изменить поисковый запрос или добавьте нового клиента.</p>
        </div>

        <v-list v-else class="clients-list" lines="two">
          <v-list-item
            v-for="client in filteredClients"
            :key="client.id"
            class="client-card-item"
          >
            <v-list-item-title class="client-name-line">
              <span class="font-weight-bold text-truncate">{{ client.name }}</span>
              <v-chip
                v-if="client.isArchived"
                size="x-small"
                color="warning"
                variant="tonal"
                class="ml-2"
              >
                Архив
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle class="d-flex align-center">
              <span>{{ client.phone || 'Телефон не указан' }}</span>
              <v-spacer></v-spacer>
              <span v-if="client.notes" class="text-caption text-medium-emphasis text-truncate">
                {{ client.notes }}
              </span>
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
                </template>
                <v-list>
                  <v-list-item @click="openEditDialog(client)">
                    <v-list-item-title>Редактировать</v-list-item-title>
                    <template v-slot:prepend>
                      <v-icon>mdi-pencil</v-icon>
                    </template>
                  </v-list-item>
                  <v-list-item @click="createOrderForClient(client)">
                    <v-list-item-title>Новый заказ</v-list-item-title>
                    <template v-slot:prepend>
                      <v-icon>mdi-plus</v-icon>
                    </template>
                  </v-list-item>
                  <v-list-item
                    v-if="!client.isArchived"
                    @click="archiveClient(client)"
                    color="warning"
                  >
                    <v-list-item-title>В архив</v-list-item-title>
                    <template v-slot:prepend>
                      <v-icon>mdi-archive-arrow-down-outline</v-icon>
                    </template>
                  </v-list-item>
                  <v-list-item
                    v-else
                    @click="unarchiveClient(client)"
                    color="success"
                  >
                    <v-list-item-title>Вернуть из архива</v-list-item-title>
                    <template v-slot:prepend>
                      <v-icon>mdi-archive-arrow-up-outline</v-icon>
                    </template>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </div>

    <ClientFormDialog
      v-model="isDialogOpen"
      :client="editingClient"
      @save="handleSave"
    />

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
      ></v-btn>
    </v-fab-transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useClientsStore } from '@/stores/clientsStore';
import { useSearchStore } from '@/stores/searchStore';
import ClientFormDialog from '@/components/ClientFormDialog.vue';

const router = useRouter();
const clientsStore = useClientsStore();
const searchStore = useSearchStore();

const { clients, loading, user } = storeToRefs(clientsStore);
const { searchQuery } = storeToRefs(searchStore);

const showArchived = ref(false);
const localSearch = ref('');
const isDialogOpen = ref(false);
const editingClient = ref(null);

const isLoggedIn = computed(() => Boolean(user.value));

const filteredClients = computed(() => {
  const query = (localSearch.value || searchQuery.value || '').trim().toLowerCase();
  const source = showArchived.value ? clients.value : clientsStore.activeClients;
  const filtered = source.filter((client) => {
    if (!query) return true;
    const nameMatch = (client.name || '').toLowerCase().includes(query);
    const phoneMatch = (client.phone || '').toLowerCase().includes(query);
    return nameMatch || phoneMatch;
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
  if (editingClient.value) {
    await clientsStore.updateClient(editingClient.value.id, payload);
  } else {
    await clientsStore.addClient(payload);
  }
};

const archiveClient = async (client) => {
  await clientsStore.archiveClient(client.id);
};

const unarchiveClient = async (client) => {
  await clientsStore.unarchiveClient(client.id);
};

const createOrderForClient = (client) => {
  router.push({
    name: 'home',
    query: {
      newOrder: '1',
      clientId: client.id
    }
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

.clients-list {
  background: transparent;
}

.client-name-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

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
