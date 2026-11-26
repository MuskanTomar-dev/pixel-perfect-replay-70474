import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';
import { registrationSchema, profileSchema } from './domain';
export const listEvents = createServerFn({method:'GET'}).handler(async()=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']; const url=process.env['SUPABASE_URL'];
 if(!key||!url) throw new Error('Event service is unavailable');
 const client=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(h.get('Authorization')===`Bearer ${key}`&&key.startsWith('sb_'))h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const {data,error}=await client.from('events').select('*').order('starts_at'); if(error)throw new Error(error.message);return data;
});
export const registerEvent=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(registrationSchema).handler(async({data,context})=>{
 const {data:result,error}=await context.supabase.rpc('register_event',{p_event:data.eventId,p_team_name:data.teamName,p_members:data.members,p_answers:data.answers});if(error)throw new Error(error.message);return result;
});
export const saveProfile=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(profileSchema).handler(async({data,context})=>{
 const {error}=await context.supabase.from('profiles').update(data).eq('id',context.userId);if(error)throw new Error(error.message);return true;
});
export const organizerData=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const {data:allowed,error:roleError}=await context.supabase.rpc('is_organizer');if(roleError||!allowed)throw new Error('Organizer access required. Ask the festival administrator to grant access.');
 const [events,passes,attendance,audit]=await Promise.all([context.supabase.from('events').select('*').order('starts_at'),context.supabase.from('passes').select('*').limit(1000),context.supabase.from('attendance').select('*').limit(1000),context.supabase.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(100)]);
 for(const result of [events,passes,attendance,audit])if(result.error)throw new Error(result.error.message);
 return {events:events.data??[],passes:passes.data??[],attendance:attendance.data??[],audit:audit.data??[]};
});
export const eventSchema=z.object({id:z.uuid().optional(),title:z.string().trim().min(1).max(150),slug:z.string().regex(/^[a-z0-9-]+$/).max(150),category:z.string().min(1).max(50),description:z.string().min(1).max(5000),venue:z.string().min(1).max(200),starts_at:z.iso.datetime({offset:true}),deadline:z.iso.datetime({offset:true}),capacity:z.number().int().min(1).max(100000),team_min:z.number().int().min(1).max(10),team_max:z.number().int().min(1).max(10),prize:z.string().max(100),rules:z.string().max(5000),eligibility:z.string().max(1000),contact:z.string().max(200),status:z.enum(['draft','open','closed','cancelled']),is_demo:z.boolean()}).refine(x=>x.team_max>=x.team_min,'Maximum team size must be at least the minimum');
export const saveEvent=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(eventSchema).handler(async({data,context})=>{
 const {data:allowed}=await context.supabase.rpc('is_organizer');if(!allowed)throw new Error('Organizer access required');
 const {id,...values}=data;const result=id?await context.supabase.from('events').update(values).eq('id',id):await context.supabase.from('events').insert(values);if(result.error)throw new Error(result.error.message);return true;
});
export const checkIn=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({eventId:z.uuid(),token:z.uuid(),reason:z.string().max(500)})).handler(async({data,context})=>{
 const {data:result,error}=await context.supabase.rpc('check_in',{p_event:data.eventId,p_token:data.token,p_reason:data.reason});if(error)throw new Error(error.message);return result;
});
export const broadcast=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({eventId:z.uuid(),title:z.string().trim().min(1).max(150),body:z.string().trim().min(1).max(2000)})).handler(async({data,context})=>{
 const {data:allowed}=await context.supabase.rpc('is_organizer');if(!allowed)throw new Error('Organizer access required');
 const {data:rows,error}=await context.supabase.from('registrations').select('owner_id').eq('event_id',data.eventId);if(error)throw new Error(error.message);
 const users=[...new Set((rows??[]).map(r=>r.owner_id))];if(!users.length)return 0;
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const {error:writeError}=await supabaseAdmin.from('notifications').insert(users.map(user_id=>({user_id,title:data.title,body:data.body})));if(writeError)throw new Error(writeError.message);return users.length;
});
