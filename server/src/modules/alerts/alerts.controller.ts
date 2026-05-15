import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  createAlert(@Body() dto: CreateAlertDto) {
    return this.alertsService.createAlert(dto);
  }

  @Get()
  getAlerts() {
    return this.alertsService.getAlerts();
  }

  @Get('active')
  getActiveAlerts() {
    return this.alertsService.getActiveAlerts();
  }

  @Patch(':id/resolve')
  resolveAlert(@Param('id') id: string) {
    return this.alertsService.resolveAlert(id);
  }
}
