/** An error whose .message is safe to send straight to the client, with a given HTTP status. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}
