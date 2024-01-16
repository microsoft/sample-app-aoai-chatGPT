export const getUrlParameter = (name: string) => {
  const url = new URL(window.location.href);
  const param = url.searchParams.get(name);
  return param ? decodeURI(param).trim() : null;
};
