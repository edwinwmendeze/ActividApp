<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2 class="dashboard-title">Panel de Control y Estadísticas</h2>
      <div class="dashboard-actions">
        <button @click="actualizarDatos" class="refresh-button">
          <span class="material-icon">refresh</span> Actualizar datos
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="global-loading-indicator">
      <div class="spinner"></div>
      <p>Cargando datos de la actividad...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>Ocurrió un error al cargar los datos. Por favor, intenta nuevamente.</p>
      <button @click="actualizarDatos" class="retry-button">
        <span class="material-icon">refresh</span> Reintentar
      </button>
      <details>
        <summary>Detalles del error</summary>
        <pre>{{ error }}</pre>
      </details>
    </div>
    
    <div v-else class="dashboard-grid">
      <!-- Tarjetas de resumen -->
      <div class="dashboard-card summary-card">
        <div class="card-header">
          <h3>Resumen General</h3>
        </div>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-icon">
              <span class="material-icon">payments</span>
            </div>
            <div class="stat-data">
              <div class="stat-value">{{ formatCurrency(resumen.ingresoTotal) }}</div>
              <div class="stat-label">Ingresos Totales</div>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">
              <span class="material-icon">restaurant</span>
            </div>
            <div class="stat-data">
              <div class="stat-value">{{ resumen.ventasTotal }}</div>
              <div class="stat-label">Pedidos Completados</div>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">
              <span class="material-icon">schedule</span>
            </div>
            <div class="stat-data">
              <div class="stat-value">{{ resumen.pendientesTotal }}</div>
              <div class="stat-label">Pedidos Pendientes</div>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">
              <span class="material-icon">groups</span>
            </div>
            <div class="stat-data">
              <div class="stat-value">{{ resumen.colaboradoresTotal }}</div>
              <div class="stat-label">Colaboradores</div>
            </div>
          </div>
          
          <div class="stat-item" v-if="productoEstrella">
            <div class="stat-icon">
              <span class="material-icon">local_fire_department</span>
            </div>
            <div class="stat-data">
              <div class="stat-value">{{ productoEstrella.nombre }}</div>
              <div class="stat-label">Producto Más Vendido</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Lista de colaboradores con estadísticas -->
      <div class="dashboard-card">
        <div class="card-header">
          <h3>Desempeño de Colaboradores</h3>
        </div>
        <div v-if="loading" class="loading-indicator">
          <div class="spinner"></div>
          <p>Cargando datos...</p>
        </div>
        <table v-else-if="colaboradores.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Pedidos</th>
              <th>Ingresos</th>
              <th>Rendimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="colab in colaboradores" :key="colab.id">
              <td>{{ colab.nombre || `Colaborador ${colab.codigo_acceso}` }}</td>
              <td>{{ colab.pedidos }}</td>
              <td>{{ formatCurrency(colab.ingresos) }}</td>
              <td>
                <span :class="`rendimiento ${getRendimientoClass(colab.rendimiento)}`">{{ getRendimientoLabel(colab.rendimiento) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <p>No hay datos de colaboradores disponibles</p>
        </div>
      </div>
      
      <!-- Pedidos pendientes y fiados -->
      <div class="dashboard-card">
        <div class="card-header">
          <h3>Pedidos Pendientes y Fiados</h3>
        </div>
        <div v-if="loading" class="loading-indicator">
          <div class="spinner"></div>
          <p>Cargando datos...</p>
        </div>
        <table v-else-if="pedidosPendientes.length > 0" class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Colaborador</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pedido in pedidosPendientes" :key="pedido.id">
              <td>#{{ pedido.id.substring(0, 8) }}</td>
              <td>{{ formatFecha(pedido.fecha_pedido) }}</td>
              <td>{{ pedido.colaborador?.nombre || 'Sin colaborador' }}</td>
              <td>{{ formatCurrency(pedido.total) }}</td>
              <td>
                <span class="estado-tag" :class="pedido.estado">{{ pedido.estado }}</span>
              </td>
              <td>
                <button class="action-btn" @click="verDetallesPedido(pedido.id)">
                  <span class="material-icon">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <p>No hay pedidos pendientes ni fiados</p>
        </div>
      </div>
      
      <!-- Productos más vendidos -->
      <ProductosMasVendidos 
        :actividad-id="props.actividadId"
        :show-pagado="true"
        :filtrar-solo-pagados="false"
        title="Productos Más Vendidos"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { useRouter } from '#imports';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductosMasVendidos from '~/components/Reportes/ProductosMasVendidos.vue';

const props = defineProps({
  actividadId: {
    type: String,
    required: true
  }
});

const router = useRouter();
let supabase = null;
onMounted(async () => {
  // Solo importamos el cliente Supabase en el lado del cliente
  if (process.client) {
    const { useSupabaseClient } = await import('#imports');
    supabase = useSupabaseClient();
    // Cargar datos después de obtener el cliente
    await cargarDatos();
  }
});

const loading = ref(false);
const error = ref(null);

// Datos para reportes
const colaboradores = ref([]);
const pedidosPendientes = ref([]);
const productosVendidos = ref([]);
const productoEstrella = ref(null);
const resumen = reactive({
  ingresoTotal: 0,
  ventasTotal: 0,
  pendientesTotal: 0,
  colaboradoresTotal: 0
});

// Función para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0
  }).format(value || 0);
};

// Formatear fecha
const formatFecha = (fechaStr) => {
  if (!fechaStr) return '';
  return format(parseISO(fechaStr), 'dd MMM yyyy HH:mm', { locale: es });
};

// Obtener clase de rendimiento
const getRendimientoClass = (rendimiento) => {
  if (!rendimiento) return 'bajo';
  if (rendimiento >= 75) return 'alto';
  if (rendimiento >= 50) return 'medio';
  return 'bajo';
};

// Obtener etiqueta de rendimiento
const getRendimientoLabel = (rendimiento) => {
  if (!rendimiento) return 'Sin datos';
  if (rendimiento >= 75) return 'Excelente';
  if (rendimiento >= 50) return 'Bueno';
  if (rendimiento >= 25) return 'Regular';
  return 'Bajo';
};

// Cargar datos de colaboradores
async function cargarDatos() {
  loading.value = true;
  
  try {
    // Cargar resumen general
    await cargarResumen();
    
    // Cargar datos de colaboradores
    const { data: colabsData, error: colabsError } = await supabase
      .from('colaboradores')
      .select('id, nombre, codigo_acceso')
      .eq('actividad_id', props.actividadId);
      
    if (colabsError) {
      error.value = colabsError;
      throw new Error('Error al cargar colaboradores');
    }
    
    // Cargar pedidos por colaborador
    let colaboradoresConDatos = [];
    
    if (colabsData && colabsData.length > 0) {
      for (const colab of colabsData) {
        // Contar pedidos e ingresos
        const { data: pedidosData, error: pedidosError } = await supabase
          .from('pedidos')
          .select('id, total, pagado')
          .eq('colaborador_id', colab.id)
          .eq('actividad_id', props.actividadId);
          
        if (pedidosError) {
          console.error(`Error al cargar pedidos de colaborador ${colab.id}:`, pedidosError);
          continue;
        }
        
        // Calcular datos del colaborador
        const pedidosCount = pedidosData ? pedidosData.length : 0;
        const ingresoTotal = pedidosData ? pedidosData
          .filter(p => p.pagado)
          .reduce((sum, p) => sum + (p.total || 0), 0) : 0;
        
        // Calcular rendimiento (porcentaje basado en el colaborador con más ventas)
        let rendimiento = 0;
        if (pedidosCount > 0) {
          rendimiento = 100; // Luego se ajustará
        }
        
        colaboradoresConDatos.push({
          ...colab,
          pedidos: pedidosCount,
          ingresos: ingresoTotal,
          rendimiento: rendimiento
        });
      }
      
      // Ajustar rendimiento basado en pedidos
      if (colaboradoresConDatos.length > 0) {
        const maxPedidos = Math.max(...colaboradoresConDatos.map(c => c.pedidos));
        if (maxPedidos > 0) {
          colaboradoresConDatos = colaboradoresConDatos.map(c => ({
            ...c,
            rendimiento: Math.round((c.pedidos / maxPedidos) * 100)
          }));
        }
      }
      
      // Ordenar por rendimiento (mayor primero)
      colaboradoresConDatos.sort((a, b) => b.rendimiento - a.rendimiento);
    }
    
    colaboradores.value = colaboradoresConDatos;
    
    // Cargar pedidos pendientes y fiados
    try {
      const { data: pendientesData, error: pendientesError } = await supabase
        .from('pedidos')
        .select('id, fecha_pedido, total, estado, colaborador_id, colaborador:colaboradores(nombre, codigo_acceso)')
        .eq('actividad_id', props.actividadId)
        .or('estado.eq.pendiente,estado.eq.fiado,estado.eq.preparando')
        .order('fecha_pedido', { ascending: false });
        
      if (pendientesError) {
        error.value = pendientesError;
        console.error('Error al cargar pedidos pendientes:', pendientesError);
      } else {
        pedidosPendientes.value = pendientesData || [];
      }
    } catch (err) {
      console.error('Error al cargar pedidos pendientes:', err);
    }
    
  } catch (err) {
    console.error('Error al cargar datos:', err);
  } finally {
    loading.value = false;
  }
}

// Cargar resumen de datos
async function cargarResumen() {
  try {
    // Contar pedidos pagados (ventas)
    const { count: ventasCount, error: ventasError } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact' })
      .eq('actividad_id', props.actividadId)
      .eq('pagado', true);
      
    if (ventasError) {
      error.value = ventasError;
    } else {
      resumen.ventasTotal = ventasCount || 0;
    }
    
    // Contar pedidos pendientes
    const { count: pendientesCount, error: pendientesError } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact' })
      .eq('actividad_id', props.actividadId)
      .or('estado.eq.pendiente,estado.eq.fiado,estado.eq.preparando');
      
    if (pendientesError) {
      error.value = pendientesError;
    } else {
      resumen.pendientesTotal = pendientesCount || 0;
    }
    
    // Contar colaboradores
    const { count: colaboradoresCount, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('id', { count: 'exact' })
      .eq('actividad_id', props.actividadId);
      
    if (colaboradoresError) {
      error.value = colaboradoresError;
    } else {
      resumen.colaboradoresTotal = colaboradoresCount || 0;
    }
    
    // Sumar ingresos totales
    const { data: pagados, error: pagadosError } = await supabase
      .from('pedidos')
      .select('total')
      .eq('actividad_id', props.actividadId)
      .eq('pagado', true);
      
    if (pagadosError) {
      error.value = pagadosError;
    } else if (pagados) {
      resumen.ingresoTotal = pagados.reduce((sum, pedido) => sum + (pedido.total || 0), 0);
    }
  } catch (err) {
    console.error('Error al cargar resumen de datos:', err);
  }
}

// Función para ver detalles de un pedido
function verDetallesPedido(pedidoId) {
  router.push(`/admin/pedido/${pedidoId}`);
}

// Función para actualizar todos los datos
function actualizarDatos() {
  cargarDatos();
}
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  padding: 20px 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.dashboard-title {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background-color: #f0f0f0;
  color: #333;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-button:hover {
  background-color: #e0e0e0;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 20px;
  width: 100%;
}

.card-header {
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.stat-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  color: #2196f3;
}

.material-icon {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
}

.stat-data {
  flex: 1;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.data-table th, 
.data-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  font-weight: 600;
  color: #555;
  background-color: #f9fafb;
}

.action-btn {
  background: none;
  border: none;
  color: #2196f3;
  cursor: pointer;
  font-size: 1.2rem;
}

.estado-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.estado-tag.pagado {
  background-color: #d1fae5;
  color: #065f46;
}

.estado-tag.pendiente {
  background-color: #fff7cd;
  color: #7e4f00;
}

.estado-tag.preparando {
  background-color: #e0f2fe;
  color: #075985;
}

.estado-tag.fiado {
  background-color: #fef3c7;
  color: #92400e;
}

.estado-tag.cancelado {
  background-color: #fee2e2;
  color: #b91c1c;
}

.rendimiento {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.rendimiento.alto {
  background-color: #d1fae5;
  color: #065f46;
}

.rendimiento.medio {
  background-color: #fef3c7;
  color: #92400e;
}

.rendimiento.bajo {
  background-color: #fee2e2;
  color: #b91c1c;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2196f3;
  border-radius: 10px;
}

.progress-bar span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  color: #333;
  font-weight: 500;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.global-loading-indicator {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.error-message {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.retry-button {
  background: none;
  border: none;
  color: #2196f3;
  cursor: pointer;
  font-size: 1.2rem;
}

.producto-celda {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagado-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.pagado-tag.pagado {
  background-color: #d1fae5;
  color: #065f46;
}

.pagado-tag.no-pagado {
  background-color: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 768px) {
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .data-table {
    font-size: 0.9rem;
  }
  
  .data-table th, 
  .data-table td {
    padding: 8px 5px;
  }
}

@media (max-width: 480px) {
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .data-table {
    font-size: 0.8rem;
  }
  
  .dashboard-card {
    padding: 15px 10px;
  }
}
</style>
