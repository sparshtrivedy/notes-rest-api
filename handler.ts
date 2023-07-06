'use strict';

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, Context, APIGatewayProxyCallback } from 'aws-lambda'

const { 
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb")
const client = new DynamoDBClient({ region: 'us-east-1' })
const ddbDocClient = DynamoDBDocumentClient.from(client);
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) => {
  return {
    statusCode,
    body: JSON.stringify(data)
  }
}

export const createNote = async (event: APIGatewayEvent, context: Context, cb: APIGatewayProxyCallback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let data = JSON.parse(event.body as string);
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    }

    await ddbDocClient.send(new PutCommand(params));

    return send(201, data);
  } catch(err) {
    return send(500, err.message);
  }
};

export const updateNote = async (event: APIGatewayEvent, context: Context, cb: APIGatewayProxyCallback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters?.id;
  let data = JSON.parse(event.body as string);
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: {
        notesId: notesId
      },
      UpdateExpression: 'set #title = :title, #body = :body',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#body': 'body'
      },
      ExpressionAttributeValues: {
        ':title': data.title,
        ':body': data.body
      },
      ConditionExpression: 'attribute_exists(notesId)'
    }

    await ddbDocClient.send(new UpdateCommand(params));

    return send(200, data);
  } catch(err) {
    return send(500, err.message);
  }
};

export const deleteNote = async (event: APIGatewayEvent, context: Context, cb: APIGatewayProxyCallback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters?.id
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: {
        notesId: notesId
      },
      ConditionExpression: 'attribute_exists(notesId)'
    }

    await ddbDocClient.send(new DeleteCommand(params));

    return send(200, notesId);
  } catch(err) {
    return send(500, err.message);
  }
};

export const getAllNotes = async (event: APIGatewayEvent, context: Context, cb: APIGatewayProxyCallback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
    }

    const notes = await ddbDocClient.send(new ScanCommand(params));

    return send(200, notes);
  } catch(err) {
    return send(500, err.message);
  }
};
