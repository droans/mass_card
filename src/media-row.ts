import { css, html, LitElement, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js'
import {
  mdiClose,
  mdiArrowCollapseUp,
  mdiArrowUp,
  mdiArrowDown
} from '@mdi/js';
import { 
  QueueItem,
  QueueService,
  ItemSelectedService
} from './types';


class MediaRow extends LitElement {
  @property({ attribute: false }) media_item!: QueueItem;
  @property({ type: Boolean }) selected = false;
  public removeService!: QueueService;
  public moveQueueItemNextService!: QueueService;
  public moveQueueItemUpService!: QueueService;
  public moveQueueItemDownService!: QueueService;
  public selectedService!: ItemSelectedService;
  public showAlbumCovers = true;
  
  private callMoveItemUpService(e: Event) {
    e.stopPropagation();
    this.moveQueueItemUpService(this.media_item.queue_item_id);
  }
  private callMoveItemDownService(e: Event) {
    e.stopPropagation();
    this.moveQueueItemDownService(this.media_item.queue_item_id);
  }
  private callMoveItemNextService(e: Event) {
    e.stopPropagation();
    this.moveQueueItemNextService(this.media_item.queue_item_id);
  }
  private callRemoveItemService(e: Event) {
    e.stopPropagation();
    this.removeService(this.media_item.queue_item_id);
  }
  private callOnQueueItemSelectedService() {
    this.selectedService(this.media_item.queue_item_id, this.media_item.media_content_id);
  }
  protected shouldUpdate(_changedProperties: PropertyValues<this>): boolean {
    if (_changedProperties.has('selected')) {
      return true;
    }
    if (_changedProperties.has('media_item')) {
      const oldItem: QueueItem = _changedProperties.get('media_item')!;
      return oldItem.media_title !== this.media_item.media_title
        || oldItem.media_artist !== this.media_item.media_artist
        || oldItem.media_image !== this.media_item.media_image
        || oldItem.playing !== this.media_item.playing
        || oldItem.show_action_buttons !== this.media_item.show_action_buttons
        || oldItem.show_move_up_next !== this.media_item.show_move_up_next
    }
    return true;
  }
  private renderThumbnail() {
    const played = !this.media_item.show_action_buttons  && !this.media_item.playing;
    if (this.media_item.media_image && this.showAlbumCovers) {
      return html`
        <img 
          class="thumbnail${played ? '-disabled' : ''}"
          slot="start"
          src="${this.media_item.media_image}"
        >
        </img>
      `
    }
    return html``
  }
  private renderTitle() {
    return html`
      <span 
        slot="headline" 
        class="title"
      >
        ${this.media_item.media_title}
      </span>
    `
  }
  private renderArtist() {
    if (this.media_item.show_artist_name) {
      return html`
        <span 
          slot="supporting-text" 
          class="title"
        >
          ${this.media_item.media_artist}
        </span>
      `
    }
    return html``
  }
  private renderActionButtons() {
    if (this.media_item.show_action_buttons) {
      return html`
        <span 
          slot="end"
          class="button-group"
        >
          ${this.renderMoveNextButton()}
          ${this.renderMoveUpButton()}
          ${this.renderMoveDownButton()}
          ${this.renderRemoveButton()}
        </span>
      `;
    }
    return html``
  }
      /* eslint-disable @typescript-eslint/unbound-method */
  private renderMoveNextButton() {
    if (this.media_item.show_move_up_next) {
      return html`
        <ha-icon-button 
          class="action-button"
          .path=${mdiArrowCollapseUp}
          @click=${this.callMoveItemNextService}>
        </ha-icon-button>
      `
    }
    return html``
  }
  private renderMoveUpButton() {
    if (this.media_item.show_move_up_next) {
      return html`
        <ha-icon-button 
          class="action-button"
          .path=${mdiArrowUp}
          @click=${this.callMoveItemUpService}>
        </ha-icon-button>
      `
    }
    return html``
  }
  private renderMoveDownButton() {
    return html`
      <ha-icon-button 
        class="action-button"
        .path=${mdiArrowDown}
        @click=${this.callMoveItemDownService}>
      </ha-icon-button>
    `    
  }
  private renderRemoveButton() {
    return html`
      <ha-icon-button 
        class="action-button"
        .path=${mdiClose}
        @click=${this.callRemoveItemService}>
      </ha-icon-button>
    `
  }

  render() {
    return html`
      <ha-md-list-item 
        class="button${this.media_item.playing ? '-active' : ''}"
		    @click=${this.callOnQueueItemSelectedService}
        type="button"
      >
        ${this.renderThumbnail()}
        ${this.renderTitle()}
        ${this.renderArtist()}
        ${this.renderActionButtons()}
      </ha-md-list-item>
    `
  }
  /* eslint-enable @typescript-eslint/unbound-method */
  static get styles() {
    return [
      css`
        .button {
          margin: 0.15rem;
          border-radius: 0.7rem;
          background: var(--card-background-color);
          --row-height: 48px;
          --icon-width: 30px;
          height: var(--row-height);
        }
        .button-active {
          margin: 0.15rem;
          border-radius: 0.7rem;
          background-color: rgba(from var(--accent-color) r g b / 0.2);
          --row-height: 48px;
          --icon-width: 30px;
          height: var(--row-height);
          --font-color: var(--mdc-theme-primary);
          padding-inline-start: 0px;
          padding-inline-end: 8px;
          color: var(--accent-color);
        }
        .thumbnail {
          width: var(--row-height);
          height: var(--row-height);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: left;
          border-radius: 0.7rem;
        }
        .thumbnail-disabled {
          width: var(--row-height);
          height: var(--row-height);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: left;
          border-radius: 0.7rem;
          filter: opacity(0.5);
        }
        .button-group {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
        }
        .action-button {
          width: var(--icon-width);
          transform: scale(1);
          align-content: center;
        }
        .title {
          font-size: 1.1rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          color: var(--font-color);
        }
      `
    ]
  }
}

customElements.define('mass-media-row', MediaRow);