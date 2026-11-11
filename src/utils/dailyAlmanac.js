// Magyar névnap-naptár (hónap 1..12 -> nap 1..31) + váltakozó visszaszámlálók
// és kőszegi/időjárási történelmi sztorik a mobil menü (hamburger) kártyájához.

const NAMEDAYS = {
  1: [
    'Fruzsina', 'Ábel', 'Genovéva, Benjámin', 'Titusz, Leona', 'Simon',
    'Boldizsár', 'Attila, Ramóna', 'Gyöngyvér', 'Marcell', 'Melánia',
    'Ágota', 'Ernő', 'Veronika', 'Bódog', 'Lóránt, Loránd',
    'Gusztáv', 'Antal, Antónia', 'Piroska', 'Sára, Márió', 'Fábián, Sebestyén',
    'Ágnes', 'Vince, Artúr', 'Zelma, Rajmund', 'Timót', 'Pál',
    'Vanda, Paula', 'Angelika', 'Károly, Karola', 'Adél', 'Martina, Gerda', 'Marcella',
  ],
  2: [
    'Ignác', 'Karolina, Aida', 'Balázs', 'Ráhel, Csenge', 'Ágota, Ingrid',
    'Dorottya, Dóra', 'Tódor, Rómeó', 'Aranka', 'Abigél, Alex', 'Elvira',
    'Bertold, Marietta', 'Lívia, Lídia', 'Ella, Linda', 'Bálint, Valentin', 'Kolos, Georgina',
    'Julianna, Lilla', 'Donát', 'Bernadett', 'Zsuzsanna', 'Aladár, Álmos',
    'Eleonóra', 'Gerzson', 'Alfréd', 'Mátyás', 'Géza',
    'Edina', 'Ákos, Bátor', 'Elemér', 'Szökőnap',
  ],
  3: [
    'Albin', 'Lujza', 'Kornélia', 'Kázmér', 'Adorján, Adrián',
    'Leonóra, Inez', 'Tamás', 'Zoltán', 'Franciska, Fanni', 'Ildikó',
    'Szilárd', 'Gergely', 'Krisztián, Ajtony', 'Matild', 'Kristóf',
    'Henrietta', 'Gertrúd, Patrik', 'Sándor, Ede', 'József, Bánk', 'Klaudia',
    'Benedek', 'Beáta, Izolda', 'Emőke', 'Gábor, Karina', 'Irén, Írisz',
    'Emánuel', 'Hajnalka', 'Gedeon, Johanna', 'Auguszta', 'Zalán', 'Árpád',
  ],
  4: [
    'Hugó', 'Áron', 'Buda, Richárd', 'Izidor', 'Vince',
    'Vilmos, Bíborka', 'Herman', 'Dénes', 'Erhard', 'Zsolt',
    'Leó, Szaniszló', 'Gyula', 'Ida', 'Tibor', 'Anasztázia, Tas',
    'Csongor', 'Rudolf', 'Andrea, Ilma', 'Emma', 'Tivadar',
    'Konrád', 'Csilla, Noémi', 'Béla', 'György', 'Márk',
    'Ervin', 'Zita', 'Valéria', 'Péter', 'Katalin, Kitti',
  ],
  5: [
    'Fülöp, Jakab', 'Zsigmond', 'Tímea, Irma', 'Mónika, Flórián', 'Györgyi',
    'Ivett, Frida', 'Gizella', 'Mihály', 'Gergely', 'Ármin, Pálma',
    'Ferenc', 'Pongrác', 'Szervác, Imola', 'Bonifác', 'Zsófia, Szonja',
    'Mózes, Botond', 'Paszkál', 'Erik, Alexandra', 'Ivó, Milán', 'Bernát, Felícia',
    'Konstantin', 'Júlia, Rita', 'Dezső', 'Eszter, Eliza', 'Orbán',
    'Fülöp, Evelin', 'Hella', 'Emil, Csanád', 'Magdolna', 'Janka, Zsanett', 'Angéla, Petronella',
  ],
  6: [
    'Tünde', 'Kármen, Anita', 'Klotild', 'Bulcsú', 'Fatime',
    'Norbert, Cintia', 'Róbert', 'Medárd', 'Félix', 'Margit, Gréta',
    'Barnabás', 'Villő', 'Antal, Anett', 'Vazul', 'Jolán, Vid',
    'Jusztin', 'Laura, Alida', 'Arnold, Levente', 'Gyárfás', 'Rafael',
    'Alajos, Leila', 'Paulina', 'Zoltán', 'Iván', 'Vilmos',
    'János, Pál', 'László', 'Levente, Irén', 'Péter, Pál', 'Pál',
  ],
  7: [
    'Tihamér, Annamária', 'Ottó', 'Kornél, Soma', 'Ulrik', 'Emese, Sarolta',
    'Csaba', 'Appolónia', 'Ellák', 'Lukrécia', 'Amália',
    'Nóra, Lili', 'Izabella, Dalma', 'Jenő', 'Örs, Stella', 'Henrik, Roland',
    'Valter', 'Endre, Elek', 'Frigyes', 'Emília', 'Illés',
    'Dániel, Daniella', 'Magdolna', 'Lenke', 'Kinga, Kincső', 'Kristóf, Jakab',
    'Anna, Anikó', 'Olga, Liliána', 'Szabolcs', 'Márta, Flóra', 'Judit, Xénia', 'Oszkár',
  ],
  8: [
    'Boglárka', 'Lehel', 'Hermina', 'Domonkos, Dominika', 'Krisztina',
    'Berta, Bettina', 'Ibolya', 'László', 'Emőd', 'Lőrinc',
    'Zsuzsanna, Tiborc', 'Klára', 'Ipoly', 'Marcell', 'Mária',
    'Ábrahám', 'Jácint', 'Ilona', 'Huba', 'István',
    'Sámuel, Hajna', 'Menyhért, Mirjam', 'Bence', 'Bertalan', 'Lajos, Patrícia',
    'Izsó', 'Gábor', 'Ágoston', 'Beatrix, Erna', 'Rózsa', 'Erika, Bella',
  ],
  9: [
    'Egyed, Egon', 'Rebeka, Dorina', 'Hilda', 'Rozália', 'Viktor, Lőrinc',
    'Zakariás', 'Regina', 'Mária, Adrienn', 'Ádám', 'Nikolett, Hunor',
    'Teodóra', 'Mária', 'Kornél', 'Szeréna, Roxána', 'Enikő, Melitta',
    'Edit', 'Zsófia', 'Diána', 'Vilhelmina', 'Friderika',
    'Máté, Mirella', 'Móric', 'Tekla', 'Gellért, Mercédesz', 'Eufrozina, Kende',
    'Jusztina', 'Adalbert', 'Vencel', 'Mihály', 'Jeromos',
  ],
  10: [
    'Malvin', 'Petra', 'Helga', 'Ferenc', 'Aurél',
    'Brúnó, Renáta', 'Amália', 'Koppány', 'Dénes', 'Gedeon',
    'Brigitta', 'Miksa', 'Kálmán, Ede', 'Helén', 'Teréz',
    'Gál', 'Hedvig', 'Lukács', 'Nándor', 'Vendel',
    'Orsolya', 'Előd', 'Gyöngyi', 'Salamon', 'Blanka, Bianka',
    'Dömötör', 'Szabina', 'Simon, Szimonetta', 'Nárcisz', 'Alfonz', 'Farkas',
  ],
  11: [
    'Marianna', 'Achilles', 'Győző', 'Károly', 'Imre',
    'Lénárd', 'Rezső', 'Zsombor', 'Tivadar', 'Réka',
    'Márton', 'Jónás, Renátó', 'Szilvia', 'Aliz', 'Albert, Lipót',
    'Ödön', 'Hortenzia, Gergő', 'Jenő', 'Erzsébet', 'Jolán',
    'Olivér', 'Cecília', 'Kelemen, Klementina', 'Emma', 'Katalin',
    'Virág', 'Virgil', 'Stefánia', 'Taksony', 'András, Andor',
  ],
  12: [
    'Elza', 'Melinda, Vivien', 'Ferenc, Olívia', 'Borbála, Barbara', 'Vilma',
    'Miklós', 'Ambrus', 'Mária', 'Natália', 'Judit',
    'Árpád', 'Gabriella', 'Luca, Otília', 'Szilárda', 'Valér',
    'Etelka, Aletta', 'Lázár, Olimpia', 'Auguszta', 'Viola', 'Teofil',
    'Tamás', 'Zénó', 'Viktória', 'Ádám, Éva', 'Eugénia',
    'István', 'János', 'Kamilla', 'Tamás, Tamara', 'Dávid', 'Szilveszter',
  ],
};

export function getTodayNameday(date = new Date()) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return NAMEDAYS[m]?.[d - 1] || '–';
}

function daysUntil(month, day, fromDate = new Date()) {
  const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  let target = new Date(fromDate.getFullYear(), month - 1, day);
  if (target < today) target = new Date(fromDate.getFullYear() + 1, month - 1, day);
  return Math.round((target - today) / 86400000);
}

const HISTORICAL_STORIES = [
  {
    tag: 'Kőszegi krónika · 1532',
    text: 'Jurisics Miklós maroknyi védőserege 1532-ben feltartóztatta Szulejmán Bécs felé tartó hadjáratát. Kőszeg nem került török kézre.',
  },
  {
    tag: 'Klímarekord · 1940',
    text: 'Magyarországon −35 °C-ot mértek Miskolc-Görömbölytapolcán, 1940. február 16-án. Ez az országos hidegrekord.',
  },
  {
    tag: 'Történelem · 1816',
    text: 'A Tambora vulkán 1815-ös kitörése után 1816-ban elmaradt a nyár Európa és Észak-Amerika jelentős részén. Fagy és terméskiesés jött.',
  },
  {
    tag: 'Népi regula · Medárd',
    text: 'Ha Medárd napján, június 8-án esik, a néphagyomány szerint negyven napig esős idő jöhet. A meteorológia azért mást is figyel.',
  },
  {
    tag: 'Állomás-humor · Autómosás',
    text: 'A meteorológia legpontosabb csapadékjelzője továbbra is az, ha valaki Kőszegen délután lemossa az autóját.',
  },
  {
    tag: 'Kőszegi krónika · Harangszó',
    text: 'Kőszegen 11 órakor harangoznak az 1532-es ostrom emlékére. Ez nem déli harangszó, hanem egy helyi történelmi különlegesség.',
  },
  {
    tag: 'Világrekord · Villám',
    text: 'A WMO által hitelesített leghosszabb villám 768 kilométert tett meg az Egyesült Államok felett, 2020. április 29-én.',
  },
  {
    tag: 'Történelem · D-nap 1944',
    text: 'A normandiai partraszállás időpontját a meteorológusok előrejelzése is befolyásolta. James Stagg csapata talált egy rövid időjárási ablakot.',
  },
  {
    tag: 'Népi regula · Márton',
    text: 'Márton napján, november 11-én a néphagyomány a havat és a fagyot is figyelte. A Márton-napi időből a télre következtettek.',
  },
  {
    tag: 'Állomás-humor · Kőszegi szél',
    text: 'Kőszegen a frizura nem stíluskérdés, hanem szélirányfüggő meteorológiai kísérlet.',
  },
  {
    tag: 'Kőszegi krónika · Írottkő',
    text: 'Az Írott-kő 882 méter magas. A Kőszegi-hegység és a Dunántúl legmagasabb pontja, kilátójából két ország tája tárul eléd.',
  },
  {
    tag: 'Klímarekord · Kiskunhalas',
    text: 'Magyarországon 41,9 °C-ot mértek Kiskunhalason 2007. július 20-án. Ez a klasszikus országos melegrekordok egyike.',
  },
  {
    tag: 'Világrekord · Hőhullám',
    text: 'A kaliforniai Death Valleyben 1913-ban 56,7 °C-ot mértek. A WMO ezt tartja a hivatalos világrekordnak.',
  },
  {
    tag: 'Népi regula · Katalin',
    text: 'Katalin kopog, karácsony locsog – tartja a mondás. Ha november 25-én fagy, karácsonyra enyhébb időt jósoltak.',
  },
  {
    tag: 'Állomás-humor · Kávé',
    text: 'Kőszegi reggel: a kávé forró, a levegő hideg, a köd sűrű. A látótávolság egyelőre a második kortyig tart.',
  },
  {
    tag: 'Kőszegi krónika · Hétforrás',
    text: 'A Hétforrás hét különálló vízkifolyásáról kapta a nevét, vizének hőmérséklete télen-nyáron szinte állandó, 8–10 °C körüli.',
  },
  {
    tag: 'Klímarekord · Heves',
    text: 'Hevesen 1988. augusztus 23-án egyetlen óra alatt 120 milliméter csapadék hullott. Ez magyarországi rekord.',
  },
  {
    tag: 'Világrekord · Villámcsapás',
    text: 'Egy 2020-as villám 17,1 másodpercig tartott Argentína és Uruguay felett. Ez a leghosszabb hitelesített villám időtartamrekordja.',
  },
  {
    tag: 'Népi regula · Orsolya',
    text: 'Orsolya napja október 21. A népi megfigyelés szerint ha ekkor szép az idő, karácsonyig enyhe őszre számíthatunk.',
  },
  {
    tag: 'Állomás-humor · Eső',
    text: 'Az esernyő otthon marad: egész nap napsütést ígértek. Aztán az első felhő pont fölötted nyitja meg az égi csapot.',
  },
  {
    tag: 'Kőszegi krónika · Óház-tető',
    text: 'Az Óház-tetőn középkori vár maradványai találhatók. A hegytető Kőszeg korai védelmi történetének fontos emléke.',
  },
  {
    tag: 'Klímarekord · Kab-hegy',
    text: 'A Kab-hegyen 2010. december 9-én 47,7 m/s-os széllökést mértek. Ez 171 km/h körüli sebesség!',
  },
  {
    tag: 'Történelem · Napóleon',
    text: 'Napóleon 1812-es oroszországi hadjáratát a hideg, az éhezés és a betegségek is súlyosan megtépázták. A tél nem volt kegyes.',
  },
  {
    tag: 'Népi regula · Fecskék',
    text: 'Ha ősszel gyülekeznek és dél felé indulnak a fecskék, közeledik a hidegebb évszak. A madarak a nappalok rövidülését is érzékelik.',
  },
  {
    tag: 'Állomás-humor · Előrejelzés',
    text: 'A mai előrejelzés szerint változékony idő várható. Magyarul: vigyél napszemüveget, esernyőt és egy másik pár cipőt.',
  },
  {
    tag: 'Kőszegi krónika · Szőlő',
    text: 'A Szőlő Jövésnek Könyvébe 1740 óta rajzolják be a kőszegi szőlőhajtásokat. Ez különleges európai kultúrtörténeti hagyomány.',
  },
  {
    tag: 'Világrekord · Szélvihar',
    text: 'Az ausztráliai Barrow-szigeten 1996-ban 408 km/h-s széllökést mértek egy trópusi ciklonban. Ez hitelesített világrekord.',
  },
  {
    tag: 'Történelem · Armada 1588',
    text: 'Az angolok elleni hadjárat során a spanyol Armada hajóit viharok is megtépázták. A szél és a tenger a vereséghez is hozzájárult.',
  },
  {
    tag: 'Népi regula · Luca',
    text: 'A Luca-naptár szerint december 13-tól tizenkét napon át figyelték az időt. Minden nap egy következő hónapot jelképezett.',
  },
  {
    tag: 'Állomás-humor · Réteges öltözék',
    text: 'Reggel télikabát, délben póló, este megint kabát. Ez nem divatbemutató, hanem egy átlagos alpokaljai nap.',
  },
  {
    tag: 'Kőszegi krónika · Chernel',
    text: 'Chernel István Kőszegen született 1865-ben, és itt próbálta ki Magyarország első síléceit („lábszánkóját”) is 1896-ban.',
  },
  {
    tag: 'Klímarekord · Gyömrő',
    text: 'Gyömrőn 1963. szeptember 8-án 202,7 milliméter eső esett 24 óra alatt. Ez a magyar napi csapadékrekord.',
  },
  {
    tag: 'Világrekord · Jégeső',
    text: 'Bangladesben 1986-ban 1,02 kilogrammos jégszemet találtak. Ez a WMO által nyilvántartott legnehezebb jégszem.',
  },
  {
    tag: 'Népi regula · Fagyosszentek',
    text: 'Pongrác, Szervác és Bonifác május közepén érkezik. A néphagyomány szerint ilyenkor még a tavaszi fagy is veszélyeztetheti a kertet.',
  },
  {
    tag: 'Állomás-humor · Hétvége',
    text: 'Egész héten ragyogó napsütés, hétvégére eső. A természetnek is van humorérzéke, csak kissé sajátos.',
  },
  {
    tag: 'Kőszegi krónika · Bechtold',
    text: 'Bechtold István ornitológus és természetvédő nevét viseli a kőszegi Chernel-kert madárvédelmi központja.',
  },
  {
    tag: 'Klímarekord · Hó',
    text: 'Kékestetőn 1963. február 21-én 146 centiméteres hótakarót mértek. Ez a magyarországi hóvastagság-rekord.',
  },
  {
    tag: 'Történelem · Waterloo',
    text: '1815-ben a waterlooi csata előtti eső feláztatta a talajt. Napóleon később indította meg a támadást, hogy a föld felszáradjon.',
  },
  {
    tag: 'Népi regula · Gyertyaszentelő',
    text: 'Február 2-án, Gyertyaszentelőkor a medve előbújását figyeli a néphagyomány. Ha meglátja az árnyékát, visszabújik még negyven napra.',
  },
  {
    tag: 'Állomás-humor · Szélcsend',
    text: 'Azt ígérték, szélcsend lesz. Kőszegen ez általában azt jelenti, hogy a szél éppen levegőt vesz.',
  },
  {
    tag: 'Kőszegi krónika · Vár',
    text: 'A Jurisics-vár legrégebbi részei a 13. századig nyúlnak vissza. Kőszeg történelmének egyik legfontosabb épített emléke.',
  },
  {
    tag: 'Világrekord · Eső',
    text: 'Az indiai Cherrapunji térségében 1860 és 1861 között több mint 26 méter esőt mértek egy év alatt. Elképesztő mennyiség!',
  },
  {
    tag: 'Klímarekord · Hőingás',
    text: 'Szécsényben 2022. március 24-én 31,1 °C volt a napi hőingás. Reggel még fagyott, délután már tavaszias meleg volt.',
  },
  {
    tag: 'Népi regula · Sándor',
    text: 'Sándor, József, Benedek zsákban hozzák a meleget – mondja a népi regula. Március 18–21. a tavasz érkezésének reményét jelzi.',
  },
  {
    tag: 'Állomás-humor · Kirándulás',
    text: 'Elindulsz a Hétforráshoz napsütésben, visszafelé már esőben jössz. A hegységben az időjárás is szeret túrázni.',
  },
  {
    tag: 'Kőszegi krónika · Szulejmán',
    text: 'Szulejmán szultán személyesen is jelen volt Kőszeg 1532-es ostrománál. A kis vár ellenállása meglepte a hatalmas sereget.',
  },
  {
    tag: 'Klímarekord · Köd',
    text: 'Mátranovákon 1997-ben 244 ködös napot jegyeztek fel egy év alatt. Ilyenkor a napsütés már szinte vendégnek számít.',
  },
  {
    tag: 'Népi regula · Pünkösd',
    text: 'A pünkösdi eső a néphit szerint jó termést ígér. A gazdák régóta figyelik, mit hoz a május végi, június eleji idő.',
  },
  {
    tag: 'Állomás-humor · Hőérzet',
    text: 'A hőmérő szerint 5 fok van. A kőszegi szél szerint viszont ideje újragondolni az életünket.',
  },
  {
    tag: 'Kőszegi krónika · Gesztenye',
    text: 'A szelídgesztenye régóta része Kőszeg és környéke tájképének. A gesztenyések az Alpokalja jellegzetes természeti értékei.',
  },
  {
    tag: 'Klímarekord · Szélsőség',
    text: 'Baján 1942-ben −34,1 °C-ot, 2007-ben pedig 41 °C-ot mértek. A két érték között 75,1 fok a különbség.',
  },
  {
    tag: 'Világrekord · Hideg',
    text: 'Az Antarktiszon található Vosztok állomáson 1983. július 21-én −89,2 °C-ot mértek. Ez a hivatalos földi hidegrekord.',
  },
  {
    tag: 'Népi regula · Szent György',
    text: 'Április 24-én, Szent György napján a pásztorok a legelő állapotát és az időjárást figyelték. A kihajtás fontos tavaszi esemény volt.',
  },
  {
    tag: 'Állomás-humor · Esernyő',
    text: 'Az esernyő nem véd meg a széltől Kőszegen. Legfeljebb megmutatja, melyik irányba fúj a következő széllökés.',
  },
  {
    tag: 'Kőszegi krónika · Hegység',
    text: 'A Kőszegi-hegység az Alpokalja része. Erdei, patakvölgyei és hegytetői különleges kirándulóterületet alkotnak.',
  },
  {
    tag: 'Klímarekord · Napsütés',
    text: 'Békéscsabán 2012-ben 2645 órányi napsütést regisztráltak egy év alatt. Ez a magyarországi éves napfénytartam-rekord.',
  },
  {
    tag: 'Történelem · 1709',
    text: 'Az 1709-es európai tél rendkívül kemény volt. A fagy és az élelmiszerhiány sok országban súlyos társadalmi következményekkel járt.',
  },
  {
    tag: 'Népi regula · Szüret',
    text: 'A régi szőlősgazdák a szüret idején a reggeli harmatot, a ködöt és a nappali meleget is figyelték. Az időjárás az évjárat része.',
  },
  {
    tag: 'Állomás-humor · Hirtelen zápor',
    text: 'A zápor pont akkor érkezik, amikor nincs nálad esernyő. Amikor viszont egész nap cipeled, egyetlen csepp sem esik.',
  },
  {
    tag: 'Kőszegi krónika · Kilátó',
    text: 'A Szulejmán-kilátó az 1532-es ostrom emlékét idézi. Innen a város és a környező táj történelmi panorámája tárul fel.',
  },
  {
    tag: 'Világrekord · Szárazság',
    text: 'A chilei Atacama-sivatag a Föld egyik legszárazabb vidéke. Egyes mérőhelyein hosszú időszakokon át alig hullik csapadék.',
  },
  {
    tag: 'Klímarekord · UV',
    text: 'Kékestetőn 2016. június 23-án 9,7-es tízperces UV-B értéket mértek. A magas UV-sugárzás komoly bőrvédelmet kíván.',
  },
  {
    tag: 'Történelem · 1944 június',
    text: 'A normandiai partraszállást eredetileg június 5-re tervezték. A közelgő vihar miatt Eisenhower június 6-ra halasztotta az inváziót.',
  },
  {
    tag: 'Népi regula · Farsang',
    text: 'A farsangi időszakban a tél búcsúztatása és a tavasz várása összekapcsolódott. A zajos mulatságokhoz időjósló hiedelmek is társultak.',
  },
  {
    tag: 'Állomás-humor · Nyaralás',
    text: 'A nyaralás első napján esik, a hazautazás napján kisüt a nap. A meteorológia néha személyesnek tűnik.',
  },
  {
    tag: 'Kőszegi krónika · Várfalak',
    text: 'Az 1532-es ostrom után Kőszeg városfalait újjáépítették. A város későbbi fejlődését a kereskedelem is segítette.',
  },
  {
    tag: 'Világrekord · Csapadék',
    text: 'Az indiai Mawsynram a Föld egyik legcsapadékosabb lakott térsége. Az éves átlagos csapadéka meghaladja a 11 métert.',
  },
  {
    tag: 'Klímarekord · Balaton',
    text: 'A Balaton jege 1962–1963 telén 110 napig maradt összefüggő jégpáncél alatt. Ma már ritka az ilyen tartós befagyás.',
  },
  {
    tag: 'Történelem · Hannibál',
    text: 'Hannibál serege az Alpokon átkelve hóval, hideggel és nehéz tereppel küzdött. Az időjárás a hadjárat egyik komoly akadálya volt.',
  },
  {
    tag: 'Népi regula · Péter-Pál',
    text: 'Péter-Pál napja június 29. A hagyomány szerint ekkor kezdődhetett az aratás, ha az időjárás és a gabona érettsége engedte.',
  },
  {
    tag: 'Állomás-humor · Naptej',
    text: 'Reggel még felhős az ég, délben már leégsz. Az alpokaljai nap néha gyorsabban vált hangulatot, mint az előrejelzés.',
  },
  {
    tag: 'Kőszegi krónika · Király-völgy',
    text: 'A Király-völgy a Kőszegi-hegység egyik ismert kirándulóterülete. Erdei útjai a városból induló túrák kedvelt célpontjai.',
  },
  {
    tag: 'Klímarekord · Hómentes tél',
    text: 'A Balatonon több télen, például 1989–1990-ben sem alakult ki összefüggő jégpáncél. A befagyás ma már korántsem biztos.',
  },
  {
    tag: 'Világrekord · Ciklon',
    text: 'A trópusi ciklonokban a szélsebesség meghaladhatja a 300 km/h-t. A part mentén a viharhullám és az eső is pusztító lehet.',
  },
  {
    tag: 'Népi regula · Szent Mihály',
    text: 'Szeptember 29., Szent Mihály napja a pásztoréletben fontos határnap volt. Az időjárásból a közelgő télre is következtettek.',
  },
  {
    tag: 'Állomás-humor · Hőhullám',
    text: 'Amikor a kőszegi hőmérő 35 fokot mutat, a délutáni séta már nem program, hanem túlélőtúra.',
  },
  {
    tag: 'Kőszegi krónika · Szőlőhegy',
    text: 'Kőszeg szőlőhegyeinek mikroklímája eltérhet egymástól. Ezért a régi szőlőhajtásokat meghatározott helyekről gyűjtötték.',
  },
  {
    tag: 'Klímarekord · Légnyomás',
    text: 'Budapesten 1907. január 24-én 1055,9 hPa tengerszinti légnyomást jegyeztek fel. Ez kiemelkedően magas érték.',
  },
  {
    tag: 'Történelem · 1815',
    text: 'A Tambora 1815-ös kitörése hatalmas mennyiségű kén-dioxidot juttatott a légkörbe. A sztratoszférában képződő aeroszolok hűtötték a felszínt.',
  },
  {
    tag: 'Népi regula · Szent Anna',
    text: 'Július 26., Szent Anna napja a néphagyományban időjósló nap is volt. A gazdák a nyár további alakulását figyelték.',
  },
  {
    tag: 'Állomás-humor · Ködös reggel',
    text: 'A kőszegi köd olyan sűrű, hogy a reggeli kávé mellé GPS-koordináta is járna.',
  },
  {
    tag: 'Kőszegi krónika · Alpokalja',
    text: 'Az Alpokalja hazánk nyugati peremvidéke. Az Alpok közelsége miatt a táj éghajlata és növényvilága is sajátos.',
  },
  {
    tag: 'Világrekord · Hóvihar',
    text: 'A hegyekben egyetlen hóvihar alatt méteres hó is hullhat. A szél közben hatalmas hótorlaszokat építhet az utakra.',
  },
  {
    tag: 'Klímarekord · Szeged',
    text: 'Szegeden 1978. október 31. és december 4. között 35 napon át nem sütött ki a nap. Ez hazai rekord.',
  },
  {
    tag: 'Történelem · 1812-es tél',
    text: 'A francia hadsereg visszavonulása Oroszországból 1812 telén súlyos veszteségekkel járt. A hideg mellett az utánpótlás hiánya is pusztított.',
  },
  {
    tag: 'Népi regula · Karácsony',
    text: 'Fehér karácsonyra vágyunk, de a népi időjóslás szerint az ünnepi időjárásból nem lehet biztosan megmondani a januárt.',
  },
  {
    tag: 'Állomás-humor · Túra',
    text: 'A Hétforráshoz induláskor még rövid ujjúban vagy. A hegytetőn már azon gondolkodsz, miért nem hoztál síruhát.',
  },
  {
    tag: 'Kőszegi krónika · Chernel-kert',
    text: 'A Chernel-kert Kőszeg egyik természetvédelmi értéke. Madárvédelmi és szemléletformáló tevékenységével Chernel István örökségét ápolja.',
  },
  {
    tag: 'Világrekord · Jégvihar',
    text: 'A nagy jégesőkben a jégszemek akár több centiméteresre is nőhetnek. Az autók, tetők és növények is súlyosan károsodhatnak.',
  },
  {
    tag: 'Klímarekord · Szélcsend',
    text: 'A szélcsend meteorológiai értelemben nem feltétlenül teljes mozdulatlanság. A szélirány és a sebesség mérési határai is számítanak.',
  },
  {
    tag: 'Történelem · D-nap vihar',
    text: '1944. június 5-én az Atlanti-óceán felől érkező vihar miatt elhalasztották a partraszállást. A következő napra rövid javulás érkezett.',
  },
  {
    tag: 'Népi regula · Fecskék',
    text: 'A fecskék alacsonyan repülése gyakran eső előtt figyelhető meg. A rovarok ilyenkor a párás levegőben alacsonyabban mozoghatnak.',
  },
  {
    tag: 'Állomás-humor · Időjárás-app',
    text: 'Az alkalmazás szerint 10% az esély az esőre. A kabátod szerint 100%, ezért inkább magaddal viszed.',
  },
  {
    tag: 'Kőszegi krónika · Gesztenyés',
    text: 'A szelídgesztenye Kőszeg környékének jellegzetes fája. Az őszi erdőkben a gesztenyeszüret régi helyi hagyomány.',
  },
  {
    tag: 'Klímarekord · Vác-Bia',
    text: 'Az 1924-es Vác-Bia tornádó becsült széllökése elérhette a 87–103 m/s-ot. Ez rendkívüli erejű légköri jelenség volt.',
  },
  {
    tag: 'Történelem · 1709-es fagy',
    text: 'Az 1709-es nagy európai fagy a folyókat is befagyasztotta, és súlyos élelmiszerhiányt okozott. A tél a történelembe is bevonult.',
  },
  {
    tag: 'Népi regula · Harmat',
    text: 'A reggeli harmatot a gazdák régóta figyelik. A derült, szélcsendes éjszakák kedveznek a harmatképződésnek.',
  },
  {
    tag: 'Állomás-humor · Időjárásjelentés',
    text: 'A mai időjárás: négy évszak egy nap alatt. Aki nem szereti, várjon húsz percet.',
  },
  {
    tag: 'Kőszegi krónika · Várvédők',
    text: 'Az 1532-es ostrom során a várat katonák, polgárok és a környékről menekülők együtt védték. Kőszeg ellenállása európai hírű lett.',
  },
  {
    tag: 'Világrekord · Száraz idő',
    text: 'A chilei Atacama egyes részein évtizedes időszakok is eltelhetnek mérhető eső nélkül. A sivatag a földi szárazság jelképe.',
  },
  {
    tag: 'Népi regula · Kerti munka',
    text: 'A kertészek régóta figyelik a talaj nedvességét és a felhőket. A népi megfigyelés hasznos, de az öntözést a talaj állapota döntse el.',
  },
  {
    tag: 'Időjárási jelenség · Főn szél',
    text: 'Amikor délnyugati szél bukik át az Alpok gerincén, a főn-hatás miatt Kőszegen akár télen is percek alatt 6–8 fokot ugorhat a hőmérő.',
  },
  {
    tag: 'Népi megfigyelés · Írottkő',
    text: 'Ha az Írottkő „pipál” — vagyis eső után párafelhő gomolyog a fenyvesek felett —, a helyiek szerint hamarosan újabb csapadék érkezik.',
  },
  {
    tag: 'Történelem · Szent Korona 1945',
    text: 'A II. világháború végén a Szent Koronát Kőszegen, a Kálvária-hegy lábánál lévő bunkerben őrizték, mielőtt külföldre vitték.',
  },
  {
    tag: 'Állomás-humor · Végszó',
    text: 'Bármilyen idő is van Kőszegen, egy dolog biztos: az időjárásról mindig lesz miről beszélni.',
  },
];

export function buildMenuStories(date = new Date()) {
  const xmas = daysUntil(12, 24, date);
  const nye = daysUntil(12, 31, date);
  const summerBreak = daysUntil(6, 15, date);
  const spring = daysUntil(3, 20, date);
  const dow = date.getDay(); // 0=V, 6=Szo
  const daysToWeekend = dow === 0 || dow === 6 ? 0 : 6 - dow;

  const countdowns = [
    {
      tag: 'Visszaszámláló · Karácsony',
      text: xmas === 0
        ? 'Ma van szenteste! Ma még a szélmérő is ünnepel. 🎄'
        : `Már csak ${xmas}-et kell aludni karácsonyig! A hó nem garantált, a bejgli igen. 🎄`,
    },
    {
      tag: 'Visszaszámláló · Nyári szünet',
      text: summerBreak === 0
        ? 'Itt a vakáció! Irány a szabadba — de az UV-indexre figyelj! ☀️'
        : `Már csak ${summerBreak}-et kell aludni és itt a nyári szünet! Addig is kitartás! ☀️`,
    },
    {
      tag: 'Visszaszámláló · Szilveszter',
      text: nye === 0
        ? 'Ma szilveszter! A pezsgő hőfokát sajnos nem mérjük. 🥂'
        : `Már csak ${nye} nap van hátra szilveszterig — a pezsgőt már lehet hűteni! 🥂`,
    },
    {
      tag: 'Visszaszámláló · Hétvége',
      text: daysToWeekend === 0
        ? 'Végre hétvége! Tökéletes alkalom egy sétára a Kőszegi-hegységben. 🥾'
        : `Már csak ${daysToWeekend}-et kell aludni a hétvégéig! 🥾`,
    },
  ];

  if (spring > 0 && spring <= 150) {
    countdowns.push({
      tag: 'Visszaszámláló · Tavasz',
      text: `Már csak ${spring}-et kell aludni a csillagászati tavaszig — a hóvirágok már készülődnek! 🌱`,
    });
  }

  // Véletlenszerűsített sorrend, amelyben a visszaszámlálók rendszeresen
  // (minden 5. elemként) felbukkannak a ~100 sztori között.
  const shuffledStories = [...HISTORICAL_STORIES].sort(() => Math.random() - 0.5);
  const combined = [];
  let cIdx = 0;
  for (let i = 0; i < shuffledStories.length; i++) {
    if (i % 5 === 0 && cIdx < countdowns.length) {
      combined.push(countdowns[cIdx++]);
    }
    combined.push(shuffledStories[i]);
  }
  while (cIdx < countdowns.length) {
    combined.push(countdowns[cIdx++]);
  }
  return combined;
}

const HU_MONTH_NAMES = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December',
];

// Élő magyar Wikipédia "Ezen a napon történt" lekérés az adott nap szócikkéből
// (pl. "November_11."), rövid (40..145 karakteres) elemekre szűrve és napi szinten
// sessionStorage-ban gyorsítótárazva.
export async function fetchTodayWikiStories(date = new Date()) {
  const mName = HU_MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  const pageTitle = `${mName}_${day}.`;
  const cacheKey = `wiki_onthisday_${pageTitle}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore storage errors */ }

  try {
    const url = `https://hu.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&section=1&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const html = json?.parse?.text?.['*'] || '';
    if (!html) return [];

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const items = [];
    doc.querySelectorAll('li').forEach((li) => {
      // Lábjegyzetek ([1], [forrás?]) eltávolítása
      li.querySelectorAll('sup').forEach((s) => s.remove());
      const raw = (li.textContent || '').replace(/\s+/g, ' ').trim();
      const match = raw.match(/^((?:i\.\s*e\.\s*)?\d{1,4})\s*[–—-]\s*(.+)$/i);
      if (!match) return;
      const year = match[1].trim();
      const text = match[2].trim();
      if (text.length >= 35 && text.length <= 145) {
        items.push({
          tag: `Ezen a napon · ${year}`,
          text,
        });
      }
    });

    if (items.length > 0) {
      try { sessionStorage.setItem(cacheKey, JSON.stringify(items)); } catch { /* ignore */ }
    }
    return items;
  } catch {
    return [];
  }
}


