import { useNavigate, useParams } from "react-router";
import { he } from "../../locales/he";
import styles from "./donate.module.css";

export default function DonateThanks() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className={styles.thanks}>
      <div className={styles.thanksMark} aria-hidden="true">🧡</div>
      <h2 className={styles.stepTitle}>{he.thankYouTitle}</h2>
      <p>{he.thankYouBody}</p>
      <button type="button" className={styles.primary} onClick={() => navigate(`/campaigns/${id}`)}>
        {he.thankYouClose}
      </button>
    </div>
  );
}
