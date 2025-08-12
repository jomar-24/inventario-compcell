<script setup>
import { ref, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { useRoute, useRouter } from 'vue-router'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// --- CONEXIÓN Y VARIABLES ---
const supabaseUrl = 'https://loakfoqfdgegvzjgkjnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYWtmb3FmZGdlZ3Z6amdram52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg4NDgsImV4cCI6MjA2OTM4NDg0OH0.a1-90tbgDWTHhNy7ScSysaycji6wBAKXs2378u5Twik';
const supabase = createClient(supabaseUrl, supabaseKey);

const route = useRoute();
const router = useRouter();
const category = ref(null);
const products = ref([]);
const loading = ref(true);

// --- FUNCIONES ---
async function fetchCategoryDetails() {
  loading.value = true;
  const categoryId = route.params.id;

  const { data, error } = await supabase
    .from('products')
    .select(`*, categories ( name )`)
    .eq('category_id', categoryId);

  if (data && data.length > 0) {
    products.value = data;
    category.value = data[0].categories;
  } else {
    const { data: catData } = await supabase.from('categories').select('name').eq('id', categoryId).single();
    if (catData) {
      category.value = catData;
    }
  }
  loading.value = false;
}

function goBackToCategories() {
  router.push('/categories');
}

async function exportToPDF() {
  try {
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([595, 842]) // Tamaño A4 en puntos
    const { width, height } = page.getSize()
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // --- CABECERA ---
    try {
      const logoBytes = await fetch('/logo.png').then(res => res.arrayBuffer())
      const logoImage = await pdfDoc.embedPng(logoBytes)
      
      // Logo
      page.drawImage(logoImage, {
        x: 50,
        y: height - 100,
        width: 60,
        height: 60
      })
    } catch (e) {
      console.log('Logo no encontrado, continuando sin logo')
    }
    
    // Título principal
    page.drawText('Reporte de Inventario', {
      x: width / 2 - 100,
      y: height - 60,
      font: boldFont,
      size: 24,
      color: rgb(0.2, 0.2, 0.2)
    })
    
    // Subtítulo (categoría)
    const categoryText = `Categoría: ${category.value?.name || 'Sin categoría'}`
    page.drawText(categoryText, {
      x: width / 2 - (categoryText.length * 4),
      y: height - 90,
      font: boldFont,
      size: 16,
      color: rgb(0.4, 0.4, 0.4)
    })

    // Fecha y hora del reporte con formato 12 horas
    const currentDate = new Date()
    const dateString = currentDate.toLocaleDateString('es-PE')
    const timeString = currentDate.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
    const dateTimeText = `Fecha: ${dateString} - Hora: ${timeString}`
    
    page.drawText(dateTimeText, {
      x: width - 200,
      y: height - 120,
      font,
      size: 10,
      color: rgb(0.5, 0.5, 0.5)
    })

    // --- LISTA DE PRODUCTOS ---
    let y = height - 160
    const itemHeight = 120
    const margin = 40
    const contentWidth = width - (margin * 2)
    const itemsPerRow = 3
    const itemWidth = contentWidth / itemsPerRow
    let currentX = margin
    let itemsInCurrentRow = 0

    // Función mejorada para cargar imágenes con detección automática
    const loadProductImage = async (imageUrl) => {
      if (!imageUrl) return null
      
      try {
        console.log('Intentando cargar imagen:', imageUrl)
        
        // Usar fetch con modo cors si es necesario
        const response = await fetch(imageUrl, {
          mode: 'cors',
          method: 'GET'
        })
        
        if (!response.ok) {
          console.log('Respuesta no OK:', response.status, response.statusText)
          return null
        }
        
        const imageBytes = await response.arrayBuffer()
        console.log('Imagen cargada, tamaño:', imageBytes.byteLength)
        
        if (imageBytes.byteLength === 0) {
          console.log('Imagen vacía')
          return null
        }

        // Detectar formato por los primeros bytes (magic numbers)
        const uint8Array = new Uint8Array(imageBytes)
        const isJPEG = uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF
        const isPNG = uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47

        console.log('Magic numbers:', uint8Array.slice(0, 4), 'isJPEG:', isJPEG, 'isPNG:', isPNG)
        
        // Intentar cargar según el tipo detectado
        if (isPNG) {
          console.log('Cargando como PNG')
          return await pdfDoc.embedPng(imageBytes)
        } else if (isJPEG) {
          console.log('Cargando como JPEG')
          return await pdfDoc.embedJpg(imageBytes)
        } else {
          // Si no se puede detectar, intentar primero JPEG (más común)
          try {
            console.log('Intentando cargar como JPEG por defecto')
            return await pdfDoc.embedJpg(imageBytes)
          } catch (jpgError) {
            console.log('Falló JPEG, intentando PNG')
            try {
              return await pdfDoc.embedPng(imageBytes)
            } catch (pngError) {
              console.log('Falló PNG también:', pngError.message)
              return null
            }
          }
        }
      } catch (error) {
        console.log(`Error completo cargando imagen ${imageUrl}:`, error)
        return null
      }
    }

    for (let i = 0; i < products.value.length; i++) {
      const product = products.value[i]

      // Nueva página si no hay espacio vertical
      if (y - itemHeight < margin + 50) {
        page = pdfDoc.addPage([595, 842])
        y = height - 100
        currentX = margin
        itemsInCurrentRow = 0
      }

      // Nueva fila si completamos la anterior
      if (itemsInCurrentRow >= itemsPerRow) {
        y -= itemHeight + 20
        currentX = margin
        itemsInCurrentRow = 0
        
        if (y - itemHeight < margin + 50) {
          page = pdfDoc.addPage([595, 842])
          y = height - 100
          currentX = margin
          itemsInCurrentRow = 0
        }
      }

      // Marco de la tarjeta
      page.drawRectangle({
        x: currentX,
        y: y - itemHeight,
        width: itemWidth - 15,
        height: itemHeight,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1
      })

      // Fondo blanco
      page.drawRectangle({
        x: currentX + 1,
        y: y - itemHeight + 1,
        width: itemWidth - 17,
        height: itemHeight - 2,
        color: rgb(1, 1, 1)
      })

      // Imagen del producto
      const productImage = await loadProductImage(product.image_url)
      const imgSize = 60
      const imgX = currentX + (itemWidth - imgSize) / 2 - 7
      const imgY = y - 70

      if (productImage) {
        try {
          page.drawImage(productImage, {
            x: imgX,
            y: imgY,
            width: imgSize,
            height: imgSize
          })
          console.log('Imagen dibujada exitosamente para:', product.name)
        } catch (e) {
          console.log('Error dibujando imagen para:', product.name, e)
          // Placeholder si falla dibujar la imagen
          page.drawRectangle({
            x: imgX,
            y: imgY,
            width: imgSize,
            height: imgSize,
            color: rgb(0.95, 0.95, 0.95),
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 1
          })
          page.drawText('Sin imagen', {
            x: imgX + 10,
            y: imgY + imgSize/2,
            font,
            size: 8,
            color: rgb(0.6, 0.6, 0.6)
          })
        }
      } else {
        // Placeholder para sin imagen
        page.drawRectangle({
          x: imgX,
          y: imgY,
          width: imgSize,
          height: imgSize,
          color: rgb(0.95, 0.95, 0.95),
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1
        })
        page.drawText('Sin imagen', {
          x: imgX + 10,
          y: imgY + imgSize/2,
          font,
          size: 8,
          color: rgb(0.6, 0.6, 0.6)
        })
      }

      // Nombre del producto (manejo de texto largo)
      let productName = product.name || 'Sin nombre'
      if (productName.length > 30) {
        productName = productName.substring(0, 27) + '...'
      }

      const maxCharsPerLine = 15
      if (productName.length > maxCharsPerLine) {
        const words = productName.split(' ')
        let firstLine = ''
        let secondLine = ''
        let currentLine = 1

        for (const word of words) {
          if (currentLine === 1 && (firstLine + word).length <= maxCharsPerLine) {
            firstLine += (firstLine ? ' ' : '') + word
          } else {
            currentLine = 2
            secondLine += (secondLine ? ' ' : '') + word
          }
        }

        page.drawText(firstLine, {
          x: currentX + 5,
          y: y - itemHeight + 45,
          font: boldFont,
          size: 8,
          color: rgb(0.2, 0.2, 0.2)
        })

        if (secondLine) {
          page.drawText(secondLine, {
            x: currentX + 5,
            y: y - itemHeight + 35,
            font: boldFont,
            size: 8,
            color: rgb(0.2, 0.2, 0.2)
          })
        }
      } else {
        page.drawText(productName, {
          x: currentX + 5,
          y: y - itemHeight + 40,
          font: boldFont,
          size: 9,
          color: rgb(0.2, 0.2, 0.2)
        })
      }

      // Stock con colores según nivel
      const stock = product.stock || 0
      let stockColor = rgb(0.2, 0.2, 0.2)
      if (stock === 0) {
        stockColor = rgb(0.8, 0.1, 0.1) // Rojo
      } else if (stock <= 5) {
        stockColor = rgb(0.9, 0.5, 0.1) // Naranja
      } else {
        stockColor = rgb(0.1, 0.6, 0.1) // Verde
      }

      page.drawText(`Stock: ${stock}`, {
        x: currentX + 5,
        y: y - itemHeight + 20,
        font,
        size: 9,
        color: stockColor
      })

      // Precio
      const price = product.price || 0
      page.drawText(`S/ ${price}`, {
        x: currentX + itemWidth - 50,
        y: y - itemHeight + 20,
        font: boldFont,
        size: 10,
        color: rgb(0.1, 0.6, 0.3)
      })

      currentX += itemWidth
      itemsInCurrentRow++
    }
    
    // Pie de página con estadísticas
    if (products.value.length > 0) {
      // Línea separadora
      page.drawLine({
        start: { x: margin, y: 80 },
        end: { x: width - margin, y: 80 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      })
      
      // Total de productos
      page.drawText(`Total de productos en esta categoría: ${products.value.length}`, {
        x: margin,
        y: 60,
        font: boldFont,
        size: 12,
        color: rgb(0.3, 0.3, 0.3)
      })
      
      // Resumen de stock
      const totalStock = products.value.reduce((sum, product) => sum + (product.stock || 0), 0)
      const outOfStock = products.value.filter(product => (product.stock || 0) === 0).length
      const lowStock = products.value.filter(product => {
        const stock = product.stock || 0
        return stock > 0 && stock <= 5
      }).length
      
      page.drawText(`Stock total: ${totalStock} | Sin stock: ${outOfStock} | Stock bajo: ${lowStock}`, {
        x: margin,
        y: 40,
        font,
        size: 10,
        color: rgb(0.5, 0.5, 0.5)
      })
    }
    
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    
    // Nombre del archivo más descriptivo
    const currentDateTime = new Date()
    const dateStr = currentDateTime.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = currentDateTime.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
    
    link.download = `inventario_${category.value?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'productos'}_${dateStr}_${timeStr}.pdf`
    link.click()
    
    // Limpiar URL después de un tiempo
    setTimeout(() => URL.revokeObjectURL(link.href), 100)
    
    console.log('✅ PDF generado exitosamente')
    
  } catch (error) {
    console.error('Error generando PDF:', error)
    alert('Error al generar el PDF. Por favor, intenta nuevamente.')
  }
}

onMounted(() => {
  fetchCategoryDetails();
});
</script>

<template>
  <div class="page-container">
    <div class="header">
      <img src="/logo.png" alt="Compcell Logo" class="logo">
      <h1 v-if="category">Categoría: {{ category.name }}</h1>
      <h1 v-else>Cargando...</h1>
      <div class="header-buttons">
        <button @click="goBackToCategories" class="btn-back">👈 Volver a Categorías</button>
        <button @click="exportToPDF" class="btn-export">📄 Exportar a PDF</button>
      </div>
    </div>

    <div v-if="loading" class="loading-message">
      Cargando productos...
    </div>

    <div v-else-if="products.length > 0" class="products-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <div class="product-image-wrapper">
          <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="product-image">
          <div v-else class="no-image-placeholder">Sin Imagen</div>
          <div class="stock-badge" :class="{ 'low-stock': product.stock <= 5, 'out-of-stock': product.stock === 0 }">
            Stock: {{ product.stock }}
          </div>
        </div>
        <div class="product-details">
          <h3 class="product-name">{{ product.name }}</h3>
          <p class="product-price">S/ {{ product.price }}</p>
        </div>
      </div>
    </div>
    
    <div v-else class="no-results-message">
      <h2>No hay productos en esta categoría todavía.</h2>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0eafc, #cfdef3);
  padding: 2rem;
  color: #2c3e50;
}
.header { 
  max-width: 1400px; 
  margin: 0 auto 2rem auto; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
}
.logo { height: 60px; }
h1 { font-size: 2.5rem; color: #2c3e50; }

.header-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-back, .btn-export { 
  padding: 0.8rem 1.5rem; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: bold; 
  text-decoration: none; 
  color: white; 
  background-size: 200% auto; 
  transition: all 0.3s ease; 
}

.btn-back { 
  background-image: linear-gradient(to right, #34495e 0%, #2c3e50 51%, #34495e 100%); 
}

.btn-export {
  background-image: linear-gradient(to right, #16a085 0%, #1abc9c 51%, #16a085 100%);
}

.btn-back:hover, .btn-export:hover { 
  background-position: right center; 
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}
.loading-message, .no-results-message { text-align: center; font-size: 1.5rem; color: #7f8c8d; padding: 4rem 0; }

/* --- AJUSTES PARA LA CUADRÍCULA DE 5 COLUMNAS --- */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
  gap: 1.5rem;
  max-width: 1400px;
  margin: auto;
}
.product-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}
.product-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.15); }
.product-image-wrapper { position: relative; width: 100%; padding-top: 100%; }
.product-image, .no-image-placeholder { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
.no-image-placeholder { display: grid; place-items: center; background-color: #f0f0f0; color: #aaa; }
.stock-badge { position: absolute; top: 10px; right: 10px; background-color: rgba(0, 0, 0, 0.7); color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
.stock-badge.low-stock { background-color: #e67e22; }
.stock-badge.out-of-stock { background-color: #e74c3c; }
.product-details { padding: 1rem; text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
/* --- AJUSTES DE TAMAÑO DE TEXTO --- */
.product-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}
.product-price {
  font-size: 1.1rem;
  font-weight: bold;
  color: #16a085;
  margin: 0;
}
</style>