<template>
  <div class="history-container">
    <div class="title-container">
      <img src="/logo.png" alt="Compcell Logo" class="logo">
      <h1>Historial de Movimientos</h1>
      <router-link to="/" class="btn-back" title="Volver al Dashboard">
        👈 Volver al stock
      </router-link>
    </div>

    <div class="tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'entries' }]" 
        @click="activeTab = 'entries'"
      >
        📥 Historial de Entradas
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'sales' }]" 
        @click="activeTab = 'sales'"
      >
        📤 Historial de Salidas
      </button>
    </div>

    <div class="current-info">
      <p>📅 Fecha actual: {{ currentDate }}</p>
      <p>⌚ Hora actual: {{ currentTime }}</p>
    </div>

    <div v-if="activeTab === 'entries'" class="history-table">
      <h2>Registro de Entradas de Stock</h2>
      <table>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Stock Final</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.id">
            <td>
              <div class="product-image">
                <img 
                  :src="entry.product?.image_url || '/no-image.png'"
                  :alt="entry.product?.name"
                  @error="handleImageError"
                  @click="showImageModal(entry.product?.image_url)"
                />
              </div>
            </td>
            <td>{{ formatDate(entry.created_at) }}</td>
            <td>{{ formatTime(entry.created_at) }}</td>
            <td>{{ entry.product?.name }}</td>
            <td class="quantity-added">+{{ entry.quantity_added }}</td>
            <td>{{ entry.final_stock }}</td>
            <td>
              <button 
                @click="deleteHistoryEntry('entries', entry.id, entry.product_id, entry.quantity_added)"
                class="btn-delete"
                title="Eliminar entrada"
              >
                🗑️ Eliminar
              </button>
            </td>
          </tr>
          <tr v-if="entries.length === 0">
            <td colspan="5" class="no-data">No hay registros de entradas</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'sales'" class="history-table">
      <h2>Registro de Salidas (Ventas)</h2>
      <table>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Stock Final</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in sales" :key="sale.id">
            <td>
              <div class="product-image">
                <img 
                  :src="sale.product?.image_url || '/no-image.png'"
                  :alt="sale.product?.name"
                  @error="handleImageError"
                  @click="showImageModal(sale.product?.image_url)"
                />
              </div>
            </td>
            <td>{{ formatDate(sale.created_at) }}</td>
            <td>{{ formatTime(sale.created_at) }}</td>
            <td>{{ sale.product?.name }}</td>
            <td class="quantity-reduced">-{{ sale.quantity_sold }}</td>
            <td>{{ sale.final_stock }}</td>
            <td>
              <button 
                @click="deleteHistoryEntry('sales', sale.id, sale.product_id, sale.quantity_sold)"
                class="btn-delete"
                title="Eliminar venta"
              >
                🗑️ Eliminar
              </button>
            </td>
          </tr>
          <tr v-if="sales.length === 0">
            <td colspan="5" class="no-data">No hay registros de ventas</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Modal para vista previa de imágenes -->
    <div v-if="isImageModalVisible" class="image-modal" @click="closeImageModal">
      <div class="modal-content">
        <span class="close-modal" @click="closeImageModal">&times;</span>
        <img :src="selectedImage" alt="Vista previa del producto" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import supabase from '../supabase';

const activeTab = ref('entries');
const entries = ref([]);
const sales = ref([]);
const currentDate = ref('');
const currentTime = ref('');
const isImageModalVisible = ref(false);
const selectedImage = ref('');

const updateDateTime = () => {
  const now = new Date();
  currentDate.value = formatDate(now);
  currentTime.value = formatTime(now);
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true // Formato 12 horas
  }).toLowerCase(); // am/pm en minúsculas
};

// Funciones para manejar imágenes
const handleImageError = (event) => {
  event.target.src = '/no-image.png';
};

const showImageModal = (imageUrl) => {
  if (imageUrl && imageUrl !== '/no-image.png') {
    selectedImage.value = imageUrl;
    isImageModalVisible.value = true;
  }
};

const closeImageModal = () => {
  isImageModalVisible.value = false;
  selectedImage.value = '';
};

const fetchEntries = async () => {
  try {
    // Obtener entradas con información completa del producto
    const { data: entriesData, error: entriesError } = await supabase
      .from('entries')
      .select('*, product:products(name, image_url, stock)')
      .order('created_at', { ascending: false });

    if (entriesError) throw entriesError;

    // Para cada entrada, actualizamos el stock final con el stock actual
    entries.value = (entriesData || []).map(entry => ({
      ...entry,
      final_stock: entry.product?.stock || 0
    }));
  } catch (error) {
    console.error('Error al obtener entradas:', error);
    alert('Error al cargar el historial de entradas');
  }
};

const fetchSales = async () => {
  try {
    // Obtener ventas con información completa del producto
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*, product:products(name, image_url, stock)')
      .order('created_at', { ascending: false });

    if (salesError) throw salesError;

    // Para cada venta, actualizamos el stock final con el stock actual
    sales.value = (salesData || []).map(sale => ({
      ...sale,
      final_stock: sale.product?.stock || 0
    }));
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    alert('Error al cargar el historial de ventas');
  }
};

// Función para eliminar registros
const deleteHistoryEntry = async (type, id, productId, quantity) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;

  let error;
  const { data: products } = await supabase.from('products').select('*');
  const product = products.find(p => p.id === productId);
  
  if (type === 'entries') {
    if (product) {
      const newStock = product.stock - quantity;
      if (newStock < 0) {
        alert('No se puede eliminar esta entrada porque dejaría el stock en negativo.');
        return;
      }
      
      // Actualizar el stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);
      
      if (!updateError) {
        // Eliminar el registro de entrada
        const { error: deleteError } = await supabase
          .from('entries')
          .delete()
          .eq('id', id);
        error = deleteError;
      } else {
        error = updateError;
      }
    }
  } else {
    if (product) {
      const newStock = product.stock + quantity;
      
      // Actualizar el stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);
      
      if (!updateError) {
        // Eliminar el registro de venta
        const { error: deleteError } = await supabase
          .from('sales')
          .delete()
          .eq('id', id);
        error = deleteError;
      } else {
        error = updateError;
      }
    }
  }

  if (error) {
    alert('Error al eliminar el registro: ' + error.message);
  } else {
    alert('Registro eliminado correctamente');
    // Recargar los datos
    await fetchEntries();
    await fetchSales();
  }
};

onMounted(() => {
  // Cargar datos iniciales
  fetchEntries();
  fetchSales();
  updateDateTime();
  
  // Actualizar fecha y hora cada minuto
  setInterval(updateDateTime, 60000);
  
  // Actualizar datos cada 5 segundos para mantener el stock final actualizado
  const updateInterval = setInterval(() => {
    fetchEntries();
    fetchSales();
  }, 5000);

  // Limpiar el intervalo cuando el componente se desmonte
  onUnmounted(() => {
    clearInterval(updateInterval);
  });
});
</script>

<style scoped>
.history-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.logo {
  height: 50px;
  width: auto;
}

.btn-back {
  margin-left: auto;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  text-decoration: none;
  color: white;
  background-image: linear-gradient(to right, #3498db 0%, #2980b9 51%, #3498db 100%);
  background-size: 200% auto;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background-position: right center;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  background-size: 200% auto;
  color: white;
  text-transform: uppercase;
}

/* Botón de entradas con degradado verde */
.tab-btn:first-child {
  background-image: linear-gradient(to right, #27ae60 0%, #2ecc71 51%, #27ae60 100%);
}

/* Botón de salidas con degradado rojo */
.tab-btn:last-child {
  background-image: linear-gradient(to right, #e74c3c 0%, #c0392b 51%, #e74c3c 100%);
}

.tab-btn:hover {
  background-position: right center;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.tab-btn.active {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(0,0,0,0.3);
}

.current-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.current-info p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: bold;
}

tr {
  transition: all 0.3s ease;
}

tr:hover {
  background: #f8f9fa;
  transform: translateX(5px);
  box-shadow: -5px 0 10px rgba(0,0,0,0.1);
}

.quantity-added {
  color: #27ae60;
  font-weight: bold;
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: rgba(39, 174, 96, 0.1);
}

.quantity-reduced {
  color: #e74c3c;
  font-weight: bold;
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: rgba(231, 76, 60, 0.1);
}

.no-data {
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
}

tr:nth-child(even) {
  background: #f8f9fa;
}

.btn-delete {
  background-image: linear-gradient(to right, #e74c3c 0%, #c0392b 51%, #e74c3c 100%);
  background-size: 200% auto;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  position: relative;
}

.btn-delete:hover {
  background-position: right center;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
}

.product-image {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.product-image:hover {
  transform: scale(1.1);
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Estilos para el modal de imágenes */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.modal-content img {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.close-modal {
  position: absolute;
  top: -30px;
  right: -30px;
  color: white;
  font-size: 28px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.5);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-modal:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}
</style>
