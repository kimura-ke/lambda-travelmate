import axios from 'axios';
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
const ssmClient = new SSMClient({ region: "ap-northeast-1" });
const ddbClient = new DynamoDBClient({ region: "ap-northeast-1" });

export const handler = async (event) => {
  try {
    // パラメータの取得
    const exchangeParameter = new GetParameterCommand({
      Name: "OpenExchangeRateAPI_KEY",
      WithDecryption: true
    });
    const exchangeAPiKey = await ssmClient.send(exchangeParameter);
    const  exchange_info = await axios.get(`https://openexchangerates.org/api/latest.json?app_id=${exchangeAPiKey.Parameter.Value}`);
    // ttl設定
    const ttl = Math.floor((new Date().getTime() + 1 * 24 * 60 * 60 * 1000) / 1000);
    const now = new Date();
    now.setHours(now.getHours() + 9); // UTCをJSTに変換
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const putItemforExchangeRates={
      TableName: "exchangeRates",
      Item: {
        ID: { S: yyyymmdd} ,
        exchange_info: {S:JSON.stringify(exchange_info.data.rates) }
        ,ttl:{N:ttl.toString()}
      }
    };

    const exchangeInfoPut=new PutItemCommand(putItemforExchangeRates);
    await ddbClient.send(exchangeInfoPut);
    return {
      statusCode: 200,
      body: `API done successfully}`
    }
  } catch (e) { 
    throw new Error(e.message);
  }
}