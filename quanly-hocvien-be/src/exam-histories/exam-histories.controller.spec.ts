import { Test, TestingModule } from '@nestjs/testing';
import { ExamHistoriesController } from './exam-histories.controller';
import { ExamHistoriesService } from './exam-histories.service';

describe('ExamHistoriesController', () => {
  let controller: ExamHistoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamHistoriesController],
      providers: [ExamHistoriesService],
    }).compile();

    controller = module.get<ExamHistoriesController>(ExamHistoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
