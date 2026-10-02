export type Category = { id: string; name: string; slug: string; description: string; image_url: string }
export type Product = {
  id: string; category_id: string; category: string; name: string; slug: string; description: string
  price: number; image_url: string; stock_quantity: number; material: string; dimensions: string
  colour: string; care_instructions: string; featured: boolean; is_active: boolean; created_at: string
}
export type CartLine = { id: string; product_id: string; quantity: number; product: Product }

const photos = {
  room: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85',
  bed: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=85',
  dining: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
  lamp: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85',
  vase: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1200&q=85',
  decor: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
  basket: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=85',
  throw: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=85',
}

export const categorySeed: Category[] = [
  { id:'living-room', name:'Living Room', slug:'living-room', description:'Thoughtful finishing touches for slower, softer living.', image_url:photos.room },
  { id:'bedroom', name:'Bedroom', slug:'bedroom', description:'Comforting layers and considered accents for restful rooms.', image_url:photos.bed },
  { id:'dining', name:'Dining', slug:'dining', description:'Natural details made for gathering around the table.', image_url:photos.dining },
  { id:'lighting', name:'Lighting', slug:'lighting', description:'A softer glow for the moments that make a home.', image_url:photos.lamp },
  { id:'storage', name:'Storage', slug:'storage', description:'Everyday essentials with a place and a purpose.', image_url:photos.basket },
  { id:'wall-decor', name:'Wall Décor', slug:'wall-decor', description:'Artful details that give a room its own character.', image_url:photos.decor },
]

const seedRows: Array<[string,string,string,string,number,string,number,string,string,string,string,boolean]> = [
  ['living-room','Solis Throw Pillow','solis-throw-pillow','A soft cotton blend in a quiet sand tone, made for layering on the sofa or your favourite reading chair.',18500,photos.throw,24,'Cotton blend','45 × 45 cm','Sand Beige','Spot clean gently. Air dry away from direct sunlight.',true],
  ['living-room','Alba Ceramic Vase','alba-ceramic-vase','An understated ceramic silhouette that looks just as lovely with a few stems as it does on its own.',32000,photos.vase,15,'Ceramic','24 × 12 cm','Ivory','Wipe with a soft, dry cloth. Not intended for food use.',true],
  ['living-room','Aria Decorative Tray','aria-decorative-tray','A warm oak-look tray that gathers candles, keepsakes and everyday essentials into one considered moment.',27500,photos.dining,18,'Wood composite','38 × 25 × 4 cm','Natural Oak','Wipe clean with a slightly damp cloth; dry promptly.',false],
  ['living-room','Nola Accent Lamp','nola-accent-lamp','A gentle pool of light, with a forest-green base and soft ivory shade for cosy evenings at home.',52000,photos.lamp,10,'Metal and fabric','42 × 18 cm','Forest Green / Ivory','Dust shade with a dry cloth. Bulb sold separately.',false],
  ['bedroom','Luna Bedside Lamp','luna-bedside-lamp','A calming ceramic base and softly diffused shade bring a little warmth to your bedside routine.',48000,photos.lamp,12,'Ceramic and fabric','38 × 20 cm','Ivory','Wipe ceramic with a soft cloth. Dust shade regularly.',true],
  ['bedroom','Haven Cushion','haven-cushion','A linen-blend cushion in a muted sage, ready to add texture to a bed or favourite chair.',16500,photos.throw,30,'Linen blend','45 × 45 cm','Sage Green','Spot clean or dry clean. Insert included.',false],
  ['bedroom','Elara Wall Mirror','elara-wall-mirror','A clean framed mirror with a subtle warm-gold edge that brightens the room and opens up a wall.',85000,photos.decor,8,'Glass and metal','70 × 50 cm','Warm Gold','Clean glass with a non-abrasive glass cloth.',false],
  ['bedroom','Sienna Throw','sienna-throw','A breathable cotton-blend layer in soft sand beige, made for a quiet morning or an extra cosy evening.',35000,photos.bed,16,'Cotton blend','130 × 170 cm','Sand Beige','Machine wash cold on a gentle cycle. Line dry.',true],
  ['dining','Terra Table Vase','terra-table-vase','Hand-finished stoneware character in a warm terracotta tone, sized for a single stem or a small arrangement.',29000,photos.vase,14,'Stoneware','22 × 14 cm','Terracotta','Wipe with a soft, dry cloth. Not intended for food use.',false],
  ['dining','Oakley Serving Tray','oakley-serving-tray','A generous acacia-wood tray for morning coffee, shared plates and those small everyday rituals.',31500,photos.dining,11,'Acacia wood','45 × 30 × 5 cm','Natural Wood','Hand wipe only. Keep dry and condition wood occasionally.',true],
  ['dining','Maison Candle Holder','maison-candle-holder','A simple metal candle holder with a warm-gold finish that brings a gentle glow to dinner and slow evenings.',22000,'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=85',20,'Metal','18 × 8 cm','Warm Gold','Wipe clean when cool. Never leave a lit candle unattended.',false],
  ['lighting','Lumi Table Lamp','lumi-table-lamp','A considered mix of forest green and warm gold, designed to add a softly sculptural glow to your space.',58000,photos.lamp,9,'Metal and glass','40 × 20 cm','Forest Green / Gold','Wipe with a soft cloth. Bulb sold separately.',true],
  ['lighting','Halo Pendant Light','halo-pendant-light','A streamlined pendant with a warm metallic finish to bring welcoming light above a dining table or reading nook.',120000,photos.lamp,5,'Metal and glass','45 × 45 × 30 cm','Warm Gold','Installation by a qualified electrician recommended.',false],
  ['lighting','Solis Floor Lamp','solis-floor-lamp','Tall, quiet and easy to place, this floor lamp pairs a forest-green stem with an ivory fabric shade.',145000,photos.lamp,6,'Metal and fabric','150 × 35 cm','Forest Green / Ivory','Dust shade and stem with a dry cloth. Bulb sold separately.',false],
  ['storage','Haven Storage Basket','haven-storage-basket','A woven natural-fibre basket that gives throws, cushions and everyday belongings a handsome home.',26000,photos.basket,20,'Woven natural fibre','40 × 30 × 30 cm','Natural Beige','Keep dry. Brush gently to remove dust.',true],
  ['storage','Riva Organizer','riva-organizer','A tidy bamboo organiser for the small things that make a desk, shelf or bedside feel more considered.',21500,photos.decor,25,'Bamboo','30 × 20 × 10 cm','Natural','Wipe with a dry or slightly damp cloth; do not soak.',false],
  ['storage','Noma Decorative Box','noma-decorative-box','A forest-green fabric-covered box that keeps small keepsakes tucked away and close at hand.',24500,photos.basket,18,'Fabric-covered board','32 × 22 × 14 cm','Forest Green','Dust with a lint-free cloth. Keep away from moisture.',false],
  ['wall-decor','Solis Abstract Print','solis-abstract-print','A calm abstract composition in beige, charcoal and gold, finished with a natural wood frame.',38000,photos.decor,10,'Fine art paper / wood frame','50 × 70 cm','Beige / Charcoal / Gold','Keep out of direct sunlight. Dust frame with a soft cloth.',false],
  ['wall-decor','Terra Botanical Art','terra-botanical-art','A softly botanical print in sage and beige that brings an easy connection to nature indoors.',42000,photos.decor,9,'Archival paper / wood frame','50 × 70 cm','Sage / Beige','Keep out of direct sunlight. Dust frame with a soft cloth.',true],
  ['wall-decor','Luma Minimal Mirror','luma-minimal-mirror','A pared-back charcoal-framed mirror that opens up a wall with simple, modern lines.',72000,photos.decor,7,'Glass and aluminium','60 × 80 cm','Charcoal','Clean glass with a non-abrasive glass cloth.',true],
]

export const productSeed: Product[] = seedRows.map((r, i) => ({
  id: `preview-${i + 1}`, category_id: r[0], category: categorySeed.find(c => c.slug === r[0])!.name,
  name: r[1], slug: r[2], description: r[3], price: r[4], image_url: r[5], stock_quantity: r[6],
  material: r[7], dimensions: r[8], colour: r[9], care_instructions: r[10], featured: r[11], is_active: true,
  created_at: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
}))
