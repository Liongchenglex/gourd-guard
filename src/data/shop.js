export const GEAR = [
  { key:'fence',   icon:'🧱', name:'Sturdy walls', desc:'Every column wall gets 5 more health per level.', max:3, cost:[40,80,130] },
  { key:'repair',  icon:'🔨', name:'Wall repair',  desc:'Use it mid-battle to fully repair every wall. Carry up to 3.', max:3, cost:[40], consumable:true },
  { key:'fw',      icon:'🎆', name:'Firework',     desc:'Use it mid-battle to hit every monster for 3. Carry up to 5.', max:5, cost:[30], consumable:true },
  { key:'buster',  icon:'🧨', name:'Grave buster', desc:'Tap it, then tap a grave to dig it out of your patch. Carry up to 3.', max:3, cost:[30], consumable:true },
  { key:'lantern', icon:'🏮', name:'Lantern',      desc:'Clears every fog bank for 10 seconds. Carry up to 3.', max:3, cost:[25], consumable:true },
  { key:'mine',    icon:'💣', name:'Landmine',     desc:'Tap it, then tap a column. The mine waits at that wall and blasts the first monster to reach it for 6. Carry up to 3.', max:3, cost:[35], consumable:true },
];
