import { Bill } from '../models/Bill';

export const email_confirm = (confirmationURL: string) => `
<div>
    <p>
        Please confirm your account for the CRM UAPA
    </p>
    <a href="${confirmationURL}">${confirmationURL}</a>
</div>
`;

export const customer_receipt = (bill: Bill): string => {
  const customerName = `${bill.customer.first_name} ${bill.customer.last_name}`;
  const billId = bill.id;
  const totalAmount = bill.total_amount;

  const sales = bill.sales.map((sell) => ({
    productName: sell.product.name,
    quantity: sell.quantity,
    salePrice: sell.sale_price,
  }));

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h1 style="color: #2d3748;">🧾 Customer Receipt</h1>

      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Bill ID:</strong> ${billId}</p>
      <p><strong>Total Amount:</strong> <span style="color: #2f855a;">$${totalAmount.toFixed(2)}</span></p>

      <h2 style="margin-top: 30px;">🛍️ Sales Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #edf2f7;">
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ccc;">Product</th>
            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ccc;">Quantity</th>
            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ccc;">Sale Price</th>
          </tr>
        </thead>
        <tbody>
          ${sales
            .map(
              (sale) => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${sale.productName}</td>
              <td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">${sale.quantity}</td>
              <td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">$${sale.salePrice.toFixed(
                2,
              )}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>

      <p style="margin-top: 40px;">
        Thank you for your purchase! If you have any questions, feel free to contact our support team.
      </p>

      <p style="margin-top: 20px; font-size: 0.9em; color: #888;">
        This receipt was generated automatically. Please do not reply to this email.
      </p>
    </div>
    `;
};
