import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, enum: ['partnumber', 'vehicle', 'text'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(
    @Query('q') q: string,
    @Query('type') type?: 'partnumber' | 'vehicle' | 'text',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.search(q, type || 'text', Number(page) || 1, Number(limit) || 20);
  }
}
