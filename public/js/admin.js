document.addEventListener('DOMContentLoaded', () => {
    const showEventsBtn = document.getElementById('showEventsBtn');
    const eventList = document.getElementById('eventList');
    const eventForm = document.getElementById('eventForm');
    const schedules = document.getElementById('schedules');
    const addScheduleBtn = document.querySelector('.add-schedule-btn');

    showEventsBtn.addEventListener('click', fetchEvents);
    eventForm.addEventListener('submit', createEvent);
    addScheduleBtn.addEventListener('click', addScheduleInput);

    function fetchEvents() {
        fetch('/admin/events')
            .then(response => response.json())
            .then(events => {
                eventList.innerHTML = '';
                events.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event-item';
                    eventElement.innerHTML = `
                        <span>${event.name}</span>
                        <button class="delete-btn" data-id="${event.id}">X</button>
                    `;
                    eventList.appendChild(eventElement);
                });
                eventList.style.display = 'block';
                addDeleteEventListeners();
            })
            .catch(error => console.error('Error:', error));
    }

    function addDeleteEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const eventId = this.getAttribute('data-id');
                deleteEvent(eventId);
            });
        });
    }

    function deleteEvent(eventId) {
        fetch(`/admin/events/${eventId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                fetchEvents();
            })
            .catch(error => console.error('Error:', error));
    }

    function createEvent(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            author: document.getElementById('author').value,
            location: document.getElementById('location').value,
            photo: document.getElementById('photo').value,
            capacity: document.getElementById('capacity').value,
            schedules: Array.from(document.querySelectorAll('.schedule-time')).map(input => ({
                startTime: input.value
            }))
        };

        fetch('/admin/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            eventForm.reset();
            fetchEvents();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    function addScheduleInput() {
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
    }
});