import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitQuizResult, checkQuizAlreadyPlayed } from '../api/supabase';

// 50 kérdésből álló pool Kőszeg történelmével, földrajzával és időjárásával kapcsolatban
const QUESTIONS_POOL = [
  {
    q: 'Milyen különleges éghajlatáról ismert Kőszeg és az Alpokalja?',
    options: ['Szubmediterrán', 'Kontinentális pusztai', 'Szubalpin (alpesi jellegű)', 'Trópusi monszun'],
    correct: 2
  },
  {
    q: 'Hány méter magas Kőszeg és egyben a Dunántúl legmagasabb pontja, az Írott-kő?',
    options: ['1014 méter', '884 méter', '525 méter', '712 méter'],
    correct: 1
  },
  {
    q: 'Mit jelent a kőszegi lakosok körében a „kőszegi szél” kifejezés?',
    options: [
      'A városon átvonuló gyenge nyári szellő',
      'A patak völgyében felszálló meleg levegő',
      'Az Alpok felől érkező, szélcsatornaszerűen fújó, tartósan erős észak-északnyugati szél',
      'A déli órákban fújó száraz, sivatagi szél'
    ],
    correct: 2
  },
  {
    q: 'Melyik patak folyik keresztül Kőszeg belvárosán?',
    options: ['Rába', 'Gyöngyös-patak', 'Repce', 'Marcal'],
    correct: 1
  },
  {
    q: 'Milyen csapadékrekordot tart Kőszeg és a hegyvidék országos szinten?',
    options: [
      'Itt regisztrálták a valaha volt legkevesebb csapadékot',
      'Magyarország egyik legcsapadékosabb területe, éves átlagban akár 800 mm feletti értékkel',
      'Itt esett a valaha volt legnagyobb méretű jégeső',
      'Itt havazott a legtöbbet július hónapban'
    ],
    correct: 1
  },
  {
    q: 'Melyik híres kőszegi épület harangja kondul meg minden nap 11 órakor?',
    options: ['Hősök tornya / Jurisics-vár', 'Jézus Szíve templom', 'Városháza', 'Kálvária templom'],
    correct: 0
  },
  {
    q: 'Mit mér a SmartMixin meteorológiai állomás az időjárás portálunkon?',
    options: [
      'Csak a szélirányt',
      'A repülők magasságát',
      'Helyi, valós idejű adatokat (hőmérséklet, szél, csapadék, páratartalom) Kőszegről',
      'A földrengések erősségét'
    ],
    correct: 2
  },
  {
    q: 'Ki volt a kőszegi vár hős védője az 1532-es török ostrom idején?',
    options: ['Zrínyi Miklós', 'Jurisics Miklós', 'Dobó István', 'Báthory István'],
    correct: 1
  },
  {
    q: 'Melyik szomszédos ország határa húzódik az Írott-kőnél?',
    options: ['Szlovákia', 'Ausztria', 'Szlovénia', 'Horvátország'],
    correct: 1
  },
  {
    q: 'Kőszeg átlagos tengerszint feletti magassága a belvárosban körülbelül mennyi?',
    options: ['110 méter', '274 méter', '512 méter', '85 méter'],
    correct: 1
  },
  {
    q: 'Milyen erdőtípus jellemzi leginkább a Kőszegi-hegységet?',
    options: ['Tölgyesek és karsztbokorerdők', 'Lombhullató bükkösök és fenyvesek', 'Eukaliptusz erdők', 'Füves szavanna'],
    correct: 1
  },
  {
    q: 'Mi a neve a híres kőszegi kirándulóhelynek, ahol 7 hidegvizes forrás tör elő?',
    options: ['Hétforrás', 'Király-völgy', 'Stájerházak', 'Szent Vid'],
    correct: 0
  },
  {
    q: 'Melyik híres kőszegi botanikai ritkaság nyílik kora tavasszal a hegyvidéki bükkösökben?',
    options: ['Erdei ciklámen', 'Hóvirág', 'Kék ibolya', 'Havasi gyopár'],
    correct: 0
  },
  {
    q: 'Milyen célt szolgál elsősorban a kőszegi Csónakázó-tó?',
    options: ['Ipari víztározás', 'Helyi árvízvédelem és turizmus', 'Ásványvíz palackozás', 'Hajóversenyek rendezése'],
    correct: 1
  },
  {
    q: 'Hol őrizték a magyar Szent Koronát 1944 decembere és 1945 márciusa között Kőszegen?',
    options: ['A Jurisics-vár pincéjében', 'A Kálvária-hegy alatti sziklabunkerben', 'A Városházán', 'A Hősök tornyában'],
    correct: 1
  },
  {
    q: 'Mi a neve a kőszegi szőlőtermelők híres, 1740 óta vezetett hagyományos könyvének?',
    options: ['Városi Krónika', 'Szőlő Jövésnek Könyve', 'Kőszegi Boroskönyv', 'Jurisics-kódex'],
    correct: 1
  },
  {
    q: 'Melyik ünnepnapon rajzolják be minden évben a szőlőhajtások rajzait a Szőlő Jövésnek Könyvébe?',
    options: ['Szent György napján (április 24.)', 'Szent Márton napján (november 11.)', 'Szent István napján (augusztus 20.)', 'Pünkösdhétfőn'],
    correct: 0
  },
  {
    q: 'Melyik híres zeneszerző adott nagysikerű koncertet Kőszegen 1846-ban?',
    options: ['Ludwig van Beethoven', 'Liszt Ferenc', 'Wolfgang Amadeus Mozart', 'Erkel Ferenc'],
    correct: 1
  },
  {
    q: 'Milyen stílusban épült a kőszegi főtéren álló monumentális Jézus Szíve templom?',
    options: ['Barokk', 'Reneszánsz', 'Neogótikus', 'Klasszicista'],
    correct: 2
  },
  {
    q: 'Mit mér a barométer?',
    options: ['Páratartalmat', 'Szélsebességet', 'Légnyomást', 'Csapadékmennyiséget'],
    correct: 2
  },
  {
    q: 'Milyen mértékegységben fejezzük ki a légnyomást a meteorológiában?',
    options: ['Celsius-fok', 'Hektopaszkal (hPa)', 'Kilométer per óra (km/h)', 'Milliméter (mm)'],
    correct: 1
  },
  {
    q: 'Mit jelent a 100%-os relatív páratartalom?',
    options: [
      'Azt, hogy nincs víz a levegőben',
      'A levegő teljesen telített vízgőzzel az adott hőmérsékleten, köd vagy csapadék képződhet',
      'Azt, hogy esik a hó',
      'Azt, hogy nagyon erős a szél'
    ],
    correct: 1
  },
  {
    q: 'Mi a harmatpont?',
    options: [
      'Az a hőmérséklet, ahol a növények elpusztulnak',
      'Az a hőmérséklet, amelyre a levegőt le kell hűteni, hogy telítetté váljon és megkezdődjön a vízgőz lecsapódása',
      'A reggeli harmat átlagos vastagsága',
      'A csapadékmentes napok száma'
    ],
    correct: 1
  },
  {
    q: 'Melyik műszerrel mérjük a szél sebességét?',
    options: ['Anemométer', 'Higrométer', 'Termométer', 'Pluviométer'],
    correct: 0
  },
  {
    q: 'Melyik felhőfajta felelős a heves zivatarokért, villámlásokért és jégesőkért?',
    options: ['Cirrus (pehelyfelhő)', 'Cumulonimbus (zivatarfelhő)', 'Stratus (rétegfelhő)', 'Altocumulus (párnafelhő)'],
    correct: 1
  },
  {
    q: 'Mi a szél kialakulásának elsődleges oka?',
    options: ['A Föld mágneses mezeje', 'A légnyomáskülönbségek kiegyenlítődésére törekvő levegőáramlás', 'A holdfázisok változása', 'A fák leveleinek mozgása'],
    correct: 1
  },
  {
    q: 'Mit fejez ki az UV-index?',
    options: [
      'A levegő porszennyezettségét',
      'A Napból érkező ultraibolya sugárzás erejét és a bőrre gyakorolt veszélyességét',
      'A várható csapadék intenzitását',
      'A villámlások gyakoriságát'
    ],
    correct: 1
  },
  {
    q: 'Mi az a Humidex mutató?',
    options: [
      'A szél hűtő hatását mérő index',
      'A hőmérséklet és a páratartalom együttes hatását kifejező index (hőérzet)',
      'A talajnedvesség mérőszáma',
      'A víztisztaságot jelző érték'
    ],
    correct: 1
  },
  {
    q: 'Miért hűvösebb a levegő a hegyekben (pl. Írott-kőn), mint a völgyben?',
    options: [
      'Mert ott közelebb van a Nap',
      'Mert a ritkább levegő kevesebb hőt tart meg, a hőmérséklet átlagosan 0.65 °C-ot csökken 100 méterenként felfelé',
      'Mert ott sűrűbbek az erdők',
      'Mert ott nincsenek házak'
    ],
    correct: 1
  },
  {
    q: 'Mi a zúzmara?',
    options: [
      'A földre hullott megfagyott esővíz',
      'Fagypont alatti ködös időben a tárgyaknak ütköző túlhűlt vízcseppek fagyásával keletkező jégkristály-lerakódás',
      'A tavaszi jégeső egy fajtája',
      'A hegyekben elolvadt hó'
    ],
    correct: 1
  },
  {
    q: 'Melyik gáz alkotja a Föld légkörének legnagyobb részét (körülbelül 78%-át)?',
    options: ['Oxigén', 'Nitrogén', 'Szén-dioxid', 'Argon'],
    correct: 1
  },
  {
    q: 'Ki emeltette a Jurisics téren álló Mária-szobrot (Pestis-oszlopot) a járvány elvonulása után?',
    options: ['Jurisics Miklós', 'A város lakossága fogadalomból (1713)', 'Hunyadi Mátyás', 'Esterházy Pál'],
    correct: 1
  },
  {
    q: 'Melyik híres kőszegi múzeumban csodálhatjuk meg a régi gyógyszerész-tudomány emlékeit?',
    options: ['Jurisics-vár Múzeum', 'Arany Egyszarvú Patikamúzeum', 'Tábornokház', 'Postamúzeum'],
    correct: 1
  },
  {
    q: 'Hogy nevezik a Kőszeg melletti hegycsúcsot, amelyen egy Árpád-kori templomrom és egy kápolna áll?',
    options: ['Kálvária-hegy', 'Szent Vid-hegy', 'Óház-tető', 'Király-völgy'],
    correct: 1
  },
  {
    q: 'Milyen kilátó áll az Óház-tetőn, ahonnan csodás panoráma nyílik Kőszegre?',
    options: ['Írott-kő kilátó', 'Óház-kilátó (egykori lakótorony helyén)', 'Kálvária-kilátó', 'Hétforrás-torony'],
    correct: 1
  },
  {
    q: 'Mi a neve Kőszeg történelmi belvárosának központi terének?',
    options: ['Kossuth Lajos utca', 'Jurisics tér', 'Fő tér', 'Várkör'],
    correct: 1
  },
  {
    q: 'Melyik évben volt a nagy kőszegi árvíz, amely után kiépítették a Gyöngyös-patak védműveit?',
    options: ['1912', '1965', '2001', '1989'],
    correct: 1
  },
  {
    q: 'Hány órakor húzódott vissza a török sereg Kőszeg alól 1532-ben?',
    options: ['Délben (12:00)', 'Délelőtt 11:00-kor (ezért harangoznak ekkor Kőszegen)', 'Reggel 8:00-kor', 'Este 18:00-kor'],
    correct: 1
  },
  {
    q: 'Mi a kőszegi Koronaőrző bunker történelmi jelentősége?',
    options: [
      'Itt bujkált Jurisics Miklós a török elől',
      'Itt őrizték a magyar Szent Koronát a II. világháború végén',
      'Itt tárolták a város aranytartalékát',
      'Ez volt a török hadsereg főhadiszállása'
    ],
    correct: 1
  },
  {
    q: 'Milyen nemzetiségű katonák ostromolták Kőszeg várát 1532-ben?',
    options: ['Osztrákok', 'Törökök (Oszmán Birodalom)', 'Franciák', 'Tatárok'],
    correct: 1
  },
  {
    q: 'Mit jelent a meteorológiában a „front” kifejezés?',
    options: [
      'Két különböző hőmérsékletű és sűrűségű légtömeg találkozási határfelülete',
      'A szélcsend állapota',
      'A felhők magasságának mértéke',
      'A naplemente időpontja'
    ],
    correct: 0
  },
  {
    q: 'Hogyan változik a légnyomás általában, ha vihar közeledik?',
    options: ['Drasztikusan emelkedik', 'Csökken / lezuhan', 'Változatlan marad', 'Ingadozik másodpercenként'],
    correct: 1
  },
  {
    q: 'Milyen csapadékfajta a „dara”?',
    options: [
      'Nagyon finom, szinte láthatatlan szemerkélés',
      'Félgömb alakú, átlátszatlan jégszemcsék, amelyek fagypont körüli hőmérsékleten hullanak',
      'A hegyekben megolvadó hó',
      'A nyári zivatarok első cseppjei'
    ],
    correct: 1
  },
  {
    q: 'Melyik kőszegi városrész híres a szőlő- és bortermeléséről?',
    options: ['Belváros', 'Királyvölgy / Szabóhegy', 'Kálvária', 'Újváros'],
    correct: 1
  },
  {
    q: 'Hogy nevezik az Írott-kő osztrák oldalán lévő települést, ahonnan szintén sok turista indul?',
    options: ['Léka (Lockenhaus)', 'Rohonc (Rechnitz)', 'Felsőőr (Oberwart)', 'Kismarton (Eisenstadt)'],
    correct: 1
  },
  {
    q: 'Mi Kőszeg testvérvárosi szövetségének neve, amely Európa kisvárosait tömöríti?',
    options: ['Eurocities', 'Douzelage', 'Hanza-szövetség', 'Alpok-Adria Munkaközösség'],
    correct: 1
  },
  {
    q: 'Melyik évszakban hullik átlagosan a legkevesebb csapadék Kőszegen?',
    options: ['Nyáron', 'Télen', 'Tavasszal', 'Ősszel'],
    correct: 1
  },
  {
    q: 'Milyen állat ábrázolása látható a kőszegi címerben és a Jurisics-vár kapuja felett?',
    options: ['Medve', 'Sas / Kétfejű sas', 'Oroszlán', 'Egyszarvú'],
    correct: 1
  },
  {
    q: 'Ki volt a kőszegi vár ura, aki Jurisics Miklósnak adományozta a várat a hősies helytállásért?',
    options: ['I. Ferdinánd király', 'Szulejmán szultán', 'Mátyás király', 'II. Lajos'],
    correct: 0
  },
  {
    q: 'Melyik kőszegi hegyen található az 1700-as években épült háromtornyú Kálvária templom?',
    options: ['Szabó-hegy', 'Kálvária-hegy (Szent Imre-hegy)', 'Írott-kő', 'Szarvas-kő'],
    correct: 1
  }
];

export default function QuizModal({ isOpen, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null); // null | index
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState('start'); // 'start' | 'playing' | 'ended'
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  
  // Timer states
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  
  // Submit states
  const [playerName, setPlayerName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Esc, body scroll letiltás és napi korlát ellenőrzés
  useEffect(() => {
    if (!isOpen) return;

    checkQuizAlreadyPlayed().then(played => {
      setAlreadyPlayed(played);
    }).catch(err => {
      console.error(err);
      setAlreadyPlayed(false);
    });

    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  // Timer kezelése
  useEffect(() => {
    if (quizState === 'playing') {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState]);

  const startQuiz = () => {
    // 5 véletlenszerű kérdés kiválasztása a poolból
    const shuffled = [...QUESTIONS_POOL].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 5));
    setCurrentIdx(0);
    setSelectedAns(null);
    setIsAnswered(false);
    setScore(0);
    setSeconds(0);
    setPlayerName(localStorage.getItem('tippelde_player_name') || '');
    setIsSubmitted(false);
    setSubmitError('');
    setQuizState('playing');
  };

  const handleAnswerSelect = (optIdx) => {
    if (isAnswered) return;
    setSelectedAns(optIdx);
    setIsAnswered(true);
    
    if (optIdx === questions[currentIdx].correct) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedAns(null);
      setIsAnswered(false);
    } else {
      setQuizState('ended');
    }
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await submitQuizResult(playerName.trim(), score, seconds);
      localStorage.setItem('tippelde_player_name', playerName.trim());
      setIsSubmitted(true);
      setAlreadyPlayed(true);
    } catch (err) {
      console.error(err);
      setSubmitError('Hiba történt az eredmény mentése során.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.7 }}
          className="relative w-full max-w-md bg-night-800 rounded-apple-outer border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header gradient bar */}
          <div className="h-2 w-full shrink-0 bg-brand-gradient" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content container */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-center min-h-[300px]">
            
            {/* ALREADY PLAYED TODAY */}
            {alreadyPlayed ? (
              <div className="space-y-4 py-6 text-center select-none">
                <Award className="w-12 h-12 text-cyan2-400 mx-auto animate-pulse" />
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Már játszottál ma!</h3>
                <p className="text-xs text-white/70 leading-relaxed px-4">
                  A Kvíz naponta csak egyszer játszható le. Gyere vissza holnap egy újabb kőszegi kvízért! 🧠
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-apple-inner text-xs font-bold transition-all mt-4"
                >
                  Bezárás
                </button>
              </div>
            ) : quizState === 'start' ? (
              <div className="text-center space-y-5 py-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-cyan2-400/10 flex items-center justify-center text-cyan2-300">
                  <Award className="w-9 h-9 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Kőszegi Időjárás Kvíz</h3>
                  <p className="text-xs text-white/70 leading-relaxed px-4">
                    Teszteld a tudásodat Kőszeg és a hegyvidék éghajlatáról, időjárási érdekességeiről és helyi titkairól!
                  </p>
                </div>
                <button
                  onClick={startQuiz}
                  className="btn-grad px-8 py-3.5 text-xs font-bold uppercase tracking-wider rounded-apple-inner active:scale-95 transition-all shadow-lg w-full"
                >
                  Kvíz indítása 🏁
                </button>
              </div>
            ) : null}

            {/* PLAYING STATE */}
            {quizState === 'playing' && questions.length > 0 && (
              <div className="space-y-4">
                {/* Status indicator / Timer */}
                <div className="flex items-center justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest border-b border-white/5 pb-2 shrink-0">
                  <span className="text-cyan2-300">
                    Kérdés: {currentIdx + 1} / {questions.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {seconds} mp
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan2-400 transition-all duration-300" 
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <h4 className="text-sm font-extrabold text-white text-left leading-relaxed py-2">
                  {questions[currentIdx].q}
                </h4>

                {/* Options list */}
                <div className="space-y-2.5">
                  {questions[currentIdx].options.map((opt, oIdx) => {
                    let btnClass = "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white hover:border-cyan2-400/35";
                    
                    if (isAnswered) {
                      if (oIdx === questions[currentIdx].correct) {
                        btnClass = "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 font-bold";
                      } else if (oIdx === selectedAns) {
                        btnClass = "border-rose-500/50 bg-rose-500/20 text-rose-300";
                      } else {
                        btnClass = "border-white/5 bg-white/[0.01] text-white/40 cursor-default";
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isAnswered}
                        onClick={() => handleAnswerSelect(oIdx)}
                        className={`w-full p-3.5 text-xs text-left rounded-apple-card border transition-all flex items-center justify-between ${btnClass}`}
                      >
                        <span className="leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Next button */}
                {isAnswered && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={nextQuestion}
                    className="mt-4 w-full py-3.5 bg-cyan2-500 hover:bg-cyan2-600 text-white rounded-apple-inner text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan2-500/20 transition-all"
                  >
                    <span>{currentIdx < questions.length - 1 ? 'Következő kérdés' : 'Kvíz lezárása'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            )}

            {/* ENDED STATE */}
            {quizState === 'ended' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Kvíz teljesítve!</h3>
                  <p className="text-xs text-white/60 mt-1">Gratulálunk a játékhoz!</p>
                </div>

                {/* Score Summary Card */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-apple-card">
                  <div className="text-center">
                    <div className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-0.5">Találatok</div>
                    <div className="text-2xl font-black text-cyan2-300">{score} / 5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-0.5">Idő</div>
                    <div className="text-2xl font-black text-cyan2-300">{seconds} mp</div>
                  </div>
                </div>

                {/* Leaderboard Form */}
                {!isSubmitted ? (
                  <form onSubmit={handleSubmitScore} className="space-y-3.5 pt-2 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Neved a dicsőségfalra</label>
                      <input
                        type="text"
                        required
                        maxLength={15}
                        value={playerName}
                        onChange={e => setPlayerName(e.target.value)}
                        placeholder="Pl.: Laci, Szili, Vendég"
                        className="w-full px-4 py-3 rounded-apple-inner border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
                      />
                    </div>

                    {submitError && (
                      <p className="text-xs text-rose-300 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> {submitError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !playerName.trim()}
                      className="btn-grad w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-apple-inner flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md"
                    >
                      {isSubmitting ? 'Mentés...' : 'Eredmény beküldése 🏆'}
                    </button>
                  </form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-apple-card text-emerald-300 text-xs font-semibold"
                  >
                    🎉 Eredményedet sikeresen elmentettük a dicsőségfalra!
                  </motion.div>
                )}

                <div className="flex gap-2.5 pt-2">
                  {!alreadyPlayed && (
                    <button
                      onClick={startQuiz}
                      className="flex-1 py-3 border border-white/10 hover:bg-white/[0.03] text-white rounded-apple-inner text-xs font-bold transition-all"
                    >
                      Újra játszom 🔄
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-apple-inner text-xs font-bold transition-all"
                  >
                    Bezárás 🚪
                  </button>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
