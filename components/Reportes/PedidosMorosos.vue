<template>
  <div class="chart-report-card">
    <div class="report-header">
      <h3>Seguimiento de Pedidos No Pagados</h3>
      <div class="report-controls">
        <button @click="exportarCSV" class="export-button" :disabled="loading || !pedidosMorosos.length">
          📊 Exportar CSV
        </button>
      </div>
    </div>
    
    <div class="alert-summary" v-if="!loading && !error">
      <div class="alert-stat">
        <div class="alert-value">{{ formatCurrency(totalMoroso) }}</div>
        <div class="alert-label">Por cobrar</div>
      </div>
      <div class="alert-stat">
        <div class="alert-value">{{ pedidosMorosos.length }}</div>
        <div class="alert-label">Pedidos pendientes</div>
      </div>
    </div>
    
    <div class="loading-container" v-if="loading">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>
    
    <div class="empty-state" v-else-if="!error && pedidosMorosos.length === 0">
      <div class="empty-icon">✓</div>
      <p>No hay pedidos pendientes de pago</p>
    </div>
    
    <div class="error-message" v-else-if="error">
      <p>{{ error }}</p>
    </div>
    
    <div class="morosos-list" v-else>
      <div class="list-header">
        <div class="header-cell">Colaborador</div>
        <div class="header-cell">Fecha</div>
        <div class="header-cell">Monto</div>
        <div class="header-cell">Estado</div>
        <div class="header-cell">Acciones</div>
      </div>
      
      <div v-for="pedido in pedidosMorosos" :key="pedido.id" class="list-row">
        <div class="list-cell colaborador">
          <div class="cell-main">{{ pedido.colaborador_nombre || 'Sin nombre' }}</div>
          <div class="cell-secondary">{{ pedido.colaborador_codigo || '-' }}</div>
        </div>
        
        <div class="list-cell fecha">
          <div class="cell-main">{{ formatFecha(pedido.fecha_pedido) }}</div>
          <div class="cell-secondary">{{ formatHora(pedido.fecha_pedido) }}</div>
        </div>
        
        <div class="list-cell monto">
          <div class="cell-main">{{ formatCurrency(pedido.total) }}</div>
          <div class="cell-secondary">{{ pedido.items_count || 0 }} items</div>
        </div>
        
        <div class="list-cell estado">
          <span class="status-tag" :class="pedido.estado">{{ pedido.estado }}</span>
        </div>
        
        <div class="list-cell acciones">
          <button @click="marcarComoPagado(pedido.id)" class="action-button">
            Marcar pagado
          </button>
          <button @click="verDetalles(pedido)" class="action-button secondary">
            Ver detalles
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal de detalles -->
    <div v-if="modalVisible" class="modal-overlay" @click="cerrarModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Detalles del Pedido</h3>
          <button @click="cerrarModal" class="close-button">×</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-section">
            <h4>Información Básica</h4>
            <div class="detail-row">
              <div class="detail-label">ID Pedido:</div>
              <div class="detail-value">{{ pedidoSeleccionado?.id }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Colaborador:</div>
              <div class="detail-value">{{ pedidoSeleccionado?.colaborador_nombre }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Fecha:</div>
              <div class="detail-value">{{ formatFecha(pedidoSeleccionado?.fecha_pedido) }} {{ formatHora(pedidoSeleccionado?.fecha_pedido) }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Estado:</div>
              <div class="detail-value">
                <span class="status-tag" :class="pedidoSeleccionado?.estado">{{ pedidoSeleccionado?.estado }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>Productos</h4>
            <div v-if="itemsDetalle.length === 0" class="empty-items">
              Cargando items...
            </div>
            <div v-else class="items-list">
              <div v-for="item in itemsDetalle" :key="item.id" class="item-row">
                <div class="item-info">
                  <div class="item-name">{{ item.producto_nombre }}</div>
                  <div class="item-meta">{{ item.cantidad }}x @ {{ formatCurrency(item.precio) }}</div>
                </div>
                <div class="item-total">{{ formatCurrency(item.precio * item.cantidad) }}</div>
              </div>
              
              <div class="items-total">
                <div class="total-label">Total</div>
                <div class="total-value">{{ formatCurrency(pedidoSeleccionado?.total) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="marcarComoPagado(pedidoSeleccionado?.id)" class="action-button">Marcar como Pagado</button>
          <button @click="cerrarModal" class="action-button secondary">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSupabaseClient } from '@nuxtjs/supabase/dist/runtime/composables/useSupabaseClient';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const props = defineProps({
  actividadId: {
    type: String,
    required: true
  }
});

const supabase = useSupabaseClient();
const loading = ref(false);
const error = ref('');
const pedidos = ref([]);
const colaboradores = ref([]);
const modalVisible = ref(false);
const pedidoSeleccionado = ref(null);
const itemsDetalle = ref([]);

// Funciones de formateo
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0
  }).format(value || 0);
};

const formatFecha = (fechaStr) => {
  if (!fechaStr) return '';
  return format(parseISO(fechaStr), 'dd MMM yyyy', { locale: es });
};

const formatHora = (fechaStr) => {
  if (!fechaStr) return '';
  return format(parseISO(fechaStr), 'HH:mm', { locale: es });
};

// Filtrar pedidos morosos/no pagados
const pedidosMorosos = computed(() => {
  // Filtramos pedidos en estados 'pendiente', 'fiado', 'preparando' o cualquier estado que no sea 'pagado' o 'cancelado'
  const morosos = pedidos.value.filter(pedido => 
    pedido.estado !== 'pagado' && pedido.estado !== 'cancelado'
  );
  
  // Asociar nombre del colaborador con cada pedido
  return morosos.map(pedido => {
    const colaborador = colaboradores.value.find(c => c.id === pedido.colaborador_id);
    return {
      ...pedido,
      colaborador_nombre: colaborador?.nombre || 'Desconocido',
      colaborador_codigo: colaborador?.codigo_acceso || '-'
    };
  });
});

// Calcular total moroso
const totalMoroso = computed(() => {
  return pedidosMorosos.value.reduce((total, pedido) => {
    return total + (pedido.total || 0);
  }, 0);
});

// Función para cargar datos desde Supabase
async function cargarDatos() {
  loading.value = true;
  error.value = '';
  
  try {
    // Cargar pedidos de la actividad
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('actividad_id', props.actividadId);
      
    if (pedidosError) throw new Error('Error al cargar pedidos');
    pedidos.value = pedidosData || [];
    
    // Cargar colaboradores para mostrar nombres
    const { data: colabData, error: colabError } = await supabase
      .from('colaboradores')
      .select('id, nombre, codigo_acceso')
      .eq('actividad_id', props.actividadId);
      
    if (colabError) throw new Error('Error al cargar colaboradores');
    colaboradores.value = colabData || [];
    
  } catch (err) {
    console.error('Error al cargar datos:', err);
    error.value = err.message || 'Error al cargar datos';
  } finally {
    loading.value = false;
  }
}

// Función para marcar un pedido como pagado
async function marcarComoPagado(pedidoId) {
  if (!pedidoId) return;
  
  try {
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({ estado: 'pagado' })
      .eq('id', pedidoId);
      
    if (updateError) throw new Error('Error al actualizar el pedido');
    
    // Actualizar lista de pedidos
    await cargarDatos();
    
    // Cerrar modal si está abierto
    if (modalVisible.value) {
      cerrarModal();
    }
    
  } catch (err) {
    console.error('Error al marcar como pagado:', err);
    error.value = err.message || 'Error al actualizar el pedido';
  }
}

// Función para ver detalles de un pedido
async function verDetalles(pedido) {
  pedidoSeleccionado.value = pedido;
  modalVisible.value = true;
  itemsDetalle.value = [];
  
  try {
    // Cargar items del pedido
    const { data: items, error: itemsError } = await supabase
      .from('pedido_items')
      .select('*')
      .eq('pedido_id', pedido.id);
      
    if (itemsError) throw new Error('Error al cargar detalles del pedido');
    
    // Cargar nombres de productos para cada item
    const itemsConNombres = await Promise.all(items.map(async (item) => {
      const { data: producto } = await supabase
        .from('productos')
        .select('nombre')
        .eq('id', item.producto_id)
        .single();
        
      return {
        ...item,
        producto_nombre: producto?.nombre || 'Producto desconocido'
      };
    }));
    
    itemsDetalle.value = itemsConNombres;
    
  } catch (err) {
    console.error('Error al cargar detalles:', err);
  }
}

// Cerrar modal
function cerrarModal() {
  modalVisible.value = false;
  pedidoSeleccionado.value = null;
  itemsDetalle.value = [];
}

// Exportar datos a CSV
function exportarCSV() {
  // Preparar datos para CSV
  const headers = ['ID', 'Colaborador', 'Fecha', 'Estado', 'Monto'];
  
  const data = pedidosMorosos.value.map(p => [
    p.id,
    p.colaborador_nombre,
    `${formatFecha(p.fecha_pedido)} ${formatHora(p.fecha_pedido)}`,
    p.estado,
    p.total
  ]);
  
  // Construir contenido CSV
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += headers.join(',') + '\n';
  
  data.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  // Descargar archivo
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `pedidos_pendientes_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
.chart-report-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 20px;
  margin-bottom: 25px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.report-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.export-button {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-button:hover {
  background-color: #f0f0f0;
}

.export-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alert-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff8e1;
  border-radius: 8px;
}

.alert-stat {
  text-align: center;
}

.alert-value {
  font-size: 1.6rem;
  font-weight: 600;
  color: #f57c00;
  margin-bottom: 5px;
}

.alert-label {
  font-size: 0.85rem;
  color: #666;
}

.morosos-list {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: flex;
  background-color: #f5f5f5;
  font-weight: 500;
  font-size: 0.85rem;
  color: #555;
  border-bottom: 1px solid #eee;
}

.header-cell {
  padding: 12px 15px;
  flex: 1;
}

.list-row {
  display: flex;
  border-bottom: 1px solid #f5f5f5;
  align-items: center;
}

.list-row:last-child {
  border-bottom: none;
}

.list-row:hover {
  background-color: #f9f9f9;
}

.list-cell {
  padding: 15px;
  flex: 1;
}

.list-cell.acciones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1.5;
}

.cell-main {
  font-weight: 500;
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 3px;
}

.cell-secondary {
  font-size: 0.85rem;
  color: #777;
}

.status-tag {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #eee;
  color: #333;
}

.status-tag.pendiente {
  background-color: #fff8e1;
  color: #f57c00;
}

.status-tag.fiado {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-tag.preparando {
  background-color: #e3f2fd;
  color: #1976d2;
}

.action-button {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background-color: #2196f3;
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #1976d2;
}

.action-button.secondary {
  background-color: #f5f5f5;
  color: #333;
}

.action-button.secondary:hover {
  background-color: #e0e0e0;
}

.loading-container, .empty-state, .error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 15px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 2rem;
  color: #4caf50;
  margin-bottom: 10px;
  height: 50px;
  width: 50px;
  border-radius: 50%;
  background-color: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-message p {
  color: #d32f2f;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #777;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  font-size: 1rem;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
}

.detail-label {
  font-weight: 500;
  width: 120px;
  color: #666;
}

.detail-value {
  flex: 1;
}

.items-list {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
}

.item-row:last-child {
  border-bottom: none;
}

.item-name {
  font-weight: 500;
  margin-bottom: 3px;
}

.item-meta {
  font-size: 0.85rem;
  color: #777;
}

.item-total {
  font-weight: 500;
}

.items-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 15px;
  background-color: #f5f5f5;
  font-weight: 600;
}

.empty-items {
  padding: 20px;
  text-align: center;
  color: #777;
  font-style: italic;
}

@media (max-width: 768px) {
  .list-header {
    display: none;
  }
  
  .list-row {
    flex-direction: column;
    padding: 15px;
    position: relative;
  }
  
  .list-cell {
    padding: 5px 0;
    width: 100%;
  }
  
  .list-cell.acciones {
    margin-top: 10px;
  }
  
  .status-tag {
    position: absolute;
    top: 15px;
    right: 15px;
  }
}
</style>
