/* Danh mục tên item chuẩn của game (js/data.js) */
const DEFAULT_GAME_ITEMS = [
  "Võ sĩ yêu đái", "Quỷ Hồn", "Linh Tán", "Thiết bát quái", "Linh Cầm",
  "Cánh dơi", "Vòng Bạch Ngọc", "Canh Mộc Bài", "Mặt nạ Võ sĩ", "Bùa vàng",
  "Linh Tiêu", "Võ sĩ đao", "Lệnh bài sư môn Ngũ Độc", "Bạch Ngưu Lân",
  "Toái cốt", "Da hổ", "Huyết Nha vũ", "Thuốc nổ", "Linh Địch", "Tàn thương",
  "Đại Cang đao", "Phù ấn", "Linh Quả", "Giáp xác phiến", "Găng tay",
  "Bí kíp / Sách vàng", "Tê Ngưu Cung", "Cánh sen", "Trâm bạc", "Đá đen"
];

let KNOWN_ITEMS = (() => {
  try {
    const brain = JSON.parse(localStorage.getItem("HKTN_AI_BRAIN_PERMANENT") || "{}");
    const deleted = new Set((brain.deletedKnownItems || []).map(s => s.trim().toLowerCase()));
    return DEFAULT_GAME_ITEMS.filter(item => !deleted.has(item.trim().toLowerCase()));
  } catch (e) {
    return [...DEFAULT_GAME_ITEMS];
  }
})();
