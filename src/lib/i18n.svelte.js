/** @type {Record<string, Record<string, string>>} */
const translations = {
  en: {
    // Home
    "tagline": "Find and remove duplicate photos",
    "folder_to_scan": "Folder to scan",
    "folder_hint": "Click to select a folder…",
    "change": "Change",
    "detection_sensitivity": "Detection Sensitivity",
    "strict": "Strict",
    "loose": "Loose",
    "file_types": "File Types",
    "all": "All",
    "non_raw": "Non-RAW",
    "raw_only": "RAW Only",
    "all_desc": "JPEG, PNG, RAW, and more",
    "non_raw_desc": "JPEG, PNG, TIFF, WebP…",
    "raw_only_desc": "CR2, CR3, NEF, ARW…",
    "start_scan": "Start Scan",

    // Sensitivity
    "sens_strictest": "Strictest",
    "sens_strict": "Strict",
    "sens_balanced": "Balanced",
    "sens_loose": "Loose",
    "sens_loosest": "Loosest",
    "sens_strictest_desc": "Only detects images that are nearly pixel-perfect copies. Catches file duplicates and identical exports only.",
    "sens_strict_desc": "Detects images that are nearly identical, ignoring minor compression or subtle editing differences.",
    "sens_balanced_desc": "Also catches images with slight brightness, color, or minor crop differences. Recommended for most use cases.",
    "sens_loose_desc": "Groups similar scenes shot in burst mode or the same image saved at different resolutions.",
    "sens_loosest_desc": "Groups broadly similar subjects or scenes. Expect a higher rate of false positives.",

    // Scanning
    "images": "images",
    "searching_images": "Searching for images…",
    "cancel": "Cancel",

    // Scan phases (mapped from Rust)
    "phase_starting": "Starting...",
    "phase_scanning": "Scanning images...",
    "phase_hashing": "Computing hashes...",
    "phase_analyzing": "Analyzing duplicates...",

    // Results
    "new_scan": "New Scan",
    "group": "group",
    "groups": "groups",
    "duplicate": "duplicate",
    "duplicates": "duplicates",
    "selected": "selected",
    "sort_date": "Sort: Date",
    "sort_resolution": "Sort: Resolution",
    "sort_size": "Sort: File Size",
    "sort_name": "Sort: Name",
    "auto_select_all": "Auto-select All",
    "clear_all": "Clear All",
    "no_duplicates": "No duplicate photos found.",
    "scan_another": "Scan Another Folder",
    "image": "image",
    "auto_select": "Auto-select",
    "clear": "Clear",
    "compare_hint": "Now click another image to compare side by side",
    "files_selected": "files selected",
    "reclaimable": "reclaimable",
    "move_to_trash": "Move to Trash",
    "files_will_be_trashed": "file(s) will be moved to trash.",
    "trash_restore_hint": "You can restore them from the trash if needed.",

    // ImageCard
    "marked": "Marked",
    "mark": "Mark",
    "compare": "Compare",

    // CompareModal
    "marked_for_deletion": "Marked for deletion",
    "mark_for_deletion": "Mark for deletion",

    // Errors
    "err_not_folder": "Dropped item is not a folder. Please drop a folder.",
    "err_validate_folder": "Could not validate the dropped folder.",
    "err_trash_failed": "Failed to move files to trash. Please try again.",

    // Language names (displayed in selector)
    "lang_en": "English",
    "lang_ko": "한국어",
    "lang_ja": "日本語",
    "lang_zh_CN": "简体中文",
    "lang_zh_TW": "繁體中文",
  },

  ko: {
    "tagline": "중복 사진을 찾아 정리하세요",
    "folder_to_scan": "스캔할 폴더",
    "folder_hint": "클릭하여 폴더를 선택하세요…",
    "change": "변경",
    "detection_sensitivity": "감지 민감도",
    "strict": "엄격",
    "loose": "관대",
    "file_types": "파일 유형",
    "all": "전체",
    "non_raw": "Non-RAW",
    "raw_only": "RAW만",
    "all_desc": "JPEG, PNG, RAW 등",
    "non_raw_desc": "JPEG, PNG, TIFF, WebP…",
    "raw_only_desc": "CR2, CR3, NEF, ARW…",
    "start_scan": "스캔 시작",

    "sens_strictest": "가장 엄격",
    "sens_strict": "엄격",
    "sens_balanced": "균형",
    "sens_loose": "관대",
    "sens_loosest": "가장 관대",
    "sens_strictest_desc": "거의 픽셀 단위로 동일한 이미지만 감지합니다. 파일 복사본이나 동일한 내보내기만 찾습니다.",
    "sens_strict_desc": "거의 동일한 이미지를 감지하며, 미세한 압축 차이나 편집 차이는 무시합니다.",
    "sens_balanced_desc": "밝기, 색상, 가벼운 크롭 차이가 있는 이미지도 찾습니다. 대부분의 경우에 권장됩니다.",
    "sens_loose_desc": "연사 모드로 촬영된 유사한 장면이나 다른 해상도로 저장된 이미지를 그룹화합니다.",
    "sens_loosest_desc": "비슷한 피사체나 장면을 넓게 그룹화합니다. 오탐율이 높을 수 있습니다.",

    "images": "장",
    "searching_images": "이미지 검색 중…",
    "cancel": "취소",

    "phase_starting": "시작 중...",
    "phase_scanning": "이미지 스캔 중...",
    "phase_hashing": "해시 계산 중...",
    "phase_analyzing": "중복 분석 중...",

    "new_scan": "새 스캔",
    "group": "그룹",
    "groups": "그룹",
    "duplicate": "중복",
    "duplicates": "중복",
    "selected": "선택됨",
    "sort_date": "정렬: 날짜",
    "sort_resolution": "정렬: 해상도",
    "sort_size": "정렬: 파일 크기",
    "sort_name": "정렬: 이름",
    "auto_select_all": "전체 자동 선택",
    "clear_all": "전체 해제",
    "no_duplicates": "중복 사진이 없습니다.",
    "scan_another": "다른 폴더 스캔",
    "image": "장",
    "auto_select": "자동 선택",
    "clear": "해제",
    "compare_hint": "비교할 다른 이미지를 클릭하세요",
    "files_selected": "개 파일 선택됨",
    "reclaimable": "회수 가능",
    "move_to_trash": "휴지통으로 이동",
    "files_will_be_trashed": "개 파일이 휴지통으로 이동됩니다.",
    "trash_restore_hint": "필요하면 휴지통에서 복원할 수 있습니다.",

    "marked": "선택됨",
    "mark": "선택",
    "compare": "비교",

    "marked_for_deletion": "삭제 예정",
    "mark_for_deletion": "삭제 선택",

    "err_not_folder": "폴더가 아닙니다. 폴더를 드롭해주세요.",
    "err_validate_folder": "폴더를 확인할 수 없습니다.",
    "err_trash_failed": "휴지통으로 이동하지 못했습니다. 다시 시도해주세요.",

    "lang_en": "English",
    "lang_ko": "한국어",
    "lang_ja": "日本語",
    "lang_zh_CN": "简体中文",
    "lang_zh_TW": "繁體中文",
  },

  ja: {
    "tagline": "重複写真を検出して削除",
    "folder_to_scan": "スキャンするフォルダ",
    "folder_hint": "クリックしてフォルダを選択…",
    "change": "変更",
    "detection_sensitivity": "検出感度",
    "strict": "厳密",
    "loose": "緩い",
    "file_types": "ファイル種類",
    "all": "すべて",
    "non_raw": "Non-RAW",
    "raw_only": "RAWのみ",
    "all_desc": "JPEG、PNG、RAWなど",
    "non_raw_desc": "JPEG、PNG、TIFF、WebP…",
    "raw_only_desc": "CR2、CR3、NEF、ARW…",
    "start_scan": "スキャン開始",

    "sens_strictest": "最も厳密",
    "sens_strict": "厳密",
    "sens_balanced": "バランス",
    "sens_loose": "緩い",
    "sens_loosest": "最も緩い",
    "sens_strictest_desc": "ほぼピクセル単位で同一の画像のみ検出します。ファイルの複製や同一の書き出しのみ対象です。",
    "sens_strict_desc": "ほぼ同一の画像を検出し、わずかな圧縮差や編集の違いは無視します。",
    "sens_balanced_desc": "明るさ、色、軽微なクロップの違いがある画像も検出します。ほとんどの場合に推奨されます。",
    "sens_loose_desc": "連写モードで撮影された類似シーンや、異なる解像度で保存された画像をグループ化します。",
    "sens_loosest_desc": "類似した被写体やシーンを広くグループ化します。誤検出率が高くなる可能性があります。",

    "images": "枚",
    "searching_images": "画像を検索中…",
    "cancel": "キャンセル",

    "phase_starting": "開始中...",
    "phase_scanning": "画像をスキャン中...",
    "phase_hashing": "ハッシュを計算中...",
    "phase_analyzing": "重複を分析中...",

    "new_scan": "新規スキャン",
    "group": "グループ",
    "groups": "グループ",
    "duplicate": "重複",
    "duplicates": "重複",
    "selected": "選択中",
    "sort_date": "並替: 日付",
    "sort_resolution": "並替: 解像度",
    "sort_size": "並替: ファイルサイズ",
    "sort_name": "並替: 名前",
    "auto_select_all": "すべて自動選択",
    "clear_all": "すべて解除",
    "no_duplicates": "重複写真は見つかりませんでした。",
    "scan_another": "別のフォルダをスキャン",
    "image": "枚",
    "auto_select": "自動選択",
    "clear": "解除",
    "compare_hint": "比較する別の画像をクリックしてください",
    "files_selected": "ファイル選択中",
    "reclaimable": "回収可能",
    "move_to_trash": "ゴミ箱に移動",
    "files_will_be_trashed": "ファイルがゴミ箱に移動されます。",
    "trash_restore_hint": "必要に応じてゴミ箱から復元できます。",

    "marked": "選択済",
    "mark": "選択",
    "compare": "比較",

    "marked_for_deletion": "削除予定",
    "mark_for_deletion": "削除を選択",

    "err_not_folder": "フォルダではありません。フォルダをドロップしてください。",
    "err_validate_folder": "フォルダを検証できませんでした。",
    "err_trash_failed": "ゴミ箱への移動に失敗しました。もう一度お試しください。",

    "lang_en": "English",
    "lang_ko": "한국어",
    "lang_ja": "日本語",
    "lang_zh_CN": "简体中文",
    "lang_zh_TW": "繁體中文",
  },

  zh_CN: {
    "tagline": "查找并删除重复照片",
    "folder_to_scan": "扫描文件夹",
    "folder_hint": "点击选择文件夹…",
    "change": "更改",
    "detection_sensitivity": "检测灵敏度",
    "strict": "严格",
    "loose": "宽松",
    "file_types": "文件类型",
    "all": "全部",
    "non_raw": "非RAW",
    "raw_only": "仅RAW",
    "all_desc": "JPEG、PNG、RAW等",
    "non_raw_desc": "JPEG、PNG、TIFF、WebP…",
    "raw_only_desc": "CR2、CR3、NEF、ARW…",
    "start_scan": "开始扫描",

    "sens_strictest": "最严格",
    "sens_strict": "严格",
    "sens_balanced": "均衡",
    "sens_loose": "宽松",
    "sens_loosest": "最宽松",
    "sens_strictest_desc": "仅检测几乎像素级相同的图像。只能找到文件副本和相同导出。",
    "sens_strict_desc": "检测几乎相同的图像，忽略轻微的压缩或编辑差异。",
    "sens_balanced_desc": "还能检测亮度、颜色或轻微裁剪差异的图像。推荐大多数场景使用。",
    "sens_loose_desc": "将连拍模式拍摄的相似场景或不同分辨率保存的图像分组。",
    "sens_loosest_desc": "广泛地将相似主题或场景分组。误报率可能较高。",

    "images": "张",
    "searching_images": "正在搜索图片…",
    "cancel": "取消",

    "phase_starting": "正在启动...",
    "phase_scanning": "正在扫描图片...",
    "phase_hashing": "正在计算哈希...",
    "phase_analyzing": "正在分析重复项...",

    "new_scan": "新扫描",
    "group": "组",
    "groups": "组",
    "duplicate": "重复",
    "duplicates": "重复",
    "selected": "已选择",
    "sort_date": "排序：日期",
    "sort_resolution": "排序：分辨率",
    "sort_size": "排序：文件大小",
    "sort_name": "排序：名称",
    "auto_select_all": "全部自动选择",
    "clear_all": "全部取消",
    "no_duplicates": "未发现重复照片。",
    "scan_another": "扫描其他文件夹",
    "image": "张",
    "auto_select": "自动选择",
    "clear": "取消",
    "compare_hint": "点击另一张图片进行对比",
    "files_selected": "个文件已选择",
    "reclaimable": "可回收",
    "move_to_trash": "移至回收站",
    "files_will_be_trashed": "个文件将被移至回收站。",
    "trash_restore_hint": "如需要，可从回收站中恢复。",

    "marked": "已选",
    "mark": "选择",
    "compare": "对比",

    "marked_for_deletion": "待删除",
    "mark_for_deletion": "选择删除",

    "err_not_folder": "不是文件夹。请拖放文件夹。",
    "err_validate_folder": "无法验证文件夹。",
    "err_trash_failed": "移至回收站失败，请重试。",

    "lang_en": "English",
    "lang_ko": "한국어",
    "lang_ja": "日本語",
    "lang_zh_CN": "简体中文",
    "lang_zh_TW": "繁體中文",
  },

  zh_TW: {
    "tagline": "尋找並刪除重複照片",
    "folder_to_scan": "掃描資料夾",
    "folder_hint": "點擊選擇資料夾…",
    "change": "更改",
    "detection_sensitivity": "偵測靈敏度",
    "strict": "嚴格",
    "loose": "寬鬆",
    "file_types": "檔案類型",
    "all": "全部",
    "non_raw": "非RAW",
    "raw_only": "僅RAW",
    "all_desc": "JPEG、PNG、RAW等",
    "non_raw_desc": "JPEG、PNG、TIFF、WebP…",
    "raw_only_desc": "CR2、CR3、NEF、ARW…",
    "start_scan": "開始掃描",

    "sens_strictest": "最嚴格",
    "sens_strict": "嚴格",
    "sens_balanced": "均衡",
    "sens_loose": "寬鬆",
    "sens_loosest": "最寬鬆",
    "sens_strictest_desc": "僅偵測幾乎像素級相同的影像。只能找到檔案副本和相同匯出。",
    "sens_strict_desc": "偵測幾乎相同的影像，忽略輕微的壓縮或編輯差異。",
    "sens_balanced_desc": "還能偵測亮度、色彩或輕微裁切差異的影像。建議大多數情況使用。",
    "sens_loose_desc": "將連拍模式拍攝的相似場景或不同解析度儲存的影像分組。",
    "sens_loosest_desc": "廣泛地將相似主題或場景分組。誤報率可能較高。",

    "images": "張",
    "searching_images": "正在搜尋圖片…",
    "cancel": "取消",

    "phase_starting": "正在啟動...",
    "phase_scanning": "正在掃描圖片...",
    "phase_hashing": "正在計算雜湊...",
    "phase_analyzing": "正在分析重複項...",

    "new_scan": "新掃描",
    "group": "組",
    "groups": "組",
    "duplicate": "重複",
    "duplicates": "重複",
    "selected": "已選擇",
    "sort_date": "排序：日期",
    "sort_resolution": "排序：解析度",
    "sort_size": "排序：檔案大小",
    "sort_name": "排序：名稱",
    "auto_select_all": "全部自動選擇",
    "clear_all": "全部取消",
    "no_duplicates": "未發現重複照片。",
    "scan_another": "掃描其他資料夾",
    "image": "張",
    "auto_select": "自動選擇",
    "clear": "取消",
    "compare_hint": "點擊另一張圖片進行比較",
    "files_selected": "個檔案已選擇",
    "reclaimable": "可回收",
    "move_to_trash": "移至回收桶",
    "files_will_be_trashed": "個檔案將被移至回收桶。",
    "trash_restore_hint": "如需要，可從回收桶中還原。",

    "marked": "已選",
    "mark": "選擇",
    "compare": "比較",

    "marked_for_deletion": "待刪除",
    "mark_for_deletion": "選擇刪除",

    "err_not_folder": "不是資料夾。請拖放資料夾。",
    "err_validate_folder": "無法驗證資料夾。",
    "err_trash_failed": "移至回收桶失敗，請重試。",

    "lang_en": "English",
    "lang_ko": "한국어",
    "lang_ja": "日本語",
    "lang_zh_CN": "简体中文",
    "lang_zh_TW": "繁體中文",
  },
};

// ── Locale state ──────────────────────────────────────────────────────────────

export const LOCALES = /** @type {const} */ (["en", "ko", "ja", "zh_CN", "zh_TW"]);

class I18nState {
  locale = $state(/** @type {string} */ ("en"));

  constructor() {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("ditto_locale");
      if (saved && saved in translations) {
        this.locale = saved;
      }
    }
  }

  /** @param {string} key */
  t(key) {
    return translations[this.locale]?.[key] ?? translations.en[key] ?? key;
  }

  /** @param {string} locale */
  setLocale(locale) {
    if (locale in translations) {
      this.locale = locale;
      localStorage.setItem("ditto_locale", locale);
    }
  }

  /**
   * Map Rust scan phase strings to translated versions.
   * @param {string} phase
   */
  translatePhase(phase) {
    if (phase.startsWith("Starting"))  return this.t("phase_starting");
    if (phase.startsWith("Scanning"))  return this.t("phase_scanning");
    if (phase.startsWith("Computing")) return this.t("phase_hashing");
    if (phase.startsWith("Analyzing")) return this.t("phase_analyzing");
    return phase;
  }
}

export const i18n = new I18nState();

/** Shorthand for i18n.t() */
export function t(/** @type {string} */ key) {
  return i18n.t(key);
}
