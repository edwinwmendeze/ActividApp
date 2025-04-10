<!-- components/QR/QRScannerComponent.vue -->
<template>
  <div class="qr-scanner-container">
    <div v-if="!cameraActive && !result" class="scanner-instructions">
      <h3>Escaneo de Pedidos</h3>
      <p>Haz clic en el botón para iniciar la cámara y escanear un código QR.</p>
      <button @click="startCamera" class="action-button primary">
        <span class="button-icon">📷</span> Iniciar Cámara
      </button>
    </div>
    
    <div v-if="cameraActive" class="scanner-active">
      <div class="camera-container">
        <qrcode-stream 
          :paused="paused"
          @detect="onDetect"
          @init="onInit"
          @error="onError"
          :camera="camera"
          class="qrcode-stream"
        >
          <div v-if="scanConfirmation" class="scan-confirmation">
            <div class="confirmation-icon">✔️</div>
            <div class="confirmation-text">Código detectado</div>
          </div>
          
          <div v-else class="scan-region-highlight">
            <div class="scan-region-highlight-svg">
              <svg viewBox="0 0 238 238" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h238v238H0z" fill="none"/>
                <path d="M41 5h-36v36" stroke="#4CAF50" stroke-width="6" fill="none"/>
                <path d="M197 5h36v36" stroke="#4CAF50" stroke-width="6" fill="none"/>
                <path d="M41 233h-36v-36" stroke="#4CAF50" stroke-width="6" fill="none"/>
                <path d="M197 233h36v-36" stroke="#4CAF50" stroke-width="6" fill="none"/>
              </svg>
            </div>
          </div>
        </qrcode-stream>
      </div>
      <div class="camera-controls">
        <button @click="stopCamera" class="action-button secondary">
          <span class="button-icon">⏹️</span> Detener Cámara
        </button>
        <button v-if="cameras.length > 1" @click="switchCamera" class="action-button secondary">
          <span class="button-icon">🔄</span> Cambiar Cámara
        </button>
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      <p><strong>Error:</strong> {{ error }}</p>
      <button @click="resetScanner" class="action-button secondary">Reintentar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, onMounted } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'

const props = defineProps({
  // Cualquier prop necesaria
})

const emit = defineEmits(['code-scanned'])

const cameraActive = ref(false)
const paused = ref(false)
const camera = ref('auto')
const cameras = ref([])
const currentCameraIndex = ref(0)
const result = ref(null)
const error = ref('')
const scanConfirmation = ref(false)

// Iniciar cámara
const startCamera = async () => {
  cameraActive.value = true
  paused.value = false
  result.value = null
  error.value = ''
  scanConfirmation.value = false
  console.log('Cámara iniciada')
}

// Detener cámara
const stopCamera = () => {
  cameraActive.value = false
  console.log('Cámara detenida')
}

// Reiniciar escáner
const resetScanner = () => {
  error.value = ''
  result.value = null
  paused.value = false
  scanConfirmation.value = false
  console.log('Escáner reiniciado')
}

// Cambiar cámara
const switchCamera = () => {
  if (cameras.value.length <= 1) return
  currentCameraIndex.value = (currentCameraIndex.value + 1) % cameras.value.length
  camera.value = cameras.value[currentCameraIndex.value].deviceId
  console.log('Cambio a cámara:', camera.value)
}

// Inicialización de la cámara
const onInit = async promise => {
  try {
    console.log('Inicializando cámara...')
    const { capabilities } = await promise
    cameras.value = capabilities.filter(cap => cap.kind === 'videoinput')
    console.log('Cámaras disponibles:', cameras.value.length)
    
    if (cameras.value.length === 0) {
      error.value = 'No se detectaron cámaras. Por favor, verifica los permisos.'
    }
  } catch (err) {
    console.error('Error de inicialización:', err)
    error.value = `Error al inicializar la cámara: ${err.message || 'Error desconocido'}`
  }
}

// Manejar errores
const onError = (err) => {
  console.error('Error en QR Stream:', err)
  error.value = `Error en el escáner: ${err.message || 'Error desconocido'}`
}

// Procesar código detectado - usando el evento @detect que es el correcto para la versión actual
const onDetect = async (detectedCodes) => {
  try {
    if (!detectedCodes || detectedCodes.length === 0) return
    
    const firstCode = detectedCodes[0]
    const decodedString = firstCode.rawValue
    
    console.log('QR detectado:', decodedString)
    result.value = decodedString
    
    // Mostrar confirmación visual
    scanConfirmation.value = true
    paused.value = true
    
    // Esperar un momento para que se vea la confirmación
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Emitir el código escaneado
    emit('code-scanned', decodedString)
    
    // Detener la cámara después de un breve retraso
    setTimeout(() => {
      stopCamera()
    }, 500)
  } catch (err) {
    console.error('Error al decodificar:', err)
    error.value = 'Error al procesar el código: ' + (err.message || 'Error desconocido')
  }
}

// Verificar permisos al cargar el componente
onMounted(() => {
  console.log('QR Scanner Component montado')
  navigator.permissions?.query({ name: 'camera' })
    .then(permissionStatus => {
      console.log('Estado de permiso de cámara:', permissionStatus.state)
    })
    .catch(error => {
      console.log('No se pudo verificar permiso de cámara:', error)
    })
})

// Asegurarse de detener la cámara al desmontar el componente
onUnmounted(() => {
  console.log('QR Scanner Component desmontado')
  cameraActive.value = false
})
</script>

<style scoped>
.qr-scanner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.scanner-instructions, .scanner-active {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: var(--spacing-medium);
  border-radius: var(--border-radius);
  background-color: white;
  box-shadow: var(--card-shadow);
}

.scanner-instructions h3 {
  margin-top: 0;
  color: var(--text-color-dark);
}

.camera-container {
  width: 100%;
  max-width: 350px;
  height: 350px; /* Altura fija para evitar problemas de visibilidad */
  position: relative;
  margin-bottom: var(--spacing-medium);
  overflow: hidden;
  border-radius: var(--border-radius-small);
  background-color: #000; /* Fondo negro para mejorar la visibilidad */
}

.qrcode-stream {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  position: relative !important;
}

.camera-controls {
  display: flex;
  gap: var(--spacing-small);
  margin-top: var(--spacing-medium);
}

.scan-region-highlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none; /* No interferir con los eventos de cámara */
}

.scan-region-highlight-svg {
  width: 80%;
  height: 80%;
}

.scan-confirmation {
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
  z-index: 10;
}

.confirmation-icon {
  font-size: 3rem;
  color: #4CAF50;
  margin-bottom: 1rem;
}

.confirmation-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #4CAF50;
}

.error-message {
  margin-top: var(--spacing-medium);
  padding: var(--spacing-medium);
  background-color: #f8d7da;
  color: #721c24;
  border-radius: var(--border-radius-small);
  text-align: center;
  width: 100%;
}

@media (max-width: 768px) {
  .camera-controls {
    flex-direction: column;
    width: 100%;
  }
  
  .action-button {
    width: 100%;
  }
}
</style>
