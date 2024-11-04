document.addEventListener('DOMContentLoaded', () => {
    // Constantes y variables importantes
    const PASSWORD = 'jnsm2022';
    let loginAttempts = 0;
    let isAuthenticated = false; // Control de autenticación en memoria

    // Inicialización de elementos Bootstrap
    const authModal = new bootstrap.Modal(document.getElementById('authModal'), {
        backdrop: 'static',
        keyboard: false
    });
    const authToast = new bootstrap.Toast(document.getElementById('authToast'), {
        delay: 3000
    });
    const eventToast = new bootstrap.Toast(document.getElementById('eventToast'), {
        delay: 3000
    });

    // Referencias a elementos DOM
    const modal = document.getElementById('eventsModal');
    const showEventsBtn = document.getElementById('showEventsBtn');
    const closeBtn = document.querySelector('.close');
    const eventList = document.getElementById('eventList');
    const eventForm = document.getElementById('eventForm');
    const schedules = document.getElementById('schedules');
    const addScheduleBtn = document.querySelector('.add-schedule-btn');

    // Función para mostrar el modal de autenticación
    const showAuthModal = () => {
        document.body.classList.remove('authenticated');
        isAuthenticated = false;
        authModal.show();
        setTimeout(() => {
            document.getElementById('password').focus();
        }, 500);
    };

    // Manejar el formulario de autenticación
    document.getElementById('authForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById('password');
        const password = passwordInput.value;

        if (password === PASSWORD) {
            isAuthenticated = true;
            document.body.classList.add('authenticated');
            authModal.hide();
            passwordInput.value = '';
            loginAttempts = 0;
            
            document.querySelector('#eventToast .toast-body').textContent = '¡Bienvenido al panel de administración!';
            document.getElementById('eventToast').classList.remove('bg-danger');
            document.getElementById('eventToast').classList.add('bg-success');
            eventToast.show();
        } else {
            loginAttempts++;
            passwordInput.value = '';
            
            let message = `Contraseña incorrecta. Intento ${loginAttempts} de 3`;
            if (loginAttempts >= 3) {
                message = 'Has excedido el número de intentos. Pero puedes seguir intentando.';
            }
            
            document.querySelector('#authToast .toast-body').textContent = message;
            authToast.show();
        }
    });

    // Función para verificar autenticación
    const checkAuth = () => {
        if (!isAuthenticated) {
            showAuthModal();
            return false;
        }
        return true;
    };

    // Event Listeners para el modal de eventos
    showEventsBtn.addEventListener('click', () => {
        if (checkAuth()) {
            modal.style.display = 'block';
            fetchEvents();
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Función para obtener eventos
    function fetchEvents() {
        if (!checkAuth()) return;

        fetch('/api/events/get-events')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                console.log("Datos recibidos:", data);
                const events = Array.isArray(data.data) ? data.data : [];

                eventList.innerHTML = '';
                events.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event-item';

                    const schedulesHtml = event.schedules && event.schedules.length > 0
                        ? event.schedules.map(schedule => `
                            <li>
                                Hora: ${formatTime(schedule.start_time)} - Capacidad: ${schedule.capacity} personas
                                <button class="view-inscriptions-btn" data-schedule-id="${schedule.id}">Ver inscripciones</button>
                            </li>
                        `).join('')
                        : '<li>No hay horarios disponibles</li>';

                    eventElement.innerHTML = `
                        <div class="event-header">
                            <span>${event.name}</span>
                            <button class="delete-btn" data-id="${event.id}">X</button>
                        </div>
                        <div class="event-details">
                            <p><strong>Descripción:</strong> ${event.description}</p>
                            <p><strong>Autor:</strong> ${event.author}</p>
                            <p><strong>Ubicación:</strong> ${event.location}</p>
                            <p><strong>Foto:</strong> ${event.photo || 'No disponible'}</p>
                            <p><strong>Tipo:</strong> ${event.type}</p>
                            <p><strong>Duración:</strong> ${event.duration}</p>
                            <p><strong>Horarios:</strong></p>
                            <ul>
                                ${schedulesHtml}
                            </ul>
                        </div>
                    `;
                    eventList.appendChild(eventElement);

                    const header = eventElement.querySelector('.event-header');
                    const details = eventElement.querySelector('.event-details');
                    header.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('delete-btn')) {
                            details.style.display = details.style.display === 'none' ? 'block' : 'none';
                        }
                    });
                });

                // Event listeners para botones de inscripciones
                document.querySelectorAll('.view-inscriptions-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        if (checkAuth()) {
                            const scheduleId = this.getAttribute('data-schedule-id');
                            openInscriptionsPage(scheduleId);
                        }
                    });
                });

                addDeleteEventListeners();
            })
            .catch(error => {
                console.error('Error:', error);
                document.querySelector('#eventToast .toast-body').textContent = 'Error al cargar los eventos';
                document.getElementById('eventToast').classList.remove('bg-success');
                document.getElementById('eventToast').classList.add('bg-danger');
                eventToast.show();
            });
    }

    // Función para abrir página de inscripciones
    function openInscriptionsPage(scheduleId) {
        if (!checkAuth()) return;
        const url = `/showInscriptions.html?scheduleId=${scheduleId}`;
        window.open(url, '_blank');
    }

    // Función para formatear tiempo
    function formatTime(timeString) {
        if (!timeString) return 'N/A';
        try {
            return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('Error formatting time:', e);
            return timeString;
        }
    }

    // Función para agregar listeners de eliminación
    function addDeleteEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                if (!checkAuth()) return;
                e.stopPropagation();
                if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
                    const eventId = this.getAttribute('data-id');
                    deleteEvent(eventId);
                }
            });
        });
    }

    // Función para eliminar evento
    function deleteEvent(eventId) {
        if (!checkAuth()) return;
        fetch(`/api/events/event/${eventId}`, { 
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            fetchEvents();
            document.querySelector('#eventToast .toast-body').textContent = 'Evento eliminado exitosamente';
            document.getElementById('eventToast').classList.remove('bg-danger');
            document.getElementById('eventToast').classList.add('bg-success');
            eventToast.show();
        })
        .catch(error => {
            console.error('Error:', error);
            document.querySelector('#eventToast .toast-body').textContent = 'Error al eliminar el evento';
            document.getElementById('eventToast').classList.remove('bg-success');
            document.getElementById('eventToast').classList.add('bg-danger');
            eventToast.show();
        });
    }

    // Event listener para el formulario de eventos
    eventForm.addEventListener('submit', function(e) {
        if (!checkAuth()) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        const scheduleInputs = document.querySelectorAll('.schedule-container');
        const capacity = parseInt(document.getElementById('capacity').value);

        if (!capacity || capacity <= 0) {
            document.querySelector('#eventToast .toast-body').textContent = 'La capacidad debe ser un número mayor que 0';
            document.getElementById('eventToast').classList.remove('bg-success');
            document.getElementById('eventToast').classList.add('bg-danger');
            eventToast.show();
            return;
        }

        const schedulesList = Array.from(scheduleInputs).map(container => ({
            startTime: container.querySelector('.schedule-time').value,
            capacity: capacity
        }));

        if (schedulesList.length === 0) {
            document.querySelector('#eventToast .toast-body').textContent = 'Debe agregar al menos un horario';
            document.getElementById('eventToast').classList.remove('bg-success');
            document.getElementById('eventToast').classList.add('bg-danger');
            eventToast.show();
            return;
        }

        const formData = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            author: document.getElementById('author').value,
            location: document.getElementById('location').value,
            photo: document.getElementById('photo').value,
            type: document.getElementById('type').value,
            duration: document.getElementById('duration').value,
            schedules: schedulesList,
            capacity: capacity
        };

        fetch('/api/events/event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            document.querySelector('#eventToast .toast-body').textContent = 'Evento creado exitosamente';
            document.getElementById('eventToast').classList.remove('bg-danger');
            document.getElementById('eventToast').classList.add('bg-success');
            eventToast.show();
            
            eventForm.reset();

            const scheduleContainers = document.querySelectorAll('.schedule-container');
            scheduleContainers.forEach((container, index) => {
                if (index > 0) {
                    container.remove();
                }
            });
            
            fetchEvents();
            modal.style.display = 'block';
        })
        .catch((error) => {
            console.error('Error:', error);
            document.querySelector('#eventToast .toast-body').textContent = 'Error al crear el evento';
            document.getElementById('eventToast').classList.remove('bg-success');
            document.getElementById('eventToast').classList.add('bg-danger');
            eventToast.show();
        });
    });

    // Event listener para agregar horarios
    addScheduleBtn.addEventListener('click', function() {
        if (!checkAuth()) return;
        
        const container = document.createElement('div');
        container.className = 'schedule-container';
        container.innerHTML = `
            <input type="time" class="schedule-time" required>
            <button type="button" class="remove-schedule-btn">X</button>
        `;
        schedules.appendChild(container);

        container.querySelector('.remove-schedule-btn').addEventListener('click', function() {
            schedules.removeChild(container);
        });
    });

    // Agregar listener para recargar la página
    window.addEventListener('beforeunload', () => {
        isAuthenticated = false;
        document.body.classList.remove('authenticated');
    });

    // Mostrar el modal de autenticación al cargar la página
    showAuthModal();
});