import { defineStore } from 'pinia';
import tagService from '../services/tagService';
import Tag from '../models/Tag';

export const useTagsStore = defineStore('tagsStore', {
  state: () => ({
    tags: [],
    unsubscribe: null
  }),

  actions: {
    initRealtimeUpdates() {
      if (this.unsubscribe) return;
      this.unsubscribe = tagService.subscribe((tags) => {
        this.tags = tags;
      });
    },

    async addTag(name, color) {
      const newTag = new Tag({ name, color });
      await tagService.create(newTag);
    },

    async removeTag(id) {
      await tagService.delete(id);
    }
  }
});
