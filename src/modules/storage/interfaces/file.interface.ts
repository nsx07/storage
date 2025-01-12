export enum FileStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

export class ResponseFile {
  constructor(
    public status: FileStatus,
    public data: string | null,
    public error?: Error,
  ) {}

  static get NOT_FOUND() {
    return new ResponseFile(FileStatus.NOT_FOUND, null);
  }

  static fromPath(path: string) {
    return new ResponseFile(FileStatus.SUCCESS, path);
  }

  get SUCCESS() {
    return this;
  }
}
