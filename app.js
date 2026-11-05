import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const home = document.querySelector("#home");
const participantsScreen = document.querySelector("#participants");
const revealScreen = document.querySelector("#reveal");
const list = document.querySelector("#participant-list");
const status = document.querySelector("#status");
const recipientName = document.querySelector("#recipient-name");
const configured = !SUPABASE_URL.includes("YOUR_PROJECT_ID") && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let participants = [];
let previousScreen = "participants";

function show(screen) {
  for (const section of [home, participantsScreen, revealScreen]) section.hidden = section !== screen;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showConfigurationHint() {
  status.textContent = "Le site doit être connecté à Supabase avant de pouvoir charger les participants.";
}

async function loadParticipants() {
  if (!supabase) {
    showConfigurationHint();
    return;
  }
  status.textContent = "";
  list.replaceChildren();
  const { data, error } = await supabase.functions.invoke("participants");
  if (error || !Array.isArray(data?.participants)) {
    status.textContent = "Impossible de charger la liste. Vérifie la configuration du site.";
    return;
  }
  participants = data.participants;
  if (participants.length < 2) {
    status.textContent = "La liste des participants n'est pas encore configurée.";
    return;
  }
  for (const participant of participants) {
    const row = document.createElement("li");
    row.className = "participant-row";
    const name = document.createElement("span");
    name.className = "participant-name";
    name.textContent = participant.name;
    const arrow = document.createElement("span");
    arrow.className = "row-arrow";
    arrow.setAttribute("aria-hidden", "true");
    const button = document.createElement("button");
    button.className = "pill-button reveal-button";
    button.type = "button";
    button.textContent = "Révéler";
    button.setAttribute("aria-label", `Révéler le destinataire de ${participant.name}`);
    button.addEventListener("click", () => reveal(participant));
    row.append(name, arrow, button);
    list.append(row);
  }
}

async function reveal(participant) {
  for (const button of list.querySelectorAll("button")) button.disabled = true;
  status.textContent = "Le tirage est en cours…";
  const { data, error } = await supabase.functions.invoke("reveal", {
    body: { participantId: participant.id },
  });
  for (const button of list.querySelectorAll("button")) button.disabled = false;
  if (error || typeof data?.recipientName !== "string") {
    status.textContent = data?.error || "Le résultat n'a pas pu être chargé. Réessaie.";
    return;
  }
  recipientName.textContent = data.recipientName;
  previousScreen = "participants";
  show(revealScreen);
}

document.querySelector("#start-button").addEventListener("click", async () => {
  show(participantsScreen);
  await loadParticipants();
});
document.querySelector("#back-home").addEventListener("click", () => show(home));
document.querySelector("#back-list").addEventListener("click", async () => {
  show(previousScreen === "participants" ? participantsScreen : home);
  await loadParticipants();
});
