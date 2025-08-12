import { createRouter, createWebHistory } from 'vue-router'
import dashboard from '../views/dashboard.vue'
import login from '../views/login.vue'
import history from '../views/history.vue'
import categories from '../views/categories.vue'
import categorydetail from '../views/categorydetail.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: dashboard
  },
  {
    path: '/login',
    name: 'login',
    component: login
  },
  {
    path: '/history',
    name: 'history',
    component: history
  },
  {
    path: '/categories',
    name: 'categories',
    component: categories
  },
  {
    path: '/category/:id',
    name: 'categorydetail',
    component: categorydetail
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router