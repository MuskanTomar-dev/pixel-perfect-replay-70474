import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';
export type FestivalEvent = Database['public']['Tables']['events']['Row'];
export const categories = ['All events', 'Hackathon', 'Coding', 'Robotics', 'Design', 'Workshop', 'Cybersecurity'];
export const participantSchema = z.object({ name: z.string().trim().min(1).max(100), email: z.email().trim().toLowerCase().max(255) });
export const registrationSchema = z.object({ eventId: z.uuid(), teamName: z.string().trim().max(80), members: z.array(participantSchema).min(1).max(10), answers: z.record(z.string(),z.string().max(2000)) }).refine(v => new Set(v.members.map(m => m.email)).size === v.members.length, 'Each participant must have a different email');
export const profileSchema = z.object({ display_name: z.string().trim().min(1).max(100), college: z.string().trim().max(150), skills: z.array(z.string().trim().min(1).max(40)).max(20), interests: z.array(z.string().trim().min(1).max(40)).max(20) });
export function recommendationScore(event: Pick<FestivalEvent,'category'|'title'|'description'>, interests: string[], skills: string[]) {
 const words = `${event.category} ${event.title} ${event.description}`.toLowerCase();
 return interests.reduce((n,s)=>n+(words.includes(s.toLowerCase())?3:0),0)+skills.reduce((n,s)=>n+(words.includes(s.toLowerCase())?1:0),0);
}
export function headMeta(title: string, description: string) { return { meta: [{title:`${title} · Hack4Tech EMS`},{name:'description',content:description},{property:'og:title',content:`${title} · Hack4Tech EMS`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}] }; }
export function dateLabel(date: string) { return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',timeZone:'Asia/Kolkata'}).format(new Date(date)); }
