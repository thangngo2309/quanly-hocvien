import { IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateExpenseDto {
    @IsString()
    category_name: string;
  
    @IsOptional()
    @IsInt()
    enrollment_id?: number;
  
    @IsOptional()
    @IsInt()
    course_id?: number;
  
    @IsInt()
    @Min(0)
    amount: number;
  
    @IsOptional()
    @IsDateString()
    expense_date?: string;
  
    @IsOptional()
    @IsString()
    payment_method?: string;
  
    @IsOptional()
    @IsString()
    receiver_name?: string;
  
    @IsOptional()
    @IsString()
    note?: string;
}
