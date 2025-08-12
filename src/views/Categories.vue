<script setup>
import { ref, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'

// --- CONEXIÓN A SUPABASE ---
const supabaseUrl = 'https://loakfoqfdgegvzjgkjnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYWtmb3FmZGdlZ3Z6amdram52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg4NDgsImV4cCI6MjA2OTM4NDg0OH0.a1-90tbgDWTHhNy7ScSysaycji6wBAKXs2378u5Twik';
const supabase = createClient(supabaseUrl, supabaseKey);

const router = useRouter(); // Para la navegación
const categories = ref([]);
const loading = ref(true);

// Función para obtener las categorías Y contar cuántos productos tiene cada una
async function getCategoriesWithProductCount() {
  loading.value = true;
  const { data, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      products ( count )
    `)
    .order('name');
  
  if (data) {
    categories.value = data;
  }
  loading.value = false;
}

// Función para navegar al detalle de una categoría
function viewCategory(categoryId) {
  router.push(`/category/${categoryId}`);
}

// Función para volver al Dashboard
function goToDashboard() {
  router.push('/');
}

onMounted(() => {
  getCategoriesWithProductCount();
});
</script>

<template>
  <div class="page-container">
    <div class="header">
      <img src="/logo.png" alt="Compcell Logo" class="logo">
      <h1>Vista por Categorías</h1>
      <button @click="goToDashboard" class="btn-back">👈 Volver al Inventario</button>
    </div>

    <div v-if="loading" class="loading-message">
      Cargando categorías...
    </div>
    
    <div v-else class="categories-grid">
      <!-- Un bucle que crea una tarjeta por cada categoría -->
      <div 
        v-for="category in categories" 
        :key="category.id"
        class="category-card"
        @click="viewCategory(category.id)"
      >
        <div class="category-name">{{ category.name }}</div>
        <div class="product-count">
          <!-- Supabase nos da el conteo en un array, accedemos al primer elemento -->
          {{ category.products[0]?.count || 0 }} Productos
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 50%, #d6e4ff 100%);
  background-attachment: fixed;
  padding: 2rem;
  color: #2c3e50;
  position: relative;
  overflow: hidden;
}

.page-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(52, 152, 219, 0.1) 0%, transparent 60%);
  animation: rotate 30s linear infinite;
  z-index: 1;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.header {
  max-width: 1200px;
  margin: 0 auto 3rem auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1.5rem 2rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  position: relative;
  z-index: 2;
}

.logo {
  height: 140px; /* Logo mucho más grande */
  position: relative;
  filter: drop-shadow(0 0 15px rgba(255, 140, 0, 0.7)) /* Aura naranja */
         drop-shadow(0 0 25px rgba(255, 140, 0, 0.5))
         drop-shadow(0 0 35px rgba(255, 140, 0, 0.3));
  animation: glowingContour 3s infinite;
}

.logo::before {
  content: '';
  position: absolute;
  top: -15px;
  left: -15px;
  right: -15px;
  bottom: -15px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(255, 140, 0, 0.8) 20%,
    rgba(255, 165, 0, 0.6) 40%,
    transparent 60%,
    rgba(255, 140, 0, 0.8) 80%,
    rgba(255, 165, 0, 0.6) 100%
  );
  animation: rotate 4s linear infinite;
  z-index: -1;
}

@keyframes glowingContour {
  0% { 
    filter: drop-shadow(0 0 15px rgba(255, 140, 0, 0.7))
           drop-shadow(0 0 25px rgba(255, 140, 0, 0.5)); 
  }
  50% { 
    filter: drop-shadow(0 0 25px rgba(255, 140, 0, 0.9))
           drop-shadow(0 0 35px rgba(255, 140, 0, 0.7))
           drop-shadow(0 0 45px rgba(255, 140, 0, 0.5)); 
  }
  100% { 
    filter: drop-shadow(0 0 15px rgba(255, 140, 0, 0.7))
           drop-shadow(0 0 25px rgba(255, 140, 0, 0.5)); 
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

h1 {
  font-size: 2.8rem;
  color: #2c3e50;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  background: linear-gradient(to right, #2c3e50, #3498db);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.btn-back {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
  text-decoration: none;
  color: white;
  background: linear-gradient(45deg, #2c3e50, #3498db);
  background-size: 200% auto;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-back::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.btn-back:hover::before {
  left: 100%;
}

.btn-back:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background-position: right center;
}

.loading-message {
  text-align: center;
  font-size: 1.8rem;
  color: #34495e;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  position: relative;
  z-index: 2;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: auto;
  position: relative;
  z-index: 2;
  padding: 1rem;
}

.category-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  text-align: center;
  cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  border: none;
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #3498db, #2ecc71);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 1;
}

.category-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 30px rgba(52, 152, 219, 0.2);
}

.category-card:hover::before {
  opacity: 0.1;
}

.category-name {
  position: relative;
  z-index: 2;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #2c3e50, #3498db);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.product-count {
  position: relative;
  z-index: 2;
  font-size: 1.1rem;
  font-weight: 500;
  color: #34495e;
  padding: 0.5rem 1rem;
  background: linear-gradient(to right, #f5f6fa, #dcdde1);
  border-radius: 20px;
  display: inline-block;
}
</style>