import { routePath } from '@/config/route-path'

/**
 * Trang More theo MacroFactor (`Docs/MacroFactor_UI/UI/More/01–05`): thứ tự nhóm General → Feature Settings → Theme → Data Management → Community & Support →
 * Other. Mỗi hàng CHỈ bấm được khi có tính năng thật phía sau (`href` khác null, `status: 'ready'`); chưa có BE / nội dung thì `unavailable`: vẫn nằm đúng chỗ,
 * làm mờ, ghi "Not available yet", không điều hướng, không có trang rỗng. Hàng không áp dụng cho web (Siri, App Icon) và các biểu tượng mạng xã hội (chưa có URL
 * thật) không có trong bố cục.
 */
export type MoreRowStatus = 'ready' | 'unavailable'

export type MoreIcon =
  | 'account'
  | 'subscription'
  | 'integrations'
  | 'units'
  | 'language'
  | 'dashboard'
  | 'foodLog'
  | 'shortcuts'
  | 'expenditure'
  | 'weightTrend'
  | 'strategy'
  | 'dataExport'
  | 'dataVisibility'
  | 'accountDeletion'
  | 'knowledgeBase'
  | 'roadmap'
  | 'support'
  | 'legal'
  | 'tutorials'
  | 'about'

export interface MoreRow {
  readonly key: string
  readonly label: string
  readonly icon: MoreIcon
  readonly status: MoreRowStatus
  /** Đích điều hướng; null khi `unavailable`. */
  readonly href: string | null
}

export interface MoreSection {
  readonly key: string
  readonly title: string
  readonly rows: readonly MoreRow[]
}

const ready = (key: string, label: string, icon: MoreIcon, href: string): MoreRow => ({
  key,
  label,
  icon,
  status: 'ready',
  href,
})
const unavailable = (key: string, label: string, icon: MoreIcon): MoreRow => ({
  key,
  label,
  icon,
  status: 'unavailable',
  href: null,
})

/** Chữ phụ của hàng chưa có tính năng. */
export const UNAVAILABLE_TEXT = 'Not available yet'

export const GENERAL: MoreSection = {
  key: 'general',
  title: 'General',
  rows: [
    ready('account', 'Account', 'account', routePath.profile),
    unavailable('subscription', 'Subscription', 'subscription'),
    unavailable('integrations', 'Integrations', 'integrations'),
    ready('units', 'Units', 'units', `${routePath.profile}#units`),
    unavailable('language', 'Language', 'language'),
  ],
}

export const FEATURE_SETTINGS: MoreSection = {
  key: 'feature-settings',
  title: 'Feature Settings',
  rows: [
    ready('dashboard', 'Dashboard', 'dashboard', routePath.dashboardCustomize),
    ready('food-log', 'Food Log', 'foodLog', routePath.foodLogSettings),
    ready('shortcuts', 'Shortcuts', 'shortcuts', routePath.shortcuts),
    ready('expenditure', 'Expenditure', 'expenditure', routePath.moreExpenditure),
    // Chưa có trang cài đặt Weight Trend (BE dự kiến): KHÔNG trỏ sang biểu đồ
    unavailable('weight-trend', 'Weight Trend', 'weightTrend'),
    ready('strategy', 'Strategy', 'strategy', routePath.program),
  ],
}

export const DATA_MANAGEMENT: MoreSection = {
  key: 'data-management',
  title: 'Data Management',
  rows: [
    unavailable('data-export', 'Data Export', 'dataExport'),
    unavailable('data-visibility', 'Data Visibility', 'dataVisibility'),
    unavailable('account-deletion', 'Account & Data Deletion', 'accountDeletion'),
  ],
}

export const COMMUNITY_SUPPORT: MoreSection = {
  key: 'community-support',
  title: 'Community & Support',
  rows: [
    unavailable('knowledge-base', 'Knowledge Base', 'knowledgeBase'),
    unavailable('roadmap', 'Roadmap', 'roadmap'),
    unavailable('support', 'Support', 'support'),
  ],
}

export const OTHER: MoreSection = {
  key: 'other',
  title: 'Other',
  rows: [
    unavailable('legal', 'Legal', 'legal'),
    ready('tutorials', 'Tutorials', 'tutorials', routePath.moreTutorials),
    unavailable('about', 'About', 'about'),
  ],
}

/** Các nhóm theo thứ tự trang (Theme nằm giữa Feature Settings và Data Management, vẽ riêng). */
export const BEFORE_THEME: readonly MoreSection[] = [GENERAL, FEATURE_SETTINGS]
export const AFTER_THEME: readonly MoreSection[] = [DATA_MANAGEMENT, COMMUNITY_SUPPORT, OTHER]
