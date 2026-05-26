import styles from "./Input.module.css";

/**
 * @param {React.ReactNode} leftIcon - icon shown on left side
 * @param {React.ReactNode} rightIcon - icon shown on right side (clickable)
 * @param {() => void} onRightIconClick
 */
export default function Input({
  label,
  leftIcon,
  rightIcon,
  onRightIconClick,
  error,
  id,
  className = "",
  ...props
}) {
  return (
    <div className={styles.wrapper}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ""}`}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          id={id}
          className={[styles.input, leftIcon ? styles.withLeft : "", rightIcon ? styles.withRight : "", className].filter(Boolean).join(" ")}
          {...props}
        />
        {rightIcon && (
          <button type="button" className={styles.rightIcon} onClick={onRightIconClick} tabIndex={-1}>
            {rightIcon}
          </button>
        )}
      </div>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
}
