import { NotFoundException, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';

export function handleServiceError(error: any) {
    console.error('Service Error:', error);

    if (error instanceof NotFoundException) {
        return { status: 404, message: 'User not found', error: error.message };
    }

    if (error instanceof UnauthorizedException) {
        return { status: 401, message: 'Invalid or expired token', error: error.message };
    }

    if (error instanceof BadRequestException) {
        return { status: 400, message: 'Bad request', error: error.message };
    }

    if (error instanceof ForbiddenException) {
        return { status: 403, message: 'Forbidden action', error: error.message };
    }

    if (error.code === 'ECONNREFUSED') {
        return { status: 503, message: 'Service unavailable', error: 'Database connection refused' };
    }

    if (error.code === 'ETIMEDOUT') {
        return { status: 504, message: 'Request timed out', error: 'Server did not respond in time' };
    }

    // Default error handler
    return { status: 500, message: 'Internal server error', error: error.message };
}