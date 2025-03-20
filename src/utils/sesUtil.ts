import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from '@aws-sdk/client-ses';

const region = process.env.AWS_REGION ?? 'us-east-1';
const sesClient = new SESClient({ region });
const confirmationURL = process.env.CRM_USER_CONFIRM_URL;

async function sendEmail(emails: Array<string>): Promise<void> {
  const params: SendEmailCommandInput = {
    Destination: {
      ToAddresses: emails,
    },
    Message: {
      Body: {
        Html: {
          Data: `
            <div>
                <p>
                    Please confirm your account for the CRM UAPA
                </p>
                <a href="${confirmationURL}">${confirmationURL}</a>
            </div>
          `,
        },
      },
      Subject: {
        Data: 'Confirm yor CRM UAPA account',
      },
    },
    Source: 'dev.joanvasquez@gmail.com',
  };

  try {
    const command: SendEmailCommand = new SendEmailCommand(params);
    const data = await sesClient.send(command);
    // eslint-disable-next-line
    console.log('Email sent successfully! Message ID:', data.MessageId);
  } catch (error) {
    // eslint-disable-next-line
    console.error('Error sending email:', error);
  }
}

export { sendEmail };
