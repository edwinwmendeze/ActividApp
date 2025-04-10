<!-- components/QR/PedidoScanDetails.vue -->
<template>
  <div class="pedido-scan-details">
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Cargando detalles del pedido...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <div class="error-icon">❌</div>
      <h3>Error al cargar el pedido</h3>
      <p>{{ error }}</p>
      <button @click="$emit('close')" class="action-button secondary">
        Volver al escáner
      </button>
    </div>
    
    <div v-else-if="!pedido.id" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>Pedido no encontrado</h3>
      <p>No se encontró ningún pedido con ese código.</p>
      <button @click="$emit('close')" class="action-button secondary">
        Volver al escáner
      </button>
    </div>
    
    <div v-else class="tarjeta-container">
      <!-- Cabecera del ticket -->
      <div class="tarjeta-header">
        <h1>Ticket Pedido</h1>
        <div class="evento-info">
          <h2>{{ actividad.nombre || 'Actividad' }}</h2>
          <p class="fecha">{{ formatDate(pedido.fecha || pedido.created_at || new Date()) }}</p>
        </div>
      </div>
      
      <div class="tarjeta-content">
        <!-- Detalles del cliente y pedido -->
        <div class="detalles-section">
          <div class="cliente-info">
            <h3>Cliente</h3>
            <p>{{ pedido.cliente_nombre }}</p>
            <p>{{ pedido.cliente_telefono }}</p>
          </div>
          
          <div class="estado-info">
            <div class="estado-badge" :class="getEstadoClass(pedido.estado)">
              {{ formatEstado(pedido.estado) }}
            </div>
            <div class="pago-badge" :class="pedido.pagado ? 'pagado' : 'pendiente'">
              {{ pedido.pagado ? 'Pagado' : 'Pago pendiente' }}
            </div>
          </div>
          
          <div class="entrega-info">
            <h3>{{ pedido.es_delivery ? 'Entrega a domicilio' : 'Recojo en local' }}</h3>
            <p v-if="pedido.es_delivery">
              <strong>Dirección:</strong> {{ pedido.direccion_entrega }}
            </p>
            <p>
              <strong>Hora:</strong> {{ formatTime(pedido.hora_entrega) }}
            </p>
            <p v-if="pedido.notas">
              <strong>Notas:</strong> {{ pedido.notas }}
            </p>
          </div>
        </div>
        
        <!-- Lista de productos -->
        <div class="productos-section">
          <h3>Detalle del pedido</h3>
          <div v-if="loadingItems" class="loading-items">
            <div class="loader small"></div>
            <p>Cargando detalle...</p>
          </div>
          <div v-else-if="!items.length" class="empty-items">
            <p>No hay productos en este pedido.</p>
          </div>
          <div v-else class="productos-list">
            <div v-for="item in items" :key="item.id" class="producto-item">
              <div class="producto-info">
                <div class="producto-nombre">{{ item.producto_nombre }}</div>
                <div class="producto-cantidad">x{{ item.cantidad }}</div>
              </div>
              <div class="producto-precio">S/ {{ item.subtotal.toFixed(2) }}</div>
            </div>
            
            <div v-if="pedido.es_delivery && pedido.costo_delivery > 0" class="producto-item delivery">
              <div class="producto-info">
                <div class="producto-nombre">Costo de delivery</div>
              </div>
              <div class="producto-precio">S/ {{ pedido.costo_delivery.toFixed(2) }}</div>
            </div>
            
            <div class="total-row">
              <div class="total-label">Total</div>
              <div class="total-valor">S/ {{ pedido.total.toFixed(2) }}</div>
            </div>
          </div>
        </div>
        
        <!-- Actualizar estado del pedido -->
        <div class="status-section">
          <h3>Actualizar Estado</h3>
          
          <div class="status-options">
            <label 
              v-for="option in estadoOptions" 
              :key="option.value" 
              class="status-option" 
              :class="{ active: selectedEstado === option.value }"
            >
              <input 
                type="radio" 
                v-model="selectedEstado" 
                :value="option.value" 
                :disabled="actualizando"
              >
              <span class="status-label">{{ option.label }}</span>
            </label>
          </div>
          
          <div class="payment-toggle">
            <label class="toggle-container">
              <input type="checkbox" v-model="pedidoPagado" :disabled="actualizando">
              <span class="toggle-slider"></span>
              <span class="toggle-label">Pedido pagado</span>
            </label>
          </div>
          
          <button 
            @click="actualizarEstado" 
            class="action-button primary update-button" 
            :disabled="actualizando || selectedEstado === pedido.estado && pedidoPagado === pedido.pagado"
          >
            <span v-if="actualizando">Actualizando...</span>
            <span v-else>Actualizar estado</span>
          </button>
        </div>
        
        <!-- Acciones -->
        <div class="acciones-section">
          <button @click="$emit('close')" class="action-button secondary">
            Volver al escáner
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  codigoPedido: {
    type: String,
    required: true
  },
  actividad: {
    type: Object,
    default() {
      return {}
    }
  }
})

const emit = defineEmits(['close', 'updated'])

const supabase = useSupabaseClient()

// Estado
const loading = ref(true)
const loadingItems = ref(true)
const error = ref('')
const pedido = ref({})
const items = ref([])
const actualizando = ref(false)
const selectedEstado = ref('')
const pedidoPagado = ref(false)

// Opciones de estado
const estadoOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'preparando', label: 'En preparación' },
  { value: 'listo', label: 'Listo para entrega' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'rechazado', label: 'Rechazado' }
]

// Cargar datos del pedido
const loadPedido = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const { data, error: err } = await supabase
      .from('pedidos')
      .select('*')
      .eq('codigo_pedido', props.codigoPedido)
      .single()
    
    if (err) throw err
    
    if (!data) {
      error.value = 'No se encontró el pedido.'
      loading.value = false
      return
    }
    
    pedido.value = data
    selectedEstado.value = data.estado
    pedidoPagado.value = data.pagado
    
    // Cargar items
    await loadPedidoItems(data.id)
    
  } catch (err) {
    console.error('Error al cargar el pedido:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Cargar items del pedido
const loadPedidoItems = async (pedidoId) => {
  loadingItems.value = true
  
  try {
    const { data, error: err } = await supabase
      .from('pedido_items')
      .select(`
        id,
        cantidad,
        precio_unitario,
        subtotal,
        producto_id,
        productos (id, nombre)
      `)
      .eq('pedido_id', pedidoId)
    
    if (err) throw err
    
    // Formatear los datos para mostrarlos
    items.value = data.map(item => ({
      id: item.id,
      cantidad: item.cantidad,
      precio: item.precio_unitario,
      subtotal: item.subtotal,
      producto_id: item.productos?.id,
      producto_nombre: item.productos?.nombre || 'Producto desconocido'
    }))
    
  } catch (err) {
    console.error('Error al cargar los items del pedido:', err)
  } finally {
    loadingItems.value = false
  }
}

// Actualizar estado del pedido
const actualizarEstado = async () => {
  actualizando.value = true
  error.value = ''
  
  try {
    const { error: err } = await supabase
      .from('pedidos')
      .update({
        estado: selectedEstado.value,
        pagado: pedidoPagado.value
      })
      .eq('id', pedido.value.id)
    
    if (err) throw err
    
    // Recargar el pedido para mostrar datos actualizados
    await loadPedido()
    
    // Notificar que se ha actualizado
    emit('updated', {
      id: pedido.value.id,
      estado: selectedEstado.value,
      pagado: pedidoPagado.value
    })
    
  } catch (err) {
    console.error('Error al actualizar el pedido:', err)
    error.value = err.message
  } finally {
    actualizando.value = false
  }
}

// Formatear estado para mostrar
const formatEstado = (estado) => {
  const option = estadoOptions.find(opt => opt.value === estado)
  return option ? option.label : estado
}

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return 'Fecha no disponible'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Formatear hora
const formatTime = (timeString) => {
  if (!timeString) return 'Hora no disponible'
  
  // Si es una fecha ISO, extraer solo la parte de la hora
  if (timeString.includes('T')) {
    const date = new Date(timeString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Si ya es un string de hora, devolverlo directamente
  return timeString
}

// Obtener clase de estado
const getEstadoClass = (estado) => {
  return `estado-${estado}`
}

// Cargar pedido al iniciar
onMounted(() => {
  loadPedido()
})
</script>

<style scoped>
.pedido-scan-details {
  min-height: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-medium);
  font-family: var(--font-family);
}

.loading-container, .error-container, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-large);
  text-align: center;
  gap: var(--spacing-medium);
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.loader {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loader.small {
  width: 24px;
  height: 24px;
  border-width: 3px;
}

.loader.tiny {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .empty-icon {
  font-size: 3rem;
  line-height: 1;
}

/* Nuevo diseño tipo tarjeta virtual */
.tarjeta-container {
  width: 100%;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: var(--spacing-large);
}

.tarjeta-header {
  background-color: var(--primary-color);
  color: white;
  padding: var(--spacing-medium);
  text-align: center;
}

.tarjeta-header h1 {
  margin: 0 0 var(--spacing-small);
  font-size: 1.5rem;
  font-weight: 700;
}

.evento-info h2 {
  margin: var(--spacing-small) 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.evento-info p {
  margin: 0;
  opacity: 0.9;
}

.fecha {
  font-size: 0.9rem;
}

.tarjeta-content {
  padding: var(--spacing-medium);
}

/* Detalles del cliente */
.detalles-section {
  border: 1px solid #dee2e6;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-medium);
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-medium);
}

.cliente-info {
  flex: 1;
  min-width: 200px;
}

.cliente-info h3, .entrega-info h3 {
  margin: 0 0 var(--spacing-small);
  color: var(--text-color-dark);
  font-size: 1.1rem;
  font-weight: 600;
}

.cliente-info p, .entrega-info p {
  margin: 0 0 var(--spacing-xsmall);
  color: var(--text-color);
}

.estado-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
  justify-content: center;
}

.estado-badge, .pago-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: bold;
  text-align: center;
}

.estado-pendiente {
  background-color: #ffc107;
  color: #212529;
}

.estado-preparando {
  background-color: #17a2b8;
  color: white;
}

.estado-listo {
  background-color: #28a745;
  color: white;
}

.estado-entregado {
  background-color: #6c757d;
  color: white;
}

.estado-cancelado, .estado-rechazado {
  background-color: #dc3545;
  color: white;
}

.pago-badge.pagado {
  background-color: #28a745;
  color: white;
}

.pago-badge.pendiente {
  background-color: #ffc107;
  color: #212529;
}

.entrega-info {
  width: 100%;
  margin-top: var(--spacing-small);
}

/* Productos */
.productos-section {
  border: 1px solid #dee2e6;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-medium);
}

.productos-section h3 {
  margin: 0 0 var(--spacing-medium);
  color: var(--text-color-dark);
  font-size: 1.1rem;
  font-weight: 600;
}

.loading-items, .empty-items {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-small);
  padding: var(--spacing-medium) 0;
}

.producto-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-small) 0;
  border-bottom: 1px solid #f8f9fa;
}

.producto-item.delivery {
  border-top: 1px solid #dee2e6;
  padding-top: var(--spacing-small);
  margin-top: var(--spacing-small);
}

.producto-info {
  flex: 1;
}

.producto-nombre {
  font-weight: 500;
  color: var(--text-color-dark);
}

.producto-cantidad {
  color: var(--text-color);
  font-size: 0.9rem;
}

.producto-precio {
  font-weight: bold;
  color: var(--primary-color);
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding-top: var(--spacing-medium);
  margin-top: var(--spacing-small);
  border-top: 2px solid #dee2e6;
  font-weight: bold;
  font-size: 1.1rem;
}

/* Status section */
.status-section {
  border: 1px solid #dee2e6;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-medium);
}

.status-section h3 {
  margin: 0 0 var(--spacing-medium);
  color: var(--text-color-dark);
  font-size: 1.1rem;
  font-weight: 600;
}

.status-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-small);
  margin-bottom: var(--spacing-medium);
}

.status-option {
  display: block;
  padding: var(--spacing-small);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-small);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.status-option.active {
  border-color: var(--primary-color);
  background-color: rgba(76, 175, 80, 0.05);
}

.status-option input {
  position: absolute;
  opacity: 0;
}

.status-label {
  display: block;
  font-weight: 500;
}

.payment-toggle {
  margin: var(--spacing-medium) 0;
}

.toggle-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.toggle-slider {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  background-color: #ccc;
  border-radius: 20px;
  margin-right: 10px;
  transition: all 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s;
}

input:checked + .toggle-slider {
  background-color: var(--primary-color);
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-label {
  font-weight: 500;
}

.update-button {
  width: 100%;
  margin-top: var(--spacing-medium);
}

/* Acciones */
.acciones-section {
  margin-top: var(--spacing-large);
  display: flex;
  justify-content: center;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  border-radius: var(--border-radius-small);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  text-decoration: none;
  width: 100%;
}

.action-button.primary {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.action-button.primary:hover {
  background-color: #449d48;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
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
  transform: none !important;
  box-shadow: none !important;
}

@media (max-width: 480px) {
  .acciones-section {
    flex-direction: column;
  }
}
</style>
