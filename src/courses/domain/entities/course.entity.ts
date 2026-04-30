export class Course {
  id: string;
  name: string;
  code: string;
  period: string;
  group: string;
  professorId: string;

  constructor(
    id: string,
    name: string,
    code: string,
    period: string,
    group: string,
    professorId: string
  ) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.period = period;
    this.group = group;
    this.professorId = professorId;
  }
}