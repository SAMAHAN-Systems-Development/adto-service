import { IsString, IsOptional } from 'class-validator';

export class CreateOrganizationParentDto {

    @IsString()
    name: string;

    @IsString()
    acronym: string;

    @IsString()
    icon: string;

    @IsOptional()
    @IsString()
    facebook?: string;

    @IsOptional()
    @IsString()
    instagram?: string;

    @IsOptional()
    @IsString()
    twitter?: string;

    @IsOptional()
    @IsString()
    linkedin?: string;

}
