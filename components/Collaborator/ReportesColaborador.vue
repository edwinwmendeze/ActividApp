<template>
  <div class="colaborador-reportes">
    <div class="reporte-header">
      <h2>Mis estadísticas de pedidos</h2>
      <div class="periodo-selector">
        <select v-model="periodoSeleccionado" @change="cargarDatos">
          <option value="hoy">Hoy</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mes</option>
          <option value="todos">Todo el tiempo</option>
        </select>
      </div>
    </div>
    
    <!-- Resumen principal -->
    <div class="reporte-cards">
      <div class="reporte-card">
        <div class="card-icon">
          <span class="material-icon">{{ rendimientoIcono }}</span>
        </div>
        <div class="card-content">
          <h3>Tu Rendimiento</h3>
          <div class="metric-destacada">{{ rendimientoTexto }}</div>
          <div class="metric-secundaria">
            <span>Posición {{ posicionColaborador }} de {{ totalColaboradores }}</span>
          </div>
        </div>
      </div>
      
      <div class="reporte-card">
        <div class="card-icon">
          <span class="material-icon">payments</span>
        </div>
        <div class="card-content">
          <h3>Ingresos Generados</h3>
          <div class="metric-destacada">{{ formatCurrency(ingresosTotales) }}</div>
          <div class="metric-secundaria">
            {{ totalPedidos }} pedidos completados
          </div>
        </div>
      </div>
      
      <div class="reporte-card">
        <div class="card-icon">
          <span class="material-icon">local_fire_department</span>
        </div>
        <div class="card-content">
          <h3>Producto Estrella</h3>
          <div class="metric-destacada">{{ productoEstrella?.nombre || 'Sin datos' }}</div>
          <div class="metric-secundaria" v-if="productoEstrella">
            {{ productoEstrella.cantidad }} unidades vendidas
          </div>
        </div>
      </div>
      
      <div class="reporte-card">
        <div class="card-icon">
          <span class="material-icon">schedule</span>
        </div>
        <div class="card-content">
          <h3>Pedidos Pendientes</h3>
          <div class="metric-destacada">{{ pedidosPendientes.length }}</div>
          <div class="metric-secundaria">
            {{ pedidosPendientes.length > 0 ? 'Por entregar hoy' : 'No hay pendientes' }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pedidos Pendientes -->
    <div class="tabla-container">
      <h3>Pedidos Pendientes</h3>
      <table v-if="pedidosPendientes.length > 0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Hora de Entrega</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pedido in pedidosPendientes" :key="pedido.id">
            <td>#{{ pedido.id.substring(0, 8) }}</td>
            <td>{{ pedido.cliente_nombre }}</td>
            <td>{{ formatTime(pedido.hora_entrega) }}</td>
            <td>{{ formatCurrency(pedido.total) }}</td>
            <td>
              <span class="estado-tag" :class="pedido.estado">{{ pedido.estado }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <p>No hay pedidos pendientes en este momento</p>
      </div>
    </div>
    
    <!-- Tabla: Productos más vendidos -->
    <div class="tabla-container">
      <h3>Mis productos más vendidos</h3>
      <ProductosMasVendidos 
        :actividad-id="props.actividadId"
        :colaborador-id="props.colaboradorId"
        :show-pagado="true"
        :filtrar-solo-pagados="false"
        :max-items="5"
        title=""
      />
    </div>
    
    <!-- Pedidos por Tipo de Entrega -->
    <div class="tabla-container">
      <div class="header-actions">
        <h3>Pedidos por Tipo de Entrega y Estado</h3>
        <div class="filtros-container">
          <div class="filtro-group">
            <span class="filtro-label">Tipo de entrega:</span>
            <div class="filtro-entrega">
              <button 
                @click="filtroEntrega = 'todos'" 
                :class="{ 'active': filtroEntrega === 'todos' }">
                Todos
              </button>
              <button 
                @click="filtroEntrega = 'delivery'" 
                :class="{ 'active': filtroEntrega === 'delivery' }">
                Delivery
              </button>
              <button 
                @click="filtroEntrega = 'local'" 
                :class="{ 'active': filtroEntrega === 'local' }">
                Recojo en Local
              </button>
            </div>
          </div>
          
          <div class="filtro-group">
            <span class="filtro-label">Estado:</span>
            <div class="filtro-estado">
              <button 
                @click="filtroEstado = 'todos'" 
                :class="{ 'active': filtroEstado === 'todos' }">
                Todos
              </button>
              <button 
                @click="filtroEstado = 'pagado'" 
                :class="{ 'active': filtroEstado === 'pagado' }">
                Pagado
              </button>
              <button 
                @click="filtroEstado = 'pendiente'" 
                :class="{ 'active': filtroEstado === 'pendiente' }">
                Pendiente
              </button>
              <button 
                @click="filtroEstado = 'preparando'" 
                :class="{ 'active': filtroEstado === 'preparando' }">
                Preparando
              </button>
              <button 
                @click="filtroEstado = 'fiado'" 
                :class="{ 'active': filtroEstado === 'fiado' }">
                Fiado
              </button>
              <button 
                @click="filtroEstado = 'cancelado'" 
                :class="{ 'active': filtroEstado === 'cancelado' }">
                Cancelado
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <table v-if="pedidosFiltrados.length > 0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Tipo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pedido in pedidosFiltrados" :key="pedido.id">
            <td>#{{ pedido.id.substring(0, 8) }}</td>
            <td>{{ pedido.cliente_nombre }}</td>
            <td>{{ formatFecha(pedido.fecha_pedido) }}</td>
            <td>{{ formatCurrency(pedido.total) }}</td>
            <td>
              <span :class="['tipo-tag', pedido.es_delivery ? 'delivery' : 'local']">
                {{ pedido.es_delivery ? 'Delivery' : 'Recojo en Local' }}
              </span>
            </td>
            <td>
              <span class="estado-tag" :class="pedido.estado">{{ pedido.estado }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <p>No hay pedidos que coincidan con el filtro seleccionado</p>
      </div>
    </div>
    
    <!-- Mis últimos pedidos -->
    <div class="pedidos-recientes">
      <div class="header-actions">
        <h3>Mis últimos pedidos</h3>
        <button @click="exportarCSV" class="export-button" :disabled="pedidosRecientes.length === 0">
          Exportar a CSV
        </button>
      </div>
      
      <table v-if="pedidosRecientes.length > 0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pedido in pedidosRecientes" :key="pedido.id">
            <td>#{{ pedido.id.substring(0, 8) }}</td>
            <td>{{ formatFecha(pedido.fecha_pedido) }}</td>
            <td>{{ formatCurrency(pedido.total) }}</td>
            <td>
              <span class="estado-tag" :class="pedido.estado">{{ pedido.estado }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <p>No hay pedidos recientes</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useSupabaseClient } from '#imports';
import ProductosMasVendidos from '~/components/Reportes/ProductosMasVendidos.vue';
import { format, startOfWeek, startOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const props = defineProps({
  colaboradorId: {
    type: String,
    required: true
  },
  actividadId: {
    type: String,
    required: true
  }
});

const supabase = useSupabaseClient();
const loading = ref(false);
const error = ref('');
const periodoSeleccionado = ref('hoy');
const pedidos = ref([]);
const pedidosItems = ref([]);
const colaboradores = ref([]);
const productosVendidos = ref([]);
const pedidosRecientes = ref([]);
const pedidosPendientes = ref([]);
const totalPedidos = ref(0);
const ingresosTotales = ref(0);
const totalColaboradores = ref(0);
const posicionColaborador = ref(0);
const productoEstrella = ref(null);
const filtroEntrega = ref('todos');
const filtroEstado = ref('todos');

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

// Formatear hora
const formatTime = (horaStr) => {
  if (!horaStr) return '';
  return format(parseISO(horaStr), 'HH:mm', { locale: es });
};

// Computado para el icono de rendimiento
const rendimientoIcono = computed(() => {
  if (posicionColaborador.value === 1) return 'military_tech';
  if (posicionColaborador.value === 2) return 'workspace_premium';
  if (posicionColaborador.value === 3) return 'stars';
  if (posicionColaborador.value <= Math.ceil(totalColaboradores.value * 0.25)) return 'emoji_events';
  if (posicionColaborador.value <= Math.ceil(totalColaboradores.value * 0.5)) return 'trending_up';
  return 'rocket_launch';
});

// Texto de rendimiento
const rendimientoTexto = computed(() => {
  if (posicionColaborador.value === 1) return 'Excelente';
  if (posicionColaborador.value <= Math.ceil(totalColaboradores.value * 0.25)) return 'Muy Bueno';
  if (posicionColaborador.value <= Math.ceil(totalColaboradores.value * 0.5)) return 'Bueno';
  if (posicionColaborador.value <= Math.ceil(totalColaboradores.value * 0.75)) return 'Regular';
  return 'Mejorable';
});

// Pedidos filtrados por tipo de entrega y estado
const pedidosFiltrados = computed(() => {
  // Primero filtramos por tipo de entrega
  let pedidosFiltradosPorTipo = pedidos.value;
  if (filtroEntrega.value !== 'todos') {
    pedidosFiltradosPorTipo = pedidos.value.filter(pedido => pedido.es_delivery === (filtroEntrega.value === 'delivery'));
  }
  
  // Luego filtramos por estado
  if (filtroEstado.value !== 'todos') {
    return pedidosFiltradosPorTipo.filter(pedido => pedido.estado === filtroEstado.value);
  }
  
  return pedidosFiltradosPorTipo;
});

// Cargar datos de pedidos del colaborador
async function cargarDatos() {
  loading.value = true;
  error.value = '';
  
  try {
    // Configurar filtro de fecha según periodo
    const ahora = new Date();
    let fechaInicio;
    
    if (periodoSeleccionado.value === 'hoy') {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      fechaInicio.setHours(0, 0, 0, 0); // Asegurar que empiece a las 00:00:00
    } else if (periodoSeleccionado.value === 'semana') {
      fechaInicio = startOfWeek(ahora, { locale: es });
    } else if (periodoSeleccionado.value === 'mes') {
      fechaInicio = startOfMonth(ahora);
    }
    
    // 1. Cargar pedidos del colaborador
    let query = supabase
      .from('pedidos')
      .select('*')
      .eq('actividad_id', props.actividadId)
      .eq('colaborador_id', props.colaboradorId);
      
    if (fechaInicio && periodoSeleccionado.value !== 'todos') {
      // Convertir a formato ISO para Supabase
      query = query.gte('fecha_pedido', fechaInicio.toISOString());
    }
    
    const { data: pedidosData, error: pedidosError } = await query;
    
    if (pedidosError) {
      console.error('Error al cargar pedidos:', pedidosError);
      throw new Error('Error al cargar pedidos');
    }
    
    console.log(`Se encontraron ${pedidosData?.length || 0} pedidos para el periodo ${periodoSeleccionado.value}`);
    console.log('Desde:', fechaInicio ? fechaInicio.toISOString() : 'todos los tiempos');
    
    pedidos.value = pedidosData || [];
    totalPedidos.value = pedidos.value.length;
    pedidosRecientes.value = [...pedidos.value].sort((a, b) => 
      new Date(b.fecha_pedido) - new Date(a.fecha_pedido)
    ).slice(0, 10);
    
    // Calcular ingresos totales
    ingresosTotales.value = pedidos.value.reduce((sum, pedido) => {
      // Asegurar que solo sumamos los pedidos que están pagados
      return sum + (pedido.pagado ? (pedido.total || 0) : 0);
    }, 0);
    
    // 2. Cargar items de pedidos para productos más vendidos
    if (pedidos.value.length > 0) {
      const pedidosIds = pedidos.value.map(p => p.id);
      
      // Verificación de seguridad por si no hay IDs de pedido
      if (pedidosIds.length === 0) {
        console.log('No hay pedidos para cargar items');
        productosVendidos.value = [];
        productoEstrella.value = null; // Asegurarnos de que productoEstrella sea null
      } else {
        try {
          const { data: itemsData, error: itemsError } = await supabase
            .from('pedido_items')
            .select('*, producto:producto_id(*)')
            .in('pedido_id', pedidosIds);
            
          if (itemsError) {
            console.error('Error al cargar items de pedidos:', itemsError);
            throw new Error('Error al cargar items de pedidos');
          }
          
          pedidosItems.value = itemsData || [];
          
          if (pedidosItems.value.length === 0) {
            console.log('No se encontraron items de pedidos');
            productosVendidos.value = [];
            productoEstrella.value = null; // Asegurarnos de que productoEstrella sea null
          } else {
            // Procesar productos más vendidos
            const productosMap = {};
            
            pedidosItems.value.forEach(item => {
              if (!item.producto) {
                console.log('Item sin producto asociado:', item);
                return;
              }
              
              const productoId = item.producto.id;
              if (!productosMap[productoId]) {
                productosMap[productoId] = {
                  id: productoId,
                  nombre: item.producto.nombre,
                  cantidad: 0,
                  total: 0
                };
              }
              
              productosMap[productoId].cantidad += item.cantidad || 0;
              productosMap[productoId].total += ((item.precio || 0) * (item.cantidad || 0));
            });
            
            productosVendidos.value = Object.values(productosMap)
              .sort((a, b) => b.cantidad - a.cantidad);
            
            // Actualizar producto estrella
            if (productosVendidos.value.length > 0) {
              productoEstrella.value = productosVendidos.value[0];
            } else {
              productoEstrella.value = null;
            }
          }
        } catch (err) {
          console.error('Error al procesar productos vendidos:', err);
          productosVendidos.value = [];
          productoEstrella.value = null; // Asegurarnos de que productoEstrella sea null
        }
      }
    } else {
      productosVendidos.value = [];
      productoEstrella.value = null; // Asegurarnos de que productoEstrella sea null
    }
    
    // 3. Obtener ranking del colaborador
    const { data: colabsData, error: colabsError } = await supabase
      .from('colaboradores')
      .select('id, nombre')
      .eq('actividad_id', props.actividadId);
      
    if (colabsError) throw new Error('Error al cargar colaboradores');
    
    colaboradores.value = colabsData || [];
    totalColaboradores.value = colaboradores.value.length;
    
    // Valores por defecto si no hay datos
    if (totalColaboradores.value === 0) {
      totalColaboradores.value = 1;
      posicionColaborador.value = 1;
    } else {
      // 4. Calcular posición del colaborador
      const rankingPromise = Promise.all(colaboradores.value.map(async (colaborador) => {
        let query = supabase
          .from('pedidos')
          .select('*')
          .eq('actividad_id', props.actividadId)
          .eq('colaborador_id', colaborador.id);
          
        if (fechaInicio && periodoSeleccionado.value !== 'todos') {
          query = query.gte('fecha_pedido', fechaInicio.toISOString());
        }
        
        const { data, error } = await query;
        
        if (error) return { id: colaborador.id, ventas: 0 };
        
        const ventasCompletadas = data.filter(p => p.estado === 'pagado').length;
        
        return {
          id: colaborador.id,
          ventas: ventasCompletadas
        };
      }));
      
      const rankingData = await rankingPromise;
      const rankingSorted = rankingData.sort((a, b) => b.ventas - a.ventas);
      
      const miPosicion = rankingSorted.findIndex(c => c.id === props.colaboradorId);
      posicionColaborador.value = miPosicion !== -1 ? miPosicion + 1 : rankingSorted.length;
    }
    
    // Pedidos pendientes
    const { data: pendientesData, error: pendientesError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('actividad_id', props.actividadId)
      .eq('colaborador_id', props.colaboradorId)
      .or('estado.eq.pendiente,estado.eq.fiado,estado.eq.preparando');
      
    if (pendientesError) {
      console.error('Error al cargar pedidos pendientes:', pendientesError);
      throw new Error('Error al cargar pedidos pendientes');
    }
    
    pedidosPendientes.value = pendientesData || [];
    
  } catch (err) {
    console.error('Error al cargar datos:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Exportar datos a CSV
function exportarCSV() {
  if (pedidosRecientes.value.length === 0) return;
  
  // Preparar datos
  const headers = ['ID', 'Fecha', 'Total', 'Estado'];
  const rows = pedidosRecientes.value.map(pedido => [
    pedido.id,
    formatFecha(pedido.fecha_pedido),
    pedido.total || 0,
    pedido.estado
  ]);
  
  // Crear contenido CSV
  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  // Crear blob y link para descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `mis_pedidos_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Observar cambios en el periodo seleccionado
watch(periodoSeleccionado, () => {
  cargarDatos();
});

onMounted(() => {
  cargarDatos();
});

// Exponer métodos para padres
defineExpose({
  cargarDatos
});
</script>

<style scoped>
.colaborador-reportes {
  padding-bottom: 2rem;
}

.reporte-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.reporte-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.periodo-selector select {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 0.9rem;
}

.reporte-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.reporte-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 1.5rem;
  display: flex;
  align-items: center;
}

.card-icon {
  font-size: 2.5rem;
  margin-right: 1rem;
  color: #3b82f6;
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

.card-content {
  flex: 1;
}

.card-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #666;
}

.metric-destacada {
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.metric-secundaria {
  font-size: 0.9rem;
  color: #666;
}

.tabla-container,
.pedidos-recientes {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.tabla-container h3,
.pedidos-recientes h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  color: #333;
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

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th, td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 600;
  color: #555;
  background-color: #f9fafb;
}

.producto-celda {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #666;
  font-style: italic;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.export-button {
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.export-button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.export-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.estado-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
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

.tipo-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.tipo-tag.delivery {
  background-color: #e0f2fe;
  color: #075985;
}

.tipo-tag.local {
  background-color: #d1fae5;
  color: #065f46;
}

.filtro-entrega {
  display: flex;
  gap: 0.5rem;
}

.filtro-entrega button {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 6px;
  background-color: #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.filtro-entrega button:hover {
  background-color: #e0e0e0;
}

.filtro-entrega button.active {
  background-color: #3b82f6;
  color: white;
}

.filtro-estado {
  display: flex;
  gap: 0.5rem;
}

.filtro-estado button {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 6px;
  background-color: #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.filtro-estado button:hover {
  background-color: #e0e0e0;
}

.filtro-estado button.active {
  background-color: #3b82f6;
  color: white;
}

.filtros-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: space-between;
}

.filtro-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filtro-label {
  font-size: 0.9rem;
  color: #666;
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .reporte-cards {
    grid-template-columns: 1fr;
  }
  
  .reporte-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .pedidos-recientes .header-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  table {
    font-size: 0.9rem;
  }
  
  th, td {
    padding: 0.5rem 0.75rem;
  }
}
</style>
