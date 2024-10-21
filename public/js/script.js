// Constants
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Auth functions
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

// UI update functions
const updateUIOnAuth = () => {
    const user = getUserData();
    const authElements = document.querySelectorAll('.auth-only');
    const noAuthElements = document.querySelectorAll('.no-auth-only');
    const userMenuButton = document.getElementById('userMenuButton');
    const userMenu = document.getElementById('userMenu');

    if (user) {
        authElements.forEach(el => el.style.display = 'block');
        noAuthElements.forEach(el => el.style.display = 'none');
        if (userMenuButton) {
            userMenuButton.style.display = 'block';
            userMenuButton.textContent = `${user.first_name} ${user.last_name}`;
        }
        if (userMenu) userMenu.style.display = 'none';
    } else {
        authElements.forEach(el => el.style.display = 'none');
        noAuthElements.forEach(el => el.style.display = 'block');
        if (userMenuButton) userMenuButton.style.display = 'none';
        if (userMenu) userMenu.style.display = 'none';
    }
};

// Modal functions
const openModal = (modalId) => document.getElementById(modalId).style.display = 'block';
const closeModal = (modalId) => document.getElementById(modalId).style.display = 'none';

// Activity functions
let activities = [];

async function loadActivities() {
    try {
        const response = await fetch('/admin/events');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        activities = await response.json();
        renderActivities(activities);
    } catch (error) {
        console.error('Error al cargar las actividades:', error);
        document.getElementById('schedule').innerHTML = '<p>No se pudieron cargar las actividades. Por favor, intenta de nuevo más tarde.</p>';
    }
}

function renderActivities(activitiesToRender) {
    const scheduleContainer = document.getElementById('schedule');
    scheduleContainer.innerHTML = '';
    const template = document.getElementById('activity-card-template');

    activitiesToRender.forEach(activity => {
        const clone = template.content.cloneNode(true);
        const imgElement = clone.querySelector('img');
        
        if (activity.photo && activity.photo.startsWith('data:image')) {
            imgElement.src = activity.photo;
        } else if (activity.photo) {
            try {
                const byteCharacters = atob(activity.photo);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], {type: 'image/jpeg'});
                imgElement.src = URL.createObjectURL(blob);
            } catch (error) {
                console.error('Error creating image URL:', error);
                imgElement.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
            }
        } else {
            imgElement.src = 'https://via.placeholder.com/300x200?text=No+Image';
        }
        
        imgElement.alt = activity.name;
        imgElement.onerror = function() {
            this.src = 'https://via.placeholder.com/300x200?text=Error+Loading+Image';
            this.alt = 'Error loading image';
        };

        clone.querySelector('.activity-type').textContent = activity['event type'] || 'Tipo no especificado';
        clone.querySelector('.activity-name').textContent = activity.name;
        clone.querySelector('.activity-description').textContent = activity.description;
        clone.querySelector('.activity-duration').textContent = activity.duration;
        clone.querySelector('.activity-author').textContent = activity.author;
        
        const locationElement = clone.querySelector('.activity-location');
        if (locationElement) locationElement.textContent = activity.location;

        const inscriptionButton = clone.querySelector('.inscription-button');
        if (inscriptionButton) updateInscriptionButton(inscriptionButton, activity);

        scheduleContainer.appendChild(clone);
    });
}

function updateInscriptionButton(button, activity) {
    const user = getUserData();
    if (activity.available > 0) {
        if (user && activity.isUserInscribed) {
            button.textContent = 'Anular inscripción';
            button.classList.remove('bg-red-600', 'hover:bg-red-700');
            button.classList.add('bg-gray-600', 'hover:bg-gray-700');
            button.onclick = () => handleCancelInscription(activity.id);
        } else {
            button.textContent = 'Inscribirse';
            button.classList.remove('bg-gray-600', 'hover:bg-gray-700');
            button.classList.add('bg-red-600', 'hover:bg-red-700');
            button.onclick = () => handleInscription(activity.id);
        }
    } else {
        button.textContent = 'Agotado';
        button.classList.add('bg-gray-600', 'cursor-not-allowed');
        button.disabled = true;
    }
}

async function handleInscription(activityId) {
    const user = getUserData();
    if (!user) {
        alert('Debes iniciar sesión para inscribirte.');
        openModal('loginModal');
        return;
    }

    try {
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ activityId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al procesar la inscripción');
        }

        await updateActivityAfterInscription(activityId, true);
        alert('Inscripción realizada con éxito');
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

async function handleCancelInscription(activityId) {
    if (!confirm('¿Estás seguro de que deseas anular tu inscripción?')) return;

    try {
        const response = await fetch(`/api/inscriptions/${activityId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al anular la inscripción');
        }

        await updateActivityAfterInscription(activityId, false);
        alert('Inscripción anulada con éxito');
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

async function updateActivityAfterInscription(activityId, isInscription) {
    try {
        const response = await fetch(`/admin/events/${activityId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const updatedActivity = await response.json();
        
        const index = activities.findIndex(a => a.id === activityId);
        if (index !== -1) {
            activities[index] = updatedActivity;
            const activityElement = document.querySelector(`[data-activity-id="${activityId}"]`);
            if (activityElement) updateActivityUI(activityElement, updatedActivity);
        }

        updatedActivity.isUserInscribed = isInscription;
    } catch (error) {
        console.error('Error al actualizar la actividad:', error);
        throw error;
    }
}

function updateActivityUI(element, activity) {
    const availableSpotsElement = element.querySelector('.available-spots');
    if (availableSpotsElement) {
        availableSpotsElement.textContent = `${activity.available}/${activity.capacity}`;
    }
    const inscriptionButton = element.querySelector('.inscription-button');
    updateInscriptionButton(inscriptionButton, activity);
}

function filterActivities() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filteredActivities = activities.filter(activity =>
        activity.name.toLowerCase().includes(searchTerm) ||
        activity.description.toLowerCase().includes(searchTerm)
    );
    renderActivities(filteredActivities);
}

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

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', () => {
    updateUIOnAuth();
    loadActivities();
    updateCountdown();
    setInterval(updateCountdown, 60000);

    document.getElementById('search').addEventListener('input', filterActivities);

    document.getElementById("loginBtn").addEventListener("click", () => openModal("loginModal"));
    document.getElementById("registerBtn").addEventListener("click", () => openModal("registerModal"));
    
    document.querySelectorAll(".close").forEach(closeBtn => {
        closeBtn.addEventListener("click", () => closeModal(closeBtn.closest(".modal").id));
    });

    window.onclick = function(event) {
        if (event.target.className === "modal") {
            event.target.style.display = "none";
        }
    };

    document.getElementById("logoutBtn").addEventListener("click", () => {
        clearAuth();
        updateUIOnAuth();
        alert("Sesión cerrada exitosamente");
    });

    document.getElementById("loginForm").addEventListener("submit", async function(e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setAuthToken(data.token);
                setUserData(data.user);
                updateUIOnAuth();
                closeModal("loginModal");
                loadActivities();
                alert("Inicio de sesión exitoso");
            } else {
                alert(data.message || "Error en el inicio de sesión");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Error al intentar iniciar sesión");
        }
    });

    document.getElementById("registerForm").addEventListener("submit", async function(e) {
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
            alert("Las contraseñas no coinciden");
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setAuthToken(data.token);
                setUserData(data.user);
                updateUIOnAuth();
                closeModal("registerModal");
                loadActivities();
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