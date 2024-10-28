
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

// #region Activities
// Constants
const API_ENDPOINTS = {
    EVENTS: '/admin/events',
    INSCRIPTIONS: '/api/inscriptions',
    LOGIN: '/api/admin/login',
    AUTH_LOGIN: '/api/auth/login',
    AUTH_REGISTER: '/api/auth/register'
};

const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user'
};

const DEFAULT_IMAGE = 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRr8-OE50j-ouxyFGsyzM3mxhV_iTWsV-6QCnqeABu7P9qtjuPt';



// Auth Management
class AuthManager {
    static setAuthToken(token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }

    static getAuthToken() {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }

    static setUserData(user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    static getUserData() {
        const userData = localStorage.getItem(STORAGE_KEYS.USER);
        return userData ? JSON.parse(userData) : null;
    }

    static clearAuth() {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    }

    static checkAuth() {
        const token = this.getAuthToken();
        if (!token) {
            this.handleNotAuthenticated();
            return false;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp * 1000 < Date.now()) {
                this.clearAuth();
                this.handleNotAuthenticated();
                return false;
            }
            this.handleAuthenticated();
            return true;
        } catch (error) {
            console.error('Error al verificar token:', error);
            this.clearAuth();
            this.handleNotAuthenticated();
            return false;
        }
    }

    static handleAuthenticated() {
        document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'flex');
        document.querySelectorAll('.no-auth-only').forEach(el => el.style.display = 'none');
        
        const userData = this.getUserData();
        if (userData) {
            document.getElementById('userFullName').textContent = 
                `${userData.first_name} ${userData.last_name}`;
        }
    }

    static handleNotAuthenticated() {
        document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.no-auth-only').forEach(el => el.style.display = 'flex');
    }
}

// Modal Management
class ModalManager {
    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = "flex";
        modal.classList.add('show');
        
        // Añadir clase para animación
        setTimeout(() => {
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
            modal.querySelector('.modal-content').style.opacity = '1';
        }, 10);
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        const content = modal.querySelector('.modal-content');
        
        // Animación de salida
        content.style.transform = 'scale(0.7)';
        content.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = "none";
            modal.classList.remove('show');
        }, 300);
    }

    static setupModalListeners() {
        // Setup modal triggers
        document.getElementById("loginBtn")?.addEventListener("click", () => this.openModal("loginModal"));
        document.getElementById("registerBtn")?.addEventListener("click", () => this.openModal("registerModal"));
        
        // Setup close buttons
        document.querySelectorAll(".close").forEach(closeBtn => {
            closeBtn.addEventListener("click", () => {
                const modalId = closeBtn.closest(".modal").id;
                this.closeModal(modalId);
            });
        });

        // Close on outside click
        window.onclick = (event) => {
            if (event.target.classList.contains("modal")) {
                this.closeModal(event.target.id);
            }
        };
    }
}


// Countdown Manager
class CountdownManager {
    static initialize() {
        this.updateCountdown();
        setInterval(() => this.updateCountdown(), 60000);
    }

    static updateCountdown() {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) return;

        const eventDate = new Date('2024-11-08T18:00:00').getTime();
        const now = new Date().getTime();
        const difference = eventDate - now;

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        countdownElement.innerHTML = `Faltan: ${days}d ${hours}h ${minutes}m`;
    }
}
// Form Handlers
class FormHandler {
    static async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                AuthManager.setAuthToken(data.token);
                AuthManager.setUserData(data.user);
                AuthManager.handleAuthenticated();
                ModalManager.closeModal("loginModal");
                this.showSuccessMessage("Inicio de sesión exitoso");
                ActivitiesManager.currentUser = data.user;
            } else {
                this.showErrorMessage(data.message || "Error en el inicio de sesión");
            }
        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage("Error al intentar iniciar sesión");
        }
    }

    static async handleRegister(event) {
        event.preventDefault();
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
            this.showErrorMessage("Las contraseñas no coinciden");
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.AUTH_REGISTER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                AuthManager.setAuthToken(data.token);
                AuthManager.setUserData(data.user);
                AuthManager.handleAuthenticated();
                ModalManager.closeModal("registerModal");
                this.showSuccessMessage("Registro exitoso");
            } else {
                this.showErrorMessage(data.message || "Error en el registro");
            }
        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage("Error al intentar registrarse");
        }
    }

    static showErrorMessage(message) {
        alert(message); // Podemos mejorar esto con un sistema de notificaciones más elegante
    }

    static showSuccessMessage(message) {
        alert(message); // Podemos mejorar esto con un sistema de notificaciones más elegante
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    AuthManager.checkAuth();

    // Modal Setup
    ModalManager.setupModalListeners();

    // Form Listeners
    document.getElementById("loginForm")?.addEventListener("submit", (e) => FormHandler.handleLogin(e));
    document.getElementById("registerForm")?.addEventListener("submit", (e) => FormHandler.handleRegister(e));
    
    // Logout Handler
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        AuthManager.clearAuth();
        AuthManager.handleNotAuthenticated();
        ActivitiesManager.currentUser = null;
        FormHandler.showSuccessMessage("Sesión cerrada exitosamente");
    });

    // Load Activities
    ActivitiesManager.loadActivities();

    // Setup Search
    document.getElementById('search')?.addEventListener('input', (e) => 
        ActivitiesManager.filterActivities(e.target.value)
    );

    // Initialize Countdown
    CountdownManager.initialize();
});


// State
let activities = [];
let currentUser = null;

// Activity Image Handler
class ActivityImageHandler {
    static setImage(imgElement, photoData) {
        if (!imgElement) return;

        try {
            if (photoData && photoData.startsWith('data:image')) {
                imgElement.src = photoData;
            } else if (photoData) {
                imgElement.src = this.createImageUrlFromBase64(photoData);
            } else {
                imgElement.src = DEFAULT_IMAGE;
            }

            this.setupImageErrorHandler(imgElement);
        } catch (error) {
            console.error('Error setting image:', error);
            imgElement.src = DEFAULT_IMAGE;
        }
    }

    static createImageUrlFromBase64(base64String) {
        const byteCharacters = atob(base64String);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        return URL.createObjectURL(blob);
    }

    static setupImageErrorHandler(imgElement) {
        imgElement.onerror = function() {
            if (this.src !== DEFAULT_IMAGE) {
                this.src = DEFAULT_IMAGE;
                this.alt = 'Imagen de respaldo';
            } else {
                this.style.display = 'none';
                this.alt = 'Imagen no disponible';
            }
        };
    }
}

// Activities Management
class ActivitiesManager {
    static activities = [];
    static currentUser = null;

    static async loadActivities() {
        try {
            const response = await fetch(API_ENDPOINTS.EVENTS);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.activities = await response.json();
            this.renderActivities(this.activities);
        } catch (error) {
            console.error('Error al cargar las actividades:', error);
            this.showErrorMessage();
        }
    }

    static showErrorMessage() {
        const scheduleContainer = document.getElementById('schedule');
        if (scheduleContainer) {
            scheduleContainer.innerHTML = `
                <div class="error-message">
                    <p>No se pudieron cargar las actividades. Por favor, intenta de nuevo más tarde.</p>
                    <button onclick="ActivitiesManager.loadActivities()" class="retry-button">
                        Intentar de nuevo
                    </button>
                </div>`;
        }
    }

    static renderActivities(activitiesToRender) {
        const scheduleContainer = document.getElementById('schedule');
        if (!scheduleContainer) return;

        scheduleContainer.innerHTML = '';
        const template = document.getElementById('activity-card-template');
        if (!template) return;

        const fragment = document.createDocumentFragment();
        activitiesToRender.forEach(activity => {
            const activityCard = this.createActivityCard(template, activity);
            fragment.appendChild(activityCard);
        });

        scheduleContainer.appendChild(fragment);
    }

    static createActivityCard(template, activity) {
        const clone = template.content.cloneNode(true);
        
        // Configurar imagen
        const imgElement = clone.querySelector('img');
        ActivityImageHandler.setImage(imgElement, activity.photo);
        
        // Configurar textos
        this.setActivityCardContent(clone, activity);
        
        // Configurar botón de inscripción
        const inscriptionButton = clone.querySelector('.inscription-button');
        if (inscriptionButton) {
            this.updateInscriptionButton(inscriptionButton, activity);
        }

        return clone;
    }

    static setActivityCardContent(cardElement, activity) {
        const elements = {
            '.activity-type': activity['event type'] || 'Tipo no especificado',
            '.activity-name': activity.name,
            '.activity-description': activity.description,
            '.activity-duration': activity.duration,
            '.activity-author': activity.author,
            '.activity-location': activity.location,
            '.available-spots': activity.available && activity.capacity ? 
                `${activity.available}/${activity.capacity}` : null,
            '.start-time': activity.startTime
        };

        Object.entries(elements).forEach(([selector, value]) => {
            const element = cardElement.querySelector(selector);
            if (element && value !== null) {
                element.textContent = value;
            }
        });
    }

    static updateInscriptionButton(button, activity) {
        const buttonStates = {
            inscribed: {
                text: 'Anular inscripción',
                action: () => this.handleCancelInscription(activity.id),
                classes: { remove: ['bg-red-600', 'hover:bg-red-700'], add: ['bg-gray-600', 'hover:bg-gray-700'] }
            },
            available: {
                text: 'Inscribirse',
                action: () => this.handleInscription(activity.id),
                classes: { remove: ['bg-gray-600', 'hover:bg-gray-700'], add: ['bg-red-600', 'hover:bg-red-700'] }
            },
            full: {
                text: 'Agotado',
                action: null,
                classes: { add: ['bg-gray-600', 'cursor-not-allowed'] }
            }
        };

        const state = activity.available <= 0 ? 'full' : 
                     (currentUser && activity.isUserInscribed) ? 'inscribed' : 'available';

        const currentState = buttonStates[state];

        button.textContent = currentState.text;
        button.disabled = state === 'full';
        
        Object.entries(buttonStates).forEach(([_, config]) => {
            config.classes?.remove?.forEach(cls => button.classList.remove(cls));
        });
        currentState.classes?.add?.forEach(cls => button.classList.add(cls));
        
        if (currentState.action) {
            button.onclick = currentState.action;
        }
    }

    static async handleInscription(activityId) {
        if (!this.validateUserSession()) return;

        try {
            const response = await fetch(API_ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ activityId })
            });

            await this.handleInscriptionResponse(response, activityId, true);
        } catch (error) {
            this.handleInscriptionError(error);
        }
    }

    static async handleCancelInscription(activityId) {
        if (!confirm('¿Estás seguro de que deseas anular tu inscripción?')) return;

        try {
            const response = await fetch(`${API_ENDPOINTS.INSCRIPTIONS}/${activityId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            await this.handleInscriptionResponse(response, activityId, false);
        } catch (error) {
            this.handleInscriptionError(error);
        }
    }

    static validateUserSession() {
        if (!currentUser) {
            alert('Debes iniciar sesión para inscribirte.');
            openModal('loginModal');
            return false;
        }
        return true;
    }

    static getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        };
    }

    static async handleInscriptionResponse(response, activityId, isInscription) {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la operación');
        }

        await this.updateActivityAfterInscription(activityId, isInscription);
        alert(isInscription ? 'Inscripción realizada con éxito' : 'Inscripción anulada con éxito');
    }

    static handleInscriptionError(error) {
        console.error('Error:', error);
        alert(error.message || 'Error en la operación');
    }

    static filterActivities(searchTerm) {
        const filteredActivities = activities.filter(activity =>
            activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderActivities(filteredActivities);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    ActivitiesManager.loadActivities();
    document.getElementById('search')?.addEventListener('input', (e) => 
        ActivitiesManager.filterActivities(e.target.value)
    );
});

// // Exports
// export { ActivitiesManager, ActivityImageHandler };
// #endregion

// #region Countdown
function updateCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;

    const eventDate = new Date('2024-11-08T18:00:00').getTime();
    const now = new Date().getTime();
    const difference = eventDate - now;

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    countdownElement.innerHTML = `Faltan: ${days}d ${hours}h ${minutes}m`;
}

// Llamar a updateCountdown inmediatamente para mostrar el contador
updateCountdown();

// Actualizar el contador cada minuto
setInterval(updateCountdown, 60000);
//#endregion


