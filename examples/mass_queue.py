import websocket
import json
import uuid
import requests
from homeassistant.helpers.template import device_id, device_attr

class Const:
    DOMAIN = 'music_assistant'
    HASS_PLAYER_ID_DEVICE_ID_ATTR = 'identifiers'
    class Commands:
        GET_ALL_QUEUES = 'player_queues/all'
        GET_PLAYER_QUEUE = 'player_queues/get_active_queue'
        GET_QUEUE = 'player_queues/get'
        DELETE_QUEUE_ITEM = 'player_queues/delete_item'
        GET_QUEUE_ITEMS = 'player_queues/items'
        REMOVE_QUEUE_ITEM = 'player_queues/delete_item'
        CLEAR_QUEUE = 'player_queues/clear'
class MassCommands():
    def __init__(self):
        self._commands = Const.Commands
        self._domain = Const.DOMAIN
        self._url = self._get_mass_url()
    def _get_mass_url(self):
        entries = hass.config_entries.async_entries()
        entry = [entry for entry in entries if entry.domain == self._domain]
        entry = entry[0]
        url = entry.data['url']
        result = url + '/api'
        return result
    def _get_id(self):
        return uuid.uuid4().hex
    def _gen_command(self, command: str, data: dict = {}):
        _id = self._get_id()
        req = {
            'message_id': _id,
            'command': command,
            'args': data
        }
        result = json.dumps(req)
        return result
    def _send_command(self, command: str, data: dict = {}):
        data = self._gen_command(command, data)
        r = task.executor(requests.post, self._url, data=data)
        # return r.text
        try:
            return r.json()
        except:
            return
    def send_command(self, command: str, data: dict = {}):
        return self._send_command(command, data)
    
    def get_player_queue_id(self, player_id: str):
        cmd = self._commands.GET_PLAYER_QUEUE
        data = {'player_id': player_id}
        resp = self.send_command(cmd, data)
        result = resp['queue_id']
        return result

    def get_queue_items(self, queue_id: str): 
        cmd = self._commands.GET_QUEUE_ITEMS
        data = {'queue_id': queue_id}
        resp = self.send_command(cmd, data)
        return resp

    def get_queue(self, queue_id: str):
        cmd = self._commands.GET_QUEUE
        data = {'queue_id': queue_id}
        resp = self.send_command(cmd, data)
        return resp
    
    def play_queue_item(self, queue_id: str, queue_item_id: str):
        cmd = self._commands.PLAY_QUEUE_ITEM
        data = {'queue_id': queue_id, 'index': queue_item_id}
        resp = self.send_command(cmd, data)
        return resp

    def remove_queue_item(self, queue_id: str, queue_item_id: str):
        cmd = self._commands.REMOVE_QUEUE_ITEM
        data = {'queue_id': queue_id, 'item_id_or_index': queue_item_id}
        resp = self.send_command(cmd, data)
        return resp

    def clear_queue(self, queue_id: str):
        cmd = self._commands.CLEAR_QUEUE
        data = {'queue_id': queue_id}
        resp = self.send_command(cmd, data)
        return resp

def get_player_id_from_entity(player_entity: str):
    dev_id = device_id(hass, player_entity)
    player_id = list(device_attr(hass, dev_id, Const.HASS_PLAYER_ID_DEVICE_ID_ATTR))[0][1]
    return player_id
    
def get_queue_current_item(queue_id: str): 
    cmds = MassCommands()
    queue = cmds.get_queue(queue_id)
    current = queue['current_item']
    if current is None:
        return None
    return current['queue_item_id']

def _limit_list_to_idx(ls: list, idx: int, before: int, after: int):
    start = max(0, idx - before)
    end = min(len(ls), idx + after + 1)
    return ls[start: end]

def _format_queue_items(queue_items: list):
    result = []
    for track in queue_items:
        media = track['media_item']
        artists = media['artists']
        artists = ', '.join([artist['name'] for artist in artists])
        tmp = {
            'media_title': media['name'],
            'media_album_name': media['album']['name'],
            'media_artist': artists,
            'media_content_id': media['uri'],
            'playing': track['playing'],
            'queue_item_id': track['queue_item_id'],
            'media_image': track['image']['path']
        }
        result.append(tmp)
    return result

def _get_active_queue_range(queue_id: str, limit_before: int = 4, limit_after: int = 5): 
    cmds = MassCommands()
    current_item_id = get_queue_current_item(queue_id)
    if current_item_id is None:
        return []
    queue_items = cmds.get_queue_items(queue_id)
    for i in range(0, len(queue_items)):
        cur_item = queue_items[i]
        cur_id = cur_item['queue_item_id']
        if cur_id == current_item_id:
            before = _limit_list_to_idx(queue_items, i, limit_before, -1)
            after = _limit_list_to_idx(queue_items, i, -1, limit_after)
            break
    _before = []
    _after = []
    for item in before:
        tmp = item.copy()
        tmp['playing'] = False
        _before.append(tmp)
    for item in after:
        tmp = item.copy()
        tmp['playing'] = False
        _after.append(tmp)
    cur_item['playing'] = True
    queue = _before + [cur_item] + _after
    result = _format_queue_items(queue)
    return result

def _check_if_player_active(player_entity: str):
    pass

@service(supports_response='only')
def get_player_queue(player_entity: str | list, limit_before: int = 4, limit_after: int = 5): 
    cmds = MassCommands()
    result = {}
    if type(player_entity) is str:
        player_entity = [player_entity]
    for player in player_entity:
        player_id = get_player_id_from_entity(player)
        queue_id = cmds.get_player_queue_id(player_id)
        queue = _get_active_queue_range(queue_id, limit_before, limit_after)
        result[player] = queue
    return result

@service(supports_response='none')
def play_queue_item(player_entity: str, queue_item_id: str):
    cmds = MassCommands()
    player_id = get_player_id_from_entity(player_entity)
    queue_id = cmds.get_player_queue_id(player_id)
    resp = cmds.play_queue_item(queue_id, queue_item_id)
    return resp

@service(supports_response='none')
def remove_queue_item(player_entity: str, queue_item_id: str):
    cmds = MassCommands()
    player_id = get_player_id_from_entity(player_entity)
    queue_id = cmds.get_player_queue_id(player_id)
    resp = cmds.remove_queue_item(queue_id, queue_item_id)
    return resp

