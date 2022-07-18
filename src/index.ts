import aws from 'aws-sdk';
const documentClient = new aws.DynamoDB.DocumentClient();

exports.handler = async (event?) => {
    console.log('event', event);
    const response: any = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": '*',
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET, PUT, DELETE"
        }
    };
    if (event.path === '/users' && event.httpMethod === 'GET') {
        // Pull from user tables where email is the same as the email in the event
        // event.queryStringParameters.email
        const getParams: aws.DynamoDB.DocumentClient.GetItemInput = {
            TableName: 'audible-users',
            Key: {
                email: event.queryStringParameters.email
            }
        };
        const user = await documentClient.get(getParams).promise();
        response.body = JSON.stringify(user.Item);
        return response;
    } else if (event.path === '/users' && event.httpMethod === 'POST') {
        // Create a new user if they don't exist with the bookId in an array
        // Then if they do exist, add the bookId to the array
        const user = event.queryStringParameters.email;
        const bookId = event.queryStringParameters.bookId;
        try {
            const updateParams: aws.DynamoDB.DocumentClient.UpdateItemInput = {
                TableName: 'audible-users',
                Key: {
                    email: user
                },
                UpdateExpression: 'ADD bookId :bookId',
                ExpressionAttributeValues: {
                    ':bookId': documentClient.createSet([bookId])
                }
            };
            await documentClient.update(updateParams).promise();
            return response;
        } catch (error) {
            console.log('User does not exist creating', error);
            const putParams: aws.DynamoDB.DocumentClient.PutItemInput = {
                TableName: 'audible-users',
                Item: {
                    bookId: documentClient.createSet([bookId]),
                    email: user
                }
            };
            await documentClient.put(putParams).promise();
            return response;
        }
    } else if (event.path === '/users' && event.httpMethod === 'DELETE') {
        // Delete the bookId from the specified user
        const user = event.queryStringParameters.email;
        const bookId = event.queryStringParameters.bookId;
        if (bookId) {
            const deleteParams: aws.DynamoDB.DocumentClient.UpdateItemInput = {
                TableName: 'audible-users',
                Key: {
                    email: user
                },
                UpdateExpression: 'DELETE bookId :bookId', 
                ExpressionAttributeValues: {
                    ':bookId': documentClient.createSet([bookId])
                }
                
            };
            await documentClient.update(deleteParams).promise();
            return response;
        } else {
            const deleteParams: aws.DynamoDB.DocumentClient.DeleteItemInput = {
                TableName: 'audible-users',
                Key: {
                    email: user
                }
            };
            await documentClient.delete(deleteParams).promise();
            return response;
        }

    }
    const books = await getAllBooks();
    response.body = JSON.stringify(books);
    return response;
};

async function getAllBooks(books = [], lastEvaluatedKey?: aws.DynamoDB.DocumentClient.Key) {

    const scanParams: aws.DynamoDB.DocumentClient.ScanInput = {
        TableName: 'audible-libraries',
    };
    if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    console.log('Scan params', scanParams);
    const booksResponse = await documentClient.scan(scanParams).promise();

    books.push(...booksResponse.Items);
    console.log("book response items", booksResponse.Items)

    if (booksResponse.LastEvaluatedKey) {
        return await getAllBooks(books, booksResponse.LastEvaluatedKey);
    }

    return books;
}