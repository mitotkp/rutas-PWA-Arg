import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { restoreSession } from './store' 
import { limpiarPedidos } from './database'

async function initializeApp() {
  const app = createApp(App)

  await restoreSession();
  await limpiarPedidos();

  app.use(router)
  app.mount('#app')
}

initializeApp()