import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js'
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import { QueueItem } from './types';

class MediaRow extends LitElement {
  @property({ attribute: false }) item!: QueueItem;
  @property({ type: Boolean }) selected = false;
  @property({ attribute: false}) removeService;
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
          <mwc-filled-tonal-button slot="end" @click=${() => this.removeService(this.item.queue_item_id, this.item.media_content_id)}>
            <svg slot="icon" viewBox="0 0 48 48"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
          </mwc-filled-tonal-button>
        </div>
        <slot slot="meta">
          <mwc-icon-button
            icon="delete"
            @click=${() => this.removeService(this.item.queue_item_id, this.item.media_content_id)}
          </mwc-icon-button>
        </slot>
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
        .remove {
          width: var(--icon-width);
          height: var(--icon-width);
          align-self: end;
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