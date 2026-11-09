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
  dict(key='minibosses-patch-wood', title='Mini bosses: the Strawlord and the Treant', world='Pumpkin Patch and Witchwood', done=True, monsters=[
    ('The Strawlord', 'A giant scarecrow nailed to a post at the back of the field: a burning jack-o-lantern head with flames in its carved eyes, a smouldering hat, a ragged purple patchwork coat bursting with straw, a rusty sickle nailed into one hand and crows on the crossbar. Proposed fight: it sways on the post and every few seconds flaps its coat open so a flock of crows bursts out and dives down the lanes. At half health it rips free of its nails and stomps down its lane as a slow, very tough brute.'),
    ('The Treant', 'A huge gnarled hollow tree in violet-brown bark with an angry carved face, glowing violet eyes and a jagged glowing maw, root feet, twig-clawed branch arms, hanging moss, autumn leaves and a hex charm. Proposed fight: it never walks. Every few seconds it slams its arms into the ground and thorny roots burst up in two or three lanes.'),
    ('Summoned root', 'A thick thorny root with a glowing violet vein that punches up out of the ground, writhes, and later sinks back. Proposed: mid-field it blocks its lane (2 or 3 hits to break) and shields the Treant there; at the wall it grabs and squeezes the wall until broken or until it sinks after about 8 s.')]),
  dict(key='minibosses-hollow-keep', title='Mini bosses: the Lamplighter and the Siege Tower', world='Foggy Hollow and Crumbling Keep', done=True, monsters=[
    ('The Lamplighter', 'The tall hooded figure from the nightmare Foggy Hollow map, come alive: a peaked hood over a black void with two green eye glints, a ragged dark-green cloak whose hem dissolves into poison fog, and a crooked pole hung with an iron ghost lantern holding a trapped little wisp. Proposed fight: it drifts at the back and blinks between fog banks. It can only be hit while the lantern is lit; a hit snuffs it, and while dark pumpkins pass through it and it pours a fog bank down a lane before relighting.'),
    ('The Siege Tower', 'A rickety three-storey wooden tower on iron-shod wheels, with stitched hides, glowing arrow slits for eyes, a spiked drawbridge ramp for a mouth and two Skeleton Archers on top. Proposed fight: it rolls very slowly down one lane while the archers volley at the wall. Pumpkins knock the archers off first, then damage the tower. Every so often the ramp drops and a Shield Knight marches out. It collapses storey by storey when it dies.')]),
  dict(key='spirits', title='The Reaper, the mini Poltergeist and Fogwalker 2', world='Pumpkin Patch and Foggy Hollow', done=True, monsters=[
    ('The Reaper', 'A hooded skeleton in a tattered plum-black robe with ember-orange eyes, a little jack-o-lantern on its rope belt and a long scythe. It glides on a hem of smoky tails instead of walking. Proposed: landmines and puddles do not catch it, and at the wall it sometimes reaps, one wide sweep that hits its own wall and both neighbours.'),
    ('Mini Poltergeist', 'A small, cheeky copy of the Foggy Hollow boss: the same shroud and cyan glow, lopsided eyes, a jagged grin and a ring of junk orbiting it (teacup, fork, book, candle, picture frame). Proposed: each piece of junk soaks up one hit, and every few seconds it flings a piece at its wall.'),
    ('Fogwalker 2', 'A bigger, hunched Fogwalker with long heavy arms and a bronze lantern-cage for a chest, full of glowing fog that leaks between the bars. Proposed: takes 3 hits, and every few seconds breathes out so its fog band swells to twice its height.')]),
  dict(key='crows-cart', title='Swooping Crows and the Lobber Cart', world='Pumpkin Patch', done=True, monsters=[
    ('Swooping Crows', 'A flock of three blue-black crows with ember-red eyes and ragged wings. They cruise, then fold their wings into a V and dive down the lane. Proposed: one monster, three hits (one crow each), and a Black splash or Grey pierce hits the whole flock. Flying, so it passes over graves, mines and puddles.'),
    ('Lobber Cart', 'A rickety plank catapult cart on mismatched wheels, crewed by a big-eared goblin in a cooking-pot helmet, with a basket of rolled nets. It parks at the back of the field and lobs weighted rope nets into the patch. Proposed: a netted pumpkin cannot be slid or flicked until a bunch is matched next to it or it struggles free after about 8 s; killing the cart frees every net.')]),
  dict(key='castle-walls', title='New castle walls on a real Crumbling Keep night', world='Crumbling Keep', done=True, monsters=[
    ('Gatehouse', 'A heavier one-lane wall with two bannered towers, torches and an iron-bound gate behind a portcullis, shown in lane 3 of night 4-15 beside the old walls. Proposed: about 2.5 times a normal castle wall\'s health; monsters bunch up behind the gate, which opens every 8 s or so to let them through, so the queue is a target for a Black or Deep Blue.'),
    ('Archer Tower', 'A tall tapering round tower with glowing arrow slits, a pennant and a Skeleton Archer (one or two) on top, shooting down its lane. Proposed: archers on top cannot be hit (except by a Grey piercing through); when the tower falls the archer tumbles down dazed and fights on as an ordinary Skeleton Archer.')]),
  dict(key='storm-eel', title='The Storm Eel', world='Drowned Marsh', done=True, monsters=[
    ('The Storm Eel', 'A long, slick dark-teal eel with glowing lightning chevrons down its body, a crackling frilled crest, big angry glowing eyes over a toothy underbite, a broken harpoon in its back and a rusty hook through its jaw. Proposed: it hides in a puddle, or anywhere in the tide on sea levels, showing only a faint glow and sparks. It surfaces, crackles as a warning and spits a lightning bolt down its lane at the wall like the Puddle Diver, then dives and leaps in an arc to another puddle. It can only be hit while it is up.')]),
  dict(key='siren', title='The Siren', world='Drowned Marsh', done=True, monsters=[
    ('The Siren', 'A pale, pretty-but-creepy mermaid on a barnacled, kelp-draped rock in a little pool at the back of the field, with long dripping kelp hair, a fish-skeleton comb, a scallop-shell top and glowing sea-green eyes. When she sings her mouth opens far too wide on needle teeth, her eyes burn white and glowing notes drift down her lane. Proposed: she never walks. While she sings, the next pumpkin flicked up her lane is bent into a neighbouring lane by a sweep of her arm. Hit her from her own lane between songs, or with splash, lightning or pierce; when hurt she dives into her pool and resurfaces.')]),
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
