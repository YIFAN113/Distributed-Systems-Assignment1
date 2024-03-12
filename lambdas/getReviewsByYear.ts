import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const movieId = event.pathParameters?.movieId;
    const year = event.pathParameters?.year;

    if (!movieId || !year) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Movie ID and year are required." }),
      };
    }

    const queryInput = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'MovieId = :movieId',
      FilterExpression: 'begins_with(ReviewDate, :year)',
      ExpressionAttributeValues: {
        ':movieId': parseInt(movieId),
        ':year': year,
      },
    };

    const { Items } = await ddbDocClient.send(new QueryCommand(queryInput));

    if (!Items || Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "No reviews found." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reviews: Items }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};