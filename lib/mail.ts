import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(email: string, token: string) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [email],
      subject: 'You have been invited!',
      html: `
        <div>
          <h1>You've been invited!</h1>
          <p>Click the link below to accept your invitation and meet your messenger pet:</p>
          <a href="${inviteUrl}">Accept Invitation</a>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending email:', error);
    return { success: false, error };
  }
}
