import { Course } from "src/courses/entities/course.entity";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  category_name: string;
  // Ví dụ: Chi phí hồ sơ, Chi phí thi, Chi phí sửa xe, Chi phí khác

  @ManyToOne(() => Enrollment, enrollment => enrollment.expenses, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  enrollment: Enrollment | null;

  @ManyToOne(() => Course, course => course.expenses, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  course: Course;

  @Column({ type: 'int', default: 0 })
  amount: number;

  @Column({ type: 'date', nullable: true })
  expense_date: Date;

  @Column({ nullable: true })
  payment_method: string;
  // CASH, BANK_TRANSFER

  @Column({ nullable: true })
  receiver_name: string;
  // Người nhận tiền

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
