interface Env {
  API: Fetcher;
}

export const onRequest: PagesFunction<Env> = async context => {
  const url = new URL(context.request.url)
  url.pathname = url.pathname.replace(/^\/api(?=\/|$)/, '') || '/'
  return context.env.API.fetch(new Request(url, context.request))
}
