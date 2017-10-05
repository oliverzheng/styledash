/** @flow */

import amqplib from 'amqplib';

import {
  printError,
} from '../consoleUtil';

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
  listener: (msg: Object, done: () => void) => any,
): Promise<QueueListenerToken> {
  await c.channel.assertQueue(queue);
  const {consumerTag} = await c.channel.consume(
    queue,
    msg => {
      const msgContent = msg.content.toString('utf8');
      let parsedContent = null;
      try {
        parsedContent = JSON.parse(msgContent);
      } catch (err) {
        printError('Failed to JSON.parse queue message: ' + err);
        printError('Message: ' + msgContent);

        // Ack the message since it'll never be valid
        c.channel.ack(msg);
        return;
      }

      if (parsedContent != null) {
        listener(
          parsedContent,
          () => c.channel.ack(msg),
        );
      }
    },
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
  message: Object,
): Promise<void> {
  await c.channel.assertQueue(queue);
  c.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message), 'utf8'));
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
