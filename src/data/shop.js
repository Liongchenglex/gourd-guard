export const GEAR = [
  { key:'fence',   icon:'🧱', name:'Sturdy walls', desc:'Every column wall gets 5 more health per level.', max:3, cost:[40,80,130] },
  { key:'repair',  icon:'🔨', name:'Wall repair',  desc:'Tap it, then tap a wall to repair that wall to full. Carry up to 3.', max:3, cost:[40], consumable:true },
  { key:'fw',      icon:'🎆', name:'Firework',     desc:'Use it mid-battle to hit every monster for 3. Carry up to 5.', max:5, cost:[30], consumable:true },
  { key:'buster',  icon:'🧨', name:'Grave buster', desc:'Tap it, then tap a grave to dig it out of your patch. Carry up to 3.', max:3, cost:[30], consumable:true },
  { key:'lantern', icon:'🏮', name:'Lantern',      desc:'Clears every fog bank for 10 seconds. Carry up to 3.', max:3, cost:[25], consumable:true },
  { key:'bomb',    icon:'💥', name:'Bomb',         desc:'Tap it, then tap the field. Blasts 3 columns by 3 rows around that spot for 4, castle walls included. Carry up to 3.', max:3, cost:[45], consumable:true },
  { key:'scarecrow', icon:'🌾', name:'Scarecrow', desc:'Tap it, then tap a column. Monsters in that column stop to chew the scarecrow (12 health) before your wall. Carry up to 3.', max:3, cost:[35], consumable:true },
  { key:'mine',    icon:'💣', name:'Landmine',     desc:'Tap it, then tap any tile of the field. The mine hides there and blasts the first monster to step on it, hitting everything in the 3×3 around it for 6. Carry up to 3.', max:3, cost:[35], consumable:true },
];
