import { HomeAssistant } from "custom-card-helpers";
import { Config, QueueItem } from "./types";

export default class HassService {
  private readonly hass: HomeAssistant;
  private readonly config: Config

  constructor(hass: HomeAssistant, config: Config) {
    this.hass = hass;
    this.config = config;
  }

  async getQueue(): Promise<QueueItem[]> {
      const ret = await this.hass.callWS<any>({
        type: 'call_service',
        domain: 'script',
        service: 'get_player_queues',
        target: {
          entity_id: this.config.entity
        },
        return_response: true,
      });
      const result = ret.response[this.config.entity]
      return result;
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