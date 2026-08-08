import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentsService } from '../../business-logic/attachments/attachments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AttachmentsController } from './attachments.controller';

describe('AttachmentsController', () => {
  let controller: AttachmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [AttachmentsService, PrismaService],
    }).compile();

    controller = module.get<AttachmentsController>(AttachmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
