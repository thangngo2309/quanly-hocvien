import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateTuitionPaymentDto {
    @IsInt()
    enrollment_id: number;
  
    @IsInt()
    @IsIn([1, 2])
    payment_round: number;
  
    @IsInt()
    @Min(0)
    amount: number;
  
    @IsOptional()
    @IsDateString()
    payment_date?: string;
  
    @IsOptional()
    @IsString()
    payment_method?: string;
  
    @IsOptional()
    @IsString()
    note?: string;
}
