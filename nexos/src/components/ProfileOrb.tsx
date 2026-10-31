import { UserRound } from 'lucide-react';
import styles from './ProfileOrb.module.css';

/** Shared profile symbol; the parent link or button supplies its accessible name. */
export function ProfileOrb({ className = '' }: { className?: string }) {
  return <span className={`${styles.orb} ${className}`} data-profile-orb aria-hidden="true"><UserRound strokeWidth={1.6} /></span>;
}
