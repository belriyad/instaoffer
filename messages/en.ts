const en = {
  // Navbar
  nav: {
    sell: 'Sell My Car',
    dealers: 'For Dealers',
    howItWorks: 'How It Works',
    signIn: 'Sign In',
    getEstimate: 'Get Estimate',
    dashboard: 'Dashboard',
    signOut: 'Sign Out',
    langToggle: 'عربي',
    browseCars: 'Browse Cars',
    account: 'Account',
    myAccount: 'My Account',
    dealerAccount: 'Dealer Account',
    myOffers: 'My Offers',
    myProfile: 'My Profile',
    browseCarsDesc: 'Dealer inventory across Qatar',
    secBrowse: 'Browse',
    secSell: 'Sell Your Car',
    secDealers: 'Dealers',
    secAccount: 'Account',
    getInstantOffer: 'Get Instant Offer',
    getInstantOfferDesc: 'Free valuation in 60 seconds',
    howItWorksDesc: 'Step-by-step seller guide',
    forDealersDesc: 'Grow your acquisition pipeline',
    dealerDashboard: 'Dealer Dashboard',
    dealerDashboardDesc: 'Leads, bids & analytics',
    roleSeller: 'Seller',
    roleDealer: 'Dealer',
    searchCars: 'Search make, model, dealer…',
    findCar: 'Find my next car',
    findCarDesc: 'Dealers bring the car to you',
  },

  // Auth / login
  auth: {
    welcomeBack: 'Welcome back',
    createAccount: 'Create your account',
    loginSub: 'Sign in to view your offers and messages',
    registerSub: 'Sign up free — get real dealer offers on your car',
    signInTab: 'Sign In',
    signUpTab: 'Sign Up',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Your full name',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    forgotPassword: 'Forgot password?',
    minChars: 'Minimum 8 characters',
    submitSignIn: 'Sign In',
    submitCreate: 'Create Free Account',
    termsPrefix: 'By continuing, you agree to our',
    terms: 'Terms',
    and: 'and',
    privacy: 'Privacy Policy',
    phoneNote: 'Your phone number is never shared without your approval.',
    dealerQ: 'Are you a dealer?',
    dealerLogin: 'Dealer login →',
    errNameShort: 'Please enter your full name (at least 2 characters).',
    errEmail: 'Please enter a valid email address.',
    errPassword: 'Password must be at least 8 characters.',
    errGeneric: 'Something went wrong. Please try again.',
  },

  // Hero
  hero: {
    badge: "🇶🇦 Designed for Qatar's car market",
    h1: 'Sell Your Car Fast.\nGet Dealer Offers Today.',
    sub: 'Free valuation in 2 minutes. Verified dealers compete. You choose the best offer.',
    ctaSell: 'Sell My Car Fast — Free',
    ctaValuation: 'Just want a valuation →',
    orChoose: 'Or choose what fits you best:',
    getStarted: 'Get started',
    finalCtaH2: 'Ready to sell your car?',
    finalCtaSub: 'It takes less than 5 minutes. No sign-up required to get your estimate.',
    finalCtaBtn: 'Get My Free Valuation',
  },

  // Intent cards
  intent: {
    value: { label: 'Know my car value', desc: 'Get an instant AI-powered estimate based on real Qatar market data.' },
    urgent: { label: 'Sell my car fast', desc: 'Urgent sale? Get offers from dealers within hours, not weeks.', badge: 'Popular' },
    trade: { label: 'Trade in my car', desc: 'Sell your current car and upgrade in one seamless transaction.' },
    buy: { label: 'Find my next car', desc: 'Tell us what you want and dealers will bring it to you.' },
  },

  // Trust pills
  trust: {
    noSignup: 'No sign-up to get estimate',
    phonePrivate: 'Phone number stays private',
    nonBinding: 'Non-binding offers',
    free: 'Free to use',
  },

  // Social proof
  proof: {
    carsSold: 'Cars Sold',
    dealers: 'Verified Dealers',
    speed: 'To Get Estimate',
    free: 'Free for Sellers',
    asOf: 'as of',
  },

  // How it works
  how: {
    eyebrow: 'Simple Process',
    h2: 'How InstaOffer Works',
    sub: 'From your couch to a sold car — in 5 steps.',
    step: 'Step',
    steps: [
      { title: 'Enter Car Details',      desc: 'Make, model, year, mileage — takes 2 minutes.' },
      { title: 'Get 3 Valuations',       desc: 'Private sale estimate, trade-in value, and instant offer — all in one result.' },
      { title: 'Request Dealer Offers',  desc: 'Create a free account and let verified dealers compete for your car.' },
      { title: 'Compare Offers',         desc: 'Side-by-side view. No pressure. No obligation.' },
      { title: 'Choose & Close',         desc: "Accept the offer that works for you. That's it." },
    ],
  },

  // Trust section
  trustSection: {
    eyebrow: 'Why Sellers Trust Us',
    h2: 'Built Around Your Privacy',
    sub: 'InstaOffer was designed so you stay in control at every step.',
    items: [
      { title: 'Your Number Stays Private',  desc: 'Dealers cannot see your phone number unless you personally approve it.' },
      { title: 'Non-Binding Offers',         desc: 'All offers are non-binding. Final deal subject to inspection. Zero pressure.' },
      { title: "You're in Control",          desc: 'Decide who contacts you, when, and how. Reject any offer instantly.' },
      { title: 'Real Market Prices',         desc: 'Estimates powered by live Qatar car market data and ML model.' },
    ],
  },

  // Valuation form
  valuation: {
    screen1: {
      h2: "What's your car?",
      sub: 'Start by selecting the make',
      model: 'Model',
      continue: 'Continue',
    },
  },
};

export type Translations = typeof en;
export default en;
