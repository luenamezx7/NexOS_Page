import { redirect } from 'next/navigation';
import { commercialHref } from '@/lib/commercial';

export default function SuccessPage() {
  redirect(commercialHref());
}
