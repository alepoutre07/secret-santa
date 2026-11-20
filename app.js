const home = document.querySelector("#home");
const participantsScreen = document.querySelector("#participants");
const revealScreen = document.querySelector("#reveal");
const list = document.querySelector("#participant-list");
const recipientName = document.querySelector("#recipient-name");

// Ce tirage est volontairement intégré au frontend statique : il n'y a pas de serveur.
// La liste des associations est donc accessible dans les fichiers publics du site.
const assignments = [
  { name: "Thomas", recipient: "Zoé" },
  { name: "Mamé", recipient: "Jean" },
  { name: "Nathalie", recipient: "Seb" },
  { name: "Martin", recipient: "Marion" },
  { name: "Zoé", recipient: "Papé" },
  { name: "Seb", recipient: "Agathe" },
  { name: "Papé", recipient: "Thomas" },
  { name: "Jean", recipient: "Nathalie" },
  { name: "Agathe", recipient: "Martin" },
  { name: "Marion", recipient: "Mamé" },
];

function show(screen) {
  for (const section of [home, participantsScreen, revealScreen]) {
    section.hidden = section !== screen;
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderParticipants() {
  list.replaceChildren();
  for (const participant of assignments) {
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
    button.addEventListener("click", () => {
      recipientName.textContent = participant.recipient;
      recipientName.classList.remove("recipient-name-enter");
      // Relance l'animation aussi lorsque le même résultat est ouvert plusieurs fois.
      void recipientName.offsetWidth;
      recipientName.classList.add("recipient-name-enter");
      show(revealScreen);
    });

    row.append(name, arrow, button);
    list.append(row);
  }
}

document.querySelector("#start-button").addEventListener("click", () => {
  renderParticipants();
  show(participantsScreen);
});
document.querySelector("#back-home").addEventListener("click", () => show(home));
document.querySelector("#back-list").addEventListener("click", () => show(participantsScreen));
