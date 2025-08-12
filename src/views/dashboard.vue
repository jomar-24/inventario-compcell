<script setup>
// --- TU LÓGICA DEL DASHBOARD (CON CORRECCIONES Y MEJORAS) ---
import { ref, onMounted, computed } from 'vue';
import supabase from '../supabase';

const products = ref([]);
const categories = ref([]);
const loading = ref(false);
const newCategory = ref({ name: '' });
const newProduct = ref({ name: '', stock: 0, price: 0, category_id: null });
const newProductImage = ref(null);
const sale = ref({ productId: null, quantity: 1 });
const entry = ref({ productId: null, quantity: 1 });
const activeModal = ref('none');
const editingProduct = ref(null);
const editProductData = ref({ name: '', stock: 0, price: 0, category_id: null });
const isImageModalVisible = ref(false);
const modalImageUrl = ref('');
const historyType = ref('');
const historyEntries = ref([]);
const historySales = ref([]);

// NUEVAS REFS PARA BÚSQUEDA
const searchProduct = ref('');
const searchCategory = ref('');
const searchSaleProduct = ref('');
const searchEntryProduct = ref('');
const searchProductCategory = ref('');

// NUEVAS REFS PARA CONTROLAR LA VISIBILIDAD DE LOS SELECTS
const showProductCategoryDropdown = ref(false);
const showSaleProductDropdown = ref(false);
const showEntryProductDropdown = ref(false);

// COMPUTED PARA FILTROS
const filteredProducts = computed(() => {
  let filtered = products.value;
  
  if (searchProduct.value.trim()) {
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(searchProduct.value.toLowerCase()) ||
      product.categories?.name.toLowerCase().includes(searchProduct.value.toLowerCase())
    );
  }
  
  return filtered;
});

const filteredCategories = computed(() => {
  if (!searchCategory.value.trim()) {
    return categories.value;
  }
  
  return categories.value.filter(category => 
    category.name.toLowerCase().includes(searchCategory.value.toLowerCase())
  );
});

// FILTROS PARA MODALES
const filteredSaleProducts = computed(() => {
  if (!searchSaleProduct.value.trim()) {
    return products.value;
  }
  
  return products.value.filter(product => 
    product.name.toLowerCase().includes(searchSaleProduct.value.toLowerCase()) ||
    product.categories?.name.toLowerCase().includes(searchSaleProduct.value.toLowerCase())
  );
});

const filteredEntryProducts = computed(() => {
  if (!searchEntryProduct.value.trim()) {
    return products.value;
  }
  
  return products.value.filter(product => 
    product.name.toLowerCase().includes(searchEntryProduct.value.toLowerCase()) ||
    product.categories?.name.toLowerCase().includes(searchEntryProduct.value.toLowerCase())
  );
});

const filteredProductCategories = computed(() => {
  if (!searchProductCategory.value.trim()) {
    return categories.value;
  }
  
  return categories.value.filter(category => 
    category.name.toLowerCase().includes(searchProductCategory.value.toLowerCase())
  );
});

function openModal(modalName) { 
  activeModal.value = modalName; 
  // Resetear búsquedas al abrir modal
  if (modalName === 'addProduct') {
    searchProductCategory.value = '';
    showProductCategoryDropdown.value = false;
  } else if (modalName === 'addSale') {
    searchSaleProduct.value = '';
    showSaleProductDropdown.value = false;
  } else if (modalName === 'addEntry') {
    searchEntryProduct.value = '';
    showEntryProductDropdown.value = false;
  }
}

function closeModal() { 
  activeModal.value = 'none'; 
  // Resetear estados de dropdown
  showProductCategoryDropdown.value = false;
  showSaleProductDropdown.value = false;
  showEntryProductDropdown.value = false;
}

function showImageModal(imageUrl) { if(imageUrl) { modalImageUrl.value = imageUrl; isImageModalVisible.value = true; } }
function closeImageModal() { isImageModalVisible.value = false; }

// FUNCIONES PARA MANEJAR LOS DROPDOWNS PERSONALIZADOS
function toggleProductCategoryDropdown() {
  showProductCategoryDropdown.value = !showProductCategoryDropdown.value;
}

function selectProductCategory(categoryId, categoryName) {
  newProduct.value.category_id = categoryId;
  searchProductCategory.value = categoryName;
  showProductCategoryDropdown.value = false;
}

function toggleSaleProductDropdown() {
  showSaleProductDropdown.value = !showSaleProductDropdown.value;
}

function selectSaleProduct(productId, productName, stock) {
  sale.value.productId = productId;
  searchSaleProduct.value = `${productName} (Stock: ${stock})`;
  showSaleProductDropdown.value = false;
}

function toggleEntryProductDropdown() {
  showEntryProductDropdown.value = !showEntryProductDropdown.value;
}

function selectEntryProduct(productId, productName, stock) {
  entry.value.productId = productId;
  searchEntryProduct.value = `${productName} (Stock actual: ${stock})`;
  showEntryProductDropdown.value = false;
}

async function getCategories() { 
  const { data } = await supabase.from('categories').select('*').order('name'); 
  categories.value = data; 
}

async function getProducts() { 
  const { data } = await supabase.from('products').select(`*, categories ( id, name )`).order('id'); 
  products.value = data; 
}

function handleFileSelect(event) { newProductImage.value = event.target.files[0]; }

async function addCategory() {
  if (!newCategory.value.name) return;
  loading.value = true;
  const { error } = await supabase.from('categories').insert([{ name: newCategory.value.name }]);
  loading.value = false;
  if (error) {
    alert('Hubo un error.');
    return;
  }
  // Si fue exitoso:
  await getCategories();
  newCategory.value.name = '';
  closeModal();
}

async function addProduct() {
  if (!newProduct.value.category_id) {
    alert('Debes seleccionar una categoría');
    return;
  }

  
  loading.value = true; 
  let imageUrl = null;
  
  if (newProductImage.value) {
    const fileName = `${Date.now()}-${newProductImage.value.name}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, newProductImage.value);
    if (error) { loading.value = false; return; }
    imageUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
  }
  
  const { error: insertError } = await supabase.from('products').insert([{ ...newProduct.value, image_url: imageUrl }]);
  loading.value = false;
  
  if (!insertError) {
    await getProducts();
    newProduct.value = { name: '', stock: 0, price: 0, category_id: null };
    newProductImage.value = null;
    searchProductCategory.value = '';
    const fileInput = document.getElementById('productImage');
    if (fileInput) fileInput.value = '';
    closeModal();
  }
}

async function sellProduct() {
  try {
    if (!sale.value.productId) { 
      alert('Selecciona un producto.'); 
      return; 
    }
    
    const productToSell = products.value.find(p => p.id === sale.value.productId);
    if (!productToSell) {
      alert('Producto no encontrado.');
      return;
    }

    const newStock = productToSell.stock - sale.value.quantity;
    if (newStock < 0) { 
      alert('No hay suficiente stock.'); 
      return; 
    }

    // Calculamos el precio total de esta venta específica
    const totalPriceOfSale = productToSell.price * sale.value.quantity;

    // Primero actualizamos el stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', sale.value.productId);

    if (updateError) {
      console.error('Error al actualizar stock:', updateError);
      alert('Error al actualizar el stock: ' + updateError.message);
      return;
    }

    // Registramos la venta en el historial
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([{
        product_id: sale.value.productId,
        quantity_sold: sale.value.quantity, // Cambiado de quantity a quantity_sold
        final_stock: newStock,
        sale_price: totalPriceOfSale,
        created_at: new Date().toISOString() // Añadimos la fecha explícitamente
      }])
      .select();

    if (saleError) {
      console.error('Error al registrar venta:', saleError);
      alert('Error al registrar la venta en el historial: ' + saleError.message);
      
      // Intentamos revertir el stock si falló el registro de la venta
      const { error: revertError } = await supabase
        .from('products')
        .update({ stock: productToSell.stock })
        .eq('id', sale.value.productId);
        
      if (revertError) {
        console.error('Error al revertir stock:', revertError);
      }
      return;
    }

    // Si todo fue exitoso
    await getProducts();
    sale.value = { productId: null, quantity: 1 };
    searchSaleProduct.value = '';
    closeModal();
    alert('Venta registrada exitosamente');
  } catch (error) {
    console.error('Error en sellProduct:', error);
    alert('Error inesperado al procesar la venta');
  }
}

async function registerEntry() {
  if (!entry.value.productId) { alert('Selecciona un producto.'); return; }
  const productToUpdate = products.value.find(p => p.id === entry.value.productId);
  const newStock = productToUpdate.stock + parseInt(entry.value.quantity, 10);
  
  // Primero actualizamos el stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', entry.value.productId);

  if (!updateError) {
    // Luego registramos la entrada en la tabla entries
    const { error: entryError } = await supabase
      .from('entries')
      .insert([{
        product_id: entry.value.productId,
        quantity_added: entry.value.quantity,
        final_stock: newStock,
      }]);

    if (!entryError) {
      await getProducts();
      entry.value = { productId: null, quantity: 1 };
      searchEntryProduct.value = '';
      closeModal();
    } else {
      alert('Error al registrar la entrada en el historial');
    }
  }
}

async function deleteProduct(id) { 
  if (!confirm('¿Seguro que quieres eliminar este producto?')) return; 
  const { error } = await supabase.from('products').delete().eq('id', id); 
  if (!error) { 
    await getProducts(); 
    alert('Producto eliminado correctamente');
  } else {
    alert('Error al eliminar el producto');
  }
}

// FUNCIÓN CORREGIDA PARA EDITAR
function startEdit(product) { 
  editingProduct.value = product; 
  editProductData.value = { 
    name: product.name, 
    stock: product.stock, 
    price: product.price, 
    category_id: product.categories ? product.categories.id : null
  }; 
}

async function saveEditProduct() { 
  if (!editingProduct.value) return; 
  const { error } = await supabase.from('products').update({ ...editProductData.value }).eq('id', editingProduct.value.id); 
  if (!error) { 
    editingProduct.value = null; 
    await getProducts(); 
    alert('Producto actualizado correctamente');
  } else {
    alert('Error al actualizar el producto');
  }
}

function cancelEdit() { 
  editingProduct.value = null; 
}

// FUNCIONES PARA LIMPIAR BÚSQUEDAS
function clearProductSearch() {
  searchProduct.value = '';
}

function clearCategorySearch() {
  searchCategory.value = '';
}

function clearSaleProductSearch() {
  searchSaleProduct.value = '';
  sale.value.productId = null;
}

function clearEntryProductSearch() {
  searchEntryProduct.value = '';
  entry.value.productId = null;
}

function clearProductCategorySearch() {
  searchProductCategory.value = '';
  newProduct.value.category_id = null;
}

// Cerrar dropdowns al hacer clic fuera
function handleClickOutside(event) {
  if (!event.target.closest('.custom-select')) {
    showProductCategoryDropdown.value = false;
    showSaleProductDropdown.value = false;
    showEntryProductDropdown.value = false;
  }
}

// Las funciones del historial se han movido a History.vue

// Las funciones del historial se han movido a History.vue

function formatDate(date) {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

onMounted(() => { 
  getProducts(); 
  getCategories();
  document.addEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="dashboard-container">
    <div id="container">
      <div class="title-container">
        <img src="/logo.png" alt="Compcell Logo" class="logo">
        <h1>Inventario Compcell</h1>
      </div>
      
  <div class="actions">
    <button class="btn btn-add" @click="openModal('addProduct')">AÑADIR NUEVO PRODUCTO</button>
    <button class="btn btn-stock" @click="openModal('addEntry')">REGISTRAR ENTRADA (STOCK)</button>
    <button class="btn btn-sale" @click="openModal('addSale')">REGISTRAR VENTA</button>
    <button class="btn btn-category" @click="openModal('addCategory')">CREAR CATEGORÍA</button>
    <router-link to="/history" class="btn btn-history">VER HISTORIAL</router-link>
    <router-link to="/categories" class="btn btn-view-categories">📁 VER POR CATEGORÍA</router-link>
  </div>      <hr>
      
      <!-- BARRA DE BÚSQUEDA PARA PRODUCTOS -->
      <div class="search-container">
        <h2>Lista de Productos</h2>
        <div class="search-box" style="max-width: 400px;">
          <input 
            v-model="searchProduct" 
            type="text" 
            placeholder="🔍 Buscar productos..." 
            class="search-input"
          >
          <button v-if="searchProduct" @click="clearProductSearch" class="clear-search">✕</button>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(product, index) in filteredProducts" :key="product.id" :class="{ 'dark-row': index % 2 !== 0 }">
              <template v-if="editingProduct && editingProduct.id === product.id">
                <td><img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="product-img"></td>
                <td><input v-model="editProductData.name" type="text" class="edit-input" /></td>
                <td>
                  <select v-model="editProductData.category_id" class="edit-select">
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                  </select>
                </td>
                <td><input v-model="editProductData.stock" type="number" class="edit-input" /></td>
                <td><input v-model="editProductData.price" type="number" step="0.01" class="edit-input" /></td>
                <td>
                  <button @click="saveEditProduct" class="btn-edit">✓ Guardar</button>
                  <button @click="cancelEdit" class="btn-delete">✕ Cancelar</button>
                </td>
              </template>
              <template v-else>
                <td>
                  <div class="product-img-container" @click="showImageModal(product.image_url)">
                    <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="product-img">
                    <span v-else class="no-image">Sin Imagen</span>
                    <div class="img-overlay">VISUALIZAR IMAGEN</div>
                  </div>
                </td>
                <td>{{ product.name }}</td>
                <td>{{ product.categories?.name || 'Sin categoría' }}</td>
                <td>
                  <span :class="{ 'low-stock': product.stock <= 5, 'out-stock': product.stock === 0 }">
                    {{ product.stock }}
                  </span>
                </td>
                <td>S/ {{ product.price }}</td>
                <td>
                  <button @click="startEdit(product)" class="btn-edit">✏️ Editar</button>
                  <button @click="deleteProduct(product.id)" class="btn-delete">🗑️ Eliminar</button>
                </td>
              </template>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="6" class="no-results">No se encontraron productos</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL DE IMAGEN -->
    <div id="image-modal" class="modal" :class="{ 'show': isImageModalVisible }" @click.self="closeImageModal">
      <span class="modal-close" @click="closeImageModal">&times;</span>
      <img class="modal-content" :src="modalImageUrl">
    </div>

    <!-- MODAL DE HISTORIAL -->
    <div v-if="activeModal === 'history'" class="modal" :class="{ 'show': activeModal === 'history' }" @click.self="closeModal">
      <div class="modal-form-content history-modal">
        <span class="modal-close" @click="closeModal">&times;</span>
        
        <h3>{{ historyType === 'entries' ? '📥 Historial de Entradas' : '📤 Historial de Ventas' }}</h3>
        
        <div class="history-table">
          <table>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Stock Final</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="historyType === 'entries'">
                <tr v-for="entry in historyEntries" :key="entry.id">
                  <td>{{ formatDate(entry.created_at) }}</td>
                  <td>{{ entry.product?.name }}</td>
                  <td class="quantity-added">+{{ entry.quantity_added }}</td>
                  <td>{{ entry.final_stock }}</td>
                  <td>
                    <button 
                      @click="deleteHistoryEntry('entries', entry.id, entry.product_id, entry.quantity_added)" 
                      class="btn-delete-history"
                      title="Eliminar entrada"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
                <tr v-if="historyEntries.length === 0">
                  <td colspan="5" class="no-data">No hay registros de entradas</td>
                </tr>
              </template>
              <template v-else>
                <tr v-for="sale in historySales" :key="sale.id">
                  <td>{{ formatDate(sale.created_at) }}</td>
                  <td>{{ sale.product?.name }}</td>
                  <td class="quantity-reduced">-{{ sale.quantity }}</td>
                  <td>{{ sale.final_stock }}</td>
                  <td>
                    <button 
                      @click="deleteHistoryEntry('sales', sale.id, sale.product_id, sale.quantity)" 
                      class="btn-delete-history"
                      title="Eliminar venta"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
                <tr v-if="historySales.length === 0">
                  <td colspan="5" class="no-data">No hay registros de ventas</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODALES DE FORMULARIOS -->
    <div v-if="activeModal !== 'none'" class="modal" :class="{ 'show': activeModal !== 'none' }" @click.self="closeModal">
      <div class="modal-form-content">
        <span class="modal-close" @click="closeModal">&times;</span>
        
        <!-- FORMULARIO AÑADIR PRODUCTO -->
        <form v-if="activeModal === 'addProduct'" @submit.prevent="addProduct">
          <h3>🆕 Añadir Producto</h3>
          <input v-model="newProduct.name" type="text" placeholder="Nombre del producto" required />
          
          <!-- SELECT PERSONALIZADO PARA CATEGORÍAS -->
          <div class="custom-select">
            <div class="select-display" @click="toggleProductCategoryDropdown">
              <input 
                v-model="searchProductCategory" 
                type="text" 
                placeholder="🔍 Buscar y seleccionar categoría..." 
                class="select-search"
                @click.stop="showProductCategoryDropdown = true"
              >
              <button 
                v-if="searchProductCategory" 
                @click.stop="clearProductCategorySearch" 
                type="button" 
                class="clear-search-select"
              >✕</button>
            </div>
            
            <div v-if="showProductCategoryDropdown" class="select-dropdown">
              <div 
                v-for="cat in filteredProductCategories" 
                :key="cat.id" 
                class="select-option"
                @click="selectProductCategory(cat.id, cat.name)"
              >
                {{ cat.name }}
              </div>
              <div v-if="filteredProductCategories.length === 0" class="no-options">
                No se encontraron categorías
              </div>
            </div>
          </div>
          
          <input v-model="newProduct.stock" type="number" placeholder="Stock inicial" min="0" />
          <input v-model="newProduct.price" type="number" step="0.01" placeholder="Precio" min="0" />
          <input id="productImage" type="file" @change="handleFileSelect" accept="image/*" />
          <button type="submit" :disabled="loading">{{ loading ? '⏳ Subiendo...' : '✅ Añadir Producto' }}</button>
        </form>
        
        <!-- FORMULARIO REGISTRAR ENTRADA -->
        <form v-if="activeModal === 'addEntry'" @submit.prevent="registerEntry">
          <h3>📦 Registrar Entrada de Stock</h3>
          
          <!-- SELECT PERSONALIZADO PARA PRODUCTOS DE ENTRADA -->
          <div class="custom-select">
            <div class="select-display" @click="toggleEntryProductDropdown">
              <input 
                v-model="searchEntryProduct" 
                type="text" 
                placeholder="🔍 Buscar y seleccionar producto..." 
                class="select-search"
                @click.stop="showEntryProductDropdown = true"
              >
              <button 
                v-if="searchEntryProduct" 
                @click.stop="clearEntryProductSearch" 
                type="button" 
                class="clear-search-select"
              >✕</button>
            </div>
            
            <div v-if="showEntryProductDropdown" class="select-dropdown">
              <div 
                v-for="p in filteredEntryProducts" 
                :key="p.id" 
                class="select-option"
                @click="selectEntryProduct(p.id, p.name, p.stock)"
              >
                {{ p.name }} <span class="stock-info">(Stock actual: {{ p.stock }})</span>
              </div>
              <div v-if="filteredEntryProducts.length === 0" class="no-options">
                No se encontraron productos
              </div>
            </div>
          </div>
          
          <input v-model="entry.quantity" type="number" min="1" placeholder="Cantidad a añadir" required />
          <button type="submit">📈 Añadir Stock</button>
        </form>
        
        <!-- FORMULARIO REGISTRAR VENTA -->
        <form v-if="activeModal === 'addSale'" @submit.prevent="sellProduct">
          <h3>💰 Registrar Venta</h3>
          
          <!-- SELECT PERSONALIZADO PARA PRODUCTOS DE VENTA -->
          <div class="custom-select">
            <div class="select-display" @click="toggleSaleProductDropdown">
              <input 
                v-model="searchSaleProduct" 
                type="text" 
                placeholder="🔍 Buscar y seleccionar producto..." 
                class="select-search"
                @click.stop="showSaleProductDropdown = true"
              >
              <button 
                v-if="searchSaleProduct" 
                @click.stop="clearSaleProductSearch" 
                type="button" 
                class="clear-search-select"
              >✕</button>
            </div>
            
            <div v-if="showSaleProductDropdown" class="select-dropdown">
              <div 
                v-for="p in filteredSaleProducts" 
                :key="p.id" 
                class="select-option"
                @click="selectSaleProduct(p.id, p.name, p.stock)"
                :class="{ 'low-stock-option': p.stock <= 5, 'out-stock-option': p.stock === 0 }"
              >
                {{ p.name }} <span class="stock-info">(Stock: {{ p.stock }})</span>
              </div>
              <div v-if="filteredSaleProducts.length === 0" class="no-options">
                No se encontraron productos
              </div>
            </div>
          </div>
          
          <input v-model="sale.quantity" type="number" min="1" placeholder="Cantidad vendida" required />
          <button type="submit">💳 Registrar Venta</button>
        </form>
        
        <!-- FORMULARIO CREAR CATEGORÍA -->
        <form v-if="activeModal === 'addCategory'" @submit.prevent="addCategory">
          <h3>🏷️ Crear Nueva Categoría</h3>
          <!-- BÚSQUEDA DE CATEGORÍAS EXISTENTES -->
          <div class="search-box">
            <input 
              v-model="searchCategory" 
              type="text" 
              placeholder="🔍 Buscar categorías existentes..." 
              class="search-input"
            >
            <button v-if="searchCategory" @click="clearCategorySearch" type="button" class="clear-search">✕</button>
          </div>
          
          <!-- LISTA DE CATEGORÍAS EXISTENTES -->
          <div v-if="filteredCategories.length > 0" class="existing-categories">
            <h4>Categorías existentes:</h4>
            <div class="categories-list">
              <span v-for="cat in filteredCategories" :key="cat.id" class="category-tag">
                {{ cat.name }}
              </span>
            </div>
          </div>
          
          <input v-model="newCategory.name" type="text" placeholder="Nombre de la nueva categoría" required />
          <button type="submit" :disabled="loading">{{ loading ? '⏳ Creando...' : '🏷️ Crear Categoría' }}</button>
        </form>
      </div>
    </div>
.  </div>
</template>

<style scoped>
.dashboard-container {
    background: linear-gradient(135deg, #e0eafc, #cfdef3);
    background-attachment: fixed;
    padding: 2rem;
    color: #2c3e50;
    min-height: 100vh;
}

#container {
    max-width: 1200px;
    margin: auto;
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.title-container { 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    gap: 1rem; 
    margin-bottom: 1.5rem; 
}

.logo { height: 80px; }

h1 { 
    font-size: 2.5rem; 
    color: #2c3e50; 
    margin: 0; 
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1); 
}

h2 { 
    font-size: 1.5rem; 
    color: #34495e; 
    margin: 0;
    text-align: left; 
    font-weight: 500; 
}

hr { 
    border: none; 
    height: 1px; 
    background-color: rgba(44, 62, 80, 0.2); 
    margin: 2rem 0; 
}

/* ESTILOS DE BÚSQUEDA */
.search-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.search-box {
    position: relative;
    flex: 1;
    max-width: 300px;
}

.search-input {
    width: 100%;
    padding: 0.8rem 2.5rem 0.8rem 1rem;
    border: 2px solid #ddd;
    border-radius: 25px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: #f8f9fa;
}

.search-input:focus {
    outline: none;
    border-color: #3498db;
    background: white;
    box-shadow: 0 0 10px rgba(52, 152, 219, 0.2);
}

.clear-search {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clear-search:hover {
    background: #c0392b;
}

/* ESTILOS PARA SELECT PERSONALIZADO */
.custom-select {
    position: relative;
    margin-bottom: 1rem;
}

.select-display {
    position: relative;
}

.select-search {
    width: 100%;
    padding: 0.8rem 2.5rem 0.8rem 1rem;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white;
    cursor: text;
}

.select-search:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

.clear-search-select {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clear-search-select:hover {
    background: #c0392b;
}

.select-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 2px solid #3498db;
    border-top: none;
    border-radius: 0 0 6px 6px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.select-option {
    padding: 0.8rem 1rem;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s ease;
}

.select-option:hover {
    background-color: #f8f9fa;
}

.select-option:last-child {
    border-bottom: none;
}

.stock-info {
    color: #7f8c8d;
    font-size: 0.9rem;
    font-weight: normal;
}

.low-stock-option {
    background-color: #fff3cd;
    border-left: 4px solid #e67e22;
}

.out-stock-option {
    background-color: #f8d7da;
    border-left: 4px solid #e74c3c;
    color: #721c24;
}

.no-options {
    padding: 1rem;
    text-align: center;
    color: #7f8c8d;
    font-style: italic;
}

.actions, .history-actions { 
    display: flex; 
    justify-content: center; 
    gap: 1rem; 
    flex-wrap: wrap; 
    margin-bottom: 1.5rem; 
}

.history-actions {
    margin-top: 1rem;
}

.btn { 
    border: none; 
    padding: 0.8rem 1.5rem; 
    border-radius: 8px; 
    font-size: 0.9rem; 
    font-weight: bold; 
    color: white; 
    cursor: pointer; 
    transition: all 0.4s ease-in-out; 
    text-transform: uppercase; 
    background-size: 200% auto; 
}

.btn:hover { 
    transform: translateY(-2px); 
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    background-position: right center;
}

.btn-history { 
    background-image: linear-gradient(to right, #f39c12 0%, #f1c40f 51%, #f39c12 100%);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
}

.btn-add { 
    background-image: linear-gradient(to right, #16a085 0%, #1abc9c 51%, #16a085 100%); 
}

.btn-stock { 
    background-image: linear-gradient(to right, #2980b9 0%, #3498db 51%, #2980b9 100%); 
}

.btn-sale { 
    background-image: linear-gradient(to right, #e74c3c 0%, #c0392b 51%, #e74c3c 100%); 
}

.btn-category { 
    background-image: linear-gradient(to right, #8e44ad 0%, #9b59b6 51%, #8e44ad 100%); 
}

.btn-history-in {
    background-image: linear-gradient(to right, #27ae60 0%, #2ecc71 51%, #27ae60 100%);
}

.btn-history-out {
    background-image: linear-gradient(to right, #e74c3c 0%, #c0392b 51%, #e74c3c 100%);
}

.btn-view-categories {
  background-image: linear-gradient(to right, #5d4157 0%, #a8caba 51%, #5d4157 100%);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.history-modal {
    max-width: 800px !important;
}

.history-table {
    margin-top: 1rem;
    overflow-x: auto;
}

.quantity-added {
    color: #27ae60;
    font-weight: bold;
}

.quantity-reduced {
    color: #e74c3c;
    font-weight: bold;
}

.no-data {
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  padding: 1rem;
}

.btn-delete-history {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.btn-delete-history:hover {
  background-color: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}.table-container { 
    overflow-x: auto; 
    border-radius: 8px;
    border: 1px solid #ddd;
}

table { 
    width: 100%; 
    border-collapse: collapse; 
}

th, td { 
    padding: 1rem; 
    text-align: left; 
    vertical-align: middle; 
    border-bottom: 1px solid #f0f0f0;
}

thead th { 
    color: #34495e; 
    font-weight: 600; 
    background: #f8f9fa;
    position: sticky;
    top: 0;
    z-index: 10;
}

tbody tr:hover { 
    background-color: #f9f9f9; 
}

.product-img { 
    max-width: 70px; 
    height: auto; 
    border-radius: 5px; 
    display: block; 
}

.no-image {
    display: block;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 5px;
    text-align: center;
    color: #666;
    font-size: 0.8rem;
}

.product-img-container { 
    position: relative; 
    cursor: pointer; 
    display: inline-block; 
}

.img-overlay { 
    position: absolute; 
    bottom: 0; 
    left: 0; 
    right: 0; 
    background-color: rgba(0, 0, 0, 0.6); 
    color: white; 
    text-align: center; 
    padding: 5px 0; 
    font-size: 0.7rem; 
    opacity: 0; 
    transition: opacity 0.3s ease; 
    border-bottom-left-radius: 5px; 
    border-bottom-right-radius: 5px; 
    pointer-events: none; 
}

.product-img-container:hover .img-overlay { 
    opacity: 1; 
}

/* ESTILOS PARA STOCK */
.low-stock {
    color: #e67e22;
    font-weight: bold;
}

.out-stock {
    color: #e74c3c;
    font-weight: bold;
}

/* ESTILOS DE EDICIÓN */
.edit-input, .edit-select {
    width: 100%;
    padding: 0.5rem;
    border: 2px solid #3498db;
    border-radius: 4px;
    font-size: 0.9rem;
}

.edit-input:focus, .edit-select:focus {
    outline: none;
    border-color: #2980b9;
    box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

.btn-edit, .btn-delete { 
    border: none; 
    padding: 0.5rem 1rem; 
    border-radius: 5px; 
    color: white; 
    cursor: pointer; 
    font-size: 0.8rem; 
    transition: all 0.2s ease; 
    margin-right: 5px;
    margin-bottom: 2px;
}

.btn-edit { 
    background-color: #3498db; 
}

.btn-delete { 
    background-color: #e74c3c; 
}

.btn-edit:hover { 
    background-color: #2980b9;
    transform: translateY(-1px);
}

.btn-delete:hover { 
    background-color: #c0392b;
    transform: translateY(-1px);
}

.no-results {
    text-align: center;
    color: #7f8c8d;
    font-style: italic;
    padding: 2rem;
}

/* ESTILOS DE MODALES */
.modal { 
    display: none; 
    position: fixed; 
    z-index: 1000; 
    left: 0; 
    top: 0; 
    width: 100%; 
    height: 100%; 
    overflow: auto; 
    background-color: rgba(0,0,0,0.6); 
    justify-content: center; 
    align-items: center; 
}

.modal.show { 
    display: flex; 
}

.modal-content { 
    margin: auto; 
    display: block; 
    max-width: 80%; 
    max-height: 80vh; 
    animation: zoomIn 0.3s ease; 
    border-radius: 8px;
}

.modal-form-content { 
    background: white; 
    padding: 2rem; 
    border-radius: 12px; 
    width: 90%; 
    max-width: 500px; 
    position: relative; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
    max-height: 90vh;
    overflow-y: auto;
}

.modal-form-content form { 
    display: flex; 
    flex-direction: column; 
    gap: 1rem; 
}

.modal-form-content h3 {
    margin-bottom: 1rem;
    color: #2c3e50;
    text-align: center;
    font-size: 1.3rem;
}

.modal-form-content input, .modal-form-content select, .modal-form-content button { 
    font-size: 1rem; 
    padding: 0.8rem; 
    border-radius: 6px; 
}

.modal-form-content input, .modal-form-content select { 
    border: 2px solid #ddd; 
    color: #333;
    transition: border-color 0.3s ease;
}

.modal-form-content input:focus, .modal-form-content select:focus {
    outline: none;
    border-color: #3498db;
}

.modal-form-content button { 
    border: none; 
    color: white; 
    background-color: #16a085; 
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
}

.modal-form-content button:hover {
    background-color: #1abc9c;
    transform: translateY(-2px);
}

.modal-form-content button:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
    transform: none;
}

.existing-categories {
    margin: 1rem 0;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #3498db;
}

.existing-categories h4 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    font-size: 0.9rem;
}

.categories-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.category-tag {
    background: #3498db;
    color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 500;
}

@keyframes zoomIn { 
    from { transform: scale(0.5); } 
    to { transform: scale(1); } 
}

.modal-close { 
    position: absolute; 
    top: 15px; 
    right: 25px; 
    color: #aaa; 
    font-size: 30px; 
    font-weight: bold; 
    transition: 0.3s; 
    cursor: pointer; 
}

.modal-close:hover, .modal-close:focus { 
    color: #333; 
}

/* RESPONSIVE */
@media (max-width: 768px) {
    .search-container {
        flex-direction: column;
        align-items: stretch;
    }
    
    .search-box {
        max-width: none;
    }
    
    .actions {
        flex-direction: column;
    }
    
    .btn {
        width: 100%;
    }
    
    .table-container {
        font-size: 0.9rem;
    }
    
    th, td {
        padding: 0.5rem;
    }
    
    .custom-select {
        position: relative;
    }
    
    .select-dropdown {
        position: fixed;
        top: auto;
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        max-height: 50vh;
    }
}
</style>