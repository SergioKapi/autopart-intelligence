import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartStatus, PartType } from '@prisma/client';

export class CreatePartDto {
  @ApiProperty({ example: '06H103495AH' })
  @IsString()
  partNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oemCode?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  altCodes?: string[];

  @ApiProperty({ example: 'cuid_manufacturer_id' })
  @IsString()
  manufacturerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 'Bomba de alta pressão TFSI 2.0' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicalDesc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  specs?: Record<string, any>;

  @ApiPropertyOptional({ enum: PartType })
  @IsOptional()
  @IsEnum(PartType)
  partType?: PartType;

  @ApiPropertyOptional({ enum: PartStatus })
  @IsOptional()
  @IsEnum(PartStatus)
  status?: PartStatus;
}
