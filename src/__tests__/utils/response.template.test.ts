/// <reference types="jest" />
import ResponseTemplate from '../../utils/response.template'; // Adjust path as needed

describe('ResponseTemplate', () => {
  const statusCode = 200;
  const status = 'OK';
  const message = 'Request successful';
  const data = { key: 'value' };

  it('should correctly initialize with all parameters', () => {
    const response = new ResponseTemplate(statusCode, status, message, data);

    expect(response.statusCode).toBe(statusCode);
    expect(response.status).toBe(status);
    expect(response.message).toBe(message);
    expect(response.data).toEqual(data);
    expect(response.timeStamp).toBeDefined();
    expect(new Date(response.timeStamp).toISOString()).toBe(response.timeStamp); // Ensure valid ISO timestamp
  });

  it('should allow undefined message and data', () => {
    const response = new ResponseTemplate(statusCode, status, undefined);

    expect(response.statusCode).toBe(statusCode);
    expect(response.status).toBe(status);
    expect(response.message).toBeUndefined();
    expect(response.data).toBeUndefined();
    expect(response.timeStamp).toBeDefined();
  });

  it('should generate a valid ISO timestamp', () => {
    const response = new ResponseTemplate(statusCode, status, message, data);
    const timeStampDate = new Date(response.timeStamp);

    expect(timeStampDate.toISOString()).toBe(response.timeStamp);
  });
});
