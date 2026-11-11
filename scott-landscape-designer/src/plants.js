/* Plant library: species suited to central Arkansas (USDA zone 7b; Russellville).
 * t: item type the species belongs to (dtree, etree, bshrub, dshrub, perennial, annual, groundcover, turf)
 * cn/bn: common and botanical name; w/h: mature spread and height (ft); sun: F full, P part, S shade
 * z: USDA hardiness zones; c: foliage color for the rendered plan; fl: flower color (optional)
 * spc: on-center spacing (ft) for bed plants, used to estimate quantities; note: one line for students.
 * g: an ornamental grass (its own library group and tufted symbol; pl: 'haze' draws a soft cloud of bloom instead of plumes).
 */
const PLANTS = [
  // ---- deciduous trees
  { id: 'acru', t: 'dtree', cn: 'Red maple', bn: 'Acer rubrum', w: 35, h: 50, sun: 'F/P', z: '3–9', f: 'maple', c: '#5E8C3A', ac: '#B5452E', note: 'Fast shade tree with red fall color.' },
  { id: 'acsa', t: 'dtree', cn: 'Sugar maple', bn: 'Acer saccharum', w: 40, h: 60, sun: 'F/P', z: '4–8', f: 'maple', c: '#3F7230', ac: '#D98B2B', note: 'Big shade tree; orange fall color.' },
  { id: 'quph', t: 'dtree', cn: 'Willow oak', bn: 'Quercus phellos', w: 40, h: 60, sun: 'F', z: '5–9', f: 'oak', fine: true, c: '#7A9445', note: 'Native oak with fine leaves; long-lived street tree.' },
  { id: 'qush', t: 'dtree', cn: 'Shumard oak', bn: 'Quercus shumardii', w: 40, h: 50, sun: 'F', z: '5–9', f: 'oak', c: '#3F6A2E', note: 'Native; red fall color; acorns feed wildlife.' },
  { id: 'beni', t: 'dtree', cn: 'River birch', bn: 'Betula nigra', w: 35, h: 45, sun: 'F/P', z: '4–9', f: 'birch', c: '#96BA5E', note: 'Peeling bark; handles wet spots.' },
  { id: 'gibi', t: 'dtree', cn: 'Ginkgo', bn: 'Ginkgo biloba', w: 30, h: 50, sun: 'F', z: '3–8', f: 'ginkgo', c: '#AFC24A', note: 'Gold fall color. Plant male trees only.' },
  { id: 'ceca', t: 'dtree', cn: 'Eastern redbud', bn: 'Cercis canadensis', w: 25, h: 25, sun: 'F/P', z: '4–9', f: 'redbud', c: '#6E9A3E', fl: '#C75B9B', note: 'Small native tree; pink flowers in early spring.' },
  { id: 'cofl', t: 'dtree', cn: 'Flowering dogwood', bn: 'Cornus florida', w: 20, h: 20, sun: 'P', z: '5–9', f: 'dogwood', c: '#5A873C', fl: '#F4F1E6', note: 'Native understory tree; white spring flowers, red berries for birds.' },
  { id: 'lain', t: 'dtree', cn: 'Crape myrtle', bn: 'Lagerstroemia indica', w: 15, h: 20, sun: 'F', z: '7–9', f: 'crape', c: '#6D9947', fl: '#D45C8C', note: 'Summer flowers; small enough for tight spots.' },
  { id: 'acpa', t: 'dtree', cn: 'Japanese maple', bn: 'Acer palmatum', w: 15, h: 15, sun: 'P', z: '5–8', f: 'jmaple', c: '#9A3E35', note: 'Small accent tree; red leaves. Likes afternoon shade.' },
  { id: 'amar', t: 'dtree', cn: 'Serviceberry', bn: 'Amelanchier arborea', w: 15, h: 20, sun: 'F/P', z: '4–9', f: 'multistem', c: '#7CA250', fl: '#FBFAF4', note: 'White spring flowers; berries for birds and people.' },
  { id: 'mado', t: 'dtree', cn: 'Apple', bn: "Malus domestica 'Honeycrisp'", w: 15, h: 15, sun: 'F', z: '4–8', f: 'fruit', c: '#5E9440', fr: '#C8322B', fl: '#F3D6DF', note: 'Fruit tree. Plant two varieties for pollination.' },
  { id: 'prpe', t: 'dtree', cn: 'Peach', bn: "Prunus persica 'Redhaven'", w: 15, h: 15, sun: 'F', z: '5–8', f: 'fruit', c: '#7AA54A', fr: '#F0A04B', fl: '#EFA3BC', note: 'Self-fruitful fruit tree; needs full sun.' },
  // ---- evergreen trees
  { id: 'piec', t: 'etree', cn: 'Shortleaf pine', bn: 'Pinus echinata', w: 30, h: 80, sun: 'F', z: '6–9', f: 'pine', c: '#4A7A45', note: 'Arkansas state tree. Needs room.' },
  { id: 'pita', t: 'etree', cn: 'Loblolly pine', bn: 'Pinus taeda', w: 30, h: 80, sun: 'F', z: '6–9', f: 'pine', c: '#5B8240', note: 'Fast-growing native pine.' },
  { id: 'juvi', t: 'etree', cn: 'Eastern red cedar', bn: 'Juniperus virginiana', w: 12, h: 40, sun: 'F', z: '2–9', f: 'column', c: '#2F5236', note: 'Native; dense windbreak and bird shelter.' },
  { id: 'thgg', t: 'etree', cn: "Arborvitae 'Green Giant'", bn: "Thuja 'Green Giant'", w: 12, h: 40, sun: 'F/P', z: '5–8', f: 'column', c: '#3B6A3A', note: 'Fast privacy screen. Space 8–10 ft apart.' },
  { id: 'culy', t: 'etree', cn: 'Leyland cypress', bn: '× Cuprocyparis leylandii', w: 15, h: 60, sun: 'F', z: '6–10', f: 'column', c: '#4B7A47', note: 'Very fast screen; needs space and air flow.' },
  { id: 'cede', t: 'etree', cn: 'Deodar cedar', bn: 'Cedrus deodara', w: 30, h: 50, sun: 'F', z: '7–9', f: 'deodar', c: '#6C8C82', note: 'Soft blue-green specimen conifer.' },
  { id: 'magg', t: 'etree', cn: "Magnolia 'Little Gem'", bn: "Magnolia grandiflora 'Little Gem'", w: 12, h: 25, sun: 'F/P', z: '7–10', f: 'magnolia', c: '#2A4F2E', fl: '#FBF8EE', note: 'Compact evergreen magnolia; fragrant white flowers.' },
  // ---- broadleaf evergreen shrubs
  { id: 'ilvn', t: 'bshrub', cn: 'Dwarf yaupon holly', bn: "Ilex vomitoria 'Nana'", w: 4, h: 3, sun: 'F/P/S', z: '7–10', f: 'fine', c: '#3F6B39', note: 'Tough native; low foundation hedge.' },
  { id: 'bumi', t: 'bshrub', cn: 'Japanese boxwood', bn: 'Buxus microphylla', w: 4, h: 4, sun: 'F/P', z: '6–9', f: 'fine', c: '#4C7A3A', note: 'Classic clipped hedge.' },
  { id: 'ilns', t: 'bshrub', cn: "Holly 'Nellie R. Stevens'", bn: "Ilex 'Nellie R. Stevens'", w: 15, h: 25, sun: 'F/P', z: '6–9', f: 'spiky', c: '#2E5530', fl: '#C0392B', note: 'Large privacy hedge; red berries for birds.' },
  { id: 'rhen', t: 'bshrub', cn: 'Encore azalea', bn: "Rhododendron 'Encore'", w: 4, h: 4, sun: 'P', z: '7–10', f: 'rose', c: '#3F6B3B', fl: '#E05A86', note: 'Blooms spring and fall. Morning sun only.' },
  { id: 'prlo', t: 'bshrub', cn: "Cherry laurel 'Otto Luyken'", bn: "Prunus laurocerasus 'Otto Luyken'", w: 6, h: 4, sun: 'P/S', z: '6–8', f: 'shrub', c: '#305C34', note: 'Good in shade by the house.' },
  { id: 'gaja', t: 'bshrub', cn: 'Gardenia', bn: 'Gardenia jasminoides', w: 4, h: 4, sun: 'P', z: '7–10', f: 'rose', c: '#355F33', fl: '#FFFFFF', note: 'Fragrant white flowers near the patio.' },
  { id: 'loch', t: 'bshrub', cn: "Loropetalum 'Purple Diamond'", bn: "Loropetalum chinense 'Purple Diamond'", w: 5, h: 5, sun: 'F/P', z: '7–10', f: 'shrub', c: '#6A3446', fl: '#D85A9A', note: 'Purple leaves and pink flowers.' },
  { id: 'abgr', t: 'bshrub', cn: 'Glossy abelia', bn: 'Abelia × grandiflora', w: 5, h: 5, sun: 'F/P', z: '6–9', f: 'fine', c: '#4E7A3D', fl: '#F3E6EE', note: 'Long summer bloom; butterflies.' },
  // ---- deciduous shrubs
  { id: 'hyqu', t: 'dshrub', cn: 'Oakleaf hydrangea', bn: 'Hydrangea quercifolia', w: 6, h: 6, sun: 'P/S', z: '5–9', f: 'mophead', c: '#5C8A3E', fl: '#F6F2E4', note: 'Native; white flowers, red fall leaves.' },
  { id: 'hyma', t: 'dshrub', cn: 'Bigleaf hydrangea', bn: 'Hydrangea macrophylla', w: 5, h: 5, sun: 'P', z: '6–9', f: 'mophead', c: '#5F9042', fl: '#7E8FD6', note: 'Blue flowers in acid soil. Morning sun.' },
  { id: 'roko', t: 'dshrub', cn: 'Knock Out rose', bn: "Rosa 'Knock Out'", w: 4, h: 4, sun: 'F', z: '5–9', f: 'rose', c: '#4F7E3A', fl: '#D62F4E', note: 'Easy rose; blooms spring to frost.' },
  { id: 'itvi', t: 'dshrub', cn: 'Virginia sweetspire', bn: "Itea virginica 'Henry's Garnet'", w: 5, h: 4, sun: 'F/P/S', z: '5–9', f: 'shrub', c: '#5E8C40', fl: '#FAF7EC', note: 'Native; handles wet soil; red fall color.' },
  { id: 'caam', t: 'dshrub', cn: 'American beautyberry', bn: 'Callicarpa americana', w: 5, h: 5, sun: 'F/P', z: '6–10', f: 'berry', c: '#6E9A48', fl: '#9B4FB0', note: 'Native; purple berries that birds love.' },
  { id: 'budo', t: 'dshrub', cn: 'Butterfly bush', bn: 'Buddleja davidii', w: 6, h: 6, sun: 'F', z: '5–9', f: 'shrub', c: '#7D9A6A', fl: '#8E63B8', note: 'Draws butterflies and hummingbirds.' },
  { id: 'spja', t: 'dshrub', cn: "Spirea 'Goldflame'", bn: "Spiraea japonica 'Goldflame'", w: 3, h: 3, sun: 'F', z: '4–9', f: 'fine', c: '#B4B44B', fl: '#E58AAE', note: 'Small; gold leaves and pink flowers.' },
  { id: 'vaas', t: 'dshrub', cn: 'Rabbiteye blueberry', bn: 'Vaccinium virgatum', w: 5, h: 6, sun: 'F', z: '7–9', f: 'berry', c: '#5B8A47', fl: '#3E5BA8', note: 'Edible berries. Plant two varieties.' },
  // ---- perennials (beds)
  { id: 'ruhi', t: 'perennial', cn: 'Black-eyed Susan', bn: "Rudbeckia fulgida 'Goldsturm'", w: 2, h: 2, sun: 'F', z: '4–9', c: '#55803A', fl: '#F2B705', spc: 1.5, note: 'Native; summer gold flowers; seed for finches.' },
  { id: 'ecpu', t: 'perennial', cn: 'Purple coneflower', bn: 'Echinacea purpurea', w: 2, h: 3, sun: 'F', z: '3–9', c: '#56803B', fl: '#C1569A', spc: 1.5, note: 'Native; butterflies and goldfinches.' },
  { id: 'hesd', t: 'perennial', cn: "Daylily 'Stella de Oro'", bn: "Hemerocallis 'Stella de Oro'", w: 2, h: 1.5, sun: 'F/P', z: '3–9', c: '#5E8F3E', fl: '#F3B11C', spc: 1.5, note: 'Reblooming; very tough edging plant.' },
  { id: 'hosp', t: 'perennial', cn: 'Hosta', bn: 'Hosta spp.', w: 3, h: 2, sun: 'S/P', z: '3–9', c: '#5E8A72', fl: '#C9B8E2', spc: 2, note: 'Shade beds on the north side.' },
  { id: 'peat', t: 'perennial', cn: 'Russian sage', bn: 'Salvia yangii', w: 3, h: 4, sun: 'F', z: '4–9', c: '#8FA28C', fl: '#8C7EC9', spc: 2.5, note: 'Lavender spikes; heat and drought tolerant.' },
  { id: 'phpa', t: 'perennial', cn: 'Garden phlox', bn: "Phlox paniculata 'David'", w: 2.5, h: 3.5, sun: 'F/P', z: '4–8', c: '#5A873C', fl: '#F7F4F8', spc: 2, note: 'Fragrant; hummingbirds and butterflies.' },
  { id: 'cove', t: 'perennial', cn: 'Threadleaf coreopsis', bn: "Coreopsis verticillata 'Zagreb'", w: 1.5, h: 1.5, sun: 'F', z: '3–9', c: '#6C9447', fl: '#F5C518', spc: 1.5, note: 'Fine leaves, yellow flowers all summer.' },
  // ---- annuals (beds)
  { id: 'ziel', t: 'annual', cn: 'Zinnia', bn: 'Zinnia elegans', w: 1, h: 2.5, sun: 'F', z: 'annual', c: '#5C8B3D', fl: '#E8573B', spc: 1, note: 'Bright cut flowers; butterflies.' },
  { id: 'caro', t: 'annual', cn: 'Vinca', bn: 'Catharanthus roseus', w: 1, h: 1, sun: 'F', z: 'annual', c: '#3F7337', fl: '#E87BB0', spc: 1, note: 'Handles Arkansas heat.' },
  { id: 'bese', t: 'annual', cn: 'Wax begonia', bn: 'Begonia semperflorens', w: 1, h: 1, sun: 'P/S', z: 'annual', c: '#4A7A3A', fl: '#D8344A', spc: 0.75, note: 'Shade color.' },
  { id: 'taer', t: 'annual', cn: 'Marigold', bn: 'Tagetes erecta', w: 1, h: 1.5, sun: 'F', z: 'annual', c: '#5A8A3C', fl: '#F39A1E', spc: 1, note: 'Easy; good in the vegetable garden too.' },
  { id: 'pehy', t: 'annual', cn: 'Petunia', bn: 'Petunia × hybrida', w: 1.5, h: 1, sun: 'F', z: 'annual', c: '#4F8139', fl: '#8B4FB8', spc: 1, note: 'Spreading summer color.' },
  { id: 'viwi', t: 'annual', cn: 'Pansy', bn: 'Viola × wittrockiana', w: 0.75, h: 0.75, sun: 'F/P', z: 'annual', c: '#4A7D3A', fl: '#6B5BC4', spc: 0.75, note: 'Cool-season color, fall to spring.' },
  // ---- ground covers
  { id: 'limu', t: 'groundcover', cn: 'Liriope', bn: 'Liriope muscari', w: 1.5, h: 1, sun: 'F/P/S', z: '5–10', c: '#3E6A35', fl: '#8A72C8', spc: 1, note: 'Grass-like edging; purple flower spikes.' },
  { id: 'opja', t: 'groundcover', cn: 'Mondo grass', bn: 'Ophiopogon japonicus', w: 1, h: 0.5, sun: 'P/S', z: '6–10', c: '#2F5530', spc: 0.75, note: 'Dark green carpet for shade.' },
  { id: 'trja', t: 'groundcover', cn: 'Asiatic jasmine', bn: 'Trachelospermum asiaticum', w: 3, h: 0.75, sun: 'F/P/S', z: '7–10', c: '#3C6534', spc: 1.5, note: 'Evergreen carpet; slopes and shade.' },
  { id: 'phsu', t: 'groundcover', cn: 'Creeping phlox', bn: 'Phlox subulata', w: 2, h: 0.5, sun: 'F', z: '3–9', c: '#5F8A42', fl: '#C995D8', spc: 1.5, note: 'Spring carpet of flowers.' },
  { id: 'ajre', t: 'groundcover', cn: 'Ajuga', bn: 'Ajuga reptans', w: 1.5, h: 0.5, sun: 'P/S', z: '3–9', c: '#5A4A5E', fl: '#5B5FC0', spc: 1, note: 'Bronze leaves; blue spring spikes.' },
  // ---- ornamental grasses: big clumps are placed one by one (as shrubs); small ones are planted in beds
  { id: 'cose', t: 'dshrub', g: true, f: 'grass', cn: 'Pampas grass', bn: 'Cortaderia selloana', w: 6, h: 8, sun: 'F', z: '7–10', c: '#8FA868', fl: '#F4EEDC', note: 'Huge clump with white plumes; give it room, sharp leaf edges.' },
  { id: 'misi', t: 'dshrub', g: true, f: 'grass', cn: 'Maiden grass', bn: "Miscanthus sinensis 'Gracillimus'", w: 4, h: 6, sun: 'F', z: '5–9', c: '#7C9E58', fl: '#DCC9AE', note: 'Fine arching leaves; coppery plumes in fall. A soft screen.' },
  { id: 'pavi', t: 'dshrub', g: true, f: 'grass', cn: 'Switchgrass', bn: "Panicum virgatum 'Shenandoah'", w: 3, h: 4, sun: 'F', z: '4–9', c: '#6F9450', fl: '#B4576A', pl: 'haze', note: 'Native prairie grass; leaves turn burgundy by late summer.' },
  { id: 'muca', t: 'dshrub', g: true, f: 'grass', cn: 'Pink muhly grass', bn: 'Muhlenbergia capillaris', w: 3, h: 3, sun: 'F', z: '6–10', c: '#6E9052', fl: '#EC8FBC', pl: 'haze', note: 'Native; a pink cloud of bloom in October. Needs sun and drainage.' },
  { id: 'peal', t: 'dshrub', g: true, f: 'grass', cn: 'Dwarf fountain grass', bn: "Pennisetum alopecuroides 'Hameln'", w: 2.5, h: 2.5, sun: 'F/P', z: '5–9', c: '#7FA65A', fl: '#EADFC4', note: 'Neat mound with bottlebrush plumes; good along a walk.' },
  { id: 'caac', t: 'dshrub', g: true, f: 'grass', cn: 'Feather reed grass', bn: "Calamagrostis × acutiflora 'Karl Foerster'", w: 2, h: 5, sun: 'F/P', z: '4–9', c: '#6C924A', fl: '#DCC48C', note: 'Narrow and upright; wheat-colored plumes all summer.' },
  { id: 'fegl', t: 'perennial', g: true, cn: 'Blue fescue', bn: 'Festuca glauca', w: 1, h: 1, sun: 'F', z: '4–8', c: '#7FA6AC', spc: 1, note: 'Small blue tufts for edging; wants sun and dry feet.' },
  { id: 'scsc', t: 'perennial', g: true, cn: 'Little bluestem', bn: 'Schizachyrium scoparium', w: 2, h: 3, sun: 'F', z: '3–9', c: '#7E9E8C', fl: '#C98A5A', spc: 2, note: 'Native prairie grass; blue-green in summer, copper in fall.' },
  { id: 'chla', t: 'perennial', g: true, cn: 'Northern sea oats', bn: 'Chasmanthium latifolium', w: 2, h: 3, sun: 'P/S', z: '4–9', c: '#6F9E4E', fl: '#C9B37A', spc: 2, note: 'Native; one of the few grasses for shade. Dangling oat seed heads.' },
  { id: 'nate', t: 'perennial', g: true, cn: 'Mexican feather grass', bn: 'Nassella tenuissima', w: 1.5, h: 2, sun: 'F', z: '6–10', c: '#A9BC6A', fl: '#E6DDB0', spc: 1.5, note: 'Hair-fine blades that move in any breeze.' },
  { id: 'caos', t: 'perennial', g: true, cn: 'Evergold sedge', bn: "Carex oshimensis 'Evergold'", w: 1.5, h: 1, sun: 'P/S', z: '5–9', c: '#C6C768', spc: 1.25, note: 'Grass-like gold and green tufts; evergreen, for shade.' },
  // ---- turf
  { id: 'cyda', t: 'turf', cn: 'Bermudagrass', bn: 'Cynodon dactylon', w: 0, h: 0, sun: 'F', z: '7–10', c: '#7DB24F', note: 'Full sun; takes heavy play. Dormant brown in winter.' },
  { id: 'zoja', t: 'turf', cn: 'Zoysiagrass', bn: 'Zoysia japonica', w: 0, h: 0, sun: 'F/P', z: '6–10', c: '#6EA74A', note: 'Dense; some shade; slow to establish.' },
  { id: 'feur', t: 'turf', cn: 'Tall fescue', bn: 'Festuca arundinacea', w: 0, h: 0, sun: 'P', z: '4–7', c: '#5E9A48', note: 'Cool-season; stays green in winter; part shade.' },
  { id: 'erop', t: 'turf', cn: 'Centipedegrass', bn: 'Eremochloa ophiuroides', w: 0, h: 0, sun: 'F/P', z: '7–10', c: '#98C460', note: 'Light apple green; slow, low-care lawn. Does not take heavy play.' },
  { id: 'stse', t: 'turf', cn: 'St. Augustinegrass', bn: 'Stenotaphrum secundatum', w: 0, h: 0, sun: 'F/P/S', z: '8–10', c: '#5C9E4C', note: 'Coarse, blue-green; the best warm-season grass for shade. Can winter-kill here.' },
  { id: 'popr', t: 'turf', cn: 'Kentucky bluegrass', bn: 'Poa pratensis', w: 0, h: 0, sun: 'F', z: '2–7', c: '#4F8E58', note: 'Dark blue-green, fine blades; cool-season, struggles in Arkansas summers.' },
  { id: 'boda', t: 'turf', cn: 'Buffalograss', bn: 'Bouteloua dactyloides', w: 0, h: 0, sun: 'F', z: '4–8', c: '#9AAE78', note: 'Native, gray-green; very little water or mowing. Thin look.' },
  { id: 'lope', t: 'turf', cn: 'Perennial ryegrass', bn: 'Lolium perenne', w: 0, h: 0, sun: 'F/P', z: '3–7', c: '#5EAE46', note: 'Bright green; overseeded on bermuda for a green winter lawn.' },
  { id: 'feru', t: 'turf', cn: 'Fine fescue', bn: 'Festuca rubra', w: 0, h: 0, sun: 'P/S', z: '3–7', c: '#6A9C5E', note: 'Very fine blades; the cool-season grass for dry shade.' },
];
const PLANT_BY_ID = Object.fromEntries(PLANTS.map((p) => [p.id, p]));
const SP_DEFAULT = { dtree: 'acru', etree: 'juvi', bshrub: 'ilvn', dshrub: 'hyqu', perennial: 'ruhi', annual: 'ziel', groundcover: 'limu', turf: 'cyda' };
const SUN_NAMES = { F: 'Full sun', P: 'Part shade', S: 'Shade' };
/* library and schedule groups: ornamental grasses get their own, whatever item type they are planted as */
const catOf = (sp) => (sp.g ? 'grass' : sp.t);
const LIB_CATS = [
  ['dtree', 'Deciduous trees'], ['etree', 'Evergreen trees'], ['bshrub', 'Broadleaf evergreen shrubs'], ['dshrub', 'Deciduous shrubs'],
  ['perennial', 'Perennials'], ['annual', 'Annuals'], ['grass', 'Ornamental grasses'], ['groundcover', 'Ground covers'], ['turf', 'Lawn grasses'],
];
const CATS = [
  ['dtree', 'Deciduous trees'], ['etree', 'Evergreen trees'], ['bshrub', 'Broadleaf evergreen shrubs'], ['dshrub', 'Deciduous shrubs'],
  ['perennial', 'Perennials'], ['annual', 'Annuals'], ['groundcover', 'Ground covers'], ['turf', 'Lawn grasses'],
];
/* two- or three-letter key codes like a professional plant schedule: Red maple → AR (Acer rubrum) */
const PLANT_CODE = (() => {
  const out = {}, used = new Set();
  for (const p of PLANTS) {
    const parts = p.bn.replace(/[×'"]/g, '').split(/\s+/).filter(Boolean);
    let code = ((parts[0] || 'X')[0] + (parts[1] || 'X')[0]).toUpperCase();
    let k = 2;
    while (used.has(code)) code = ((parts[0] || 'X')[0] + (parts[1] || 'X').slice(0, k++)).toUpperCase();
    used.add(code);
    out[p.id] = code;
  }
  return out;
})();
