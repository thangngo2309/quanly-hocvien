import { Test, TestingModule } from '@nestjs/testing';
import { ExamHistoriesService } from './exam-histories.service';

describe('ExamHistoriesService', () => {
  let service: ExamHistoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExamHistoriesService],
    }).compile();

    service = module.get<ExamHistoriesService>(ExamHistoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
