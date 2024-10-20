// Todas las funcionalidades para tokens

const btnInscribir = document.getElementById("btnInscribir");
const eventList = document.getElementById("eventList");
const eventForm = document.getElementById("eventForm");
const schedules = document.getElementById("schedules");

btnInscribir.addEventListener("click", () => {
  fetchEventsTest();
});

const TOKEN_KEY = "token";
const USER_KEY = "user";

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
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      clearAuth();
      handleNotAuthenticated();
      return false;
    }
    handleAuthenticated();
    return true;
  } catch (error) {
    console.error("Error al verificar token:", error);
    clearAuth();
    handleNotAuthenticated();
    return false;
  }
};

const handleAuthenticated = () => {
  document
    .querySelectorAll(".auth-only")
    .forEach((el) => (el.style.display = "block"));
  document
    .querySelectorAll(".no-auth-only")
    .forEach((el) => (el.style.display = "none"));

  const userData = getUserData();
  if (userData) {
    document.getElementById(
      "userFullName"
    ).textContent = `${userData.first_name} ${userData.last_name}`;
  }
};

const handleNotAuthenticated = () => {
  document
    .querySelectorAll(".auth-only")
    .forEach((el) => (el.style.display = "none"));
  document
    .querySelectorAll(".no-auth-only")
    .forEach((el) => (el.style.display = "block"));
};

// Abrir y cerrar modales
function openModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  document
    .getElementById("loginBtn")
    .addEventListener("click", () => openModal("loginModal"));
  document
    .getElementById("registerBtn")
    .addEventListener("click", () => openModal("registerModal"));

  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", () => {
      closeModal(closeBtn.closest(".modal").id);
    });
  });

  // Cerrar modal al hacer clic fuera
  window.onclick = function (event) {
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
  document
    .getElementById("loginForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        console.error("Error:", error);
        alert("Error al intentar iniciar sesión");
      }
    });

  // Register form
  document
    .getElementById("registerForm")
    .addEventListener("submit", async function (e) {
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
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name,
            last_name,
            email,
            password,
            school,
            year,
            course,
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
        console.error("Error:", error);
        alert("Error al intentar registrarse");
      }
    });
});

function formatTime(timeString) {
  //traida desde admin.js
  if (!timeString) return "N/A";
  try {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    console.error("Error formatting time:", e);
    return timeString;
  }
}

function fetchEventsTest() {
  fetch("/admin/events")
    .then((response) => response.json())
    .then((events) => {
      eventList.innerHTML = "";
      events.forEach((event) => {
        const eventElement = document.createElement("div");
        eventElement.className = "event-item";

        // Crear el HTML para los horarios
        const schedulesHtml = /////DESCOMENTAR
          event.schedules && event.schedules.length > 0
            ? event.schedules
                .map(
                  (schedule) =>
                    `<li>Hora: ${formatTime(
                      schedule.start_time
                    )} - Capacidad: ${schedule.capacity} personas</li>`
                )
                .join("")
            : "<li>No hay horarios disponibles</li>";

        eventElement.innerHTML = `
                    <div class="event-header">
                        <span>${event.name}</span>
                        <button class="delete-btn" data-id="${
                          event.id
                        }">X</button>
                    </div>
                    <div class="event-details">
                        <p><strong>Descripción:</strong> ${
                          event.description
                        }</p>
                        <p><strong>Autor:</strong> ${event.author}</p>
                        <p><strong>Ubicación:</strong> ${event.location}</p>
                        <p><strong>Foto:</strong> ${
                          event.photo || "No disponible"
                        }</p>
                        <p><strong>Horarios:</strong></p>
                        <ul>
                            ${schedulesHtml}
                        </ul>
                    </div>
                `;
        eventList.appendChild(eventElement);

        const header = eventElement.querySelector(".event-header");
        const details = eventElement.querySelector(".event-details");
        header.addEventListener("click", (e) => {
          if (!e.target.classList.contains("delete-btn")) {
            details.style.display =
              details.style.display === "none" ? "block" : "none";
          }
        });
      });
      addDeleteEventListeners();
    })
    .catch((error) => console.error("Error:", error));
}
