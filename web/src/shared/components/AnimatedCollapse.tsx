import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AnimatedCollapseProps = {
  children: ReactNode;
  className?: string;
  open: boolean;
};

export function AnimatedCollapse({
  children,
  className = "",
  open,
}: AnimatedCollapseProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const measure = () => {
      const nextHeight = Math.ceil(content.getBoundingClientRect().height);
      setContentHeight((current) =>
        current === nextHeight ? current : nextHeight,
      );
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(content);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!open}
      className={`animated-collapse ${open ? "is-open" : ""} ${className}`.trim()}
      inert={!open}
      style={{ height: open ? `${contentHeight}px` : "0px" }}
    >
      <div className="animated-collapse__inner" ref={contentRef}>
        {children}
      </div>
    </div>
  );
}
