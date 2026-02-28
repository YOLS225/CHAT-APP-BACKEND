import {
  Controller,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import { StorageService } from '../../business-logic/storage/storage.service';
import { UsersService } from '../../business-logic/users/users.service';
import { JwtAuthGuard } from '../../guard/jwt.guard';
import { successAction, failAction } from '../../utils/action.dto';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly usersService: UsersService,
  ) {}

  @Post('upload/avatar/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload avatar image for a user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return failAction(null, false, 'No file provided');
    }

    const avatarUrl = await this.storageService.uploadFile(file, 'avatars');
    await this.usersService.updateUser(userId, { avatar: avatarUrl });

    return successAction({ avatarUrl }, true, 'Avatar uploaded successfully');
  }
}
