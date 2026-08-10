import { getEventCategory } from "./validateEventCategory"

export const getCtaLabel = (
  category: ReturnType<typeof getEventCategory>,
  canRegister: boolean
): string | null => {
  if (category === 'Past')     return 'Lihat Detail'
  if (category === 'On Going') return canRegister ? 'Register Now' : 'Lihat Detail'
  if (category === 'Upcoming') return canRegister ? 'Register Now' : null
  
  return null
}