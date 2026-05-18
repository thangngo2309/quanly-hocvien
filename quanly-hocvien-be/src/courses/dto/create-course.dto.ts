import { IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateCourseDto {
    @IsString()
    name: string;
  
    @IsOptional()
    @IsString()
    code?: string;
  
    @IsOptional()
    @IsDateString()
    start_date?: string;
  
    @IsOptional()
    @IsDateString()
    end_date?: string;
  
    @IsOptional()
    @IsInt()
    year?: number;
  
    @IsOptional()
    @IsInt()
    @Min(0)
    tuition_fee?: number;
  
    @IsOptional()
    @IsString()
    status?: string;
  
    @IsOptional()
    @IsString()
    note?: string;
}
