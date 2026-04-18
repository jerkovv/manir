-- ============================================================
-- PHASE 4: Extend products table with rich content fields
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

alter table public.products
  add column if not exists size text,
  add column if not exists category text,
  add column if not exists category_slug text,
  add column if not exists short_description text,
  add column if not exists target_audience text,
  add column if not exists benefits text[] default '{}',
  add column if not exists free_from text[] default '{}',
  add column if not exists ingredients_benefits jsonb default '[]'::jsonb,
  add column if not exists active_ingredients_count int,
  add column if not exists usage text,
  add column if not exists inci text,
  add column if not exists composition_note text,
  add column if not exists featured boolean default false,
  add column if not exists position int default 0;

-- ============================================================
-- SEED — 7 postojećih proizvoda
-- (slike se serviraju iz /public/products/)
-- ============================================================

insert into public.products (
  slug, name, size, price, category, category_slug, images, featured, visible,
  short_description, target_audience, benefits, free_from, ingredients_benefits,
  active_ingredients_count, usage, inci, composition_note, position
) values
(
  'mom-baby-ulje',
  'MOM & BABY ulje za lice i telo',
  '100 ml', 1900, 'Mom & Baby', 'mom-baby',
  array['/products/mom-baby-ulje-1.jpeg','/products/mom-baby-ulje-2.jpeg','/products/mom-baby-ulje-3.jpeg'],
  false, true,
  'Nežno prirodno ulje za bebe formulisano isključivo od hladno ceđenih biljnih ulja i biljnih macerata pruža dubinsku hidrataciju, regeneraciju kože i zaštitu osetljive kože od prvih dana života. Namenjeno je bebama, deci, trudnicama i osetljivoj koži odraslih, posebno kada je koža suva, reaktivna ili sklona crvenilu. Idealno za svakodnevnu negu i masažu beba.',
  'Bebama, deci, trudnicama i osetljivoj koži odraslih – posebno kada je koža suva, reaktivna ili sklona crvenilu.',
  array['Intenzivno hrani i omekšava kožu','Obnavlja prirodnu lipidnu barijeru kože','Smanjuje crvenilo i osećaj zatezanja','Štiti kožu od isušivanja nakon kupanja','Podržava regeneraciju osetljive i reaktivne kože','Idealno za svakodnevnu masažu beba','Pogodno za negu kože trudnica i cele porodice'],
  array['Bez mineralnih ulja','Bez parabena','Bez silikona','Bez parfema','Bez veštačkih boja','Bez agresivnih iritirajućih sastojaka'],
  '[{"name":"Ulje kajsijinih koštica","benefit":"Omekšava kožu i poboljšava elastičnost kože"},{"name":"Ulje suncokreta","benefit":"Jača lipidnu barijeru kože i sprečava gubitak vlage"},{"name":"Ulje avokada","benefit":"Intenzivno hrani kožu i podržava regeneraciju kože"},{"name":"Macerat nevena","benefit":"Smanjuje crvenilo i iritacije kože"},{"name":"Macerat kamilice","benefit":"Umiruje osetljivu i reaktivnu kožu"},{"name":"Uljni ekstrakt aloje","benefit":"Podržava hidrataciju i regeneraciju kože"},{"name":"Vitamin E","benefit":"Štiti kožu od spoljašnjih uticaja"},{"name":"Ulje slatkog badema","benefit":"Hrani osetljivu kožu i sprečava isušivanje"}]'::jsonb,
  16,
  'Naneti malu količinu ulja na čistu kožu i nežno umasirati. Kod beba koristiti nakon kupanja ili tokom večernje masaže beba.',
  'Prunus Armeniaca Kernel Oil, Helianthus Annuus Seed Oil, Persea Gratissima Oil, Calendula Officinalis Extract, Chamomilla Recutita Flower Extract, Aloe Barbadensis Leaf Extract, Tocopherol, Prunus Amygdalus Dulcis Oil',
  null, 1
),
(
  'mom-baby-krema',
  'MOM & BABY krema za lice i telo',
  '100 ml', 1900, 'Mom & Baby', 'mom-baby',
  array['/products/mom-baby-krema-1.jpeg','/products/mom-baby-krema-2.jpeg','/products/mom-baby-krema-3.jpeg'],
  false, true,
  'Nežna prirodna krema za bebe razvijena sa 16 pažljivo odabranih aktivnih sastojaka pruža dubinsku hidrataciju kože, regeneraciju kože i obnovu zaštitne barijere kože od prvih dana života. Namenjena je bebama, deci, trudnicama i osetljivoj koži odraslih, posebno kada je koža suva, reaktivna ili sklona crvenilu. Idealna kao krema za osetljivu kožu beba i hidratantna krema za lice i telo cele porodice.',
  'Bebama, deci, trudnicama i osetljivoj koži odraslih – posebno kada je koža suva, reaktivna ili sklona crvenilu.',
  array['Intenzivna hidratacija kože','Obnova zaštitne barijere kože','Smanjenje crvenila i iritacija kože','Regeneracija osetljive i reaktivne kože','Zaštita kože od isušivanja i spoljašnjih uticaja','Poboljšanje mekoće i elastičnosti kože','Pogodna za svakodnevnu negu beba od prvih dana života'],
  array['Bez mineralnih ulja','Bez parabena','Bez silikona','Bez etanola','Bez veštačkih boja','Bez agresivnih iritirajućih sastojaka'],
  '[{"name":"Glicerin","benefit":"Obezbeđuje dubinsku hidrataciju kože i sprečava isušivanje"},{"name":"Ši puter","benefit":"Obnavlja lipidnu barijeru kože i štiti od spoljašnjih uticaja"},{"name":"Jojobino ulje","benefit":"Podržava prirodnu zaštitnu funkciju kože i omekšava kožu"},{"name":"Pantenol","benefit":"Umiruje kožu i podstiče regeneraciju zaštitne barijere kože"},{"name":"Ekstrakt ovsa","benefit":"Smanjuje iritacije i crvenilo kože i jača osetljivu kožu"},{"name":"Ekstrakt sladića","benefit":"Deluje antiinflamatorno i doprinosi smanjenju crvenila"},{"name":"Ekstrakt hamamelisa","benefit":"Umiruje kožu i smanjuje reaktivnost kože"},{"name":"Skvalan","benefit":"Obnavlja lipidni sloj kože i sprečava gubitak vlage"},{"name":"Ekstrakt centele","benefit":"Podstiče regeneraciju kože i jača zaštitnu funkciju kože"},{"name":"Ulje suncokreta","benefit":"Jača barijeru kože i sprečava gubitak vlage"},{"name":"Ulje slatkog badema","benefit":"Hrani kožu i poboljšava elastičnost kože"},{"name":"Ricinusovo ulje","benefit":"Doprinosi zaštiti kože i sprečava isušivanje"},{"name":"Alantoin","benefit":"Umiruje iritacije i podstiče obnavljanje kože"},{"name":"Vitamin E","benefit":"Štiti kožu od spoljašnjih uticaja kao antioksidans"},{"name":"Bisabolol","benefit":"Dodatno umiruje osetljivu kožu i smanjuje crvenilo"},{"name":"Eterično ulje rimske kamilice","benefit":"Doprinosi umirenju kože i smanjenju osetljivosti kože"}]'::jsonb,
  16,
  'Naneti odgovarajuću količinu kreme na čistu kožu lica i tela i nežno umasirati do potpunog upijanja. Pogodna kao krema za svakodnevnu negu beba i hidratantna krema za osetljivu kožu cele porodice.',
  'Aqua, Glycerin, Sucrose Polystearate, Hydrogenated Polyisobutene, Glyceryl Stearate, Butyrospermum Parkii Butter, Cetyl Alcohol, Simmondsia Chinensis Oil, D-Panthenol, Avena Sativa Kernel Extract, Glycyrrhiza Glabra Root Extract, Hamamelis Virginiana Leaf Extract, Squalane, Centella Asiatica Extract (10:1), Helianthus Annuus Seed Oil, Prunus Amygdalus Dulcis Oil, Ricinus Communis Seed Oil, Allantoin, Tocopherol Acetate, Bisabolol, Anthemis Nobilis Flower Oil, Pinene, Benzyl Alcohol, Dehydroacetic Acid',
  null, 2
),
(
  'hug-me-krema',
  'Hug Me – Lagana umirujuća 24h krema za lice',
  '50 ml', 3900, 'Nega lica', 'nega-lica',
  array['/products/hug-me.jpeg'],
  false, true,
  'Duboko hidrantna i umirujuća krema za lice. HUG ME – 11 aktivnih sastojaka, za sve tipove kože, uključujući osetljivu, mešovitu i masnu. Brzo se upija i ostavlja kožu glatkom, umirenom i nahranjenom, bez osećaja težine. Ne zatvara pore, ima antioksidativno dejstvo, obnavlja zaštitnu barijeru i ujednačava ten.',
  'Za sve tipove kože, uključujući osetljivu, mešovitu i masnu kožu.',
  array[
    'Umiruje crvenilo, iritacije i osećaj zatezanja zahvaljujući aloe veri, pantenolu, alantoinu, bisabololu i ulju kamilice, koji deluju protivupalno, regenerativno i umirujuće čak i na veoma osetljivoj i reaktivnoj koži.',
    'Antiinflamatorno i antioksidativno dejstvo obezbeđuju ekstrakt sladića, vitamin E i beta-sitosterol – smanjuju upale, štite ćelije kože od spoljašnjih uticaja i usporavaju pojavu prvih znakova starenja.',
    'Posvetljuje kožu i ujednačava ten zahvaljujući ekstraktu korena sladića, koji doprinosi smanjenju hiperpigmentacija i vraća koži svež, zdrav izgled.',
    'Reguliše lučenje sebuma i doprinosi uravnoteženom tenu – ulje jojobe i pažljivo odabrani emolijensi pomažu koži da sama pronađe balans između hidratacije i masnoće, bez zapušavanja pora.',
    'Poboljšava mikrocirkulaciju i vraća prirodan sjaj, čineći kožu vitalnijom i odmornijom. Obnavlja prirodnu zaštitnu barijeru kože i jača njenu otpornost.',
    'Dubinski hidrira tokom 24h zahvaljujući glicerinu, urei i propilen glikolu, koji vezuju vlagu u koži i sprečavaju njen gubitak, ostavljajući kožu dugotrajno mekom, elastičnom i zaštićenom.'
  ],
  '{}'::text[],
  '[]'::jsonb,
  11,
  'Naneti kremu na čistu kožu ili nakon seruma K1 i lagano umasirati. Preporučuje se ujutru i uveče ili u toku dana po potrebi. Čuvati na sobnoj temperaturi.',
  'Aqua, Glycerin, Decyl Oleate, Propylene Glycol, Urea, Simmondsia Chinensis Seed Oil, Glyceryl Stearate, Glycyrrhiza Glabra Root Extract, Cetyl Alcohol, Polysorbate 20, D-Panthenol, Aloe Barbadensis Gel (10x), Benzyl Alcohol, Dehydroacetic Acid, Allantoin, Beta-Sitosterol, Tocopherol mix, Bisabolol, Chamomilla Recutita Flower Oil, Limonene, Sodium Benzoate, Potassium Sorbate, Citric Acid',
  null, 3
),
(
  'serum-k1',
  'Serum-koncentrat K1',
  '30 ml', 4900, 'Nega lica', 'nega-lica',
  array['/products/serum-k1.jpeg'],
  true, true,
  'Antiinflamatorno & anti-age dejstvo. 8 aktivnih sastojaka, za sve tipove kože. Dubinski regeneriše i hrani kožu, umiruje iritacije, akne i crvenilo. Serum je namenjen svim tipovima kože, uključujući osetljivu i problematičnu kožu.',
  'Za sve tipove kože, uključujući osetljivu i problematičnu kožu.',
  array[
    'Zahvaljujući ekstra devičanskom kanabisovom ulju, vitaminu E, geranijumu i ruzmarinu ovaj serum dubinski regeneriše i hrani kožu, ima jako anti-age dejstvo, usporava znakove starenja, dok antibakterijsko i antiinflamatorno delovanje pružaju divlji origano i limunska trava; umiruje iritacije, akne i crvenilo, podstiče mikrocirkulaciju i obnovu kože zahvaljujući geranijumu, nani, suncokretu i ruzmarinu.',
    'Nekomedogen je (ne zatvara pore) i pogodan za sve tipove kože.'
  ],
  '{}'::text[],
  '[]'::jsonb,
  8,
  'Nakon čišćenja i hidrolata, naneti 5 kapi seruma na lice, vrat i dekolte ujutru i uveče, i nežno umasirati za maksimalnu apsorpciju i efekat.',
  'Cannabis Sativa Seed Oil, Helianthus Annuus Seed Oil, Dicaprylyl Carbonate, Tocopherol mix, Pelargonium Graveolens (Geranium) Oil, Cymbopogon Flexuosus (Lemongrass) Leaf Oil, Rosmarinus Officinalis (Rosemary) Leaf Oil, Mentha Piperita (Peppermint) Oil, Origanum Minutiflorum Oil, Citral, Citronellol, Geraniol, Linalool, Limonene, Isoeugenol',
  null, 4
),
(
  'hidrolat-cajevca',
  'Hidrolat čajevca',
  '100 ml', 1200, 'Nega lica', 'nega-lica',
  array['/products/hidrolat-cajevca.jpeg'],
  false, true,
  'Prirodni tonik namenjen masnoj i problematičnoj koži. Prirodni tonik sa snažnim antiseptičkim i antibakterijskim dejstvom. Čisti i balansira kožu. 100% PRIRODAN.',
  'Idealan za masnu, mešovitu i problematičnu kožu, ali i za osetljivu kožu sklonu reakcijama.',
  array[
    'Hidrolat čajevca je prirodni tonik koji pročišćava, umiruje i dovodi kožu u savršen balans. Nastao blagom destilacijom listova čajevca, zadržava sva njegova dragocena antibakterijska i umirujuća svojstva, ali u nežnoj formi pogodnoj za svakodnevnu upotrebu.',
    'Deluje antiseptično i antibakterijski, pomaže u borbi protiv akni, mitisera i upalnih procesa, dok istovremeno smanjuje crvenilo i iritacije. Balansira lučenje sebuma, čisti pore bez isušivanja i doprinosi zdravijem, ujednačenijem tenu.',
    'Može se koristiti kao tonik posle čišćenja lica, za osvežavanje tokom dana, nakon depilacije ili brijanja, kao i za smirivanje kože posle sunčanja i tretmana.',
    'Hidrolat čajevca pruža koži osećaj čistoće, svežine i smirenosti – nežno, prirodno i efikasno.'
  ],
  '{}'::text[],
  '[]'::jsonb,
  null,
  'Raspršiti na čisto lice (ujutru/uveče), pa na vlažnu kožu lica, vrata i dekoltea umasirati 5 kapi K1 seruma. Tokom dana: Koristiti više puta po potrebi za smirenje kože, umanjenje crvenila i upalnih procesa. Čuvati na sobnoj temperaturi.',
  'Melaleuca Alternifolia Leaf Water',
  null, 5
),
(
  'hidrolat-lavande',
  'Hidrolat od lavande',
  '100 ml', 1200, 'Nega lica', 'nega-lica',
  array['/products/hidrolat-lavande.jpeg'],
  false, true,
  'Prirodni tonik za sve tipove kože. Idealan je za osetljivu, suvu, dehidriranu i problematičnu kožu, jer deluje umirujuće, osvežavajuće i balansirajuće. Dobijen parnom destilacijom cveta lavande, zadržava sva dragocena svojstva biljke u nežnoj, koži prijatnoj formi. 100% PRIRODAN.',
  'Za osetljivu, suvu, dehidriranu i problematičnu kožu.',
  array[
    'Za osetljivu i iritiranu kožu – umiruje, smanjuje crvenilo i osećaj zatezanja.',
    'Za suvu i dehidriranu kožu – vraća vlagu, mekoću i prirodan sjaj.',
    'Za problematičnu kožu – blago antiseptično dejstvo pomaže kod osipa i upalnih procesa.',
    'Za umornu i sivu kožu – osvežava i vraća zdrav, prirodan ten.',
    'Hidrolat lavande je savršen kao prirodni tonik za lice, ali i kao osvežavajući sprej za telo, posebno tokom toplih dana, nakon sunčanja ili posle depilacije.'
  ],
  '{}'::text[],
  '[]'::jsonb,
  null,
  'Rutina: Raspršiti na čisto lice (ujutru/uveče), pa na vlažnu kožu umasirati 4 kapi K1 seruma. Tokom dana: Koristiti više puta po potrebi za osveženje, smirenje iritacija (nakon depilacije, brijanja, sporta...) i zaštitu od insekata. Čuvati na sobnoj temperaturi.',
  'Lavandula Angustifolia Flower Water',
  null, 6
),
(
  'the-scent-piling',
  'THE SCENT piling za telo',
  '200 ml', 1700, 'Nega tela', 'nega-tela',
  array['/products/the-scent.jpeg'],
  false, true,
  'Prirodni piling sa morskom solju i biljnim uljima. Naš piling kombinuje snagu morske soli i hranljivih biljnih ulja, uz dodatni zaštitni sloj koji pomaže koži da zadrži vlagu i ostane mekana. Kristali soli uklanjaju mrtve ćelije i stimulišu mikrocirkulaciju, dok biljna ulja hrane i obnavljaju kožu, ostavljajući je svilenkastom i elastičnom.',
  'Za sve tipove kože. Može se koristiti i za lice, osim kod osetljive i reaktivne kože.',
  array[
    'Prirodna formulacija',
    'Uklanja mrtve ćelije i podstiče detoksikaciju',
    'Hrani i omekšava kožu',
    'Stvara zaštitni film koji sprečava isušivanje',
    'Može se koristiti i za lice, osim kod osetljive i reaktivne kože'
  ],
  '{}'::text[],
  '[]'::jsonb,
  null,
  'Naneti piling na vlažnu kožu, umasirati kružnim pokretima i isprati mlakom vodom. Preporučuje se 1–2 puta nedeljno.',
  null,
  'Prepustite se luksuznom iskustvu nege kože sa našim 0202 SKIN THE SCENT pilingom. Spoj morske soli bogate sa preko 80 minerala i kokosovog ulja sa vitaminima E i K pruža vašoj koži dubinsko čišćenje i intenzivnu negu. Rezultat je svilenkasta, glatka i nahranjena koža već nakon prve upotrebe zahvaljujući ricinusovom ulju. Ovaj piling uklanja mrtve ćelije, podstiče regeneraciju i vraća koži prirodan sjaj, dok je ulja štite od isušivanja i ostavljaju nežan miris.',
  7
)
on conflict (slug) do nothing;
