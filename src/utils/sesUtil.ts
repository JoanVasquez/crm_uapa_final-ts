import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from '@aws-sdk/client-ses';
import logger from '../utils/logger';

const region = process.env.AWS_REGION ?? 'us-east-1';
const sesClient = new SESClient({ region });

/**
 * 📧 sendEmail - Sends an HTML email using AWS SES.
 *
 * @param emails - Array of recipient email addresses
 * @param subject - Email subject
 * @param data - HTML content of the email
 */
async function sendEmail(
  emails: Array<string>,
  subject: string,
  data: string,
): Promise<void> {
  const params: SendEmailCommandInput = {
    Destination: {
      ToAddresses: emails,
    },
    Message: {
      Body: {
        Html: {
          Data: data,
        },
      },
      Subject: {
        Data: subject,
      },
    },
    Source: 'dev.joanvasquez@gmail.com',
  };

  try {
    const command: SendEmailCommand = new SendEmailCommand(params);
    const result = await sesClient.send(command);

    logger.info('📧 [sendEmail] Email sent successfully!', {
      to: emails,
      subject,
      messageId: result.MessageId,
    });
  } catch (error) {
    logger.error('❌ [sendEmail] Error sending email:', {
      to: emails,
      subject,
      error,
    });
  }
}

export { sendEmail };
