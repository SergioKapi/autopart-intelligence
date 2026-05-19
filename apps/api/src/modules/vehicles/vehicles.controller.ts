import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('brands')
  getBrands() {
    return this.vehiclesService.getBrands();
  }

  @Get('brands/:brandId/models')
  getModels(@Param('brandId') brandId: string) {
    return this.vehiclesService.getModelsByBrand(brandId);
  }

  @Get('models/:modelId/versions')
  getVersions(@Param('modelId') modelId: string) {
    return this.vehiclesService.getVersionsByModel(modelId);
  }

  @Get('versions/:versionId/parts')
  getCompatibleParts(@Param('versionId') versionId: string) {
    return this.vehiclesService.getCompatibleParts(versionId);
  }
}
