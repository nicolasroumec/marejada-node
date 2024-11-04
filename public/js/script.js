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
const handleError = (error) => {
    console.error('Error:', error);
    
    // Si es un error de autenticación, manejar específicamente
    if (error.message.includes('sesión')) {
        clearAuth();
        handleNotAuthenticated();
        showToast(error.message, 'warning');
        return;
    }
    
    // Si es un error de conexión, mostrar mensaje específico
    if (!navigator.onLine || error.message.includes('conexión')) {
        showToast('Error de conexión. Por favor, verifica tu internet.', 'error');
        return;
    }
    
    showToast(error.message || 'Ha ocurrido un error. Por favor, intenta nuevamente.', 'error');
};
// #endregion

// #region Notifications
const NotificationService = {
    async sendEmailNotification(userId, eventData) {
        // Si el servicio de notificaciones no está disponible, no intentar enviar
        if (!this.isServiceAvailable) {
            return;
        }

        try {
            const response = await fetch('/api/notifications/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({
                    userId,
                    eventData,
                    type: 'inscription'
                })
            });

            if (response.status === 404) {
                this.isServiceAvailable = false;
                console.warn('Servicio de notificaciones no disponible');
                return;
            }

            if (!response.ok) {
                throw new Error('Error al enviar notificación');
            }
        } catch (error) {
            console.warn('Error al enviar notificación:', error);
        }
    },
    
    isServiceAvailable: true // Flag para controlar disponibilidad del servicio
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
        // Actualizar nombre en desktop
        const userFullNameEl = document.getElementById('userFullName');
        if (userFullNameEl) {
            userFullNameEl.querySelector('span').textContent = 
                `${userData.first_name} ${userData.last_name}`;
        }
        
        // Actualizar nombre en móvil
        const userNameMobile = document.querySelector('.user-name-mobile');
        if (userNameMobile) {
            userNameMobile.textContent = userData.first_name;
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
        
        // Si el usuario está autenticado, verificar inscripciones
        const token = getAuthToken();
        if (token) {
            try {
                // Obtener las inscripciones del usuario
                const inscriptionsData = await ApiClient.request('/inscriptions/user');
                const userInscriptions = new Set(
                    inscriptionsData.inscriptions?.map(insc => insc.schedule_id) || []
                );
                
                // Marcar los eventos donde el usuario está inscrito
                return data.map(schedule => ({
                    ...schedule,
                    userInscribed: userInscriptions.has(schedule.scheduleId)
                }));
            } catch (error) {
                console.warn('Error al verificar inscripciones:', error);
                return data;
            }
        }
        
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
        try {
            const token = getAuthToken();
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            };
            
            // Mostrar spinner durante la petición
            const spinner = document.getElementById('loadingSpinner');
            if (spinner) spinner.classList.remove('d-none');
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            });
            
            const data = await response.json().catch(() => ({}));
            
            // Ocultar spinner después de la petición
            if (spinner) spinner.classList.add('d-none');
            
            if (!response.ok) {
                // Manejar errores específicos
                switch (response.status) {
                    case 400:
                        throw new Error(data.message || 'Error en la solicitud. Por favor, verifica los datos.');
                    case 401:
                        clearAuth();
                        handleNotAuthenticated();
                        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                    case 404:
                        throw new Error(data.message || 'Recurso no encontrado.');
                    case 409:
                        throw new Error(data.message || 'Conflicto con la operación solicitada.');
                    default:
                        throw new Error(data.message || 'Error en el servidor. Por favor, intenta más tarde.');
                }
            }
            
            return data;
        } catch (error) {
            // Ocultar spinner en caso de error
            const spinner = document.getElementById('loadingSpinner');
            if (spinner) spinner.classList.add('d-none');
            
            // Manejar errores de red
            if (!navigator.onLine) {
                throw new Error('Error de conexión. Por favor, verifica tu internet.');
            }
            
            throw error;
        }
    }
};
// Mejorar el manejo de errores en ApiClient
const ErrorHandler = {
    isNetworkError(error) {
        return !navigator.onLine || error instanceof TypeError;
    },
    
    async handleApiError(error, response) {
        const errorData = await response.json().catch(() => ({}));
        
        switch (response.status) {
            case 400:
                if (errorData.code === 'SCHEDULE_CONFLICT') {
                    return new Error('Ya estás inscrito en otro evento en este horario');
                }
                return new Error(errorData.message || 'Error en la solicitud. Por favor, verifica los datos.');
            case 401:
                clearAuth();
                handleNotAuthenticated();
                return new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            case 403:
                return new Error('No tienes permiso para realizar esta acción');
            case 404:
                return new Error(errorData.message || 'Recurso no encontrado');
            case 409:
                return new Error(errorData.message || 'Conflicto con la operación solicitada');
            case 429:
                return new Error('Demasiadas solicitudes. Por favor, espera un momento');
            default:
                return new Error(errorData.message || 'Error en el servidor. Por favor, intenta más tarde');
        }
    }
};

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
    const isInscribed = schedule.userInscribed || false;
    
    // Determinar el estado del botón
    let buttonState = {
        class: 'btn-danger',
        text: 'INSCRIBIRSE',
        disabled: false
    };

    if (isInscribed) {
        buttonState = {
            class: 'btn-success',
            text: '<i class="fas fa-check me-2"></i>INSCRIPTO',
            disabled: true
        };
    } else if (!isAvailable) {
        buttonState = {
            class: 'btn-secondary',
            text: 'AGOTADO',
            disabled: true
        };
    }

    return `
        <div class="col-12 col-md-6 col-lg-4 mb-4" data-schedule-id="${schedule.scheduleId}">
            <div class="card bg-dark text-white h-100 border-secondary hover-border-danger">
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
                        class="btn w-100 ${buttonState.class} mt-auto"
                        ${buttonState.disabled ? 'disabled' : ''}
                    >
                        ${buttonState.text}
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
    const buttonElement = document.querySelector(`[data-schedule-id="${scheduleId}"] button`);
    if (!buttonElement) return;

    const originalState = {
        text: buttonElement.innerHTML,
        disabled: buttonElement.disabled,
        className: buttonElement.className
    };

    try {
        if (!getAuthToken()) {
            showToast('Debe iniciar sesión para inscribirse', 'warning');
            return;
        }

        // Deshabilitar el botón y mostrar loading
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

        // 1. Verificar cupos disponibles antes de inscribir
        const availableSpots = await fetchAvailableSpots(scheduleId);
        if (!availableSpots) {
            throw new Error('No hay cupos disponibles');
        }

        // 2. Realizar la inscripción
        await ApiClient.request('/inscriptions', {
            method: 'POST',
            body: JSON.stringify({ scheduleId })
        });

        // 3. Obtener los cupos actualizados después de la inscripción
        const updatedSpots = await fetchAvailableSpots(scheduleId);
        
        // 4. Actualizar la UI con los cupos reales
        await updateCardSpots(scheduleId, updatedSpots);
        
        // 5. Actualizar el estado del botón
        buttonElement.className = 'btn w-100 btn-success mt-auto';
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="fas fa-check me-2"></i>INSCRIPTO';

        showToast('Inscripción exitosa', 'success');

        // Enviar notificación (sin esperar)
        const userData = getUserData();
        if (userData) {
            NotificationService.sendEmailNotification(userData.id, {
                type: 'new_inscription',
                scheduleId
            }).catch(console.warn);
        }

    } catch (error) {
        // Restaurar estado original del botón
        buttonElement.innerHTML = originalState.text;
        buttonElement.disabled = originalState.disabled;
        buttonElement.className = originalState.className;

        if (error.message.includes('horario')) {
            showToast('Ya estás inscrito en otro evento en este horario', 'warning');
        } else {
            handleError(error);
        }
    }
}

// Mejorar la función para actualizar la UI después de una inscripción
async function updateUIAfterInscription(scheduleId, isInscribed = true) {
    const card = document.querySelector(`[data-schedule-id="${scheduleId}"]`);
    if (!card) return;

    // Actualizar el botón
    const buttonElement = card.querySelector('button');
    if (buttonElement) {
        if (isInscribed) {
            buttonElement.className = 'btn w-100 btn-success mt-auto';
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fas fa-check me-2"></i>INSCRIPTO';
        } else {
            buttonElement.className = 'btn w-100 btn-danger mt-auto';
            buttonElement.disabled = false;
            buttonElement.innerHTML = 'INSCRIBIRSE';
        }
    }

    // Actualizar cupos con reintentos
    let availableSpots = null;
    for (let i = 0; i < 3; i++) {
        try {
            const response = await fetch(`/api/inscriptions/available-spots/${scheduleId}`);
            if (response.ok) {
                const data = await response.json();
                availableSpots = data.availableSpots;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.warn(`Intento ${i + 1} fallido:`, error);
        }
    }

    if (availableSpots !== null) {
        const spotsElement = card.querySelector('.available-spots span');
        if (spotsElement) {
            const isAvailable = availableSpots > 0;
            spotsElement.className = `badge bg-${isAvailable ? 'success' : 'danger'}`;
            spotsElement.textContent = `${availableSpots} cupos`;
            

        }
    }
}

// Actualizar los cupos en la card consultando siempre a la base de datos
async function updateCardSpots(scheduleId, spots) {
    const card = document.querySelector(`[data-schedule-id="${scheduleId}"]`);
    if (!card) return;

    const spotsElement = card.querySelector('.available-spots span');
    if (spotsElement) {
        const isAvailable = spots > 0;
        spotsElement.className = `badge bg-${isAvailable ? 'success' : 'danger'}`;
        spotsElement.textContent = `${spots} cupos`;

        // Si no hay cupos, deshabilitar el botón de inscripción
        if (!isAvailable) {
            const button = card.querySelector('button');
            if (button) {
                button.className = 'btn w-100 btn-secondary mt-auto';
                button.disabled = true;
                button.innerHTML = 'AGOTADO';
            }
        }
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

// Función para obtener los cupos disponibles con cache
async function fetchAvailableSpots(scheduleId) {
    try {
        const data = await ApiClient.request(`/inscriptions/available-spots/${scheduleId}`);
        return data.availableSpots;
    } catch (error) {
        console.warn(`Error al obtener cupos para ${scheduleId}:`, error);
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
        
        // Obtener los cupos disponibles para cada schedule
        const schedulesWithSpots = await Promise.all(
            schedules.map(async (schedule) => {
                const availableSpots = await fetchAvailableSpots(schedule.scheduleId);
                return {
                    ...schedule,
                    availableSpots: availableSpots ?? (schedule.capacity - (schedule.currentInscriptions || 0))
                };
            })
        );
        
        const filteredSchedules = filterSchedules(schedulesWithSpots, filters.searchTerm);
        const groupedSchedules = groupSchedulesByTime(filteredSchedules);
        
        updateEventsGrid(groupedSchedules);
    } catch (error) {
        console.error('Error al cargar schedules:', error);
        showToast('Error al cargar los eventos', 'error');
    }
}
// Separar la actualización del grid en una función aparte
function updateEventsGrid(groupedSchedules) {
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
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = 'data:;base64,iVBORw0KGgo=';
    document.head.appendChild(favicon);
    const navLinks = document.querySelectorAll('.navbar-collapse .btn');
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse.classList.contains('show')) {
                navbarToggler.click();
            }
        });
    });

    initializeStyles();
    
    // Inicializar toasts
    document.querySelectorAll('.toast').forEach(el => {
        new bootstrap.Toast(el, {
            animation: true,
            autohide: true,
            delay: 3000
        });
    });

    // Inicialización con manejo de errores
    Promise.all([
        checkAuth(),
        initializeEventListeners(),
        initializeFilterListeners()
    ]).catch(error => {
        console.error('Error en inicialización:', error);
        handleNotAuthenticated();
    }).finally(() => {
        loadSchedulesWithRetry();
    });
});
// Función para cargar schedules con reintentos
async function loadSchedulesWithRetry(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await loadSchedules();
            return;
        } catch (error) {
            console.error(`Error al cargar schedules (intento ${i + 1}/${retries}):`, error);
            if (i === retries - 1) {
                showToast('Error al cargar los eventos. Por favor, recarga la página.', 'error');
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
}
// #endregion