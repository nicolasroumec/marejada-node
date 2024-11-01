// #region Niqui


// Todas las funcionalidades para tokens
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const setAuthToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

const getAuthToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

const setUserData = (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

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

const handleAuthenticated = () => {
    document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.no-auth-only').forEach(el => el.style.display = 'none');
    
    const userData = getUserData();
    if (userData) {
        document.getElementById('userFullName').textContent = 
            `${userData.first_name} ${userData.last_name}`;
    }
};

const handleNotAuthenticated = () => {
    document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.no-auth-only').forEach(el => el.style.display = 'block');
};

// Abrir y cerrar modales
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    document.getElementById("loginBtn").addEventListener("click", () => openModal("loginModal"));
    document.getElementById("registerBtn").addEventListener("click", () => openModal("registerModal"));
    
    document.querySelectorAll(".close").forEach(closeBtn => {
        closeBtn.addEventListener("click", () => {
            closeModal(closeBtn.closest(".modal").id);
        });
    });

    // Cerrar modal al hacer clic fuera
    window.onclick = function(event) {
        if (event.target.className === "modal") {
            event.target.style.display = "none";
        }
    };

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        clearAuth();
        handleNotAuthenticated();
        alert("Sesión cerrada exitosamente");
    });

    // Login form
    document.getElementById("loginForm").addEventListener("submit", async function(e) {
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
                closeModal("loginModal");
                alert("Inicio de sesión exitoso");
            } else {
                alert(data.message || "Error en el inicio de sesión");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Error al intentar iniciar sesión");
        }
    });

    // Register form
    document.getElementById("registerForm").addEventListener("submit", async function(e) {
        e.preventDefault();
        const first_name = document.getElementById("firstName").value;
        const last_name = document.getElementById("lastName").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const school = document.getElementById("school").value;
        const year = document.getElementById("year").value;
        const course = document.getElementById("course").value;

        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    first_name, 
                    last_name, 
                    email, 
                    password, 
                    school, 
                    year, 
                    course 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setAuthToken(data.token);
                setUserData(data.user);
                handleAuthenticated();
                closeModal("registerModal");
                alert("Registro exitoso");
            } else {
                alert(data.message || "Error en el registro");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Error al intentar registrarse");
        }
    });
});


// #endregion


// #region Juan Cruz

// Función para obtener los schedules del servidor
async function fetchSchedules() {
    try {
        const response = await fetch('/api/schedules/schedule-cards');
        const data = await response.json();
        console.log(data)
        return data;
        
    } catch (error) {
        console.error('Error fetching schedules:', error);
        return [];
    }
}

// Función para crear una card de evento
function createEventCard(schedule) {
    const availableSpots = schedule.capacity - (schedule.currentInscriptions || 0);
    const isAvailable = availableSpots > 0;
    
    return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card bg-dark text-white h-100 border-secondary hover-border-danger">
                <div class="position-relative">
                    <img 
                        src="${schedule.event.photo || 'https://via.placeholder.com/400x300'}"
                        class="card-img-top"
                        alt="${schedule.event.name}"
                        style="height: 200px; object-fit: cover;"
                    >
                    <div class="position-absolute top-0 end-0 bg-danger text-white px-3 py-1">
                        ${schedule.event.type}
                    </div>
                </div>
                
                <div class="card-body">
                    <h5 class="card-title text-danger">${schedule.event.name}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${schedule.event.type}</h6>
                    <p class="card-text">${schedule.event.description}</p>
                    
                    <div class="mb-3">
                        <p class="mb-1"><small><strong>Autor:</strong> ${schedule.event.author}</small></p>
                        <p class="mb-1"><small><strong>Ubicación:</strong> ${schedule.event.location}</small></p>
                        <p class="mb-1"><small><strong>Duración:</strong> ${schedule.event.duration}</small></p>
                        <p class="mb-1"><small><strong>Cupos disponibles:</strong> ${availableSpots}</small></p>
                    </div>

                    <button
                        onclick="handleInscription('${schedule.scheduleId}')"
                        class="btn w-100 ${isAvailable ? 'btn-danger' : 'btn-secondary'}"
                        ${!isAvailable ? 'disabled' : ''}
                    >
                        ${isAvailable ? 'INSCRIBIRSE' : 'AGOTADO'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Función actualizada para manejar la inscripción
async function handleInscription(scheduleId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Debe iniciar sesión para inscribirse');
            return;
        }

        const response = await fetch('/api/inscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ scheduleId })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Inscripción exitosa');
            await loadSchedules();
        } else {
            alert(data.message || 'Error en la inscripción');
            console.error('Error response:', data);
        }
    } catch (error) {
        console.error('Error en la inscripción:', error);
        alert('Error al procesar la inscripción');
    }
}

// Función para actualizar la capacidad de un evento específico
async function updateEventCapacity(scheduleId) {
    try {
        const response = await fetch(`/api/inscriptions/available-spots/${scheduleId}`);
        const data = await response.json();
        
        // Actualizar el DOM para reflejar los nuevos cupos disponibles
        const card = document.querySelector(`[data-schedule-id="${scheduleId}"]`);
        if (card) {
            const spotsElement = card.querySelector('.available-spots');
            if (spotsElement) {
                spotsElement.textContent = `Cupos disponibles: ${data.availableSpots}`;
            }
        }
    } catch (error) {
        console.error('Error al actualizar cupos:', error);
    }
}

// Función actualizada para mostrar las inscripciones del usuario
async function cancelInscription(scheduleId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta inscripción?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
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

        alert('Inscripción cancelada exitosamente');
        
        // Actualizar la vista
        const modal = bootstrap.Modal.getInstance(document.getElementById('inscriptionsModal'));
        if (modal) {
            modal.hide();
        }
        
        await loadSchedules(); // Recargar los eventos disponibles
        await showUserInscriptions(); // Mostrar modal actualizado
        
    } catch (error) {
        console.error('Error al cancelar la inscripción:', error);
        alert(error.message || 'Error al cancelar la inscripción');
    }
}

// Actualización de la parte del modal donde se genera el botón de cancelar
async function showUserInscriptions() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Debe iniciar sesión para ver sus inscripciones');
            return;
        }

        // Remover modales existentes primero
        let existingModal = document.getElementById('inscriptionsModal');
        if (existingModal) {
            existingModal.remove();
        }

        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        const response = await fetch('/api/inscriptions/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Inscripciones recibidas:', data.inscriptions);

        // Verificar si hay inscripciones - MOVIDO DESPUÉS DE LA RESPUESTA
        if (!data.inscriptions || data.inscriptions.length === 0) {
            showNoInscriptionsModal();
            return;
        }

        // Ordenar inscripciones por hora
        const sortedInscriptions = [...data.inscriptions].sort((a, b) => {
            return new Date('1970/01/01 ' + (a.event_time || '00:00')) - new Date('1970/01/01 ' + (b.event_time || '00:00'));
        });

        // Crear el HTML del modal
        const modalHTML = `
            <div class="modal fade" id="inscriptionsModal" tabindex="-1" aria-labelledby="inscriptionsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content bg-dark text-white">
                        <div class="modal-header">
                            <h5 class="modal-title" id="inscriptionsModalLabel">
                                Mis Inscripciones
                                <span class="badge bg-danger ms-2">${sortedInscriptions.length}</span>
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                ${sortedInscriptions.map(inscription => {
                                    console.log('Procesando inscripción:', inscription);
                                    return `
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
                                                            onclick="cancelInscription(${inscription.schedule_id})" 
                                                            class="btn btn-danger btn-sm w-100">
                                                            Cancelar Inscripción
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar el modal en el documento
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Obtener el nuevo modal y mostrarlo
        const modalElement = document.getElementById('inscriptionsModal');
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });

        modalElement.addEventListener('hidden.bs.modal', function () {
            this.remove();
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
        });

        modal.show();

    } catch (error) {
        console.error('Error al obtener inscripciones:', error);
        alert('Error al cargar las inscripciones: ' + error.message);
    }
}
 
// Función para mostrar modal sin inscripciones
function showNoInscriptionsModal() {
    const modalHTML = `
        <div class="modal fade" id="inscriptionsModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header">
                        <h5 class="modal-title">Mis Inscripciones</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="mb-3">
                            <i class="fas fa-calendar-times fa-3x text-danger mb-3"></i>
                        </div>
                        <h5>No tienes inscripciones activas</h5>
                        <p class="text-muted">Explora los eventos disponibles y inscríbete en los que te interesen.</p>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modalElement = document.getElementById('inscriptionsModal');
    const modal = new bootstrap.Modal(modalElement);
    
    modalElement.addEventListener('hidden.bs.modal', function () {
        this.remove();
        document.body.classList.remove('modal-open');
    });

    modal.show();
}


// Actualizar la función cancelInscription para manejar mejor el cierre del modal
async function cancelInscription(scheduleId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta inscripción?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
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

        alert('Inscripción cancelada exitosamente');
        
        // Cerrar el modal actual
        const modal = bootstrap.Modal.getInstance(document.getElementById('inscriptionsModal'));
        if (modal) {
            modal.hide();
        }

        // Esperar a que se complete la animación del modal
        setTimeout(async () => {
            await loadSchedules(); // Recargar los eventos disponibles
            await showUserInscriptions(); // Mostrar modal actualizado
        }, 500);
        
    } catch (error) {
        console.error('Error al cancelar la inscripción:', error);
        alert(error.message || 'Error al cancelar la inscripción');
    }
}


// Función para filtrar schedules
function filterSchedules(schedules, filters) {
    return schedules.filter(schedule => {
        // Filtro por horario
        if (filters.timeRange !== 'all') {
            const now = new Date();
            const scheduleDate = new Date(schedule.startTime);
            
            switch (filters.timeRange) {
                case 'today':
                    if (scheduleDate.toDateString() !== now.toDateString()) return false;
                    break;
                case 'tomorrow':
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    if (scheduleDate.toDateString() !== tomorrow.toDateString()) return false;
                    break;
                case 'week':
                    const nextWeek = new Date(now);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    if (scheduleDate < now || scheduleDate > nextWeek) return false;
                    break;
            }
        }

        // Filtro por tipo
        if (filters.eventType !== 'all' && 
            schedule.event.type.toLowerCase() !== filters.eventType.toLowerCase()) {
            return false;
        }

        // Filtro por capacidad
        const availableSpots = schedule.capacity - (schedule.currentInscriptions || 0);
        if (filters.capacity !== 'all') {
            switch (filters.capacity) {
                case 'available':
                    if (availableSpots <= 0) return false;
                    break;
                case 'almostFull':
                    if (availableSpots > 5 || availableSpots <= 0) return false;
                    break;
                case 'full':
                    if (availableSpots > 0) return false;
                    break;
            }
        }

        return true;
    });
}

// Variables globales para almacenar los datos y filtros
let allSchedules = [];
const filters = {
    timeRange: 'all',
    eventType: 'all',
    capacity: 'all'
};


// función para agrupar y ordenar los eventos por horario:
function groupSchedulesByTime(schedules) {
    // Ordenar los schedules por hora
    const sortedSchedules = schedules.sort((a, b) => {
        return new Date('1970/01/01 ' + a.startTime) - new Date('1970/01/01 ' + b.startTime);
    });

    // Agrupar por hora
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


// Función para cargar y mostrar los schedules
async function loadSchedules() {
    // Obtener los datos
    allSchedules = await fetchSchedules();
    
    // Aplicar filtros
    const filteredSchedules = filterSchedules(allSchedules, filters);
    
    // Agrupar por horario
    const groupedSchedules = groupSchedulesByTime(filteredSchedules);
    
    // Renderizar los grupos
    const eventsGrid = document.getElementById('eventsGrid');
    eventsGrid.innerHTML = '';

    // Crear sección para cada horario
    Object.entries(groupedSchedules).forEach(([time, schedules]) => {
        const timeSection = document.createElement('div');
        timeSection.className = 'col-12 mb-4';
        timeSection.innerHTML = `
            <h3 class="text-white mb-3">Horario: ${time}</h3>
            <div class="row g-4">
                ${schedules.map(schedule => createEventCard(schedule)).join('')}
            </div>
        `;
        eventsGrid.appendChild(timeSection);
    });
}

// Inicializar los event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos iniciales
    loadSchedules();

    // Event listeners para los filtros
    document.getElementById('timeFilter').addEventListener('change', (e) => {
        filters.timeRange = e.target.value;
        loadSchedules();
    });

    document.getElementById('typeFilter').addEventListener('change', (e) => {
        filters.eventType = e.target.value;
        loadSchedules();
    });

    document.getElementById('capacityFilter').addEventListener('change', (e) => {
        filters.capacity = e.target.value;
        loadSchedules();
    });
});



// #endregion