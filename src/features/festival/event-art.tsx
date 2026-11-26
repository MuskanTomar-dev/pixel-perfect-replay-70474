import { Braces, Bot, Cpu, PenTool, Shield, Terminal } from 'lucide-react';
const icons={Hackathon:Cpu,Coding:Terminal,Robotics:Bot,Design:PenTool,Workshop:Braces,Cybersecurity:Shield};
export function EventArt({category,large=false}:{category:string;large?:boolean}){const Icon=icons[category as keyof typeof icons]??Cpu;return <div className={`event-art ${category.toLowerCase()} ${large?'detail-cover':''}`}><span className="category-tag">{category}</span><Icon className="main-symbol" strokeWidth={1.25}/><span className="art-caption">HACK4TECH / 2027</span></div>;}
