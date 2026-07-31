// Quote bank for "Boss or Kid?"
//
// Each entry:
//   text   - the quote, verbatim
//   source - 'kid' or 'boss'  (the answer)
//   note   - optional line shown under the verdict, for context/punchline
//   video  - optional YouTube proof clip, auto-played after the guess.
//            Either a bare id:      video: 'aqz-KE-bpKQ'
//            or with a timestamp:   video: { id: 'aqz-KE-bpKQ', start: 42, end: 55 }
//            start/end are seconds. Leave it off for quotes with no footage —
//            most entries should have none, so the clip stays a surprise.
//
// Swap these placeholders for your real boss quotes. Keep both lists roughly
// the same length so the game does not become guessable by frequency alone.

const QUOTES = [
  // ---------------------------------------------------------------- kid ----
  // https://www.youtube.com/shorts/Wt9aQjPq7u4
  { text: "You understand? That's not funny. That's not really funny.", source: 'kid', video: {id: 'Wt9aQjPq7u4', start: 20, end: 27}},
  { text: "That wasn't very nice. Want me to do to you?", source: 'kid', video: {id: 'Wt9aQjPq7u4', start: 0, end: 12}},
  { text: "So I can boss everyone around, all the time...", source: 'kid', video: {id: 'wkPuoa_eIP0', start: 12, end: 23} },
  { text: "Connection is fun.", source: 'kid', video: "IYRRHIIs55M"},
  { text: "I carry a book everywhere I go.", source: "kid", video: {id: "Ni7h3LtiFbo", start: 32, end: 39}},
  { text: "I'm doing some work, you need to be patient.", source: "kid", video: {id: "ZCtT9WgpgYQ", start: 269, end: 282}},
  { text: "I challenge you to learn one new thing this week.", source: "kid", video: {id: "M3H5jtc5CWM", start: 616, end: 629}},



  // --------------------------------------------------------------- boss ----
  { text: "Can you sing happy birthday to me?", source: 'boss' },
  { text: "My aura is so big!", source: 'boss', note: 'When asked about why an employee looks nervous talking to him.' },
  { text: "Because I am a diva!", source: 'boss', note: 'When comparing themselves to a client.' },
  { text: "Sunday don't need to work, just watch YouTube videos.", source: 'boss', note: 'As in watching design knowledge videos, when recommending what to do to stay productive during the weekend.'},
  { text: "I want to go and roll in my bed...", source: 'boss', note: 'How the meeting ended.' },
  { text: "You don't even follow me!", source: 'boss', note: 'When asked about the firm\'s Instagram page.' },
  { text: "I want to see your sister's face.", source: 'boss'},
  { text: "What does your mom do?", source: "boss"},
  { text: "This is where I learned how to cycle!", source: "boss", note: "When giving a tour around their childhood neighborhood."},
  { text: "Everything I say will happen.", source: "boss"},
  { text: "Careful, there is a water devil here...", source: "boss", note: "When passing by a river near their old house."},
  { text: "Can you be friendlier to me?", source: "boss"},
  { text: "I want to swing something at you.", source: "boss"},

];

// Expose for app.js (plain script tag, no bundler, no modules -> works on
// GitHub Pages and from file:// during local testing).
window.QUOTES = QUOTES;
