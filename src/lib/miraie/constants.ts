// MirAIe endpoints and fixed values, copied from the reference library's constants.py
// (github.com/painful-bug/Panasonic-MirAIe-MCP-Server). Only these three hosts are ever contacted.

/** The official MirAIe app's public client id — not a secret. */
export const HTTP_CLIENT_ID = 'PBcMcfG19njNCL8AOgvRzIC8AjQa';

export const LOGIN_URL = 'https://auth.miraie.in/simplifi/v1/userManagement/login';
export const HOMES_URL = 'https://app.miraie.in/simplifi/v1/homeManagement/homes';
export const DEVICE_DETAILS_URL =
  'https://app.miraie.in/simplifi/v1/deviceManagement/devices/deviceId';
export const statusUrl = (deviceId: string) =>
  `https://app.miraie.in/simplifi/v1/deviceManagement/devices/${encodeURIComponent(deviceId)}/mobile/status`;

export const MQTT_HOST = 'mqtt.miraie.in';
export const MQTT_PORT = 8883;
/** Seconds. */
export const MQTT_KEEPALIVE = 60;

export const MIN_TEMP = 16;
export const MAX_TEMP = 30;
/** Eco holds the AC at this temperature (reference `_build_preset_mode_message`). */
export const ECO_TEMP = 26;

/** With no status push this long after a command, status is refetched over REST (AC-9). */
export const COMMAND_CONFIRM_TIMEOUT_MS = 5000;
