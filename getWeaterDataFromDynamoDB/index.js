import AWS from 'aws-sdk';
let dynamodb = new AWS.DynamoDB.DocumentClient();
export const handler = async (event) => {
    try {
        const param =  {
                TableName: 'weather',
                Key: {
                    'ID': `${event.lat.toString()}${event.lon.toString()}`
                }
            }
        const data= await dynamodb.get(param).promise();
        return data.Item;
    } catch (err) {
        return err;
    }
};