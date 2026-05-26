import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../../pages/parkmeters/ParkmetersPage.module.css";

export default function ActionMenu({ parkmeter }) {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  return (
    <div className={styles.actionWrapper}>
      <button
        className={styles.dotsButton}
        onClick={() => setOpen((prev) => !prev)}
      >
        ⋮
      </button>

      {open && (
        <div className={styles.actionMenu}>
          <button
            className={styles.actionItem}
            onClick={() => {
              navigate(`/parkmeters/${parkmeter.id}`);
              setOpen(false);
            }}
          >
            Voir détails
          </button>
        </div>
      )}
    </div>
  );
}