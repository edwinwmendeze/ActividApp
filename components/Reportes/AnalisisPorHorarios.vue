<template>
  <div class="chart-report-card">
    <div class="report-header">
      <h3>Análisis por Horarios</h3>
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
      type="bar" 
      :data="chartData" 
      :options="chartOptions" 
      :loading="loading" 
      :error="error"
      height="300px"
    />
    
    <div class="hour-insights" v-if="!loading && !error && horasPico.length > 0">
      <div class="insight-card">
        <div class="insight-icon">🔥</div>
        <div class="insight-content">
          <h4>Horas Pico</h4>
          <div class="peak-hours">
            <div v-for="(hora, index) in horasPico" :key="index" class="peak-hour-tag">
              {{ hora.hora }}:00 - {{ hora.hora }}:59
              <span class="peak-count">{{ hora.ventas }} ventas</span>
            </div>
          </div>
        </div>
      </div>

      <div class="insight-card">
        <div class="insight-icon">💰</div>
        <div class="insight-content">
          <h4>Mejor Hora para Ventas</h4>
          <p v-if="horaMasRentable">
            <strong>{{ horaMasRentable.hora }}:00 - {{ horaMasRentable.hora }}:59</strong>
            <span class="stats">Promedio: {{ formatCurrency(horaMasRentable.promedio) }} por pedido</span>
          </p>
          <p v-else>No hay datos suficientes</p>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else-if="!loading && !error && horasPico.length === 0">
      <p>No hay datos suficientes para mostrar tendencias por hora</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSupabaseClient } from '#imports';
import BaseChart from './BaseChart.vue';
import { format, startOfWeek, startOfMonth, parseISO } from 'date-fns';
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
  }).format(value || 0);
};

// Agrupar pedidos por hora
const ventasPorHora = computed(() => {
  if (pedidos.value.length === 0) return [];
  
  const horasMap = {};
  
  // Inicializar el mapa con todas las horas del día (0-23)
  for (let i = 0; i < 24; i++) {
    horasMap[i] = {
      hora: i,
      ventas: 0,
      total: 0
    };
  }
  
  // Agregar pedidos a cada hora
  pedidos.value.forEach(pedido => {
    const fecha = parseISO(pedido.fecha_pedido);
    const hora = fecha.getHours();
    
    horasMap[hora].ventas++;
    horasMap[hora].total += (pedido.total || 0);
  });
  
  // Convertir a array
  return Object.values(horasMap);
});

// Obtener horas pico (top 3 por número de ventas)
const horasPico = computed(() => {
  return [...ventasPorHora.value]
    .sort((a, b) => b.ventas - a.ventas)
    .filter(h => h.ventas > 0)
    .slice(0, 3);
});

// Obtener hora más rentable (promedio más alto por pedido)
const horaMasRentable = computed(() => {
  const horasConVentas = ventasPorHora.value.filter(h => h.ventas > 0);
  
  if (horasConVentas.length === 0) return null;
  
  return [...horasConVentas]
    .map(h => ({
      ...h,
      promedio: h.ventas > 0 ? h.total / h.ventas : 0
    }))
    .sort((a, b) => b.promedio - a.promedio)[0];
});

// Datos para la gráfica
const chartData = computed(() => {
  // Ordenamos por hora para mostrar correctamente en el gráfico
  const horas = [...ventasPorHora.value].sort((a, b) => a.hora - b.hora);
  
  return {
    labels: horas.map(h => `${h.hora}:00`),
    datasets: [
      {
        label: 'Número de Pedidos',
        data: horas.map(h => h.ventas),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Ingresos Totales',
        data: horas.map(h => h.total),
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
        hidden: true, // Inicialmente oculto, el usuario puede activarlo
        yAxisID: 'y1'
      }
    ]
  };
});

// Opciones para la gráfica
const chartOptions = {
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const datasetLabel = context.dataset.label || '';
          const value = context.raw;
          if (datasetLabel === 'Ingresos Totales') {
            return `${datasetLabel}: ${formatCurrency(value)}`;
          }
          return `${datasetLabel}: ${value}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Número de Pedidos'
      }
    },
    y1: {
      beginAtZero: true,
      position: 'right',
      grid: {
        drawOnChartArea: false
      },
      title: {
        display: true,
        text: 'Ingresos (S/)'
      },
      ticks: {
        callback: function(value) {
          return formatCurrency(value);
        }
      }
    }
  }
};

// Función para cargar datos
async function cargarDatos() {
  loading.value = true;
  error.value = '';
  
  try {
    let query = supabase
      .from('pedidos')
      .select('*')
      .eq('actividad_id', props.actividadId)
      .eq('estado', 'pagado'); // Solo pedidos pagados
      
    // Filtrar por periodo
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
    
    const { data, error: pedidosError } = await query;
    
    if (pedidosError) throw new Error(pedidosError.message);
    
    pedidos.value = data || [];
  } catch (err) {
    console.error('Error al cargar datos de pedidos:', err);
    error.value = 'Error al cargar datos';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  cargarDatos();
});

// Método para ser llamado desde el dashboard
defineExpose({
  cargarDatos
});
</script>

<style scoped>
.chart-report-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.report-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.report-controls select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: white;
  font-size: 0.9rem;
}

.hour-insights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.insight-card {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.insight-icon {
  font-size: 1.5rem;
  margin-right: 15px;
  color: #2196f3;
}

.insight-content {
  flex: 1;
}

.insight-content h4 {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  color: #333;
}

.peak-hours {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.peak-hour-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  font-size: 0.85rem;
  padding: 4px 10px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
}

.peak-count {
  margin-left: 6px;
  background-color: #1976d2;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
}

.stats {
  display: block;
  font-size: 0.85rem;
  font-weight: normal;
  color: #666;
  margin-top: 5px;
}

.empty-state {
  padding: 30px;
  text-align: center;
  color: #666;
  font-style: italic;
}
</style>
