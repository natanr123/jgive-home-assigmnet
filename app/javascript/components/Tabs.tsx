import { useState, type ReactNode } from "react";
import { useT } from "../lib/i18n";
import styles from "./Tabs.module.css";

export interface TabDef {
  key: string;
  label: string;
  disabled?: boolean;
  render?: () => ReactNode;
}

export default function Tabs({ tabs }: { tabs: TabDef[] }) {
  const t = useT();
  const firstEnabled = tabs.find((t) => !t.disabled)?.key ?? tabs[0].key;
  const [active, setActive] = useState(firstEnabled);
  const activeTab = tabs.find((t) => t.key === active);

  return (
    <div>
      <div className={styles.bar} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active}
            disabled={tab.disabled}
            title={tab.disabled ? t("comingSoon") : undefined}
            className={[
              styles.tab,
              tab.key === active ? styles.active : "",
              tab.disabled ? styles.disabled : "",
            ].join(" ")}
            onClick={() => !tab.disabled && setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className={styles.panel}>
        {activeTab?.render?.()}
      </div>
    </div>
  );
}
