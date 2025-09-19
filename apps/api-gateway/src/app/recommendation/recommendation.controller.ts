import { Body, Controller, Post, UseGuards, Res, Inject } from '@nestjs/common';
import {  ClientGrpcProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError } from 'rxjs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/decorators/role.enum';
import { GenerateRecommendationsDto, RecommendationResponseDto } from './dtos/recommendations.dto';
import { Logger } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common';


@ApiTags('Recommendations')
@Controller('recommendation')
export class RecommendationController {
    private recommendationService: any;
    private readonly logger = new Logger(RecommendationController.name);

  
    constructor(@Inject('RECOMMENDATION_PACKAGE') private client: ClientGrpcProxy) {
        this.recommendationService = this.client.getService('RecommendationService');
    }

    @Post('generate')
    @UseGuards(JwtAuthGuard)
    @Roles(Role.TRAVELER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate personalized recommendations after onboarding' })
    @ApiResponse({ status: 200, description: 'Recommendations generated', type: RecommendationResponseDto })
    async generateRecommendations(@Body() dto: GenerateRecommendationsDto, @Res() res: any) {
        this.logger.log(`Generating recommendations for user: ${dto.userId}`);
        try {
        const response = await firstValueFrom(
            this.recommendationService.GenerateRecommendations(dto).pipe(
            catchError((error) => {
                this.logger.error(`GenerateRecommendations error: ${error.message}`, error.stack);
                if (error.code === 2 || error.code === 'INTERNAL') {
                throw new HttpException('Internal server error during recommendation generation', HttpStatus.INTERNAL_SERVER_ERROR);
                } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
                throw new HttpException('Invalid recommendation data', HttpStatus.BAD_REQUEST);
                } else {
                throw new HttpException('Failed to generate recommendations', HttpStatus.BAD_REQUEST);
                }
            })
            )
        );
        return response;
        } catch (error: any) {
        this.logger.error(`GenerateRecommendations failed: ${error.message}`, error.stack);
        throw error;
        }
    }
}
