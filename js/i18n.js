// Copy follows docs/BRAND.md: du, `whit` always lowercase, lowercase headlines,
// no "tracken", no score, one exclamation mark at most, zero emoji.

export const MOOD_WORDS = {
  de: {
    0: ['furchtbar', 'schlecht', 'mäßig', 'okay', 'gut', 'sehr gut', 'fantastisch'],
    [-1]: ['hoffnungslos', 'bedrückt', 'müde', 'gelassen', 'entspannt', 'zufrieden', 'glückselig'],
    1: ['wütend', 'gestresst', 'unruhig', 'aufgedreht', 'motiviert', 'begeistert', 'euphorisch'],
  },
  en: {
    0: ['awful', 'bad', 'low', 'okay', 'good', 'great', 'amazing'],
    [-1]: ['hopeless', 'down', 'tired', 'mellow', 'content', 'serene', 'blissful'],
    1: ['furious', 'stressed', 'restless', 'wired', 'motivated', 'excited', 'euphoric'],
  },
};

export const STR = {
  de: {
    title: 'whit – halt fest, wie\'s dir geht.',
    play: 'Bei Google Play', playShort: 'Play Store',
    privacy: 'Datenschutz', del: 'Daten löschen', contact: 'Kontakt', menu: 'Menü',
    privacyHref: 'privacy-de.html',
    disclaimer: 'whit ist kein medizinisches Produkt und ersetzt keine Therapie oder Beratung.',
    personal: 'ein persönliches projekt.',
    langOther: 'EN', dec: ',',

    heroMeet: 'meet', heroWhit: 'whit.',
    heroSub: 'halt fest, wie’s dir geht und was du tust.\nwhit zeigt dir, was davon dir guttut.',
    heroChipMood: 'Stimmung', heroChipHabits: 'Gewohnheiten', heroChipSync: 'E2E-Sync', heroChipFree: 'Gratis · werbefrei · privat',
    heroMore: 'so geht’s', heroTryTouch: 'tipp irgendwo hin',
    scroll: 'scrollen',

    chapters: ['einchecken', 'kontext', 'verschlüsselt', 'muster', 'gewohnheiten', 'für alle'],

    // 01–03 · one whit, from the first touch to the cloud
    jA: 'wie geht’s dir gerade?',
    jB: 'und drumherum?',
    jC: 'nur du kannst es lesen.',
    steps: [
      ['ein regler, ein tropfen.', 'Scroll einfach weiter: Der Regler wandert, und der Tropfen nimmt Form und Farbe deiner Stimmung an. In der App schiebst du ihn selbst.'],
      ['spür nach.', 'Ruhig, neutral oder aufgeladen: Die Energie bewegt den Tropfen mit.'],
      ['ein wort.', 'Aus beidem wird ein Wort, eins von 21. Es trifft genauer als jede Zahl.'],
      ['dein schlaf.', 'Morgens fragt whit, wie lange und wie gut du geschlafen hast.'],
      ['was dazu beitrug.', 'Menschen, Orte, Wetter: ein Tipp pro Pill. Später zeigt whit, was davon dir guttut.'],
      ['ein satz, wenn du magst.', 'Ein Tipp auf die Notiz. Der Satz bleibt bei diesem Tag.'],
      ['gespeichert.', 'Auf deinem Handy. Ohne Konto bleibt alles genau dort.'],
      ['versiegelt.', 'Mit Konto wird jeder whit Ende-zu-Ende-verschlüsselt: auf deinem Handy, bevor er hochgeladen wird.'],
      ['das sieht die cloud.', 'Eine zufällige ID und einen Zeitpunkt. Der Rest ist Rauschen, auch für Google, den Server und mich.'],
    ],
    evening: ['deine bewegung.', 'Abends fragt whit, wie viel du dich bewegt hast und wie intensiv.'],
    morning: 'morgens', eveningL: 'abends',
    compareHint: 'fahr mit der maus drüber', compareHintTouch: 'wisch über die karte',
    moodTitle: 'Wie geht’s dir?', next: 'Weiter', finish: 'Fertig',
    sleepPrompt: 'Wie hast du geschlafen?', activityPrompt: 'Wie aktiv warst du?',
    qualityTitle: 'Qualität', intensity: 'Intensität',
    sleepL: ['< 6 Std', '6–7 Std', '7–8 Std', '8–9 Std', '9+ Std'],
    actL: ['0 min', '0–20 min', '20–60 min', '60–120 min', '> 120 min'],
    tagsPrompt: 'Was könnte zu deiner Stimmung beigetragen haben?',
    tagGroups: [['Menschen', [['family', 'Familie'], ['people', 'Freunde'], ['heart', 'Partner']]],
      ['Orte', [['home', 'Zuhause'], ['briefcase', 'Arbeit'], ['walk', 'Draußen']]],
      ['Wetter', [['sun', 'Sonnig'], ['rain', 'Regnerisch']]]],
    tagOn: [1, 4, 6],
    note: 'Mega produktiver Tag, die Präsentation ist endlich fertig. Nur die Kaffeemaschine hat schlappgemacht.',
    greeting: 'guten abend',
    exMood: 'sieben stufen', exEnergy: 'drei energien', exWord: 'ein wort pro mischung',
    energyL: ['ruhig', 'neutral', 'aufgeladen'],
    hd: { streak: 'Serie', total: 'Tage gesamt', record: 'Rekord', activity: 'Aktivität', mood: 'Stimmung', with: 'mit', without: 'ohne', goal: 'Wochenziel', perWeek: '3 × pro Woche', days: 'T' },
    toTop: 'Nach oben',
    noteTitle: 'Notiz',
    saved: 'gespeichert',
    cloudSees: 'was die cloud sieht',

    // 04 · patterns
    pH: 'sieh, was dir guttut.',
    pSteps: [
      ['schlaf.', 'An Tagen mit 8 Stunden Schlaf und mehr liegt deine Stimmung einen ganzen Schritt höher.'],
      ['laufen.', 'Ein zweites Muster, ganz für sich: Jeder whit wird Teil seines Tages. Die Tage, an denen du gelaufen bist, stechen heraus.'],
      ['deine woche.', 'Samstag oben, Mittwoch unten: dein Rhythmus auf einen Blick.'],
    ],
    pFactors: [['moon', 'Schlaf'], ['run', 'Laufen'], ['calendar', 'Wochentag']],
    pLess: 'unter 8 Std', pMore: '8 Std und mehr', pBest: 'samstags',
    days: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],

    // 05 · habits
    hH: 'abhaken mit einem wisch.',
    hSteps: [
      ['kleine gewohnheiten.', 'Laufen, Wasser, Lesen. Direkt neben deiner Stimmung.'],
      ['nach links: erledigt.', 'Ein Wisch, und der Tag ist abgehakt. Nach rechts löscht.'],
      ['ziele, die tragen.', 'Der Ring zeigt dein Wochenziel. Und whit freut sich mit dir, wenn du es schaffst.'],
    ],
    habits: [['run', 'Laufen', 2, 3, 17], ['water', 'Wasser', 2, 3, 25], ['book', 'Lesen', 0, 0, 3]],
    habitsTitle: 'Gewohnheiten', streak: 'T Serie', goalDone: 'wochenziel geschafft',

    // 06 · for everyone
    fSteps: [
      ['privat.', 'Ohne Konto nutzbar. Export und Löschen jederzeit, mit einem Tipp.', 'lock', 'kein konto nötig'],
      ['werbefrei.', 'Keine Werbe-IDs, keine Tracker, keine Nutzungsmessung in der App.', 'view_off', 'niemand schaut mit'],
      ['kostenlos.', 'Ein persönliches Projekt, ohne Investoren und ohne Geschäftsmodell, das deine Daten bräuchte.', 'heart', 'für immer'],
    ],

    ctaL: 'hol dir', ctaR: 'whit.',
    ctaP: 'Kostenlos und werbefrei, auf Deutsch und Englisch.',
  },
  en: {
    title: 'whit – capture how you feel.',
    play: 'Get it on Google Play', playShort: 'Play Store',
    privacy: 'Privacy', del: 'Delete data', contact: 'Contact', menu: 'Menu',
    privacyHref: 'privacy.html',
    disclaimer: 'whit is not a medical product and does not replace therapy or counselling.',
    personal: 'a personal project.',
    langOther: 'DE', dec: '.',

    heroMeet: 'meet', heroWhit: 'whit.',
    heroSub: 'note how you feel and what you do.\nwhit shows you what does you good.',
    heroChipMood: 'Mood', heroChipHabits: 'Habits', heroChipSync: 'E2E sync', heroChipFree: 'Free · ad-free · private',
    heroMore: 'see how', heroTryTouch: 'tap anywhere',
    scroll: 'scroll',

    chapters: ['check in', 'context', 'encrypted', 'patterns', 'habits', 'for everyone'],

    jA: 'how are you right now?',
    jB: 'and around it?',
    jC: 'only you can read it.',
    steps: [
      ['one slider, one drop.', 'Just keep scrolling: the slider moves, and the drop takes on the shape and colour of your mood. In the app you slide it yourself.'],
      ['feel it.', 'Calm, neutral or charged: the energy moves the drop too.'],
      ['one word.', 'Both become a word, one of 21. It lands closer than any number.'],
      ['your sleep.', 'In the morning whit asks how long and how well you slept.'],
      ['what played a part.', 'People, places, weather: one tap per pill. Later whit shows you which of them do you good.'],
      ['a line, if you like.', 'One tap on the note. The line stays with this day.'],
      ['saved.', 'On your phone. Without an account, that’s exactly where it stays.'],
      ['sealed.', 'With an account, every whit is end-to-end encrypted: on your phone, before it is uploaded.'],
      ['what the cloud sees.', 'A random ID and a timestamp. The rest is noise, for Google, the server and me.'],
    ],
    evening: ['your movement.', 'In the evening whit asks how much you moved and how hard.'],
    morning: 'morning', eveningL: 'evening',
    compareHint: 'hover over the card', compareHintTouch: 'swipe across the card',
    moodTitle: 'How are you?', next: 'Next', finish: 'Done',
    sleepPrompt: 'How was your sleep?', activityPrompt: 'How active were you?',
    qualityTitle: 'Quality', intensity: 'Intensity',
    sleepL: ['< 6 hrs', '6–7 hrs', '7–8 hrs', '8–9 hrs', '9+ hrs'],
    actL: ['0 min', '0–20 min', '20–60 min', '60–120 min', '> 120 min'],
    tagsPrompt: 'What could have contributed to your mood?',
    tagGroups: [['People', [['family', 'Family'], ['people', 'Friends'], ['heart', 'Partner']]],
      ['Places', [['home', 'Home'], ['briefcase', 'Work'], ['walk', 'Outside']]],
      ['Weather', [['sun', 'Sunny'], ['rain', 'Rainy']]]],
    tagOn: [1, 4, 6],
    note: 'Productive day, finally nailed the presentation. The coffee machine gave up on me though.',
    greeting: 'good evening',
    exMood: 'seven steps', exEnergy: 'three energies', exWord: 'one word per mix',
    energyL: ['calm', 'neutral', 'charged'],
    hd: { streak: 'Streak', total: 'Total days', record: 'Record', activity: 'Activity', mood: 'Mood', with: 'with', without: 'without', goal: 'Weekly goal', perWeek: '3 × a week', days: 'd' },
    toTop: 'Back to top',
    noteTitle: 'Note',
    saved: 'saved',
    cloudSees: 'what the cloud sees',

    pH: 'see what does you good.',
    pSteps: [
      ['sleep.', 'On days with 8 hours of sleep or more, your mood sits a whole step higher.'],
      ['running.', 'A second pattern, on its own: every whit becomes part of its day. The days you ran stand out.'],
      ['your week.', 'Saturday up, Wednesday down: your rhythm at a glance.'],
    ],
    pFactors: [['moon', 'Sleep'], ['run', 'Running'], ['calendar', 'Weekday']],
    pLess: 'under 8 hrs', pMore: '8 hrs or more', pBest: 'on saturdays',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

    hH: 'tick off with one swipe.',
    hSteps: [
      ['small habits.', 'Running, water, reading. Right next to your mood.'],
      ['swipe left: done.', 'One swipe and the day is ticked off. Swipe right to delete.'],
      ['goals that carry.', 'The ring shows your weekly goal. And whit is glad with you when you make it.'],
    ],
    habits: [['run', 'Running', 2, 3, 17], ['water', 'Water', 2, 3, 25], ['book', 'Reading', 0, 0, 3]],
    habitsTitle: 'Habits', streak: 'd streak', goalDone: 'weekly goal reached',

    fSteps: [
      ['private.', 'Works without an account. Export and delete any time, with one tap.', 'lock', 'no account needed'],
      ['ad-free.', 'No advertising IDs, no trackers, no usage analytics in the app.', 'view_off', 'nobody watching'],
      ['free.', 'A personal project, no investors, no business model that would need your data.', 'heart', 'forever'],
    ],

    ctaL: 'get', ctaR: 'whit.',
    ctaP: 'Free and ad-free, in English and German.',
  },
};
