/* ==========================================================
   EDIT THIS FILE — everything on the invitation comes from here.
   The groom is always listed first. Dates and places below are still PLACEHOLDERS.
   ========================================================== */
window.WEDDING = {


  groom: {
    first: "Vivian",
    full: "Pakalapati Vivian Gnanasagar",
    title: "Software Engineer · DevOps",          // name tag beside the photo
    parents: "Son of Mr. Vidya Sagar, Electronics Design",      // TODO: father's name and occupation
    photo: "assets/Groom.jpg",
    crop: { x: 0.46, y: 0.0, w: 0.62 },
    model: "",                          // optional 3D avatar, e.g. "assets/groom.glb"
    quote: "Two are better than one.",
    verse: "Ecclesiastes 4:9"            // reference shown under the quote
  },
  
  bride: {
    first: "Shefali",
    full: "Madapa Theresa Shefali",
    title: "MD · Pediatrics",
    parents: "Daughter of Mr. Madapa Charles, Businessman",
    photo: "assets/Sanju.jpg",
    // Which part of the photo becomes the stardust portrait (fractions of the image):
    // x = horizontal centre of the face, y = top edge, w = crop width.
    crop: { x: 0.45, y: 0.0, w: 0.62 },
    model: "",                          // optional 3D avatar, e.g. "assets/bride.glb"
    quote: "I have found the one whom my soul loves.",
    verse: "Song of Songs 3:4"
  },
  

  // Main date/time of the wedding, with your timezone offset
  date: "2026-12-17T16:00:00+05:30",     // TODO: confirm the wedding time (date is correct)
  hashtag: "#VivianAndShefali",

  // Bible verses (NIV), in page order. Each one fills the screen between two sections.
  // Leave a text empty to hide that verse.
  verses: {
    love:      { text: "Love is patient, love is kind.",                                          ref: "1 Corinthians 13:4" },  // after the portraits
    joined:    { text: "Therefore what God has joined together, let no one separate.",            ref: "Mark 10:9" },           // after the ring
    beautiful: { text: "He has made everything beautiful in its time.",                           ref: "Ecclesiastes 3:11" },   // before our story
    rejoice:   { text: "This is the day the Lord has made; let us rejoice and be glad in it.",    ref: "Psalm 118:24" },        // before the celebration
    unity:     { text: "And over all these virtues put on love, which binds them all together in perfect unity.", ref: "Colossians 3:14" }, // before the gallery
    ruth:      { text: "Where you go I will go, and where you stay I will stay.",                 ref: "Ruth 1:16" },           // before the footer
    closing:   { text: "A cord of three strands is not quickly broken.",                          ref: "Ecclesiastes 4:12" }    // in the footer
  },

  events: [
    {
      name: "Engagement",
      start: "2026-12-11T18:00:00+05:30",  // TODO: confirm times (date is correct)
      end: "2026-12-11T21:00:00+05:30",
      venue: "Novotel Varun",
      address: "Vijayawada",
      mapUrl: ""                         // leave empty to auto-search the address on Google Maps
    },
    {
      name: "Marriage",
      start: "2026-12-17T16:00:00+05:30",  // TODO: confirm times (date is correct)
      end: "2026-12-17T17:30:00+05:30",
      venue: "Tivoli Gardens",
      address: "Hyderabad",
      mapUrl: ""
    }
  ],

  // Career timelines, side by side (groom left, bride right)
  journeys: {
    groom: [
      { years: "2011 – 2014",    title: "Computer Science Engineering",   place: "Karunya (Jesus Calls), Coimbatore" },
      { years: "2016 – 2018",    title: "Masters in Computer Science",    place: "USA" },
      { years: "2018 – 2022",    title: "Software Engineer",              place: "Visa, USA" },
      { years: "2022 – Present", title: "DevOps Engineer",                place: "Crédit Agricole, Singapore" }
    ],
    bride: [
      { years: "2014 – 2019",    title: "MBBS",                           place: "NRI Institution, Andhra Pradesh" },
      { years: "2022 – 2025",    title: "MD Pediatrics",                  place: "JSS Medical Institution, Mysore" },
      { years: "2025 – 2026",    title: "MD Pediatrics",                  place: "Yashoda Hospitals, Hyderabad" }
    ]
  },

  // "The promise" scroll scene, built from the two photos (used when there is no ring film).
  // Points are fractions of each photo: x across, y down. Change them if you swap photos.
  promise: {
    scrollLength: 4.5,                   // screen-heights of scrolling
    groomHand: { x: 0.454, y: 0.527 },   // where the ring starts (between his thumb and forefinger)
    brideRing: { x: 0.283, y: 0.583 },   // her ring finger, where the ring lands
    captions: [
      { text: "With this ring…",        from: 0.30, to: 0.62 },
      { text: "…I promise you forever", from: 0.76, to: 1.01 }
    ]
  },

  // Scroll film: run  tools/make-frames.sh your-video.mp4  and it appears after the heart.
  ringFilm: {
    scrollLength: 4,                     // how many screen-heights of scrolling the film lasts
    captions: [
      { text: "With this ring…",        from: 0.08, to: 0.45 },
      { text: "…I promise you forever", from: 0.62, to: 1.01 }
    ]
  },

  // Extra photos for the gallery, e.g. ["assets/g1.jpg", "assets/g2.jpg"]. Empty hides the section.
  gallery: ["assets/Sanju.jpg", "assets/Groom.jpg"],

  music: ""                              // optional background song, e.g. "assets/song.mp3"
};
