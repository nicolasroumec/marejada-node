// #region Constants and Utilities
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast');
    const toast = new bootstrap.Toast(toastEl, {
        delay: 3000
    });
    
    toastEl.querySelector('.toast-body').textContent = message;
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning');
    
    switch(type) {
        case 'success':
            toastEl.classList.add('bg-success');
            break;
        case 'error':
            toastEl.classList.add('bg-danger');
            break;
        case 'warning':
            toastEl.classList.add('bg-warning');
            break;
    }
    
    toast.show();
}
// #endregion

// #region Error Handling
const ErrorTypes = {
    AUTH: 'auth',
    NETWORK: 'network',
    VALIDATION: 'validation',
    SERVER: 'server'
};

function handleError(error) {
    console.error('Error:', error);
    
    if (error.status === 401) {
        clearAuth();
        handleNotAuthenticated();
        showToast('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
        return;
    }
    
    if (!navigator.onLine) {
        showToast('Error de conexión. Por favor, verifica tu internet.', 'error');
        return;
    }
    
    showToast(error.message || 'Ha ocurrido un error. Por favor, intenta nuevamente.', 'error');
}

// #endregion

// #region Notifications
const NotificationService = {
    async sendEmailNotification(userId, eventData) {
        try {
            await ApiClient.request('/notifications/email', {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    eventData,
                    type: 'inscription'
                })
            });
        } catch (error) {
            console.error('Error sending email notification:', error);
            // No mostramos el error al usuario ya que es una funcionalidad secundaria
        }
    }
};

// #endregion

// #region Export Service
const ExportService = {
    async exportInscriptions(format = 'pdf') {
        try {
            const response = await ApiClient.request('/inscriptions/export', {
                method: 'POST',
                body: JSON.stringify({ format })
            });
            
            // Crear un link temporal para la descarga
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inscripciones_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Enviar por email
            await NotificationService.sendEmailNotification(getUserData().id, {
                type: 'export',
                format
            });

            showToast('Inscripciones exportadas exitosamente', 'success');
        } catch (error) {
            handleError(error);
        }
    }
};


// #endregion

// #region Authentication and User Management
const setAuthToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
const setUserData = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
const getUserData = () => {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
};
const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

const checkAuth = () => {
    const token = getAuthToken();
    if (!token) {
        handleNotAuthenticated();
        return false;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            clearAuth();
            handleNotAuthenticated();
            showToast('Tu sesión ha expirado', 'warning');
            return false;
        }
        handleAuthenticated();
        return true;
    } catch (error) {
        console.error('Error al verificar token:', error);
        clearAuth();
        handleNotAuthenticated();
        return false;
    }
};

function handleAuthenticated() {
    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = 'block';
    });
    document.querySelectorAll('.no-auth-only').forEach(el => {
        el.style.display = 'none';
    });
    
    const userData = getUserData();
    if (userData) {
        const userFullNameEl = document.getElementById('userFullName');
        if (userFullNameEl) {
            userFullNameEl.textContent = `${userData.first_name} ${userData.last_name}`;
        }
    }
}

function handleNotAuthenticated() {
    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.no-auth-only').forEach(el => {
        el.style.display = 'block';
    });
}
// #endregion

// #region API Calls

/**
 * Obtiene los schedules desde el servidor
 * @returns {Promise<Array>} Array de schedules
 */
async function fetchSchedules() {
    try {
        const data = await ApiClient.request('/schedules/schedule-cards');
        return data;
    } catch (error) {
        console.error('Error al obtener schedules:', error);
        showToast('Error al cargar los eventos', 'error');
        return [];
    }
}


/**
 * Actualiza la capacidad de un evento específico
 * @param {string} scheduleId - ID del schedule
 */
async function updateEventCapacity(scheduleId) {
    try {
        const data = await ApiClient.request(`/inscriptions/available-spots/${scheduleId}`);
        const card = document.querySelector(`[data-schedule-id="${scheduleId}"]`);
        if (card) {
            const spotsElement = card.querySelector('.available-spots');
            if (spotsElement) {
                spotsElement.textContent = `Cupos disponibles: ${data.availableSpots}`;
            }
        }
    } catch (error) {
        console.error('Error al actualizar cupos:', error);
        // No mostrar toast ya que es una actualización secundaria
    }
}
/**
 * Muestra un modal cuando el usuario no tiene inscripciones
 */
function showNoInscriptionsModal() {
    const modalHTML = `
        <div class="modal fade" id="noInscriptionsModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header">
                        <h5 class="modal-title">Inscripciones</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="mb-3">
                            <i class="fas fa-calendar-times fa-3x text-danger mb-3"></i>
                        </div>
                        <h5>No tienes inscripciones activas</h5>
                        <p class="text-muted">Explora los eventos disponibles y inscríbete en los que te interesen.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('noInscriptionsModal'));
    
    const modalElement = document.getElementById('noInscriptionsModal');
    modalElement.addEventListener('hidden.bs.modal', function () {
        this.remove();
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
    });

    modal.show();
}

/**
 * Crea el HTML para el modal de inscripciones
 * @param {Array} inscriptions - Array de inscripciones
 * @returns {string} HTML del modal
 */
function createInscriptionsModalHTML(inscriptions) {
    return `
        <div class="modal fade" id="inscriptionsModal" tabindex="-1" aria-labelledby="inscriptionsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header">
                        <h5 class="modal-title" id="inscriptionsModalLabel">
                            Mis Inscripciones
                            <span class="badge bg-danger ms-2">${inscriptions.length}</span>
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            ${inscriptions.map(inscription => `
                                <div class="col-12 mb-3">
                                    <div class="card bg-secondary">
                                        <div class="card-body">
                                            <h5 class="card-title text-danger">${inscription.event_name}</h5>
                                            <div class="card-text">
                                                <div class="mb-2">
                                                    <small>
                                                        <strong>Hora:</strong> ${inscription.event_time || 'No disponible'}<br>
                                                        <strong>Ubicación:</strong> ${inscription.location}<br>
                                                        <strong>Tipo:</strong> ${inscription.type}
                                                    </small>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onclick="cancelInscription('${inscription.schedule_id}')" 
                                                    class="btn btn-danger btn-sm w-100">
                                                    Cancelar Inscripción
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
// #endregion

// #region API Client

/** Beneficios principales del ApiClient:

Centralización:

    Todas las llamadas a la API pasan por un único punto
    Facilita el mantenimiento y los cambios globales
    Permite cambiar fácilmente la URL base de la API


 Manejo automático de autenticación:

    Añade automáticamente el token de autenticación
    No hay que recordar incluir los headers de autorización en cada llamada


 Manejo de errores estandarizado:

    Todos los errores se manejan de forma consistente
    Facilita el logging y el debugging
    Maneja automáticamente errores de autenticación


Configuración por defecto:

    Headers comunes como 'Content-Type'
    Formato de respuesta estándar
    Transformación automática de JSON


 Simplificación del código:
        javascriptCopy// Sin ApiClient
        const response = await fetch('/api/schedules', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        if (!response.ok) {
        handleError(await response.json());
        }
        return await response.json();

    Con ApiClient
        
        const data = await ApiClient.request('/schedules');

Facilita el testing y los mocks:

    Un único punto para interceptar llamadas en tests
    Facilita la implementación de mocks para desarrollo


 */

    
const ApiClient = {
    baseUrl: '/api',
    
    async request(endpoint, options = {}) {
        const token = getAuthToken();
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };
        
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw { 
                    ...data, 
                    status: response.status,
                    statusText: response.statusText
                };
            }
            
            return data;
        } catch (error) {
            // No manejar el error aquí para permitir manejo específico en cada caso
            throw error;
        }
    }
};

// Función para actualizar la UI después de una inscripción
async function updateUIAfterInscription(scheduleId) {
    try {
        const card = document.querySelector(`[data-schedule-id="${scheduleId}"]`);
        if (!card) return;

        // Actualizar cupos disponibles
        const availableSpots = await fetchAvailableSpots(scheduleId);
        if (typeof availableSpots === 'number') {
            const spotsElement = card.querySelector('.available-spots span');
            if (spotsElement) {
                const isAvailable = availableSpots > 0;
                spotsElement.className = `badge bg-${isAvailable ? 'success' : 'danger'}`;
                spotsElement.textContent = `${availableSpots} cupos`;
            }
        }
    } catch (error) {
        console.error('Error al actualizar UI:', error);
        // No mostrar toast aquí ya que es una actualización visual secundaria
    }
}


// #endregion

// #region Events and Event Handlers
function initializeEventListeners() {
    // Login button
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
        });
    }

    // Register button
    const registerBtn = document.getElementById("registerBtn");
    if (registerBtn) {
        registerBtn.addEventListener("click", () => {
            const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
            registerModal.show();
        });
    }

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            clearAuth();
            handleNotAuthenticated();
            showToast('Sesión cerrada exitosamente', 'success');
        });
    }

    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    setAuthToken(data.token);
                    setUserData(data.user);
                    handleAuthenticated();
                    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    if (loginModal) {
                        loginModal.hide();
                    }
                    showToast('Inicio de sesión exitoso', 'success');
                } else {
                    showToast(data.message || 'Error en el inicio de sesión', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error al intentar iniciar sesión', 'error');
            }
        });
    }

    // Register form
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const formData = {
                first_name: document.getElementById("firstName").value,
                last_name: document.getElementById("lastName").value,
                email: document.getElementById("email").value,
                password: document.getElementById("password").value,
                confirmPassword: document.getElementById("confirmPassword").value,
                school: document.getElementById("school").value,
                year: document.getElementById("year").value,
                course: document.getElementById("course").value
            };

            if (formData.password !== formData.confirmPassword) {
                showToast('Las contraseñas no coinciden', 'error');
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                const data = await response.json();

                if (response.ok) {
                    setAuthToken(data.token);
                    setUserData(data.user);
                    handleAuthenticated();
                    const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                    if (registerModal) {
                        registerModal.hide();
                    }
                    showToast('Registro exitoso', 'success');
                } else {
                    showToast(data.message || 'Error en el registro', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error al intentar registrarse', 'error');
            }
        });
    }

    // Filters
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            filters.eventType = e.target.value;
            loadSchedules();
        });
    }

    const capacityFilter = document.getElementById('capacityFilter');
    if (capacityFilter) {
        capacityFilter.addEventListener('change', (e) => {
            filters.capacity = e.target.value;
            loadSchedules();
        });
    }
}

// #endregion

// #region Cards and Display
/**
 * Crea una card de evento
 * @param {Object} schedule - Datos del schedule
 * @returns {string} HTML de la card
 */

// Modificar la función createEventCard para mostrar el estado correcto inicial ypara usar availableSpots
function createEventCard(schedule) {
    const availableSpots = schedule.availableSpots ?? 
        (schedule.capacity - (schedule.currentInscriptions || 0));
    const isAvailable = availableSpots > 0;
    const isInscribed = schedule.userInscribed;
    
    let buttonClass = isInscribed ? 'btn-success' : (isAvailable ? 'btn-danger' : 'btn-secondary');
    let buttonText = isInscribed ? '<i class="fas fa-check me-2"></i>INSCRIPTO' : 
                    (isAvailable ? 'INSCRIBIRSE' : 'AGOTADO');
    let buttonDisabled = isInscribed || !isAvailable;

    return `
        <div class="col-12 col-md-6 col-lg-4 mb-4" data-schedule-id="${schedule.scheduleId}">
            <div class="card bg-dark text-white h-100 border-secondary hover-border-danger">
                <!-- Contenedor de imagen responsive -->
                <div class="position-relative card-img-container">
                    <img 
                        src="${schedule.event.photo || 'https://via.placeholder.com/400x300'}"
                        class="card-img-top"
                        alt="${schedule.event.name}"
                        loading="lazy"
                        style="height: 200px; object-fit: cover;"
                    >
                    <div class="position-absolute top-0 end-0 p-2">
                        <span class="badge bg-danger">${schedule.event.type}</span>
                    </div>
                </div>
                
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-danger text-truncate" title="${schedule.event.name}">
                        ${schedule.event.name}
                    </h5>
                    
                    <div class="flex-grow-1">
                        <p class="card-text small mb-2">${schedule.event.description}</p>
                        
                        <div class="event-details small">
                            <div class="d-flex justify-content-between mb-1">
                                <span><i class="fas fa-user me-2"></i>${schedule.event.author}</span>
                                <span><i class="fas fa-clock me-2"></i>${schedule.event.duration}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span><i class="fas fa-map-marker-alt me-2"></i>${schedule.event.location}</span>
                                <span class="available-spots">
                                    <span class="badge bg-${isAvailable ? 'success' : 'danger'}">
                                        ${availableSpots} cupos
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onclick="handleInscription('${schedule.scheduleId}')"
                        class="btn w-100 ${buttonClass} mt-auto"
                        ${buttonDisabled ? 'disabled' : ''}
                    >
                        ${buttonText}
                    </button>
                </div>
            </div>
        </div>
    `;
}


/**
 * Agrupa los schedules por horario
 * @param {Array} schedules - Array de schedules
 * @returns {Object} Schedules agrupados por horario
 */
function groupSchedulesByTime(schedules) {
    const sortedSchedules = schedules.sort((a, b) => {
        return new Date('1970/01/01 ' + a.startTime) - new Date('1970/01/01 ' + b.startTime);
    });

    const groupedSchedules = {};
    sortedSchedules.forEach(schedule => {
        const time = schedule.startTime.slice(0, 5); // Obtener HH:mm
        if (!groupedSchedules[time]) {
            groupedSchedules[time] = [];
        }
        groupedSchedules[time].push(schedule);
    });

    return groupedSchedules;
}
// #endregion

// #region Inscriptions Management
/**
 * Maneja el proceso de inscripción a un evento
 * @param {string} scheduleId - ID del schedule
 */
// Modificar handleInscription para actualizar los cupos inmediatamente
// Modificar la función handleInscription
// Modificar la función handleInscription
async function handleInscription(scheduleId) {
    // Obtener el botón antes de cualquier operación
    const buttonElement = document.querySelector(`[data-schedule-id="${scheduleId}"] button`);
    if (!buttonElement) {
        console.error('Botón no encontrado');
        return;
    }

    // Guardar el estado original del botón
    const originalText = buttonElement.innerHTML;
    const originalDisabled = buttonElement.disabled;

    try {
        const token = getAuthToken();
        if (!token) {
            showToast('Debe iniciar sesión para inscribirse', 'warning');
            return;
        }

        // Función para actualizar el estado del botón
        const updateButtonState = (isProcessing) => {
            buttonElement.disabled = isProcessing;
            buttonElement.innerHTML = isProcessing ? 
                '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...' : 
                originalText;
        };

        // Iniciar procesamiento
        updateButtonState(true);

        // Verificar cupos disponibles
        const availableSpots = await fetchAvailableSpots(scheduleId);
        if (availableSpots === null || availableSpots <= 0) {
            showToast('No hay cupos disponibles', 'warning');
            updateButtonState(false);
            return;
        }

        // Intentar realizar la inscripción
        const response = await ApiClient.request('/inscriptions', {
            method: 'POST',
            body: JSON.stringify({ scheduleId })
        }).catch(error => {
            // Manejar errores específicos
            if (error.status === 400 && error.message.includes('horario')) {
                showToast('Ya estás inscrito en otro evento en este horario', 'warning');
                throw error;
            }
            throw error;
        });

        // Si la inscripción fue exitosa
        try {
            // Enviar notificación por email (no bloquear la UI por esto)
            const userData = getUserData();
            NotificationService.sendEmailNotification(userData.id, {
                type: 'new_inscription',
                scheduleId,
                eventName: response.eventName
            }).catch(error => {
                console.error('Error al enviar notificación:', error);
                // No mostrar error al usuario ya que es secundario
            });
        } catch (error) {
            console.error('Error en notificación:', error);
            // No afectar el flujo principal
        }

        // Actualizar UI para mostrar éxito
        showToast('Inscripción exitosa', 'success');
        
        // Actualizar la UI del botón y la card
        buttonElement.className = 'btn w-100 btn-success mt-auto';
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="fas fa-check me-2"></i>INSCRIPTO';

        // Actualizar los cupos disponibles
        await updateUIAfterInscription(scheduleId);
        
    } catch (error) {
        // Restaurar el botón a su estado original en caso de error
        buttonElement.disabled = originalDisabled;
        buttonElement.innerHTML = originalText;
        
        // Manejar el error
        handleError(error);
    }
}

// Función auxiliar para verificar si el usuario está inscrito en un evento
async function checkUserInscription(scheduleId) {
    try {
        const data = await ApiClient.request(`/inscriptions/check/${scheduleId}`);
        return data.isInscribed;
    } catch (error) {
        console.error('Error al verificar inscripción:', error);
        return false;
    }
}

/**
 * Muestra las inscripciones del usuario
 */
async function showUserInscriptions() {
    try {
        const token = getAuthToken();
        if (!token) {
            showToast('Debe iniciar sesión para ver sus inscripciones', 'warning');
            return;
        }

        let existingModal = document.getElementById('inscriptionsModal');
        if (existingModal) existingModal.remove();
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) existingBackdrop.remove();

        const data = await ApiClient.request('/inscriptions/user');
        
        if (!data.inscriptions || data.inscriptions.length === 0) {
            showNoInscriptionsModal();
            return;
        }

        const sortedInscriptions = [...data.inscriptions].sort((a, b) => {
            return new Date('1970/01/01 ' + (a.event_time || '00:00')) - 
                   new Date('1970/01/01 ' + (b.event_time || '00:00'));
        });

        const modalHTML = createInscriptionsModalHTML(sortedInscriptions);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modalElement = document.getElementById('inscriptionsModal');
        const modal = new bootstrap.Modal(modalElement);
        
        modalElement.addEventListener('hidden.bs.modal', function () {
            this.remove();
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        });

        modal.show();
    } catch (error) {
        console.error('Error al obtener inscripciones:', error);
        showToast('Error al cargar las inscripciones', 'error');
    }
}

// Función para obtener todos los cupos disponibles actuales
async function fetchAllAvailableSpots() {
    try {
        const response = await fetch('/api/inscriptions/all-available-spots', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener cupos disponibles:', error);
        return null;
    }
}
// Función para obtener los cupos disponibles
async function fetchAvailableSpots(scheduleId) {
    try {
        const response = await fetch(`/api/inscriptions/available-spots/${scheduleId}`);
        if (!response.ok) {
            throw new Error('Error al obtener cupos disponibles');
        }
        const data = await response.json();
        return data.availableSpots;
    } catch (error) {
        console.error('Error al obtener cupos:', error);
        return null;
    }
}
/**
 * Cancela una inscripción
 * @param {string} scheduleId - ID del schedule
 */
// Modificar la función cancelInscription
async function cancelInscription(scheduleId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta inscripción?')) {
        return;
    }

    try {
        const token = getAuthToken();
        const response = await fetch(`/api/inscriptions/${scheduleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cancelar la inscripción');
        }

        showToast('Inscripción cancelada exitosamente', 'success');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('inscriptionsModal'));
        if (modal) modal.hide();
        
        // Actualizar la vista después de cancelar
        await loadSchedules();
        await showUserInscriptions();
        
    } catch (error) {
        console.error('Error al cancelar la inscripción:', error);
        showToast(error.message || 'Error al cancelar la inscripción', 'error');
    }
}

// #endregion

// #region Filters and Visualization
const filters = {
    searchTerm: ''
};

/**
 * Filtra los schedules según el término de búsqueda
 * @param {Array} schedules - Array de schedules
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Array} Schedules filtrados
 */
function filterSchedules(schedules, searchTerm) {
    if (!searchTerm) return schedules;
    
    return schedules.filter(schedule => 
        schedule.event.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
}

/**
 * Formatea la hora para mostrar AM/PM
 * @param {string} time - Hora en formato HH:mm
 * @returns {string} Hora formateada
 */
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
}

/**
 * Agrupa los schedules por horario de inicio
 * @param {Array} schedules - Array de schedules
 * @returns {Object} Schedules agrupados por horario
 */


/**
 * Crea el encabezado de tiempo con estilo de tarjeta
 * @param {string} time - Hora del grupo
 * @returns {string} HTML del encabezado
 */
function createTimeHeader(time) {
    return `
        <div class="card bg-primary text-white mb-4 w-auto d-inline-block">
            <div class="card-body py-2 px-4">
                <h3 class="card-title mb-0 text-center">
                    <i class="fas fa-clock me-2"></i>${formatTime(time)}
                </h3>
            </div>
        </div>
    `;
}

/**
 * Carga y muestra los schedules filtrados
 */

// Modificar la función loadSchedules
async function loadSchedules() {
    try {
        const schedules = await fetchSchedules();
        const schedulesWithSpots = await Promise.all(
            schedules.map(async schedule => {
                const availableSpots = await fetchAvailableSpots(schedule.scheduleId);
                return {
                    ...schedule,
                    availableSpots: availableSpots !== null ? availableSpots : 
                        (schedule.capacity - (schedule.currentInscriptions || 0))
                };
            })
        );
        
        const filteredSchedules = filterSchedules(schedulesWithSpots, filters.searchTerm);
        const groupedSchedules = groupSchedulesByTime(filteredSchedules);
        
        const eventsGrid = document.getElementById('eventsGrid');
        eventsGrid.innerHTML = '';

        if (Object.keys(groupedSchedules).length === 0) {
            eventsGrid.innerHTML = `
                <div class="col-12 text-center text-white">
                    <h4>No se encontraron eventos</h4>
                </div>
            `;
            return;
        }

        Object.entries(groupedSchedules).forEach(([time, schedules]) => {
            const timeSection = document.createElement('div');
            timeSection.className = 'col-12 mb-5';
            
            timeSection.innerHTML = `
                <div class="mb-4">
                    ${createTimeHeader(time)}
                </div>
                <div class="row g-4">
                    ${schedules.map(schedule => createEventCard(schedule)).join('')}
                </div>
            `;
            
            eventsGrid.appendChild(timeSection);
        });
    } catch (error) {
        console.error('Error al cargar schedules:', error);
        showToast('Error al cargar los eventos', 'error');
    }
}

// Inicializar event listeners para el filtro de búsqueda
function initializeFilterListeners() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    console.log('Inicializando listener de búsqueda'); // Debug

    // Búsqueda en tiempo real con debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            console.log('Valor de búsqueda:', e.target.value); // Debug
            filters.searchTerm = e.target.value.trim();
            loadSchedules();
        }, 300);
    });
}

// #endregion

// #region Initialization
// Definir los estilos CSS como una constante
const responsiveStyles = `
    <style>
        /* Mejoras responsive */
        @media (max-width: 768px) {
            .card-img-container {
                height: 150px;
            }
            
            .card-title {
                font-size: 1.1rem;
            }
            
            .event-details {
                font-size: 0.8rem;
            }
            
            .modal-dialog {
                margin: 0.5rem;
            }
        }
        
        /* Animaciones suaves */
        .card {
            transition: transform 0.2s ease-in-out;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        /* Loading placeholders */
        .loading-placeholder {
            background: linear-gradient(90deg, #2c2c2c 25%, #3c3c3c 50%, #2c2c2c 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    </style>
`;

// Función para inicializar los estilos
function initializeStyles() {
    // Verificar si los estilos ya están agregados para evitar duplicados
    if (!document.querySelector('#responsive-styles')) {
        const styleElement = document.createElement('div');
        styleElement.id = 'responsive-styles';
        styleElement.innerHTML = responsiveStyles;
        document.head.appendChild(styleElement);
    }
}

// Una única inicialización para todo
document.addEventListener('DOMContentLoaded', () => {
    // Agregar los estilos responsive
    initializeStyles();
    
    // Inicializar toasts
    document.querySelectorAll('.toast').forEach(toastEl => {
        new bootstrap.Toast(toastEl);
    });

    // Verificar autenticación
    checkAuth();

    // Inicializar event listeners
    initializeEventListeners();

    // Inicializar filtros
    initializeFilterListeners();

    // Cargar datos iniciales
    loadSchedules();
});
// #endregion