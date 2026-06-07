import { useEffect, useRef } from "react";
import { Outlet, useNavigate, useOutletContext, useParams } from "react-router";
import type { Campaign } from "../../lib/types";
import { he } from "../../locales/he";
import styles from "./donate.module.css";

// Native <dialog> gives focus-trap + ESC for free; we sync showModal()/close() to the
// route's mount/unmount and map cancel + backdrop-click to closing (navigate up).
export default function DonateModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const campaign = useOutletContext<Campaign>();

  const close = () => navigate(`/campaigns/${id}`);

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
        <button type="button" className={styles.close} onClick={close} aria-label={he.close}>
          ×
        </button>
        <Outlet context={campaign} />
      </div>
    </dialog>
  );
}
