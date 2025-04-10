<template>
  <div class="chart-report-card">
    <div class="report-header">
      <h3>Ingresos Totales</h3>
      <div class="report-controls">
        <select v-model="periodoSeleccionado" @change="cargarDatos">
          <option value="hoy">Hoy</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mes</option>
          <option value="todos">Todos los tiempos</option>
        </select>
      </div>
    </div>
    
    <BaseChart 
      type="line" 
      :data="chartData" 
      :options="chartOptions" 
      :loading="loading" 
      :error="error"
      height="300px"
    />
    
    <div class="stats-summary" v-if="!loading && !error">
      <div class="summary-row">
        <div class="summary-item primary">
          <div class="item-label">Ingresos Totales</div>
          <div class="item-value">{{ formatCurrency(ingresoTotal) }}</div>
        </div>
        <div class="summary-item">
          <div class="item-label">Pedidos Procesados</div>
          <div class="item-value">{{ pedidos.length }}</div>
        </div>
        <div class="summary-item">
          <div class="item-label">Promedio por Pedido</div>
          <div class="item-value">{{ formatCurrency(promedioPorPedido) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSupabaseClient } from '@nuxtjs/supabase/dist/runtime/composables/useSupabaseClient';
import BaseChart from './BaseChart.vue';
import { format, startOfWeek, startOfMonth, parseISO, isAfter, isBefore, addDays } from 'date-fns';
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
const periodoSeleccionado = ref('semana');

// Función para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0
  }).format(value);
};

// Calcular ingresos totales
const ingresoTotal = computed(() => {
  return pedidos.value.reduce((total, pedido) => {
    return total + (pedido.total || 0);
  }, 0);
});

// Calcular promedio por pedido
const promedioPorPedido = computed(() => {
  if (pedidos.value.length === 0) return 0;
  return ingresoTotal.value / pedidos.value.length;
});

// Agrupar datos por fecha para el gráfico
const datosAgrupados = computed(() => {
  if (pedidos.value.length === 0) return [];
  
  // Determinar formato de fecha según periodo
  const formatoFecha = periodoSeleccionado.value === 'hoy' ? 'HH:mm' : 'dd MMM';
  
  // Ordenar pedidos por fecha
  const pedidosOrdenados = [...pedidos.value].sort((a, b) => {
    return new Date(a.fecha_pedido) - new Date(b.fecha_pedido);
  });
  
  // Agrupar pedidos por fecha
  const agrupados = {};
  
  pedidosOrdenados.forEach(pedido => {
    const fecha = parseISO(pedido.fecha_pedido);
    const fechaFormateada = format(fecha, formatoFecha, { locale: es });
    
    if (!agrupados[fechaFormateada]) {
      agrupados[fechaFormateada] = {
        fecha: fechaFormateada,
        total: 0,
        cantidad: 0
      };
    }
    
    agrupados[fechaFormateada].total += (pedido.total || 0);
    agrupados[fechaFormateada].cantidad += 1;
  });
  
  // Convertir a array
  return Object.values(agrupados);
});

// Datos para el gráfico
const chartData = computed(() => {
  const labels = datosAgrupados.value.map(item => item.fecha);
  const datos = datosAgrupados.value.map(item => item.total);
  
  return {
    labels,
    datasets: [
      {
        label: 'Ingresos',
        data: datos,
        fill: false,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true
      }
    ]
  };
});

const chartOptions = {
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `Ingresos: ${formatCurrency(context.raw)}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return formatCurrency(value);
        }
      }
    }
  }
};

// Función para cargar datos desde Supabase
async function cargarDatos() {
  loading.value = true;
  error.value = '';
  
  try {
    let query = supabase
      .from('pedidos')
      .select('*')
      .eq('actividad_id', props.actividadId)
      .eq('estado', 'pagado'); // Solo pedidos pagados para ingresos
      
    // Filtrar por fecha según el período seleccionado
    const ahora = new Date();
    
    if (periodoSeleccionado.value === 'hoy') {
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
      query = query.gte('fecha_pedido', hoy);
    } 
    else if (periodoSeleccionado.value === 'semana') {
      const inicioSemana = startOfWeek(ahora, { locale: es }).toISOString();
      query = query.gte('fecha_pedido', inicioSemana);
    }
    else if (periodoSeleccionado.value === 'mes') {
      const inicioMes = startOfMonth(ahora).toISOString();
      query = query.gte('fecha_pedido', inicioMes);
    }
    
    // Ejecutar consulta
    const { data, error: pedidosError } = await query;
    
    if (pedidosError) throw new Error('Error al cargar pedidos');
    pedidos.value = data || [];
    
  } catch (err) {
    console.error('Error al cargar datos:', err);
    error.value = err.message || 'Error al cargar datos';
  } finally {
    loading.value = false;
  }
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

.report-controls select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 0.9rem;
}

.stats-summary {
  margin-top: 15px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-between;
}

.summary-item {
  flex: 1;
  min-width: 120px;
  padding: 15px;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.summary-item.primary {
  background-color: #e6f3ff;
}

.item-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 5px;
}

.item-value {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
}

.summary-item.primary .item-value {
  color: #036fd1;
}
</style>
