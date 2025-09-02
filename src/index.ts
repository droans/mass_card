import { LitElement, html, type TemplateResult, type CSSResultGroup, PropertyValues } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { customElement, state } from 'lit/decorators.js';
import {
  type HomeAssistant,
} from 'custom-card-helpers';

import { QueueItem, Config } from './types'
import HassService from './services'
import styles from './styles';
import { ConfigErrors, DEFAULT_CONFIG } from './const'
import './media-row'
import { version } from '../package.json';

const DEV = false;

const cardId = 'mass-card';
const cardName = 'Music Assistant Queue Card';
const cardDescription = 'Music Assistant Queue Card for Home Assistant';
const cardUrl = 'https://github.com/droans/mass_card';

declare global {
  interface Window {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    loadCardHelpers?: () => Promise<any>;
  }
}

      /* eslint-disable-next-line 
        no-console, 
      */
console.info(
  `%c ${cardName}${DEV ? ' DEV' : ''} \n%c Version v${version}`,
  'color: teal; font-weight: bold; background: lightgray',
  'color: darkblue; font-weight: bold; background: white',
);
/* eslint-disable @typescript-eslint/no-explicit-any */
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  /* eslint-enable */
  type: `${cardId}${DEV ? '-dev' : ''}`,
  name: `${cardName}${DEV ? ' DEV' : ''}`,
  preview: false,
  description: cardDescription,
  documentationURL: cardUrl,
});

@customElement(`${cardId}${DEV ? '-dev' : ''}`)
export class MusicAssistantCard extends LitElement {
  @state() private lastUpdated = '';
  @state() private queue: QueueItem[] = [];
  @state() private config!: Config;
  @state() private error?: TemplateResult;

  private newId = '';
  private _hass!: HomeAssistant;
  private services!: HassService;
  private _listening = false;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private _unsubscribe: any;
  private queueID = '';
  private failCt = 0;
  private maxFailCt = 5;
  private hasFailed = false;

  constructor() {
    super();
    this.queue = [];
  }
  public set hass(hass: HomeAssistant) {
    if (!hass) {
      return;
    }
    const lastUpdated = hass.states[this.config.entity].last_updated;
    if (lastUpdated !== this.lastUpdated) {
      this.lastUpdated = lastUpdated;
    }
    this._hass = hass;
  }
  public get hass() {
    return this._hass;
  }
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private eventListener = (event: any) => {
    const event_data = event.data;
    if (event_data.type == 'queue_updated') {
      const updated_queue_id = event_data.data.queue_id;
      if (updated_queue_id == this.queueID) {
        this.getQueue();
    }}
  }
  private subscribeUpdates() {
    this._unsubscribe = this.hass.connection.subscribeEvents(
      this.eventListener, 
      "mass_queue"
    );
    this._listening = true;
  }
  static getConfigElement() {
    return document.createElement(`${cardId}-editor${DEV ? '-dev' : ''}`);
  }

  static getStubConfig() {
    return {
      entity: [],
      title: "Player Queue",
      expanded: false
     };
  }

  private testConfig(config: Config) {
    if (!config) {
      return ConfigErrors.CONFIG_MISSING;
    }
    if (!config.entity) {
      return ConfigErrors.NO_ENTITY;
    };
    if (typeof(config.entity) !== "string") {
      return ConfigErrors.ENTITY_TYPE;
    }
    if (this.hass) {
      if (!this.hass.states[config.entity]) {
        return ConfigErrors.MISSING_ENTITY;
      }
    }
    return ConfigErrors.OK;
  }
  public setConfig(config: Config) {
    const status = this.testConfig(config);
    if (status !== ConfigErrors.OK) {
      throw this.createError(status);
    }
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    }
  }
  private getQueueItemIndex(queue_item_id: string, queue: QueueItem[] = []): number {
    if (!queue.length) {
      queue = this.queue;
    }
    return queue.findIndex(item => item.queue_item_id == queue_item_id)
  }
  private moveQueueItem(old_index, new_index) {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    this.queue.splice(new_index, 0, this.queue.splice(old_index, 1)[0]);
  }
  private getQueue() {
    if (!this.services) {
      return;
    }
    if (this.testConfig(this.config) !== ConfigErrors.OK || this.hasFailed) {
      return;
    }
    if (this.failCt >= this.maxFailCt) {
      this.hasFailed = true;
      throw this.createError(`Failed to get queue ${this.failCt} times! Please check card config and that the services are working properly.`)
      return
    }
    try {
      /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
      this.services.getQueue(this.config.limit_before, this.config.limit_after).then(
        (queue) => {
          if (queue == null) {
            this.failCt ++;
            return;
          }
          this.queue = this.updateActiveTrack(queue);
        }
      );
      this.queueID = this.hass.states[this.config.entity].attributes.active_queue;
    } catch {
      this.queue = []
    }
  }
  private updateActiveTrack(queue: QueueItem[]): QueueItem[] {
    let content_id = this.newId;
    if (!content_id.length) {
      content_id = this.hass.states[this.config.entity].attributes.media_content_id;
    }
    const activeIndex = queue.findIndex(item => item.media_content_id === content_id);
    return queue.map( (element, index) => ({
      ...element,
      playing: index === activeIndex,
      show_action_buttons: index > activeIndex,
      show_move_up_next: index > activeIndex + 1,
      show_artist_name: this.config.show_artist_names
    }));
  }

  private onQueueItemSelected = async (queue_item_id: string, content_id: string) => {
    this.newId = content_id
    await this.services.playQueueItem(queue_item_id);
    this.getQueue();
  }
  private onQueueItemRemoved = async (queue_item_id: string) => {
    await this.services.removeQueueItem(queue_item_id);
    this.queue = this.queue.filter( (item) => item.queue_item_id !== queue_item_id);
  }
  private onQueueItemMoveNext = async (queue_item_id: string) => {
    const cur_idx = this.getQueueItemIndex(queue_item_id) ;
    const new_idx = this.queue.findIndex(item => item.playing) + 1;
    this.moveQueueItem(cur_idx, new_idx);
    await this.services.MoveQueueItemNext(queue_item_id);
  }
  private onQueueItemMoveUp = async (queue_item_id: string) => {
    const cur_idx = this.getQueueItemIndex(queue_item_id);
    const new_idx = cur_idx - 1;
    this.moveQueueItem(cur_idx, new_idx);
    await this.services.MoveQueueItemUp(queue_item_id);
  }
  private onQueueItemMoveDown = async (queue_item_id: string) => {
    const cur_idx = this.getQueueItemIndex(queue_item_id);
    const new_idx = cur_idx + 1;
    this.moveQueueItem(cur_idx, new_idx);
    await this.services.MoveQueueItemDown(queue_item_id);
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('hass') || _changedProperties.has('config')) {
      if (this.hass && this.config) {
        this.services = new HassService(this.hass, this.config);
      }
      if (!this._listening) {
        this.subscribeUpdates();
      }
    }
  }
  protected updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    if (!this.queue.length && this.hass) {
      this.getQueue();
    }
    if (_changedProperties.has('hass')) {
      const oldHass = _changedProperties.get('hass') as HomeAssistant;
      if (!oldHass) {
        this.getQueue();
      } else {
        const newHass = this.hass
        const oldEnt = oldHass.states[this.config.entity];
        const newEnt = newHass.states[this.config.entity];
        const oldContentId = oldEnt.attributes.media_content_id;
        const newContentId = newEnt.attributes.media_content_id;
        if (newContentId != oldContentId) {
          this.getQueue();
        }
      }
    }
  }

  protected shouldUpdate(_changedProperties: PropertyValues): boolean {
    if (_changedProperties.has('queue')) {
      return true;
    }
    if (_changedProperties.has('hass')) {
      const oldHass = _changedProperties.get('hass')! as HomeAssistant;
      if (!oldHass) {
        return true;
      }
    }
    return super.shouldUpdate(_changedProperties);
  }

  private renderQueueItems() {
    const show_album_covers = this.config.show_album_covers;
    return this.queue.map(
      (item) => {
        return keyed(
          item.queue_item_id, 
          html`
            <mass-media-row
              .media_item=${item}
              .selected=${item.playing}
              .showAlbumCovers=${show_album_covers}
              .showMoveUpNext=${item.show_move_up_next}
              .showArtistName=${item.show_artist_name}
              .selectedService=${this.onQueueItemSelected}
              .removeService=${this.onQueueItemRemoved}
              .moveQueueItemNextService=${this.onQueueItemMoveNext}
              .moveQueueItemUpService=${this.onQueueItemMoveUp}
              .moveQueueItemDownService=${this.onQueueItemMoveDown}
            >
            </mass-media-row>`
        )
      }
    );
  }

  protected render() {
    return html`
      <ha-card>
        <ha-expansion-panel
          class="mass-panel"
          header=${this.config.title}
          .expanded=${this.config.expanded || !this.config.allow_collapsing}
          ${this.config.allow_collapsing ? '': 'no-collapse'}
        >
          <ha-md-list class="list">
            ${this.renderQueueItems()}
          </ha-md-list>
        </ha-expansion-panel>
      </ha-card>
    `
  }
  static get styles(): CSSResultGroup {
    return styles;
  }

  public getCardSize() {
    return 3;
  }

  private createError(errorString: string): Error {
    const error = new Error(errorString);
    /* eslint-disable-next-line
      @typescript-eslint/no-explicit-any,
    */
    const errorCard = document.createElement('hui-error-card') as any;
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });
    this.error = html`${errorCard}`;
    return error;
  }

}