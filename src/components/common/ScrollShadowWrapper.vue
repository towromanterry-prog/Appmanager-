<template>
  <div class="scroll-shadow-wrapper" ref="wrapperRef">
    <div
      class="scroll-content"
      ref="contentRef"
      @scroll="handleScroll"
    >
      <slot></slot>
    </div>
    <div :class="['shadow', 'left-shadow', { 'visible': showLeftShadow }]"></div>
    <div :class="['shadow', 'right-shadow', { 'visible': showRightShadow }]"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const wrapperRef = ref(null);
const contentRef = ref(null);
const showLeftShadow = ref(false);
const showRightShadow = ref(false);

const handleScroll = () => {
  const el = contentRef.value;
  if (!el) return;

  const scrollLeft = el.scrollLeft;
  const scrollWidth = el.scrollWidth;
  const clientWidth = el.clientWidth;

  showLeftShadow.value = scrollLeft > 5;
  showRightShadow.value = scrollLeft < (scrollWidth - clientWidth - 5);
};

let resizeObserver;
onMounted(() => {
  nextTick(() => {
    handleScroll();
    if (wrapperRef.value) {
      resizeObserver = new ResizeObserver(handleScroll);
      resizeObserver.observe(wrapperRef.value);
    }
  });
});

onUnmounted(() => {
  if (resizeObserver && wrapperRef.value) {
    resizeObserver.unobserve(wrapperRef.value);
  }
});
</script>

<style scoped>
.scroll-shadow-wrapper {
  position: relative;
}

.scroll-content {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-content::-webkit-scrollbar {
  display: none;
}

.shadow {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40px;
  pointer-events: none;
  transition: opacity 0.2s ease-in-out;
  opacity: 0;
  z-index: 2;
}

.left-shadow {
  left: 0;
  background: linear-gradient(to right, rgb(var(--v-theme-surface)) 20%, transparent 100%);
}

.right-shadow {
  right: 0;
  background: linear-gradient(to left, rgb(var(--v-theme-surface)) 20%, transparent 100%);
}

.shadow.visible {
  opacity: 1;
}
</style>