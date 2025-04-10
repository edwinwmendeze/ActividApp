<!-- pages/pedido/[codigo].vue -->
<template>
    <div class="pedido-page">
      <!-- Loader mientras se carga la información -->
      <div v-if="loading" class="loading-container">
        <div class="loader"></div>
        <p>Cargando información del pedido...</p>
      </div>
      
      <!-- Error -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">❌</div>
        <h2>Error al cargar el pedido</h2>
        <p>{{ error }}</p>
        <NuxtLink to="/" class="action-button">Volver al Inicio</NuxtLink>
      </div>
      
      <!-- Tarjeta virtual del pedido -->
      <div v-else class="tarjeta-container">
        <div class="tarjeta-header">
          <h1>Tarjeta Virtual</h1>
          <div class="evento-info">
            <h2>{{ actividad.nombre }}</h2>
            <p class="fecha">{{ formatDate(actividad.fecha_inicio) }}</p>
            <p class="ubicacion">{{ actividad.ubicacion || 'Sin ubicación especificada' }}</p>
          </div>
        </div>
        
        <div class="tarjeta-content">
          <div class="qr-section">
            <div class="qr-container">
              <img :src="pedido.codigo_qr" alt="Código QR del pedido" class="qr-image">
            </div>
            <p class="qr-codigo">{{ pedido.codigo_pedido }}</p>
            <p class="qr-instrucciones">Presenta este código QR para recibir tu pedido</p>
          </div>
          
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
                <strong>Hora:</strong> {{ formatHora(pedido.hora_entrega) }}
              </p>
              <p v-if="pedido.notas">
                <strong>Notas:</strong> {{ pedido.notas }}
              </p>
            </div>
          </div>
          
          <div class="productos-section">
            <h3>Detalle del pedido</h3>
            <div v-if="!itemsPedido.length" class="loading-items">
              <div class="loader small"></div>
              <p>Cargando detalle...</p>
            </div>
            <div v-else class="productos-list">
              <div v-for="item in itemsPedido" :key="item.id" class="producto-item">
                <div class="producto-info">
                  <div class="producto-nombre">{{ item.producto.nombre }}</div>
                  <div class="producto-cantidad">x{{ item.cantidad }}</div>
                </div>
                <div class="producto-precio">S/ {{ (item.precio_unitario * item.cantidad).toFixed(2) }}</div>
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
          
          <div class="acciones-section">
            <button @click="downloadQR" class="action-button secondary">
              Descargar QR
            </button>
            <button @click="compartirTarjeta" v-if="canShare" class="action-button primary">
              Compartir Tarjeta
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  
  // Obtener código de pedido de la URL
  const route = useRoute()
  const codigoPedido = route.params.codigo as string
  
  // Estados
  const loading = ref(true)
  const error = ref('')
  const pedido = ref<any>({})
  const actividad = ref<any>({})
  const itemsPedido = ref<any[]>([])
  
  // Cliente de Supabase
  const supabase = useSupabaseClient()
  
  // Verificar si soporta Web Share API
  const canShare = computed<boolean>(() => {
    return typeof navigator !== 'undefined' && !!navigator.share
  })
  
  // Funciones
  function formatDate(dateString: string): string {
    if (!dateString) return 'No especificada'
    
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  function formatHora(dateString: string): string {
    if (!dateString) return 'No especificada'
    
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  function formatEstado(estado: string): string {
    const estados: Record<string, string> = {
      'pendiente': 'Pendiente',
      'preparando': 'En preparación',
      'listo': 'Listo para entrega',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    }
    
    return estados[estado] || estado
  }
  
  function getEstadoClass(estado: string): string {
    const clases: Record<string, string> = {
      'pendiente': 'estado-pendiente',
      'preparando': 'estado-preparando',
      'listo': 'estado-listo',
      'entregado': 'estado-entregado',
      'cancelado': 'estado-cancelado'
    }
    
    return clases[estado] || ''
  }
  
  function downloadQR() {
    if (!pedido.value.codigo_qr) return
    
    const link = document.createElement('a')
    link.download = `pedido-${pedido.value.codigo_pedido}.png`
    link.href = pedido.value.codigo_qr
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  async function compartirTarjeta() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Pedido para ${actividad.value.nombre}`,
          text: `Mi pedido para ${actividad.value.nombre}. Código: ${pedido.value.codigo_pedido}`,
          url: window.location.href
        })
      }
    } catch (err) {
      console.error('Error al compartir:', err)
    }
  }
  
  // Actualizar el contador de vistas
  async function updateViewsCounter(tarjetaId: string) {
    try {
      await supabase
        .from('tarjeta_virtual')
        .update({
          vistas_contador: supabase.rpc('increment', { x: 1 }),
          ultima_vista: new Date().toISOString()
        })
        .eq('pedido_id', tarjetaId)
    } catch (err) {
      console.error('Error al actualizar contador de vistas:', err)
    }
  }
  
  // Cargar información del pedido
  async function loadPedidoInfo() {
    loading.value = true
    error.value = ''
    
    try {
      // Buscar el pedido por su código
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('codigo_pedido', codigoPedido)
        .single()
      
      if (pedidoError) throw new Error('Pedido no encontrado o código inválido.')
      
      pedido.value = pedidoData
      
      // Buscar la actividad asociada
      const { data: actividadData, error: actividadError } = await supabase
        .from('actividades')
        .select('*')
        .eq('id', pedidoData.actividad_id)
        .single()
      
      if (actividadError) throw new Error('No se pudo obtener la información de la actividad.')
      
      actividad.value = actividadData
      
      // Buscar los items del pedido
      const { data: itemsData, error: itemsError } = await supabase
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
            precio,
            tipo
          )
        `)
        .eq('pedido_id', pedidoData.id)
      
      if (itemsError) throw new Error('No se pudo obtener el detalle del pedido.')
      
      itemsPedido.value = itemsData || []
      
      // Actualizar contador de vistas
      await updateViewsCounter(pedidoData.id)
      
    } catch (err: any) {
      console.error('Error al cargar la información del pedido:', err)
      error.value = err.message || 'Ocurrió un error al cargar la información del pedido.'
    } finally {
      loading.value = false
    }
  }
  
  // Cargar datos al montar el componente
  onMounted(() => {
    loadPedidoInfo()
  })
  </script>
  
  <style scoped>
  .pedido-page {
    min-height: 100vh;
    background-color: #f8f9fa;
    padding: var(--spacing-medium);
  }
  
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 70vh;
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
    width: 20px;
    height: 20px;
    border-width: 2px;
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
  
  .error-container h2 {
    color: #dc3545;
    margin-bottom: var(--spacing-medium);
  }
  
  .tarjeta-container {
    max-width: 500px;
    margin: 0 auto;
    background-color: white;
    border-radius: var(--border-radius);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
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
  }
  
  .evento-info h2 {
    margin: 0 0 var(--spacing-small);
    font-size: 1.2rem;
  }
  
  .evento-info p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }
  
  .tarjeta-content {
    padding: var(--spacing-medium);
  }
  
  .qr-section {
    text-align: center;
    margin-bottom: var(--spacing-large);
  }
  
  .qr-container {
    background-color: white;
    padding: var(--spacing-small);
    border-radius: var(--border-radius);
    display: inline-block;
    margin-bottom: var(--spacing-small);
    border: 1px solid #dee2e6;
  }
  
  .qr-image {
    max-width: 200px;
  }
  
  .qr-codigo {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--text-color-dark);
    margin: var(--spacing-small) 0;
    letter-spacing: 1px;
  }
  
  .qr-instrucciones {
    color: var(--text-color);
    font-size: 0.9rem;
    margin: 0;
  }
  
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
  
  .cliente-info h3 {
    margin: 0 0 var(--spacing-small);
    color: var(--text-color-dark);
    font-size: 1.1rem;
  }
  
  .cliente-info p {
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
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.8rem;
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
  
  .entrega-info {
    width: 100%;
    margin-top: var(--spacing-small);
  }
  
  .entrega-info h3 {
    margin: 0 0 var(--spacing-small);
    color: var(--text-color-dark);
    font-size: 1.1rem;
  }
  
  .entrega-info p {
    margin: 0 0 var(--spacing-xsmall);
    color: var(--text-color);
  }
  
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
  }
  
  .loading-items {
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
  
  .acciones-section {
    display: flex;
    gap: var(--spacing-medium);
    margin-top: var(--spacing-large);
  }
  
  .action-button {
    flex: 1;
    padding: var(--spacing-small) var(--spacing-medium);
    border-radius: var(--border-radius-small);
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border: none;
    text-decoration: none;
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
  
  @media (max-width: 480px) {
    .acciones-section {
      flex-direction: column;
    }
  }
  </style>