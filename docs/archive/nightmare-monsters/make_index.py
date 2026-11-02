"""Writes index.html for the nightmare monster archive and stages each group's preview (with a document wrapper) for publishing.
Run from the repo root: python3 docs/archive/nightmare-monsters/make_index.py <staging dir>. Groups marked done=True are shown; the rest say they are being drawn."""
import json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = sys.argv[1] if len(sys.argv) > 1 else HERE
GROUPS = [
  dict(key='knights', title='Mounted knights', world='Crumbling Keep', done=True, monsters=[
    ('Storm Lancer', 'The jousting knight. A plumed helm and a long red-and-white striped lance on a black barded horse with angry red eyes. He trots, then lowers the lance and gallops down his column in short charges.'),
    ('Storm Marshal', 'The commander knight. A gold crown on a great helm, a crimson war banner on his back and a horned, heavily armoured horse. His rally raises the sword with lightning while the horse rears, buffing nearby knights.')]),
  dict(key='vampires-doctor', title='Vampires and the Rot Doctor', world='Crumbling Keep and Foggy Hollow', done=True, monsters=[
    ('Blood Glutton', 'A squat vampire brute bursting out of a crimson waistcoat, with broken manacles on huge arms. It heals with every bite on the wall, so it must die before it gets there.'),
    ('Bat Bride', 'A tall floating noble lady with bat-wing mantle, iron tiara and a gown whose hem breaks into bats. Lost bats re-form around her while she heals.'),
    ('Rot Doctor', 'The plague doctor, rotted: a broken dripping beak, a skull lantern of ghostfire and a crow on the hat. Its heal leaves poison fog over its column.')]),
  dict(key='witches-mirror', title='Witches and the enhanced Mirror Sprite', world='Witchwood', done=True, monsters=[
    ('Ash Crone', 'A hunched grey hag in crow-feather rags with milky red-pupilled eyes, leaning on a bone staff topped by a horned goat skull that smokes red when she hexes.'),
    ('Blood Coven Witch', 'A pale fanged witch in a crimson high-collared cloak, a horned hat, a bone dagger and a little cauldron of boiling blood that overflows on her hex.'),
    ('Triptych Sprite', 'The enhanced Mirror Sprite: silver, red-eyed, with a crown of glass shards and a three-panel mirror. She throws it open to raise a glass barrier three lanes wide that reflects pumpkins in her lane and both neighbours.')]),
  dict(key='kraken-pirate', title='The Kraken and the Drowned Pirate', world='Drowned Marsh', done=True, monsters=[
    ('The Kraken', 'A boss in the crimson sea: a tall drooping mantle, glowing slit eyes and a fanged maw with a parrot beak. While it is up it is the only target. Then it dives, and two to four tentacles rise in nearby lanes and throw cursed anchors at the walls until it surfaces again.'),
    ('Drowned Pirate', 'An undead captain with a tricorn, eye patch, kelp beard, hook hand and peg leg. Once per reload it shoots the first pumpkin flown up its lane out of the air.')]),
  dict(key='slime-patch', title='Blood Splitter Slime and Pumpkin Patch monsters', world='Pumpkin Patch', done=True, monsters=[
    ('Blood Splitter Slime', 'A crimson see-through slime with a skull and bones floating inside. Each hit pinches off a little Bloodlet into a neighbouring lane, and it bursts into two more when it dies.'),
    ('Hayrick', 'The hay monster: a living haystack tied with twine, ember eyes in a dark hollow, scorched and smoking from the burning barn, a pitchfork in its shoulder and a crow on top. Once a night it throws the fork and pins a pumpkin so it cannot be slid.'),
    ('Cinder Rooster', 'A fat black rooster with a burning comb and ember-tipped feathers. It crows to give monsters in its lane and both neighbours a short speed burst.'),
    ('Corn Husker', 'A cob-headed stalk creature in a cloak of dry husks with glowing eyes and kernel teeth. The first hit strips its husk, and the bare cob runs faster.'),
    ('Burning Hayrick', 'The Hayrick ablaze: blackened straw with glowing cracks, flames up its sides and a red-hot pitchfork. The pumpkin it pins catches fire and burns away unless an Ice pumpkin is flicked through that column.'),
    ('Burning Corn Husker', 'A husk cloak on fire, ember hair and popping kernels. Its burning husk lands in the neighbouring lanes when shed, leaving a charred cob studded with glowing kernels.')]),
  dict(key='riders', title='Imp riders', world='Foggy Hollow and Drowned Marsh', done=True, monsters=[
    ('Wisp Rider 2 (Comet Rider)', 'The goggled imp rides a long serpent of ghostfire. It cruises, then stretches straight and streaks down its lane with the imp crouched low. The first hit breaks it into a plain Wisp and a walking imp.'),
    ('Turtle Rider', 'The imp sits on a saddled, spiked Shell Turtle with reins and an iron goad. After every hit the turtle hides in its shell for a moment while the imp ducks behind the rim. The imp keeps a net of rotten pumpkins on the shell and hurls them down the lane, where they splat on the wall in a cloud of green stink.')]),
  dict(key='coffin', title='Casket Jack, the mummy summoner', world='Pumpkin Patch', done=True, monsters=[
    ('Casket Jack', 'A walking pumpkin-wood coffin from the farm graveyard, with a glowing jack-o-lantern face carved in the lid, a pumpkin stem on top, root legs, vine arms and a rusty spade. Every few seconds it stops, its lid creaks open and a mummy steps out into its lane.'),
    ('Field coffin', 'When Casket Jack dies it falls into a coffin on the field that bursts open with one last mummy a few seconds later, unless a pumpkin smashes it first.')]),
]
if os.path.exists(os.path.join(HERE, 'groups.json')): GROUPS = json.load(open(os.path.join(HERE, 'groups.json')))
WRAP = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n<style>html,body{background:#070a14}</style>\n'
BACK = '<a href="index.html" style="position:fixed;top:12px;right:12px;z-index:9;font:600 14px system-ui;color:#ffcf6a;background:#1e1529;border:1px solid rgba(255,207,106,.35);border-radius:999px;padding:10px 14px;text-decoration:none">All monsters</a>\n'
cards = []
for G in GROUPS:
  if G['done']:
    src = open(os.path.join(HERE, G['key'], 'preview.html')).read()
    open(os.path.join(OUT, G['key'] + '.html'), 'w').write(WRAP + '</head><body>' + BACK + src + '\n</body></html>')
    if OUT != HERE: shutil.copy(os.path.join(HERE, G['key'], 'idle.png'), os.path.join(OUT, G['key'] + '.png'))
    li = ''.join(f'<li><b>{n}.</b> {d}</li>' for n, d in G['monsters'])
    cards.append(f'''<article class="grp"><a class="shot" href="{G['key']}.html"><img src="{G['key']}.png" alt="{G['title']}, still frame" loading="lazy"></a>
  <div class="txt"><span class="world">{G['world']}</span><h2>{G['title']}</h2><ul>{li}</ul><a class="open" href="{G['key']}.html">Open the animated preview</a></div></article>''')
  else:
    cards.append(f'<article class="grp todo"><div class="txt"><span class="world">{G["world"]}</span><h2>{G["title"]}</h2><p class="wip">Still being drawn.</p></div></article>')
page = '''<title>Nightmare Monsters</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Creepster&family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap">
<style>
/* Layout: one night column; a card per monster group with its still and a link to the animated preview. Single dark look, like the game. */
:root{ color-scheme:dark; --bg:#0b0912; --panel:#1a1424; --ink:#f4eadc; --muted:#b9a9c2; --gold:#ffcf6a; --blood:#e2363a; --line:rgba(255,207,106,.18);
  --display:Creepster, fantasy; --head:Fredoka, system-ui, sans-serif; --body:Nunito, system-ui, sans-serif; }
html{ background:var(--bg); }
body{ background:radial-gradient(ellipse at 50% -10%, #3a0d18, var(--bg) 55%) fixed var(--bg); color:var(--ink); font-family:var(--body); }
.wrap{ max-width:1040px; margin:0 auto; padding-block:28px 64px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); display:grid; gap:22px; }
h1{ font-family:var(--display); font-weight:400; color:var(--blood); font-size:clamp(42px, 8vw, 70px); margin:0; line-height:1; letter-spacing:1px; text-shadow:0 0 24px rgba(226,54,58,.45); text-wrap:balance; }
.lede{ color:var(--muted); max-width:66ch; margin:8px 0 0; line-height:1.55; }
.grp{ display:grid; grid-template-columns:minmax(0, 1.25fr) minmax(0, 1fr); gap:18px; background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:14px; align-items:start; }
.grp.todo{ grid-template-columns:1fr; opacity:.7; }
@media (max-width:760px){ .grp{ grid-template-columns:minmax(0, 1fr); } }
.shot img{ display:block; width:100%; max-width:100%; height:auto; border-radius:12px; background:#070a14; }
.txt{ display:grid; gap:8px; min-width:0; }
.world{ font:700 12px var(--head); letter-spacing:.1em; text-transform:uppercase; color:var(--gold); }
h2{ font:700 22px var(--head); margin:0; text-wrap:balance; }
ul{ margin:0; padding-left:18px; display:grid; gap:8px; color:var(--muted); line-height:1.5; }
li b{ color:var(--ink); }
.open{ justify-self:start; font:600 15px var(--head); color:#1a0a06; background:var(--gold); border-radius:999px; padding:11px 18px; text-decoration:none; min-height:44px; box-sizing:border-box; }
.open:focus-visible, .shot:focus-visible{ outline:2px solid var(--gold); outline-offset:3px; }
.wip{ margin:0; color:var(--muted); }
</style>
<div class="wrap">
  <header><h1>Nightmare Monsters</h1>
  <p class="lede">New monsters for the nightmare levels, drawn in the game's Toy Plastic style. Each group opens an animated preview with every clip and a row at game size. These are archive designs only; nothing here is in the game yet.</p></header>
''' + '\n'.join(cards) + '\n</div>\n'
open(os.path.join(HERE, 'index.html'), 'w').write(page)
print('done:', [G['key'] for G in GROUPS if G['done']])
