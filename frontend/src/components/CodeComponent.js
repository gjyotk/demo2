import React, {useState } from 'react';
import {
  Grid,
  Button,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Box
} from '@mui/material';

import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Moved up
import { CodeBlock, dracula } from 'react-code-blocks';
import { BACKEND_API_URL } from '../services/axiosConfig';

export default function CodeComponent({ token, nodeParams, dataTypes, apiToken, hideCode }) {
  const [deviceType, setDeviceType] = useState('arduino');
  const [protocol, setProtocol] = useState('http');
  const [isCodeVisible, setIsCodeVisible] = useState(!hideCode);
  const [copySuccess, setCopySuccess] = useState(false);
  const httpUrl = `${BACKEND_API_URL}/cin/create/${token}`;

  const toggleCodeVisibility = () => {
    setIsCodeVisible(!isCodeVisible);
  };

  const generateExampleValue = (type) => {
    const exampleValues = {
      int: Math.round(Math.random() * 100),
      float: Math.round(Math.random() * 10000) / 100,
      string: 'example'
    };
    return exampleValues[type] || 'example';
  };


  const generateRequestBody = () => {
    const requestBody = nodeParams.reduce((acc, param, index) => {
      acc[param] = generateExampleValue(dataTypes[index]);
      return acc;
    }, {});
    return JSON.stringify(requestBody, null, 2);
  };


  const generateRequestBody1 = () => {
    const requestBody = JSON.parse(generateRequestBody()); // Parse JSON string to object
    let result = "";
  
    Object.entries(requestBody).forEach(([key, value]) => {
      result += `jsonDoc["${key}"] = "${value}";\n`;
    });
  
    // eslint-disable-next-line no-console
    console.log(result);
  
    return result;
  };
  
  const MQTT_BROKER = "10.2.16.116";
  const MQTT_PORT = 1884
  const MQTT_TOPIC = `oneM2M/req/${token}`;
  const COAP_PORT = 5683;

 const generateArduinoHTTPCode = (result) =>
    `#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

const char* ssid = "myssid";
const char* password = "password";
const char* serverAddress = "${MQTT_BROKER}";  // Server IP
const int port = 8610;                      // Server port
// const int port = 443; 

// Secure Connection (SSL/TLS) : HTTPS 
WiFiSSLClient wifiClient;   // Use WiFiSSLClient for HTTPS
HttpClient httpClient(wifiClient, serverAddress, port);

// Uncomment below for non-secure connection (HTTP)
// WiFiClient wifiClient;     
// HttpClient httpClient(wifiClient, serverAddress, port);

void setup() {
    Serial.begin(115200);

    if (WiFi.status() == WL_NO_MODULE) {
        Serial.println("WiFi module not found!");
        while (true);  // Halt execution
    }

    Serial.print("Connecting to WiFi");
    WiFi.begin(ssid, password);
    
    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 20) {
        delay(1000);
        Serial.print(".");
        retries++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nConnected to WiFi");
    } else {
        Serial.println("\nFailed to connect to WiFi. Check credentials!");
        while (true);
    }
}

// Function to post data to the server
void postData() {
    if (WiFi.status() == WL_CONNECTED) {
        String url = "/cin/create/${token}";
        httpClient.beginRequest();
        httpClient.post(url);
        httpClient.sendHeader("Content-Type", "application/json");
        httpClient.sendHeader("Authorization", "Bearer ${apiToken}");

        // Create JSON document
        DynamicJsonDocument jsonDoc(1024);
        ${result}

        String requestBody;
        serializeJson(jsonDoc, requestBody);

        httpClient.sendHeader("Content-Length", requestBody.length());
        httpClient.beginBody();
        httpClient.print(requestBody);
        httpClient.endRequest();

        int statusCode = httpClient.responseStatusCode();
        String response = httpClient.responseBody();

        Serial.print("HTTP Response code: ");
        Serial.println(statusCode);
        Serial.println(response);
    } else {
        Serial.println("WiFi not connected. Cannot send data.");
    }
}

void loop() {
    postData();
    delay(5000); // Send request every 5 seconds
}`;



  const generateArduinoMQTTCode = () =>
    ` #include <WiFiNINA.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>  // Include ArduinoJson library

// WiFi and MQTT broker details
const char* ssid = "myssid";
const char* password = "password";
const char* mqtt_server = "${MQTT_BROKER}";  // MQTT broker IP
const int mqtt_port = ${MQTT_PORT};               // MQTT broker port

// MQTT topic
const char* topic = "${MQTT_TOPIC}";  // MQTT topic to publish to

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
#define MSG_BUFFER_SIZE (256)  // Buffer size for MQTT message
char msg[MSG_BUFFER_SIZE];

int pm25_value = 1;  // Start value

void setup() {
  Serial.begin(115200);
  
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("WiFi module not found!");
    while (true);
  }

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");

  client.setServer(mqtt_server, mqtt_port);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "Nano33Client-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {  // No authentication
      Serial.println("Connected to MQTT Broker");
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Trying again in 5 seconds...");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 10000) {  // Publish every 10 seconds
    StaticJsonDocument<256> doc;  // JSON document size

    // Construct JSON payload
    doc["Authentication"] = "Bearer ${apiToken}";
    doc["token_id"] = "${token}";

    JsonObject data = doc.createNestedObject("data");
    ${generateRequestBody1()}

    // Serialize JSON to a char array
    serializeJson(doc, msg, MSG_BUFFER_SIZE);
    Serial.print("Publishing message: ");
    Serial.println(msg);
    client.publish(topic, msg);
    pm25_value++;  // Increment the pm2.5 value
    lastMsg = now;
  }
}`;

  const generateArduinoCoAPCode = () =>
    `#include <ESP8266WiFi.h>
#include <coap-simple.h>

const char* ssid = "yourSSID";
const char* password = "yourPASSWORD";
const char* coapServer = "coap://your.coap.server";
const int coapPort = ${COAP_PORT}; // CoAP server port

WiFiUDP udp;
Coap coap(udp);

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }

    Serial.println("Connected to WiFi");

    coap.start();
}

void loop() {
    String payload = "${generateRequestBody()}";
    coap.put(coapServer, coapPort, "/cin/create", payload.c_str());

    delay(10000); // Delay between requests
}`;

const generateESP32HTTPCode = (requestBody) =>
    `#include <WiFi.h>\n#include <HTTPClient.h>\n\nconst char* ssid = "yourSSID";\nconst char* password = "yourPASSWORD";\n\nvoid setup() {\n    Serial.begin(115200);\n    WiFi.begin(ssid, password);\n\n    while (WiFi.status() != WL_CONNECTED) {\n        delay(1000);\n        Serial.println("Connecting to WiFi...");\n    }\n\n    Serial.println("Connected to WiFi");\n}\n\nvoid loop() {\n    if (WiFi.status() == WL_CONNECTED) {\n        HTTPClient http;\n\n        http.begin("${httpUrl}");\n        http.addHeader("Content-Type", "application/json");\n        http.addHeader("Authorization", "Bearer ${apiToken}");\n\n        String requestBody = ${requestBody};\n        int httpResponseCode = http.POST(requestBody);\n\n        if (httpResponseCode > 0) {\n            String response = http.getString();\n            Serial.println(httpResponseCode);\n            Serial.println(response);\n        } else {\n            Serial.print("Error on sending POST: ");\n            Serial.println(httpResponseCode);\n        }\n\n        http.end();\n    }\n\n    delay(10000); // Delay between POST requests\n}`;

  const generateESP32MQTTCode = generateArduinoMQTTCode;
  const generateESP32CoAPCode = generateArduinoCoAPCode;

  const generateRaspberryPiHTTPCode = (requestBody) =>
    `import requests
import json

url = "${httpUrl}"
data = ${requestBody}
headers = {"Content-Type": "application/json", "Authorization": "Bearer ${apiToken}"}

response = requests.post(url, data=json.dumps(data), headers=headers)

if response.status_code == 200:
    print("Success:", response.text)
else:
    print("Error:", response.status_code, response.text)`;

  const generateRaspberryPiMQTTCode = () =>
    `import paho.mqtt.client as mqtt
import json

mqtt_broker = "${MQTT_BROKER}"
mqtt_port = ${MQTT_PORT}
mqtt_topic = "${MQTT_TOPIC}"

client = mqtt.Client()


client.connect(mqtt_broker, mqtt_port, 60)

payload = ${generateRequestBody()}

client.publish(mqtt_topic, json.dumps(payload))

client.disconnect()`;

  const generateRaspberryPiCoAPCode = () =>
    `from coapthon.client.helperclient import HelperClient
import json

host = "your.coap.server"
port = 5683
path = "cin/create"

client = HelperClient(server=(host, port))

payload = json.dumps(${generateRequestBody()})
response = client.put(path, payload)

print(response.pretty_print())

client.stop()`;

const codeGenerators = {
  arduino: {
    http: generateArduinoHTTPCode,
    mqtt: generateArduinoMQTTCode,
    coap: generateArduinoCoAPCode
  },
  esp32: {
    http: generateESP32HTTPCode,
    mqtt: generateESP32MQTTCode,
    coap: generateESP32CoAPCode
  },
  raspberrypi: {
    http: generateRaspberryPiHTTPCode,
    mqtt: generateRaspberryPiMQTTCode,
    coap: generateRaspberryPiCoAPCode
  }
};

const generateCodeSnippet = () => {
  if (!token) return '// Please assign a token';
  
  // Determine which request body generator to use
  const requestBodyGenerator = deviceType === "raspberrypi" ? generateRequestBody : generateRequestBody1;
  
  const generator = codeGenerators[deviceType]?.[protocol];
  return generator ? generator(requestBodyGenerator()) : '// Select a valid option';
};

const handleCopyCode = () => {
  const codeSnippet = generateCodeSnippet(deviceType);
  navigator.clipboard.writeText(codeSnippet)
    .then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    })
    .catch((err) => console.error('Failed to copy:', err));
};

const handleDeviceChange = (event) => {
  setDeviceType(event.target.value);
};

const handleProtocolChange = (event) => {
  setProtocol(event.target.value);
};


return (

    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Device Code
          </Typography>

          <Grid container spacing={2} sx={{ mb: isCodeVisible ? 2 : 0 }}>
            {/* Device Type & Protocol Selection */}
            <Grid item xs={12} sm={9} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="device-select-label">Device Type</InputLabel>
                <Select
                  labelId="device-select-label"
                  id="device-select"
                  value={deviceType}
                  label="Device Type"
                  onChange={handleDeviceChange}
                >
                  <MenuItem value="arduino">Arduino</MenuItem>
                  <MenuItem value="esp32">ESP32</MenuItem>
                  <MenuItem value="raspberrypi">Raspberry Pi</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="protocol-select-label">Protocol</InputLabel>
                <Select
                  labelId="protocol-select-label"
                  id="protocol-select"
                  value={protocol}
                  label="Protocol"
                  onChange={handleProtocolChange}
                >
                  <MenuItem value="http">HTTP</MenuItem>
                  <MenuItem value="mqtt">MQTT</MenuItem>
                  <MenuItem value="coap">CoAP</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Show/Hide Code Button */}
            <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                onClick={toggleCodeVisibility} 
                variant="contained" 
                color="primary"
              >
                {isCodeVisible ? 'Hide Code' : 'Show Code'}
              </Button>
            </Grid>
          </Grid>

          {/* Code Block Display */}
          {isCodeVisible && (
           <Box sx={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
           <Tooltip title={copySuccess ? "Copied!" : "Copy Code"}>
             <IconButton
               onClick={handleCopyCode}
               color="primary"
               sx={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.2)' }}>
               <ContentCopyIcon />
             </IconButton>
           </Tooltip>
           <CodeBlock text={generateCodeSnippet(deviceType)} language="javascript" showLineNumbers theme={dracula} />
         </Box>
          )}
        </CardContent>
      </Card>
    </Grid>

);

}