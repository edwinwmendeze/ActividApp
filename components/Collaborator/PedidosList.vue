<!-- components/Collaborator/PedidosList.vue -->
<template>
  <div class="pedidos-list">
    <!-- Cabecera y filtros -->
    <div class="list-header">
      <h3>Mis Pedidos</h3>
      
      <!-- Filtros -->
      <div class="filters-bar">
        <div class="search-box">
          <input 
            type="text" 
            v-model="filtros.busqueda" 
            placeholder="Buscar por nombre o código..." 
            @input="filtrarPedidos"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <div class="filter-options">
          <select v-model="filtros.estado" @change="filtrarPedidos">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="preparando">Preparando</option>
            <option value="listo">Listo</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          
          <select v-model="filtros.pago" @change="filtrarPedidos">
            <option value="">Todos los pagos</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
          </select>
          
          <button @click="limpiarFiltros" class="action-button secondary small" title="Limpiar filtros">
            Limpiar
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loader mientras se cargan los pedidos -->
    <div v-if="loading" class="centered-loader">
      <div class="loader"></div>
      <p>Cargando pedidos...</p>
    </div>
    
    <!-- Mensaje cuando no hay pedidos -->
    <div v-else-if="pedidosFiltrados.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No hay pedidos</h3>
      <p v-if="hayFiltrosActivos">
        No se encontraron pedidos con los filtros seleccionados.
        <button @click="limpiarFiltros" class="text-button">Limpiar filtros</button>
      </p>
      <p v-else>
        Aún no tienes pedidos registrados.
      </p>
    </div>
    
    <!-- Tabla de pedidos -->
    <div v-else class="pedidos-table-container">
      <table class="pedidos-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Pago</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pedido in pedidosFiltrados" :key="pedido.id" :class="{ 'entregado': pedido.estado === 'entregado' }">
            <td>{{ pedido.codigo_pedido }}</td>
            <td>{{ pedido.cliente_nombre }}</td>
            <td>{{ formatDate(pedido.fecha_pedido) }}</td>
            <td>S/ {{ pedido.total.toFixed(2) }}</td>
            <td>
              <div class="estado-badge" :class="'estado-' + pedido.estado">
                {{ formatearEstado(pedido.estado) }}
              </div>
            </td>
            <td>
              <div class="pago-badge" :class="pedido.pagado ? 'pagado' : 'pendiente'">
                {{ pedido.pagado ? 'Pagado' : 'Pendiente' }}
              </div>
            </td>
            <td>
              <div class="actions-container">
                <button @click="verDetallesPedido(pedido)" class="icon-button view" title="Ver detalles">
                  👁️
                </button>
                <button @click="editarEstadoPedido(pedido)" class="icon-button edit" title="Cambiar estado">
                  📝
                </button>
                <button 
                  v-if="!pedido.pagado" 
                  @click="marcarComoPagado(pedido)" 
                  class="icon-button pay" 
                  title="Marcar como pagado"
                >
                  💰
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Modal para ver detalles del pedido -->
    <div v-if="mostrarModalDetalle" class="modal-overlay" @click="cerrarModalDetalle">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Detalles del Pedido #{{ pedidoSeleccionado?.codigo_pedido }}</h3>
          <button @click="cerrarModalDetalle" class="close-button">&times;</button>
        </div>
        
        <div class="modal-content">
          <div class="pedido-info">
            <div class="info-section">
              <h4>Información del Cliente</h4>
              <p><strong>Nombre:</strong> {{ pedidoSeleccionado?.cliente_nombre }}</p>
              <p><strong>Teléfono:</strong> {{ pedidoSeleccionado?.cliente_telefono || 'No especificado' }}</p>
            </div>
            
            <div class="info-section">
              <h4>Información del Pedido</h4>
              <p><strong>Fecha:</strong> {{ formatDate(pedidoSeleccionado?.fecha_pedido) }}</p>
              <p><strong>Estado:</strong> {{ formatearEstado(pedidoSeleccionado?.estado) }}</p>
              <p><strong>Pago:</strong> {{ pedidoSeleccionado?.pagado ? 'Pagado' : 'Pendiente' }}</p>
              <p v-if="pedidoSeleccionado?.metodo_pago"><strong>Método de pago:</strong> {{ formatearMetodoPago(pedidoSeleccionado?.metodo_pago) }}</p>
            </div>
            
            <div class="info-section">
              <h4>Entrega</h4>
              <p><strong>Tipo:</strong> {{ pedidoSeleccionado?.es_delivery ? 'Delivery' : 'Recojo en local' }}</p>
              <p v-if="pedidoSeleccionado?.es_delivery"><strong>Dirección:</strong> {{ pedidoSeleccionado?.direccion_entrega }}</p>
              <p><strong>Hora programada:</strong> {{ formatTime(pedidoSeleccionado?.hora_entrega) }}</p>
            </div>
            
            <div class="info-section" v-if="pedidoSeleccionado?.notas">
              <h4>Notas</h4>
              <p>{{ pedidoSeleccionado?.notas }}</p>
            </div>
          </div>
          
          <div class="pedido-items">
            <h4>Detalle de productos</h4>
            <div v-if="loadingItems" class="centered-loader small">
              <div class="loader small"></div>
              <p>Cargando productos...</p>
            </div>
            <table v-else class="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in itemsPedido" :key="item.id">
                  <td>{{ item.producto?.nombre }}</td>
                  <td>S/ {{ item.precio_unitario.toFixed(2) }}</td>
                  <td>{{ item.cantidad }}</td>
                  <td>S/ {{ item.subtotal.toFixed(2) }}</td>
                </tr>
                <tr v-if="pedidoSeleccionado?.es_delivery && pedidoSeleccionado?.costo_delivery > 0" class="delivery-row">
                  <td colspan="3">Costo de delivery</td>
                  <td>S/ {{ pedidoSeleccionado?.costo_delivery.toFixed(2) }}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3"><strong>Total</strong></td>
                  <td><strong>S/ {{ pedidoSeleccionado?.total.toFixed(2) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="pedido-acciones">
            <button 
              v-if="!pedidoSeleccionado?.pagado" 
              @click="marcarComoPagado(pedidoSeleccionado)"
              class="action-button primary"
            >
              Marcar como Pagado
            </button>
            <button @click="editarEstadoPedido(pedidoSeleccionado)" class="action-button">
              Cambiar Estado
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal para cambiar estado del pedido -->
    <div v-if="mostrarModalEstado" class="modal-overlay" @click="cerrarModalEstado">
      <div class="modal-container estado-modal" @click.stop>
        <div class="modal-header">
          <h3>Cambiar Estado del Pedido</h3>
          <button @click="cerrarModalEstado" class="close-button">&times;</button>
        </div>
        
        <div class="modal-content">
          <p class="pedido-info-line">
            Pedido #{{ pedidoSeleccionado?.codigo_pedido }} - {{ pedidoSeleccionado?.cliente_nombre }}
          </p>
          
          <div class="estado-options">
            <button 
              v-for="estado in estadosPedido" 
              :key="estado.value"
              @click="actualizarEstadoPedido(estado.value)"
              :class="['estado-button', { 'active': pedidoSeleccionado?.estado === estado.value }]"
            >
              <div class="estado-icon">{{ estado.icon }}</div>
              <div class="estado-label">{{ estado.label }}</div>
            </button>
          </div>
          
          <div class="estado-actions">
            <button @click="cerrarModalEstado" class="action-button secondary">
              Cancelar
            </button>
            <button 
              @click="guardarCambioEstado" 
              class="action-button primary"
              :disabled="pedidoSeleccionado?.estado === nuevoEstado || !nuevoEstado"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Notificación -->
    <div v-if="notificacion.mostrar" class="notificacion" :class="notificacion.tipo">
      <div class="notificacion-contenido">
        <span class="notificacion-icono">{{ notificacion.tipo === 'exito' ? '✅' : '❌' }}</span>
        <span class="notificacion-mensaje">{{ notificacion.mensaje }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  colaboradorId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['refresh'])

// Estado
const pedidos = ref([])
const pedidosFiltrados = ref([])
const itemsPedido = ref([])
const loading = ref(true)
const loadingItems = ref(false)

// Estado de modales
const mostrarModalDetalle = ref(false)
const mostrarModalEstado = ref(false)
const pedidoSeleccionado = ref(null)
const nuevoEstado = ref('')

// Estado de filtros
const filtros = ref({
  busqueda: '',
  estado: '',
  pago: ''
})

// Estado para notificaciones
const notificacion = ref({
  mostrar: false,
  mensaje: '',
  tipo: 'exito'
})

// Opciones para estados de pedido
const estadosPedido = [
  { value: 'pendiente', label: 'Pendiente', icon: '⏳' },
  { value: 'preparando', label: 'Preparando', icon: '👨‍🍳' },
  { value: 'listo', label: 'Listo', icon: '✅' },
  { value: 'entregado', label: 'Entregado', icon: '🚚' },
  { value: 'cancelado', label: 'Cancelado', icon: '❌' }
]

// Cliente de Supabase
const supabase = useSupabaseClient()

// Verificar si hay filtros activos
const hayFiltrosActivos = computed(() => {
  return filtros.value.busqueda !== '' || filtros.value.estado !== '' || filtros.value.pago !== ''
})

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return 'No disponible'
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Formatear hora
const formatTime = (dateString) => {
  if (!dateString) return 'No disponible'
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Formatear estado
const formatearEstado = (estado) => {
  if (!estado) return 'Desconocido'
  
  const estadoEncontrado = estadosPedido.find(e => e.value === estado)
  return estadoEncontrado ? estadoEncontrado.label : estado
}

// Formatear método de pago
const formatearMetodoPago = (metodo) => {
  if (!metodo) return 'No especificado'
  
  const metodos = {
    'efectivo': 'Efectivo',
    'tarjeta': 'Tarjeta',
    'transferencia': 'Transferencia',
    'otro': 'Otro'
  }
  
  return metodos[metodo] || metodo
}

// Cargar pedidos del colaborador
const cargarPedidos = async () => {
  loading.value = true
  
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('colaborador_id', props.colaboradorId)
      .order('fecha_pedido', { ascending: false })
    
    if (error) throw error
    
    pedidos.value = data || []
    pedidosFiltrados.value = [...pedidos.value]
    
  } catch (err) {
    console.error('Error al cargar pedidos:', err)
    mostrarNotificacion(`Error al cargar pedidos: ${err.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// Filtrar pedidos
const filtrarPedidos = () => {
  pedidosFiltrados.value = pedidos.value.filter(pedido => {
    // Filtro por búsqueda (nombre de cliente o código)
    const matchBusqueda = !filtros.value.busqueda || 
      pedido.cliente_nombre.toLowerCase().includes(filtros.value.busqueda.toLowerCase()) ||
      pedido.codigo_pedido.toLowerCase().includes(filtros.value.busqueda.toLowerCase()) ||
      (pedido.cliente_telefono && pedido.cliente_telefono.includes(filtros.value.busqueda))
    
    // Filtro por estado
    const matchEstado = !filtros.value.estado || pedido.estado === filtros.value.estado
    
    // Filtro por pago
    let matchPago = true
    if (filtros.value.pago === 'pagado') {
      matchPago = pedido.pagado === true
    } else if (filtros.value.pago === 'pendiente') {
      matchPago = pedido.pagado === false
    }
    
    return matchBusqueda && matchEstado && matchPago
  })
}

// Limpiar filtros
const limpiarFiltros = () => {
  filtros.value = {
    busqueda: '',
    estado: '',
    pago: ''
  }
  
  filtrarPedidos()
}

// Ver detalles del pedido
const verDetallesPedido = async (pedido) => {
  pedidoSeleccionado.value = pedido
  loadingItems.value = true
  mostrarModalDetalle.value = true
  
  try {
    // Cargar los items del pedido
    const { data, error } = await supabase
      .from('pedido_items')
      .select(`
        id,
        cantidad,
        precio_unitario,
        subtotal,
        producto:producto_id (
          id,
          nombre,
          descripcion,
          tipo
        )
      `)
      .eq('pedido_id', pedido.id)
    
    if (error) throw error
    
    itemsPedido.value = data || []
    
  } catch (err) {
    console.error('Error al cargar detalles del pedido:', err)
    mostrarNotificacion(`Error al cargar detalles del pedido: ${err.message}`, 'error')
  } finally {
    loadingItems.value = false
  }
}

// Cerrar modal de detalles
const cerrarModalDetalle = () => {
  mostrarModalDetalle.value = false
  setTimeout(() => {
    pedidoSeleccionado.value = null
    itemsPedido.value = []
  }, 300)
}

// Editar estado del pedido
const editarEstadoPedido = (pedido) => {
  pedidoSeleccionado.value = pedido
  nuevoEstado.value = pedido.estado
  mostrarModalEstado.value = true
}

// Actualizar estado del pedido (selección)
const actualizarEstadoPedido = (estado) => {
  nuevoEstado.value = estado
}

// Guardar cambio de estado
const guardarCambioEstado = async () => {
  if (!pedidoSeleccionado.value || !nuevoEstado.value || pedidoSeleccionado.value.estado === nuevoEstado.value) {
    return
  }
  
  try {
    const fechaActual = new Date().toISOString()
    
    // Actualizar el pedido
    const { error } = await supabase
      .from('pedidos')
      .update({
        estado: nuevoEstado.value,
        fecha_actualizacion: fechaActual
      })
      .eq('id', pedidoSeleccionado.value.id)
    
    if (error) throw error
    
    // Registrar en historial de pedidos
    await supabase
      .from('historial_pedidos')
      .insert({
        pedido_id: pedidoSeleccionado.value.id,
        colaborador_id: props.colaboradorId,
        estado_anterior: pedidoSeleccionado.value.estado,
        estado_nuevo: nuevoEstado.value,
        timestamp: fechaActual
      })
    
    // Actualizar la lista de pedidos
    const pedidoIndex = pedidos.value.findIndex(p => p.id === pedidoSeleccionado.value.id)
    if (pedidoIndex !== -1) {
      pedidos.value[pedidoIndex].estado = nuevoEstado.value
      pedidos.value[pedidoIndex].fecha_actualizacion = fechaActual
    }
    
    // Actualizar el pedido seleccionado si está en el modal de detalles
    if (mostrarModalDetalle.value) {
      pedidoSeleccionado.value.estado = nuevoEstado.value
      pedidoSeleccionado.value.fecha_actualizacion = fechaActual
    }
    
    // Refiltrar por si hay filtros activos
    filtrarPedidos()
    
    mostrarNotificacion('Estado del pedido actualizado correctamente')
    cerrarModalEstado()
    
    // Notificar para actualizar estadísticas si fuera necesario
    emit('refresh')
    
  } catch (err) {
    console.error('Error al actualizar estado del pedido:', err)
    mostrarNotificacion(`Error al actualizar estado del pedido: ${err.message}`, 'error')
  }
}

// Cerrar modal de estado
const cerrarModalEstado = () => {
  mostrarModalEstado.value = false
  setTimeout(() => {
    nuevoEstado.value = ''
  }, 300)
}

// Marcar como pagado
const marcarComoPagado = async (pedido) => {
  if (!pedido || pedido.pagado) return
  
  try {
    const fechaActual = new Date().toISOString()
    
    // Actualizar el pedido
    const { error } = await supabase
      .from('pedidos')
      .update({
        pagado: true,
        fecha_actualizacion: fechaActual
      })
      .eq('id', pedido.id)
    
    if (error) throw error
    
    // Registrar en historial de pedidos
    await supabase
      .from('historial_pedidos')
      .insert({
        pedido_id: pedido.id,
        colaborador_id: props.colaboradorId,
        pagado_anterior: false,
        pagado_nuevo: true,
        timestamp: fechaActual,
        notas: 'Marcado como pagado'
      })
    
    // Actualizar la lista de pedidos
    const pedidoIndex = pedidos.value.findIndex(p => p.id === pedido.id)
    if (pedidoIndex !== -1) {
      pedidos.value[pedidoIndex].pagado = true
      pedidos.value[pedidoIndex].fecha_actualizacion = fechaActual
    }
    
    // Actualizar el pedido seleccionado si está en el modal de detalles
    if (mostrarModalDetalle.value && pedidoSeleccionado.value?.id === pedido.id) {
      pedidoSeleccionado.value.pagado = true
      pedidoSeleccionado.value.fecha_actualizacion = fechaActual
    }
    
    // Refiltrar por si hay filtros activos
    filtrarPedidos()
    
    mostrarNotificacion('Pedido marcado como pagado correctamente')
    
    // Notificar para actualizar estadísticas si fuera necesario
    emit('refresh')
    
  } catch (err) {
    console.error('Error al marcar como pagado:', err)
    mostrarNotificacion(`Error al marcar como pagado: ${err.message}`, 'error')
  }
}

// Mostrar notificación
const mostrarNotificacion = (mensaje, tipo = 'exito') => {
  notificacion.value = {
    mostrar: true,
    mensaje,
    tipo
  }
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notificacion.value.mostrar = false
  }, 3000)
}

// Cargar datos al montar el componente
onMounted(() => {
  cargarPedidos()
})

// Exponer métodos para uso desde el exterior
defineExpose({
  cargarPedidos,
  mostrarNotificacion
})
</script>

<style scoped>
.pedidos-list {
  position: relative;
}

.list-header {
  margin-bottom: 1.5rem;
}

.list-header h3 {
  margin-bottom: 1rem;
  color: var(--text-color-dark);
  font-size: 1.5rem;
}

/* Filtros */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background-color: #fff;
  padding: 1rem;
  border-radius: var(--border-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-base);
}

.search-icon {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-light);
  pointer-events: none;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-options select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  background-color: #fff;
  min-width: 160px;
  font-size: var(--font-size-base);
}

.action-button.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

/* Loader y estados vacíos */
.centered-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  text-align: center;
}

.centered-loader.small {
  padding: 1rem;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loader.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--text-color-light);
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: var(--text-color-dark);
  font-size: 1.2rem;
}

.empty-state p {
  margin-bottom: 1rem;
  color: var(--text-color);
}

.text-button {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: underline;
}

/* Tabla de pedidos */
.pedidos-table-container {
  overflow-x: auto;
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.pedidos-table {
  width: 100%;
  border-collapse: collapse;
}

.pedidos-table th,
.pedidos-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.pedidos-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: var(--text-color-dark);
}

.pedidos-table tr:hover {
  background-color: #f8f9fa;
}

.pedidos-table tr.entregado {
  background-color: #f8f9fa;
  color: var(--text-color-light);
}

.estado-badge,
.pago-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
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

.estado-cancelado {
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

.actions-container {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.icon-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.icon-button:hover {
  background-color: #f0f0f0;
}

.icon-button.edit:hover {
  background-color: #e3f2fd;
}

.icon-button.pay:hover {
  background-color: #e8f5e9;
}

.icon-button.delete:hover {
  background-color: #ffebee;
}

/* Modales */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

.modal-container {
  background-color: #fff;
  border-radius: var(--border-radius);
  max-width: 90%;
  width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s;
}

.estado-modal {
  width: 500px;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--primary-color);
  color: white;
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: white;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.close-button:hover {
  opacity: 1;
}

.modal-content {
  padding: 1.5rem;
}

/* Detalles del pedido */
.pedido-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-section {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: var(--border-radius-small);
}

.info-section h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--text-color-dark);
  font-size: 1.1rem;
}

.info-section p {
  margin: 0.25rem 0;
  color: var(--text-color);
}

.pedido-items {
  margin-bottom: 1.5rem;
}

.pedido-items h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--text-color-dark);
  font-size: 1.1rem;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.items-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: var(--text-color-dark);
}

.delivery-row {
  background-color: #f8f9fa;
}

.total-row {
  font-weight: bold;
  background-color: #f8f9fa;
}

.pedido-acciones {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

/* Modal de cambio de estado */
.pedido-info-line {
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.estado-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.estado-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  cursor: pointer;
  transition: all 0.2s;
}

.estado-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.estado-button.active {
  background-color: var(--primary-color);
  color: white;
}

.estado-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.estado-label {
  font-weight: 500;
}

.estado-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Botones de acción */
.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-small);
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
}

.action-button:hover {
  background-color: var(--button-bg-hover);
}

.action-button.secondary {
  background-color: #e9ecef;
  color: var(--text-color-dark);
  border: 1px solid var(--border-color);
}

.action-button.secondary:hover {
  background-color: #dee2e6;
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Notificación */
.notificacion {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 0.75rem 1.25rem;
  border-radius: var(--border-radius-small);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  animation: slideIn 0.3s ease-out;
}

.notificacion.exito {
  background-color: #d4edda;
  color: #155724;
}

.notificacion.error {
  background-color: #f8d7da;
  color: #721c24;
}

.notificacion-contenido {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notificacion-icono {
  font-size: 1.25rem;
}

/* Animaciones */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsivo */
@media (max-width: 768px) {
  .pedido-info {
    grid-template-columns: 1fr;
  }
  
  .estado-options {
    grid-template-columns: 1fr 1fr;
  }
  
  .pedido-acciones {
    flex-direction: column;
  }
  
  .pedido-acciones button {
    width: 100%;
  }
  
  .filter-options {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  
  .filter-options select {
    width: 100%;
  }
}
</style>