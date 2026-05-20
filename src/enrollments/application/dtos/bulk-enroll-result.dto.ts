import { ApiProperty } from '@nestjs/swagger';

export class BulkEnrollResultDto {
  @ApiProperty({ example: 33 })
  totalRowsInCsv: number;

  @ApiProperty({ example: 33 })
  uniqueEmailsInCsv: number;

  @ApiProperty({ example: 28 })
  enrolled: number;

  @ApiProperty({ example: 2 })
  alreadyEnrolled: number;

  @ApiProperty({ example: 3 })
  notFound: number;

  @ApiProperty({ example: 0 })
  notStudentRole: number;

  @ApiProperty({ example: 0 })
  duplicateEmailsInCsv: number;

  @ApiProperty({
    type: [String],
    example: ['missing@uninorte.edu.co'],
  })
  notFoundEmails: string[];

  @ApiProperty({
    type: [String],
    example: ['professor@uninorte.edu.co'],
  })
  notStudentEmails: string[];
}
