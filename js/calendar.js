// calendar.js
function initCalendarPage() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl || typeof FullCalendar === 'undefined') {
        console.error("Calendar element not found or FullCalendar library not loaded.");
        return;
    }

    const modal = document.getElementById('calendarModal');
    const closeBtn = document.getElementById('closeCalendarModal');
    const cancelBtn = document.getElementById('cancelEvent');
    const deleteBtn = document.getElementById('deleteEvent');
    const form = document.getElementById('eventForm');
    const titleInput = document.getElementById('eventTitle');
    const startInput = document.getElementById('eventStart');
    const endInput = document.getElementById('eventEnd');
    const modalTitle = document.getElementById('modalTitle');

    let selectedEvent = null;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        // Mengambil events dari Google Apps Script
        events: function(fetchInfo, successCallback, failureCallback) {
            const callbackName = 'jsonp_callback_events_' + Math.round(100000 * Math.random());
            window[callbackName] = function(data) {
                delete window[callbackName];
                document.body.removeChild(script);
                successCallback(data.events);
                // Check if there are any events and apply highlight
                const navCalendarLink = document.getElementById('nav-calendar');
                if (navCalendarLink) {
                    if (data.events && data.events.length > 0) {
                        navCalendarLink.classList.add('nav-calendar-highlight');
                    } else {
                        navCalendarLink.classList.remove('nav-calendar-highlight');
                    }
                }
            };

            const script = document.createElement('script');
            script.src = appsScriptUrl + `?action=read&callback=${callbackName}`;
            script.onerror = function() {
                delete window[callbackName];
                document.body.removeChild(script);
                failureCallback(new Error('Error fetching events from Google Apps Script.'));
                const navCalendarLink = document.getElementById('nav-calendar');
                if (navCalendarLink) {
                    navCalendarLink.classList.remove('nav-calendar-highlight');
                }
            };
            document.body.appendChild(script);
        },
        selectable: true,
        select: function(info) {
            selectedEvent = null;
            form.reset();
            startInput.value = info.startStr;
            endInput.value = info.endStr || info.startStr;
            modalTitle.textContent = 'Add Event';
            if(deleteBtn) deleteBtn.classList.add('hidden');
            openModal();
        },
        eventClick: function(info) {
            selectedEvent = info.event;
            titleInput.value = info.event.title;
            startInput.value = info.event.startStr;
            endInput.value = info.event.endStr || '';
            modalTitle.textContent = 'Edit Event';
            if(deleteBtn) deleteBtn.classList.remove('hidden');
            openModal();
        }
    });

    calendar.render();

    function openModal() { if(modal) modal.classList.remove('hidden'); }
    function closeModal() { if(modal) modal.classList.add('hidden'); }

    if(closeBtn) closeBtn.onclick = closeModal;
    if(cancelBtn) cancelBtn.onclick = closeModal;

    if(deleteBtn) {
        deleteBtn.onclick = function() {
            if (selectedEvent) {
                if (confirm('Are you sure you want to delete this event?')) {
                    sendDataToGoogle('delete', { id: selectedEvent.id }, function(response) {
                        if(response.status === 'success'){
                            calendar.refetchEvents();
                            closeModal();
                            showToast('Event berhasil dihapus!', 'success');
                        } else {
                            showToast('Error menghapus event: ' + response.message, 'error');
                        }
                    });
                }
            }
        }
    }

    if(form) form.onsubmit = function(e) {
        e.preventDefault();
        const eventData = {
            title: titleInput.value,
            start: startInput.value,
            end: endInput.value || ''
        };

        if (selectedEvent) {
            // Update event
            eventData.id = selectedEvent.id;
            sendDataToGoogle('update', eventData, function(response){
                if(response.status === 'success'){
                    calendar.refetchEvents();
                    closeModal();
                    showToast('Event berhasil diperbarui!', 'success');
                } else {
                    showToast('Error memperbarui event: ' + response.message, 'error');
                }
            });
        } else {
            // Create new event
            eventData.id = 'evt' + Date.now(); // Generate a temporary unique ID
            sendDataToGoogle('create', eventData, function(response){
                 if(response.status === 'success'){
                    calendar.refetchEvents();
                    closeModal();
                    showToast('Event berhasil dibuat!', 'success');
                } else {
                    showToast('Error membuat event: ' + response.message, 'error');
                }
            });
        }
    };
}
