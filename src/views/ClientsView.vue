<template>
  <v-container class="clients-container">
    <v-card flat>
      <v-card-title class="d-flex align-center pa-6">
        <v-icon size="28" class="mr-3">mdi-account-group</v-icon>
        <h1 class="text-h5 font-weight-medium">База клиентов</h1>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary"
          @click="refreshClients"
          :loading="loading"
        >
          <v-icon class="mr-2">mdi-refresh</v-icon>
          Обновить
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Поиск клиентов -->
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="Поиск по имени или телефону..."
          variant="outlined"
          clearable
          hide-details
          class="mb-4"
        ></v-text-field>

        <!-- Статистика -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-card variant="outlined">
              <v-card-text class="text-center">
                <v-icon size="48" color="primary" class="mb-2">mdi-account-multiple</v-icon>
                <h3 class="text-h4 font-weight-bold">{{ clientsStore.clients.length }}</h3>
                <p class="text-body-2 text-medium-emphasis">Всего клиентов</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-card variant="outlined">
              <v-card-text class="text-center">
                <v-icon size="48" color="success" class="mb-2">mdi-star</v-icon>
                <h3 class="text-h4 font-weight-bold">{{ topClients.length }}</h3>
                <p class="text-body-2 text-medium-emphasis">Постоянные клиенты</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-card variant="outlined">
              <v-card-text class="text-center">
                <v-icon size="48" color="warning" class="mb-2">mdi-clock</v-icon>
                <h3 class="text-h4 font-weight-bold">{{ recentClients.length }}</h3>
                <p class="text-body-2 text-medium-emphasis">Недавние клиенты</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Вкладки -->
        <v-tabs v-model="currentTab" class="mb-4">
          <v-tab value="all">Все клиенты</v-tab>
          <v-tab value="top">Постоянные</v-tab>
          <v-tab value="recent">Недавние</v-tab>
        </v-tabs>

        <!-- Список клиентов -->
        <v-window v-model="currentTab">
          <!-- Все клиенты -->
          <v-window-item value="all">
            <v-list v-if="filteredClients.length > 0">
              <v-list-item
                v-for="client in paginatedClients"
                :key="client.id"
                class="mb-2"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" size="48">
                    <v-icon color="white">mdi-account</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ client.name }}
                </v-list-item-title>
                
                <v-list-item-subtitle class="d-flex align-center">
                  <v-icon size="16" class="mr-1">mdi-phone</v-icon>
                  {{ client.phone }}
                  <v-spacer></v-spacer>
                  <v-chip size="small" color="primary" variant="outlined">
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
            
            <div v-else class="text-center py-8">
              <v-icon size="64" color="grey-lighten-2">mdi-account-search</v-icon>
              <h3 class="mt-4 text-h6">Клиенты не найдены</h3>
              <p class="text-medium-emphasis">Попробуйте изменить поисковый запрос</p>
            </div>

            <!-- Пагинация -->
            <v-pagination
              v-if="filteredClients.length > itemsPerPage"
              v-model="currentPage"
              :length="Math.ceil(filteredClients.length / itemsPerPage)"
              class="mt-4"
            ></v-pagination>
          </v-window-item>

          <!-- Постоянные клиенты -->
          <v-window-item value="top">
            <v-list v-if="topClients.length > 0">
              <v-list-item
                v-for="(client, index) in topClients"
                :key="client.id"
                class="mb-2"
              >
                <template v-slot:prepend>
                  <v-avatar :color="index < 3 ? 'amber' : 'primary'" size="48">
                    <v-icon color="white">
                      {{ index < 3 ? 'mdi-crown' : 'mdi-account' }}
                    </v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ client.name }}
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  {{ client.phone }} • {{ client.totalOrders }} заказов
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-chip 
                    :color="index < 3 ? 'amber' : 'primary'" 
                    size="small"
                  >
                    #{{ index + 1 }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            
            <div v-else class="text-center py-8">
              <v-icon size="64" color="grey-lighten-2">mdi-crown-outline</v-icon>
              <h3 class="mt-4 text-h6">Нет постоянных клиентов</h3>
              <p class="text-medium-emphasis">Клиенты появятся здесь после нескольких заказов</p>
            </div>
          </v-window-item>

          <!-- Недавние клиенты -->
          <v-window-item value="recent">
            <v-list v-if="recentClients.length > 0">
              <v-list-item
                v-for="client in recentClients"
                :key="client.id"
                class="mb-2"
              >
                <template v-slot:prepend>
                  <v-avatar color="success" size="48">
                    <v-icon color="white">mdi-account-clock</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ client.name }}
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  {{ client.phone }} • {{ formatDate(client.lastOrderDate) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <div v-else class="text-center py-8">
              <v-icon size="64" color="grey-lighten-2">mdi-clock-outline</v-icon>
              <h3 class="mt-4 text-h6">Нет недавних клиентов</h3>
              <p class="text-medium-emphasis">Недавние клиенты появятся здесь</p>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Диалог истории клиента -->
    <v-dialog v-model="historyDialog" max-width="600">
      <v-card v-if="selectedClient">
        <v-card-title>
          История заказов - {{ selectedClient.name }}
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
                      {{ service.name }}
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
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useClientsStore } from '@/stores/clientsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';

const router = useRouter();
const clientsStore = useClientsStore();
const confirmationStore = useConfirmationStore();

// Реактивные данные
const loading = ref(false);
const searchQuery = ref('');
const currentTab = ref('all');
const currentPage = ref(1);
const itemsPerPage = 20;
const historyDialog = ref(false);
const selectedClient = ref(null);

// Computed
const filteredClients = computed(() => {
  if (!searchQuery.value) return clientsStore.clients;
  
  const query = searchQuery.value.toLowerCase();
  return clientsStore.clients.filter(client =>
    client.name.toLowerCase().includes(query) ||
    client.phone.includes(searchQuery.value)
  );
});

const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredClients.value.slice(start, end);
});

const topClients = computed(() => clientsStore.getTopClients(10));
const recentClients = computed(() => clientsStore.getRecentClients(10));

// Методы
const refreshClients = async () => {
  loading.value = true;
  try {
    clientsStore.loadClients();
  } finally {
    loading.value = false;
  }
};

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
      clientPhone: client.phone
    }
  });
};

const deleteClient = async (client) => {
  const confirmed = await confirmationStore.open(
    'Удаление клиента',
    `Вы уверены, что хотите удалить клиента "${client.name}"? Эта операция необратима.`
  );
  
  if (confirmed) {
    clientsStore.deleteClient(client.phone);
  }
};

const formatDate = (dateString) => {
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
.clients-container {
  max-width: 1000px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .clients-container {
    padding: 8px;
  }
}
</style>