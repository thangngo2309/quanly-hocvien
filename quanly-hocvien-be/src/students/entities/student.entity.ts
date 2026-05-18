import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { ExamHistory } from 'src/exam-histories/entities/exam-history.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  full_name: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  identity_number: string | null;

  @Column({ type: 'date', nullable: true })
  identity_issue_date: Date | null;

  @Column({ type: 'varchar', nullable: true })
  identity_issue_place: string | null;

  @Column({ type: 'varchar', nullable: true })
  previous_license_number: string | null;

  @Column({ type: 'varchar', nullable: true })
  previous_license_class: string | null;

  @Column({ type: 'varchar', nullable: true })
  previous_license_issue_place: string | null;

  @Column({ type: 'date', nullable: true })
  previous_license_issue_date: Date | null;

  @OneToMany(() => Enrollment, enrollment => enrollment.student)
  enrollments: Enrollment[];
  
  @OneToMany(() => ExamHistory, examHistory => examHistory.student)
 exam_histories: ExamHistory[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}