type BrandLogoProps = {
  className?: string;
  variant?: "compact" | "lockup";
};

export function BrandLogo({
  className = "",
  variant = "compact",
}: BrandLogoProps) {
  if (variant === "lockup") {
    return (
      <span className={`brand-logo brand-logo--lockup ${className}`.trim()}>
        <img
          alt="MCP Gateway by Kai Studio"
          className="brand-logo__asset brand-logo__asset--dark"
          src="/brand/mcp-gateway-lockup-dark.png"
        />
        <img
          alt="MCP Gateway by Kai Studio"
          className="brand-logo__asset brand-logo__asset--light"
          src="/brand/mcp-gateway-lockup-light.png"
        />
      </span>
    );
  }

  return (
    <span className={`brand-logo brand-logo--compact ${className}`.trim()}>
      <span className="brand-logo__mark" aria-hidden="true">
        <img
          alt=""
          className="brand-logo__asset brand-logo__asset--dark"
          src="/brand/mcp-gateway-mark-dark.png"
        />
        <img
          alt=""
          className="brand-logo__asset brand-logo__asset--light"
          src="/brand/mcp-gateway-mark-light.png"
        />
      </span>
      <span className="brand-logo__name">MCP Gateway</span>
    </span>
  );
}
