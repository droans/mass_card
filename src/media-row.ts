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
          <mwc-icon class="remove" slot="end" @click=${() => this.removeService(this.item.queue_item_id, this.item.media_content_id)}>close</div>
        </div>
        <slot slot="meta"></slot>
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