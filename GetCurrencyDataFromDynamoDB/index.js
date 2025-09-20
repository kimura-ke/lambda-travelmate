import AWS from 'aws-sdk';
let dynamodb = new AWS.DynamoDB.DocumentClient();
export const handler = async (event) => {
    try {
        const now = new Date();
        now.setHours(now.getHours() + 9); // UTCをJSTに変換
        const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
        const param =  {
                TableName: 'exchangeRates',
                Key: {
                    'ID': yyyymmdd
                }
            }
        const data= await dynamodb.get(param).promise();
        return data.Item;
    } catch (err) {
        return err;
    }
};