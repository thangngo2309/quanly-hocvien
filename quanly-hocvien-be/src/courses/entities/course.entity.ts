import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Expense } from "src/expenses/entities/expense.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
  // Ví dụ: Khóa tháng 05/2026

  @Column({ nullable: true })
  code: string;
  // Ví dụ: KHOA-05-2026

  @Column({ type: 'date', nullable: true })
  start_date: Date | undefined;

  @Column({ type: 'date', nullable: true })
  end_date: Date | undefined;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ default: 'OPEN' })
  status: string;
  // OPEN, STUDYING, FINISHED, CANCELED

  @Column({ nullable: true })
  note: string;

  @Column({ type: 'boolean', default: false })
  is_finance_closed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  finance_closed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  finished_at: Date | null;

  @OneToMany(() => Enrollment, enrollment => enrollment.course)
  enrollments: Enrollment[];

  @OneToMany(() => Expense, expense => expense.course)
  expenses: Expense[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
