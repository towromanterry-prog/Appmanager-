<template>
  <v-card flat color="background" class="h-100 overflow-y-auto">
    <v-card-title class="pt-4 pb-2 px-4 text-h5 font-weight-bold">Настройки</v-card-title>
    <v-card-text class="pa-0">
      <v-card flat class="mb-4 bg-primary-lighten-5 rounded-0">
        <v-card-text class="d-flex align-center justify-space-between py-3">
          <div v-if="currentUser">
            <div class="text-caption text-medium-emphasis">Аккаунт</div>
            <div class="text-body-2 font-weight-bold">{{ currentUser.email }}</div>
          </div>
          <div v-else>
            <div class="text-body-2">Синхронизация</div>
            <div class="text-caption text-medium-emphasis">Войдите для сохранения</div>
          </div>
          <v-btn v-if="!currentUser" color="primary" size="small" @click="login">Войти</v-btn>
          <v-btn v-else variant="text" color="error" size="small" icon="mdi-logout" @click="logout" />
        </v-card-text>
      </v-card>

      <v-expansion-panels variant="accordion" class="mb-4">
        <v-expansion-panel>
          <v-expansion-panel-title>Тема</v-expansion-panel-title>
          <v-expansion-panel-text>
             <v-btn-toggle v-model="themeStore.theme" @update:model-value="themeStore.setTheme" mandatory>
               <v-btn value="light">Светлая</v-btn>
               <v-btn value="dark">Темная</v-btn>
             </v-btn-toggle>
          </v-expansion-panel-text>
        </v-expansion-panel>
        
        <v-expansion-panel>
           <v-expansion-panel-title>Внешний вид</v-expansion-panel-title>
           <v-expansion-panel-text>
              <v-text-field 
                v-if="settingsStore.settings"
                v-model="settingsStore.settings.language" 
                label="Язык"
              ></v-text-field>
           </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { auth, googleProvider } from '@/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const currentUser = ref(null);

onMounted(() => {
    onAuthStateChanged(auth, (user) => {
        currentUser.value = user;
    });
});

const login = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); }
};
const logout = async () => {
    try { await signOut(auth); } catch (e) { console.error(e); }
};
</script>
