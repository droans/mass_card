import { LitElement, html, type TemplateResult, type CSSResultGroup, PropertyValues } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { customElement, property, state } from 'lit/decorators.js';
import {
  type HomeAssistant,
} from 'custom-card-helpers';

import { QueueItem, Config } from './types'
import HassService from './services'
import styles from './styles';
import './media-row'
import { version } from '../package.json';

const DEV = false;

const cardId = 'mass-card';
const cardName = 'Music Assistant Queue Card';
const cardDescription = 'Music Assistant Queue Card for Home Assistant';
const cardUrl = 'https://github.com/droans/mass_card';

declare global {
  interface Window {
    loadCardHelpers?: () => Promise<any>;
  }
}

console.info(
  `%c ${cardName}${DEV ? ' DEV' : ''} \n%c Version v${version}`,
  'color: teal; font-weight: bold; background: lightgray',
  'color: darkblue; font-weight: bold; background: white',
);
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: `${cardId}${DEV ? '-dev' : ''}`,
  name: `${cardName}${DEV ? ' DEV' : ''}`,
  preview: false,
  description: cardDescription,
  documentationURL: cardUrl,
});

@customElement(`${cardId}${DEV ? '-dev' : ''}`)
export class MusicAssistantCard extends LitElement {
  @property({attribute: false}) public hass!: HomeAssistant;

  @state() private queue: QueueItem[] = [];
  @state() private config!: Config;
  @state() private error?: TemplateResult;

  private newId: string = '';
  private defaultHeaderTitle: string = "Player Queue";
  private defaultExpand: boolean = false;
  private services!: HassService;
  private _listening: boolean = false;
  private _unsubscribe: any;
  private queueID: string = '';

  constructor() {
    super();
    this.queue = [];
  }
  private eventListener = (event: any) => {
    let event_data = event.data;
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

  public setConfig(config?: Config) {
    const default_config: any = {
      expanded: this.defaultExpand,
      title: this.defaultHeaderTitle
    }
    if (!config) {
      throw this.createError('Invalid configuration')
    }
    if (!config.entity) {
      throw this.createError('You need to define entitiy.');
    };
    this.config = {
      ...default_config,
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
    this.queue.splice(new_index, 0, this.queue.splice(old_index, 1)[0]);
  }
  private getQueue() {
    if (!this.services) {
      return;
    }
    try {
      this.services.getQueue().then(
        (queue) => {
          this.queue = this.updateActiveTrack(queue);
        }
      );
      this.queueID = this.hass.states[this.config.entity].attributes.active_queue;
    } catch (e) {
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
      visibility: index >= activeIndex ? 'visible' : 'hidden',
      card_media_title: `${element.media_title} - ${element.media_artist}`
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
      const oldHass = _changedProperties.get('hass') as HomeAssistant;
      if (!oldHass) {
        return true;
      }
    }
    return super.shouldUpdate(_changedProperties);
  }

  private renderQueueItems() {
    return this.queue.map(
      (item) => {
        return keyed(
          item.queue_item_id, 
          html`
            <mass-media-row
              .item=${item}
              .selected=${item.playing}
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
      <ha-expansion-panel
        header=${this.config.title}
        .expanded=${this.config.expanded}
      >
        <div class="list">
          <mwc-list>
            ${this.renderQueueItems()}
          </mwc-list>
        </div>
      </ha-expansion-panel>
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
    const errorCard = document.createElement('hui-error-card') as any;
    (errorCard as any).setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });
    this.error = html`${errorCard}`;
    return error;
  }

}