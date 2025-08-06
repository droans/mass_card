export type Config = {
  entity: string;
  title: string;
  expanded: boolean;
  limit_before: number;
  limit_after: number;
  show_album_covers: boolean;
  show_artist_names: boolean;
}

export type QueueItem = {
  media_title: string;
  media_album_name: string;
  media_artist: string;
  media_content_id: string;
  playing: boolean;
  queue_item_id: string;
  media_image: string;
  visibility: string;
  card_media_title: string;
}