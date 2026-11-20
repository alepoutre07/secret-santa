import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const home = document.querySelector("#home");
const participantsScreen = document.querySelector("#participants");
const revealScreen = document.querySelector("#reveal");
const list = document.querySelector("#participant-list");
const status = document.querySelector("#status");
const recipientName = document.querySelector("#recipient-name");
const managePanel = document.querySelector("#manage-panel");
const manageToggle = document.querySelector("#manage-toggle");
const tokenInput = document.querySelector("#admin-token");
const namesInput = document.querySelector("#names-input");
const configured = !SUPABASE_URL.includes("YOUR_PROJECT_ID") && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let participants = [];
let locked = false;

function show(screen) {
  for (const section of [home, participantsScreen, revealScreen]) section.hidden = section !== screen;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function setStatus(message) {
  status.textContent = message;
}

function renderParticipants() {
  list.replaceChildren();
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
    button.disabled = locked;
    button.addEventListener("click", () => reveal(participant));
    row.append(name, arrow, button);
    list.append(row);
  }
}

async function loadParticipants() {
  if (!supabase) {
    setStatus("Configure Supabase pour charger les participants et réaliser le tirage.");
    return;
  }
  setStatus("");
  list.replaceChildren();
  const { data, error } = await supabase.functions.invoke("participants");
  if (error || !Array.isArray(data?.participants)) {
    setStatus("Impossible de charger la liste. Vérifie la configuration du site.");
    return;
  }
  participants = data.participants;
  if (participants.length < 2) {
    setStatus("La liste des participants n'est pas encore configurée (il en faut au moins deux).");
    return;
  }
  renderParticipants();
}

async function reveal(participant) {
  if (!supabase || locked) return;
  locked = true;
  renderParticipants();
  setStatus("Le tirage est en cours…");
  const { data, error } = await supabase.functions.invoke("reveal", {
    body: { participantId: participant.id },
  });
  locked = false;
  renderParticipants();
  if (error || typeof data?.recipientName !== "string") {
    setStatus(data?.error || "Le résultat n'a pas pu être chargé. Réessaie.");
    return;
  }
  recipientName.textContent = data.recipientName;
  show(revealScreen);
}

function setManageOpen(open) {
  managePanel.hidden = !open;
  manageToggle.setAttribute("aria-expanded", String(open));
  if (open) namesInput.value = participants.map(({ name }) => name).join("\n");
}

async function saveParticipants() {
  const token = tokenInput.value.trim();
  const names = namesInput.value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  if (!token) {
    setStatus("Saisis le jeton administrateur pour modifier la liste.");
    tokenInput.focus();
    return;
  }
  if (names.length < 2 || names.length > 100) {
    setStatus("Il faut saisir entre 2 et 100 prénoms.");
    return;
  }
  const saveButton = document.querySelector("#save-names");
  saveButton.disabled = true;
  setStatus("Enregistrement de la liste…");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "x-admin-token": token,
      },
      body: JSON.stringify({ names }),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Impossible d'enregistrer la liste.");
    tokenInput.value = "";
    setManageOpen(false);
    setStatus("Liste enregistrée. Elle sera verrouillée dès le premier résultat révélé.");
    await loadParticipants();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Impossible d'enregistrer la liste.");
  } finally {
    saveButton.disabled = false;
  }
}

document.querySelector("#start-button").addEventListener("click", async () => {
  show(participantsScreen);
  await loadParticipants();
});
document.querySelector("#back-home").addEventListener("click", () => show(home));
document.querySelector("#back-list").addEventListener("click", async () => {
  show(participantsScreen);
  await loadParticipants();
});
manageToggle.addEventListener("click", () => setManageOpen(managePanel.hidden));
document.querySelector("#cancel-manage").addEventListener("click", () => setManageOpen(false));
document.querySelector("#save-names").addEventListener("click", saveParticipants);
