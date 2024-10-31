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

    //Abrir lista de opciones al hacer click en botón de usuario
    document.getElementById("userFullName").addEventListener("click", () => {
        const dropdown = document.getElementById("dropdownMenu");
        //alternamos entre mostrarlo y no mostrarlo
        if (dropdown.style.display === 'none' || dropdown.style.display === ""){
            dropdown.style.display = "block";
        } 
        else
        {
            dropdown.style.display = "none";
        }
        
    })
    
    window.addEventListener("click", function(event) {
        const dropdown = document.getElementById("dropdownMenu");
        if (!event.target.matches('#userFullName')) {
            dropdown.style.display = "none";
        }
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

