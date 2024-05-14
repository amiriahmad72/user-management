import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EmailService {
    private mailerSend: MailerSend;
    constructor(private readonly configService: ConfigService) {
        this.mailerSend = new MailerSend({
            apiKey: configService.get<string>('MAILER_SEND_API_KEY', 'dummy_token')
        });
    }

    sendUserWelcome(user: User) {
        const sentFrom = new Sender(
            this.configService.get<string>('MAILER_SEND_SENDER_EMAIL', 'dummy_email'),
            this.configService.get<string>('MAILER_SEND_SENDER_NAME', 'dummy_name')
        );

        const fullName = user.firstName + ' ' + user.lastName;
        const recipients = [
            new Recipient(user.email, fullName)
        ];

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject('Payever user-management sample project email')
            .setHtml('<strong>Welcome ' + fullName + '</strong>')
            .setText('Welcome ' + fullName);

        this.mailerSend.email.send(emailParams);
    }
}
