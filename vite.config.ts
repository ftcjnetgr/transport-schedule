import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import scheduleUiPatch from './schedule-ui-patch'

export default defineConfig({
  plugins: [scheduleUiPatch(), react()],
})
