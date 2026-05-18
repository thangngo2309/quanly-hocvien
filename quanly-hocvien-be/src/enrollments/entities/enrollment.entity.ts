import { Course } from "src/courses/entities/course.entity";
import { Expense } from "src/expenses/entities/expense.entity";
import { Student } from "src/students/entities/student.entity";
import { TuitionPayment } from "src/tuition-payments/entities/tuition-payment.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, student => student.enrollments, {
    onDelete: 'RESTRICT',
  })
  student: Student;

  @ManyToOne(() => Course, course => course.enrollments, {
    onDelete: 'RESTRICT',
  })
  course: Course;

  @Column({ type: 'int', default: 0 })
  tuition_fee: number;
  // Tổng học phí của học viên trong khóa này

  @Column({ type: 'int', default: 0 })
  first_payment_expected: number;
  // Dự kiến đóng lần 1

  @Column({ type: 'int', default: 0 })
  second_payment_expected: number;
  // Dự kiến đóng lần 2

  @Column({ default: 'STUDYING' })
  status: string;
  // STUDYING, COMPLETED, DROPPED

  @Column({ nullable: true })
  note: string;

  @OneToMany(() => TuitionPayment, payment => payment.enrollment)
  tuition_payments: TuitionPayment[];

  @OneToMany(() => Expense, expense => expense.enrollment)
  expenses: Expense[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
