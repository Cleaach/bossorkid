/* =========================================================================
   Boss or Kid? — game logic
   No framework, no build step. Loaded after quotes.js.
   ========================================================================= */

(function () {
  'use strict';

  const ROUNDS = 10;
  const STORAGE_KEY = 'bossOrKid.best';

  const RANKS = [
    { min: 10, label: 'HR SHOULD HIRE YOU' },
    { min: 8,  label: 'CERTIFIED BOSS WHISPERER' },
    { min: 6,  label: 'SOLID INSTINCTS' },
    { min: 4,  label: 'LET\'S CIRCLE BACK' },
    { min: 2,  label: 'ARE YOU EVEN LISTENING?' },
    { min: 0,  label: 'YOU MAY BE THE KID' },
  ];

  /* --- element lookups --------------------------------------------------- */
  const $ = (id) => document.getElementById(id);

  const screens = {
    start:   $('screen-start'),
    quiz:    $('screen-quiz'),
    results: $('screen-results'),
  };

  const el = {
    btnStart:    $('btn-start'),
    btnNext:     $('btn-next'),
    btnAgain:    $('btn-again'),
    btnHome:     $('btn-home'),
    bestLine:    $('best-line'),
    bestScore:   $('best-score'),
    hudProgress: $('hud-progress'),
    hudScore:    $('hud-score'),
    hudStreak:   $('hud-streak'),
    progressbar: $('progressbar'),
    progressFill:$('progressbar-fill'),
    quoteText:   $('quote-text'),
    answers:     $('answers'),
    verdict:     $('verdict'),
    verdictCard: $('verdict-card'),
    verdictHead: $('verdict-headline'),
    verdictDet:  $('verdict-detail'),
    videoCard:   $('verdict-video'),
    videoFrame:  $('video-frame'),
    finalScore:  $('final-score'),
    scoreRank:   $('score-rank'),
    statStreak:  $('stat-streak'),
    statTime:    $('stat-time'),
    statBest:    $('stat-best'),
    reviewList:  $('review-list'),
  };

  const answerButtons = Array.from(el.answers.querySelectorAll('[data-answer]'));

  /* --- state ------------------------------------------------------------- */
  let deck = [];        // the 10 quotes for this run
  let index = 0;        // current round, 0-based
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let startedAt = 0;
  let elapsedMs = 0;
  let locked = false;   // true between answering and pressing Next
  let history = [];     // { text, source, guess, correct }

  /* --- helpers ----------------------------------------------------------- */

  // Fisher-Yates. Returns a new array; never mutates the source bank.
  function shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // Draw ROUNDS quotes, balanced between kid and boss so the deck itself
  // never gives the answer away.
  function buildDeck() {
    const kids  = shuffle(QUOTES.filter((q) => q.source === 'kid'));
    const bosses = shuffle(QUOTES.filter((q) => q.source === 'boss'));
    const half = Math.floor(ROUNDS / 2);
    const picked = kids.slice(0, half).concat(bosses.slice(0, ROUNDS - half));

    // Top up from whatever is left if one side is short.
    if (picked.length < ROUNDS) {
      const rest = shuffle(QUOTES.filter((q) => !picked.includes(q)));
      picked.push(...rest.slice(0, ROUNDS - picked.length));
    }
    return shuffle(picked);
  }

  function showScreen(name) {
    Object.keys(screens).forEach((key) => { screens[key].hidden = key !== name; });
    window.scrollTo(0, 0);
  }

  function readBest() {
    const raw = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(raw) && raw >= 0 && raw <= ROUNDS ? raw : 0;
  }

  function writeBest(value) {
    try { localStorage.setItem(STORAGE_KEY, String(value)); } catch (e) { /* private mode */ }
  }

  function refreshBestLine() {
    const best = readBest();
    el.bestLine.hidden = best === 0;
    el.bestScore.textContent = best + '/' + ROUNDS;
  }

  const label = (source) => (source === 'kid' ? "IT'S A KID" : "IT'S MY BOSS");

  /* --- proof video ------------------------------------------------------- */

  // Tearing the iframe out is what actually stops the audio; hiding it is not
  // enough. Called on every round change, so a clip never bleeds into the next
  // question or the results screen.
  function clearVideo() {
    el.videoFrame.innerHTML = '';
    const link = el.videoCard.querySelector('.video-link');
    if (link) link.remove();
    el.videoCard.hidden = true;
  }

  function watchLink(href, text) {
    const a = document.createElement('a');
    a.className = 'video-link';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = text;
    return a;
  }

  // `video` accepts 'YOUTUBE_ID' or { id, start, end } with seconds.
  function showVideo(video) {
    clearVideo();
    if (!video) return;

    const conf = typeof video === 'string' ? { id: video } : video;
    if (!conf.id) return;

    const watchUrl = 'https://www.youtube.com/watch?v=' + conf.id +
      (conf.start ? '&t=' + conf.start : '');

    // YouTube will not configure a player for a page with no real origin, which
    // is exactly what file:// reports — that is the "Error 153" screen. Serving
    // over http(s), including GitHub Pages, is fine; off disk, link out instead
    // of embedding a player that is guaranteed to fail.
    if (location.protocol === 'file:') {
      el.videoCard.append(watchLink(watchUrl, 'Open the clip on YouTube ↗'));
      el.videoFrame.hidden = true;
      el.videoCard.hidden = false;
      return;
    }
    el.videoFrame.hidden = false;

    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      playsinline: '1',
      // Declaring the origin is what the player validates against; it also
      // keeps the embed working when the page is framed.
      origin: location.origin,
    });
    if (conf.start) params.set('start', String(conf.start));
    if (conf.end) params.set('end', String(conf.end));

    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + conf.id + '?' + params.toString();
    iframe.title = 'Proof clip';
    // Delegating autoplay permission to the cross-origin frame. Combined with
    // the click/keypress that got us here, this is what lets it start on its own.
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;

    el.videoFrame.append(iframe);
    // Escape hatch: embeds can still be refused (owner disabled embedding,
    // regional block, strict privacy settings). The link always works.
    el.videoCard.append(watchLink(watchUrl, 'Trouble playing? Watch on YouTube ↗'));
    el.videoCard.hidden = false;
  }

  /* --- game flow --------------------------------------------------------- */

  function startGame() {
    deck = buildDeck();
    index = 0;
    score = 0;
    streak = 0;
    bestStreak = 0;
    history = [];
    startedAt = Date.now();
    showScreen('quiz');
    renderRound();
  }

  function renderRound() {
    locked = false;
    const q = deck[index];

    el.quoteText.textContent = q.text;
    el.hudProgress.textContent = (index + 1) + ' / ' + ROUNDS;
    el.hudScore.textContent = 'SCORE ' + score;
    el.hudStreak.hidden = streak < 2;
    el.hudStreak.textContent = '🔥 ' + streak;

    const pct = (index / ROUNDS) * 100;
    el.progressFill.style.width = pct + '%';
    el.progressbar.setAttribute('aria-valuenow', String(index));

    answerButtons.forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove('is-right', 'is-wrong', 'is-muted');
    });

    el.answers.hidden = false;
    el.verdict.hidden = true;
    el.verdictDet.hidden = true;
    clearVideo();
  }

  function answer(guess) {
    if (locked) return;
    locked = true;

    const q = deck[index];
    const correct = guess === q.source;

    if (correct) {
      score++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      streak = 0;
    }

    history.push({ text: q.text, source: q.source, guess: guess, correct: correct });

    answerButtons.forEach((btn) => {
      const value = btn.dataset.answer;
      btn.disabled = true;
      if (value === q.source) btn.classList.add('is-right');
      else if (value === guess) btn.classList.add('is-wrong');
      else btn.classList.add('is-muted');
    });

    el.hudScore.textContent = 'SCORE ' + score;
    el.hudStreak.hidden = streak < 2;
    el.hudStreak.textContent = '🔥 ' + streak;

    el.verdictCard.classList.toggle('is-right', correct);
    el.verdictCard.classList.toggle('is-wrong', !correct);

    // The headline names the speaker. The tick/cross keeps right-vs-wrong
    // legible without relying on the card colour alone.
    el.verdictHead.textContent = (correct ? '✓ ' : '✗ ') + label(q.source);

    el.verdictDet.textContent = q.note || '';
    el.verdictDet.hidden = !q.note;

    showVideo(q.video);

    el.verdict.hidden = false;
    el.btnNext.textContent = index === ROUNDS - 1 ? 'SEE RESULTS →' : 'NEXT →';
    el.btnNext.focus();
  }

  function next() {
    index++;
    if (index >= ROUNDS) finish();
    else renderRound();
  }

  function finish() {
    elapsedMs = Date.now() - startedAt;
    clearVideo();

    el.progressFill.style.width = '100%';
    el.finalScore.textContent = String(score);
    el.scoreRank.textContent = (RANKS.find((r) => score >= r.min) || RANKS[RANKS.length - 1]).label;
    el.statStreak.textContent = String(bestStreak);
    el.statTime.textContent = Math.round(elapsedMs / 1000) + 's';

    const best = Math.max(readBest(), score);
    writeBest(best);
    el.statBest.textContent = best + '/' + ROUNDS;
    refreshBestLine();

    renderReview();
    showScreen('results');
  }

  function renderReview() {
    el.reviewList.innerHTML = '';
    history.forEach((row) => {
      const li = document.createElement('li');
      li.className = 'review-item ' + (row.correct ? 'is-right' : 'is-wrong');

      const mark = document.createElement('span');
      mark.className = 'mark';
      mark.textContent = row.correct ? '✓' : '✗';

      const body = document.createElement('div');
      const quote = document.createElement('span');
      quote.textContent = '“' + row.text + '”';
      const who = document.createElement('span');
      who.className = 'who';
      who.textContent = row.source === 'kid' ? '— A KID' : '— THE BOSS';

      body.append(quote, who);
      li.append(mark, body);
      el.reviewList.append(li);
    });
  }

  function goHome() {
    refreshBestLine();
    showScreen('start');
  }

  /* --- wiring ------------------------------------------------------------ */

  // Bind defensively: if the markup is edited and an id goes missing, log it
  // and keep wiring the rest instead of throwing and killing every listener
  // that comes after.
  function on(node, name, event, handler) {
    if (!node) {
      console.warn('[Boss or Kid?] missing element: #' + name + ' — its button will do nothing.');
      return;
    }
    node.addEventListener(event, handler);
  }

  on(el.btnStart, 'btn-start', 'click', startGame);
  on(el.btnAgain, 'btn-again', 'click', startGame);
  on(el.btnNext,  'btn-next',  'click', next);
  on(el.btnHome,  'btn-home',  'click', goHome);

  answerButtons.forEach((btn) => {
    btn.addEventListener('click', () => answer(btn.dataset.answer));
  });

  document.addEventListener('keydown', (event) => {
    if (screens.quiz.hidden) return;
    if (event.key === '1') answer('kid');
    else if (event.key === '2') answer('boss');
    // Enter on the focused Next button already fires a click; only handle the
    // case where focus is somewhere else.
    else if (event.key === 'Enter' && locked && event.target !== el.btnNext) {
      event.preventDefault();
      next();
    }
  });

  refreshBestLine();
})();
