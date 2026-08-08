import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guard/jwt.guard';
import { CreateDirectMessageDto } from '../../business-logic/workspaces/dto/create-direct-message.dto';
import { CreateWorkspaceDto } from '../../business-logic/workspaces/dto/create-workspace.dto';
import { InviteWorkspaceUserDto } from '../../business-logic/workspaces/dto/invite-workspace-user.dto';
import { UpdateWorkspaceMemberDto } from '../../business-logic/workspaces/dto/update-workspace-member.dto';
import { WorkspacesService } from '../../business-logic/workspaces/workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  private getAuthenticatedUserId(request: Request) {
    return (request.user as { sub: string }).sub;
  }

  @Post()
  @ApiOperation({ summary: 'Create a workspace' })
  create(@Body() dto: CreateWorkspaceDto, @Req() request: Request) {
    return this.workspacesService.create(
      dto,
      this.getAuthenticatedUserId(request),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get authenticated user workspaces' })
  findMine(@Req() request: Request) {
    return this.workspacesService.findMine(
      this.getAuthenticatedUserId(request),
    );
  }

  @Get(':workspaceId/users')
  @ApiOperation({ summary: 'Get workspace users' })
  @ApiQuery({ name: 'search', required: false, type: String })
  getUsers(
    @Param('workspaceId') workspaceId: string,
    @Query('search') search: string | undefined,
    @Req() request: Request,
  ) {
    return this.workspacesService.getUsers(
      workspaceId,
      this.getAuthenticatedUserId(request),
      search,
    );
  }

  @Get(':workspaceId/import-jobs')
  @ApiOperation({ summary: 'Get recent workspace user import jobs' })
  listImportJobs(
    @Param('workspaceId') workspaceId: string,
    @Req() request: Request,
  ) {
    return this.workspacesService.listImportJobs(
      workspaceId,
      this.getAuthenticatedUserId(request),
    );
  }

  @Get(':workspaceId/import-jobs/:jobId')
  @ApiOperation({ summary: 'Get workspace user import job status' })
  getImportJob(
    @Param('workspaceId') workspaceId: string,
    @Param('jobId') jobId: string,
    @Req() request: Request,
  ) {
    return this.workspacesService.getImportJob(
      workspaceId,
      jobId,
      this.getAuthenticatedUserId(request),
    );
  }

  @Patch(':workspaceId/users/:userId')
  @ApiOperation({ summary: 'Update workspace member role or status' })
  updateMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateWorkspaceMemberDto,
    @Req() request: Request,
  ) {
    return this.workspacesService.updateMember(
      workspaceId,
      userId,
      this.getAuthenticatedUserId(request),
      dto,
    );
  }

  @Delete(':workspaceId/users/:userId')
  @ApiOperation({ summary: 'Disable a workspace member' })
  disableMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Req() request: Request,
  ) {
    return this.workspacesService.disableMember(
      workspaceId,
      userId,
      this.getAuthenticatedUserId(request),
    );
  }

  @Post(':workspaceId/users/invite')
  @ApiOperation({ summary: 'Invite one user to a workspace' })
  inviteUser(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: InviteWorkspaceUserDto,
    @Req() request: Request,
  ) {
    return this.workspacesService.inviteUser(
      workspaceId,
      this.getAuthenticatedUserId(request),
      dto,
    );
  }

  @Post(':workspaceId/users/import/excel')
  @ApiOperation({ summary: 'Import workspace users from Excel or CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'dryRun', required: false, type: Boolean })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel/CSV file with columns: email, userName, role',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  importUsersFromExcel(
    @Param('workspaceId') workspaceId: string,
    @Query('dryRun') dryRun: string | undefined,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    return this.workspacesService.importUsersFromSpreadsheet(
      workspaceId,
      this.getAuthenticatedUserId(request),
      file,
      dryRun === 'true',
    );
  }

  @Post(':workspaceId/dms')
  @ApiOperation({ summary: 'Create or get a direct message room in workspace' })
  createDirectMessage(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateDirectMessageDto,
    @Req() request: Request,
  ) {
    return this.workspacesService.createDirectMessage(
      workspaceId,
      this.getAuthenticatedUserId(request),
      dto.targetUserId,
    );
  }
}
