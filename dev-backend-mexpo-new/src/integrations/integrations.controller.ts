import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { CreateIntegrationEventDto } from './dto/create-integration-event.dto';
import { UpdateIntegrationEventDto } from './dto/update-integration-event.dto';
import FormatValidation from '../helper/validation.format';

@ApiTags('Integrations')
@ApiHeader({
  name: 'X-API-Key',
  description: 'Integration secret API key (or Authorization: Bearer <key>)',
  required: true,
})
@UseGuards(ApiKeyGuard)
@Controller('api/v1/integrations/events')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create and sync an event (e.g. Trial Class) from external School CMS',
  })
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(@Body() dto: CreateIntegrationEventDto) {
    return this.integrationsService.createEvent(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integrated event details, URLs, and stats' })
  findOne(@Param('id') id: string) {
    return this.integrationsService.findOne(id);
  }

  @Get(':id/attendees')
  @ApiOperation({ summary: 'Get list of registered attendees for the event' })
  findAttendees(@Param('id') id: string) {
    return this.integrationsService.findAttendees(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an integrated event from School CMS' })
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  update(@Param('id') id: string, @Body() dto: UpdateIntegrationEventDto) {
    return this.integrationsService.updateEvent(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an integrated event from Mexpo' })
  remove(@Param('id') id: string) {
    return this.integrationsService.deleteEvent(id);
  }
}
