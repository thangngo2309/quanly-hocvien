import { Test, TestingModule } from '@nestjs/testing';
import { TuitionPaymentsService } from './tuition-payments.service';

describe('TuitionPaymentsService', () => {
  let service: TuitionPaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TuitionPaymentsService],
    }).compile();

    service = module.get<TuitionPaymentsService>(TuitionPaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
