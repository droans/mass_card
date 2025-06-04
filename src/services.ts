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
      const ret1 = await this.hass.callWS<any>({
        type: 'call_service',
        domain: 'script',
        service: 'get_player_queues',
        target: {
          entity_id: this.config.entity,
        },
        return_response: true,
      });
      const queueItems = ret1.response[this.config.entity];
      const result = queueItems.map( (element) => {
        element.playing = false;
        return element;
      });
      return result;
    } catch (e) {
      console.error('Error getting queue', e);
      return [];
    }
  }
  async playQueueItem(queue_item_id: string) {
    try {
      await this.hass.callService(
        'script', 'mass_play_queue_item',
        {
          player: this.config.entity,
          queue_item_id: queue_item_id
        }
      )
    } catch (e) {
      console.error('Error selecting queue item', e)
    }
  }
}