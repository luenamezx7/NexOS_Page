import { redirect } from 'next/navigation';
import { commercialHref } from '@/lib/commercial';

export default function CancelPage() {
  redirect(commercialHref());
}
