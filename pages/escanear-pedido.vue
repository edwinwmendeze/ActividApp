<template>
  <div class="scan-page">
    <!-- Cabecera -->  
    <div class="scan-header">
      <button @click="goBack" class="back-button">
        <span class="back-icon">←</span> Volver
      </button>
      <h1>Escanear Pedido</h1>
    </div>
    
    <div class="scan-content">
      <!-- Mensaje de acceso no autorizado -->
      <div v-if="!isAuthorized" class="unauthorized-message">
        <h2>Acceso no autorizado</h2>
        <p>Solo los administradores y colaboradores pueden escanear pedidos.</p>
        <button @click="goBack" class="action-button primary">
          Volver
        </button>
      </div>
      
      <!-- Contenido principal solo disponible para usuarios autorizados -->
      <template v-else>
        <!-- Paso 1: Escanear QR -->
        <div v-if="step === 'scan'" class="scan-step">
          <QRScannerComponent @code-scanned="handleCodeScanned" />
          
          <div class="scan-instructions">
            <h3>Instrucciones</h3>
            <ol>
              <li>Haz clic en "Iniciar Cámara" para activar el escáner</li>
              <li>Apunta la cámara al código QR del pedido</li>
              <li>El código se detectará automáticamente</li>
            </ol>
            <p class="instruction-note">Asegúrate de tener buena iluminación y que el código esté completamente visible en la pantalla.</p>
          </div>
          
          <!-- Opción para ingresar código manualmente -->
          <div class="manual-entry">
            <h3>¿Problemas con el escáner?</h3>
            <p>También puedes ingresar el código manualmente:</p>
            <div class="manual-input">
              <input 
                v-model="manualCode" 
                type="text" 
                placeholder="Ingresa el código del pedido"
                maxlength="8"
              >
              <button 
                @click="processManualCode" 
                class="action-button primary"
                :disabled="!manualCode.trim()"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
        
        <!-- Paso 2: Mostrar detalles del pedido -->
        <div v-else-if="step === 'details'" class="details-step">
          <PedidoScanDetails 
            :codigo-pedido="scannedCode" 
            @close="resetScan"
            @updated="handlePedidoUpdated"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import QRScannerComponent from '~/components/QR/QRScannerComponent.vue'
import PedidoScanDetails from '~/components/QR/PedidoScanDetails.vue'

const router = useRouter()
const route = useRoute()

// Estado
const step = ref('scan')
const scannedCode = ref('')
const manualCode = ref('')
const returnPath = ref('')
const isAuthorized = ref(false) // Agregar esta variable para controlar el acceso

// Manejar código escaneado
const handleCodeScanned = (code) => {
  // Comprobar si el código es una URL
  try {
    const url = new URL(code)
    // Extraer el código del pedido de la URL
    const pathSegments = url.pathname.split('/')
    scannedCode.value = pathSegments[pathSegments.length - 1]
  } catch (e) {
    // Si no es una URL, usar el código tal cual
    scannedCode.value = code
  }
  
  // Pasar al paso de detalles
  step.value = 'details'
}

// Procesar código ingresado manualmente
const processManualCode = () => {
  if (manualCode.value.trim()) {
    scannedCode.value = manualCode.value.trim()
    step.value = 'details'
  }
}

// Resetear el escáner
const resetScan = () => {
  step.value = 'scan'
  scannedCode.value = ''
  manualCode.value = ''
}

// Volver a la página anterior
const goBack = () => {
  if (returnPath.value) {
    router.push(returnPath.value)
  } else {
    router.back()
  }
}

// Manejar actualización de pedido
const handlePedidoUpdated = (pedidoData) => {
  // Redirigir automáticamente solo en ciertos estados finales
  if (
    // Pedido completado (pagado y entregado)
    (pedidoData.estado === 'entregado' && pedidoData.pagado) ||
    // Pedido cancelado o rechazado
    pedidoData.estado === 'cancelado' ||
    pedidoData.estado === 'rechazado'
  ) {
    // Mostrar mensaje de éxito brevemente antes de redirigir
    setTimeout(() => {
      resetScan()
    }, 2000) // Redirigir después de 2 segundos
  }
  // En cualquier otro caso, permanece en la pantalla de detalles
}

onMounted(() => {
  // Verificar si hay una ruta de retorno en la query
  if (route.query.returnTo) {
    returnPath.value = route.query.returnTo
    
    // Verificar si el usuario está autorizado basado en la ruta de origen
    const returnPathValue = returnPath.value.toString()
    
    // Solo autorizar si viene de una página de admin o colaborador con su código
    if (
      returnPathValue.startsWith('/admin/') || 
      returnPathValue.startsWith('/colaborador/')
    ) {
      // Verificar que el código tenga un formato válido (al menos 5 caracteres alfanuméricos)
      const code = returnPathValue.split('/').pop()
      if (code && code.length >= 5) {
        isAuthorized.value = true
      } else {
        console.error('Código de acceso inválido')
        isAuthorized.value = false
      }
    } else {
      console.error('Ruta de origen no autorizada')
      isAuthorized.value = false
    }
  } else {
    // Si no hay ruta de retorno, no está autorizado
    console.error('No hay ruta de retorno especificada')
    isAuthorized.value = false
  }
})
</script>

<style scoped>
.scan-page {
  min-height: 100vh;
  background-color: var(--background-color);
  padding-bottom: var(--spacing-large);
}

.scan-header {
  background-color: var(--primary-color);
  color: white;
  padding: var(--spacing-medium) var(--spacing-large);
  display: flex;
  align-items: center;
  position: relative;
}

.scan-header h1 {
  margin: 0;
  text-align: center;
  flex: 1;
  font-size: 1.5rem;
}

.back-button {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 1rem;
  padding: var(--spacing-small);
}

.back-icon {
  font-size: 1.2rem;
  margin-right: 4px;
}

.scan-content {
  padding: var(--spacing-large);
  max-width: 800px;
  margin: 0 auto;
}

.scan-step, .details-step {
  margin-bottom: var(--spacing-large);
}

.scan-instructions {
  background-color: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  margin-top: var(--spacing-large);
  box-shadow: var(--card-shadow);
}

.scan-instructions h3 {
  margin-top: 0;
  color: var(--text-color-dark);
}

.scan-instructions ol {
  padding-left: 1.5rem;
  margin-bottom: var(--spacing-medium);
}

.scan-instructions li {
  margin-bottom: var(--spacing-small);
}

.instruction-note {
  font-style: italic;
  color: var(--text-color-light);
  font-size: 0.9rem;
}

.manual-entry {
  background-color: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  margin-top: var(--spacing-large);
  box-shadow: var(--card-shadow);
}

.manual-entry h3 {
  margin-top: 0;
  color: var(--text-color-dark);
}

.manual-input {
  display: flex;
  gap: var(--spacing-small);
  margin-top: var(--spacing-medium);
}

.manual-input input {
  flex: 1;
  padding: var(--spacing-small);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  font-size: 1rem;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: var(--border-radius-small);
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  text-decoration: none;
}

.action-button.primary {
  background-color: var(--primary-color);
  color: white;
}

.action-button.primary:hover {
  background-color: var(--button-bg-hover);
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.unauthorized-message {
  background-color: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  margin-top: var(--spacing-large);
  box-shadow: var(--card-shadow);
  text-align: center;
}

@media (max-width: 768px) {
  .scan-content {
    padding: var(--spacing-medium);
  }
  
  .manual-input {
    flex-direction: column;
  }
  
  .manual-input .action-button {
    width: 100%;
  }
}
</style>
