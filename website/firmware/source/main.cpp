/*
 * ArduBuddy firmware — minimal ESP32 command receiver, no MCP required.
 *
 * No LLM, no agent runtime, no dashboard. The board:
 *   1. joins Wi-Fi (credentials sent over USB serial as JSON),
 *   2. stores the 4 relay pins + active-low setting in NVS (set from the web),
 *   3. exposes a small HTTP JSON API that WorkBuddy can call directly,
 *   4. accepts the same commands over USB serial for setup/testing.
 *
 * HTTP API:
 *   GET  /api/status          -> board status + pin map
 *   GET  /api/config          -> {"ok":true,"pins":[...],"active_low":false}
 *   POST /api/skill/execute   -> {"tool":"gpio.write","args":{"pin":5,"value":true}}
 *   POST /api/skill/chain     -> [{"tool":"gpio.write","args":{...}}, ...]
 *   GET  /api/skills          -> {"ok":true,"skills":"gpio.write,gpio.read,adc.read"}
 *
 * Serial JSON (115200 baud, one object per line):
 *   {"c":"ws","s":"SSID","p":"password"}          save Wi-Fi and connect
 *   {"c":"wst"}                                  status
 *   {"c":"start"}                                start the HTTP server now
 *   {"c":"wr"}                                   forget saved Wi-Fi
 *   {"c":"rst"}                                  restart
 *   {"c":"cfg","pins":[5,16,17,4],"active_low":false}
 *   {"c":"cfg?"}                                 read config
 *   {"c":"gpio","pin":5,"value":true}            write a relay
 *   {"c":"gpio?","pin":5}                        read a relay
 *   {"c":"adc?","pin":34}                        read ADC
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <ArduinoJson.h>

#ifndef RELAY_ACTIVE_LOW
#define RELAY_ACTIVE_LOW 0
#endif

static const char *FW_NAME = "ArduBuddy";
static const char *FW_VERSION = "1.0.0";

static const size_t RELAY_COUNT = 4;
int relayPins[RELAY_COUNT] = {5, 16, 17, 4};  // matches the current web config
bool activeLow = (RELAY_ACTIVE_LOW != 0);

WebServer server(80);
Preferences prefs;

String wifiSsid;
String wifiPass;
String serialBuffer;
bool serverStarted = false;

// ---------------------------------------------------------------- relay utils

int relayLevel(bool on) {
  if (activeLow) return on ? LOW : HIGH;
  return on ? HIGH : LOW;
}

bool isOutputPin(int pin) {
  if (pin < 0 || pin > 39) return false;
  if (pin >= 6 && pin <= 11) return false;   // connected to SPI flash
  if (pin >= 34 && pin <= 39) return false;  // input-only
  return true;
}

// Human-readable state. "ON"/"OFF" is the LOGICAL relay state; the physical
// pin level is reported separately so active-low boards cannot be misread.
String stateText(bool on) { return on ? "ON" : "OFF"; }
String pinLevel(int pin) { return digitalRead(pin) == HIGH ? "HIGH" : "LOW"; }

void applyRelay(int pin, bool on) {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, relayLevel(on));
}

bool readRelay(int pin) {
  return digitalRead(pin) == relayLevel(true);
}

void initRelays() {
  for (size_t i = 0; i < RELAY_COUNT; i++) {
    if (!isOutputPin(relayPins[i])) continue;
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], relayLevel(false));
  }
}

// ------------------------------------------------------------------ NVS config

void loadConfig() {
  prefs.begin("ardubuddy", true);
  for (size_t i = 0; i < RELAY_COUNT; i++) {
    String key = "p" + String(i);
    relayPins[i] = prefs.getInt(key.c_str(), relayPins[i]);
  }
  activeLow = prefs.getBool("active_low", activeLow);
  prefs.end();
}

void saveConfig(const int pins[], bool al) {
  prefs.begin("ardubuddy", false);
  for (size_t i = 0; i < RELAY_COUNT; i++) {
    relayPins[i] = pins[i];
    String key = "p" + String(i);
    prefs.putInt(key.c_str(), pins[i]);
  }
  activeLow = al;
  prefs.putBool("active_low", al);
  prefs.end();
}

void loadWifi() {
  prefs.begin("ardubuddy", true);
  wifiSsid = prefs.getString("ssid", "");
  wifiPass = prefs.getString("pass", "");
  prefs.end();
}

void saveWifi(const String &ssid, const String &pass) {
  prefs.begin("ardubuddy", false);
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
  prefs.end();
  wifiSsid = ssid;
  wifiPass = pass;
}

void clearWifi() {
  prefs.begin("ardubuddy", false);
  prefs.remove("ssid");
  prefs.remove("pass");
  prefs.end();
  wifiSsid = "";
  wifiPass = "";
}

// ---------------------------------------------------------------- HTTP helpers

void sendJson(int code, const String &body) {
  server.sendHeader("Cache-Control", "no-store");
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(code, "application/json", body);
}

String configJson() {
  JsonDocument doc;
  doc["ok"] = true;
  JsonArray pins = doc["pins"].to<JsonArray>();
  for (size_t i = 0; i < RELAY_COUNT; i++) pins.add(relayPins[i]);
  doc["active_low"] = activeLow;
  String out;
  serializeJson(doc, out);
  return out;
}

String statusJson() {
  JsonDocument doc;
  doc["ok"] = true;
  doc["connected"] = (WiFi.status() == WL_CONNECTED);
  doc["ssid"] = wifiSsid;
  doc["ip"] = WiFi.localIP().toString();
  doc["uptime"] = millis() / 1000;
  doc["heap"] = ESP.getFreeHeap();
  doc["skill_count"] = 3;
  doc["firmware"] = FW_NAME;
  doc["version"] = FW_VERSION;
  JsonArray pins = doc["pins"].to<JsonArray>();
  for (size_t i = 0; i < RELAY_COUNT; i++) pins.add(relayPins[i]);
  doc["active_low"] = activeLow;
  String out;
  serializeJson(doc, out);
  return out;
}

void startServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("{\"ok\":false,\"msg\":\"wifi_not_connected\"}");
    return;
  }
  if (!serverStarted) {
    server.begin();
    serverStarted = true;
  }
  Serial.println("{\"ok\":true,\"msg\":\"started\",\"ip\":\"" +
                 WiFi.localIP().toString() + "\"}");
}

// Run one tool call and return {success, message}. Shared by execute + chain.
bool runTool(const String &tool, JsonVariant args, String &message) {
  int pin = args["pin"] | -1;

  if (tool == "gpio.write") {
    bool value = args["value"] | false;
    if (!isOutputPin(pin)) {
      message = "Invalid output pin: " + String(pin);
      return false;
    }
    applyRelay(pin, value);
    message = "GPIO " + String(pin) + " " + stateText(value) + " (pin " +
              pinLevel(pin) + ")";
    return true;
  }

  if (tool == "gpio.read") {
    if (!isOutputPin(pin)) {
      message = "Invalid output pin: " + String(pin);
      return false;
    }
    bool on = readRelay(pin);
    message = "GPIO " + String(pin) + " " + stateText(on) + " (pin " +
              pinLevel(pin) + ")";
    return true;
  }

  if (tool == "adc.read") {
    if (pin < 32 || pin > 39) {
      message = "ADC pin must be 32-39 (ADC1): " + String(pin);
      return false;
    }
    int raw = analogRead(pin);
    float voltage = raw * 3.3f / 4095.0f;
    message = "raw=" + String(raw) + " voltage=" + String(voltage, 3) + "V";
    return true;
  }

  message = "Unknown tool: " + tool;
  return false;
}

void handleRoot() {
  server.send(200, "text/plain", String(FW_NAME) + " " + FW_VERSION);
}

void handleStatus() { sendJson(200, statusJson()); }

void handleConfig() { sendJson(200, configJson()); }

void handleSkills() {
  sendJson(200, "{\"ok\":true,\"skills\":\"gpio.write,gpio.read,adc.read\"}");
}

void handleExecute() {
  String body = server.arg("plain");
  JsonDocument doc;
  if (deserializeJson(doc, body) != DeserializationError::Ok) {
    sendJson(400, "{\"ok\":false,\"message\":\"Invalid JSON\"}");
    return;
  }

  String tool = doc["tool"] | "";
  JsonVariant args = doc["args"];
  String message;
  bool ok = runTool(tool, args, message);

  JsonDocument res;
  res["ok"] = ok;
  res["message"] = message;
  res["pin"] = args["pin"] | -1;
  // Machine-readable state so callers never have to parse the message text.
  if (ok && (tool == "gpio.write" || tool == "gpio.read")) {
    int p = args["pin"] | -1;
    if (isOutputPin(p)) {
      res["on"] = readRelay(p);
      res["level"] = pinLevel(p);
      res["active_low"] = activeLow;
    }
  }
  String out;
  serializeJson(res, out);
  sendJson(ok ? 200 : 400, out);
}

void handleChain() {
  String body = server.arg("plain");
  JsonDocument doc;
  if (deserializeJson(doc, body) != DeserializationError::Ok) {
    sendJson(400, "{\"ok\":false,\"message\":\"Invalid JSON\"}");
    return;
  }
  JsonArray items = doc.as<JsonArray>();
  if (items.isNull()) {
    sendJson(400, "{\"ok\":false,\"message\":\"Expected a JSON array\"}");
    return;
  }

  JsonDocument res;
  res["ok"] = true;
  JsonArray results = res["results"].to<JsonArray>();
  bool allOk = true;

  for (JsonVariant item : items) {
    String tool = item["tool"] | "";
    JsonVariant args = item["args"];
    String message;
    bool ok = runTool(tool, args, message);
    if (!ok) allOk = false;
    JsonObject row = results.add<JsonObject>();
    row["success"] = ok;
    row["message"] = message;
    row["pin"] = args["pin"] | -1;
    if (ok && (tool == "gpio.write" || tool == "gpio.read")) {
      int p = args["pin"] | -1;
      if (isOutputPin(p)) row["on"] = readRelay(p);
    }
  }
  res["ok"] = allOk;

  String out;
  serializeJson(res, out);
  sendJson(200, out);
}

void handleNotFound() {
  sendJson(404, "{\"ok\":false,\"message\":\"Not found\"}");
}

// ----------------------------------------------------------------- serial JSON

void replySerial(const String &body) { Serial.println(body); }

void replyOk(const String &msg) {
  JsonDocument res;
  res["ok"] = true;
  res["msg"] = msg;
  String out;
  serializeJson(res, out);
  replySerial(out);
}

void handleSerialLine(const String &line) {
  JsonDocument doc;
  if (deserializeJson(doc, line) != DeserializationError::Ok) return;
  String c = doc["c"] | "";

  if (c == "ws") {
    String ssid = doc["s"] | "";
    String pass = doc["p"] | "";
    if (ssid.isEmpty()) {
      replySerial("{\"ok\":false,\"msg\":\"ssid_missing\"}");
      return;
    }
    saveWifi(ssid, pass);
    replyOk("wifi_saved_connecting");
    WiFi.disconnect(true, false);
    delay(100);
    WiFi.begin(wifiSsid.c_str(), wifiPass.c_str());
    return;
  }

  if (c == "wst") {
    JsonDocument res;
    res["ok"] = true;
    res["connected"] = (WiFi.status() == WL_CONNECTED);
    res["ssid"] = wifiSsid;
    res["ip"] = WiFi.localIP().toString();
    String out;
    serializeJson(res, out);
    replySerial(out);
    return;
  }

  if (c == "start") {
    startServer();
    return;
  }

  if (c == "wr") {
    clearWifi();
    WiFi.disconnect(true, false);
    replyOk("wifi_forgotten");
    return;
  }

  if (c == "rst") {
    replyOk("restarting");
    delay(200);
    ESP.restart();
    return;
  }

  if (c == "cfg?") {
    replySerial(configJson());
    return;
  }

  if (c == "cfg") {
    JsonArray arr = doc["pins"].as<JsonArray>();
    if (arr.isNull() || arr.size() != RELAY_COUNT) {
      replySerial("{\"ok\":false,\"msg\":\"pins_must_be_4\"}");
      return;
    }
    int pins[RELAY_COUNT];
    for (size_t i = 0; i < RELAY_COUNT; i++) {
      pins[i] = arr[i] | -1;
      if (!isOutputPin(pins[i])) {
        replySerial("{\"ok\":false,\"msg\":\"invalid_pin\"}");
        return;
      }
    }
    bool al = doc["active_low"] | activeLow;
    saveConfig(pins, al);
    initRelays();
    JsonDocument res;
    res["ok"] = true;
    res["msg"] = "config_saved";
    JsonArray p = res["pins"].to<JsonArray>();
    for (size_t i = 0; i < RELAY_COUNT; i++) p.add(relayPins[i]);
    res["active_low"] = activeLow;
    String out;
    serializeJson(res, out);
    replySerial(out);
    return;
  }

  if (c == "gpio") {
    int pin = doc["pin"] | -1;
    bool value = doc["value"] | false;
    if (!isOutputPin(pin)) {
      replySerial("{\"ok\":false,\"msg\":\"invalid_pin\"}");
      return;
    }
    applyRelay(pin, value);
    replyOk("GPIO " + String(pin) + " " + stateText(value) + " (pin " +
            pinLevel(pin) + ")");
    return;
  }

  if (c == "gpio?") {
    int pin = doc["pin"] | -1;
    if (!isOutputPin(pin)) {
      replySerial("{\"ok\":false,\"msg\":\"invalid_pin\"}");
      return;
    }
    bool on = readRelay(pin);
    replyOk("GPIO " + String(pin) + " " + stateText(on) + " (pin " +
            pinLevel(pin) + ")");
    return;
  }

  if (c == "adc?") {
    int pin = doc["pin"] | 34;
    if (pin < 32 || pin > 39) {
      replySerial("{\"ok\":false,\"msg\":\"adc_pin_must_be_32_39\"}");
      return;
    }
    int raw = analogRead(pin);
    float voltage = raw * 3.3f / 4095.0f;
    replyOk("raw=" + String(raw) + " voltage=" + String(voltage, 3) + "V");
    return;
  }
}

// ------------------------------------------------------------------------ main

void setup() {
  Serial.begin(115200);
  delay(100);

  loadConfig();
  initRelays();
  loadWifi();

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  if (!wifiSsid.isEmpty()) {
    WiFi.begin(wifiSsid.c_str(), wifiPass.c_str());
  }

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/config", HTTP_GET, handleConfig);
  server.on("/api/skill/execute", HTTP_POST, handleExecute);
  server.on("/api/skill/chain", HTTP_POST, handleChain);
  server.on("/api/skills", HTTP_GET, handleSkills);
  server.onNotFound(handleNotFound);

  Serial.println("{\"ok\":true,\"msg\":\"boot\",\"firmware\":\"" + String(FW_NAME) +
                 "\",\"version\":\"" + String(FW_VERSION) + "\"}");
}

void loop() {
  server.handleClient();

  if (!serverStarted && WiFi.status() == WL_CONNECTED) {
    startServer();
  }

  while (Serial.available()) {
    char ch = (char)Serial.read();
    if (ch == '\n') {
      String line = serialBuffer;
      serialBuffer = "";
      line.trim();
      if (!line.isEmpty()) handleSerialLine(line);
    } else if (ch != '\r' && serialBuffer.length() < 512) {
      serialBuffer += ch;
    }
  }

  static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 10000) {
    lastCheck = millis();
    if (WiFi.status() != WL_CONNECTED && !wifiSsid.isEmpty()) {
      WiFi.disconnect();
      WiFi.begin(wifiSsid.c_str(), wifiPass.c_str());
    }
  }

  delay(2);
}
