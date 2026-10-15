import type { Lang, TopicFamily } from '@/data/types';
import { PORTION, type Portion } from '@/state/openings';

type Plural = (n: number) => string;
type Weights = [string, string, string];

export type Strings = {
  hello: string;
  menu: string;
  back: string;
  ages: string;
  /** small word after the age number: «лет» */
  years: string;
  /** an age as a phrase: «7 лет» */
  ageLabel: (age: string) => string;
  solve: string;
  task: (n: number) => string;
  ofTotal: (a: number, b: number) => string;
  tasksCount: Plural;
  solvedOf: (a: number, b: number) => string;
  /** group headings by difficulty */
  levels: Weights;
  /** difficulty of one task in the first grade (no points there) */
  level: Weights;
  points: Plural;
  showAll: (n: number) => string;
  collapse: string;
  allDoneTitle: string;
  allDoneText: string;
  check: string;
  nextTask: string;
  pickHint: string;
  typeHint: string;
  missed: (left: number) => string;
  repeated: string;
  typeNumber: string;
  right: string;
  failedTitle: string;
  failedText: (answer: string) => string;
  howToSolve: string;
  picture: (n: number) => string;
  triesLeft: (n: number, of: number) => string;
  families: Record<TopicFamily, string>;
  answerOptions: string;
  digits: string;
  erase: string;
  wrongMark: string;
  rightMark: string;
  tileState: { solved: string; failed: string; next: string; ahead: string; locked: string };
  language: string;
  theme: string;
  themes: { sea: string; lilac: string; stone: string };
  tasksOnlyRussian: string;
  results: string;
  resultsSub: string;
  resultsNote: string;
  solvedWord: Plural;
  failedWord: string;
  aheadWord: string;
  byLevel: (counts: number[]) => string;
  restart: string;
  restartTitle: (age: string) => string;
  restartText: (age: string) => string;
  cancel: string;
  restarted: (age: string) => string;
  /** the next portion of tasks: «Задачи 21–40» */
  portionTitle: (p: Portion) => string;
  portionText: string;
  watchAd: string;
  /** asked on a tap on a locked task */
  portionAsk: (p: Portion) => string;
  portionAskText: string;
  portionOpened: (p: Portion) => string;
  adOffline: string;
  adDismissed: string;
  /** option letters as on the olympiad answer sheet */
  letters: string[];
};

function ruPlural(one: string, few: string, many: string): Plural {
  return (n) => {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };
}

const ruTasks = ruPlural('задача', 'задачи', 'задач');

const ru: Strings = {
  hello: 'Привет!\nРешаем?',
  menu: 'Меню',
  back: 'Назад',
  ages: 'Возраст',
  years: 'лет',
  ageLabel: (age) => `${age} лет`,
  solve: 'Решать',
  task: (n) => `Задача ${n}`,
  ofTotal: (a, b) => `${a} из ${b}`,
  tasksCount: (n) => `${n} ${ruTasks(n)}`,
  solvedOf: (a, b) => `Решено ${a} ${ruTasks(a)} из ${b}`,
  levels: ['Лёгкие', 'Средние', 'Трудные'],
  level: ['лёгкая', 'средняя', 'трудная'],
  points: (n) => `${n} ${ruPlural('балл', 'балла', 'баллов')(n)}`,
  showAll: (n) => `Показать все ${n}`,
  collapse: 'Свернуть',
  allDoneTitle: 'Все задачи пройдены',
  allDoneText:
    'Разбор можно посмотреть в любой задаче. Решать снова — через «Начать заново» в «Моих результатах».',
  check: 'Проверить',
  nextTask: 'Следующая задача',
  pickHint: 'Выбери ответ, потом нажми «Проверить»',
  typeHint: 'Набери ответ, потом нажми «Проверить»',
  missed: (left) =>
    `Не то. ${left === 1 ? 'Осталась 1 попытка' : `Осталось ${left} ${ruPlural('попытка', 'попытки', 'попыток')(left)}`}`,
  repeated: 'Этот ответ уже был',
  typeNumber: 'Набери число',
  right: 'Верно!',
  failedTitle: 'Попытки закончились',
  failedText: (a) => `Правильный ответ — ${a}. Эта задача закрыта, а разбор останется здесь.`,
  howToSolve: 'Как решать',
  picture: (n) => `Рисунок к задаче ${n}`,
  triesLeft: (n, of) => `Осталось попыток: ${n} из ${of}`,
  families: {
    count: 'Счёт',
    logic: 'Логика',
    shape: 'Фигуры',
    pattern: 'Перебор и пути',
    time: 'Время и календарь',
  },
  answerOptions: 'Варианты ответа',
  digits: 'Цифры',
  erase: 'Стереть',
  wrongMark: 'неверно',
  rightMark: 'правильный ответ',
  tileState: {
    solved: 'решена',
    failed: 'не решена, закрыта',
    next: 'следующая',
    ahead: 'не решена',
    locked: 'под замком, откроется после рекламы',
  },
  language: 'Язык',
  theme: 'Тема',
  themes: { sea: 'Море', lilac: 'Сирень', stone: 'Камень' },
  tasksOnlyRussian: '',
  results: 'Мои результаты',
  resultsSub: 'Сколько решено и начать возраст заново',
  resultsNote: `«Начать заново» снова даёт решать все задачи возраста, даже те, что не получились. Задачи после ${PORTION}-й снова откроются после рекламы.`,
  solvedWord: ruPlural('решена', 'решены', 'решено'),
  failedWord: 'не получилось',
  aheadWord: 'впереди',
  byLevel: (c) => `лёгких ${c[0]}, средних ${c[1]}, трудных ${c[2]}`,
  restart: 'Начать заново',
  restartTitle: (age) => `Начать «${age} лет» заново?`,
  restartText: (age) =>
    `Все задачи для ${age} лет снова станут нерешёнными, и их можно будет решать ещё раз. Результаты исчезнут, вернуть их нельзя. Задачи после ${PORTION}-й снова откроются после рекламы.`,
  cancel: 'Отмена',
  restarted: (age) => `${age} лет: можно решать заново`,
  portionTitle: ({ from, to }) => `Задачи ${from}–${to}`,
  portionText: `Посмотри рекламу, и эти задачи откроются. Задачи открываются по порядку, по ${PORTION}.`,
  watchAd: 'Смотреть рекламу',
  portionAsk: ({ from, to }) => `Открыть задачи ${from}–${to}?`,
  portionAskText: `Задачи открываются по порядку, по ${PORTION}. Чтобы открыть следующие, нужно посмотреть рекламу.`,
  portionOpened: ({ from, to }) => `Задачи ${from}–${to} открыты`,
  adOffline: 'Чтобы посмотреть рекламу, нужен интернет',
  adDismissed: 'Задачи откроются, если досмотреть рекламу до конца',
  letters: ['А', 'Б', 'В', 'Г', 'Д'],
};

const enPlural =
  (one: string, other: string): Plural =>
  (n) =>
    n === 1 ? one : other;
const LATIN = ['A', 'B', 'C', 'D', 'E'];

const en: Strings = {
  hello: 'Hi!\nReady to solve?',
  menu: 'Menu',
  back: 'Back',
  ages: 'Age',
  years: 'years',
  ageLabel: (age) => `${age} years`,
  solve: 'Solve',
  task: (n) => `Problem ${n}`,
  ofTotal: (a, b) => `${a} of ${b}`,
  tasksCount: (n) => `${n} ${enPlural('problem', 'problems')(n)}`,
  solvedOf: (a, b) => `Solved ${a} of ${b} problems`,
  levels: ['Easy', 'Medium', 'Hard'],
  level: ['easy', 'medium', 'hard'],
  points: (n) => `${n} ${enPlural('point', 'points')(n)}`,
  showAll: (n) => `Show all ${n}`,
  collapse: 'Show less',
  allDoneTitle: 'All problems done',
  allDoneText:
    'You can read the solution of any problem. To solve them again, use “Start over” in “My results”.',
  check: 'Check',
  nextTask: 'Next problem',
  pickHint: 'Pick an answer, then tap “Check”',
  typeHint: 'Type the answer, then tap “Check”',
  missed: (left) => `Not quite. ${left} ${enPlural('try', 'tries')(left)} left`,
  repeated: 'You already tried this answer',
  typeNumber: 'Type a number',
  right: 'Correct!',
  failedTitle: 'No tries left',
  failedText: (a) =>
    `The right answer is ${a}. This problem is closed, and the solution stays here.`,
  howToSolve: 'How to solve it',
  picture: (n) => `Picture for problem ${n}`,
  triesLeft: (n, of) => `Tries left: ${n} of ${of}`,
  families: {
    count: 'Numbers',
    logic: 'Logic',
    shape: 'Shapes',
    pattern: 'Patterns and paths',
    time: 'Time and calendar',
  },
  answerOptions: 'Answer options',
  digits: 'Digits',
  erase: 'Erase',
  wrongMark: 'wrong',
  rightMark: 'right answer',
  tileState: {
    solved: 'solved',
    failed: 'not solved, closed',
    next: 'next',
    ahead: 'not solved',
    locked: 'locked, opens after an ad',
  },
  language: 'Language',
  theme: 'Theme',
  themes: { sea: 'Sea', lilac: 'Lilac', stone: 'Stone' },
  tasksOnlyRussian: 'Problems are in Russian for now: their translation is on the way.',
  results: 'My results',
  resultsSub: 'What is solved, and starting an age over',
  resultsNote: `“Start over” lets you solve every problem of the age again, even the ones that didn’t work out. Problems after ${PORTION} open again after an ad.`,
  solvedWord: () => 'solved',
  failedWord: 'didn’t work out',
  aheadWord: 'ahead',
  byLevel: (c) => `easy ${c[0]}, medium ${c[1]}, hard ${c[2]}`,
  restart: 'Start over',
  restartTitle: (age) => `Start “${age} years” over?`,
  restartText: (age) =>
    `Every problem for ${age} years becomes unsolved again, and you can solve them once more. The results will be gone for good. Problems after ${PORTION} will open again after an ad.`,
  cancel: 'Cancel',
  restarted: (age) => `${age} years: you can solve them again`,
  portionTitle: ({ from, to }) => `Problems ${from}–${to}`,
  portionText: `Watch an ad to open these problems. Problems open in order, ${PORTION} at a time.`,
  watchAd: 'Watch an ad',
  portionAsk: ({ from, to }) => `Open problems ${from}–${to}?`,
  portionAskText: `Problems open in order, ${PORTION} at a time. To open the next ones, watch an ad.`,
  portionOpened: ({ from, to }) => `Problems ${from}–${to} are open`,
  adOffline: 'You need the internet to watch an ad',
  adDismissed: 'The problems open when the ad is watched to the end',
  letters: LATIN,
};

const es: Strings = {
  hello: '¡Hola!\n¿Resolvemos?',
  menu: 'Menú',
  back: 'Atrás',
  ages: 'Edad',
  years: 'años',
  ageLabel: (age) => `${age} años`,
  solve: 'Resolver',
  task: (n) => `Problema ${n}`,
  ofTotal: (a, b) => `${a} de ${b}`,
  tasksCount: (n) => `${n} ${enPlural('problema', 'problemas')(n)}`,
  solvedOf: (a, b) => `Resueltos ${a} de ${b} problemas`,
  levels: ['Fáciles', 'Medios', 'Difíciles'],
  level: ['fácil', 'media', 'difícil'],
  points: (n) => `${n} ${enPlural('punto', 'puntos')(n)}`,
  showAll: (n) => `Ver los ${n}`,
  collapse: 'Ver menos',
  allDoneTitle: 'Has hecho todos los problemas',
  allDoneText:
    'Puedes ver la solución de cualquier problema. Para resolverlos otra vez, usa «Empezar de nuevo» en «Mis resultados».',
  check: 'Comprobar',
  nextTask: 'Siguiente problema',
  pickHint: 'Elige una respuesta y pulsa «Comprobar»',
  typeHint: 'Escribe la respuesta y pulsa «Comprobar»',
  missed: (left) => `No es esa. ${left === 1 ? 'Queda 1 intento' : `Quedan ${left} intentos`}`,
  repeated: 'Ya probaste esta respuesta',
  typeNumber: 'Escribe un número',
  right: '¡Correcto!',
  failedTitle: 'Se acabaron los intentos',
  failedText: (a) =>
    `La respuesta correcta es ${a}. Este problema está cerrado y la solución se queda aquí.`,
  howToSolve: 'Cómo resolverlo',
  picture: (n) => `Dibujo del problema ${n}`,
  triesLeft: (n, of) => `Intentos restantes: ${n} de ${of}`,
  families: {
    count: 'Cálculo',
    logic: 'Lógica',
    shape: 'Figuras',
    pattern: 'Patrones y caminos',
    time: 'Tiempo y calendario',
  },
  answerOptions: 'Opciones de respuesta',
  digits: 'Dígitos',
  erase: 'Borrar',
  wrongMark: 'incorrecta',
  rightMark: 'respuesta correcta',
  tileState: {
    solved: 'resuelto',
    failed: 'no resuelto, cerrado',
    next: 'siguiente',
    ahead: 'no resuelto',
    locked: 'bloqueado, se abre tras un anuncio',
  },
  language: 'Idioma',
  theme: 'Tema',
  themes: { sea: 'Mar', lilac: 'Lila', stone: 'Piedra' },
  tasksOnlyRussian: 'Por ahora los problemas están en ruso: la traducción está en camino.',
  results: 'Mis resultados',
  resultsSub: 'Cuánto has resuelto y empezar una edad de nuevo',
  resultsNote: `«Empezar de nuevo» te deja resolver otra vez todos los problemas de la edad, incluso los que no salieron. Los problemas después del ${PORTION} se vuelven a abrir tras un anuncio.`,
  solvedWord: enPlural('resuelto', 'resueltos'),
  failedWord: 'no salieron',
  aheadWord: 'por hacer',
  byLevel: (c) => `fáciles ${c[0]}, medios ${c[1]}, difíciles ${c[2]}`,
  restart: 'Empezar de nuevo',
  restartTitle: (age) => `¿Empezar «${age} años» de nuevo?`,
  restartText: (age) =>
    `Todos los problemas de ${age} años volverán a estar sin resolver y podrás resolverlos otra vez. Los resultados se borrarán para siempre. Los problemas después del ${PORTION} se abrirán otra vez tras un anuncio.`,
  cancel: 'Cancelar',
  restarted: (age) => `${age} años: puedes resolverlos otra vez`,
  portionTitle: ({ from, to }) => `Problemas ${from}–${to}`,
  portionText: `Mira un anuncio y estos problemas se abrirán. Los problemas se abren en orden, de ${PORTION} en ${PORTION}.`,
  watchAd: 'Ver anuncio',
  portionAsk: ({ from, to }) => `¿Abrir los problemas ${from}–${to}?`,
  portionAskText: `Los problemas se abren en orden, de ${PORTION} en ${PORTION}. Para abrir los siguientes, hay que ver un anuncio.`,
  portionOpened: ({ from, to }) => `Problemas ${from}–${to} abiertos`,
  adOffline: 'Para ver el anuncio necesitas internet',
  adDismissed: 'Los problemas se abren si ves el anuncio hasta el final',
  letters: LATIN,
};

const frPlural =
  (one: string, other: string): Plural =>
  (n) =>
    n <= 1 ? one : other;

const fr: Strings = {
  hello: 'Salut !\nOn résout ?',
  menu: 'Menu',
  back: 'Retour',
  ages: 'Âge',
  years: 'ans',
  ageLabel: (age) => `${age} ans`,
  solve: 'Résoudre',
  task: (n) => `Problème ${n}`,
  ofTotal: (a, b) => `${a} sur ${b}`,
  tasksCount: (n) => `${n} ${frPlural('problème', 'problèmes')(n)}`,
  solvedOf: (a, b) => `${a} ${frPlural('problème résolu', 'problèmes résolus')(a)} sur ${b}`,
  levels: ['Faciles', 'Moyens', 'Difficiles'],
  level: ['facile', 'moyen', 'difficile'],
  points: (n) => `${n} ${frPlural('point', 'points')(n)}`,
  showAll: (n) => `Voir les ${n}`,
  collapse: 'Voir moins',
  allDoneTitle: 'Tous les problèmes sont faits',
  allDoneText:
    'Tu peux lire la solution de chaque problème. Pour les refaire, utilise « Recommencer » dans « Mes résultats ».',
  check: 'Vérifier',
  nextTask: 'Problème suivant',
  pickHint: 'Choisis une réponse, puis appuie sur « Vérifier »',
  typeHint: 'Tape la réponse, puis appuie sur « Vérifier »',
  missed: (left) =>
    `Pas tout à fait. ${left} ${frPlural('essai restant', 'essais restants')(left)}`,
  repeated: 'Tu as déjà essayé cette réponse',
  typeNumber: 'Tape un nombre',
  right: 'Bravo !',
  failedTitle: 'Plus d’essais',
  failedText: (a) => `La bonne réponse est ${a}. Ce problème est fermé, et la solution reste ici.`,
  howToSolve: 'Comment le résoudre',
  picture: (n) => `Dessin du problème ${n}`,
  triesLeft: (n, of) => `Essais restants : ${n} sur ${of}`,
  families: {
    count: 'Calcul',
    logic: 'Logique',
    shape: 'Formes',
    pattern: 'Suites et chemins',
    time: 'Heure et calendrier',
  },
  answerOptions: 'Réponses possibles',
  digits: 'Chiffres',
  erase: 'Effacer',
  wrongMark: 'faux',
  rightMark: 'bonne réponse',
  tileState: {
    solved: 'résolu',
    failed: 'non résolu, fermé',
    next: 'suivant',
    ahead: 'non résolu',
    locked: 'verrouillé, s’ouvre après une pub',
  },
  language: 'Langue',
  theme: 'Thème',
  themes: { sea: 'Mer', lilac: 'Lilas', stone: 'Pierre' },
  tasksOnlyRussian: 'Pour l’instant, les problèmes sont en russe : la traduction arrive.',
  results: 'Mes résultats',
  resultsSub: 'Ce qui est résolu, et recommencer un âge',
  resultsNote: `« Recommencer » permet de refaire tous les problèmes de l’âge, même ceux qui n’ont pas marché. Les problèmes après le ${PORTION}e se rouvrent après une pub.`,
  solvedWord: frPlural('résolu', 'résolus'),
  failedWord: 'pas réussis',
  aheadWord: 'à faire',
  byLevel: (c) => `faciles ${c[0]}, moyens ${c[1]}, difficiles ${c[2]}`,
  restart: 'Recommencer',
  restartTitle: (age) => `Recommencer « ${age} ans » ?`,
  restartText: (age) =>
    `Tous les problèmes pour ${age} ans redeviennent non résolus, et tu pourras les refaire. Les résultats seront effacés pour de bon. Les problèmes après le ${PORTION}e se rouvriront après une pub.`,
  cancel: 'Annuler',
  restarted: (age) => `${age} ans : tu peux les refaire`,
  portionTitle: ({ from, to }) => `Problèmes ${from}–${to}`,
  portionText: `Regarde une pub pour ouvrir ces problèmes. Ils s’ouvrent dans l’ordre, ${PORTION} par ${PORTION}.`,
  watchAd: 'Regarder une pub',
  portionAsk: ({ from, to }) => `Ouvrir les problèmes ${from}–${to} ?`,
  portionAskText: `Les problèmes s’ouvrent dans l’ordre, ${PORTION} par ${PORTION}. Pour ouvrir les suivants, il faut regarder une pub.`,
  portionOpened: ({ from, to }) => `Problèmes ${from}–${to} ouverts`,
  adOffline: 'Il faut internet pour regarder la pub',
  adDismissed: 'Les problèmes s’ouvrent si tu regardes la pub jusqu’au bout',
  letters: LATIN,
};

export const StringsByLang: Record<Lang, Strings> = { ru, en, es, fr };

export const LangNames: Record<Lang, string> = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};
