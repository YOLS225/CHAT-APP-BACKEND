import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../../business-logic/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../../business-logic/workspaces/workspaces.service';
import { WorkspacesController } from './workspaces.controller';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [WorkspacesService, PrismaService, MailService],
    }).compile();

    controller = module.get<WorkspacesController>(WorkspacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
