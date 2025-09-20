import axios from 'axios';
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {BatchWriteCommand} from "@aws-sdk/lib-dynamodb";
const ssmClient = new SSMClient({ region: "ap-northeast-1" });
const ddbClient = new DynamoDBClient({ region: "ap-northeast-1" });
import locations from './locations.js';


export const handler = async () => {
  try {
    // パラメータの取得
    const weatherParameter = new GetParameterCommand({
      Name: "OpenWeatherAPI_KEY",
      WithDecryption: true
    });
    const weatherAPiKey = await ssmClient.send(weatherParameter);

    // ttl設定
    const ttl = Math.floor((new Date().getTime() + 1 * 24 * 60 * 60 * 1000) / 1000);
    const now = new Date();
    now.setHours(now.getHours() + 9); // UTCをJSTに変換
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const params = {
      RequestItems: {
        weather: []
      }
    }

    const batchSize = 20;
    // 各地点の天気情報を取得
    for (let i = 0; i < locations.length; i += batchSize) {
      const chunk = locations.slice(i, i + batchSize);
      for (const location of chunk) {
        const weather_info = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${weatherAPiKey.Parameter.Value}&lang=ja`);
        const data=weather_info.data.list.slice(0, 14)
        const putItem = {
          PutRequest:{
            Item: {
              ID:`${location.lat.toString()}${location.lon.toString()}`,
              weather_info: data,
              ttl:  ttl
            }
          }
        };
        params.RequestItems.weather.push(putItem);
      }
      // DynamoDBにデータをバッチ書き込み
      const command = new BatchWriteCommand(params);
      await ddbClient.send(command);
    }
    return {
      statusCode: 200,
      body: `API done successfully}`
    }
  } catch (e) {
      throw new Error(e.message);
  }
}