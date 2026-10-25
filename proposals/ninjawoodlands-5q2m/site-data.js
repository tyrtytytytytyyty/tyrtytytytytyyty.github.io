// NORTH STAR. Every fact and every image on this concept comes from this one file, and every
// value here comes from the gym's own site (usaninjachallenge.com/locations/the-woodlands-tx,
// scraped 2026-10-20 and 2026-10-25). Change a fact here and every page follows it.
// Anything we could NOT confirm is marked `null` and the page routes it to the text line
// instead of guessing.
window.NW = {
  name: "USA Ninja Challenge",
  location: "The Woodlands",
  tagline: "Building confidence, one obstacle at a time.",
  mission: "Our mission is to help every child feel *capable* and *empowered* in the gym and in life.",
  textLine: "+1 (000) 000-0000",          // the line's number goes here at go-live
  phone: "(281) 882-3222",
  email: "woodlands@usaninjachallenge.com",
  address: "21227 Blair Rd, Conroe, Texas 77385",
  timeZone: "America/Chicago",
  // Sun..Sat, [open, close] in decimal hours. Closed on holidays.
  hours: [[[14, 19.5]], [[14, 19.5]], [[15, 20.25]], [[11, 19.5]], [[14.5, 20]], [[14.5, 18.25]], [[8.5, 13.5], [14, 19.5]]],

  images: {
    logo: "media/orig/logo.png",
    hero: "media/orig/hero.jpg",
    camps: "media/orig/img-camps.jpg",
    parties: "media/orig/img-parties.jpg"
  },

  programs: [
    { id: "sidekicks", name: "Sidekicks", ages: "2.5–3", min: 2, max: 3, price: 90, len: "One 45-min class a week, with a parent", icon: "media/icons/sidekicks.png",
      desc: "Introduction to fundamental movement patterns. Focuses on balance, coordination, and following directions while having fun on age-appropriate ninja obstacles." },
    { id: "junior", name: "Junior Ninjas", ages: "4–5", min: 4, max: 5, price: 100, len: "One 50-min class a week", icon: "media/icons/junior.png",
      desc: "Introduction to a variety of obstacles and an interactive learning program. Focuses on strength, self-awareness, and coordination." },
    { id: "ninjas68", name: "Ninjas", ages: "6–8", min: 6, max: 8, price: 110, len: "One 1-hour class a week", icon: "media/icons/ninjas-6-8.png",
      desc: "A high-energy program designed to build strength, agility, and confidence through obstacle course training in a safe, supportive environment." },
    { id: "ninjas912", name: "Ninjas", ages: "9–12", min: 9, max: 12, price: 110, len: "One 1-hour class a week", icon: "media/icons/ninjas-9-12.png",
      desc: "A high-energy program designed to build strength, agility, and confidence through obstacle course training in a safe, supportive environment." },
    { id: "teen", name: "Teen Warriors", ages: "13–17", min: 13, max: 17, price: 110, len: "One 1-hour class a week", icon: "media/icons/teen.png",
      desc: "Ninja training for teens looking to push their physical limits. Emphasizes technical mastery, upper body strength, and personal goal setting." }
  ],

  pricing: [
    ["Ninja Classes", "Ages 6–17 · one 1-hour class a week", "$110", "/mo"],
    ["Junior Ninja Classes", "Ages 4–5 · one 50-min class a week", "$100", "/mo"],
    ["Sidekick Ninja Classes", "Ages 2–3 · one 45-min class a week, parent involved", "$90", "/mo"],
    ["Homeschool Ninja Classes", "Ages 5–17 · one 1-hour class a week · Special Deal", "$95", "/mo"],
    ["Competition Team", "Invite only · one 90-min class a week · coach & comp fees extra", "$125", "/mo"],
    ["Family Annual Membership", "Unlimited ninjas per family", "$50", "/yr"]
  ],
  pricingNote: "Every monthly plan includes four classes a month, sometimes a fifth. Sibling and multi-class discounts. 6- and 12-month payment options are the best value.",

  why: [
    ["💪", "Build Strength", "Full-body fitness through obstacle training"],
    ["🧠", "Develop Confidence", "Overcome challenges and build self-esteem"],
    ["🏆", "Progress & Achieve", "6-Level System"],
    ["😊", "Have Fun!", "Games, obstacles, and ninja adventures"]
  ],

  party: {
    price: 350, included: 15, extra: 10, max: 25, deposit: 100,
    points: [
      "90 minutes: 60 in the gym, 30 in the party room",
      "Two party coaches and the whole gym to yourselves",
      "Tables, chairs, setup and cleanup help",
      "Saturdays and Sundays · book 2+ weeks ahead",
      "Birthday ninja 5+, guests 4+"
    ],
    fine: "Bring your own cake, food, drinks, decorations and plates. No piñatas please!"
  },

  camps: {
    ages: "Ages 6–12",
    figures: [["$45", "Half day"], ["8:30–12", "Mornings"], ["Jun–Aug", "+ school breaks"]],
    text: "Weekly half-day sessions all summer, plus winter break, spring break and teacher workdays. Multi-day discounts available."
  },

  values: ["Confidence", "Community", "Fun", "Welcoming", "Growth"],
  brandLine: "Part of USA Ninja Challenge: 50 gyms nationwide since 2015, and a proud community partner of USA Pentathlon Multisport.",

  // [question, answer], from the gym's own FAQ accordions (classes, parties and about pages, 2026-10-25).
  faq: [
    ["What ages can take classes?", "We have programs for kids as young as 2.5 (with a parent) through teens. Each class is grouped by age and skill level so every ninja is challenged appropriately."],
    ["What does the Trial Class include?", "Your child gets a full trial class with our coaches so you can see the gym, meet the team, and make sure the program is the right fit before committing. If it's not the right fit, you don't enroll. No pressure, no obligation."],
    ["What is the dress code?", "Required for every athlete: a short-sleeve t-shirt or tank top, shorts, bare feet or indoor ninja shoes, and long hair tied back (no bobby pins). No jewelry, watches, long sleeves, pants, hoodies, dresses, gloves or grips. They catch on equipment."],
    ["Can parents watch?", "Absolutely! Parents are welcome to watch and cheer from the viewing area. Adults aren't allowed on the gym floor."],
    ["How big are the classes?", "Junior Ninjas 6:1, Ninjas 6–8 and 9–12 8:1, and Teen Warriors 10:1."],
    ["How do make-up classes work?", "Active members can schedule make-up classes for missed sessions, subject to availability, through the member portal."],
    ["Is there an annual membership fee?", "Yes. Active students pay a low annual membership fee that helps cover insurance, equipment maintenance and member-only events. The Family Annual Membership is $50 a year."],
    ["Can we bring food to a party?", "Yes. We provide tables, chairs and the party space. You bring the cake, food, drinks and decorations, and we're happy to recommend local pizza places!"]
  ],

  // Trial times by program, from the live iClassPro schedule (Mon–Thu captured 10/25; Fri/Sat not read).
  trialTimes: {
    sidekicks: [["Mon", "2:00 PM"], ["Wed", "12:30 PM"]],
    junior: [["Tue", "4:30 PM"], ["Wed", "4:00 PM"]],
    ninjas68: [["Mon", "4:00 PM"], ["Tue", "5:30 PM"], ["Wed", "4:00 PM"], ["Thu", "4:00 PM"]],
    ninjas912: [["Mon", "4:00 PM"], ["Tue", "5:30 PM"], ["Wed", "5:15 PM"], ["Thu", "4:00 PM"]],
    teen: [["Tue", "6:45 PM"]]
  },
  // Their own chat assistant's opener ("Ninja Assistant", Head Coach persona). The text line keeps the same voice.
  greeting: "Hey there, ninja family! 🥷💪",

  links: {
    schedule: "https://portal.iclasspro.com/usaninjawoodlands/classes",
    camps: "https://portal.iclasspro.com/usaninjawoodlands/camps",
    portal: "https://portal.iclasspro.com/usaninjawoodlands/login"
  },
  socials: [
    ["Instagram", "@usaninjachallengewoodlands", "https://www.instagram.com/usaninjachallengewoodlands/"],
    ["Facebook", "/usaninjachallengewoodlands", "https://www.facebook.com/usaninjachallengewoodlands"],
    ["YouTube", "The Woodlands channel", "https://www.youtube.com/@usaninjachallenge-thewoodl4620"]
  ]
};
