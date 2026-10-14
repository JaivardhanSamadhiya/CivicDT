/** Keep HTML proxy/build failures out of user-facing errors. */
export async function readAPIJSON<T = { error?: string }>(
  response: Response,
): Promise<T> {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error(
      "The server could not process this request. Please try again once the app is ready.",
    );
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      "The server returned an unreadable response. Please try again.",
    );
  }
}
