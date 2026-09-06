import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import scheduleUiPatch from './schedule-ui-patch'

export default defineConfig({
  plugins: [scheduleUiPatch(), react()],
  // Trigger a fresh Vercel production deployment from the latest main commit.
})
