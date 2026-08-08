import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsMimeType,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateUploadUrlDto {
  @ApiProperty({ example: 'contract.pdf' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsMimeType()
  mimeType: string;

  @ApiProperty({ example: 102400 })
  @IsInt()
  @Min(1)
  @Max(25 * 1024 * 1024)
  size: number;

  @ApiPropertyOptional({ example: 3200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMs?: number;
}
