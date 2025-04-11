<template>
  <div class="help-page">
    <!-- Cabecera -->
    <div class="help-header">
      <button @click="goBack" class="back-button">
        <span class="back-icon">←</span> Volver
      </button>
      <h1>Centro de Ayuda</h1>
    </div>

    <div class="help-content">
      <div class="help-section">
        <h2>Preguntas Frecuentes</h2>
        
        <div class="accordion">
          <div 
            v-for="(faq, index) in faqs" 
            :key="index"
            class="accordion-item"
          >
            <div 
              class="accordion-header" 
              @click="toggleFaq(index)"
              :class="{ 'active': openFaq === index }"
            >
              <h3>{{ faq.question }}</h3>
              <span class="accordion-icon">{{ openFaq === index ? '−' : '+' }}</span>
            </div>
            <div 
              class="accordion-content" 
              :class="{ 'open': openFaq === index }"
            >
              <div v-html="faq.answer"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h2>Guías Rápidas</h2>
        
        <div class="guides-grid">
          <div v-for="(guide, index) in guides" :key="index" class="guide-card">
            <div class="guide-icon">{{ guide.icon }}</div>
            <h3>{{ guide.title }}</h3>
            <p>{{ guide.description }}</p>
            <button @click="showGuide(guide)" class="text-button primary">Ver guía</button>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h2>Contacto y Soporte</h2>
        
        <div class="contact-box">
          <p>Si tienes alguna duda o problema que no se resuelve con la información aquí proporcionada, puedes contactarnos a través de los siguientes canales:</p>
          
          <div class="contact-methods">
            <div class="contact-method">
              <div class="contact-icon">✉️</div>
              <div class="contact-info">
                <h4>Correo electrónico</h4>
                <p>soporte@actividapp.com</p>
              </div>
            </div>
            
            <div class="contact-method">
              <div class="contact-icon">📱</div>
              <div class="contact-info">
                <h4>WhatsApp</h4>
                <p>+57 300 123 4567</p>
              </div>
            </div>
            
            <div class="contact-method">
              <div class="contact-icon">🕒</div>
              <div class="contact-info">
                <h4>Horario de atención</h4>
                <p>Lunes a viernes: 8:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal para mostrar guías -->
      <div v-if="showGuideModal" class="guide-modal-overlay" @click="closeGuideModal"></div>
      <div v-if="showGuideModal" class="guide-modal">
        <div class="guide-modal-header">
          <h3>{{ currentGuide.title }}</h3>
          <button @click="closeGuideModal" class="close-button">×</button>
        </div>
        <div class="guide-modal-content">
          <div v-html="currentGuide.content"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Estado para los acordeones de FAQ
const openFaq = ref(null)

// Estado para el modal de guías
const showGuideModal = ref(false)
const currentGuide = ref({})

// Lista de preguntas frecuentes
const faqs = [
  {
    question: '¿Cómo creo una nueva actividad?',
    answer: '<p>Para crear una nueva actividad, sigue estos pasos:</p><ol><li>En la página principal, haz clic en el botón de "Nueva Actividad"</li><li>Completa el formulario con los detalles de tu actividad</li><li>Haz clic en "Crear" para generar tu actividad</li></ol>'
  },
  {
    question: '¿Cómo puedo gestionar mis actividades?',
    answer: '<p>Para gestionar tus actividades:</p><ol><li>Accede a la página principal donde se muestran tus actividades</li><li>Selecciona la actividad que deseas administrar</li><li>Utiliza el panel de control para ver estadísticas, modificar detalles o gestionar ventas</li></ol>'
  }
]

// Lista de guías rápidas
const guides = [
  {
    icon: '🚀',
    title: 'Primeros pasos',
    description: 'Guía básica para comenzar a usar ActividApp',
    content: `
      <div class="guide-full-content">
        <h4>Bienvenido a ActividApp</h4>
        <p>Esta guía rápida te ayudará a comenzar a utilizar nuestra plataforma para gestionar eventos y actividades.</p>
        
        <h5>1. Crear tu actividad</h5>
        <p>Desde la página principal, selecciona "Nueva Actividad" y completa la información básica como nombre, fecha y descripción.</p>
        
        <h5>2. Configurar los detalles</h5>
        <p>Añade precios, información adicional, y personaliza las opciones disponibles para tus clientes.</p>
        
        <h5>3. Personalizar la apariencia</h5>
        <p>Sube imágenes atractivas y selecciona los colores que representan tu marca o evento.</p>
        
        <h5>4. Comparte el enlace</h5>
        <p>Una vez configurada, comparte el enlace único de tu actividad a través de redes sociales, email o mensajería.</p>
        
        <h5>5. ¡Listo para vender!</h5>
        <p>Tu actividad ya está lista para recibir pedidos. Comparte el enlace con tus clientes y comienza a recibir ventas.</p>
      </div>
    `
  },
  {
    icon: '📊',
    title: 'Gestión de ventas',
    description: 'Aprende a administrar tus ventas de manera eficiente',
    content: `
      <div class="guide-full-content">
        <h4>Gestión de Ventas en ActividApp</h4>
        <p>Optimiza el proceso de ventas y mantén un control efectivo de tus ingresos.</p>
        
        <h5>1. Panel de Ventas</h5>
        <p>Accede al panel de ventas desde tu actividad para ver todas las transacciones en tiempo real.</p>
        
        <h5>2. Estados de Pedidos</h5>
        <p>Cada pedido puede tener diferentes estados: Pendiente, En Preparación, Listo para Entrega y Entregado. Actualiza estos estados según avanza el proceso.</p>
        
        <h5>3. Notificaciones</h5>
        <p>Configura notificaciones para recibir alertas instantáneas de nuevos pedidos o actualizaciones.</p>
        
        <h5>4. Reportes</h5>
        <p>Genera reportes detallados por día, semana o mes para analizar tu rendimiento y tomar decisiones informadas.</p>
        
        <h5>5. Exportación de Datos</h5>
        <p>Exporta tus datos de ventas en formato CSV o Excel para utilizarlos en otras herramientas o para tu contabilidad.</p>
      </div>
    `
  },
  {
    icon: '👥',
    title: 'Colaboradores',
    description: 'Cómo administrar tu equipo de trabajo',
    content: `
      <div class="guide-full-content">
        <h4>Gestión de Colaboradores</h4>
        <p>ActividApp te permite trabajar en equipo para gestionar tus actividades de manera más eficiente.</p>
        
        <h5>1. Añadir Colaboradores</h5>
        <p>Desde tu panel de actividad, accede a la sección "Colaboradores" y utiliza la opción para crear un nuevo colaborador.</p>
        
        <h5>2. Compartir QR</h5>
        <p>Utiliza la función "Compartir QR" para dar acceso rápido a tus colaboradores a la información de pedidos.</p>
        
        <h5>3. Asignación de Responsabilidades</h5>
        <p>Define qué tareas puede realizar cada colaborador en tu actividad para mantener el control.</p>
        
        <h5>4. Monitoreo en Tiempo Real</h5>
        <p>Supervisa las acciones de tus colaboradores y el estado de los pedidos que gestionan en tiempo real.</p>
        
        <h5>5. Gestión del Equipo</h5>
        <p>Revisa estadísticas individuales para evaluar el rendimiento de cada colaborador y mejorar la productividad del equipo.</p>
      </div>
    `
  },
  {
    icon: '📱',
    title: 'Uso en móviles',
    description: 'Saca el máximo provecho en dispositivos móviles',
    content: `
      <div class="guide-full-content">
        <h4>ActividApp en Dispositivos Móviles</h4>
        <p>Nuestra aplicación está optimizada para dispositivos móviles, permitiendo gestionar tus actividades desde cualquier lugar.</p>
        
        <h5>1. Diseño Responsivo</h5>
        <p>La interfaz se adapta a diferentes tamaños de pantalla para una experiencia óptima en cualquier dispositivo.</p>
        
        <h5>2. Escaneo de QR</h5>
        <p>Utiliza la cámara de tu dispositivo para escanear códigos QR de pedidos rápidamente.</p>
        
        <h5>3. Notificaciones Móviles</h5>
        <p>Recibe alertas sobre nuevos pedidos y actualizaciones directamente en tu dispositivo.</p>
        
        <h5>4. Modo Fuera de Línea</h5>
        <p>Accede a información básica incluso cuando no tienes conexión a internet, sincronizándose cuando vuelvas a estar en línea.</p>
        
        <h5>5. Optimización de Batería</h5>
        <p>La aplicación está diseñada para minimizar el consumo de batería durante el uso prolongado en eventos.</p>
      </div>
    `
  }
]

// Funciones
const toggleFaq = (index) => {
  openFaq.value = openFaq.value === index ? null : index
}

const showGuide = (guide) => {
  currentGuide.value = guide
  showGuideModal.value = true
}

const closeGuideModal = () => {
  showGuideModal.value = false
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.help-page {
  min-height: 100vh;
  background-color: var(--background-color);
  padding-bottom: var(--spacing-large);
}

.help-header {
  background-color: var(--primary-color);
  color: white;
  padding: var(--spacing-medium) var(--spacing-large);
  display: flex;
  align-items: center;
  position: relative;
}

.help-header h1 {
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

.help-content {
  padding: var(--spacing-large);
  max-width: 1000px;
  margin: 0 auto;
}

.help-section {
  margin-bottom: var(--spacing-xlarge);
}

.help-section h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-large);
  color: var(--primary-color);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: var(--spacing-small);
}

/* Acordeón de FAQs */
.accordion {
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--card-shadow);
}

.accordion-item {
  background-color: white;
  border-bottom: 1px solid var(--border-color);
}

.accordion-item:last-child {
  border-bottom: none;
}

.accordion-header {
  padding: var(--spacing-medium);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.accordion-header:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.accordion-header.active {
  background-color: rgba(var(--primary-color-rgb), 0.1);
}

.accordion-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.accordion-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.accordion-content.open {
  max-height: 1000px;
  padding: var(--spacing-medium);
  padding-top: 0;
}

.accordion-content div {
  color: var(--text-color);
}

/* Guías Rápidas */
.guides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-medium);
}

.guide-card {
  background-color: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.guide-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-small);
}

.guide-card h3 {
  margin: var(--spacing-small) 0;
  color: var(--text-color-dark);
}

.guide-card p {
  color: var(--text-color);
  margin-bottom: var(--spacing-medium);
  flex-grow: 1;
}

.text-button {
  background: transparent;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 1rem;
  padding: var(--spacing-small);
  transition: color 0.2s;
}

.text-button:hover {
  color: var(--button-bg-hover);
}

/* Contacto y Soporte */
.contact-box {
  background-color: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  box-shadow: var(--card-shadow);
}

.contact-methods {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-medium);
  margin-top: var(--spacing-medium);
}

.contact-method {
  display: flex;
  align-items: center;
  padding: var(--spacing-medium);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.contact-icon {
  font-size: 1.8rem;
  margin-right: var(--spacing-medium);
}

.contact-info h4 {
  margin: 0;
  margin-bottom: var(--spacing-xsmall);
  color: var(--text-color-dark);
}

.contact-info p {
  margin: 0;
  color: var(--text-color);
}

/* Modal de Guías */
.guide-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.guide-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: var(--border-radius);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.guide-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-medium);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
}

.guide-modal-header h3 {
  margin: 0;
  color: var(--primary-color);
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--text-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
}

.guide-modal-content {
  padding: var(--spacing-medium);
}

.guide-full-content h4 {
  color: var(--primary-color);
  margin-top: 0;
  font-size: 1.3rem;
}

.guide-full-content h5 {
  color: var(--text-color-dark);
  margin-top: var(--spacing-medium);
  margin-bottom: var(--spacing-small);
}

.guide-full-content p {
  margin-top: 0;
  color: var(--text-color);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .help-content {
    padding: var(--spacing-medium);
  }
  
  .contact-methods {
    grid-template-columns: 1fr;
  }
  
  .accordion-header h3 {
    font-size: 1rem;
  }
  
  .guide-modal {
    width: 95%;
  }
}
</style>
