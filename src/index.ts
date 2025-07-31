import { LitElement, html, type TemplateResult, type CSSResultGroup, PropertyValues } from 'lit';
import { cache } from 'lit/directives/cache.js';
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
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
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

  constructor() {
    super();
    this.queue = [];
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
    } catch (e) {
      this.queue = []
    }
  }
  private updateActiveTrack(queue: QueueItem[]): QueueItem[] {
    let content_id = this.newId;
    let visibility = 'hidden';
    if (!content_id.length) {
      content_id = this.hass.states[this.config.entity].attributes.media_content_id;
    }
    let result = queue.map( (element) => {
      element.visibility = visibility;
      if (element.media_content_id == content_id) {
        element.playing = true;
        visibility = 'visible';
      }
      return element;
    });
    return result
  }

  private onQueueItemSelected = async (queue_item_id: string, content_id: string) => {
    this.newId = content_id
    await this.services.playQueueItem(queue_item_id);
    this.getQueue();
  }
  private onQueueItemRemoved = async (queue_item_id: string) => {
    await this.services.removeQueueItem(queue_item_id);
    this.getQueue();
  }
  private onQueueItemMoveNext = async (queue_item_id: string) => {
    await this.services.MoveQueueItemNext(queue_item_id);
    this.getQueue();
  }
  private onQueueItemMoveUp = async (queue_item_id: string) => {
    await this.services.MoveQueueItemUp(queue_item_id);
    this.getQueue();
  }
  private onQueueItemMoveDown = async (queue_item_id: string) => {
    await this.services.MoveQueueItemDown(queue_item_id);
    this.getQueue();
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('hass') || _changedProperties.has('config')) {
      if (this.hass && this.config) {
        this.services = new HassService(this.hass, this.config);
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
    return cache(this.queue.map(
      (item) => {
        return html`
          <mass-media-row
            @click=${() => this.onQueueItemSelected(item.queue_item_id, item.media_content_id)}
            .item=${item}
            .selected=${item.playing}
            .removeService=${this.onQueueItemRemoved}
            .moveQueueItemNextService=${this.onQueueItemMoveNext}
            .moveQueueItemUpService=${this.onQueueItemMoveUp}
            .moveQueueItemDownService=${this.onQueueItemMoveDown}
          >
          </mass-media-row>
        `
      }
    ));
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