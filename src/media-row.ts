import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js'
import { 
  mdiCloseThick,
  mdiArrowCollapseUp,
} from '@mdi/js';
import { QueueItem } from './types';

class MediaRow extends LitElement {
  @property({ attribute: false }) item!: QueueItem;
  @property({ type: Boolean }) selected = false;
  @property({ attribute: false}) removeService;
  @property({ attribute: false}) moveQueueItemNextService;
  render() {
    let title = `${this.item.media_title} - ${this.item.media_artist}`;
    let title_trimmed = title.substring(0,35)
    if (title !== title_trimmed) {
      title_trimmed = `${title_trimmed}...`;
    }
    return html`
      <mwc-list-item hasMeta ?selected=${this.selected} ?activated=${this.selected} class="button">
        <div class="row">
          <div class="thumbnail" ?hidden=${!this.item.media_image} style="background-image: url(${this.item.media_image})"></div>
          <div class="title">${title_trimmed}</div>
        </div>
        <div slot="meta" class="button-group">
          <ha-icon-button 
            .path=${mdiArrowCollapseUp}
            class="action-button"
            @click=${(e) =>{
                e.stopPropagation();
                this.moveQueueItemNextService(this.item.queue_item_id, this.item.media_content_id)
              }
            }>
          </ha-icon-button>        
          <ha-icon-button 
            .path=${mdiCloseThick}
            class="action-button"
            @click=${(e) =>{
                e.stopPropagation();
                this.removeService(this.item.queue_item_id, this.item.media_content_id)
              }
            }>
          </ha-icon-button>
        <slot></slot>
        </div>
      </mwc-list-item>
    `;
  }
  static get styles() {
    return [
      css`
        .mdc-deprecated-list-item__text {
          width: 100%;
        }
        .button {
          margin: 0.3rem;
          border-radius: 0.3rem;
          background: var(--secondary-background-color);
          --icon-width: 35px;
          height: 40px;
        }

        .row {
          display: flex;
        }

        .thumbnail {
          width: var(--icon-width);
          height: var(--icon-width);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: left;
          padding-left: 12px;
        }
        .button-group {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }
        .action-button {
          width: var(--icon-width);
          transform: scale(1.5);
          align-content: center;
        }

        .title {
          font-size: 1.1rem;
          align-self: center;
          flex: 1;
        }
      `
    ]
  }
}

customElements.define('mass-media-row', MediaRow);