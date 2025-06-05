import { LitElement, html, type TemplateResult, type CSSResultGroup, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  type HomeAssistant,
} from 'custom-card-helpers';

import { QueueItem, Config } from './types'
import HassService from './services'
import styles from './styles';
import './media-row'
import { version } from '../package.json';

// Use this if you want both the dev and prod versions installed in the same instance - they will have different names
// For local development use true, but change it to true whenever building a new release
const DEV = false;

// Change these values to your card's name, description and URL
const cardId = 'mass-card';
const cardName = 'Music Assistant Card';
const cardDescription = 'Custom Music Assistant Card for Home Assistant';
const cardUrl = 'https://github.com/droans/mass_card';

// Extend the Window interface to include loadCardHelpers
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

// This puts your card into the UI card picker dialog
// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: `${cardId}${DEV ? '-dev' : ''}`,
  name: `${cardName}${DEV ? ' DEV' : ''}`,
  preview: false, // Optional - defaults to false
  description: cardDescription,
  documentationURL: cardUrl,
});

@customElement(`${cardId}${DEV ? '-dev' : ''}`)
export class MusicAssistantCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false} ) public services!: HassService;
  @state() private code: any;
  @state() private queue: QueueItem[] = [];
  @state() private newQueue: QueueItem[];
  @state() private config!: Config;
  @state() private error?: TemplateResult;
  @state() private lastUpdate = 0;
  @state() private UPDATE_INTERVAL = 5000; // 5 seconds
  @state() private FIRST_UPDATE = false;
  @state() private ACTIVE_ID = '';
  @state() private NEW_ID = '';
  @state() private UPDATE_DELAY = 2500;
  private counter = 0;

  constructor() {
    super();
    this.queue = [];
    this.newQueue = [];
  }
  
  // Connecting the editor to the card
  static getConfigElement() {
    return document.createElement(`${cardId}-editor${DEV ? '-dev' : ''}`);
  }

  // This is the default config when creating a new card
  static getStubConfig() {
    return { entity: [] };
  }

  // This is called when the config is changed/loaded
  public setConfig(config?: Config) {
    if (!config) {
      throw this.createError('Invalid configuration.');
    }
    if (!config.entity) {
      throw this.createError('You need to define entitiy.');
    };
    this.config = config;

    if (this.hass) {
      this.services = new HassService(this.hass, this.config)
    }
  }
  private getQueue() {
    if (!this.services) {
      this.services = new HassService(this.hass, this.config)
    }
    try {
      let active_track = this.hass.states[this.config.entity].attributes.media_content_id;
      this.services.getQueue().then(
        (queue) => {
          this.newQueue = this.updateActiveTrack(queue);
        }
      );
    } catch (e) {
      this.newQueue = []
    }
  }
  private getCardActiveTrack() {
    let e = this.queue.find( (element) => {
      element.playing
    });
    return e?.media_content_id
  };
  private getHassActiveTrack() {
    let active_track = this.hass.states[this.config.entity].attributes.media_content_id;
    return active_track
  }
  private updateActiveTrack(queue) {
    let content_id = this.NEW_ID;
    if (!content_id.length) {
      content_id = this.hass.states[this.config.entity].attributes.media_content_id;
    }
    let result = queue.map( (element) => {
      if (element.media_content_id == content_id) {
        element.playing = true;
      }
      return element;
    });
    return result
  }
  private shouldUpdateQueue() {
    let t = new Date().valueOf()
    let card_active = this.getCardActiveTrack()
    let hass_active = this.getHassActiveTrack()
    if ((t - this.lastUpdate) > this.UPDATE_INTERVAL || !this.FIRST_UPDATE || !this.queue.length || card_active != hass_active) {
      this.FIRST_UPDATE = true;
      this.lastUpdate = t;
      this.ACTIVE_ID = this.NEW_ID;
      this.getQueue();
      if (this.newQueue == this.queue || this.newQueue.length == 0) {
        return false;
      } else {
        this.queue = this.newQueue;
        return true;
      }
    }
    return false;
  }
  
  protected shouldUpdate(_changedProperties: PropertyValues): boolean {
    if (_changedProperties.has('hass')) {
      const oldHass = _changedProperties.get('hass') as HomeAssistant;
      if (!oldHass) {
        return true;
      };
      const newHass = this.hass;
      const oldEnt = oldHass.states[this.config.entity];
      const newEnt = newHass.states[this.config.entity];
      const oldContentId = oldEnt.attributes.media_content_id;
      const newContentId = newEnt.attributes.media_content_id;
      if (['idle'].includes(newEnt.state) || newContentId == oldContentId) {
        return false
      };

      if (newContentId !== oldContentId) {
        this.NEW_ID = newContentId;
      };

      return oldHass?.states[this.config.entity] !== newHass?.states[this.config.entity]
    }
    return super.shouldUpdate(_changedProperties);
  }

  // Initial (non-grid) size
  public getCardSize() {
    return 3;
  }
  private onQueueItemSelected = async (queue_item_id: string, content_id: string) => {
    this.NEW_ID = content_id
    await this.services.playQueueItem(queue_item_id);    
  }
  private renderQueue() {
    const result = html`
      <ha-expansion-panel
        header = "Play Queue"
      >
        <div class="list">
          <mwc-list>
            ${
              this.queue.map(
                (item) => {
                  return html`
                    <mass-media-row
                      @click=${() => this.onQueueItemSelected(item.queue_item_id, item.media_content_id)}
                      .item=${item}
                      .selected=${item.playing}
                    >
                    </mass-media-row>
                  `
                }
              )
            }
          </mwc-list>
        </div>
      </ha-expansion-panel>
    `
    return result;
  }
  protected render() {
    if (this.shouldUpdateQueue()) {
      this.code = this.renderQueue()
    }
    return this.code;
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

  static get styles(): CSSResultGroup {
    return styles;
  }
}

const actions: string[] = ['navigate', 'url', 'perform-action', 'none'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}