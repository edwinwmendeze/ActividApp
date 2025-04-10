<!-- components/QR/PedidoScanDetails.vue -->
<template>
  <div class="pedido-scan-details">
    <!-- Mensaje de error si no hay pedido o hubo un problema -->
    <div v-if="error" class="error-container">
      <div class="error-card">
        <div v-if="Object.keys(actividadInfo).length > 0" class="actividad-error">
          <div class="error-header">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Error al cargar el pedido</h3>
          </div>
          
          <div class="error-content">
            <p>Este pedido <strong>no puede ser escaneado aquí</strong> porque pertenece a otra actividad.</p>
            
            <div class="actividad-info">
              <h4>Detalles de la Actividad:</h4>
              <p class="actividad-nombre">{{ actividadInfo.nombre }}</p>
              <p><strong>Fecha:</strong> {{ actividadInfo.fechaInicio }} - {{ actividadInfo.fechaFin }}</p>
              <p v-if="actividadInfo.ubicacion"><strong>Ubicación:</strong> {{ actividadInfo.ubicacion }}</p>
            </div>
            
            <div class="contacto-info">
              <h4>Para más información:</h4>
              <p><strong>Organizador:</strong> {{ actividadInfo.organizador }}</p>
              <p v-if="actividadInfo.email"><strong>Email:</strong> {{ actividadInfo.email }}</p>
              <p v-if="actividadInfo.telefono"><strong>Teléfono:</strong> {{ actividadInfo.telefono }}</p>
            </div>
          </div>
          
          <button @click="$emit('close')" class="action-button primary">
            Volver al escáner
          </button>
        </div>
        <div v-else class="simple-error">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar el pedido</h3>
          <p>{{ error }}</p>
          <button @click="$emit('close')" class="action-button primary">
            Volver al escáner
          </button>
        </div>
      </div>
    </div>
    
    <div v-else-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Cargando detalles del pedido...</p>
    </div>
    
    <div v-else-if="!pedido.id || !actividadVerificada" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>Pedido no encontrado o no autorizado</h3>
      <p v-if="!actividadVerificada">No tienes permiso para ver este pedido. Pertenece a otra actividad.</p>
      <p v-else>No se encontró ningún pedido con ese código.</p>
      <button @click="$emit('close')" class="action-button primary">
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
              <input type="checkbox" v-model="pagado" :disabled="actualizando">
              <span class="toggle-slider"></span>
              <span class="toggle-label">Pedido pagado</span>
            </label>
          </div>
          
          <button 
            @click="actualizarEstado" 
            class="action-button primary update-button" 
            :disabled="actualizando || selectedEstado === pedido.estado && pagado === pedido.pagado"
          >
            <span v-if="actualizando">Actualizando...</span>
            <span v-else>Actualizar estado</span>
          </button>
        </div>
        
        <!-- Acciones -->
        <div class="acciones-section">
          <button @click="$emit('close')" class="action-button primary">
            Volver al escáner
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { formatDate as formatDateUtil, fromUTC } from '~/utils/date'

// Definir props
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
  },
  actividadCodigo: {
    type: String,
    default: ''
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
const pagado = ref(false)
const actividadVerificada = ref(true)
const actividadInfo = ref({})

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
async function loadPedido() {
  loading.value = true
  error.value = ''
  actividadVerificada.value = true // Reiniciar la verificación
  
  try {
    console.log('Intentando cargar pedido con código:', props.codigoPedido)
    console.log('Código de actividad del colaborador/admin:', props.actividadCodigo)
    
    // Obtener pedido por código
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .select(`
        *,
        actividad_id,
        actividades:actividad_id (id, nombre, codigo_acceso)
      `)
      .eq('codigo_pedido', props.codigoPedido)
      .single()
    
    if (pedidoError) throw pedidoError
    
    console.log('Datos del pedido obtenidos:', pedidoData)
    
    if (!pedidoData) {
      error.value = 'No se encontró ningún pedido con ese código'
      loading.value = false
      return
    }
    
    // Verificar si el pedido pertenece a la actividad del colaborador/administrador
    if (props.actividadCodigo && 
        pedidoData.actividades && 
        pedidoData.actividades.codigo_acceso && 
        pedidoData.actividades.codigo_acceso !== props.actividadCodigo) {
      
      console.log('Comparación de códigos:', {
        'Código de actividad del colaborador/admin': props.actividadCodigo,
        'Código de actividad del pedido': pedidoData.actividades ? pedidoData.actividades.codigo_acceso : 'No disponible',
        'Datos completos del pedido': pedidoData
      })
      
      console.error('El pedido no pertenece a la actividad del colaborador/administrador')
      actividadVerificada.value = false
      
      // Obtener más detalles sobre la actividad del pedido
      try {
        const { data: actividadData, error: actividadError } = await supabase
          .from('actividades')
          .select(`
            nombre,
            descripcion,
            fecha_inicio,
            fecha_fin,
            ubicacion,
            organizador_nombre,
            organizador_telefono,
            organizador_email
          `)
          .eq('id', pedidoData.actividad_id)
          .single()
          
        if (!actividadError && actividadData) {
          // Formatear fechas
          const fechaInicio = new Date(actividadData.fecha_inicio).toLocaleString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
          
          const fechaFin = new Date(actividadData.fecha_fin).toLocaleString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
          
          // Crear mensaje informativo estructurado sin usar HTML directamente
          error.value = 'No tienes permiso para ver este pedido. Pertenece a otra actividad.'
            
          // Guardar los datos de la actividad para mostrarlos en la interfaz
          actividadInfo.value = {
            nombre: actividadData.nombre,
            fechaInicio,
            fechaFin,
            ubicacion: actividadData.ubicacion,
            organizador: actividadData.organizador_nombre,
            telefono: actividadData.organizador_telefono,
            email: actividadData.organizador_email
          }
        } else {
          // Mensaje por defecto si no podemos obtener los detalles
          error.value = 'No tienes permiso para ver este pedido. Pertenece a otra actividad.'
        }
      } catch (err) {
        console.error('Error al obtener detalles de la actividad:', err)
        error.value = 'No tienes permiso para ver este pedido. Pertenece a otra actividad.'
      }
      
      loading.value = false
      return
    }
    
    pedido.value = pedidoData
    selectedEstado.value = pedidoData.estado || 'pendiente'
    pagado.value = pedidoData.pagado || false
    
    // Cargar los items del pedido
    if (pedidoData.id) {
      loadPedidoItems(pedidoData.id)
    }
  } catch (err) {
    console.error('Error al cargar pedido:', err)
    error.value = 'Error al cargar los detalles del pedido'
  } finally {
    loading.value = false
  }
}

// Cargar items del pedido
async function loadPedidoItems(pedidoId) {
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
async function actualizarEstado() {
  actualizando.value = true
  error.value = ''
  
  try {
    const { error: err } = await supabase
      .from('pedidos')
      .update({
        estado: selectedEstado.value,
        pagado: pagado.value
      })
      .eq('id', pedido.value.id)
    
    if (err) throw err
    
    await loadPedido()
    
    emit('updated', {
      id: pedido.value.id,
      estado: selectedEstado.value,
      pagado: pagado.value
    })
    
  } catch (err) {
    console.error('Error al actualizar el pedido:', err)
    error.value = err.message
  } finally {
    actualizando.value = false
  }
}

// Formatear estado para mostrar
function formatEstado(estado) {
  const option = estadoOptions.find(opt => opt.value === estado)
  return option ? option.label : estado
}

// Formatear fecha
function formatDate(dateString) {
  if (!dateString) return 'Fecha no disponible'
  
  const date = fromUTC(dateString)
  return formatDateUtil(date)
}

// Formatear hora centralizado desde utils/date.js
// Formatear hora
function formatTime(timeString) {
  if (!timeString) return 'Hora no disponible'
  
  const date = fromUTC(timeString)
  return formatDateUtil(date)
}

// Obtener clase de estado
function getEstadoClass(estado) {
  return `estado-${estado}`
}

// Comprobar si el mensaje de error es HTML
const isHtmlError = computed(() => {
  return error.value && error.value.includes('<') && error.value.includes('>')
})

// Cargar pedido al iniciar
onMounted(() => {
  loadPedido()
})
</script>

<style scoped>
/* Estilos base */
.pedido-scan-details {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

/* Contenedor de detalles */
.pedido-details-container {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  position: relative;
}

/* Tarjeta de error estilizada */
.error-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background-color: white;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

/* Estilos para el error de actividad incorrecto */
.actividad-error {
  padding: 0;
}

.error-header {
  background: linear-gradient(135deg, #ff5a5f, #ff3c41);
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-header h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.error-header i {
  font-size: 1.8rem;
}

.error-content {
  padding: 20px;
  color: #333;
  line-height: 1.6;
  font-size: 1rem;
}

.error-content :deep(br) {
  margin-bottom: 8px;
  display: block;
  content: "";
}

/* Estilos para los bloques de información */
.error-content :deep(strong) {
  font-weight: bold;
  color: #333;
}

/* Estilos para el contenido de error mejorado */
.error-content :deep(.actividad-info), 
.error-content :deep(.contacto-info) {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.error-content :deep(.actividad-info h4), 
.error-content :deep(.contacto-info h4) {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.error-content :deep(.actividad-info p), 
.error-content :deep(.contacto-info p) {
  margin: 5px 0;
  font-size: 0.95rem;
}

.error-content :deep(.actividad-nombre) {
  font-size: 1.2rem !important;
  font-weight: 600;
  color: #ff5a5f;
  margin-bottom: 10px !important;
}

.error-content :deep(.contacto-info) {
  background-color: #f0f7ff;
}

/* Estilos para el error simple */
.simple-error {
  padding: 30px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.simple-error i {
  font-size: 3rem;
  color: #ff5a5f;
  margin-bottom: 10px;
}

.simple-error h3 {
  margin: 0;
  font-size: 1.4rem;
  color: #333;
}

.simple-error p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

/* Botones */
.action-button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  margin-top: 20px;
  display: inline-block;
  width: 100%;
  text-align: center;
}

.primary {
  background-color: #4CAF50;
  color: white;
}

.primary:hover {
  background-color: #3e8e41;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.secondary {
  background-color: #f2f2f2;
  color: #333;
}

.secondary:hover {
  background-color: #e5e5e5;
}

/* Estados de carga y otros */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 20px;
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
