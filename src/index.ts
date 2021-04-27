import aws from 'aws-sdk';
const documentClient = new aws.DynamoDB.DocumentClient();

exports.handler = async (event?) => {
    const bookRequested = event;

    // if (bookRequested) {
    //     const bookRequest = await getBooks(bookRequested)
    //     const response = {
    //         body: bookRequest.title && bookRequest.owner
    //     }

    // } else {
    const books = await getAllBooks();
    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": '*',
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: JSON.stringify(books)
    };
    return response;
    // }


};

async function getAllBooks(books = [], lastEvaluatedKey?: aws.DynamoDB.DocumentClient.Key) {

    const scanParams: aws.DynamoDB.DocumentClient.ScanInput = {
        TableName: 'audible-libraries',
        // ProjectionExpression: 'title'
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
// async function getBooks(bookRequested){

//     const scanParams: aws.DynamoDB.DocumentClient.ScanInput = {
//         TableName: 'audible-libraries',
//        ProjectionExpression: 'title && owner',
//        FilterExpression: `contains(${bookRequested},:gen)` 

//     }

// }


// async function scanTitles(existingTitles = [], lastEvaluatedKey?: aws.DynamoDB.DocumentClient.Key) {

//     const scanParams: aws.DynamoDB.DocumentClient.ScanInput = {
//         TableName: 'audible-libraries',
//         ProjectionExpression: 'title'
//     };
//     if (lastEvaluatedKey) {
//         scanParams.ExclusiveStartKey = lastEvaluatedKey;
//     }
//     const titleResponse = await documentClient.scan(scanParams).promise();
//     existingTitles.push(...titleResponse.Items);

//     if (titleResponse.LastEvaluatedKey) {
//         return await scanTitles(existingTitles, titleResponse.LastEvaluatedKey);
//     }

//     return existingTitles;
// }