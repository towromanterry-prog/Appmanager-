<template>
  <v-container class="fill-height justify-center">
    <v-card width="400" elevation="4">
      <v-card-title class="text-center text-h5 py-4">
        Вход в систему
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleLogin" v-model="isValid">
          <v-text-field
            v-model="username"
            label="Логин"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || 'Введите логин']"
            required
            autofocus
          ></v-text-field>

          <v-text-field
            v-model="password"
            label="Пароль"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            density="comfortable"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="showPassword = !showPassword"
            :rules="[v => !!v || 'Введите пароль']"
            required
            class="mt-2"
          ></v-text-field>

          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-4 mb-2"
            closable
          >
            Неверный логин или пароль
          </v-alert>

          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            class="mt-4"
            :loading="loading"
            :disabled="!isValid"
          >
            Войти
          </v-btn>

          <div class="text-caption text-center mt-4 text-medium-emphasis">
            Используйте: admin / admin123
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const isValid = ref(false);
const loading = ref(false);
const error = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) return;

  loading.value = true;
  error.value = false;

  // Simulate network delay for better UX
  await new Promise(resolve => setTimeout(resolve, 500));

  const success = authStore.login(username.value, password.value);

  if (success) {
    router.push('/');
  } else {
    error.value = true;
  }

  loading.value = false;
};
</script>
