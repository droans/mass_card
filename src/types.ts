export type Config = {
  entity: string;
  title: string;
}

export type QueueItem = {
  media_title: string;
  media_album_name: string;
  media_artist: string;
  media_content_id: string;
  playing: boolean;
  queue_item_id: string;
  media_image: string;
}