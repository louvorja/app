import $storage from "@/helpers/Storage";
import $appdata from "@/helpers/AppData";
import $popup from "@/helpers/Popup";

const STORAGE_KEY = "flashcard_decks";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function newCard(front = "", back = "") {
  return { id: uid(), front, back };
}

function newDeck(title = "") {
  return { id: uid(), title, cards: [newCard()] };
}

export default {
  uid,
  newCard,
  newDeck,

  load() {
    return $storage.get(STORAGE_KEY, []);
  },

  save(decks) {
    $storage.set(STORAGE_KEY, decks);
  },

  isSessionOpen() {
    return !!$appdata.get("popup") && $appdata.get("popup_module") == "flashcards";
  },

  /**
   * Abre a apresentação na tela pública e mostra a carta atual da ordem
   * escolhida (already resolvida pelo chamador — shuffle/limite ficam
   * a cargo da tela de controle).
   */
  present(deckTitle, card, position, total) {
    $appdata.set("modules.flashcards.data", {
      deck_title: deckTitle,
      front: card.front,
      back: card.back,
      show_answer: false,
      position,
      total,
    });
    $popup.open("flashcards");
  },

  showCard(card, position, total) {
    const data = $appdata.get("modules.flashcards.data") || {};
    $appdata.set("modules.flashcards.data", {
      ...data,
      front: card.front,
      back: card.back,
      show_answer: false,
      position,
      total,
    });
  },

  toggleAnswer() {
    $appdata.toogle("modules.flashcards.data.show_answer");
  },

  stop() {
    $popup.exit();
  },
};
