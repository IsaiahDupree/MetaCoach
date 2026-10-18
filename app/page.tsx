import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to connect page
  redirect('/connect')
}
