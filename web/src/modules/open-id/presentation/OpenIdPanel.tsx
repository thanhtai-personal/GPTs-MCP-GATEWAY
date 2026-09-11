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

  return (
    <section className="card">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">OPEN ID</span>
          <h2>{t("Quyền Gateway", "Gateway entitlement")}</h2>
        </div>
        <span className={`status ${isMember ? "good" : ""}`}>
          {isMember ? "Member" : "Guest"}
        </span>
      </div>

      {!isMember ? (
        <div className="subcard">
          <strong>{t("Trial một lần / tài khoản", "One trial per account")}</strong>
          <p className="muted">
            {trial.data?.status === "active"
              ? t(`Hết hạn: ${trial.data.expiresAt}`, `Expires: ${trial.data.expiresAt}`)
              : trial.data?.status === "consumed"
                ? t("Trial đã được sử dụng.", "Trial already consumed.")
                : t("7 ngày bắt đầu khi bạn bấm tạo Trial Token.", "Your 7 days start only when you create the Trial Token.")}
          </p>
          {trial.data?.status === "available" ? (
            <button
              disabled={claim.isPending}
              onClick={() =>
                claim.mutate(undefined, {
                  onSuccess: (data) => setOneTimeToken(data.accessToken),
                })
              }
              type="button"
            >
              {t("Tạo Trial Token", "Create Trial Token")}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="subcard">
          <div className="row spread">
            <strong>{t("Open ID của bạn", "Your Open IDs")}</strong>
            {!openIds.data?.length ? (
              <button
                disabled={createOpenId.isPending}
                onClick={() => createOpenId.mutate()}
                type="button"
              >
                {t("Kích hoạt Open ID", "Activate Open ID")}
              </button>
            ) : null}
          </div>
          {openIds.data?.length ? (
            <div className="stack">
              {openIds.data.map((item) => (
                <div className="token-row" key={item.id}>
                  <code>{item.open_id}</code>
                  <button
                    className="secondary"
                    onClick={() =>
                      createToken.mutate(item.id, {
                        onSuccess: (data) => setOneTimeToken(data.accessToken),
                      })
                    }
                    type="button"
                  >
                    {t("Tạo token", "Generate token")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">{t("Chưa có Open ID.", "No Open ID yet.")}</p>
          )}
        </div>
      )}

      {oneTimeToken ? (
        <div className="secret-box">
          <strong>{t("Chỉ hiển thị một lần", "Shown once")}</strong>
          <code>{oneTimeToken}</code>
          <button
            className="secondary"
            onClick={() => void navigator.clipboard.writeText(oneTimeToken)}
            type="button"
          >
            {t("Sao chép", "Copy")}
          </button>
        </div>
      ) : null}

      {claim.error ? <p className="notice error">{claim.error.message}</p> : null}
      {createOpenId.error ? <p className="notice error">{createOpenId.error.message}</p> : null}
      {createToken.error ? <p className="notice error">{createToken.error.message}</p> : null}
    </section>
  );
}
