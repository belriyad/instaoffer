import { redirect } from 'next/navigation';

// /dealer/login was a hard 404. Funnel it to the dedicated, dealer-branded login.
export default function DealerLoginRedirect() {
  redirect('/login/dealer');
}
