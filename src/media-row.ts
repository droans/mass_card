import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js'
import {
  mdiClose,
  mdiArrowCollapseUp,
  mdiArrowUp,
  mdiArrowDown
} from '@mdi/js';
import { QueueItem } from './types';

class MediaRow extends LitElement {
  @property({ attribute: false }) item!: QueueItem;
  @property({ type: Boolean }) selected = false;
  public removeService;
  public moveQueueItemNextService;
  public moveQueueItemUpService;
  public moveQueueItemDownService;
  public selectedService;
  public showAlbumCovers: boolean = true;
  
  private callMoveItemUpService(e) {
    e.stopPropagation();
    this.moveQueueItemUpService(this.item.queue_item_id);
  }
  private callMoveItemDownService(e) {
    e.stopPropagation();
    this.moveQueueItemDownService(this.item.queue_item_id);
  }
  private callMoveItemNextService(e) {
    e.stopPropagation();
    this.moveQueueItemNextService(this.item.queue_item_id);
  }
  private callRemoveItemService(e) {
    e.stopPropagation();
    this.removeService(this.item.queue_item_id);
  }
  private callOnQueueItemSelectedService() {
    this.selectedService(this.item.queue_item_id, this.item.media_content_id);
  }
  protected shouldUpdate(_changedProperties): boolean {
    if (_changedProperties.has('selected')) {
      return true;
    }
    if (_changedProperties.has('item')) {
      const oldItem = _changedProperties.get('item');
      return oldItem.card_media_title !== this.item.card_media_title 
        || oldItem.media_image !== this.item.media_image
        || oldItem.playing !== this.item.playing
        || oldItem.visibility !== this.item.visibility
        || oldItem.show_move_up_next !== this.item.show_move_up_next
    }
    return true;
  }
  render() {
    const played = this.item.visibility == 'hidden' && !this.item.playing;
    /*
      TODO:
        List Item:
          * Click Action
          * Selected/Activated
          * Text
          * Thumbnail
          * Action Buttons
        Text:
          * Disabled/Enabled
        Thumbnail:
          * Disabled/Enabled
          * Visible/Hidden
        Action Buttons:
          * @click
          * Icon
          * Set visibility
    */
    return html`
      <ha-md-list-item 
        class="button${this.item.playing ? '-active' : ''}"
		    @click=${this.callOnQueueItemSelectedService}
        type="button"
      >
        <img 
          class="thumbnail${played ? '-disabled' : ''}"
          slot="start"
          ?hidden=${!this.item.media_image || !this.showAlbumCovers}
          src="${this.item.media_image}"
        >
        </img>
        <span 
          slot="headline" 
          class="title"
        >
          ${this.item.media_title}
        </span>
        <span 
          slot="supporting-text" 
          class="title"
        >
          ${this.item.media_artist}
        </span>
        <span 
          slot="end"
          class="button-group"
          style="visibility: ${this.item.visibility};"
        >
          <ha-icon-button class="action-button"
            .path=${mdiArrowCollapseUp}
            style="visibility: ${this.item.show_move_up_next}"
            @click=${this.callMoveItemNextService}>
          </ha-icon-button>

          <ha-icon-button class="action-button"
            .path=${mdiArrowUp}
            style="visibility: ${this.item.show_move_up_next}"
            @click=${this.callMoveItemUpService}>
          </ha-icon-button>

          <ha-icon-button class="action-button"
            .path=${mdiArrowDown}
            @click=${this.callMoveItemDownService}>
          </ha-icon-button>

          <ha-icon-button class="action-button"
            .path=${mdiClose}
            @click=${this.callRemoveItemService}>
          </ha-icon-button>
        </span>

      </ha-md-list-item>
    `
  }
  static get styles() {
    return [
      css`
        .mdc-deprecated-list-item__text {
          width: 100%;
        }
        .button {
          margin: 0.15rem;
          border-radius: 0.7rem;
          background: var(--card-background-color);
          --row-height: 48px;
          --icon-width: var(--row-height);
          height: var(--row-height);
          padding-inline-start: 0px;
          padding-inline-end: 8px;
          --md-list-item-two-line-container-height: 48px;
        }
        .button-active {
          margin: 0.3rem;
          border-radius: 0.7rem;
          background-color: rgba(from var(--accent-color) r g b / 0.2);
          --row-height: 48px;
          --icon-width: var(--row-height);
          height: var(--row-height);
          padding-inline-start: 0px;
          padding-inline-end: 8px;
          color: var(--accent-color);
          --md-list-item-two-line-container-height: 48px;
        }

        .row {
          // display: flex;
          margin-right: calc(var(--icon-width) * 2 + 8px);
        }
        .row-disabled {
          --font-color: var(--disabled-text-color);
          // display: flex;
          margin-right: calc(var(--icon-width) * 2 + 8px);
        }

        .thumbnail {
          width: var(--icon-width);
          height: var(--icon-width);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: left;
          margin-right: 12px;
          border-radius: 0.7rem;
        }
        .thumbnail-disabled {
          filter: opacity(0.5);
          width: var(--icon-width);
          height: var(--icon-width);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: left;
          margin-right: 12px;
          border-radius: 8px;
        }
        .button-group {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }
        .action-button {
          width: var(--icon-width);
          transform: scale(2);
          align-content: center;
        }
        md-item {
          min-height: auto;
          max-height: 48px;
        }
        :host {
          min-height: auto;
        }
        *[multiline] {
          min-height: auto;
        }
        .title {
          font-size: 1.1rem;
          //flex: 1;
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