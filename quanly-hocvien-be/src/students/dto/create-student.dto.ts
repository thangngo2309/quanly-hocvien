import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  full_name: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsString()
  identity_number?: string;

  @IsOptional()
  @IsDateString()
  identity_issue_date?: string;

  @IsOptional()
  @IsString()
  identity_issue_place?: string;

  @IsOptional()
  @IsString()
  previous_license_number?: string;

  @IsOptional()
  @IsString()
  previous_license_class?: string;

  @IsOptional()
  @IsString()
  previous_license_issue_place?: string;

  @IsOptional()
  @IsDateString()
  previous_license_issue_date?: string;
}