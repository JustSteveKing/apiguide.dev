---
title: "AsyncAPI Specification"
description: "A deep-dive explanation of the AsyncAPI Specification, detailing message-driven architectures, channels, protocols, and event bindings."
currentVersion: "3.0.0"
officialUrl: "https://www.asyncapi.com/specifications"
---

## Core Architecture of AsyncAPI

The AsyncAPI Specification is an open-source standard for describing event-driven and message-based APIs. While REST APIs use synchronous HTTP request-response patterns, event-driven architectures rely on message brokers (such as Kafka, RabbitMQ, WebSockets, or MQTT) where services publish and subscribe to topics or queues.

### Document Structure Breakdown

An AsyncAPI specification document organizes message-driven configurations into five core modules:
1. **Info Object**: Contains basic metadata about the API (version, title, description, and contact info).
2. **Servers Array**: Details the physical message brokers (e.g., Apache Kafka cluster, RabbitMQ exchange, or WebSockets server) and their protocols.
3. **Channels Object**: Maps the transmission pathways (topics, queues, routing keys, or paths) where message payloads are sent.
4. **Operations Object**: Defines actions clients can take on specific channels—either `send` (publishing messages) or `receive` (subscribing to streams).
5. **Components Object**: Acts as a central registry for reusable message definitions, security parameters, and data validation payload schemas.

---

## 1. Channels & Address Mapping (`channels`)

In AsyncAPI, **channels** represent the physical transmission routes (topics, queues, routing keys, or WebSocket paths) where messages are exchanged.
* **Address**: The name of the channel (e.g. `user.signup` in Kafka or `/chat` in WebSockets).
* **Parameters**: Variable segments inside the channel address (e.g., `sensors.{sensorId}.telemetry`).
* **Messages**: The map of message definitions permitted on this channel.

```yaml
channels:
  sensor.data:
    address: sensors.{sensorId}.telemetry
    parameters:
      sensorId:
        description: Unique sensor identifier
        schema:
          type: string
```

---

## 2. Operations & Actions (`operations`)

AsyncAPI 3.0 decoupled channels and operations. Operations specify *actions* that clients can perform against a channel.
* **`action: send`**: The client publishes a message to this channel (the server receives it).
* **`action: receive`**: The client subscribes to this channel (the server sends it).

```yaml
operations:
  processTelemetry:
    action: send
    channel:
      $ref: '#/channels/sensor.data'
    summary: Publish telemetry data from local sensors.
```

---

## 3. Server Protocols & Broker Configuration (`servers`)

Unlike REST APIs which are almost exclusively HTTP/S, event-driven systems run on diverse protocols. The `servers` block defines broker addresses and protocols:

Supported protocols include:
* **`kafka`**: Apache Kafka brokers.
* **`amqp`**: RabbitMQ and standard AMQP brokers.
* **`ws` / `wss`**: WebSockets connections.
* **`mqtt`**: IoT brokers.

```yaml
servers:
  production-kafka:
    host: kafka-broker.apiguide.dev:9092
    protocol: kafka
    description: Production Apache Kafka Cluster
```

---

## 4. Message Bindings

Brokers differ in their configurations. For example, a RabbitMQ exchange behaves differently than a Kafka topic. AsyncAPI uses **bindings** to specify broker-specific parameters:

```yaml
channels:
  order.events:
    address: orders
    bindings:
      amqp:
        is: queue
        queue:
          durable: true
          exclusive: false
```

