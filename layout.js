import { getFooterHtml } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab/footer.js';

export function getAppLayoutHtml(contentHtml) {
  return `
    <div class="min-h-screen xl:flex">
      <!-- Sidebar -->
      <div id="app-sidebar">
        <!-- Sidebar content will go here -->
        <aside class="absolute left-0 top-0 z-99999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-white duration-300 ease-linear dark:bg-gray-900 lg:static lg:translate-x-0">
          <div class="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
            <a href="index.html">
              <img class="dark:hidden" src="../TailAdmin/public/images/logo/logo.svg" alt="Logo" />
              <img class="hidden dark:block" src="../TailAdmin/public/images/logo/logo-dark.svg" alt="Logo" />
            </a>
            <button id="sidebar-close-button" class="block lg:hidden">
              <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 4.29289C4.68342 3.90237 5.31658 3.90237 5.70711 4.29289L10 8.58579L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L11.4142 10L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L10 11.4142L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L8.58579 10L4.29289 5.70711C3.90237 5.31658 3.90237 4.68342 4.29289 4.29289Z" />
              </svg>
            </button>
          </div>
          <div class="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
            <nav class="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
              <div>
                <h3 class="mb-4 ml-4 text-sm font-semibold text-gray-400">MENU</h3>
                <ul class="mb-6 flex flex-col gap-1.5">
                  <li>
                    <a href="#" onclick="loadPage('home')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('profile')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Profile
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('calendar')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Calendar
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('form-elements')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Forms
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('basic-tables')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Tables
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('alerts')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Alerts
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('avatars')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Avatars
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('badge')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Badges
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('buttons')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Buttons
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('images')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Images
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('videos')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Videos
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('line-chart')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Line Chart
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('bar-chart')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Bar Chart
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('signin')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Sign In
                    </a>
                  </li>
                  <li>
                    <a href="#" onclick="loadPage('signup')" class="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-gray-700 duration-300 ease-in-out hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                      Sign Up
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </aside>
      </div>

      <!-- Main Content -->
      <div class="flex-1 transition-all duration-300 ease-in-out lg:ml-[90px]">
        <!-- Header -->
        <header class="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
          <div class="flex flex-col items-center justify-between flex-grow lg:flex-row lg:px-6">
            <div class="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
              <button id="sidebar-toggle-button" class="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border" aria-label="Toggle Sidebar">
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
                </svg>
              </button>

              <a href="index.html" class="lg:hidden">
                <img class="dark:hidden" src="../TailAdmin/public/images/logo/logo.svg" alt="Logo" />
                <img class="hidden dark:block" src="../TailAdmin/public/images/logo/logo-dark.svg" alt="Logo" />
              </a>

              <button id="application-menu-toggle" class="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z" fill="currentColor" />
                </svg>
              </button>

              <div class="hidden lg:block">
                <form>
                  <div class="relative">
                    <span class="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                      <svg class="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="" />
                      </svg>
                    </span>
                    <input type="text" placeholder="Search or type command..." class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]" />
                    <button class="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                      <span> ⌘ </span>
                      <span> K </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div id="application-menu" class="hidden items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none">
              <div class="flex items-center gap-2 2xsm:gap-3">
                <!-- Dark Mode Toggler -->
                <button id="theme-toggle-button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-800">
                  <svg class="hidden dark:block" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3.33334C6.31818 3.33334 3.33334 6.31818 3.33334 10C3.33334 13.6818 6.31818 16.6667 10 16.6667C13.6818 16.6667 16.6667 13.6818 16.6667 10C16.6667 6.31818 13.6818 3.33334 10 3.33334ZM10 15.1667C7.10075 15.1667 4.83334 12.8993 4.83334 10C4.83334 7.10075 7.10075 4.83334 10 4.83334C12.8993 4.83334 15.1667 7.10075 15.1667 10C15.1667 12.8993 12.8993 15.1667 10 15.1667Z" fill="currentColor" />
                  </svg>
                  <svg class="dark:hidden" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 15.8333C13.2217 15.8333 15.8333 13.2217 15.8333 10C15.8333 6.77827 13.2217 4.16667 10 4.16667C6.77827 4.16667 4.16667 6.77827 4.16667 10C4.16667 13.2217 6.77827 15.8333 10 15.8333ZM10 14.1667C12.3012 14.1667 14.1667 12.3012 14.1667 10C14.1667 7.69882 12.3012 5.83334 10 5.83334C7.69882 5.83334 5.83334 7.69882 5.83334 10C5.83334 12.3012 7.69882 14.1667 10 14.1667Z" fill="currentColor" />
                    <path d="M10 0.833344C10.4602 0.833344 10.8333 1.20645 10.8333 1.66668V3.33334C10.8333 3.79357 10.4602 4.16668 10 4.16668C9.53976 4.16668 9.16667 3.79357 9.16667 3.33334V1.66668C9.16667 1.20645 9.53976 0.833344 10 0.833344Z" fill="currentColor" />
                    <path d="M10 15.8333C10.4602 15.8333 10.8333 16.2065 10.8333 16.6667V18.3333C10.8333 18.7936 10.4602 19.1667 10 19.1667C9.53976 19.1667 9.16667 18.7936 9.16667 18.3333V16.6667C9.16667 16.2065 9.53976 15.8333 10 15.8333Z" fill="currentColor" />
                    <path d="M16.6667 9.16667H18.3333C18.7936 9.16667 19.1667 9.53976 19.1667 10C19.1667 10.4602 18.7936 10.8333 18.3333 10.8333H16.6667C16.2065 10.8333 15.8333 10.4602 15.8333 10C15.8333 9.53976 16.2065 9.16667 16.6667 9.16667Z" fill="currentColor" />
                    <path d="M1.66667 9.16667H3.33334C3.79357 9.16667 4.16667 9.53976 4.16667 10C4.16667 10.4602 3.79357 10.8333 3.33334 10.8333H1.66667C1.20645 10.8333 0.833344 10.4602 0.833344 10C0.833344 9.53976 1.20645 9.16667 1.66667 9.16667Z" fill="currentColor" />
                    <path d="M14.2929 5.70711C14.6834 5.31658 14.6834 4.68342 14.2929 4.29289C13.9024 3.90237 13.2693 3.90237 12.8787 4.29289L11.7071 5.46447C11.3166 5.85499 11.3166 6.48816 11.7071 6.87868C12.0976 7.26921 12.7308 7.26921 13.1213 6.87868L14.2929 5.70711Z" fill="currentColor" />
                    <path d="M5.70711 14.2929C5.31658 14.6834 5.31658 15.3166 5.70711 15.7071C6.09763 16.0976 6.7308 16.0976 7.12132 15.7071L8.29289 14.5355C8.68342 14.145 8.68342 13.5118 8.29289 13.1213C7.90237 12.7308 7.26921 12.7308 6.87868 13.1213L5.70711 14.2929Z" fill="currentColor" />
                    <path d="M14.2929 14.2929C13.9024 14.6834 13.2693 14.6834 12.8787 14.2929L11.7071 13.1213C11.3166 12.7308 11.3166 12.0976 11.7071 11.7071C12.0976 11.3166 12.7308 11.3166 13.1213 11.7071L14.2929 12.8787C14.6834 13.2692 14.6834 13.9024 14.2929 14.2929Z" fill="currentColor" />
                    <path d="M5.70711 5.70711C6.09763 5.31658 6.7308 5.31658 7.12132 5.70711L8.29289 6.87868C8.68342 7.26921 8.68342 7.90237 8.29289 8.29289C7.90237 8.68342 7.26921 8.68342 6.87868 8.29289L5.70711 7.12132C5.31658 6.7308 5.31658 6.09763 5.70711 5.70711Z" fill="currentColor" />
                  </svg>
                </button>
                <!-- Notification Dropdown (simplified) -->
                <div class="relative">
                  <button id="notification-dropdown-toggle" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-800">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 1.66666C5.39763 1.66666 1.66666 5.39763 1.66666 10C1.66666 14.6024 5.39763 18.3333 10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66666 10 1.66666ZM10 16.6667C6.31818 16.6667 3.33333 13.6818 3.33333 10C3.33333 6.31818 6.31818 3.33333 10 3.33333C13.6818 3.33333 16.6667 6.31818 16.6667 10C16.6667 13.6818 13.6818 16.6667 10 16.6667Z" fill="currentColor" />
                    </svg>
                  </button>
                  <div id="notification-dropdown-menu" class="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden">
                    <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Notification 1</a>
                      <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Notification 2</a>
                    </div>
                  </div>
                </div>
              </div>
              <!-- User Area (simplified) -->
              <div class="relative">
                <button id="user-dropdown-toggle" class="flex items-center gap-4">
                  <span class="hidden text-right lg:block">
                    <span class="block text-sm font-medium text-gray-800 dark:text-white">Thomas Anree</span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400">UX Designer</span>
                  </span>
                  <span class="h-12 w-12 rounded-full">
                    <img src="../TailAdmin/public/images/user/user-01.png" alt="User" class="h-full w-full rounded-full object-cover" />
                  </span>
                </button>
                <div id="user-dropdown-menu" class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden">
                  <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">My Profile</a>
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Settings</a>
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Log Out</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div id="page-content" class="p-4 mx-auto max-w-screen-2xl md:p-6">
          ${contentHtml}
        </div>
        ${getFooterHtml()}
      </div>
    </div>
  `;
}

export function initializeLayout() {
  const sidebarToggleButton = document.getElementById('sidebar-toggle-button');
  const sidebarCloseButton = document.getElementById('sidebar-close-button');
  const appSidebar = document.getElementById('app-sidebar');
  const applicationMenuToggle = document.getElementById('application-menu-toggle');
  const applicationMenu = document.getElementById('application-menu');
  const themeToggleButton = document.getElementById('theme-toggle-button');
  const notificationDropdownToggle = document.getElementById('notification-dropdown-toggle');
  const notificationDropdownMenu = document.getElementById('notification-dropdown-menu');
  const userDropdownToggle = document.getElementById('user-dropdown-toggle');
  const userDropdownMenu = document.getElementById('user-dropdown-menu');

  let isSidebarExpanded = false;
  let isMobileSidebarOpen = false;
  let isApplicationMenuOpen = false;
  let isNotificationDropdownOpen = false;
  let isUserDropdownOpen = false;

  function toggleSidebar() {
    isSidebarExpanded = !isSidebarExpanded;
    if (isSidebarExpanded) {
      appSidebar.style.width = '290px';
      document.querySelector('.flex-1').classList.add('lg:ml-[290px]');
      document.querySelector('.flex-1').classList.remove('lg:ml-[90px]');
    } else {
      appSidebar.style.width = '90px';
      document.querySelector('.flex-1').classList.remove('lg:ml-[290px]');
      document.querySelector('.flex-1').classList.add('lg:ml-[90px]');
    }
  }

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
    if (isMobileSidebarOpen) {
      appSidebar.classList.remove('hidden');
      appSidebar.classList.add('block');
    } else {
      appSidebar.classList.remove('block');
      appSidebar.classList.add('hidden');
    }
  }

  sidebarToggleButton?.addEventListener('click', () => {
    if (window.innerWidth >= 991) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  });

  sidebarCloseButton?.addEventListener('click', () => {
    toggleMobileSidebar();
  });

  applicationMenuToggle?.addEventListener('click', () => {
    isApplicationMenuOpen = !isApplicationMenuOpen;
    if (isApplicationMenuOpen) {
      applicationMenu.classList.remove('hidden');
      applicationMenu.classList.add('flex');
    } else {
      applicationMenu.classList.remove('flex');
      applicationMenu.classList.add('hidden');
    }
  });

  themeToggleButton?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });

  notificationDropdownToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    isNotificationDropdownOpen = !isNotificationDropdownOpen;
    if (isNotificationDropdownOpen) {
      notificationDropdownMenu.classList.remove('hidden');
    } else {
      notificationDropdownMenu.classList.add('hidden');
    }
  });

  userDropdownToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    isUserDropdownOpen = !isUserDropdownOpen;
    if (isUserDropdownOpen) {
      userDropdownMenu.classList.remove('hidden');
    } else {
      userDropdownMenu.classList.add('hidden');
    }
  });

  document.addEventListener('click', (event) => {
    if (notificationDropdownMenu && !notificationDropdownMenu.contains(event.target) && !notificationDropdownToggle.contains(event.target)) {
      notificationDropdownMenu.classList.add('hidden');
      isNotificationDropdownOpen = false;
    }
    if (userDropdownMenu && !userDropdownMenu.contains(event.target) && !userDropdownToggle.contains(event.target)) {
      userDropdownMenu.classList.add('hidden');
      isUserDropdownOpen = false;
    }
  });
}
