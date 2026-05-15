import { AlertSeverity, AlertType } from 'src/generated/prisma';

export class CreateAlertDto {
  vendorId: string;

  type: AlertType;

  severity: AlertSeverity;

  title: string;

  message: string;
}
