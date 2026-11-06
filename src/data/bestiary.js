// ---------- Bestiary ----------
// One entry per monster, variant and boss for the storybook's collection page (owner, 2026-09-26).
// lore: a line of story. ability: what it does in play, in the player's words. Keys match TYPES / VARIANTS / boss kinds.
// Monsters spawned by another (gargoyle, blob) are listed under COMPANIONS so they appear beside their parent.

export const COMPANIONS = { hauler:['gargoyle'], slime:['blob'], vampire:['bat'],
  ...(__RELEASE__ >= 4 ? { hayrick:['hayrickBurning'], husker:['huskerBare', 'huskerBurning', 'huskerCharred'], strawlord:['crow'], casketjack:['coffin'] } : {}),   // Release 4: burning forms, the Strawlord's crows (met first on N1-4), Casket Jack's Fallen Casket
  ...(__RELEASE__ >= 5 ? { reaper:['crow'], fogwalker2:['brute'] } : {}) };   // Release 5: the crow out of a fallen Reaper, Fogwalker 2's Mossbacks (a world 1 monster, new to the hollow's books)

/** The boss at the end of each nightmare book (Release 4), listed last in its nightmare bestiary. Once its fight is built (N1-16, the Fallen
 *  Gravekeeper, 2026-11-05) the level lists it like any boss; until then this entry holds its place (an entry may give `icon` [type, form] to draw). */
export const FALLEN = __RELEASE__ >= 4 ? [{ key:'fallengravekeeper' }, ...(__RELEASE__ >= 5 ? [{ key:'fallenpoltergeist' }] : [])] : [];   // one per nightmare book, by world index (Release 5: the hollow book's, N2-16)

export const BESTIARY = {
  ghoul:      { lore:'Dug itself out of the churchyard the night the moon turned orange. Not bright, but very determined.', ability:'Nothing special. Walks straight down its lane and chews the wall.' },
  bat:        { lore:'Roosts in the barn rafters and hates being woken. Squeaks in a key only pumpkins can hear.', ability:'Fast and flighty. One hit brings it down.' },
  imp:        { lore:'A small red menace with a big opinion of itself. Collects shiny things it has no use for.', ability:'Takes two hits and hops forward in sudden bursts.' },
  brute:      { lore:'So old that moss grows on its back and mushrooms on the moss. Moves like a hill deciding to leave.', ability:'Four hits to fell. Chews walls fast, but drops three pumpkins.' },
  mummy:      { lore:'Wrapped up centuries ago and still annoyed about it. Falls apart easily. Never stays apart.', ability:'Only Fire finishes it. Anything else knocks it down for a while, then it rises with 1 health.' },
  firemummy:  { lore:'A mummy that walked through a bonfire and decided it liked it. Passes the flame along.', ability:'Only Ice finishes it. Sets ordinary mummies alight as it passes them.' },
  gravekeeper:{ lore:'Keeper of the patch graves for longer than the village has stood. Takes fresh arrivals personally.', ability:'Never reaches the wall. Teleports between lanes and raises ghouls. Full form drags monsters forward.' },

  wisp:       { lore:'A candle-soul that lost its candle. Drifts wherever the mist is thickest, humming to itself.', ability:'Drifts into a neighbouring lane every few seconds, mid-field only.' },
  wraith:     { lore:'What is left of a traveller who followed the wrong lantern. Still looking for the road home.', ability:'Fades out for a few seconds at a time. Throw where it will be, not where it was.' },
  rider:      { lore:'A marsh goblin that tamed a wisp, or thinks it did. The wisp has other ideas.', ability:'Fast while the wisp carries it. The first hit breaks the wisp and it drops to a walk.' },
  doctor:     { lore:'Came to cure the fog sickness and caught something worse. The censer never goes out.', ability:'Slow. Heals every monster inside its green 3×3 zone. Kill it first.' },
  fogwalker:  { lore:'Nobody has seen its face; the lantern makes sure of that. Some say it is the fog itself, out for a walk.', ability:'Drags a bank of fog across its whole row, hiding itself too. One hit kills it.' },
  bogGhoul:   { lore:'A ghoul that sank into the peat and came back up wearing it. The reeds took root.', ability:'One hit still does it, but the marsh mud holds it: no knockback.' },
  marshImp:   { lore:'Lives in a hollow log and sulks. Has never once been surprised by anything.', ability:'Digs its heels in: knockback does nothing to it.' },
  swiftBat:   { lore:'Feeds on wisp-light and never sleeps. Faster than the barn bats and far more smug.', ability:'40% faster than a bat. One hit still does it.' },
  poltergeist:{ lore:'A tantrum that outlived the child who threw it. Loves to rearrange things that were just right.', ability:'Never reaches the wall. Swaps your pumpkins around. Full form repaints them too.' },

  woodGhoul:  { lore:'Took a nap under a hex-oak and woke up with bark for skin and leaves in its hair.', ability:'Runs 40% faster than a ghoul.' },
  broomImp:   { lore:'Stole a witch’s broom and hat. Cannot fly the broom, but the hat is a good fit.', ability:'Chews walls twice as fast.' },
  owlBat:     { lore:'Half bat, half owl, wholly indignant. Asks who dares and does not wait for an answer.', ability:'Shrugs off knockback.' },
  chameleon:  { lore:'A wood-lizard that learned colour magic from the witches and never learned when to stop.', ability:'Takes on one of your colours. Only that colour hurts it. Tools still work.' },
  rchameleon: { lore:'A chameleon hexed the wrong way round. Hollow-eyed, and allergic to its own colour.', ability:'Immune to the colour it shows. Every other colour and all tools work.' },
  mirror:     { lore:'A vain little sprite with a stolen hand mirror. Practises its best side on your pumpkins.', ability:'While the mirror is up, a pumpkin bounces back into your wall. Hit it when the mirror drops.' },
  witch:      { lore:'Junior coven member, still learning. Her hexes work; her aim is another matter.', ability:'Every few seconds turns a monster into a reverse chameleon, or now and then a true chameleon.' },
  hexwitch:   { lore:'Head of the coven and the reason the wood has no birds. Keeps a cauldron for guests.', ability:'Never reaches the wall. Hexes monsters into chameleons and lays hex zones where the dead rise again.' },

  cryptGhoul: { lore:'Spent a century in the keep’s crypt with only the spiders for company. The spiders came too.', ability:'Shrugs off knockback.' },
  keepImp:    { lore:'Picked scraps of armour off the fallen and calls itself a knight now.', ability:'Wears scraps of armour: three hits to fell.' },
  knight:     { lore:'Sworn to the Count in life and bound to him after. The shield is older than the keep.', ability:'Shield up while marching, down while it rests. Hit it when it stops.' },
  hauler:     { lore:'Once the castle mason. Still hauling stone, though nobody has paid him in a hundred years.', ability:'Pushes a line of stone gargoyles ahead of it, slowly. Break them all and it sprints.' },
  gargoyle:   { lore:'Carved to guard the battlements. Guards whatever it is pointed at now.', ability:'A stone block on legs. Five hits, or Grey pierces straight through.' },
  archer:     { lore:'The keep’s last sentry, still at his post, still loosing at anything that moves below.', ability:'Stops near the top and shoots arrows at your wall. Reach it with Grey or Black.' },
  siegeBrute: { lore:'A mossback the Count fitted with iron plates. It did not object; it rarely does.', ability:'Chews walls twice as fast.' },
  vampire:    { lore:'A lesser noble of the Count’s court. Arrives with an escort and leaves when it pleases.', ability:'Arrives ringed by four bats. Heals if you leave it alone. Finish it fast.' },
  bulwark:    { lore:'The Count’s champion, welded into his armour. The banner is the only thing about him that moves freely.', ability:'Every monster inside its steel 3×3 aura has double health.' },
  vampirecount:{ lore:'Lord of the crumbling keep. Has not aged a day in four centuries and would like you to notice.', ability:'Never reaches the wall. Calls bats, raises castle walls, and heals in a trance until you land enough hits.' },

  drownedGhoul:{ lore:'Went down with the fishing fleet. Came back with the tide, and the kelp came with it.', ability:'Ravenous: chews walls twice as fast.' },
  tideImp:    { lore:'Surfs in on the breakers and complains that the sea is too cold. It is.', ability:'40% faster than an imp.' },
  crawler:    { lore:'Something that was thrown in the puddle and did not stay thrown. Prefers all fours.', ability:'Climbs out of a puddle halfway down the field instead of walking in from the top.' },
  sailor:     { lore:'First mate of the wreck on the horizon. Still has his bottle. Still has no idea where he is.', ability:'Staggers across lanes and lurches at odd speeds. Hard to line up.' },
  bogTurtle:  { lore:'A mossback that took to the water and grew a shell to match. Slower, tougher, damper.', ability:'Carries a shell: six hits to fell.' },
  slime:      { lore:'Whatever seeps out of the wreck at low tide. Cheerful, for a puddle.', ability:'Kill it and two blobs crawl out. Black and Grey clean them up.' },
  blob:       { lore:'Half a slime. Twice the enthusiasm.', ability:'Small and quick. One hit does it.' },
  diver:      { lore:'A drowned villager who never quite noticed. Waits under the puddle for company.', ability:'Hides in a puddle, surfaces to hurl water at your wall, and ducks under again. Hit it while it is up.' },
  soddenMummy:{ lore:'A mummy the sea got hold of. The wrappings are green now and it does not care to discuss it.', ability:'Cannot be knocked back, and still only Fire finishes it.' },
  turtle:     { lore:'The oldest thing in the marsh. Walks backwards so it can keep an eye on you.', ability:'A slow ten-hit wall of shell. Grey pierces through; everything else has to chew.' },
  ...(__RELEASE__ >= 3 ? { hollowking: { lore:'On All Hallows\u2019 night the fires of the five fallen bosses gathered in one hollow pumpkin. It carved itself a face and crowned itself with thorns.', ability:'Never reaches the wall. Five times he splits off a world boss in his colours and takes no damage until it falls. Wipes a column of your patch, smashes a fence, calls monsters.' } } : {}),
  ...(__RELEASE__ >= 4 ? {   // the nightmare Pumpkin Patch (Release 4)
    rooster:    { lore:'Crowed once at the eclipse and the sun never came back. Its comb still smoulders.', ability:'Crows every few seconds: monsters in its lane and the two beside it sprint. Leaves a fire burning where it falls.' },
    strawlord:  { lore:'The scarecrow at the edge of the patch, nailed up the night the moon went dark. It got tired of waiting.', ability:'Never reaches the wall. Looses its crows, and leaves a trail of fire every time it hops to another lane. At half health it tears free and the crows come faster.' },
    crow:       { lore:'The Strawlord’s flock. They stopped being afraid of it a long time ago.', ability:'Fast and frail. At the fence it flies over into your patch and destroys a pumpkin, anywhere but the Grave Gourd and the pumpkins around it. With nothing else to take, it pecks the fence.' },
    graveriser: { lore:'The patch’s old gravedigger. Works by lantern light and never asks whose grave it is.', ability:'Every few seconds digs a grave on an empty cell anywhere in your patch. The graves stay after it falls.' },
    casketjack: { lore:'A coffin from the farm graveyard that got up and walked. Nobody knows how many are still inside.', ability:'When it falls it becomes a Fallen Casket with a mummy inside.' },
    coffin:     { name:'Fallen Casket', lore:'Casket Jack’s last stop. Something inside is knocking.', ability:'Bursts open and lets out a mummy a few seconds after Casket Jack falls, unless a pumpkin smashes it first.' },
    hayrick:    { lore:'The last haystack of the harvest, stitched together by something that wanted a body.', ability:'Tough. Once it throws its pitchfork: usually down its column, pinning the first pumpkin there for a few seconds, but now and then at your fence, taking a third of it.' },
    hayrickBurning:{ lore:'A hayrick that walked through the embers. It burns slowly and does not mind at all.', ability:'Only Ice finishes it. Anything else knocks it down and it rises with 1 health. Sets other hayricks alight.' },
    husker:     { lore:'Grew in the corn maze that nobody came out of. Wears its husk like a coat.', ability:'Its first hit only strips the husk. The bare cob underneath walks faster.' },
    huskerBare: { lore:'What is under the husk: a cob with ideas.', ability:'Walks faster than the husker it came out of.' },
    huskerBurning:{ lore:'A husker that took a shortcut through the fire.', ability:'Any pumpkin strips its burning husk and leaves the charred cob.' },
    huskerCharred:{ lore:'Blackened to the core and still walking.', ability:'Only Ice finishes it. Anything else knocks it down for a while.' },
    fallengravekeeper:{ lore:'The Gravekeeper, charred under the eclipse. His lantern burns black now.', ability:'Never reaches the wall. Teleports leaving fire behind, raises roosters, Casket Jacks and Grave Risers, slams three fences at once, and three times sets a whole row or column of the field on fire. Crows swoop in all night.' },
  } : {}),
  ...(__RELEASE__ >= 5 ? {   // the nightmare Foggy Hollow (Release 5), in first-met order
    reaper:     { lore:'A wraith that found the road home and did not like what was waiting there. It picked up the scythe someone left at the crossroads.', ability:'Fades out for longer than a wraith and moves faster; three health. A crow bursts out where it falls. At the fence it swings its scythe without stopping, wearing down its own fence and both beside it.' },
    rotdoctor:  { lore:'The plague doctor stayed in the fog too long. The censer breathes rot now, and it has given up curing anyone.', ability:'Slow, four health, and it heals nobody. Every monster inside its poison-green 3×3 square can only be hurt by rotten pumpkins. The doctor itself is hurt by anything.' },
    lamplighter:{ lore:'It lights the lanterns that lead travellers into the hollow. Nobody has ever seen it put one out.', ability:'Never reaches the wall. While its lantern burns amber only normal pumpkins hurt it; while it burns sickly green only rotten ones do. It drifts between lanes and calls poison fog onto your patch.' },
    fogwalker2: { lore:'The Fogwalker grew tall in the poison fog. Its lantern burns green now, and the Mossbacks of the bog walk at its side.', ability:'Drags a fog bank over two rows and arrives with a Mossback on each side. Three health. A Lantern shows it.' },
    comet:      { lore:'A marsh goblin whose wisp caught the poison and went wild. Neither of them knows how to stop.', ability:'Cruises for a moment, then streaks down its lane to the fence without stopping. The first hit breaks the wisp: a plain Wisp drifts on and an Imp walks.' },
    minipolt:   { lore:'A small tantrum the Poltergeist left behind in the fog. It knows one trick: spoiling things.', ability:'Drifts between lanes and vanishes now and then. Every few seconds it turns one or two of your pumpkins rotten, never in a Protector square. Three health.' },
    fallenpoltergeist:{ lore:'The Poltergeist, left to rot in the poison fog. Its sheet hangs black and wet, and a scythe of shadow follows it.', ability:'Never reaches the wall. Vanishes from lane to lane, swaps your pumpkins and lays black fog where only rotten pumpkins hurt. Twice it shuffles your whole patch and twice it turns reaper: then only three rotten pumpkins hurt it. A Protector square keeps its pumpkins in place.' },
  } : {}),
  twintides:  { lore:'Two serpents hatched from one egg on the night the village drowned. They finish each other’s sentences.', ability:'Never reach the wall. Both must die within a short window or the fallen one rises again.' },
};
