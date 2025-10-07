import { getUserProfileMetaCardHtml, initializeUserProfileMetaCard } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab/userProfileMetaCard.js';
import { getUserProfileInfoCardHtml, initializeUserProfileInfoCard } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab/userProfileInfoCard.js';
import { getUserProfileAddressCardHtml, initializeUserProfileAddressCard } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab/userProfileAddressCard.js';

export function getUserProfilesHtml() {
  return `
    <div class="p-4">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Profile</h2>
      <p class="text-gray-600 dark:text-gray-300">Manage your profile settings.</p>
      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 mt-4">
        <h3 class="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div class="space-y-6">
          ${getUserProfileMetaCardHtml()}
          ${getUserProfileInfoCardHtml()}
          ${getUserProfileAddressCardHtml()}
        </div>
      </div>
    </div>
  `;
}

export function initializeUserProfilesPage() {
  initializeUserProfileMetaCard();
  initializeUserProfileInfoCard();
  initializeUserProfileAddressCard();
}
