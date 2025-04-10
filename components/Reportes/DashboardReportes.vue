<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2 class="dashboard-title">Panel de Control y Estadísticas</h2>
      <div class="dashboard-actions">
        <button @click="actualizarDatos" class="refresh-button">
          🔄 Actualizar datos
        </button>
      </div>
    </div>
    
    <div class="dashboard-grid">
      <!-- Tarjetas de resumen -->
      <div class="dashboard-card summary-card">
        <div class="card-header">
          <h3>Resumen General</h3>
        </div>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-icon">💰</div>
            <div class="stat-data">
              <div class="stat-value">{{ formatCurrency(resumen.ingresoTotal) }}</div>
              <div class="stat-label">Ingresos Totales</div>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">🍽️</div>
            <div class="stat-data">
              <div class="stat-value">{{ resumen.ventasTotal }}</div>
              <div class="stat-label">Pedidos Completados</div>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">⏱️</div>
            <div class="stat-data">
              <div class="stat-value">{{ resumen.pendientesTotal }}</div>
              <div class="stat-label">Pedidos Pendientes</div>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">👥</div>
            <div class="stat-data">
              <div class="stat-value">{{ resumen.colaboradoresTotal }}</div>
              <div class="stat-label">Colaboradores</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Gráficas y reportes específicos -->
      <div class="dashboard-section full-width">
        <IngresosTotales :actividad-id="actividadId" ref="ingresosRef" />
      </div>
      
      <div class="dashboard-section half-width">
        <VentasPorColaborador :actividad-id="actividadId" ref="ventasColabRef" />
      </div>
      
      <div class="dashboard-section half-width">
        <ProductosMasVendidos :actividad-id="actividadId" ref="productosRef" />
      </div>
      
      <div class="dashboard-section full-width">
        <PedidosMorosos :actividad-id="actividadId" ref="morososRef" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useSupabaseClient } from '#imports';
import IngresosTotales from './IngresosTotales.vue';
import VentasPorColaborador from './VentasPorColaborador.vue';
import ProductosMasVendidos from './ProductosMasVendidos.vue';
import PedidosMorosos from './PedidosMorosos.vue';

const props = defineProps({
  actividadId: {
    type: String,
    required: true
  }
});

const supabase = useSupabaseClient();
const loading = ref(false);

// Referencias a componentes hijos para poder refrescar sus datos
const ingresosRef = ref(null);
const ventasColabRef = ref(null);
const productosRef = ref(null);
const morososRef = ref(null);

// Datos de resumen general
const resumen = reactive({
  ingresoTotal: 0,
  ventasTotal: 0,
  pendientesTotal: 0,
  colaboradoresTotal: 0
});

// Funciones de formateo
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0);
};

// Cargar resumen de datos
async function cargarResumen() {
  loading.value = true;
  
  try {
    // Contar pedidos pagados (ventas)
    const { count: ventasCount, error: ventasError } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact' })
      .eq('actividad_id', props.actividadId)
      .eq('estado', 'pagado');
      
    if (!ventasError) {
      resumen.ventasTotal = ventasCount || 0;
    }
    
    // Contar pedidos pendientes
    const { count: pendientesCount, error: pendientesError } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact' })
      .eq('actividad_id', props.actividadId)
      .neq('estado', 'pagado')
      .neq('estado', 'cancelado');
      
    if (!pendientesError) {
      resumen.pendientesTotal = pendientesCount || 0;
    }
    
    // Contar colaboradores
    const { count: colaboradoresCount, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('id', { count: 'exact' })
      .eq('actividad_id', props.actividadId);
      
    if (!colaboradoresError) {
      resumen.colaboradoresTotal = colaboradoresCount || 0;
    }
    
    // Sumar ingresos totales
    const { data: pagados, error: pagadosError } = await supabase
      .from('pedidos')
      .select('total')
      .eq('actividad_id', props.actividadId)
      .eq('estado', 'pagado');
      
    if (!pagadosError && pagados) {
      resumen.ingresoTotal = pagados.reduce((sum, pedido) => sum + (pedido.total || 0), 0);
    }
    
  } catch (err) {
    console.error('Error al cargar resumen de datos:', err);
  } finally {
    loading.value = false;
  }
}

// Función para actualizar todos los datos
async function actualizarDatos() {
  // Actualizar datos de resumen
  await cargarResumen();
  
  // Actualizar datos en componentes hijos
  ingresosRef.value?.cargarDatos();
  ventasColabRef.value?.cargarDatos();
  productosRef.value?.cargarDatos();
  morososRef.value?.cargarDatos();
}

onMounted(() => {
  cargarResumen();
});
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
  flex-wrap: wrap;
  gap: 20px;
}

.dashboard-section {
  margin-bottom: 10px;
}

.full-width {
  width: 100%;
}

.half-width {
  width: calc(50% - 10px); /* Mitad del ancho menos la mitad del gap */
}

.dashboard-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 20px;
  margin-bottom: 20px;
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

@media (max-width: 768px) {
  .half-width {
    width: 100%;
  }
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
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
}
</style>
