import { useEffect, useRef } from "react";
import { Outlet, useNavigate, useOutletContext, useParams } from "react-router";
import type { Campaign } from "../../lib/types";
import { useT } from "../../lib/i18n";
import styles from "./donate.module.css";

// Native <dialog> gives focus-trap + ESC for free; we sync showModal()/close() to the
// route's mount/unmount and map cancel + backdrop-click to closing (navigate up).
export default function DonateModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const { locale, currency, id } = useParams();
  const campaign = useOutletContext<Campaign>();
  const t = useT();

  const close = () => navigate(`/${locale}/${currency}/campaigns/${id}`);

  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close(); // backdrop click
      }}
    >
      <div className={styles.inner}>
        <button type="button" className={styles.close} onClick={close} aria-label={t("close")}>
          ×
        </button>
        <Outlet context={campaign} />
      </div>
    </dialog>
  );
}
