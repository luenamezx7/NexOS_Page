import styles from './ProfileOrb.module.css';

/** A small lit sphere inspired by -/user-icon.png; the link supplies its accessible name. */
export function ProfileOrb() {
  return <span className={styles.orb} data-profile-orb aria-hidden="true"><span /></span>;
}
