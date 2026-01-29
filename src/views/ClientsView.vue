<template>
  <div class="clients-view-wrapper">
    <div class="clients-list-container">
        <div v-if="!sortedClients.length" class="empty-state">
          <v-icon size="48">mdi-account-search-outline</v-icon>
          <h3 class="mt-4">Клиенты не найдены</h3>
          <p>Попробуйте изменить поисковый запрос или добавьте нового клиента.</p>
        </div>
        <v-list v-else class="clients-list" lines="two">
          <v-list-item
            v-for="client in sortedClients"
            :key="client.id"
            class="client-card-item"
          >
            <v-list-item-title class="client-name-line">
              <span class="font-weight-bold text-truncate">{{ client.name }}</span>
              <span class="font-weight-bold text-truncate">{{ client.lastName }}</span>
            </v-list-item-title>

            <v-list-item-subtitle class="d-flex align-center">
              <span>{{ client.phone }}</span>
              <v-spacer></v-spacer>
              <v-chip size="small" color="primary" variant="outlined" class="ml-2">
                {{ client.totalOrders }} заказов
              </v-chip>
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    v-bind="props"
                  ></v-btn>
                </template>
                <v-list>
                  <v-list-item @click="viewClientHistory(client)">
                    <v-list-item-title>История заказов</v-list-item-title>
                    <template v-slot:prepend>
                      <v-icon>mdi-history</v-icon>
                    </template>
                  </v-list-item>
                  <v-list-item @click="createOrderForClient(client)">
                    <v-list-item-title>Новый заказ</v-list-item-title>
                    <template v-slot:prepend>
                      <v-icon>mdi-plus</v-icon>
                    </template>
                  </v-list-item>
                  <v-list-item @click="deleteClient(client)" color="error">
                    <v-list-item-title>Удалить</v-list-item-title>
                    <template v-slot:prepend>
                      <v-icon>mdi-delete</v-icon>
                    </template>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>
    </div>
     <v-dialog v-model="historyDialog" max-width="600">
      <v-card v-if="selectedClient">
        <v-card-title>
          История заказов - {{ selectedClient.name }} {{ selectedClient.lastName }}
        </v-card-title>
        <v-card-text>
          <v-timeline density="compact">
            <v-timeline-item
              v-for="(order, index) in selectedClient.history"
              :key="index"
              size="small"
            >
              <v-card variant="outlined" class="mb-2">
                <v-card-text>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ formatDate(order.date) }}
                  </div>
                  <div class="mt-1">
                    <v-chip
                      v-for="service in order.services"
                      :key="service.id"
                      size="small"
                      class="mr-1 mb-1"
                    >
                      {{ service }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="historyDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Fuse from 'fuse.js';
import { useClientsStore } from '@/stores/clientsStore';
import { useSearchStore } from '@/stores/searchStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { storeToRefs } from 'pinia';

const router = useRouter();
const clientsStore = useClientsStore();
const searchStore = useSearchStore();
const confirmationStore = useConfirmationStore();

const { clients, sortBy } = storeToRefs(clientsStore);
const { searchQuery } = storeToRefs(searchStore);

const historyDialog = ref(false);
const selectedClient = ref(null);

const fuse = computed(() => {
  const options = {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'lastName', weight: 0.3 },
      { name: 'phone', weight: 0.2 }
    ],
    includeScore: true,
    threshold: 0.4,
    minMatchCharLength: 2,
  };
  return new Fuse(clients.value, options);
});

const filteredClients = computed(() => {
  if (searchQuery.value) {
    return fuse.value.search(searchQuery.value).map(result => result.item);
  }
  return clients.value;
});

const sortedClients = computed(() => {
    return [...filteredClients.value].sort((a, b) => {
        if (sortBy.value === 'name') {
            const nameA = `${a.name} ${a.lastName}`.toLowerCase();
            const nameB = `${b.name} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
        }
        if (sortBy.value === 'orders') {
            return b.totalOrders - a.totalOrders;
        }
        if (sortBy.value === 'date') {
            return new Date(b.lastOrderDate) - new Date(a.lastOrderDate);
        }
        return 0;
    });
});

const viewClientHistory = (client) => {
  selectedClient.value = client;
  historyDialog.value = true;
};

const createOrderForClient = (client) => {
  router.push({
    name: 'home',
    query: {
      action: 'create',
      clientName: client.name,
      clientLastName: client.lastName,
      clientPhone: client.phone
    }
  });
};

const deleteClient = async (client) => {
  const confirmed = await confirmationStore.open(
    'Удаление клиента',
    `Вы уверены, что хотите удалить клиента "${client.name} ${client.lastName}"? Эта операция необратима.`
  );

  if (confirmed) {
    clientsStore.deleteClient(client.phone);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  clientsStore.loadClients();
});
</script>

<style scoped>
.clients-view-wrapper {
  height: calc(100vh - var(--app-topbar-height, 68px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 16px;
}
.clients-list-container {
  flex-grow: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin: 8px;
  padding: 8px;
  position: relative;
  z-index: 1;
  background-color: rgb(var(--v-theme-secondary));
  border-radius: 16px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(0, 0, 0, 0.05);
}
.clients-list {
  background-color: transparent;
}

.clients-list::-webkit-scrollbar {
  display: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 70%;
  color: rgba(var(--v-theme-on-secondary), 0.7);
}
.empty-state p {
    font-size: 0.9rem;
}

.client-card-item {
  padding: 0;
  background-color: rgb(var(--v-theme-surface));
  border-radius: 8px;
  margin-bottom: 8px;
}

.client-name-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  line-height: 1.2;
  gap: 0 0.25em;
}

.client-name-line .text-truncate {
  min-width: 0;
}
</style>