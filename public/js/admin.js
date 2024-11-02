document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('eventsModal');
    const showEventsBtn = document.getElementById('showEventsBtn');
    const closeBtn = document.querySelector('.close');
    const eventList = document.getElementById('eventList');
    const eventForm = document.getElementById('eventForm');
    const schedules = document.getElementById('schedules');
    const addScheduleBtn = document.querySelector('.add-schedule-btn');

    showEventsBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        fetchEvents();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    function fetchEvents() {
        fetch('/api/events/get-events')
            .then(response => response.json())
            .then(data => {
                console.log("Datos recibidos:", data);
                const events = Array.isArray(data.data) ? data.data : null;

                if (!events) {
                    throw new Error("La respuesta no es un array de eventos");
                }

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

                // Agregar listeners al botón de ver inscripciones
                document.querySelectorAll('.view-inscriptions-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const scheduleId = this.getAttribute('data-schedule-id');
                        openInscriptionsPage(scheduleId);
                    });
                });

                addDeleteEventListeners();
            })
            .catch(error => console.error('Error:', error));
    }

    // Función para abrir la página de inscripciones en una nueva pestaña
    function openInscriptionsPage(scheduleId) {
        const url = `/showInscriptions.html?scheduleId=${scheduleId}`;
        window.open(url, '_blank'); // Abre en una nueva pestaña
    }

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

    function addDeleteEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
                    const eventId = this.getAttribute('data-id');
                    deleteEvent(eventId);
                }
            });
        });
    }

    function deleteEvent(eventId) {
        fetch(`/api/events/event/${eventId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                fetchEvents();
            })
            .catch(error => console.error('Error:', error));
    }

    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const scheduleInputs = document.querySelectorAll('.schedule-container');
        const capacity = parseInt(document.getElementById('capacity').value);

        if (!capacity || capacity <= 0) {
            alert('La capacidad debe ser un número mayor que 0');
            return;
        }

        const schedulesList = Array.from(scheduleInputs).map(container => ({
            startTime: container.querySelector('.schedule-time').value,
            capacity: capacity
        }));

        if (schedulesList.length === 0) {
            alert('Debe agregar al menos un horario');
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
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            alert('Evento creado exitosamente');
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
            alert('Error al crear el evento');
        });
    });

    addScheduleBtn.addEventListener('click', function() {
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
});