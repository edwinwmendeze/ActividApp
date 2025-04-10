<template>
  <div class="chart-report-card">
    <div class="report-header">
      <h3>Ventas por Colaborador</h3>
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
    
    <div class="report-summary" v-if="!loading && !error && colaboradores.length > 0">
      <div class="summary-item">
        <span class="label">Colaborador más activo:</span>
        <span class="value">{{ mejorColaborador.nombre || 'N/A' }}</span>
      </div>
      <div class="summary-item">
        <span class="label">Total de ventas:</span>
        <span class="value">{{ ventasTotales }} pedidos</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSupabaseClient } from '#imports';
import BaseChart from './BaseChart.vue';

const props = defineProps({
  actividadId: {
    type: String,
    required: true
  }
});

const supabase = useSupabaseClient();
const loading = ref(false);
const error = ref('');
const colaboradores = ref([]);
const ventas = ref([]);
const periodoSeleccionado = ref('semana');

// Datos para el gráfico
const chartData = computed(() => {
  const labels = colaboradores.value.map(col => col.nombre || `Colab. ${col.codigo_acceso}`);
  const ventasPorColaborador = colaboradores.value.map(col => {
    return ventas.value.filter(v => v.colaborador_id === col.id).length;
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'Número de Ventas',
        data: ventasPorColaborador,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
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
          return `Ventas: ${context.raw}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
};

// Datos calculados
const mejorColaborador = computed(() => {
  if (!colaboradores.value.length || !ventas.value.length) return { nombre: 'N/A' };
  
  const ventasPorColaborador = colaboradores.value.map(col => {
    const ventasCount = ventas.value.filter(v => v.colaborador_id === col.id).length;
    return { ...col, ventasCount };
  });
  
  return ventasPorColaborador.sort((a, b) => b.ventasCount - a.ventasCount)[0];
});

const ventasTotales = computed(() => ventas.value.length);

// Función para cargar datos desde Supabase
async function cargarDatos() {
  loading.value = true;
  error.value = '';
  
  try {
    // Obtener colaboradores de la actividad
    const { data: colabData, error: colabError } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('actividad_id', props.actividadId);
      
    if (colabError) throw new Error('Error al cargar colaboradores');
    colaboradores.value = colabData || [];
    
    // Construir consulta de pedidos según el período seleccionado
    let query = supabase
      .from('pedidos')
      .select('*')
      .eq('actividad_id', props.actividadId);
      
    // Filtrar por fecha según el período seleccionado
    const ahora = new Date();
    
    if (periodoSeleccionado.value === 'hoy') {
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
      query = query.gte('created_at', hoy);
    } 
    else if (periodoSeleccionado.value === 'semana') {
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - ahora.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      query = query.gte('created_at', inicioSemana.toISOString());
    }
    else if (periodoSeleccionado.value === 'mes') {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
      query = query.gte('created_at', inicioMes);
    }
    
    // Ejecutar consulta
    const { data: ventasData, error: ventasError } = await query;
    
    if (ventasError) throw new Error('Error al cargar ventas');
    ventas.value = ventasData || [];
    
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

.report-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 15px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 150px;
}

.summary-item .label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
}
</style>
