<template>
  <transition name="calendar-slide">
    <div v-if="open" class="fullscreen-calendar">
      <div class="calendar-header d-flex align-center justify-space-between px-4">
        <div class="d-flex align-center">
          <span class="text-h5 font-weight-bold mr-2">{{ currentMonthName }}</span>
          <span class="text-h5 text-medium-emphasis">{{ currentYear }}</span>
        </div>
        <div class="d-flex align-center">
          <v-btn icon="mdi-chevron-left" variant="text" @click="$emit('prev-month')" />
          <v-btn icon="mdi-chevron-right" variant="text" @click="$emit('next-month')" />
          <v-btn icon="mdi-close" variant="text" class="ml-2" @click="setOpen(false)" />
        </div>
      </div>

      <div class="weekdays-grid">
        <div v-for="day in ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']" :key="day" class="weekday-label">
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

          <div class="status-stack" v-if="day.date">
            <div
              v-for="(count, status) in day.orderStats.statuses"
              :key="status"
              class="status-bar"
              :class="status"
            >
              <span class="status-text">{{ getStatusLabel(status) }} {{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  selectedDate: { type: String, default: null },
  currentDate: { type: Date, required: true },
  flatDays: { type: Array, required: true },
  currentMonthName: { type: String, required: true },
  currentYear: { type: Number, required: true },
  getStatusLabel: { type: Function, required: true },
});

const emit = defineEmits(['update:open', 'select-day', 'prev-month', 'next-month']);

const setOpen = (v) => emit('update:open', v);

const onPick = (day) => {
  if (!day?.date) return;
  emit('select-day', day);
};
</script>

<style scoped>
.fullscreen-calendar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
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
}

.day-cell {
  border-right: 1px solid rgba(var(--v-border-color), 0.08);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  padding: 2px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: background-color 0.1s;
}

.day-cell:active { background-color: rgba(var(--v-theme-primary), 0.1); }
.day-cell.other-month { background-color: rgba(0,0,0,0.02); }
.day-cell.other-month .day-number { opacity: 0.3; }
.day-cell.is-selected { background-color: rgba(var(--v-theme-primary), 0.08); }

.day-number {
  font-size: 20px !important;
  font-weight: 700;
  margin-left: 4px;
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface));
}

.day-cell.is-today .day-number { color: rgb(var(--v-theme-primary)); }
</style>
