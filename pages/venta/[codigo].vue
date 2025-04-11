<!-- pages/venta/[codigo].vue -->

<template>
  <div class="venta-page">
    <!-- Loader mientras se carga la información -->
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Cargando información...</p>
    </div>
    
    <!-- Error -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">❌</div>
      <h2>Error al cargar</h2>
      <p>{{ error }}</p>
      <NuxtLink to="/" class="action-button">Volver al Inicio</NuxtLink>
    </div>
    
    <!-- Formulario de pedido -->
    <div v-else class="pedido-container">
      <div class="header">
        <h1>{{ actividad.nombre }}</h1>
        <p class="actividad-info">
          <span class="info-pill"><strong>Fecha:</strong> {{ formatDate(actividad.fecha_inicio) }}</span>
          <span class="info-pill"><strong>Ubicación:</strong> {{ actividad.ubicacion || 'No especificada' }}</span>
        </p>
        <p class="colaborador-info">Atendido por: <strong>{{ colaborador.nombre }}</strong></p>
      </div>
      
      <div v-if="step === 'productos'" class="form-container">
        <h2>Selecciona tus platos</h2>
        
        <!-- Lista de productos disponibles -->
        <div v-if="loadingProductos" class="loading-container">
          <div class="loader small"></div>
          <p>Cargando productos...</p>
        </div>
        
        <div v-else-if="!productos.length" class="empty-state">
          <p>No hay productos disponibles para esta actividad.</p>
        </div>
        
        <div v-else class="productos-list">
          <!-- Filtros por tipo de producto -->
          <div class="filter-tabs">
            <button 
              @click="filtroActual = ''" 
              :class="['filter-tab', { active: filtroActual === '' }]"
            >
              Todos
            </button>
            <button 
              v-for="tipo in tiposDisponibles" 
              :key="tipo"
              @click="filtroActual = tipo" 
              :class="['filter-tab', { active: filtroActual === tipo }]"
            >
              {{ formatTipo(tipo) }}
            </button>
          </div>
          
          <!-- Productos filtrados -->
          <div class="productos-grid">
            <div 
              v-for="producto in productosFiltrados" 
              :key="producto.id"
              class="producto-card"
              :class="{ disabled: !producto.disponible }"
            >
              <div class="producto-content">
                <h3 class="producto-nombre">{{ producto.nombre }}</h3>
                <div class="producto-tipo">{{ formatTipo(producto.tipo) }}</div>
                <p class="producto-descripcion">{{ producto.descripcion || 'Sin descripción' }}</p>
                <div class="producto-precio">S/ {{ producto.precio.toFixed(2) }}</div>
              </div>
              
              <div v-if="producto.disponible" class="producto-cantidad">
                <button 
                  @click="decrementarCantidad(producto.id)" 
                  class="cantidad-btn" 
                  :disabled="!getPedidoCantidad(producto.id)"
                >
                  -
                </button>
                <span class="cantidad-valor">{{ getPedidoCantidad(producto.id) }}</span>
                <button 
                  @click="incrementarCantidad(producto.id)" 
                  class="cantidad-btn"
                >
                  +
                </button>
              </div>
              <div v-else class="producto-no-disponible">
                No disponible
              </div>
            </div>
          </div>
          
          <!-- Resumen del pedido -->
          <div v-if="totalItems > 0" class="pedido-resumen">
            <h3>Resumen del pedido</h3>
            <div v-for="item in pedidoItems" :key="item.id" class="resumen-item">
              <div class="resumen-item-nombre">{{ item.nombre }} x{{ item.cantidad }}</div>
              <div class="resumen-item-precio">S/ {{ (item.precio * item.cantidad).toFixed(2) }}</div>
            </div>
            <div class="resumen-total">
              <div class="resumen-total-label">Total:</div>
              <div class="resumen-total-valor">S/ {{ totalPedido.toFixed(2) }}</div>
            </div>
            
            <button @click="step = 'cliente'" class="action-button primary">
              Continuar
            </button>
          </div>
        </div>
      </div>
      
      <div v-else-if="step === 'cliente'" class="form-container">
        <h2>Información de contacto</h2>
        
        <form @submit.prevent="step = 'entrega'" class="cliente-form">
          <div class="form-group">
            <label for="nombre">Nombre completo *</label>
            <input 
              id="nombre" 
              v-model="cliente.nombre" 
              type="text" 
              required
              placeholder="Tu nombre completo"
            >
          </div>
          
          <div class="form-group">
            <label for="telefono">Teléfono de contacto *</label>
            <input 
              id="telefono" 
              v-model="cliente.telefono" 
              type="tel" 
              required
              placeholder="Tu número de teléfono"
            >
          </div>
          
          <div class="form-group">
            <label for="email">Correo electrónico (opcional)</label>
            <input 
              id="email" 
              v-model="cliente.email" 
              type="email"
              placeholder="Tu correo electrónico"
            >
          </div>
          
          <div class="form-actions">
            <button type="button" @click="step = 'productos'" class="action-button secondary">
              Atrás
            </button>
            <button type="submit" class="action-button primary">
              Continuar
            </button>
          </div>
        </form>
      </div>
      
      <div v-else-if="step === 'entrega'" class="form-container">
        <h2>Método de entrega</h2>
        
        <div class="entrega-options">
          <div 
            @click="cliente.metodoEntrega = 'recojo'"
            :class="['entrega-option', { active: cliente.metodoEntrega === 'recojo' }]"
          >
            <div class="entrega-icon">🏬</div>
            <h3>Recoger en el local</h3>
            <p>Recoge tu pedido directamente en el evento</p>
          </div>
          
          <div 
            v-if="actividad.permite_delivery"
            @click="cliente.metodoEntrega = 'delivery'"
            :class="['entrega-option', { active: cliente.metodoEntrega === 'delivery' }]"
          >
            <div class="entrega-icon">🚚</div>
            <h3>Delivery</h3>
            <p>Te lo llevamos a domicilio</p>
            <p v-if="actividad.costo_delivery > 0" class="delivery-costo">
              Costo adicional: S/ {{ actividad.costo_delivery.toFixed(2) }}
            </p>
          </div>
        </div>
        
        <form v-if="cliente.metodoEntrega === 'recojo'" @submit.prevent="procesarPedido" class="entrega-form">
          <div class="form-group">
            <label for="hora-recojo">Hora aproximada de recojo *</label>
            <select id="hora-recojo" v-model="cliente.horaRecojo" required>
              <option value="" disabled>Selecciona una hora</option>
              <option v-for="hora in horasDisponibles" :key="hora.value" :value="hora.value">
                {{ hora.label }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="notas">Notas adicionales (opcional)</label>
            <textarea 
              id="notas" 
              v-model="cliente.notas" 
              rows="2"
              placeholder="Alguna indicación especial para tu pedido"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="step = 'cliente'" class="action-button secondary">
              Atrás
            </button>
            <button type="submit" class="action-button primary" :disabled="procesando">
              <span v-if="procesando">Procesando...</span>
              <span v-else>Finalizar pedido</span>
            </button>
          </div>
        </form>
        
        <form v-else-if="cliente.metodoEntrega === 'delivery'" @submit.prevent="procesarPedido" class="entrega-form">
          <div class="form-group">
            <label for="direccion">Dirección de entrega *</label>
            <input 
              id="direccion" 
              v-model="cliente.direccion" 
              type="text" 
              required
              placeholder="Dirección completa"
            >
          </div>
          
          <div class="form-group">
            <label for="referencia">Referencia (opcional)</label>
            <input 
              id="referencia" 
              v-model="cliente.referencia" 
              type="text"
              placeholder="Alguna referencia para ubicar la dirección"
            >
          </div>
          
          <div class="form-group">
            <label for="hora-entrega">Hora aproximada de entrega *</label>
            <select id="hora-entrega" v-model="cliente.horaEntrega" required>
              <option value="" disabled>Selecciona una hora</option>
              <option v-for="hora in horasDisponibles" :key="hora.value" :value="hora.value">
                {{ hora.label }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="notas-delivery">Notas adicionales (opcional)</label>
            <textarea 
              id="notas-delivery" 
              v-model="cliente.notas" 
              rows="2"
              placeholder="Alguna indicación especial para tu pedido o entrega"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="step = 'cliente'" class="action-button secondary">
              Atrás
            </button>
            <button type="submit" class="action-button primary" :disabled="procesando">
              <span v-if="procesando">Procesando...</span>
              <span v-else>Finalizar pedido</span>
            </button>
          </div>
        </form>
      </div>
      
      <div v-else-if="step === 'confirmacion'" class="form-container confirmacion">
        <div class="success-icon">✅</div>
        <h2>¡Pedido realizado con éxito!</h2>
        
        <div class="confirmacion-info">
          <p>Hemos registrado tu pedido correctamente.</p>
          <p>Código de pedido: <strong>{{ pedidoCodigo }}</strong></p>
          
          <div class="tarjeta-qr">
            <img :src="pedidoQR" alt="Código QR del pedido" class="pedido-qr-image">
            <p>Presenta este código QR el día del evento</p>
          </div>
          
          <div class="confirmacion-acciones">
            <button @click="downloadQR" class="action-button secondary">
              Descargar QR
            </button>
            <NuxtLink :to="`/pedido/${pedidoCodigo}`" class="action-button primary">
              Ver detalle del pedido
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QRCode from 'qrcode'
import type { Ref } from 'vue'
import type { Colaborador } from '~/types'
import type { Actividad, Producto } from '~/types'
import { formatDate as formatDateUtil, fromUTC } from '~/utils/date'

// Obtener código de venta de la URL
const route = useRoute()
const codigoVenta = route.params.codigo as string

// Estados
const loading = ref(true)
const error = ref('')
const colaborador = ref<Partial<Colaborador>>({})
const actividad = ref<Partial<Actividad>>({})
const loadingProductos = ref(false)
const productos = ref<Producto[]>([])
const filtroActual = ref('')
const step = ref('productos')
const procesando = ref(false)
const pedidoCodigo = ref('')
const pedidoQR = ref('')

// Datos del cliente
const cliente = ref({
  nombre: '',
  telefono: '',
  email: '',
  metodoEntrega: 'recojo',
  direccion: '',
  referencia: '',
  horaRecojo: '',
  horaEntrega: '',
  notas: ''
})

// Datos del pedido
const pedido = ref<Record<string, number>>({})

// Cliente de Supabase
const supabase = useSupabaseClient()

// Calcular productos filtrados
const productosFiltrados = computed(() => {
  if (!filtroActual.value) return productos.value
  return productos.value.filter((p: Producto) => p.tipo === filtroActual.value)
})

// Calcular tipos disponibles
const tiposDisponibles = computed(() => {
  const tipos = new Set<string>()
  productos.value.forEach((p: Producto) => tipos.add(p.tipo))
  return Array.from(tipos)
})

// Calcular items del pedido
const pedidoItems = computed(() => {
  return Object.entries(pedido.value)
    .filter(([_, cantidad]: [string, number]) => cantidad > 0)
    .map(([id, cantidad]: [string, number]) => {
      const producto = productos.value.find((p: Producto) => p.id === id)
      return {
        id,
        nombre: producto?.nombre || '',
        precio: producto?.precio || 0,
        cantidad
      }
    })
})

// Calcular total de items
const totalItems = computed(() => {
  return Object.values(pedido.value).reduce((sum: number, cantidad: number) => sum + cantidad, 0)
})

// Calcular total del pedido
const totalPedido = computed(() => {
  let total = pedidoItems.value.reduce((sum: number, item: { precio: number; cantidad: number }) => sum + (item.precio * item.cantidad), 0)
  
  // Agregar costo de delivery si corresponde
  if (cliente.value.metodoEntrega === 'delivery' && actividad.value.permite_delivery) {
    total += actividad.value.costo_delivery || 0
  }
  
  return total
})

// Horas disponibles generadas de forma dinámica
const horasDisponibles = computed(() => {
  if (!actividad.value.fecha_inicio || !actividad.value.fecha_fin) return []
  
  const fechaInicio = new Date(actividad.value.fecha_inicio)
  const fechaFin = new Date(actividad.value.fecha_fin)
  const horas = []
  const currentDate = new Date(fechaInicio)
  
  // Generar franjas horarias de 30 minutos
  while (currentDate <= fechaFin) {
    const hours = currentDate.getHours().toString().padStart(2, '0')
    const minutes = currentDate.getMinutes().toString().padStart(2, '0')
    const timeStr = `${hours}:${minutes}`
    
    horas.push({
      value: currentDate.toISOString(),
      label: timeStr
    })
    
    // Incrementar 30 minutos
    currentDate.setMinutes(currentDate.getMinutes() + 30)
  }
  
  return horas
})

// Funciones
// Formatear fecha centralizado desde utils/date.js
function formatDate(dateString: string): string {
  if (!dateString) return 'No especificada'
  
  const date = fromUTC(dateString)
  return formatDateUtil(date)
}

function formatTipo(tipo: string): string {
  const tipos = {
    'plato': 'Platos',
    'bebida': 'Bebidas',
    'postre': 'Postres',
    'otro': 'Otros'
  }
  
  return tipos[tipo as keyof typeof tipos] || tipo
}

function getPedidoCantidad(productoId: string): number {
  return pedido.value[productoId] || 0
}

function incrementarCantidad(productoId: string): void {
  if (!pedido.value[productoId]) {
    pedido.value[productoId] = 0
  }
  pedido.value[productoId]++
}

function decrementarCantidad(productoId: string): void {
  if (pedido.value[productoId] > 0) {
    pedido.value[productoId]--
  }
}

// Función para generar un código único de 8 caracteres
function generateUniqueCode(length = 8): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluimos caracteres confusos (O, 0, I, 1)
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function procesarPedido() {
  if (totalItems.value === 0) return
  
  procesando.value = true
  
  try {
    // 1. Generar código único para el pedido (8 caracteres)
    let codigoPedido = generateUniqueCode(8)
    let isUnique = false
    
    // Verificar que el código sea único
    while (!isUnique) {
      const { data } = await supabase
        .from('pedidos')
        .select('codigo_pedido')
        .eq('codigo_pedido', codigoPedido)
      
      if (!data || data.length === 0) {
        isUnique = true
      } else {
        codigoPedido = generateUniqueCode(8)
      }
    }
    
    // 2. URL base para acceso y generar QR
    const baseUrl = window.location.origin
    const pedidoUrl = `${baseUrl}/pedido/${codigoPedido}`
    
    const codigoQR = await QRCode.toDataURL(pedidoUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    
    // 3. Datos para insertar el pedido
    const pedidoData = {
      actividad_id: actividad.value.id,
      colaborador_id: colaborador.value.id,
      cliente_nombre: cliente.value.nombre,
      cliente_telefono: cliente.value.telefono,
      codigo_pedido: codigoPedido,
      codigo_qr: codigoQR,
      es_delivery: cliente.value.metodoEntrega === 'delivery',
      direccion_entrega: cliente.value.metodoEntrega === 'delivery' ? 
        `${cliente.value.direccion}. Ref: ${cliente.value.referencia}` : '',
      hora_entrega: cliente.value.metodoEntrega === 'delivery' ? 
        cliente.value.horaEntrega : cliente.value.horaRecojo,
      estado: 'pendiente',
      pagado: false,
      metodo_pago: 'efectivo',
      subtotal: totalPedido.value - (cliente.value.metodoEntrega === 'delivery' ? actividad.value.costo_delivery || 0 : 0),
      costo_delivery: cliente.value.metodoEntrega === 'delivery' ? actividad.value.costo_delivery || 0 : 0,
      total: totalPedido.value,
      notas: cliente.value.notas
    }
    
    // 4. Insertar el pedido en la base de datos
    const { data: pedidoCreado, error: pedidoError } = await supabase
      .from('pedidos')
      .insert(pedidoData)
      .select('id')
      .single()
    
    if (pedidoError) throw new Error(`Error al crear el pedido: ${pedidoError.message}`)
    
    // 5. Insertar los items del pedido
    if (pedidoItems.value.length > 0) {
      const itemsData = pedidoItems.value.map(item => ({
        pedido_id: pedidoCreado.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad
      }))
      
      const { error: itemsError } = await supabase
        .from('pedido_items')
        .insert(itemsData)
      
      if (itemsError) throw new Error(`Error al crear los items del pedido: ${itemsError.message}`)
    }
    
    // 6. Crear tarjeta virtual para el cliente
    const tarjetaData = {
      pedido_id: pedidoCreado.id,
      enlace_acceso: pedidoUrl,
      fecha_expiracion: null,
      vistas_contador: 0
    }
    
    const { error: tarjetaError } = await supabase
      .from('tarjeta_virtual')
      .insert(tarjetaData)
    
    if (tarjetaError) throw new Error(`Error al crear la tarjeta virtual: ${tarjetaError.message}`)
    
    // 7. Guardar información para mostrar confirmación
    pedidoCodigo.value = codigoPedido
    pedidoQR.value = codigoQR
    step.value = 'confirmacion'
    
  } catch (err: any) {
    console.error('Error al procesar el pedido:', err)
    error.value = err.message || 'Error al procesar el pedido'
  } finally {
    procesando.value = false
  }
}

function downloadQR() {
  if (!pedidoQR.value) return
  
  const link = document.createElement('a')
  link.download = `pedido-${pedidoCodigo.value}.png`
  link.href = pedidoQR.value
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Cargar información de venta y productos
async function loadVentaInfo() {
  loading.value = true
  error.value = ''
  
  try {
    // Buscar el colaborador por su código de venta
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('codigo_venta', codigoVenta)
      .single()
    
    if (colaboradorError) throw new Error('Código de venta no válido o expirado.')
    
    // Si el colaborador está inactivo, mostrar error
    if (!colaboradorData.activo) {
      throw new Error('Este colaborador no está activo actualmente. Por favor, contacte con otro colaborador.')
    }
    
    colaborador.value = colaboradorData
    
    // Buscar la actividad asociada
    const { data: actividadData, error: actividadError } = await supabase
      .from('actividades')
      .select('*')
      .eq('id', colaboradorData.actividad_id)
      .single()
    
    if (actividadError) throw new Error('No se pudo obtener la información de la actividad.')
    
    // Si la actividad no está activa, mostrar error
    if (actividadData.estado !== 'activa') {
      throw new Error(`Esta actividad está ${actividadData.estado}. No es posible realizar pedidos.`)
    }
    
    actividad.value = actividadData
    
    // Cargar productos de la actividad
    await loadProductos(actividadData.id)
    
  } catch (err: any) {
    console.error('Error al cargar la información:', err)
    error.value = err.message || 'Ocurrió un error al cargar la información.'
  } finally {
    loading.value = false
  }
}

async function loadProductos(actividadId: string) {
  loadingProductos.value = true
  
  try {
    const { data, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .eq('actividad_id', actividadId)
      .order('nombre')
    
    if (productosError) throw new Error('Error al cargar los productos.')
    
    productos.value = data || []
  } catch (err: any) {
    console.error('Error al cargar productos:', err)
    error.value = err.message || 'Error al cargar los productos.'
  } finally {
    loadingProductos.value = false
  }
}

// Cargar datos al montar el componente
onMounted(() => {
  loadVentaInfo()
})
</script>

<style scoped>
.venta-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: var(--spacing-large);
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-medium);
}

.loader.small {
  width: 30px;
  height: 30px;
  border-width: 3px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  color: #dc3545;
  margin-bottom: var(--spacing-medium);
}

.pedido-container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-large);
}

.header {
  margin-bottom: var(--spacing-large);
  text-align: center;
}

.header h1 {
  color: var(--primary-color);
  margin-bottom: var(--spacing-small);
}

.actividad-info {
  margin-bottom: var(--spacing-small);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.info-pill {
  display: inline-block;
  background-color: #e9ecef;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
}

.colaborador-info {
  color: var(--text-color);
  font-size: 1.1rem;
}

.form-container {
  background-color: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-large);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: var(--spacing-large);
}

.form-container h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-medium);
  color: var(--text-color-dark);
  text-align: center;
}

/* Productos */
.filter-tabs {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  margin-bottom: var(--spacing-medium);
  padding-bottom: 8px;
}

.filter-tab {
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.filter-tab.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.producto-card {
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.producto-card:hover:not(.disabled) {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.producto-card.disabled {
  opacity: 0.6;
}

.producto-content {
  flex-grow: 1;
  padding: var(--spacing-medium);
}

.producto-nombre {
  margin: 0 0 var(--spacing-small);
  font-size: 1.1rem;
  color: var(--text-color-dark);
}

.producto-tipo {
  display: inline-block;
  background-color: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-bottom: var(--spacing-small);
}

.producto-descripcion {
  color: var(--text-color);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-medium);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.producto-precio {
  font-weight: bold;
  color: var(--primary-color);
  font-size: 1.2rem;
}

.producto-cantidad {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-small) var(--spacing-medium);
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.cantidad-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  color: white;
  font-weight: bold;
  cursor: pointer;
  border: none;
  font-size: 1.2rem;
}

.cantidad-btn:disabled {
  background-color: #dee2e6;
  cursor: not-allowed;
}

.cantidad-valor {
  font-weight: bold;
  font-size: 1.1rem;
}

.producto-no-disponible {
  text-align: center;
  padding: var(--spacing-small);
  background-color: #f8f9fa;
  color: #dc3545;
  font-weight: bold;
  border-top: 1px solid #dee2e6;
}

/* Resumen del pedido */
.pedido-resumen {
  background-color: #f8f9fa;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  margin-top: var(--spacing-large);
}

.pedido-resumen h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-medium);
  color: var(--text-color-dark);
}

.resumen-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-small);
}

.resumen-total {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-medium);
  padding-top: var(--spacing-small);
  border-top: 1px solid #dee2e6;
  font-weight: bold;
  font-size: 1.1rem;
}

/* Formularios */
.cliente-form, .entrega-form {
  max-width: 500px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: var(--spacing-medium);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-small);
  font-weight: 500;
  color: var(--text-color-dark);
}

.form-group input, 
.form-group select, 
.form-group textarea {
  width: 100%;
  padding: var(--spacing-small);
  border: 1px solid #dee2e6;
  border-radius: var(--border-radius-small);
  font-size: 1rem;
}

.form-group input:focus, 
.form-group select:focus, 
.form-group textarea:focus {
  border-color: var(--primary-color);
  outline: none;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-large);
}

/* Entrega */
.entrega-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.entrega-option {
  background-color: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.entrega-option.active {
  border-color: var(--primary-color);
  background-color: rgba(76, 175, 80, 0.05);
}

.entrega-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-small);
}

.entrega-option h3 {
  margin: 0 0 var(--spacing-small);
  color: var(--text-color-dark);
}

.entrega-option p {
  margin: 0 0 var(--spacing-small);
  color: var(--text-color);
  font-size: 0.9rem;
}

.delivery-costo {
  font-weight: bold;
  color: var(--primary-color);
}

/* Confirmación */
.confirmacion {
  text-align: center;
}

.success-icon {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: var(--spacing-medium);
}

.confirmacion-info {
  max-width: 400px;
  margin: 0 auto;
}

.tarjeta-qr {
  margin: var(--spacing-large) 0;
}

.pedido-qr-image {
  max-width: 200px;
  margin: 0 auto var(--spacing-small);
  padding: var(--spacing-small);
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: var(--border-radius);
}

.confirmacion-acciones {
  display: flex;
  justify-content: center;
  gap: var(--spacing-medium);
  margin-top: var(--spacing-large);
}

/* Botones */
.action-button {
  padding: var(--spacing-small) var(--spacing-medium);
  border-radius: var(--border-radius-small);
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.action-button.primary {
  background-color: var(--primary-color);
  color: white;
}

.action-button.primary:hover {
  background-color: #449d48;
}

.action-button.secondary {
  background-color: #6c757d;
  color: white;
}

.action-button.secondary:hover {
  background-color: #5a6268;
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column;
    gap: var(--spacing-small);
  }
  
  .action-button {
    width: 100%;
  }
  
  .confirmacion-acciones {
    flex-direction: column;
    gap: var(--spacing-small);
  }
}
</style>