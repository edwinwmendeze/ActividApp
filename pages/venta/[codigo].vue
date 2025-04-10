<!-- pages/venta/[codigo].vue -->
<template>
  <!-- ... -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QRCode from 'qrcode'
import type { Ref } from 'vue'
import type { Colaborador } from '~/types'
import type { Actividad, Producto } from '~/types'
import { formatDate as formatDateUtil, fromUTC } from '~/utils/date'

// Obtener código de venta de la URL
const route = useRoute()
const codigoVenta = route.params.codigo as string

// Estados
const loading = ref(true)
const error = ref('')
const colaborador = ref<Partial<Colaborador>>({})
const actividad = ref<Partial<Actividad>>({})
const loadingProductos = ref(false)
const productos = ref<Producto[]>([])
const filtroActual = ref('')
const step = ref('productos')
const procesando = ref(false)
const pedidoCodigo = ref('')
const pedidoQR = ref('')

// Datos del cliente
const cliente = ref({
  nombre: '',
  telefono: '',
  email: '',
  metodoEntrega: 'recojo',
  direccion: '',
  referencia: '',
  horaRecojo: '',
  horaEntrega: '',
  notas: ''
})

// Datos del pedido
const pedido = ref<Record<string, number>>({})

// Cliente de Supabase
const supabase = useSupabaseClient()

// Calcular productos filtrados
const productosFiltrados = computed(() => {
  if (!filtroActual.value) return productos.value
  return productos.value.filter((p: Producto) => p.tipo === filtroActual.value)
})

// Calcular tipos disponibles
const tiposDisponibles = computed(() => {
  const tipos = new Set<string>()
  productos.value.forEach((p: Producto) => tipos.add(p.tipo))
  return Array.from(tipos)
})

// Calcular items del pedido
const pedidoItems = computed(() => {
  return Object.entries(pedido.value)
    .filter(([_, cantidad]: [string, number]) => cantidad > 0)
    .map(([id, cantidad]: [string, number]) => {
      const producto = productos.value.find((p: Producto) => p.id === id)
      return {
        id,
        nombre: producto?.nombre || '',
        precio: producto?.precio || 0,
        cantidad
      }
    })
})

// Calcular total de items
const totalItems = computed(() => {
  return Object.values(pedido.value).reduce((sum: number, cantidad: number) => sum + cantidad, 0)
})

// Calcular total del pedido
const totalPedido = computed(() => {
  let total = pedidoItems.value.reduce((sum: number, item: { precio: number; cantidad: number }) => sum + (item.precio * item.cantidad), 0)
  
  // Agregar costo de delivery si corresponde
  if (cliente.value.metodoEntrega === 'delivery' && actividad.value.permite_delivery) {
    total += actividad.value.costo_delivery || 0
  }
  
  return total
})

// Horas disponibles generadas de forma dinámica
const horasDisponibles = computed(() => {
  if (!actividad.value.fecha_inicio || !actividad.value.fecha_fin) return []
  
  const fechaInicio = new Date(actividad.value.fecha_inicio)
  const fechaFin = new Date(actividad.value.fecha_fin)
  const horas = []
  const currentDate = new Date(fechaInicio)
  
  // Generar franjas horarias de 30 minutos
  while (currentDate <= fechaFin) {
    const hours = currentDate.getHours().toString().padStart(2, '0')
    const minutes = currentDate.getMinutes().toString().padStart(2, '0')
    const timeStr = `${hours}:${minutes}`
    
    horas.push({
      value: currentDate.toISOString(),
      label: timeStr
    })
    
    // Incrementar 30 minutos
    currentDate.setMinutes(currentDate.getMinutes() + 30)
  }
  
  return horas
})

// Funciones
// Formatear fecha centralizado desde utils/date.js
function formatDate(dateString: string): string {
  if (!dateString) return 'No especificada'
  
  const date = fromUTC(dateString)
  return formatDateUtil(date)
}

function formatTipo(tipo: string): string {
  const tipos = {
    'plato': 'Platos',
    'bebida': 'Bebidas',
    'postre': 'Postres',
    'otro': 'Otros'
  }
  
  return tipos[tipo as keyof typeof tipos] || tipo
}

function getPedidoCantidad(productoId: string): number {
  return pedido.value[productoId] || 0
}

function incrementarCantidad(productoId: string): void {
  if (!pedido.value[productoId]) {
    pedido.value[productoId] = 0
  }
  pedido.value[productoId]++
}

function decrementarCantidad(productoId: string): void {
  if (pedido.value[productoId] > 0) {
    pedido.value[productoId]--
  }
}

// Función para generar un código único de 8 caracteres
function generateUniqueCode(length = 8): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluimos caracteres confusos (O, 0, I, 1)
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function procesarPedido() {
  if (totalItems.value === 0) return
  
  procesando.value = true
  
  try {
    // 1. Generar código único para el pedido (8 caracteres)
    let codigoPedido = generateUniqueCode(8)
    let isUnique = false
    
    // Verificar que el código sea único
    while (!isUnique) {
      const { data } = await supabase
        .from('pedidos')
        .select('codigo_pedido')
        .eq('codigo_pedido', codigoPedido)
      
      if (!data || data.length === 0) {
        isUnique = true
      } else {
        codigoPedido = generateUniqueCode(8)
      }
    }
    
    // 2. URL base para acceso y generar QR
    const baseUrl = window.location.origin
    const pedidoUrl = `${baseUrl}/pedido/${codigoPedido}`
    
    const codigoQR = await QRCode.toDataURL(pedidoUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    
    // 3. Datos para insertar el pedido
    const pedidoData = {
      actividad_id: actividad.value.id,
      colaborador_id: colaborador.value.id,
      cliente_nombre: cliente.value.nombre,
      cliente_telefono: cliente.value.telefono,
      codigo_pedido: codigoPedido,
      codigo_qr: codigoQR,
      es_delivery: cliente.value.metodoEntrega === 'delivery',
      direccion_entrega: cliente.value.metodoEntrega === 'delivery' ? 
        `${cliente.value.direccion}. Ref: ${cliente.value.referencia}` : '',
      hora_entrega: cliente.value.metodoEntrega === 'delivery' ? 
        cliente.value.horaEntrega : cliente.value.horaRecojo,
      estado: 'pendiente',
      pagado: false,
      metodo_pago: 'efectivo',
      subtotal: totalPedido.value - (cliente.value.metodoEntrega === 'delivery' ? actividad.value.costo_delivery || 0 : 0),
      costo_delivery: cliente.value.metodoEntrega === 'delivery' ? actividad.value.costo_delivery || 0 : 0,
      total: totalPedido.value,
      notas: cliente.value.notas
    }
    
    // 4. Insertar el pedido en la base de datos
    const { data: pedidoCreado, error: pedidoError } = await supabase
      .from('pedidos')
      .insert(pedidoData)
      .select('id')
      .single()
    
    if (pedidoError) throw new Error(`Error al crear el pedido: ${pedidoError.message}`)
    
    // 5. Insertar los items del pedido
    if (pedidoItems.value.length > 0) {
      const itemsData = pedidoItems.value.map(item => ({
        pedido_id: pedidoCreado.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad
      }))
      
      const { error: itemsError } = await supabase
        .from('pedido_items')
        .insert(itemsData)
      
      if (itemsError) throw new Error(`Error al crear los items del pedido: ${itemsError.message}`)
    }
    
    // 6. Crear tarjeta virtual para el cliente
    const tarjetaData = {
      pedido_id: pedidoCreado.id,
      enlace_acceso: pedidoUrl,
      fecha_expiracion: null,
      vistas_contador: 0
    }
    
    const { error: tarjetaError } = await supabase
      .from('tarjeta_virtual')
      .insert(tarjetaData)
    
    if (tarjetaError) throw new Error(`Error al crear la tarjeta virtual: ${tarjetaError.message}`)
    
    // 7. Guardar información para mostrar confirmación
    pedidoCodigo.value = codigoPedido
    pedidoQR.value = codigoQR
    step.value = 'confirmacion'
    
  } catch (err: any) {
    console.error('Error al procesar el pedido:', err)
    error.value = err.message || 'Error al procesar el pedido'
  } finally {
    procesando.value = false
  }
}

function downloadQR() {
  if (!pedidoQR.value) return
  
  const link = document.createElement('a')
  link.download = `pedido-${pedidoCodigo.value}.png`
  link.href = pedidoQR.value
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Cargar información de venta y productos
async function loadVentaInfo() {
  loading.value = true
  error.value = ''
  
  try {
    // Buscar el colaborador por su código de venta
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('codigo_venta', codigoVenta)
      .single()
    
    if (colaboradorError) throw new Error('Código de venta no válido o expirado.')
    
    // Si el colaborador está inactivo, mostrar error
    if (!colaboradorData.activo) {
      throw new Error('Este colaborador no está activo actualmente. Por favor, contacte con otro colaborador.')
    }
    
    colaborador.value = colaboradorData
    
    // Buscar la actividad asociada
    const { data: actividadData, error: actividadError } = await supabase
      .from('actividades')
      .select('*')
      .eq('id', colaboradorData.actividad_id)
      .single()
    
    if (actividadError) throw new Error('No se pudo obtener la información de la actividad.')
    
    // Si la actividad no está activa, mostrar error
    if (actividadData.estado !== 'activa') {
      throw new Error(`Esta actividad está ${actividadData.estado}. No es posible realizar pedidos.`)
    }
    
    actividad.value = actividadData
    
    // Cargar productos de la actividad
    await loadProductos(actividadData.id)
    
  } catch (err: any) {
    console.error('Error al cargar la información:', err)
    error.value = err.message || 'Ocurrió un error al cargar la información.'
  } finally {
    loading.value = false
  }
}

async function loadProductos(actividadId: string) {
  loadingProductos.value = true
  
  try {
    const { data, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .eq('actividad_id', actividadId)
      .order('nombre')
    
    if (productosError) throw new Error('Error al cargar los productos.')
    
    productos.value = data || []
  } catch (err: any) {
    console.error('Error al cargar productos:', err)
    error.value = err.message || 'Error al cargar los productos.'
  } finally {
    loadingProductos.value = false
  }
}

// Cargar datos al montar el componente
onMounted(() => {
  loadVentaInfo()
})
</script>

<style scoped>
/* ... */
</style>