// Funciones para abrir y cerrar modales
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Event listeners para abrir modales
document.getElementById("loginBtn").addEventListener("click", () => openModal("loginModal"));
document.getElementById("registerBtn").addEventListener("click", () => openModal("registerModal"));

// Event listeners para cerrar modales
document.querySelectorAll(".close").forEach(closeBtn => {
    closeBtn.addEventListener("click", () => {
        closeModal(closeBtn.closest(".modal").id);
    });
});

// Cerrar modal al hacer clic fuera del contenido
window.onclick = function(event) {
    if (event.target.className === "modal") {
        event.target.style.display = "none";
    }
}

// Manejar envío de formulario de inicio de sesión
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
            alert("Inicio de sesión exitoso");
            localStorage.setItem('token', data.token);
            closeModal("loginModal");
        } else {
            alert(data.message || "Error en el inicio de sesión");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Error al intentar iniciar sesión");
    }
});

// Manejar envío de formulario de registro
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
            body: JSON.stringify({ first_name, last_name, email, password, school, year, course }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registro exitoso");
            localStorage.setItem('token', data.token);
            closeModal("registerModal");
        } else {
            alert(data.message || "Error en el registro");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Error al intentar registrarse");
    }
});