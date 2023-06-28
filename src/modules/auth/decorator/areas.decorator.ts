import { SetMetadata } from '@nestjs/common';

export const Areas = (areas: string[]) => SetMetadata('areas', areas);
