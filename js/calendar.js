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
        
        // Check if FullCalendar is available
        if (typeof FullCalendar === 'undefined') {
          console.error("FullCalendar library not loaded!");
          this.showError("Calendar library not available. Please refresh the page.");
          return;
        }

        const calendarEl = this.$refs.calendar;
        if (!calendarEl) {
          console.error("Calendar element not found!");
          this.showError("Calendar container not found.");
          return;
        }

        try {
          this.calendar = new FullCalendar.Calendar(calendarEl, {
            selectable: true,
            initialView: 'dayGridMonth',
            height: 'auto',
            aspectRatio: 1.8,
            headerToolbar: {
              left: 'prev,next today',
              center: 'title',
              right: 'addEventButton dayGridMonth,timeGridWeek,timeGridDay'
            },
            buttonText: {
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day'
            },
            events: this.fetchEvents.bind(this),
            select: this.handleDateSelect.bind(this),
            eventClick: this.handleEventClick.bind(this),
            customButtons: {
              addEventButton: {
                text: '+ Add Event',
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
            },
            loading: (isLoading) => {
              console.log('Calendar loading state:', isLoading);
            },
            dayMaxEvents: 3,
            moreLinkClick: 'popover',
            eventDisplay: 'block',
            displayEventTime: true,
            eventTimeFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            },
            // Ensure proper rendering
            viewDidMount: () => {
              console.log('Calendar view mounted successfully');
            },
            // Add theme class to calendar
            themeSystem: 'standard'
          });

          this.calendar.render();
          
          // Apply additional styling after render
          setTimeout(() => {
            const calendarEl = this.$refs.calendar;
            if (calendarEl) {
              // Add theme classes
              calendarEl.classList.add('fc-theme-ezyparts');
              
              // Ensure proper font family
              const fcEl = calendarEl.querySelector('.fc');
              if (fcEl) {
                fcEl.style.fontFamily = 'Outfit, sans-serif';
              }
            }
          }, 100);
          
          console.log("Calendar rendered successfully.");
        } catch (error) {
          console.error("Error initializing calendar:", error);
          this.showError("Failed to initialize calendar: " + error.message);
        }
      },

      showError(message) {
        const calendarEl = this.$refs.calendar;
        if (calendarEl) {
          calendarEl.innerHTML = `
            <div class="flex items-center justify-center min-h-[400px] text-center p-8">
              <div>
                <div class="w-16 h-16 mx-auto mb-4 text-red-500">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Calendar Error</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">${message}</p>
                <button onclick="window.location.reload()" class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
                  Reload Page
                </button>
              </div>
            </div>
          `;
        }
      },

      fetchEvents(fetchInfo, successCallback, failureCallback) {
        console.log('Fetching events...');
        
        // Check if API function exists
        if (typeof window.sendDataToGoogle !== 'function') {
          console.warn('sendDataToGoogle function not available, using fallback data');
          // Provide fallback empty events to prevent hanging
          successCallback([]);
          return;
        }

        // Add timeout to prevent hanging
        let timeoutId = setTimeout(() => {
          console.error('Event fetch timeout');
          failureCallback(new Error('Request timeout'));
          if (window.showToast) {
            window.showToast('Calendar data loading timeout', 'warning');
          }
        }, 10000); // 10 second timeout

        try {
          window.sendDataToGoogle('getEvents', {}, (response) => {
            clearTimeout(timeoutId);
            console.log('Events response:', response);
            
            if (response && response.status === 'success') {
              successCallback(response.data || []);
            } else {
              console.warn('Events fetch failed:', response?.message);
              failureCallback(new Error(response?.message || 'Failed to load events'));
              if (window.showToast) {
                window.showToast('Failed to load events', 'error');
              }
            }
          }, (error) => {
            clearTimeout(timeoutId);
            console.error('Events API error:', error);
            failureCallback(error);
            if (window.showToast) {
              window.showToast('API error loading events', 'error');
            }
          });
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('Exception in fetchEvents:', error);
          failureCallback(error);
          if (window.showToast) {
            window.showToast('Error loading calendar events', 'error');
          }
        }
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
          if (window.showToast) {
            window.showToast('Event title is required.', 'warning');
          }
          return;
        }

        // Check if API function exists
        if (typeof window.sendDataToGoogle !== 'function') {
          if (window.showToast) {
            window.showToast('API not available. Please refresh the page.', 'error');
          }
          return;
        }

        if (window.setButtonLoading) {
          window.setButtonLoading(button, true);
        }

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

        try {
          window.sendDataToGoogle(action, payload, (res) => {
            if (window.setButtonLoading) {
              window.setButtonLoading(button, false);
            }
            if (res && res.status === 'success') {
              if (window.showToast) {
                window.showToast(`Event ${this.modalMode === 'add' ? 'created' : 'updated'}!`, 'success');
              }
              if (this.calendar) {
                this.calendar.refetchEvents();
              }
              this.closeModal();
            } else {
              if (window.showToast) {
                window.showToast(`Error: ${res?.message || 'Unknown error'}`, 'error');
              }
            }
          }, (err) => {
            if (window.setButtonLoading) {
              window.setButtonLoading(button, false);
            }
            if (window.showToast) {
              window.showToast('API Error while saving event.', 'error');
            }
          });
        } catch (error) {
          if (window.setButtonLoading) {
            window.setButtonLoading(button, false);
          }
          if (window.showToast) {
            window.showToast('Error saving event: ' + error.message, 'error');
          }
        }
      },

      async deleteEvent(button) {
        if (!confirm('Are you sure you want to delete this event?')) return;

        // Check if API function exists
        if (typeof window.sendDataToGoogle !== 'function') {
          if (window.showToast) {
            window.showToast('API not available. Please refresh the page.', 'error');
          }
          return;
        }

        if (window.setButtonLoading) {
          window.setButtonLoading(button, true);
        }

        try {
          window.sendDataToGoogle('deleteEvent', { id: this.editingEvent.id }, (res) => {
            if (window.setButtonLoading) {
              window.setButtonLoading(button, false);
            }
            if (res && res.status === 'success') {
              if (window.showToast) {
                window.showToast('Event deleted!', 'success');
              }
              if (this.calendar) {
                this.calendar.refetchEvents();
              }
              this.closeModal();
            } else {
              if (window.showToast) {
                window.showToast(`Error: ${res?.message || 'Unknown error'}`, 'error');
              }
            }
          }, (err) => {
            if (window.setButtonLoading) {
              window.setButtonLoading(button, false);
            }
            if (window.showToast) {
              window.showToast('API Error while deleting event.', 'error');
            }
          });
        } catch (error) {
          if (window.setButtonLoading) {
            window.setButtonLoading(button, false);
          }
          if (window.showToast) {
            window.showToast('Error deleting event: ' + error.message, 'error');
          }
        }
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