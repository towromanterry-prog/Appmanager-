<template>
  <transition name="calendar-slide">
    <div v-if="open" class="fullscreen-calendar">
      <div class="calendar-header d-flex align-center justify-space-between px-4">
        <div class="d-flex align-center">
          <span class="text-h5 font-weight-bold mr-2">{{ currentMonthName }}</span>
          <span class="text-h5 text-medium-emphasis">{{ currentYear }}</span>
        </div>

        <div class="d-flex align-center">
          <v-btn icon="mdi-chevron-left" variant="text" @click="onPrevMonth" />
          <v-btn icon="mdi-chevron-right" variant="text" @click="onNextMonth" />

          <!-- Google Calendar (опционально) -->
          <v-btn
            v-if="gcalEnabled"
            :icon="gcalConnected ? 'mdi-calendar-sync' : 'mdi-link-variant'"
            variant="text"
            class="ml-1"
            :loading="gcalBusy"
            :disabled="gcalBusy"
            @click="onGcalAction"
          />

          <v-btn icon="mdi-close" variant="text" class="ml-2" @click="onClose" />
        </div>
      </div>

      <div class="weekdays-grid">
        <div v-for="day in WEEKDAYS" :key="day" class="weekday-label">
          {{ day }}
        </div>
      </div>

      <div class="days-grid">
        <div
          v-for="(day, index) in flatDays"
          :key="day.date || index"
          class="day-cell"
          :class="{
            'other-month': day.otherMonth,
            'is-today': day.isToday,
            'is-selected': day.date === selectedDate
          }"
          @click="onPick(day)"
        >
          <div class="day-number">{{ day.number }}</div>

          <!-- Полоски статусов -->
          <div
            v-if="day?.date && dayBars(day).length"
            class="status-bars"
            :class="barsVariantClass"
            :style="barsVars"
            @click.stop
          >
            <div
              v-for="([status, count]) in dayBars(day)"
              :key="status"
              class="status-bar"
              :style="barStyle(status)"
              :title="`${safeLabel(status)}: ${count}`"
            >
              <span class="status-count">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const props = defineProps({
  open: { type: Boolean, default: false },
  selectedDate: { type: String, default: null },
  currentDate: { type: Date, required: true },
  flatDays: { type: Array, required: true },
  currentMonthName: { type: String, required: true },
  currentYear: { type: Number, required: true },
  getStatusLabel: { type: Function, required: true },

  // 'scroll' (крупнее + скролл если не влезло) | 'fit' (компактно без скролла)
  barsVariant: {
    type: String,
    default: 'scroll',
    validator: (v) => ['scroll', 'fit'].includes(String(v)),
  },

  // Google Calendar hooks
  gcalEnabled: { type: Boolean, default: false },
  gcalConnected: { type: Boolean, default: false },
  gcalBusy: { type: Boolean, default: false },
});

const emit = defineEmits([
  'update:open',
  'select-day',
  'prev-month',
  'next-month',
  'gcal-connect',
  'gcal-sync',
]);

const settingsStore = useSettingsStore();
const { triggerHapticFeedback } = useHapticFeedback();

const setOpen = (v) => emit('update:open', v);

const onClose = () => {
  triggerHapticFeedback('tap');
  setOpen(false);
};

const onPrevMonth = () => {
  triggerHapticFeedback('tap');
  emit('prev-month');
};

const onNextMonth = () => {
  triggerHapticFeedback('tap');
  emit('next-month');
};

const norm = (s) => String(s || '').trim().toLowerCase();

// 5 статусов, cancelled не показываем
const ORDERED_STATUSES = ['accepted', 'additional', 'in_progress', 'completed', 'delivered'];

const dayBars = (day) => {
  const map = day?.orderStats?.statuses || {};
  const res = [];

  for (const st of ORDERED_STATUSES) {
    const c = Number(map[st] ?? map[norm(st)] ?? 0);
    if (c > 0) res.push([st, c]);
  }

  // кастомные статусы (кроме cancelled)
  for (const [rawStatus, rawCount] of Object.entries(map)) {
    const st = norm(rawStatus);
    if (!st || st === 'cancelled') continue;
    if (ORDERED_STATUSES.includes(st)) continue;
    const c = Number(rawCount ?? 0);
    if (c > 0) res.push([st, c]);
  }

  return res;
};

const safeLabel = (status) => {
  try {
    return typeof props.getStatusLabel === 'function' ? props.getStatusLabel(status) : String(status || '');
  } catch {
    return String(status || '');
  }
};

// 2 режима размеров
const barsVariantClass = computed(() => (props.barsVariant === 'fit' ? 'status-bars--fit' : 'status-bars--scroll'));

const barsVars = computed(() => {
  // fit: компактно
  if (props.barsVariant === 'fit') {
    return { '--bar-h': '18px', '--bar-fs': '15px', '--bar-gap': '2px' };
  }
  // scroll: крупнее + прокрутка если не влезло
  return { '--bar-h': '24px', '--bar-fs': '18px', '--bar-gap': '3px' };
});

// контрастный цвет текста (чтобы цифры читались на любом цвете статуса)
const parseHex = (c) => {
  const s = String(c || '').trim();
  if (!s.startsWith('#')) return null;
  const hex = s.slice(1);
  const full = hex.length === 3 ? hex.split('').map((x) => x + x).join('') : hex;
  if (full.length !== 6) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
};

const contrastText = (bg) => {
  const rgb = parseHex(bg);
  if (!rgb) return 'rgba(0,0,0,0.92)';
  const L = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return L > 0.62 ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.96)';
};

const barStyle = (status) => {
  const bg = settingsStore.getOrderStatusColor(status);
  return {
    backgroundColor: bg,
    color: contrastText(bg),
  };
};

const onPick = (day) => {
  if (!day?.date) return;
  triggerHapticFeedback('tap');
  emit('select-day', day);
};

// ---- Google Calendar (одна сторона app => calendar)
const toLocalDateKey = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const onGcalAction = () => {
  triggerHapticFeedback('tap');

  if (!props.gcalConnected) {
    emit('gcal-connect');
    return;
  }

  const y = props.currentDate.getFullYear();
  const m = props.currentDate.getMonth(); // 0..11
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);

  emit('gcal-sync', {
    scope: 'month',
    year: y,
    month: m + 1,
    range: {
      start: toLocalDateKey(start),
      end: toLocalDateKey(end),
    },
  });
};
</script>

<style scoped>
.fullscreen-calendar {
  position: fixed;
  inset: 0;
  height: 100vh;
  background-color: rgb(var(--v-theme-surface));
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.calendar-header {
  height: 60px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}

.weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}

.weekday-label {
  font-size: 14px !important;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.days-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  min-height: 0;
}

.day-cell {
  border-right: 1px solid rgba(var(--v-border-color), 0.08);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  padding: 2px;
  display: flex;
  flex-direction: column;
  min-height: 0; /* важно для скролла внутри */
  transition: background-color 0.1s;
}

.day-cell:active { background-color: rgba(var(--v-theme-primary), 0.1); }
.day-cell.other-month { background-color: rgba(0,0,0,0.02); }
.day-cell.other-month .day-number { opacity: 0.3; }
.day-cell.is-selected { background-color: rgba(var(--v-theme-primary), 0.08); }

.day-number {
  font-size: 20px !important;
  font-weight: 800;
  margin-left: 4px;
  margin-top: 2px;
  line-height: 1.05;
  color: rgb(var(--v-theme-on-surface));
}

.day-cell.is-today .day-number { color: rgb(var(--v-theme-primary)); }

/* --- Status bars --- */
.status-bars {
  margin-top: 6px;
  padding: 0 2px;
  display: flex;
  flex-direction: column;
  gap: var(--bar-gap, 3px);

  /* ключевые вещи для работы скролла */
  flex: 1;
  min-height: 0;
  touch-action: pan-y;
}

.status-bars--scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scrollbar-width: none;
}
.status-bars--scroll::-webkit-scrollbar { width: 0; height: 0; }

.status-bars--fit {
  overflow: hidden;
}

.status-bar {
  width: 100%;
  height: var(--bar-h, 24px);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(var(--v-border-color), 0.18);
}

.status-count {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: var(--bar-fs, 18px);
  font-weight: 800;
  line-height: var(--bar-h, 24px); /* идеальное вертикальное центрирование */
}
</style>