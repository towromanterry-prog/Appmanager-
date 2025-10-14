<template>
  <div class="clients-view-wrapper">
    <div v-if="!filteredClients.length" class="empty-state">
      <v-icon size="48">mdi-account-search-outline</v-icon>
      <h3 class="mt-4">Клиенты не найдены</h3>
      <p>Попробуйте изменить поисковый запрос или добавьте нового клиента.</p>
    </div>
    <v-list v-else class="clients-list">
      <v-list-item
        v-for="client in filteredClients"
        :key="client.id"
        class="client-card-item"
      >
        <v-card-text class="d-flex align-start pa-4">
          <div class="flex-grow-1 mr-4" style="min-width: 0;">
            <div class="d-flex align-center">
              <div class="client-info">
                <div class="client-name-line">
                  <span class="font-weight-bold text-truncate">{{ client.name }}</span>
                  <span class="font-weight-bold text-truncate">{{ client.lastName }}</span>
                </div>
                <div class="text-caption text-on-surface-variant">{{ client.phone }}</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import Fuse from 'fuse.js';
import { useClientsStore } from '@/stores/clientsStore';
import { useSearchStore } from '@/stores/searchStore';
import { storeToRefs } from 'pinia';

const clientsStore = useClientsStore();
const searchStore = useSearchStore();
const { clients } = storeToRefs(clientsStore);
const { searchQuery } = storeToRefs(searchStore);

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

onMounted(() => {
  clientsStore.loadClients();
});
</script>

<style scoped>
.clients-view-wrapper {
  height: calc(100vh - 68px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.clients-list {
  flex-grow: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
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
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.empty-state p {
    font-size: 0.9rem;
}

.client-card-item {
  padding: 0;
}

.client-info {
  overflow: hidden;
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