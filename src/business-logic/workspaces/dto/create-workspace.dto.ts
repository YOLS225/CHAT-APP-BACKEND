import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Inc' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
