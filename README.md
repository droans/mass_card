# Music Assistant Queue Card

Display the queue for any given media player.

![Queue Card Example](/static/queue_example.png)

## Installation

This card is not included with HACS and must be installed manually.

1. Download the card.
    - Navigate to the Releases and locate the latest release.
    - Download `mass-card.js`
    - Save `mass-card.js` to your Home Assistant `<config>/www` directory
2. Add card to your HA resources
    - Go to your Home Assistant Settings.
    - Select "Dashboards"
    - In the top left, select the three-dot overflow menu and click "Resources"
    - Press "Add Resource". For the URL, type in "/local/mass-card.js". Select "JavaScript module" and click "Create".

## Configuration

### Create services

This card requires you to create three scripts: `script.get_player_queues`, `script.mass_play_queue_item`, and `script.mass_remove_queue_item`.  If you know what you are doing, you can manually configure this. Otherwise, use the instructions below to help out.

1. Install the Pyscript integration from HACS.
2. Download the file `examples/mass_queue.py`. Save it in your Home Assistant `<config>/pyscript/scripts` directory.
3. Copy the example scripts from `examples/script.yaml` file. 

## Add Card

The card does not have a visual editor. 

Use this configuration to create your card:

```yaml
type: custom:mass-card
entity: media_player.music_assistant_player
```