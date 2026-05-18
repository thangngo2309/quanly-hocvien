import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity('tuition_payments')
export class TuitionPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Enrollment, enrollment => enrollment.tuition_payments, {
    onDelete: 'CASCADE',
  })
  enrollment: Enrollment;

  @Column({ type: 'int' })
  payment_round: number;
  // 1 hoặc 2

  @Column({ type: 'int', default: 0 })
  amount: number;
  // Số tiền đã đóng

  @Column({ type: 'date', nullable: true })
  payment_date: Date;

  @Column({ nullable: true })
  payment_method: string;
  // CASH, BANK_TRANSFER

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
