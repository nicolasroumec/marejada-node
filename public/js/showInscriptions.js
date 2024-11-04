// Obtener el scheduleId de los parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const scheduleId = urlParams.get('scheduleId');

// Función para obtener y mostrar el título de la página
function fetchAndRenderTitle() {
    fetch(`/api/inscriptions/schedules-events/${scheduleId}`)
        .then(response => {
            if (!response.ok) throw new Error('Error al obtener el título');
            return response.json();
        })
        .then(data => {
            const titleElement = document.querySelector('h2');
            const startTime = data.scheduleInfo.start_time.split(':').slice(0, 2).join(':'); // Solo horas y minutos
            titleElement.textContent = `Inscripciones para el evento ${data.scheduleInfo.event_name} a las ${startTime}`;
        })
        .catch(error => console.error('Error al obtener el título:', error));
}

// Función para obtener y renderizar inscripciones
function fetchAndRenderInscriptions() {
    fetch(`/api/inscriptions/schedule/${scheduleId}`)
        .then(response => response.json())
        .then(data => {
            const inscriptionList = document.getElementById('inscriptionList');
            const inscriptions = data.inscriptions;


            if (inscriptions && inscriptions.length > 0) {
                inscriptions.forEach(inscription => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${inscription.first_name} ${inscription.last_name} - ${inscription.school} - Año: ${inscription.year} - Curso: ${inscription.course}`;
                    inscriptionList.appendChild(listItem);
                });
            } else {
                inscriptionList.innerHTML = '<li>No hay inscripciones en este horario</li>';
            }
        })
        .catch(error => console.error('Error al obtener inscripciones:', error));
}

// Llamadas a las funciones para cargar el título y las inscripciones
fetchAndRenderTitle();
fetchAndRenderInscriptions();

