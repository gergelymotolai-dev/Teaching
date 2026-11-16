/* Plant library: species suited to central Arkansas (USDA zone 7b; Russellville).
 * t: item type the species belongs to (dtree, etree, bshrub, dshrub, perennial, annual, groundcover, turf)
 * cn/bn: common and botanical name; w/h: mature spread and height (ft); sun: F full, P part, S shade
 * z: USDA hardiness zones; c: foliage color for the rendered plan; fl: flower color (optional)
 * spc: on-center spacing (ft) for bed plants, used to estimate quantities; note: one line for students.
 * v: a vegetable, herb or fruit crop (its own library group; planted in rows). row: row spacing (ft); yl: typical
 *    yield per plant (lb) for a home garden; sea: 'cool' or 'warm' season; fl on a crop is its fruit or flower color.
 * pol: valuable to pollinators; bl: when it blooms ('sp', 'su', 'fa', joined with /); host: the butterfly it feeds as a caterpillar.
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
  { id: 'ceca', t: 'dtree', cn: 'Eastern redbud', bn: 'Cercis canadensis', w: 25, h: 25, sun: 'F/P', z: '4–9', f: 'redbud', c: '#6E9A3E', fl: '#C75B9B', pol: true, bl: 'sp', note: 'Small native tree; pink flowers in early spring.' },
  { id: 'cofl', t: 'dtree', cn: 'Flowering dogwood', bn: 'Cornus florida', w: 20, h: 20, sun: 'P', z: '5–9', f: 'dogwood', c: '#5A873C', fl: '#F4F1E6', note: 'Native understory tree; white spring flowers, red berries for birds.' },
  { id: 'lain', t: 'dtree', cn: 'Crape myrtle', bn: 'Lagerstroemia indica', w: 15, h: 20, sun: 'F', z: '7–9', f: 'crape', c: '#6D9947', fl: '#D45C8C', note: 'Summer flowers; small enough for tight spots.' },
  { id: 'acpa', t: 'dtree', cn: 'Japanese maple', bn: 'Acer palmatum', w: 15, h: 15, sun: 'P', z: '5–8', f: 'jmaple', c: '#9A3E35', note: 'Small accent tree; red leaves. Likes afternoon shade.' },
  { id: 'amar', t: 'dtree', cn: 'Serviceberry', bn: 'Amelanchier arborea', w: 15, h: 20, sun: 'F/P', z: '4–9', f: 'multistem', c: '#7CA250', fl: '#FBFAF4', pol: true, bl: 'sp', note: 'White spring flowers; berries for birds and people.' },
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
  { id: 'itvi', t: 'dshrub', cn: 'Virginia sweetspire', bn: "Itea virginica 'Henry's Garnet'", w: 5, h: 4, sun: 'F/P/S', z: '5–9', f: 'shrub', c: '#5E8C40', fl: '#FAF7EC', pol: true, bl: 'sp', note: 'Native; handles wet soil; red fall color.' },
  { id: 'caam', t: 'dshrub', cn: 'American beautyberry', bn: 'Callicarpa americana', w: 5, h: 5, sun: 'F/P', z: '6–10', f: 'berry', c: '#6E9A48', fl: '#9B4FB0', pol: true, bl: 'su', note: 'Native; purple berries that birds love.' },
  { id: 'budo', t: 'dshrub', cn: 'Butterfly bush', bn: 'Buddleja davidii', w: 6, h: 6, sun: 'F', z: '5–9', f: 'shrub', c: '#7D9A6A', fl: '#8E63B8', pol: true, bl: 'su/fa', note: 'Draws butterflies and hummingbirds.' },
  { id: 'spja', t: 'dshrub', cn: "Spirea 'Goldflame'", bn: "Spiraea japonica 'Goldflame'", w: 3, h: 3, sun: 'F', z: '4–9', f: 'fine', c: '#B4B44B', fl: '#E58AAE', note: 'Small; gold leaves and pink flowers.' },
  { id: 'vaas', t: 'dshrub', cn: 'Rabbiteye blueberry', bn: 'Vaccinium virgatum', w: 5, h: 6, sun: 'F', z: '7–9', f: 'berry', c: '#5B8A47', fl: '#3E5BA8', pol: true, bl: 'sp', note: 'Edible berries. Plant two varieties.' },
  // ---- perennials (beds)
  { id: 'ruhi', t: 'perennial', cn: 'Black-eyed Susan', bn: "Rudbeckia fulgida 'Goldsturm'", w: 2, h: 2, sun: 'F', z: '4–9', c: '#55803A', fl: '#F2B705', spc: 1.5, pol: true, bl: 'su/fa', note: 'Native; summer gold flowers; seed for finches.' },
  { id: 'ecpu', t: 'perennial', cn: 'Purple coneflower', bn: 'Echinacea purpurea', w: 2, h: 3, sun: 'F', z: '3–9', c: '#56803B', fl: '#C1569A', spc: 1.5, pol: true, bl: 'su', note: 'Native; butterflies and goldfinches.' },
  { id: 'hesd', t: 'perennial', cn: "Daylily 'Stella de Oro'", bn: "Hemerocallis 'Stella de Oro'", w: 2, h: 1.5, sun: 'F/P', z: '3–9', c: '#5E8F3E', fl: '#F3B11C', spc: 1.5, note: 'Reblooming; very tough edging plant.' },
  { id: 'hosp', t: 'perennial', cn: 'Hosta', bn: 'Hosta spp.', w: 3, h: 2, sun: 'S/P', z: '3–9', c: '#5E8A72', fl: '#C9B8E2', spc: 2, note: 'Shade beds on the north side.' },
  { id: 'peat', t: 'perennial', cn: 'Russian sage', bn: 'Salvia yangii', w: 3, h: 4, sun: 'F', z: '4–9', c: '#8FA28C', fl: '#8C7EC9', spc: 2.5, pol: true, bl: 'su/fa', note: 'Lavender spikes; heat and drought tolerant.' },
  { id: 'phpa', t: 'perennial', cn: 'Garden phlox', bn: "Phlox paniculata 'David'", w: 2.5, h: 3.5, sun: 'F/P', z: '4–8', c: '#5A873C', fl: '#F7F4F8', spc: 2, pol: true, bl: 'su', note: 'Fragrant; hummingbirds and butterflies.' },
  { id: 'cove', t: 'perennial', cn: 'Threadleaf coreopsis', bn: "Coreopsis verticillata 'Zagreb'", w: 1.5, h: 1.5, sun: 'F', z: '3–9', c: '#6C9447', fl: '#F5C518', spc: 1.5, pol: true, bl: 'su', note: 'Fine leaves, yellow flowers all summer.' },
  // ---- annuals (beds)
  { id: 'ziel', t: 'annual', cn: 'Zinnia', bn: 'Zinnia elegans', w: 1, h: 2.5, sun: 'F', z: 'annual', c: '#5C8B3D', fl: '#E8573B', spc: 1, pol: true, bl: 'su/fa', note: 'Bright cut flowers; butterflies.' },
  { id: 'caro', t: 'annual', cn: 'Vinca', bn: 'Catharanthus roseus', w: 1, h: 1, sun: 'F', z: 'annual', c: '#3F7337', fl: '#E87BB0', spc: 1, note: 'Handles Arkansas heat.' },
  { id: 'bese', t: 'annual', cn: 'Wax begonia', bn: 'Begonia semperflorens', w: 1, h: 1, sun: 'P/S', z: 'annual', c: '#4A7A3A', fl: '#D8344A', spc: 0.75, note: 'Shade color.' },
  { id: 'taer', t: 'annual', cn: 'Marigold', bn: 'Tagetes erecta', w: 1, h: 1.5, sun: 'F', z: 'annual', c: '#5A8A3C', fl: '#F39A1E', spc: 1, pol: true, bl: 'su/fa', note: 'Easy; good in the vegetable garden too.' },
  { id: 'pehy', t: 'annual', cn: 'Petunia', bn: 'Petunia × hybrida', w: 1.5, h: 1, sun: 'F', z: 'annual', c: '#4F8139', fl: '#8B4FB8', spc: 1, note: 'Spreading summer color.' },
  { id: 'viwi', t: 'annual', cn: 'Pansy', bn: 'Viola × wittrockiana', w: 0.75, h: 0.75, sun: 'F/P', z: 'annual', c: '#4A7D3A', fl: '#6B5BC4', spc: 0.75, note: 'Cool-season color, fall to spring.' },
  // ---- ground covers
  { id: 'limu', t: 'groundcover', cn: 'Liriope', bn: 'Liriope muscari', w: 1.5, h: 1, sun: 'F/P/S', z: '5–10', c: '#3E6A35', fl: '#8A72C8', spc: 1, note: 'Grass-like edging; purple flower spikes.' },
  { id: 'opja', t: 'groundcover', cn: 'Mondo grass', bn: 'Ophiopogon japonicus', w: 1, h: 0.5, sun: 'P/S', z: '6–10', c: '#2F5530', spc: 0.75, note: 'Dark green carpet for shade.' },
  { id: 'trja', t: 'groundcover', cn: 'Asiatic jasmine', bn: 'Trachelospermum asiaticum', w: 3, h: 0.75, sun: 'F/P/S', z: '7–10', c: '#3C6534', spc: 1.5, note: 'Evergreen carpet; slopes and shade.' },
  { id: 'phsu', t: 'groundcover', cn: 'Creeping phlox', bn: 'Phlox subulata', w: 2, h: 0.5, sun: 'F', z: '3–9', c: '#5F8A42', fl: '#C995D8', spc: 1.5, note: 'Spring carpet of flowers.' },
  { id: 'ajre', t: 'groundcover', cn: 'Ajuga', bn: 'Ajuga reptans', w: 1.5, h: 0.5, sun: 'P/S', z: '3–9', c: '#5A4A5E', fl: '#5B5FC0', spc: 1, note: 'Bronze leaves; blue spring spikes.' },
  // ---- pollinator plants: native perennials and long-blooming annuals (bl = bloom season)
  { id: 'astu', t: 'perennial', cn: 'Butterfly weed', bn: 'Asclepias tuberosa', w: 1.5, h: 2, sun: 'F', z: '3–9', c: '#5E8A3C', fl: '#F28C1E', spc: 1.5, pol: true, bl: 'su', host: 'monarch', note: 'Native milkweed; monarch caterpillars eat nothing else. Dry soil, full sun.' },
  { id: 'asin', t: 'perennial', cn: 'Swamp milkweed', bn: 'Asclepias incarnata', w: 2, h: 4, sun: 'F', z: '3–9', c: '#5A8840', fl: '#D8779E', spc: 2, pol: true, bl: 'su', host: 'monarch', note: 'Native milkweed for average to wet soil; monarch host plant.' },
  { id: 'modi', t: 'perennial', cn: 'Bee balm', bn: 'Monarda didyma', w: 2.5, h: 3, sun: 'F/P', z: '4–9', c: '#5C8B45', fl: '#C7305A', spc: 2, pol: true, bl: 'su', note: 'Native mint; bees, butterflies and hummingbirds. Spreads.' },
  { id: 'agfo', t: 'perennial', cn: 'Anise hyssop', bn: 'Agastache foeniculum', w: 1.5, h: 3, sun: 'F', z: '4–9', c: '#6B9455', fl: '#8A6BC4', spc: 1.5, pol: true, bl: 'su/fa', note: 'Blooms for months; one of the best bee plants.' },
  { id: 'lisp', t: 'perennial', cn: 'Blazing star', bn: 'Liatris spicata', w: 1.5, h: 3, sun: 'F', z: '3–9', c: '#5E8C42', fl: '#A85CC0', spc: 1.25, pol: true, bl: 'su', note: 'Native purple spikes; a butterfly magnet.' },
  { id: 'pedi', t: 'perennial', cn: 'Foxglove beardtongue', bn: 'Penstemon digitalis', w: 1.5, h: 3, sun: 'F/P', z: '3–8', c: '#5B8742', fl: '#F6F1F4', spc: 1.5, pol: true, bl: 'sp', note: 'Native; white spring bloom for bumble bees.' },
  { id: 'baau', t: 'perennial', cn: 'Wild blue indigo', bn: 'Baptisia australis', w: 3, h: 3.5, sun: 'F', z: '3–9', c: '#6E9670', fl: '#5A63C2', spc: 3, pol: true, bl: 'sp', note: 'Native, shrub-like; early food for bumble bee queens.' },
  { id: 'pymu', t: 'perennial', cn: 'Mountain mint', bn: 'Pycnanthemum muticum', w: 2.5, h: 3, sun: 'F/P', z: '4–8', c: '#8FAE8A', fl: '#EDEBE2', spc: 2, pol: true, bl: 'su', note: 'Native; draws more kinds of pollinators than almost anything. Spreads.' },
  { id: 'eupu', t: 'perennial', cn: 'Joe-Pye weed', bn: 'Eutrochium purpureum', w: 3, h: 6, sun: 'F/P', z: '4–9', c: '#587F3E', fl: '#B87AA6', spc: 3, pol: true, bl: 'su/fa', note: 'Tall native for the back of the bed; butterflies crowd it.' },
  { id: 'soru', t: 'perennial', cn: 'Goldenrod', bn: "Solidago rugosa 'Fireworks'", w: 2.5, h: 3, sun: 'F', z: '4–9', c: '#5E8B3A', fl: '#F2C21A', spc: 2, pol: true, bl: 'fa', note: 'Native; the fall fuel for bees and migrating monarchs. Does not cause hay fever.' },
  { id: 'syno', t: 'perennial', cn: 'New England aster', bn: 'Symphyotrichum novae-angliae', w: 2.5, h: 4, sun: 'F', z: '4–8', c: '#567F3C', fl: '#8A5BC0', spc: 2, pol: true, bl: 'fa', note: 'Native; purple fall bloom when little else is flowering.' },
  { id: 'sane', t: 'perennial', cn: "Salvia 'May Night'", bn: "Salvia nemorosa 'Mainacht'", w: 1.5, h: 1.5, sun: 'F', z: '4–9', c: '#5A8440', fl: '#4F3FA8', spc: 1.5, pol: true, bl: 'sp/su', note: 'Deep violet spikes from late spring; bees love it.' },
  { id: 'ceoc', t: 'dshrub', cn: 'Buttonbush', bn: 'Cephalanthus occidentalis', w: 6, h: 6, sun: 'F/P', z: '5–9', f: 'shrub', c: '#5F8E46', fl: '#F3EFE2', pol: true, bl: 'su', note: 'Native shrub for wet spots; white pincushion flowers covered in bees and butterflies.' },
  { id: 'hean', t: 'annual', cn: 'Sunflower', bn: 'Helianthus annuus', w: 1.5, h: 6, sun: 'F', z: 'annual', c: '#5F8B3A', fl: '#F5C211', spc: 1.5, pol: true, bl: 'su/fa', note: 'Pollen and nectar for bees, then seed for birds.' },
  { id: 'cobi', t: 'annual', cn: 'Cosmos', bn: 'Cosmos bipinnatus', w: 1.5, h: 4, sun: 'F', z: 'annual', c: '#6F9A4E', fl: '#E77FB3', spc: 1, pol: true, bl: 'su/fa', note: 'Airy and easy from seed; blooms until frost.' },
  { id: 'laca', t: 'annual', cn: 'Lantana', bn: 'Lantana camara', w: 3, h: 2, sun: 'F', z: 'annual', c: '#4F7F38', fl: '#F08A24', spc: 2, pol: true, bl: 'su/fa', note: 'Thrives in heat; butterflies all summer.' },
  { id: 'tiro', t: 'annual', cn: 'Mexican sunflower', bn: 'Tithonia rotundifolia', w: 3, h: 5, sun: 'F', z: 'annual', c: '#5A873A', fl: '#F26A1B', spc: 2, pol: true, bl: 'su/fa', note: 'Orange daisies; a favorite of monarchs and swallowtails.' },
  // ---- vegetables: warm season (v = crop; row = row spacing; yl = lb per plant; fl = fruit color)
  { id: 'soly', t: 'annual', v: true, sea: 'warm', cn: 'Tomato', bn: 'Solanum lycopersicum', w: 2, h: 5, sun: 'F', z: 'annual', c: '#4F8A3A', fl: '#D8342A', spc: 2, row: 4, yl: 12, note: 'Stake or cage. Plant after the last frost (mid-April here).' },
  { id: 'caan', t: 'annual', v: true, sea: 'warm', cn: 'Bell pepper', bn: 'Capsicum annuum', w: 1.5, h: 2.5, sun: 'F', z: 'annual', c: '#3F7A36', fl: '#E0452B', spc: 1.5, row: 3, yl: 4, note: 'Loves heat; pick green or let them color.' },
  { id: 'some', t: 'annual', v: true, sea: 'warm', cn: 'Eggplant', bn: 'Solanum melongena', w: 2, h: 3, sun: 'F', z: 'annual', c: '#5A8A5A', fl: '#5B2E7A', spc: 2, row: 3, yl: 5, note: 'Sets fruit in the hottest part of summer.' },
  { id: 'abes', t: 'annual', v: true, sea: 'warm', cn: 'Okra', bn: 'Abelmoschus esculentus', w: 1.5, h: 5, sun: 'F', z: 'annual', c: '#4E8438', fl: '#F3E9B5', spc: 1.5, row: 3, yl: 2, pol: true, bl: 'su', note: 'A Southern staple; pick pods small, every other day.' },
  { id: 'zema', t: 'annual', v: true, sea: 'warm', cn: 'Sweet corn', bn: 'Zea mays', w: 1, h: 7, sun: 'F', z: 'annual', c: '#6FA03F', fl: '#F2D24A', spc: 1, row: 3, yl: 0.7, note: 'Plant in blocks of 4 or more rows so it pollinates; one or two ears a stalk.' },
  { id: 'phvu', t: 'annual', v: true, sea: 'warm', cn: 'Bush bean', bn: 'Phaseolus vulgaris', w: 1, h: 1.5, sun: 'F', z: 'annual', c: '#4F8B3C', spc: 0.4, row: 2, yl: 0.4, note: 'Sow every two weeks for a steady harvest.' },
  { id: 'phco', t: 'annual', v: true, sea: 'warm', cn: 'Pole bean', bn: 'Phaseolus coccineus', w: 1, h: 7, sun: 'F', z: 'annual', c: '#4B8638', fl: '#D8342A', spc: 0.5, row: 3, yl: 0.8, note: 'Needs a trellis; bears longer than bush beans.' },
  { id: 'viun', t: 'annual', v: true, sea: 'warm', cn: 'Southern pea', bn: 'Vigna unguiculata', w: 1.5, h: 2, sun: 'F', z: 'annual', c: '#568C3E', spc: 0.4, row: 3, yl: 0.3, note: 'Purple hull and black-eyed peas; thrives in heat and poor soil.' },
  { id: 'cusa', t: 'annual', v: true, sea: 'warm', cn: 'Cucumber', bn: 'Cucumis sativus', w: 3, h: 1, sun: 'F', z: 'annual', c: '#4E8A3A', fl: '#F0D23C', spc: 1.5, row: 5, yl: 5, note: 'Trellis it to save space and keep fruit clean.' },
  { id: 'cupe', t: 'annual', v: true, sea: 'warm', cn: 'Zucchini / summer squash', bn: 'Cucurbita pepo', w: 3.5, h: 2, sun: 'F', z: 'annual', c: '#4C8436', fl: '#F2C81E', spc: 3, row: 4, yl: 8, pol: true, bl: 'su', note: 'Two plants feed a family. Needs bees to set fruit.' },
  { id: 'cumo', t: 'annual', v: true, sea: 'warm', cn: 'Butternut squash', bn: 'Cucurbita moschata', w: 6, h: 1.5, sun: 'F', z: 'annual', c: '#4A8034', fl: '#E3B878', spc: 4, row: 6, yl: 10, note: 'Winter squash; vines run 10 ft. Stores for months.' },
  { id: 'cupu', t: 'annual', v: true, sea: 'warm', cn: 'Pumpkin', bn: "Cucurbita pepo 'Howden'", w: 8, h: 2, sun: 'F', z: 'annual', c: '#4A8236', fl: '#F07F1A', spc: 5, row: 8, yl: 25, note: 'Carving pumpkin. Sow in late June for October.' },
  { id: 'cuma', t: 'annual', v: true, sea: 'warm', cn: 'Giant pumpkin', bn: "Cucurbita maxima 'Atlantic Giant'", w: 25, h: 3, sun: 'F', z: 'annual', c: '#4B8438', fl: '#F29A3A', spc: 25, row: 30, yl: 400, note: 'One plant fills 600 to 1,000 sq ft. For a trained patch use Giant pumpkin patch in the Garden tab.' },
  { id: 'cila', t: 'annual', v: true, sea: 'warm', cn: 'Watermelon', bn: 'Citrullus lanatus', w: 8, h: 1.5, sun: 'F', z: 'annual', c: '#4F863C', fl: '#2F6B3A', spc: 5, row: 8, yl: 30, note: 'Needs heat, room and a long season.' },
  { id: 'cume', t: 'annual', v: true, sea: 'warm', cn: 'Cantaloupe', bn: 'Cucumis melo', w: 6, h: 1.5, sun: 'F', z: 'annual', c: '#528A3E', fl: '#D9B56A', spc: 3, row: 6, yl: 8, note: 'Sweetest when it ripens in hot, dry weather.' },
  { id: 'ipba', t: 'annual', v: true, sea: 'warm', cn: 'Sweet potato', bn: 'Ipomoea batatas', w: 4, h: 1, sun: 'F', z: 'annual', c: '#3E7A40', spc: 1, row: 3.5, yl: 2, note: 'Set slips in May; the vines cover the ground. Dig before frost.' },
  // ---- vegetables: cool season (spring and fall)
  { id: 'lasa', t: 'annual', v: true, sea: 'cool', cn: 'Lettuce', bn: 'Lactuca sativa', w: 0.75, h: 0.75, sun: 'F/P', z: 'annual', c: '#8CC356', spc: 0.75, row: 1.5, yl: 0.6, note: 'Spring and fall; bolts in summer heat.' },
  { id: 'spol', t: 'annual', v: true, sea: 'cool', cn: 'Spinach', bn: 'Spinacia oleracea', w: 0.5, h: 0.75, sun: 'F/P', z: 'annual', c: '#3F7A3A', spc: 0.5, row: 1, yl: 0.3, note: 'Sow in February and again in September.' },
  { id: 'brok', t: 'annual', v: true, sea: 'cool', cn: 'Kale', bn: 'Brassica oleracea (Acephala)', w: 1.5, h: 2, sun: 'F/P', z: 'annual', c: '#4E7F62', spc: 1.5, row: 2.5, yl: 2, note: 'Sweeter after frost; pick the lower leaves.' },
  { id: 'brca', t: 'annual', v: true, sea: 'cool', cn: 'Cabbage', bn: 'Brassica oleracea (Capitata)', w: 1.5, h: 1.5, sun: 'F', z: 'annual', c: '#7FAE86', spc: 1.5, row: 2.5, yl: 3.5, note: 'Set transplants in March or August.' },
  { id: 'brit', t: 'annual', v: true, sea: 'cool', cn: 'Broccoli', bn: 'Brassica oleracea (Italica)', w: 1.5, h: 2, sun: 'F', z: 'annual', c: '#5A8A6E', spc: 1.5, row: 2.5, yl: 1.2, note: 'Cut the main head, then harvest side shoots.' },
  { id: 'bevu', t: 'annual', v: true, sea: 'cool', cn: 'Swiss chard', bn: 'Beta vulgaris (Cicla)', w: 1, h: 1.5, sun: 'F/P', z: 'annual', c: '#4E8A3E', fl: '#D8344A', spc: 1, row: 1.5, yl: 1.5, note: 'Colorful stems; takes more heat than other greens.' },
  { id: 'daca', t: 'annual', v: true, sea: 'cool', cn: 'Carrot', bn: 'Daucus carota', w: 0.25, h: 1, sun: 'F', z: 'annual', c: '#5E9A48', spc: 0.25, row: 1, yl: 0.15, note: 'Loose, stone-free soil; thin to 3 in.' },
  { id: 'rasa', t: 'annual', v: true, sea: 'cool', cn: 'Radish', bn: 'Raphanus sativus', w: 0.2, h: 0.5, sun: 'F', z: 'annual', c: '#6BA84E', spc: 0.2, row: 1, yl: 0.05, note: 'Ready in four weeks: a good first crop for students.' },
  { id: 'beet', t: 'annual', v: true, sea: 'cool', cn: 'Beet', bn: 'Beta vulgaris', w: 0.33, h: 1, sun: 'F/P', z: 'annual', c: '#5A8244', fl: '#8E2A4A', spc: 0.33, row: 1, yl: 0.3, note: 'Eat the roots and the greens.' },
  { id: 'alce', t: 'annual', v: true, sea: 'cool', cn: 'Onion', bn: 'Allium cepa', w: 0.33, h: 1.5, sun: 'F', z: 'annual', c: '#6A9A6E', spc: 0.33, row: 1, yl: 0.4, note: 'Set plants in February; harvest when the tops fall in June.' },
  { id: 'alsa', t: 'annual', v: true, sea: 'cool', cn: 'Garlic', bn: 'Allium sativum', w: 0.5, h: 2, sun: 'F', z: 'annual', c: '#74A078', spc: 0.5, row: 1, yl: 0.15, note: 'Plant cloves in October; harvest in June.' },
  { id: 'sotu', t: 'annual', v: true, sea: 'cool', cn: 'Potato', bn: 'Solanum tuberosum', w: 2, h: 2, sun: 'F', z: 'annual', c: '#4E8440', spc: 1, row: 3, yl: 2, note: 'Plant seed pieces in March; hill soil up as they grow.' },
  { id: 'pisa', t: 'annual', v: true, sea: 'cool', cn: 'English pea', bn: 'Pisum sativum', w: 0.5, h: 4, sun: 'F', z: 'annual', c: '#62A04C', fl: '#F4F1E6', spc: 0.2, row: 2, yl: 0.15, note: 'Sow in February on a trellis; done by June.' },
  // ---- herbs
  { id: 'ocba', t: 'annual', v: true, sea: 'warm', cn: 'Basil', bn: 'Ocimum basilicum', w: 1.5, h: 2, sun: 'F', z: 'annual', c: '#58A040', spc: 1, row: 1.5, yl: 0.5, pol: true, bl: 'su', note: 'Pinch the tips; let a few plants flower for the bees.' },
  { id: 'cosa', t: 'annual', v: true, sea: 'cool', cn: 'Cilantro', bn: 'Coriandrum sativum', w: 1, h: 2, sun: 'F/P', z: 'annual', c: '#6AA64E', spc: 0.5, row: 1, yl: 0.2, pol: true, bl: 'sp', note: 'Cool-season; flowers feed tiny beneficial wasps.' },
  { id: 'angr', t: 'annual', v: true, sea: 'cool', cn: 'Dill', bn: 'Anethum graveolens', w: 1.5, h: 3, sun: 'F', z: 'annual', c: '#7FB05E', fl: '#E6D94A', spc: 1, row: 1.5, yl: 0.2, pol: true, bl: 'su', host: 'black swallowtail', note: 'Black swallowtail caterpillars feed on it: plant extra.' },
  { id: 'pecr', t: 'annual', v: true, sea: 'cool', cn: 'Parsley', bn: 'Petroselinum crispum', w: 1, h: 1, sun: 'F/P', z: 'annual', c: '#3F8A3A', spc: 0.75, row: 1.5, yl: 0.3, host: 'black swallowtail', note: 'Swallowtail host plant; cut the outer stems.' },
  { id: 'saro', t: 'perennial', v: true, cn: 'Rosemary', bn: 'Salvia rosmarinus', w: 3, h: 3, sun: 'F', z: '7–10', c: '#5F8A72', fl: '#8FA6D8', spc: 3, yl: 1, pol: true, bl: 'sp', note: 'Evergreen; needs sharp drainage.' },
  { id: 'thvu', t: 'perennial', v: true, cn: 'Thyme', bn: 'Thymus vulgaris', w: 1, h: 0.75, sun: 'F', z: '5–9', c: '#6F9A6A', fl: '#D9A8D8', spc: 1, yl: 0.2, pol: true, bl: 'sp/su', note: 'Low mat for the dry edge of a bed.' },
  { id: 'orvu', t: 'perennial', v: true, cn: 'Oregano', bn: 'Origanum vulgare', w: 2, h: 1.5, sun: 'F', z: '4–9', c: '#5E9450', fl: '#D8A6CC', spc: 1.5, yl: 0.4, pol: true, bl: 'su', note: 'Spreads; in bloom it is covered in bees.' },
  { id: 'saof', t: 'perennial', v: true, cn: 'Sage', bn: 'Salvia officinalis', w: 2, h: 2, sun: 'F', z: '4–8', c: '#9DB09A', fl: '#8E7CC8', spc: 2, yl: 0.4, pol: true, bl: 'sp', note: 'Gray leaves; hates wet feet.' },
  { id: 'alsc', t: 'perennial', v: true, cn: 'Chives', bn: 'Allium schoenoprasum', w: 1, h: 1, sun: 'F/P', z: '3–9', c: '#5C9A52', fl: '#C78AD0', spc: 0.75, yl: 0.3, pol: true, bl: 'sp', note: 'Edible leaves and flowers; an easy edging.' },
  { id: 'laan', t: 'perennial', v: true, cn: 'Lavender', bn: "Lavandula × intermedia 'Phenomenal'", w: 2.5, h: 2.5, sun: 'F', z: '5–9', c: '#93A89A', fl: '#8E6CC6', spc: 2.5, yl: 0.3, pol: true, bl: 'su', note: 'Needs raised, gravelly soil in Arkansas humidity.' },
  // ---- fruit
  { id: 'fran', t: 'perennial', v: true, cn: 'Strawberry', bn: 'Fragaria × ananassa', w: 1, h: 0.75, sun: 'F', z: '4–9', c: '#4E8A3C', fl: '#D8283A', spc: 1, row: 3, yl: 1, pol: true, bl: 'sp', note: 'Matted rows; berries in late April and May.' },
  { id: 'asof', t: 'perennial', v: true, cn: 'Asparagus', bn: 'Asparagus officinalis', w: 2, h: 5, sun: 'F', z: '3–8', c: '#6FA05A', spc: 1.5, row: 4, yl: 0.5, note: 'A permanent bed: harvest from the third spring, for 15 years.' },
  { id: 'rufr', t: 'dshrub', v: true, f: 'berry', cn: 'Thornless blackberry', bn: "Rubus 'Ouachita'", w: 4, h: 5, sun: 'F', z: '6–9', c: '#4F8438', fl: '#2E1F3E', yl: 10, pol: true, bl: 'sp', note: 'A University of Arkansas variety. Grow on a trellis; fruit in June.' },
  { id: 'fica', t: 'dshrub', v: true, f: 'shrub', cn: 'Fig', bn: "Ficus carica 'Celeste'", w: 10, h: 10, sun: 'F', z: '7–10', c: '#4E8A44', fl: '#7A4A6A', yl: 25, note: 'Plant against a south wall; may die back in a hard winter.' },
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
const catOf = (sp) => (sp.g ? 'grass' : sp.v ? 'veg' : sp.t);
const LIB_CATS = [
  ['dtree', 'Deciduous trees'], ['etree', 'Evergreen trees'], ['bshrub', 'Broadleaf evergreen shrubs'], ['dshrub', 'Deciduous shrubs'],
  ['perennial', 'Perennials'], ['annual', 'Annuals'], ['veg', 'Vegetables, herbs and fruit'], ['grass', 'Ornamental grasses'], ['groundcover', 'Ground covers'], ['turf', 'Lawn grasses'],
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
