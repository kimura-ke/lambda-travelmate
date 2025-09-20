import { PlaceInputType, Client } from '@googlemaps/google-maps-services-js';
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
const client = new SSMClient({ region: "ap-northeast-1" });

export const handler = async (event) => {
    try {
        const parameter = new GetParameterCommand({
            Name: "GOOGLE_API_KEY",
            WithDecryption: true
        });
        const googleAPiKey = await client.send(parameter);
        const serviceClient = new Client();
        const placeIds = await Promise.all(event.places.map(async (place) => {
            const input = `${place} Station, ${event.country}`;
            const request = {
                params: {
                    input: input,
                    fields: ['place_id'],
                    inputtype: 'textquery',
                    key: googleAPiKey.Parameter.Value,
                },
            };
            const response = await serviceClient.findPlaceFromText(request);
            return response.data.candidates[0]?.place_id;
        }));        
        return placeIds
    } catch (e) {
        throw new Error(`GetPlaceId fault: ${e.message}`);
    }
}
