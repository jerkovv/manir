import momBabyUlje1 from "@/assets/mom-baby-ulje-1.jpeg";
import momBabyUlje2 from "@/assets/mom-baby-ulje-2.jpeg";
import momBabyUlje3 from "@/assets/mom-baby-ulje-3.jpeg";
import momBabyKrema1 from "@/assets/mom-baby-krema-1.jpeg";
import momBabyKrema2 from "@/assets/mom-baby-krema-2.jpeg";
import momBabyKrema3 from "@/assets/mom-baby-krema-3.jpeg";
import hugMe from "@/assets/hug-me.jpeg";
import serumK1 from "@/assets/serum-k1.jpeg";
import hidrolatCajevca from "@/assets/hidrolat-cajevca.jpeg";
import hidrolatLavande from "@/assets/hidrolat-lavande.jpeg";
import theScent from "@/assets/the-scent.jpeg";
import eduLash1 from "@/assets/edu-lash-1.png";
import eduLash2 from "@/assets/edu-lash-2.png";
import eduLash3 from "@/assets/edu-lash-3.png";
import eduLash4 from "@/assets/edu-lash-4.png";
import salonManir from "@/assets/salon-manir.jpg";
import salonBeautique from "@/assets/salon-beautique.jpg";

export const products = [
  {
    id: "mom-baby-ulje",
    name: "MOM & BABY ulje za lice i telo",
    size: "100 ml",
    price: 1900,
    category: "Mom & Baby",
    categorySlug: "mom-baby",
    images: [
      momBabyUlje1,
      momBabyUlje2,
      momBabyUlje3,
    ],
    image: momBabyUlje1,
    featured: false,
    shortDescription: "Nežno prirodno ulje za bebe formulisano isključivo od hladno ceđenih biljnih ulja i biljnih macerata pruža dubinsku hidrataciju, regeneraciju kože i zaštitu osetljive kože od prvih dana života. Namenjeno je bebama, deci, trudnicama i osetljivoj koži odraslih, posebno kada je koža suva, reaktivna ili sklona crvenilu. Idealno za svakodnevnu negu i masažu beba.",
    description: "Nežno prirodno ulje za bebe formulisano isključivo od hladno ceđenih biljnih ulja i biljnih macerata pruža dubinsku hidrataciju, regeneraciju kože i zaštitu osetljive kože od prvih dana života. Namenjeno je bebama, deci, trudnicama i osetljivoj koži odraslih, posebno kada je koža suva, reaktivna ili sklona crvenilu. Idealno za svakodnevnu negu i masažu beba.",
    targetAudience: "Bebama, deci, trudnicama i osetljivoj koži odraslih posebno kada je koža suva, reaktivna ili sklona crvenilu.",
    benefits: [
      "Intenzivno hrani i omekšava kožu",
      "Obnavlja prirodnu lipidnu barijeru kože",
      "Smanjuje crvenilo i osećaj zatezanja",
      "Štiti kožu od isušivanja nakon kupanja",
      "Podržava regeneraciju osetljive i reaktivne kože",
      "Idealno za svakodnevnu masažu beba",
      "Pogodno za negu kože trudnica i cele porodice",
    ],
    freeFrom: [
      "Bez mineralnih ulja",
      "Bez parabena",
      "Bez silikona",
      "Bez parfema",
      "Bez veštačkih boja",
      "Bez agresivnih iritirajućih sastojaka",
    ],
    ingredientsBenefits: [
      { name: "Ulje kajsijinih koštica", benefit: "Omekšava kožu i poboljšava elastičnost kože" },
      { name: "Ulje suncokreta", benefit: "Jača lipidnu barijeru kože i sprečava gubitak vlage" },
      { name: "Ulje avokada", benefit: "Intenzivno hrani kožu i podržava regeneraciju kože" },
      { name: "Macerat nevena", benefit: "Smanjuje crvenilo i iritacije kože" },
      { name: "Macerat kamilice", benefit: "Umiruje osetljivu i reaktivnu kožu" },
      { name: "Uljni ekstrakt aloje", benefit: "Podržava hidrataciju i regeneraciju kože" },
      { name: "Vitamin E", benefit: "Štiti kožu od spoljašnjih uticaja" },
      { name: "Ulje slatkog badema", benefit: "Hrani osetljivu kožu i sprečava isušivanje" },
    ],
    activeIngredientsCount: 16,
    usage: "Naneti malu količinu ulja na čistu kožu i nežno umasirati. Kod beba koristiti nakon kupanja ili tokom večernje masaže beba.",
    inci: "Prunus Armeniaca Kernel Oil, Helianthus Annuus Seed Oil, Persea Gratissima Oil, Calendula Officinalis Extract, Chamomilla Recutita Flower Extract, Aloe Barbadensis Leaf Extract, Tocopherol, Prunus Amygdalus Dulcis Oil",
    compositionNote: null,
  },
  {
    id: "mom-baby-krema",
    name: "MOM & BABY krema za lice i telo",
    size: "100 ml",
    price: 1900,
    category: "Mom & Baby",
    categorySlug: "mom-baby",
    images: [
      momBabyKrema1,
      momBabyKrema2,
      momBabyKrema3,
    ],
    image: momBabyKrema1,
    featured: false,
    shortDescription: "Nežna prirodna krema za bebe razvijena sa 16 pažljivo odabranih aktivnih sastojaka pruža dubinsku hidrataciju kože, regeneraciju kože i obnovu zaštitne barijere kože od prvih dana života. Namenjena je bebama, deci, trudnicama i osetljivoj koži odraslih, posebno kada je koža suva, reaktivna ili sklona crvenilu. Idealna kao krema za osetljivu kožu beba i hidratantna krema za lice i telo cele porodice.",
    description: "Nežna prirodna krema za bebe razvijena sa 16 pažljivo odabranih aktivnih sastojaka pruža dubinsku hidrataciju kože, regeneraciju kože i obnovu zaštitne barijere kože od prvih dana života. Namenjena je bebama, deci, trudnicama i osetljivoj koži odraslih, posebno kada je koža suva, reaktivna ili sklona crvenilu. Idealna kao krema za osetljivu kožu beba i hidratantna krema za lice i telo cele porodice.",
    targetAudience: "Bebama, deci, trudnicama i osetljivoj koži odraslih posebno kada je koža suva, reaktivna ili sklona crvenilu.",
    benefits: [
      "Intenzivna hidratacija kože",
      "Obnova zaštitne barijere kože",
      "Smanjenje crvenila i iritacija kože",
      "Regeneracija osetljive i reaktivne kože",
      "Zaštita kože od isušivanja i spoljašnjih uticaja",
      "Poboljšanje mekoće i elastičnosti kože",
      "Pogodna za svakodnevnu negu beba od prvih dana života",
    ],
    freeFrom: [
      "Bez mineralnih ulja",
      "Bez parabena",
      "Bez silikona",
      "Bez etanola",
      "Bez veštačkih boja",
      "Bez agresivnih iritirajućih sastojaka",
    ],
    ingredientsBenefits: [
      { name: "Glicerin", benefit: "Obezbeđuje dubinsku hidrataciju kože i sprečava isušivanje" },
      { name: "Ši puter", benefit: "Obnavlja lipidnu barijeru kože i štiti od spoljašnjih uticaja" },
      { name: "Jojobino ulje", benefit: "Podržava prirodnu zaštitnu funkciju kože i omekšava kožu" },
      { name: "Pantenol", benefit: "Umiruje kožu i podstiče regeneraciju zaštitne barijere kože" },
      { name: "Ekstrakt ovsa", benefit: "Smanjuje iritacije i crvenilo kože i jača osetljivu kožu" },
      { name: "Ekstrakt sladića", benefit: "Deluje antiinflamatorno i doprinosi smanjenju crvenila" },
      { name: "Ekstrakt hamamelisa", benefit: "Umiruje kožu i smanjuje reaktivnost kože" },
      { name: "Skvalan", benefit: "Obnavlja lipidni sloj kože i sprečava gubitak vlage" },
      { name: "Ekstrakt centele", benefit: "Podstiče regeneraciju kože i jača zaštitnu funkciju kože" },
      { name: "Ulje suncokreta", benefit: "Jača barijeru kože i sprečava gubitak vlage" },
      { name: "Ulje slatkog badema", benefit: "Hrani kožu i poboljšava elastičnost kože" },
      { name: "Ricinusovo ulje", benefit: "Doprinosi zaštiti kože i sprečava isušivanje" },
      { name: "Alantoin", benefit: "Umiruje iritacije i podstiče obnavljanje kože" },
      { name: "Vitamin E", benefit: "Štiti kožu od spoljašnjih uticaja kao antioksidans" },
      { name: "Bisabolol", benefit: "Dodatno umiruje osetljivu kožu i smanjuje crvenilo" },
      { name: "Eterično ulje rimske kamilice", benefit: "Doprinosi umirenju kože i smanjenju osetljivosti kože" },
    ],
    activeIngredientsCount: 16,
    usage: "Naneti odgovarajuću količinu kreme na čistu kožu lica i tela i nežno umasirati do potpunog upijanja. Pogodna kao krema za svakodnevnu negu beba i hidratantna krema za osetljivu kožu cele porodice.",
    inci: "Aqua, Glycerin, Sucrose Polystearate, Hydrogenated Polyisobutene, Glyceryl Stearate, Butyrospermum Parkii Butter, Cetyl Alcohol, Simmondsia Chinensis Oil, D-Panthenol, Avena Sativa Kernel Extract, Glycyrrhiza Glabra Root Extract, Hamamelis Virginiana Leaf Extract, Squalane, Centella Asiatica Extract (10:1), Helianthus Annuus Seed Oil, Prunus Amygdalus Dulcis Oil, Ricinus Communis Seed Oil, Allantoin, Tocopherol Acetate, Bisabolol, Anthemis Nobilis Flower Oil, Pinene, Benzyl Alcohol, Dehydroacetic Acid",
    compositionNote: null,
  },
  {
    id: "hug-me-krema",
    name: "Hug Me Lagana umirujuća 24h krema za lice",
    size: "50 ml",
    price: 3900,
    category: "Nega lica",
    categorySlug: "nega-lica",
    images: [
      hugMe,
    ],
    image: hugMe,
    featured: false,
    shortDescription: "Duboko hidrantna i umirujuća krema za lice. HUG ME 11 aktivnih sastojaka, za sve tipove kože, uključujući osetljivu, mešovitu i masnu. Brzo se upija i ostavlja kožu glatkom, umirenom i nahranjenom, bez osećaja težine. Ne zatvara pore, ima antioksidativno dejstvo, obnavlja zaštitnu barijeru i ujednačava ten.",
    description: "Duboko hidrantna i umirujuća krema za lice. HUG ME 11 aktivnih sastojaka, za sve tipove kože, uključujući osetljivu, mešovitu i masnu. Brzo se upija i ostavlja kožu glatkom, umirenom i nahranjenom, bez osećaja težine. Ne zatvara pore, ima antioksidativno dejstvo, obnavlja zaštitnu barijeru i ujednačava ten.",
    targetAudience: "Za sve tipove kože, uključujući osetljivu, mešovitu i masnu kožu.",
    benefits: [
      "Umiruje crvenilo, iritacije i osećaj zatezanja zahvaljujući aloe veri, pantenolu, alantoinu, bisabololu i ulju kamilice, koji deluju protivupalno, regenerativno i umirujuće čak i na veoma osetljivoj i reaktivnoj koži.",
      "Antiinflamatorno i antioksidativno dejstvo obezbeđuju ekstrakt sladića, vitamin E i beta-sitosterol smanjuju upale, štite ćelije kože od spoljašnjih uticaja i usporavaju pojavu prvih znakova starenja.",
      "Posvetljuje kožu i ujednačava ten zahvaljujući ekstraktu korena sladića, koji doprinosi smanjenju hiperpigmentacija i vraća koži svež, zdrav izgled.",
      "Reguliše lučenje sebuma i doprinosi uravnoteženom tenu ulje jojobe i pažljivo odabrani emolijensi pomažu koži da sama pronađe balans između hidratacije i masnoće, bez zapušavanja pora.",
      "Poboljšava mikrocirkulaciju i vraća prirodan sjaj, čineći kožu vitalnijom i odmornijom. Obnavlja prirodnu zaštitnu barijeru kože i jača njenu otpornost.",
      "Dubinski hidrira tokom 24h zahvaljujući glicerinu, urei i propilen glikolu, koji vezuju vlagu u koži i sprečavaju njen gubitak, ostavljajući kožu dugotrajno mekom, elastičnom i zaštićenom.",
    ],
    freeFrom: [],
    ingredientsBenefits: [],
    activeIngredientsCount: 11,
    usage: "Naneti kremu na čistu kožu ili nakon seruma K1 i lagano umasirati. Preporučuje se ujutru i uveče ili u toku dana po potrebi. Čuvati na sobnoj temperaturi.",
    inci: "Aqua, Glycerin, Decyl Oleate, Propylene Glycol, Urea, Simmondsia Chinensis Seed Oil, Glyceryl Stearate, Glycyrrhiza Glabra Root Extract, Cetyl Alcohol, Polysorbate 20, D-Panthenol, Aloe Barbadensis Gel (10x), Benzyl Alcohol, Dehydroacetic Acid, Allantoin, Beta-Sitosterol, Tocopherol mix, Bisabolol, Chamomilla Recutita Flower Oil, Limonene, Sodium Benzoate, Potassium Sorbate, Citric Acid",
    compositionNote: null,
  },
  {
    id: "serum-k1",
    name: "Serum-koncentrat K1",
    size: "30 ml",
    price: 4900,
    category: "Nega lica",
    categorySlug: "nega-lica",
    images: [
      serumK1,
    ],
    image: serumK1,
    featured: true,
    shortDescription: "Antiinflamatorno & anti-age dejstvo. 8 aktivnih sastojaka, za sve tipove kože. Dubinski regeneriše i hrani kožu, umiruje iritacije, akne i crvenilo. Serum je namenjen svim tipovima kože, uključujući osetljivu i problematičnu kožu.",
    description: "Dubinski regeneriše i hrani kožu, umiruje iritacije, akne i crvenilo. Serum je namenjen svim tipovima kože, uključujući osetljivu i problematičnu kožu.",
    targetAudience: "Za sve tipove kože, uključujući osetljivu i problematičnu kožu.",
    benefits: [
      "Zahvaljujući ekstra devičanskom kanabisovom ulju, vitaminu E, geranijumu i ruzmarinu ovaj serum dubinski regeneriše i hrani kožu, ima jako anti-age dejstvo, usporava znakove starenja, dok antibakterijsko i antiinflamatorno delovanje pružaju divlji origano i limunska trava; umiruje iritacije, akne i crvenilo, podstiče mikrocirkulaciju i obnovu kože zahvaljujući geranijumu, nani, suncokretu i ruzmarinu.",
      "Nekomedogen je (ne zatvara pore) i pogodan za sve tipove kože.",
    ],
    freeFrom: [],
    ingredientsBenefits: [],
    activeIngredientsCount: 8,
    usage: "Nakon čišćenja i hidrolata, naneti 5 kapi seruma na lice, vrat i dekolte ujutru i uveče, i nežno umasirati za maksimalnu apsorpciju i efekat.",
    inci: "Cannabis Sativa Seed Oil, Helianthus Annuus Seed Oil, Dicaprylyl Carbonate, Tocopherol mix, Pelargonium Graveolens (Geranium) Oil, Cymbopogon Flexuosus (Lemongrass) Leaf Oil, Rosmarinus Officinalis (Rosemary) Leaf Oil, Mentha Piperita (Peppermint) Oil, Origanum Minutiflorum Oil, Citral, Citronellol, Geraniol, Linalool, Limonene, Isoeugenol",
    compositionNote: null,
  },
  {
    id: "hidrolat-cajevca",
    name: "Hidrolat čajevca",
    size: "100 ml",
    price: 1200,
    category: "Nega lica",
    categorySlug: "nega-lica",
    images: [
      hidrolatCajevca,
    ],
    image: hidrolatCajevca,
    featured: false,
    shortDescription: "Prirodni tonik namenjen masnoj i problematičnoj koži. Prirodni tonik sa snažnim antiseptičkim i antibakterijskim dejstvom. Čisti i balansira kožu. 100% PRIRODAN.",
    description: "Prirodni tonik sa snažnim antiseptičkim i antibakterijskim dejstvom. Čisti i balansira kožu. 100% PRIRODAN.",
    targetAudience: "Idealan za masnu, mešovitu i problematičnu kožu, ali i za osetljivu kožu sklonu reakcijama.",
    benefits: [
      "Hidrolat čajevca je prirodni tonik koji pročišćava, umiruje i dovodi kožu u savršen balans. Nastao blagom destilacijom listova čajevca, zadržava sva njegova dragocena antibakterijska i umirujuća svojstva, ali u nežnoj formi pogodnoj za svakodnevnu upotrebu.",
      "Deluje antiseptično i antibakterijski, pomaže u borbi protiv akni, mitisera i upalnih procesa, dok istovremeno smanjuje crvenilo i iritacije. Balansira lučenje sebuma, čisti pore bez isušivanja i doprinosi zdravijem, ujednačenijem tenu.",
      "Može se koristiti kao tonik posle čišćenja lica, za osvežavanje tokom dana, nakon depilacije ili brijanja, kao i za smirivanje kože posle sunčanja i tretmana.",
      "Hidrolat čajevca pruža koži osećaj čistoće, svežine i smirenosti nežno, prirodno i efikasno.",
    ],
    freeFrom: [],
    ingredientsBenefits: [],
    activeIngredientsCount: null,
    usage: "Raspršiti na čisto lice (ujutru/uveče), pa na vlažnu kožu lica, vrata i dekoltea umasirati 5 kapi K1 seruma. Tokom dana: Koristiti više puta po potrebi za smirenje kože, umanjenje crvenila i upalnih procesa. Čuvati na sobnoj temperaturi.",
    inci: "Melaleuca Alternifolia Leaf Water",
    compositionNote: null,
  },
  {
    id: "hidrolat-lavande",
    name: "Hidrolat od lavande",
    size: "100 ml",
    price: 1200,
    category: "Nega lica",
    categorySlug: "nega-lica",
    images: [
      hidrolatLavande,
    ],
    image: hidrolatLavande,
    featured: false,
    shortDescription: "Prirodni tonik za sve tipove kože. Idealan je za osetljivu, suvu, dehidriranu i problematičnu kožu, jer deluje umirujuće, osvežavajuće i balansirajuće. Dobijen parnom destilacijom cveta lavande, zadržava sva dragocena svojstva biljke u nežnoj, koži prijatnoj formi. 100% PRIRODAN.",
    description: "Idealan je za osetljivu, suvu, dehidriranu i problematičnu kožu, jer deluje umirujuće, osvežavajuće i balansirajuće. Dobijen parnom destilacijom cveta lavande, zadržava sva dragocena svojstva biljke u nežnoj, koži prijatnoj formi. 100% PRIRODAN.",
    targetAudience: "Za osetljivu, suvu, dehidriranu i problematičnu kožu.",
    benefits: [
      "Za osetljivu i iritiranu kožu umiruje, smanjuje crvenilo i osećaj zatezanja.",
      "Za suvu i dehidriranu kožu vraća vlagu, mekoću i prirodan sjaj.",
      "Za problematičnu kožu blago antiseptično dejstvo pomaže kod osipa i upalnih procesa.",
      "Za umornu i sivu kožu osvežava i vraća zdrav, prirodan ten.",
      "Hidrolat lavande je savršen kao prirodni tonik za lice, ali i kao osvežavajući sprej za telo, posebno tokom toplih dana, nakon sunčanja ili posle depilacije.",
    ],
    freeFrom: [],
    ingredientsBenefits: [],
    activeIngredientsCount: null,
    usage: "Rutina: Raspršiti na čisto lice (ujutru/uveče), pa na vlažnu kožu umasirati 4 kapi K1 seruma. Tokom dana: Koristiti više puta po potrebi za osveženje, smirenje iritacija (nakon depilacije, brijanja, sporta...) i zaštitu od insekata. Čuvati na sobnoj temperaturi.",
    inci: "Lavandula Angustifolia Flower Water",
    compositionNote: null,
  },
  {
    id: "the-scent-piling",
    name: "THE SCENT piling za telo",
    size: "200 ml",
    price: 1700,
    category: "Nega tela",
    categorySlug: "nega-tela",
    images: [
      theScent,
    ],
    image: theScent,
    featured: false,
    shortDescription: "Prirodni piling sa morskom solju i biljnim uljima. Naš piling kombinuje snagu morske soli i hranljivih biljnih ulja, uz dodatni zaštitni sloj koji pomaže koži da zadrži vlagu i ostane mekana. Kristali soli uklanjaju mrtve ćelije i stimulišu mikrocirkulaciju, dok biljna ulja hrane i obnavljaju kožu, ostavljajući je svilenkastom i elastičnom.",
    description: "Naš piling kombinuje snagu morske soli i hranljivih biljnih ulja, uz dodatni zaštitni sloj koji pomaže koži da zadrži vlagu i ostane mekana. Kristali soli uklanjaju mrtve ćelije i stimulišu mikrocirkulaciju, dok biljna ulja hrane i obnavljaju kožu, ostavljajući je svilenkastom i elastičnom.",
    targetAudience: "Za sve tipove kože. Može se koristiti i za lice, osim kod osetljive i reaktivne kože.",
    benefits: [
      "Prirodna formulacija",
      "Uklanja mrtve ćelije i podstiče detoksikaciju",
      "Hrani i omekšava kožu",
      "Stvara zaštitni film koji sprečava isušivanje",
      "Može se koristiti i za lice, osim kod osetljive i reaktivne kože",
    ],
    freeFrom: [],
    ingredientsBenefits: [],
    activeIngredientsCount: null,
    usage: "Naneti piling na vlažnu kožu, umasirati kružnim pokretima i isprati mlakom vodom. Preporučuje se 12 puta nedeljno.",
    inci: null,
    compositionNote: "Prepustite se luksuznom iskustvu nege kože sa našim 0202 SKIN THE SCENT pilingom. Spoj morske soli bogate sa preko 80 minerala i kokosovog ulja sa vitaminima E i K pruža vašoj koži dubinsko čišćenje i intenzivnu negu. Rezultat je svilenkasta, glatka i nahranjena koža već nakon prve upotrebe zahvaljujući ricinusovom ulju. Ovaj piling uklanja mrtve ćelije, podstiče regeneraciju i vraća koži prirodan sjaj, dok je ulja štite od isušivanja i ostavljaju nežan miris.",
  },
];

export const categories = [
  { name: "Sve", slug: "all" },
  { name: "Nega lica", slug: "nega-lica" },
  { name: "Nega tela", slug: "nega-tela" },
  { name: "Mom & Baby", slug: "mom-baby" },
];

export const blogPosts = [
  {
    id: "bez-kortikosteroida",
    title: "Bez kortikosteroida: Iva otkriva serum koji menja kožu",
    excerpt: "Ivina priča otkriva kako je K1 serum sa uljem kanabisa pomogao njenoj suvoj koži bez kortikosteroida, bez hemije.",
    date: "17. septembar 2025.",
    author: "Marina",
    category: "Nega tela",
    image: serumK1,
    content: `Okej, moram da podelim ovo. Suva koža me prati još od detinjstva. Probala sam sve kreme sa kortikosteroidima, razne losione, meleme… i svaki put čim prestanem da mažem, tretiram kožu sve se vraća. Doslovno sam mislila da tako treba da živim i to je to.

Ali onda mi se u rukama našao K1 serum za lice, sa ekstra devičanskim uljem kanabisa. Bila sam kod mame i tate u Nemačkoj, ostala bez kreme, a koža je počela da svrbi. Pomislila sam ajde da probam serum za lice da namažem na članak.

Tri večeri zaredom sam ga nanosila na suvi deo kože… i stvarno nisam očekivala ništa posebno. Samo da prestane svrab koji se javljao i inače, s vremena na vreme.

Ipak, sledeći dan sam primetila prvu razliku koža je bila hidrirana, mekša, svrab je nestao. Nakon trećeg nanošenja vratila sam se u Srbiju. Nisam imala ni kremu ni serum zaboravila sam ga, a zaboravila sam i da imam suvu kožu.

Danas, tri meseca kasnije, nisam mazala više to mesto ni sa čim. Koža i dalje izgleda super: hidrirano, regenerisano, bez iritacija.

Za mene, K1 serum nije samo serum za lice to je prirodna nega kože koja funkcioniše. Sad bih ovaj serum nanela na svaku jednu tačku na telu kom mislim da nešto fali. I eto, bez kortikosteroida, bez hemije, a efekat stvarno traje.

Ako tražiš prirodnu kozmetiku, rešenje za suvu kožu, ili jednostavno želiš glatku i negovanu kožu, K1 serum za lice sa ekstra devičanskim uljem kanabisa je definitivno nešto što treba da probaš.`,
  },
];

export const educations = [
  {
    id: "lash-brow-lift",
    title: "Lash & Brow Lift",
    subtitle: "Postani lash & brow artist bez prethodnog iskustva!",
    price: "270€",
    location: "Beograd, Tošin Bunar 141 BEAUTIQUE SPA",
    date: "22. novembar",
    description: "Pridruži se ekskluzivnoj edukaciji i nauči sve što ti je potrebno da odmah započneš posao u beauty industriji. Obuka koja donosi brzu zaradu uz minimalna ulaganja.",
    features: [
      "Rad na modelu uživo",
      "Dva start paketa",
      "Detaljan E-BOOK (dostupan i nakon edukacije)",
      "Sertifikat o završenoj edukaciji",
    ],
    bonuses: [
      "Kako da se predstaviš online",
      "Koje greške da izbegavaš",
      "Prve smernice za rast i vidljivost",
    ],
    image: eduLash1,
  },
  {
    id: "skin-level-1",
    title: "Skin Level 1",
    subtitle: "Osnove profesionalne nege kože",
    price: "Na upit",
    location: "Beograd",
    date: "Uskoro",
    description: "Edukacija prvog nivoa za sve koji žele da uđu u svet profesionalne kozmetike. Naučite osnove analize kože, protokole tretmana i primenu 0202 SKIN proizvoda.",
    features: [
      "Analiza tipova kože",
      "Protokoli tretmana",
      "Primena 0202 SKIN proizvoda",
      "Sertifikat o završenoj edukaciji",
    ],
    bonuses: [],
    image: null,
  },
  {
    id: "skin-level-2",
    title: "Skin Level 2",
    subtitle: "Napredne tehnike nege kože",
    price: "Na upit",
    location: "Beograd",
    date: "Uskoro",
    description: "Napredna edukacija za profesionalne kozmetičare. Dublje razumevanje kožnih stanja, napredni tretmani i specijalizovani protokoli za zahtevne klijente.",
    features: [
      "Napredna analiza kože",
      "Specijalizovani tretmani",
      "Rad sa zahtevnim kožnim stanjima",
      "Napredni sertifikat",
    ],
    bonuses: [],
    image: null,
  },
];

export const partnerSalons = [
  {
    name: "Manir Studio",
    address: "Pančevačka 12, ulaz 12, sprat 2, stan 12",
    city: "Zrenjanin",
    phone: "+381 62 8340 898",
    image: salonManir,
    logo: "/images/manir-logo.png",
  },
  {
    name: "Beautique Spa",
    address: "Tošin bunar 181",
    city: "Beograd",
    phone: "+381 60 4316 363",
    image: salonBeautique,
    logo: "/images/beautique-logo.svg",
  },
];

export const contactInfo = {
  email: "0202skin@gmail.com",
  phones: ["+381 62 8340898", "+381 65 2990226"],
  workingHours: "Ponedeljak Petak: 09:00 16:00h",
  instagram: "https://www.instagram.com/0202skin/",
  facebook: "https://www.facebook.com/0202skin",
};

export const brandValues = [
  { title: "Čista formula", description: "Bez parabena, bez štetnih aditiva samo najkvalitetniji prirodni sastojci" },
  { title: "Balans kože", description: "Vraćamo koži ono što joj je najpotrebnije prirodan ekvilibrijum" },
  { title: "Obnova barijere", description: "Ciljano delujemo na obnovu i jačanje zaštitne barijere kože" },
  { title: "Self care", description: "Ritual nege koji nije luksuz, već potreba trenutak posvećen sebi" },
  { title: "Stručna nega", description: "Spoj farmaceutskog znanja i iskustva profesionalnih kozmetičara" },
  { title: "Nauka i praksa", description: "Formule zasnovane na nauci, potvrđene u profesionalnoj praksi" },
];
