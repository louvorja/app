<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <div class="d-flex align-stretch" style="height: 100%; overflow: hidden">
      <!-- Lista de baralhos -->
      <div style="width: 260px; min-width: 260px; overflow-y: auto" class="border-e">
        <v-list density="compact" nav>
          <v-list-item
            v-for="deck in decks"
            :key="deck.id"
            :active="deck.id == selectedId"
            link
            @click="selectedId = deck.id"
          >
            <v-list-item-title class="text-truncate">
              {{ deck.title || t("untitled") }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ deck.cards.length }} card(s)</v-list-item-subtitle>
            <template v-slot:append>
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="x-small"
                @click.stop="removeDeck(deck)"
              />
            </template>
          </v-list-item>

          <v-list-item v-if="!decks.length">
            <v-list-item-subtitle class="text-wrap">{{ t("no_decks") }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-btn block variant="tonal" class="ma-2" prepend-icon="mdi-plus" @click="addDeck">
          {{ t("new_deck") }}
        </v-btn>
      </div>

      <!-- Editor do baralho selecionado -->
      <div class="flex-grow-1 pa-4" style="overflow-y: auto">
        <template v-if="selectedDeck">
          <div class="d-flex align-center mb-4 ga-2">
            <v-text-field
              v-model="selectedDeck.title"
              :label="t('deck_title')"
              density="compact"
              variant="outlined"
              hide-details
              class="flex-grow-1"
            />
            <v-btn
              v-if="!isSessionActive"
              color="primary"
              variant="flat"
              prepend-icon="mdi-cast"
              :disabled="!selectedDeck.cards.length"
              @click="openPresentDialog"
            >
              {{ t("present") }}
            </v-btn>
          </div>

          <!-- Controles da sessão de apresentação -->
          <v-card v-if="isSessionActive" class="mb-4" color="primary" variant="tonal">
            <v-card-text class="d-flex align-center flex-wrap ga-2">
              <span class="font-weight-medium">{{ session.pos + 1 }} / {{ session.order.length }}</span>
              <v-spacer />
              <v-btn size="small" variant="tonal" :disabled="session.pos == 0" @click="prevCard">
                {{ t("session.prev") }}
              </v-btn>
              <v-btn size="small" variant="tonal" @click="toggleAnswer">
                {{ showingAnswer ? t("session.hide") : t("session.reveal") }}
              </v-btn>
              <v-btn
                size="small"
                variant="tonal"
                :disabled="session.pos >= session.order.length - 1"
                @click="nextCard"
              >
                {{ t("session.next") }}
              </v-btn>
              <v-btn size="small" color="error" variant="flat" @click="stopPresentation">
                {{ t("session.stop") }}
              </v-btn>
            </v-card-text>
          </v-card>

          <draggable
            v-model="selectedDeck.cards"
            item-key="id"
            handle=".flashcard-handle"
            :delay="200"
            delay-on-touch-only
            :touch-start-threshold="5"
          >
            <template #item="{ element: card, index }">
              <v-card class="mb-3" variant="outlined">
                <v-card-text class="d-flex align-start pa-3">
                  <v-icon icon="mdi-drag-vertical" class="flashcard-handle mt-2 me-2" style="cursor: move" />
                  <div class="flex-grow-1">
                    <v-text-field
                      v-model="card.front"
                      :label="t('card.front')"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="mb-2"
                    />
                    <v-text-field
                      v-model="card.back"
                      :label="t('card.back')"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </div>
                  <v-btn
                    icon="mdi-close"
                    :title="t('card.delete')"
                    variant="text"
                    size="small"
                    class="ms-2"
                    @click="removeCard(index)"
                  />
                </v-card-text>
              </v-card>
            </template>
          </draggable>

          <div v-if="!selectedDeck.cards.length" class="text-caption text-medium-emphasis text-center pa-4">
            {{ t("no_cards") }}
          </div>

          <v-btn block variant="text" prepend-icon="mdi-plus" @click="addCard">
            {{ t("card.add") }}
          </v-btn>
        </template>

        <div v-else class="d-flex align-center justify-center text-medium-emphasis" style="height: 100%">
          {{ t("select_deck") }}
        </div>
      </div>
    </div>

    <v-dialog v-model="presentDialog" max-width="420">
      <v-card>
        <v-card-title>{{ t("present_dialog.title") }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="presentCount"
            type="number"
            :min="1"
            :max="selectedDeck?.cards.length"
            :label="t('present_dialog.count')"
            :hint="t('present_dialog.count_hint', { n: selectedDeck?.cards.length })"
            persistent-hint
            density="compact"
            variant="outlined"
            class="mb-2"
          />
          <v-switch
            v-model="presentShuffle"
            color="primary"
            density="compact"
            hide-details
            :label="t('present_dialog.shuffle')"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="presentDialog = false">{{ t("present_dialog.cancel") }}</v-btn>
          <v-btn color="primary" variant="flat" @click="startPresentation">
            {{ t("present_dialog.start") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </ModuleContainer>
</template>

<script>
import draggable from "vuedraggable";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";

export default {
  name: manifest.id,
  components: {
    ModuleContainer,
    draggable,
  },
  data: () => ({
    decks: [],
    selectedId: null,
    presentDialog: false,
    presentCount: null,
    presentShuffle: false,
    session: null,
  }),
  computed: {
    /* COMPUTEDS OBRIGATÓRIAS - INÍCIO */
    /* NÃO MODIFICAR */
    module_id() {
      return manifest.id;
    },
    module() {
      return this.$modules.get(this.module_id);
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */

    manifest() {
      return manifest;
    },
    selectedDeck() {
      return this.decks.find((deck) => deck.id == this.selectedId);
    },
    isSessionActive() {
      return !!this.session;
    },
    showingAnswer() {
      return !!this.$appdata.get("modules.flashcards.data.show_answer");
    },
  },
  watch: {
    decks: {
      deep: true,
      handler() {
        this.$flashcards.save(this.decks);
      },
    },
  },
  methods: {
    t(text, params) {
      return this.$t(`modules.${this.module_id}.${text}`, params);
    },
    addDeck() {
      const deck = this.$flashcards.newDeck(this.t("new_deck"));
      this.decks.push(deck);
      this.selectedId = deck.id;
    },
    removeDeck(deck) {
      this.$alert.yesno(`modules.${this.module_id}.delete_deck_confirm`, (btn) => {
        if (btn == "yes") {
          const index = this.decks.findIndex((item) => item.id == deck.id);
          if (index >= 0) {
            this.decks.splice(index, 1);
          }
          if (this.selectedId == deck.id) {
            this.selectedId = null;
          }
        }
      });
    },
    addCard() {
      this.selectedDeck.cards.push(this.$flashcards.newCard());
    },
    removeCard(index) {
      this.$alert.yesno(`modules.${this.module_id}.card.delete_confirm`, (btn) => {
        if (btn == "yes") {
          this.selectedDeck.cards.splice(index, 1);
        }
      });
    },
    openPresentDialog() {
      this.presentCount = null;
      this.presentShuffle = false;
      this.presentDialog = true;
    },
    startPresentation() {
      const total = this.selectedDeck.cards.length;
      let order = Array.from({ length: total }, (_, i) => i);
      if (this.presentShuffle) {
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
      }
      const count = this.presentCount ? Math.min(this.presentCount, total) : total;
      order = order.slice(0, count);

      this.session = { order, pos: 0 };
      this.presentDialog = false;

      const card = this.selectedDeck.cards[order[0]];
      this.$flashcards.present(this.selectedDeck.title, card, 1, order.length);
    },
    pushCurrentCard() {
      const card = this.selectedDeck.cards[this.session.order[this.session.pos]];
      this.$flashcards.showCard(card, this.session.pos + 1, this.session.order.length);
    },
    nextCard() {
      if (this.session.pos < this.session.order.length - 1) {
        this.session.pos++;
        this.pushCurrentCard();
      }
    },
    prevCard() {
      if (this.session.pos > 0) {
        this.session.pos--;
        this.pushCurrentCard();
      }
    },
    toggleAnswer() {
      this.$flashcards.toggleAnswer();
    },
    stopPresentation() {
      this.$flashcards.stop();
      this.session = null;
    },
  },
  created() {
    this.decks = this.$flashcards.load();
    if (this.decks.length) {
      this.selectedId = this.decks[0].id;
    }
  },
};
</script>
