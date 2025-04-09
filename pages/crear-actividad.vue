<!-- pages/crear-actividad.vue -->
<template>
  <div class="container">
    <h1 class="page-title">Crear Nueva Actividad</h1>
    
    <!-- Loader mientras se procesa -->
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Creando tu actividad, espera un momento...</p>
    </div>
    
    <!-- Resultado exitoso -->
    <div v-else-if="actividadCreada" class="success-container">
      <div class="success-header">
        <div class="success-icon">✅</div>
        <h2>¡Actividad creada exitosamente!</h2>
      </div>
      
      <div class="activity-info">
        <h3>{{ actividadData.nombre }}</h3>
        <p><strong>Fecha:</strong> {{ formatDate(actividadData.fecha_inicio) }} al {{ formatDate(actividadData.fecha_fin) }}</p>
        <p><strong>Organizador:</strong> {{ actividadData.organizador_nombre }}</p>
      </div>
      
      <div class="access-codes">
        <div class="code-box">
          <h3>Código de Acceso</h3>
          <div class="code-display">{{ actividadData.codigo_acceso }}</div>
          <p>Usa este código para acceder como administrador</p>
          <button @click="copyToClipboard(actividadData.codigo_acceso)" class="copy-button">
            Copiar código
          </button>
        </div>
        
        <div class="code-box">
          <h3>Código QR</h3>
          <img :src="actividadData.codigo_qr" alt="Código QR" class="qr-code" />
          <p>Escanea este código para acceder directamente</p>
          <button @click="downloadQR" class="download-button">
            Descargar QR
          </button>
        </div>
      </div>
      
      <div class="success-actions">
        <NuxtLink :to="`/admin/${actividadData.codigo_acceso}`" class="action-button primary">
          Ir al Panel de Administración
        </NuxtLink>
        <NuxtLink to="/" class="action-button secondary">
          Volver al Inicio
        </NuxtLink>
      </div>
    </div>
    
    <!-- Formulario de creación -->
    <form v-else @submit.prevent="crearActividad" class="activity-form">
      <div class="form-section">
        <h2 class="section-title">Información de la Actividad</h2>
        
        <div class="form-group">
          <label for="nombre">Nombre de la Actividad *</label>
          <input 
            id="nombre"
            v-model.trim="formData.nombre"
            type="text"
            required
            placeholder="Ej: Feria Gastronómica Comunitaria"
            :class="{ 'has-error': errors.nombre }"
          />
          <p v-if="errors.nombre" class="error-message">{{ errors.nombre }}</p>
        </div>
        
        <div class="form-group">
          <label for="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            v-model.trim="formData.descripcion"
            rows="3"
            placeholder="Describe brevemente el propósito de la actividad..."
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="fecha_inicio">Fecha de Inicio *</label>
            <input
              id="fecha_inicio"
              v-model="formData.fecha_inicio"
              type="datetime-local"
              required
              :class="{ 'has-error': errors.fecha_inicio }"
            />
            <p v-if="errors.fecha_inicio" class="error-message">{{ errors.fecha_inicio }}</p>
          </div>
          
          <div class="form-group">
            <label for="fecha_fin">Fecha de Fin *</label>
            <input
              id="fecha_fin"
              v-model="formData.fecha_fin"
              type="datetime-local"
              required
              :class="{ 'has-error': errors.fecha_fin }"
            />
            <p v-if="errors.fecha_fin" class="error-message">{{ errors.fecha_fin }}</p>
          </div>
        </div>
        
        <div class="form-group">
          <label for="ubicacion">Ubicación</label>
          <input
            id="ubicacion"
            v-model.trim="formData.ubicacion"
            type="text"
            placeholder="Ej: Salón Comunitario Central"
          />
        </div>
      </div>
      
      <div class="form-section">
        <h2 class="section-title">Datos del Organizador</h2>
        
        <div class="form-group">
          <label for="organizador_nombre">Nombre del Organizador *</label>
          <input
            id="organizador_nombre"
            v-model.trim="formData.organizador_nombre"
            type="text"
            required
            placeholder="Tu nombre completo"
            :class="{ 'has-error': errors.organizador_nombre }"
          />
          <p v-if="errors.organizador_nombre" class="error-message">{{ errors.organizador_nombre }}</p>
        </div>
        
        <div class="form-group">
          <label for="organizador_telefono">Teléfono de Contacto</label>
          <input
            id="organizador_telefono"
            v-model.trim="formData.organizador_telefono"
            type="tel"
            placeholder="Ej: 555-123-4567"
          />
        </div>
      </div>
      
      <div class="form-section">
        <h2 class="section-title">Opciones Adicionales</h2>
        
        <div class="form-group checkbox-group">
          <label class="checkbox-container">
            <input type="checkbox" v-model="formData.permite_delivery" />
            <span class="checkmark"></span>
            Permitir delivery para esta actividad
          </label>
        </div>
        
        <div class="form-group" v-if="formData.permite_delivery">
          <label for="costo_delivery">Costo de Delivery (0 = gratis)</label>
          <input
            id="costo_delivery"
            v-model.number="formData.costo_delivery"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
      </div>
      
      <div v-if="errorGlobal" class="error-global">
        {{ errorGlobal }}
      </div>
      
      <div class="form-actions">
        <button type="submit" class="action-button primary">Crear Actividad</button>
        <NuxtLink to="/" class="action-button secondary">Cancelar</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import QRCode from 'qrcode'

// Cliente de Supabase
const supabase = useSupabaseClient()

// Variables reactivas
const formData = ref({
  nombre: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  ubicacion: '',
  organizador_nombre: '',
  organizador_telefono: '',
  permite_delivery: true,
  costo_delivery: 0
})

const errors = ref({})
const errorGlobal = ref('')
const loading = ref(false)
const actividadCreada = ref(false)
const actividadData = ref({})

// Función para generar un código de 6 dígitos alfanumérico único
function generateRandomCode(length = 6) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluimos caracteres confusos como O, 0, I, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Función para generar QR
async function generateQR(data) {
  try {
    return await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generando QR:', err);
    throw new Error('No se pudo generar el código QR');
  }
}

// Función para validar el formulario
function validarFormulario() {
  const errores = {};
  
  // Validar nombre
  if (!formData.value.nombre.trim()) {
    errores.nombre = 'El nombre de la actividad es obligatorio';
  } else if (formData.value.nombre.length < 3) {
    errores.nombre = 'El nombre debe tener al menos 3 caracteres';
  }
  
  // Validar fechas
  if (!formData.value.fecha_inicio) {
    errores.fecha_inicio = 'La fecha de inicio es obligatoria';
  }
  
  if (!formData.value.fecha_fin) {
    errores.fecha_fin = 'La fecha de fin es obligatoria';
  }
  
  if (formData.value.fecha_inicio && formData.value.fecha_fin) {
    const inicio = new Date(formData.value.fecha_inicio);
    const fin = new Date(formData.value.fecha_fin);
    
    if (fin <= inicio) {
      errores.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
  }
  
  // Validar organizador
  if (!formData.value.organizador_nombre.trim()) {
    errores.organizador_nombre = 'El nombre del organizador es obligatorio';
  }
  
  errors.value = errores;
  return Object.keys(errores).length === 0;
}

// Función para crear la actividad
async function crearActividad() {
  // Resetear mensajes de error
  errorGlobal.value = '';
  
  // Validar formulario
  if (!validarFormulario()) {
    return;
  }
  
  loading.value = true;
  
  try {
    // Generar código único
    let codigoAcceso = generateRandomCode();
    let isUnique = false;
    
    // Verificar que el código sea único
    while (!isUnique) {
      const { data } = await supabase
        .from('actividades')
        .select('codigo_acceso')
        .eq('codigo_acceso', codigoAcceso);
      
      if (!data || data.length === 0) {
        isUnique = true;
      } else {
        codigoAcceso = generateRandomCode();
      }
    }
    
    // URL base para acceso (en producción debería ser la URL del sitio)
    const baseUrl = window.location.origin;
    const actividadUrl = `${baseUrl}/admin/${codigoAcceso}`;
    
    // Generar QR
    const codigoQR = await generateQR(actividadUrl);
    
    // Datos para insertar
    const actividadInsert = {
      nombre: formData.value.nombre,
      descripcion: formData.value.descripcion || '',
      fecha_inicio: formData.value.fecha_inicio,
      fecha_fin: formData.value.fecha_fin,
      ubicacion: formData.value.ubicacion || '',
      organizador_nombre: formData.value.organizador_nombre,
      organizador_telefono: formData.value.organizador_telefono || '',
      codigo_acceso: codigoAcceso,
      codigo_qr: codigoQR,
      permite_delivery: formData.value.permite_delivery,
      costo_delivery: formData.value.costo_delivery || 0,
      estado: 'activa'
    };
    
    // Insertar en Supabase
    const { data, error } = await supabase
      .from('actividades')
      .insert(actividadInsert)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message || 'Error al crear la actividad');
    }
    
    // Guardar datos para mostrar
    actividadData.value = data;
    actividadCreada.value = true;
    
  } catch (err) {
    console.error('Error al crear actividad:', err);
    errorGlobal.value = err.message || 'Ocurrió un error al crear la actividad. Inténtalo de nuevo.';
  } finally {
    loading.value = false;
  }
}

// Copiar código al portapapeles
function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      alert('Código copiado al portapapeles');
    })
    .catch(err => {
      console.error('No se pudo copiar: ', err);
    });
}

// Descargar código QR
function downloadQR() {
  if (!actividadData.value.codigo_qr) return;
  
  const link = document.createElement('a');
  link.download = `actividad-${actividadData.value.codigo_acceso}.png`;
  link.href = actividadData.value.codigo_qr;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Formatear fecha para mostrar
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-large);
}

.page-title {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: var(--spacing-large);
  font-size: 2.2rem;
}

/* Formulario */
.activity-form {
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-large);
}

.form-section {
  margin-bottom: var(--spacing-large);
  padding-bottom: var(--spacing-medium);
  border-bottom: 1px solid var(--border-color);
}

.form-section:last-child {
  border-bottom: none;
}

.section-title {
  color: var(--text-color-dark);
  font-size: 1.4rem;
  margin-bottom: var(--spacing-medium);
}

.form-group {
  margin-bottom: var(--spacing-medium);
}

.form-row {
  display: flex;
  gap: var(--spacing-medium);
  flex-wrap: wrap;
}

.form-row .form-group {
  flex: 1;
  min-width: 250px;
}

label {
  display: block;
  margin-bottom: var(--spacing-small);
  font-weight: 500;
  color: var(--text-color-dark);
}

input, textarea {
  width: 100%;
  padding: var(--spacing-small);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-base);
  background-color: #f9f9f9;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  outline: none;
}

input.has-error, textarea.has-error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: var(--spacing-xsmall);
}

.error-global {
  background-color: #f8d7da;
  color: #721c24;
  padding: var(--spacing-small);
  border-radius: var(--border-radius-small);
  margin-bottom: var(--spacing-medium);
}

/* Checkbox personalizado */
.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 35px;
  cursor: pointer;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #f9f9f9;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: #f0f0f0;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Botones de acción */
.form-actions {
  display: flex;
  gap: var(--spacing-medium);
  margin-top: var(--spacing-large);
  flex-wrap: wrap;
}

.action-button {
  display: inline-block;
  padding: var(--spacing-small) var(--spacing-large);
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-base);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  flex: 1;
}

.action-button.primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.action-button.primary:hover {
  background-color: var(--button-bg-hover);
}

.action-button.secondary {
  background-color: #f2f2f2;
  color: var(--text-color-dark);
  border: 1px solid var(--border-color);
}

.action-button.secondary:hover {
  background-color: #e2e2e2;
}

/* Loader */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xlarge);
  text-align: center;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-medium);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Resultado exitoso */
.success-container {
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-large);
}

.success-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.success-icon {
  font-size: 2rem;
  color: #28a745;
}

.success-header h2 {
  color: #28a745;
  margin: 0;
}

.activity-info {
  background-color: #f8f9fa;
  padding: var(--spacing-medium);
  border-radius: var(--border-radius-small);
  margin-bottom: var(--spacing-large);
}

.activity-info h3 {
  margin-top: 0;
  color: var(--primary-color);
}

.access-codes {
  display: flex;
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
  flex-wrap: wrap;
}

.code-box {
  flex: 1;
  min-width: 250px;
  background-color: #f8f9fa;
  border-radius: var(--border-radius-small);
  padding: var(--spacing-medium);
  text-align: center;
}

.code-display {
  font-size: 2rem;
  font-weight: bold;
  letter-spacing: 2px;
  background-color: #fff;
  padding: var(--spacing-small);
  border-radius: var(--border-radius-small);
  margin: var(--spacing-medium) 0;
  color: var(--primary-color);
}

.qr-code {
  display: block;
  max-width: 200px;
  margin: var(--spacing-medium) auto;
  border: 1px solid var(--border-color);
  padding: var(--spacing-small);
  background-color: #fff;
}

.copy-button, .download-button {
  background-color: #f0f0f0;
  border: 1px solid var(--border-color);
  padding: var(--spacing-small) var(--spacing-medium);
  border-radius: var(--border-radius-small);
  margin-top: var(--spacing-small);
  cursor: pointer;
  transition: background-color 0.2s;
}

.copy-button:hover, .download-button:hover {
  background-color: #e2e2e2;
}

.success-actions {
  display: flex;
  gap: var(--spacing-medium);
  margin-top: var(--spacing-large);
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
  }
  
  .form-actions, .success-actions {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
  }
  
  .access-codes {
    flex-direction: column;
  }
  
  .code-box {
    width: 100%;
  }
}
</style>