export async function readApiResponse(response, resource = "API") {
  const body = await response.text();
  let data;
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    const message = response.status === 404
      ? `${resource} endpoint is missing from this Vercel deployment (HTTP 404). Redeploy the latest GitHub commit.`
      : `${resource} returned an unexpected response (HTTP ${response.status}).`;
    throw new Error(message);
  }
  if (!response.ok) throw new Error(data.message || `${resource} request failed (HTTP ${response.status})`);
  return data;
}
