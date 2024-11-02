// Obtener el scheduleId de los parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const scheduleId = urlParams.get('scheduleId');

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

// Llamada a la función para cargar y mostrar las inscripciones
fetchAndRenderInscriptions();