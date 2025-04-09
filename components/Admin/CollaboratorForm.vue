<!-- components/Admin/CollaboratorForm.vue -->
<template>
  <div class="modal-container collaborator-form-container">
    <div class="modal-header">
      <h3>{{ isEditing ? 'Editar Colaborador' : 'Añadir Nuevo Colaborador' }}</h3>
      <button @click="$emit('close')" class="close-button" aria-label="Cerrar">&times;</button>
    </div>
    
    <form @submit.prevent="saveCollaborator" class="collaborator-form">
      <div class="form-group">
        <label for="nombre">Nombre *</label>
        <input 
          id="nombre"
          v-model.trim="formData.nombre"
          type="text"
          required
          placeholder="Nombre completo"
          :class="{ 'has-error': errors.nombre }"
        />
        <p v-if="errors.nombre" class="error-message">{{ errors.nombre }}</p>
      </div>
      
      <div class="form-group">
        <label for="telefono">Teléfono</label>
        <input 
          id="telefono"
          v-model.trim="formData.telefono"
          type="tel"
          placeholder="Número de contacto"
        />
      </div>
      
      <div class="form-group">
        <label for="rol">Rol *</label>
        <select 
          id="rol"
          v-model="formData.rol"
          required
          :class="{ 'has-error': errors.rol }"
        >
          <option value="" disabled>Selecciona un rol</option>
          <option value="vendedor">Vendedor</option>
          <option value="gestor">Gestor de Entregas</option>
          <option value="cobrador">Gestor de Cobros</option>
          <option value="admin">Administrador</option>
        </select>
        <p v-if="errors.rol" class="error-message">{{ errors.rol }}</p>
      </div>
      
      <div class="form-group checkbox-group">
        <label class="checkbox-container">
          <input type="checkbox" v-model="formData.activo" />
          <span class="checkmark"></span>
          Colaborador activo
        </label>
      </div>
      
      <div v-if="isEditing" class="form-group">
        <label>Código de acceso</label>
        <div class="code-display-container">
          <div class="code-display">{{ formData.codigo_acceso }}</div>
          <button type="button" @click="regenerateCode" class="action-button secondary">
            Regenerar código
          </button>
        </div>
      </div>
      
      <div v-if="errorMessage" class="error-global">
        {{ errorMessage }}
      </div>
      
      <div class="form-actions">
        <button 
          type="submit" 
          class="action-button primary"
          :disabled="isSaving"
        >
          <div v-if="isSaving" class="button-loader"></div>
          <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Colaborador' }}</span>
        </button>
        <button 
          type="button" 
          @click="$emit('close')" 
          class="action-button secondary"
          :disabled="isSaving"
        >
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
interface CollaboratorFormData {
  nombre: string
  telefono: string
  rol: string
  activo: boolean
  codigo_acceso: string
}

interface Collaborator {
  id?: string
  actividad_id: string
  nombre: string
  telefono?: string
  rol: string
  codigo_acceso: string
  codigo_qr: string
  activo: boolean
}

const props = defineProps<{
  actividadId: string
  collaborator?: Collaborator | null
}>()

const emit = defineEmits(['close', 'saved'])

const supabase = useSupabaseClient()
const QRCode = await import('qrcode')

const isEditing = computed(() => !!props.collaborator)
const isSaving = ref(false)
const errorMessage = ref('')
const errors = ref<Record<string, string>>({})

// Inicializar formulario
const formData = ref<CollaboratorFormData>({
  nombre: '',
  telefono: '',
  rol: '',
  activo: true,
  codigo_acceso: ''
})

// Si estamos editando, cargar datos del colaborador
onMounted(() => {
  if (props.collaborator) {
    formData.value = {
      nombre: props.collaborator.nombre,
      telefono: props.collaborator.telefono || '',
      rol: props.collaborator.rol,
      activo: props.collaborator.activo,
      codigo_acceso: props.collaborator.codigo_acceso
    }
  } else {
    // Si es nuevo, generar código de acceso
    formData.value.codigo_acceso = generateRandomCode()
  }
})

// Generar código aleatorio de 6 caracteres
function generateRandomCode(length = 6) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluir caracteres confusos
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// Regenerar código de acceso
async function regenerateCode() {
  formData.value.codigo_acceso = generateRandomCode()
}

// Generar código QR
async function generateQR(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (err) {
    console.error('Error generando QR:', err)
    throw new Error('No se pudo generar el código QR')
  }
}

// Validar formulario
function validateForm(): boolean {
  const validationErrors: Record<string, string> = {}
  
  if (!formData.value.nombre.trim()) {
    validationErrors.nombre = 'El nombre es obligatorio'
  }
  
  if (!formData.value.rol) {
    validationErrors.rol = 'Debe seleccionar un rol'
  }
  
  errors.value = validationErrors
  return Object.keys(validationErrors).length === 0
}

// Guardar colaborador
async function saveCollaborator() {
  if (!validateForm()) return
  
  isSaving.value = true
  errorMessage.value = ''
  
  try {
    // URL base para acceso (en producción debería ser la URL del sitio)
    const baseUrl = window.location.origin
    const codigoAcceso = formData.value.codigo_acceso
    const colaboradorUrl = `${baseUrl}/colaborador/${codigoAcceso}`
    
    // Generar QR
    const codigoQR = await generateQR(colaboradorUrl)
    
    // Datos para insertar/actualizar
    const collaboratorData = {
      actividad_id: props.actividadId,
      nombre: formData.value.nombre,
      telefono: formData.value.telefono || null,
      rol: formData.value.rol,
      codigo_acceso: codigoAcceso,
      codigo_qr: codigoQR,
      activo: formData.value.activo
    }
    
    if (isEditing.value && props.collaborator?.id) {
      // Actualizar colaborador existente
      const { error } = await supabase
        .from('colaboradores')
        .update(collaboratorData)
        .eq('id', props.collaborator.id)
      
      if (error) throw new Error('Error al actualizar el colaborador')
      
      emit('saved', { ...props.collaborator, ...collaboratorData })
    } else {
      // Crear nuevo colaborador
      const { data, error } = await supabase
        .from('colaboradores')
        .insert(collaboratorData)
        .select()
        .single()
      
      if (error) throw new Error('Error al crear el colaborador')
      
      emit('saved', data)
    }
    
    emit('close')
    
  } catch (err: any) {
    console.error('Error al guardar colaborador:', err)
    errorMessage.value = err.message || 'Error al guardar el colaborador'
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.collaborator-form-container {
  max-width: 500px;
  width: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.4rem;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.close-button:hover {
  opacity: 1;
}

.collaborator-form {
  padding: 1.5rem;
  background-color: white;
  border-bottom-left-radius: var(--border-radius);
  border-bottom-right-radius: var(--border-radius);
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color-dark);
}

input[type="text"],
input[type="tel"],
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-base);
  background-color: #f9f9f9;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus,
select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  outline: none;
}

input.has-error,
select.has-error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.error-global {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
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

/* Código de acceso */
.code-display-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.code-display {
  font-family: monospace;
  font-size: 1.2rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  flex: 1;
  text-align: center;
  letter-spacing: 2px;
  color: var(--primary-color);
  font-weight: bold;
}

/* Botones de acción */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.action-button {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  border: none;
}

.action-button.primary {
  background-color: var(--primary-color);
  color: white;
}

.action-button.primary:hover {
  background-color: var(--button-bg-hover);
}

.action-button.secondary {
  background-color: #f0f0f0;
  color: var(--text-color-dark);
  border: 1px solid var(--border-color);
}

.action-button.secondary:hover {
  background-color: #e0e0e0;
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 640px) {
  .form-actions {
    flex-direction: column;
  }
  
  .code-display-container {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>