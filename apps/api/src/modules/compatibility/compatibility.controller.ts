import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompatibilityService } from './compatibility.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@ApiTags('compatibility')
@Controller('compatibility')
export class CompatibilityController {
  constructor(private readonly compatibilityService: CompatibilityService) {}

  @Get('parts/:partId/equivalents')
  getEquivalents(@Param('partId') partId: string) {
    return this.compatibilityService.getEquivalents(partId);
  }

  @Post('parts/:partId/vehicles/:versionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addCompatibility(
    @Param('partId') partId: string,
    @Param('versionId') versionId: string,
    @Body('position') position: string,
  ) {
    return this.compatibilityService.addCompatibility(partId, versionId, position || 'UNIVERSAL');
  }

  @Post('equivalences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addEquivalence(@Body() body: { partAId: string; partBId: string; verified?: boolean }) {
    return this.compatibilityService.addEquivalence(body.partAId, body.partBId, body.verified);
  }
}
