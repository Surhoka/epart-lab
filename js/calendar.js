/*========Calender Js=========*/
/*==========================*/

window.initCalendarPage = function () {
  const calendarWrapper = document.querySelector("#calendar");

  if (calendarWrapper) {
    /*=================*/
    //  Calender Date variable
    /*=================*/
    const newDate = new Date();
    const getDynamicMonth = () => {
      const month = newDate.getMonth() + 1;
      return month < 10 ? `0${month}` : `${month}`;
    };

    /*=================*/
    // Calender Modal Elements
    /*=================*/
    const getModalTitleEl = document.querySelector("#event-title");
    const getModalDescriptionEl = document.querySelector("#event-description");
    const getModalStartDateEl = document.querySelector("#event-start-date");
    const getModalEndDateEl = document.querySelector("#event-end-date");
    const getModalAllDayEl = document.querySelector("#event-all-day");
    const getModalAddBtnEl = document.querySelector(".btn-add-event");
    const getModalUpdateBtnEl = document.querySelector(".btn-update-event");
    const getModalDeleteBtnEl = document.querySelector(".btn-delete-event");
    const calendarsEvents = {
      Danger: "danger",
      Success: "success",
      Primary: "primary",
      Warning: "warning",
    };

    /*=====================*/
    // Helper function to toggle date/time inputs
    /*=====================*/
    const toggleDateTimeInputs = (isAllDay) => {
      if (isAllDay) {
        getModalStartDateEl.type = 'date';
        getModalEndDateEl.type = 'date';
      } else {
        getModalStartDateEl.type = 'datetime-local';
        getModalEndDateEl.type = 'datetime-local';
      }
    };

    getModalAllDayEl.addEventListener('change', () => {
      const isAllDay = getModalAllDayEl.checked;
      toggleDateTimeInputs(isAllDay);
      // Preserve the date part of the value when toggling
      if (getModalStartDateEl.value) {
        getModalStartDateEl.value = getModalStartDateEl.value.slice(0, 10);
      }
      if (getModalEndDateEl.value) {
        getModalEndDateEl.value = getModalEndDateEl.value.slice(0, 10);
      }
    });

    /*=====================*/
    // Calendar Elements and options
    /*=====================*/
    const calendarEl = document.querySelector("#calendar");

    const calendarHeaderToolbar = {
      left: "prev next addEventButton",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    };

    // Initialize Calendar with empty events initially
    const calendar = new FullCalendar.Calendar(calendarEl, {
      selectable: true,
      initialView: "dayGridMonth",
      initialDate: newDate,
      headerToolbar: calendarHeaderToolbar,
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false
      },
      events: [], // Start empty, load via fetch
      select: calendarSelect,
      eventClick: calendarEventClick,
      dateClick: calendarAddEvent,
      customButtons: {
        addEventButton: {
          text: "Add Event +",
          click: calendarAddEvent,
        },
      },
      eventClassNames({ event: calendarEvent }) {
        const getColorValue =
          calendarsEvents[calendarEvent._def.extendedProps.calendar];
        return [`event-fc-color`, `fc-bg-${getColorValue}`];
      },
      eventDidMount: function (info) {
        // Hapus tooltip bawaan browser
        info.el.removeAttribute('title');

        // Tambahkan class untuk trigger hover (sesuai style.css)
        info.el.classList.add('group', 'relative', 'overflow-visible', 'cursor-pointer');

        // Buat elemen tooltip kustom
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip z-50 w-max max-w-[200px] whitespace-normal text-left';

        let content = `<div class="font-semibold">${info.event.title}</div>`;
        if (info.event.extendedProps.description) {
          content += `<div class="mt-1 pt-1 border-t border-white/20 text-xs font-normal opacity-90">${info.event.extendedProps.description}</div>`;
        }

        tooltip.innerHTML = content;
        info.el.appendChild(tooltip);
      },
    });

    /*=====================*/
    // Fetch Events from Backend
    /*=====================*/
    function fetchEvents() {
      if (typeof window.sendDataToGoogle === 'function') {
        // Use specific 'getEvents' action mapped in Admin-Code.gs
        window.sendDataToGoogle('getEvents', {}, (response) => {
          if (response.status === 'success') {
            calendar.removeAllEvents();
            calendar.addEventSource(response.data);
            console.log('Events loaded:', response.data);
          } else {
            console.error('Failed to load events:', response.message);
            if (window.showToast) window.showToast('Failed to load events', 'error');
          }
        });
      } else {
        console.error('sendDataToGoogle function not found. Make sure apps-script.js is loaded.');
      }
    }

    /*=====================*/
    // Modal Functions
    /*=====================*/
    const openModal = () => {
      const modal = document.getElementById("eventModal");
      if (modal) {
        modal.classList.add("show");
        modal.classList.remove("hidden");
        modal.style.display = "";
      }
    };

    const closeModal = () => {
      const modal = document.getElementById("eventModal");
      if (modal) {
        modal.classList.remove("show");
        resetModalFields();
      }
    };

    window.onclick = function (event) {
      const modal = document.getElementById("eventModal");
      if (event.target === modal) {
        closeModal();
      }
    };

    /*=====================*/
    // Calendar Select fn.
    /*=====================*/
    function calendarSelect(info) {
      resetModalFields();
      getModalAddBtnEl.style.display = "flex";
      getModalUpdateBtnEl.style.display = "none";
      if (getModalDeleteBtnEl) getModalDeleteBtnEl.style.display = "none";
      openModal();
      getModalStartDateEl.value = info.startStr;
      getModalEndDateEl.value = info.endStr || info.startStr;
      getModalTitleEl.value = "";
      if (getModalDescriptionEl) getModalDescriptionEl.value = "";
    }

    /*=====================*/
    // Calendar AddEvent fn.
    /*=====================*/
    function calendarAddEvent() {
      const currentDate = new Date();
      const dd = String(currentDate.getDate()).padStart(2, "0");
      const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
      const yyyy = currentDate.getFullYear();
      const combineDate = `${yyyy}-${mm}-${dd}`; // Simplified date format

      getModalAddBtnEl.style.display = "flex";
      getModalUpdateBtnEl.style.display = "none";
      if (getModalDeleteBtnEl) getModalDeleteBtnEl.style.display = "none";

      resetModalFields();
      getModalAllDayEl.checked = true;
      toggleDateTimeInputs(true);

      openModal();
      getModalStartDateEl.value = combineDate;
      getModalEndDateEl.value = combineDate;
    }

    /*=====================*/
    // Calender Event Function
    /*=====================*/
    function calendarEventClick(info) {
      const eventObj = info.event;

      if (eventObj.url) {
        window.open(eventObj.url);
        info.jsEvent.preventDefault();
      } else {
        const getModalEventId = eventObj.id; // Use direct ID
        const getModalEventLevel = eventObj.extendedProps.calendar;
        const getModalCheckedRadioBtnEl = document.querySelector(
          `input[value="${getModalEventLevel}"]`,
        );

        // Set checkbox state and toggle inputs FIRST
        getModalAllDayEl.checked = eventObj.allDay;
        toggleDateTimeInputs(eventObj.allDay);

        getModalTitleEl.value = eventObj.title;
        if (getModalDescriptionEl) getModalDescriptionEl.value = eventObj.extendedProps.description || "";

        // Use different formatting based on allDay status
        if (eventObj.allDay) {
          // For all-day events, `startStr` is just the date (YYYY-MM-DD)
          getModalStartDateEl.value = eventObj.startStr;
          // FullCalendar's end for all-day is exclusive, subtract one day for display
          if (eventObj.end) {
            let endDate = new Date(eventObj.endStr);
            endDate.setDate(endDate.getDate() - 1);
            getModalEndDateEl.value = endDate.toISOString().slice(0, 10);
          } else {
            getModalEndDateEl.value = eventObj.startStr;
          }
        } else {
          // For timed events, use the full datetime string up to minutes
          getModalStartDateEl.value = eventObj.startStr.slice(0, 16);
          getModalEndDateEl.value = eventObj.endStr
            ? eventObj.endStr.slice(0, 16)
            : eventObj.startStr.slice(0, 16);
        }

        if (getModalCheckedRadioBtnEl) {
          getModalCheckedRadioBtnEl.checked = true;
        }
        getModalUpdateBtnEl.dataset.fcEventPublicId = getModalEventId;
        getModalAddBtnEl.style.display = "none";
        getModalUpdateBtnEl.style.display = "block";
        if (getModalDeleteBtnEl) {
          getModalDeleteBtnEl.style.display = "flex";
          getModalDeleteBtnEl.dataset.fcEventPublicId = getModalEventId;
        }
        openModal();
      }
    }

    /*=====================*/
    // Update Calender Event
    /*=====================*/
    getModalUpdateBtnEl.addEventListener("click", () => {
      // Start loading state
      window.setButtonLoading(getModalUpdateBtnEl, true);

      const getPublicID = getModalUpdateBtnEl.dataset.fcEventPublicId;
      const getTitleUpdatedValue = getModalTitleEl.value;
      const getDescriptionValue = getModalDescriptionEl ? getModalDescriptionEl.value : "";
      const setModalStartDateValue = getModalStartDateEl.value;
      const setModalEndDateValue = getModalEndDateEl.value;
      const getModalUpdatedCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked',
      );

      const getModalUpdatedCheckedRadioBtnValue =
        getModalUpdatedCheckedRadioBtnEl
          ? getModalUpdatedCheckedRadioBtnEl.value
          : "";

      const eventData = { // Data for updateEvent
        id: getPublicID,
        title: getTitleUpdatedValue,
        start: setModalStartDateValue,
        end: setModalEndDateValue,
        allDay: getModalAllDayEl.checked,
        extendedProps: {
          calendar: getModalUpdatedCheckedRadioBtnValue,
          description: getDescriptionValue
        },
      };

      if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('updateEvent', eventData, (response) => {
          if (response.status === 'success') {
            const getEvent = calendar.getEventById(getPublicID);
            if (getEvent) {
              getEvent.setProp("title", getTitleUpdatedValue);
              getEvent.setDates(setModalStartDateValue, setModalEndDateValue);
              getEvent.setExtendedProp("calendar", getModalUpdatedCheckedRadioBtnValue);
              getEvent.setExtendedProp("description", getDescriptionValue);
            }

            if (window.showToast) window.showToast('Event updated successfully');
            window.setButtonLoading(getModalUpdateBtnEl, false);
            closeModal();
          } else {
            console.error('Failed to update event:', response.message);
            if (window.showToast) window.showToast('Failed to update event', 'error');
            // Remove loading on error
            window.setButtonLoading(getModalUpdateBtnEl, false);
          }
        });
      } else {
        // Remove loading if function not available
        window.setButtonLoading(getModalUpdateBtnEl, false);
      }
    });

    /*=====================*/
    // Delete Calender Event
    /*=====================*/
    if (getModalDeleteBtnEl) {
      getModalDeleteBtnEl.addEventListener("click", () => {
        const getPublicID = getModalDeleteBtnEl.dataset.fcEventPublicId;
        if (confirm("Are you sure you want to delete this event?")) {
          // Start loading state
          window.setButtonLoading(getModalDeleteBtnEl, true);

          if (typeof window.sendDataToGoogle === 'function') {
            window.sendDataToGoogle('deleteEvent', { id: getPublicID }, (response) => {
              if (response.status === 'success') {
                const getEvent = calendar.getEventById(getPublicID);
                if (getEvent) {
                  getEvent.remove();
                }

                if (window.showToast) window.showToast('Event deleted successfully');
                window.setButtonLoading(getModalDeleteBtnEl, false);
                closeModal();
              } else {
                console.error('Failed to delete event:', response.message);
                if (window.showToast) window.showToast('Failed to delete event', 'error');
                // Remove loading on error
                window.setButtonLoading(getModalDeleteBtnEl, false);
              }
            });
          } else {
            // Remove loading if function not available
            window.setButtonLoading(getModalDeleteBtnEl, false);
          }
        }
      });
    }

    /*=====================*/
    // Add Calender Event
    /*=====================*/
    getModalAddBtnEl.addEventListener("click", () => {
      // Start loading state
      window.setButtonLoading(getModalAddBtnEl, true);

      const getModalCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked',
      );

      const getTitleValue = getModalTitleEl.value;
      const getDescriptionValue = getModalDescriptionEl ? getModalDescriptionEl.value : "";
      const setModalStartDateValue = getModalStartDateEl.value;
      const setModalEndDateValue = getModalEndDateEl.value;
      const getModalCheckedRadioBtnValue = getModalCheckedRadioBtnEl
        ? getModalCheckedRadioBtnEl.value
        : "Primary"; // Default to Primary if none selected

      const tempId = Date.now().toString();
      const eventData = { // Data for createEvent
        id: tempId,
        title: getTitleValue,
        start: setModalStartDateValue,
        end: setModalEndDateValue,
        allDay: getModalAllDayEl.checked, // Set allDay from checkbox
        extendedProps: {
          calendar: getModalCheckedRadioBtnValue,
          description: getDescriptionValue
        },
        description: getDescriptionValue,
      };

      if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('createEvent', eventData, (response) => {
          if (response.status === 'success') {
            // Use the ID returned from server if available, otherwise tempId
            const finalId = response.data && response.data.id ? response.data.id : tempId;
            eventData.id = finalId;

            calendar.addEvent(eventData);

            if (window.showToast) window.showToast('Event created successfully');
            window.setButtonLoading(getModalAddBtnEl, false);
            closeModal();
          } else {
            console.error('Failed to create event:', response.message);
            if (window.showToast) window.showToast('Failed to create event', 'error');
            // Remove loading on error
            window.setButtonLoading(getModalAddBtnEl, false);
          }
        });
      } else {
        // Remove loading if function not available
        window.setButtonLoading(getModalAddBtnEl, false);
      }
    });

    /*=====================*/
    // Calendar Init
    /*=====================*/
    calendar.render();
    fetchEvents(); // Load events on init

    // Reset modal fields when hidden
    document.getElementById("eventModal").addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-close-btn")) {
        closeModal();
      }
    });

    function resetModalFields() {
      getModalTitleEl.value = "";
      if (getModalDescriptionEl) getModalDescriptionEl.value = "";
      getModalStartDateEl.value = "";
      getModalEndDateEl.value = "";
      getModalAllDayEl.checked = false; // Reset checkbox
      toggleDateTimeInputs(false); // Reset input types
      const getModalIfCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked',
      );
      if (getModalIfCheckedRadioBtnEl) {
        getModalIfCheckedRadioBtnEl.checked = false;
      }
    }

    document.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    window.addEventListener("click", (event) => {
      if (event.target === document.getElementById("eventModal")) {
        closeModal();
      }
    });
  }
};
