<template>
  <div class="chart-container" :style="{ height: height, width: width }">
    <canvas ref="chartCanvas"></canvas>
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>
    <div v-if="error" class="error-overlay">
      <p>{{ error }}</p>
    </div>
    <div v-if="!loading && !error && !hasData" class="empty-overlay">
      <p>No hay datos disponibles</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { Chart, registerables } from 'chart.js';

// Registrar componentes de Chart.js
Chart.register(...registerables);

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['bar', 'line', 'pie', 'doughnut'].includes(value)
  },
  data: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: String,
    default: '300px'
  },
  width: {
    type: String,
    default: '100%'
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

const chartCanvas = ref(null);
const chart = ref(null);

const hasData = computed(() => {
  if (!props.data || !props.data.datasets || !props.data.labels) return false;
  return props.data.datasets.some(dataset => dataset.data && dataset.data.length > 0);
});

const initChart = () => {
  if (!chartCanvas.value) return;
  
  // Destruir gráfico existente si hay uno
  if (chart.value) {
    chart.value.destroy();
  }
  
  // Crear nuevo gráfico
  const ctx = chartCanvas.value.getContext('2d');
  chart.value = new Chart(ctx, {
    type: props.type,
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...props.options
    }
  });
};

// Inicializar el gráfico al montar el componente
onMounted(() => {
  if (!props.loading && hasData.value) {
    initChart();
  }
});

// Actualizar el gráfico cuando cambian los datos o termina la carga
watch(
  [() => props.data, () => props.loading, () => props.type, () => props.options],
  () => {
    if (!props.loading && hasData.value) {
      initChart();
    }
  },
  { deep: true }
);
</script>

<style scoped>
.chart-container {
  position: relative;
  margin-bottom: 20px;
}

.loading-overlay,
.error-overlay,
.empty-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.error-overlay {
  background-color: rgba(255, 235, 235, 0.9);
  color: #d32f2f;
}

.empty-overlay {
  background-color: rgba(245, 245, 245, 0.9);
  color: #666;
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
</style>
