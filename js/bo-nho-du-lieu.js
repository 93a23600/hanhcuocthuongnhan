/* MODULE: KHAI BÁO BỘ NHỚ & TRẠNG THÁI TRUNG TÂM (js/bo-nho-du-lieu.js) */

const STORAGE_CHESTS_KEY = "HKTN_CHESTS_DAILY_DATA";
const STORAGE_BRAIN_KEY = "HKTN_AI_BRAIN_PERMANENT";

let appState = {
  apiKey: localStorage.getItem("gemini_api_key") || "",
  accounts: [],
  chests: [],
  learnedGridCrop: { top: 0, bottom: 0, left: 0, right: 0 },
  learnedIcons: {},        
  trainedNumberErrors: [],
  customKnownItems: [],
  noAdkAccounts: [],
  equipmentItems: [],
  hideEquipment: false,
  ignoredItems: [],
  snapshot: null,
  snapshotAt: null,
  weeklyOutSortDesc: true,
  searchQuery: "",
  selectedAccFilter: "ALL",
  showIgnored: false,
  sortBy: "qty",
  sortDesc: true,
  currentTab: "gameGrid",
  viewingAcc: "",
  viewingChest: "Rương 1",
  selectedSlotIndex: 0
};
