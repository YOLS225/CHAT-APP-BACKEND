import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { AttachmentsService } from '../../business-logic/attachments/attachments.service';
import { CreateUploadUrlDto } from '../../business-logic/attachments/dto/create-upload-url.dto';
import { JwtAuthGuard } from '../../guard/jwt.guard';

@Controller('attachments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Create a signed upload URL for S3' })
  createUploadUrl(@Body() dto: CreateUploadUrlDto, @Req() request: Request) {
    const userId = (request.user as { sub: string }).sub;
    return this.attachmentsService.createUploadUrl(dto, userId);
  }
}
