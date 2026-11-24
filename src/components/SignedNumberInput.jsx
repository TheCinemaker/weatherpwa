// Számmező előjelváltó (±) gombbal. Az Android Gboard (Chrome) számbillentyűzetén
// nincs mínusz jel, a Samsung billentyűzeten viszont van — a ± gomb minden
// böngészőn és billentyűzeten működik, a szöveges érték elejére teszi/leveszi a "-"-t.
//
// Az onChange a SZÖVEGES értéket kapja (nem eseményt): onChange={(v) => setX(v)}.
import { toggleSign, sanitizeSignedNumber } from '../utils/signedNumber';

export default function SignedNumberInput({ value, onChange, className = '', style, ...rest }) {
  return (
    <div className="relative flex-1 min-w-0">
      <input
        {...rest}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(sanitizeSignedNumber(e.target.value))}
        className={`${className} w-full`}
        style={{ ...style, paddingRight: '2.25rem' }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Előjel váltása (plusz / mínusz)"
        // Ne vegye el a fókuszt a mezőtől, így a billentyűzet nyitva marad
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => onChange(toggleSign(value))}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 text-sm font-black leading-none flex items-center justify-center select-none transition-colors"
      >
        ±
      </button>
    </div>
  );
}
