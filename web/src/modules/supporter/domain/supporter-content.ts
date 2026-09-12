export type LocalizedText = { vi: string; en: string };

export type ProviderHelpGuide = {
  providerId: string;
  title: LocalizedText;
  intro: LocalizedText;
  steps: LocalizedText[];
  securityNote: LocalizedText;
};

export type SupporterQuestion = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
};

const sharedSecurityNote: LocalizedText = {
  vi: "Chỉ nhập credential vào form của Gateway. Không gửi API key, secret hoặc access token vào nội dung chat của GPT.",
  en: "Enter credentials only in the Gateway form. Never paste API keys, secrets, or access tokens into GPT chat content.",
};

export const PROVIDER_HELP_GUIDES: Record<string, ProviderHelpGuide> = {
  stitch: {
    providerId: "stitch",
    title: { vi: "Kết nối Google Stitch", en: "Connect Google Stitch" },
    intro: { vi: "Tạo credential từ tài khoản Google/Stitch mà bạn muốn Gateway sử dụng.", en: "Create the credential from the Google/Stitch account you want Gateway to use." },
    steps: [
      { vi: "Mở phần quản lý credential/API của tài khoản Stitch hoặc Google liên quan.", en: "Open the credential/API management area for the related Stitch or Google account." },
      { vi: "Tạo credential mới với quyền tối thiểu cần cho workflow của bạn.", en: "Create a new credential with only the permissions your workflow needs." },
      { vi: "Quay lại Gateway, dán credential vào ô tương ứng, bấm Kiểm tra kết nối rồi Lưu credential.", en: "Return to Gateway, paste the credential into the matching field, then Test connection and Save credential." },
    ],
    securityNote: sharedSecurityNote,
  },
  github: {
    providerId: "github",
    title: { vi: "Kết nối GitHub", en: "Connect GitHub" },
    intro: { vi: "Gateway hiện kết nối GitHub bằng OAuth, nên bạn không cần dán Personal Access Token vào form này.", en: "Gateway currently connects GitHub through OAuth, so you do not need to paste a Personal Access Token into this form." },
    steps: [
      { vi: "Bấm nút kết nối GitHub trong card provider.", en: "Click the GitHub connect button in the provider card." },
      { vi: "Đăng nhập GitHub nếu được yêu cầu và xem kỹ phạm vi quyền trước khi chấp thuận.", en: "Sign in to GitHub if prompted and review the requested access before approving." },
      { vi: "Sau khi GitHub chuyển về Gateway, kiểm tra chấm trạng thái đã chuyển sang xanh.", en: "After GitHub redirects back to Gateway, confirm the status dot turns green." },
    ],
    securityNote: sharedSecurityNote,
  },
  notion: {
    providerId: "notion",
    title: { vi: "Kết nối Notion", en: "Connect Notion" },
    intro: { vi: "Gateway dùng OAuth cho Notion; hãy cấp quyền cho đúng workspace/pages cần thiết.", en: "Gateway uses OAuth for Notion; grant access only to the workspace/pages you need." },
    steps: [
      { vi: "Bấm kết nối Notion từ card provider.", en: "Click Connect Notion from the provider card." },
      { vi: "Chọn workspace và các tài nguyên bạn muốn cho phép Gateway truy cập.", en: "Choose the workspace and resources you want Gateway to access." },
      { vi: "Chấp thuận OAuth, quay lại Gateway và xác nhận trạng thái kết nối.", en: "Approve OAuth, return to Gateway, and confirm the connection status." },
    ],
    securityNote: sharedSecurityNote,
  },
  "google-workspace": {
    providerId: "google-workspace",
    title: { vi: "Kết nối Google Workspace", en: "Connect Google Workspace" },
    intro: { vi: "Google Workspace dùng OAuth; không cần tự tạo API key cho luồng kết nối người dùng này.", en: "Google Workspace uses OAuth; you do not need to create an API key for this user connection flow." },
    steps: [
      { vi: "Bấm kết nối Google Workspace.", en: "Click Connect Google Workspace." },
      { vi: "Chọn tài khoản Google và kiểm tra các quyền Docs/Sheets được yêu cầu.", en: "Choose your Google account and review the requested Docs/Sheets permissions." },
      { vi: "Chấp thuận rồi quay lại Gateway để kiểm tra trạng thái kết nối.", en: "Approve and return to Gateway to confirm the connection status." },
    ],
    securityNote: sharedSecurityNote,
  },
  figma: {
    providerId: "figma",
    title: { vi: "Kết nối Figma", en: "Connect Figma" },
    intro: { vi: "Làm theo loại credential hiển thị trên card Figma của Gateway: OAuth thì authorize trực tiếp; API key/token thì tạo từ phần developer/settings của Figma.", en: "Follow the credential type shown on the Figma card: authorize directly for OAuth, or create the token from Figma developer/settings when an API key/token is requested." },
    steps: [
      { vi: "Kiểm tra card đang yêu cầu OAuth hay API key/token.", en: "Check whether the card requests OAuth or an API key/token." },
      { vi: "Với OAuth: bấm kết nối và duyệt quyền. Với token: tạo token mới trong tài khoản Figma với phạm vi tối thiểu.", en: "For OAuth: connect and review permissions. For a token: create a new token in your Figma account with minimum scope." },
      { vi: "Hoàn tất kết nối và dùng chức năng kiểm tra credential của Gateway nếu có.", en: "Complete the connection and use Gateway credential testing when available." },
    ],
    securityNote: sharedSecurityNote,
  },
  lovable: {
    providerId: "lovable",
    title: { vi: "Kết nối Lovable", en: "Connect Lovable" },
    intro: { vi: "Gateway đang dùng OAuth cho Lovable, vì vậy credential được cấp qua bước authorize thay vì dán secret vào GPT.", en: "Gateway currently uses OAuth for Lovable, so credentials are granted through authorization instead of pasting a secret into GPT." },
    steps: [
      { vi: "Bấm kết nối Lovable trên card provider.", en: "Click Connect Lovable on the provider card." },
      { vi: "Đăng nhập Lovable và xem các quyền mà provider yêu cầu.", en: "Sign in to Lovable and review the permissions requested by the provider." },
      { vi: "Chấp thuận, quay lại Gateway và kiểm tra trạng thái provider.", en: "Approve, return to Gateway, and verify the provider status." },
    ],
    securityNote: sharedSecurityNote,
  },
};

export const SUPPORTER_QUESTIONS: SupporterQuestion[] = [
  ...Object.values(PROVIDER_HELP_GUIDES).map((guide) => ({
    id: `provider-${guide.providerId}`,
    question: { vi: `Lấy API key/secret hoặc kết nối ${guide.title.vi.replace("Kết nối ", "")} như thế nào?`, en: `How do I get the API key/secret or connect ${guide.title.en.replace("Connect ", "")}?` },
    answer: { vi: `${guide.intro.vi} ${guide.steps.map((step, index) => `${index + 1}. ${step.vi}`).join(" ")}`, en: `${guide.intro.en} ${guide.steps.map((step, index) => `${index + 1}. ${step.en}`).join(" ")}` },
  })),
  {
    id: "credential-safety",
    question: { vi: "Credential của provider có đi vào GPT context không?", en: "Do provider credentials enter GPT context?" },
    answer: { vi: "Không. Credential được gửi tới Gateway backend và lưu theo cơ chế mã hóa của Gateway. Không dán credential vào chat với GPT.", en: "No. Credentials are sent to the Gateway backend and stored using Gateway encryption. Do not paste credentials into GPT chat." },
  },
  {
    id: "oauth-vs-api-key",
    question: { vi: "OAuth khác API key ở bước kết nối như thế nào?", en: "How does OAuth differ from an API key during connection?" },
    answer: { vi: "OAuth mở trang provider để bạn duyệt quyền và provider trả credential về Gateway. Với API key, bạn tự tạo key ở provider rồi nhập key vào form Gateway.", en: "OAuth opens the provider authorization flow and returns credentials to Gateway. With an API key, you create the key at the provider and enter it into the Gateway form." },
  },
];

export function getProviderHelpGuide(providerId: string): ProviderHelpGuide | undefined {
  return PROVIDER_HELP_GUIDES[providerId];
}
