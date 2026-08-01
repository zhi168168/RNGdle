import { hasSupabaseConfig, supabase } from "./supabase-client.js";

const runtime = window.GAME_SITE_CONFIG || {};
const gameConfig = runtime.game || {};
const storagePrefix = gameConfig.localStorageKey || "rngdle_static";
const rollStorageKey = `${storagePrefix}:daily_roll`;
const lifetimeStorageKey = `${storagePrefix}:lifetime_ep`;

const elements = {
  numberDisplay: document.querySelector("#numberDisplay"),
  rarityPill: document.querySelector("#rarityPill"),
  generateButton: document.querySelector("#generateButton"),
  rollScore: document.querySelector("#rollScore"),
  lifetimeScore: document.querySelector("#lifetimeScore"),
  badgeCount: document.querySelector("#badgeCount"),
  statusLine: document.querySelector("#statusLine"),
  shareButton: document.querySelector("#shareButton"),
  replayButton: document.querySelector("#replayButton"),
  badgeList: document.querySelector("#badgeList"),
  percentileText: document.querySelector("#percentileText"),
  countdown: document.querySelector("#countdown"),
  authButton: document.querySelector("#authButton"),
  signUpButton: document.querySelector("#signUpButton"),
  signOutButton: document.querySelector("#signOutButton"),
  accountName: document.querySelector("#accountName"),
  authDialog: document.querySelector("#authDialog"),
  googleAuthButton: document.querySelector("#googleAuthButton"),
  authForm: document.querySelector("#authForm"),
  authTitle: document.querySelector("#authTitle"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authDisplayName: document.querySelector("#authDisplayName"),
  authDisplayField: document.querySelector("#authDisplayField"),
  authSubmit: document.querySelector("#authSubmit"),
  authSwitch: document.querySelector("#authSwitch"),
  authReset: document.querySelector("#authReset"),
  authMessage: document.querySelector("#authMessage"),
  authClose: document.querySelector("#authClose")
};

const families = {
  parity: "Parity",
  endings: "Clean endings",
  sevens: "Lucky sevens",
  memes: "Special numbers",
  monotonic: "Digit movement",
  repeats: "Repeated digits",
  powers: "Powers",
  bookends: "Bookends",
  weight: "Digit weight"
};

const badgeDefinitions = [
  badge("SIX_DIGITS", "Six Digits", "Has exactly six digits.", "🐝", 111, "90.0%", (n, s) => s.length === 6),
  badge("EVEN", "Even", "Divisible by 2.", "⚖️", 200, "50.0%", (n) => n % 2 === 0, families.parity),
  badge("ODD", "Odd", "Not divisible by 2.", "🦄", 200, "50.0%", (n) => n % 2 === 1, families.parity),
  badge("PRIME", "Prime Number", "Divisible only by 1 and itself.", "💎", 1500, "7.8%", isPrime),
  badge("SQUARE", "Square", "A perfect square.", "◻️", 1200, "10.0%", isSquare, families.powers),
  badge("CUBE", "Cube", "A perfect cube.", "🧊", 2600, "1.0%", isCube, families.powers),
  badge("FOURTH_POWER", "Fourth Power", "A perfect fourth power.", "4️⃣", 7200, "0.3%", (n) => isPerfectPower(n, 4), families.powers),
  badge("FIBONACCI", "Fibonacci", "Appears in the Fibonacci sequence.", "🌿", 1800, "3.0%", isFibonacci),
  badge("HARSHAD", "Harshad", "Divisible by the sum of its digits.", "🧮", 350, "33.0%", isHarshad),
  badge("BINARY_ONLY", "Binary Only", "Contains only 0s and 1s.", "💾", 5200, "0.7%", (n, s) => /^[01]+$/.test(s)),
  badge("VOID", "Void", "Contains no zeros.", "🕳️", 167, "59.8%", (n, s) => !s.includes("0"), families.weight),
  badge("FEATHER", "Feather", "The sum of its digits is less than 15.", "🪶", 180, "45.0%", (n) => sumDigits(n) < 15, families.weight),
  badge("HEAVY", "Heavy", "The sum of its digits exceeds 45.", "🧱", 1400, "2.5%", (n) => sumDigits(n) > 45, families.weight),
  badge("PAIR", "Pair", "Contains a pair of matching digits.", "👯", 120, "83.1%", hasAnyPair, families.repeats),
  badge("TWO_PAIR", "Two Pair", "Contains two different matching pairs.", "🎴", 420, "28.0%", (n, s) => countPairs(s) >= 2, families.repeats),
  badge("THREE_PAIR", "Three Pair", "Contains three different matching pairs.", "🃏", 1600, "3.0%", (n, s) => countPairs(s) >= 3, families.repeats),
  badge("TRIPS", "Trips", "Contains three of the same digit.", "🎲", 620, "18.0%", (n, s) => maxDigitCount(s) >= 3, families.repeats),
  badge("QUADS", "Four of a Kind", "Contains four of the same digit.", "🎰", 2500, "1.8%", (n, s) => maxDigitCount(s) >= 4, families.repeats),
  badge("FIVE_OF_A_KIND", "Five of a Kind", "Contains five of the same digit.", "🏆", 9000, "0.2%", (n, s) => maxDigitCount(s) >= 5, families.repeats),
  badge("SIX_OF_A_KIND", "Six of a Kind", "Contains six of the same digit.", "👑", 180000, "0.001%", (n, s) => maxDigitCount(s) >= 6, families.repeats),
  badge("CONTIGUOUS_PAIR", "Contiguous Pair", "Has two equal adjacent digits.", "👥", 260, "54.0%", (n, s) => /(.)\1/.test(s), families.repeats),
  badge("CONTIGUOUS_TRIPS", "Contiguous Trips", "Has three equal adjacent digits.", "📊", 1900, "4.2%", (n, s) => /(.)\1\1/.test(s), families.repeats),
  badge("CONTIGUOUS_QUADS", "Contiguous Quads", "Has four equal adjacent digits.", "🧱", 8800, "0.4%", (n, s) => /(.)\1\1\1/.test(s), families.repeats),
  badge("PALINDROME", "Palindrome", "Reads the same forwards and backwards.", "🪞", 1800, "3.1%", (n, s) => s === reverse(s)),
  badge("ECHO", "Echo", "The first half repeats as the second half.", "📣", 3200, "1.1%", (n, s) => s.length > 1 && s.length % 2 === 0 && s.slice(0, s.length / 2) === s.slice(s.length / 2)),
  badge("BOOKENDS", "Bookends", "First two digits match the last two.", "📚", 2100, "2.0%", (n, s) => s.length >= 4 && s.slice(0, 2) === s.slice(-2), families.bookends),
  badge("SANDWICH", "Sandwich", "First and last digits match with different digits inside.", "🥪", 950, "7.5%", (n, s) => s.length >= 3 && s[0] === s.at(-1) && s.slice(1, -1).split("").some((d) => d !== s[0]), families.bookends),
  badge("EQUILIBRIUM", "Equilibrium", "The first and last digits are identical.", "🧘", 420, "10.0%", (n, s) => s.length > 1 && s[0] === s.at(-1), families.bookends),
  badge("GROUNDED", "Grounded", "The first digit is smaller than the last.", "⚓", 200, "50.0%", (n, s) => s.length > 1 && s[0] < s.at(-1), families.bookends),
  badge("LIFTOFF", "Liftoff", "The first digit is larger than the last.", "🚀", 200, "50.0%", (n, s) => s.length > 1 && s[0] > s.at(-1), families.bookends),
  badge("NEIGHBORS", "Neighbors", "Contains two digits adjacent in value.", "🏘️", 161, "62.1%", (n, s) => hasNeighborDigits(s)),
  badge("ASCENSION", "Ascension", "Every digit is strictly larger than the previous.", "📈", 4100, "0.9%", (n, s) => isStrictlyRising(s), families.monotonic),
  badge("DECAY", "Decay", "Every digit is strictly smaller than the previous.", "📉", 4100, "0.9%", (n, s) => isStrictlyFalling(s), families.monotonic),
  badge("STEPS", "Steps", "Digits never decrease.", "🪜", 1200, "9.0%", (n, s) => isNonDecreasing(s) && !allSame(s), families.monotonic),
  badge("SLOPES", "Slopes", "Digits never increase.", "🛝", 1200, "9.0%", (n, s) => isNonIncreasing(s) && !allSame(s), families.monotonic),
  badge("CASCADE", "Cascade", "Every digit increases by exactly 1.", "🌊", 12000, "0.08%", (n, s) => everyStep(s, 1), families.monotonic),
  badge("WATERFALL", "Waterfall", "Every digit decreases by exactly 1.", "🚿", 12000, "0.08%", (n, s) => everyStep(s, -1), families.monotonic),
  badge("TURTLE", "Turtle", "All consecutive digits differ by at most 1.", "🐢", 650, "12.0%", (n, s) => s.length > 1 && [...s].every((d, i) => i === 0 || Math.abs(Number(d) - Number(s[i - 1])) <= 1), families.monotonic),
  badge("CLEAN", "Clean", "Ends in a zero.", "🧼", 220, "10.0%", (n, s) => s.endsWith("0"), families.endings),
  badge("SEMI_CLEAN", "Semi-Clean", "Ends in a 5.", "🧹", 220, "10.0%", (n, s) => s.endsWith("5"), families.endings),
  badge("CENTURY", "Century", "Ends in double zeros.", "💯", 900, "1.0%", (n, s) => s.endsWith("00"), families.endings),
  badge("MILLENNIUM", "Millennium", "Ends in triple zeros.", "🗓️", 6200, "0.1%", (n, s) => s.endsWith("000"), families.endings),
  badge("DOZEN", "Dozen", "Divisible by 12.", "🍩", 260, "8.3%", (n) => n > 0 && n % 12 === 0),
  badge("ELEVEN", "Eleven", "Divisible by 11.", "🕚", 310, "9.1%", (n) => n > 0 && n % 11 === 0),
  badge("LUCKY_SEVEN_DIV", "Lucky Seven", "Divisible by 7.", "🎰", 213, "46.9%", (n) => n > 0 && n % 7 === 0, families.sevens),
  badge("LUCKY_7", "Seven Inside", "Contains the number 7.", "7️⃣", 260, "46.9%", (n, s) => s.includes("7"), families.sevens),
  badge("JACKPOT", "Jackpot", "Contains 777.", "💰", 9000, "0.10%", (n, s) => s.includes("777"), families.sevens),
  badge("JACKPOT_FOUR", "Jackpot Four", "Contains four 7s in a row.", "🏦", 64000, "0.01%", (n, s) => s.includes("7777"), families.sevens),
  badge("JACKPOT_SIX", "Jackpot Six", "Contains six 7s in a row.", "🏦", 99999076, "0.0001%", (n, s) => s.includes("777777"), families.sevens),
  badge("JACKPOT_EXACT", "Exact Jackpot", "Exactly 777.", "💰", 99999076, "0.0001%", (n) => n === 777, families.sevens),
  badge("NICE", "Nice", "Contains 69.", "😏", 6900, "1.0%", (n, s) => s.includes("69"), families.memes),
  badge("NICE_EXACT", "Exact Nice", "Exactly 69.", "😏", 99999076, "0.0001%", (n) => n === 69, families.memes),
  badge("BOTANIST", "Botanist", "Contains 420.", "🌿", 9200, "0.1%", (n, s) => s.includes("420"), families.memes),
  badge("BOTANIST_EXACT", "Exact Botanist", "Exactly 420.", "🌿", 99999076, "0.0001%", (n) => n === 420, families.memes),
  badge("DEVIL", "Devil", "Contains 666.", "😈", 9200, "0.1%", (n, s) => s.includes("666"), families.memes),
  badge("DEVIL_EXACT", "Exact Devil", "Exactly 666.", "😈", 99999076, "0.0001%", (n) => n === 666, families.memes),
  badge("LEET", "Leet", "Contains 1337.", "💻", 42000, "0.01%", (n, s) => s.includes("1337"), families.memes),
  badge("MEANING", "Meaning", "Contains 42.", "🌌", 5400, "1.0%", (n, s) => s.includes("42"), families.memes),
  badge("EMERGENCY", "Emergency", "Contains 911.", "🚑", 9200, "0.1%", (n, s) => s.includes("911"), families.memes),
  badge("TREE_FIDDY", "Tree Fiddy", "Contains 350.", "🦕", 9200, "0.1%", (n, s) => s.includes("350"), families.memes),
  badge("SIXTY_SEVEN", "Sixty Seven", "Contains 67.", "🌀", 5400, "1.0%", (n, s) => s.includes("67"), families.memes),
  badge("EIGHTY_SIX", "Eighty Six", "Contains 86.", "🍸", 5400, "1.0%", (n, s) => s.includes("86"), families.memes),
  badge("PI", "Pi", "Contains 314.", "🥧", 9200, "0.1%", (n, s) => s.includes("314"), families.memes),
  badge("E", "Euler", "Contains 271.", "📐", 9200, "0.1%", (n, s) => s.includes("271"), families.memes),
  badge("TAU", "Tau", "Contains 628.", "⭕", 9200, "0.1%", (n, s) => s.includes("628"), families.memes),
  badge("LOW_BALL", "Low Ball", "Contains only digits from 0 to 4.", "📉", 720, "18.0%", (n, s) => [...s].every((d) => d >= "0" && d <= "4")),
  badge("HIGH_ROLLER", "High Roller", "Contains only digits from 5 to 9.", "🤑", 720, "18.0%", (n, s) => [...s].every((d) => d >= "5" && d <= "9")),
  badge("FIREFLY", "Firefly", "One unique digit among identical others.", "🪲", 7000, "0.5%", (n, s) => hasOneOddDigitOut(s))
];

const state = {
  result: null,
  lifetime: Number(localStorage.getItem(lifetimeStorageKey) || 0),
  isRolling: false,
  authMode: "sign-in",
  session: null,
  profile: null,
  authReady: false
};

function badge(id, label, description, emoji, score, probability, check, family = null) {
  return { id, label, description, emoji, score, probability, check, family };
}

function displayNameFromEmail(email = "") {
  return email.split("@")[0]?.slice(0, 24) || "Player";
}

function activeUser() {
  return state.session?.user || null;
}

function metadataDisplayName(user = activeUser()) {
  const value = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name;
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 24) : "";
}

function userDisplayName() {
  return state.profile?.display_name || metadataDisplayName() || displayNameFromEmail(activeUser()?.email);
}

function setAuthMessage(message, tone = "") {
  if (!elements.authMessage) return;
  elements.authMessage.textContent = message;
  elements.authMessage.dataset.tone = tone;
}

function formatAuthError(error, fallback = "Could not sign in.") {
  const message = String(error?.message || error?.msg || error?.error_description || "").trim();
  const code = String(error?.error_code || error?.code || error?.name || "").trim();
  const combined = `${message} ${code}`.toLowerCase();

  if (combined.includes("error sending confirmation email") || combined.includes("unexpected_failure")) {
    return "Could not send the confirmation email. Check the Supabase SMTP sender, host, port, username, and password.";
  }

  if (message && message !== "{}") return message;
  if (code && code !== "{}") return code;
  return fallback;
}

function authCallbackState() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(window.location.search);
  return {
    hasTokens: Boolean(hash.get("access_token") || search.get("code")),
    error: hash.get("error_description") || search.get("error_description") || "",
    verified: search.get("type") === "signup" || hash.get("type") === "signup"
  };
}

function syncAuthUi() {
  const user = activeUser();
  if (!elements.accountName || !elements.authButton || !elements.signUpButton || !elements.signOutButton) return;
  elements.accountName.textContent = user ? userDisplayName() : "";
  elements.accountName.classList.toggle("hidden", !user);
  elements.authButton.classList.toggle("hidden", Boolean(user));
  elements.signUpButton.classList.toggle("hidden", Boolean(user));
  elements.signOutButton.classList.toggle("hidden", !user);
}

function syncAuthMode() {
  const signingUp = state.authMode === "sign-up";
  elements.authTitle.textContent = signingUp ? "Create account" : "Log in";
  elements.authSubmit.textContent = signingUp ? "Create account" : "Log in";
  elements.authSwitch.textContent = signingUp ? "I already have an account" : "Create account";
  elements.authDisplayField.classList.toggle("hidden", !signingUp);
  elements.authPassword.autocomplete = signingUp ? "new-password" : "current-password";
  setAuthMessage("");
}

function openAuthDialog(mode = "sign-in") {
  if (!hasSupabaseConfig) return;
  state.authMode = mode;
  syncAuthMode();
  elements.authDialog.hidden = false;
  requestAnimationFrame(() => elements.authDialog.classList.add("is-open"));
  elements.authEmail.focus();
}

function closeAuthDialog() {
  elements.authDialog.classList.remove("is-open");
  elements.authDialog.hidden = true;
}

async function loadProfile() {
  const user = activeUser();
  if (!user) {
    state.profile = null;
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    state.profile = null;
    return;
  }

  if (data) {
    const metadataName = metadataDisplayName(user);
    const emailName = displayNameFromEmail(user.email);
    if (metadataName && (!data.display_name || data.display_name === emailName)) {
      const { data: updated } = await supabase
        .from("profiles")
        .update({ display_name: metadataName })
        .eq("id", user.id)
        .select("id, display_name, username")
        .maybeSingle();
      state.profile = updated || { ...data, display_name: metadataName };
      return;
    }
    state.profile = data;
    return;
  }

  const displayName = metadataDisplayName(user) || displayNameFromEmail(user.email);
  const { data: inserted } = await supabase
    .from("profiles")
    .insert({ id: user.id, display_name: displayName, username: null })
    .select("id, display_name, username")
    .maybeSingle();
  state.profile = inserted || { id: user.id, display_name: displayName, username: null };
}

async function initAuth() {
  if (!hasSupabaseConfig) return;
  const callback = authCallbackState();
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  await loadProfile();
  state.authReady = true;
  syncAuthUi();

  if (!state.session && (callback.hasTokens || callback.verified)) {
    openAuthDialog("sign-in");
    setAuthMessage("Email confirmed. Sign in to continue.", "good");
  }
  if (callback.error) {
    openAuthDialog("sign-in");
    setAuthMessage(callback.error, "bad");
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    await loadProfile();
    syncAuthUi();
  });
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!hasSupabaseConfig) return;
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;
  const displayName = elements.authDisplayName.value.trim() || displayNameFromEmail(email);
  elements.authSubmit.disabled = true;
  setAuthMessage(state.authMode === "sign-up" ? "Creating account..." : "Signing in...");

  try {
    const result = state.authMode === "sign-up"
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName }
          }
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) throw result.error;

    if (state.authMode === "sign-up" && result.data.user) {
      await supabase.from("profiles").upsert({
        id: result.data.user.id,
        display_name: displayName.slice(0, 24),
        username: null
      });
    }

    if (state.authMode === "sign-up" && !result.data.session) {
      state.authMode = "sign-in";
      syncAuthMode();
      setAuthMessage("Check your email, confirm the address, then sign in here.", "good");
      elements.authEmail.value = email;
      elements.authPassword.value = "";
      elements.authPassword.focus();
      return;
    }

    setAuthMessage("You are signed in.", "good");
    closeAuthDialog();
    elements.authForm.reset();
  } catch (error) {
    setAuthMessage(formatAuthError(error, state.authMode === "sign-up" ? "Could not create account." : "Could not sign in."), "bad");
  } finally {
    elements.authSubmit.disabled = false;
  }
}

async function signInWithGoogle() {
  if (!hasSupabaseConfig) return;
  elements.googleAuthButton.disabled = true;
  setAuthMessage("Opening Google...");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) {
    elements.googleAuthButton.disabled = false;
    setAuthMessage(error.message || "Google sign-in is unavailable.", "bad");
  }
}

async function resetPassword() {
  if (!hasSupabaseConfig) return;
  const email = elements.authEmail.value.trim();
  if (!email) {
    setAuthMessage("Enter your email first.", "bad");
    elements.authEmail.focus();
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  setAuthMessage(error ? error.message : "Password reset email sent.", error ? "bad" : "good");
}

async function signOut() {
  if (!hasSupabaseConfig) return;
  await supabase.auth.signOut();
  state.session = null;
  state.profile = null;
  syncAuthUi();
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function millisUntilUtcMidnight() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime() - now.getTime();
}

function rollRandomNumber() {
  return Math.floor(Math.random() * 1000001);
}

function analyzeNumber(number) {
  const text = String(number);
  const matched = badgeDefinitions
    .filter((definition) => definition.check(number, text))
    .map((definition) => ({ ...definition, isScoring: true }));

  const bestByFamily = new Map();
  for (const item of matched) {
    if (!item.family) continue;
    const existing = bestByFamily.get(item.family);
    if (!existing || item.score > existing.score) bestByFamily.set(item.family, item);
  }

  for (const item of matched) {
    if (item.family && bestByFamily.get(item.family)?.id !== item.id) item.isScoring = false;
  }

  matched.sort((a, b) => Number(b.isScoring) - Number(a.isScoring) || b.score - a.score);
  const totalScore = matched.reduce((sum, item) => sum + (item.isScoring ? item.score : 0), 0);
  return { number, badges: matched, totalScore };
}

function createResult(number = rollRandomNumber()) {
  return {
    date: todayUTC(),
    ...analyzeNumber(number)
  };
}

function getStoredRoll() {
  try {
    const saved = JSON.parse(localStorage.getItem(rollStorageKey) || "null");
    if (saved?.date === todayUTC()) return saved;
  } catch {
    return null;
  }
  return null;
}

function saveRoll(result) {
  localStorage.setItem(rollStorageKey, JSON.stringify(result));
  state.lifetime += result.totalScore;
  localStorage.setItem(lifetimeStorageKey, String(state.lifetime));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function displayRollNumber(value) {
  return String(value).padStart(6, "0");
}

function getRarity(score) {
  if (score >= 10000000) return { key: "anomaly", label: "ANOMALY", text: "Top 0.001%" };
  if (score >= 1000000) return { key: "epic", label: "EPIC", text: "Top 0.1%" };
  if (score >= 100000) return { key: "rare", label: "RARE", text: "Top 1%" };
  if (score >= 10000) return { key: "uncommon", label: "UNCOMMON", text: "Top 10%" };
  if (score >= 1000) return { key: "common", label: "COMMON", text: "Top 50%" };
  return { key: "trash", label: "TRASH", text: "Bottom 50%" };
}

async function animateNumber(target) {
  state.isRolling = true;
  elements.generateButton.disabled = true;
  elements.generateButton.textContent = "PROCESSING...";
  elements.numberDisplay.classList.add("is-rolling");
  const steps = 22;
  for (let i = 0; i < steps; i += 1) {
    elements.numberDisplay.textContent = displayRollNumber(rollRandomNumber());
    await wait(45 + i * 5);
  }
  elements.numberDisplay.classList.remove("is-rolling");
  elements.numberDisplay.textContent = displayRollNumber(target);
  state.isRolling = false;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleGenerate() {
  if (state.isRolling) return;
  const stored = getStoredRoll();
  if (stored) {
    state.result = stored;
    render();
    return;
  }

  const result = createResult();
  await animateNumber(result.number);
  saveRoll(result);
  state.result = result;
  render();
}

async function replayRoll() {
  if (!state.result || state.isRolling) return;
  await animateNumber(state.result.number);
  render();
}

async function shareRoll() {
  if (!state.result) return;
  const rarity = getRarity(state.result.totalScore);
  const topBadges = state.result.badges.slice(0, 4).map((item) => `${item.emoji} ${item.label}`).join("\n");
  const text = [
    `RNGdle 🎲 ${displayRollNumber(state.result.number)}`,
    "",
    `${rarity.label} • ${rarity.text}`,
    `${topBadges}${state.result.badges.length > 4 ? `\n+${state.result.badges.length - 4} more` : ""}`,
    "",
    `${formatNumber(state.result.totalScore)} EP`,
    window.location.href
  ].join("\n");

  if (navigator.share) {
    await navigator.share({ text }).catch(() => {});
  } else {
    await navigator.clipboard.writeText(text);
    setStatus("Copied share text to clipboard.");
  }
}

function render() {
  const result = state.result;
  elements.lifetimeScore.textContent = formatNumber(state.lifetime);
  elements.replayButton.disabled = !result;
  elements.shareButton.disabled = !result;

  if (!result) {
    elements.rollScore.textContent = "0";
    elements.badgeCount.textContent = "0";
    elements.numberDisplay.textContent = "??????";
    elements.rarityPill.textContent = "UNROLLED";
    elements.rarityPill.className = "rarity-pill";
    elements.percentileText.textContent = "Waiting for roll";
    elements.generateButton.disabled = false;
    elements.generateButton.textContent = "GENERATE";
    setStatus(gameConfig.question || "Generate today's number.");
    renderBadges([]);
    return;
  }

  const rarity = getRarity(result.totalScore);
  elements.numberDisplay.textContent = displayRollNumber(result.number);
  elements.rollScore.textContent = formatNumber(result.totalScore);
  elements.badgeCount.textContent = result.badges.length;
  elements.rarityPill.textContent = rarity.label;
  elements.rarityPill.className = `rarity-pill ${rarity.key}`;
  elements.percentileText.textContent = `${rarity.text} estimate`;
  elements.generateButton.disabled = true;
  elements.generateButton.textContent = "COME BACK TOMORROW";
  setStatus(`Today's roll is locked. Next roll resets at UTC midnight.`);
  renderBadges(result.badges);
}

function renderBadges(items) {
  elements.badgeList.innerHTML = "";
  elements.badgeList.classList.toggle("empty", items.length === 0);

  if (!items.length) {
    const empty = document.createElement("p");
    empty.textContent = "Generate a number to reveal every matching badge.";
    elements.badgeList.append(empty);
    return;
  }

  for (const item of items) {
    const row = document.createElement("article");
    row.className = `badge-card${item.isScoring ? "" : " muted"}`;
    row.innerHTML = `
      <div class="badge-icon">${item.emoji}</div>
      <div class="badge-body">
        <div class="badge-title-row">
          <h3>${item.label}</h3>
          <span>${item.isScoring ? `+${formatNumber(item.score)} EP` : "family bonus skipped"}</span>
        </div>
        <p>${item.description}</p>
        <div class="badge-meta">
          <span>${item.probability}</span>
          ${item.family ? `<span>${item.family}</span>` : ""}
        </div>
      </div>
    `;
    elements.badgeList.append(row);
  }
}

function setStatus(message) {
  elements.statusLine.textContent = message;
}

function tickCountdown() {
  const ms = millisUntilUtcMidnight();
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  elements.countdown.textContent = `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  if (ms <= 1000) {
    localStorage.removeItem(rollStorageKey);
    state.result = null;
    render();
  }
}

function sumDigits(number) {
  return String(number).split("").reduce((sum, digit) => sum + Number(digit), 0);
}

function isPrime(number) {
  if (number <= 1) return false;
  if (number <= 3) return true;
  if (number % 2 === 0 || number % 3 === 0) return false;
  for (let i = 5; i * i <= number; i += 6) {
    if (number % i === 0 || number % (i + 2) === 0) return false;
  }
  return true;
}

function isSquare(number) {
  const root = Math.sqrt(number);
  return Number.isInteger(root);
}

function isCube(number) {
  const root = Math.round(Math.cbrt(number));
  return root ** 3 === number;
}

function isPerfectPower(number, power) {
  const root = Math.round(number ** (1 / power));
  return root ** power === number;
}

function isFibonacci(number) {
  return isSquare(5 * number * number + 4) || isSquare(5 * number * number - 4);
}

function isHarshad(number) {
  const sum = sumDigits(number);
  return sum > 0 && number % sum === 0;
}

function reverse(text) {
  return [...text].reverse().join("");
}

function digitCounts(text) {
  const counts = new Map();
  for (const digit of text) counts.set(digit, (counts.get(digit) || 0) + 1);
  return counts;
}

function hasAnyPair(number, text) {
  return [...digitCounts(text).values()].some((count) => count >= 2);
}

function countPairs(text) {
  return [...digitCounts(text).values()].filter((count) => count >= 2).length;
}

function maxDigitCount(text) {
  return Math.max(...digitCounts(text).values());
}

function allSame(text) {
  return text.length > 1 && [...text].every((digit) => digit === text[0]);
}

function hasNeighborDigits(text) {
  const digits = [...new Set([...text].map(Number))];
  return digits.some((digit) => digits.includes(digit + 1));
}

function isStrictlyRising(text) {
  return text.length > 1 && [...text].every((digit, index) => index === 0 || digit > text[index - 1]);
}

function isStrictlyFalling(text) {
  return text.length > 1 && [...text].every((digit, index) => index === 0 || digit < text[index - 1]);
}

function isNonDecreasing(text) {
  return text.length > 1 && [...text].every((digit, index) => index === 0 || digit >= text[index - 1]);
}

function isNonIncreasing(text) {
  return text.length > 1 && [...text].every((digit, index) => index === 0 || digit <= text[index - 1]);
}

function everyStep(text, step) {
  return text.length > 1 && [...text].every((digit, index) => index === 0 || Number(digit) === Number(text[index - 1]) + step);
}

function hasOneOddDigitOut(text) {
  if (text.length < 4) return false;
  const counts = [...digitCounts(text).values()];
  return counts.length === 2 && counts.includes(1);
}

elements.generateButton.addEventListener("click", handleGenerate);
elements.replayButton.addEventListener("click", replayRoll);
elements.shareButton.addEventListener("click", shareRoll);
elements.authButton.addEventListener("click", () => openAuthDialog("sign-in"));
elements.signUpButton.addEventListener("click", () => openAuthDialog("sign-up"));
elements.signOutButton.addEventListener("click", signOut);
elements.googleAuthButton.addEventListener("click", signInWithGoogle);
elements.authForm.addEventListener("submit", handleAuthSubmit);
elements.authSwitch.addEventListener("click", () => {
  state.authMode = state.authMode === "sign-in" ? "sign-up" : "sign-in";
  syncAuthMode();
});
elements.authReset.addEventListener("click", resetPassword);
elements.authClose.addEventListener("click", closeAuthDialog);
document.querySelectorAll("[data-auth-close]").forEach((el) => {
  el.addEventListener("click", closeAuthDialog);
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.authDialog.hidden) closeAuthDialog();
});

state.result = getStoredRoll();
render();
tickCountdown();
setInterval(tickCountdown, 1000);
initAuth().catch(() => {
  state.session = null;
  state.profile = null;
  syncAuthUi();
});
