<template>
  <div class="chart-report-card">
    <div class="report-header">
      <h3>Productos Más Vendidos</h3>
      <div class="report-controls">
        <select v-model="limiteMostrados" @change="actualizarDatos">
          <option value="5">Top 5</option>
          <option value="10">Top 10</option>
          <option value="20">Top 20</option>
        </select>
      </div>
    </div>
    
    <BaseChart 
      type="pie" 
      :data="chartData" 
      :options="chartOptions" 
      :loading="loading" 
      :error="error"
      height="300px"
    />
    
    <div class="top-products-list" v-if="!loading && !error && productosMasVendidos.length > 0">
      <h4>Detalle de Productos</h4>
      <div class="list-container">
        <div v-for="(producto, index) in productosMasVendidos" :key="producto.id" class="product-row">
          <div class="product-rank">{{ index + 1 }}</div>
          <div class="product-info">
            <div class="product-name">{{ producto.nombre }}</div>
            <div class="product-category">{{ producto.tipo || 'Sin categoría' }}</div>
          </div>
          <div class="product-stats">
            <div class="product-sales">{{ producto.cantidad }} vendidos</div>
            <div class="product-revenue">{{ formatCurrency(producto.ingreso) }}</div>
          </div>
        </div>
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
const productos = ref([]);
const pedidoItems = ref([]);
const limiteMostrados = ref('5');

// Función para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value);
};

// Calcular productos más vendidos
const productosMasVendidos = computed(() => {
  // Crear mapa de ventas por producto
  const ventas = {};
  
  pedidoItems.value.forEach(item => {
    if (!ventas[item.producto_id]) {
      const producto = productos.value.find(p => p.id === item.producto_id);
      if (producto) {
        ventas[item.producto_id] = {
          id: producto.id,
          nombre: producto.nombre,
          tipo: producto.tipo,
          cantidad: 0,
          ingreso: 0
        };
      }
    }
    
    if (ventas[item.producto_id]) {
      ventas[item.producto_id].cantidad += item.cantidad || 1;
      ventas[item.producto_id].ingreso += (item.precio || 0) * (item.cantidad || 1);
    }
  });
  
  // Convertir a array y ordenar por cantidad vendida
  return Object.values(ventas)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, parseInt(limiteMostrados.value));
});

// Datos para el gráfico
const chartData = computed(() => {
  const labels = productosMasVendidos.value.map(p => p.nombre);
  const data = productosMasVendidos.value.map(p => p.cantidad);
  
  // Generar colores dinámicos
  const generateColors = (count) => {
    const baseColors = [
      'rgba(54, 162, 235, 0.7)', // azul
      'rgba(255, 99, 132, 0.7)',  // rojo
      'rgba(255, 206, 86, 0.7)',  // amarillo
      'rgba(75, 192, 192, 0.7)',  // verde
      'rgba(153, 102, 255, 0.7)', // morado
      'rgba(255, 159, 64, 0.7)'   // naranja
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  };
  
  const backgroundColor = generateColors(labels.length);
  const borderColor = backgroundColor.map(color => color.replace('0.7', '1'));
  
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderColor,
        borderWidth: 1
      }
    ]
  };
});

const chartOptions = {
  plugins: {
    legend: {
      position: 'right',
      labels: {
        boxWidth: 15,
        font: {
          size: 11
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw || 0;
          const dataset = context.dataset;
          const total = dataset.data.reduce((acc, data) => acc + data, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  }
};

// Función para actualizar datos
function actualizarDatos() {
  // No necesitamos recargar los datos desde el servidor
  // solo actualizar el límite que mostramos en la UI
}

// Función para cargar datos desde Supabase
async function cargarDatos() {
  loading.value = true;
  error.value = '';
  
  try {
    // Cargar productos de la actividad
    const { data: productosData, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .eq('actividad_id', props.actividadId);
      
    if (productosError) throw new Error('Error al cargar productos');
    productos.value = productosData || [];
    
    // Cargar pedidos de la actividad
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('actividad_id', props.actividadId);
      
    if (pedidosError) throw new Error('Error al cargar pedidos');
    
    // Si hay pedidos, cargar los items de esos pedidos
    if (pedidosData && pedidosData.length > 0) {
      const pedidosIds = pedidosData.map(p => p.id);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('pedido_items')
        .select('*')
        .in('pedido_id', pedidosIds);
        
      if (itemsError) throw new Error('Error al cargar items de pedidos');
      pedidoItems.value = itemsData || [];
    }
    
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

.top-products-list {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.top-products-list h4 {
  margin: 0 0 15px 0;
  font-size: 0.95rem;
  color: #555;
}

.list-container {
  max-height: 300px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid #eee;
}

.product-row {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f2f2f2;
}

.product-row:last-child {
  border-bottom: none;
}

.product-rank {
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 500;
  color: #555;
  margin-right: 12px;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 500;
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 3px;
}

.product-category {
  font-size: 0.8rem;
  color: #777;
}

.product-stats {
  text-align: right;
}

.product-sales {
  font-weight: 500;
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 3px;
}

.product-revenue {
  font-size: 0.85rem;
  color: #4caf50;
  font-weight: 500;
}
</style>
