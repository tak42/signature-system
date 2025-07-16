import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const healthCheck = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Lambda health check OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }),
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error'
      }),
    };
  }
};

export const processSignature = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    
    // 署名処理のロジックをここに実装
    const result = {
      requestId: body.requestId || 'unknown',
      status: 'processed',
      timestamp: new Date().toISOString(),
      message: 'Signature processing completed'
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Signature processing error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Signature processing failed'
      }),
    };
  }
};