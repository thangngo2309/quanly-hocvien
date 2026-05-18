import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateEnrollmentDto {
  @IsInt()
  student_id: number;

  @IsInt()
  course_id: number;

  @IsInt()
  @Min(0)
  tuition_fee: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  first_payment_expected?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  second_payment_expected?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  note?: string;
}