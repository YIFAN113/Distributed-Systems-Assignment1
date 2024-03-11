import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({ region: process.env.REGION || 'us-west-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    const movieId = event.pathParameters?.movieId;
    const minRatingStr = event.queryStringParameters?.minRating;
    const minRating = minRatingStr ? parseInt(minRatingStr, 10) : undefined;

    if (!movieId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Movie ID is required" }),
        };
    }

    if (!minRating) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "minRating query parameter is required" }),
        };
    }

    const params = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'MovieId = :movieId',
        FilterExpression: 'Rating > :minRating',
        ExpressionAttributeValues: {
            ':movieId': movieId,
            ':minRating': minRating,
        },
    };

    try {
        const data = await docClient.send(new QueryCommand(params));
        return {
            statusCode: 200,
            body: JSON.stringify({ reviews: data.Items }),
        };
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};