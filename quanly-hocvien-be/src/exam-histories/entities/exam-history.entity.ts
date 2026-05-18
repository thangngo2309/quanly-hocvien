import { Student } from 'src/students/entities/student.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ExamType {
  GRADUATION = 'GRADUATION', // Thi tốt nghiệp tại trung tâm
  NATIONAL = 'NATIONAL', // Thi sát hạch quốc gia
}

export enum ExamResult {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  ABSENT = 'ABSENT',
}

@Entity('exam_histories')
export class ExamHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, student => student.exam_histories, {
    onDelete: 'CASCADE',
  })
  student: Student;

  @Column({ type: 'varchar' })
  exam_type: ExamType;

  @Column({ type: 'date', nullable: true })
  exam_date: Date | null;

  @Column({ type: 'varchar' })
  result: ExamResult;

  @Column({ type: 'date', nullable: true })
  retake_date: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}