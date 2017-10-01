/** @flow */

import amqplib from 'amqplib';

export opaque type QueueConnection = {
  connection: Object,
  channel: Object,
};

export type QueueName =
  'compileRepo';

export opaque type QueueListenerToken = string;

export async function genAddListenerToQueue(
  c: QueueConnection,
  queue: QueueName,
  listener: (msg: mixed, done: () => void) => any,
): Promise<QueueListenerToken> {
  await c.channel.assertQueue(queue);
  const {consumerTag} = await c.channel.consume(
    queue,
    msg =>
      listener(
        msg.content.toString('utf8'),
        () => c.channel.ack(msg),
      ),
  );
  return consumerTag;
}

export async function genRemoveListenerFromQueue(
  c: QueueConnection,
  listenerToken: QueueListenerToken,
): Promise<void> {
  await c.channel.cancel(listenerToken);
}

export async function genSendMessageToQueue(
  c: QueueConnection,
  queue: QueueName,
  message: string,
): Promise<void> {
  await c.channel.assertQueue(queue);
  c.channel.sendToQueue(queue, Buffer.from(message, 'utf8'));
}

export async function genConnectToServer(url: string): Promise<QueueConnection> {
  const connection = await amqplib.connect(url);
  const channel = await connection.createChannel();
  await channel.prefetch(1);
  return {
    connection,
    channel,
  };
}

export async function genDisconnectFromServer(
  connection: QueueConnection,
): Promise<void> {
  await connection.channel.close();
  await connection.connection.close();
}
