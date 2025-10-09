// tagStore.js
import { defineStore } from 'pinia'
import db from './db'

export const useTagStore = defineStore('tags', {
  state: () => ({ tags: [] }),
  actions: {
    async loadTags() {
      try {
        this.tags = await db.tags.toArray()
      } catch (e) {
        console.error('loadTags:', e)
      }
    },
    async addTag(name) {
      try {
        await db.tags.add({ name })
        await this.loadTags()
      } catch (e) {
        console.error('addTag (duplicate?):', e)
      }
    },
    async updateTag(id, name) {
      try {
        await db.tags.update(id, { name })
        await this.loadTags()
      } catch (e) {
        console.error('updateTag:', e)
      }
    },
    async deleteTag(id) {
      try {
        await db.transaction('rw', db.tags, db.serviceTags, async () => {
          await db.serviceTags.where('tagId').equals(id).delete()
          await db.tags.delete(id)
        })
        this.tags = this.tags.filter(t => t.id !== id)
      } catch (e) {
        console.error('deleteTag:', e)
      }
    }
  }
})