// Reads the machine-readable zone (MRZ) of an ID card or passport from OCR text.
// Formats (ICAO 9303): TD1 — ID card, 3 lines × 30; TD2 — 2 × 36; TD3 — passport, 2 × 44.
// OCR gives noisy text, so every line is normalised and the fields are cross-checked by the
// MRZ check digits; a field whose check digit fails is retried with letter↔digit fixes.

export interface MrzResult {
  kind: 'id' | 'passport';
  lastName: string;
  firstName: string;
  docNumber: string;
  birthDate: string; // ДД.ММ.ГГГГ
  gender: '' | 'male' | 'female';
  nationality: string; // ISO 3166 alpha-3 as in the MRZ (KAZ, RUS, …)
}

const TO_DIGIT: Record<string, string> = { O: '0', Q: '0', D: '0', U: '0', I: '1', L: '1', T: '1', Z: '2', S: '5', B: '8', G: '6' };
const TO_ALPHA: Record<string, string> = { '0': 'O', '1': 'I', '2': 'Z', '5': 'S', '8': 'B', '6': 'G' };

const charValue = (c: string) => {
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
  if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 55;
  return 0; // '<'
};

const checkDigit = (s: string) => {
  const w = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += charValue(s[i]) * w[i % 3];
  return String(sum % 10);
};

const digits = (s: string) => s.replace(/[A-Z]/g, (c) => TO_DIGIT[c] ?? c);
const letters = (s: string) => s.replace(/[0-9]/g, (c) => TO_ALPHA[c] ?? c);

// A field plus its check digit: accept as read, or after turning look-alike letters into digits.
const checked = (value: string, check: string, numeric: boolean) => {
  const c = digits(check);
  if (checkDigit(value) === c) return value;
  if (numeric) {
    const fixed = digits(value);
    if (checkDigit(fixed) === c) return fixed;
  }
  return null;
};

function normaliseLine(raw: string) {
  return raw
    .toUpperCase()
    .replace(/[«‹]/g, '<<')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9<]/g, '');
}

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

// OCR often reads the «<» fillers after a name as K, C, L or X («DIDAR<<<<» → «DIDARKKKK», «DIDAR<KC<»).
// A word is kept only while it looks like a name; the first junk word ends the field.
function cleanNameWords(segment: string) {
  const words: string[] = [];
  for (const raw of segment.split('<')) {
    const word = raw.replace(/[KCLX]{4,}$/, '').replace(/([KCLX])\1{2,}$/, '');
    if (!word) {
      if (words.length) break;
      continue;
    }
    const plausible = word.length >= 2 && /[AEIOUY]/.test(word) && !/^(.)\1+$/.test(word) && !/[0-9]/.test(word);
    if (!plausible) break;
    words.push(word);
  }
  return titleCase(words.join(' '));
}

function parseNames(field: string) {
  const clean = letters(field).replace(/<+$/, '');
  // Without the «<<» separator the surname and given names can't be told apart: better empty
  // fields than a wrong name.
  if (!clean.includes('<<')) return { lastName: '', firstName: '' };
  // Surname << given names (one segment, names inside split by single «<»); anything after the
  // next «<<» is filler or a neighbouring document caught in the same OCR line.
  const [last = '', ...rest] = clean.split('<<');
  const given = rest.find((seg) => /[A-Z]{2}/.test(seg)) ?? '';
  const lastName = cleanNameWords(last);
  return { lastName, firstName: lastName ? cleanNameWords(given) : '' };
}

// YYMMDD → ДД.ММ.ГГГГ; a birth year in the future belongs to the previous century.
function birthToDots(yymmdd: string) {
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  if (!(mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31)) return '';
  const nowYY = new Date().getFullYear() % 100;
  const year = yy > nowYY ? 1900 + yy : 2000 + yy;
  return `${String(dd).padStart(2, '0')}.${String(mm).padStart(2, '0')}.${year}`;
}

const sexOf = (c: string): MrzResult['gender'] => (c === 'M' ? 'male' : c === 'F' ? 'female' : '');

// OCR (ML Kit) collapses the «<<<<<<» filler runs, so line lengths can't be trusted. The anchor is
// the data block «birth(6) check sex expiry(6) check», found by its check digits; the other
// fields are read relative to it and to the start of the lines, where no fillers precede them.
const DIGITISH = /[0-9OQDUILTZSBG]/;

function findDataBlock(line: string) {
  for (let i = 0; i + 15 <= line.length; i++) {
    const w = line.slice(i, i + 15);
    if (![...w.slice(0, 7), ...w.slice(8, 15)].every((c) => DIGITISH.test(c))) continue;
    if (!/[MF<X]/.test(w[7])) continue;
    const birth = checked(w.slice(0, 6), w[6], true);
    const expiry = checked(w.slice(8, 14), w[14], true);
    if (birth && expiry) return { start: i, birth, sex: w[7] };
  }
  return null;
}

// Document number followed by its check digit; filler runs may be collapsed or dropped.
function docNumberFrom(field: string) {
  const f = field.replace(/<+/g, '<');
  for (let len = Math.min(9, f.length - 1); len >= 5; len--) {
    const num = f.slice(0, len).replace(/<+$/, '');
    const rest = f.slice(len).replace(/^<+/, '');
    if (!rest || num.includes('<')) continue;
    if (checkDigit(num) === digits(rest[0]) || checkDigit(digits(num)) === digits(rest[0])) return num;
  }
  return ''; // check digit never matched: a misread number is worse than an empty field
}

// Kazakhstan ID cards issued since 2020 leave the MRZ number and date lines empty («<<<…»): only
// the names line is filled. The rest is read from the printed card: the ИИН (12 digits, front)
// gives birth date and sex, the document number is the 9 digits on the back.
function iinValid(iin: string) {
  const d = [...iin].map(Number);
  const sum = (w: number[]) => w.reduce((a, x, k) => a + x * d[k], 0) % 11;
  let c = sum([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  if (c === 10) c = sum([3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2]);
  return c !== 10 && c === d[11];
}

function fromIin(iin: string) {
  const centuryAndSex = Number(iin[6]); // 1/2 — 1800s, 3/4 — 1900s, 5/6 — 2000s; odd = male
  if (centuryAndSex < 1 || centuryAndSex > 6) return null;
  const century = 1800 + Math.floor((centuryAndSex - 1) / 2) * 100;
  const [yy, mm, dd] = [iin.slice(0, 2), iin.slice(2, 4), iin.slice(4, 6)];
  if (!(Number(mm) >= 1 && Number(mm) <= 12 && Number(dd) >= 1 && Number(dd) <= 31)) return null;
  return {
    birthDate: `${dd}.${mm}.${century + Number(yy)}`,
    gender: (centuryAndSex % 2 ? 'male' : 'female') as MrzResult['gender'],
  };
}

// Kazakhstan cards: the back (names-only MRZ + 9-digit number) or the front alone (ИИН only;
// its names are Cyrillic, which the on-device OCR does not read). Missing fields stay empty and
// are filled from the other side — see mergeMrz.
function kzCard(ocrText: string, lines: string[]): MrzResult | null {
  const namesLine = lines.find((l) => /^[A-Z]{2,}(<[A-Z]+)*<<[A-Z]{2,}/.test(l.replace(/^<+/, '')));
  const names = namesLine ? parseNames(namesLine.replace(/^<+/, '')) : { lastName: '', firstName: '' };
  // OCR may split a long number with a space: take digit runs as printed and with spaces removed.
  const numbers = [
    ...(ocrText.match(/(?<![0-9])[0-9]{9,12}(?![0-9])/g) ?? []),
    ...(ocrText.match(/[0-9][0-9 ]{10,14}[0-9]/g) ?? []).map((n) => n.replace(/ /g, '')),
  ];
  const iin = numbers.find((n) => n.length === 12 && iinValid(n));
  const fromId = iin ? fromIin(iin) : null;
  const docNumber = namesLine ? (numbers.find((n) => n.length === 9) ?? '') : '';
  // Back: names line plus a number from the card; front: a valid ИИН.
  if (names.lastName ? !fromId && !docNumber : !fromId) return null;
  return {
    kind: 'id',
    ...names,
    docNumber,
    birthDate: fromId?.birthDate ?? '',
    gender: fromId?.gender ?? '',
    nationality: 'KAZ',
  };
}

// Two scans of the same document (front and back): fill the gaps of one from the other.
// Returns null when they disagree, i.e. they are two different documents.
export function mergeMrz(a: MrzResult, b: MrzResult): MrzResult | null {
  const fields = ['lastName', 'firstName', 'docNumber', 'birthDate', 'gender', 'nationality'] as const;
  if (fields.some((f) => a[f] && b[f] && a[f] !== b[f])) return null;
  const merged = { ...a };
  for (const f of fields) if (!merged[f]) (merged as Record<string, string>)[f] = b[f];
  merged.kind = a.kind === 'passport' || b.kind === 'passport' ? 'passport' : 'id';
  return merged;
}

/** Kazakhstan ID card side still missing after the scans so far, if any. */
export function missingKzSide(r: MrzResult): 'front' | 'back' | null {
  if (r.kind !== 'id' || r.nationality !== 'KAZ') return null;
  if (!r.lastName && !r.docNumber) return 'back'; // only the front (ИИН) has been read
  if (!r.birthDate) return 'front';
  return null;
}

export function parseMrz(ocrText: string): MrzResult | null {
  const lines = ocrText
    .split(/\n+/)
    .map(normaliseLine)
    .filter((l) => l.length >= 5);
  // ML Kit may also split one MRZ line in two: try each line glued to the next one as well.
  const candidates = [
    ...lines.map((line, i) => ({ line, i, span: 1 })),
    ...lines.slice(0, -1).map((line, i) => ({ line: line + lines[i + 1], i, span: 2 })),
  ];

  // A names line: surname, «<<», given name (ML Kit may glue noise to its ends).
  const namesNear = (from: number) => {
    for (const l of lines.slice(from, from + 2)) {
      const m = l.match(/[A-Z0-9]{2,}(<[A-Z0-9]+)*<<[A-Z0-9]{2,}/);
      if (m && !findDataBlock(l)) return parseNames(l.slice(m.index));
    }
    return { lastName: '', firstName: '' };
  };
  // TD1 line 1 «I? KAZ docnumber check …»; noise (a watermark letter) may precede it.
  const idLineBefore = (i: number) => {
    for (const l of lines.slice(Math.max(0, i - 3), i).reverse()) {
      const m = l.match(/[IAC][A-Z<][A-Z<]{3}[A-Z0-9<]{6}/);
      if (m) return l.slice(m.index);
    }
    return '';
  };

  for (const { line, i, span } of candidates) {
    const block = findDataBlock(line);
    if (!block) continue;
    const gender = sexOf(block.sex);

    if (block.start <= 5) {
      // TD1 (ID card): line 1 = type, issuer, doc number; line 2 = data; line 3 = names.
      // The names line is optional: a cut-off or covered one still leaves the number and dates.
      const l1 = idLineBefore(i);
      return {
        kind: 'id',
        ...namesNear(i + span),
        docNumber: l1 ? docNumberFrom(l1.slice(5)) : '',
        birthDate: birthToDots(block.birth),
        gender,
        nationality: letters(line.slice(block.start + 15, block.start + 18)).replace(/</g, ''),
      };
    }

    // TD3 (passport) / TD2: line 1 = type, issuer, names; line 2 = doc number, nationality, data.
    const l1 = lines[i - 1] ?? '';
    const names = parseNames(l1.slice(5));
    return {
      kind: /^P/.test(letters(l1[0] ?? '')) ? 'passport' : 'id',
      ...names,
      docNumber: docNumberFrom(line.slice(Math.max(0, block.start - 13), block.start - 3)),
      birthDate: birthToDots(block.birth),
      gender,
      nationality: letters(line.slice(block.start - 3, block.start)).replace(/</g, ''),
    };
  }
  return kzCard(ocrText, lines);
}

// Country names used by the guest forms (RU, EN) for the MRZ nationality codes.
const COUNTRY_BY_CODE: Record<string, [string, string]> = {
  KAZ: ['Казахстан', 'Kazakhstan'],
  RUS: ['Россия', 'Russia'],
  UZB: ['Узбекистан', 'Uzbekistan'],
  KGZ: ['Кыргызстан', 'Kyrgyzstan'],
  TUR: ['Турция', 'Turkey'],
  D: ['Германия', 'Germany'],
  DEU: ['Германия', 'Germany'],
  USA: ['США', 'USA'],
};

export const countryFromMrz = (code: string): [string, string] => COUNTRY_BY_CODE[code] ?? ['Другая', 'Other'];
