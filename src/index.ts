import { LitElement, html, type TemplateResult, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  type HomeAssistant,
  hasAction,
  type ActionHandlerEvent,
  handleAction,
  type ActionConfig,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers
import { type HassEntity } from 'home-assistant-js-websocket';

import styles from './styles';
import editStyles from './styles-edit';
import { actionHandler } from './ha-action-handler-directive';
import { version } from '../package.json';

// Use this if you want both the dev and prod versions installed in the same instance - they will have different names
// For local development use true, but change it to true whenever building a new release
const DEV = false;

// Change these values to your card's name, description and URL
const cardId = 'mass-card';
const cardName = 'Music Assistant Card';
const cardDescription = 'Custom Music Assistant Card for Home Assistant';
const cardUrl = 'https://github.com/droans/mass_card';

export type MyEntityConfig = {
  entity: string;
  name?: string;
  sampleFlag?: boolean;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
};

type MyCardConfig = {
  entities: MyEntityConfig[];
  sampleText?: string;
  sampleEnum?: 'one' | 'two' | 'three';
  sampleFlag?: boolean;
  sampleNumber?: number;
  sampleIcon?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
};

// Extend the Window interface to include loadCardHelpers
declare global {
  interface Window {
    loadCardHelpers?: () => Promise<any>;
  }
}

const loadHaForm = async () => {
  if (customElements.get('ha-form') && customElements.get('hui-entities-card-editor')) return;
  if (window.loadCardHelpers) {
    const helpers = await window.loadCardHelpers();
    if (!helpers) return;
    const card = await helpers.createCardElement({ type: 'entities', entities: [] });
    if (!card) return;
    card.constructor.getConfigElement();
  }
};

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
export class HacsBoilerplateCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: MyCardConfig;
  @state() private error?: TemplateResult;

  private counter = 0;

  constructor() {
    super();
  }

  // Connecting the editor to the card
  static getConfigElement() {
    return document.createElement(`${cardId}-editor${DEV ? '-dev' : ''}`);
  }

  // This is the default config when creating a new card
  static getStubConfig() {
    return { entities: [] };
  }

  // This is called when the config is changed/loaded
  public setConfig(config?: MyCardConfig) {
    if (!config) {
      throw this.createError('Invalid configuration.');
    }
    if (!config.entities) {
      throw this.createError('You need to define entities.');
    }
    config.entities.forEach((entity, i) => {
      if (entity.entity === undefined) {
        throw this.createError(`Entity ${i + 1} is invalid! Must be an object, having an entity key.`);
      }
    });
    this.config = config;
  }

  // Initial (non-grid) size
  public getCardSize() {
    return 3;
  }

  // Action handling logic (handles fallback from entity action to global card default action)
  private handleAction(event: ActionHandlerEvent, entityConfig: MyEntityConfig): void {
    if (this.hass && this.config && event.detail.action) {
      event.preventDefault();
      event.stopPropagation();
      handleAction(
        this,
        this.hass,
        entityConfig.tap_action ? entityConfig : this.config.tap_action ? this.config : { ...entityConfig, tap_action: { action: 'more-info' } as ActionConfig },
        event.detail.action,
      );
    }
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

  _callService(entityConfig: MyEntityConfig, stateObj: HassEntity) {
    // entity details can be checked in stateObj, or this.hass.states[stateObj.entity_id].(attributes|state)
    //sample event or service call
    if (entityConfig.sampleFlag) {
      this._fireSampleHassEvent(stateObj.entity_id);
    } else {
      this.hass.callService('light', 'toggle', {
        entity_id: stateObj.entity_id,
      });
    }
    this.counter += 1;
    // this could be used if we need to force a re-render
    this.requestUpdate();
}

  _fireSampleHassEvent(entityId: string) {
    this._fireHassEvent('hass-more-info', { entityId });
  }

  _fireHassEvent(type: string, detail?: any) {
    const e = new CustomEvent(type, {
      detail: detail === null || detail === undefined ? {} : detail,
      bubbles: true,
      cancelable: false,
      composed: true,
    });
    this.dispatchEvent(e);
    return e;
  }

  static get styles(): CSSResultGroup {
    return styles;
  }

  _renderButton(entityConfig: MyEntityConfig, stateObj: HassEntity) {
    return html`
      <span
        @click=${() => this._callService(entityConfig, stateObj)}
      >
        Click me
      </p>
    `;
  }
  
  _renderName(entityConfig: MyEntityConfig, stateObj: HassEntity) {
    const nameSize = `${this.config.sampleNumber ?? 14}px`;
    // variables can be passed to the CSS style code like below
    return html`
      <p
        class="name"
        style="--fontSize:${nameSize};"
        @action=${(e: ActionHandlerEvent) => {
          this.handleAction(e, entityConfig);
        }}
        .actionHandler=${actionHandler({
          hasHold: hasAction(entityConfig.hold_action || this.config.hold_action),
          hasDoubleClick: hasAction(entityConfig.double_tap_action || this.config.double_tap_action),
        })}
      >
        ${entityConfig.name || stateObj.attributes.friendly_name}
      </p>
    `;
  }
  
  _renderEntity(entityConfig: MyEntityConfig) {
    const stateObj = this.hass.states[entityConfig.entity];
    if (!stateObj) {
      return html``;
    }
    return html`
      <div>
        ${this._renderName(entityConfig, stateObj)}
        ${this._renderButton(entityConfig, stateObj)}
      </div>
    `;
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult {
    if (this.error) {
      return this.error;
    }

    return html`
      <ha-card>
        <div class="main">
          ${this.config.entities.length === 0 ? html` You need to define entities ` : ''}
          ${this.config.entities.map((entityConfig) => this._renderEntity(entityConfig))}
        </div>
        Counter: ${this.counter}
      </ha-card>
    `;
  }
}

// The below is the code for the editor UI of the card, which is a lit component as well.

const actions: string[] = ['navigate', 'url', 'perform-action', 'none'];

@customElement(`${cardId}-editor${DEV ? '-dev' : ''}`)
export class HacsBoilerplateCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config!: MyCardConfig;
  @state() private _selectedTab = 'entities';
  @state() private _editingEntity: { index: number; elementConfig: MyEntityConfig } | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    loadHaForm();
  }

  setConfig(config: MyCardConfig) {
    this._config = config;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return editStyles;
  }

  _backClick(_e: Event) {
    this._editingEntity = null;
  }

  _computeLabel(e) {
    return e.label || e.name;
  }

  _valuesChanged(ev: CustomEvent) {
    this._config = ev.detail.value;
    this._publishConfig();
  }

  _entitiesChanged(ev: CustomEvent) {
    const _config = Object.assign({}, this._config);
    _config.entities = ev.detail.entities;
    this._config = _config;
    this._publishConfig();
  }

  _entityChanged(ev: CustomEvent) {
    if (!this._editingEntity) {
      return;
    }
    this._config.entities[this._editingEntity.index] = ev.detail.value;
    this._editingEntity.elementConfig = ev.detail.value;
    this._publishConfig();
  }

  _publishConfig() {
    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _handleSwitchTab(ev: CustomEvent) {
    this._selectedTab = ev.detail.name;
  }

  _editDetails(ev: CustomEvent) {
    this._editingEntity = ev.detail.subElementConfig;
  }

  // This should include everything from the MyEntityConfig type
  // Selectors can be found here: https://www.home-assistant.io/docs/blueprint/selectors/
  _renderEntityEditor() {
    return html`
      <div><ha-icon-button-prev @click=${(e) => this._backClick(e)} /> Back</div>
      <div class="box">
        <h3>Entity</h3>
        <ha-form
          .hass=${this.hass}
          .data=${this._editingEntity?.elementConfig}
          .schema=${[
            { name: 'entity', label: 'Entity', selector: { entity: { domain: 'cover' } }, required: true },
            { name: 'name', label: 'Name', selector: { text: {} } },
            { name: 'sampleFlag', label: 'Do something?', selector: { boolean: {} } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._entityChanged}
        ></ha-form>
      </div>
      <div class="box">
        <h3>Actions (override defaults)</h3>
        <p class="intro">Individual actions of this entity (override any default actions).</p>
        <ha-form
          .hass=${this.hass}
          .data=${this._editingEntity?.elementConfig}
          .schema=${[
            { name: 'tap_action', label: 'Tap action', selector: { ui_action: { actions } } },
            { name: 'hold_action', label: 'Hold action', selector: { ui_action: { actions } } },
            { name: 'double_tap_action', label: 'Double tap action', selector: { ui_action: { actions } } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._entityChanged}
        ></ha-form>
      </div>
    `;
  }

  _renderEntitiesEditor() {
    return html`
      <div class="box">
        <hui-entities-card-row-editor
          .hass=${this.hass}
          .entities=${this._config.entities}
          @entities-changed=${this._entitiesChanged}
          @edit-detail-element=${this._editDetails}
        ></hui-entities-card-row-editor>
      </div>
    `;
  }

  // This should include everything from the main MyCardConfig type
  // Selectors can be found here: https://www.home-assistant.io/docs/blueprint/selectors/
  _renderConfigurationEditor() {
    return html`
      <div class="box">
        <h3>Layout</h3>
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${[
            {
              name: 'sampleText', label: 'Gimme some text', selector: { text: {} },
            },
            {
              name: 'sampleEnum',
              label: 'Choose one',
              selector: {
                select: {
                  options: [
                    { label: 'One', value: 'one' },
                    { label: 'Two', value: 'two' },
                    { label: 'Three', value: 'three' },
                  ],
                  mode: 'dropdown',
                },
              },
              required: true,
            },
            { name: 'sampleFlag', label: 'Do something?', selector: { boolean: {} } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valuesChanged}
        ></ha-form>
      </div>
      <div class="box">
        <h3>Default visual settings</h3>
        <p class="intro">These settings can be set globally here, or individually in the entity editor.</p>
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${[
            {
              name: 'sampleNumber', label: 'A number, maybe a font size?', selector: { number: {} },
            },
            {
              name: 'sampleIcon', label: 'Pick an icon', selector: { icon: {} },
            },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valuesChanged}
        ></ha-form>
      </div>
      <div class="box">
        <h3>Default actions</h3>
        <p class="intro">These settings can be set globally here, or individually in the entity editor.</p>
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${[
            { name: 'tap_action', label: 'Default tap action', selector: { ui_action: { actions } } },
            { name: 'hold_action', label: 'Default hold action', selector: { ui_action: { actions } } },
            { name: 'double_tap_action', label: 'Default double tap action', selector: { ui_action: { actions } } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valuesChanged}
        ></ha-form>
      </div>
    `;
  }

  _renderContent() {
    if (this._selectedTab === 'entities' && this._editingEntity !== null) {
      return this._renderEntityEditor();
    }

    if (this._selectedTab === 'entities') {
      return this._renderEntitiesEditor();
    }
    if (this._selectedTab === 'configuration') {
      return this._renderConfigurationEditor();
    }
    return html``;
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <div class="toolbar">
          <sl-tab-group @sl-tab-show=${this._handleSwitchTab}>
            <sl-tab slot="nav" panel="entities" .active=${this._selectedTab === 'entities'}>My Entities</sl-tab>
            <sl-tab slot="nav" panel="configuration" .active=${this._selectedTab === 'configuration'}>Configuration</sl-tab>
          </sl-tab-group>
        </div>
        <div id="editor">${this._renderContent()}</div>
      </div>
    `;
  }
}
