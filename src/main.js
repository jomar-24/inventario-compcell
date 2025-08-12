import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Importamos nuestro router

createApp(App)
  .use(router) // Le decimos a la app que use el router
  .mount('#app')