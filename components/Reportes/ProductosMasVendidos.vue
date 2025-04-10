<template>
  <div class="dashboard-card">
    <div class="card-header" v-if="title">
      <h3>{{ title }}</h3>
    </div>
    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>
    <table v-else-if="productosVendidos.length > 0" class="data-table">
      <thead>
        <tr>
          <th class="producto-celda">Producto</th>
          <th class="cantidad-celda">Cantidad</th>
          <th class="total-celda">Total Vendido</th>
          <th v-if="showPagado" class="pagado-celda">Pagado</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="producto in productosVendidos.slice(0, maxItems)" :key="producto.id">
          <td class="producto-celda">{{ producto.nombre }}</td>
          <td class="cantidad-celda">{{ producto.cantidad }}</td>
          <td class="total-celda">{{ formatCurrency(producto.total) }}</td>
          <td v-if="showPagado" class="pagado-celda">
            <span :class="`pagado-tag ${producto.pagado ? 'pagado' : 'no-pagado'}`">{{ producto.pagado ? 'Sí' : 'No' }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-state">
      <p>No hay datos de productos vendidos disponibles</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSupabaseClient } from '#imports';

// Props
const props = defineProps({
  title: {
    type: String,
    default: 'Productos Más Vendidos'
  },
  actividadId: {
    type: String,
    required: true
  },
  colaboradorId: {
    type: String,
    default: null
  },
  maxItems: {
    type: Number,
    default: 10
  },
  showPagado: {
    type: Boolean,
    default: true
  },
  filtrarSoloPagados: {
    type: Boolean,
    default: false
  }
});

// Variables
const supabase = useSupabaseClient();
const loading = ref(false);
const error = ref('');
const productosVendidos = ref([]);

// Función para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0
  }).format(value || 0);
};

// Cargar datos
async function cargarDatos() {
  loading.value = true;
  error.value = '';
  
  try {
    // Construir la consulta para los pedidos
    let query = supabase
      .from('pedidos')
      .select('id');
    
    // Filtrar por actividad
    query = query.eq('actividad_id', props.actividadId);
    
    // Filtrar por colaborador si se proporciona un ID
    if (props.colaboradorId) {
      query = query.eq('colaborador_id', props.colaboradorId);
    }
    
    // Filtrar solo pedidos pagados si así se solicita
    if (props.filtrarSoloPagados) {
      query = query.eq('pagado', true);
    }
    
    // Ejecutar la consulta
    const { data: pedidosData, error: pedidosError } = await query;
    
    if (pedidosError) {
      throw pedidosError;
    }
    
    // Si hay pedidos, obtenemos sus items desde la tabla pedido_items
    if (pedidosData && pedidosData.length > 0) {
      const pedidosIds = pedidosData.map(p => p.id);
      
      // Obtenemos información de pago de los pedidos
      const { data: pedidosInfoData, error: pedidosInfoError } = await supabase
        .from('pedidos')
        .select('id, pagado')
        .in('id', pedidosIds);
      
      if (pedidosInfoError) {
        throw pedidosInfoError;
      }
      
      // Crear un mapa de pedidos con información de pago
      const pedidosInfoMap = {};
      pedidosInfoData.forEach(pedido => {
        pedidosInfoMap[pedido.id] = pedido.pagado;
      });
      
      // Obtenemos los items de esos pedidos
      const { data: itemsData, error: itemsError } = await supabase
        .from('pedido_items')
        .select('*, producto:producto_id(*)')
        .in('pedido_id', pedidosIds);
      
      if (itemsError) {
        throw itemsError;
      }
      
      // Procesar productos vendidos
      const productoMap = new Map();
      
      if (itemsData && itemsData.length > 0) {
        for (const item of itemsData) {
          // Verificar que el producto exista
          if (!item.producto) continue;
          
          const id = item.producto.id;
          const nombre = item.producto.nombre;
          const cantidad = item.cantidad || 1;
          // Usar el precio del item o, si no existe, el precio del producto
          const precio = item.precio || (item.producto.precio || 0);
          
          // Obtener estado de pago del pedido asociado
          const pedidoId = item.pedido_id;
          const pagado = pedidosInfoMap[pedidoId] || false;
          
          if (id && nombre) {
            if (productoMap.has(id)) {
              const producto = productoMap.get(id);
              producto.cantidad += cantidad;
              producto.total += cantidad * precio;
              // Si alguno de los pedidos está pagado, marcamos el producto como pagado
              producto.pagado = producto.pagado || pagado;
            } else {
              productoMap.set(id, {
                id,
                nombre,
                cantidad,
                total: cantidad * precio,
                pagado
              });
            }
          }
        }
      }
      
      // Convertir el mapa a un array
      const productosArray = Array.from(productoMap.values());
      
      // Ordenar por cantidad vendida (mayor primero)
      productosArray.sort((a, b) => b.cantidad - a.cantidad);
      
      productosVendidos.value = productosArray;
    } else {
      productosVendidos.value = [];
    }
  } catch (err) {
    console.error('Error al cargar productos vendidos:', err);
    error.value = err.message || 'Error al cargar datos';
    productosVendidos.value = [];
  } finally {
    loading.value = false;
  }
}

// Inicializar
onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
.dashboard-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 20px;
  padding: 0 0 10px 0;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9fafb;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed; /* Fijar ancho de tabla */
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #555;
  position: relative;
}

.data-table th::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: #e0e0e0;
}

.data-table tbody tr:hover {
  background-color: #f9fafb;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.producto-celda {
  width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.cantidad-celda {
  width: 15%;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.total-celda {
  width: 20%;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: #1f2937;
}

.pagado-celda {
  width: 20%;
  text-align: center;
}

.pagado-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

.pagado-tag.pagado {
  background-color: #d1fae5;
  color: #065f46;
}

.pagado-tag.no-pagado {
  background-color: #fee2e2;
  color: #b91c1c;
}

.empty-state {
  padding: 30px 20px;
  text-align: center;
  color: #666;
  background-color: #f9fafb;
  border-radius: 8px;
  margin: 10px;
}
</style>
