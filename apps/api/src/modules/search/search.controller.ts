import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false, enum: ['partnumber', 'vehicle', 'text'] })
  search(@Query('q') q: string, @Query('type') type?: string) {
    if (!q?.trim()) throw new BadRequestException('Query is required');
    return this.searchService.search(q.trim(), type || 'text');
  }
}
