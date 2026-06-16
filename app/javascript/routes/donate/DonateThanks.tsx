import { useNavigate, useParams } from "react-router";
import { useT } from "../../lib/i18n";
import styles from "./donate.module.css";

export default function DonateThanks() {
  const t = useT();
  const navigate = useNavigate();
  const { locale, currency, id } = useParams();

  return (
    <div className={styles.thanks}>
      <div className={styles.thanksMark} aria-hidden="true">🧡</div>
      <h2 className={styles.stepTitle}>{t("thankYouTitle")}</h2>
      <p>{t("thankYouBody")}</p>
      <button type="button" className={styles.primary} onClick={() => navigate(`/${locale}/${currency}/campaigns/${id}`)}>
        {t("thankYouClose")}
      </button>
    </div>
  );
}
