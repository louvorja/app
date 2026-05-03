<template>
  <div
    v-if="module && module.show"
    class="liturgy-page"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Overlay de drop -->
    <div v-if="isDraggingOver" class="liturgy-drop-overlay">
      <v-icon icon="mdi-plus-circle-outline" size="48" />
      <span>{{ t("data.drop_hint") }}</span>
    </div>

    <!-- Cabeçalho fixo -->
    <header class="liturgy-toolbar">
      <div class="liturgy-toolbar-title">
        <v-icon icon="mdi-view-list-outline" size="20" />
        <span>{{ t("title") }}</span>
        <span v-if="items.length" class="liturgy-toolbar-count">{{ items.length }}</span>
      </div>

      <!-- Seletor de semana -->
      <div class="liturgy-week-picker">
        <button class="lit-btn lit-btn--ghost lit-week-nav" @click="changeWeek(-1)">
          <v-icon icon="mdi-chevron-left" size="16" />
        </button>
        <input
          type="week"
          class="lit-week-input"
          :value="activeWeek"
          :title="t('week.label')"
          @change="onWeekChange"
        />
        <button class="lit-btn lit-btn--ghost lit-week-nav" @click="changeWeek(1)">
          <v-icon icon="mdi-chevron-right" size="16" />
        </button>
      </div>

      <!-- Cronômetro do culto -->
      <LiturgyTimer
        :running="running"
        :timer-seconds="timerSeconds"
        :timer-display="timerDisplay"
        :has-items="!!items.length"
        @toggle="toggleTimer"
        @prev="timerPrev"
        @next="timerNext"
      />

      <v-spacer />

      <!-- Menu de ações em massa -->
      <div class="lit-menu-anchor">
        <button
          class="lit-btn lit-btn--ghost"
          :title="t('actions.mark_all')"
          @click="menuOpen = !menuOpen"
        >
          <v-icon icon="mdi-dots-vertical" size="16" />
        </button>
        <div v-if="menuOpen" class="lit-dropdown" @mouseleave="menuOpen = false">
          <button class="lit-dropdown-item" @click="markAll(true)">
            <v-icon icon="mdi-check-all" size="14" />
            {{ t("actions.mark_all") }}
          </button>
          <button class="lit-dropdown-item" @click="markAll(false)">
            <v-icon icon="mdi-close-box-multiple-outline" size="14" />
            {{ t("actions.unmark_all") }}
          </button>
          <button class="lit-dropdown-item lit-dropdown-item--danger" @click="removeDone">
            <v-icon icon="mdi-delete-clock-outline" size="14" />
            {{ t("actions.remove_done") }}
          </button>
        </div>
      </div>

      <!-- Toggle anotações -->
      <button
        class="lit-btn lit-btn--ghost"
        :class="{ 'lit-btn--active': showNotes }"
        :title="t('actions.toggle_notes')"
        @click="showNotes = !showNotes"
      >
        <v-icon icon="mdi-note-edit-outline" size="16" />
      </button>

      <!-- Toggle bloqueio -->
      <button
        class="lit-btn lit-btn--ghost"
        :class="{ 'lit-btn--active': locked }"
        :title="t('actions.toggle_lock')"
        @click="toggleLock"
      >
        <v-icon :icon="locked ? 'mdi-lock' : 'mdi-lock-open-outline'" size="16" />
      </button>

      <button
        class="lit-btn lit-btn--ghost"
        :title="t('actions.scheduled_items')"
        @click="openSchedulesDialog"
      >
        <v-icon icon="mdi-calendar-multiselect" size="16" />
        <span class="lit-btn-label">{{ t("actions.scheduled_items_short") }}</span>
      </button>
      <button class="lit-btn lit-btn--ghost" :title="t('actions.save')" @click="saveFile">
        <v-icon icon="mdi-content-save-outline" size="16" />
      </button>
      <button class="lit-btn lit-btn--ghost" :title="t('actions.load')" @click="loadFile">
        <v-icon icon="mdi-folder-open-outline" size="16" />
      </button>
      <button class="lit-btn lit-btn--ghost" :title="t('actions.clear')" @click="confirmClear">
        <v-icon icon="mdi-delete-sweep-outline" size="16" />
      </button>
      <button class="lit-btn lit-btn--ghost" :title="t('actions.close')" @click="closeModule">
        <v-icon icon="mdi-close" size="16" />
      </button>
    </header>

    <!-- Corpo: lista + painel de anotações -->
    <div class="liturgy-body">
      <!-- Lista de itens -->
      <div class="liturgy-list-area" :class="{ 'liturgy-list-area--locked': locked }">
        <!-- Lista vazia -->
        <div v-if="items.length === 0" class="liturgy-empty">
          <v-icon icon="mdi-view-list-outline" size="80" class="text-disabled" />
          <div class="liturgy-empty-title">{{ t("data.empty") }}</div>
          <div class="liturgy-empty-hint">{{ t("data.empty_hint") }}</div>
          <button v-if="!locked" class="lit-btn lit-btn--primary mt-4" @click="openItemDialog()">
            <v-icon icon="mdi-plus" size="16" />
            <span>{{ t("actions.add") }}</span>
          </button>
        </div>

        <!-- Lista de itens (sbLiturgia) -->
        <draggable
          v-else
          :model-value="items"
          item-key="id"
          :disabled="locked"
          handle=".lit-card-grip"
          class="liturgy-list"
          ghost-class="lit-card--ghost"
          @update:model-value="onReorder"
        >
          <template #item="{ element, index }">
            <div class="lit-row">
              <!-- CATEGORIA -->
              <div
                v-if="element.tipo === 'categoria'"
                class="lit-category"
                :style="{ background: element.cor || defaultColor }"
                @click="!locked && openItemDialog(index)"
              >
                <button
                  v-if="!locked"
                  class="lit-card-grip lit-card-grip--cat"
                  :title="t('actions.drag')"
                  @click.stop
                >
                  <v-icon icon="mdi-drag-vertical" size="16" />
                </button>
                <span class="lit-category-text">
                  {{ element.item || t("placeholders.category") }}
                </span>
                <button
                  v-if="!locked"
                  class="lit-card-action"
                  :title="t('actions.edit')"
                  @click.stop="openItemDialog(index)"
                >
                  <v-icon icon="mdi-pencil" size="14" />
                </button>
                <button
                  v-if="!locked"
                  class="lit-card-action"
                  :title="t('actions.remove')"
                  @click.stop="confirmRemove(index)"
                >
                  <v-icon icon="mdi-close" size="14" />
                </button>
              </div>

              <!-- ITEM NORMAL -->
              <div
                v-else
                class="lit-card"
                :class="{
                  'lit-card--checked': isChecked(element),
                  'lit-card--locked': locked,
                  'lit-card--timer-active': running && timerCurrentIndex === index,
                }"
              >
                <!-- Indicador de progresso do timer no item ativo -->
                <div
                  v-if="running && timerCurrentIndex === index"
                  class="lit-card-timer-bar"
                  :style="{ width: timerItemProgress + '%' }"
                />

                <div v-if="!locked" class="lit-card-tools">
                  <button class="lit-card-grip" :title="t('actions.drag')" @click.stop>
                    <v-icon icon="mdi-drag-vertical" size="16" />
                  </button>
                  <button
                    class="lit-card-action"
                    :title="t('actions.edit')"
                    @click.stop="openItemDialog(index)"
                  >
                    <v-icon icon="mdi-pencil" size="14" />
                  </button>
                </div>

                <button
                  class="lit-card-icon"
                  :style="{ background: element.cor || defaultColor }"
                  :title="locked ? '' : t('actions.change_color')"
                  @click.stop="!locked && changeColor(index)"
                >
                  <v-icon :icon="iconForItem(element)" size="20" color="white" />
                </button>

                <button class="lit-card-text" @click="executeItem(element, index)">
                  <div class="lit-card-title">{{ element.item || t("placeholders.untitled") }}</div>
                  <div v-if="subtitleFor(element)" class="lit-card-subtitle">
                    {{ subtitleFor(element) }}
                  </div>
                </button>

                <div v-if="element.tipo === 'musica'" class="lit-card-music-actions">
                  <button
                    v-if="element.has_instrumental_music || element.subtipo === 'ja'"
                    class="lit-music-btn"
                    :title="t('music.play_lyric_pb')"
                    @click.stop="playMusic(element, 'pb')"
                  >
                    <v-icon icon="mdi-music-note-outline" size="14" />
                  </button>
                  <button
                    class="lit-music-btn"
                    :title="t('music.play_lyric')"
                    @click.stop="playMusic(element, 'sung')"
                  >
                    <v-icon icon="mdi-music-note" size="14" />
                  </button>
                  <button
                    class="lit-music-btn"
                    :title="t('music.show_lyric')"
                    @click.stop="playMusic(element, 'lyric')"
                  >
                    <v-icon icon="mdi-text-box-outline" size="14" />
                  </button>
                  <button
                    class="lit-music-btn"
                    :title="t('music.no_audio')"
                    @click.stop="playMusic(element, 'no_audio')"
                  >
                    <v-icon icon="mdi-format-list-bulleted" size="14" />
                  </button>
                </div>

                <div v-if="!locked" class="lit-card-end">
                  <button
                    class="lit-card-action"
                    :title="t('actions.remove')"
                    @click.stop="confirmRemove(index)"
                  >
                    <v-icon icon="mdi-close" size="14" />
                  </button>
                  <label class="lit-card-check" :title="t('actions.mark_done')" @click.stop>
                    <input
                      type="checkbox"
                      :checked="isChecked(element)"
                      @change="toggleChecked(element)"
                    />
                    <span class="lit-check-mark"><v-icon icon="mdi-check" size="14" /></span>
                  </label>
                </div>

                <!-- Em modo bloqueado: só mostra checkbox -->
                <div v-else class="lit-card-end">
                  <label class="lit-card-check" :title="t('actions.mark_done')" @click.stop>
                    <input
                      type="checkbox"
                      :checked="isChecked(element)"
                      @change="toggleChecked(element)"
                    />
                    <span class="lit-check-mark"><v-icon icon="mdi-check" size="14" /></span>
                  </label>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- Painel de anotações por dia -->
      <aside v-if="showNotes" class="liturgy-notes-panel">
        <div class="lit-notes-header">
          <v-icon icon="mdi-note-edit-outline" size="16" />
          <span>{{ t("notes.title") }}</span>
        </div>
        <div class="lit-notes-tabs">
          <button
            v-for="(day, i) in noteDays"
            :key="i"
            class="lit-notes-tab"
            :class="{ 'is-active': noteDayIndex === i }"
            @click="noteDayIndex = i"
          >
            {{ day }}
          </button>
        </div>
        <textarea
          class="lit-notes-area"
          :placeholder="t('notes.placeholder')"
          :value="currentNote"
          @input="onNoteInput"
        />
      </aside>
    </div>

    <!-- Rodapé fixo -->
    <footer v-if="!locked" class="liturgy-footer">
      <span class="liturgy-footer-info">
        <v-icon icon="mdi-clock-outline" size="14" />
        {{ t("data.total") }}: {{ totalDuration }}min
      </span>
      <v-spacer />
      <button class="lit-btn lit-btn--ghost" @click="quickAdd('categoria')">
        <v-icon icon="mdi-format-section" size="14" />
        <span>{{ t("types.categoria") }}</span>
      </button>
      <button class="lit-btn lit-btn--ghost" @click="quickAdd('anotacao')">
        <v-icon icon="mdi-note-text-outline" size="14" />
        <span>{{ t("types.anotacao") }}</span>
      </button>
      <button class="lit-btn lit-btn--primary" @click="openItemDialog()">
        <v-icon icon="mdi-plus" size="16" />
        <span>{{ t("actions.add") }}</span>
      </button>
    </footer>

    <!-- ============================================================== -->
    <!-- DIALOG: Adicionar/Editar Item -->
    <!-- ============================================================== -->
    <v-dialog v-model="dialog" max-width="640" persistent>
      <v-card class="lit-dialog">
        <div class="lit-dialog-title">
          <v-icon :icon="editIndex >= 0 ? 'mdi-pencil' : 'mdi-plus'" size="18" />
          <span>{{ editIndex >= 0 ? t("dialog.edit_title") : t("dialog.add_title") }}</span>
          <v-spacer />
          <button class="lit-card-action" @click="dialog = false">
            <v-icon icon="mdi-close" size="14" />
          </button>
        </div>

        <div class="lit-dialog-header">
          <div class="lit-field">
            <label>{{ t("inputs.type") }}</label>
            <select v-model="form.tipo" class="lit-select" @change="onTypeChange">
              <option value="anotacao">{{ t("types.anotacao") }}</option>
              <option value="arquivo">{{ t("types.arquivo") }}</option>
              <option value="categoria">{{ t("types.categoria") }}</option>
              <option value="itensagendados">{{ t("types.itensagendados") }}</option>
              <option value="musica">{{ t("types.musica") }}</option>
              <option value="site">{{ t("types.site") }}</option>
            </select>
          </div>

          <div v-if="form.tipo !== 'itensagendados'" class="lit-field lit-field--grow">
            <label>{{ t("inputs.item_name") }}</label>
            <input
              v-model="form.item"
              type="text"
              class="lit-input"
              :placeholder="t('inputs.item_name_placeholder')"
            />
          </div>

          <div class="lit-field">
            <label>{{ t("inputs.duration_min") }}</label>
            <input
              v-model.number="form.duration"
              type="number"
              min="0"
              class="lit-input lit-input--small"
            />
          </div>

          <div class="lit-field lit-field--color">
            <label>{{ t("inputs.color") }}</label>
            <div class="lit-color-picker">
              <input v-model="form.cor" type="color" class="lit-color-input" />
              <div class="lit-color-presets">
                <span
                  v-for="c in colors"
                  :key="c"
                  class="lit-color-preset"
                  :class="{ 'is-active': form.cor?.toLowerCase() === c.toLowerCase() }"
                  :style="{ background: c }"
                  @click="form.cor = c"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Painel ANOTAÇÃO -->
        <div v-if="form.tipo === 'anotacao'" class="lit-panel">
          <div class="lit-panel-title">{{ t("types.anotacao") }}</div>
          <div class="lit-field">
            <label>{{ t("inputs.annotation") }}</label>
            <textarea
              v-model="form.subitem"
              rows="4"
              class="lit-input"
              :placeholder="t('inputs.annotation_placeholder')"
            />
          </div>
        </div>

        <!-- Painel SITE -->
        <div v-if="form.tipo === 'site'" class="lit-panel">
          <div class="lit-panel-title">{{ t("types.site") }}</div>
          <div class="lit-field">
            <label>{{ t("inputs.url") }}</label>
            <div class="lit-input-row">
              <input
                v-model="form.url"
                type="text"
                class="lit-input"
                placeholder="https://"
                @blur="form.url = $liturgy.validateUrl(form.url)"
              />
              <button class="lit-btn lit-btn--ghost" :title="t('actions.open')" @click="openSite">
                <v-icon icon="mdi-open-in-new" size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- Painel ARQUIVO -->
        <div v-if="form.tipo === 'arquivo'" class="lit-panel">
          <div class="lit-panel-title">{{ t("types.arquivo") }}</div>
          <div class="lit-field">
            <label>{{ t("inputs.file_path") }}</label>
            <div class="lit-input-row">
              <input
                v-model="form.dir"
                type="text"
                class="lit-input"
                :placeholder="t('inputs.file_path_placeholder')"
              />
              <button
                class="lit-btn lit-btn--ghost"
                :title="t('actions.choose_folder')"
                @click="chooseFolder"
              >
                <v-icon icon="mdi-folder-outline" size="14" />
              </button>
              <button
                class="lit-btn lit-btn--ghost"
                :title="t('actions.choose_file')"
                @click="chooseFile"
              >
                <v-icon icon="mdi-file-outline" size="14" />
              </button>
            </div>
          </div>
          <div class="lit-field-row">
            <label class="lit-radio">
              <input v-model="form.dir_info" type="radio" value="E" />
              {{ t("inputs.path_external") }}
            </label>
            <label class="lit-radio">
              <input v-model="form.dir_info" type="radio" value="I" />
              {{ t("inputs.path_internal") }}
            </label>
          </div>
        </div>

        <!-- Painel MÚSICA -->
        <div v-if="form.tipo === 'musica'" class="lit-panel">
          <div class="lit-panel-title">{{ t("types.musica") }}</div>
          <label class="lit-radio">
            <input type="radio" :checked="form.escolha === '1'" @change="setMusicChoice(true)" />
            {{ t("inputs.music_choose_later") }}
          </label>
          <div v-if="form.escolha !== '1'" class="lit-field mt-2">
            <label>{{ t("inputs.music_select") }}</label>
            <div class="lit-input-row">
              <select
                v-model.number="form.musica"
                class="lit-select lit-select--full"
                @change="onMusicChange"
              >
                <option value="-1">{{ t("inputs.music_pick") }}</option>
                <option v-for="m in musicsList" :key="m.id_music" :value="m.id_music">
                  {{ m.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Painel ITENS AGENDADOS -->
        <div v-if="form.tipo === 'itensagendados'" class="lit-panel">
          <div class="lit-panel-title">{{ t("types.itensagendados") }}</div>
          <div class="lit-field">
            <label>{{ t("inputs.scheduled_category") }}</label>
            <div class="lit-input-row">
              <select
                v-model="form.id"
                class="lit-select lit-select--full"
                @change="onScheduledCategoryChange"
              >
                <option value="">{{ t("inputs.scheduled_pick") }}</option>
                <option v-for="c in scheduledCategories" :key="c.id" :value="c.id">
                  {{ c.nome }}
                </option>
              </select>
              <button
                class="lit-btn lit-btn--ghost"
                :title="t('actions.scheduled_manage')"
                @click="openSchedulesDialog"
              >
                <v-icon icon="mdi-cog-outline" size="14" />
              </button>
            </div>
          </div>
          <div v-if="scheduledCategories.length === 0" class="lit-hint">
            {{ t("inputs.scheduled_empty") }}
          </div>
        </div>

        <!-- CATEGORIA -->
        <div v-if="form.tipo === 'categoria'" class="lit-panel">
          <div class="lit-panel-title">{{ t("types.categoria") }}</div>
          <div class="lit-hint">{{ t("inputs.category_hint") }}</div>
        </div>

        <div class="lit-dialog-footer">
          <button
            v-if="editIndex >= 0"
            class="lit-btn lit-btn--danger"
            @click="confirmRemove(editIndex, true)"
          >
            <v-icon icon="mdi-delete" size="14" />
            <span>{{ t("actions.remove") }}</span>
          </button>
          <v-spacer />
          <button class="lit-btn lit-btn--ghost" @click="dialog = false">
            {{ t("actions.cancel") }}
          </button>
          <button class="lit-btn lit-btn--primary" @click="saveItem">
            <v-icon :icon="editIndex >= 0 ? 'mdi-content-save' : 'mdi-plus'" size="14" />
            <span>{{ editIndex >= 0 ? t("actions.save") : t("actions.add") }}</span>
          </button>
        </div>
      </v-card>
    </v-dialog>

    <!-- ============================================================== -->
    <!-- DIALOG: Itens Agendados -->
    <!-- ============================================================== -->
    <v-dialog v-model="schedulesDialog" max-width="780" persistent>
      <v-card class="lit-dialog">
        <div class="lit-dialog-title">
          <v-icon icon="mdi-calendar-multiselect" size="18" />
          <span>{{ t("schedules.title") }}</span>
          <v-spacer />
          <button class="lit-card-action" @click="schedulesDialog = false">
            <v-icon icon="mdi-close" size="14" />
          </button>
        </div>

        <div class="lit-schedules">
          <aside class="lit-schedules-left">
            <div class="lit-schedules-head">
              <span>{{ t("schedules.categories") }}</span>
              <button
                class="lit-card-action"
                :title="t('schedules.add_category')"
                @click="addCategory"
              >
                <v-icon icon="mdi-plus" size="14" />
              </button>
            </div>
            <ul class="lit-schedules-cats">
              <li v-if="scheduledCategories.length === 0" class="lit-hint pa-2">
                {{ t("schedules.no_categories") }}
              </li>
              <li
                v-for="c in scheduledCategories"
                :key="c.id"
                :class="['lit-schedules-cat', { 'is-active': activeCatId === c.id }]"
                @click="activeCatId = c.id"
              >
                <input
                  v-if="editingCatId === c.id"
                  v-model="editingCatName"
                  class="lit-input"
                  @blur="saveCategoryName(c.id)"
                  @keyup.enter="saveCategoryName(c.id)"
                  @keyup.esc="editingCatId = null"
                />
                <span v-else @dblclick="startEditingCategory(c)">{{ c.nome }}</span>
                <v-spacer />
                <button
                  class="lit-card-action"
                  :title="t('actions.edit')"
                  @click.stop="startEditingCategory(c)"
                >
                  <v-icon icon="mdi-pencil" size="12" />
                </button>
                <button
                  class="lit-card-action"
                  :title="t('actions.remove')"
                  @click.stop="removeCategory(c.id)"
                >
                  <v-icon icon="mdi-close" size="12" />
                </button>
              </li>
            </ul>
          </aside>

          <section class="lit-schedules-right">
            <div class="lit-schedules-head">
              <span v-if="activeCategory">{{ activeCategory.nome }}</span>
              <span v-else>{{ t("schedules.select_category") }}</span>
              <v-spacer />
              <button
                v-if="activeCategory"
                class="lit-btn lit-btn--primary"
                @click="addScheduledItem"
              >
                <v-icon icon="mdi-plus" size="14" />
                <span>{{ t("schedules.add_item") }}</span>
              </button>
            </div>

            <div v-if="!activeCategory" class="lit-empty">
              {{ t("schedules.select_category_hint") }}
            </div>

            <div v-else class="lit-schedules-table">
              <div class="lit-schedules-row lit-schedules-row--head">
                <div class="col-date">{{ t("schedules.date") }}</div>
                <div class="col-name">{{ t("schedules.item_name") }}</div>
                <div class="col-file">{{ t("schedules.file") }}</div>
                <div class="col-actions"></div>
              </div>
              <div v-if="categoryItems.length === 0" class="lit-empty">
                {{ t("schedules.no_items") }}
              </div>
              <div v-for="it in categoryItems" :key="it.id" class="lit-schedules-row">
                <div class="col-date">
                  <input
                    v-model="it.data"
                    type="date"
                    class="lit-input"
                    @change="updateScheduled(it)"
                  />
                </div>
                <div class="col-name">
                  <input
                    v-model="it.nome"
                    type="text"
                    class="lit-input"
                    @change="updateScheduled(it)"
                  />
                </div>
                <div class="col-file">
                  <input
                    v-model="it.arquivo"
                    type="text"
                    class="lit-input"
                    @change="updateScheduled(it)"
                  />
                </div>
                <div class="col-actions">
                  <button
                    class="lit-card-action"
                    :title="t('actions.remove')"
                    @click="removeScheduled(it.id)"
                  >
                    <v-icon icon="mdi-close" size="12" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="lit-dialog-footer">
          <v-spacer />
          <button class="lit-btn lit-btn--primary" @click="schedulesDialog = false">
            {{ t("actions.close") }}
          </button>
        </div>
      </v-card>
    </v-dialog>

    <!-- Hidden file input para load -->
    <input
      ref="fileInput"
      type="file"
      accept=".json,.ja"
      style="display: none"
      @change="onFileLoad"
    />
  </div>
</template>

<script>
import draggable from "vuedraggable";
import manifest from "../manifest.json";
import pt from "../lang/pt.json";
import es from "../lang/es.json";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import { useLiturgyPersistence } from "../composables/useLiturgyPersistence";
import { useLiturgyItems, COLORS, DEFAULT_COLOR } from "../composables/useLiturgyItems";
import { useLiturgyTimer } from "../composables/useLiturgyTimer";
import LiturgyTimer from "./LiturgyTimer.vue";

const TRANSLATIONS = { pt, es };

export default {
  name: "LiturgyModule",
  components: { draggable, LiturgyTimer },
  setup() {
    const persist = useLiturgyPersistence();
    const litItems = useLiturgyItems(persist.activeWeek, persist.scheduledCategories);
    const timer = useLiturgyTimer(litItems.items, litItems.totalDuration);

    return {
      // ── persistence ──
      activeWeek: persist.activeWeek,
      locked: persist.locked,
      showNotes: persist.showNotes,
      noteDayIndex: persist.noteDayIndex,
      schedulesDialog: persist.schedulesDialog,
      activeCatId: persist.activeCatId,
      editingCatId: persist.editingCatId,
      editingCatName: persist.editingCatName,
      scheduledCategories: persist.scheduledCategories,
      activeCategory: persist.activeCategory,
      categoryItems: persist.categoryItems,
      noteDays: persist.noteDays,
      currentNote: persist.currentNote,
      onWeekChange: persist.onWeekChange,
      changeWeek: persist.changeWeek,
      toggleLock: persist.toggleLock,
      onNoteInput: persist.onNoteInput,
      openSchedulesDialog: persist.openSchedulesDialog,
      addCategory: persist.addCategory,
      startEditingCategory: persist.startEditingCategory,
      saveCategoryName: persist.saveCategoryName,
      removeCategory: persist.removeCategory,
      addScheduledItem: persist.addScheduledItem,
      updateScheduled: persist.updateScheduled,
      removeScheduled: persist.removeScheduled,
      saveFile: persist.saveFile,
      onFileLoad: persist.onFileLoad,

      // ── items ──
      items: litItems.items,
      totalDuration: litItems.totalDuration,
      dialog: litItems.dialog,
      editIndex: litItems.editIndex,
      form: litItems.form,
      colors: COLORS,
      defaultColor: DEFAULT_COLOR,
      musicsList: litItems.musicsList,
      isDraggingOver: litItems.isDraggingOver,
      menuOpen: litItems.menuOpen,
      isChecked: litItems.isChecked,
      toggleChecked: litItems.toggleChecked,
      onReorder: litItems.onReorder,
      iconForItem: litItems.iconForItem,
      subtitleFor: litItems.subtitleFor,
      changeColor: litItems.changeColor,
      markAll: litItems.markAll,
      removeDone: litItems.removeDone,
      openItemDialog: litItems.openItemDialog,
      quickAdd: litItems.quickAdd,
      onTypeChange: litItems.onTypeChange,
      setMusicChoice: litItems.setMusicChoice,
      onMusicChange: litItems.onMusicChange,
      onScheduledCategoryChange: litItems.onScheduledCategoryChange,
      saveItem: litItems.saveItem,
      confirmRemove: litItems.confirmRemove,
      confirmClear: () => litItems.confirmClear(timer.stopTimer),
      executeItem: litItems.executeItem,
      playMusic: litItems.playMusic,
      openSite: litItems.openSite,
      chooseFolder: litItems.chooseFolder,
      chooseFile: litItems.chooseFile,
      onDragOver: litItems.onDragOver,
      onDrop: litItems.onDrop,

      // ── timer ──
      running: timer.running,
      timerSeconds: timer.timerSeconds,
      timerCurrentIndex: timer.timerCurrentIndex,
      timerItemProgress: timer.timerItemProgress,
      timerDisplay: timer.timerDisplay,
      toggleTimer: timer.toggleTimer,
      timerNext: timer.timerNext,
      timerPrev: timer.timerPrev,

      // refs privados para lifecycle hooks
      _litItems: litItems,
      _persist: persist,
      _timer: timer,
    };
  },
  computed: {
    module() {
      return this.$modules.get("liturgy");
    },
  },
  async mounted() {
    await this._litItems.loadMusicsList();
    this._broadcastUnlisten = this.$broadcast.listen((data) => {
      if (data?.type === BROADCAST_TYPE.LITURGY_NEW_ANNOTATION) {
        this.$modules.open("liturgy");
        this.$nextTick(() => {
          this._litItems.openItemDialog();
          this._litItems.form.value.tipo = "anotacao";
        });
      }
    });
  },
  beforeUnmount() {
    this._timer.stopTimer();
    if (typeof this._broadcastUnlisten === "function") {
      this._broadcastUnlisten();
    }
  },
  methods: {
    t(key) {
      const lang = this.$i18n?.locale || "pt";
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.pt;
      const path = key.split(".");
      let cur = dict;
      for (const k of path) {
        if (cur && typeof cur === "object" && k in cur) cur = cur[k];
        else return key;
      }
      return typeof cur === "string" ? cur : key;
    },
    closeModule() {
      this._timer.stopTimer();
      this.$modules.close("liturgy");
    },
    loadFile() {
      this.$refs.fileInput.click();
    },
    onDragLeave(e) {
      if (!this.$el.contains(e.relatedTarget)) {
        this._litItems.isDraggingOver.value = false;
      }
    },
  },
};
</script>

<style scoped>
.liturgy-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-size: 13px;
}

/* ====================== Overlay de drag-drop ====================== */
.liturgy-drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(var(--lj-navy-ch), 0.15);
  border: 3px dashed var(--lj-navy);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--lj-navy);
  font-size: 16px;
  font-weight: 600;
  pointer-events: none;
}

/* ====================== Header (toolbar) ====================== */
.liturgy-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.04));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
  min-height: 38px;
  flex-wrap: wrap;
}
.liturgy-toolbar-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 14px;
}
.liturgy-toolbar-count {
  background: rgba(var(--lj-on-surface-ch), 0.1);
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
}

/* Seletor de semana */
.liturgy-week-picker {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 4px;
}
.lit-week-input {
  height: 26px;
  padding: 0 6px;
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  font-size: 12px;
  font-family: inherit;
  outline: none;
  cursor: pointer;
}
.lit-week-input:focus {
  border-color: var(--lj-navy);
}
.lit-btn.lit-week-nav {
  padding: 0 4px;
  min-width: 24px;
}

/* Botão ativo (notas, lock) */
.lit-btn.lit-btn--active {
  background: rgba(var(--lj-navy-ch), 0.15);
  color: var(--lj-navy);
  border-color: rgba(var(--lj-navy-ch), 0.4);
}

/* Esconde label em toolbars comprimidas */
.lit-btn-label {
  display: none;
}
@media (min-width: 700px) {
  .lit-btn-label {
    display: inline;
  }
}

/* ====================== Corpo (lista + notas) ====================== */
.liturgy-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.liturgy-list-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.liturgy-list-area--locked .lit-card {
  border-left: 3px solid rgba(var(--lj-navy-ch), 0.3);
}

/* ====================== Lista de itens ====================== */
.liturgy-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lit-row {
  display: contents;
}

/* ====================== Card item normal ====================== */
.lit-card {
  display: flex;
  align-items: stretch;
  background: var(--lj-surface-bg);
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 4px;
  height: 56px;
  transition:
    background 0.15s,
    border-color 0.15s;
  overflow: hidden;
  position: relative;
}
.lit-card:hover {
  border-color: rgba(var(--lj-navy-ch), 0.5);
  background: rgba(var(--lj-navy-ch), 0.03);
}
.lit-card--checked {
  background: rgba(78, 213, 255, 0.06);
  border-color: rgba(78, 213, 255, 0.4);
}
.lit-card--ghost {
  opacity: 0.4;
  background: rgba(var(--lj-navy-ch), 0.1);
}
.lit-card--timer-active {
  border-color: rgba(var(--lj-navy-ch), 0.8);
  box-shadow: 0 0 0 2px rgba(var(--lj-navy-ch), 0.2);
}

/* Barra de progresso do timer */
.lit-card-timer-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--lj-navy);
  transition: width 1s linear;
  z-index: 1;
}

.lit-card-tools {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(var(--v-border-color), 0.3);
  background: rgba(var(--lj-on-surface-ch), 0.03);
}
.lit-card-grip,
.lit-card-action {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex: 1;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  padding: 0;
}
.lit-card-grip {
  cursor: grab;
}
.lit-card-grip:active {
  cursor: grabbing;
}
.lit-card-action:hover {
  background: rgba(var(--lj-on-surface-ch), 0.08);
  color: var(--lj-text);
}
.lit-card-grip--cat {
  height: 100%;
  width: 28px;
  color: rgba(255, 255, 255, 0.7);
}
.lit-card-grip--cat:hover {
  color: white;
}

.lit-card-icon {
  width: 56px;
  flex-shrink: 0;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.15s;
}
.lit-card-icon:hover {
  filter: brightness(1.15);
}

.lit-card-text {
  flex: 1;
  text-align: left;
  background: transparent;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}
.lit-card-title {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lit-card--checked .lit-card-title {
  text-decoration: line-through;
  opacity: 0.6;
}
.lit-card-subtitle {
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lit-card--checked .lit-card-subtitle {
  text-decoration: line-through;
}

.lit-card-music-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 0 4px;
  border-left: 1px solid rgba(var(--v-border-color), 0.3);
}
.lit-music-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 3px;
  cursor: pointer;
  color: rgba(var(--lj-on-surface-ch), 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
.lit-music-btn:hover {
  background: rgba(var(--lj-navy-ch), 0.15);
  color: var(--lj-navy);
}

.lit-card-end {
  display: flex;
  align-items: center;
  border-left: 1px solid rgba(var(--v-border-color), 0.3);
  padding: 0 4px;
  gap: 2px;
}
.lit-card-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  cursor: pointer;
  position: relative;
}
.lit-card-check input {
  position: absolute;
  opacity: 0;
  inset: 0;
  cursor: pointer;
}
.lit-check-mark {
  width: 18px;
  height: 18px;
  border: 1.5px solid rgba(var(--lj-on-surface-ch), 0.4);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  background: transparent;
}
.lit-card-check input:checked ~ .lit-check-mark {
  border-color: var(--lj-navy);
  background: var(--lj-navy);
  color: white;
}

/* ====================== Categoria ====================== */
.lit-category {
  display: flex;
  align-items: center;
  height: 36px;
  margin-top: 12px;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.02em;
  padding-right: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.lit-category:hover {
  filter: brightness(1.1);
}
.lit-category-text {
  flex: 1;
  text-align: center;
  text-transform: uppercase;
}
.lit-category .lit-card-action {
  color: rgba(255, 255, 255, 0.85);
}
.lit-category .lit-card-action:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* ====================== Empty state ====================== */
.liturgy-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
}
.liturgy-empty-title {
  font-size: 18px;
  font-weight: 500;
  margin-top: 12px;
}
.liturgy-empty-hint {
  font-size: 13px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  margin-top: 4px;
}

/* ====================== Footer ====================== */
.liturgy-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(var(--lj-on-surface-ch), 0.03);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
  min-height: 38px;
}
.liturgy-footer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(var(--lj-on-surface-ch), 0.7);
}

/* ====================== Anotações por dia ====================== */
.liturgy-notes-panel {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(var(--v-border-color), 0.3);
  background: rgba(var(--lj-on-surface-ch), 0.02);
}
.lit-notes-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-weight: 500;
  font-size: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
  background: rgba(var(--lj-on-surface-ch), 0.04);
}
.lit-notes-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 6px 2px;
}
.lit-notes-tab {
  padding: 2px 7px;
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 3px;
  background: transparent;
  font-size: 11px;
  cursor: pointer;
  color: rgba(var(--lj-on-surface-ch), 0.7);
}
.lit-notes-tab:hover {
  background: rgba(var(--lj-on-surface-ch), 0.06);
}
.lit-notes-tab.is-active {
  background: var(--lj-navy);
  color: var(--lj-white);
  border-color: var(--lj-navy);
}
.lit-notes-area {
  flex: 1;
  margin: 6px;
  padding: 8px;
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  font-size: 12px;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.5;
}
.lit-notes-area:focus {
  border-color: var(--lj-navy);
}

/* ====================== Buttons ====================== */
.lit-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: rgba(var(--lj-on-surface-ch), 0.06);
  color: var(--lj-text);
  transition:
    background 0.15s,
    border 0.15s;
  white-space: nowrap;
}
.lit-btn:hover {
  background: rgba(var(--lj-on-surface-ch), 0.12);
}
.lit-btn--ghost {
  background: transparent;
  border: 1px solid transparent;
}
.lit-btn--ghost:hover {
  background: rgba(var(--lj-on-surface-ch), 0.06);
  border-color: rgba(var(--v-border-color), 0.4);
}
.lit-btn--primary {
  background: var(--lj-navy);
  color: var(--lj-white);
}
.lit-btn--primary:hover {
  filter: brightness(1.1);
}
.lit-btn--danger {
  background: #dc2626;
  color: white;
}
.lit-btn--danger:hover {
  background: #b91c1c;
}

/* ====================== Dropdown menu ====================== */
.lit-menu-anchor {
  position: relative;
}
.lit-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 200;
  background: var(--lj-surface-bg);
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  min-width: 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.lit-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--lj-text);
  text-align: left;
}
.lit-dropdown-item:hover {
  background: rgba(var(--lj-on-surface-ch), 0.06);
}
.lit-dropdown-item--danger {
  color: #dc2626;
}
.lit-dropdown-item--danger:hover {
  background: rgba(220, 38, 38, 0.08);
}

/* ====================== Dialog ====================== */
.lit-dialog {
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  border-radius: 6px;
  overflow: hidden;
}
.lit-dialog-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.1));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-weight: 500;
}
.lit-dialog-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(var(--lj-on-surface-ch), 0.02);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
}
.lit-dialog-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid rgba(var(--v-border-color), 0.2);
  background: rgba(var(--lj-on-surface-ch), 0.02);
}
.lit-panel {
  padding: 12px 14px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
}
.lit-panel-title {
  font-weight: 500;
  font-size: 12px;
  color: rgba(var(--lj-on-surface-ch), 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.lit-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 1;
}
.lit-field--grow {
  flex: 1;
  min-width: 200px;
}
.lit-field--color {
  flex-shrink: 0;
}
.lit-field-row {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-top: 8px;
}
.lit-field label {
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.7);
  font-weight: 500;
}
.lit-input,
.lit-select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  font-size: 13px;
  font-family: inherit;
  width: 100%;
  outline: none;
}
.lit-input--small {
  width: 70px;
}
.lit-input:focus,
.lit-select:focus {
  border-color: var(--lj-navy);
  box-shadow: 0 0 0 2px rgba(var(--lj-navy-ch), 0.15);
}
textarea.lit-input {
  height: auto;
  padding: 6px 8px;
  resize: vertical;
}
.lit-input-row {
  display: flex;
  gap: 4px;
  align-items: center;
}
.lit-input-row .lit-input {
  flex: 1;
}
.lit-select--full {
  width: 100%;
}

.lit-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
}
.lit-hint {
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  padding: 4px 0;
}

.lit-color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lit-color-input {
  width: 40px;
  height: 30px;
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 3px;
  cursor: pointer;
  padding: 0;
  background: transparent;
}
.lit-color-presets {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 3px;
}
.lit-color-preset {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  cursor: pointer;
  border: 1.5px solid rgba(var(--v-border-color), 0.3);
}
.lit-color-preset:hover {
  transform: scale(1.15);
}
.lit-color-preset.is-active {
  border-color: white;
  box-shadow: 0 0 0 2px var(--lj-navy);
}

/* ====================== Schedules dialog ====================== */
.lit-schedules {
  display: flex;
  min-height: 400px;
  max-height: 60vh;
}
.lit-schedules-left {
  width: 240px;
  border-right: 1px solid rgba(var(--v-border-color), 0.3);
  display: flex;
  flex-direction: column;
}
.lit-schedules-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.lit-schedules-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(var(--lj-on-surface-ch), 0.04);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
  font-weight: 500;
  font-size: 12px;
}
.lit-schedules-cats {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}
.lit-schedules-cat {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
  font-size: 12px;
}
.lit-schedules-cat:hover {
  background: rgba(var(--lj-on-surface-ch), 0.04);
}
.lit-schedules-cat.is-active {
  background: rgba(var(--lj-navy-ch), 0.1);
  color: var(--lj-navy);
  font-weight: 500;
}
.lit-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--lj-on-surface-ch), 0.5);
  font-size: 12px;
  padding: 20px;
  text-align: center;
}
.lit-schedules-table {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.lit-schedules-row {
  display: grid;
  grid-template-columns: 130px 1fr 1fr 30px;
  gap: 4px;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
  align-items: center;
}
.lit-schedules-row--head {
  background: rgba(var(--lj-on-surface-ch), 0.04);
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  color: rgba(var(--lj-on-surface-ch), 0.7);
}
.lit-schedules-row .lit-input {
  height: 26px;
  font-size: 12px;
}

.mt-2 {
  margin-top: 8px;
}
.mt-4 {
  margin-top: 16px;
}
.pa-2 {
  padding: 8px;
}
</style>
