import { HomeAssistant } from "custom-card-helpers";
import { Config, QueueItem } from "./types";

export default class HassService {
  private hass: HomeAssistant;
  private config: Config

  constructor(hass: HomeAssistant, config: Config) {
    this.hass = hass;
    this.config = config;
  }

  async getQueue(): Promise<QueueItem[]> {
    try {
      const ret = await this.hass.callWS<any>({
        type: 'call_service',
        domain: 'mass_queue',
        service: 'get_queue_items',
        service_data: {
          entity: this.config.entity,
          limit: 100
        },
        return_response: true
      });
      const result = ret.response[this.config.entity];
      return result;
    } catch (e) {
      console.error('Error getting queue', e);
      return [];
    }
  }
  async playQueueItem(queue_item_id: string) {
    try {
      await this.hass.callService(
        'mass_queue', 'play_queue_item',
        {
          entity: this.config.entity,
          queue_item_id: queue_item_id
        }
      )
    } catch (e) {
      console.error('Error selecting queue item', e)
    }
  }
  async removeQueueItem(queue_item_id: string) {
    try {
      await this.hass.callService(
        'mass_queue', 'remove_queue_item',
        {
          entity: this.config.entity,
          queue_item_id: queue_item_id
        }
      )
    } catch (e) {
      console.error('Error removing queue item', e)
    }
  }
  async MoveQueueItemNext(queue_item_id: string) {
    try {
      await this.hass.callService(
        'mass_queue', 'move_queue_item_next',
        {
          entity: this.config.entity,
          queue_item_id: queue_item_id
        }
      )
    } catch (e) {
      console.error('Error moving queue item next', e)
    }
  }
  async MoveQueueItemUp(queue_item_id: string) {
    try {
      await this.hass.callService(
        'mass_queue', 'move_queue_item_up',
        {
          entity: this.config.entity,
          queue_item_id: queue_item_id
        }
      )
    } catch (e) {
      console.error('Error moving queue item up', e)
    }
  }
  async MoveQueueItemDown(queue_item_id: string) {
    try {
      await this.hass.callService(
        'mass_queue', 'move_queue_item_down',
        {
          entity: this.config.entity,
          queue_item_id: queue_item_id
        }
      )
    } catch (e) {
      console.error('Error moving queue item down', e)
    }
  }
}