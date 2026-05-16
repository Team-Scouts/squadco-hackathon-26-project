import { AlertSeverity, AlertType } from '../../../generated/prisma/enums';

export class CreateAlertDto {
  vendorId: string;

  type: AlertType;

  severity: AlertSeverity;

  title: string;

  message: string;
}
