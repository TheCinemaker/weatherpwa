KŐSZEGI IDŐJÁRÁS — hero-kártya háttérvideók (2026-11-es, 16:9-es csere)
========================================================================

A hero-kártya tetején teljes szélességben, "úti-cél kártya" stílusban fut
egy hangulati loop-videó, ami az aktuális WMO weathercode + szélsebesség +
nappal/éjszaka alapján választ 20 kategória közül (lásd
src/utils/weatherVideoCategory.js és src/components/HeroWeatherVideo.jsx).

FÁJLNÉV-KONVENCIÓ (ide, a public/videos/ mappába, pontosan ezekkel a nevekkel):

  01-derult-nappal.mp4             02-derult-ejszaka.mp4
  03-valtozoan-felhos-nappal.mp4   04-valtozoan-felhos-ejszaka.mp4
  05-borult-nappal.mp4             06-borult-ejszaka.mp4
  07-kodos-nappal.mp4              08-kodos-ejszaka.mp4
  09-szemerkelo-eso-nappal.mp4     10-szemerkelo-eso-ejszaka.mp4
  11-eso-nappal.mp4                12-eso-ejszaka.mp4
  13-felhoszakadas-nappal.mp4      14-felhoszakadas-ejszaka.mp4
  15-zivatar-nappal.mp4            16-zivatar-ejszaka.mp4
  17-havazas-nappal.mp4            18-havazas-ejszaka.mp4
  19-szeles-nappal.mp4             20-szeles-ejszaka.mp4

TECHNIKAI SPEC:
  - Képarány: 16:9 (fekvő). A hero fejléc teljes szélességben, kb. 220-260px
    magas sávban jelenik meg, ezért a videó natívan tölti ki a helyét,
    nincs szükség vágás-trükkre (a korábbi 9:16-os készletnél ez kellett).
  - Felbontás: 1920x1080 elég (nem kell 4K — mobilon úgysem látszik a
    különbség, de a fájlméretet feleslegesen hizlalná).
  - Hossz: 6-10 másodperc, VARRAT NÉLKÜL hurkolható (az első és utolsó
    képkocka lehetőleg vizuálisan folytonos legyen).
  - Kamera: lezárt/statikus (nincs pan/zoom/dolly) — csak a jelenetben lévő
    elemek (felhők, eső, hó, fák) mozognak. Ez segíti a varrat nélküli loopot is.
  - Nincs benne szöveg, felirat, látható ember/arc, logó.
  - Hang nem kell (az app úgyis némítva (muted) játssza le).
  - Tömörítés: H.264 mp4, mérsékelt bitráta — a cél user mobilneten nézi,
    szóval minél kisebb fájl ugyanolyan vizuális minőség mellett, annál jobb.

A RÉGI 9:16-OS KLIPEK a public/videos/_archive_9x16/ mappában vannak,
megtartva (nem törölve), de a kód már nem hivatkozik rájuk.

A pontos vizuális stílushoz és Flow/Veo promptokhoz lásd a mellékelt
prompt-gyűjteményt (20 db, nappal/éjjel párban, 16:9).
