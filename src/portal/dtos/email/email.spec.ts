import { EmailDto } from './Email.dto';

describe('Email', () => {
  it('should be defined', () => {
    expect(new EmailDto()).toBeDefined();
  });
});
