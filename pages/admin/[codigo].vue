<!-- pages/admin/[codigo].vue -->
<template>
    <div class="admin-panel">
      <!-- Barra superior con información básica -->
      <div class="top-bar">
        <h1 class="activity-name">{{ actividad.nombre || 'Cargando...' }}</h1>
        
        <div class="activity-info" v-if="actividad.id">
          <div class="info-tag">
            <span class="tag-label">Actividad:</span>
            <span class="tag-value">{{ actividad.codigo_acceso }}</span>
          </div>
          <div class="info-tag">
            <span class="tag-label">Estado:</span>
            <span class="tag-value" :class="`estado-${actividad.estado}`">{{ actividad.estado }}</span>
          </div>
        </div>
      </div>
      
      <!-- Pantalla de carga -->
      <div v-if="loading" class="loading-container">
        <div class="loader"></div>
        <p>Cargando información de la actividad...</p>
      </div>
      
      <!-- Mensaje de error -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">❌</div>
        <h2>Error al cargar la actividad</h2>
        <p>{{ error }}</p>
        <NuxtLink to="/acceso-codigo" class="action-button">Volver a intentar</NuxtLink>
      </div>
      
      <!-- Panel principal -->
      <div v-else-if="actividad.id" class="panel-container">
        <!-- Menú de navegación -->
        <div class="panel-nav">
          <button 
            v-for="(tab, index) in tabs" 
            :key="index"
            @click="activeTab = tab.id"
            :class="['nav-button', { active: activeTab === tab.id }]"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            {{ tab.name }}
          </button>
        </div>
        
        <!-- Contenido del tab activo -->
        <div class="panel-content">
          <!-- Tab: Dashboard -->
          <div v-if="activeTab === 'dashboard'" class="tab-content">
            <h2>Panel General</h2>
            
            <div class="dashboard-cards">
              <div class="dashboard-card">
                <div class="card-icon">🍽️</div>
                <div class="card-content">
                  <h3>Productos</h3>
                  <div class="card-value">{{ estadisticas.totalProductos || 0 }}</div>
                </div>
              </div>
              
              <div class="dashboard-card">
                <div class="card-icon">👥</div>
                <div class="card-content">
                  <h3>Colaboradores</h3>
                  <div class="card-value">{{ estadisticas.totalColaboradores || 0 }}</div>
                </div>
              </div>
              
              <div class="dashboard-card">
                <div class="card-icon">📝</div>
                <div class="card-content">
                  <h3>Pedidos</h3>
                  <div class="card-value">{{ estadisticas.totalPedidos || 0 }}</div>
                </div>
              </div>
            </div>
            
            <div class="activity-details">
              <h3>Información de la Actividad</h3>
              
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-label">Fecha de inicio:</div>
                  <div class="detail-value">{{ formatDate(actividad.fecha_inicio) }}</div>
                </div>
                
                <div class="detail-item">
                  <div class="detail-label">Fecha de fin:</div>
                  <div class="detail-value">{{ formatDate(actividad.fecha_fin) }}</div>
                </div>
                
                <div class="detail-item">
                  <div class="detail-label">Organizador:</div>
                  <div class="detail-value">{{ actividad.organizador_nombre }}</div>
                </div>
                
                <div class="detail-item">
                  <div class="detail-label">Contacto:</div>
                  <div class="detail-value">{{ actividad.organizador_telefono || 'No especificado' }}</div>
                </div>
                
                <div class="detail-item">
                  <div class="detail-label">Ubicación:</div>
                  <div class="detail-value">{{ actividad.ubicacion || 'No especificada' }}</div>
                </div>
                
                <div class="detail-item">
                  <div class="detail-label">Delivery:</div>
                  <div class="detail-value">{{ actividad.permite_delivery ? 'Habilitado' : 'No disponible' }}</div>
                </div>
              </div>
              
              <div class="qr-section">
                <h4>Código QR de la Actividad</h4>
                <div class="qr-container">
                  <img :src="actividad.codigo_qr" alt="Código QR de acceso" class="qr-image" />
                  <button @click="downloadQR" class="download-button">
                    Descargar QR
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tab: Productos -->
            <div v-else-if="activeTab === 'productos'" class="tab-content">
            <div class="tab-header">
                <h2>Gestión de Productos</h2>
                <button @click="mostrarFormularioProducto()" class="action-button">
                <span class="button-icon">+</span> Añadir Producto
                </button>
            </div>
            
            <!-- Filtros y búsqueda -->
            <div class="filters-bar">
                <div class="search-box">
                <input 
                    type="text" 
                    v-model="filtros.busqueda" 
                    placeholder="Buscar productos..." 
                    @input="filtrarProductos"
                />
                </div>
                <div class="filter-options">
                <select v-model="filtros.tipo" @change="filtrarProductos">
                    <option value="">Todos los tipos</option>
                    <option value="plato">Platos</option>
                    <option value="bebida">Bebidas</option>
                    <option value="postre">Postres</option>
                    <option value="otro">Otros</option>
                </select>
                <select v-model="filtros.disponibilidad" @change="filtrarProductos">
                    <option value="">Todos</option>
                    <option value="disponible">Disponibles</option>
                    <option value="no-disponible">No disponibles</option>
                </select>
                </div>
            </div>

            <!-- Loader mientras se cargan los productos -->
            <div v-if="loadingProductos" class="centered-loader">
                <div class="loader"></div>
                <p>Cargando productos...</p>
            </div>
            
            <!-- Mensaje cuando no hay productos -->
            <div v-else-if="productosFiltrados.length === 0" class="empty-state">
                <div class="empty-icon">🍽️</div>
                <h3>No hay productos</h3>
                <p v-if="filtros.busqueda || filtros.tipo || filtros.disponibilidad !== ''">
                No se encontraron productos con los filtros seleccionados.
                <button @click="limpiarFiltros" class="text-button">Limpiar filtros</button>
                </p>
                <p v-else>
                ¡Comienza añadiendo tu primer producto para tu actividad!
                </p>
                <button @click="mostrarFormularioProducto()" class="action-button">
                Añadir Primer Producto
                </button>
            </div>
            
            <!-- Lista de productos -->
            <div v-else class="productos-grid">
                <div 
                v-for="producto in productosFiltrados" 
                :key="producto.id"
                class="producto-card"
                >
                <div class="producto-disponibilidad" :class="{ 'no-disponible': !producto.disponible }">
                    {{ producto.disponible ? 'Disponible' : 'No disponible' }}
                </div>
                
                <div class="producto-imagen-container">
                    <img 
                    v-if="producto.imagen_url" 
                    :src="producto.imagen_url" 
                    :alt="producto.nombre" 
                    class="producto-imagen"
                    />
                    <div v-else class="producto-imagen-placeholder">
                    {{ obtenerEmoji(producto.tipo) }}
                    </div>
                </div>
                
                <div class="producto-info">
                    <h3 class="producto-nombre">{{ producto.nombre }}</h3>
                    <div class="producto-tipo">{{ formatearTipo(producto.tipo) }}</div>
                    <div class="producto-descripcion">{{ producto.descripcion || 'Sin descripción' }}</div>
                    <div class="producto-precio">${{ producto.precio.toFixed(2) }}</div>
                </div>
                
                <div class="producto-acciones">
                    <button @click="mostrarFormularioProducto(producto)" class="icon-button edit">
                    ✏️
                    </button>
                    <button @click="confirmarEliminarProducto(producto)" class="icon-button delete">
                    🗑️
                    </button>
                </div>
                </div>
            </div>
            
            <!-- Modal formulario para crear/editar producto -->
            <div v-if="mostrarModal" class="modal-overlay" @click="cerrarModal">
                <div class="modal-container" @click.stop>
                <div class="modal-header">
                    <h3>{{ modoEdicion ? 'Editar Producto' : 'Añadir Nuevo Producto' }}</h3>
                    <button @click="cerrarModal" class="close-button">&times;</button>
                </div>
                
                <form @submit.prevent="guardarProducto" class="producto-form">
                    <div class="form-row">
                    <div class="form-group">
                        <label for="nombre">Nombre *</label>
                        <input 
                        id="nombre"
                        v-model.trim="productoForm.nombre"
                        type="text"
                        required
                        placeholder="Ej: Hamburguesa vegetariana"
                        :class="{ 'has-error': erroresForm.nombre }"
                        />
                        <p v-if="erroresForm.nombre" class="error-message">{{ erroresForm.nombre }}</p>
                    </div>
                    
                    <div class="form-group">
                        <label for="tipo">Tipo *</label>
                        <select 
                        id="tipo"
                        v-model="productoForm.tipo"
                        required
                        :class="{ 'has-error': erroresForm.tipo }"
                        >
                        <option value="" disabled>Selecciona un tipo</option>
                        <option value="plato">Plato</option>
                        <option value="bebida">Bebida</option>
                        <option value="postre">Postre</option>
                        <option value="otro">Otro</option>
                        </select>
                        <p v-if="erroresForm.tipo" class="error-message">{{ erroresForm.tipo }}</p>
                    </div>
                    </div>
                    
                    <div class="form-group">
                    <label for="descripcion">Descripción</label>
                    <textarea
                        id="descripcion"
                        v-model.trim="productoForm.descripcion"
                        rows="2"
                        placeholder="Describe los ingredientes o detalles del producto..."
                    ></textarea>
                    </div>
                    
                    <div class="form-row">
                    <div class="form-group">
                        <label for="precio">Precio *</label>
                        <div class="input-prefix">
                        <span class="prefix">$</span>
                        <input 
                            id="precio"
                            v-model.number="productoForm.precio"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            :class="{ 'has-error': erroresForm.precio }"
                        />
                        </div>
                        <p v-if="erroresForm.precio" class="error-message">{{ erroresForm.precio }}</p>
                    </div>
                    
                    <div class="form-group">
                        <label>Disponibilidad</label>
                        <label class="checkbox-container">
                        <input type="checkbox" v-model="productoForm.disponible" />
                        <span class="checkmark"></span>
                        Producto disponible para venta
                        </label>
                    </div>
                    </div>
                    <!-- Reemplaza la sección de imagen por esto: -->
                    <!-- 
                    <div class="form-group">
                    <label>Imagen del producto</label>
                    <div class="imagen-upload-container">
                        <div 
                        v-if="imagenPreview || productoForm.imagen_url" 
                        class="imagen-preview"
                        >
                        <img 
                            :src="imagenPreview || productoForm.imagen_url" 
                            alt="Vista previa" 
                        />
                        <button 
                            type="button" 
                            @click="eliminarImagen" 
                            class="remove-image-button"
                        >
                            &times;
                        </button>
                        </div>
                        <div v-else class="upload-placeholder" @click="activarInputImagen">
                        <div class="upload-icon">📷</div>
                        <p>Haz clic para subir una imagen</p>
                        </div>
                        <input 
                        type="file"
                        ref="imagenInput"
                        @change="seleccionarImagen"
                        accept="image/*"
                        style="display: none"
                        />
                    </div>
                    </div>
                -->
                    <div v-if="errorFormulario" class="error-global">
                    {{ errorFormulario }}
                    </div>
                    
                    <div class="form-actions">
                    <button 
                        type="submit" 
                        class="action-button primary"
                        :disabled="guardandoProducto"
                    >
                        <div v-if="guardandoProducto" class="button-loader"></div>
                        <span v-else>{{ modoEdicion ? 'Guardar Cambios' : 'Crear Producto' }}</span>
                    </button>
                    <button 
                        type="button" 
                        @click="cerrarModal" 
                        class="action-button secondary"
                        :disabled="guardandoProducto"
                    >
                        Cancelar
                    </button>
                    </div>
                </form>
                </div>
            </div>
            
            <!-- Modal de confirmación para eliminar -->
            <div v-if="mostrarConfirmacion" class="modal-overlay" @click="mostrarConfirmacion = false">
                <div class="modal-container confirmation-modal" @click.stop>
                <div class="modal-header">
                    <h3>Confirmar eliminación</h3>
                    <button @click="mostrarConfirmacion = false" class="close-button">&times;</button>
                </div>
                
                <div class="confirmation-content">
                    <div class="warning-icon">⚠️</div>
                    <p>¿Estás seguro de que deseas eliminar el producto <strong>{{ productoAEliminar?.nombre }}</strong>?</p>
                    <p>Esta acción no se puede deshacer.</p>
                </div>
                
                <div class="confirmation-actions">
                    <button 
                    @click="eliminarProducto" 
                    class="action-button danger"
                    :disabled="eliminandoProducto"
                    >
                    <div v-if="eliminandoProducto" class="button-loader"></div>
                    <span v-else>Eliminar</span>
                    </button>
                    <button 
                    @click="mostrarConfirmacion = false" 
                    class="action-button secondary"
                    :disabled="eliminandoProducto"
                    >
                    Cancelar
                    </button>
                </div>
                </div>
            </div>
            
            <!-- Notificación de éxito -->
            <div v-if="notificacion.mostrar" class="notificacion" :class="notificacion.tipo">
                <div class="notificacion-contenido">
                <span class="notificacion-icono">{{ notificacion.tipo === 'exito' ? '✅' : '❌' }}</span>
                <span class="notificacion-mensaje">{{ notificacion.mensaje }}</span>
                </div>
            </div>
            </div>
          
          <!-- Tab: Colaboradores -->
          <div v-else-if="activeTab === 'colaboradores'" class="tab-content">
            <div class="tab-header">
              <h2>Gestión de Colaboradores</h2>
              <button class="action-button">Añadir Colaborador</button>
            </div>
            
            <p class="placeholder-message">Aquí podrás gestionar los colaboradores de tu actividad</p>
            
            <!-- Implementación futura: lista de colaboradores -->
          </div>
          
          <!-- Tab: Pedidos -->
          <div v-else-if="activeTab === 'pedidos'" class="tab-content">
            <div class="tab-header">
              <h2>Gestión de Pedidos</h2>
              <button class="action-button">Nuevo Pedido</button>
            </div>
            
            <p class="placeholder-message">Aquí podrás gestionar los pedidos de tu actividad</p>
            
            <!-- Implementación futura: lista de pedidos -->
          </div>
          
          <!-- Tab: Configuración -->
          <div v-else-if="activeTab === 'configuracion'" class="tab-content">
            <h2>Configuración de la Actividad</h2>
            
            <p class="placeholder-message">Aquí podrás configurar los ajustes de tu actividad</p>
            
            <!-- Implementación futura: configuración de la actividad -->
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const route = useRoute();
  const supabase = useSupabaseClient();
  
  // Estado de la página
  const loading = ref(true);
  const error = ref('');
  const actividad = ref({});
  const activeTab = ref('dashboard');
  const estadisticas = ref({
    totalProductos: 0,
    totalColaboradores: 0,
    totalPedidos: 0
  });


  // Variables para gestión de productos
const productos = ref([]);
const productosFiltrados = ref([]);
const loadingProductos = ref(true);
const mostrarModal = ref(false);
const modoEdicion = ref(false);
const productoAEditar = ref(null);
const productoAEliminar = ref(null);
const mostrarConfirmacion = ref(false);
const guardandoProducto = ref(false);
const eliminandoProducto = ref(false);
const imagenPreview = ref('');
const imagenFile = ref(null);
const imagenInput = ref(null);
const errorFormulario = ref('');

// Filtros
const filtros = ref({
  busqueda: '',
  tipo: '',
  disponibilidad: ''
});

// Errores del formulario
const erroresForm = ref({});

// Formulario de producto
const productoForm = ref({
  nombre: '',
  descripcion: '',
  precio: 0,
  tipo: '',
  disponible: true,
  imagen_url: ''
});

// Notificación
const notificacion = ref({
  mostrar: false,
  mensaje: '',
  tipo: 'exito'
});

// Cargar productos cuando se active el tab de productos
watch(activeTab, async (newTab) => {
  if (newTab === 'productos' && actividad.value.id) {
    await cargarProductos();
  }
});

// Función para cargar productos
async function cargarProductos() {
  loadingProductos.value = true;
  
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('actividad_id', actividad.value.id)
      .order('nombre');
    
    if (error) {
      throw new Error('Error al cargar los productos');
    }
    
    productos.value = data || [];
    productosFiltrados.value = [...productos.value];
  } catch (err) {
    console.error('Error al cargar productos:', err);
    mostrarNotificacion('Error al cargar los productos', 'error');
  } finally {
    loadingProductos.value = false;
  }
}

// Filtrar productos
function filtrarProductos() {
  productosFiltrados.value = productos.value.filter(producto => {
    // Filtro por búsqueda
    const matchBusqueda = !filtros.value.busqueda || 
      producto.nombre.toLowerCase().includes(filtros.value.busqueda.toLowerCase()) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(filtros.value.busqueda.toLowerCase()));
    
    // Filtro por tipo
    const matchTipo = !filtros.value.tipo || producto.tipo === filtros.value.tipo;
    
    // Filtro por disponibilidad
    let matchDisponibilidad = true;
    if (filtros.value.disponibilidad === 'disponible') {
      matchDisponibilidad = producto.disponible;
    } else if (filtros.value.disponibilidad === 'no-disponible') {
      matchDisponibilidad = !producto.disponible;
    }
    
    return matchBusqueda && matchTipo && matchDisponibilidad;
  });
}

// Limpiar filtros
function limpiarFiltros() {
  filtros.value = {
    busqueda: '',
    tipo: '',
    disponibilidad: ''
  };
  productosFiltrados.value = [...productos.value];
}

// Formatear tipo de producto
function formatearTipo(tipo) {
  const tipos = {
    plato: 'Plato',
    bebida: 'Bebida',
    postre: 'Postre',
    otro: 'Otro'
  };
  
  return tipos[tipo] || tipo;
}

// Obtener emoji para placeholder
function obtenerEmoji(tipo) {
  const emojis = {
    plato: '🍽️',
    bebida: '🥤',
    postre: '🍰',
    otro: '📦'
  };
  
  return emojis[tipo] || '📦';
}

// Mostrar formulario de producto (nuevo o edición)
function mostrarFormularioProducto(producto = null) {
  // Resetear formulario
  erroresForm.value = {};
  errorFormulario.value = '';
  imagenPreview.value = '';
  imagenFile.value = null;
  
  if (producto) {
    // Modo edición
    modoEdicion.value = true;
    productoAEditar.value = producto;
    productoForm.value = {
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      tipo: producto.tipo,
      disponible: producto.disponible,
      imagen_url: producto.imagen_url || ''
    };
  } else {
    // Modo creación
    modoEdicion.value = false;
    productoAEditar.value = null;
    productoForm.value = {
      nombre: '',
      descripcion: '',
      precio: 0,
      tipo: '',
      disponible: true,
      imagen_url: ''
    };
  }
  
  mostrarModal.value = true;
}

// Cerrar modal
function cerrarModal() {
  if (guardandoProducto.value) return;
  mostrarModal.value = false;
}

// Seleccionar imagen
function seleccionarImagen(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Verificar tipo de archivo
  if (!file.type.match('image.*')) {
    errorFormulario.value = 'Por favor selecciona una imagen válida';
    return;
  }
  
  // Verificar tamaño (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    errorFormulario.value = 'La imagen no debe superar los 2MB';
    return;
  }
  
  imagenFile.value = file;
  
  // Crear preview
  const reader = new FileReader();
  reader.onload = e => {
    imagenPreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Activar input de imagen
function activarInputImagen() {
  imagenInput.value.click();
}

// Eliminar imagen
function eliminarImagen() {
  imagenPreview.value = '';
  imagenFile.value = null;
  productoForm.value.imagen_url = '';
  if (imagenInput.value) {
    imagenInput.value.value = '';
  }
}

// Validar formulario
function validarFormulario() {
  const errores = {};
  
  // Validar nombre
  if (!productoForm.value.nombre.trim()) {
    errores.nombre = 'El nombre es obligatorio';
  }
  
  // Validar tipo
  if (!productoForm.value.tipo) {
    errores.tipo = 'Debes seleccionar un tipo de producto';
  }
  
  // Validar precio
  if (productoForm.value.precio === null || productoForm.value.precio === undefined) {
    errores.precio = 'El precio es obligatorio';
  } else if (productoForm.value.precio < 0) {
    errores.precio = 'El precio no puede ser negativo';
  }
  
  erroresForm.value = errores;
  return Object.keys(errores).length === 0;
}

// Subir imagen a Supabase Storage
async function subirImagen() {
  if (!imagenFile.value) return productoForm.value.imagen_url;
  
  const fileExt = imagenFile.value.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${actividad.value.id}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('productos-imagenes')
    .upload(filePath, imagenFile.value);
  
  if (error) {
    throw new Error('Error al subir la imagen');
  }
  
  // Obtener URL pública
  const { data: publicUrl } = supabase.storage
    .from('productos-imagenes')
    .getPublicUrl(filePath);
  
  return publicUrl.publicUrl;
}

// Guardar producto (crear o editar)
async function guardarProducto() {
  if (!validarFormulario()) return;
  
  guardandoProducto.value = true;
  errorFormulario.value = '';
  
  try {
    // Subir imagen si hay una nueva
    let imagenUrl = productoForm.value.imagen_url;
    if (imagenFile.value) {
      imagenUrl = await subirImagen();
    }
    
    // Datos del producto
    const productoData = {
      actividad_id: actividad.value.id,
      nombre: productoForm.value.nombre,
      descripcion: productoForm.value.descripcion,
      precio: productoForm.value.precio,
      tipo: productoForm.value.tipo,
      disponible: productoForm.value.disponible,
      imagen_url: imagenUrl
    };
    
    if (modoEdicion.value) {
      // Actualizar producto existente
      const { error } = await supabase
        .from('productos')
        .update(productoData)
        .eq('id', productoAEditar.value.id);
      
      if (error) throw new Error('Error al actualizar el producto');
      
      mostrarNotificacion('Producto actualizado correctamente');
    } else {
      // Crear nuevo producto
      const { error } = await supabase
        .from('productos')
        .insert(productoData);
      
      if (error) throw new Error('Error al crear el producto');
      
      mostrarNotificacion('Producto creado correctamente');
    }
    
    // Recargar productos y cerrar modal
    await cargarProductos();
    cerrarModal();
    
  } catch (err) {
    console.error('Error al guardar producto:', err);
    errorFormulario.value = err.message || 'Error al guardar el producto';
  } finally {
    guardandoProducto.value = false;
  }
}

// Confirmar eliminación de producto
function confirmarEliminarProducto(producto) {
  productoAEliminar.value = producto;
  mostrarConfirmacion.value = true;
}

// Eliminar producto
async function eliminarProducto() {
  if (!productoAEliminar.value) return;
  
  eliminandoProducto.value = true;
  
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', productoAEliminar.value.id);
    
    if (error) throw new Error('Error al eliminar el producto');
    
    // Si tiene imagen, eliminarla del storage
    if (productoAEliminar.value.imagen_url) {
      // Extraer el path de la URL
      const urlParts = productoAEliminar.value.imagen_url.split('/');
      const filePath = urlParts.slice(-2).join('/');
      
      // No esperamos la respuesta, lo hacemos en segundo plano
      supabase.storage
        .from('productos-imagenes')
        .remove([filePath])
        .then(({ error }) => {
          if (error) console.error('Error al eliminar imagen:', error);
        });
    }
    
    mostrarNotificacion('Producto eliminado correctamente');
    await cargarProductos();
    mostrarConfirmacion.value = false;
    
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    mostrarNotificacion('Error al eliminar el producto', 'error');
  } finally {
    eliminandoProducto.value = false;
  }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'exito') {
  notificacion.value = {
    mostrar: true,
    mensaje,
    tipo
  };
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notificacion.value.mostrar = false;
  }, 3000);
}
  
  // Definición de los tabs
  const tabs = [
    { id: 'dashboard', name: 'Panel General', icon: '📊' },
    { id: 'productos', name: 'Productos', icon: '🍽️' },
    { id: 'colaboradores', name: 'Colaboradores', icon: '👥' },
    { id: 'pedidos', name: 'Pedidos', icon: '📝' },
    { id: 'configuracion', name: 'Configuración', icon: '⚙️' }
  ];
  
  // Cargar datos de la actividad
  onMounted(async () => {
    const codigo = route.params.codigo;
    
    if (!codigo) {
      error.value = 'Código de actividad no proporcionado';
      loading.value = false;
      return;
    }
    
    try {
      // Obtener datos de la actividad
      const { data: actividadData, error: actividadError } = await supabase
        .from('actividades')
        .select('*')
        .eq('codigo_acceso', codigo)
        .single();
      
      if (actividadError) {
        throw new Error('Error al cargar la información de la actividad');
      }
      
      if (!actividadData) {
        throw new Error('No se encontró ninguna actividad con ese código');
      }
      
      // Guardar datos de la actividad
      actividad.value = actividadData;
      
      // Verificar estado
      if (actividadData.estado !== 'activa') {
        throw new Error(`Esta actividad está ${actividadData.estado}. No es posible acceder.`);
      }
      
      // Cargar estadísticas básicas
      await cargarEstadisticas(actividadData.id);
      
    } catch (err) {
      console.error('Error al cargar la actividad:', err);
      error.value = err.message || 'Ocurrió un error al cargar la actividad';
    } finally {
      loading.value = false;
    }
  });
  
  // Cargar estadísticas básicas
  async function cargarEstadisticas(actividadId) {
    try {
      // Total de productos
      const { count: totalProductos } = await supabase
        .from('productos')
        .select('id', { count: 'exact' })
        .eq('actividad_id', actividadId);
      
      // Total de colaboradores
      const { count: totalColaboradores } = await supabase
        .from('colaboradores')
        .select('id', { count: 'exact' })
        .eq('actividad_id', actividadId);
      
      // Total de pedidos
      const { count: totalPedidos } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact' })
        .eq('actividad_id', actividadId);
      
      estadisticas.value = {
        totalProductos,
        totalColaboradores,
        totalPedidos
      };
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  }
  
  // Formatear fecha
  function formatDate(dateString) {
    if (!dateString) return 'No especificada';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  // Descargar código QR
  function downloadQR() {
    if (!actividad.value.codigo_qr) return;
    
    const link = document.createElement('a');
    link.download = `actividad-${actividad.value.codigo_acceso}.png`;
    link.href = actividad.value.codigo_qr;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  </script>
  
  <style scoped>
  .admin-panel {
    min-height: 100vh;
    background-color: #f8f9fa;
  }
  
  .top-bar {
    background-color: var(--primary-color);
    color: white;
    padding: var(--spacing-medium) var(--spacing-large);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-medium);
  }
  
  .activity-name {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .activity-info {
    display: flex;
    gap: var(--spacing-small);
  }
  
  .info-tag {
    background-color: rgba(255, 255, 255, 0.2);
    padding: var(--spacing-xsmall) var(--spacing-small);
    border-radius: var(--border-radius-small);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .tag-label {
    font-size: 0.8rem;
    opacity: 0.8;
  }
  
  .tag-value {
    font-weight: bold;
  }
  
  .estado-activa {
    color: #28a745;
  }
  
  .estado-pausada {
    color: #ffc107;
  }
  
  .estado-finalizada, .estado-cancelada {
    color: #dc3545;
  }
  
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xlarge);
    text-align: center;
    min-height: 60vh;
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
  
  .error-icon {
    font-size: 3rem;
    color: #dc3545;
    margin-bottom: var(--spacing-small);
  }
  
  .error-container h2 {
    color: #dc3545;
    margin-bottom: var(--spacing-small);
  }
  
  .panel-container {
    display: flex;
    min-height: calc(100vh - 70px);
  }
  
  .panel-nav {
    width: 240px;
    background-color: #fff;
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    padding: var(--spacing-medium) 0;
  }
  
  .nav-button {
    display: flex;
    align-items: center;
    padding: var(--spacing-small) var(--spacing-medium);
    border: none;
    background: transparent;
    font-size: var(--font-size-base);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s;
    color: var(--text-color);
  }
  
  .nav-button.active {
    background-color: #f0f7f0;
    color: var(--primary-color);
    font-weight: bold;
    border-left: 3px solid var(--primary-color);
  }
  
  .nav-icon {
    margin-right: var(--spacing-small);
    font-size: 1.2rem;
  }
  
  .panel-content {
    flex: 1;
    padding: var(--spacing-large);
    overflow-y: auto;
  }
  
  .tab-content h2 {
    color: var(--text-color-dark);
    margin-bottom: var(--spacing-large);
  }
  
  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-large);
  }
  
  .action-button {
    display: inline-block;
    padding: var(--spacing-small) var(--spacing-medium);
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-small);
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: var(--font-size-base);
    text-decoration: none;
  }
  
  .action-button:hover {
    background-color: var(--button-bg-hover);
  }
  
  .placeholder-message {
    text-align: center;
    color: var(--text-color);
    background-color: #fff;
    padding: var(--spacing-large);
    border-radius: var(--border-radius);
    border: 1px dashed var(--border-color);
  }
  
  .dashboard-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-medium);
    margin-bottom: var(--spacing-large);
  }
  
  .dashboard-card {
    background-color: #fff;
    border-radius: var(--border-radius);
    padding: var(--spacing-medium);
    display: flex;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .card-icon {
    font-size: 2rem;
    margin-right: var(--spacing-medium);
    color: var(--primary-color);
  }
  
  .card-content h3 {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--text-color);
  }
  
  .card-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: var(--text-color-dark);
  }
  
  .activity-details {
    background-color: #fff;
    border-radius: var(--border-radius);
    padding: var(--spacing-large);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .activity-details h3 {
    margin-top: 0;
    margin-bottom: var(--spacing-medium);
    color: var(--text-color-dark);
  }
  
  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-medium);
    margin-bottom: var(--spacing-large);
  }
  
  .detail-item {
    padding: var(--spacing-small);
    border-bottom: 1px solid var(--border-color);
  }
  
  .detail-label {
    font-size: 0.9rem;
    color: var(--text-color);
    margin-bottom: 4px;
  }
  
  .detail-value {
    font-weight: 500;
    color: var(--text-color-dark);
  }
  
  .qr-section {
    text-align: center;
    margin-top: var(--spacing-large);
    padding-top: var(--spacing-medium);
    border-top: 1px solid var(--border-color);
  }
  
  .qr-section h4 {
    margin-bottom: var(--spacing-medium);
    color: var(--text-color-dark);
  }
  
  .qr-container {
    display: inline-block;
  }
  
  .qr-image {
    max-width: 200px;
    border: 1px solid var(--border-color);
    padding: var(--spacing-small);
    background-color: #fff;
    margin-bottom: var(--spacing-small);
  }
  
  .download-button {
    background-color: #f0f0f0;
    border: 1px solid var(--border-color);
    padding: var(--spacing-small) var(--spacing-medium);
    border-radius: var(--border-radius-small);
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .download-button:hover {
    background-color: #e2e2e2;
  }
  
  @media (max-width: 768px) {
    .panel-container {
      flex-direction: column;
    }
    
    .panel-nav {
      width: 100%;
      flex-direction: row;
      overflow-x: auto;
      border-right: none;
      border-bottom: 1px solid var(--border-color);
    }
    
    .nav-button {
      padding: var(--spacing-small);
    }
    
    .nav-button.active {
      border-left: none;
      border-bottom: 3px solid var(--primary-color);
    }
    
    .dashboard-cards {
      grid-template-columns: 1fr;
    }
  }


  /* Estilos para la sección de productos */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
  background-color: #fff;
  padding: var(--spacing-medium);
  border-radius: var(--border-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.search-box input {
  width: 100%;
  padding: var(--spacing-small);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-base);
}

.filter-options {
  display: flex;
  gap: var(--spacing-small);
  flex-wrap: wrap;
}

.filter-options select {
  padding: var(--spacing-small);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  background-color: #fff;
  min-width: 150px;
}

.centered-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xlarge);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xlarge);
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-medium);
  color: var(--text-color-light);
}

.empty-state h3 {
  margin-bottom: var(--spacing-small);
  color: var(--text-color-dark);
}

.empty-state p {
  margin-bottom: var(--spacing-medium);
  color: var(--text-color);
}

.text-button {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: inherit;
  padding: 0;
  text-decoration: underline;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-medium);
}

.producto-card {
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.producto-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.producto-disponibilidad {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #28a745;
  color: white;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 0.8rem;
  z-index: 1;
}

.producto-disponibilidad.no-disponible {
  background-color: #dc3545;
}

.producto-imagen-container {
  height: 180px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}

.producto-imagen {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producto-imagen-placeholder {
  font-size: 4rem;
  color: var(--text-color-light);
}

.producto-info {
  padding: var(--spacing-medium);
}

.producto-nombre {
  margin: 0 0 var(--spacing-small);
  font-size: 1.2rem;
  color: var(--text-color-dark);
}

.producto-tipo {
  display: inline-block;
  background-color: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-bottom: var(--spacing-small);
  color: var(--text-color);
}

.producto-descripcion {
  margin-bottom: var(--spacing-small);
  color: var(--text-color);
  font-size: 0.9rem;
  min-height: 40px;
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.producto-precio {
  font-weight: bold;
  color: var(--primary-color);
  font-size: 1.2rem;
}

.producto-acciones {
  padding: var(--spacing-small);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-small);
}

.icon-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.icon-button:hover {
  background-color: #f0f0f0;
}

.icon-button.delete:hover {
  background-color: #ffebee;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: #fff;
  border-radius: var(--border-radius);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-medium);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color-dark);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-color);
}

.producto-form {
  padding: var(--spacing-medium);
}

.input-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.prefix {
  position: absolute;
  left: 10px;
  color: var(--text-color);
}

.input-prefix input {
  padding-left: 25px;
}

.imagen-upload-container {
  margin-top: var(--spacing-small);
}

.imagen-preview {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.imagen-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
}

.remove-image-button {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background-color: #dc3545;
  color: white;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-placeholder {
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-small);
  padding: var(--spacing-medium);
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upload-placeholder:hover {
  background-color: #f0f0f0;
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-small);
  color: var(--text-color-light);
}

.error-global {
  background-color: #f8d7da;
  color: #721c24;
  padding: var(--spacing-small);
  border-radius: var(--border-radius-small);
  margin-bottom: var(--spacing-medium);
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

/* Modal de confirmación */
.confirmation-modal {
  max-width: 400px;
}

.confirmation-content {
  padding: var(--spacing-medium);
  text-align: center;
}

.warning-icon {
  font-size: 3rem;
  color: #ffc107;
  margin-bottom: var(--spacing-small);
}

.confirmation-actions {
  display: flex;
  gap: var(--spacing-small);
  padding: var(--spacing-medium);
  border-top: 1px solid var(--border-color);
  justify-content: center;
}

.action-button.danger {
  background-color: #dc3545;
}

.action-button.danger:hover {
  background-color: #c82333;
}

/* Notificaciones */
.notificacion {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1001;
  padding: var(--spacing-small) var(--spacing-medium);
  border-radius: var(--border-radius-small);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.notificacion.exito {
  background-color: #d4edda;
  color: #155724;
}

.notificacion.error {
  background-color: #f8d7da;
  color: #721c24;
}

.notificacion-contenido {
  display: flex;
  align-items: center;
  gap: var(--spacing-small);
}

.notificacion-icono {
  font-size: 1.2rem;
}

.button-icon {
  margin-right: 5px;
}

@media (max-width: 768px) {
  .productos-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-options {
    width: 100%;
  }
  
  .filter-options select {
    flex: 1;
  }
}
  </style>