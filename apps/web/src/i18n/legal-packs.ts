/**
 * apps/web/src/i18n/legal-packs.ts
 * Multi-language content packs (vi, en, zh, ko, ja) for Cookie Policy, Privacy Policy, and Terms of Service.
 * Pure monolingual rendering per selected locale — no mixed bilingual parentheses or slashes.
 */

export type LegalLocale = "vi" | "en" | "zh" | "ko" | "ja";
export type LegalPageKey = "cookies" | "privacy" | "terms";

export interface LegalSectionContent {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  links?: { label: string; href: string }[];
  afterNote?: string;
}

export interface LegalDocumentPack {
  title: string;
  lastUpdated: string;
  sections: LegalSectionContent[];
}

export interface LegalUiChrome {
  homeLabel: string;
  legalBadge: string;
  lastUpdatedLabel: string;
  tocLabel: string;
  languageLabel: string;
}

export const SUPPORTED_LEGAL_LOCALES: ReadonlyArray<{
  code: LegalLocale;
  label: string;
  nativeName: string;
}> = [
  { code: "vi", label: "Tiếng Việt", nativeName: "Tiếng Việt" },
  { code: "en", label: "English", nativeName: "English" },
  { code: "zh", label: "中文 (简体)", nativeName: "中文 (简体)" },
  { code: "ko", label: "한국어", nativeName: "한국어" },
  { code: "ja", label: "日本語", nativeName: "日本語" },
];

export const LEGAL_UI_CHROME: Record<LegalLocale, LegalUiChrome> = {
  vi: {
    homeLabel: "Trang chủ",
    legalBadge: "THÔNG TIN PHÁP LÝ",
    lastUpdatedLabel: "Cập nhật lần cuối",
    tocLabel: "Mục lục",
    languageLabel: "Ngôn ngữ hiển thị",
  },
  en: {
    homeLabel: "Home",
    legalBadge: "LEGAL INFORMATION",
    lastUpdatedLabel: "Last updated",
    tocLabel: "Table of Contents",
    languageLabel: "Display language",
  },
  zh: {
    homeLabel: "首页",
    legalBadge: "法律信息",
    lastUpdatedLabel: "最后更新",
    tocLabel: "目录",
    languageLabel: "显示语言",
  },
  ko: {
    homeLabel: "홈",
    legalBadge: "법적 고지",
    lastUpdatedLabel: "최종 업데이트",
    tocLabel: "목차",
    languageLabel: "표시 언어",
  },
  ja: {
    homeLabel: "ホーム",
    legalBadge: "法的情報",
    lastUpdatedLabel: "最終更新日",
    tocLabel: "目次",
    languageLabel: "表示言語",
  },
};

const BROWSER_COOKIE_GUIDES = [
  { label: "Google Chrome", href: "https://support.google.com/chrome/answer/95647" },
  {
    label: "Mozilla Firefox",
    href: "https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop",
  },
  {
    label: "Apple Safari",
    href: "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac",
  },
  {
    label: "Microsoft Edge",
    href: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406",
  },
];

export const COOKIES_PACK: Record<LegalLocale, LegalDocumentPack> = {
  vi: {
    title: "Chính sách Cookie",
    lastUpdated: "28/09/2026",
    sections: [
      {
        id: "what",
        heading: "1. Cookie là gì?",
        paragraphs: [
          "Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập trang web. Chúng giúp hệ thống ghi nhớ thông tin về phiên truy cập — chẳng hạn như trạng thái đăng nhập hoặc tùy chọn ngôn ngữ — để mang lại trải nghiệm liền mạch và an toàn.",
        ],
      },
      {
        id: "types",
        heading: "2. Các loại Cookie được sử dụng",
        table: {
          headers: [" Phân loại", "Mục đích sử dụng", "Thời hạn lưu trữ"],
          rows: [
            [
              "Bắt buộc",
              "Cần thiết để dịch vụ vận hành. Duy trì phiên đăng nhập và bảo vệ luồng xác thực.",
              "Theo phiên làm việc",
            ],
            [
              "Chức năng",
              "Ghi nhớ tùy chọn giao diện và ngôn ngữ hiển thị của người dùng.",
              "1 năm",
            ],
            [
              "Phân tích",
              "Thu thập số liệu tổng hợp ẩn danh về hiệu năng dịch vụ, không định danh cá nhân.",
              "6 tháng",
            ],
          ],
        },
      },
      {
        id: "usage",
        heading: "3. Cách chúng tôi sử dụng Cookie",
        bullets: [
          "Duy trì trạng thái đăng nhập và bảo vệ phiên làm việc trước truy cập trái phép.",
          "Ghi nhớ tùy chọn cá nhân hóa giao diện và ngôn ngữ hiển thị.",
          "Đo lường độ ổn định của dịch vụ dưới dạng thống kê ẩn danh.",
          "Phát hiện hành vi bất thường và bảo vệ tính toàn vẹn của hệ thống xác thực.",
        ],
        afterNote: "Bravechat không sử dụng cookie để theo dõi chéo trang hoặc hiển thị quảng cáo.",
      },
      {
        id: "control",
        heading: "4. Kiểm soát Cookie",
        paragraphs: [
          "Bạn có thể quản lý hoặc xóa cookie bất kỳ lúc nào trong phần cài đặt trình duyệt. Lưu ý rằng việc vô hiệu hóa cookie bắt buộc có thể khiến tính năng đăng nhập không hoạt động.",
          "Hướng dẫn quản lý cookie trên các trình duyệt phổ biến:",
        ],
        links: BROWSER_COOKIE_GUIDES,
      },
      {
        id: "contact",
        heading: "5. Liên hệ",
        paragraphs: [
          "Nếu bạn có câu hỏi liên quan đến Chính sách Cookie, vui lòng liên hệ với đội ngũ phát triển qua trang thông tin hỗ trợ chính thức của Bravechat.",
        ],
      },
    ],
  },
  en: {
    title: "Cookie Policy",
    lastUpdated: "2026-09-28",
    sections: [
      {
        id: "what",
        heading: "1. What Are Cookies?",
        paragraphs: [
          "Cookies are small text files stored on your device when you visit a website. They help the platform remember information about your session — such as your sign-in state or language preference — to provide a seamless and secure experience.",
        ],
      },
      {
        id: "types",
        heading: "2. Types of Cookies We Use",
        table: {
          headers: ["Category", "Purpose", "Duration"],
          rows: [
            [
              "Strictly Necessary",
              "Required for core platform operation. Maintains active sign-in sessions and authentication security.",
              "Session",
            ],
            [
              "Functional",
              "Remembers interface preferences and your selected display language.",
              "1 year",
            ],
            [
              "Analytics",
              "Collects aggregated, non-identifying metrics to improve service reliability and performance.",
              "6 months",
            ],
          ],
        },
      },
      {
        id: "usage",
        heading: "3. How We Use Cookies",
        bullets: [
          "Maintain your authenticated state and protect active sessions against unauthorized access.",
          "Remember your interface personalization and language settings.",
          "Evaluate service stability through anonymized performance metrics.",
          "Detect automated abuse and protect authentication integrity.",
        ],
        afterNote: "Bravechat does not use cookies for cross-site tracking or targeted advertising.",
      },
      {
        id: "control",
        heading: "4. Managing Cookies",
        paragraphs: [
          "You can manage or delete cookies at any time through your browser settings. Please note that blocking strictly necessary cookies may prevent you from signing in or using core features.",
          "Cookie management guides for major browsers:",
        ],
        links: BROWSER_COOKIE_GUIDES,
      },
      {
        id: "contact",
        heading: "5. Contact",
        paragraphs: [
          "If you have any questions regarding this Cookie Policy, please reach out to our team through Bravechat's official support channels.",
        ],
      },
    ],
  },
  zh: {
    title: "Cookie 政策",
    lastUpdated: "2026-09-28",
    sections: [
      {
        id: "what",
        heading: "1. 什么是 Cookie？",
        paragraphs: [
          "Cookie 是您访问网站时存储在设备上的小型文本文件。它们用于记录您的会话信息（例如登录状态或语言偏好），从而提供连贯且安全的使用体验。",
        ],
      },
      {
        id: "types",
        heading: "2. 我们使用的 Cookie 类型",
        table: {
          headers: ["类别", "用途说明", "保留期限"],
          rows: [
            [
              "严格必要",
              "保障核心服务正常运行，维持登录会话与身份验证安全。",
              "会话期间",
            ],
            [
              "功能性",
              "记住您的界面偏好设置与显示语言选项。",
              "1 年",
            ],
            [
              "统计分析",
              "收集匿名汇总的性能指标以改进服务质量，不识别个人身份。",
              "6 个月",
            ],
          ],
        },
      },
      {
        id: "usage",
        heading: "3. 我们如何使用 Cookie",
        bullets: [
          "保持您的登录状态并保护会话免受未授权访问。",
          "保存您的界面个性化和语言偏好设置。",
          "通过匿名统计数据评估服务稳定性。",
          "防范恶意请求并维护身份验证系统的完整性。",
        ],
        afterNote: "Bravechat 不会使用 Cookie 进行跨站追踪或定向广告投放。",
      },
      {
        id: "control",
        heading: "4. 管理与控制 Cookie",
        paragraphs: [
          "您可以随时通过浏览器设置管理或删除 Cookie。请注意，禁用严格必要的 Cookie 可能会导致无法正常登录或使用核心功能。",
          "主流浏览器的 Cookie 管理指南：",
        ],
        links: BROWSER_COOKIE_GUIDES,
      },
      {
        id: "contact",
        heading: "5. 联系我们",
        paragraphs: [
          "如对本 Cookie 政策有任何疑问，请通过 Bravechat 官方支持渠道与我们联系。",
        ],
      },
    ],
  },
  ko: {
    title: "쿠키 정책",
    lastUpdated: "2026-09-28",
    sections: [
      {
        id: "what",
        heading: "1. 쿠키란 무엇인가요?",
        paragraphs: [
          "쿠키는 웹사이트 방문 시 사용자의 기기에 저장되는 작은 텍스트 파일입니다. 로그인 상태나 언어 설정과 같은 세션 정보를 기억하여 안전하고 일관된 환경을 제공합니다.",
        ],
      },
      {
        id: "types",
        heading: "2. 사용하는 쿠키 유형",
        table: {
          headers: ["구분", "사용 목적", "보관 기간"],
          rows: [
            [
              "필수 쿠키",
              "서비스 핵심 기능 작동에 필요하며 로그인 세션 및 인증 보안을 유지합니다.",
              "세션 종료 시",
            ],
            [
              "기능 쿠키",
              "인터페이스 환경설정 및 선택한 표시 언어를 기억합니다.",
              "1년",
            ],
            [
              "분석 쿠키",
              "서비스 안정성 향상을 위해 개인을 식별하지 않는 익명 통계를 수집합니다.",
              "6개월",
            ],
          ],
        },
      },
      {
        id: "usage",
        heading: "3. 쿠키 활용 방식",
        bullets: [
          "로그인 상태를 유지하고 비인가 접근으로부터 세션을 보호합니다.",
          "사용자 인터페이스 및 언어 설정을 저장합니다.",
          "익명화된 성능 지표를 통해 서비스 품질을 개선합니다.",
          "비정상적인 접근을 탐지하고 인증 시스템의 무결성을 보호합니다.",
        ],
        afterNote: "Bravechat은 맞춤형 광고나 교차 사이트 추적을 위해 쿠키를 사용하지 않습니다.",
      },
      {
        id: "control",
        heading: "4. 쿠키 제어 및 관리",
        paragraphs: [
          "브라우저 설정에서 언제든지 쿠키를 관리하거나 삭제할 수 있습니다. 단, 필수 쿠키를 차단할 경우 로그인이 제한되거나 일부 기능이 작동하지 않을 수 있습니다.",
          "주요 브라우저별 쿠키 설정 안내:",
        ],
        links: BROWSER_COOKIE_GUIDES,
      },
      {
        id: "contact",
        heading: "5. 문의하기",
        paragraphs: [
          "쿠키 정책과 관련하여 궁금한 점이 있으시면 Bravechat 공식 지원 채널을 통해 문의해 주시기 바랍니다.",
        ],
      },
    ],
  },
  ja: {
    title: "クッキーポリシー",
    lastUpdated: "2026-09-28",
    sections: [
      {
        id: "what",
        heading: "1. クッキー（Cookie）とは",
        paragraphs: [
          "クッキーとは、ウェブサイトにアクセスした際にデバイスに保存される小さなテキストファイルです。ログイン状態や表示言語などの設定を保持し、安全で快適な利用体験を提供するために使用されます。",
        ],
      },
      {
        id: "types",
        heading: "2. 使用するクッキーの種類",
        table: {
          headers: ["種類", "利用目的", "保存期間"],
          rows: [
            [
              "必須クッキー",
              "サービスの基本動作に不可欠であり、ログインセッションと認証の安全性を維持します。",
              "セッション中",
            ],
            [
              "機能クッキー",
              "インターフェースの設定や選択された表示言語を記憶します。",
              "1年間",
            ],
            [
              "分析クッキー",
              "個人を特定しない匿名化された統計データを収集し、品質向上に役立てます。",
              "6か月",
            ],
          ],
        },
      },
      {
        id: "usage",
        heading: "3. クッキーの利用目的",
        bullets: [
          "ログイン状態を維持し、不正アクセスからセッションを保護するため。",
          "表示言語や画面設定を保持するため。",
          "匿名化されたパフォーマンス指標によりサービスの安定성을評価するため。",
          "不正なリクエストを検知し、認証システムの完全性を守るため。",
        ],
        afterNote: "Bravechat はターゲティング広告やサイト間トラッキングのためにクッキーを使用しません。",
      },
      {
        id: "control",
        heading: "4. クッキーの管理方法",
        paragraphs: [
          "ブラウザの設定からいつでもクッキーを管理または削除できます。ただし、必須クッキーを無効にすると、ログインや主要機能が利用できなくなる場合があります。",
          "主要ブラウザでの設定手順：",
        ],
        links: BROWSER_COOKIE_GUIDES,
      },
      {
        id: "contact",
        heading: "5. お問い合わせ",
        paragraphs: [
          "本クッキーポリシーに関するご質問は、Bravechat 公式サポート窓口までお問い合わせください。",
        ],
      },
    ],
  },
};

export const PRIVACY_PACK: Record<LegalLocale, LegalDocumentPack> = {
  vi: {
    title: "Chính sách Bảo mật",
    lastUpdated: "22/10/2026",
    sections: [
      {
        id: "overview",
        heading: "1. Tổng quan",
        paragraphs: [
          "Bravechat cam kết tôn trọng quyền riêng tư và bảo vệ dữ liệu cá nhân của người dùng. Chính sách này giải thích rõ loại dữ liệu được thu thập, mục đích xử lý và các biện pháp bảo vệ thông tin khi bạn sử dụng nền tảng.",
        ],
      },
      {
        id: "data-collected",
        heading: "2. Dữ liệu được thu thập",
        table: {
          headers: ["Nhóm dữ liệu", "Chi tiết thông tin"],
          rows: [
            ["Thông tin tài khoản", "Địa chỉ email, tên người dùng, tên hiển thị và mật khẩu đã băm một chiều."],
            ["Nội dung trao đổi", "Tin nhắn văn bản và tệp đính kèm do bạn chủ động gửi trong kênh hoặc tin nhắn trực tiếp."],
            ["Thông tin phiên đăng nhập", "Thời điểm đăng nhập, địa chỉ IP và thông tin trình duyệt phục vụ kiểm soát thiết bị."],
            ["Cấu trúc không gian chung", "Máy chủ, danh mục kênh và vai trò mà bạn tạo hoặc tham gia."],
          ],
        },
        afterNote: "Chúng tôi không thu thập dữ liệu thanh toán, danh bạ điện thoại hoặc vị trí định vị GPS.",
      },
      {
        id: "purpose",
        heading: "3. Mục đích xử lý dữ liệu",
        bullets: [
          "Cung cấp, duy trì và đồng bộ tin nhắn thời gian thực giữa các thiết bị của bạn.",
          "Xác thực danh tính, gửi mã xác nhận bảo mật và ngăn chặn truy cập trái phép.",
          "Kiểm soát quyền truy cập vào các máy chủ và kênh riêng tư theo đúng vai trò.",
          "Phát hiện và ngăn chặn hành vi spam, lạm dụng hoặc tấn công mạng.",
        ],
      },
      {
        id: "storage",
        heading: "4. Lưu trữ & Biện pháp bảo vệ",
        bullets: [
          "Mật khẩu luôn được băm một chiều trước khi lưu trữ; mật khẩu gốc không bao giờ được lưu.",
          "Phiên đăng nhập có thời hạn rõ ràng, hỗ trợ xác thực hai yếu tố (2FA) và thu hồi phiên từ xa.",
          "Toàn bộ lưu lượng truyền tải được mã hóa qua giao thức HTTPS/TLS.",
          "Tệp tải lên được kiểm tra chữ ký định dạng thực tế trước khi lưu trữ.",
        ],
      },
      {
        id: "sharing",
        heading: "5. Chia sẻ dữ liệu",
        paragraphs: [
          "Bravechat không bán hoặc trao đổi dữ liệu cá nhân của bạn cho bên thứ ba. Dữ liệu chỉ được xử lý qua các đối tác hạ tầng đám mây đạt chuẩn bảo mật ở mức tối thiểu cần thiết để vận hành dịch vụ, hoặc khi có yêu cầu hợp pháp từ cơ quan có thẩm quyền.",
        ],
      },
      {
        id: "rights",
        heading: "6. Quyền của người dùng",
        bullets: [
          "Xem và cập nhật thông tin hồ sơ cá nhân trực tiếp trong phần Cài đặt Tài khoản.",
          "Kiểm tra danh sách thiết bị đang đăng nhập và thu hồi các phiên không còn sử dụng.",
          "Chủ động chỉnh sửa hoặc xóa tin nhắn, tệp đính kèm và máy chủ do bạn sở hữu.",
          "Yêu cầu hỗ trợ về quyền riêng tư và dữ liệu tài khoản qua kênh liên hệ chính thức.",
        ],
      },
      {
        id: "retention",
        heading: "7. Thời gian lưu trữ",
        paragraphs: [
          "Dữ liệu tài khoản được duy trì trong thời gian bạn sử dụng dịch vụ. Khi tài khoản bị xóa, thông tin định danh sẽ được gỡ bỏ trong vòng 30 ngày, và nhật ký bảo mật hệ thống được tự động xoay vòng tối đa trong 90 ngày.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    lastUpdated: "2026-10-22",
    sections: [
      {
        id: "overview",
        heading: "1. Overview",
        paragraphs: [
          "Bravechat is committed to protecting your privacy and personal data. This Privacy Policy explains what information we collect, why we process it, and the security controls that protect your account.",
        ],
      },
      {
        id: "data-collected",
        heading: "2. Data We Collect",
        table: {
          headers: ["Data Category", "Details"],
          rows: [
            ["Account Credentials", "Email address, username, display name, and one-way hashed password."],
            ["Communication Content", "Messages and file attachments you choose to send in channels or direct messages."],
            ["Session Metadata", "Sign-in timestamps, IP address, and browser user-agent for device security auditing."],
            ["Workspace Membership", "Servers, channels, and roles you create or join."],
          ],
        },
        afterNote: "We do not collect payment card details, phone contacts, or GPS location data.",
      },
      {
        id: "purpose",
        heading: "3. Purpose of Processing",
        bullets: [
          "Deliver and synchronize real-time messaging and voice sessions across your devices.",
          "Authenticate your account, deliver one-time verification codes, and prevent unauthorized access.",
          "Enforce role-based access control for servers and private channels.",
          "Detect and mitigate spam, automated abuse, and network attacks.",
        ],
      },
      {
        id: "storage",
        heading: "4. Storage & Security Controls",
        bullets: [
          "One-way cryptographic password hashing — plaintext passwords are never stored.",
          "Short-lived session tokens with optional two-factor authentication (2FA) and remote session revocation.",
          "End-to-end transport encryption via HTTPS/TLS across all connections.",
          "File signature (magic-byte) verification on uploaded media and attachments.",
        ],
      },
      {
        id: "sharing",
        heading: "5. Data Sharing",
        paragraphs: [
          "Bravechat never sells your personal data to third parties. Data is processed strictly through certified cloud infrastructure partners to operate the platform, or when required by applicable law.",
        ],
      },
      {
        id: "rights",
        heading: "6. Your Rights",
        bullets: [
          "Access and update your profile details at any time in Account Settings.",
          "Review active device sessions and revoke any unrecognized device immediately.",
          "Edit or delete messages, attachments, and servers under your ownership.",
          "Contact our support team for account deletion or privacy inquiries.",
        ],
      },
      {
        id: "retention",
        heading: "7. Data Retention",
        paragraphs: [
          "Account data is retained while your account remains active. Following account deletion, identifying profile records are removed within 30 days, and security audit logs rotate within 90 days.",
        ],
      },
    ],
  },
  zh: {
    title: "隐私政策",
    lastUpdated: "2026-10-22",
    sections: [
      {
        id: "overview",
        heading: "1. 概述",
        paragraphs: [
          "Bravechat 致力于保护用户的隐私与个人数据。本政策说明我们在您使用平台时收集的数据类型、处理目的以及安全防护措施。",
        ],
      },
      {
        id: "data-collected",
        heading: "2. 我们收集的数据",
        table: {
          headers: ["数据类别", "具体内容"],
          rows: [
            ["账户信息", "电子邮箱、用户名、显示名称以及经单向哈希加密的密码。"],
            ["通信内容", "您在频道或私信中主动发送的文本消息与附件。"],
            ["会话元数据", "用于设备安全审计的登录时间、IP 地址与浏览器信息。"],
            ["空间成员关系", "您创建或加入的服务器、频道与角色信息。"],
          ],
        },
        afterNote: "我们不会收集支付卡信息、手机通讯录或 GPS 定位数据。",
      },
      {
        id: "purpose",
        heading: "3. 数据处理目的",
        bullets: [
          "在您的设备间提供并同步实时消息与语音会话。",
          "验证账户身份、发送一次性验证码并防止未授权访问。",
          "基于角色权限控制对服务器与私密频道的访问。",
          "识别并拦截垃圾信息、恶意滥用及网络攻击。",
        ],
      },
      {
        id: "storage",
        heading: "4. 存储与安全防护",
        bullets: [
          "密码采用单向加密哈希处理，绝不存储明文密码。",
          "支持双重身份验证（2FA）与远程设备会话注销。",
          "所有网络传输均通过 HTTPS/TLS 加密。",
          "对上传文件进行真实文件头签名校验。",
        ],
      },
      {
        id: "sharing",
        heading: "5. 数据共享",
        paragraphs: [
          "Bravechat 绝不会向第三方出售您的个人数据。数据仅在平台运行所必需的范围内通过合规云基础设施处理，或应法律法规要求提供。",
        ],
      },
      {
        id: "rights",
        heading: "6. 您的权利",
        bullets: [
          "随时在账户设置中查看或修改个人资料。",
          "查看当前已登录设备列表并随时远程注销任何会话。",
          "编辑或删除您发送的消息、附件及您拥有的服务器。",
          "通过官方支持渠道申请注销账户或咨询隐私问题。",
        ],
      },
      {
        id: "retention",
        heading: "7. 数据保留期限",
        paragraphs: [
          "在账户存续期间我们会保留必要数据。账户删除后，个人身份资料将在 30 天内清除，安全审计日志最多保留 90 天。",
        ],
      },
    ],
  },
  ko: {
    title: "개인정보 처리방침",
    lastUpdated: "2026-10-22",
    sections: [
      {
        id: "overview",
        heading: "1. 개요",
        paragraphs: [
          "Bravechat은 사용자의 개인정보와 프라이버시를 안전하게 보호합니다. 본 방침은 수집하는 데이터 항목, 처리 목적 및 계정 보호를 위한 보안 조치를 설명합니다.",
        ],
      },
      {
        id: "data-collected",
        heading: "2. 수집하는 데이터",
        table: {
          headers: ["데이터 항목", "상세 내용"],
          rows: [
            ["계정 정보", "이메일 주소, 사용자명, 표시 이름 및 단방향 해시 처리된 비밀번호."],
            ["커뮤니케이션 콘텐츠", "채널 또는 다이렉트 메시지에서 사용자가 전송한 메시지 및 첨부 파일."],
            ["세션 메타데이터", "기기 보안 확인을 위한 로그인 시각, IP 주소 및 브라우저 정보."],
            ["서버 및 역할 정보", "사용자가 생성하거나 참여한 서버, 채널 및 역할 설정."],
          ],
        },
        afterNote: "결제 정보, 휴대폰 연락처 또는 GPS 위치 데이터는 수집하지 않습니다.",
      },
      {
        id: "purpose",
        heading: "3. 데이터 처리 목적",
        bullets: [
          "실시간 메시지 및 음성 세션을 기기 간에 안정적으로 동기화합니다.",
          "본인 인증, 일회용 인증 코드 발송 및 비인가 접근을 차단합니다.",
          "역할 기반 권한(RBAC)에 따라 비공개 채널 접근을 제어합니다.",
          "스팸, 자동화된 악용 및 네트워크 공격을 탐지하고 방어합니다.",
        ],
      },
      {
        id: "storage",
        heading: "4. 보관 및 보안 조치",
        bullets: [
          "비밀번호는 단방향 암호화 해시로만 저장되며 평문은 절대 저장되지 않습니다.",
          "2단계 인증(2FA) 및 원격 기기 세션 해제 기능을 제공합니다.",
          "모든 데이터 전송 구간에 HTTPS/TLS 암호화를 적용합니다.",
          "업로드 파일의 실제 시그니처(매직 바이트)를 검증합니다.",
        ],
      },
      {
        id: "sharing",
        heading: "5. 데이터 공유",
        paragraphs: [
          "Bravechat은 사용자의 개인정보를 제3자에게 판매하지 않습니다. 서비스 운영에 필요한 최소 범위 내에서만 인증된 클라우드 인프라를 통해 처리하거나 법적 의무에 따라 처리합니다.",
        ],
      },
      {
        id: "rights",
        heading: "6. 사용자의 권리",
        bullets: [
          "계정 설정에서 프로필 정보를 언제든지 확인하고 수정할 수 있습니다.",
          "로그인된 기기 목록을 확인하고 원격으로 세션을 종료할 수 있습니다.",
          "본인이 작성한 메시지, 첨부 파일 및 소유한 서버를 삭제할 수 있습니다.",
          "공식 지원 채널을 통해 계정 삭제 및 개인정보 관련 요청을 할 수 있습니다.",
        ],
      },
      {
        id: "retention",
        heading: "7. 보관 기간",
        paragraphs: [
          "계정이 활성 상태인 동안 데이터를 보관하며, 계정 삭제 요청 시 식별 정보는 30일 이내에 파기되고 보안 로그는 최대 90일간 보관 후 자동 삭제됩니다.",
        ],
      },
    ],
  },
  ja: {
    title: "プライバシーポリシー",
    lastUpdated: "2026-10-22",
    sections: [
      {
        id: "overview",
        heading: "1. 概要",
        paragraphs: [
          "Bravechat はユーザーのプライバシーと個人データの保護を最優先事項としています。本ポリシーでは、収集する情報の種類、利用目的、およびセキュリティ対策について説明します。",
        ],
      },
      {
        id: "data-collected",
        heading: "2. 収集するデータ",
        table: {
          headers: ["データ区分", "詳細"],
          rows: [
            ["アカウント情報", "メールアドレス、ユーザー名、表示名、および一方向ハッシュ化されたパスワード。"],
            ["通信コンテンツ", "チャンネルやダイレクトメッセージで送信されたテキストおよび添付ファイル。"],
            ["セッション情報", "デバイス管理のためのログイン日時、IPアドレス、ブラウザ情報。"],
            ["サーバー・ロール情報", "作成または参加しているサーバー、チャンネル、ロール設定。"],
          ],
        },
        afterNote: "決済情報、連絡先リスト、GPS位置情報は収集しません。",
      },
      {
        id: "purpose",
        heading: "3. 利用目的",
        bullets: [
          "リアルタイムメッセージおよび音声通話の提供とデバイス間同期のため。",
          "本人確認、ワンタイム確認コードの送信、および不正アクセス防止のため。",
          "ロールに基づくプライベートチャンネルのアクセス制御のため。",
          "スパムや不正利用、ネットワーク攻撃の検知・防御のため。",
        ],
      },
      {
        id: "storage",
        heading: "4. 保管とセキュリティ対策",
        bullets: [
          "パスワードは一方向ハッシュ化され、平文では一切保存されません。",
          "二要素認証（2FA）およびリモートセッション解除機能を提供します。",
          "すべての通信は HTTPS/TLS により暗号化されます。",
          "アップロードされたファイルの実形式（マジックバイト）を検証します。",
        ],
      },
      {
        id: "sharing",
        heading: "5. 第三者への提供",
        paragraphs: [
          "Bravechat は個人データを第三者に販売することはありません。サービス運営に必要な最小限の範囲で認定クラウド基盤を利用する場合、または法令に基づく場合を除き、外部へ提供しません。",
        ],
      },
      {
        id: "rights",
        heading: "6. ユーザーの権利",
        bullets: [
          "アカウント設定からいつでもプロフィール情報を確認・変更できます。",
          "ログイン中のデバイス一覧を確認し、不要なセッションを即時解除できます。",
          "自身が送信したメッセージや添付ファイル、所有サーバーを削除できます。",
          "公式サポート窓口を通じてアカウント削除やデータに関する問い合わせを行えます。",
        ],
      },
      {
        id: "retention",
        heading: "7. データの保存期間",
        paragraphs: [
          "アカウントが有効な期間中データを保持します。アカウント削除後、個人識別情報は30日以内に削除され、セキュリティ監査ログは最大90日間保持された後に消去されます。",
        ],
      },
    ],
  },
};

export const TERMS_PACK: Record<LegalLocale, LegalDocumentPack> = {
  vi: {
    title: "Điều khoản Sử dụng",
    lastUpdated: "22/10/2026",
    sections: [
      {
        id: "acceptance",
        heading: "1. Chấp nhận điều khoản",
        paragraphs: [
          "Khi truy cập hoặc sử dụng nền tảng Bravechat, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ các Điều khoản Sử dụng này. Nếu không đồng ý với bất kỳ nội dung nào, vui lòng ngừng sử dụng dịch vụ.",
        ],
      },
      {
        id: "service",
        heading: "2. Mô tả dịch vụ",
        paragraphs: [
          "Bravechat cung cấp không gian giao tiếp thời gian thực cho phép người dùng tạo máy chủ, tổ chức kênh văn bản và phòng thoại, phân quyền thành viên và chia sẻ tệp đính kèm.",
        ],
      },
      {
        id: "account",
        heading: "3. Tài khoản người dùng",
        bullets: [
          "Người dùng phải từ đủ 13 tuổi trở lên để đăng ký và sử dụng dịch vụ.",
          "Bạn có trách nhiệm bảo mật thông tin đăng nhập và các mã xác thực của tài khoản.",
          "Không tạo nhiều tài khoản tự động nhằm mục đích spam hoặc lách quy định quản trị.",
          "Cung cấp thông tin chính xác khi đăng ký để đảm bảo khả năng khôi phục tài khoản.",
        ],
      },
      {
        id: "conduct",
        heading: "4. Quy tắc ứng xử",
        bullets: [
          "Không quấy rối, đe dọa, mạo danh hoặc xâm phạm quyền riêng tư của cá nhân, tổ chức khác.",
          "Không phát tán mã độc, liên kết lừa đảo (phishing), thư rác hoặc nội dung vi phạm pháp luật.",
          "Không thực hiện các cuộc tấn công làm gián đoạn dịch vụ hoặc cố tình khai thác trái phép hệ thống.",
        ],
      },
      {
        id: "content",
        heading: "5. Nội dung người dùng",
        paragraphs: [
          "Bạn giữ quyền sở hữu đối với nội dung do mình tạo ra. Khi gửi nội dung lên nền tảng, bạn cho phép hệ thống lưu trữ và truyền tải nội dung đó tới các thành viên có quyền xem trong kênh hoặc cuộc trò chuyện tương ứng.",
        ],
      },
      {
        id: "termination",
        heading: "6. Tạm ngừng & Chấm dứt",
        paragraphs: [
          "Chúng tôi có quyền tạm khóa hoặc chấm dứt quyền truy cập đối với các tài khoản vi phạm nghiêm trọng Quy tắc ứng xử hoặc gây nguy hại cho an toàn hệ thống. Bạn cũng có thể chủ động ngừng sử dụng bất kỳ lúc nào.",
        ],
      },
      {
        id: "governing",
        heading: "7. Luật áp dụng",
        paragraphs: [
          "Các Điều khoản này được điều chỉnh và giải thích theo quy định pháp luật hiện hành tại Việt Nam.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of Service",
    lastUpdated: "2026-10-22",
    sections: [
      {
        id: "acceptance",
        heading: "1. Acceptance of Terms",
        paragraphs: [
          "By accessing or using Bravechat, you confirm that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree, please discontinue use of the platform.",
        ],
      },
      {
        id: "service",
        heading: "2. Service Description",
        paragraphs: [
          "Bravechat provides a real-time communication platform where users can create community servers, organize text and voice channels, manage role permissions, and share files.",
        ],
      },
      {
        id: "account",
        heading: "3. User Accounts",
        bullets: [
          "You must be at least 13 years of age to register and use Bravechat.",
          "You are responsible for safeguarding your password, active sessions, and verification codes.",
          "Automated bulk account creation or circumvention of platform safeguards is prohibited.",
          "You agree to provide accurate account information to ensure account recovery support.",
        ],
      },
      {
        id: "conduct",
        heading: "4. Acceptable Use & Conduct",
        bullets: [
          "Do not harass, threaten, impersonate, or violate the privacy rights of others.",
          "Do not distribute malware, phishing links, spam, or unlawful content.",
          "Do not attempt to disrupt platform availability, flood endpoints, or probe unauthorized resources.",
        ],
      },
      {
        id: "content",
        heading: "5. User Content",
        paragraphs: [
          "You retain ownership of the content you create and share. By submitting content, you grant Bravechat a limited license to store and transmit that content to authorized members of the target channel or conversation.",
        ],
      },
      {
        id: "termination",
        heading: "6. Suspension & Termination",
        paragraphs: [
          "We reserve the right to suspend or terminate accounts that violate these Terms or threaten platform security. You may also stop using the service or close your account at any time.",
        ],
      },
      {
        id: "governing",
        heading: "7. Governing Law",
        paragraphs: [
          "These Terms of Service are governed by and construed in accordance with the applicable laws of Vietnam.",
        ],
      },
    ],
  },
  zh: {
    title: "服务条款",
    lastUpdated: "2026-10-22",
    sections: [
      {
        id: "acceptance",
        heading: "1. 条款接受",
        paragraphs: [
          "访问或使用 Bravechat 即表示您确认已阅读、理解并同意遵守本服务条款。如果您不同意任何条款，请停止使用本服务。",
        ],
      },
      {
        id: "service",
        heading: "2. 服务说明",
        paragraphs: [
          "Bravechat 提供实时通信平台，支持用户创建服务器、管理文字与语音频道、配置角色权限以及共享文件。",
        ],
      },
      {
        id: "account",
        heading: "3. 用户账户",
        bullets: [
          "您必须年满 13 周岁方可注册并使用 Bravechat。",
          "您有责任妥善保管登录凭据、活动会话与验证码。",
          "严禁批量恶意注册账户或绕过平台安全限制。",
          "注册时请提供真实有效的信息，以便在需要时找回账户。",
        ],
      },
      {
        id: "conduct",
        heading: "4. 行为准则",
        bullets: [
          "禁止骚扰、威胁、冒充他人或侵犯他人隐私权。",
          "禁止传播恶意软件、钓鱼链接、垃圾信息或违法内容。",
          "禁止对平台发起拒绝服务攻击、高频洪水请求或未授权探测。",
        ],
      },
      {
        id: "content",
        heading: "5. 用户内容",
        paragraphs: [
          "您保留对自己所创建内容的完整所有权。发布内容即表示您授权平台在目标频道或会话的授权成员范围内存储与传输该内容。",
        ],
      },
      {
        id: "termination",
        heading: "6. 服务中止与终止",
        paragraphs: [
          "对于违反本条款或威胁平台安全的账户，我们保留暂停或终止其访问权限的权利。您也可以随时停止使用或注销账户。",
        ],
      },
      {
        id: "governing",
        heading: "7. 适用法律",
        paragraphs: [
          "本服务条款受越南现行适用法律管辖并按其解释。",
        ],
      },
    ],
  },
  ko: {
    title: "이용약관",
    lastUpdated: "2026-10-22",
    sections: [
      {
        id: "acceptance",
        heading: "1. 약관의 동의",
        paragraphs: [
          "Bravechat에 접속하거나 서비스를 이용함으로써 귀하는 본 이용약관을 읽고 이해했으며 이에 동의한 것으로 간주됩니다. 약관에 동의하지 않으실 경우 서비스 이용을 중단해 주시기 바랍니다.",
        ],
      },
      {
        id: "service",
        heading: "2. 서비스 설명",
        paragraphs: [
          "Bravechat은 커뮤니티 서버 생성, 텍스트 및 음성 채널 운영, 역할 기반 권한 관리 및 파일 공유를 지원하는 실시간 커뮤니케이션 플랫폼입니다.",
        ],
      },
      {
        id: "account",
        heading: "3. 사용자 계정",
        bullets: [
          "서비스에 가입하고 이용하려면 만 13세 이상이어야 합니다.",
          "비밀번호, 활성 세션 및 인증 코드를 안전하게 관리할 책임은 사용자에게 있습니다.",
          "자동화된 대량 계정 생성이나 보안 정책 우회 행위는 금지됩니다.",
          "계정 복구 지원을 위해 정확한 정보를 제공해야 합니다.",
        ],
      },
      {
        id: "conduct",
        heading: "4. 이용 수칙",
        bullets: [
          "타인을 괴롭히거나 위협, 사칭 또는 개인정보를 침해하는 행위를 금지합니다.",
          "악성코드, 피싱 링크, 스팸 또는 불법 콘텐츠 유포를 금지합니다.",
          "서비스 가용성을 방해하거나 비인가 리소스에 접근하려는 시도를 금지합니다.",
        ],
      },
      {
        id: "content",
        heading: "5. 사용자 콘텐츠",
        paragraphs: [
          "사용자가 생성하고 공유한 콘텐츠의 소유권은 사용자에게 유지됩니다. 콘텐츠를 게시하면 해당 채널 또는 대화의 권한 있는 멤버에게 콘텐츠를 저장 및 전송할 수 있는 권한을 플랫폼에 부여하게 됩니다.",
        ],
      },
      {
        id: "termination",
        heading: "6. 이용 제한 및 해지",
        paragraphs: [
          "본 약관을 위반하거나 시스템 보안을 위협하는 계정에 대해 사전 통지 없이 접근을 제한하거나 해지할 수 있습니다. 사용자 또한 언제든지 계정 이용을 중단할 수 있습니다.",
        ],
      },
      {
        id: "governing",
        heading: "7. 준거법",
        paragraphs: [
          "본 이용약관은 베트남의 현행 관련 법령에 따라 규율되고 해석됩니다.",
        ],
      },
    ],
  },
  ja: {
    title: "利用規約",
    lastUpdated: "2026-10-22",
    sections: [
      {
        id: "acceptance",
        heading: "1. 規約への同意",
        paragraphs: [
          "Bravechat にアクセスまたは利用することにより、本利用規約を読み、理解し、同意したものとみなされます。同意されない場合は、サービスの利用をお控えください。",
        ],
      },
      {
        id: "service",
        heading: "2. サービス内容",
        paragraphs: [
          "Bravechat は、サーバーの作成、テキストおよび音声チャンネルの管理、ロール権限の設定、ファイル共有を行えるリアルタイムコミュニケーション基盤を提供します。",
        ],
      },
      {
        id: "account",
        heading: "3. ユーザーアカウント",
        bullets: [
          "本サービスを利用するには13歳以上である必要があります。",
          "パスワード、ログインセッション、および確認コードの管理は利用者ご自身の責任となります。",
          "自動化された大量アカウント作成や安全対策の回避行為は禁止されています。",
          "アカウント復旧のため、登録時には正確な情報を入力してください。",
        ],
      },
      {
        id: "conduct",
        heading: "4. 禁止事項",
        bullets: [
          "他者への嫌がらせ、脅迫、なりすまし、またはプライバシー侵害行為。",
          "マルウェア、フィッシングリンク、スパム、または違法コンテンツの配布。",
          "サービスの妨害、大量リクエストによる負荷攻撃、または不正アクセスの試み。",
        ],
      },
      {
        id: "content",
        heading: "5. ユーザーコンテンツ",
        paragraphs: [
          "投稿されたコンテンツの所有権はユーザーに帰属します。コンテンツを送信することで、対象チャンネルまたは会話の権限を持つメンバーへ配信・保存するための必要な権利をプラットフォームに許諾するものとします。",
        ],
      },
      {
        id: "termination",
        heading: "6. 利用停止および終了",
        paragraphs: [
          "本規約への違反やシステムの安全性を脅かす行為が確認された場合、アカウントを停止または削除することがあります。ユーザーはいつでも利用を終了できます。",
        ],
      },
      {
        id: "governing",
        heading: "7. 準拠法",
        paragraphs: [
          "本利用規約はベトナムの適用法令に準拠し、解釈されるものとします。",
        ],
      },
    ],
  },
};

export const LEGAL_DOCUMENTS: Record<
  LegalPageKey,
  Record<LegalLocale, LegalDocumentPack>
> = {
  cookies: COOKIES_PACK,
  privacy: PRIVACY_PACK,
  terms: TERMS_PACK,
};
