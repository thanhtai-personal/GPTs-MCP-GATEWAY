import { CheckCircle2, Clock3, Copy, KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { AccountProfile } from "@/modules/auth/domain/auth.types";
import {
  useClaimTrial,
  useCreateGatewayToken,
  useCreateOpenId,
  useOpenIds,
  useTrialStatus,
} from "@/modules/open-id/queries/open-id.queries";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function OpenIdPanel({
  accessToken,
  account,
}: {
  accessToken: string;
  account: AccountProfile;
}) {
  const { t } = useUiLanguage();
  const trial = useTrialStatus(accessToken);
  const openIds = useOpenIds(accessToken);
  const claim = useClaimTrial(accessToken);
  const createOpenId = useCreateOpenId(accessToken);
  const createToken = useCreateGatewayToken(accessToken);
  const [oneTimeToken, setOneTimeToken] = useState<string | null>(null);

  const isMember = account.membershipTier === "member";
  const trialStatus = trial.data?.status ?? "available";

  return (
    <div className="open-id-layout cinematic-entitlements">
      <div className="entitlement-diagnostics">
        <div><span>ACCOUNT</span><strong>{isMember ? "MEMBER" : "GUEST"}</strong><small>Commercial access tier</small></div>
        <div><span>TRIAL</span><strong>{trialStatus.toUpperCase()}</strong><small>One trial per account lifetime</small></div>
        <div><span>OPEN ID</span><strong>{isMember ? "ACTIVE" : "REQUIRED"}</strong><small>Execution entitlement</small></div>
        <div><span>BOUNDARY</span><strong>ENFORCED</strong><small>Every real MCP call</small></div>
      </div>

      <section className="card open-id-product-card open-id-product-card--cinematic">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">CORE PRODUCT</span>
            <h2>Open ID</h2>
          </div>
          <span className={`status ${isMember ? "good" : ""}`}>
            {isMember ? "MEMBER" : "GUEST"}
          </span>
        </div>

        <p className="lead small">
          {t(
            "Entitlement thương mại để Custom GPT được phép execute MCP qua Gateway. Token chỉ là credential kỹ thuật gắn với entitlement này.",
            "The commercial entitlement that authorizes Custom GPT to execute MCP through Gateway. Tokens are technical credentials bound to this entitlement.",
          )}
        </p>

        <div className="open-id-invariant">
          <ShieldCheck size={19} />
          <div>
            <strong>{t("Gateway invariant", "Gateway invariant")}</strong>
            <p>
              {t(
                "Mọi MCP execution phải resolve được active Open ID entitlement.",
                "Every MCP execution must resolve an active Open ID entitlement.",
              )}
            </p>
          </div>
        </div>
      </section>

      {!isMember ? (
        <GuestAccessCard
          claimPending={claim.isPending}
          expiresAt={trial.data?.expiresAt ?? null}
          onClaim={() =>
            claim.mutate(undefined, {
              onSuccess: (data) => setOneTimeToken(data.accessToken),
            })
          }
          status={trialStatus}
        />
      ) : (
        <MemberOpenIdCard
          createOpenIdPending={createOpenId.isPending}
          createTokenPending={createToken.isPending}
          onCreateOpenId={() => createOpenId.mutate()}
          onCreateToken={(openIdId) =>
            createToken.mutate(openIdId, {
              onSuccess: (data) => setOneTimeToken(data.accessToken),
            })
          }
          openIds={openIds.data ?? []}
        />
      )}

      {oneTimeToken ? (
        <section className="card secret-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">GATEWAY TOKEN</span>
              <h3>{t("Chỉ hiển thị một lần", "Shown once")}</h3>
            </div>
            <span className="status good"><CheckCircle2 size={14} /> READY</span>
          </div>
          <p className="muted">
            {t(
              "Dùng token này làm Bearer authentication cho GPT Action. Token không thay thế Open ID.",
              "Use this token as Bearer authentication for the GPT Action. The token does not replace Open ID.",
            )}
          </p>
          <div className="secret-token">
            <code>{oneTimeToken}</code>
            <button
              className="secondary"
              onClick={() => void navigator.clipboard.writeText(oneTimeToken)}
              type="button"
            >
              <Copy size={15} /> {t("Sao chép", "Copy")}
            </button>
          </div>
        </section>
      ) : null}

      {claim.error ? <p className="notice error">{claim.error.message}</p> : null}
      {createOpenId.error ? <p className="notice error">{createOpenId.error.message}</p> : null}
      {createToken.error ? <p className="notice error">{createToken.error.message}</p> : null}
      {trial.error ? <p className="notice error">{trial.error.message}</p> : null}
      {openIds.error ? <p className="notice error">{openIds.error.message}</p> : null}
    </div>
  );
}

function GuestAccessCard({
  claimPending,
  expiresAt,
  onClaim,
  status,
}: {
  claimPending: boolean;
  expiresAt: string | null;
  onClaim: () => void;
  status: "available" | "active" | "consumed" | "not_applicable";
}) {
  const { t } = useUiLanguage();
  const active = status === "active";
  const available = status === "available";

  return (
    <section className="card access-state-card">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">GUEST ACCESS</span>
          <h2>
            {available
              ? t("Dùng thử Gateway 7 ngày", "Try Gateway free for 7 days")
              : active
                ? t("Trial đang hoạt động", "Trial Active")
                : t("Trial đã sử dụng", "Trial Expired")}
          </h2>
        </div>
        <span className={`status ${active ? "good" : ""}`}>
          {active ? "ACTIVE" : available ? "AVAILABLE" : "INACTIVE"}
        </span>
      </div>

      <div className="access-timeline">
        <div className={available || active ? "done" : ""}><span>01</span><strong>{t("Cấu hình Stitch", "Configure Stitch")}</strong></div>
        <div className={active ? "done" : ""}><span>02</span><strong>{t("Tạo Trial Token", "Create Trial Token")}</strong></div>
        <div className={active ? "done" : ""}><span>03</span><strong>{t("7 ngày Gateway access", "7-day Gateway access")}</strong></div>
      </div>

      {available ? (
        <>
          <p className="muted">
            {t(
              "Trial không bắt đầu khi đăng ký, đăng nhập, thêm Stitch credential hoặc tải GPT kit. Nó bắt đầu chính xác khi bạn bấm nút bên dưới.",
              "Trial does not start on registration, login, Stitch setup, or GPT kit download. It starts exactly when you press the button below.",
            )}
          </p>
          <button disabled={claimPending} onClick={onClaim} type="button">
            <Clock3 size={16} /> {t("Tạo Trial Token", "Create Trial Token")}
          </button>
        </>
      ) : active ? (
        <div className="trial-active-box">
          <CheckCircle2 size={20} />
          <div>
            <strong>{t("Trial Open ID đang hoạt động", "Trial Open ID is active")}</strong>
            <p>{expiresAt ? t(`Hết hạn: ${expiresAt}`, `Expires: ${expiresAt}`) : t("Đang hoạt động", "Active now")}</p>
          </div>
        </div>
      ) : (
        <div className="trial-expired-box">
          <KeyRound size={20} />
          <div>
            <strong>{t("Cần Open ID để tiếp tục", "Open ID required to continue")}</strong>
            <p>
              {t(
                "Trial là một lần duy nhất cho mỗi account và không reset khi token bị revoke hoặc xóa.",
                "Trial is lifetime-once per account and is not reset when its token is revoked or deleted.",
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function MemberOpenIdCard({
  createOpenIdPending,
  createTokenPending,
  onCreateOpenId,
  onCreateToken,
  openIds,
}: {
  createOpenIdPending: boolean;
  createTokenPending: boolean;
  onCreateOpenId: () => void;
  onCreateToken: (openIdId: string) => void;
  openIds: Array<{
    id: string;
    open_id: string;
    status: "active" | "revoked";
  }>;
}) {
  const { t } = useUiLanguage();

  return (
    <section className="card member-open-id-card">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">MEMBER ENTITLEMENT</span>
          <h2>{t("Open ID của bạn", "Your Open ID")}</h2>
        </div>
        <span className="status good">MEMBER</span>
      </div>

      {openIds.length ? (
        <div className="open-id-list">
          {openIds.map((item) => (
            <div className="open-id-row" key={item.id}>
              <div className="open-id-row__icon"><KeyRound size={18} /></div>
              <div className="open-id-row__meta">
                <code>{item.open_id}</code>
                <span className={`status ${item.status === "active" ? "good" : ""}`}>{item.status.toUpperCase()}</span>
              </div>
              <button
                className="secondary"
                disabled={createTokenPending || item.status !== "active"}
                onClick={() => onCreateToken(item.id)}
                type="button"
              >
                {t("Tạo Gateway Token", "Generate Gateway Token")}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <KeyRound size={24} />
          <strong>{t("Chưa có Open ID", "No Open ID yet")}</strong>
          <p className="muted">
            {t(
              "Account Member có thể kích hoạt Open ID thương mại và dùng nó để tạo Gateway token.",
              "Member accounts can activate a commercial Open ID and use it to generate Gateway tokens.",
            )}
          </p>
          <button disabled={createOpenIdPending} onClick={onCreateOpenId} type="button">
            {t("Kích hoạt Open ID", "Activate Open ID")}
          </button>
        </div>
      )}
    </section>
  );
}
