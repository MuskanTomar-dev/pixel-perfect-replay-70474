import { describe,it,expect } from 'vitest';
import { registrationSchema,recommendationScore } from '@/features/festival/domain';
describe('festival registration rules',()=>{
 const base={eventId:'8a017e39-dfd6-467b-ab17-6a8716a241c7',teamName:'Builders',answers:{}};
 it('rejects duplicate participant emails within the same event',()=>{expect(registrationSchema.safeParse({...base,members:[{name:'Leader',email:'STUDENT@college.edu'},{name:'Member',email:'student@college.edu'}]}).success).toBe(false);});
 it('rejects invalid participant emails',()=>{expect(registrationSchema.safeParse({...base,members:[{name:'Leader',email:'not-an-email'}]}).success).toBe(false);});
 it('accepts separate valid participants',()=>{expect(registrationSchema.safeParse({...base,members:[{name:'Leader',email:'leader@college.edu'},{name:'Member',email:'member@college.edu'}]}).success).toBe(true);});
 it('scores explicit category interests at 3 and matched skills at 1',()=>{expect(recommendationScore({title:'Python challenge',category:'Coding',description:'Build with Python'},['Coding'],['Python'])).toBe(4);});
});
