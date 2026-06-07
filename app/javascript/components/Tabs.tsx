import { useState, type ReactNode } from "react";
import { he } from "../locales/he";
import styles from "./Tabs.module.css";

export interface TabDef {
  key: string;
  label: string;
  disabled?: boolean;
  render?: () => ReactNode;
}

export default function Tabs({ tabs }: { tabs: TabDef[] }) {
  const firstEnabled = tabs.find((t) => !t.disabled)?.key ?? tabs[0].key;
  const [active, setActive] = useState(firstEnabled);
  const activeTab = tabs.find((t) => t.key === active);

  return (
    <div>
      <div className={styles.bar} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === active}
            disabled={t.disabled}
            title={t.disabled ? he.comingSoon : undefined}
            className={[
              styles.tab,
              t.key === active ? styles.active : "",
              t.disabled ? styles.disabled : "",
            ].join(" ")}
            onClick={() => !t.disabled && setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className={styles.panel}>
        {activeTab?.render?.()}
      </div>
    </div>
  );
}
