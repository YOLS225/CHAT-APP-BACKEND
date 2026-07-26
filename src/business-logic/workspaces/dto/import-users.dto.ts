import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImportUsersDto {
  @ApiProperty({
    example: 'email,userName,role\njohn@example.com,John Doe,MEMBER',
  })
  @IsString()
  @IsNotEmpty()
  csv: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  dryRun?: boolean;
}
