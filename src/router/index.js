import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'
import History from '../views/History.vue'
// ¡NUEVO! Importamos las páginas de categorías
import Categories from '../views/Categories.vue'
import CategoryDetail from '../views/CategoryDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/history',
    name: 'History',
    component: History
  },
  // ¡NUEVAS RUTAS AÑADIDAS AQUÍ!
  {
    path: '/categories',
    name: 'Categories',
    component: Categories
  },
  {
    path: '/category/:id',
    name: 'CategoryDetail',
    component: CategoryDetail
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router