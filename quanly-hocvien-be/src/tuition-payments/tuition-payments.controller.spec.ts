import { Test, TestingModule } from '@nestjs/testing';
import { TuitionPaymentsController } from './tuition-payments.controller';
import { TuitionPaymentsService } from './tuition-payments.service';

describe('TuitionPaymentsController', () => {
  let controller: TuitionPaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TuitionPaymentsController],
      providers: [TuitionPaymentsService],
    }).compile();

    controller = module.get<TuitionPaymentsController>(TuitionPaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
