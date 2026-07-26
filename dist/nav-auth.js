import { hasSupabaseConfig, supabase } from "./supabase-client.js";

const elements = {
  accountName: document.querySelector("#accountName"),
  authButton: document.querySelector("#authButton"),
  signUpButton: document.querySelector("#signUpButton"),
  signOutButton: document.querySelector("#signOutButton")
};

function displayNameFromEmail(email = "") {
  return email.split("@")[0]?.slice(0, 24) || "Player";
}

function userDisplayName(user) {
  const metadataName = user?.user_metadata?.display_name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim().slice(0, 24);
  }
  return displayNameFromEmail(user?.email);
}

function syncAuthUi(user) {
  if (!elements.accountName || !elements.authButton || !elements.signUpButton || !elements.signOutButton) return;
  elements.accountName.textContent = user ? userDisplayName(user) : "";
  elements.accountName.classList.toggle("hidden", !user);
  elements.authButton.classList.toggle("hidden", Boolean(user));
  elements.signUpButton.classList.toggle("hidden", Boolean(user));
  elements.signOutButton.classList.toggle("hidden", !user);
}

async function initNavAuth() {
  if (!hasSupabaseConfig) return;
  const { data } = await supabase.auth.getSession();
  syncAuthUi(data.session?.user || null);

  supabase.auth.onAuthStateChange((_event, session) => {
    syncAuthUi(session?.user || null);
  });
}

elements.authButton?.addEventListener("click", () => {
  if (!hasSupabaseConfig) return;
  window.location.href = "/";
});

elements.signUpButton?.addEventListener("click", () => {
  if (!hasSupabaseConfig) return;
  window.location.href = "/";
});

elements.signOutButton?.addEventListener("click", async () => {
  if (!hasSupabaseConfig) return;
  await supabase.auth.signOut();
  syncAuthUi(null);
});

initNavAuth().catch(() => {
  syncAuthUi(null);
});
