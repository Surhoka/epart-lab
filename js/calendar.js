const registerCalendarPage = () => {
  if (window.Alpine && !window.Alpine.data('calendarPage')) {
    window.Alpine.data('calendarPage', () => ({
      calendar: null,
      isModalOpen: false,
      modalMode: 'add', // 'add' or 'edit'
      editingEvent: {
        id: null,
        title: '',
        start: '',
        end: '',
        allDay: false,
        description: '',
        className: 'Primary' // Default color
      },

      init() {
        console.log("Calendar Page Initialized with Alpine Component.");
        const calendarEl = this.$refs.calendar;
        if (!calendarEl) {
          console.error("Calendar element not found!");
          return;
        }

        this.calendar = new FullCalendar.Calendar(calendarEl, {
          selectable: true,
          initialView: 'dayGridMonth',
          headerToolbar: {
            left: 'prev,next today addEventButton',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          },
          events: this.fetchEvents.bind(this),
          select: this.handleDateSelect.bind(this),
          eventClick: this.handleEventClick.bind(this),
          customButtons: {
            addEventButton: {
              text: 'Add Event',
              click: () => this.openModalForNew()
            }
          },
          eventClassNames: ({ event }) => {
            const colorMap = { 'Primary': 'primary', 'Success': 'success', 'Warning': 'warning', 'Danger': 'danger' };
            const color = colorMap[event.extendedProps.calendar] || 'primary';
            return [`event-fc-color`, `fc-bg-${color}`];
          },
          eventDidMount: (info) => {
            info.el.removeAttribute('title');
            info.el.classList.add('group', 'relative', 'overflow-visible', 'cursor-pointer');
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip z-50 w-max max-w-[200px] whitespace-normal text-left';
            let content = `<div class="font-semibold">${info.event.title}</div>`;
            if (info.event.extendedProps.description) {
              content += `<div class="mt-1 pt-1 border-t border-white/20 text-xs font-normal opacity-90">${info.event.extendedProps.description}</div>`;
            }
            tooltip.innerHTML = content;
            info.el.appendChild(tooltip);
          }
        });

        this.calendar.render();
      },

      fetchEvents(fetchInfo, successCallback, failureCallback) {
        window.sendDataToGoogle('getEvents', {}, (response) => {
          if (response.status === 'success') {
            successCallback(response.data);
          } else {
            // Auto-fix: Create table if missing
            if (response.message && response.message.includes('Sheet Events tidak ditemukan')) {
              console.warn('Events table missing. Auto-creating...');
              this.createEventsTable(successCallback, failureCallback);
              return;
            }
            failureCallback(new Error(response.message));
            window.showToast('Failed to load events', 'error');
          }
        }, (error) => {
          failureCallback(error);
          window.showToast('API error loading events', 'error');
        });
      },

      createEventsTable(successCallback, failureCallback) {
        window.sendDataToGoogle('createTable', {
          tableName: 'Events',
          columns: ['id', 'title', 'start', 'end', 'allDay', 'description', 'calendar']
        }, (res) => {
          if (res.status === 'success') {
            window.showToast('Events table initialized.', 'success');
            successCallback([]);
          } else {
            window.showToast('Failed to init Events table: ' + res.message, 'error');
            failureCallback(new Error(res.message));
          }
        }, (err) => {
          failureCallback(err);
        });
      },

      handleDateSelect(info) {
        this.modalMode = 'add';
        this.editingEvent = {
          id: null,
          title: '',
          start: info.allDay ? info.startStr : info.startStr.slice(0, 16),
          end: info.allDay ? info.endStr : info.endStr.slice(0, 16),
          allDay: info.allDay,
          description: '',
          className: 'Primary'
        };
        this.isModalOpen = true;
      },

      handleEventClick(info) {
        this.modalMode = 'edit';
        const event = info.event;
        this.editingEvent = {
          id: event.id,
          title: event.title,
          start: event.allDay ? event.startStr : (event.start ? event.start.toISOString().slice(0, 16) : ''),
          end: event.allDay ? (event.end ? new Date(event.end.valueOf() - 86400000).toISOString().slice(0, 10) : event.startStr) : (event.end ? event.end.toISOString().slice(0, 16) : ''),
          allDay: event.allDay,
          description: event.extendedProps.description || '',
          className: event.extendedProps.calendar || 'Primary'
        };
        this.isModalOpen = true;
      },

      openModalForNew() {
        this.modalMode = 'add';
        const today = new Date().toISOString().slice(0, 10);
        this.editingEvent = {
          id: null, title: '', start: today, end: today,
          allDay: true, description: '', className: 'Primary'
        };
        this.isModalOpen = true;
      },

      closeModal() {
        this.isModalOpen = false;
      },

      async saveEvent(button) {
        if (!this.editingEvent.title) {
          window.showToast('Event title is required.', 'warning');
          return;
        }
        window.setButtonLoading(button, true);

        const payload = {
          id: this.editingEvent.id,
          title: this.editingEvent.title,
          start: this.editingEvent.start,
          end: this.editingEvent.end,
          allDay: this.editingEvent.allDay,
          extendedProps: {
            calendar: this.editingEvent.className,
            description: this.editingEvent.description
          },
          description: this.editingEvent.description
        };

        const action = this.modalMode === 'add' ? 'createEvent' : 'updateEvent';

        window.sendDataToGoogle(action, payload, (res) => {
          window.setButtonLoading(button, false);
          if (res.status === 'success') {
            window.showToast(`Event ${this.modalMode === 'add' ? 'created' : 'updated'}!`, 'success');
            this.calendar.refetchEvents();
            this.closeModal();
          } else {
            window.showToast(`Error: ${res.message}`, 'error');
          }
        }, (err) => {
          window.setButtonLoading(button, false);
          window.showToast('API Error while saving event.', 'error');
        });
      },

      async deleteEvent(button) {
        if (!confirm('Are you sure you want to delete this event?')) return;
        window.setButtonLoading(button, true);

        window.sendDataToGoogle('deleteEvent', { id: this.editingEvent.id }, (res) => {
          window.setButtonLoading(button, false);
          if (res.status === 'success') {
            window.showToast('Event deleted!', 'success');
            this.calendar.refetchEvents();
            this.closeModal();
          } else {
            window.showToast(`Error: ${res.message}`, 'error');
          }
        }, (err) => {
          window.setButtonLoading(button, false);
          window.showToast('API Error while deleting event.', 'error');
        });
      },

      toggleAllDay() {
        if (this.editingEvent.allDay) {
          // If switching to all-day, keep only the date part
          if (this.editingEvent.start) this.editingEvent.start = this.editingEvent.start.slice(0, 10);
          if (this.editingEvent.end) this.editingEvent.end = this.editingEvent.end.slice(0, 10);
        }
        // If switching to timed, the input type change will handle it.
      }
    }));
  }
};

// Immediate registration or wait for Alpine
if (window.Alpine) {
  registerCalendarPage();
} else {
  document.addEventListener('alpine:init', registerCalendarPage);
}